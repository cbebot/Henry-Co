/**
 * SA-1 — the brief discriminator + the SA-D5 review-gate law, as PURE
 * functions (no React, no server imports) so the routing that decides
 * whether a client sees an instant proposal or an honest "being reviewed"
 * state is unit-tested, not scattered across ternaries in the workflow.
 *
 * Ratified defaults (docs/v3/studio-agency/OWNER-DECISIONS.md, SA-D5):
 *   - template packages keep instant auto-send (funnel speed is a feature)
 *   - agency-build briefs hold in `in_review` for a one-tap staff release
 */

import type { StudioBriefClass, StudioLeadStatus, StudioProposalStatus } from "@/lib/studio/types";

/**
 * A "package" brief whose live estimate has outgrown its package price by
 * more than this factor is no longer the thing the template lane priced —
 * add-ons and compressed timelines have turned it into real scope. Beyond
 * this line the brief is classed `agency` so a human looks before the
 * client holds a price (exactly the SA-D5 rationale: judgment where money
 * and scope are real).
 */
export const TEMPLATE_SCOPE_GROWTH_LIMIT = 1.5;

export function classifyStudioBrief(input: {
  packageIntent: "package" | "custom";
  /** Resolved catalog package price (major-unit NGN); null when unresolved. */
  packagePrice: number | null;
  /** estimateStudioPricing total for the same brief (major-unit NGN). */
  estimatedTotal: number;
}): StudioBriefClass {
  if (input.packageIntent !== "package") return "agency";
  if (input.packagePrice == null || input.packagePrice <= 0) return "agency";
  if (input.estimatedTotal > input.packagePrice * TEMPLATE_SCOPE_GROWTH_LIMIT) {
    return "agency";
  }
  return "template";
}

export type BriefSubmissionPlan = {
  proposalStatus: Extract<StudioProposalStatus, "sent" | "accepted" | "in_review">;
  leadStatus: Extract<StudioLeadStatus, "proposal_sent" | "won" | "proposal_ready">;
  /** Open the deposit workspace (project + payment) at submit time. */
  createProjectNow: boolean;
  /** Fire the proposal_sent email in the post-response fan-out. */
  sendProposalNow: boolean;
  /** The brief holds for a one-tap staff release before the client sees a price. */
  heldForReview: boolean;
};

/**
 * The SA-D5 routing law. Agency briefs hold in `in_review` — ALWAYS,
 * including when the client offered to pay the deposit immediately: the
 * first human look must happen before the client commits at a price,
 * which is where scope disputes are born. Template briefs keep the
 * shipped instant behaviour bit-for-bit.
 */
export function resolveBriefSubmissionPlan(input: {
  briefClass: StudioBriefClass;
  depositNow: boolean;
}): BriefSubmissionPlan {
  if (input.briefClass === "agency") {
    return {
      proposalStatus: "in_review",
      leadStatus: "proposal_ready",
      createProjectNow: false,
      sendProposalNow: false,
      heldForReview: true,
    };
  }
  if (input.depositNow) {
    return {
      proposalStatus: "accepted",
      leadStatus: "won",
      createProjectNow: true,
      sendProposalNow: true,
      heldForReview: false,
    };
  }
  return {
    proposalStatus: "sent",
    leadStatus: "proposal_sent",
    createProjectNow: false,
    sendProposalNow: true,
    heldForReview: false,
  };
}
