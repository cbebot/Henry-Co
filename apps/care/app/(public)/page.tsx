import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  PhoneCall,
  Repeat,
  ShieldCheck,
  Star,
} from "lucide-react";
import { getDivisionConfig } from "@henryco/config";
import { resolveLocalizedDynamicField, translateSurfaceLabel } from "@henryco/i18n/server";
import { PublicSpotlight } from "@henryco/ui/public-shell";

import CareFlow from "@/components/care/CareFlow";
import {
  getApprovedReviews,
  getCareBookingCatalog,
  getCarePricing,
  getCareSettings,
} from "@/lib/care-data";
import { getCarePublicChipUser } from "@/lib/care-public-viewer";
import { getCarePublicLocale } from "@/lib/locale-server";
import { CARE_ACCENT, CARE_ACCENT_SECONDARY } from "@/lib/care-theme";

export const revalidate = 60;

const care = getDivisionConfig("care");
const HERO_TITLE_FALLBACKS: Partial<Record<string, string>> = {
  fr: "Un service de confiance pour les vetements, les maisons et les lieux de travail.",
  es: "Cuida prendas, hogares y espacios de trabajo con un solo equipo de servicio de confianza.",
  pt: "Cuide de roupas, casas e locais de trabalho com uma unica equipa de servico de confianca.",
  ar: "اعتنِ بالملابس والمنازل وأماكن العمل مع فريق خدمة موثوق واحد.",
  de: "Pflege fuer Kleidung, Zuhause und Arbeitsorte mit einem einzigen verlaesslichen Serviceteam.",
  it: "Cura capi, case e luoghi di lavoro con un solo team di servizio affidabile.",
};

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

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

function formatMoney(value: number | string) {
  return nairaFormatter.format(Number(value || 0));
}

function stars(count: number) {
  return Array.from({ length: Math.max(0, Math.min(5, Number(count) || 0)) });
}

export default async function CareHomePage() {
  const [locale, settings, pricing, reviews, catalog, chipUser] = await Promise.all([
    getCarePublicLocale(),
    getCareSettings(),
    getCarePricing(),
    getApprovedReviews(6),
    getCareBookingCatalog(),
    getCarePublicChipUser(),
  ]);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const [heroBadge, heroTitle, heroSubtitle] = await Promise.all([
    resolveLocalizedDynamicField({
      record: settings as unknown as Record<string, unknown>,
      field: "hero_badge",
      locale,
      fallback: t("Garment care, home cleaning, and office cleaning"),
      machineTranslate: locale !== "en",
    }),
    resolveLocalizedDynamicField({
      record: settings as unknown as Record<string, unknown>,
      field: "hero_title",
      locale,
      fallback:
        HERO_TITLE_FALLBACKS[locale] ||
        t("Care for garments, homes, and workplaces with one trusted service team."),
      machineTranslate: locale !== "en",
    }),
    resolveLocalizedDynamicField({
      record: settings as unknown as Record<string, unknown>,
      field: "hero_subtitle",
      locale,
      fallback: t(
        "Book garment pickup and return delivery, recurring home cleaning, or office cleaning through one calmer service flow with clear timing, payment follow-up, and live updates.",
      ),
      machineTranslate: locale !== "en",
    }),
  ]);

  const careHeroFirstName = chipUser
    ? chipUser.displayName.trim().split(/\s+/)[0] || null
    : null;

  const featuredPricing = pricing.filter((item) => item.is_featured).slice(0, 4);
  const garmentPreview = featuredPricing.length > 0 ? featuredPricing : pricing.slice(0, 4);
  const homePackages = catalog.packages.filter((item) => item.category_key === "home").slice(0, 2);
  const officePackages = catalog.packages.filter((item) => item.category_key === "office").slice(0, 2);
  const supportEmail = settings.support_email || care.supportEmail;
  const supportPhone = settings.support_phone || care.supportPhone;
  const heroImageUrl = settings.hero_image_url?.trim() || null;
  const hasReviews = reviews.length > 0;

  const clientProfiles = [
    {
      icon: CheckCircle2,
      title: t("Private households"),
      body: t(
        "Recurring home care, one-off intensive cleans, and wardrobe support from one calmer account experience.",
      ),
    },
    {
      icon: Repeat,
      title: t("Managed estates"),
      body: t(
        "Saved schedules, property notes, and steady follow-through for estates, apartments, and multi-unit residences.",
      ),
    },
    {
      icon: Building2,
      title: t("Commercial operators"),
      body: t(
        "Routine office cleaning with dependable scheduling, clear communication, and accountability from visit to sign-off.",
      ),
    },
  ] as const;

  const serviceJourneys = [
    {
      title: t("Garments end in delivery"),
      body: t(
        "Garment care moves through pickup, treatment, finishing, packing, and return delivery back to you.",
      ),
    },
    {
      title: t("Homes end in completion quality"),
      body: t(
        "Home cleaning is centred on arrival timing, on-site work, final checks, and a result you can walk back into confidently.",
      ),
    },
    {
      title: t("Offices end in sign-off"),
      body: t(
        "Office cleaning is built around schedule readiness, site access, completed tasks, and a confident final handover.",
      ),
    },
  ] as const;

  return (
    <main
      className="overflow-hidden bg-transparent pb-24"
      style={
        {
          "--accent": CARE_ACCENT,
          "--accent-secondary": CARE_ACCENT_SECONDARY,
        } as CSSProperties
      }
    >
      {/* Premium editorial hero — no oversized rounded panel. Hairline brand
          rule, tight typography, real photo (when configured) breathing in
          the asymmetric grid. Three concierge-style service paths sit just
          below the headline so visitors land knowing what to do. */}
      <section className="relative mx-auto max-w-[92rem] px-5 pt-8 sm:px-8 sm:pt-12 lg:px-10 lg:pt-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-px max-w-[92rem] bg-gradient-to-r from-transparent via-[color:var(--accent)]/45 to-transparent"
        />

        {/* Top trust strip — 3 micro signals + the always-available track link.
            Sets the operating-company tone before the headline lands. */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-white/60">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="inline-flex items-center gap-1.5 text-[color:var(--accent)]">
              <ShieldCheck className="h-3.5 w-3.5" />
              {heroBadge}
            </span>
            <span aria-hidden className="hidden h-1 w-1 rounded-full bg-white/15 sm:inline-block" />
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/85" />
              {settings.pickup_hours || t("Mon – Sat • 8:00 AM to 7:00 PM")}
            </span>
            <span aria-hidden className="hidden h-1 w-1 rounded-full bg-white/15 sm:inline-block" />
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-[color:var(--accent)]" />
              {t("Reviewed by clients across homes, offices, and wardrobes")}
            </span>
          </div>
          <Link
            href="/track"
            className="inline-flex items-center gap-1.5 text-white/70 transition hover:text-white"
          >
            {t("Track a booking")}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            {chipUser ? (
              <p className="text-sm font-semibold tracking-tight text-white/72">
                {t("Welcome back")}
                {careHeroFirstName ? `, ${careHeroFirstName}` : ""}.{" "}
                <Link
                  href="/track"
                  className="text-[color:var(--accent)] underline-offset-4 transition hover:underline"
                >
                  {t("Continue tracking your last request")}
                </Link>
              </p>
            ) : null}

            <h1
              className={`max-w-3xl text-balance care-display text-white ${chipUser ? "mt-5" : ""}`}
            >
              {heroTitle}
            </h1>

            <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-white/72 sm:text-lg">
              {heroSubtitle}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/book"
                className="care-button-primary inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071020] active:translate-y-[0.5px]"
              >
                {t("Book a service")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-transparent px-6 py-3.5 text-sm font-semibold text-white transition outline-none hover:border-white/30 hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071020] active:translate-y-[0.5px]"
              >
                {t("Review pricing")}
              </Link>
            </div>

            {/* Three concierge service paths — clear next step for every
                kind of visitor. Each lands directly in the booking flow with
                the right service preselected. */}
            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              {[
                {
                  href: "/book?service=garments",
                  eyebrow: t("Garments"),
                  title: t("Pickup, treatment, and return delivery."),
                },
                {
                  href: "/book?service=home",
                  eyebrow: t("Homes"),
                  title: t("Move-out, deep, and recurring home care."),
                },
                {
                  href: "/book?service=office",
                  eyebrow: t("Offices"),
                  title: t("After-hours and recurring workplace cleaning."),
                },
              ].map((path) => (
                <Link
                  key={path.href}
                  href={path.href}
                  className="group flex flex-col justify-between rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4 transition outline-none hover:border-[color:var(--accent)]/40 hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071020] active:translate-y-[0.5px] sm:p-5"
                >
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">
                      {path.eyebrow}
                    </p>
                    <p className="mt-2 text-[15px] font-semibold leading-snug tracking-[-0.005em] text-white">
                      {path.title}
                    </p>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/65 transition group-hover:text-white">
                    {t("Start booking")}
                    <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Aside — when imagery configured, full-bleed photographic spread
              with a single editorial caption. When not configured, a calm
              service-desk dial: hours + line, no card-on-card chrome. */}
          <aside>
            {heroImageUrl ? (
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07111f] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)]">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${heroImageUrl})` }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.06)_0%,rgba(7,17,31,0.20)_55%,rgba(7,17,31,0.85)_100%)]" />
                <div className="relative flex min-h-[22rem] flex-col justify-end p-6 sm:p-8">
                  <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/85 backdrop-blur-sm">
                    <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--accent)]" />
                    {t("Signature service")}
                  </div>
                  <p className="mt-4 max-w-md text-[1.5rem] font-semibold leading-[1.12] tracking-[-0.015em] text-white sm:text-[1.85rem]">
                    {t("Hand off the work — see it move, finish, and come back to you.")}
                  </p>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-white/72">
                    {t("Every booking gets one tracking code, one calm service flow, and a real human on the line if the day asks for it.")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 self-end">
                <div className="flex items-center gap-3 rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 text-[color:var(--accent)]">
                    <Clock3 className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-white/55">
                      {t("Service hours")}
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-white">
                      {settings.pickup_hours || "Mon – Sat • 8:00 AM to 7:00 PM"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 text-[color:var(--accent)]">
                    <PhoneCall className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-white/55">
                      {t("Talk to the desk")}
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-white">
                      {supportPhone || supportEmail || "care@henrycogroup.com"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 text-[color:var(--accent)]">
                    <Repeat className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-white/55">
                      {t("Recurring care")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {t("Saved schedules, fewer reminders, steady follow-through.")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* Editorial "what happens next" rail — sets expectations before the
            visitor scrolls into product detail. Three steps, hairline only. */}
        <div className="mt-12 grid gap-6 border-y border-white/10 py-6 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: t("Tell us what you need"),
              body: t("Pick a service, add the details, and review the current estimate."),
            },
            {
              step: "02",
              title: t("Receive one tracking code"),
              body: t("One code per request keeps pickup, treatment, and delivery visible."),
            },
            {
              step: "03",
              title: t("Finish on the right note"),
              body: t("Garments come back to you. Homes and offices end in completed work."),
            },
          ].map((item, index) => (
            <div
              key={item.step}
              className={index > 0 ? "sm:border-l sm:border-white/10 sm:pl-6" : ""}
            >
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">
                {t("Step")} {item.step}
              </p>
              <p className="mt-3 text-base font-semibold tracking-[-0.005em] text-white">
                {item.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-white/68">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CareFlow — real product, kept untouched */}
      <section id="services" className="mx-auto mt-16 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <CareFlow />
      </section>

      {/* Service journeys + Client profiles — editorial 2-col split, divided lists, no inner panels */}
      <section className="mx-auto mt-20 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-12 xl:grid-cols-[0.9fr,1.1fr]">
          <div>
            <p className="care-kicker">{t("Service journeys")}</p>
            <h2 className="mt-4 max-w-md text-balance care-section-title text-zinc-950 dark:text-white">
              {t("Service timelines that match the work being done.")}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-zinc-600 dark:text-white/72">
              {t(
                "A garment order should feel different from a home clean or an office visit. HenryCo Care keeps each service clear so customers always understand what stage comes next.",
              )}
            </p>
            <ul className="mt-7 divide-y divide-black/10 border-y border-black/10 dark:divide-white/10 dark:border-white/10">
              {serviceJourneys.map((item) => (
                <li key={item.title} className="py-5">
                  <h3 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-white/68">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="care-kicker">{t("Who Care fits")}</p>
            <h2 className="mt-4 max-w-md text-balance care-section-title text-zinc-950 dark:text-white">
              {t("Three audiences. One operating standard.")}
            </h2>
            <ul className="mt-7 grid gap-8 sm:grid-cols-3 sm:divide-x sm:divide-black/10 dark:sm:divide-white/10">
              {clientProfiles.map((item, i) => {
                const Icon = item.icon;
                return (
                  <li key={item.title} className={i > 0 ? "sm:pl-6" : ""}>
                    <Icon className="h-5 w-5 text-[color:var(--accent)]" aria-hidden />
                    <h3 className="mt-4 text-base font-semibold tracking-tight text-zinc-950 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/68">
                      {item.body}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* Residential + Commercial packages — kept as 2-col, but flatter chrome */}
      <section id="pickup" className="mx-auto mt-20 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="care-card rounded-[2.2rem] p-7 sm:p-8">
            <p className="care-kicker">{t("Residential care")}</p>
            <h2 className="mt-3 care-section-title text-zinc-950 dark:text-white">
              {t("Home care planned around your property and your schedule.")}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-600 dark:text-white/68">
              {t(
                "Move from a one-time clean into recurring home care without losing clarity around scope, timing, staffing, or access notes.",
              )}
            </p>
            <div className="mt-6 grid gap-4">
              {homePackages.map((item) => (
                <PackageCard
                  key={item.id}
                  title={item.name}
                  body={item.summary}
                  value={formatMoney(item.base_price)}
                  meta={item.default_frequency.replaceAll("_", " ")}
                />
              ))}
            </div>
          </div>

          <div className="care-card rounded-[2.2rem] p-7 sm:p-8">
            <p className="care-kicker">{t("Commercial coverage")}</p>
            <h2 className="mt-3 care-section-title text-zinc-950 dark:text-white">
              {t("Office cleaning built for reliable business continuity.")}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-600 dark:text-white/68">
              {t(
                "After-hours cleaning, site access coordination, and recurring workplace care are handled with the same reliability clients expect from any serious service partner.",
              )}
            </p>
            <div className="mt-6 grid gap-4">
              {officePackages.map((item) => (
                <PackageCard
                  key={item.id}
                  title={item.name}
                  body={item.summary}
                  value={formatMoney(item.base_price)}
                  meta={`${item.staff_count} staff`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing + Reviews — editorial 2-col, divided pricing rows, divided reviews */}
      <section id="pricing" className="mx-auto mt-20 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-12 xl:grid-cols-[1.05fr,0.95fr]">
          <div>
            <p className="care-kicker">{t("Current garment pricing")}</p>
            <h2 className="mt-4 max-w-md text-balance care-section-title text-zinc-950 dark:text-white">
              {t("Garment pricing stays transparent and current.")}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-600 dark:text-white/68">
              {t(
                "Dry cleaning, laundry, pressing, and treatment prices stay clear before you book, so the estimate you review feels grounded and believable.",
              )}
            </p>
            <ul className="mt-7 divide-y divide-black/10 border-y border-black/10 dark:divide-white/10 dark:border-white/10">
              {garmentPreview.map((item) => (
                <li key={item.id} className="flex items-baseline justify-between gap-6 py-4">
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-white/45">
                      {item.category}
                    </p>
                    <p className="mt-1 text-base font-semibold tracking-tight text-zinc-950 dark:text-white">
                      {item.item_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[1.5rem] font-semibold leading-tight tracking-tight text-[color:var(--accent)]">
                      {formatMoney(item.price)}
                    </p>
                    <p className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-white/45">
                      /{item.unit}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="care-kicker">
              {hasReviews ? t("Client reviews") : t("Service trust")}
            </p>
            <h2 className="mt-4 max-w-md text-balance care-section-title text-zinc-950 dark:text-white">
              {hasReviews
                ? t("Real feedback from clients who have experienced the service.")
                : t("Trust signals that make the service feel credible before the first booking.")}
            </h2>
            <div className="mt-7">
              {hasReviews ? (
                <ul className="divide-y divide-black/10 border-y border-black/10 dark:divide-white/10 dark:border-white/10">
                  {reviews.slice(0, 3).map((review) => (
                    <li key={review.id} className="py-5">
                      <div className="flex items-center gap-1 text-[color:var(--accent)]">
                        {stars(review.rating).map((_, index) => (
                          <Star key={index} className="h-3.5 w-3.5 fill-current" />
                        ))}
                      </div>
                      <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-white/72">
                        “{review.review_text}”
                      </p>
                      {review.photo_url ? (
                        <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-black/10 dark:border-white/10">
                          <Image
                            src={review.photo_url}
                            alt={`Review image from ${review.customer_name}`}
                            width={960}
                            height={704}
                            unoptimized
                            className="h-44 w-full object-cover"
                          />
                        </div>
                      ) : null}
                      <p className="mt-3 text-sm font-semibold text-zinc-950 dark:text-white">
                        {review.customer_name}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="border-l-2 border-[color:var(--accent)]/55 pl-5">
                  <p className="text-[1.15rem] font-semibold leading-snug tracking-tight text-zinc-950 dark:text-white">
                    {t("Clear pricing, tracked handoffs, and direct support stay visible from the start.")}
                  </p>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-600 dark:text-white/68">
                    {t(
                      "HenryCo Care shows the service path, pickup logic, and support channels up front so customers do not have to guess what happens after they book.",
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Closing band — Spotlight contrast, no panel-on-panel */}
      <section className="mx-auto mt-20 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <PublicSpotlight
          tone="contrast"
          eyebrow={t("Ready when you are")}
          title={t("Book with clarity, then follow the service with confidence.")}
          body={t(
            "From pickup windows to on-site visits and return delivery, HenryCo Care keeps every service update visible enough that you are not left guessing.",
          )}
          aside={
            <div className="flex flex-col gap-3">
              <Link
                href="/book"
                className="care-button-primary inline-flex items-center justify-between gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
              >
                {t("Plan service")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-between gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/[0.04]"
              >
                {t("Explore service families")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          }
        />
      </section>
    </main>
  );
}

function PackageCard({
  title,
  body,
  value,
  meta,
}: {
  title: string;
  body: string;
  value: string;
  meta: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-black/10 bg-black/[0.02] p-5 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-white">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/68">{body}</p>
        </div>
        <div className="text-right">
          <p className="text-[1.4rem] font-semibold leading-tight tracking-tight text-[color:var(--accent)]">
            {value}
          </p>
          <p className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-white/45">
            {meta}
          </p>
        </div>
      </div>
    </div>
  );
}
