import { createHash } from "node:crypto";
import { emitEvent } from "@henryco/observability/events";
import { writeAuditLog } from "@henryco/observability/audit-log";
import { createAdminSupabase } from "@/lib/supabase";
import {
  buildLearnCompletionVerificationRow,
  LEARN_COMPLETION_SOURCE,
  type LearnCompletionInput,
} from "@/lib/learn/learn-to-earn";

/**
 * V3-56 Learn→Jobs bridge (impure side).
 *
 * When a real `learn_certificates` row is issued, write the matching verified
 * `jobs_skill_verifications` row (system actor, idempotent), emit
 * `henry.learn.badge.issued`, and audit. This is the ONLY writer of
 * source='learn_completion' verifications — the badge means a genuine, governed
 * completion (ANTI-CLONE Principle 10), never a self-claim.
 *
 * RESILIENCE: the provenance columns ship committed-NOT-applied. Until the owner
 * applies the migration in prod, the columns/index may be absent — this function
 * must NEVER throw into the certificate-issuance path. Every failure mode is
 * caught and reported as a result, so a learner still earns their certificate
 * even if the bridge cannot write yet.
 */

export type BridgeSyncInput = Omit<LearnCompletionInput, "id" | "userId"> & {
  /** Email-only certificates have no auth user — the bridge skips those. */
  userId: string | null;
  normalizedEmail?: string | null;
};

export type BridgeSyncResult = {
  synced: boolean;
  reason: "synced" | "no_user" | "exists" | "schema_pending" | "no_admin" | "error";
  verificationId?: string;
};

function deterministicVerificationId(certificateId: string): string {
  const digest = createHash("sha256")
    .update(`henryco-learn:learn-skill-verif:${certificateId}`)
    .digest("hex");
  return `${digest.slice(0, 8)}-${digest.slice(8, 12)}-4${digest.slice(13, 16)}-a${digest.slice(
    17,
    20,
  )}-${digest.slice(20, 32)}`;
}

/** True when the DB error is "this column/table isn't here yet" (pre-apply). */
function isSchemaPendingError(error: { code?: string | null; message?: string | null } | null): boolean {
  if (!error) return false;
  const code = error.code ?? "";
  if (code === "42703" || code === "42P01" || code === "PGRST204" || code === "PGRST205") return true;
  const message = (error.message ?? "").toLowerCase();
  return (
    message.includes("does not exist") ||
    message.includes("could not find") ||
    message.includes("schema cache")
  );
}

function isUniqueViolation(error: { code?: string | null } | null): boolean {
  return (error?.code ?? "") === "23505";
}

export async function syncLearnCompletionToJobs(input: BridgeSyncInput): Promise<BridgeSyncResult> {
  // Email-only certificates cannot map to a Jobs candidate (auth user) — skip.
  if (!input.userId) {
    return { synced: false, reason: "no_user" };
  }
  const userId: string = input.userId;

  let admin: ReturnType<typeof createAdminSupabase>;
  try {
    admin = createAdminSupabase();
  } catch {
    // Service-role env missing (e.g. local without secrets) — degrade silently.
    return { synced: false, reason: "no_admin" };
  }

  const verificationId = deterministicVerificationId(input.certificateId);
  const row = buildLearnCompletionVerificationRow({ ...input, id: verificationId, userId });

  try {
    // Idempotency: one verified row per certificate. The partial unique index is
    // the DB backstop; this check keeps re-syncs quiet and event-free.
    const existing = await admin
      .from("jobs_skill_verifications")
      .select("id")
      .eq("source", LEARN_COMPLETION_SOURCE)
      .eq("source_ref", input.certificateId)
      .maybeSingle();

    if (existing.error) {
      if (isSchemaPendingError(existing.error)) {
        return { synced: false, reason: "schema_pending" };
      }
      return { synced: false, reason: "error" };
    }
    if (existing.data) {
      return { synced: false, reason: "exists", verificationId: row.id };
    }

    const insert = await admin
      .from("jobs_skill_verifications")
      .insert(row as never)
      .select("id")
      .single();

    if (insert.error) {
      if (isUniqueViolation(insert.error)) {
        // Concurrent issuance won the race — already verified, idempotent.
        return { synced: false, reason: "exists", verificationId: row.id };
      }
      if (isSchemaPendingError(insert.error)) {
        return { synced: false, reason: "schema_pending" };
      }
      return { synced: false, reason: "error" };
    }

    emitEvent({
      name: "henry.learn.badge.issued",
      classification: "system_state",
      outcome: "issued",
      actorId: userId,
      payload: {
        course_id: input.courseId,
        course_slug: input.courseSlug ?? null,
        source: LEARN_COMPLETION_SOURCE,
        division: "learn",
      },
    });

    await writeAuditLog(admin as unknown as Parameters<typeof writeAuditLog>[0], {
      action: "learn.badge.issued",
      entityType: "jobs_skill_verification",
      entityId: row.id,
      division: "learn",
      reason: "Verified Henry Onyx Learn completion issued a Jobs skill verification.",
      newValues: {
        candidate_user_id: userId,
        course_id: input.courseId,
        source: LEARN_COMPLETION_SOURCE,
        certificate_id: input.certificateId,
      },
    });

    return { synced: true, reason: "synced", verificationId: insert.data?.id ?? row.id };
  } catch {
    // Last-resort guard: never let a bridge failure break certificate issuance.
    return { synced: false, reason: "error" };
  }
}
