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

/**
 * Reported when the application was approved but instructor access was not
 * granted (or the membership could not be linked back to the application).
 *
 * Unlike the marketplace equivalent there is no in-product repair to name here:
 * Learn's own review workflow is the other writer of this membership, and it is
 * not reachable from HQ. So the message says what is true and stops — an
 * operator told "retry" for something that cannot be retried is worse served
 * than one told plainly that engineering has to look.
 */
const GRANT_FAILED_MESSAGE =
  "The application was approved but instructor access could not be granted, so this teacher cannot open the instructor workspace yet. This needs engineering attention before they are told they are live.";

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
  /**
   * Prior status the decision was made against — the compare-and-set anchor.
   * The console's fresh read and this write are two round trips, and between
   * them another operator (or the applicant withdrawing) can move the row. CAS
   * makes the UPDATE itself the check, so the second decision matches nothing
   * instead of silently overwriting the first.
   */
  /** REQUIRED — see the note in seller-decision-write.ts. An omitted value
   *  silently disables both the compare-and-set and the compensating revert. */
  expectedStatus: string;
}): Promise<{ ok: true; executionRef: string; changed: boolean } | { ok: false; error: string }> {
  const { applicationId, decision, note, actorId, actorRole, expectedStatus } = input;

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


  // CAS FIRST, WITH COMPENSATION ON A FAILED GRANT — same shape and same
  // reasoning as seller-decision-write.ts.
  //
  // Flip-first alone stranded the row: TEACHER_APPLICATION_PENDING excludes
  // `approved`, so a failed instructor grant left an application the route would
  // 409 forever while /teach still refused the applicant. Flip-last would have
  // removed that at the cost of a worse race — two owners deciding at once could
  // grant the instructor role and then lose the CAS to a rejection, leaving a
  // rejected applicant teaching.
  //
  // Losing the CAS here means nothing happened; a failed grant restores the
  // prior status so the owner can decide again.
  let statusUpdate = admin
    .from("learn_teacher_applications")
    .update({
      status: decision,
      review_notes: note.trim() || null,
      reviewed_at: now,
      reviewed_by_user_id: actorId,
      updated_at: now,
    } as never)
    .eq("id", applicationId);
  statusUpdate = statusUpdate.eq("status", expectedStatus);
  const { data: updated, error: updateError } = await statusUpdate.select("id");
  if (updateError) {
    console.error("[learn-teacher-decision-write] status update failed", updateError.message);
    return { ok: false, error: "That application could not be updated." };
  }
  const changed = Array.isArray(updated) && updated.length === 1;
  if (!changed) {
    // CAS lost: somebody else decided this application first. Stop here rather
    // than granting the teacher role off a decision that never applied.
    return {
      ok: false,
      error: "That application moved while you were deciding it. Refresh to see where it stands now.",
    };
  }

  /** Restore the prior status so a failed grant leaves a decidable row. */
  const revertStatusAfterFailedGrant = async (why: string): Promise<void> => {
    const { data: reverted, error: revertError } = await admin
      .from("learn_teacher_applications")
      .update({ status: expectedStatus, reviewed_at: null, reviewed_by_user_id: null } as never)
      .eq("id", applicationId)
      .eq("status", decision)
      .select("id");
    if (revertError || !Array.isArray(reverted) || reverted.length !== 1) {
      console.error(
        "[learn-teacher-decision-write] COULD NOT REVERT after failed grant — the application " +
          "reads approved but the instructor role was never granted",
        {
          applicationId,
          why,
          error: revertError?.message ?? "no row matched (status was not the one this call set)",
        },
      );
    }
  };

  // Approval is what actually makes someone a teacher: without the membership
  // the status says "approved" while every instructor surface still refuses
  // them, which is exactly the two-auth-systems split this pass exists to fix.
  if (decision === "approved" && applicantUserId) {
    // Every result below is CHECKED, and the resulting membership id is written
    // BACK onto the application. Both were missing.
    //
    // Unchecked, a failed grant ends with the application reading `approved`
    // while `/teach` still refuses the applicant — the console reports success
    // for an approval that did not take effect.
    //
    // The id write-back matters just as much and is less obvious. Learn's own
    // revoke path (apps/learn/lib/learn/workflows.ts:1319) deactivates the
    // membership named by `learn_teacher_applications.instructor_membership_id`
    // and has no other handle on it. Leaving that column null means a teacher
    // approved from HQ can never be un-approved from Learn: the revoke runs,
    // reports success, and the instructor membership stays active. Granting
    // access through a door that does not close is worse than not granting it.
    const { data: existingRows, error: membershipReadError } = await admin
      .from("learn_role_memberships")
      .select("id")
      .eq("user_id", applicantUserId)
      .eq("role", "instructor")
      .limit(1);
    if (membershipReadError) {
      console.error(
        "[learn-teacher-decision-write] membership lookup failed",
        membershipReadError.message,
      );
      await revertStatusAfterFailedGrant("membership lookup failed");
      return { ok: false, error: GRANT_FAILED_MESSAGE };
    }

    const existingMembershipId = (existingRows ?? [])[0]?.id;

    // Whether this membership was already active BEFORE this call. It decides
    // what compensation restores: a membership we merely reactivated goes back
    // to inactive, one that was already live stays live (the applicant held the
    // instructor role independently of this decision and must not lose it).
    let membershipWasAlreadyActive = false;
    if (existingMembershipId) {
      const { data: priorRow } = await admin
        .from("learn_role_memberships")
        .select("is_active")
        .eq("id", existingMembershipId)
        .maybeSingle();
      membershipWasAlreadyActive =
        (priorRow as { is_active?: unknown } | null)?.is_active === true;
    }
    const grant = existingMembershipId
      ? await admin
          .from("learn_role_memberships")
          .update({ is_active: true } as never)
          .eq("id", existingMembershipId)
          .select("id")
      : await admin
          .from("learn_role_memberships")
          .insert({
            user_id: applicantUserId,
            normalized_email: row.normalized_email ?? null,
            role: "instructor",
            scope_type: "platform",
            scope_id: null,
            is_active: true,
          } as never)
          .select("id");

    if (grant.error || !Array.isArray(grant.data) || grant.data.length !== 1) {
      console.error(
        "[learn-teacher-decision-write] instructor role grant failed",
        grant.error?.message ?? "no row written",
      );
      await revertStatusAfterFailedGrant("instructor role grant failed");
      return { ok: false, error: GRANT_FAILED_MESSAGE };
    }

    const membershipId = String((grant.data[0] as { id: string }).id);

    /**
     * Undo the instructor grant this call just made.
     *
     * This is the most consequential compensation in the pass. getLearnViewer
     * (apps/learn/lib/learn/auth.ts:162) grants the instructor role straight from
     * learn_role_memberships, independent of application status — so the moment
     * the grant lands the applicant can teach. And Learn's own revoke path keys
     * off `learn_teacher_applications.instructor_membership_id`, which the failing
     * write below is precisely what sets. Reverting only the application row
     * therefore left a LIVE instructor role that no in-product path could ever
     * revoke, because the handle Learn revokes by was never written.
     */
    const revertMembershipAfterFailedLink = async (why: string): Promise<boolean> => {
      // Already-active memberships are not ours to touch: the applicant held the
      // instructor role independently of this decision. Nothing to undo, so the
      // status revert below is free to proceed.
      if (membershipWasAlreadyActive) return true;
      // `.select()` for the same reason as the seller core — an update matching
      // no row returns `error: null`, so only the row count distinguishes a
      // completed rollback from a silent miss.
      const { data: reverted, error: membershipRevertError } = await admin
        .from("learn_role_memberships")
        .update({ is_active: false } as never)
        .eq("id", membershipId)
        .select("id");
      const ok =
        !membershipRevertError && Array.isArray(reverted) && reverted.length === 1;
      if (!ok) {
        console.error(
          "[learn-teacher-decision-write] COULD NOT REVERT the instructor grant — the role is " +
            "live and Learn cannot revoke it (instructor_membership_id was never written). " +
            "The application is deliberately LEFT approved so the two records agree",
          {
            membershipId,
            why,
            error: membershipRevertError?.message ?? "no row matched",
          },
        );
      }
      return ok;
    };
    const { error: linkError } = await admin
      .from("learn_teacher_applications")
      .update({ instructor_membership_id: membershipId, updated_at: now } as never)
      .eq("id", applicationId);
    if (linkError) {
      console.error(
        "[learn-teacher-decision-write] membership link write failed",
        linkError.message,
      );
      // Dependent, exactly as in the seller core: unsticking the application
      // while a live instructor role remains is the worse end state, because
      // that role cannot be revoked from Learn without the link this write
      // failed to make.
      if (await revertMembershipAfterFailedLink("membership link write failed")) {
        await revertStatusAfterFailedGrant("membership link write failed");
      }
      return { ok: false, error: GRANT_FAILED_MESSAGE };
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

  return { ok: true, executionRef: `learn-teacher:${applicationId}:${decision}`, changed: true };
}
