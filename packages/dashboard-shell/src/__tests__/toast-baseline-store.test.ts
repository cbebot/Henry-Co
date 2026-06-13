/**
 * Session-persisted toast baseline store (V3-DASH-TOAST-02) — the durable dedup
 * that stops the realtime toasts re-firing on every router.refresh() remount.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  loadPersistedBaseline,
  persistBaseline,
} from "../components/notifications/toast-baseline-store";
import { initialToastBaselineState } from "../components/notifications/toast-selection";

type G = typeof globalThis & { window?: { sessionStorage: Storage } };

function installStorage(): Map<string, string> {
  const map = new Map<string, string>();
  (globalThis as G).window = {
    sessionStorage: {
      getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
      setItem: (k: string, v: string) => void map.set(k, v),
      removeItem: (k: string) => void map.delete(k),
      clear: () => map.clear(),
      key: () => null,
      length: 0,
    } as unknown as Storage,
  };
  return map;
}
function clearStorage(): void {
  delete (globalThis as G).window;
}

test("SSR (no window) → fresh initial state; persist is a safe no-op", () => {
  clearStorage();
  const s = loadPersistedBaseline("customer");
  assert.equal(s.ready, false);
  assert.equal(s.seen.size, 0);
  // must not throw without a window
  persistBaseline("customer", { ready: true, seen: new Set(["x"]) });
});

test("persist → load round-trips the seen set as ready:true (survives a remount)", () => {
  installStorage();
  persistBaseline("customer", { ready: true, seen: new Set(["a", "b"]) });
  const s = loadPersistedBaseline("customer");
  assert.equal(s.ready, true);
  assert.deepEqual([...s.seen].sort(), ["a", "b"]);
  clearStorage();
});

test("audience keys are isolated (staff dedup never contaminates customer)", () => {
  installStorage();
  persistBaseline("customer", { ready: true, seen: new Set(["c1"]) });
  persistBaseline("staff", { ready: true, seen: new Set(["s1"]) });
  assert.deepEqual([...loadPersistedBaseline("customer").seen], ["c1"]);
  assert.deepEqual([...loadPersistedBaseline("staff").seen], ["s1"]);
  clearStorage();
});

test("a not-ready baseline is never persisted (don't freeze an empty set)", () => {
  installStorage();
  persistBaseline("customer", initialToastBaselineState()); // ready:false
  assert.equal(loadPersistedBaseline("customer").ready, false);
  clearStorage();
});

test("seen set is capped at MAX_SEEN, keeping the most-recent ids", () => {
  installStorage();
  const ids = Array.from({ length: 300 }, (_, i) => `id${i}`);
  persistBaseline("customer", { ready: true, seen: new Set(ids) });
  const s = loadPersistedBaseline("customer");
  assert.equal(s.seen.size, 250);
  assert.ok(s.seen.has("id299"), "newest retained");
  assert.ok(!s.seen.has("id0"), "oldest pruned");
  clearStorage();
});

test("corrupt stored value degrades to a fresh initial state (never throws)", () => {
  const map = installStorage();
  map.set("hc-toast-baseline:customer", "{not-json");
  assert.equal(loadPersistedBaseline("customer").ready, false);
  map.set("hc-toast-baseline:customer", JSON.stringify({ not: "an array" }));
  assert.equal(loadPersistedBaseline("customer").ready, false);
  clearStorage();
});
