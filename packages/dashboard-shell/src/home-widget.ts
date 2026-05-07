/**
 * @henryco/dashboard-shell/home-widget — Smart Home widget contract
 * (audit §D.4).
 *
 * Each module contributes 0..N home widgets via `getHomeWidgets`. The
 * shell's Smart Home signal feed (DASH-4) ranks all contributed
 * widgets across modules, packs them into the grid by size and weight,
 * and renders them server-side.
 *
 * DASH-1 SHIPS THE TYPE. DASH-4 SHIPS THE RANK + PACK + RENDERER.
 */

import type { ReactNode } from "react";
import type { ModuleSlug, ModuleSize } from "./register";

/**
 * One widget contribution. The shell renders `render()` server-side;
 * each invocation may suspend on data and the shell wraps the render
 * in a Suspense boundary that falls back to `loading`.
 *
 * `weight` is a numeric hint for the rank algorithm. Higher = more
 * likely to appear above the fold. Range 0..100. Modules that emit
 * truly urgent signals (security alerts, payment failures) push
 * 80+; routine surfaces sit 30-50; informational decoration < 30.
 *
 * The actual rank is the SQL `get_signal_feed` score — the widget
 * weight is just a tiebreaker for widgets at the same score.
 */
export type HomeWidget = {
  /** Stable id within the module — used as the React key. */
  id: string;

  /** Module that contributed this widget. */
  source: ModuleSlug;

  /** Display title (kicker) — the widget's section heading. */
  title: string;

  /** Suggested grid size — the pack algorithm may override. */
  size: ModuleSize;

  /** Numeric rank tiebreaker. Range 0..100. */
  weight: number;

  /**
   * Server-side render function. May throw to bubble to the shell's
   * ErrorBoundary, which renders `error` (or a default error state)
   * in place of the widget without taking down the rest of the feed.
   */
  render: () => Promise<ReactNode>;

  /**
   * Optional empty-state node when the widget has nothing to surface.
   * If absent, the shell renders the widget's `title` with a muted
   * "Nothing yet." placeholder.
   */
  empty?: ReactNode;

  /**
   * Optional loading-state node. If absent, the shell renders a
   * LoadingSkeleton sized to the widget's `size` so layout doesn't
   * shift on hydration.
   */
  loading?: ReactNode;

  /**
   * Optional error-state node. If absent, the shell renders a
   * standard error frame with a retry primitive.
   */
  error?: ReactNode;

  /**
   * If set, clicking anywhere on the widget's chrome navigates here.
   * Individual interactive elements within `render()` may have their
   * own handlers; this is the "open the full surface" affordance.
   */
  href?: string;
};
