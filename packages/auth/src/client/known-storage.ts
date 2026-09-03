/**
 * Per V3-02 Addendum A5 — HenryCo client-side storage convention.
 *
 * Every IndexedDB database HenryCo opens MUST follow the naming
 * convention `henryco_<purpose>_v<n>`. Every localStorage /
 * sessionStorage key MUST be prefixed with `henryco:` (or the
 * historical equivalent `henryco.` used by V3-01 draft storage).
 *
 * `clearHenryCoStorage()` enumerates IndexedDB databases via
 * `indexedDB.databases()` and deletes any whose name starts with
 * `henryco_`. Older Safari (and the Web-Workers spec gap) lacks
 * `indexedDB.databases()`, so we fall back to the known-names list
 * below.
 *
 * Keep this list in sync with every HenryCo IndexedDB database
 * actually opened in the codebase. A CI lint can grep
 * `indexedDB.open(` calls and assert the name appears here; until
 * that lint lands, treat additions to this list as a contract
 * change that the writer + the clearer both honour.
 */

/**
 * Prefix the henryco_ IndexedDB convention requires. Used both for
 * deletion enumeration and for an assertion helper any HenryCo
 * IndexedDB writer can call.
 */
export const HENRYCO_INDEXED_DB_PREFIX = "henryco_";

/**
 * Prefixes the henryco: storage convention recognises. The `:`
 * variant is the canonical V3 form; the `.` variant is preserved
 * because V3-01 draft storage shipped with that separator
 * (`henryco.draft.<draftKey>`).
 */
export const HENRYCO_STORAGE_PREFIXES = ["henryco:", "henryco."] as const;

/**
 * The Cache API cache-names HenryCo owns. Any cache name in this list
 * (or matching the `henryco-` prefix) is dropped on logout-everywhere.
 *
 * Service workers may add caches dynamically — `cachePrefixes` covers
 * the dynamic case; explicit entries cover service-worker bundles
 * that ship with a fixed bundle name.
 */
export const HENRYCO_CACHE_NAME_PREFIX = "henryco-";

/**
 * Known IndexedDB databases used as the Safari fallback. Strict
 * naming convention: `henryco_<purpose>_v<n>`. New databases added
 * to the codebase must also be added here so the Safari clearer
 * picks them up.
 *
 * V3-02 is the first pass that codifies this list. The databases
 * named here are the surfaces V3-01 + V3-02 + V3-04 expect to use:
 *
 *   - henryco_drafts_v1 — useFormDraft draft cache (V3-01)
 *   - henryco_intelligence_queue_v1 — offline event queue
 *     (HenryCo Intelligence, scoped to anonymous + signed-in)
 *   - henryco_branded_doc_cache_v1 — branded-document renderer
 *     cache (proposal PDFs, etc.)
 *
 * Any future HenryCo IndexedDB writer MUST add its name here in the
 * same commit that opens the database.
 */
export const KNOWN_HENRYCO_INDEXED_DB_NAMES = [
  "henryco_drafts_v1",
  "henryco_intelligence_queue_v1",
  "henryco_branded_doc_cache_v1",
] as const;

/**
 * True if the given storage key looks like a HenryCo key under the
 * recognised prefix conventions. Exposed so callers can also
 * defensively filter without re-implementing the prefix list.
 */
export function isHenryCoStorageKey(key: string): boolean {
  for (const prefix of HENRYCO_STORAGE_PREFIXES) {
    if (key.startsWith(prefix)) return true;
  }
  return false;
}

/**
 * True if the given IndexedDB database name follows the HenryCo
 * naming convention.
 */
export function isHenryCoIndexedDbName(name: string): boolean {
  return name.startsWith(HENRYCO_INDEXED_DB_PREFIX);
}

/**
 * True if the given Cache API cache name belongs to HenryCo (either
 * explicit prefix match, or one of the explicit known names if any
 * are added in the future).
 */
export function isHenryCoCacheName(name: string): boolean {
  return name.startsWith(HENRYCO_CACHE_NAME_PREFIX);
}
