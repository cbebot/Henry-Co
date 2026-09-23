import "server-only";

/**
 * V3-42 — the advanced staff dashboards module (ARCHITECTURE §5.5).
 *
 * Read-only over V3-40 and V3-41 output. It produces NO score of its own: it
 * charts history, runs the transparent anomaly detector over the same observed
 * series it charts, derives advisory cards, and drills into the underlying rows.
 *
 * The per-role guarantee, stated once: every read uses the caller's RLS-scoped
 * staff client, so the database decides what a lens can see. `lenses.ts` hides
 * a lens the viewer may not use; `data.ts` would return nothing for it anyway.
 *
 * FLAG-DARK: the module does not exist for anyone until `predictive_dashboards`
 * is on. With the flag off it is absent from the rail AND the direct URL 404s,
 * because the staff host only renders modules whose role gate allows them.
 */

import { Gauge } from "lucide-react";
import type {
  NotificationCategory,
  PaletteEntry,
  RouteEntry,
  StaffDashboardModule,
} from "@henryco/dashboard-shell";
import type { StaffViewer } from "@henryco/auth/staff";
import { hasStaffAccessIn } from "@henryco/auth/staff";
import { getStaffIntelligenceCopy } from "@henryco/i18n/server";
import type { AppLocale } from "@henryco/i18n";
import { detectAnomaliesForSeries, firedAnomalies } from "@henryco/intelligence";
import { emitEvent } from "@henryco/observability/events";
import { PredictiveDashboard, type RecommendationAction } from "./dashboard";
import { loadLensSnapshot, loadRecommendationState, type IntelligenceSupabaseClient } from "./data";
import { LENSES, lensesForViewer, resolveLens, type LensCapabilities, type LensKey } from "./lenses";
import { buildRecommendationRail } from "./recommendations";
import { STAFF_INTELLIGENCE_PATH, staffIntelligenceEnabled } from "./flags";

export { PredictiveDashboard } from "./dashboard";
export { LENSES, LENS_KEYS, canViewLens, lensesForViewer, resolveLens } from "./lenses";
export type { LensKey, LensCapabilities } from "./lenses";
export {
  loadLensSnapshot,
  loadRecommendationState,
  visibleRecommendationKeys,
  type IntelligenceSupabaseClient,
  type LensSnapshot,
  type LensSeries,
  type DrillRow,
  type RecommendationStateRow,
} from "./data";
export { buildRecommendationRail } from "./recommendations";
export type { RecommendationAction } from "./dashboard";

export { STAFF_INTELLIGENCE_PATH, staffIntelligenceEnabled } from "./flags";

/**
 * The single place the auth lookup happens. `hasStaffAccessIn` is the TS mirror
 * of `is_staff_in('security')`; everything downstream consumes the boolean.
 */
export function lensCapabilitiesFor(viewer: StaffViewer): LensCapabilities {
  return { security: hasStaffAccessIn(viewer, "security") };
}

/** Convenience for hosts that want to show the trust lens only when permitted. */
export function viewerHasTrustLens(viewer: StaffViewer): boolean {
  return LENSES.trust.readsRestrictedRiskTables ? hasStaffAccessIn(viewer, "security") : true;
}

export const staffIntelligenceModule: StaffDashboardModule = {
  slug: "staff-intelligence",
  title: "Intelligence",
  description: "Trends, outliers and suggestions drawn from the platform's own history.",
  icon: () => <Gauge size={18} aria-hidden />,
  scope: { kind: "cross_division" },
  getEligibleViewer() {
    // Flag-dark first. Then: any staff member has at least one lens
    // (finance/support/moderation); the trust lens is filtered per viewer.
    return staffIntelligenceEnabled() ? "allowed" : "hidden";
  },
  getRoleGate(viewer) {
    if (!staffIntelligenceEnabled()) return null;
    return { kind: "allow", role: viewer.role };
  },
  getRoutes(): ReadonlyArray<RouteEntry> {
    return [{ path: "", kind: "home", label: "Intelligence" }];
  },
  async getCommandPaletteEntries(): Promise<ReadonlyArray<PaletteEntry>> {
    if (!staffIntelligenceEnabled()) return [];
    return [
      {
        id: "staff-intelligence.dashboard",
        source: "staff-intelligence",
        groupLabel: "Open" as const,
        label: "Open Intelligence dashboards",
        kicker: "Staff",
        href: STAFF_INTELLIGENCE_PATH,
        keywords: ["intelligence", "trend", "anomaly", "forecast", "recommendation", "dashboard"],
      },
    ];
  },
  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [
      {
        slug: "intelligence.anomaly",
        label: "Intelligence · anomaly",
        accent: "#C9A227",
        source: "staff-intelligence",
      },
    ];
  },
};

export type StaffIntelligencePageProps = {
  viewer: StaffViewer;
  supabase: IntelligenceSupabaseClient;
  /** Lens requested via the query string; validated against the viewer's roles. */
  requestedLens?: string | null;
  locale?: AppLocale;
  /**
   * A SERVER ACTION that records a human decision. Never applies anything.
   * Passed to the client component by reference — see dashboard.tsx.
   */
  onRecommendationAction: (key: string, lens: LensKey, action: RecommendationAction) => Promise<void>;
};

export async function StaffIntelligencePageServer({
  viewer,
  supabase,
  requestedLens,
  locale = "en",
  onRecommendationAction,
}: StaffIntelligencePageProps) {
  const copy = getStaffIntelligenceCopy(locale);
  // Resolve the viewer's capabilities HERE, in the server-only module, so the
  // lens policy itself stays pure (and therefore testable).
  const caps = lensCapabilitiesFor(viewer);
  // A forbidden or unknown lens resolves to one this viewer MAY see — never to
  // the requested value.
  const lens: LensKey = resolveLens(caps, requestedLens);
  const available = lensesForViewer(caps);

  const snapshot = await loadLensSnapshot(supabase, lens);

  // Outliers are hunted in what HAPPENED, never in a model's own projection.
  const anomalies = detectAnomaliesForSeries(
    snapshot.series.filter((s) => s.kind === "observed").map((s) => ({ series: s.key, points: s.points })),
  );
  const fired = firedAnomalies(anomalies);
  // Derive the candidate cards, then read persisted decisions for EXACTLY those
  // keys — a bounded, targeted read no pile of other rows can crowd out.
  const candidates = buildRecommendationRail({ lens, snapshot, anomalies: fired, state: [] });
  const state = await loadRecommendationState(
    supabase,
    lens,
    candidates.map((card) => card.key),
  );
  const cards = buildRecommendationRail({ lens, snapshot, anomalies: fired, state });

  // S5 telemetry. Lens + counts + series KEYS only — never a person, an entity
  // id, a score, or a card's rendered words.
  emitEvent({
    name: "henry.staff_dashboard.view.opened",
    classification: "user_action",
    outcome: "completed",
    actorId: viewer.user?.id,
    payload: { lens, cards: cards.length, anomalies: fired.length, series: snapshot.series.length },
  });
  if (fired.length > 0) {
    emitEvent({
      name: "henry.staff_dashboard.anomaly.shown",
      classification: "system_state",
      outcome: "completed",
      actorId: viewer.user?.id,
      payload: {
        lens,
        count: fired.length,
        alerts: fired.filter((a) => a.band === "alert").length,
        series: fired.map((a) => a.series),
      },
    });
  }

  return (
    <PredictiveDashboard
      copy={copy}
      lens={lens}
      availableLenses={available}
      basePath={STAFF_INTELLIGENCE_PATH}
      series={snapshot.series}
      anomalies={anomalies}
      cards={cards}
      drill={snapshot.drill}
      // Passed BY REFERENCE: a closure wrapping a server action does not
      // serialize across the server/client boundary.
      onAction={onRecommendationAction}
    />
  );
}

export default staffIntelligenceModule;
