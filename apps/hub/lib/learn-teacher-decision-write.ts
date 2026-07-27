import "server-only";

import { publishNotification } from "@henryco/notifications";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * V3-OWNER-CONTROL-01 — the Learn teacher-application review write core.
 *
 * Learn had a registration queue and no reviewer anywhere in the product: rows
 * could be submitted but nothing in any app could resolve them. This is the
 * missing half, built to the same shape as `seller-decision-write.ts` so both
 * registration paths behave identically under review — audit-first-abort, then
 * the status move, then role provisioning on approval, then a best-effort tail.
 *
 * CALLERS MUST AUTHORIZE FIRST. This module does not resolve or gate identity;
 * it takes the actor the route already proved.
 *
 * ROLE PROVISIONING: approval grants `learn_role_memberships` role
 * `instructor`, `scope_type = 'platform'`, `scope_id = null` — matching the
 * shape of the live instructor membership on this schema rather than inventing
 * a scope. The membership is read-then-written rather than upserted because
 * this table has no unique constraint to name in `onConflict`, and an upsert
 * without one fails at runtime instead of at review time.
 */

export type LearnTeacherDecision = "approved" | "rejected";

export type LearnTeacherApplicationState = {
  applicationId: string;
  userId: string | null;
  fullName: string;
  expertiseArea: string | null;
  status: string;
  email: string | null;
};

/** Live state of a teacher application — the rail's true-state reader. */
export async function readLearnTeacherApplication(
  applicationId: string,
): Promise<LearnTeacherApplicationState | null> {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("learn_teacher_applications")
    .select("id, user_id, full_name, expertise_area, status, normalized_email")
    .eq("id", applicationId)
    .maybeSingle();
  if (error || !data) return null;

  const row = data as {
    user_id?: string | null;
    full_name?: string | null;
    expertise_area?: string | null;
    status?: string | null;
    normalized_email?: string | null;
  };

  return {
    applicationId,
    userId: row.user_id ? String(row.user_id) : null,
    fullName: String(row.full_name || ""),
    expertiseArea: row.expertise_area ? String(row.expertise_area) : null,
    status: String(row.status || "submitted"),
    email: row.normalized_email ?? null,
  };
}

export async function applyLearnTeacherDecision(input: {
  applicationId: string;
  decision: LearnTeacherDecision;
  note: string;
  actorId: string;
  actorRole: string;
}): Promise<{ ok: true; executionRef: string } | { ok: false; error: string }> {
  const { applicationId, decision, note, actorId, actorRole } = input;

  if (decision !== "approved" && decision !== "rejected") {
    return { ok: false, error: "Choose a valid teacher review decision." };
  }
  if (decision === "rejected" && !note.trim()) {
    return { ok: false, error: "Add a review note before rejecting an application." };
  }

  const admin = createAdminSupabase();
  const now = new Date().toISOString();

  const { data: application } = await admin
    .from("learn_teacher_applications")
    .select("id, user_id, full_name, normalized_email, expertise_area, status")
    .eq("id", applicationId)
    .maybeSingle();
  if (!application) {
    return { ok: false, error: "That teacher application could not be found." };
  }

  const row = application as {
    user_id?: string | null;
    full_name?: string | null;
    normalized_email?: string | null;
    expertise_area?: string | null;
  };
  const applicantUserId = row.user_id ? String(row.user_id) : null;
  const applicantName = String(row.full_name || "the applicant");

  // Audit-first: no trail, no action.
  const { error: auditError } = await admin.from("staff_audit_logs").insert({
    actor_id: actorId,
    actor_role: actorRole || "owner",
    action: `learn.teacher.${decision}`,
    entity: "learn_teacher_application",
    entity_id: applicationId,
    meta: {
      target_user_id: applicantUserId,
      full_name: applicantName,
      expertise_area: row.expertise_area ?? null,
      review_status: decision,
      reviewer_note_present: Boolean(note.trim()),
      via: "owner_control",
    },
  } as never);
  if (auditError) {
    console.error("[learn-teacher-decision-write] staff audit insert failed", auditError.message);
    return { ok: false, error: "Audit logging failed; the application was not changed." };
  }

  const { error: updateError } = await admin
    .from("learn_teacher_applications")
    .update({
      status: decision,
      review_notes: note.trim() || null,
      reviewed_at: now,
      reviewed_by_user_id: actorId,
      updated_at: now,
    } as never)
    .eq("id", applicationId);
  if (updateError) {
    console.error("[learn-teacher-decision-write] status update failed", updateError.message);
    return { ok: false, error: "That application could not be updated." };
  }

  // Approval is what actually makes someone a teacher: without the membership
  // the status says "approved" while every instructor surface still refuses
  // them, which is exactly the two-auth-systems split this pass exists to fix.
  if (decision === "approved" && applicantUserId) {
    const { data: existing } = await admin
      .from("learn_role_memberships")
      .select("id")
      .eq("user_id", applicantUserId)
      .eq("role", "instructor")
      .maybeSingle();

    if (existing) {
      await admin
        .from("learn_role_memberships")
        .update({ is_active: true } as never)
        .eq("id", (existing as { id: string }).id);
    } else {
      await admin.from("learn_role_memberships").insert({
        user_id: applicantUserId,
        normalized_email: row.normalized_email ?? null,
        role: "instructor",
        scope_type: "platform",
        scope_id: null,
        is_active: true,
      } as never);
    }
  }

  const body =
    decision === "approved"
      ? note.trim() || `${applicantName} is approved to teach — the instructor workspace is now enabled.`
      : note.trim() || `${applicantName}'s teaching application could not be approved in its current form.`;

  // Best-effort tail — the decision already landed; these must never flip it.
  try {
    if (applicantUserId) {
      await publishNotification({
        userId: applicantUserId,
        division: "learn",
        eventType: "learn.teacher.review",
        severity: decision === "approved" ? "success" : "warning",
        title: decision === "approved" ? "Teaching application approved" : "Teaching application update",
        body,
        deepLink: decision === "approved" ? "/teach" : "/account",
        relatedType: "learn_teacher_application",
        relatedId: applicationId,
        actorUserId: actorId,
        publisher: "bridge:apps/hub/lib/learn-teacher-decision-write",
      });
    }
  } catch (error) {
    console.error("[learn-teacher-decision-write] notify step failed (decision landed)", error);
  }

  return { ok: true, executionRef: `learn-teacher:${applicationId}:${decision}` };
}
