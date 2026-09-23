import { test } from "node:test";
import assert from "node:assert/strict";

import { isSeriesFresh, loadLensSnapshot, type IntelligenceSupabaseClient } from "../data";

/**
 * An in-memory PostgREST stand-in: the filters the loaders use, applied for
 * real, with the production response cap (max_rows = 1000) enforced — the cap
 * is what round 1 and round 2 both found data silently disappearing behind.
 */
const MAX_ROWS = 1000;
type Row = Record<string, unknown>;

function fakeClient(tables: Record<string, Row[]>): IntelligenceSupabaseClient {
  return {
    from(table: string) {
      return {
        select(columns: string) {
          let rows = [...(tables[table] ?? [])];
          const chain = {
            eq(column: string, value: string) {
              rows = rows.filter((r) => r[column] === value);
              return chain;
            },
            in(column: string, values: readonly string[]) {
              rows = rows.filter((r) => values.includes(String(r[column])));
              return chain;
            },
            gte(column: string, value: string) {
              rows = rows.filter((r) => String(r[column]) >= value);
              return chain;
            },
            order(column: string, options?: { ascending?: boolean }) {
              const dir = options?.ascending === false ? -1 : 1;
              rows.sort((a, b) => (String(a[column]) < String(b[column]) ? -dir : String(a[column]) > String(b[column]) ? dir : 0));
              return chain;
            },
            async limit(count: number) {
              const keep = columns.split(",").map((c) => c.trim());
              const data = rows.slice(0, Math.min(count, MAX_ROWS)).map((r) => {
                const out: Row = {};
                for (const c of keep) out[c] = r[c];
                return out;
              });
              return { data, error: null };
            },
          };
          return chain;
        },
      };
    },
  };
}

const DAY = 86_400_000;
const dateOf = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** A workload forecast row whose batch observed complete days up to `lastDay`. */
function forecastRow(generatedAt: string, lastDay: string, days: number, perDay: number): Row {
  const lastMs = Date.parse(`${lastDay}T00:00:00.000Z`);
  const observedDaily = Array.from({ length: days }, (_, i) => ({
    date: dateOf(lastMs - (days - 1 - i) * DAY),
    count: perDay,
  }));
  return {
    queue: "support",
    generated_at: generatedAt,
    basis: "seasonal",
    payload: { observedDaily, staffingRecommendation: [], perHour: [] },
  };
}

test("ROUND-2: before tonight's run, the chart ends at the last day the batch OBSERVED — no false zero", () => {
  // 01:30 UTC on 09-23: the newest forecast ran 09-22 02:47 and saw complete
  // days only through 09-21. "Yesterday" (09-22) must NOT be padded with 0.
  const now = new Date("2026-09-23T01:30:00.000Z");
  const client = fakeClient({ workload_forecasts: [forecastRow("2026-09-22T02:47:00.000Z", "2026-09-21", 27, 48)] });
  return loadLensSnapshot(client, "support", now).then((snapshot) => {
    const volume = snapshot.series.find((s) => s.key === "support_volume")!;
    assert.ok(volume.points.length > 0);
    assert.equal(volume.points[volume.points.length - 1].at.slice(0, 10), "2026-09-21");
    assert.ok(volume.points.every((p) => p.value === 48), "no fabricated zero anywhere in the window");
  });
});

test("ROUND-2: the window never starts before the batch's first observed day (no leading zero)", async () => {
  const now = new Date("2026-09-23T10:00:00.000Z");
  const client = fakeClient({ workload_forecasts: [forecastRow("2026-09-23T02:47:00.000Z", "2026-09-22", 27, 48)] });
  const snapshot = await loadLensSnapshot(client, "support", now);
  const volume = snapshot.series.find((s) => s.key === "support_volume")!;
  assert.equal(volume.points.length, 27);
  assert.equal(volume.points[0].value, 48, "point 0 is observed data, not a padded 0");
});

test("ROUND-2: a night that flagged NOTHING shows nothing — not yesterday's alarm", async () => {
  const now = new Date("2026-09-23T10:00:00.000Z");
  const yesterday: Row[] = Array.from({ length: 30 }, (_, i) => ({
    unit_id: `unit-${i}`,
    risk_band: "high",
    assessed_at: "2026-09-22T02:50:00.000Z",
  }));
  const today: Row[] = Array.from({ length: 30 }, (_, i) => ({
    unit_id: `unit-${i}`,
    risk_band: "low",
    assessed_at: "2026-09-23T02:50:00.000Z",
  }));
  const client = fakeClient({ quality_assessments: [...yesterday, ...today] });
  const snapshot = await loadLensSnapshot(client, "support", now);
  assert.deepEqual(snapshot.bands.quality, {}, "today's batch is the latest, and it flagged nobody");
  assert.equal(snapshot.drill.length, 0);
});

test("ROUND-2: the latest batch's flagged units are still counted once each", async () => {
  const now = new Date("2026-09-23T10:00:00.000Z");
  const rows: Row[] = [
    { unit_id: "a", risk_band: "high", assessed_at: "2026-09-23T02:50:00.000Z" },
    { unit_id: "b", risk_band: "elevated", assessed_at: "2026-09-23T02:50:00.000Z" },
    { unit_id: "c", risk_band: "low", assessed_at: "2026-09-23T02:50:00.000Z" },
    { unit_id: "a", risk_band: "high", assessed_at: "2026-09-22T02:50:00.000Z" },
  ];
  const snapshot = await loadLensSnapshot(fakeClient({ quality_assessments: rows }), "support", now);
  assert.deepEqual(snapshot.bands.quality, { high: 1, elevated: 1 });
});

test("ROUND-2: a series whose batch stopped is not judged as 'now'", () => {
  const now = new Date("2026-09-23T10:00:00.000Z");
  const at = (d: string) => [{ at: `${d}T00:00:00.000Z`, value: 1 }];
  assert.equal(isSeriesFresh(at("2026-09-23"), now), true, "journal point from today's run");
  assert.equal(isSeriesFresh(at("2026-09-22"), now), true, "yesterday's complete day");
  assert.equal(isSeriesFresh(at("2026-09-21"), now), true, "before tonight's run, D-2 is the newest");
  assert.equal(isSeriesFresh(at("2026-09-20"), now), false, "three days old: the batch has stopped");
  assert.equal(isSeriesFresh([], now), false);
});

test("ROUND-3: two predictive runs the same day — only the NEWEST run's flags count", async () => {
  const now = new Date("2026-09-23T10:00:00.000Z");
  const rows: Row[] = [
    // Run 1 (02:47) flagged a and b; run 2 (09:00, manual) cleared b.
    { unit_id: "a", risk_band: "high", assessed_at: "2026-09-23T02:47:00.000Z" },
    { unit_id: "b", risk_band: "high", assessed_at: "2026-09-23T02:47:00.000Z" },
    { unit_id: "a", risk_band: "high", assessed_at: "2026-09-23T09:00:00.000Z" },
    { unit_id: "b", risk_band: "low", assessed_at: "2026-09-23T09:00:00.000Z" },
  ];
  const snapshot = await loadLensSnapshot(fakeClient({ quality_assessments: rows }), "support", now);
  assert.deepEqual(snapshot.bands.quality, { high: 1 }, "b was cleared by the newest run");
  assert.deepEqual(snapshot.drill.map((d) => d.id), ["a"]);
});
