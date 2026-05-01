import {
  BriefcaseBusiness,
  CircleDollarSign,
  Gauge,
  Globe,
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
  return (
    <aside className="space-y-6 2xl:sticky 2xl:top-28">
      <section className="studio-panel rounded-[2.5rem] p-6 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <div className="studio-kicker">Live brief signal</div>
          <Gauge className="h-5 w-5 text-[var(--studio-signal)]" />
        </div>
        <div className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-[var(--studio-ink)]">{readinessScore}</div>
        <div className="mt-2 text-sm font-medium text-[var(--studio-signal)]">{readinessBand(readinessScore)}</div>

        <div className="mt-6 space-y-3">
          {[
            { icon: BriefcaseBusiness, label: "Buying route", value: pathway === "package" ? "Package-led engagement" : "Custom proposal path" },
            { icon: CircleDollarSign, label: "Current total", value: formatNaira(pricingPreview.total) },
            { icon: Target, label: "Recommended team", value: recommendedTeamName },
            {
              icon: Globe,
              label: "Launch readiness",
              value: "Domain, DNS, and go-live are planned with you—not left as a surprise after payment.",
            },
          ].map((item) => (
            <div key={item.label} className="rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-4">
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4 text-[var(--studio-signal)]" />
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">{item.label}</div>
              </div>
              <div className="mt-3 text-base font-semibold text-[var(--studio-ink)]">{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="studio-panel rounded-[2.5rem] p-6 sm:p-7">
        <div className="flex items-baseline justify-between gap-3">
          <div className="studio-kicker">Pricing preview</div>
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-[var(--studio-ink-soft)]">
            {pricingPreview.lines.length} line{pricingPreview.lines.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--studio-ink)]">{formatNaira(pricingPreview.total)}</div>
        <div className="mt-2 text-sm text-[var(--studio-ink-soft)]">
          Deposit lane {formatNaira(pricingPreview.depositAmount)} ({Math.round(pricingPreview.depositRate * 100)}%)
        </div>

        {pricingPreview.lines.length > 0 ? (
          <details className="group mt-5 rounded-[1.35rem] border border-[var(--studio-line)] bg-black/10 [&>summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-[1.35rem] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-ink-soft)] transition hover:text-[var(--studio-ink)]">
              <span>Line-by-line breakdown</span>
              <span aria-hidden className="text-[var(--studio-signal)] transition group-open:rotate-180">▾</span>
            </summary>
            <ul className="space-y-2 px-4 pb-4 pt-1">
              {pricingPreview.lines.map((line) => (
                <li
                  key={`${line.label}-${line.amount}`}
                  className="flex items-baseline justify-between gap-4 border-t border-[var(--studio-line)]/60 pt-2 first:border-0 first:pt-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-[var(--studio-ink)]">{line.label}</div>
                    {line.detail ? (
                      <div className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-[var(--studio-ink-soft)]">{line.detail}</div>
                    ) : null}
                  </div>
                  <div className="shrink-0 font-mono text-sm font-semibold text-[var(--studio-signal)] tabular-nums">
                    {formatNaira(line.amount)}
                  </div>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </section>

      <section className="studio-panel rounded-[2.5rem] p-6 sm:p-7">
        <div className="studio-kicker">Next-step guidance</div>
        <div className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--studio-ink)]">
          {routeRecommendation(pathway, readinessScore)}
        </div>
        <div className="mt-5 space-y-3">
          {[
            {
              icon: ShieldCheck,
              title: "Trust-first pricing",
              body: "The preview reflects scope, platform complexity, and timing. Your deposit unlocks a real delivery record—not a black box.",
            },
            {
              icon: Waypoints,
              title: "What happens after submit",
              body: "You receive a proposal link, payment reference, and a clear place to upload proof. Domain and hosting steps are explained before go-live.",
            },
            {
              icon: Sparkles,
              title: "You can pause",
              body: "Save your notes, attach files, and come back. Nothing here is meant to rush a cautious buyer.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-[1.35rem] border border-[var(--studio-line)] bg-black/10 p-4">
              <item.icon className="h-4 w-4 text-[var(--studio-signal)]" />
              <div className="mt-3 text-base font-semibold text-[var(--studio-ink)]">{item.title}</div>
              <p className="mt-2 text-sm leading-7 text-[var(--studio-ink-soft)]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
