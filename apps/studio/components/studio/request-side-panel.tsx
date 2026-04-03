import {
  BriefcaseBusiness,
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
        <div className="studio-kicker">Pricing preview</div>
        <div className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--studio-ink)]">{formatNaira(pricingPreview.total)}</div>
        <div className="mt-2 text-sm text-[var(--studio-ink-soft)]">
          Deposit lane {formatNaira(pricingPreview.depositAmount)} ({Math.round(pricingPreview.depositRate * 100)}%)
        </div>
        <div className="mt-5 space-y-3">
          {pricingPreview.lines.map((line) => (
            <div key={`${line.label}-${line.amount}`} className="rounded-[1.35rem] border border-[var(--studio-line)] bg-black/10 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-[var(--studio-ink)]">{line.label}</div>
                  {line.detail ? <div className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--studio-ink-soft)]">{line.detail}</div> : null}
                </div>
                <div className="text-sm font-semibold text-[var(--studio-signal)]">{formatNaira(line.amount)}</div>
              </div>
            </div>
          ))}
        </div>
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
              body: "The commercial preview reflects scope, platform complexity, and timing instead of a vague estimate.",
            },
            {
              icon: Waypoints,
              title: "Shared account continuity",
              body: "Top-level account history lives in HenryCo account while direct proposal and project rooms stay inside Studio.",
            },
            {
              icon: Sparkles,
              title: "Custom work stays first-class",
              body: "Serious custom requests are handled as a premium buying route, not buried behind toy presets.",
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
