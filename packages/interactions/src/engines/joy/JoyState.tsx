"use client";

/**
 * Joy Engine — `<JoyState>` (doctrine Engine 5 / Principle 15).
 *
 * The standard success surface for every primary action: a confident check
 * that scales in, an accent glow that fades, success copy naming the outcome
 * and the next sensible action — all inside a 600ms envelope, with a single
 * 10ms haptic on supporting devices. Ends with ONE optional next action,
 * never a list of upsells.
 *
 * Reduced motion strips the scale + glow and keeps the check + copy.
 * The detail line is announced via a polite ARIA live region.
 */

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@henryco/ui/cn";
import { useInteractionTelemetry } from "../../context";
import { useReducedMotion } from "../../motion";
import { joyContentFor, type JoyLabels, type JoyOutcome, type JoyVariant } from "./joy.logic";

export interface JoyNextAction {
  label: string;
  onSelect?: () => void;
  href?: string;
}

export interface JoyStateProps {
  variant: JoyVariant;
  outcome: JoyOutcome;
  labels: JoyLabels & {
    /** Short headline, e.g. "Booked". Localized, injected. */
    headline: string;
  };
  /** The cta that produced this success (telemetry join key). */
  ctaId: string;
  surfaceId: string;
  /** ONE optional next action (never a list). */
  nextAction?: JoyNextAction;
  className?: string;
}

export function JoyState({
  variant,
  outcome,
  labels,
  ctaId,
  surfaceId,
  nextAction,
  className,
}: JoyStateProps) {
  const telemetry = useInteractionTelemetry();
  const reduced = useReducedMotion();
  const emittedRef = useRef(false);

  const content = useMemo(() => joyContentFor(variant, outcome, labels), [variant, outcome, labels]);

  useEffect(() => {
    if (emittedRef.current) return;
    emittedRef.current = true;
    telemetry.emit({ name: "joy_state_seen", props: { cta_id: ctaId, surface_id: surfaceId, variant } });
    // A single, short tap — never a long buzz (doctrine Principle 15).
    if (!reduced && typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(content.hapticMs);
    }
  }, [telemetry, ctaId, surfaceId, variant, reduced, content.hapticMs]);

  const envelope = `${content.envelopeMs}ms`;

  let action: ReactNode = null;
  if (nextAction) {
    const actionClass = cn(
      "mt-3 inline-flex min-h-[44px] items-center rounded-full border border-zinc-300/80 px-5 text-sm font-medium",
      "text-zinc-800 outline-none hover:bg-zinc-50",
      "focus-visible:ring-2 focus-visible:ring-amber-500/55 focus-visible:ring-offset-2",
      "dark:border-white/15 dark:text-white dark:hover:bg-white/[0.06]",
    );
    action = nextAction.href ? (
      <a href={nextAction.href} className={actionClass}>
        {nextAction.label}
      </a>
    ) : (
      <button type="button" onClick={nextAction.onSelect} className={actionClass}>
        {nextAction.label}
      </button>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      data-variant={variant}
      className={cn("flex flex-col items-center px-6 py-8 text-center", className)}
    >
      <span
        className={cn(
          "grid h-12 w-12 place-items-center rounded-full",
          "bg-[color:color-mix(in_srgb,var(--site-accent,#C9A227)_16%,transparent)]",
          "text-[color:var(--site-accent,#C9A227)]",
          !reduced && "joy-check-in",
        )}
        style={
          reduced
            ? undefined
            : {
                animation: `joy-scale-in 280ms cubic-bezier(0.22, 1, 0.36, 1) both, joy-glow ${envelope} ease-out both`,
              }
        }
        aria-hidden
      >
        <Check className="h-6 w-6" strokeWidth={2.5} />
      </span>

      <p className="mt-4 text-lg font-semibold text-zinc-950 dark:text-white">{labels.headline}</p>
      {content.detail ? (
        <p className="mt-1 max-w-sm text-sm leading-6 text-zinc-600 dark:text-white/70">{content.detail}</p>
      ) : null}

      {action}

      {/* Scoped keyframes — total envelope ≤600ms; no confetti, ever. */}
      <style>{`
        @keyframes joy-scale-in { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes joy-glow {
          0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--site-accent, #C9A227) 32%, transparent); }
          100% { box-shadow: 0 0 0 12px transparent; }
        }
        @media (prefers-reduced-motion: reduce) {
          .joy-check-in { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
