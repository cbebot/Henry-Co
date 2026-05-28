/**
 * V3-02 S2 — known-storage / clear-henryco-storage tests.
 *
 * Verifies:
 *   - The prefix predicates recognise the documented HenryCo
 *     storage shapes (`henryco:`, `henryco.`, `henryco_`, `henryco-`).
 *   - `clearHenryCoStorage()` removes only HenryCo-prefixed
 *     localStorage keys and leaves other keys intact.
 *   - The IndexedDB fallback list covers the V3-01/02 expected names.
 */

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  HENRYCO_CACHE_NAME_PREFIX,
  HENRYCO_INDEXED_DB_PREFIX,
  HENRYCO_STORAGE_PREFIXES,
  KNOWN_HENRYCO_INDEXED_DB_NAMES,
  isHenryCoCacheName,
  isHenryCoIndexedDbName,
  isHenryCoStorageKey,
} from "../client/known-storage";
import { clearHenryCoStorage } from "../client/clear-henryco-storage";

declare const __resetAuthTestState: () => void;

beforeEach(() => {
  __resetAuthTestState();
});

test("known-storage: prefix constants match the documented convention", () => {
  assert.equal(HENRYCO_INDEXED_DB_PREFIX, "henryco_");
  assert.equal(HENRYCO_CACHE_NAME_PREFIX, "henryco-");
  assert.deepEqual(HENRYCO_STORAGE_PREFIXES, ["henryco:", "henryco."]);
});

test("known-storage: isHenryCoStorageKey recognises both canonical separators", () => {
  assert.equal(isHenryCoStorageKey("henryco:cart"), true);
  assert.equal(isHenryCoStorageKey("henryco.draft.abc"), true);
  assert.equal(isHenryCoStorageKey("notHenryCoKey"), false);
  assert.equal(isHenryCoStorageKey(""), false);
});

test("known-storage: isHenryCoIndexedDbName + isHenryCoCacheName match prefixes", () => {
  assert.equal(isHenryCoIndexedDbName("henryco_drafts_v1"), true);
  assert.equal(isHenryCoIndexedDbName("supabase_drafts"), false);
  assert.equal(isHenryCoCacheName("henryco-static-v1"), true);
  assert.equal(isHenryCoCacheName("workbox-precache-v1"), false);
});

test("known-storage: fallback list includes V3-01/02 expected databases", () => {
  const names = new Set(KNOWN_HENRYCO_INDEXED_DB_NAMES);
  assert.ok(names.has("henryco_drafts_v1"));
  assert.ok(names.has("henryco_intelligence_queue_v1"));
  assert.ok(names.has("henryco_branded_doc_cache_v1"));
});

test("clear-henryco-storage: removes only HenryCo-prefixed localStorage", async () => {
  // The setup.mjs sessionStorage shim is reused for localStorage here
  // via globalThis.window.sessionStorage; the helper also reads
  // window.localStorage, so we install a separate fake.
  const win = globalThis.window as unknown as { localStorage?: unknown };
  const backing = new Map<string, string>();
  const fake = {
    get length() {
      return backing.size;
    },
    key(i: number) {
      return Array.from(backing.keys())[i] ?? null;
    },
    setItem(k: string, v: string) {
      backing.set(k, v);
    },
    getItem(k: string) {
      return backing.has(k) ? backing.get(k)! : null;
    },
    removeItem(k: string) {
      backing.delete(k);
    },
    clear() {
      backing.clear();
    },
  };
  win.localStorage = fake;

  fake.setItem("henryco:cart", "1");
  fake.setItem("henryco.draft.abc", "2");
  fake.setItem("third-party-key", "3");

  const report = await clearHenryCoStorage();

  assert.equal(report.localStorageKeysRemoved, 2);
  assert.equal(fake.getItem("henryco:cart"), null);
  assert.equal(fake.getItem("henryco.draft.abc"), null);
  assert.equal(fake.getItem("third-party-key"), "3");
});
