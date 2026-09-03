"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import {
  emitModalBackdropTap,
  useAndroidBackClose,
  suppressSentinelPopForNavLink,
} from "@henryco/ui/mobile";
import { typeStyle } from "../tokens/type";
import { CSS_VARS } from "../tokens/color";
import { RADIUS } from "../tokens/spacing";
import { FADE_MS, EASE_OUT } from "../tokens/motion";
import { focusVisibleStyle } from "../tokens/focus";

/**
 * BottomSheet — mobile-first surface that slides up from the bottom
 * edge with a sticky-close affordance in the thumb zone.
 *
 * Closes anti-pattern #21 (mobile = desktop scaled down). DASH-7
 * composes this primitive into the mobile shell; DASH-1 ships it
 * for forward compatibility.
 *
 * Behaviour:
 *   - Backdrop dismiss (click outside)
 *   - Esc dismiss
 *   - Hard focus trap inside the sheet while open (DASH-7)
 *   - Body scroll lock while open
 *   - `overscroll-behavior-y: contain` so swipe doesn't scroll the
 *     page underneath (DASH-7)
 *   - Sticky-close header in the thumb zone (DASH-7)
 *   - Reduced-motion: no slide, just fade
 */
export type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Optional title — rendered as the sheet's `<h2>`. */
  title?: string;
  /** Optional kicker above the title. */
  kicker?: string;
  /** Sheet body. */
  children: ReactNode;
  /** Optional aria-label for the dismiss button. */
  closeLabel?: string;
  /** Tall mode pins the sheet at 90vh; default is auto-height. */
  tall?: boolean;
  /**
   * V3-09(S5) — optional surface label for telemetry. When provided,
   * emits `henry.ui.modal_escape.backdrop_tap` /
   * `henry.ui.modal_escape.android_back` on those close paths. Keep
   * cardinality low (one label per major sheet surface).
   */
  telemetrySurface?: string;
};

export function BottomSheet({
  open,
  onClose,
  title,
  kicker,
  children,
  closeLabel = "Close",
  tall,
  telemetrySurface,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const leadingSentinelRef = useRef<HTMLSpanElement>(null);
  const trailingSentinelRef = useRef<HTMLSpanElement>(null);

  // Stable ref for onClose so the lifecycle effect below depends ONLY on `open`.
  // Without this, callers that pass an inline arrow (e.g. `onClose={() => close()}`)
  // generate a new function reference on every parent re-render, which retriggers
  // the focus effect mid-typing and steals keyboard focus from any input inside the
  // sheet — dismissing the on-screen keyboard on iOS/Android. PASS 22 issue #3.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Body scroll lock + Esc dismiss + focus management. Runs once per open
  // transition; do NOT add `onClose` to the deps (see ref pattern above).
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);

    // Move focus into the sheet on open.
    const t = setTimeout(() => sheetRef.current?.focus(), 50);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open]);

  // V3-09(S5) — Android hardware-back-button closes the sheet. The
  // hook pushes a history sentinel on open and listens for popstate;
  // the cleanup pops the sentinel on programmatic close so no
  // phantom history step remains.
  useAndroidBackClose(open, onClose, { surface: telemetrySurface });

  // Hard focus trap via leading/trailing sentinels — Tab cycles back
  // into the sheet's focusables; Shift+Tab cycles to the last.
  const onLeadingSentinelFocus = () => {
    const focusables = collectFocusables(sheetRef.current);
    if (focusables.length === 0) {
      sheetRef.current?.focus();
      return;
    }
    focusables[focusables.length - 1].focus();
  };
  const onTrailingSentinelFocus = () => {
    const focusables = collectFocusables(sheetRef.current);
    if (focusables.length === 0) {
      sheetRef.current?.focus();
      return;
    }
    focusables[0].focus();
  };

  if (!open) return null;

  return (
    <div
      role="presentation"
      onClick={() => {
        // V3-09(S5) — backdrop close-path fires its own telemetry tag.
        emitModalBackdropTap(telemetrySurface);
        onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(5, 8, 22, 0.55)",
        zIndex: 9000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        animation: `henrycoSheetBackdrop ${FADE_MS}ms ${EASE_OUT}`,
      }}
    >
      <span
        ref={leadingSentinelRef}
        tabIndex={0}
        aria-hidden
        onFocus={onLeadingSentinelFocus}
        style={{ position: "fixed", width: 1, height: 1, top: 0, left: 0, pointerEvents: "none", opacity: 0 }}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClickCapture={suppressSentinelPopForNavLink}
        onClick={(e) => e.stopPropagation()}
        className="hc-modal-body"
        style={{
          width: "100%",
          maxWidth: "32rem",
          backgroundColor: `var(${CSS_VARS.surface})`,
          borderTopLeftRadius: RADIUS.xxl,
          borderTopRightRadius: RADIUS.xxl,
          borderBottom: 0,
          padding: "1.25rem 1rem",
          // V3-09(S1) — respect the iOS home-indicator safe area so
          // the sheet's bottom content (often a primary CTA) isn't
          // hidden behind the system gesture bar. `env()` returns 0
          // on non-notched viewports — no layout cost elsewhere.
          paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))",
          maxHeight: tall ? "90vh" : "75vh",
          overflowY: "auto",
          overscrollBehaviorY: "contain",
          color: `var(${CSS_VARS.ink})`,
          animation: `henrycoSheetEntry ${FADE_MS}ms ${EASE_OUT}`,
        }}
      >
        <div
          aria-hidden
          style={{
            width: "2.5rem",
            height: "0.25rem",
            backgroundColor: `var(${CSS_VARS.hairline})`,
            borderRadius: RADIUS.pill,
            margin: "0 auto 1rem",
          }}
        />
        <header
          className="hc-sticky-close-header"
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "0.5rem",
            // Pull edge-to-edge inside the sheet body so the sticky
            // background covers the corners. The body padding is
            // 1.25rem vertical / 1rem horizontal, so we negate that
            // and re-add internal padding for the close button.
            margin: "-1.25rem -1rem 0.75rem",
            padding: "1rem 1rem 0.75rem",
          }}
        >
          <div style={{ minWidth: 0 }}>
            {kicker ? (
              <p
                style={{
                  ...typeStyle("kicker"),
                  color: `var(${CSS_VARS.inkMuted})`,
                  margin: 0,
                }}
              >
                {kicker}
              </p>
            ) : null}
            {title ? (
              <h2
                style={{
                  ...typeStyle("headline"),
                  color: `var(${CSS_VARS.ink})`,
                  margin: 0,
                  marginTop: kicker ? "0.25rem" : 0,
                }}
              >
                {title}
              </h2>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: `var(${CSS_VARS.inkSoft})`,
              padding: "0.5rem",
              borderRadius: RADIUS.pill,
              flexShrink: 0,
              minWidth: "44px",
              minHeight: "44px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              ...focusVisibleStyle(),
            }}
          >
            <X size={18} aria-hidden />
          </button>
        </header>
        <div>{children}</div>
      </div>
      <span
        ref={trailingSentinelRef}
        tabIndex={0}
        aria-hidden
        onFocus={onTrailingSentinelFocus}
        style={{ position: "fixed", width: 1, height: 1, bottom: 0, right: 0, pointerEvents: "none", opacity: 0 }}
      />
    </div>
  );
}

/**
 * Collect every focusable descendant of the given root, excluding the
 * sentinels themselves (which carry `aria-hidden`). Used by the focus
 * trap to find the first/last tab stop.
 */
function collectFocusables(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  const sel =
    'a[href]:not([aria-hidden="true"]), button:not([disabled]):not([aria-hidden="true"]), input:not([disabled]):not([aria-hidden="true"]), select:not([disabled]):not([aria-hidden="true"]), textarea:not([disabled]):not([aria-hidden="true"]), [tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])';
  return Array.from(root.querySelectorAll<HTMLElement>(sel)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
}
