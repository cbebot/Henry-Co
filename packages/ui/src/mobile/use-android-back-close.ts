"use client";

/**
 * @henryco/ui/mobile/use-android-back-close — Android hardware back
 * button → modal close, via History API + `popstate`.
 *
 * V3-09(S5). The pattern:
 *
 *   1. On mount (modal opens), push a sentinel state onto history.
 *   2. Subscribe to `popstate`. When the user presses Android back,
 *      the sentinel is popped — invoke `onClose()`.
 *   3. On unmount (modal closes via Esc / backdrop / X button),
 *      remove the sentinel by calling `history.back()` *if* the
 *      sentinel is still the top entry. This keeps the URL intact
 *      so a `Tab close` doesn't leave a phantom history step.
 *
 * The state object carries a `__henryco_modal` marker so the hook
 * can identify its own sentinel and ignore unrelated popstates
 * (e.g. another piece of code navigating).
 *
 * Telemetry: `henry.ui.modal_escape.android_back` fires when the
 * close was triggered by the back button (not Esc / backdrop).
 *
 * Caveats:
 *   - iOS Safari has no hardware back button — the hook is a no-op
 *     on iOS (still safe to call, just does nothing useful there).
 *   - If the user navigates *forward* into a different page while
 *     the modal is open, the cleanup runs as part of unmount; the
 *     sentinel goes away naturally.
 *   - SSR-safe: history API access is guarded.
 *
 * Wire into: BottomSheet, Drawer, SupportAssist modal, drawer-style
 * notifications panel, ReauthScreen.
 */

import { useEffect, useRef } from "react";

export type UseAndroidBackCloseOptions = {
  /**
   * Optional surface label for the telemetry event. When provided,
   * emits `henry.ui.modal_escape.android_back`. Skip when the
   * surface is shared across many call sites and the label would
   * be ambiguous.
   */
  surface?: string;
  /**
   * Optional override for `emitEvent` to decouple the hook from
   * `@henryco/observability`. Tests inject a stub.
   */
  emit?: (payload: { name: string; outcome: string; surface: string }) => void;
};

const SENTINEL_MARKER = "__henryco_modal";

// When a sheet/drawer closes BECAUSE the user tapped an internal SPA nav link,
// the navigation (router.push) consumes the top history entry asynchronously —
// and App Router commits it LATER than a frame. The close's sentinel-pop
// (history.back) would race and cancel that pending navigation: the reported
// "mobile nav tap dismisses but never navigates" bug. The nav link calls
// suppressSentinelPop() so the imminent cleanup deterministically SKIPS its
// back() and leaves the history to the navigation (the leftover sentinel is a
// harmless duplicate same-URL entry). Time-boxed so a cancelled tap can't
// suppress forever.
let suppressPopUntilMs = 0;
function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}
export function suppressSentinelPop(windowMs = 1200): void {
  suppressPopUntilMs = nowMs() + windowMs;
}

/**
 * Capture-phase click handler for modal surfaces (BottomSheet / Drawer).
 * If the click lands on an INTERNAL SPA-nav anchor (`href="/..."`), it
 * calls `suppressSentinelPop()` so the surface's `useAndroidBackClose`
 * cleanup skips its `history.back()` — which would otherwise cancel the
 * in-flight App Router navigation (the "tap a link inside the sheet, it
 * closes but never navigates" bug). One handler fixes every link in any
 * sheet/drawer at once. Buttons, external links (`http(s)://`,
 * protocol-relative `//`) and hash links are untouched. Attach as
 * `onClickCapture` so the flag is set before the link's own handler runs.
 *
 * Returns `true` when it matched an internal nav link (and suppressed) so
 * the caller can also dismiss the surface on the next tick — the link's
 * `router.push` registers first, then the close, so the sheet feels
 * instant without cancelling the navigation.
 */
export function suppressSentinelPopForNavLink(event: {
  target: EventTarget | null;
}): boolean {
  const target = event.target as HTMLElement | null;
  const anchor =
    target && typeof target.closest === "function"
      ? target.closest("a[href]")
      : null;
  const href = anchor?.getAttribute("href") ?? "";
  if (href.startsWith("/") && !href.startsWith("//")) {
    suppressSentinelPop();
    return true;
  }
  return false;
}

export function useAndroidBackClose(
  isOpen: boolean,
  onClose: () => void,
  options: UseAndroidBackCloseOptions = {},
): void {
  const { surface, emit } = options;

  // Hold the latest onClose + telemetry inputs in refs so the
  // open/close effect can re-read them without re-running. Re-running
  // on every onClose identity change would tear down + reattach the
  // sentinel, and the cleanup's `history.back()` would synthesize a
  // popstate that closes the modal seconds after it opens — the
  // regression that V3-09 originally shipped to main, where the
  // command palette and other modal consumers refused to stay open
  // because their parents pass fresh onClose closures every render.
  const onCloseRef = useRef(onClose);
  const surfaceRef = useRef(surface);
  const emitRef = useRef(emit);
  useEffect(() => {
    onCloseRef.current = onClose;
    surfaceRef.current = surface;
    emitRef.current = emit;
  });

  useEffect(() => {
    if (!isOpen) return;
    if (typeof window === "undefined" || !window.history) return;

    // Push a marker we can recognise. Use `history.state` shape so
    // we don't clobber state already there — wrap into a wrapper
    // object instead of overwriting.
    const priorState = window.history.state;
    const sentinel = { [SENTINEL_MARKER]: true, prior: priorState };
    try {
      window.history.pushState(sentinel, "");
    } catch {
      // Some sandboxed iframes throw — bail without telemetry.
      return;
    }

    const onPopState = (event: PopStateEvent) => {
      // If popping returned us to the prior state (sentinel removed),
      // the back button was pressed. Fire close.
      const state = event.state as { [SENTINEL_MARKER]?: boolean } | null;
      if (!state || !state[SENTINEL_MARKER]) {
        if (surfaceRef.current) {
          dispatchTelemetry({
            name: "henry.ui.modal_escape.android_back",
            outcome: "completed",
            surface: surfaceRef.current,
            emit: emitRef.current,
          });
        }
        onCloseRef.current();
      }
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
      // If our sentinel is still the top entry (close happened via Esc /
      // backdrop / X / programmatic), pop it back off so we don't leave a
      // phantom history step. CRITICAL: defer to the next frame and re-check
      // the sentinel is STILL on top first. When a sheet closes because the
      // user tapped an internal <Link> (the close + the navigation fire in the
      // same tick), Next's router.push commits its own history entry within a
      // microtask — by the next rAF the sentinel is no longer top, so we MUST
      // skip history.back(); popping here would revert the navigation (the
      // "mobile nav tap dismisses but never navigates" bug). Esc / backdrop /
      // hardware-back closes still pop correctly (sentinel still top, or
      // already gone).
      const popSentinel = () => {
        // A nav link is consuming this history entry — skip the pop so we don't
        // cancel the in-flight navigation.
        if (nowMs() < suppressPopUntilMs) {
          suppressPopUntilMs = 0;
          return;
        }
        const currentState = window.history.state as
          | { [SENTINEL_MARKER]?: boolean }
          | null;
        if (currentState && currentState[SENTINEL_MARKER]) {
          try {
            window.history.back();
          } catch {
            // Best-effort; failure leaves a one-step history pad,
            // which is harmless functionally.
          }
        }
      };
      if (typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(popSentinel);
      } else {
        popSentinel();
      }
    };
  }, [isOpen]);
}

/**
 * Fire the `backdrop_tap` telemetry. Modal primitives call this
 * from their backdrop click handler. Keeps the event taxonomy
 * centralized rather than spread across each Dialog/Sheet/Drawer.
 *
 * Skips when `surface` is undefined to preserve cardinality.
 */
export function emitModalBackdropTap(
  surface: string | undefined,
  emit?: (payload: { name: string; outcome: string; surface: string }) => void,
): void {
  if (!surface) return;
  dispatchTelemetry({
    name: "henry.ui.modal_escape.backdrop_tap",
    outcome: "completed",
    surface,
    emit,
  });
}

function dispatchTelemetry(params: {
  name: string;
  outcome: string;
  surface: string;
  emit?: (payload: { name: string; outcome: string; surface: string }) => void;
}): void {
  if (params.emit) {
    params.emit({
      name: params.name,
      outcome: params.outcome,
      surface: params.surface,
    });
    return;
  }
  void (async () => {
    try {
      const mod = (await import("@henryco/observability")) as {
        emitEvent?: (p: {
          name: string;
          classification: "user_action" | "system_state";
          outcome: string;
          payload: Record<string, unknown>;
        }) => void;
      };
      mod.emitEvent?.({
        name: params.name as "henry.ui.modal_escape.android_back",
        classification: "user_action",
        outcome: params.outcome as "completed",
        payload: { surface: params.surface },
      });
    } catch {
      // observability not installed in this graph — silent.
    }
  })();
}
