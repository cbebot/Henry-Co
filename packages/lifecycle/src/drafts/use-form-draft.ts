"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { emitEvent } from "@henryco/observability/events";

import {
  clearDraft,
  isStale,
  loadDraft,
  saveDraft,
} from "./draft-storage";
import type { DraftEnvelope } from "./types";

/**
 * useFormDraft — the V3-01 form persistence hook (S2).
 *
 * Auto-save + restore + clear, keyed by a stable per-form string. The
 * key is what V3-01's reauth round-trip carries through the
 * `drafts=<key>` query param, so restoration after a reauth picks up
 * the form's state exactly where the user left it.
 *
 * Behaviour:
 *   - On mount: tries `loadDraft(key)`. If found AND version matches,
 *     restores the value, exposes `savedAt` + `isStale` (per
 *     Addendum A8 — 24h threshold), and emits
 *     `henry.auth.session.draft_restored` once.
 *   - On `value` change: debounces by `debounceMs` (default 500) and
 *     writes a fresh envelope to both localStorage and the
 *     sessionStorage mirror.
 *   - `clear()` after a successful submit; `discard()` to revert to
 *     `initialValue` AND clear storage.
 *
 * SSR-safe — feature-detects window/storage; on the server the hook
 * returns the initial value and `isRestored: false`.
 *
 * @example
 *   const draft = useFormDraft("support-thread-new", {
 *     subject: "",
 *     body: "",
 *   });
 *   ...
 *   <textarea
 *     value={draft.value.body}
 *     onChange={(e) => draft.setValue((v) => ({ ...v, body: e.target.value }))}
 *   />
 *   ...
 *   async function onSubmit() {
 *     await postThread(draft.value);
 *     draft.clear();
 *   }
 */
export type UseFormDraftOptions = {
  /** Debounce ms for auto-save. Default 500. */
  debounceMs?: number;
  /**
   * Schema version. Bump when the shape of `value` changes in a
   * breaking way so older drafts are ignored on restore.
   */
  version?: number;
  /** Skip the mount-time restore (mostly for tests / explicit-reset flows). */
  skipRestore?: boolean;
};

export type UseFormDraftResult<T> = {
  /** The current form state. */
  value: T;
  /** Standard React state setter. */
  setValue: React.Dispatch<React.SetStateAction<T>>;
  /** True once mount-time restoration has settled. False during SSR + first paint. */
  isRestored: boolean;
  /** True when the restored draft is older than 24h (Addendum A8). */
  isStale: boolean;
  /** Wall-clock ms of the last save (null until first save / restore). */
  savedAt: number | null;
  /** Discard the draft and reset to `initialValue`. Used on the staleness "Start fresh" path. */
  discard: () => void;
  /** Clear the draft from storage (use after a successful submit). */
  clear: () => void;
};

const DEFAULT_DEBOUNCE_MS = 500;

export function useFormDraft<T>(
  key: string,
  initialValue: T,
  options: UseFormDraftOptions = {},
): UseFormDraftResult<T> {
  const { debounceMs = DEFAULT_DEBOUNCE_MS, version = 1, skipRestore } = options;

  const [value, setValue] = useState<T>(initialValue);
  const [isRestored, setIsRestored] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [stale, setStale] = useState(false);

  // Stable refs so the auto-save effect doesn't re-bind on every render.
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoredRef = useRef(false);

  // ─── mount: restore ──────────────────────────────────────────────
  useEffect(() => {
    if (skipRestore) {
      setIsRestored(true);
      restoredRef.current = true;
      return;
    }
    const stored = loadDraft<T>(key);
    if (stored && stored.version === version) {
      setValue(stored.value);
      setSavedAt(stored.savedAt);
      setStale(isStale(stored));
      emitEvent({
        name: "henry.auth.session.draft_restored",
        classification: "system_state",
        outcome: "completed",
        payload: { key, ageMs: Date.now() - stored.savedAt },
      });
    }
    setIsRestored(true);
    restoredRef.current = true;
  }, [key, skipRestore, version]);

  // ─── auto-save on change (debounced) ──────────────────────────────
  useEffect(() => {
    // Skip the synthetic initial render before restore lands. After
    // restore, every subsequent `value` change triggers a save.
    if (!restoredRef.current) return;
    if (saveTimerRef.current != null) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      const envelope: DraftEnvelope<T> = {
        key,
        value,
        savedAt: Date.now(),
        version,
      };
      saveDraft(envelope);
      setSavedAt(envelope.savedAt);
      setStale(false);
    }, debounceMs);
    return () => {
      if (saveTimerRef.current != null) clearTimeout(saveTimerRef.current);
    };
  }, [key, value, debounceMs, version]);

  const discard = useCallback(() => {
    clearDraft(key);
    setValue(initialValue);
    setSavedAt(null);
    setStale(false);
  }, [key, initialValue]);

  const clear = useCallback(() => {
    clearDraft(key);
    setSavedAt(null);
    setStale(false);
  }, [key]);

  return {
    value,
    setValue,
    isRestored,
    isStale: stale,
    savedAt,
    discard,
    clear,
  };
}
