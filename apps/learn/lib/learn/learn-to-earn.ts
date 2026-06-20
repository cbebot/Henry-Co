/**
 * V3-56 Learn-to-Earn — pure logic for the Learn→Jobs bridge (Learn side).
 *
 * These functions are pure (no IO) so they can be unit-tested without a DB.
 * The impure write/emit/audit path lives in `learn-to-earn-bridge.ts`.
 *
 * Ground truth (recon): a Learn-sourced verification is a row in the EXISTING
 * `jobs_skill_verifications` ledger. `skill_id` is nullable (course completions
 * have no jobs_skills row), `evidence_type` already allows 'certificate', and the
 * provenance columns `source`/`source_ref`/`course_id` are added by
 * `20260620120000_v3_56_learn_to_earn_jobs.sql`.
 */

/** Provenance marker for a verification written by the Learn→Jobs bridge. */
export const LEARN_COMPLETION_SOURCE = "learn_completion" as const;

export type LearnCompletionInput = {
  /** Deterministic id so re-sync is idempotent even if the partial index is absent pre-apply. */
  id: string;
  certificateId: string;
  courseId: string;
  courseTitle: string;
  courseSlug?: string | null;
  userId: string;
  /** ISO timestamp of the certificate issuance — becomes verified_at. */
  issuedAt: string;
  certificateNo?: string | null;
  verificationCode?: string | null;
  /** Public verification-ledger URL the badge links to. */
  verifyUrl?: string | null;
};

export type LearnSkillVerificationRow = {
  id: string;
  candidate_user_id: string;
  skill_id: null;
  skill_label: string;
  evidence_type: "certificate";
  evidence_url: string | null;
  evidence_payload: Record<string, unknown>;
  status: "verified";
  verified_by_user_id: null;
  verified_at: string;
  decision_reason: string;
  source: typeof LEARN_COMPLETION_SOURCE;
  source_ref: string;
  course_id: string;
};

/**
 * Build the `jobs_skill_verifications` row for a real Learn completion.
 *
 * The badge MEANS a governed completion (ANTI-CLONE Principle 10): this is only
 * ever called from the certificate-issuance path with a real certificate, via
 * the system actor (`verified_by_user_id: null`), status already `verified`.
 */
export function buildLearnCompletionVerificationRow(
  input: LearnCompletionInput,
): LearnSkillVerificationRow {
  const courseTitle = input.courseTitle.trim() || "Henry Onyx Learn course";
  return {
    id: input.id,
    candidate_user_id: input.userId,
    skill_id: null,
    skill_label: courseTitle,
    evidence_type: "certificate",
    evidence_url: input.verifyUrl ?? null,
    evidence_payload: {
      source: LEARN_COMPLETION_SOURCE,
      course_id: input.courseId,
      course_slug: input.courseSlug ?? null,
      certificate_no: input.certificateNo ?? null,
      verification_code: input.verificationCode ?? null,
    },
    status: "verified",
    verified_by_user_id: null,
    verified_at: input.issuedAt,
    decision_reason: "Verified completion of a Henry Onyx Learn course.",
    source: LEARN_COMPLETION_SOURCE,
    source_ref: input.certificateId,
    course_id: input.courseId,
  };
}

export type CandidateOptin = {
  visibility?: string | null;
  revoked_at?: string | null;
};

/**
 * Consent rule (NDPR/GDPR): a completer is visible to employers ONLY with an
 * active, employer-visible opt-in. Opt-out (revoked_at set) is immediate and
 * total. A `private` opt-in is never employer-visible.
 */
export function isOptInVisibleToEmployers(optin: CandidateOptin | null | undefined): boolean {
  if (!optin) return false;
  if (optin.revoked_at) return false;
  return (optin.visibility ?? "employers") === "employers";
}
