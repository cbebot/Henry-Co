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
  tranche: 1 | 2;
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

export const FOUNDER_ACTION_GOVERNANCE: FounderActionGovernance[] = [
  brandSettingsGovernance,
  staffStatusGovernance,
  kycReviewGovernance,
  sellerDecisionGovernance,
  divisionStatusGovernance,
  supportReplyGovernance,
  socialPostGovernance,
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
