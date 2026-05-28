/**
 * V3-02 S2 — scoped browser-storage tear-down on logout.
 *
 * Clears HenryCo-owned client-side storage WITHOUT touching anything
 * else the browser holds for the user. The contract per spec is:
 *
 *   - localStorage entries whose key starts with `henryco:` or
 *     `henryco.` (Addendum A5 + V3-01 draft compatibility)
 *   - sessionStorage entries under the same prefix rule
 *   - IndexedDB databases whose name starts with `henryco_` —
 *     enumerated via `indexedDB.databases()` where available, with
 *     a known-names fallback for older Safari (Addendum A5)
 *   - Cache API caches whose name starts with `henryco-`
 *
 * Explicit non-goals:
 *   - `localStorage.clear()` — destroys non-HenryCo entries the user
 *     owns (other origins are isolated by the same-origin policy,
 *     but inside a shared origin the user may have third-party
 *     scripts storing things; spec forbids the nuclear option).
 *   - Cookies — handled by the server-side logout route + the
 *     companion `logout-everywhere` orchestrator.
 *
 * SSR-safe: every step is gated on the presence of the relevant
 * browser global, with try/catch around each individual mutation.
 * A single failure (e.g. quota-exhausted IndexedDB) MUST NOT abort
 * the rest of the tear-down — the user is leaving and we want as
 * little leftover as possible.
 */

import {
  HENRYCO_STORAGE_PREFIXES,
  KNOWN_HENRYCO_INDEXED_DB_NAMES,
  isHenryCoCacheName,
  isHenryCoIndexedDbName,
  isHenryCoStorageKey,
} from "./known-storage";

export type ClearHenryCoStorageReport = {
  localStorageKeysRemoved: number;
  sessionStorageKeysRemoved: number;
  indexedDbDatabasesDeleted: number;
  cachesDeleted: number;
  errors: ReadonlyArray<{ stage: string; message: string }>;
};

type WebStorageLike = {
  length: number;
  key(index: number): string | null;
  removeItem(key: string): void;
};

function clearWebStorage(
  storage: WebStorageLike | undefined,
  errors: { stage: string; message: string }[],
  stage: "localStorage" | "sessionStorage",
): number {
  if (!storage) return 0;
  let removed = 0;
  try {
    // Snapshot first — removing during iteration shifts indices.
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (key && isHenryCoStorageKey(key)) keys.push(key);
    }
    for (const key of keys) {
      try {
        storage.removeItem(key);
        removed += 1;
      } catch (e) {
        errors.push({
          stage,
          message: e instanceof Error ? e.message : String(e),
        });
      }
    }
  } catch (e) {
    errors.push({
      stage,
      message: e instanceof Error ? e.message : String(e),
    });
  }
  return removed;
}

async function deleteIndexedDb(
  name: string,
  errors: { stage: string; message: string }[],
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.deleteDatabase(name);
      req.onsuccess = () => resolve(true);
      req.onerror = () => {
        errors.push({
          stage: "indexedDB.deleteDatabase",
          message: `${name}: ${req.error?.message ?? "unknown"}`,
        });
        resolve(false);
      };
      // `onblocked` fires when another tab holds the database open.
      // Resolve false — the other tab will receive the broadcast and
      // close its handles; the next logout-everywhere will succeed.
      req.onblocked = () => {
        errors.push({
          stage: "indexedDB.deleteDatabase",
          message: `${name}: blocked by open connection in another context`,
        });
        resolve(false);
      };
    } catch (e) {
      errors.push({
        stage: "indexedDB.deleteDatabase",
        message: `${name}: ${e instanceof Error ? e.message : String(e)}`,
      });
      resolve(false);
    }
  });
}

async function clearIndexedDb(
  errors: { stage: string; message: string }[],
): Promise<number> {
  if (typeof indexedDB === "undefined") return 0;

  let names: string[] = [];
  // Modern path — enumerate everything.
  const enumerator = (
    indexedDB as IDBFactory & {
      databases?: () => Promise<IDBDatabaseInfo[]>;
    }
  ).databases;
  if (typeof enumerator === "function") {
    try {
      const databases = await enumerator.call(indexedDB);
      names = databases
        .map((d) => d.name)
        .filter((n): n is string => typeof n === "string" && isHenryCoIndexedDbName(n));
    } catch (e) {
      errors.push({
        stage: "indexedDB.databases",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // Safari fallback / belt-and-braces — also walk the known list.
  // De-duplicate with the enumerator result.
  const seen = new Set(names);
  for (const fallbackName of KNOWN_HENRYCO_INDEXED_DB_NAMES) {
    if (!seen.has(fallbackName)) {
      names.push(fallbackName);
      seen.add(fallbackName);
    }
  }

  let deleted = 0;
  for (const name of names) {
    // `deleteDatabase` on an absent name is a no-op; we still count
    // success as deleted because the database is gone afterwards.
    const ok = await deleteIndexedDb(name, errors);
    if (ok) deleted += 1;
  }
  return deleted;
}

async function clearCaches(
  errors: { stage: string; message: string }[],
): Promise<number> {
  if (typeof caches === "undefined") return 0;
  let deleted = 0;
  try {
    const names = await caches.keys();
    const henrycoNames = names.filter(isHenryCoCacheName);
    for (const name of henrycoNames) {
      try {
        const ok = await caches.delete(name);
        if (ok) deleted += 1;
      } catch (e) {
        errors.push({
          stage: "caches.delete",
          message: `${name}: ${e instanceof Error ? e.message : String(e)}`,
        });
      }
    }
  } catch (e) {
    errors.push({
      stage: "caches.keys",
      message: e instanceof Error ? e.message : String(e),
    });
  }
  return deleted;
}

/**
 * Clear every HenryCo-scoped piece of client-side storage. Resolves
 * with a report of what was removed so the caller can emit
 * structured telemetry. Never throws — internal failures land in
 * `errors[]` so the caller decides whether to surface them.
 */
export async function clearHenryCoStorage(): Promise<ClearHenryCoStorageReport> {
  if (typeof window === "undefined") {
    return {
      localStorageKeysRemoved: 0,
      sessionStorageKeysRemoved: 0,
      indexedDbDatabasesDeleted: 0,
      cachesDeleted: 0,
      errors: [],
    };
  }

  const errors: { stage: string; message: string }[] = [];

  const localStorageLike = (() => {
    try {
      return window.localStorage as unknown as WebStorageLike;
    } catch {
      return undefined;
    }
  })();
  const sessionStorageLike = (() => {
    try {
      return window.sessionStorage as unknown as WebStorageLike;
    } catch {
      return undefined;
    }
  })();

  const localStorageKeysRemoved = clearWebStorage(
    localStorageLike,
    errors,
    "localStorage",
  );
  const sessionStorageKeysRemoved = clearWebStorage(
    sessionStorageLike,
    errors,
    "sessionStorage",
  );
  const indexedDbDatabasesDeleted = await clearIndexedDb(errors);
  const cachesDeleted = await clearCaches(errors);

  return {
    localStorageKeysRemoved,
    sessionStorageKeysRemoved,
    indexedDbDatabasesDeleted,
    cachesDeleted,
    errors,
  };
}

/** Exposed for downstream tests that want to assert prefix rules. */
export const _HENRYCO_STORAGE_PREFIXES = HENRYCO_STORAGE_PREFIXES;
