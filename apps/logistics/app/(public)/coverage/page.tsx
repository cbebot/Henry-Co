import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import {
  getLogisticsCoverageCopy,
  resolveLocalizedDynamicField,
} from "@henryco/i18n/server";
import { getLogisticsPublicLocale } from "@/lib/locale-server";
import { getPublicLogisticsSnapshot } from "@/lib/logistics/data";
import type { LogisticsZone } from "@/lib/logistics/types";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLogisticsPublicLocale();
  const copy = getLogisticsCoverageCopy(locale);
  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
  };
}

export const dynamic = "force-dynamic";

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export default async function CoveragePage() {
  const locale = await getLogisticsPublicLocale();
  const copy = getLogisticsCoverageCopy(locale);
  const { zones, settings, stats } = await getPublicLogisticsSnapshot();

  // Route Supabase-row text (zone.name / zone.summary, settings.pickupHours)
  // through the cached DeepL pipeline so non-English locales get translations.
  const [zonesLocalized, pickupHoursLocalized] = await Promise.all([
    Promise.all(
      zones.map(async (zone) => ({
        ...zone,
        name: await resolveLocalizedDynamicField({
          record: zone as unknown as Record<string, unknown>,
          field: "name",
          locale,
          fallback: zone.name,
          machineTranslate: locale !== "en",
        }),
        summary: await resolveLocalizedDynamicField({
          record: zone as unknown as Record<string, unknown>,
          field: "summary",
          locale,
          fallback: zone.summary,
          machineTranslate: locale !== "en",
        }),
      })),
    ),
    resolveLocalizedDynamicField({
      record: settings as unknown as Record<string, unknown>,
      field: "pickupHours",
      locale,
      fallback: settings.pickupHours,
      machineTranslate: locale !== "en",
    }),
  ]);

  const groupedByRegion = zonesLocalized.reduce<Record<string, LogisticsZone[]>>(
    (acc: Record<string, LogisticsZone[]>, zone: LogisticsZone) => {
      const region = zone.region || copy.zones.regionFallback;
      acc[region] = acc[region] ? [...acc[region], zone] : [zone];
      return acc;
    },
    {}
  );
  const regions = Object.keys(groupedByRegion).sort();

  const heroBody = copy.hero.bodyTemplate
    .replace("{activeZones}", String(stats.activeZones))
    .replace("{pickupHours}", pickupHoursLocalized);

  return (
    <main id="henryco-main" tabIndex={-1} className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[88rem] space-y-12">
        <header>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--logistics-accent-soft)]">
            {copy.hero.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-balance text-[2rem] font-semibold leading-[1.04] tracking-[-0.025em] text-[color:var(--home-ink)] sm:text-[2.6rem] md:text-[3rem]">
            {copy.hero.title}
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--logistics-muted)] sm:text-lg">
            {heroBody}
          </p>
        </header>

        <section className="space-y-10">
          {regions.length === 0 ? (
            <p className="text-sm text-[var(--logistics-muted)]">{copy.zones.empty}</p>
          ) : (
            regions.map((region) => (
              <div key={region} className="space-y-5">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="text-[1.4rem] font-semibold leading-tight tracking-tight text-[color:var(--home-ink)] sm:text-[1.6rem]">
                    {region}
                  </h2>
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--logistics-accent-soft)]">
                    {copy.zones.regionCountTemplate.replace(
                      "{count}",
                      String(groupedByRegion[region].length),
                    )}
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
                        <h3 className="mt-2 text-base font-semibold text-[color:var(--home-ink)]">{zone.name}</h3>
                        <p className="mt-1 text-xs text-[var(--logistics-muted)]">{zone.city}</p>
                      </div>
                      <p className="text-sm leading-7 text-[var(--logistics-muted)]">
                        {zone.summary}
                      </p>
                      <div className="text-right text-sm">
                        <p className="font-semibold text-[color:var(--home-ink)]">{naira.format(zone.baseFee)}</p>
                        <p className="mt-1 text-xs text-[var(--logistics-muted)]">
                          {copy.zones.etaSuffixTemplate
                            .replace("{min}", String(zone.etaHoursMin))
                            .replace("{max}", String(zone.etaHoursMax))}
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
            className="inline-flex items-center gap-2 rounded-full bg-[color:var(--home-accent)] px-6 py-3.5 text-sm font-semibold text-[color:var(--home-accent-ink)] shadow-[0_18px_44px_rgba(215,117,57,0.22)] transition hover:-translate-y-0.5 hover:bg-[color:var(--home-accent-strong)]"
          >
            {copy.ctas.quote}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/business"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--logistics-line)] bg-[color:var(--home-surface-04)] px-6 py-3.5 text-sm font-semibold text-[color:var(--home-ink)] transition hover:bg-[color:var(--home-surface-07)]"
          >
            {copy.ctas.business}
          </Link>
        </div>
      </div>
    </main>
  );
}
