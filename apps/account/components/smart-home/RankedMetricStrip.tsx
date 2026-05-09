import { Suspense, type ReactNode } from "react";
import { ErrorBoundary, LoadingSkeleton, Section } from "@henryco/dashboard-shell";
import type { AnnotatedHomeWidget } from "@/lib/smart-home/widgets";

/**
 * RankedMetricStrip — the top-of-fold cross-module metric cluster.
 *
 * Walks the top-bucket widgets (size sm|md, sorted by weight) and
 * renders each module's own `widget.render()`. Modules contribute
 * `MetricCard` instances (the type system requires `comparison|trend`
 * — anti-pattern #18 closed at the contract level), so this strip
 * inherits the contextual-by-construction property.
 *
 * Each widget render is wrapped in:
 *   - `Suspense` — defers to `LoadingSkeleton` while the widget data
 *     resolves, so layout doesn't shift on hydration.
 *   - `ErrorBoundary` — a single widget throwing falls back to the
 *     widget's `error` slot (or a calm default) without taking down
 *     the rest of the strip.
 */
export type RankedMetricStripProps = {
  widgets: ReadonlyArray<AnnotatedHomeWidget>;
};

export function RankedMetricStrip({ widgets }: RankedMetricStripProps) {
  if (widgets.length === 0) return null;
  return (
    <Section kicker="Today" headline="Where you stand right now" divisionAccent="hub">
      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))",
        }}
      >
        {widgets.map((widget) => (
          <ErrorBoundary
            key={`${widget.module.slug}:${widget.id}`}
            label={widget.title}
            fallback={renderWidgetError(widget.error)}
          >
            <Suspense
              fallback={
                widget.loading ?? (
                  <LoadingSkeleton variant="metric" />
                )
              }
            >
              <RenderedWidget widget={widget} />
            </Suspense>
          </ErrorBoundary>
        ))}
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
