import "server-only";

import { publishNotification } from "@henryco/notifications";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * THE identity-verification (KYC) review write path for the founder action rail
 * — a hub-local core that executes the EXACT same sequence apps/staff's
 * /api/kyc/review does (audit-first-abort → submission update → profile
 * verification_status derivation → customer_activity → user notification), so
 * the owner can clear a verification from HQ through the F3 confirmation card.
 * One behaviour, two callers (staff console + owner F3).
 *
 * CALLERS MUST AUTHORIZE FIRST (requireOwner at the confirm route) and pass the
 * resolved actor — this module does not gate or resolve identity itself.
 */

export type KycDecision = "approved" | "rejected";

export type KycSubmissionState = {
  submissionId: string;
  userId: string;
  documentType: string;
  status: string;
  profileStatus: string | null;
  userEmail: string | null;
};

/** Live state of a verification submission — the F3 true-state reader. */
export async function readKycSubmission(submissionId: string): Promise<KycSubmissionState | null> {
  const admin = createAdminSupabase();
  const { data: submission, error } = await admin
    .from("customer_verification_submissions")
    .select("id, user_id, document_type, status")
    .eq("id", submissionId)
    .maybeSingle();
  if (error || !submission) return null;

  const userId = String(submission.user_id);
  const { data: profile } = await admin
    .from("customer_profiles")
    .select("verification_status, email, full_name")
    .eq("id", userId)
    .maybeSingle();

  return {
    submissionId,
    userId,
    documentType: String(submission.document_type || ""),
    status: String(submission.status || "pending"),
    profileStatus: (profile?.verification_status as string | null) ?? null,
    userEmail:
      (profile?.email as string | null) ??
      (profile?.full_name as string | null) ??
      null,
  };
}

/**
 * Apply an owner/staff KYC review. Mirrors apps/staff/app/api/kyc/review
 * verbatim in effect: the staff_audit_logs insert is the gate (its failure
 * aborts before any state moves), then the submission + profile status are
 * derived from the full submission set, then activity + notification fire
 * best-effort. Returns an execution ref for the F3 audit trail.
 */
export async function applyKycReview(input: {
  submissionId: string;
  decision: KycDecision;
  note: string;
  actorId: string;
  actorRole: string;
}): Promise<{ ok: true; executionRef: string; profileStatus: string } | { ok: false; error: string }> {
  const { submissionId, decision, note, actorId, actorRole } = input;

  if (decision !== "approved" && decision !== "rejected") {
    return { ok: false, error: "Choose a valid review decision." };
  }
  if (decision === "rejected" && !note.trim()) {
    return { ok: false, error: "Add a review note before requesting more information." };
  }

  const admin = createAdminSupabase();
  const now = new Date().toISOString();

  const { data: submission } = await admin
    .from("customer_verification_submissions")
    .select("id, user_id, document_type")
    .eq("id", submissionId)
    .maybeSingle();
  if (!submission) {
    return { ok: false, error: "That verification submission could not be found." };
  }
  const userId = String(submission.user_id);

  // Audit-first: its failure aborts before any state moves (staff-route parity).
  const { error: auditError } = await admin.from("staff_audit_logs").insert({
    actor_id: actorId,
    actor_role: actorRole || "owner",
    action: `kyc.${decision}`,
    entity: "customer_verification_submission",
    entity_id: submissionId,
    meta: {
      target_user_id: userId,
      document_type: String(submission.document_type || ""),
      review_status: decision,
      reviewer_note_present: Boolean(note.trim()),
      via: "founder_action",
    },
  } as never);
  if (auditError) {
    console.error("[kyc-review-write] staff audit insert failed", auditError.message);
    return { ok: false, error: "Audit logging failed; verification review was not changed." };
  }

  await admin
    .from("customer_verification_submissions")
    .update({
      status: decision,
      reviewer_id: actorId,
      reviewer_note: note.trim() || null,
      reviewed_at: now,
    })
    .eq("id", submissionId);

  let profileStatus = decision === "approved" ? "pending" : "rejected";

  if (decision === "approved") {
    const { data: allSubmissions } = await admin
      .from("customer_verification_submissions")
      .select("document_type, status")
      .eq("user_id", userId);
    const approved = new Set(
      (allSubmissions || [])
        .filter((r: Record<string, unknown>) => r.status === "approved")
        .map((r: Record<string, unknown>) => String(r.document_type))
    );
    if (approved.has("government_id") || approved.has("selfie")) {
      await admin
        .from("customer_profiles")
        .update({
          verification_status: "verified",
          verification_reviewed_at: now,
          verification_reviewer_id: actorId,
          verification_note: note.trim() || "Identity verified via document review.",
        })
        .eq("id", userId);
      profileStatus = "verified";
    } else {
      profileStatus = "pending";
    }
  }

  if (decision === "rejected") {
    const { data: pendingOthers } = await admin
      .from("customer_verification_submissions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "pending")
      .neq("id", submissionId)
      .limit(1);
    if (!pendingOthers || pendingOthers.length === 0) {
      await admin
        .from("customer_profiles")
        .update({
          verification_status: "rejected",
          verification_reviewed_at: now,
          verification_reviewer_id: actorId,
          verification_note: note.trim() || "Documents rejected.",
        })
        .eq("id", userId);
      profileStatus = "rejected";
    } else {
      profileStatus = "pending";
    }
  }

  const reviewerNote =
    decision === "approved"
      ? note.trim() || "Identity verification approved."
      : note.trim() || "More information is required before verification can be approved.";

  // Best-effort tail — the review already landed; these must never flip it.
  try {
    await admin.from("customer_activity").insert({
      user_id: userId,
      division: "account",
      activity_type: "verification_reviewed",
      title:
        decision === "approved"
          ? "Identity verification approved"
          : "Identity verification needs more information",
      description: reviewerNote,
      status: profileStatus,
      reference_type: "verification_submission",
      reference_id: submissionId,
      action_url: "/verification",
      metadata: {
        submission_id: submissionId,
        document_type: String(submission.document_type || ""),
        review_status: decision,
        reviewer_id: actorId,
        via: "founder_action",
      },
    } as never);

    await publishNotification({
      userId,
      division: "account",
      eventType: "kyc.review.update",
      severity: decision === "approved" ? "success" : "warning",
      title: decision === "approved" ? "Verification approved" : "Verification needs more information",
      body: reviewerNote,
      deepLink: "/verification",
      relatedType: "verification_submission",
      relatedId: submissionId,
      actorUserId: actorId,
      publisher: "bridge:apps/hub/lib/kyc-review-write",
    });
  } catch (e) {
    console.error("[kyc-review-write] post-write notify step failed (review landed)", e);
  }

  return { ok: true, executionRef: `kyc:${submissionId}:${decision}`, profileStatus };
}
