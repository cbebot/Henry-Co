import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isWithinAutoApproveThreshold,
  type DealApprovalThresholds,
} from "@henryco/config";
import {
  applyDealDecision,
  type DealRow,
  type TypedSupabaseClient,
} from "@henryco/data";
import {
  resolveDealSubmissionStatus,
  type DealSubmissionStatus,
} from "@henryco/intelligence";
import type { ModerationOutcome } from "@henryco/moderation";
import { moderate } from "@henryco/moderation/server";
import { writeAuditLog } from "@henryco/observability/audit-log";
import { emitEvent } from "@henryco/observability/events";

/**
 * V3-35 — the deal-approval publish gate, riding the SHIPPED V3-25 moderation
 * framework (mirrors apps/marketplace/lib/marketplace/moderation.ts — NEVER a
 * parallel approval machine):
 *
 *   1. CONTENT gate — `moderate()` scans the deal's public text under the
 *      `deal` content type (admitted by the V3-35 migration's CHECK widen)
 *      and persists the decision into the SAME moderation_decisions ledger
 *      as listings/posts/briefs. Deterministic floor; AI only via injected
 *      router; degrade-not-fail-open.
 *   2. TERMS envelope — `isWithinAutoApproveThreshold` (@henryco/config):
 *      low percent/fixed discounts auto-approve, bogo/bundle and unknown
 *      currencies FAIL CLOSED to staff review.
 *   3. The pure `resolveDealSubmissionStatus` maps the two verdicts onto the
 *      deal lifecycle; `applyDealDecision` applies it with a compare-and-set
 *      (only draft/pending_review rows transition — no post-approval swaps).
 *
 * Callers (the hub staff-campaign authoring surface and, post-V3-50, the
 * partner suite) OWN auth: owner/staff gating + `requireSensitiveAction`
 * happen in the route/action before this runs — same split as `fileReport`.
 * NO dispatch of any kind happens here or downstream of here: an approved
 * deal is eligibility only (V3-48/V3-61 own send).
 */
export type DealSubmissionResult = {
  /** The lifecycle status the submission resolved to. */
  status: DealSubmissionStatus;
  /** The V3-25 publish-gate outcome (decision id "" when the ledger write was skipped). */
  moderation: ModerationOutcome;
  /** True when the deal row actually transitioned (CAS from draft/pending_review). */
  applied: boolean;
};

export async function moderateDealSubmission(
  admin: TypedSupabaseClient,
  args: {
    deal: Pick<
      DealRow,
      | "id"
      | "title"
      | "description"
      | "deal_type"
      | "discount_percent"
      | "discount_minor"
      | "discount_currency"
      | "scope_division"
      | "status"
    >;
    /** The authoring actor (audit + repeat-offender context). */
    actorId: string;
    /** Staff reviewer for manual re-submissions; null for the automated gate. */
    reviewerId?: string | null;
    locale?: string;
    thresholds?: DealApprovalThresholds;
  },
): Promise<DealSubmissionResult> {
  const { deal } = args;

  const text = [deal.title, deal.description].filter(Boolean).join("\n");
  const moderation = await moderate(
    {
      contentType: "deal",
      contentId: deal.id,
      text,
      locale: args.locale ?? "en",
      actorId: args.actorId,
    },
    { supabase: admin as unknown as SupabaseClient },
  );

  const withinAutoApprove = isDealType(deal.deal_type)
    ? isWithinAutoApproveThreshold({
        dealType: deal.deal_type,
        discountPercent: deal.discount_percent,
        discountMinor: deal.discount_minor,
        discountCurrency: deal.discount_currency,
        thresholds: args.thresholds,
      })
    : false; // Unknown artifact shape fails closed to staff review.

  const status = resolveDealSubmissionStatus({
    moderation: moderation.decision,
    withinAutoApprove,
  });

  const updated = await applyDealDecision(admin, {
    dealId: deal.id,
    status,
    reviewerId: args.reviewerId ?? null,
  });
  const applied = updated !== null;

  if (applied) {
    // Every transition is audited (ids + enums only — never offer text).
    await writeAuditLog(admin, {
      action: "deal.status.changed",
      entityType: "deal",
      entityId: deal.id,
      oldValues: { status: deal.status },
      newValues: { status, moderation: moderation.decision },
      reason: moderation.reasons.join(",") || null,
      division: deal.scope_division,
    });
  }

  emitEvent({
    name: "henry.deal.status.changed",
    classification: "system_state",
    outcome: applied ? "completed" : "failed",
    actorId: args.actorId,
    payload: {
      deal_id: deal.id,
      from_status: deal.status,
      to_status: status,
      moderation: moderation.decision,
      within_auto_approve: withinAutoApprove,
      applied,
    },
  });

  return { status, moderation, applied };
}

function isDealType(
  value: string,
): value is "percent_off" | "fixed_off" | "bogo" | "bundle" | "spotlight" {
  return (
    value === "percent_off" ||
    value === "fixed_off" ||
    value === "bogo" ||
    value === "bundle" ||
    value === "spotlight"
  );
}
