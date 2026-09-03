/**
 * @henryco/lifecycle/drafts test bootstrap — shims the window /
 * localStorage / sessionStorage globals the draft-storage adapter
 * feature-checks for, plus exposes a `__resetDraftTestState` helper
 * for per-test cleanup.
 *
 * Usage: `tsx --import ./src/__tests__/setup.mjs --test ...`
 */

import { register } from "node:module";

register("./loader.mjs", import.meta.url);

function makeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => {
      m.set(k, String(v));
    },
    removeItem: (k) => {
      m.delete(k);
    },
    clear: () => {
      m.clear();
    },
    get length() {
      return m.size;
    },
    key: (i) => Array.from(m.keys())[i] ?? null,
    __backing: m,
  };
}

const localStorage = makeStorage();
const sessionStorage = makeStorage();

const windowShim = {
  localStorage,
  sessionStorage,
  addEventListener: () => {},
  removeEventListener: () => {},
};

if (typeof globalThis.window === "undefined") globalThis.window = windowShim;

globalThis.__resetDraftTestState = () => {
  localStorage.__backing.clear();
  sessionStorage.__backing.clear();
};
