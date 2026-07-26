import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import type {
  DashboardModule,
  HomeWidget,
  ModuleSize,
  ModuleSlug,
  HomeLayoutResult,
} from "@henryco/dashboard-shell";
import { resolveModuleState, type ModuleDataState } from "@henryco/dashboard-shell";
import { emitEvent, logger, persistEvent } from "@henryco/observability";
import { createAdminSupabase } from "@/lib/supabase";

const widgetLogger = logger.child({ namespace: "smart-home.widgets" });

/**
 * V3-08 — record one `henry.dashboard.module.rendered` telemetry line
 * per module per Smart Home composition. The resolved `state` lets the
 * owner-workspace module-health tile flag modules that have been empty
 * for >7 days (candidates for removal or messaging fix), and `source`
 * tells a live-but-empty tile from a static entry-point card.
 *
 * Best-effort + non-blocking: `emitEvent` is sync (pino + Sentry
 * breadcrumb); `persistEvent` is the henry_events dual-write (swallows
 * RLS/preview failures). Telemetry must never break the dashboard
 * render, so persistence is fire-and-forget.
 */
function recordModuleRender(
  module: DashboardModule,
  viewer: UnifiedViewer,
  state: ModuleDataState,
): void {
  const payload = {
    module_id: module.slug,
    state,
    source: "live" as const,
  };
  emitEvent({
    name: "henry.dashboard.module.rendered",
    classification: "system_state",
    outcome:
      state === "error"
        ? "failed"
        : state === "loading"
          ? "pending"
          : "completed",
    actorId: viewer.user.id,
    payload,
    logger: widgetLogger,
  });
  void persistEvent({
    supabase: createAdminSupabase(),
    name: "henry.dashboard.module.rendered",
    actorId: viewer.user.id,
    payload,
  });
}

/**
 * One home widget annotated with the module that contributed it. The
 * Smart Home composes across modules, so it needs to know who emitted
 * a widget for accent color, deep-link prefix, and source attribution
 * in the rank tiebreakers.
 */
export type AnnotatedHomeWidget = HomeWidget & {
  module: DashboardModule;
};

/**
 * Walk every eligible module's `getHomeWidgets(viewer)` in parallel
 * and return the flattened, source-annotated widget list.
 *
 * The shell composes ACROSS modules — modules cannot rank against
 * each other (audit §D.4). This walk is the only place the cross-
 * module ranking happens.
 *
 * Each widget render is fault-tolerant at the boundary: a module that
 * throws inside `getHomeWidgets` produces zero widgets (the others
 * still surface) so a single division outage cannot take the home
 * down.
 */
export async function collectHomeWidgets(
  modules: ReadonlyArray<DashboardModule>,
  viewer: UnifiedViewer,
): Promise<ReadonlyArray<AnnotatedHomeWidget>> {
  const settled = await Promise.allSettled(
    modules.map(async (mod) => {
      const widgets = await mod.getHomeWidgets(viewer);
      return widgets.map<AnnotatedHomeWidget>((w) => ({ ...w, module: mod }));
    }),
  );
  const flat: AnnotatedHomeWidget[] = [];
  for (let i = 0; i < settled.length; i++) {
    const r = settled[i];
    const mod = modules[i];
    if (!mod) continue;
    if (r && r.status === "fulfilled") {
      flat.push(...r.value);
      // V3-08 — `real` when the module surfaced widgets, `empty_yet`
      // when it returned zero (first-run is the safe default; the
      // per-widget empty/none distinction lives in the widget itself).
      recordModuleRender(
        mod,
        viewer,
        resolveModuleState({ rowCount: r.value.length }),
      );
    } else if (r && r.status === "rejected") {
      // A division throwing inside getHomeWidgets must not take the
      // home down — but operators need the signal that a module is
      // sick. Log at warn with the module slug so the alert is
      // routable.
      widgetLogger.warn("module_widgets_rejected", {
        moduleSlug: mod.slug,
        viewerId: viewer.user.id,
        error: r.reason instanceof Error ? r.reason.message : String(r.reason),
      });
      recordModuleRender(mod, viewer, resolveModuleState({ error: r.reason, rowCount: 0 }));
    }
  }
  return flat;
}

/**
 * The size buckets the Smart Home recognises for layout. The shell's
 * grid heuristic uses these to derive how many columns a widget
 * occupies on each breakpoint.
 */
export const SIZE_COLS: Record<ModuleSize, number> = {
  sm: 1,
  md: 2,
  lg: 3,
};

/**
 * Pick the top-bucket widgets that belong in the ranked metric strip:
 *
 *   - size in {sm, md} (the strip is metric-shaped, not full panels)
 *   - sorted by `weight` descending
 *   - take the top N (default 6)
 *
 * Widgets that land here are rendered by the module's own
 * `widget.render()` — typically a `MetricCard` already enforcing the
 * required `comparison|trend` context (anti-pattern #18 closed at the
 * type level in `@henryco/dashboard-shell`).
 */
export function pickRankedMetrics(
  widgets: ReadonlyArray<AnnotatedHomeWidget>,
  count = 6,
): ReadonlyArray<AnnotatedHomeWidget> {
  return widgets
    .filter((w) => w.size === "sm" || w.size === "md")
    .slice()
    .sort(weightDescending)
    .slice(0, count);
}

/**
 * The "remaining" widgets after the ranked metric strip claims its
 * top bucket. These flow into the Module Widget Grid below the
 * Attention surface.
 */
export function pickRemainingWidgets(
  widgets: ReadonlyArray<AnnotatedHomeWidget>,
  picked: ReadonlyArray<AnnotatedHomeWidget>,
): ReadonlyArray<AnnotatedHomeWidget> {
  const pickedKeys = new Set(picked.map(widgetKey));
  return widgets
    .filter((w) => !pickedKeys.has(widgetKey(w)))
    .slice()
    .sort(weightDescending);
}

export function widgetKey(w: AnnotatedHomeWidget): string {
  return `${w.module.slug}:${w.id}`;
}

function weightDescending(a: AnnotatedHomeWidget, b: AnnotatedHomeWidget): number {
  if (b.weight !== a.weight) return b.weight - a.weight;
  return a.module.slug.localeCompare(b.module.slug);
}

// ── V3-34 personalization-home — projection-aware ranking ────────────────────
// When the personalization_home flag is ON, the two widget strips honour the
// user's projected MODULE order first, then weight within a module. When the
// flag is OFF, the pickRankedMetrics/pickRemainingWidgets above run unchanged
// (pure DASH weight order — the kill-switch fallback).

/** Map ModuleSlug → its ordinal in the projected layout (0 = first). */
export function moduleRankFromLayout(
  layout: HomeLayoutResult,
): Map<ModuleSlug, number> {
  const rank = new Map<ModuleSlug, number>();
  layout.ordered.forEach((entry, i) => rank.set(entry.slug, i));
  return rank;
}

/** Drop every widget whose module the layout marks hidden. */
export function filterHiddenWidgets(
  widgets: ReadonlyArray<AnnotatedHomeWidget>,
  hidden: ReadonlyArray<ModuleSlug>,
): ReadonlyArray<AnnotatedHomeWidget> {
  const hiddenSet = new Set<ModuleSlug>(hidden);
  return widgets.filter((w) => !hiddenSet.has(w.module.slug));
}

function projectedComparator(moduleRank: ReadonlyMap<ModuleSlug, number>) {
  return (a: AnnotatedHomeWidget, b: AnnotatedHomeWidget): number => {
    // A module not in the projected order (e.g. hidden or unknown) sinks last.
    const ra = moduleRank.get(a.module.slug) ?? Number.MAX_SAFE_INTEGER;
    const rb = moduleRank.get(b.module.slug) ?? Number.MAX_SAFE_INTEGER;
    if (ra !== rb) return ra - rb;
    if (b.weight !== a.weight) return b.weight - a.weight;
    return widgetKey(a).localeCompare(widgetKey(b));
  };
}

/** pickRankedMetrics, but ordered by the projected module layout. */
export function pickRankedMetricsProjected(
  widgets: ReadonlyArray<AnnotatedHomeWidget>,
  moduleRank: ReadonlyMap<ModuleSlug, number>,
  count = 6,
): ReadonlyArray<AnnotatedHomeWidget> {
  return widgets
    .filter((w) => w.size === "sm" || w.size === "md")
    .slice()
    .sort(projectedComparator(moduleRank))
    .slice(0, count);
}

/** pickRemainingWidgets, but ordered by the projected module layout. */
export function pickRemainingWidgetsProjected(
  widgets: ReadonlyArray<AnnotatedHomeWidget>,
  picked: ReadonlyArray<AnnotatedHomeWidget>,
  moduleRank: ReadonlyMap<ModuleSlug, number>,
): ReadonlyArray<AnnotatedHomeWidget> {
  const pickedKeys = new Set(picked.map(widgetKey));
  return widgets
    .filter((w) => !pickedKeys.has(widgetKey(w)))
    .slice()
    .sort(projectedComparator(moduleRank));
}
