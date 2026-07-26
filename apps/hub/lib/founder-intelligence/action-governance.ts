import { z, type ZodType } from "zod";

/**
 * Founder Intelligence F3 — the PURE governance layer of the action catalog.
 *
 * No server imports (zod only), so the invariant gate can assert these in a
 * plain test: `.strict()` schemas, no money-amount field the AI could fill,
 * moneyAdjacent ⇒ requiresReauth, and founder-only permission on every entry.
 * The server-only `action-catalog.ts` attaches true-state readers, execution
 * bindings, and copy on top of these descriptors by key.
 */

export type FounderActionGovernance = {
  key: string;
  division: string;
  /** Tranche 3 = the SA-4 studio-agency operator actions (dark until
   *  FOUNDER_ACTIONS_TRANCHE >= 3). */
  tranche: 1 | 2 | 3;
  moneyAdjacent: boolean;
  requiresReauth: boolean;
  reversibility: "reversible" | "hard-to-reverse" | "irreversible";
  ownerPermission: "founder-only";
  paramsSchema: ZodType;
  driftKeys: string[];
};

/** Editable branding text fields — EXCLUDES support_phone (trust invariant:
 *  the number lives at exactly one line and is never surfaced), media, socials. */
export const BRAND_TEXT_FIELDS = [
  "brand_title",
  "brand_subtitle",
  "brand_description",
  "footer_blurb",
  "support_email",
] as const;

export const brandSettingsGovernance: FounderActionGovernance = {
  key: "owner.brand.settings.update",
  division: "hub",
  tranche: 1,
  moneyAdjacent: false,
  requiresReauth: false,
  reversibility: "reversible",
  ownerPermission: "founder-only",
  paramsSchema: z
    .object({
      field: z.enum(BRAND_TEXT_FIELDS),
      text: z.string().min(1).max(600),
    })
    .strict(),
  driftKeys: ["currentValue"],
};

export const staffStatusGovernance: FounderActionGovernance = {
  key: "owner.staff.status.toggle",
  division: "hub",
  tranche: 1,
  moneyAdjacent: false,
  requiresReauth: false,
  reversibility: "reversible",
  ownerPermission: "founder-only",
  paramsSchema: z
    .object({
      userId: z.string().uuid(),
      intent: z.enum(["suspend", "reactivate"]),
    })
    .strict(),
  driftKeys: ["suspended"],
};

// ── Tranche 2 — real ecosystem operations, owner-invokable from HQ ───────────
// Each delegates to a hub-local core that mirrors the existing guarded staff
// write path (no money field; the model can only name a record + a decision).

export const kycReviewGovernance: FounderActionGovernance = {
  key: "owner.kyc.review",
  division: "hub",
  tranche: 2,
  moneyAdjacent: false,
  requiresReauth: false,
  reversibility: "reversible",
  ownerPermission: "founder-only",
  paramsSchema: z
    .object({
      submissionId: z.string().uuid(),
      decision: z.enum(["approved", "rejected"]),
      note: z.string().max(1000).optional().default(""),
    })
    .strict(),
  driftKeys: ["status"],
};

export const sellerDecisionGovernance: FounderActionGovernance = {
  key: "owner.marketplace.seller.decision",
  division: "hub",
  tranche: 2,
  moneyAdjacent: false,
  requiresReauth: false,
  reversibility: "reversible",
  ownerPermission: "founder-only",
  paramsSchema: z
    .object({
      applicationId: z.string().uuid(),
      decision: z.enum(["approved", "changes_requested", "rejected"]),
      note: z.string().max(1000).optional().default(""),
    })
    .strict(),
  driftKeys: ["status"],
};

export const divisionStatusGovernance: FounderActionGovernance = {
  key: "owner.division.status.set",
  division: "hub",
  tranche: 2,
  moneyAdjacent: false,
  // Deep action — pausing a division removes it from every public surface
  // within a minute. The founder's "print" (fresh password step-up) is
  // demanded at confirm even though no money moves.
  requiresReauth: true,
  reversibility: "reversible",
  ownerPermission: "founder-only",
  paramsSchema: z
    .object({
      slug: z.string().min(1).max(60),
      intent: z.enum(["pause", "resume"]),
    })
    .strict(),
  driftKeys: ["status"],
};

export const supportReplyGovernance: FounderActionGovernance = {
  key: "owner.support.reply",
  division: "hub",
  tranche: 2,
  moneyAdjacent: false,
  requiresReauth: false,
  // A sent message cannot be unsent — the card says so before the click.
  reversibility: "hard-to-reverse",
  ownerPermission: "founder-only",
  paramsSchema: z
    .object({
      threadId: z.string().uuid(),
      body: z.string().min(1).max(2000),
    })
    .strict(),
  driftKeys: ["status"],
};

export const socialPostGovernance: FounderActionGovernance = {
  key: "owner.social.post",
  division: "hub",
  tranche: 2,
  moneyAdjacent: false,
  // A public post under the company name is irreversible — the print (fresh
  // password step-up) is demanded at confirm.
  requiresReauth: true,
  reversibility: "irreversible",
  ownerPermission: "founder-only",
  paramsSchema: z
    .object({
      platform: z.enum(["x"]),
      text: z.string().min(1).max(280),
    })
    .strict(),
  driftKeys: ["platformReady"],
};

export const supportReplyBatchGovernance: FounderActionGovernance = {
  key: "owner.support.reply_batch",
  division: "hub",
  tranche: 2,
  moneyAdjacent: false,
  // Mass outbound in one confirm — the print is demanded even though each
  // individual reply wouldn't need it.
  requiresReauth: true,
  reversibility: "hard-to-reverse",
  ownerPermission: "founder-only",
  paramsSchema: z
    .object({
      replies: z
        .array(
          z
            .object({
              threadId: z.string().uuid(),
              body: z.string().min(1).max(2000),
            })
            .strict(),
        )
        .min(1)
        .max(10),
    })
    .strict(),
  driftKeys: ["readyCount"],
};

export const productReviewGovernance: FounderActionGovernance = {
  key: "owner.marketplace.product.review",
  division: "hub",
  tranche: 2,
  moneyAdjacent: false,
  requiresReauth: false,
  reversibility: "reversible",
  ownerPermission: "founder-only",
  paramsSchema: z
    .object({
      productId: z.string().uuid(),
      decision: z.enum(["approved", "changes_requested", "rejected"]),
      note: z.string().max(1000).optional().default(""),
    })
    .strict(),
  driftKeys: ["status"],
};

// ── Security containment — the "respond" verb of the threat watchtower ───────
// When the Threat watch flags an account under attack, the owner can SECURE it:
// revoke every recognised device so each must re-verify + re-alert next sign-in
// and lose its trusted mark. A deep security action → the founder's print
// (fresh password step-up) is demanded at confirm even though no money moves.
export const securitySecureAccountGovernance: FounderActionGovernance = {
  key: "owner.security.account.secure",
  division: "hub",
  tranche: 2,
  moneyAdjacent: false,
  requiresReauth: true,
  reversibility: "hard-to-reverse",
  ownerPermission: "founder-only",
  paramsSchema: z
    .object({
      userId: z.string().uuid(),
    })
    .strict(),
  driftKeys: ["activeDeviceCount"],
};

// ── Tranche 3 — SA-4 studio-agency operator actions ──────────────────────────
// The Owner-AI operator's one-tap decisions over the SA-3 build orchestration
// (docs/v3/studio-agency/ARCHITECTURE.md §4.1). Every binding is a hub-local
// service-role core that MIRRORS the studio console's guarded write path; the
// DB is the second wall (transition trigger + write-once approved_artifact_hash
// + budget_kobo >= 0 CHECK + deny-RLS). Dark until FOUNDER_ACTIONS_TRANCHE>=3
// AND STUDIO_AGENCY_LIVE=1 (the readers null out while the agency flag is off).
//
// Per SA-D5 + PHASED-PLAN §SA-1(3), the ratified brief-approval tap for an
// agency-class brief IS the proposal release — `owner.studio.proposal.send`
// (ARCHITECTURE §5 step 1: approve → proposal sent → client pays → job
// created). Job creation itself stays with the studio orchestrator, post-pay.

export const studioProposalSendGovernance: FounderActionGovernance = {
  key: "owner.studio.proposal.send",
  division: "studio",
  tranche: 3,
  moneyAdjacent: false,
  requiresReauth: false,
  // The client reads the released proposal — a send cannot be unsent.
  reversibility: "hard-to-reverse",
  ownerPermission: "founder-only",
  paramsSchema: z
    .object({
      proposalId: z.string().uuid(),
    })
    .strict(),
  driftKeys: ["status"],
};

export const studioDeployApproveGovernance: FounderActionGovernance = {
  key: "owner.studio.deploy.approve",
  division: "studio",
  tranche: 3,
  moneyAdjacent: false,
  // THE hard gate (SAFETY-MODEL §6): a production deploy demands the founder's
  // print even though rollback exists — what ships carries the company's name.
  requiresReauth: true,
  reversibility: "hard-to-reverse",
  ownerPermission: "founder-only",
  paramsSchema: z
    .object({
      jobId: z.string().uuid(),
    })
    .strict(),
  // Stage AND the artifact hash the owner is approving — a post-card rebuild
  // (new artifact) must abort to a fresh card, never deploy unseen bytes.
  driftKeys: ["stage", "artifactHash"],
};

export const studioJobCancelGovernance: FounderActionGovernance = {
  key: "owner.studio.job.cancel",
  division: "studio",
  tranche: 3,
  moneyAdjacent: false,
  // Cancel triggers the refund-policy path downstream — reauth per SA-D1.
  requiresReauth: true,
  reversibility: "hard-to-reverse",
  ownerPermission: "founder-only",
  paramsSchema: z
    .object({
      jobId: z.string().uuid(),
    })
    .strict(),
  driftKeys: ["stage"],
};

/** Preset budget-increase steps (percent of the CURRENT envelope). The model
 *  names a step; the server computes the new envelope — the AI never fills a
 *  money amount (FORBIDDEN_MONEY_PARAM_KEYS stands; 'step' is a bounded enum). */
export const STUDIO_BUDGET_STEPS = ["10", "25", "50"] as const;

export const studioJobBudgetIncreaseGovernance: FounderActionGovernance = {
  key: "owner.studio.job.budget_increase",
  division: "studio",
  tranche: 3,
  // Raising a cost envelope is money-adjacent by definition ⇒ reauth (gate).
  moneyAdjacent: true,
  requiresReauth: true,
  reversibility: "hard-to-reverse",
  ownerPermission: "founder-only",
  paramsSchema: z
    .object({
      jobId: z.string().uuid(),
      step: z.enum(STUDIO_BUDGET_STEPS),
    })
    .strict(),
  driftKeys: ["budgetKobo", "stage"],
};

export const studioJobPauseGovernance: FounderActionGovernance = {
  key: "owner.studio.job.pause",
  division: "studio",
  tranche: 3,
  moneyAdjacent: false,
  requiresReauth: false,
  reversibility: "reversible",
  ownerPermission: "founder-only",
  paramsSchema: z
    .object({
      jobId: z.string().uuid(),
    })
    .strict(),
  driftKeys: ["stage", "holdState"],
};

export const studioJobResumeGovernance: FounderActionGovernance = {
  key: "owner.studio.job.resume",
  division: "studio",
  tranche: 3,
  moneyAdjacent: false,
  requiresReauth: false,
  reversibility: "reversible",
  ownerPermission: "founder-only",
  paramsSchema: z
    .object({
      jobId: z.string().uuid(),
    })
    .strict(),
  driftKeys: ["stage", "holdState"],
};

export const studioClientReplyGovernance: FounderActionGovernance = {
  key: "owner.studio.client.reply",
  division: "studio",
  tranche: 3,
  moneyAdjacent: false,
  requiresReauth: false,
  // A message the client reads cannot be unsent — the card says so.
  reversibility: "hard-to-reverse",
  ownerPermission: "founder-only",
  paramsSchema: z
    .object({
      projectId: z.string().uuid(),
      body: z.string().min(1).max(2000),
    })
    .strict(),
  driftKeys: ["status"],
};

export const FOUNDER_ACTION_GOVERNANCE: FounderActionGovernance[] = [
  brandSettingsGovernance,
  staffStatusGovernance,
  kycReviewGovernance,
  sellerDecisionGovernance,
  divisionStatusGovernance,
  supportReplyGovernance,
  socialPostGovernance,
  supportReplyBatchGovernance,
  productReviewGovernance,
  securitySecureAccountGovernance,
  studioProposalSendGovernance,
  studioDeployApproveGovernance,
  studioJobCancelGovernance,
  studioJobBudgetIncreaseGovernance,
  studioJobPauseGovernance,
  studioJobResumeGovernance,
  studioClientReplyGovernance,
];

/** Money-amount field names the AI must NEVER be able to fill (the gate). */
export const FORBIDDEN_MONEY_PARAM_KEYS = [
  "amount",
  "amount_minor",
  "amountminor",
  "amountkobo",
  "amount_kobo",
  "value",
  "price",
  "kobo",
  "refund_amount",
  "refundamount",
  "total",
  "fee",
  "cost",
  "charge",
  "balance",
  "payout",
  "sum",
  "naira",
  "minor",
];

export function governanceParamKeys(g: FounderActionGovernance): string[] {
  const shape = (g.paramsSchema as unknown as { shape?: Record<string, unknown> }).shape;
  return shape ? Object.keys(shape) : [];
}
