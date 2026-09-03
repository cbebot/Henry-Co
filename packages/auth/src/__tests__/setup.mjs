/**
 * @henryco/auth test bootstrap — wires up three things:
 *
 *   1. A Node import hook (loader.mjs) that resolves `server-only` to
 *      a no-op so server-side modules can be imported in tests.
 *   2. Minimal browser globals (window, document, sessionStorage,
 *      BroadcastChannel, navigator) so client modules — which feature-
 *      detect these — exercise their real code paths instead of the
 *      no-op fallbacks.
 *   3. A `globalThis.__resetAuthTestState` helper for `beforeEach`.
 *
 * Usage: `tsx --import ./src/__tests__/setup.mjs --test ...`
 */

import { register } from "node:module";

register("./loader.mjs", import.meta.url);

// ─── sessionStorage shim ────────────────────────────────────────────
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

const storage = makeStorage();

// ─── document shim ──────────────────────────────────────────────────
const documentShim = {
  cookie: "",
  visibilityState: "visible",
  addEventListener: () => {},
  removeEventListener: () => {},
};

// ─── window shim ────────────────────────────────────────────────────
const windowShim = {
  sessionStorage: storage,
  addEventListener: () => {},
  removeEventListener: () => {},
};

// ─── BroadcastChannel shim ──────────────────────────────────────────
// Keyed by channel name so two instances on the same name talk to each
// other (same as the real browser API). Listeners are per-instance —
// a publisher does NOT receive its own postMessage (browser-accurate).
const __broadcastChannels = new Map();

class FakeBroadcastChannel {
  constructor(name) {
    this.name = name;
    this.listeners = new Set();
    if (!__broadcastChannels.has(name)) __broadcastChannels.set(name, new Set());
    __broadcastChannels.get(name).add(this);
  }
  postMessage(data) {
    const peers = __broadcastChannels.get(this.name) ?? new Set();
    for (const peer of peers) {
      if (peer === this) continue;
      for (const l of peer.listeners) {
        try {
          l({ data });
        } catch {
          /* swallow listener errors so peers still receive */
        }
      }
    }
  }
  addEventListener(_evt, fn) {
    this.listeners.add(fn);
  }
  removeEventListener(_evt, fn) {
    this.listeners.delete(fn);
  }
  set onmessage(fn) {
    this.listeners.clear();
    if (fn) this.listeners.add(fn);
  }
  close() {
    this.listeners.clear();
    __broadcastChannels.get(this.name)?.delete(this);
  }
}

// ─── navigator shim ─────────────────────────────────────────────────
const navigatorShim = { onLine: true };

// Install globals only if missing (don't shadow a real DOM if some
// future test runner provides one). BroadcastChannel is the exception:
// Node 18+ ships a real one, but its first-postMessage involves an
// async handle-setup that races against our `await setTimeout(0)`
// drain in tests, making delivery non-deterministic. Force the
// in-process synchronous fake so tests see predictable cross-instance
// delivery.
if (typeof globalThis.window === "undefined") globalThis.window = windowShim;
if (typeof globalThis.document === "undefined") globalThis.document = documentShim;
if (typeof globalThis.navigator === "undefined") globalThis.navigator = navigatorShim;
globalThis.BroadcastChannel = FakeBroadcastChannel;

// ─── Reset helper for per-test cleanup ──────────────────────────────
globalThis.__resetAuthTestState = () => {
  storage.__backing.clear();
  documentShim.cookie = "";
  for (const set of __broadcastChannels.values()) {
    for (const ch of set) ch.listeners.clear();
  }
  __broadcastChannels.clear();
  navigatorShim.onLine = true;
};
