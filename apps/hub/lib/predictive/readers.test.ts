import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { QUEUE_HISTORY_PAGE_SIZE, QUEUE_HISTORY_ROW_LIMIT } from "./config";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(HERE, "readers.ts"), "utf8");
const queueHistory = source.slice(
  source.indexOf("export async function readQueueHistory"),
  source.indexOf("export type ServiceUnitCandidate"),
);

describe("V3-42 round 2 — queue history survives the PostgREST row cap", () => {
  it("reads NEWEST-first, so a capped read drops the oldest history, never the newest", () => {
    assert.ok(queueHistory.includes("ascending: false"), "must order DESC");
    assert.equal(queueHistory.includes("ascending: true"), false, "an ASC read loses the most recent days to max_rows");
  });

  it("pages at the server cap instead of asking for more than PostgREST will return", () => {
    assert.equal(QUEUE_HISTORY_PAGE_SIZE, 1000, "matches max_rows in apps/hub/supabase/config.toml");
    assert.ok(QUEUE_HISTORY_ROW_LIMIT % QUEUE_HISTORY_PAGE_SIZE === 0);
    assert.ok(queueHistory.includes(".range(offset, offset + QUEUE_HISTORY_PAGE_SIZE - 1)"));
    assert.equal(/\.limit\(QUEUE_HISTORY_ROW_LIMIT\)/.test(queueHistory), false, "a single .limit(5000) is silently capped at 1000");
    const config = readFileSync(path.resolve(HERE, "..", "..", "supabase", "config.toml"), "utf8");
    assert.match(config, /max_rows\s*=\s*1000/);
  });

  it("a truncated read starts the history AFTER its partly-counted oldest hour", () => {
    assert.ok(queueHistory.includes("partialFromMs + MS_PER_HOUR"));
  });
});

describe("V3-42 round 3 — the volume chart is EXACT, and a dormant queue keeps its zeros", () => {
  const daily = source.slice(
    source.indexOf("export async function readQueueDailyCounts"),
    source.indexOf("export type ServiceUnitCandidate"),
  );

  it("counts each day server-side (head: true) so max_rows can never truncate it", () => {
    assert.ok(daily.includes('count: "exact", head: true'));
    assert.ok(daily.includes(".lt(source.column"), "each day is a half-open [start, next) window");
  });

  it("fails CLOSED: any uncountable day withholds the whole series", () => {
    assert.ok(daily.includes("return null"));
  });

  it("an untruncated history starts at `since`, not at the first arrival", () => {
    assert.ok(queueHistory.includes("Math.ceil(since.getTime() / MS_PER_HOUR) * MS_PER_HOUR"));
  });

  it("a page error after page 1 is a truncation, not a complete read", () => {
    assert.ok(queueHistory.includes("exhausted = offset === 0"));
  });

  it("the batch publishes the exact counts, falling back to the sample's complete days", () => {
    const batch = readFileSync(path.join(HERE, "batch.ts"), "utf8");
    assert.ok(batch.includes("observedDaily: dailyCounts ?? summarizeObservedDaily(history)"));
  });
});
