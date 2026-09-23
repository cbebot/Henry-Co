import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  deriveRecommendations,
  recommendationsForScope,
  recommendationScopeForKey,
  SERIES_SCOPE,
  assertHumanActor,
  RECOMMENDATION_KINDS,
  RECOMMENDATION_ROLE_SCOPES,
  RECOMMENDATION_STATUSES,
  type DeriveRecommendationsInput,
} from "../recommendations";
import type { AnomalyResult } from "../anomaly";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const AS_OF = "2026-09-17T00:00:00.000Z"; // a Thursday, ISO week 38

function anomaly(over: Partial<AnomalyResult> & { series: string }): AnomalyResult {
  return {
    detected: true,
    observed: 90,
    expected: 20,
    deviation: 4.2,
    band: "alert",
    windowDescription: "window_rolling",
    baselineCount: 28,
    basis: "robust",
    at: "2026-09-17T00:00:00.000Z",
    ...over,
  };
}

test("a healthy platform produces no cards at all", () => {
  const cards = deriveRecommendations({ asOf: AS_OF });
  assert.deepEqual(cards, [], "an empty rail is the correct output when nothing is wrong");
});

test("a seasonal forecast above capacity raises a staffing card on the SUPPORT lens", () => {
  const cards = deriveRecommendations({
    asOf: AS_OF,
    forecasts: [
      {
        queue: "support",
        basis: "seasonal",
        currentAgents: 3,
        staffing: [
          { date: "2026-09-18", recommendedAgents: 5, rationale: "forecast_above_capacity" },
          { date: "2026-09-19", recommendedAgents: 4, rationale: "forecast_within_capacity" },
        ],
      },
    ],
  });
  assert.equal(cards.length, 1);
  const [card] = cards;
  assert.equal(card.kind, "staffing_increase");
  assert.equal(card.roleScope, "support");
  assert.equal(card.severity, "attention");
  assert.equal(card.params.recommended, 5);
  assert.equal(card.params.extra, 2, "5 recommended - 3 covering = 2 more");
  assert.equal(card.key, "workload.staffing.support.2026-W38", "stable, week-bucketed key");
  assert.equal(card.advisory, true);
});

test("a SPARSE or EMPTY forecast can never become a staffing instruction", () => {
  // V3-41 reports its own evidence basis precisely so a downstream surface
  // cannot launder "we have barely any history" into "hire two people".
  for (const basis of ["sparse", "empty"] as const) {
    const cards = deriveRecommendations({
      asOf: AS_OF,
      forecasts: [
        {
          queue: "support",
          basis,
          currentAgents: 1,
          staffing: [{ date: "2026-09-18", recommendedAgents: 25, rationale: "forecast_above_capacity" }],
        },
      ],
    });
    assert.deepEqual(cards, [], `a ${basis} forecast must raise nothing`);
  }
});

test("no staffing card when current cover already meets the forecast", () => {
  const cards = deriveRecommendations({
    asOf: AS_OF,
    forecasts: [
      {
        queue: "support",
        basis: "seasonal",
        currentAgents: 9,
        staffing: [{ date: "2026-09-18", recommendedAgents: 4, rationale: "forecast_within_capacity" }],
      },
    ],
  });
  assert.deepEqual(cards, [], "do not nag about a queue that is already covered");
});

test("anomalies route to the lens that owns the series — and nowhere else", () => {
  const cards = deriveRecommendations({
    asOf: AS_OF,
    anomalies: [
      anomaly({ series: "refund_requests" }),
      anomaly({ series: "support_volume" }),
      anomaly({ series: "enforcement_actions" }),
      anomaly({ series: "report_volume" }),
    ],
  });
  const byScope = Object.fromEntries(cards.map((c) => [c.params.series, c.roleScope]));
  assert.equal(byScope.refund_requests, "finance");
  assert.equal(byScope.support_volume, "support");
  assert.equal(byScope.enforcement_actions, "trust");
  assert.equal(byScope.report_volume, "moderation");
});

test("an UNDETECTED anomaly raises nothing, and an unknown series is dropped", () => {
  const cards = deriveRecommendations({
    asOf: AS_OF,
    anomalies: [
      anomaly({ series: "refund_requests", detected: false }),
      anomaly({ series: "some_series_nobody_registered" }),
    ],
  });
  assert.deepEqual(cards, []);
});

test("CROSS-LENS: a risk-backlog card exists ONLY on the trust lens", () => {
  // V3-40's tables are readable only by security staff (is_staff_in('security')).
  // A card derived from them must never appear on a lens whose operators could
  // not read the underlying rows.
  const cards = deriveRecommendations({
    asOf: AS_OF,
    riskBacklog: { review: 12, freeze: 2 },
    disputeWatch: { high: 3, watch: 5 },
    atRisk: { high: 4, elevated: 9 },
  });
  const riskCards = cards.filter((c) => c.kind === "review_risk_backlog");
  assert.equal(riskCards.length, 1);
  assert.equal(riskCards[0].roleScope, "trust");
  for (const scope of ["finance", "support", "moderation"] as const) {
    assert.equal(
      recommendationsForScope(cards, scope).some((c) => c.kind === "review_risk_backlog"),
      false,
      `a risk card leaked onto the ${scope} lens`,
    );
  }
});

test("the hindsight rule card needs real volume and deep-links to REVIEW, not a rule builder", () => {
  const thin = deriveRecommendations({
    asOf: AS_OF,
    disputeHindsight: { factor: "item_not_received_reported", disputes: 3, windowDays: 30 },
  });
  assert.deepEqual(thin, [], "three disputes is an anecdote, not a pattern");

  const [card] = deriveRecommendations({
    asOf: AS_OF,
    disputeHindsight: { factor: "item_not_received_reported", disputes: 12, windowDays: 30 },
  });
  assert.equal(card.kind, "rule_suggestion_hindsight");
  assert.equal(card.roleScope, "trust");
  assert.equal(card.params.disputes, 12);
  assert.equal(card.href, "/modules/staff-risk", "links a human to review — never to auto-create a rule");
});

test("NO AUTO-ACT: no card can carry an operation, a mutation or a payload to apply", () => {
  const cards = deriveRecommendations({
    asOf: AS_OF,
    forecasts: [
      {
        queue: "support",
        basis: "seasonal",
        currentAgents: 1,
        staffing: [{ date: "2026-09-18", recommendedAgents: 6, rationale: "forecast_above_capacity" }],
      },
    ],
    anomalies: [anomaly({ series: "refund_requests" })],
    riskBacklog: { review: 3, freeze: 1 },
    disputeWatch: { high: 2, watch: 1 },
    atRisk: { high: 1, elevated: 1 },
    disputeHindsight: { factor: "delivery_confirmation_gap", disputes: 9, windowDays: 30 },
  });
  assert.ok(cards.length >= 5);
  for (const card of cards) {
    assert.equal(card.advisory, true, "every card is advisory");
    assert.ok(RECOMMENDATION_KINDS.includes(card.kind));
    assert.ok(RECOMMENDATION_ROLE_SCOPES.includes(card.roleScope));
    const keys = Object.keys(card);
    for (const forbidden of ["apply", "execute", "mutation", "action", "operation", "sql", "rule", "payload"]) {
      assert.equal(keys.includes(forbidden), false, `a card exposed an executable field "${forbidden}"`);
    }
    // A deep link is a LINK — relative, in-app, never a mutating endpoint.
    if (card.href) {
      assert.ok(card.href.startsWith("/modules/"), `href must be an in-app surface, got ${card.href}`);
      assert.equal(card.href.includes("/api/"), false, "a card must never point at a mutating endpoint");
    }
  }
});

test("NO AUTO-ACT: the runtime guard refuses a state change without a human actor", () => {
  for (const status of ["accepted", "dismissed", "snoozed"]) {
    assert.throws(
      () => assertHumanActor(status, null),
      /requires a human actor/,
      `"${status}" without an actor must be refused`,
    );
    assert.throws(() => assertHumanActor(status, "   "), /requires a human actor/);
    assert.doesNotThrow(() => assertHumanActor(status, "staff-uuid-1"));
  }
  assert.doesNotThrow(() => assertHumanActor("open", null), "an untouched card needs no actor");
  assert.throws(() => assertHumanActor("applied", "staff-uuid-1"), /is not a recommendation status/);
  assert.deepEqual([...RECOMMENDATION_STATUSES], ["open", "accepted", "dismissed", "snoozed"]);
});

test("cards carry CODES and NUMBERS, never operator prose", () => {
  const cards = deriveRecommendations({
    asOf: AS_OF,
    anomalies: [anomaly({ series: "refund_requests" })],
    atRisk: { high: 2, elevated: 3 },
  });
  for (const card of cards) {
    assert.match(card.key, /^[a-z0-9._-]+$/, `key must be a slug, got "${card.key}"`);
    for (const [name, value] of Object.entries(card.params)) {
      if (typeof value === "string") {
        assert.match(value, /^[a-zA-Z0-9._-]+$/, `param ${name} looks like prose: "${value}"`);
        assert.equal(value.includes(" "), false, `param ${name} contains a space — that is a sentence`);
      } else {
        assert.ok(Number.isFinite(value), `param ${name} must be finite`);
      }
    }
  }
});

test("per-lens cap keeps the rail readable", () => {
  const anomalies = Array.from({ length: 10 }, (_, i) =>
    anomaly({ series: "refund_requests", at: `2026-09-${String(i + 1).padStart(2, "0")}T00:00:00.000Z` }),
  );
  const cards = deriveRecommendations({ asOf: AS_OF, anomalies, maxPerScope: 3 });
  assert.equal(recommendationsForScope(cards, "finance").length, 3);
});

test("PURE: identical input yields identical output, input unmutated", () => {
  const input: DeriveRecommendationsInput = {
    asOf: AS_OF,
    atRisk: { high: 2, elevated: 4 },
    anomalies: [anomaly({ series: "support_volume" })],
  };
  const snapshot = JSON.stringify(input);
  assert.deepEqual(deriveRecommendations(input), deriveRecommendations(input));
  assert.equal(JSON.stringify(input), snapshot);
});

test("keys are stable within a week and roll over between weeks", () => {
  const forecasts = [
    {
      queue: "support" as const,
      basis: "seasonal" as const,
      currentAgents: 1,
      staffing: [{ date: "2026-09-18", recommendedAgents: 4, rationale: "forecast_above_capacity" as const }],
    },
  ];
  const monday = deriveRecommendations({ asOf: "2026-09-14T09:00:00.000Z", forecasts })[0];
  const friday = deriveRecommendations({ asOf: "2026-09-18T17:00:00.000Z", forecasts })[0];
  const nextWeek = deriveRecommendations({ asOf: "2026-09-22T09:00:00.000Z", forecasts })[0];
  assert.equal(monday.key, friday.key, "same week => same card, so a dismissal sticks");
  assert.notEqual(friday.key, nextWeek.key, "new week => the card may be raised again");
});

test("HOSTILE input degrades instead of throwing", () => {
  const cards = deriveRecommendations({
    asOf: "not-a-date",
    forecasts: [
      {
        queue: "support",
        basis: "seasonal",
        currentAgents: Number.NaN,
        staffing: [
          { date: "x", recommendedAgents: Number.POSITIVE_INFINITY, rationale: "forecast_above_capacity" },
          { date: "y", recommendedAgents: -5, rationale: "forecast_within_capacity" },
        ],
      },
    ],
    atRisk: { high: Number.NaN, elevated: -3 },
    disputeWatch: { high: Number.POSITIVE_INFINITY, watch: Number.NaN },
    riskBacklog: null,
    maxPerScope: Number.NaN,
  });
  for (const card of cards) {
    for (const value of Object.values(card.params)) {
      if (typeof value === "number") assert.ok(Number.isFinite(value), "no card may carry a garbage number");
    }
  }
});

test("STRUCTURAL: the engine has no path to an AI gateway, a database or a clock", () => {
  const source = readFileSync(path.join(HERE, "..", "recommendations.ts"), "utf8");
  for (const forbidden of ["ai-gateway", "runAiTask", "supabase", "fetch(", "Date.now", "Math.random"]) {
    assert.equal(source.includes(forbidden), false, `must not reference "${forbidden}"`);
  }
});

// ── key -> lens resolution (the write path's consistency check) ─────────────

test("ROUND-TRIP: every key the engine emits resolves back to its own lens", () => {
  const anomalies = Object.keys(SERIES_SCOPE).map((series) => anomaly({ series }));
  const cards = deriveRecommendations({
    asOf: AS_OF,
    maxPerScope: 50,
    forecasts: [
      {
        queue: "support",
        basis: "seasonal",
        currentAgents: 1,
        staffing: [{ date: "2026-09-18", recommendedAgents: 6, rationale: "forecast_above_capacity" }],
      },
    ],
    anomalies,
    atRisk: { high: 2, elevated: 1 },
    disputeWatch: { high: 1, watch: 1 },
    riskBacklog: { review: 1, freeze: 1 },
    disputeHindsight: { factor: "item_not_received_reported", disputes: 9, windowDays: 30 },
  });
  // Every kind is represented, so the resolver is exercised on every key shape.
  assert.deepEqual(new Set(cards.map((c) => c.kind)).size, RECOMMENDATION_KINDS.length);
  for (const card of cards) {
    assert.equal(
      recommendationScopeForKey(card.key),
      card.roleScope,
      `key "${card.key}" resolved to ${recommendationScopeForKey(card.key)}, card says ${card.roleScope}`,
    );
  }
});

test("key resolution refuses anything the engine never emits", () => {
  for (const bad of [
    "",
    "x",
    "risk",
    "risk.nope.2026-09-17",
    "anomaly.unknown_series.2026-09-17",
    "anomaly.__proto__.2026-09-17",
    "anomaly.constructor.x",
    "workload.hack.support.2026-W38",
    "risk.backlog.2026-09-17 <script>",
    "risk.backlog. ",
    "a".repeat(400),
    null,
    undefined,
    42,
    {},
  ]) {
    assert.equal(recommendationScopeForKey(bad), null, `${JSON.stringify(bad)} must not resolve to a lens`);
  }
});

test("a trust-SHAPED key can never be claimed by another lens", () => {
  for (const key of ["risk.backlog.2026-09-17", "hindsight.rule.item_not_received_reported.2026-09-17", "anomaly.enforcement_actions.2026-09-17"]) {
    assert.equal(recommendationScopeForKey(key), "trust");
  }
});
