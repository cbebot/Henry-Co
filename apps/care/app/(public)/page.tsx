import type { Metadata } from "next";
import {
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Phone,
  Shirt,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { BRAND_EMAILS, getDivisionConfig } from "@henryco/config";
import { translateSurfaceLabel } from "@henryco/i18n/server";

import {
  PortalCapabilityStrip,
  PortalDividedList,
  PortalHero,
  PortalLaneGrid,
  PortalSection,
  type PortalCapabilityMetric,
  type PortalDividedListItem,
  type PortalLaneCard,
} from "@/components/portal";
import "@/components/portal/styles.css";
import { getCarePublicSnapshot } from "@/lib/care-public-snapshot";
import { getCarePublicLocale } from "@/lib/locale-server";

export const revalidate = 60;

const care = getDivisionConfig("care");

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCarePublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  return {
    title: care.name,
    description: t(
      "Premium garment care, home cleaning, office cleaning, pickup, delivery, and recurring service from HenryCo Care.",
    ),
  };
}

export default async function CareHomePage() {
  const [locale, snapshot] = await Promise.all([
    getCarePublicLocale(),
    getCarePublicSnapshot(),
  ]);
  const t = (text: string) => translateSurfaceLabel(locale, text);

  const { settings, catalog, stats } = snapshot;
  const supportEmail = settings.support_email || care.supportEmail || BRAND_EMAILS.care;
  const supportPhone = settings.support_phone || care.supportPhone || null;
  const pickupHours = settings.pickup_hours?.trim() || t("Mon – Sat • 8:00 AM to 7:00 PM");

  /*
   * Capability evidence — V3 Wave B1 editorial bar.
   *
   * Each metric pulls a real number from the snapshot so the hero proves
   * service capacity before headline copy proves anything. Every metric
   * carries a trend (anti-pattern #18 enforced at the type level).
   */
  const capabilityMetrics: PortalCapabilityMetric[] = [
    {
      label: t("Active service lanes"),
      value: String(stats.activeLanes || 3),
      trend:
        stats.activeLanes > 0
          ? t("Wash & fold, dry clean, linen + home + office")
          : t("Three signature lanes ready"),
      trendDirection: "pos",
      pulse: stats.activeLanes > 0,
      emphasis: true,
    },
    {
      label: t("Pricing transparency"),
      value: String(stats.pricingRows || 0),
      trend:
        stats.pricingRows > 0
          ? t("Live rows, all reviewable before booking")
          : t("Published before you commit"),
    },
    {
      label: t("Pickup window"),
      value: pickupHours.includes("•")
        ? (pickupHours.split("•")[1]?.trim() ?? pickupHours)
        : pickupHours,
      trend: pickupHours.includes("•")
        ? (pickupHours.split("•")[0]?.trim() ?? t("Six days a week"))
        : t("Six days a week"),
    },
    {
      label: t("Coverage zones"),
      value: String(stats.zones || 0),
      trend:
        stats.zones > 0
          ? t("Active routing across served areas")
          : t("Citywide on request"),
    },
  ];

  /*
   * Lane cards — three signature service families. Care's lanes are NOT
   * 12 tiles. They are wash & fold, dry clean, linen — plus the two
   * cleaning surfaces — each with one promise statement.
   */
  const garmentCount = catalog.serviceTypes.filter(
    (s) => s.category_key === "garment" && s.is_active,
  ).length;
  const homePackages = catalog.packages.filter(
    (p) => p.category_key === "home" && p.is_active,
  );
  const officePackages = catalog.packages.filter(
    (p) => p.category_key === "office" && p.is_active,
  );

  const laneCards: PortalLaneCard[] = [
    {
      badge: t("Wardrobe"),
      title: t("Garments — pickup and return delivery"),
      body: t(
        "Dry cleaning, laundry, pressing, and treatments handled with one tracking code from pickup to return.",
      ),
      promise: t("Returned to you"),
      href: "/book?service=garments",
    },
    {
      badge: t("Residential"),
      title: t("Home cleaning — recurring or deep"),
      body: t(
        "Move-in, deep, and recurring home care planned around property and schedule, with completed sign-off on the way out.",
      ),
      promise: homePackages.length > 0 ? t("On-site completion") : t("On-site completion"),
      href: "/book?service=home",
    },
    {
      badge: t("Commercial"),
      title: t("Office cleaning — after-hours coverage"),
      body: t(
        "Reliable after-hours and recurring workplace cleaning with access coordination and clean sign-off.",
      ),
      promise: officePackages.length > 0 ? t("Sign-off, captured") : t("Sign-off, captured"),
      href: "/book?service=office",
    },
  ];

  /*
   * Process — hairline-divided steps, no card wall.
   */
  const processItems: PortalDividedListItem[] = [
    {
      icon: ClipboardCheck,
      title: t("Choose your service"),
      body: t(
        "Garment pickup, home cleaning, or office cleaning. The form keeps the request small and clear before you submit.",
      ),
      status: { label: t("Step 01"), tone: "active" },
    },
    {
      icon: Calendar,
      title: t("Add the details"),
      body: t(
        "Address, schedule windows, access notes, and anything that affects delivery or on-site completion.",
      ),
      status: { label: t("Step 02"), tone: "neutral" },
    },
    {
      icon: Truck,
      title: t("Receive a tracking code"),
      body: t(
        "Garments move through pickup, treatment, finishing, and return. Cleaning visits move through arrival, work, and sign-off.",
      ),
      status: { label: t("Step 03"), tone: "neutral" },
    },
    {
      icon: CheckCircle2,
      title: t("Finish on the right note"),
      body: t(
        "Garments come back to you. Homes and offices end in completed work with a captured sign-off on record.",
      ),
      status: { label: t("Step 04"), tone: "good" },
    },
  ];

  /*
   * Trust + contact rails — denser than a card wall.
   */
  const trustItems: PortalDividedListItem[] = [
    {
      icon: ShieldCheck,
      title: t("Pricing reviewed before booking"),
      body: t(
        "Dry-clean, laundry, pressing, and treatment prices stay visible up front so the estimate you review feels grounded.",
      ),
    },
    {
      icon: Sparkles,
      title: t("Recurring care, steady follow-through"),
      body: t(
        "Saved schedules and property notes mean recurring cleaning does not start from scratch every week.",
      ),
    },
    {
      icon: Phone,
      title: t("A real human on the line"),
      body: t(
        "A direct support channel covers payment questions, schedule edits, and anything the form did not catch.",
      ),
    },
  ];

  const contactItems: PortalDividedListItem[] = [
    {
      icon: Clock3,
      title: t("Service hours"),
      body: pickupHours,
      status: { label: t("Live"), tone: "active" },
    },
    {
      icon: Phone,
      title: t("Talk to the desk"),
      body: supportPhone || supportEmail || BRAND_EMAILS.care,
      status: supportPhone
        ? { label: t("Phone"), tone: "good" }
        : { label: t("Email"), tone: "neutral" },
    },
    {
      icon: Shirt,
      title: t("Wardrobe pickup"),
      body: t(
        "Schedule a pickup window when you book — return delivery is part of the same tracking code.",
      ),
      status: { label: t("End-to-end"), tone: "neutral" },
    },
  ];

  const coverageLine =
    stats.zones > 0 ? t("Active across served service zones") : null;

  return (
    <main id="henryco-main" tabIndex={-1} className="px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[92rem] care-pf">
        <PortalHero
          eyebrow={t("Garments · Homes · Offices")}
          title={t("Calm service for what you wear and where you live.")}
          blurb={t(
            "One tracking code per request, one calm service flow, and a real human on the line whenever the day asks for it. Garments come back delivered. Homes and offices end in completed work.",
          )}
          coverage={coverageLine}
          pickupHours={pickupHours}
          capabilityMetrics={capabilityMetrics}
          ctas={[
            { href: "/book", label: t("Book a service"), variant: "primary" },
            { href: "/pricing", label: t("Review pricing"), variant: "secondary" },
            { href: "/track", label: t("Track a booking"), variant: "ghost" },
          ]}
        />

        <PortalSection
          id="care-pf-lanes"
          kicker={t("Premium care services")}
          title={t("Three signature lanes. One operating standard.")}
          meta={
            garmentCount > 0
              ? `${garmentCount} ${t("garment item types")} · ${stats.activeLanes} ${t("active packages")}`
              : `${stats.activeLanes} ${t("active packages")}`
          }
        >
          <PortalLaneGrid lanes={laneCards} />
        </PortalSection>

        <PortalSection
          id="care-pf-flow"
          kicker={t("How it works")}
          title={t("Every step is visible, every milestone is timestamped.")}
        >
          <PortalDividedList items={processItems} />
        </PortalSection>

        <PortalSection
          id="care-pf-trust"
          kicker={t("Why customers stay")}
          title={t("Service truth that earns the second booking.")}
        >
          <div className="care-pf__section-grid">
            <p className="care-pf__section-body">
              {t(
                "Pricing transparency, real human support, and saved schedules are the operating standard. Garments end in return delivery. Cleaning visits end in completed work — captured, not promised.",
              )}
            </p>
            <PortalDividedList items={trustItems} />
          </div>
        </PortalSection>

        <PortalSection
          id="care-pf-contact"
          kicker={t("Reach the desk")}
          title={t("Service hours, support channels, and pickup logistics.")}
          meta={
            stats.approvedReviews > 0
              ? `${stats.approvedReviews} ${t("approved reviews")}`
              : undefined
          }
        >
          <PortalDividedList items={contactItems} />
          <div className="care-pf__hero-ctas">
            <a className="care-pf__cta care-pf__cta-primary" href="/book">
              {t("Plan service")}
            </a>
            <a className="care-pf__cta care-pf__cta-secondary" href="/services">
              {t("Explore service families")}
            </a>
          </div>
        </PortalSection>
      </div>
    </main>
  );
}
