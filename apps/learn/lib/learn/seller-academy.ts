import "server-only";

import {
  trackEvent,
  noopSink,
  HenryEventNames,
  type HenryEventEnvelope,
  type HenryDivision,
} from "@henryco/intelligence";
import { writeAuditLog } from "@henryco/observability/audit-log";
import { createAdminSupabase, hasSupabaseServiceRole } from "@/lib/supabase";
import { isSellerAcademyCourse } from "@/lib/learn/data";
import type { LearnCourse } from "@/lib/learn/types";

/**
 * V3-58 — Seller Academy telemetry + tier-sync (learn side).
 *
 * Telemetry rides the @henryco/intelligence envelope (validated by
 * henryEventNameSchema), mirroring the account intelligence-rollout: the canonical
 * validated-envelope path; a real sink attaches at rollout. `seller` is only the
 * event-NAME domain — the envelope `division` is a real HenryDivision (learn for
 * academy enrol/complete, marketplace for the tier change).
 *
 * On a verified Seller Academy completion we recompute the seller tier for every
 * business the learner belongs to (the spec's "runs on course-completion" trigger).
 * It is best-effort and fail-safe: a failure is logged (never bare-caught) and the
 * daily reconcile cron is the safety net — completion itself has already succeeded.
 */

const LEARN_DIVISION: HenryDivision = "learn";
const MARKETPLACE_DIVISION: HenryDivision = "marketplace";

function recordEvent(event: Omit<HenryEventEnvelope, "version" | "occurredAt">): void {
  trackEvent(noopSink, {
    ...event,
    version: "1",
    occurredAt: new Date().toISOString(),
  });
}

/** Emit `henry.seller.academy.enrolled` for a genuinely-new seller-academy enrolment. */
export function handleSellerAcademyEnrollment(input: {
  course: Pick<LearnCourse, "slug" | "tags">;
  userId: string | null;
  created: boolean;
}): void {
  if (!input.created) return;
  if (!isSellerAcademyCourse(input.course as LearnCourse)) return;
  recordEvent({
    name: HenryEventNames.SELLER_ACADEMY_ENROLLED,
    division: LEARN_DIVISION,
    actor: input.userId ? { kind: "user", subjectRef: input.userId } : { kind: "anonymous" },
    properties: { courseSlug: input.course.slug },
  });
}

/**
 * Emit `henry.seller.academy.completed` when a seller-academy course reaches
 * completed, then recompute the learner's business tier(s).
 */
export async function handleSellerAcademyCompletion(input: {
  course: Pick<LearnCourse, "slug" | "tags">;
  userId: string | null;
  completed: boolean;
}): Promise<void> {
  if (!input.completed) return;
  if (!isSellerAcademyCourse(input.course as LearnCourse)) return;
  recordEvent({
    name: HenryEventNames.SELLER_ACADEMY_COMPLETED,
    division: LEARN_DIVISION,
    actor: input.userId ? { kind: "user", subjectRef: input.userId } : { kind: "anonymous" },
    properties: { courseSlug: input.course.slug },
  });
  if (input.userId) {
    await syncSellerTierForUser(input.userId);
  }
}

type TierDelta = { previousTier?: string; tier?: string; changed?: boolean };

/**
 * Recompute the seller tier for every business the user is a member of, via the
 * service-role-only recompute_seller_tier RPC. Emits tier.upgraded + writes an
 * audit log on each change. Never throws into the caller.
 */
export async function syncSellerTierForUser(userId: string): Promise<void> {
  if (!hasSupabaseServiceRole()) {
    console.warn("[seller-academy] tier sync skipped: no service role; daily reconcile will catch up", { userId });
    return;
  }
  const admin = createAdminSupabase();
  try {
    const { data: memberships, error } = await admin
      .from("business_members")
      .select("business_id")
      .eq("user_id", userId);
    if (error) {
      console.warn("[seller-academy] tier sync: membership read failed", { userId, error: error.message });
      return;
    }
    for (const row of (memberships ?? []) as Array<{ business_id: string }>) {
      const businessId = row.business_id;
      const { data, error: rpcError } = await admin.rpc("recompute_seller_tier", { p_business_id: businessId });
      if (rpcError) {
        console.warn("[seller-academy] recompute_seller_tier failed", { businessId, error: rpcError.message });
        continue;
      }
      const delta = (data ?? {}) as TierDelta;
      if (!delta.changed) continue;
      const fromTier = delta.previousTier ?? "none";
      const toTier = delta.tier ?? "none";
      recordEvent({
        name: HenryEventNames.SELLER_TIER_UPGRADED,
        division: MARKETPLACE_DIVISION,
        eventId: businessId,
        actor: { kind: "user", subjectRef: userId },
        // Direction is read from fromTier vs toTier (a downgrade has fromTier ranked above toTier).
        properties: { businessId, fromTier, toTier },
      });
      await writeAuditLog(admin as unknown as Parameters<typeof writeAuditLog>[0], {
        action: HenryEventNames.SELLER_TIER_UPGRADED,
        entityType: "seller_tier",
        entityId: businessId,
        oldValues: { tier: fromTier },
        newValues: { tier: toTier },
        division: "marketplace",
      });
    }
  } catch (e) {
    console.warn("[seller-academy] tier sync threw", {
      userId,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
