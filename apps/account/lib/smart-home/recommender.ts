import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import type { DashboardModule } from "@henryco/dashboard-shell";
import type { LifecycleSnapshot } from "@henryco/lifecycle";
import type { SignalFeedItem } from "@henryco/data";
import { divisionLabel } from "@/lib/format";

/**
 * One recommendation surfaced in the Next-Best Actions strip. The
 * Smart Home renders up to 3 of these as compact CTA tiles.
 *
 * `confidence` is a string label not a numeric score, on purpose:
 * the deterministic ranker doesn't have a probability — it has a
 * tier. "Likely useful" is more honest than "0.78 confidence".
 */
export type NextBestAction = {
  id: string;
  source: "lifecycle" | "signal" | "module-empty";
  kicker: string;
  label: string;
  href: string;
  reason: string;
  confidence: "high" | "medium" | "low";
};

/**
 * The deterministic Next-Best Actions ranker.
 *
 * Inputs (all already on disk for the current request):
 *   - `lifecycle.actionables` — pre-ranked by `@henryco/lifecycle`
 *   - the top N signals from `getSignalFeed`
 *   - the eligible modules' `getEmptyTeaching(viewer)` outputs
 *
 * Output: up to 3 actions, deduped by `href`, sorted by tier-aware
 * merit. Within a tier, sources keep their natural pre-ranked order.
 *
 * Tier model (lower = surfaced first):
 *
 *   0 — Security signals. Time-sensitive: fraud alerts, wallet
 *       security challenges, account compromise. Always beat lifecycle
 *       items because the cost of missing one is asymmetric.
 *   1 — Lifecycle critical. Blocking actionables: KYC required,
 *       verification expired, payout blocked.
 *   2 — Lifecycle high. Important but not blocking: incomplete
 *       profile, dormant subscription, referral about to expire.
 *   3 — Module empty-teachings. Onboarding floor for first-run users.
 *
 * Why tier-aware (not source-priority loop): the previous
 * implementation walked source-by-source, filling slots until the
 * limit hit. With 8 lifecycle "high" actionables and 1 security
 * signal, a viewer would see 3 lifecycle items and never the security
 * signal — exactly the wrong call.
 *
 * This is the "floor" recommender — it ships unconditionally so the
 * Smart Home is never empty for an active user. When the
 * `flags.intelligence_recommendations` flag is set, the caller can
 * SUPERSEDE these with the richer `@henryco/intelligence` recommender
 * (V3 territory). The contract — `ReadonlyArray<NextBestAction>` —
 * stays stable so the UI shape is invariant.
 */
export type RecommenderInputs = {
  viewer: UnifiedViewer;
  lifecycle: LifecycleSnapshot | null;
  signals: ReadonlyArray<SignalFeedItem>;
  emptyTeachings: ReadonlyArray<{
    module: DashboardModule;
    teaching: { headline: string; action?: { label: string; href: string } | undefined };
  }>;
  limit?: number;
};

const TIER_SECURITY_SIGNAL = 0;
const TIER_LIFECYCLE_CRITICAL = 1;
const TIER_LIFECYCLE_HIGH = 2;
const TIER_MODULE_EMPTY = 3;

type Candidate = NextBestAction & { tier: number; arrival: number };

export function rankNextBestActions(input: RecommenderInputs): ReadonlyArray<NextBestAction> {
  const limit = input.limit ?? 3;
  const candidates: Candidate[] = [];
  let arrival = 0;

  // Collect every candidate from every source. Each candidate carries
  // its tier (drives sort order) and `arrival` index (preserves the
  // source's natural pre-ranked order as the within-tier tiebreak).

  // Lifecycle actionables — already pre-ranked inside @henryco/lifecycle.
  for (const a of input.lifecycle?.actionables ?? []) {
    if (a.priority !== "critical" && a.priority !== "high") continue;
    if (!a.actionUrl) continue;
    candidates.push({
      id: `lifecycle:${a.pillar}:${a.stage}`,
      source: "lifecycle",
      kicker: a.title,
      label: a.actionLabel || "Continue",
      href: a.actionUrl,
      reason: a.detail,
      confidence: a.priority === "critical" ? "high" : "medium",
      tier: a.priority === "critical" ? TIER_LIFECYCLE_CRITICAL : TIER_LIFECYCLE_HIGH,
      arrival: arrival++,
    });
  }

  // Security signals — every signal feed item the SQL function emits
  // as `priority='security'` that hasn't already been promoted to the
  // Attention panel by the consumer. These can slip past lifecycle
  // derivation (e.g., a wallet challenge created from a webhook
  // before the lifecycle collector last ran).
  for (const s of input.signals) {
    if (s.priority !== "security") continue;
    if (!s.actionUrl) continue;
    candidates.push({
      id: `signal:${s.id}`,
      source: "signal",
      kicker: divisionLabel(s.division),
      label: s.title,
      href: s.actionUrl,
      reason: s.body ?? "Review and confirm.",
      confidence: "high",
      tier: TIER_SECURITY_SIGNAL,
      arrival: arrival++,
    });
  }

  // Module empty-teachings — each registered division's first-step CTA
  // for the brand-new viewer. Carries the lowest tier so it never
  // crowds out a real signal.
  for (const t of input.emptyTeachings) {
    if (!t.teaching.action) continue;
    candidates.push({
      id: `module-empty:${t.module.slug}`,
      source: "module-empty",
      kicker: t.module.title,
      label: t.teaching.action.label,
      href: t.teaching.action.href,
      reason: t.teaching.headline,
      confidence: "low",
      tier: TIER_MODULE_EMPTY,
      arrival: arrival++,
    });
  }

  // Sort: tier ascending (security signals first), then arrival order
  // within tier (preserves the source's pre-ranked order as the calm
  // tiebreak).
  candidates.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return a.arrival - b.arrival;
  });

  // Dedupe by href — two sources may point at the same destination
  // (e.g., the lifecycle collector and a notification both pointing to
  // /verification). The higher-tier candidate wins because it sorts
  // first.
  const out: NextBestAction[] = [];
  const seenHrefs = new Set<string>();
  for (const c of candidates) {
    if (out.length >= limit) break;
    if (seenHrefs.has(c.href)) continue;
    seenHrefs.add(c.href);
    // Project the public contract — drop the internal sort fields so
    // they don't leak through JSON serialization or React-prop diffs.
    out.push({
      id: c.id,
      source: c.source,
      kicker: c.kicker,
      label: c.label,
      href: c.href,
      reason: c.reason,
      confidence: c.confidence,
    });
  }

  return out;
}
