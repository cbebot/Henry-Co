import type { AiModelTier } from "@henryco/pricing";

/** A registered AI entry point. The FREE/METERED split is the owner's model: free for
 *  company-critical tasks, metered for personal/business tasks. */
export type AiSurfaceKey =
  | "marketplace.listing.draft" // Pass 1 — METERED (a seller's business task)
  | "marketplace.listing.verify" // Pass 2 — METERED, deep tier (the trust review; see docs/v3/ai/PASS-2-LISTING-VERIFY.md)
  | "intelligence.chat" // V3-28 — METERED (the governed Henry Onyx Intelligence chat; a personal task)
  | "support.message.assist" // later — FREE (company-critical)
  | "account.check.assist" // later — FREE
  | "studio.brief.staff" // later — FREE/internal (the existing staff copilot; NOT billed)
  | "studio.brief.client" // later — METERED (client-end briefs)
  | "studio.brief.coach" // V3-12 — FREE/internal: the multi-turn "talk it through" brief coach
  | "business.message.assist" // later — METERED
  // Company-wide metered surfaces (one brain, every division) — draft (standard tier) +
  // the deep-tier trust review. The wallet + rail are shared; each division just mounts.
  | "jobs.posting.draft" // METERED — an employer drafts a job post
  | "jobs.posting.verify" // METERED, deep — anti-scam/fake-job trust review before a post goes live
  | "learn.course.draft" // METERED — an educator drafts a course
  | "learn.course.verify" // METERED, deep — verify a course is genuine, on-standard, safe
  | "property.listing.draft" // METERED — an agent drafts a property listing
  | "property.listing.verify"; // METERED, deep — verify a property listing is honest, real, safe

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
  // V3-28 — the governed Henry Onyx Intelligence chat. A personal conversational task, so
  // METERED per turn at the standard tier; the topic guard (declines competing-brand /
  // anti-company) lives in the system prompt. Dark until mounted.
  "intelligence.chat": {
    surface: "intelligence.chat",
    billable: true,
    ruleBookKey: DEFAULT_RULE_BOOK_KEY,
    modelTier: "standard",
    maxOutputTokens: 700,
    maxCalls: 1,
  },
  // Intelligence Live — the FREE general-support brain behind the launcher on every
  // division page. Conversational (multi-turn), emits the {reply, navigate, handoff}
  // envelope. Fast tier so free support stays cheap; a generous daily allowance so a
  // real conversation never hits the cap mid-thread.
  "support.message.assist": {
    surface: "support.message.assist",
    billable: false,
    ruleBookKey: DEFAULT_RULE_BOOK_KEY,
    modelTier: "fast",
    maxOutputTokens: 800,
    maxCalls: 1,
    freeAllowancePerDay: 120,
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
    // Gateway backstop behind studio's own 6-layer anti-abuse (per-session/account/IP/system caps).
    freeAllowancePerDay: 40,
  },
  "studio.brief.client": {
    surface: "studio.brief.client",
    billable: true,
    ruleBookKey: DEFAULT_RULE_BOOK_KEY,
    modelTier: "standard",
    maxOutputTokens: 1024,
    maxCalls: 1,
  },
  "studio.brief.coach": {
    surface: "studio.brief.coach",
    billable: false,
    ruleBookKey: DEFAULT_RULE_BOOK_KEY,
    modelTier: "fast",
    maxOutputTokens: 512,
    maxCalls: 1,
    // The cost guard now that the coach NEVER degrades to canned replies: per-session daily cap
    // (the action passes a stable session-scoped actorId) on top of the 12-turn ceiling.
    // Sized for enthusiastic REAL use (owner report: honest heavy testing was getting declined) —
    // fast-tier 512-token turns are cheap; scripts are stopped by the burst/IP/system brakes.
    freeAllowancePerDay: 200,
  },
  "business.message.assist": {
    surface: "business.message.assist",
    billable: true,
    ruleBookKey: DEFAULT_RULE_BOOK_KEY,
    modelTier: "standard",
    maxOutputTokens: 600,
    maxCalls: 1,
  },
  // ---- Company-wide draft + trust-review surfaces (METERED; mounted per division) ----
  "jobs.posting.draft": {
    surface: "jobs.posting.draft",
    billable: true,
    ruleBookKey: DEFAULT_RULE_BOOK_KEY,
    modelTier: "standard",
    maxOutputTokens: 1024,
    maxCalls: 1,
  },
  "jobs.posting.verify": {
    surface: "jobs.posting.verify",
    billable: true,
    ruleBookKey: DEFAULT_RULE_BOOK_KEY,
    modelTier: "deep",
    maxOutputTokens: 1500,
    maxCalls: 1,
  },
  "learn.course.draft": {
    surface: "learn.course.draft",
    billable: true,
    ruleBookKey: DEFAULT_RULE_BOOK_KEY,
    modelTier: "standard",
    maxOutputTokens: 1024,
    maxCalls: 1,
  },
  "learn.course.verify": {
    surface: "learn.course.verify",
    billable: true,
    ruleBookKey: DEFAULT_RULE_BOOK_KEY,
    modelTier: "deep",
    maxOutputTokens: 1500,
    maxCalls: 1,
  },
  "property.listing.draft": {
    surface: "property.listing.draft",
    billable: true,
    ruleBookKey: DEFAULT_RULE_BOOK_KEY,
    modelTier: "standard",
    maxOutputTokens: 1024,
    maxCalls: 1,
  },
  "property.listing.verify": {
    surface: "property.listing.verify",
    billable: true,
    ruleBookKey: DEFAULT_RULE_BOOK_KEY,
    modelTier: "deep",
    maxOutputTokens: 1500,
    maxCalls: 1,
  },
};

export function getSurfacePolicy(surface: AiSurfaceKey): AiSurfacePolicy | null {
  return AI_SURFACES[surface] ?? null;
}
