"use client";

/**
 * V3-42 S1 — the shared <PredictiveDashboard> primitive.
 *
 * All four role lenses render through this one component and differ only in
 * their data bindings, so a fix to the chart, the banner or the rail lands
 * everywhere at once.
 *
 * Deliberate choices:
 *
 *   1. CHARTS ARE INLINE SVG. No charting dependency: a sparkline is ~20 lines
 *      of path maths, an inline `<svg>` inherits theme tokens so light/dark needs
 *      no JS, and nothing here can phone home.
 *   2. EVERY STRING COMES FROM COPY. The component receives a resolved copy
 *      object and interpolates numeric params. No operator English lives in this
 *      file, which is what lets twelve locales work.
 *   3. A CARD ACTION IS A DECISION, NOT AN EXECUTION. `onAction` records
 *      accept/dismiss/snooze. "Agree" also offers a link the operator may follow.
 *      Nothing is applied for them, and the advisory note says so on the surface.
 *   4. NAVIGATION IS LINKS. Lens switching and drill-down are plain `<a href>`s.
 *      A function prop cannot cross the server/client boundary unless it is a
 *      server action, so a callback here would render tabs that silently do
 *      nothing. Links also work without JavaScript and keep the URL shareable.
 *   5. MOBILE IS A SUMMARY. Below 768px the dense drill table gives way to a
 *      pointer to the desktop view; the KPI strip, anomaly banners and the rail
 *      stay. Media queries live in a scoped `<style>` block with `hc-intel-*`
 *      class hooks — the same pattern the shell uses (`mobile-shell-css.ts`).
 */

import { useMemo, useState, useTransition } from "react";
import { Panel, Section, PageHeader, Chip, Badge, ActionButton, EmptyState } from "@henryco/dashboard-shell/components";
import type { StaffIntelligenceCopy } from "@henryco/i18n";
import type { AnomalyResult, RecommendationCard } from "@henryco/intelligence";
import type { LensKey } from "./lenses";
import type { DrillRow, LensSeries } from "./data";

export type RecommendationAction = "accept" | "dismiss" | "snooze";

export type PredictiveDashboardProps = {
  copy: StaffIntelligenceCopy;
  lens: LensKey;
  /** Only the lenses this viewer may see — the server decided this. */
  availableLenses: ReadonlyArray<LensKey>;
  /** Base path the lens links point at (the module's own route). */
  basePath: string;
  series: ReadonlyArray<LensSeries>;
  anomalies: ReadonlyArray<AnomalyResult>;
  cards: ReadonlyArray<RecommendationCard>;
  drill: ReadonlyArray<DrillRow>;
  /**
   * A SERVER ACTION reference, passed through untouched. Wrapping it in a
   * closure on the server would not serialize across the boundary, so the lens
   * travels as an argument instead of being captured.
   */
  onAction: (key: string, lens: LensKey, action: RecommendationAction) => Promise<void>;
};

/**
 * Class-hook CSS, mounted once per dashboard. 768px = MOBILE_BREAKPOINT_PX.
 *
 * SAFETY: this is a compile-time CONSTANT and is injected via
 * dangerouslySetInnerHTML exactly like the shell's IDENTITY_BAR_CSS. It must
 * never interpolate data — no copy, no params, no user input. A test asserts
 * the string contains no `${` so that stays true.
 */
export const INTEL_CSS = `
.hc-intel-mobile-only { display: none; }
@media (max-width: 767px) {
  .hc-intel-desktop-only { display: none !important; }
  .hc-intel-mobile-only { display: block; }
}
.hc-intel-tab {
  display: inline-flex; align-items: center; min-height: 2.25rem; padding: 0 0.875rem;
  border-radius: 999px; font-size: 0.8125rem; text-decoration: none;
  border: 1px solid var(--hc-border-subtle); color: var(--hc-text-secondary);
}
.hc-intel-tab[aria-current="page"] {
  background: var(--hc-text-primary); color: var(--hc-surface-base); border-color: var(--hc-text-primary);
}
.hc-intel-tab:focus-visible, .hc-intel-link:focus-visible {
  outline: 2px solid var(--hc-border-focus, currentColor); outline-offset: 2px;
}
.hc-intel-link { font-size: 0.75rem; color: var(--hc-accent-text, #8A6F00); text-decoration: underline; text-underline-offset: 2px; }
`;

/** Replace `{name}` placeholders. A missing value renders as the placeholder
 *  rather than "undefined", so a gap is obvious in review. */
function fill(template: string, params: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
  );
}

function chartTitle(copy: StaffIntelligenceCopy, key: string): string {
  const titles = copy.chart as unknown as Record<string, string>;
  return Object.prototype.hasOwnProperty.call(titles, key) && typeof titles[key] === "string" ? titles[key] : key;
}

/** A compact trend line. Pure geometry — no dependency, no network, no canvas. */
function Sparkline({
  points,
  label,
  dashed,
}: {
  points: ReadonlyArray<{ at: string; value: number }>;
  label: string;
  dashed?: boolean;
}) {
  const path = useMemo(() => {
    const values = points.map((p) => (Number.isFinite(p.value) ? p.value : 0));
    if (values.length < 2) return null;
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const span = max - min || 1;
    const stepX = 100 / (values.length - 1);
    return values
      .map((v, i) => `${i === 0 ? "M" : "L"}${(i * stepX).toFixed(2)},${(28 - ((v - min) / span) * 26).toFixed(2)}`)
      .join(" ");
  }, [points]);

  if (!path) return null;
  const last = points[points.length - 1]?.value ?? 0;
  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      role="img"
      aria-label={`${label}: ${last}`}
      style={{ width: "100%", height: "3rem", display: "block", overflow: "visible" }}
    >
      <path
        d={path}
        fill="none"
        stroke="var(--hc-accent, #C9A227)"
        strokeWidth={1.5}
        strokeDasharray={dashed ? "3 3" : undefined}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChartCard({ copy, series }: { copy: StaffIntelligenceCopy; series: LensSeries }) {
  const { points } = series;
  const forecast = series.kind === "forecast";
  const latest = points.length > 0 ? points[points.length - 1].value : 0;
  const total = points.reduce((sum, p) => sum + (Number.isFinite(p.value) ? p.value : 0), 0);
  const title = chartTitle(copy, series.key);
  return (
    <Panel tone="raised" aria-label={title}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--hc-text-secondary)" }}>{title}</span>
          <span style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--hc-text-primary)" }}>
            {forecast ? total : latest}
          </span>
        </div>
        {points.length >= 2 ? (
          <Sparkline points={points} label={title} dashed={forecast} />
        ) : (
          <span style={{ fontSize: "0.75rem", color: "var(--hc-text-tertiary)" }}>{copy.chart.noData}</span>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", alignItems: "baseline" }}>
          <span style={{ fontSize: "0.6875rem", color: "var(--hc-text-tertiary)" }}>
            {forecast ? copy.chart.next7Days : `${copy.chart.last28Days} · ${total}`}
          </span>
          {series.href ? (
            <a className="hc-intel-link" href={series.href}>
              {copy.chart.drillDown}
            </a>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

function AnomalyBanner({ copy, anomaly }: { copy: StaffIntelligenceCopy; anomaly: AnomalyResult }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  const windowCopy =
    anomaly.windowDescription === "window_insufficient" ? copy.anomaly.window_insufficient : copy.anomaly.window_rolling;
  return (
    <Panel tone="inset" aria-label={copy.anomaly.title}>
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <Badge value={copy.anomaly.band[anomaly.band]} tone={anomaly.band === "alert" ? "urgent" : "warning"} />
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--hc-text-primary)" }}>
              {chartTitle(copy, anomaly.series)}
            </span>
          </div>
          <span style={{ fontSize: "0.8125rem", color: "var(--hc-text-secondary)" }}>
            {fill(copy.anomaly.summary, {
              observed: anomaly.observed,
              expected: anomaly.expected,
              deviation: Math.round(Math.abs(anomaly.deviation) * 10) / 10,
              window: windowCopy,
            })}
          </span>
        </div>
        <ActionButton tone="ghost" onClick={() => setHidden(true)}>
          {copy.anomaly.dismiss}
        </ActionButton>
      </div>
    </Panel>
  );
}

function RecommendationRow({
  copy,
  card,
  lens,
  onAction,
}: {
  copy: StaffIntelligenceCopy;
  card: RecommendationCard;
  lens: LensKey;
  onAction: PredictiveDashboardProps["onAction"];
}) {
  const [pending, startTransition] = useTransition();
  const [resolved, setResolved] = useState<RecommendationAction | null>(null);
  const [failed, setFailed] = useState(false);

  const templates = copy.recommendation as unknown as Record<string, string>;
  const template =
    Object.prototype.hasOwnProperty.call(templates, card.kind) && typeof templates[card.kind] === "string"
      ? templates[card.kind]
      : card.kind;
  // Series and queue names inside a card are codes too — localize them first.
  const params: Record<string, string | number> = { ...card.params };
  if (typeof params.series === "string") params.series = chartTitle(copy, params.series);

  const act = (action: RecommendationAction) => {
    setFailed(false);
    startTransition(async () => {
      try {
        await onAction(card.key, lens, action);
        setResolved(action);
      } catch {
        // The decision was not recorded. Leave the buttons live so the operator
        // can retry — never show "Agreed" for a write that did not happen.
        setFailed(true);
      }
    });
  };

  return (
    <Panel tone="raised" aria-label={card.key}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Chip tone={card.severity === "attention" ? "warning" : "neutral"}>
            {copy.recommendation.severity[card.severity]}
          </Chip>
        </div>
        <span style={{ fontSize: "0.875rem", color: "var(--hc-text-primary)" }}>{fill(template, params)}</span>
        {resolved ? (
          <span role="status" style={{ fontSize: "0.75rem", color: "var(--hc-text-tertiary)" }}>
            {copy.recommendation.actions[resolved === "accept" ? "accepted" : resolved === "dismiss" ? "dismissed" : "snoozed"]}
          </span>
        ) : (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <ActionButton tone="primary" disabled={pending} onClick={() => act("accept")}>
              {copy.recommendation.actions.accept}
            </ActionButton>
            <ActionButton tone="ghost" disabled={pending} onClick={() => act("dismiss")}>
              {copy.recommendation.actions.dismiss}
            </ActionButton>
            <ActionButton tone="ghost" disabled={pending} onClick={() => act("snooze")}>
              {copy.recommendation.actions.snooze}
            </ActionButton>
            {card.href ? (
              <a className="hc-intel-link" href={card.href}>
                {copy.recommendation.actions.open}
              </a>
            ) : null}
            {failed ? (
              <span role="alert" style={{ fontSize: "0.75rem", color: "var(--hc-status-danger-text, #B91C1C)" }}>
                {copy.recommendation.actions.failed}
              </span>
            ) : null}
          </div>
        )}
      </div>
    </Panel>
  );
}

export function PredictiveDashboard({
  copy,
  lens,
  availableLenses,
  basePath,
  series,
  anomalies,
  cards,
  drill,
  onAction,
}: PredictiveDashboardProps) {
  const fired = anomalies.filter((a) => a.detected);
  const observed = series.filter((s) => s.kind === "observed");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <style dangerouslySetInnerHTML={{ __html: INTEL_CSS }} />
      <PageHeader kicker={copy.module.kicker} title={copy.module.title} description={copy.module.description} />

      {availableLenses.length > 1 ? (
        <nav aria-label={copy.lens.switchLabel} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {availableLenses.map((key) => (
            <a
              key={key}
              className="hc-intel-tab"
              href={`${basePath}?lens=${key}`}
              aria-current={key === lens ? "page" : undefined}
            >
              {copy.lens[key]}
            </a>
          ))}
        </nav>
      ) : null}

      {/* KPI strip — the "key trend" of the mobile summary, useful on desktop too. */}
      <Panel tone="flat" aria-label={copy.mobile.summaryTitle}>
        <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
          {observed.map((s) => (
            <div key={s.key} style={{ display: "flex", flexDirection: "column", minWidth: "7rem" }}>
              <span style={{ fontSize: "0.6875rem", color: "var(--hc-text-tertiary)" }}>{chartTitle(copy, s.key)}</span>
              <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--hc-text-primary)" }}>
                {s.points.length > 0 ? s.points[s.points.length - 1].value : "—"}
              </span>
            </div>
          ))}
          <div style={{ display: "flex", flexDirection: "column", minWidth: "7rem" }}>
            <span style={{ fontSize: "0.6875rem", color: "var(--hc-text-tertiary)" }}>{copy.recommendation.title}</span>
            <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--hc-text-primary)" }}>
              {fill(copy.mobile.openRecommendations, { count: cards.length })}
            </span>
          </div>
        </div>
      </Panel>

      <Section kicker={copy.anomaly.title}>
        {fired.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {fired.map((anomaly) => (
              <AnomalyBanner key={`${anomaly.series}:${anomaly.at}`} copy={copy} anomaly={anomaly} />
            ))}
          </div>
        ) : (
          <span style={{ fontSize: "0.8125rem", color: "var(--hc-text-tertiary)" }}>{copy.anomaly.none}</span>
        )}
      </Section>

      <Section kicker={copy.chart.last28Days}>
        <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))" }}>
          {series.map((s) => (
            <ChartCard key={s.key} copy={copy} series={s} />
          ))}
        </div>
      </Section>

      <Section kicker={copy.recommendation.title}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--hc-text-tertiary)" }}>{copy.recommendation.advisoryNote}</span>
          {cards.length > 0 ? (
            cards.map((card) => (
              <RecommendationRow key={card.key} copy={copy} card={card} lens={lens} onAction={onAction} />
            ))
          ) : (
            <span style={{ fontSize: "0.8125rem", color: "var(--hc-text-tertiary)" }}>{copy.recommendation.none}</span>
          )}
        </div>
      </Section>

      <Section kicker={copy.drill.title}>
        <div className="hc-intel-mobile-only">
          <span style={{ fontSize: "0.8125rem", color: "var(--hc-text-tertiary)" }}>{copy.mobile.fullViewOnDesktop}</span>
        </div>
        <div className="hc-intel-desktop-only">
          {drill.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "var(--hc-text-tertiary)" }}>
                    <th scope="col" style={{ padding: "0.375rem 0.5rem" }}>{copy.drill.reference}</th>
                    <th scope="col" style={{ padding: "0.375rem 0.5rem" }}>{copy.drill.band}</th>
                    <th scope="col" style={{ padding: "0.375rem 0.5rem" }}>{copy.drill.seen}</th>
                  </tr>
                </thead>
                <tbody>
                  {drill.map((row) => (
                    <tr key={`${row.id}:${row.at}`} style={{ borderTop: "1px solid var(--hc-border-subtle)" }}>
                      <td style={{ padding: "0.375rem 0.5rem", color: "var(--hc-text-primary)" }}>{row.label}</td>
                      <td style={{ padding: "0.375rem 0.5rem" }}>
                        <Chip tone="neutral">{row.band}</Chip>
                      </td>
                      <td style={{ padding: "0.375rem 0.5rem", color: "var(--hc-text-secondary)" }}>{row.at.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState headline={copy.drill.empty} />
          )}
        </div>
      </Section>
    </div>
  );
}
