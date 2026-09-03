/**
 * V3-35 — the approval-state resolver (pure; DB-less).
 *
 * Deal approval rides the SHIPPED V3-25 moderation framework — there is no
 * parallel approval machine. Two independent gates compose here:
 *
 *   1. The CONTENT gate: `moderate()` (@henryco/moderation/server) scans the
 *      deal's public text and returns approve/hold/reject. Its `deal` content
 *      type was admitted by the V3-35 migration + the ContentType union.
 *   2. The TERMS envelope: `isWithinAutoApproveThreshold` (@henryco/config)
 *      decides whether the discount terms are inside the governed
 *      auto-approve envelope (fail-closed for unknown currencies/shapes).
 *
 * This function maps the two verdicts onto the deal lifecycle:
 *
 *   moderation reject             → `rejected`       (never renders)
 *   moderation hold               → `pending_review` (staff queue)
 *   moderation approve + inside   → `approved`       (auto-approve)
 *   moderation approve + outside  → `pending_review` (staff review)
 *
 * FAIL-CLOSED: anything unrecognized resolves to `pending_review` — a deal
 * can only ever auto-approve on an explicit approve + in-envelope terms.
 * Activation (`approved` → `active`) is a separate, human/scheduled step —
 * never decided here.
 */

import type { DealStatus } from "./types";

/**
 * Structural mirror of @henryco/moderation's `ModerationDecision`
 * (approve/hold/reject) — kept structural so this engine package stays
 * dependency-free; the compiler unifies the two unions at the call site.
 */
export type DealPublishGateDecision = "approve" | "hold" | "reject";

export type DealSubmissionStatus = Extract<
  DealStatus,
  "approved" | "pending_review" | "rejected"
>;

export function resolveDealSubmissionStatus(args: {
  /** The V3-25 publish-gate decision over the deal's public text. */
  moderation: DealPublishGateDecision;
  /** Whether the offer terms sit inside the governed auto-approve envelope. */
  withinAutoApprove: boolean;
}): DealSubmissionStatus {
  switch (args.moderation) {
    case "reject":
      return "rejected";
    case "hold":
      return "pending_review";
    case "approve":
      return args.withinAutoApprove ? "approved" : "pending_review";
    default:
      // Unreachable by type — kept as the runtime fail-closed floor.
      return "pending_review";
  }
}
