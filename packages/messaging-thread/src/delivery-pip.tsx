"use client";

/**
 * @henryco/messaging-thread/delivery-pip — V3-03.
 *
 * WhatsApp-style delivery state pip rendered under viewer-owned
 * message bubbles:
 *
 *   sent      → ✓        (single check, muted)
 *   delivered → ✓✓       (double check, muted)
 *   seen      → ✓✓       (double check, accent — typically blue)
 *   failed    → ⚠        (warning glyph in accent-red)
 *
 * The component is presentation-only. Hosts pass the delivery state
 * via the message row (mapped from support_messages.delivery_state /
 * customer_notifications.delivery_state by the adapter) and the
 * thread engine selects which pip to render.
 *
 * Strings come in through `labels` so the host owns translation
 * (typically via `translateSurfaceLabel(locale, ...)` from
 * `@henryco/i18n` in the `surface:notification-message` namespace).
 * The component falls back to English tooltips when labels are
 * omitted — useful in unit tests and the package's own stories.
 */

import type { ReactNode } from "react";

export type DeliveryState = "sent" | "delivered" | "seen" | "failed";

export type DeliveryPipLabels = {
  /** Tooltip when the pip shows "sent" (single check). */
  sent?: string;
  /** Tooltip when the pip shows "delivered" (double check, muted). */
  delivered?: string;
  /** Tooltip when the pip shows "seen" (double check, accent). */
  seen?: string;
  /** Tooltip when the pip shows "failed" (warning). */
  failed?: string;
};

const DEFAULT_LABELS: Required<DeliveryPipLabels> = {
  sent: "Sent",
  delivered: "Delivered",
  seen: "Read",
  failed: "Failed to deliver",
};

export type DeliveryStatePipProps = {
  state: DeliveryState;
  labels?: DeliveryPipLabels;
  /**
   * Override the rendered glyphs entirely. Default rendering uses
   * inline SVG so the component stays lucide-react-free at the call
   * site — keeps the package light.
   */
  renderIcon?: (state: DeliveryState) => ReactNode;
  /** Extra className passed through to the wrapper span. */
  className?: string;
};

const STYLES = {
  base: "inline-flex items-center gap-0.5 align-middle leading-none",
  muted: "text-[var(--mt-muted-strong,#6b7280)]",
  seen: "text-[var(--mt-link,#2563eb)]",
  failed: "text-[var(--mt-danger,#dc2626)]",
} as const;

function CheckSingle() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width={14}
      height={14}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 8.5L6.5 12L13 4.5"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckDouble() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 18 16"
      width={16}
      height={14}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 8.5L5.5 12L11.5 4.5"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 8.5L10 12L16 4.5"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FailedGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width={14}
      height={14}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 1.5L15 14.5H1L8 1.5Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 6.5V9.5"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <path
        d="M8 12V12.01"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

function defaultIcon(state: DeliveryState): ReactNode {
  switch (state) {
    case "sent":
      return <CheckSingle />;
    case "delivered":
    case "seen":
      return <CheckDouble />;
    case "failed":
      return <FailedGlyph />;
  }
}

function colorClassFor(state: DeliveryState): string {
  switch (state) {
    case "seen":
      return STYLES.seen;
    case "failed":
      return STYLES.failed;
    case "sent":
    case "delivered":
    default:
      return STYLES.muted;
  }
}

export function DeliveryStatePip({
  state,
  labels,
  renderIcon,
  className,
}: DeliveryStatePipProps): ReactNode {
  const merged: Required<DeliveryPipLabels> = {
    ...DEFAULT_LABELS,
    ...labels,
  };
  const tooltip = merged[state];
  const iconNode = renderIcon ? renderIcon(state) : defaultIcon(state);
  const tone = colorClassFor(state);

  return (
    <span
      role="img"
      aria-label={tooltip}
      title={tooltip}
      data-delivery-state={state}
      className={`${STYLES.base} ${tone} ${className ?? ""}`.trim()}
    >
      {iconNode}
    </span>
  );
}
