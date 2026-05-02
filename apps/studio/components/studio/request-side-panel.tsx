import {
  ArrowRight,
  CircleDollarSign,
  Gauge,
  ShieldCheck,
  Sparkles,
  Target,
  Waypoints,
} from "lucide-react";
import {
  formatNaira,
  readinessBand,
  routeRecommendation,
} from "@/components/studio/request-builder-data";
import type { StudioPricingSummary } from "@/lib/studio/pricing";

/**
 * StudioRequestSidePanel — compact, single-surface progress panel that
 * stays sticky next to the multi-step request builder.
 *
 * Replaces the previous three stacked oversized cards (Live brief signal +
 * Pricing preview + Next-step guidance, ~78 lines of vertical chrome) with
 * one focused `rounded-[1.6rem]` panel that fits a 1366×768 laptop without
 * scrolling. Composition: readiness chip → pricing dl with expandable
 * breakdown → 3 short divided rows of guidance. No nested oversized
 * panels, no per-row icon boxes.
 */
export function StudioRequestSidePanel({
  pathway,
  readinessScore,
  pricingPreview,
  recommendedTeamName,
}: {
  pathway: "package" | "custom";
  readinessScore: number;
  pricingPreview: StudioPricingSummary;
  recommendedTeamName: string;
}) {
  const guidance = [
    {
      icon: ShieldCheck,
      title: "Trust-first pricing",
      body: "Preview reflects scope, platform, and timing. Deposit unlocks delivery — not a black box.",
    },
    {
      icon: Waypoints,
      title: "After you submit",
      body: "Proposal link, payment reference, and a place to upload proof. Domain and hosting are explained before go-live.",
    },
    {
      icon: Sparkles,
      title: "You can pause",
      body: "Save notes, attach files, come back. Nothing here is meant to rush a cautious buyer.",
    },
  ] as const;

  return (
    <aside className="2xl:sticky 2xl:top-28">
      <section className="studio-panel rounded-[1.6rem] p-5 sm:p-6">
        {/* Top: readiness chip + pathway label, single row, no oversized
            number tile. */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--studio-line)] bg-black/10 text-[var(--studio-signal)]"
            >
              <Gauge className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                Brief readiness
              </div>
              <div className="mt-0.5 truncate text-sm font-semibold text-[var(--studio-ink)]">
                {readinessScore}/100 · {readinessBand(readinessScore)}
              </div>
            </div>
          </div>
          <div className="shrink-0 rounded-full border border-[var(--studio-line)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
            {pathway === "package" ? "Package" : "Custom"}
          </div>
        </div>

        {/* Compact 3-stop progress meter — replaces the 4 oversized boxes. */}
        <div
          className="mt-4 h-1 w-full overflow-hidden rounded-full bg-[var(--studio-line)]/60"
          aria-hidden
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--studio-signal)]/80 to-[var(--studio-signal)] transition-all duration-500 ease-out"
            style={{ width: `${Math.max(8, Math.min(100, readinessScore))}%` }}
          />
        </div>

        {/* Pricing preview — single dl with two rows + optional breakdown
            details. No oversized number, no double headings. */}
        <dl className="mt-5 divide-y divide-[var(--studio-line)] border-y border-[var(--studio-line)]">
          <div className="flex items-baseline justify-between gap-3 py-2.5">
            <dt className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-ink-soft)]">
              <CircleDollarSign className="h-3.5 w-3.5 text-[var(--studio-signal)]" />
              Total
            </dt>
            <dd className="font-mono text-sm font-semibold tabular-nums text-[var(--studio-ink)]">
              {formatNaira(pricingPreview.total)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 py-2.5">
            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-ink-soft)]">
              Deposit · {Math.round(pricingPreview.depositRate * 100)}%
            </dt>
            <dd className="font-mono text-sm font-semibold tabular-nums text-[var(--studio-signal)]">
              {formatNaira(pricingPreview.depositAmount)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 py-2.5">
            <dt className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-ink-soft)]">
              <Target className="h-3.5 w-3.5 text-[var(--studio-signal)]" />
              Team
            </dt>
            <dd className="max-w-[58%] truncate text-right text-sm font-semibold text-[var(--studio-ink)]">
              {recommendedTeamName}
            </dd>
          </div>
        </dl>

        {/* Line-by-line breakdown — collapsed by default, in a hairline
            disclosure. No nested panel chrome. */}
        {pricingPreview.lines.length > 0 ? (
          <details className="group mt-3 [&>summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-md py-1 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-ink-soft)] transition hover:text-[var(--studio-ink)]">
              <span>{pricingPreview.lines.length} line item{pricingPreview.lines.length === 1 ? "" : "s"}</span>
              <span aria-hidden className="text-[var(--studio-signal)] transition group-open:rotate-180">▾</span>
            </summary>
            <ul className="mt-1 divide-y divide-[var(--studio-line)]/60 border-t border-[var(--studio-line)]/60">
              {pricingPreview.lines.map((line) => (
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

        {/* Next-step recommendation — one line, not a heading + body block. */}
        <p className="mt-4 flex items-start gap-2 border-l-2 border-[var(--studio-signal)]/55 pl-3 text-[13px] leading-6 text-[var(--studio-ink-soft)]">
          <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--studio-signal)]" />
          <span className="min-w-0">{routeRecommendation(pathway, readinessScore)}</span>
        </p>

        {/* Guidance — divided list, single-line headings, no per-row panels. */}
        <ul className="mt-5 divide-y divide-[var(--studio-line)] border-t border-[var(--studio-line)]">
          {guidance.map((item) => (
            <li key={item.title} className="flex gap-3 py-3">
              <item.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--studio-signal)]" />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold tracking-tight text-[var(--studio-ink)]">
                  {item.title}
                </div>
                <p className="mt-0.5 text-[12.5px] leading-6 text-[var(--studio-ink-soft)]">
                  {item.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
