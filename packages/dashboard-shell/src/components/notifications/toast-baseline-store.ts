/**
 * Session-stable persistence for the toast dedup baseline (V3-DASH-TOAST-02).
 *
 * The baseline (the set of signal ids that must NOT toast — the pre-existing
 * unread backlog + everything already toasted this session) used to live in a
 * per-mount `useRef`. But `router.refresh()` — fired on every dashboard action
 * (mark-read/archive) AND by RouteLiveRefresh every ~15s — can re-suspend the
 * shell's Suspense boundary and REMOUNT the toast viewport + realtime provider.
 * On remount the `useRef` reset to empty, the backlog re-hydrated, and the whole
 * unread list was re-toasted as if freshly arrived (the "it keeps re-delivering
 * the notification on each click / fires all at once" report).
 *
 * The fix: persist the baseline in `sessionStorage`, keyed by audience, so a
 * remount RESTORES "already seen" instead of re-capturing an empty set. The
 * realtime backlog is therefore toasted at most once per session; only genuinely
 * new arrivals surface afterward. Mirrors the proven sessionStorage stamp used
 * by WalletCreditedToast / RecoveryNudge.
 *
 * SSR-safe (no `window` → in-memory initial state) and failure-tolerant (a
 * storage error degrades to the old per-mount behaviour, never throws).
 */
import { initialToastBaselineState, type ToastBaselineState } from "./toast-selection";

const KEY_PREFIX = "hc-toast-baseline:";
/** Bound the persisted set so a long-lived session can't grow it without limit. */
const MAX_SEEN = 250;

function storageKey(audience: string): string {
  return `${KEY_PREFIX}${audience}`;
}

function sessionStore(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage;
  } catch {
    return null; // storage disabled (private mode / blocked) → degrade gracefully
  }
}

/**
 * Restore the baseline for this audience. Returns a `ready: true` state when a
 * prior baseline exists (so a remount does NOT re-capture and re-toast the
 * backlog); otherwise the fresh `ready: false` initial state so the first mount
 * of a session establishes the baseline normally once hydration settles.
 */
export function loadPersistedBaseline(audience: string): ToastBaselineState {
  const store = sessionStore();
  if (!store) return initialToastBaselineState();
  try {
    const raw = store.getItem(storageKey(audience));
    if (!raw) return initialToastBaselineState();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return initialToastBaselineState();
    const ids = parsed.filter((x): x is string => typeof x === "string");
    return { ready: true, seen: new Set(ids) };
  } catch {
    return initialToastBaselineState();
  }
}

/** Persist the baseline (most-recent MAX_SEEN ids; Set preserves insertion order). */
export function persistBaseline(audience: string, state: ToastBaselineState): void {
  const store = sessionStore();
  if (!store || !state.ready) return;
  try {
    const ids = Array.from(state.seen);
    const capped = ids.length > MAX_SEEN ? ids.slice(ids.length - MAX_SEEN) : ids;
    store.setItem(storageKey(audience), JSON.stringify(capped));
  } catch {
    /* quota / disabled — degrade to per-mount baseline, never throw */
  }
}
