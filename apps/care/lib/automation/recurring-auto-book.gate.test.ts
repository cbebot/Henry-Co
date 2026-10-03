import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Run from apps/care (so the `@/` path alias resolves):
//   node --conditions=react-server --import tsx --test lib/automation/recurring-auto-book.gate.test.ts
//
// V3-CARE-JOBS-PREAPPLY-FIX-01. The recurring sweep is flag-dark: it books only
// with CARE_RECURRING_AUTOBOOK=1. The Supabase env points at a stub host and
// fetch is replaced before the module (and its Supabase client) loads, so no
// request leaves the process whatever env the runner has; the test counts the
// requests the sweep makes.

const NOW = new Date("2026-10-05T08:15:00.000Z");
const requests: string[] = [];

async function loadSweep() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://sweep.test";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    requests.push(url);
    // An empty due set: the scan reads its pages and ends.
    return new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  return import("./recurring-auto-book");
}

function setFlag(value: string | undefined) {
  if (value === undefined) delete process.env.CARE_RECURRING_AUTOBOOK;
  else process.env.CARE_RECURRING_AUTOBOOK = value;
}

describe("CARE_RECURRING_AUTOBOOK gate", () => {
  it("is on only for 1, allowing the stray whitespace a saved env value can carry", async () => {
    const { isRecurringAutoBookEnabled } = await loadSweep();
    for (const value of [undefined, "", "0", "true", "yes", "on", "10", "1.0", "01", "1 0"]) {
      setFlag(value);
      assert.equal(isRecurringAutoBookEnabled(), false, JSON.stringify(value));
    }
    for (const value of ["1", "1\n", "\r\n1\r\n", " 1 "]) {
      setFlag(value);
      assert.equal(isRecurringAutoBookEnabled(), true, JSON.stringify(value));
    }
    setFlag(undefined);
  });

  it("while off, the sweep returns a no-op summary and makes no request", async () => {
    const { runRecurringAutoBookSweep } = await loadSweep();
    for (const value of [undefined, "0", "true"]) {
      setFlag(value);
      requests.length = 0;
      const summary = await runRecurringAutoBookSweep(NOW);
      assert.deepEqual(summary, {
        enabled: false,
        scheduledRunsConsidered: 0,
        bookingsCreated: 0,
        skippedDuplicates: 0,
        skippedInvalid: 0,
        skippedDeferred: 0,
        scanStoppedBy: null,
      });
      assert.equal(requests.length, 0, JSON.stringify(value));
    }
    setFlag(undefined);
  });

  it("while on, the sweep reads the due schedules", async () => {
    const { runRecurringAutoBookSweep } = await loadSweep();
    setFlag("1");
    requests.length = 0;
    const summary = await runRecurringAutoBookSweep(NOW);
    assert.equal(summary.enabled, true);
    assert.equal(summary.scanStoppedBy, null);
    assert.ok(requests.length >= 1);
    assert.ok(requests.every((url) => new URL(url).pathname === "/rest/v1/care_recurring_schedules"));
    setFlag(undefined);
  });
});
