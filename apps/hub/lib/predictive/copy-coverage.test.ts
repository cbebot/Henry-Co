import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  DISPUTE_FACTORS,
  QUALITY_INTERVENTIONS,
  QUEUE_KEYS,
  SERVICE_UNIT_TYPES,
} from "@henryco/intelligence";
import { getStaffPredictiveCopy } from "@henryco/i18n";
import { ALL_LOCALES } from "@henryco/i18n";

/**
 * V3-41 — EVERY code the engines can emit must have operator copy.
 *
 * The engines deliberately emit CODES, never English, so that all 12 locales work
 * and `i18n:check:strict` stays green. The cost of that design is a coupling the
 * type system cannot see: `packages/i18n/src/staff-predictive-copy.ts` and the
 * engine unions must stay in lockstep. A code with no copy entry renders
 * literally `undefined` on a staff screen — a silent, ugly failure nobody would
 * catch until an operator saw it.
 *
 * This test closes that gap: it walks the REAL exported code lists and asserts
 * every one resolves to a non-empty string, in EVERY locale.
 *
 * hub is the natural home because it is the only workspace that depends on both
 * @henryco/intelligence and @henryco/i18n, and its suite is CI-wired.
 */

// These unions are type-only at runtime, so they are pinned here explicitly and
// cross-checked against the engine source in `config.test.ts`'s sibling scans.
const STAFFING_RATIONALE_CODES = [
  "forecast_within_capacity",
  "forecast_above_capacity",
  "forecast_peak_hour_pressure",
  "insufficient_history",
] as const;

const QUALITY_REASON_CODES = [
  "provider_silent",
  "milestone_overdue",
  "payment_stalled",
  "provider_low_completion_rate",
  "provider_slow_response",
  "customer_disengaged",
  "prior_complaint_on_unit",
  "delivery_window_missed",
] as const;

const RISK_BANDS = ["low", "elevated", "high"] as const;
const DISPUTE_BANDS = ["low", "watch", "high"] as const;
const FORECAST_BASES = ["seasonal", "sparse", "empty"] as const;

describe("V3-41 operator copy covers every engine code, in every locale", () => {
  for (const locale of ALL_LOCALES) {
    it(`${locale}: no code renders undefined`, () => {
      const copy = getStaffPredictiveCopy(locale);
      const nonEmpty = (value: unknown, what: string) => {
        assert.equal(typeof value, "string", `${what} is missing for locale ${locale}`);
        assert.ok((value as string).trim().length > 0, `${what} is blank for locale ${locale}`);
      };

      for (const code of STAFFING_RATIONALE_CODES) {
        nonEmpty(copy.staffingRationale[code], `staffingRationale.${code}`);
      }
      for (const code of QUALITY_REASON_CODES) {
        nonEmpty(copy.qualityReason[code], `qualityReason.${code}`);
      }
      for (const code of QUALITY_INTERVENTIONS) {
        nonEmpty(copy.intervention[code], `intervention.${code}`);
      }
      for (const code of DISPUTE_FACTORS) {
        nonEmpty(copy.disputeFactor[code], `disputeFactor.${code}`);
      }
      for (const code of SERVICE_UNIT_TYPES) {
        nonEmpty(copy.unitType[code], `unitType.${code}`);
      }
      for (const band of RISK_BANDS) nonEmpty(copy.riskBand[band], `riskBand.${band}`);
      for (const band of DISPUTE_BANDS) nonEmpty(copy.disputeBand[band], `disputeBand.${band}`);
      for (const basis of FORECAST_BASES) nonEmpty(copy.evidence[basis], `evidence.${basis}`);

      // Panel chrome + the shadow-window honesty line.
      for (const key of [
        "kicker",
        "forecastTitle",
        "staffingTitle",
        "atRiskTitle",
        "disputeTitle",
        "shadowNotice",
        "emptyForecast",
        "emptyAtRisk",
        "emptyDispute",
        "advisoryNote",
      ] as const) {
        nonEmpty(copy.panel[key], `panel.${key}`);
      }
      for (const key of ["nextSevenDays", "busiestHour", "recommendedAgents"] as const) {
        nonEmpty(copy.forecast[key], `forecast.${key}`);
      }
      nonEmpty(copy.evidence.sampleSize, "evidence.sampleSize");
    });
  }

  it("the {count} placeholder survives every locale (the panel interpolates it)", () => {
    for (const locale of ALL_LOCALES) {
      const copy = getStaffPredictiveCopy(locale);
      assert.ok(
        copy.evidence.sampleSize.includes("{count}"),
        `locale ${locale} dropped the {count} placeholder — the sample size would never render`,
      );
    }
  });

  it("every forecastable queue key is a real engine key", () => {
    // The panel maps module slugs to queue keys; a drift here means a queue that
    // silently never gets a forecast panel.
    assert.deepEqual(
      [...QUEUE_KEYS].sort(),
      ["finance", "kyc_review", "logistics_ops", "moderation", "refunds", "support"],
    );
  });
});
