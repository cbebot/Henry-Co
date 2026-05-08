import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import type { DashboardModule, HomeWidget, ModuleSize } from "@henryco/dashboard-shell";
import { logger } from "@henryco/observability";

const widgetLogger = logger.child({ namespace: "smart-home.widgets" });

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
    modules.map(async (module) => {
      const widgets = await module.getHomeWidgets(viewer);
      return widgets.map<AnnotatedHomeWidget>((w) => ({ ...w, module }));
    }),
  );
  const flat: AnnotatedHomeWidget[] = [];
  for (let i = 0; i < settled.length; i++) {
    const r = settled[i];
    const module = modules[i];
    if (r && r.status === "fulfilled") {
      flat.push(...r.value);
    } else if (r && r.status === "rejected") {
      // A division throwing inside getHomeWidgets must not take the
      // home down — but operators need the signal that a module is
      // sick. Log at warn with the module slug so the alert is
      // routable.
      widgetLogger.warn("module_widgets_rejected", {
        moduleSlug: module?.slug,
        viewerId: viewer.user.id,
        error: r.reason instanceof Error ? r.reason.message : String(r.reason),
      });
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
