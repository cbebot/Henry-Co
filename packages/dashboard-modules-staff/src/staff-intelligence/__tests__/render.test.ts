import { before, test } from "node:test";
import assert from "node:assert/strict";
import * as React from "react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

import { getStaffIntelligenceCopy } from "@henryco/i18n";
import type { AnomalyResult, RecommendationCard } from "@henryco/intelligence";
import type { DrillRow, LensSeries } from "../data";
import type { LensKey } from "../lenses";

/**
 * TEST-ENVIRONMENT SHIM, not a product change. This package compiles with
 * `jsx: react-jsx`, but the `@henryco/dashboard-shell` components it renders sit
 * outside this package's tsconfig `include`, so tsx transforms them with
 * esbuild's default CLASSIC runtime (`React.createElement` with no import). Next
 * compiles them with the automatic runtime, so production never sees this.
 * Providing `React` globally BEFORE the tree loads lets the real components
 * render here unmodified.
 */
let PredictiveDashboard: typeof import("../dashboard").PredictiveDashboard;
before(async () => {
  (globalThis as { React?: unknown }).React = React;
  ({ PredictiveDashboard } = await import("../dashboard"));
});

/**
 * A REAL server render of the dashboard, in every lens and several locales.
 *
 * Typecheck proves the shapes line up; it cannot prove the component renders.
 * A copy key that resolves to undefined, a placeholder that never fills, or a
 * NaN reaching the markup would all typecheck and still break an operator's
 * screen. This renders the actual component tree with react-dom/server — no
 * database and no staff login needed — and inspects the HTML.
 */

const DAY = 86_400_000;
const START = Date.parse("2026-08-26T00:00:00.000Z");

function series(key: string, kind: "observed" | "forecast", values: number[], href?: string): LensSeries {
  return {
    key,
    kind,
    href,
    points: values.map((value, i) => ({ at: new Date(START + i * DAY).toISOString(), value })),
  };
}

const ANOMALY: AnomalyResult = {
  series: "refund_requests",
  detected: true,
  observed: 90,
  expected: 20,
  deviation: 4.23,
  band: "alert",
  windowDescription: "window_rolling",
  baselineCount: 28,
  basis: "robust",
  at: "2026-09-22T00:00:00.000Z",
};

const CARDS: RecommendationCard[] = [
  {
    key: "workload.staffing.support.2026-W39",
    kind: "staffing_increase",
    roleScope: "support",
    severity: "attention",
    params: { queue: "support", recommended: 5, extra: 2, week: "2026-W39" },
    href: "/modules/staff-support",
    advisory: true,
  },
  {
    key: "anomaly.refund_requests.2026-09-22",
    kind: "investigate_anomaly",
    roleScope: "finance",
    severity: "attention",
    params: { series: "refund_requests", observed: 90, expected: 20, deviation: 4.2, band: "alert" },
    advisory: true,
  },
  {
    key: "quality.at_risk.2026-09-22",
    kind: "review_at_risk_units",
    roleScope: "support",
    severity: "attention",
    params: { high: 3, elevated: 7 },
    advisory: true,
  },
  {
    key: "dispute.watchlist.2026-09-22",
    kind: "review_dispute_watchlist",
    roleScope: "finance",
    severity: "info",
    params: { high: 1, watch: 4 },
    advisory: true,
  },
  {
    key: "risk.backlog.2026-09-22",
    kind: "review_risk_backlog",
    roleScope: "trust",
    severity: "attention",
    params: { review: 12, freeze: 2 },
    advisory: true,
  },
  {
    key: "hindsight.rule.item_not_received_reported.2026-09-22",
    kind: "rule_suggestion_hindsight",
    roleScope: "trust",
    severity: "info",
    params: { factor: "item_not_received_reported", disputes: 9, windowDays: 30 },
    advisory: true,
  },
];

const DRILL: DrillRow[] = [
  { id: "unit-1", label: "unit-1", band: "high", at: "2026-09-22T08:00:00.000Z" },
  { id: "unit-2", label: "unit-2", band: "elevated", at: "2026-09-21T08:00:00.000Z" },
];

const noop = async () => undefined;

function render(opts: {
  locale: Parameters<typeof getStaffIntelligenceCopy>[0];
  lens: LensKey;
  available: LensKey[];
  withData: boolean;
}): string {
  const copy = getStaffIntelligenceCopy(opts.locale);
  const data = opts.withData;
  return renderToString(
    createElement(PredictiveDashboard, {
      copy,
      lens: opts.lens,
      availableLenses: opts.available,
      basePath: "/modules/staff-intelligence",
      series: data
        ? [
            series("support_volume", "observed", Array.from({ length: 28 }, (_, i) => 10 + (i % 5)), "/modules/staff-support"),
            series("support_forecast", "forecast", [12, 14, 13, 15, 9, 6, 11]),
            series("at_risk_units", "observed", Array.from({ length: 28 }, (_, i) => i % 3)),
          ]
        : [],
      anomalies: data ? [ANOMALY, { ...ANOMALY, series: "support_volume", detected: false }] : [],
      cards: data ? CARDS : [],
      drill: data ? DRILL : [],
      onAction: noop,
    }),
  );
}

function assertCleanHtml(html: string, label: string) {
  assert.ok(html.length > 500, `${label}: suspiciously small render`);
  assert.equal(html.includes("undefined"), false, `${label}: "undefined" leaked into the markup`);
  assert.equal(html.includes("NaN"), false, `${label}: NaN leaked into the markup`);
  assert.equal(/\{[a-zA-Z]+\}/.test(html.replace(/<style[\s\S]*?<\/style>/g, "")), false, `${label}: an unfilled {placeholder} rendered`);
  assert.equal(html.includes("[object Object]"), false, `${label}: an object was stringified into the markup`);
}

const FULL: LensKey[] = ["trust", "finance", "support", "moderation"];
const NON_SECURITY: LensKey[] = ["finance", "support", "moderation"];

test("RENDER: every lens renders cleanly with data, in English", () => {
  for (const lens of FULL) {
    const html = render({ locale: "en", lens, available: FULL, withData: true });
    assertCleanHtml(html, `en/${lens}`);
  }
});

test("RENDER: the EMPTY state (pre-migration / paused DB) renders cleanly", () => {
  for (const lens of FULL) {
    const html = render({ locale: "en", lens, available: FULL, withData: false });
    assertCleanHtml(html, `empty/${lens}`);
    const copy = getStaffIntelligenceCopy("en");
    assert.ok(html.includes(copy.anomaly.none), "empty anomalies say so");
    assert.ok(html.includes(copy.recommendation.none), "empty rail says so");
  }
});

test("RENDER: localized — including RTL and an English-fallback locale", () => {
  for (const locale of ["fr", "ar", "zh", "yo", "hi"] as const) {
    const html = render({ locale, lens: "support", available: FULL, withData: true });
    assertCleanHtml(html, `${locale}/support`);
    assert.ok(html.includes(getStaffIntelligenceCopy(locale).recommendation.advisoryNote.slice(0, 12)));
  }
});

test("RENDER: lens tabs are links, the active one marked aria-current, the trust tab absent without security", () => {
  const withTrust = render({ locale: "en", lens: "finance", available: FULL, withData: true });
  assert.ok(withTrust.includes('href="/modules/staff-intelligence?lens=trust"'));
  assert.match(withTrust, /href="\/modules\/staff-intelligence\?lens=finance"[^>]*aria-current="page"/);

  const withoutTrust = render({ locale: "en", lens: "support", available: NON_SECURITY, withData: true });
  assert.equal(withoutTrust.includes("?lens=trust"), false, "a non-security viewer is never offered the trust tab");
});

test("RENDER: the advisory promise is on the surface, and every card offers only human choices", () => {
  const copy = getStaffIntelligenceCopy("en");
  const html = render({ locale: "en", lens: "support", available: FULL, withData: true });
  assert.ok(html.includes(copy.recommendation.advisoryNote), "the page must say suggestions change nothing on their own");
  for (const label of [copy.recommendation.actions.accept, copy.recommendation.actions.dismiss, copy.recommendation.actions.snooze]) {
    assert.ok(html.includes(label), `missing the "${label}" choice`);
  }
});

test("RENDER: interpolation is complete — card text shows real values, not tokens", () => {
  const html = render({ locale: "en", lens: "support", available: FULL, withData: true });
  // staffing_increase: "...needs about 5 people a day next week (2 more than now)."
  assert.ok(html.includes("5 people"), "staffing figure interpolated");
  assert.ok(html.includes("2 more"), "extra headcount interpolated");
  // The anomaly series code is localized, not shown as a raw slug.
  assert.ok(html.includes(getStaffIntelligenceCopy("en").chart.refund_requests));
});

test("RENDER: the forecast chart and drill-down links render", () => {
  const copy = getStaffIntelligenceCopy("en");
  const html = render({ locale: "en", lens: "support", available: FULL, withData: true });
  assert.ok(html.includes(copy.chart.support_forecast), "the 7-day forecast is charted");
  assert.ok(html.includes(copy.chart.next7Days));
  assert.ok(html.includes('stroke-dasharray="3 3"'), "the forecast line is drawn dashed");
  assert.ok(html.includes('href="/modules/staff-support"'), "a chart drills into its queue module");
  assert.ok(html.includes("unit-1"), "in-dashboard drill rows render");
});

test("RENDER: no raw score vocabulary reaches the client markup", () => {
  const html = render({ locale: "en", lens: "finance", available: FULL, withData: true });
  for (const word of ["likelihood", "risk_score", "deterministic_score", "coefficients"]) {
    assert.equal(html.includes(word), false, `"${word}" reached the client`);
  }
});

test("RENDER: the scoped mobile CSS is mounted", () => {
  const html = render({ locale: "en", lens: "support", available: FULL, withData: true });
  assert.ok(html.includes("hc-intel-desktop-only"));
  assert.ok(html.includes("max-width: 767px"));
});
