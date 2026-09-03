"use client";

/**
 * Pricing Reveal Engine — `<PriceReveal>` + `<PlatformFeeTooltip>`
 * (doctrine Engine 8 / Kindness Doctrine).
 *
 * Honest price rendering:
 *  - always in the user's currency via the injected formatter;
 *  - platform fee broken out as a NAMED line item, with a tooltip whose
 *    copy (injected, localized) says what the fee funds;
 *  - converted prices disclose source amount + FX rate + timestamp on
 *    hover/tap — no silent conversion;
 *  - `pricing_revealed` fires once per mount.
 *
 * This component renders money; it never moves it.
 */

import { useEffect, useId, useRef, useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@henryco/ui/cn";
import { useCurrencyFormatter, useInteractionTelemetry } from "../../context";
import { breakdownPrice, type FxDisclosure } from "./pricing-reveal.logic";

export interface PriceRevealLabels {
  /** Line-item name for the total, e.g. "Total". */
  total: string;
  /** Line-item name for the fee, e.g. "Henry Onyx platform fee". */
  fee: string;
  /** What the fee funds, e.g. "Supports verification, dispute resolution, and 24/7 support." */
  feeExplainer: string;
  /** Line-item name for the provider/net amount, e.g. "Goes to your provider". */
  net: string;
  /** FX prefix, e.g. "Converted from". */
  convertedFrom?: string;
}

export interface PriceRevealProps {
  surfaceId: string;
  amountMinor: number;
  currency: string;
  feeRateBps: number;
  labels: PriceRevealLabels;
  fx?: FxDisclosure;
  className?: string;
}

export function PlatformFeeTooltip({
  explainer,
  className,
}: {
  explainer: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const tipId = useId();
  return (
    <span className={cn("relative inline-flex", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-describedby={open ? tipId : undefined}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        className={cn(
          "grid h-6 w-6 min-h-0 place-items-center rounded-full text-zinc-400 outline-none",
          "hover:text-zinc-600 dark:text-white/40 dark:hover:text-white/70",
          "focus-visible:ring-2 focus-visible:ring-amber-500/55",
        )}
      >
        <Info className="h-3.5 w-3.5" aria-hidden />
      </button>
      {open ? (
        <span
          id={tipId}
          role="tooltip"
          className={cn(
            "absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-xl px-3 py-2 text-xs leading-5",
            "border border-zinc-200/85 bg-white text-zinc-700 shadow-[0_18px_48px_-28px_rgba(15,23,42,0.32)]",
            "dark:border-white/10 dark:bg-[#0b1018] dark:text-white/80",
          )}
        >
          {explainer}
        </span>
      ) : null}
    </span>
  );
}

export function PriceReveal({
  surfaceId,
  amountMinor,
  currency,
  feeRateBps,
  labels,
  fx,
  className,
}: PriceRevealProps) {
  const telemetry = useInteractionTelemetry();
  const format = useCurrencyFormatter();
  const emittedRef = useRef(false);
  const [fxOpen, setFxOpen] = useState(false);

  const breakdown = breakdownPrice(amountMinor, feeRateBps);

  useEffect(() => {
    if (emittedRef.current) return;
    emittedRef.current = true;
    telemetry.emit({
      name: "pricing_revealed",
      props: { surface_id: surfaceId, currency, converted_from: fx?.sourceCurrency },
    });
  }, [telemetry, surfaceId, currency, fx?.sourceCurrency]);

  const row = "flex items-baseline justify-between gap-4 text-sm";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className={cn(row, "text-base font-semibold text-zinc-950 dark:text-white")}>
        <span>{labels.total}</span>
        <span className="tabular-nums">{format(breakdown.totalMinor, currency)}</span>
      </div>

      <div className={cn(row, "text-zinc-600 dark:text-white/70")}>
        <span className="inline-flex items-center gap-1">
          {labels.fee}
          <PlatformFeeTooltip explainer={labels.feeExplainer} />
        </span>
        <span className="tabular-nums">{format(breakdown.feeMinor, currency)}</span>
      </div>

      <div className={cn(row, "text-zinc-600 dark:text-white/70")}>
        <span>{labels.net}</span>
        <span className="tabular-nums">{format(breakdown.netMinor, currency)}</span>
      </div>

      {fx && labels.convertedFrom ? (
        <button
          type="button"
          onClick={() => setFxOpen((o) => !o)}
          aria-expanded={fxOpen}
          className={cn(
            "mt-1 self-start text-xs text-zinc-400 underline decoration-dotted underline-offset-2 outline-none",
            "hover:text-zinc-600 dark:text-white/40 dark:hover:text-white/70",
            "focus-visible:ring-2 focus-visible:ring-amber-500/45 rounded",
          )}
        >
          {labels.convertedFrom} {format(fx.sourceMinor, fx.sourceCurrency)}
        </button>
      ) : null}
      {fx && fxOpen ? (
        <p className="text-xs leading-5 text-zinc-400 dark:text-white/40 tabular-nums">
          {fx.rateLabel} · {fx.asOf}
        </p>
      ) : null}
    </div>
  );
}
