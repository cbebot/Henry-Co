import { NextResponse, type NextRequest } from "next/server";

import { emitEvent } from "@henryco/observability/events";

import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getStudioViewer } from "@/lib/studio/auth";
import {
  signApprovalSnapshot,
  resolveApprovalSecret,
  type ApprovalSnapshot,
} from "@/lib/studio/approval-signature";
import { computeRoundTrip } from "@/lib/studio/revision-rounds";
import {
  clientOwnsProject,
  PROJECT_OWNER_COLUMNS,
  type ProjectOwnerRow,
} from "@/lib/studio/project-access";

/**
 * V3-73 — POST /api/studio/revisions/deliverable
 *
 * The CLIENT-facing deliverable approval depth layer (distinct from the staff
 * version-chain at /api/studio/revisions). One row per round:
 *
 *   { deliverable_id, action: "approve" | "request_changes", change_notes? }
 *
 *   - request_changes → a new revision round (status 'changes_requested'); the
 *     round-trip counter decrements and the round is flagged billable once the
 *     deliverable's contracted allowance is exhausted.
 *   - approve → a tamper-evident HMAC snapshot of the exact approved state
 *     (status 'approved'; ANTI-CLONE Principle 12).
 *
 * Writes go through the service-role admin client AFTER server-side ownership
 * validation, so a client can never forge an approval row or its signature.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = {
  deliverable_id?: string;
  action?: "approve" | "request_changes";
  change_notes?: string;
};

type DeliverableRow = {
  id: string;
  project_id: string;
  label: string | null;
  status: string | null;
  version: number | null;
  revision_allowance: number | null;
};

export async function POST(request: NextRequest) {
  const viewer = await getStudioViewer();
  if (!viewer.user) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const deliverableId = String(body.deliverable_id || "").trim();
  const action = body.action;
  if (!deliverableId || (action !== "approve" && action !== "request_changes")) {
    return NextResponse.json(
      { ok: false, error: "deliverable_id_and_action_required" },
      { status: 400 },
    );
  }

  const admin = createAdminSupabase();

  const { data: deliverable, error: deliverableErr } = await admin
    .from("studio_deliverables")
    .select("id, project_id, label, status, version, revision_allowance")
    .eq("id", deliverableId)
    .maybeSingle<DeliverableRow>();

  if (deliverableErr) {
    console.error("[studio-deliverable-revisions] deliverable fetch failed", deliverableErr);
    return NextResponse.json({ ok: false, error: "fetch_failed" }, { status: 500 });
  }
  if (!deliverable) {
    return NextResponse.json({ ok: false, error: "deliverable_not_found" }, { status: 404 });
  }

  const { data: project, error: projectErr } = await admin
    .from("studio_projects")
    .select(PROJECT_OWNER_COLUMNS)
    .eq("id", deliverable.project_id)
    .maybeSingle<ProjectOwnerRow>();

  if (projectErr || !project) {
    return NextResponse.json({ ok: false, error: "project_not_found" }, { status: 404 });
  }

  const owns = await clientOwnsProject(admin, project, viewer.user.id, viewer.normalizedEmail);
  if (!owns) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  // Next monotonic revision number for this deliverable (UNIQUE-guarded in DB).
  const { data: maxRow } = await admin
    .from("studio_deliverable_revisions")
    .select("revision_number")
    .eq("deliverable_id", deliverableId)
    .order("revision_number", { ascending: false })
    .limit(1)
    .maybeSingle<{ revision_number: number }>();
  const nextNumber = (maxRow?.revision_number ?? 0) + 1;
  const nowIso = new Date().toISOString();

  if (action === "request_changes") {
    const notes = String(body.change_notes || "").trim();
    if (!notes) {
      return NextResponse.json({ ok: false, error: "change_notes_required" }, { status: 400 });
    }

    // Round-trip: count prior change-request rounds to decide billable.
    const { count: usedCount } = await admin
      .from("studio_deliverable_revisions")
      .select("id", { count: "exact", head: true })
      .eq("deliverable_id", deliverableId)
      .eq("status", "changes_requested");

    const roundTrip = computeRoundTrip(deliverable.revision_allowance ?? 0, usedCount ?? 0);
    // `billable` = the allowance was already exhausted before this request.
    const billable = roundTrip.billable;

    const { data: inserted, error: insertErr } = await admin
      .from("studio_deliverable_revisions")
      .insert({
        project_id: deliverable.project_id,
        deliverable_id: deliverableId,
        revision_number: nextNumber,
        status: "changes_requested",
        requested_by: viewer.user.id,
        change_notes: notes.slice(0, 4000),
        billable,
      } as never)
      .select("id, revision_number")
      .single<{ id: string; revision_number: number }>();

    if (insertErr || !inserted) {
      console.error("[studio-deliverable-revisions] change-request insert failed", insertErr);
      return NextResponse.json({ ok: false, error: "persist_failed" }, { status: 500 });
    }

    emitEvent({
      name: "henry.studio_project.revision_requested",
      classification: "user_action",
      outcome: "requested",
      actorId: viewer.user.id,
      payload: {
        project_id: deliverable.project_id,
        deliverable_id: deliverableId,
        revision_number: inserted.revision_number,
        billable,
      },
    });

    try {
      const supabase = await createSupabaseServer();
      await supabase.rpc("add_audit_log_v2", {
        p_action: "studio_project.revision_requested",
        p_entity_type: "studio_deliverable_revision",
        p_entity_id: inserted.id,
        p_old_values: null,
        p_new_values: { deliverable_id: deliverableId, revision_number: inserted.revision_number, billable },
        p_reason: null,
        p_division: "studio",
        p_correlation_id: null,
      });
    } catch (err) {
      console.error("[studio-deliverable-revisions] audit log failed (request_changes)", err);
    }

    return NextResponse.json({
      ok: true,
      revision_id: inserted.id,
      revision_number: inserted.revision_number,
      status: "changes_requested",
      billable,
      remaining: roundTrip.remaining,
    });
  }

  // action === "approve" — build + sign the immutable snapshot.
  const secret = resolveApprovalSecret();
  if (!secret) {
    // Never store an "approved" row without a verifiable signature.
    console.error("[studio-deliverable-revisions] STUDIO_APPROVAL_SIGNATURE_SECRET not set");
    return NextResponse.json({ ok: false, error: "signing_unavailable" }, { status: 503 });
  }

  const snapshot: ApprovalSnapshot = {
    deliverableId,
    projectId: deliverable.project_id,
    revisionNumber: nextNumber,
    approvedByUserId: viewer.user.id,
    approvedAt: nowIso,
    deliverableState: {
      label: deliverable.label ?? null,
      status: deliverable.status ?? null,
      version: deliverable.version ?? null,
    },
  };
  const signature = signApprovalSnapshot(snapshot, secret);

  const { data: inserted, error: insertErr } = await admin
    .from("studio_deliverable_revisions")
    .insert({
      project_id: deliverable.project_id,
      deliverable_id: deliverableId,
      revision_number: nextNumber,
      status: "approved",
      approved_by: viewer.user.id,
      approval_signature: signature,
      approval_snapshot: snapshot as unknown as Record<string, unknown>,
    } as never)
    .select("id, revision_number")
    .single<{ id: string; revision_number: number }>();

  if (insertErr || !inserted) {
    console.error("[studio-deliverable-revisions] approval insert failed", insertErr);
    return NextResponse.json({ ok: false, error: "persist_failed" }, { status: 500 });
  }

  // Reflect the approval on the deliverable's own state (off the money path).
  await admin
    .from("studio_deliverables")
    .update({ status: "approved", approved_at: nowIso, approved_by: viewer.user.id } as never)
    .eq("id", deliverableId);

  emitEvent({
    name: "henry.studio_project.deliverable_approved",
    classification: "user_action",
    outcome: "approved",
    actorId: viewer.user.id,
    payload: {
      project_id: deliverable.project_id,
      deliverable_id: deliverableId,
      revision_number: inserted.revision_number,
    },
  });

  try {
    const supabase = await createSupabaseServer();
    await supabase.rpc("add_audit_log_v2", {
      p_action: "studio_project.deliverable_approved",
      p_entity_type: "studio_deliverable_revision",
      p_entity_id: inserted.id,
      p_old_values: null,
      p_new_values: {
        deliverable_id: deliverableId,
        revision_number: inserted.revision_number,
        approval_signature: signature,
      },
      p_reason: null,
      p_division: "studio",
      p_correlation_id: null,
    });
  } catch (err) {
    console.error("[studio-deliverable-revisions] audit log failed (approve)", err);
  }

  return NextResponse.json({
    ok: true,
    revision_id: inserted.id,
    revision_number: inserted.revision_number,
    status: "approved",
  });
}
