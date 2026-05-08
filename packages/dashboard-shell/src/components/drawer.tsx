"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { typeStyle } from "../tokens/type";
import { CSS_VARS } from "../tokens/color";
import { RADIUS, SPACING } from "../tokens/spacing";
import { FADE_MS, EASE_OUT } from "../tokens/motion";
import { focusVisibleStyle } from "../tokens/focus";

/**
 * Drawer — slide-in panel from the right edge.
 *
 * The desktop counterpart to BottomSheet. ContextDrawer uses this
 * primitive for the notification panel; future module surfaces use
 * it for inline detail views without losing the workspace context.
 *
 * Behaviour mirrors BottomSheet (backdrop, Esc, scroll lock, focus
 * management) but slides from the right rather than the bottom edge.
 *
 * DASH-7 additions:
 *   - `overscroll-behavior-y: contain` so swipe doesn't scroll the page
 *     underneath.
 *   - Hard focus trap via leading/trailing sentinels (closes the
 *     DASH-6 caveat that the Drawer didn't hard-trap focus).
 *   - Sticky-close header so the X stays reachable in the thumb zone
 *     even when the body has scrolled past the title.
 */
export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  kicker?: string;
  children: ReactNode;
  closeLabel?: string;
  /** Override the drawer width. Default 22rem (352px). */
  width?: string;
};

export function Drawer({
  open,
  onClose,
  title,
  kicker,
  children,
  closeLabel = "Close",
  width = SPACING.chrome.drawerWidth,
}: DrawerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const leadingSentinelRef = useRef<HTMLSpanElement>(null);
  const trailingSentinelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => ref.current?.focus(), 50);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open, onClose]);

  // Hard focus trap — leading sentinel forwards to the LAST focusable
  // (Shift+Tab from the input), trailing sentinel forwards to the FIRST
  // (Tab from the last focusable). Esc still closes (no keyboard trap
  // per WCAG 2.1.2).
  const onLeadingSentinelFocus = () => {
    const focusables = collectFocusables(ref.current);
    if (focusables.length === 0) {
      ref.current?.focus();
      return;
    }
    focusables[focusables.length - 1].focus();
  };
  const onTrailingSentinelFocus = () => {
    const focusables = collectFocusables(ref.current);
    if (focusables.length === 0) {
      ref.current?.focus();
      return;
    }
    focusables[0].focus();
  };

  if (!open) return null;

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(5, 8, 22, 0.40)",
        zIndex: 8000,
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
      <aside
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="hc-modal-body"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          height: "100vh",
          width,
          maxWidth: "100vw",
          backgroundColor: `var(${CSS_VARS.surface})`,
          borderLeft: `1px solid var(${CSS_VARS.hairline})`,
          padding: "1rem",
          overflowY: "auto",
          overscrollBehaviorY: "contain",
          color: `var(${CSS_VARS.ink})`,
          animation: `henrycoDrawerEntry ${FADE_MS}ms ${EASE_OUT}`,
        }}
      >
        <header
          className="hc-sticky-close-header"
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "0.5rem",
            paddingBottom: "0.75rem",
            borderBottom: `1px solid var(${CSS_VARS.hairline})`,
            // Override the .hc-sticky-close-header default top/margin so
            // the header sits flush to the drawer's padding.
            margin: "-1rem -1rem 1rem",
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
      </aside>
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
 * Collect every focusable descendant of the given root, excluding any
 * `aria-hidden` sentinels. Used by the focus trap to find the first /
 * last tab stop.
 */
function collectFocusables(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  const sel =
    'a[href]:not([aria-hidden="true"]), button:not([disabled]):not([aria-hidden="true"]), input:not([disabled]):not([aria-hidden="true"]), select:not([disabled]):not([aria-hidden="true"]), textarea:not([disabled]):not([aria-hidden="true"]), [tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])';
  return Array.from(root.querySelectorAll<HTMLElement>(sel)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
}
