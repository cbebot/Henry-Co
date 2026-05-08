import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import type { DashboardModule } from "@henryco/dashboard-shell";
import type { LifecycleSnapshot } from "@henryco/lifecycle";
import type { SignalFeedItem } from "@henryco/data";

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
 * Output: up to 3 actions, deduped by `href`, ordered by source
 * priority (lifecycle > signal > module-empty) then by confidence.
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

export function rankNextBestActions(input: RecommenderInputs): ReadonlyArray<NextBestAction> {
  const limit = input.limit ?? 3;
  const out: NextBestAction[] = [];
  const seenHrefs = new Set<string>();

  const accept = (action: NextBestAction): void => {
    if (seenHrefs.has(action.href)) return;
    seenHrefs.add(action.href);
    out.push(action);
  };

  // 1. Lifecycle actionables (pre-ranked by @henryco/lifecycle).
  for (const a of input.lifecycle?.actionables ?? []) {
    if (out.length >= limit) break;
    if (a.priority !== "critical" && a.priority !== "high") continue;
    if (!a.actionUrl) continue;
    accept({
      id: `lifecycle:${a.pillar}:${a.stage}`,
      source: "lifecycle",
      kicker: a.title,
      label: a.actionLabel || "Continue",
      href: a.actionUrl,
      reason: a.detail,
      confidence: a.priority === "critical" ? "high" : "medium",
    });
  }

  // 2. Security-priority signals not yet in the Attention panel.
  //    These exist when a security signal has slipped past lifecycle
  //    derivation — e.g., a wallet challenge created from a webhook
  //    before the lifecycle collector last ran.
  for (const s of input.signals) {
    if (out.length >= limit) break;
    if (s.priority !== "security") continue;
    if (!s.actionUrl) continue;
    accept({
      id: `signal:${s.id}`,
      source: "signal",
      kicker: divisionToKicker(s.division),
      label: s.title,
      href: s.actionUrl,
      reason: s.body ?? "Review and confirm.",
      confidence: "high",
    });
  }

  // 3. Module empty-teachings — surface a module's "next-best
  //    onboarding action" when the module has nothing to render. This
  //    is what a brand-new account sees: each registered division
  //    teaches its own first-step CTA.
  for (const t of input.emptyTeachings) {
    if (out.length >= limit) break;
    if (!t.teaching.action) continue;
    accept({
      id: `module-empty:${t.module.slug}`,
      source: "module-empty",
      kicker: t.module.title,
      label: t.teaching.action.label,
      href: t.teaching.action.href,
      reason: t.teaching.headline,
      confidence: "low",
    });
  }

  return out;
}

function divisionToKicker(division: string): string {
  // Reuse the SignalCard kicker format — the division name as a
  // SHORT label. The shell's divisionLabel() lives in
  // apps/account/lib/format.ts; keep this helper local to avoid
  // pulling the format module into a server-only library.
  if (!division) return "Signal";
  return division.charAt(0).toUpperCase() + division.slice(1);
}
