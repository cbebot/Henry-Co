"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { typeStyle } from "../tokens/type";
import { CSS_VARS } from "../tokens/color";
import { RADIUS, SPACING } from "../tokens/spacing";
import { FADE_MS, EASE_OUT } from "../tokens/motion";
import { focusVisibleStyle } from "../tokens/focus";

/**
 * Drawer — desktop-first slide-in panel from the right edge.
 *
 * The desktop counterpart to BottomSheet. ContextDrawer uses this
 * primitive for the notification panel; future module surfaces use
 * it for inline detail views without losing the workspace context.
 *
 * Behaviour mirrors BottomSheet (backdrop, Esc, scroll lock, focus
 * management) but slides from the right rather than the bottom edge.
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
      <aside
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
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
          color: `var(${CSS_VARS.ink})`,
          animation: `henrycoDrawerEntry ${FADE_MS}ms ${EASE_OUT}`,
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "0.5rem",
            marginBottom: "1rem",
            paddingBottom: "0.75rem",
            borderBottom: `1px solid var(${CSS_VARS.hairline})`,
          }}
        >
          <div>
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
              ...focusVisibleStyle(),
            }}
          >
            <X size={18} aria-hidden />
          </button>
        </header>
        <div>{children}</div>
      </aside>
    </div>
  );
}
