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
import { PublicSpotlight } from "@henryco/ui/public-shell";
import { getPublicLogisticsSnapshot } from "@/lib/logistics/data";
import { LOGISTICS_FAQS } from "@/lib/logistics/content";
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

export default async function LogisticsHomePage() {
  const logistics = getDivisionConfig("logistics");
  const snapshot = await getPublicLogisticsSnapshot();

  /*
   * Capability evidence — V3 PASS 21 / Wave B3 editorial bar.
   *
   * Pulls real numbers from the snapshot so the hero proves capacity
   * before headline copy proves anything. Every metric carries a trend
   * (anti-pattern #18 enforced at the type level).
   */
  const activeZones = snapshot.zones.filter((zone) => zone.active);
  const zoneNames = Array.from(
    new Set(activeZones.map((zone) => zone.name.trim()).filter(Boolean))
  );
  const coverageLine = zoneNames.length
    ? `Live in ${
        zoneNames.length === 1
          ? zoneNames[0]
          : zoneNames.length === 2
            ? `${zoneNames[0]} and ${zoneNames[1]}`
            : `${zoneNames.slice(0, -1).join(", ")}, and ${zoneNames.at(-1)}`
      }`
    : null;
  const services = snapshot.services;
  const fastestEtaZone = activeZones.reduce<{ low: number; high: number } | null>(
    (acc, zone) => {
      if (!Number.isFinite(zone.etaHoursMin) || !Number.isFinite(zone.etaHoursMax)) return acc;
      if (!acc) return { low: zone.etaHoursMin, high: zone.etaHoursMax };
      return zone.etaHoursMin < acc.low ? { low: zone.etaHoursMin, high: zone.etaHoursMax } : acc;
    },
    null,
  );

  const capabilityMetrics: PortalCapabilityMetric[] = [
    {
      label: "Active lanes",
      value: String(activeZones.length || 0),
      trend:
        activeZones.length === 0
          ? "Awaiting first lane"
          : zoneNames.length === activeZones.length
            ? `Across ${zoneNames.length} ${zoneNames.length === 1 ? "zone" : "zones"}`
            : `${zoneNames.length} named today`,
      trendDirection: "pos",
      pulse: activeZones.length > 0,
      emphasis: true,
    },
    {
      label: "Service tiers",
      value: String(services.length),
      trend: "Same-day, scheduled, dispatch, inter-city",
    },
    {
      label: "Fastest window",
      value: fastestEtaZone ? `${fastestEtaZone.low}–${fastestEtaZone.high}h` : "—",
      trend: fastestEtaZone ? "Governed by lane confidence" : "Awaiting zone activation",
    },
    {
      label: "Operating hours",
      value: snapshot.settings.pickupHours.includes("•")
        ? (snapshot.settings.pickupHours.split("•")[1]?.trim() ?? snapshot.settings.pickupHours)
        : snapshot.settings.pickupHours,
      trend: snapshot.settings.pickupHours.includes("•")
        ? (snapshot.settings.pickupHours.split("•")[0]?.trim() ?? "Daily")
        : "Daily",
    },
  ];

  const trustItems: PortalDividedListItem[] = [
    {
      icon: MapPin,
      title: "Who it is for",
      body: "Retail replenishment, founder-led brands, professional services, and HenryCo divisions that need predictable pickup and delivery at scale.",
    },
    {
      icon: Radio,
      title: "How tracking works",
      body: snapshot.settings.trackingLookupHelp,
    },
    {
      icon: Shield,
      title: "Proof and accountability",
      body: "Milestones write to an immutable event log. Proof-of-delivery is part of the product, not an afterthought.",
    },
  ];

  const laneCards: PortalLaneCard[] = services.slice(0, 4).map((service) => ({
    badge: service.badge,
    title: service.name,
    body: service.summary,
    promise: service.promise,
    href: "/services",
  }));

  const processItems: PortalDividedListItem[] = [
    {
      icon: ClipboardCheck,
      title: "Submit a quote or booking",
      body: "Two addresses, a parcel profile, and a service tier. Governed pricing returns inline before you commit.",
      status: { label: "Step 01", tone: "active" },
    },
    {
      icon: TruckIcon,
      title: "Dispatch assigns the lane",
      body: "Routing assigns within the operating window; pickup milestone writes live to your timeline.",
      status: { label: "Step 02", tone: "neutral" },
    },
    {
      icon: Clock3,
      title: "Live milestones, both sides",
      body: "Sender and recipient see the same events. Updates land via your HenryCo account thread.",
      status: { label: "Step 03", tone: "neutral" },
    },
    {
      icon: CheckCircle2,
      title: "Proof of delivery, captured",
      body: "Recipient name, time, and capture method save to the shipment record — visible on the track page.",
      status: { label: "Step 04", tone: "good" },
    },
  ];

  return (
    <main id="henryco-main" tabIndex={-1} className="px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[92rem] log-pf">
        <PortalHero
          eyebrow="Pickup · Dispatch · Proof"
          title="Calm last-mile, visible end to end."
          blurb="Built for people and businesses that need honest ETAs, clean handoffs, and a customer experience that stays premium when operations get noisy."
          coverage={coverageLine}
          pickupHours={snapshot.settings.pickupHours}
          capabilityMetrics={capabilityMetrics}
          ctas={[
            { href: "/book", label: "Book a delivery", variant: "primary" },
            { href: "/quote", label: "Request a quote", variant: "secondary" },
            { href: "/track", label: "Track a shipment", variant: "ghost" },
          ]}
        />

        <PortalSection
          id="log-pf-why"
          kicker="Why teams switch"
          title="One operating model. Honest by design."
        >
          <div className="log-pf__section-grid">
            <p className="log-pf__section-body">
              Governed rate cards, immutable milestones, and one shared account remove the
              operational debt that quietly erodes premium experiences. Same dispatcher logic
              for same-day, scheduled, dispatch, and inter-city — same calm proof trail.
            </p>
            <PortalDividedList items={trustItems} />
          </div>
        </PortalSection>

        <PortalSection
          id="log-pf-lanes"
          kicker="Operating lanes"
          title="Four lane shapes. One promise discipline."
          meta={`${services.length} tiers · governed pricing`}
        >
          <PortalLaneGrid lanes={laneCards} />
        </PortalSection>

        <PortalSection
          id="log-pf-flow"
          kicker="From request to doorstep"
          title="Every step is visible, every milestone is timestamped."
        >
          <PortalDividedList items={processItems} />
        </PortalSection>

        <PublicSpotlight
          tone="contrast"
          eyebrow="The HenryCo posture"
          title="Operations stay calm because the platform makes it cheaper to do the right thing."
          body="Governed rate cards, immutable milestones, and one shared account remove the operational debt that quietly erodes premium experiences."
          aside={
            <ul className="space-y-4">
              <li className="border-l border-white/15 pl-4">
                <p className="text-sm font-semibold text-white">Honest ETAs</p>
                <p className="mt-1 text-sm leading-relaxed text-white/72">
                  Promise windows come from real lane data, not optimistic guesses. Slippage gets logged and explained.
                </p>
              </li>
              <li className="border-l border-white/15 pl-4">
                <p className="text-sm font-semibold text-white">Proof, not promises</p>
                <p className="mt-1 text-sm leading-relaxed text-white/72">
                  Every handoff writes to an immutable event log. Proof-of-delivery is a product feature, not a ticket attachment.
                </p>
              </li>
              <li className="border-l border-white/15 pl-4">
                <p className="text-sm font-semibold text-white">One account, one bill</p>
                <p className="mt-1 text-sm leading-relaxed text-white/72">
                  Customers reuse the HenryCo account they already trust. Operators reconcile in one place across every division.
                </p>
              </li>
            </ul>
          }
        />

        <PortalSection
          id="log-pf-faq"
          kicker="Questions before you book"
          title="The honest answers, before the order."
          meta={`Contact ${logistics.shortName}`}
        >
          <div className="log-pf__section-grid">
            <div>
              <p className="log-pf__section-body">
                If a lane, parcel profile, or contract pricing falls outside the FAQ, the
                business desk picks it up. Quotes that need a human are not a different product —
                they live on the same shipment record once they convert.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  className="log-pf__cta log-pf__cta-secondary"
                  href={`mailto:${logistics.supportEmail}`}
                >
                  Email {logistics.shortName}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
                <a
                  className="log-pf__cta log-pf__cta-ghost"
                  href={getAccountUrl("/logistics")}
                >
                  Open account hub
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
              </div>
            </div>
            <dl className="divide-y divide-[var(--logistics-line)] border-y border-[var(--logistics-line)]">
              {LOGISTICS_FAQS.map((faq) => (
                <div key={faq.q} className="py-5">
                  <dt className="text-base font-semibold tracking-tight text-white">
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
