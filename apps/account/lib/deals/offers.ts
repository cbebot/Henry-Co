import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import { DEAL_FAIRNESS } from "@henryco/config";
import {
  createDataAdminClient,
  listLiveDeals,
  recordDealImpressions,
  type SignalFeedItem,
  type TypedSupabaseClient,
} from "@henryco/data";
import { selectDeals, type DealCandidate, type DealOffer } from "@henryco/intelligence";
import { emitEvent, logger, persistEvent } from "@henryco/observability";
import { createAdminSupabase } from "@/lib/supabase";
import { resolvePersonalizationConsentForViewer } from "@/lib/personalization/consent";
import {
  deriveRecentDealDivisions,
  floorCandidate,
  targetedCandidate,
} from "./offers-core";

const dealsLogger = logger.child({ namespace: "deals.rail" });

export type DealsRailModel = {
  offers: ReadonlyArray<DealOffer>;
  /** Telemetry only — whether consent-gated targeting contributed. */
  targeted: boolean;
};

/**
 * V3-35 — resolve the account-home deals rail. Called ONLY when the
 * `personalization_deals` flag is on; every step is best-effort so any failure
 * (including the deals tables being ABSENT on prod pre-apply) degrades to
 * null — the home renders without the rail, never broken.
 *
 * Guarantees upheld here:
 *   - DETERMINISTIC FLOOR: the floor reader is the untargeted public catalog;
 *     selection/order comes from the pure `selectDeals` engine (no AI, no
 *     wallet, no dispatch anywhere on this path — statically proven by
 *     guardrails.test.ts).
 *   - CONSENT FAILS SAFE: the V3-34 account-authoritative helper resolves the
 *     profiling consent; unknown/error ⇒ FALSE ⇒ the targeted reader NEVER
 *     runs (PRIVACY-NDPR §2; prod-actual: the consent objects are themselves
 *     merged-unapplied, so the read error path IS the launch path).
 *   - VIEWER-SCOPED: the only viewer-derived signal is the viewer's own
 *     signal-feed division mix; scores never serialize past the engine.
 *   - IMPRESSIONS: batched, service-role, one insert per render, deduped +
 *     hard-capped — fire-and-forget, never blocks the render.
 */
export async function resolveDealsRail(params: {
  viewer: UnifiedViewer;
  /** The viewer's AUTHENTICATED (RLS) client — used ONLY for the consent read. */
  client: TypedSupabaseClient;
  signals: ReadonlyArray<SignalFeedItem>;
  limit?: number;
}): Promise<DealsRailModel | null> {
  const { viewer, client, signals } = params;
  try {
    const admin = createDataAdminClient();
    const nowMs = Date.now();
    const recentDivisions = deriveRecentDealDivisions(signals);

    const consentAllowed = await resolvePersonalizationConsentForViewer(
      client,
      viewer,
    ).catch(() => false);

    const result = await selectDeals({
      viewerId: viewer.user.id,
      consentAllowed,
      readers: {
        floor: [
          async () =>
            (await listLiveDeals(admin, { visibility: "public", limit: 24 }))
              .map((row) => floorCandidate(row, nowMs))
              .filter((candidate): candidate is DealCandidate => candidate !== null),
        ],
        targeted: [
          async () =>
            (
              await listLiveDeals(admin, {
                visibility: "public_and_targeted",
                limit: 24,
              })
            )
              .map((row) => targetedCandidate(row, recentDivisions, nowMs))
              .filter((candidate): candidate is DealCandidate => candidate !== null),
        ],
      },
      limit: params.limit ?? 4,
      maxConsecutivePerCreator: DEAL_FAIRNESS.maxConsecutivePerCreator,
    });

    if (result.deals.length === 0) return null;

    // Fairness-audit ledger: one batched service-role insert for this render.
    // Best-effort (absent table pre-apply ⇒ 0) and never awaited into the render.
    void recordDealImpressions(
      admin,
      result.deals.map((offer) => ({
        dealId: offer.id,
        userId: viewer.user.id,
        surface: "home_module" as const,
      })),
    ).catch(() => 0);

    // Telemetry: counts + booleans only — never titles, scores, or reasons.
    const payload = {
      surface: "home_module" as const,
      count: result.deals.length,
      targeted: result.targeted,
      consent_allowed: consentAllowed,
      outcome: "completed" as const,
    };
    emitEvent({
      name: "henry.deal.offer.impressed",
      classification: "system_state",
      outcome: "completed",
      actorId: viewer.user.id,
      payload,
      logger: dealsLogger,
    });
    void persistEvent({
      supabase: createAdminSupabase(),
      name: "henry.deal.offer.impressed",
      actorId: viewer.user.id,
      payload,
    });

    return { offers: result.deals, targeted: result.targeted };
  } catch (e) {
    // Any unexpected failure ⇒ the home renders without the rail.
    dealsLogger.warn("resolve_deals_rail_failed", {
      viewerId: viewer.user.id,
      error: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}
