import { Suspense, type ReactNode } from "react";
import { ErrorBoundary, LoadingSkeleton, Section } from "@henryco/dashboard-shell";
import { SIZE_COLS, type AnnotatedHomeWidget } from "@/lib/smart-home/widgets";

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
 *   - lg → full row (spans every column at lg)
 *
 * The shell uses CSS grid `grid-column: span N` to enforce these.
 * Widgets are rendered in weight-descending order; higher weight
 * sorts toward the top-left.
 */
export type ModuleWidgetGridProps = {
  widgets: ReadonlyArray<AnnotatedHomeWidget>;
};

const GRID_COLUMNS = 4;

export function ModuleWidgetGrid({ widgets }: ModuleWidgetGridProps) {
  if (widgets.length === 0) return null;
  return (
    <Section kicker="Across your divisions" headline="Live snapshots from each registered module">
      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`,
        }}
        className="hc-smart-home-module-grid"
      >
        {widgets.map((widget) => {
          const span = Math.min(SIZE_COLS[widget.size] ?? 1, GRID_COLUMNS);
          const isFull = widget.size === "lg";
          return (
            <ErrorBoundary
              key={`${widget.module.slug}:${widget.id}`}
              label={widget.title}
              fallback={renderWidgetError(widget.error)}
            >
              <div
                style={{
                  gridColumn: isFull ? `1 / -1` : `span ${span}`,
                }}
                className={
                  widget.size === "md"
                    ? "hc-smart-home-cell-md"
                    : widget.size === "lg"
                      ? "hc-smart-home-cell-lg"
                      : "hc-smart-home-cell-sm"
                }
              >
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
