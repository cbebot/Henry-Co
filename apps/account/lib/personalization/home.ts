import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import type { DashboardModule, ModuleSlug } from "@henryco/dashboard-shell";
import { computeHomeLayout } from "@henryco/dashboard-shell";
import type { SignalFeedItem, TypedSupabaseClient } from "@henryco/data";
import { getUserHomeLayout } from "@henryco/data/home-layout";
import type { LifecycleSnapshot } from "@henryco/lifecycle";
import { emitEvent, logger, persistEvent } from "@henryco/observability";
import { createAdminSupabase } from "@/lib/supabase";
import {
  filterHiddenWidgets,
  moduleRankFromLayout,
  pickRankedMetricsProjected,
  pickRemainingWidgetsProjected,
  type AnnotatedHomeWidget,
} from "@/lib/smart-home/widgets";
import {
  deriveBlockedModules,
  deriveModuleDefaultWeights,
  deriveSignalScores,
} from "./signal-scores";
import { resolvePersonalizationConsentForViewer } from "./consent";

const personalizationLogger = logger.child({ namespace: "personalization.home" });

export type PersonalizedHome = {
  rankedMetrics: ReadonlyArray<AnnotatedHomeWidget>;
  restWidgets: ReadonlyArray<AnnotatedHomeWidget>;
  /** Ordered ModuleSlugs, for the layout-computed telemetry + debugging. */
  orderedModules: ReadonlyArray<ModuleSlug>;
};

/**
 * V3-34 — apply the deterministic home-layout projection to the collected
 * widgets. Called ONLY when the `personalization_home` flag is on; every read
 * is best-effort so a failure degrades to the caller's default DASH ordering
 * (never a broken home). No AI, no wallet, no cross-user read: the layout and
 * consent reads are RLS-scoped to the viewer via the injected authenticated
 * client, and signal scores come from the viewer's own feed.
 */
export async function resolvePersonalizedHome(params: {
  viewer: UnifiedViewer;
  /** The viewer's AUTHENTICATED (RLS) client — never the admin client. */
  client: TypedSupabaseClient;
  modules: ReadonlyArray<DashboardModule>;
  widgets: ReadonlyArray<AnnotatedHomeWidget>;
  signals: ReadonlyArray<SignalFeedItem>;
  lifecycle: LifecycleSnapshot | null;
  device: "mobile" | "desktop";
  now: string;
}): Promise<PersonalizedHome | null> {
  const { viewer, client, modules, widgets, signals, lifecycle, device, now } =
    params;

  try {
    const known = new Set<ModuleSlug>(modules.map((m) => m.slug));

    const [layout, consentAllowed] = await Promise.all([
      getUserHomeLayout(client, viewer, "account").catch((e) => {
        personalizationLogger.warn("layout_read_failed", {
          viewerId: viewer.user.id,
          error: e instanceof Error ? e.message : String(e),
        });
        return null;
      }),
      resolvePersonalizationConsentForViewer(client, viewer).catch(() => false),
    ]);

    // Consent gate: behavioural signals only feed the projection with consent.
    // Without it the tail falls back to config + default weight (no inference).
    const signalScores = consentAllowed
      ? deriveSignalScores(signals, known)
      : new Map<ModuleSlug, number>();
    const blocked = deriveBlockedModules(signals, lifecycle, known);
    const defaultWeights = deriveModuleDefaultWeights(widgets);

    const result = computeHomeLayout({
      registeredModules: modules.map((m) => ({
        slug: m.slug,
        defaultWeight: defaultWeights.get(m.slug) ?? 0,
        hasOpenBlocker: blocked.has(m.slug),
      })),
      signalScores,
      preference: layout
        ? {
            desktopOrder: layout.desktopModuleOrder as ModuleSlug[],
            mobileOrder: layout.mobileModuleOrder as ModuleSlug[],
            hidden: layout.hiddenModules as ModuleSlug[],
            pinned: layout.pinnedModules as ModuleSlug[],
          }
        : null,
      device,
      now,
    });

    const moduleRank = moduleRankFromLayout(result);
    const visibleWidgets = filterHiddenWidgets(widgets, result.hidden);
    const rankedMetrics = pickRankedMetricsProjected(visibleWidgets, moduleRank, 6);
    const restWidgets = pickRemainingWidgetsProjected(
      visibleWidgets,
      rankedMetrics,
      moduleRank,
    );

    // S6 telemetry — aggregate-only, no per-user PII beyond counts. The score
    // never leaves the server; we emit ordered-module COUNT, not the scores.
    const payload = {
      surface: "account" as const,
      module_count: result.ordered.length,
      hidden_count: result.hidden.length,
      pinned_count: layout?.pinnedModules.length ?? 0,
      consent_allowed: consentAllowed,
      device,
      has_layout: layout !== null,
      outcome: "completed" as const,
    };
    emitEvent({
      name: "henry.personalization.layout.computed",
      classification: "system_state",
      outcome: "completed",
      actorId: viewer.user.id,
      payload,
      logger: personalizationLogger,
    });
    void persistEvent({
      supabase: createAdminSupabase(),
      name: "henry.personalization.layout.computed",
      actorId: viewer.user.id,
      payload,
    });

    return {
      rankedMetrics,
      restWidgets,
      orderedModules: result.ordered.map((entry) => entry.slug),
    };
  } catch (e) {
    // Any unexpected failure → fall back to the default home (return null).
    personalizationLogger.warn("resolve_personalized_home_failed", {
      viewerId: viewer.user.id,
      error: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}
