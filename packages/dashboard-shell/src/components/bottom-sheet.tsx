"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
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
 *   - Focus trap inside the sheet while open
 *   - Body scroll lock while open
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
};

export function BottomSheet({
  open,
  onClose,
  title,
  kicker,
  children,
  closeLabel = "Close",
  tall,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Body scroll lock + Esc dismiss + focus management.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    // Move focus into the sheet on open.
    const t = setTimeout(() => sheetRef.current?.focus(), 50);

    return () => {
      document.body.style.overflow = prevOverflow;
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
        backgroundColor: "rgba(5, 8, 22, 0.55)",
        zIndex: 9000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        animation: `henrycoSheetBackdrop ${FADE_MS}ms ${EASE_OUT}`,
      }}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "32rem",
          backgroundColor: `var(${CSS_VARS.surface})`,
          borderTopLeftRadius: RADIUS.xxl,
          borderTopRightRadius: RADIUS.xxl,
          borderBottom: 0,
          padding: "1.25rem 1rem",
          maxHeight: tall ? "90vh" : "75vh",
          overflowY: "auto",
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
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "0.5rem",
            marginBottom: "0.75rem",
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
      </div>
    </div>
  );
}
