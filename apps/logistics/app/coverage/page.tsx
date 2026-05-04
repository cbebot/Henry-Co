import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { getPublicLogisticsSnapshot } from "@/lib/logistics/data";
import type { LogisticsZone } from "@/lib/logistics/types";

export const metadata: Metadata = {
  title: "Coverage | HenryCo Logistics",
  description:
    "Service zones, ETAs, and base coverage we deliver across — published from the live logistics rate book.",
};

export const dynamic = "force-dynamic";

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export default async function CoveragePage() {
  const { zones, settings, stats } = await getPublicLogisticsSnapshot();

  const groupedByRegion = zones.reduce<Record<string, LogisticsZone[]>>(
    (acc: Record<string, LogisticsZone[]>, zone: LogisticsZone) => {
      const region = zone.region || "Other";
      acc[region] = acc[region] ? [...acc[region], zone] : [zone];
      return acc;
    },
    {}
  );
  const regions = Object.keys(groupedByRegion).sort();

  return (
    <main id="henryco-main" tabIndex={-1} className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[88rem] space-y-12">
        <header>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--logistics-accent-soft)]">
            Coverage
          </p>
          <h1 className="mt-4 max-w-3xl text-balance text-[2rem] font-semibold leading-[1.04] tracking-[-0.025em] text-white sm:text-[2.6rem] md:text-[3rem]">
            Where we deliver.
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--logistics-muted)] sm:text-lg">
            {stats.activeZones} active zones · {settings.pickupHours}. Outside these zones we route via
            inter-city dispatch — request a quote and we will confirm feasibility before we accept.
          </p>
        </header>

        <section className="space-y-10">
          {regions.length === 0 ? (
            <p className="text-sm text-[var(--logistics-muted)]">
              Coverage is being refreshed. Request a quote and we will confirm your zone manually.
            </p>
          ) : (
            regions.map((region) => (
              <div key={region} className="space-y-5">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="text-[1.4rem] font-semibold leading-tight tracking-tight text-white sm:text-[1.6rem]">
                    {region}
                  </h2>
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--logistics-accent-soft)]">
                    {groupedByRegion[region].length} zones
                  </span>
                </div>
                <ul className="divide-y divide-[var(--logistics-line)] border-y border-[var(--logistics-line)]">
                  {groupedByRegion[region].map((zone: LogisticsZone) => (
                    <li
                      key={zone.id}
                      className="grid gap-4 py-6 md:grid-cols-[0.32fr,0.5fr,0.18fr]"
                    >
                      <div>
                        <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--logistics-accent-soft)]">
                          {zone.key}
                        </p>
                        <h3 className="mt-2 text-base font-semibold text-white">{zone.name}</h3>
                        <p className="mt-1 text-xs text-[var(--logistics-muted)]">{zone.city}</p>
                      </div>
                      <p className="text-sm leading-7 text-[var(--logistics-muted)]">
                        {zone.summary}
                      </p>
                      <div className="text-right text-sm">
                        <p className="font-semibold text-white">{naira.format(zone.baseFee)}</p>
                        <p className="mt-1 text-xs text-[var(--logistics-muted)]">
                          {zone.etaHoursMin}–{zone.etaHoursMax}h ETA
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/quote"
            className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#f6e2d0_0%,var(--logistics-accent)_52%,#9f8b7d_100%)] px-6 py-3.5 text-sm font-semibold text-[#170f12] shadow-[0_18px_44px_rgba(215,117,57,0.22)] transition hover:-translate-y-0.5"
          >
            Request a quote
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/business"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--logistics-line)] bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white/90 transition hover:bg-white/[0.07]"
          >
            For business
          </Link>
        </div>
      </div>
    </main>
  );
}
