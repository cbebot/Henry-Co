/**
 * draft-storage primitives — load / save / clear / isStale /
 * listDrafts / readSessionMirror.
 *
 * Storage shims provided by setup.mjs (Map-backed window.localStorage
 * + window.sessionStorage). Each test resets state via the global
 * helper installed by setup.mjs.
 */

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  STALE_THRESHOLD_MS,
  clearDraft,
  isStale,
  listDrafts,
  loadDraft,
  readSessionMirror,
  saveDraft,
} from "../drafts/draft-storage";
import type { DraftEnvelope } from "../drafts/types";

declare const __resetDraftTestState: () => void;

beforeEach(() => __resetDraftTestState());

const NOW = 1_700_000_000_000;

function envelope<T>(
  key: string,
  value: T,
  savedAt: number = NOW,
  version: number = 1,
): DraftEnvelope<T> {
  return { key, value, savedAt, version };
}

function rawLocal(name: string): string | null {
  return (globalThis as { window: { localStorage: { getItem: (k: string) => string | null } } })
    .window.localStorage.getItem(name);
}
function rawSession(name: string): string | null {
  return (globalThis as { window: { sessionStorage: { getItem: (k: string) => string | null } } })
    .window.sessionStorage.getItem(name);
}
function rawLocalSet(name: string, value: string): void {
  (globalThis as { window: { localStorage: { setItem: (k: string, v: string) => void } } })
    .window.localStorage.setItem(name, value);
}
function rawSessionSet(name: string, value: string): void {
  (globalThis as { window: { sessionStorage: { setItem: (k: string, v: string) => void } } })
    .window.sessionStorage.setItem(name, value);
}

// ─── load ─────────────────────────────────────────────────────────

test("loadDraft: empty storage → null", () => {
  assert.equal(loadDraft("missing"), null);
});

test("loadDraft: round-trips via localStorage", () => {
  saveDraft(envelope("rt-test", { name: "Henry", n: 3 }));
  const got = loadDraft<{ name: string; n: number }>("rt-test");
  assert.deepEqual(got?.value, { name: "Henry", n: 3 });
  assert.equal(got?.key, "rt-test");
  assert.equal(got?.version, 1);
});

test("loadDraft: returns null on corrupt JSON in localStorage", () => {
  rawLocalSet("henryco.draft.corrupt", "{not-valid-json");
  assert.equal(loadDraft("corrupt"), null);
});

test("loadDraft: returns null when envelope shape invalid", () => {
  rawLocalSet(
    "henryco.draft.invalid",
    JSON.stringify({ value: "x" }), // missing key + savedAt + version
  );
  assert.equal(loadDraft("invalid"), null);
});

test("loadDraft: falls back to sessionStorage mirror when localStorage entry missing", () => {
  // Save via the helper (writes both stores), then remove only the local copy.
  saveDraft(envelope("mirror-key", { fields: 3 }));
  (
    globalThis as { window: { localStorage: { removeItem: (k: string) => void } } }
  ).window.localStorage.removeItem("henryco.draft.mirror-key");
  const got = loadDraft<{ fields: number }>("mirror-key");
  assert.deepEqual(got?.value, { fields: 3 });
});

// ─── save ─────────────────────────────────────────────────────────

test("saveDraft: writes to BOTH localStorage and sessionStorage mirror", () => {
  saveDraft(envelope("save-test", "draft-body"));
  const local = rawLocal("henryco.draft.save-test");
  const session = rawSession("henryco.draft-mirror.save-test");
  assert.ok(local?.includes("draft-body"), "localStorage write");
  assert.ok(session?.includes("draft-body"), "sessionStorage write");
});

test("saveDraft: subsequent save overwrites prior", () => {
  saveDraft(envelope("overwrite", "v1"));
  saveDraft(envelope("overwrite", "v2"));
  assert.equal(loadDraft<string>("overwrite")?.value, "v2");
});

// ─── clear ────────────────────────────────────────────────────────

test("clearDraft: removes from BOTH storages", () => {
  saveDraft(envelope("clr-test", { v: 1 }));
  clearDraft("clr-test");
  assert.equal(loadDraft("clr-test"), null);
  assert.equal(readSessionMirror("clr-test"), null);
});

test("clearDraft: idempotent — clearing a missing key is a no-op", () => {
  // Should NOT throw.
  clearDraft("never-existed");
  assert.equal(loadDraft("never-existed"), null);
});

// ─── isStale ──────────────────────────────────────────────────────

test("isStale: fresh draft → false", () => {
  assert.equal(isStale(envelope("k", null, NOW), NOW), false);
});

test("isStale: under 24h → false", () => {
  assert.equal(isStale(envelope("k", null, NOW - 60_000), NOW), false);
});

test("isStale: exactly 24h → false (boundary)", () => {
  assert.equal(isStale(envelope("k", null, NOW - STALE_THRESHOLD_MS), NOW), false);
});

test("isStale: over 24h → true", () => {
  assert.equal(isStale(envelope("k", null, NOW - STALE_THRESHOLD_MS - 1), NOW), true);
});

// ─── listDrafts ──────────────────────────────────────────────────

test("listDrafts: empty storage → empty array", () => {
  assert.deepEqual(listDrafts(), []);
});

test("listDrafts: returns all henryco.draft.* entries", () => {
  saveDraft(envelope("first", { a: 1 }));
  saveDraft(envelope("second", { b: 2 }));
  // Add an unrelated key — should NOT appear in the listing.
  rawLocalSet("other-key", "value");
  const all = listDrafts();
  assert.equal(all.length, 2);
  assert.ok(all.find((d) => d.key === "first"));
  assert.ok(all.find((d) => d.key === "second"));
});

test("listDrafts: skips corrupt entries silently", () => {
  saveDraft(envelope("good", { a: 1 }));
  rawLocalSet("henryco.draft.bad", "not-json");
  const all = listDrafts();
  assert.equal(all.length, 1);
  assert.equal(all[0]!.key, "good");
});

// ─── readSessionMirror standalone ────────────────────────────────

test("readSessionMirror: returns mirror entry independent of localStorage", () => {
  rawSessionSet(
    "henryco.draft-mirror.session-only",
    JSON.stringify(envelope("session-only", { x: "y" })),
  );
  const got = readSessionMirror<{ x: string }>("session-only");
  assert.deepEqual(got?.value, { x: "y" });
});

test("readSessionMirror: returns null on corrupt mirror entry", () => {
  rawSessionSet("henryco.draft-mirror.corrupt", "{nope");
  assert.equal(readSessionMirror("corrupt"), null);
});
