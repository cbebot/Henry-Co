import "server-only";

/**
 * V3-36 — the account adapter that SUPERSEDES the deterministic Next-Best
 * Actions floor with the cross-division `@henryco/intelligence` engine, exactly
 * as `recommender.ts` reserves (comment lines 55-60), behind
 * `flags.intelligence_recommendations`.
 *
 * It preserves the `NextBestAction[]` UI contract, so the Register-L
 * `NextBestActions` surface is invariant. Every guarantee is upheld here:
 *
 *   - FLOOR INTACT: the flag off, an error, or a timeout all fall straight back
 *     to `rankNextBestActions` (the caller does this) — this returns null.
 *   - CONSENT-GATED: cross-division profiling candidates run ONLY when the
 *     account-authoritative consent is TRUE; otherwise only local defaults.
 *   - NO WALLET DEBIT: the AI re-rank rides `intelligence.recommendations.rerank`
 *     — a `billable:false` surface via `noBillingPort` (no wallet interaction of
 *     any kind), additionally gated on the company free-AI daily budget.
 *   - PROVIDER-OPAQUE: the re-rank returns only an ORDERING of ids; no provider
 *     or model string is ever read or surfaced.
 *   - VIEWER-SCOPED: candidates are built ONLY from data already fetched for the
 *     current viewer (lifecycle, signals) — the engine has no table access.
 */

import { randomUUID } from "node:crypto";
import type { UnifiedViewer } from "@henryco/auth";
import type { TypedSupabaseClient } from "@henryco/data";
import type { SignalFeedItem } from "@henryco/data";
import type { LifecycleSnapshot } from "@henryco/lifecycle";
import type { HenryDivision, Recommendation } from "@henryco/intelligence";
import {
  generateRecommendations,
  type CandidateReader,
  type RecommendationCandidate,
} from "@henryco/intelligence";
import { runAiTask, noBillingPort, estimateFreeTurnCostKobo } from "@henryco/ai-gateway/server";
import { emitEvent } from "@henryco/observability/events";
import { divisionLabel } from "@/lib/format";
import { resolvePersonalizationConsentForViewer } from "@/lib/personalization/consent";
import { checkFreeBudget, recordFreeSpend } from "@/lib/intelligence/budget-guard";
import type { NextBestAction } from "./recommender";

type AdapterInput = {
  viewer: UnifiedViewer;
  client: TypedSupabaseClient;
  lifecycle: LifecycleSnapshot | null;
  signals: ReadonlyArray<SignalFeedItem>;
  limit?: number;
  aiEnabled?: boolean;
};

/** Static, deterministic cross-division complements (data, not bespoke code —
 *  ARCHITECTURE §7). A bridge is offered only away from a division the viewer
 *  is already active in, and only under consent. */
const CROSS_DIVISION_BRIDGE: Partial<Record<HenryDivision, { to: HenryDivision; href: string; label: string }>> = {
  marketplace: { to: "logistics", href: "/logistics", label: "Arrange delivery" },
  care: { to: "marketplace", href: "/marketplace", label: "Shop home essentials" },
  learn: { to: "jobs", href: "/jobs", label: "Explore roles for your new skills" },
  jobs: { to: "learn", href: "/learn", label: "Upskill for the roles you want" },
  property: { to: "logistics", href: "/logistics", label: "Plan your move" },
  studio: { to: "marketplace", href: "/marketplace", label: "Source what your project needs" },
};

/** LOCAL candidates — the deterministic floor, always admitted (no profiling). */
function buildLocalReader(input: AdapterInput): CandidateReader {
  return async () => {
    const rows: RecommendationCandidate[] = [];
    // Security signals — never profiling, always surfaced first.
    for (const s of input.signals) {
      if (s.priority !== "security" || !s.actionUrl) continue;
      rows.push({
        id: `signal:${s.id}`,
        division: (s.division as HenryDivision) ?? "account",
        title: s.title,
        description: s.body ?? undefined,
        ctaHref: s.actionUrl,
        ctaLabel: s.title,
        reasonCodes: ["recent_activity"],
        confidence: "high",
        score: 1.0,
        tier: "local",
        origin: "signal",
      });
    }
    // Lifecycle actionables (critical/high) — blocking/important first steps.
    for (const a of input.lifecycle?.actionables ?? []) {
      if ((a.priority !== "critical" && a.priority !== "high") || !a.actionUrl) continue;
      const confidence = a.priority === "critical" ? "high" : "medium";
      rows.push({
        id: `lifecycle:${a.pillar}:${a.stage}`,
        division: "account",
        title: a.title,
        description: a.detail,
        ctaHref: a.actionUrl,
        ctaLabel: a.actionLabel || "Continue",
        reasonCodes: ["lifecycle_stage_fit"],
        confidence,
        score: a.priority === "critical" ? 0.8 : 0.55,
        tier: "local",
        origin: "lifecycle",
      });
    }
    return rows;
  };
}

/** PROFILING candidates — cross-division bridges inferred from the viewer's
 *  recent-division mix. Admitted ONLY under consent (the engine gates the
 *  whole reader). */
function buildProfilingReader(input: AdapterInput): CandidateReader {
  return async () => {
    const recentDivisions = new Set<HenryDivision>();
    for (const s of input.signals) {
      if (s.division) recentDivisions.add(s.division as HenryDivision);
    }
    const rows: RecommendationCandidate[] = [];
    for (const from of recentDivisions) {
      const bridge = CROSS_DIVISION_BRIDGE[from];
      if (!bridge) continue;
      if (recentDivisions.has(bridge.to)) continue; // already active there — no bridge
      rows.push({
        id: `bridge:${from}:${bridge.to}`,
        division: bridge.to,
        title: bridge.label,
        ctaHref: bridge.href,
        ctaLabel: bridge.label,
        reasonCodes: ["cross_division_bridge"],
        confidence: "medium",
        score: 0.4,
        tier: "profiling",
        origin: "cross-division-bridge",
      });
    }
    return rows;
  };
}

/**
 * The governed-AI re-rank. Non-billable, budget-gated, provider-opaque, and it
 * can only reorder ids the engine validates as a permutation of the floor.
 * Returns undefined (⇒ no re-rank) whenever AI is off, the budget is exhausted,
 * or anything fails.
 */
function buildRerank(input: AdapterInput) {
  if (input.aiEnabled === false) return undefined;
  return async (items: Recommendation[]): Promise<Recommendation[]> => {
    // Company free-AI daily ceiling — platform-invoked spend stays bounded.
    const budget = await checkFreeBudget(false).catch(() => null);
    if (!budget || budget.decision === "exhausted") return items;

    const menu = items.map((item, i) => `${i}. id=${item.id} · ${item.title}`).join("\n");
    const prompt =
      `Order these home suggestions for the person by likely usefulness right now. ` +
      `Reply with ONLY a JSON array of the id strings in your preferred order — every id exactly once, nothing else.\n${menu}`;
    const estimate = estimateFreeTurnCostKobo({ surface: "intelligence.recommendations.rerank", inputText: prompt });
    try {
      const result = await runAiTask(
        {
          surface: "intelligence.recommendations.rerank",
          actorId: input.viewer.user.id,
          input: { messages: [{ role: "user", content: prompt }] },
          idempotencyKey: randomUUID(),
        },
        { billing: noBillingPort },
      );
      await recordFreeSpend(estimate);
      if (!result.ok) return items;
      const order = parseIdOrder(result.value.output);
      if (!order) return items;
      const byId = new Map(items.map((item) => [item.id, item]));
      const reordered = order.map((id) => byId.get(id)).filter((x): x is Recommendation => Boolean(x));
      // The engine's isPermutation is the real gate; return the reordering and
      // let it validate (a bad/partial order is discarded there — floor stands).
      return reordered.length === items.length ? reordered : items;
    } catch {
      await recordFreeSpend(estimate).catch(() => undefined);
      return items;
    }
  };
}

/** Extract a JSON string array of ids from the model output; provider-opaque
 *  (we read ONLY the ordering — no provider/model field is ever touched). */
function parseIdOrder(output: unknown): string[] | null {
  const text = typeof output === "string" ? output : JSON.stringify(output ?? "");
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const arr = JSON.parse(match[0]);
    if (!Array.isArray(arr)) return null;
    const ids = arr.filter((x): x is string => typeof x === "string");
    return ids.length > 0 ? ids : null;
  } catch {
    return null;
  }
}

function toNextBestAction(rec: Recommendation): NextBestAction {
  return {
    id: `rec:${rec.id}`,
    source: "signal",
    kicker: divisionLabel(rec.division),
    label: rec.ctaLabel,
    href: rec.ctaHref,
    reason: rec.description || rec.title,
    confidence: rec.confidence,
  };
}

/**
 * Produce the superseding recommendations, or NULL to fall back to the
 * deterministic floor (`rankNextBestActions`). Callers gate this on
 * `flags.intelligence_recommendations` and wrap it in their own timeout.
 */
export async function resolveRecommendedActions(input: AdapterInput): Promise<ReadonlyArray<NextBestAction> | null> {
  try {
    const consentAllowed = await resolvePersonalizationConsentForViewer(input.client, input.viewer).catch(() => false);
    const result = await generateRecommendations({
      viewerId: input.viewer.user.id,
      consentAllowed,
      readers: {
        local: [buildLocalReader(input)],
        profiling: [buildProfilingReader(input)],
      },
      rerank: buildRerank(input),
      limit: input.limit ?? 3,
    });
    if (result.recommendations.length === 0) return null;
    // Telemetry: counts + booleans only — never per-item content or a score.
    emitEvent({
      name: "henry.personalization.recommendations.computed",
      classification: "system_state",
      outcome: "completed",
      actorId: input.viewer.user.id,
      payload: {
        count: result.recommendations.length,
        profiled: result.profiled,
        ai_applied: result.aiApplied,
      },
    });
    return result.recommendations.map(toNextBestAction);
  } catch {
    // Any failure ⇒ the caller uses the deterministic floor.
    return null;
  }
}
