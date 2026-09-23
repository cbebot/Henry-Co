import { test } from "node:test";
import assert from "node:assert/strict";

import { ALL_LOCALES } from "@henryco/i18n";
import { getStaffIntelligenceCopy } from "@henryco/i18n/server";
import {
  ANOMALY_SERIES_KEYS,
  RECOMMENDATION_KINDS,
  RECOMMENDATION_ROLE_SCOPES,
} from "@henryco/intelligence";

/**
 * The engines emit CODES; this asserts every code that can reach a surface has
 * words behind it, in every locale. Without this a new series key or card kind
 * renders as a raw slug to an operator — or worse, as an empty string.
 */

const LOCALES = ALL_LOCALES;

test("every locale resolves a complete copy object", () => {
  assert.ok(LOCALES.length === 12, `expected 12 locales, got ${LOCALES.length}`);
  for (const locale of LOCALES) {
    const copy = getStaffIntelligenceCopy(locale);
    assert.ok(copy.module.title.trim(), `${locale}: module.title empty`);
    assert.ok(copy.recommendation.advisoryNote.trim(), `${locale}: the advisory note must never be blank`);
  }
});

test("every LENS has a name in every locale", () => {
  for (const locale of LOCALES) {
    const copy = getStaffIntelligenceCopy(locale);
    for (const scope of RECOMMENDATION_ROLE_SCOPES) {
      const label = (copy.lens as unknown as Record<string, string>)[scope];
      assert.ok(typeof label === "string" && label.trim(), `${locale}: lens "${scope}" has no label`);
    }
  }
});

test("every ANOMALY SERIES key has a chart title in every locale", () => {
  // Every observed series is an anomaly series key; the support lens also
  // charts its 7-day forecast.
  const charted = [...ANOMALY_SERIES_KEYS, "support_forecast"];
  for (const locale of LOCALES) {
    const copy = getStaffIntelligenceCopy(locale);
    const titles = copy.chart as unknown as Record<string, string>;
    for (const key of charted) {
      assert.ok(
        typeof titles[key] === "string" && titles[key].trim(),
        `${locale}: series "${key}" has no chart title`,
      );
    }
  }
});

test("every RECOMMENDATION KIND has card text in every locale", () => {
  for (const locale of LOCALES) {
    const copy = getStaffIntelligenceCopy(locale);
    const templates = copy.recommendation as unknown as Record<string, string>;
    for (const kind of RECOMMENDATION_KINDS) {
      assert.ok(
        typeof templates[kind] === "string" && templates[kind].trim(),
        `${locale}: recommendation kind "${kind}" has no text`,
      );
    }
  }
});

test("every anomaly WINDOW code and band has copy in every locale", () => {
  for (const locale of LOCALES) {
    const copy = getStaffIntelligenceCopy(locale);
    for (const code of ["window_rolling", "window_insufficient"] as const) {
      assert.ok(copy.anomaly[code].trim(), `${locale}: anomaly code "${code}" missing`);
    }
    for (const band of ["watch", "alert"] as const) {
      assert.ok(copy.anomaly.band[band].trim(), `${locale}: anomaly band "${band}" missing`);
    }
  }
});

test("every card ACTION label exists in every locale", () => {
  for (const locale of LOCALES) {
    const actions = getStaffIntelligenceCopy(locale).recommendation.actions;
    for (const key of ["accept", "dismiss", "snooze", "open", "accepted", "dismissed", "snoozed", "failed"] as const) {
      assert.ok(actions[key].trim(), `${locale}: action "${key}" missing`);
    }
  }
});

test("placeholders SURVIVE translation — a dropped {param} would render a hole", () => {
  const required: Record<string, string[]> = {
    staffing_increase: ["{queue}", "{recommended}", "{extra}"],
    investigate_anomaly: ["{series}", "{deviation}", "{observed}", "{expected}"],
    review_at_risk_units: ["{high}", "{elevated}"],
    review_dispute_watchlist: ["{high}", "{watch}"],
    review_risk_backlog: ["{review}", "{freeze}"],
    rule_suggestion_hindsight: ["{disputes}", "{windowDays}", "{factor}"],
  };
  for (const locale of LOCALES) {
    const templates = getStaffIntelligenceCopy(locale).recommendation as unknown as Record<string, string>;
    for (const [kind, tokens] of Object.entries(required)) {
      for (const token of tokens) {
        assert.ok(
          templates[kind].includes(token),
          `${locale}: recommendation "${kind}" lost placeholder ${token}`,
        );
      }
    }
    const anomalySummary = getStaffIntelligenceCopy(locale).anomaly.summary;
    for (const token of ["{observed}", "{expected}", "{deviation}", "{window}"]) {
      assert.ok(anomalySummary.includes(token), `${locale}: anomaly.summary lost ${token}`);
    }
    const mobile = getStaffIntelligenceCopy(locale).mobile.openRecommendations;
    assert.ok(mobile.includes("{count}"), `${locale}: mobile.openRecommendations lost {count}`);
  }
});

test("ig / yo / ha / hi fall back to English rather than being machine-translated", () => {
  const en = getStaffIntelligenceCopy("en");
  for (const locale of ["ig", "yo", "ha", "hi"] as const) {
    assert.equal(
      getStaffIntelligenceCopy(locale).module.title,
      en.module.title,
      `${locale} must pass through to English (Onyx Line WS-2 policy)`,
    );
  }
});
