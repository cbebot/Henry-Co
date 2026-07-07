"use client";

/**
 * Local Boost Engine — `<PromotedLabel>` + `<BoostControls>` (doctrine
 * Engine 10 / Principle 14).
 *
 * Buyer side: a clear, low-drama "Promoted by [seller]" label — never 9px
 * grey. Seller side: a live projected impressions/clicks preview for the
 * bid BEFORE payment, from a server-computed locale baseline. Transparent
 * both ways; trust earns repeat boost spend.
 */

import { useMemo, useState } from "react";
import { cn } from "@henryco/ui/cn";
import { useCurrencyFormatter } from "../../context";
import { projectBoost, type BoostBaseline } from "./boost.logic";

export interface PromotedLabelProps {
  /** Label template output, e.g. "Promoted by Adaeze's Fabrics" — localized upstream. */
  text: string;
  className?: string;
}

export function PromotedLabel({ text, className }: PromotedLabelProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-zinc-300/70 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em]",
        "text-zinc-600 dark:border-white/15 dark:text-white/65",
        className,
      )}
    >
      {text}
    </span>
  );
}

export interface BoostControlsLabels {
  /** e.g. "Your boost budget". */
  bidLabel: string;
  /** e.g. "Projected impressions". */
  impressions: string;
  /** e.g. "Projected clicks". */
  clicks: string;
}

export interface BoostControlsProps {
  labels: BoostControlsLabels;
  currency: string;
  /** Server-computed locale baseline (live history, never invented). */
  baseline: BoostBaseline;
  locale: string;
  /** Bid steps in minor units, e.g. [25_000, 50_000, 100_000]. */
  bidStepsMinor: number[];
  /** Called with the chosen bid when it changes. */
  onBidChange?: (bidMinor: number) => void;
  className?: string;
}

export function BoostControls({
  labels,
  currency,
  baseline,
  locale,
  bidStepsMinor,
  onBidChange,
  className,
}: BoostControlsProps) {
  const format = useCurrencyFormatter();
  const [bidMinor, setBidMinor] = useState(bidStepsMinor[0] ?? 0);
  const projection = useMemo(() => projectBoost(bidMinor, locale, baseline), [bidMinor, locale, baseline]);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div>
        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{labels.bidLabel}</p>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={labels.bidLabel}>
          {bidStepsMinor.map((step) => {
            const active = step === bidMinor;
            return (
              <button
                key={step}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setBidMinor(step);
                  onBidChange?.(step);
                }}
                className={cn(
                  "min-h-[44px] rounded-full border px-4 text-sm font-medium outline-none transition",
                  "focus-visible:ring-2 focus-visible:ring-amber-500/55 focus-visible:ring-offset-2",
                  active
                    ? "border-[color:var(--site-accent,#C9A227)] bg-[color:color-mix(in_srgb,var(--site-accent,#C9A227)_12%,transparent)] text-zinc-950 dark:text-white"
                    : "border-zinc-300/80 text-zinc-700 hover:bg-zinc-50 dark:border-white/15 dark:text-white/75 dark:hover:bg-white/[0.05]",
                )}
              >
                <span className="tabular-nums">{format(step, currency)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-[1.25rem] border border-zinc-200/70 p-4 dark:border-white/8">
          <dt className="text-xs text-zinc-500 dark:text-white/50">{labels.impressions}</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums text-zinc-950 dark:text-white">
            {projection.impressions.toLocaleString()}
          </dd>
        </div>
        <div className="rounded-[1.25rem] border border-zinc-200/70 p-4 dark:border-white/8">
          <dt className="text-xs text-zinc-500 dark:text-white/50">{labels.clicks}</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums text-zinc-950 dark:text-white">
            {projection.clicks.toLocaleString()}
          </dd>
        </div>
      </dl>
    </div>
  );
}
