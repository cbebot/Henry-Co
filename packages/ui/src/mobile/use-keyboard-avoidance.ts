"use client";

/**
 * @henryco/ui/mobile/use-keyboard-avoidance — visualViewport-based
 * soft-keyboard tracking with telemetry.
 *
 * V3-09(S2). The chat-composer already ships a `useViewportKeyboard`
 * hook in `packages/chat-composer/src/hooks/useViewportKeyboard.ts`;
 * this is the workspace-level equivalent so forms outside the
 * composer (marketplace checkout, profile edit, address, KYC) share
 * the same mechanism without taking a chat-composer dependency.
 *
 * What it gives the caller:
 *
 *   ```
 *   const {
 *     keyboardOpen,
 *     keyboardHeight,
 *     scrollFocusedIntoView,
 *   } = useKeyboardAvoidance({ surface: "marketplace_checkout" });
 *   ```
 *
 *   - `keyboardOpen` — true when the visual viewport shrinks more
 *     than 80px below window.innerHeight (soft-keyboard signature).
 *   - `keyboardHeight` — the px height of the obscured bottom band.
 *     Use this to push sticky action buttons above the keyboard or
 *     to add padding-bottom equal to the inset.
 *   - `scrollFocusedIntoView()` — imperative escape hatch: scrolls
 *     `document.activeElement` into view with block:"center", which
 *     iOS Safari does NOT do reliably on its own when a sticky
 *     header sits above the input. Call after `keyboardOpen` flips
 *     to true if the form is taller than the visual viewport.
 *
 * Telemetry:
 *   - `henry.ui.mobile_keyboard.kept_visible` fires once per
 *     keyboard-open transition when the focused element is fully
 *     visible after a one-frame settle.
 *   - `henry.ui.mobile_keyboard.obscured` fires when the focused
 *     element is below the visual viewport after the settle. The
 *     caller is expected to act (call `scrollFocusedIntoView()` or
 *     adjust layout).
 *
 * Telemetry is emitted only when a `surface` label is provided to
 * preserve cardinality discipline (no per-page surface explosion).
 */

import { useCallback, useEffect, useRef, useState } from "react";

export type KeyboardAvoidanceState = {
  /** True when the soft keyboard is currently obscuring viewport. */
  keyboardOpen: boolean;
  /** Pixel height obscured by the keyboard (0 when closed). */
  keyboardHeight: number;
  /** Imperative scroll: bring `document.activeElement` into view. */
  scrollFocusedIntoView: () => void;
};

export type UseKeyboardAvoidanceOptions = {
  /**
   * Optional surface label for the telemetry events. When provided,
   * emits `henry.ui.mobile_keyboard.kept_visible` /
   * `henry.ui.mobile_keyboard.obscured`. Keep cardinality low — one
   * label per major form surface (e.g. `support_thread_reply`).
   */
  surface?: string;
  /**
   * Disable the hook (e.g. for desktop-only forms wrapped in a
   * useIsMobile gate). When false (default), the hook is fully
   * active.
   */
  disabled?: boolean;
  /**
   * Optional override for `emitEvent` to keep the hook decoupled
   * from `@henryco/observability`. When undefined, telemetry is
   * dispatched via the lazy emitter below.
   */
  emit?: (payload: { name: string; outcome: string; surface: string; keyboardHeight: number }) => void;
};

const KEYBOARD_OPEN_THRESHOLD_PX = 80;

export function useKeyboardAvoidance(
  options: UseKeyboardAvoidanceOptions = {},
): KeyboardAvoidanceState {
  const { surface, disabled = false, emit } = options;
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const lastEmitForOpenRef = useRef<boolean | null>(null);

  // Imperative scroll: callable outside the effect to react to a
  // late-arriving focus (e.g. a form that re-renders mid-keyboard).
  const scrollFocusedIntoView = useCallback(() => {
    if (typeof document === "undefined") return;
    const active = document.activeElement;
    if (!active || !(active instanceof HTMLElement)) return;
    try {
      active.scrollIntoView({ block: "center", behavior: "smooth" });
    } catch {
      // Older Safari throws if `behavior` arg missing — fall back.
      active.scrollIntoView();
    }
  }, []);

  useEffect(() => {
    if (disabled) return;
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;

    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const layoutHeight = window.innerHeight;
        const visualHeight = vv.height;
        const offsetTop = vv.offsetTop || 0;
        const inset = Math.max(0, layoutHeight - (visualHeight + offsetTop));
        const open = inset > KEYBOARD_OPEN_THRESHOLD_PX;
        setKeyboardOpen(open);
        setKeyboardHeight(Math.round(inset));

        // Telemetry: emit once per open-transition. The kept-vs-obscured
        // distinction is settled one frame later (the layout has settled
        // by then) — if the focused element is below the visible band,
        // we count it as obscured.
        if (surface && open !== lastEmitForOpenRef.current && open) {
          lastEmitForOpenRef.current = open;
          requestAnimationFrame(() => {
            const active = document.activeElement;
            const rect = active instanceof HTMLElement ? active.getBoundingClientRect() : null;
            const isObscured = rect ? rect.bottom > visualHeight : false;
            dispatchTelemetry({
              name: isObscured
                ? "henry.ui.mobile_keyboard.obscured"
                : "henry.ui.mobile_keyboard.kept_visible",
              outcome: isObscured ? "blocked" : "completed",
              surface,
              keyboardHeight: Math.round(inset),
              emit,
            });
          });
        } else if (surface && !open && lastEmitForOpenRef.current === true) {
          lastEmitForOpenRef.current = false;
        }
      });
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);
    return () => {
      cancelAnimationFrame(raf);
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [disabled, surface, emit]);

  return { keyboardOpen, keyboardHeight, scrollFocusedIntoView };
}

/**
 * Lazy-import path to `@henryco/observability` so this hook stays
 * compile-clean inside `@henryco/ui` (which already depends on
 * observability transitively via other packages — but a direct
 * import would force every consumer of `@henryco/ui/mobile` to add
 * the dependency explicitly). The `emit` override lets tests and
 * library callers inject a stub without the dynamic import.
 */
function dispatchTelemetry(params: {
  name: string;
  outcome: string;
  surface: string;
  keyboardHeight: number;
  emit?: UseKeyboardAvoidanceOptions["emit"];
}): void {
  if (params.emit) {
    params.emit({
      name: params.name,
      outcome: params.outcome,
      surface: params.surface,
      keyboardHeight: params.keyboardHeight,
    });
    return;
  }
  // Fire-and-forget dynamic import; observability emits a structured
  // log line + Sentry breadcrumb. Missing module = silent no-op.
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
        name: params.name as "henry.ui.mobile_keyboard.kept_visible",
        classification: "system_state",
        outcome: params.outcome as "completed",
        payload: {
          surface: params.surface,
          keyboardHeightPx: params.keyboardHeight,
        },
      });
    } catch {
      // observability not installed in this graph — silent.
    }
  })();
}
