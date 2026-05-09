import { Suspense, type ReactNode } from "react";
import { ErrorBoundary, LoadingSkeleton, Section } from "@henryco/dashboard-shell";
import { type AnnotatedHomeWidget } from "@/lib/smart-home/widgets";

/**
 * ModuleWidgetGrid — composes the remaining home widgets (those not
 * promoted into the ranked metric strip) into one responsive grid.
 *
 * Composition heuristic (audit §D.4 — "shell composes, modules
 * register"):
 *   - 4-col grid on lg (≥ 1024px)
 *   - 2-col on md (≥ 640px)
 *   - 1-col on sm (< 640px)
 *
 * Widget col-spans:
 *   - sm → 1 col
 *   - md → 2 cols
 *   - lg → full row
 *
 * Layout is driven by CSS in `apps/account/app/globals.css` keyed off
 * `.hc-smart-home-module-grid` and the per-cell size classes —
 * deferring to the stylesheet means the responsive behaviour collapses
 * cleanly on every breakpoint without inline `gridTemplateColumns`
 * fighting media queries. Widgets are rendered in weight-descending
 * order; higher weight sorts toward the top-left.
 */
export type ModuleWidgetGridProps = {
  widgets: ReadonlyArray<AnnotatedHomeWidget>;
};

export function ModuleWidgetGrid({ widgets }: ModuleWidgetGridProps) {
  if (widgets.length === 0) return null;
  return (
    <Section kicker="Across your divisions" headline="Live snapshots from each registered module" divisionAccent="hub">
      <div className="hc-smart-home-module-grid">
        {widgets.map((widget, index) => {
          // V5-4 editorial: the highest-weight widget (index 0) is
          // promoted to a 2x2 anchor cell on desktop. The rest fall
          // back to their declared size. Stays single-column on mobile.
          const isAnchor = index === 0 && widgets.length >= 4;
          const cellClass = isAnchor
            ? "hc-smart-home-cell-anchor"
            : widget.size === "md"
              ? "hc-smart-home-cell-md"
              : widget.size === "lg"
                ? "hc-smart-home-cell-lg"
                : "hc-smart-home-cell-sm";
          return (
            <ErrorBoundary
              key={`${widget.module.slug}:${widget.id}`}
              label={widget.title}
              fallback={renderWidgetError(widget.error)}
            >
              <div className={cellClass}>
                <Suspense
                  fallback={
                    widget.loading ?? (
                      <LoadingSkeleton variant={widget.size === "sm" ? "metric" : "card"} />
                    )
                  }
                >
                  <RenderedWidget widget={widget} />
                </Suspense>
              </div>
            </ErrorBoundary>
          );
        })}
      </div>
    </Section>
  );
}

async function RenderedWidget({ widget }: { widget: AnnotatedHomeWidget }) {
  return await widget.render();
}

function renderWidgetError(custom: ReactNode | undefined) {
  if (!custom) return undefined;
  return () => custom;
}
