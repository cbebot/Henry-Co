import "server-only";

import { createAdminSupabase } from "@/lib/supabase";

const admin = () => createAdminSupabase();

export type VerificationStatus = "none" | "pending" | "verified" | "rejected";

export type VerificationSubmission = {
  id: string;
  documentType: string;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  reviewerNote: string | null;
};

export type VerificationState = {
  status: VerificationStatus;
  submissions: VerificationSubmission[];
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewerNote: string | null;
};

const DOC_TYPE_LABELS: Record<string, string> = {
  government_id: "Government-issued ID",
  selfie: "Selfie with ID",
  address_proof: "Proof of address",
  business_cert: "Business registration",
};

export function getDocumentTypeLabel(type: string) {
  return DOC_TYPE_LABELS[type] || type.replace(/_/g, " ");
}

export async function getVerificationState(userId: string): Promise<VerificationState> {
  const adminClient = admin();

  const [profileRes, submissionsRes] = await Promise.all([
    adminClient
      .from("customer_profiles")
      .select("verification_status, verification_submitted_at, verification_reviewed_at, verification_note")
      .eq("id", userId)
      .maybeSingle(),
    adminClient
      .from("customer_verification_submissions")
      .select("id, document_type, status, submitted_at, reviewed_at, reviewer_note")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const profile = (profileRes.data || {}) as Record<string, unknown>;
  const submissions = ((submissionsRes.data || []) as Array<Record<string, unknown>>).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    documentType: String(row.document_type || ""),
    status: String(row.status || "pending"),
    submittedAt: String(row.submitted_at || ""),
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
    reviewerNote: row.reviewer_note ? String(row.reviewer_note) : null,
  }));

  return {
    status: (String(profile.verification_status || "none")) as VerificationStatus,
    submissions,
    submittedAt: profile.verification_submitted_at
      ? String(profile.verification_submitted_at)
      : null,
    reviewedAt: profile.verification_reviewed_at
      ? String(profile.verification_reviewed_at)
      : null,
    reviewerNote: profile.verification_note
      ? String(profile.verification_note)
      : null,
  };
}

/**
 * Submit a document for verification.
 * Sets profile.verification_status to 'pending' if not already submitted.
 */
export async function submitVerificationDocument(
  userId: string,
  input: {
    documentType: string;
    documentId: string;
  }
) {
  const adminClient = admin();

  await adminClient.from("customer_verification_submissions").insert({
    user_id: userId,
    document_type: input.documentType,
    document_id: input.documentId,
    status: "pending",
  } as never);

  // Mark the profile as pending if it isn't already verified.
  await adminClient
    .from("customer_profiles")
    .update({
      verification_status: "pending",
      verification_submitted_at: new Date().toISOString(),
    } as never)
    .eq("id", userId)
    .in("verification_status" as never, ["none", "rejected"]);

  return { ok: true };
}

/**
 * Staff review: approve or reject a submission.
 */
export async function reviewVerificationSubmission(
  submissionId: string,
  reviewerUserId: string,
  decision: "approved" | "rejected",
  note?: string
) {
  const adminClient = admin();
  const now = new Date().toISOString();

  const { data: rawSubmission } = await adminClient
    .from("customer_verification_submissions")
    .select("id, user_id, document_type")
    .eq("id", submissionId)
    .maybeSingle();

  const submission = rawSubmission as Record<string, unknown> | null;
  if (!submission) return null;

  await adminClient
    .from("customer_verification_submissions")
    .update({
      status: decision,
      reviewer_id: reviewerUserId,
      reviewer_note: note || null,
      reviewed_at: now,
    } as never)
    .eq("id", submissionId);

  // If approved, check if all required doc types are now approved
  // and upgrade the profile to verified.
  if (decision === "approved") {
    const userId = String(submission.user_id);
    const { data: allSubmissions } = await adminClient
      .from("customer_verification_submissions")
      .select("document_type, status")
      .eq("user_id", userId);

    const approved = new Set(
      ((allSubmissions || []) as Array<Record<string, unknown>>)
        .filter((r) => r.status === "approved")
        .map((r) => String(r.document_type))
    );

    // Minimum: government ID or selfie with ID approved.
    if (approved.has("government_id") || approved.has("selfie")) {
      await adminClient
        .from("customer_profiles")
        .update({
          verification_status: "verified",
          verification_reviewed_at: now,
          verification_reviewer_id: reviewerUserId,
          verification_note: note || "Identity verified via document review.",
        } as never)
        .eq("id", userId);
    }
  }

  if (decision === "rejected") {
    const userId = String(submission.user_id);
    // Check if there are still pending submissions
    const { data: pendingOthers } = await adminClient
      .from("customer_verification_submissions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "pending")
      .neq("id", submissionId)
      .limit(1);

    if (!pendingOthers || pendingOthers.length === 0) {
      await adminClient
        .from("customer_profiles")
        .update({
          verification_status: "rejected",
          verification_reviewed_at: now,
          verification_reviewer_id: reviewerUserId,
          verification_note: note || "Verification documents rejected.",
        } as never)
        .eq("id", userId);
    }
  }

  return { ok: true };
}

/**
 * Gating helper — call this before any sensitive action.
 * Returns `{ allowed: true }` if the user's verification status passes
 * the required level, or `{ allowed: false, reason }` if it doesn't.
 */
export async function requireVerification(
  userId: string,
  requiredLevel: "verified" = "verified"
): Promise<{ allowed: true } | { allowed: false; reason: string; status: VerificationStatus }> {
  const { data: rawProfile } = await admin()
    .from("customer_profiles")
    .select("verification_status")
    .eq("id", userId)
    .maybeSingle();

  const profile = rawProfile as Record<string, unknown> | null;
  const status = String(profile?.verification_status || "none") as VerificationStatus;

  if (requiredLevel === "verified" && status === "verified") {
    return { allowed: true };
  }

  const reasons: Record<string, string> = {
    none: "Identity verification is required. Please submit your documents in the Verify section of your account.",
    pending: "Your identity documents are under review. This action will be available once verification is complete.",
    rejected: "Your verification was not approved. Please resubmit your documents or contact support.",
  };

  return {
    allowed: false,
    reason: reasons[status] || reasons.none,
    status,
  };
}
