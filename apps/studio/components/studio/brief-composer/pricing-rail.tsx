"use client";

import { motion } from "framer-motion";
import { ArrowDown, CircleDollarSign, Gauge } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { formatNaira, readinessBand } from "@/components/studio/request-builder-data";
import { useStudioMotion } from "@/lib/studio/motion";
import type { StudioPricingSummary } from "@/lib/studio/pricing";

/**
 * The composer's live pricing panel — the same honest client-side estimate
 * the wizard's side panel shows (one `estimateStudioPricing` source, no
 * divergence), plus the readiness hint. Markup adapted from
 * `request-side-panel.tsx`.
 */
export function PricingRailPanel({
  pathway,
  readinessScore,
  pricing,
}: {
  pathway: "package" | "custom";
  readinessScore: number;
  pricing: StudioPricingSummary;
}) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const m = useStudioMotion();

  return (
    <section className="studio-panel rounded-[1.6rem] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--studio-line)] bg-[color:var(--home-surface-04)] text-[var(--studio-signal)]"
          >
            <Gauge className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
              {t("Brief readiness")}
            </div>
            <div className="mt-0.5 truncate text-sm font-semibold text-[var(--studio-ink)]">
              {readinessScore}/100 · {t(readinessBand(readinessScore))}
            </div>
          </div>
        </div>
        <div className="shrink-0 rounded-full border border-[var(--studio-line)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
          {pathway === "package" ? t("Package") : t("Custom")}
        </div>
      </div>

      <div
        className="mt-4 h-1 w-full overflow-hidden rounded-full bg-[var(--studio-line)]/60"
        aria-hidden
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--studio-signal)]/80 to-[var(--studio-signal)] transition-all duration-500 ease-out"
          style={{ width: `${Math.max(8, Math.min(100, readinessScore))}%` }}
        />
      </div>

      <dl className="mt-5 divide-y divide-[var(--studio-line)] border-y border-[var(--studio-line)]">
        <div className="flex items-baseline justify-between gap-3 py-2.5">
          <dt className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-ink-soft)]">
            <CircleDollarSign className="h-3.5 w-3.5 text-[var(--studio-signal)]" />
            {t("Total")}
          </dt>
          <dd className="font-mono text-sm font-semibold tabular-nums text-[var(--studio-ink)]">
            <motion.span
              key={pricing.total}
              variants={m.pricingCountUp}
              initial="hidden"
              animate="visible"
              className="inline-block"
            >
              {formatNaira(pricing.total)}
            </motion.span>
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 py-2.5">
          <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-ink-soft)]">
            {t("Deposit")} · {Math.round(pricing.depositRate * 100)}%
          </dt>
          <dd className="font-mono text-sm font-semibold tabular-nums text-[var(--studio-signal)]">
            <motion.span
              key={pricing.depositAmount}
              variants={m.pricingCountUp}
              initial="hidden"
              animate="visible"
              className="inline-block"
            >
              {formatNaira(pricing.depositAmount)}
            </motion.span>
          </dd>
        </div>
      </dl>

      {pricing.lines.length > 0 ? (
        <details className="group mt-3 [&>summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-md py-1 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-ink-soft)] transition hover:text-[var(--studio-ink)]">
            <span>
              {pricing.lines.length}{" "}
              {pricing.lines.length === 1 ? t("line item") : t("line items")}
            </span>
            <span aria-hidden className="text-[var(--studio-signal)] transition group-open:rotate-180">
              ▾
            </span>
          </summary>
          <ul className="mt-1 divide-y divide-[var(--studio-line)]/60 border-t border-[var(--studio-line)]/60">
            {pricing.lines.map((line) => (
              <li
                key={`${line.label}-${line.amount}`}
                className="flex items-baseline justify-between gap-4 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-[var(--studio-ink)]">
                    {line.label}
                  </div>
                  {line.detail ? (
                    <div className="mt-0.5 text-[10.5px] uppercase tracking-[0.16em] text-[var(--studio-ink-soft)]">
                      {line.detail}
                    </div>
                  ) : null}
                </div>
                <div className="shrink-0 font-mono text-[13px] font-semibold tabular-nums text-[var(--studio-signal)]">
                  {formatNaira(line.amount)}
                </div>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <p className="mt-4 border-l-2 border-[var(--studio-signal)]/55 pl-3 text-[13px] leading-6 text-[var(--studio-ink-soft)]">
        {t("Preview reflects scope, platform, and timing. Deposit unlocks delivery — not a black box.")}
      </p>
    </section>
  );
}

/**
 * Compact fixed bar for small screens — the rail stacks below the cards
 * there, so this keeps the live total and a way to the submit block in
 * reach while editing.
 */
export function MobilePricingBar({
  pricing,
  targetId,
}: {
  pricing: StudioPricingSummary;
  targetId: string;
}) {
  const locale = useHenryCoLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--studio-line-strong)] bg-[var(--studio-surface-strong)]/95 px-4 py-3 backdrop-blur 2xl:hidden">
      <div className="mx-auto flex max-w-[88rem] items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--studio-ink-soft)]">
            {t("Total")} · {t("Deposit")} {Math.round(pricing.depositRate * 100)}%
          </div>
          <div className="mt-0.5 truncate font-mono text-sm font-semibold tabular-nums text-[var(--studio-ink)]">
            {formatNaira(pricing.total)}
            <span className="mx-1.5 opacity-40">·</span>
            <span className="text-[var(--studio-signal)]">{formatNaira(pricing.depositAmount)}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            document
              .getElementById(targetId)
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--studio-line)] px-4 py-2.5 text-[12.5px] font-semibold text-[var(--studio-ink)] transition hover:border-[var(--studio-signal)]/45"
        >
          {t("Review & submit")}
          <ArrowDown className="h-3.5 w-3.5 text-[var(--studio-signal)]" aria-hidden />
        </button>
      </div>
    </div>
  );
}
