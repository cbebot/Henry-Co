/**
 * V3-41 — the predictive panel rendered above a staff queue.
 *
 * A SERVER component (no "use client"): it renders from an already-loaded
 * snapshot and holds no state, so it can be passed as a prop into the client
 * queue shell without shipping any of this to the browser.
 *
 * Three things it deliberately does NOT do:
 *   - it never renders a raw score (the loader does not even fetch one);
 *   - it never offers an action button — every item is something for a HUMAN to
 *     pick up in the queue below, and an "apply" affordance here would be the
 *     first step toward auto-punishment;
 *   - it never renders an English literal. Every string comes from
 *     `surface:staff_predictive`, so 12 locales and `i18n:check:strict` hold.
 */

import type { CSSProperties, ReactNode } from "react";
import { Chip, Panel, Section } from "@henryco/dashboard-shell/components";
import type { StaffPredictiveCopy } from "@henryco/i18n";
import type { PredictiveSnapshot } from "./predictive";

const metaStyle: CSSProperties = {
  fontSize: "0.75rem",
  color: "var(--hc-text-tertiary)",
  margin: 0,
};

const statValueStyle: CSSProperties = {
  fontSize: "1.5rem",
  fontWeight: 600,
  color: "var(--hc-text-primary)",
  lineHeight: 1.1,
};

const statLabelStyle: CSSProperties = {
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--hc-text-tertiary)",
};

const rowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.5rem 0",
  borderTop: "1px solid var(--hc-border-subtle)",
};

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", minWidth: "8rem" }}>
      <span style={statLabelStyle}>{label}</span>
      <span style={statValueStyle}>{value}</span>
    </div>
  );
}

export type PredictiveQueuePanelProps = {
  snapshot: PredictiveSnapshot;
  copy: StaffPredictiveCopy;
};

export function PredictiveQueuePanel({ snapshot, copy }: PredictiveQueuePanelProps) {
  const { forecast, atRisk, disputes } = snapshot;

  // Nothing to say yet (pre-activation, or the batch has not run) — render
  // nothing rather than an empty shell that implies a broken surface.
  if (!forecast && atRisk.length === 0 && disputes.length === 0) return null;

  const evidenceLabel = forecast
    ? forecast.basis === "seasonal"
      ? copy.evidence.seasonal
      : forecast.basis === "sparse"
        ? copy.evidence.sparse
        : copy.evidence.empty
    : copy.evidence.empty;

  return (
    <Section kicker={copy.panel.kicker} headline={copy.panel.forecastTitle}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <Panel tone="inset">
          {forecast ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
                <Stat label={copy.forecast.nextSevenDays} value={forecast.expectedTotal} />
                <Stat label={copy.forecast.busiestHour} value={forecast.busiestHour} />
                <Stat
                  label={copy.forecast.recommendedAgents}
                  value={
                    forecast.staffing.length > 0
                      ? Math.max(...forecast.staffing.map((s) => s.agents))
                      : 0
                  }
                />
              </div>
              <p style={metaStyle}>
                {evidenceLabel} · {copy.evidence.sampleSize.replace("{count}", String(forecast.sampleSize))}
              </p>
              {/* The shadow-window honesty line: a suggestion, not an approved figure. */}
              <p style={metaStyle}>{copy.panel.shadowNotice}</p>
              {forecast.narrative ? <p style={metaStyle}>{forecast.narrative}</p> : null}
            </div>
          ) : (
            <p style={metaStyle}>{copy.panel.emptyForecast}</p>
          )}
        </Panel>

        {forecast && forecast.staffing.length > 0 ? (
          <Panel tone="flat">
            <span style={statLabelStyle}>{copy.panel.staffingTitle}</span>
            {forecast.staffing.slice(0, 7).map((day) => (
              <div key={day.date} style={rowStyle}>
                <span style={{ minWidth: "6.5rem", fontSize: "0.8rem" }}>{day.date}</span>
                <strong style={{ fontSize: "0.85rem" }}>{day.agents}</strong>
                <Chip tone={day.rationale === "forecast_above_capacity" ? "warning" : "neutral"}>
                  {copy.staffingRationale[day.rationale]}
                </Chip>
              </div>
            ))}
          </Panel>
        ) : null}

        <Panel tone="flat">
          <span style={statLabelStyle}>{copy.panel.atRiskTitle}</span>
          {atRisk.length === 0 ? (
            <p style={metaStyle}>{copy.panel.emptyAtRisk}</p>
          ) : (
            atRisk.slice(0, 10).map((item) => (
              <div key={`${item.unitType}:${item.unitId}`} style={rowStyle}>
                <Chip tone={item.band === "high" ? "urgent" : "warning"}>{copy.riskBand[item.band]}</Chip>
                <span style={{ fontSize: "0.8rem" }}>{copy.unitType[item.unitType]}</span>
                <span style={{ ...metaStyle, fontFamily: "var(--hc-font-mono, monospace)" }}>
                  {item.unitId.slice(0, 8)}
                </span>
                {item.reasons.slice(0, 2).map((reason) => (
                  <Chip key={reason} tone="neutral">
                    {copy.qualityReason[reason]}
                  </Chip>
                ))}
                {item.intervention ? (
                  <Chip tone="outline">{copy.intervention[item.intervention]}</Chip>
                ) : null}
              </div>
            ))
          )}
        </Panel>

        {disputes.length > 0 ? (
          <Panel tone="flat">
            <span style={statLabelStyle}>{copy.panel.disputeTitle}</span>
            {disputes.slice(0, 10).map((item) => (
              <div key={item.transactionId} style={rowStyle}>
                <Chip tone={item.band === "high" ? "urgent" : "warning"}>
                  {copy.disputeBand[item.band]}
                </Chip>
                <span style={{ ...metaStyle, fontFamily: "var(--hc-font-mono, monospace)" }}>
                  {item.transactionId.slice(0, 8)}
                </span>
                {item.factors.slice(0, 2).map((factor) => (
                  <Chip key={factor} tone="neutral">
                    {copy.disputeFactor[factor]}
                  </Chip>
                ))}
              </div>
            ))}
          </Panel>
        ) : null}

        <p style={metaStyle}>{copy.panel.advisoryNote}</p>
      </div>
    </Section>
  );
}
