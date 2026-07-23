import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  resolveDailyCeilingKobo,
  isDailyCeilingReached,
  utcDayKey,
  utcDayStartIso,
  DEFAULT_DAILY_CEILING_KOBO,
} from "@/lib/agency/daily-budget";

describe("daily provider-spend ceiling — a runaway ARC aborts before it overspends", () => {
  it("defaults to the seeded ceiling when unset or garbage", () => {
    assert.equal(resolveDailyCeilingKobo({}), DEFAULT_DAILY_CEILING_KOBO);
    assert.equal(resolveDailyCeilingKobo({ STUDIO_AGENCY_DAILY_CEILING_KOBO: "" }), DEFAULT_DAILY_CEILING_KOBO);
    // A non-positive/garbage value must NEVER disable the ceiling (fail safe).
    assert.equal(resolveDailyCeilingKobo({ STUDIO_AGENCY_DAILY_CEILING_KOBO: "0" }), DEFAULT_DAILY_CEILING_KOBO);
    assert.equal(resolveDailyCeilingKobo({ STUDIO_AGENCY_DAILY_CEILING_KOBO: "-5" }), DEFAULT_DAILY_CEILING_KOBO);
    assert.equal(resolveDailyCeilingKobo({ STUDIO_AGENCY_DAILY_CEILING_KOBO: "nope" }), DEFAULT_DAILY_CEILING_KOBO);
  });

  it("honours a tuned ceiling from env", () => {
    assert.equal(resolveDailyCeilingKobo({ STUDIO_AGENCY_DAILY_CEILING_KOBO: "50000000" }), 50_000_000);
  });

  it("reaches the ceiling at or above it (the tick then refuses new dispatch)", () => {
    const ceiling = 30_000_000;
    assert.equal(isDailyCeilingReached(29_999_999, ceiling), false);
    assert.equal(isDailyCeilingReached(30_000_000, ceiling), true);
    assert.equal(isDailyCeilingReached(45_000_000, ceiling), true);
  });

  it("a runaway arc of 3 max-cap jobs (₦100k each) trips the default ceiling", () => {
    // Per-job ceiling is 10,000,000 kobo. Three of them = 30,000,000 = the default day line.
    const threeMaxJobs = 3 * 10_000_000;
    assert.equal(isDailyCeilingReached(threeMaxJobs, DEFAULT_DAILY_CEILING_KOBO), true);
  });

  it("N jobs in ONE tick cannot compound past the ceiling — in-tick reservation aborts the arc", () => {
    // This is the fix for the adversarial finding: dispatch COMMITS spend the
    // accrued figure can't see until later heartbeats, so the tick reserves each
    // job's worst-case envelope in-tick. Simulate the exact gate the tick runs.
    const ceilingKobo = DEFAULT_DAILY_CEILING_KOBO; // ₦300,000
    const jobBudgetKobo = 10_000_000; // a max-cap ₦100,000 job
    const accruedKobo = 0; // start of a fresh UTC day
    let committedKobo = 0;
    let dispatched = 0;
    for (let i = 0; i < 50; i += 1) {
      if (isDailyCeilingReached(accruedKobo + committedKobo + jobBudgetKobo, ceilingKobo)) break; // hold
      committedKobo += jobBudgetKobo;
      dispatched += 1;
    }
    // The arc aborts far short of 50 — worst-case committed spend never crosses
    // the company-day line, even though every job individually is under-cap.
    assert.ok(dispatched < 50, "the arc must abort, not dispatch all 50");
    assert.equal(dispatched, 2); // 2×₦100k committed; a 3rd would reach ₦300k
    assert.ok(committedKobo <= ceilingKobo, "committed spend never exceeds the ceiling");
  });

  it("utc day helpers scope to the calendar day", () => {
    const now = new Date("2026-07-20T15:30:00.000Z");
    assert.equal(utcDayKey(now), "2026-07-20");
    assert.equal(utcDayStartIso(now), "2026-07-20T00:00:00.000Z");
  });
});
