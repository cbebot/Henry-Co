/**
 * Toast-selection reducer — the pure decision layer for the live toast
 * viewport. Extracted so its correctness can be unit-tested without a React
 * testing library (mirrors the `handleSupabaseAuthEvent` pattern in
 * `shell/supabase-realtime-provider.tsx`).
 *
 * The bug it fixes (V3-DASH-TOAST): the viewport previously captured its
 * "already seen, don't toast" baseline on the FIRST effect tick — but the
 * realtime provider hydrates its signal list ASYNCHRONOUSLY (it starts as
 * `[]` and a `fetch` fills it a tick later). So the baseline captured an
 * EMPTY set, and the whole unread backlog was then treated as "new" and
 * toasted. Because the baseline lived in a per-mount `useRef`, every remount
 * (a navigation that re-mounts the shell subtree, or a refresh) repeated the
 * flood — the exact "the in-app notification keeps repeating each time I
 * navigate" report.
 *
 * The fix: establish the baseline the moment the first hydration SETTLES
 * (`loading` flips true→false), capturing whatever is present then as
 * pre-existing backlog that must never toast. After that, only ids that were
 * not in the baseline and have not already been toasted this mount surface as
 * toasts. This is self-correcting across remounts: after any remount the
 * current backlog becomes the new baseline, so only signals that genuinely
 * arrive while the user is on the dashboard ever toast — whether or not the
 * shell remounts on navigation.
 */

export type ToastBaselineState = {
  /** True once the first hydration has settled and the backlog was captured. */
  ready: boolean;
  /** Signal ids that must never toast (backlog + already-toasted this mount). */
  seen: ReadonlySet<string>;
};

export type ToastBaselineInput = {
  /** Whether the realtime provider's first hydration is still in flight. */
  loading: boolean;
  /** Current unread+visible signal ids the viewport sees (filter applied upstream). */
  signalIds: readonly string[];
};

export type ToastBaselineResult = {
  /** Next state to retain. Identity-stable when nothing changed. */
  state: ToastBaselineState;
  /** Ids to surface as fresh toasts now (in input order). */
  toast: string[];
};

export function initialToastBaselineState(): ToastBaselineState {
  return { ready: false, seen: new Set<string>() };
}

export function reduceToastBaseline(
  prev: ToastBaselineState,
  input: ToastBaselineInput,
): ToastBaselineResult {
  // Phase 1 — establish the baseline once the first hydration settles.
  // While loading, we cannot tell backlog from a fresh arrival, so we hold.
  if (!prev.ready) {
    if (input.loading) return { state: prev, toast: [] };
    return { state: { ready: true, seen: new Set(input.signalIds) }, toast: [] };
  }

  // Phase 2 — anything not already seen is a genuine post-baseline arrival.
  let next: Set<string> | null = null;
  const toast: string[] = [];
  for (const id of input.signalIds) {
    if (prev.seen.has(id)) continue;
    if (!next) next = new Set(prev.seen);
    next.add(id);
    toast.push(id);
  }

  if (!next) return { state: prev, toast };
  return { state: { ready: true, seen: next }, toast };
}
