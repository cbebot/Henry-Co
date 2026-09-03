"use client";

/**
 * CTA Engine — `<CtaButton>` (doctrine Engine 1 / Owner Principles 2-5).
 *
 * A thin wrapper over the tested `resolveCtaState` machine. It:
 *  - locks width across every phase via a grid-stack (all labels share one
 *    cell, only the active one is visible) so the box never reflows;
 *  - is optimistic + async: `onAction` runs, success dwells 1.5s, failure
 *    is retryable inline (never a toast for the click the user just made);
 *  - gives destructive actions an inline two-step confirm + 3s cancel, never
 *    a modal;
 *  - fires the Part-VI telemetry (cta_seen / cta_clicked / cta_succeeded /
 *    cta_failed) through the injected sink;
 *  - honors reduced-motion (drops scale + glow, keeps the label change),
 *    focus-visible, aria-busy, and a 44px min hit target.
 *
 * All copy is injected (`labels`) — the package ships no hardcoded English.
 */

import { useCallback, useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { Check, Loader2, RotateCcw, X } from "lucide-react";
import { cn } from "@henryco/ui/cn";
import { useInteractionTelemetry } from "../../context";
import { useReducedMotion } from "../../motion";
import {
  CONFIRM_WINDOW_MS,
  SUCCESS_MS,
  initialCtaState,
  resolveCtaState,
  type CtaEvent,
  type CtaState,
} from "./cta.logic";

export type CtaVariant = "primary" | "secondary" | "destructive";

export interface CtaLabels {
  /** Active-verb label shown while in-flight, e.g. "Saving…". Falls back to the default label. */
  inflight?: string;
  /** Label after success, e.g. "Saved". Falls back to the default label. */
  success?: string;
  /** Retry affordance shown on failure, e.g. "Try again". */
  retry: string;
  /** Destructive confirm prompt, e.g. "Confirm delete". */
  confirm: string;
  /** Cancel affordance for the destructive confirm, e.g. "Cancel". */
  cancel: string;
}

export interface CtaButtonProps {
  ctaId: string;
  surfaceId: string;
  /** Default label. */
  children: ReactNode;
  /** The action to run. Resolve = success; throw = failure (message → error_class). */
  onAction: () => Promise<void>;
  variant?: CtaVariant;
  abVariant?: string;
  labels: CtaLabels;
  disabled?: boolean;
  className?: string;
}

function scrollDepthPct(): number {
  if (typeof window === "undefined" || typeof document === "undefined") return 0;
  const doc = document.documentElement;
  const total = doc.scrollHeight - doc.clientHeight;
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round(((window.scrollY || 0) / total) * 100)));
}

export function CtaButton({
  ctaId,
  surfaceId,
  children,
  onAction,
  variant = "primary",
  abVariant,
  labels,
  disabled = false,
  className,
}: CtaButtonProps) {
  const destructive = variant === "destructive";
  const telemetry = useInteractionTelemetry();
  const reduced = useReducedMotion();

  const [state, dispatch] = useReducer(
    (prev: CtaState, event: CtaEvent) => resolveCtaState(prev, event, { destructive }),
    initialCtaState,
  );
  const [pressing, setPressing] = useState(false);

  const ref = useRef<HTMLButtonElement | null>(null);
  const seenRef = useRef(false);
  const pageViewAtRef = useRef<number>(typeof performance !== "undefined" ? performance.now() : 0);
  const retriedRef = useRef(false);

  // cta_seen — fire once when the button first enters the viewport.
  useEffect(() => {
    const node = ref.current;
    if (!node || seenRef.current || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !seenRef.current) {
            seenRef.current = true;
            telemetry.emit({
              name: "cta_seen",
              props: { cta_id: ctaId, surface_id: surfaceId, ab_variant: abVariant, scroll_depth_at_view: scrollDepthPct() },
            });
            io.disconnect();
          }
        }
      },
      { threshold: 0.5 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [ctaId, surfaceId, abVariant, telemetry]);

  // success auto-collapse after SUCCESS_MS.
  useEffect(() => {
    if (state.phase !== "success" || state.successAt == null) return;
    const at = state.successAt;
    const t = setTimeout(() => dispatch({ type: "tick", at: at + SUCCESS_MS }), SUCCESS_MS);
    return () => clearTimeout(t);
  }, [state.phase, state.successAt]);

  // destructive confirm auto-cancel after CONFIRM_WINDOW_MS.
  useEffect(() => {
    if (state.phase !== "confirm" || state.confirmAt == null) return;
    const at = state.confirmAt;
    const t = setTimeout(() => dispatch({ type: "tick", at: at + CONFIRM_WINDOW_MS }), CONFIRM_WINDOW_MS);
    return () => clearTimeout(t);
  }, [state.phase, state.confirmAt]);

  const runAction = useCallback(
    async (isRetry: boolean) => {
      dispatch({ type: "submitStart" });
      telemetry.emit({
        name: "cta_clicked",
        props: {
          cta_id: ctaId,
          surface_id: surfaceId,
          ab_variant: abVariant,
          time_since_page_view_ms:
            typeof performance !== "undefined" ? Math.round(performance.now() - pageViewAtRef.current) : undefined,
        },
      });
      const t0 = typeof performance !== "undefined" ? performance.now() : 0;
      try {
        await onAction();
        const latency = typeof performance !== "undefined" ? Math.round(performance.now() - t0) : 0;
        dispatch({ type: "submitOk", at: Date.now() });
        retriedRef.current = false;
        telemetry.emit({ name: "cta_succeeded", props: { cta_id: ctaId, surface_id: surfaceId, latency_ms: latency } });
      } catch (err) {
        const error_class = err instanceof Error ? err.name || "Error" : "Error";
        dispatch({ type: "submitErr", errorClass: error_class });
        telemetry.emit({ name: "cta_failed", props: { cta_id: ctaId, surface_id: surfaceId, error_class, retried: isRetry } });
        retriedRef.current = true;
      }
    },
    [ctaId, surfaceId, abVariant, onAction, telemetry],
  );

  const handleClick = useCallback(() => {
    if (disabled || state.phase === "inflight") return;
    if (state.phase === "error") {
      void runAction(true);
      return;
    }
    if (destructive) {
      if (state.phase === "idle") {
        dispatch({ type: "press", at: Date.now() }); // → confirm (inline two-step)
        return;
      }
      if (state.phase === "confirm") {
        dispatch({ type: "confirm" });
        void runAction(false);
        return;
      }
    }
    void runAction(false);
  }, [disabled, destructive, state.phase, runAction]);

  const active = labels;
  const stacked: Array<{ key: CtaState["phase"] | "idle"; node: ReactNode }> = [
    { key: "idle", node: children },
    { key: "inflight", node: <>{reduced ? null : <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}{active.inflight ?? children}</> },
    { key: "success", node: <><Check className="h-4 w-4" aria-hidden />{active.success ?? children}</> },
    { key: "error", node: <><RotateCcw className="h-4 w-4" aria-hidden />{active.retry}</> },
    { key: "confirm", node: active.confirm },
  ];
  const currentKey: CtaState["phase"] | "idle" = state.phase === "pressed" ? "idle" : state.phase;

  const base =
    "relative inline-grid min-h-[44px] place-items-center rounded-full px-6 py-3 text-sm font-semibold outline-none transition duration-150 ease-out select-none";
  const focus =
    "focus-visible:ring-2 focus-visible:ring-amber-500/55 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-amber-400/50 dark:focus-visible:ring-offset-[#0a0f14]";
  const variantClass =
    variant === "primary"
      ? "bg-[color:var(--site-accent,#C9A227)] text-zinc-950 hover:brightness-[1.04]"
      : variant === "destructive" && state.phase === "confirm"
        ? "bg-[color:var(--hc-red,#B4322E)] text-white"
        : variant === "destructive"
          ? "border border-[color:var(--hc-red,#B4322E)]/50 text-[color:var(--hc-red,#B4322E)] hover:bg-[color:var(--hc-red,#B4322E)]/8"
          : "border border-zinc-300/80 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-white/15 dark:bg-white/[0.04] dark:text-white";
  const pressScale = pressing && !reduced ? "scale-[0.98]" : "scale-100";
  const glow =
    state.phase === "success" && variant === "primary" && !reduced
      ? "shadow-[0_0_0_4px_color-mix(in_srgb,var(--site-accent,#C9A227)_28%,transparent)]"
      : "";

  return (
    <span className="inline-flex items-center gap-2">
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        onPointerDown={() => setPressing(true)}
        onPointerUp={() => setPressing(false)}
        onPointerLeave={() => setPressing(false)}
        onPointerCancel={() => setPressing(false)}
        disabled={disabled}
        aria-busy={state.phase === "inflight" || undefined}
        data-phase={state.phase}
        className={cn(base, focus, variantClass, pressScale, glow, disabled && "cursor-not-allowed opacity-70", className)}
      >
        {/* Width-lock: every label occupies the same grid cell; only the active one shows. */}
        {stacked.map((item) => (
          <span
            key={item.key}
            aria-hidden={item.key !== currentKey}
            className={cn(
              "col-start-1 row-start-1 inline-flex items-center gap-2 whitespace-nowrap",
              item.key === currentKey ? "visible opacity-100" : "invisible opacity-0",
            )}
          >
            {item.node}
          </span>
        ))}
      </button>

      {state.phase === "confirm" ? (
        <button
          type="button"
          onClick={() => dispatch({ type: "cancel" })}
          className={cn(
            "inline-flex min-h-[44px] items-center gap-1 rounded-full px-3 text-sm font-medium text-zinc-500 outline-none",
            "hover:text-zinc-800 dark:text-white/60 dark:hover:text-white",
            "focus-visible:ring-2 focus-visible:ring-amber-500/45 focus-visible:ring-offset-1",
          )}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          {active.cancel}
        </button>
      ) : null}
    </span>
  );
}
