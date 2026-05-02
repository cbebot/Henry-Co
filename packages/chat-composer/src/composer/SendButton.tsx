"use client";

import { Send, Loader2 } from "lucide-react";
import { cn } from "@henryco/ui/cn";
import {
  henrycoSendCommit,
  henrycoSendReady,
} from "../motion";

export type SendButtonProps = {
  ready: boolean;
  busy: boolean;
  disabled?: boolean;
  onClick: () => void;
  label?: string;
  busyLabel?: string;
  iconOnly?: boolean;
  reduceMotion?: boolean;
  shake?: boolean;
  className?: string;
};

/**
 * Premium send button.
 *
 * - Linear gradient surface (accent → accent-deep) for a brushed-metal feel
 * - Dual-layer shadow: deep ambient + tight contact
 * - Focus halo using the same accent at 32% opacity
 * - On `ready`, gentle scale spring; on `busy`, commit pulse; on `shake`, fail wobble
 * - Reduced-motion: instant transitions, no animations
 */
export function SendButton({
  ready,
  busy,
  disabled,
  onClick,
  label = "Send",
  busyLabel = "Sending…",
  iconOnly = false,
  reduceMotion = false,
  shake = false,
  className,
}: SendButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy || !ready}
      aria-busy={busy || undefined}
      aria-label={iconOnly ? (busy ? busyLabel : label) : undefined}
      data-ready={ready}
      className={cn(
        "group relative inline-flex items-center justify-center gap-2",
        "rounded-full font-semibold tracking-[0.01em]",
        "text-white",
        "transition-[transform,box-shadow,filter,background-color]",
        "shadow-[0_10px_24px_-10px_rgba(15,23,42,0.45),inset_0_1px_0_rgba(255,255,255,0.18)]",
        "hover:enabled:shadow-[0_14px_30px_-10px_rgba(15,23,42,0.55),inset_0_1px_0_rgba(255,255,255,0.22)]",
        "hover:enabled:-translate-y-[1px]",
        "active:enabled:translate-y-[0px] active:enabled:shadow-[0_6px_18px_-8px_rgba(15,23,42,0.5),inset_0_1px_0_rgba(255,255,255,0.16)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "focus-visible:ring-[color:var(--composer-accent,#0E7C86)]/55",
        "focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0a0f14]",
        "disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:saturate-50",
        iconOnly ? "h-11 w-11" : "h-11 px-5 text-sm",
        ready && !busy && !disabled && !reduceMotion && "henryco-send-ready",
        busy && !reduceMotion && "henryco-send-pulse",
        shake && !reduceMotion && "henryco-send-shake",
        className
      )}
      style={{
        backgroundImage:
          "linear-gradient(180deg, var(--composer-accent, #0E7C86) 0%, var(--composer-accent-deep, #0A5C63) 100%)",
        transitionDuration: reduceMotion
          ? "0ms"
          : `${henrycoSendReady.durationMs}ms`,
        transitionTimingFunction: henrycoSendReady.cubicBezier,
        ...(busy
          ? {
              animationDuration: `${henrycoSendCommit.durationMs}ms`,
              animationTimingFunction: henrycoSendCommit.cubicBezier,
            }
          : {}),
      }}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Send
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            "group-hover:enabled:translate-x-[1px]"
          )}
          aria-hidden
        />
      )}
      {iconOnly ? null : <span>{busy ? busyLabel : label}</span>}
    </button>
  );
}
