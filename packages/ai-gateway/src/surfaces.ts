import type { AiModelTier } from "@henryco/pricing";

/** A registered AI entry point. The FREE/METERED split is the owner's model: free for
 *  company-critical tasks, metered for personal/business tasks. */
export type AiSurfaceKey =
  | "marketplace.listing.draft" // Pass 1 — METERED (a seller's business task)
  | "marketplace.listing.verify" // Pass 2 — METERED, deep tier (the trust review; see docs/v3/ai/PASS-2-LISTING-VERIFY.md)
  | "support.message.assist" // later — FREE (company-critical)
  | "account.check.assist" // later — FREE
  | "studio.brief.staff" // later — FREE/internal (the existing staff copilot; NOT billed)
  | "studio.brief.client" // later — METERED (client-end briefs)
  | "business.message.assist"; // later — METERED

export interface AiSurfacePolicy {
  surface: AiSurfaceKey;
  /** false ⇒ company-critical/subsidised; no wallet interaction. */
  billable: boolean;
  /** → pricing_rule_books.rule_book_key (margin %, caps); ignored when !billable. */
  ruleBookKey: string;
  /** Default tier; an operation may escalate to a heavier tier server-side. */
  modelTier: AiModelTier;
  /** Hard per-call output cap — bounds the largest single charge. */
  maxOutputTokens: number;
  /** Upper bound on provider round-trips per task (the estimator uses this). */
  maxCalls: number;
  /** Rate-limit even FREE surfaces (the studio anti-abuse lesson). */
  freeAllowancePerDay?: number;
}

const DEFAULT_RULE_BOOK_KEY = "ai-usage-rate-card-v1";

/** The governed surface registry. Only `marketplace.listing.draft` is mounted on a UI
 *  surface in Pass 1; the rest are declared for forward-compatibility (Pass 2 wires
 *  them). Flipping a surface FREE↔METERED is data, not code. */
export const AI_SURFACES: Record<AiSurfaceKey, AiSurfacePolicy> = {
  "marketplace.listing.draft": {
    surface: "marketplace.listing.draft",
    billable: true,
    ruleBookKey: DEFAULT_RULE_BOOK_KEY,
    modelTier: "standard",
    maxOutputTokens: 1024,
    maxCalls: 1,
  },
  // Pass 2 — opt-in "Henry Onyx Intelligence Review" before a listing goes live: deep
  // tier (the strongest model, so nothing slips through), multimodal (images + copy),
  // returns an honesty / not-AI-generated / standards / safety verdict that earns a
  // "Henry Onyx Verified" trust badge. METERED — the seller pays for the review, for
  // their own goods' credibility. Dark until the Pass-2 build wires the surface + the
  // vision adapter path. The cross-division siblings (jobs/learn/property `*.listing.verify`)
  // follow this exact shape. See docs/v3/ai/PASS-2-LISTING-VERIFY.md.
  "marketplace.listing.verify": {
    surface: "marketplace.listing.verify",
    billable: true,
    ruleBookKey: DEFAULT_RULE_BOOK_KEY,
    modelTier: "deep",
    maxOutputTokens: 1500,
    maxCalls: 1,
  },
  "support.message.assist": {
    surface: "support.message.assist",
    billable: false,
    ruleBookKey: DEFAULT_RULE_BOOK_KEY,
    modelTier: "fast",
    maxOutputTokens: 512,
    maxCalls: 1,
    freeAllowancePerDay: 20,
  },
  "account.check.assist": {
    surface: "account.check.assist",
    billable: false,
    ruleBookKey: DEFAULT_RULE_BOOK_KEY,
    modelTier: "fast",
    maxOutputTokens: 512,
    maxCalls: 1,
    freeAllowancePerDay: 20,
  },
  "studio.brief.staff": {
    surface: "studio.brief.staff",
    billable: false,
    ruleBookKey: DEFAULT_RULE_BOOK_KEY,
    modelTier: "fast",
    maxOutputTokens: 1024,
    maxCalls: 1,
  },
  "studio.brief.client": {
    surface: "studio.brief.client",
    billable: true,
    ruleBookKey: DEFAULT_RULE_BOOK_KEY,
    modelTier: "standard",
    maxOutputTokens: 1024,
    maxCalls: 1,
  },
  "business.message.assist": {
    surface: "business.message.assist",
    billable: true,
    ruleBookKey: DEFAULT_RULE_BOOK_KEY,
    modelTier: "standard",
    maxOutputTokens: 600,
    maxCalls: 1,
  },
};

export function getSurfacePolicy(surface: AiSurfaceKey): AiSurfacePolicy | null {
  return AI_SURFACES[surface] ?? null;
}
