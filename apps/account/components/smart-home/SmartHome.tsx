import "server-only";

import { countActiveSavedItems } from "@henryco/cart-saved-items/server";
import { getEligibleModules } from "@henryco/dashboard-shell";
import type { SignalFeedCursor, SignalFeedItem, TypedSupabaseClient } from "@henryco/data";
import { logger } from "@henryco/observability";
import { parseHenryFeatureFlags, isFlagEnabled } from "@henryco/intelligence";
import { getCachedSignalFeed } from "@/lib/smart-home/signal-feed-cache";
import type { UnifiedViewer } from "@henryco/auth";
import {
  collectAndPersistLifecycleSnapshot,
} from "@/lib/lifecycle/collector";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { withTimeout } from "@/lib/with-timeout";
import {
  collectHomeWidgets,
  pickRankedMetrics,
  pickRemainingWidgets,
} from "@/lib/smart-home/widgets";
import { resolvePersonalizedHome } from "@/lib/personalization/home";
import { detectDevice } from "@/lib/personalization/device";
import { rankNextBestActions } from "@/lib/smart-home/recommender";
import { resolveRecommendedActions } from "@/lib/smart-home/recommendations-adapter";
import { AttentionPanel } from "./AttentionPanel";
import { ModuleWidgetGrid } from "./ModuleWidgetGrid";
import { NextBestActions } from "./NextBestActions";
import { RankedMetricStrip } from "./RankedMetricStrip";
import { EmptyStateCtaTracker } from "./EmptyStateCtaTracker";
import { SignalFeed } from "./SignalFeed";
import { SmartHomeEmpty } from "./SmartHomeEmpty";
import { RealtimeStatusOrb } from "./RealtimeStatusOrb";
import { SmartHomeHero } from "./SmartHomeHero";

const smartHomeLogger = logger.child({ namespace: "smart-home" });

/**
 * SmartHome — the WorkspaceSlot's default landing.
 *
 * Composes (in render order):
 *   1. SmartHomeHero         — editorial hero band (greeting + stat + tiles)
 *   2. live-status row       — realtime-health orb under the hero
 *   3. AttentionPanel        — security/urgent signals + lifecycle inline
 *   4. NextBestActions       — server-deterministic ranker, up to 3 CTAs
 *   5. RankedMetricStrip     — top-bucket sm/md widgets across modules
 *   6. SignalFeed            — N=50 cursor-paginated, 30s cached, email-dim
 *   7. ModuleWidgetGrid      — remaining widgets packed by size + weight
 *   8. SmartHomeEmpty        — typographic empty state if all of the above are dry
 *
 * Anti-patterns closed:
 *   #4  decorative tiles  — every block renders real data; if absent, fallthrough.
 *   #6  hardcoded division row — `getEligibleModules(viewer)` everywhere.
 *   #16 cartoon empty states — `SmartHomeEmpty` is typographic.
 *   #17 patronizing copy — header is content-first.
 *   #18 bare metrics — `MetricCard` enforces `comparison|trend` at the type level.
 *   #19 role-agnostic UI — composition keys off `viewer.kind` via the registry.
 *
 * The shell composes; modules cannot rank against each other (audit §D.4).
 */
export type SmartHomeProps = {
  viewer: UnifiedViewer;
  cursor: SignalFeedCursor | null;
  prevHref: string | null;
};

export async function SmartHome({ viewer, cursor, prevHref }: SmartHomeProps) {
  const modules = getEligibleModules(viewer);

  // Parallel fan-out of every read the Smart Home needs. Each is
  // server-only and most are idempotent — `getCachedSignalFeed` shares
  // the 30s `unstable_cache` window across requests, the lifecycle
  // collector persists its snapshot, the home-widget walk is fault-
  // tolerant per module. The saved-items count is a head-only `select
  // exact` — no rows transferred.
  const [signalFeed, lifecycle, widgets, savedItemsCount] = await Promise.all([
    getCachedSignalFeed(viewer, cursor ? { cursor, limit: 50 } : { limit: 50 }),
    collectAndPersistLifecycleSnapshot(viewer.user.id).catch(() => null),
    collectHomeWidgets(modules, viewer),
    countActiveSavedItems(createAdminSupabase(), viewer.user.id).catch(() => 0),
  ]);

  const attentionSignals = signalFeed.items.filter(
    (s) => s.priority === "security" || s.priority === "urgent",
  );
  const restSignals = signalFeed.items.filter(
    (s) => s.priority !== "security" && s.priority !== "urgent",
  );

  // Default (kill-switch) ordering: pure DASH weight. When the
  // `personalization_home` flag is ON, the deterministic per-user projection
  // (pin/hide/reorder + own-signal ranking, consent-gated) supersedes it. Every
  // read inside is best-effort + timeout-bounded, so a slow/failed layout read
  // falls straight back to this default — the home is never broken or stalled.
  let rankedMetrics = pickRankedMetrics(widgets, 6);
  let restWidgets = pickRemainingWidgets(widgets, rankedMetrics);

  if (
    isFlagEnabled(
      parseHenryFeatureFlags(process.env as Record<string, string | undefined>),
      "personalization_home",
    )
  ) {
    const device = await detectDevice();
    const authClient =
      (await createSupabaseServer()) as unknown as TypedSupabaseClient;
    const personalized = await withTimeout(
      resolvePersonalizedHome({
        viewer,
        client: authClient,
        modules,
        widgets,
        signals: signalFeed.items,
        lifecycle,
        device,
        now: new Date().toISOString(),
      }),
      1500,
    ).catch(() => null);
    if (personalized) {
      rankedMetrics = personalized.rankedMetrics;
      restWidgets = personalized.restWidgets;
    }
  }

  // Empty teachings — modules that have NO content to render expose
  // a teaching action via `getEmptyTeaching(viewer)`. These feed the
  // Next-Best Actions ranker for first-run users.
  const emptyTeachings = await collectEmptyTeachings(modules, viewer);

  // The deterministic FLOOR — always computed, so the home is never empty.
  const floorActions = rankNextBestActions({
    viewer,
    lifecycle,
    signals: signalFeed.items,
    emptyTeachings,
    limit: 3,
  });

  // V3-36 — when `intelligence_recommendations` is on, the cross-division
  // engine SUPERSEDES the floor (consent-gated profiling + optional governed-AI
  // re-rank, all non-billable). Best-effort + timeout-bounded: a null / slow /
  // failed result falls straight back to the deterministic floor above.
  const flags = parseHenryFeatureFlags(process.env as Record<string, string | undefined>);
  let nextBestActions = floorActions;
  if (isFlagEnabled(flags, "intelligence_recommendations")) {
    const authClient = (await createSupabaseServer()) as unknown as TypedSupabaseClient;
    const superseding = await withTimeout(
      resolveRecommendedActions({
        viewer,
        client: authClient,
        lifecycle,
        signals: signalFeed.items,
        limit: 3,
      }),
      1500,
    ).catch(() => null);
    if (superseding && superseding.length > 0) nextBestActions = superseding;
  }

  const lastActivityIso = computeLastActivityIso(signalFeed.items, lifecycle?.overallLastActiveAt ?? null);
  const firstName = viewer.user.fullName?.split(" ")[0] ?? null;
  const unreadCount = signalFeed.items.length;
  const attentionCount = attentionSignals.length;

  const isEmpty =
    signalFeed.items.length === 0 &&
    rankedMetrics.length === 0 &&
    restWidgets.length === 0 &&
    (lifecycle?.actionables.length ?? 0) === 0 &&
    savedItemsCount === 0;

  // One render-telemetry line per request. Drives the operator
  // dashboard's "what does the home look like for whom" view without
  // adding a new HenryEventName (taxonomy changes are V2-OBS-02
  // territory). The line is a workspace `logger.info` so it goes
  // through the structured logger + Sentry breadcrumb path.
  smartHomeLogger.info("smart_home.rendered", {
    viewerId: viewer.user.id,
    viewerKind: viewer.kind,
    role: viewer.role,
    moduleCount: modules.length,
    signalCount: signalFeed.items.length,
    attentionCount,
    rankedMetricsCount: rankedMetrics.length,
    restWidgetsCount: restWidgets.length,
    nextBestActionsCount: nextBestActions.length,
    savedItemsCount,
    isEmpty,
    cursorPresent: cursor !== null,
  });

  if (isEmpty) {
    // Drop hardcoded "Add money to wallet / Browse marketplace"
    // fallbacks. The recommender's deterministic ranker already
    // produces viewer-aware actions — sourcing from lifecycle, signals,
    // and module empty-teachings. When even the ranker is dry the
    // empty state stays purely typographic (anti-pattern #16) rather
    // than inventing actions the viewer didn't earn.
    const primary = nextBestActions[0]
      ? { label: nextBestActions[0].label, href: nextBestActions[0].href }
      : null;
    const secondary = nextBestActions[1]
      ? { label: nextBestActions[1].label, href: nextBestActions[1].href }
      : null;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* ACCOUNT-PREMIUM-01: editorial hero band above the empty
            composition so the first-run state still gets the premium
            visual signature (calm gradient + serif headline + tiles
            populated with zero-state copy from the overview slice). */}
        <SmartHomeHero
          firstName={firstName}
          unreadCount={0}
          attentionCount={0}
          lastActivityIso={null}
          savedItemsCount={0}
        />
        <div className="hc-smart-home-live-row">
          <RealtimeStatusOrb />
        </div>
        <EmptyStateCtaTracker moduleId="smart-home">
          <SmartHomeEmpty
            firstName={firstName}
            primaryAction={primary}
            secondaryAction={secondary}
          />
        </EmptyStateCtaTracker>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* ACCOUNT-PREMIUM-01: the editorial hero band sits above the
          existing SmartHome composition. It answers "what's happening
          with my stuff?" (eyebrow + headline + greeting/stat + tiles).
          The thin row below carries only the realtime-status orb, near
          the live data it describes — the old SmartHomeHeader that
          re-rendered the same greeting/stat here has been retired. */}
      <SmartHomeHero
        firstName={firstName}
        unreadCount={unreadCount}
        attentionCount={attentionCount}
        lastActivityIso={lastActivityIso}
        savedItemsCount={savedItemsCount}
      />
      <div className="hc-smart-home-live-row">
        <RealtimeStatusOrb />
      </div>

      <AttentionPanel attentionSignals={attentionSignals} lifecycle={lifecycle} />

      <NextBestActions actions={nextBestActions} />

      <RankedMetricStrip widgets={rankedMetrics} />

      <SignalFeed
        items={restSignals}
        nextCursor={signalFeed.nextCursor}
        prevHref={prevHref}
        hideEmpty={rankedMetrics.length > 0 || restWidgets.length > 0}
      />

      <ModuleWidgetGrid widgets={restWidgets} />
    </div>
  );
}

async function collectEmptyTeachings(
  modules: ReadonlyArray<ReturnType<typeof getEligibleModules>[number]>,
  viewer: UnifiedViewer,
): Promise<
  ReadonlyArray<{
    module: (typeof modules)[number];
    teaching: { headline: string; action?: { label: string; href: string } | undefined };
  }>
> {
  const settled = await Promise.allSettled(
    modules.map(async (mod) => {
      if (!mod.getEmptyTeaching) return null;
      const teaching = await mod.getEmptyTeaching(viewer);
      if (!teaching) return null;
      return { module: mod, teaching };
    }),
  );
  const out: Array<{
    module: (typeof modules)[number];
    teaching: { headline: string; action?: { label: string; href: string } | undefined };
  }> = [];
  for (let i = 0; i < settled.length; i++) {
    const r = settled[i];
    const mod = modules[i];
    if (r && r.status === "fulfilled" && r.value) {
      out.push(r.value);
    } else if (r && r.status === "rejected") {
      smartHomeLogger.warn("module_empty_teaching_rejected", {
        moduleSlug: mod?.slug,
        viewerId: viewer.user.id,
        error: r.reason instanceof Error ? r.reason.message : String(r.reason),
      });
    }
  }
  return out;
}

function computeLastActivityIso(
  signals: ReadonlyArray<SignalFeedItem>,
  lifecycleLast: string | null,
): string | null {
  const candidates: number[] = [];
  for (const s of signals) {
    const t = Date.parse(s.createdAt);
    if (!Number.isNaN(t)) candidates.push(t);
  }
  if (lifecycleLast) {
    const t = Date.parse(lifecycleLast);
    if (!Number.isNaN(t)) candidates.push(t);
  }
  if (candidates.length === 0) return null;
  return new Date(Math.max(...candidates)).toISOString();
}
