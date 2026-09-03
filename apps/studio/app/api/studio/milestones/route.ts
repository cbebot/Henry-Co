import { NextResponse, type NextRequest } from "next/server";

import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getStudioViewer } from "@/lib/studio/auth";

/**
 * V3 PASS 21 — POST/PATCH /api/studio/milestones
 *
 * Studio staff CRUD endpoint for project milestones.
 *
 *   POST body (create or upsert):
 *     {
 *       project_id: string,
 *       name: string,
 *       description?: string,
 *       due_at?: string,             // ISO timestamp; legacy due_label stays
 *       amount?: number,             // minor units (kobo)
 *       owner_user_id?: string,
 *       status?: "planned" | "active" | "review" | "completed",
 *       sort_order?: number,
 *       payment_plan_id?: string,
 *     }
 *
 *   PATCH body (update):
 *     { milestone_id: string, ...one or more of the fields above,
 *       completed_at?: string }
 *
 * Mark-completed shortcut: PATCH with status="completed" sets
 * completed_at = now() if not supplied.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type MilestoneBody = {
  milestone_id?: string;
  project_id?: string;
  name?: string;
  description?: string;
  due_at?: string | null;
  due_label?: string | null;
  amount?: number;
  owner_user_id?: string | null;
  status?: string;
  sort_order?: number;
  payment_plan_id?: string | null;
  completed_at?: string | null;
};

function isStudioStaff(roles: string[]): boolean {
  return roles.some((role) =>
    ["studio_owner", "project_manager", "developer_designer", "finance"].includes(role)
  );
}

export async function POST(request: NextRequest) {
  const viewer = await getStudioViewer();
  if (!viewer.user) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }
  if (!isStudioStaff(viewer.roles)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  let body: MilestoneBody;
  try {
    body = (await request.json()) as MilestoneBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const projectId = String(body.project_id || "").trim();
  const name = String(body.name || "").trim();
  if (!projectId || !name) {
    return NextResponse.json(
      { ok: false, error: "project_id_and_name_required" },
      { status: 400 }
    );
  }

  const admin = createAdminSupabase();
  const dueAtIso = body.due_at ? new Date(body.due_at).toISOString() : null;

  const { data: row, error: insertErr } = await admin
    .from("studio_project_milestones")
    .insert({
      project_id: projectId,
      name: name.slice(0, 200),
      description: String(body.description || "").slice(0, 2000),
      due_label: body.due_label ?? (dueAtIso ? new Date(dueAtIso).toDateString() : "TBD"),
      due_at: dueAtIso,
      amount: Math.max(0, Number(body.amount ?? 0)),
      status: String(body.status || "planned"),
      sort_order: Number(body.sort_order ?? 0),
      owner_user_id: body.owner_user_id ?? null,
      payment_plan_id: body.payment_plan_id ?? null,
    } as never)
    .select("id, created_at")
    .single<{ id: string; created_at: string }>();

  if (insertErr || !row) {
    console.error("[studio-milestones] insert failed", insertErr);
    return NextResponse.json({ ok: false, error: "persist_failed" }, { status: 500 });
  }

  try {
    const supabase = await createSupabaseServer();
    await supabase.rpc("add_audit_log_v2", {
      p_action: "studio.milestone.created",
      p_entity_type: "studio_project_milestone",
      p_entity_id: row.id,
      p_old_values: null,
      p_new_values: { project_id: projectId, name, due_at: dueAtIso },
      p_reason: null,
      p_division: "studio",
      p_correlation_id: null,
    });
  } catch (err) {
    console.error("[studio-milestones] audit log failed", err);
  }

  return NextResponse.json({ ok: true, milestone_id: row.id, created_at: row.created_at });
}

export async function PATCH(request: NextRequest) {
  const viewer = await getStudioViewer();
  if (!viewer.user) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }
  if (!isStudioStaff(viewer.roles)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  let body: MilestoneBody;
  try {
    body = (await request.json()) as MilestoneBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const milestoneId = String(body.milestone_id || "").trim();
  if (!milestoneId) {
    return NextResponse.json(
      { ok: false, error: "milestone_id_required" },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = String(body.name).slice(0, 200);
  if (body.description !== undefined) updates.description = String(body.description).slice(0, 2000);
  if (body.due_label !== undefined) updates.due_label = body.due_label;
  if (body.due_at !== undefined) updates.due_at = body.due_at ? new Date(body.due_at).toISOString() : null;
  if (body.amount !== undefined) updates.amount = Math.max(0, Number(body.amount));
  if (body.status !== undefined) updates.status = String(body.status);
  if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order);
  if (body.owner_user_id !== undefined) updates.owner_user_id = body.owner_user_id;
  if (body.payment_plan_id !== undefined) updates.payment_plan_id = body.payment_plan_id;

  // mark-completed shortcut
  if (body.status === "completed") {
    updates.completed_at = body.completed_at ?? new Date().toISOString();
  } else if (body.completed_at !== undefined) {
    updates.completed_at = body.completed_at;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { ok: false, error: "no_fields_to_update" },
      { status: 400 }
    );
  }

  const admin = createAdminSupabase();
  const { data: row, error: updateErr } = await admin
    .from("studio_project_milestones")
    .update(updates as never)
    .eq("id", milestoneId)
    .select("id, project_id, status, completed_at, updated_at")
    .single<{
      id: string;
      project_id: string;
      status: string;
      completed_at: string | null;
      updated_at: string;
    }>();

  if (updateErr || !row) {
    console.error("[studio-milestones] update failed", updateErr);
    return NextResponse.json({ ok: false, error: "persist_failed" }, { status: 500 });
  }

  try {
    const supabase = await createSupabaseServer();
    await supabase.rpc("add_audit_log_v2", {
      p_action: "studio.milestone.updated",
      p_entity_type: "studio_project_milestone",
      p_entity_id: milestoneId,
      p_old_values: null,
      p_new_values: updates as never,
      p_reason: null,
      p_division: "studio",
      p_correlation_id: null,
    });
  } catch (err) {
    console.error("[studio-milestones] audit log (patch) failed", err);
  }

  return NextResponse.json({
    ok: true,
    milestone_id: milestoneId,
    status: row.status,
    completed_at: row.completed_at,
    updated_at: row.updated_at,
  });
}
