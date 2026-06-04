import type { Metadata } from "next";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  MapPin,
  Radio,
  Shield,
  TruckIcon,
} from "lucide-react";
import { getAccountUrl, getDivisionConfig } from "@henryco/config";
import {
  getLogisticsHomeCopy,
  resolveLocalizedDynamicField,
  type LogisticsHomeCopy,
} from "@henryco/i18n/server";
import { PublicSpotlight } from "@henryco/ui/public-shell";
import { getPublicLogisticsSnapshot } from "@/lib/logistics/data";
import { LOGISTICS_FAQS } from "@/lib/logistics/content";
import { getLogisticsPublicLocale } from "@/lib/locale-server";
import { autoTranslate, autoTranslateMany } from "@/lib/i18n/auto-translate";
import {
  PortalHero,
  PortalSection,
  PortalDividedList,
  PortalLaneGrid,
  type PortalCapabilityMetric,
  type PortalDividedListItem,
  type PortalLaneCard,
} from "@/components/portal";
import "@/components/portal/styles.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLogisticsPublicLocale();
  const copy = getLogisticsHomeCopy(locale);
  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
  };
}

function applyTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? values[key] : `{${key}}`,
  );
}

function buildCoverageLine(
  copy: LogisticsHomeCopy,
  zoneNames: string[],
): string | null {
  if (!zoneNames.length) return null;
  if (zoneNames.length === 1) {
    return applyTemplate(copy.coverage.one, { zone: zoneNames[0]! });
  }
  if (zoneNames.length === 2) {
    return applyTemplate(copy.coverage.two, {
      first: zoneNames[0]!,
      second: zoneNames[1]!,
    });
  }
  const head = zoneNames.slice(0, -1).join(", ");
  const tail = zoneNames.at(-1) ?? "";
  return applyTemplate(copy.coverage.many, { head, tail });
}

export default async function LogisticsHomePage() {
  const logistics = getDivisionConfig("logistics");
  const locale = await getLogisticsPublicLocale();
  const copy = getLogisticsHomeCopy(locale);
  const snapshot = await getPublicLogisticsSnapshot();

  // Route the two Supabase-merged settings strings that are rendered
  // directly into hero / trust copy through cached DeepL.
  // `services` is the static LOGISTICS_SERVICES constant (no Supabase) —
  // skip per scope ("Supabase-row-driven text only").
  const [pickupHoursLocalized, trackingLookupHelpLocalized] = await Promise.all([
    resolveLocalizedDynamicField({
      record: snapshot.settings as unknown as Record<string, unknown>,
      field: "pickupHours",
      locale,
      fallback: snapshot.settings.pickupHours,
      machineTranslate: locale !== "en",
    }),
    resolveLocalizedDynamicField({
      record: snapshot.settings as unknown as Record<string, unknown>,
      field: "trackingLookupHelp",
      locale,
      fallback: snapshot.settings.trackingLookupHelp,
      machineTranslate: locale !== "en",
    }),
  ]);

  /*
   * Capability evidence — V3 PASS 21 / Wave B3 editorial bar.
   *
   * Pulls real numbers from the snapshot so the hero proves capacity
   * before headline copy proves anything. Every metric carries a trend
   * (anti-pattern #18 enforced at the type level).
   */
  const activeZones = snapshot.zones.filter((zone) => zone.active);
  const rawZoneNames = Array.from(
    new Set(activeZones.map((zone) => zone.name.trim()).filter(Boolean))
  );
  const zoneNames = await autoTranslateMany(rawZoneNames, locale);
  const coverageLine = buildCoverageLine(copy, zoneNames);
  const services = await Promise.all(
    snapshot.services.map(async (s) => ({
      ...s,
      name: await autoTranslate(s.name, locale),
      summary: await autoTranslate(s.summary, locale),
      promise: await autoTranslate(s.promise, locale),
      badge: await autoTranslate(s.badge, locale),
      highlights: await autoTranslateMany(s.highlights, locale),
    })),
  );
  const fastestEtaZone = activeZones.reduce<{ low: number; high: number } | null>(
    (acc, zone) => {
      if (!Number.isFinite(zone.etaHoursMin) || !Number.isFinite(zone.etaHoursMax)) return acc;
      if (!acc) return { low: zone.etaHoursMin, high: zone.etaHoursMax };
      return zone.etaHoursMin < acc.low ? { low: zone.etaHoursMin, high: zone.etaHoursMax } : acc;
    },
    null,
  );

  const activeLanesTrend = (() => {
    if (activeZones.length === 0) return copy.metrics.activeLanesAwaiting;
    if (zoneNames.length === activeZones.length) {
      return applyTemplate(
        zoneNames.length === 1
          ? copy.metrics.activeLanesAcrossOne
          : copy.metrics.activeLanesAcrossMany,
        { count: String(zoneNames.length) },
      );
    }
    return applyTemplate(copy.metrics.activeLanesNamedToday, {
      count: String(zoneNames.length),
    });
  })();

  const capabilityMetrics: PortalCapabilityMetric[] = [
    {
      label: copy.metrics.activeLanesLabel,
      value: String(activeZones.length || 0),
      trend: activeLanesTrend,
      trendDirection: "pos",
      pulse: activeZones.length > 0,
      emphasis: true,
    },
    {
      label: copy.metrics.serviceTiersLabel,
      value: String(services.length),
      trend: copy.metrics.serviceTiersTrend,
    },
    {
      label: copy.metrics.fastestWindowLabel,
      value: fastestEtaZone
        ? `${fastestEtaZone.low}–${fastestEtaZone.high}h`
        : copy.metrics.fastestWindowDash,
      trend: fastestEtaZone
        ? copy.metrics.fastestWindowTrendGoverned
        : copy.metrics.fastestWindowTrendAwaiting,
    },
    {
      label: copy.metrics.operatingHoursLabel,
      value: pickupHoursLocalized.includes("•")
        ? (pickupHoursLocalized.split("•")[1]?.trim() ?? pickupHoursLocalized)
        : pickupHoursLocalized,
      trend: pickupHoursLocalized.includes("•")
        ? (pickupHoursLocalized.split("•")[0]?.trim() ?? copy.metrics.operatingHoursDailyFallback)
        : copy.metrics.operatingHoursDailyFallback,
    },
  ];

  const trustItems: PortalDividedListItem[] = [
    {
      icon: MapPin,
      title: copy.why.audienceTitle,
      body: copy.why.audienceBody,
    },
    {
      icon: Radio,
      title: copy.why.trackingTitle,
      body: trackingLookupHelpLocalized,
    },
    {
      icon: Shield,
      title: copy.why.proofTitle,
      body: copy.why.proofBody,
    },
  ];

  const laneCards: PortalLaneCard[] = services.slice(0, 4).map((service) => ({
    badge: service.badge,
    title: service.name,
    body: service.summary,
    promise: service.promise,
    href: "/services",
  }));

  const stepLabel = copy.flow.stepLabel;
  const processItems: PortalDividedListItem[] = [
    {
      icon: ClipboardCheck,
      title: copy.flow.step01Title,
      body: copy.flow.step01Body,
      status: { label: `${stepLabel} 01`, tone: "active" },
    },
    {
      icon: TruckIcon,
      title: copy.flow.step02Title,
      body: copy.flow.step02Body,
      status: { label: `${stepLabel} 02`, tone: "neutral" },
    },
    {
      icon: Clock3,
      title: copy.flow.step03Title,
      body: copy.flow.step03Body,
      status: { label: `${stepLabel} 03`, tone: "neutral" },
    },
    {
      icon: CheckCircle2,
      title: copy.flow.step04Title,
      body: copy.flow.step04Body,
      status: { label: `${stepLabel} 04`, tone: "good" },
    },
  ];

  const faqEntries: { q: string; a: string }[] = [
    { q: copy.faqItems.quoteQ, a: copy.faqItems.quoteA },
    { q: copy.faqItems.trackingQ, a: copy.faqItems.trackingA },
    { q: copy.faqItems.riderIssueQ, a: copy.faqItems.riderIssueA },
    { q: copy.faqItems.repeatRoutesQ, a: copy.faqItems.repeatRoutesA },
  ].slice(0, LOGISTICS_FAQS.length);

  return (
    <main id="henryco-main" tabIndex={-1} className="px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[92rem] log-pf">
        <PortalHero
          locale={locale}
          eyebrow={copy.hero.eyebrow}
          title={copy.hero.title}
          blurb={copy.hero.blurb}
          coverage={coverageLine}
          pickupHours={pickupHoursLocalized}
          capabilityMetrics={capabilityMetrics}
          ctas={[
            { href: "/book", label: copy.hero.bookCta, variant: "primary" },
            { href: "/quote", label: copy.hero.quoteCta, variant: "secondary" },
            { href: "/track", label: copy.hero.trackCta, variant: "ghost" },
          ]}
        />

        <PortalSection
          id="log-pf-why"
          kicker={copy.why.kicker}
          title={copy.why.title}
        >
          <div className="log-pf__section-grid">
            <p className="log-pf__section-body">{copy.why.body}</p>
            <PortalDividedList items={trustItems} />
          </div>
        </PortalSection>

        <PortalSection
          id="log-pf-lanes"
          kicker={copy.lanes.kicker}
          title={copy.lanes.title}
          meta={applyTemplate(copy.lanes.metaTiersLabel, {
            count: String(services.length),
          })}
        >
          <PortalLaneGrid lanes={laneCards} locale={locale} />
        </PortalSection>

        <PortalSection
          id="log-pf-flow"
          kicker={copy.flow.kicker}
          title={copy.flow.title}
        >
          <PortalDividedList items={processItems} />
        </PortalSection>

        <PublicSpotlight
          tone="contrast"
          eyebrow={copy.spotlight.eyebrow}
          title={copy.spotlight.title}
          body={copy.spotlight.body}
          aside={
            <ul className="space-y-4">
              <li className="border-l border-[color:var(--home-line)] pl-4">
                <p className="text-sm font-semibold text-[color:var(--home-ink)]">
                  {copy.spotlight.honestEtaTitle}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[color:var(--home-ink-70)]">
                  {copy.spotlight.honestEtaBody}
                </p>
              </li>
              <li className="border-l border-[color:var(--home-line)] pl-4">
                <p className="text-sm font-semibold text-[color:var(--home-ink)]">
                  {copy.spotlight.proofTitle}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[color:var(--home-ink-70)]">
                  {copy.spotlight.proofBody}
                </p>
              </li>
              <li className="border-l border-[color:var(--home-line)] pl-4">
                <p className="text-sm font-semibold text-[color:var(--home-ink)]">
                  {copy.spotlight.accountTitle}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[color:var(--home-ink-70)]">
                  {copy.spotlight.accountBody}
                </p>
              </li>
            </ul>
          }
        />

        <PortalSection
          id="log-pf-faq"
          kicker={copy.faq.kicker}
          title={copy.faq.title}
          meta={applyTemplate(copy.faq.metaContactPrefix, {
            brand: logistics.shortName,
          })}
        >
          <div className="log-pf__section-grid">
            <div>
              <p className="log-pf__section-body">{copy.faq.body}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  className="log-pf__cta log-pf__cta-secondary"
                  href={`mailto:${logistics.supportEmail}`}
                >
                  {applyTemplate(copy.faq.emailPrefix, { brand: logistics.shortName })}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
                <a
                  className="log-pf__cta log-pf__cta-ghost"
                  href={getAccountUrl("/logistics")}
                >
                  {copy.faq.accountCta}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
              </div>
            </div>
            <dl className="divide-y divide-[var(--logistics-line)] border-y border-[var(--logistics-line)]">
              {faqEntries.map((faq) => (
                <div key={faq.q} className="py-5">
                  <dt className="text-base font-semibold tracking-tight text-[color:var(--home-ink)]">
                    {faq.q}
                  </dt>
                  <dd className="mt-2 max-w-2xl text-sm leading-7 text-[var(--logistics-muted)]">
                    {faq.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </PortalSection>
      </div>
    </main>
  );
}
