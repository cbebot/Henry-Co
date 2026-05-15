import { NextResponse, type NextRequest } from "next/server";

import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getStudioViewer } from "@/lib/studio/auth";

/**
 * V3 PASS 21 — POST /api/studio/revisions
 *
 * Client-side: request a revision on a project the caller owns.
 * Staff-side: approve / reject a revision (action="approve" | "reject").
 *
 *   POST body (client request):
 *     {
 *       project_id: string,
 *       summary: string,
 *       attached_files?: Array<{ id: string, note?: string }>,
 *       deliverable_id?: string,
 *       before_public_id?: string,
 *     }
 *
 *   POST body (staff review):
 *     {
 *       revision_id: string,
 *       action: "approve" | "reject",
 *       reviewer_notes?: string,
 *       after_public_id?: string,
 *       rejected_reason?: string,
 *     }
 *
 * The two shapes are disambiguated by presence of `project_id` vs
 * `revision_id`.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ClientRequestBody = {
  project_id?: string;
  summary?: string;
  attached_files?: Array<{ id?: string; note?: string }>;
  deliverable_id?: string;
  before_public_id?: string;
};

type StaffReviewBody = {
  revision_id?: string;
  action?: "approve" | "reject";
  reviewer_notes?: string;
  after_public_id?: string;
  rejected_reason?: string;
};

type ProjectRow = {
  id: string;
  client_user_id: string | null;
  name: string;
};

type RevisionRow = {
  id: string;
  project_id: string;
  version: number;
  status: string;
  requested_by_user_id: string | null;
};

async function handleClientRequest(
  viewerId: string,
  viewerEmail: string | null,
  body: ClientRequestBody
) {
  const projectId = String(body.project_id || "").trim();
  const summary = String(body.summary || "").trim();
  if (!projectId || !summary) {
    return NextResponse.json(
      { ok: false, error: "project_id_and_summary_required" },
      { status: 400 }
    );
  }

  const admin = createAdminSupabase();

  const { data: project, error: projectErr } = await admin
    .from("studio_projects")
    .select("id, client_user_id, name")
    .eq("id", projectId)
    .maybeSingle<ProjectRow>();

  if (projectErr) {
    console.error("[studio-revisions] project fetch failed", projectErr);
    return NextResponse.json({ ok: false, error: "fetch_failed" }, { status: 500 });
  }
  if (!project) {
    return NextResponse.json({ ok: false, error: "project_not_found" }, { status: 404 });
  }
  if (project.client_user_id && project.client_user_id !== viewerId) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { data: maxVersionRow } = await admin
    .from("studio_revisions")
    .select("version")
    .eq("project_id", projectId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle<{ version: number }>();

  const nextVersion = (maxVersionRow?.version ?? 0) + 1;

  const attached = Array.isArray(body.attached_files)
    ? body.attached_files
        .filter((f) => f && typeof f === "object" && typeof f.id === "string")
        .slice(0, 12)
        .map((f) => ({
          id: String(f.id).slice(0, 64),
          note: f.note ? String(f.note).slice(0, 256) : null,
        }))
    : [];

  const { data: revisionRow, error: insertErr } = await admin
    .from("studio_revisions")
    .insert({
      project_id: projectId,
      requested_by: viewerEmail || viewerId,
      requested_by_user_id: viewerId,
      client_email: viewerEmail,
      summary: summary.slice(0, 2000),
      attached_files: attached,
      before_public_id: body.before_public_id ?? null,
      deliverable_id: body.deliverable_id ?? null,
      version: nextVersion,
      status: "open",
    } as never)
    .select("id, version, created_at")
    .single<{ id: string; version: number; created_at: string }>();

  if (insertErr || !revisionRow) {
    console.error("[studio-revisions] insert failed", insertErr);
    return NextResponse.json({ ok: false, error: "persist_failed" }, { status: 500 });
  }

  try {
    const supabase = await createSupabaseServer();
    await supabase.rpc("add_audit_log_v2", {
      p_action: "studio.revision.requested",
      p_entity_type: "studio_revision",
      p_entity_id: revisionRow.id,
      p_old_values: null,
      p_new_values: {
        project_id: projectId,
        version: revisionRow.version,
        summary: summary.slice(0, 200),
        attached_count: attached.length,
      },
      p_reason: null,
      p_division: "studio",
      p_correlation_id: null,
    });
  } catch (err) {
    console.error("[studio-revisions] audit log failed (client request)", err);
  }

  return NextResponse.json({
    ok: true,
    revision_id: revisionRow.id,
    version: revisionRow.version,
    created_at: revisionRow.created_at,
  });
}

async function handleStaffReview(
  viewerId: string,
  isStaff: boolean,
  body: StaffReviewBody
) {
  if (!isStaff) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const revisionId = String(body.revision_id || "").trim();
  const action = body.action;
  if (!revisionId || !["approve", "reject"].includes(String(action))) {
    return NextResponse.json(
      { ok: false, error: "revision_id_and_action_required" },
      { status: 400 }
    );
  }

  const admin = createAdminSupabase();

  const { data: revision, error: fetchErr } = await admin
    .from("studio_revisions")
    .select("id, project_id, version, status, requested_by_user_id")
    .eq("id", revisionId)
    .maybeSingle<RevisionRow>();

  if (fetchErr) {
    console.error("[studio-revisions] review fetch failed", fetchErr);
    return NextResponse.json({ ok: false, error: "fetch_failed" }, { status: 500 });
  }
  if (!revision) {
    return NextResponse.json({ ok: false, error: "revision_not_found" }, { status: 404 });
  }
  if (["approved", "rejected"].includes(String(revision.status))) {
    return NextResponse.json(
      { ok: false, error: "revision_already_reviewed", status: revision.status },
      { status: 409 }
    );
  }

  const nowIso = new Date().toISOString();
  const nextStatus = action === "approve" ? "approved" : "rejected";

  const { error: updateErr } = await admin
    .from("studio_revisions")
    .update({
      status: nextStatus,
      reviewed_at: nowIso,
      approved_by_pm_user_id: action === "approve" ? viewerId : null,
      reviewer_notes: body.reviewer_notes ?? null,
      after_public_id: action === "approve" ? body.after_public_id ?? null : null,
      rejected_reason: action === "reject" ? body.rejected_reason ?? null : null,
    } as never)
    .eq("id", revisionId);

  if (updateErr) {
    console.error("[studio-revisions] update failed", updateErr);
    return NextResponse.json({ ok: false, error: "persist_failed" }, { status: 500 });
  }

  try {
    const supabase = await createSupabaseServer();
    await supabase.rpc("add_audit_log_v2", {
      p_action: `studio.revision.${nextStatus}`,
      p_entity_type: "studio_revision",
      p_entity_id: revisionId,
      p_old_values: { status: revision.status },
      p_new_values: { status: nextStatus, reviewer_notes: body.reviewer_notes ?? null },
      p_reason: action === "reject" ? body.rejected_reason ?? null : null,
      p_division: "studio",
      p_correlation_id: null,
    });
  } catch (err) {
    console.error("[studio-revisions] audit log failed (review)", err);
  }

  return NextResponse.json({
    ok: true,
    revision_id: revisionId,
    status: nextStatus,
    reviewed_at: nowIso,
  });
}

export async function POST(request: NextRequest) {
  const viewer = await getStudioViewer();
  if (!viewer.user) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  let body: ClientRequestBody & StaffReviewBody;
  try {
    body = (await request.json()) as ClientRequestBody & StaffReviewBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const isStaff = viewer.roles.some((role) =>
    ["studio_owner", "project_manager", "developer_designer", "client_success", "sales_consultation"].includes(role)
  );

  if (body.revision_id) {
    return handleStaffReview(viewer.user.id, isStaff, body);
  }
  return handleClientRequest(viewer.user.id, viewer.normalizedEmail, body);
}
