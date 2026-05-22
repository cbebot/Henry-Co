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

import { useEffect } from "react";

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

export function useAndroidBackClose(
  isOpen: boolean,
  onClose: () => void,
  options: UseAndroidBackCloseOptions = {},
): void {
  const { surface, emit } = options;

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
        if (surface) {
          dispatchTelemetry({
            name: "henry.ui.modal_escape.android_back",
            outcome: "completed",
            surface,
            emit,
          });
        }
        onClose();
      }
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
      // If our sentinel is still the top entry (close happened via
      // Esc / backdrop / programmatic), pop it back off so we don't
      // leave a phantom history step. Detect via the state shape.
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
  }, [isOpen, onClose, surface, emit]);
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
