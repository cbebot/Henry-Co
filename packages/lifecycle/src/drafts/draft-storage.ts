/**
 * Draft storage adapter — localStorage primary + sessionStorage mirror.
 *
 * Why both:
 *   - localStorage is the natural fit (per-origin, survives reload,
 *     survives tab close). The primary persistence.
 *   - sessionStorage mirror is a belt-and-braces backup that survives
 *     a same-tab reauth round-trip even on browsers / partitioned-
 *     storage contexts where the localStorage write hasn't flushed
 *     before the page navigates. The mirror is keyed under a separate
 *     prefix so it never collides with the slice-1 Idempotency-Key
 *     entry (`henryco.inflight-idempotency.<key>`).
 *
 * All functions are pure / synchronous and feature-detect window +
 * storage at call time. SSR-safe.
 */

import type { DraftEnvelope } from "./types";

const STORAGE_KEY_PREFIX = "henryco.draft.";
const SESSION_MIRROR_PREFIX = "henryco.draft-mirror.";

/** 24 hours in ms — Addendum A8 staleness threshold. */
export const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

function hasLocalStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

function hasSessionStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return typeof window.sessionStorage !== "undefined";
  } catch {
    return false;
  }
}

function isValidEnvelope(value: unknown): value is DraftEnvelope<unknown> {
  if (!value || typeof value !== "object") return false;
  const v = value as { key?: unknown; savedAt?: unknown; version?: unknown };
  return (
    typeof v.key === "string" &&
    typeof v.savedAt === "number" &&
    typeof v.version === "number"
  );
}

/**
 * Load a draft by key. Tries localStorage first, falls back to the
 * sessionStorage mirror. Returns null when nothing is found or when
 * the stored payload doesn't satisfy the envelope shape.
 */
export function loadDraft<T = unknown>(key: string): DraftEnvelope<T> | null {
  if (hasLocalStorage()) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_PREFIX + key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (isValidEnvelope(parsed)) return parsed as DraftEnvelope<T>;
        } catch {
          /* corrupt — fall through */
        }
      }
    } catch {
      /* storage disabled — fall through */
    }
  }
  return readSessionMirror<T>(key);
}

/**
 * Save (or update) a draft. Writes to both localStorage and the
 * sessionStorage mirror. Silently ignores storage failures (quota,
 * private-mode, etc.) — auto-save should not throw into the host
 * component.
 */
export function saveDraft<T>(envelope: DraftEnvelope<T>): void {
  const serialized = JSON.stringify(envelope);
  if (hasLocalStorage()) {
    try {
      window.localStorage.setItem(STORAGE_KEY_PREFIX + envelope.key, serialized);
    } catch {
      /* quota exceeded / disabled — silently degrade */
    }
  }
  if (hasSessionStorage()) {
    try {
      window.sessionStorage.setItem(SESSION_MIRROR_PREFIX + envelope.key, serialized);
    } catch {
      /* */
    }
  }
}

/** Remove the draft from BOTH storages (use on successful submit OR discard). */
export function clearDraft(key: string): void {
  if (hasLocalStorage()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY_PREFIX + key);
    } catch {
      /* */
    }
  }
  if (hasSessionStorage()) {
    try {
      window.sessionStorage.removeItem(SESSION_MIRROR_PREFIX + key);
    } catch {
      /* */
    }
  }
}

/**
 * Read the sessionStorage mirror directly (without touching
 * localStorage). Used as the fallback path inside `loadDraft`, and
 * exposed for callers that explicitly want the mirror semantics.
 */
export function readSessionMirror<T = unknown>(
  key: string,
): DraftEnvelope<T> | null {
  if (!hasSessionStorage()) return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_MIRROR_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (isValidEnvelope(parsed)) return parsed as DraftEnvelope<T>;
    return null;
  } catch {
    return null;
  }
}

/**
 * Is the saved envelope older than the 24-hour staleness threshold
 * (Addendum A8)? Pass `now` for deterministic testing.
 */
export function isStale(
  envelope: DraftEnvelope<unknown>,
  now: number = Date.now(),
): boolean {
  return now - envelope.savedAt > STALE_THRESHOLD_MS;
}

/**
 * List every draft currently in localStorage. Used by the
 * `DraftPanel` "continue where you left off" UI. Corrupt entries are
 * skipped silently.
 */
export function listDrafts(): DraftEnvelope<unknown>[] {
  if (!hasLocalStorage()) return [];
  const out: DraftEnvelope<unknown>[] = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const name = window.localStorage.key(i);
      if (!name || !name.startsWith(STORAGE_KEY_PREFIX)) continue;
      const raw = window.localStorage.getItem(name);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (isValidEnvelope(parsed)) out.push(parsed);
      } catch {
        /* skip corrupt */
      }
    }
  } catch {
    /* */
  }
  return out;
}
