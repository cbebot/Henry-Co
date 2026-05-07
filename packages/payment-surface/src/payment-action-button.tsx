"use client";

import { Lock } from "lucide-react";
import { type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { ButtonPendingContent } from "@henryco/ui";
import { cn } from "@henryco/ui/cn";

/**
 * PaymentActionButton — the canonical submit primitive for every payment
 * surface across the company.
 *
 * State machine (driven by react-dom useFormStatus + parent-supplied
 * `successLocked` flag derived from the current PaymentRecord status):
 *
 *   idle      → solid accent fill, label
 *   pending   → spinner cross-fades in, pendingLabel replaces label
 *   disabled  → dimmed, no pointer events (e.g. surface in error/refunded)
 *   success   → lock icon + locked label, button non-interactive
 *
 * The pending<->idle cross-fade comes from ButtonPendingContent; the
 * success-lock is rendered as a sibling layer so we don't lose layout
 * when the form transitions. Motion language matches PERF-01 / V2-HERO-01:
 * 150ms opacity, no layout shift, prefers-reduced-motion auto-handled by
 * the cn'd primitive.
 */

export type PaymentActionButtonState = "idle" | "pending" | "disabled" | "success";

export interface PaymentActionButtonProps {
  label: ReactNode;
  pendingLabel?: ReactNode;
  successLabel?: ReactNode;
  successLocked?: boolean;
  disabled?: boolean;
  className?: string;
  type?: "submit" | "button";
  onClick?: () => void;
  /** When true the spinner+label still render, but the button is read-only. */
  readOnly?: boolean;
}

export function PaymentActionButton({
  label,
  pendingLabel = "Working…",
  successLabel = "Submitted",
  successLocked = false,
  disabled = false,
  className,
  type = "submit",
  onClick,
  readOnly,
}: PaymentActionButtonProps) {
  const { pending } = useFormStatus();

  if (successLocked) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        className={cn(
          "payment-action-button payment-action-button--success",
          "inline-flex min-h-[52px] min-w-[200px] items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-semibold",
          "border border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
          "cursor-not-allowed",
          className,
        )}
      >
        <Lock className="h-4 w-4" aria-hidden />
        <span>{successLabel}</span>
      </button>
    );
  }

  const isDisabled = disabled || readOnly || pending;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={pending || undefined}
      className={cn(
        "payment-action-button",
        "inline-flex min-h-[52px] min-w-[200px] items-center justify-center rounded-full px-6 py-4 text-sm font-semibold",
        "transition outline-none",
        "active:translate-y-[0.5px]",
        "focus-visible:ring-2 focus-visible:ring-[color:var(--payment-accent,#97f4f3)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40",
        "bg-[color:var(--payment-accent,#97f4f3)] text-black hover:opacity-90",
        "disabled:cursor-not-allowed disabled:opacity-80",
        className,
      )}
    >
      <ButtonPendingContent
        pending={pending}
        pendingLabel={pendingLabel}
        spinnerLabel={typeof pendingLabel === "string" ? pendingLabel : "Working"}
        indicatorSize="sm"
        textClassName="font-semibold"
      >
        {label}
      </ButtonPendingContent>
    </button>
  );
}
