import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, PhoneCall, ShieldCheck, Star } from "lucide-react";
import { BRAND_EMAILS, getDivisionConfig } from "@henryco/config";
import { resolveLocalizedDynamicField, translateSurfaceLabel } from "@henryco/i18n/server";

import {
  getApprovedReviews,
  getCareBookingCatalog,
  getCarePricing,
  getCareSettings,
} from "@/lib/care-data";
import { getCarePublicChipUser } from "@/lib/care-public-viewer";
import { getCarePublicLocale } from "@/lib/locale-server";
import { CARE_ACCENT_SECONDARY } from "@/lib/care-theme";

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
      "Premium garment care, home cleaning, office cleaning, pickup, delivery, and recurring service from Henry Onyx Fabric Care.",
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

  // PASS — wrap Supabase row fields shown above the fold. List views
  // localize the title only and TODO their long-form copy.
  const garmentPreviewLocalized = await Promise.all(
    garmentPreview.map(async (item) => ({
      ...item,
      category: await resolveLocalizedDynamicField({
        record: item as unknown as Record<string, unknown>,
        field: "category",
        locale,
        fallback: item.category,
        machineTranslate: locale !== "en",
      }),
      item_name: await resolveLocalizedDynamicField({
        record: item as unknown as Record<string, unknown>,
        field: "item_name",
        locale,
        fallback: item.item_name,
        machineTranslate: locale !== "en",
      }),
      // TODO(list-row): localize `description` in detail surfaces.
    })),
  );
  const homePackagesLocalized = await Promise.all(
    homePackages.map(async (item) => ({
      ...item,
      name: await resolveLocalizedDynamicField({
        record: item as unknown as Record<string, unknown>,
        field: "name",
        locale,
        fallback: item.name,
        machineTranslate: locale !== "en",
      }),
      // TODO(list-row): localize package `summary` in detail surfaces.
    })),
  );
  const officePackagesLocalized = await Promise.all(
    officePackages.map(async (item) => ({
      ...item,
      name: await resolveLocalizedDynamicField({
        record: item as unknown as Record<string, unknown>,
        field: "name",
        locale,
        fallback: item.name,
        machineTranslate: locale !== "en",
      }),
      // TODO(list-row): localize package `summary` in detail surfaces.
    })),
  );
  const reviewsLocalized = await Promise.all(
    reviews.slice(0, 3).map(async (review) => ({
      ...review,
      review_text: await resolveLocalizedDynamicField({
        record: review as unknown as Record<string, unknown>,
        field: "review_text",
        locale,
        fallback: review.review_text,
        machineTranslate: locale !== "en",
      }),
      // customer_name and city are personal/PII — skip translation.
    })),
  );
  const supportEmail = settings.support_email || care.supportEmail;
  // NUMBER-PURGE (2026-07-11): the company phone is never rendered as text on a
  // public, crawlable surface — Google was still indexing it from the care
  // landing's "Talk to the desk" row. Email is the one visible contact; the
  // masked WhatsApp deep link lives on the contact page. support_phone is no
  // longer read here.
  const heroImageUrl = settings.hero_image_url?.trim() || null;
  const hasReviews = reviews.length > 0;

  return (
    <main
      id="henryco-main"
      tabIndex={-1}
      className="overflow-hidden bg-transparent pb-24"
      style={
        {
          "--accent-secondary": CARE_ACCENT_SECONDARY,
        } as CSSProperties
      }
    >
      {/* Editorial hero — theme-aware on the shared --home-* canvas (light-primary,
          flips to dark with the toggle), carrying care's cobalt soul through a
          color-mix aurora + ink-alpha hairline grid. No permanent-dark stage:
          the first impression rides the page like every shipped Henry Onyx site. */}
      <section className="relative isolate overflow-hidden border-b border-[color:var(--home-line)]">
        {/* Atmosphere — ink-alpha hairline grid + cobalt aurora. Decorative only;
            both read on warm paper AND near-black because they derive from tokens. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--home-line-08) 1px, transparent 1px), linear-gradient(to bottom, var(--home-line-08) 1px, transparent 1px)",
            backgroundSize: "34px 34px",
            maskImage: "radial-gradient(ellipse 78% 60% at 50% 0%, black, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 78% 60% at 50% 0%, black, transparent 80%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-[20%] top-[-18rem] -z-10 h-[34rem] w-[46rem] -translate-x-1/2 blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse at center, color-mix(in srgb, var(--home-accent) 20%, transparent), transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-[6%] top-[2rem] -z-10 h-[26rem] w-[34rem] blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse at center, color-mix(in srgb, var(--accent-secondary, #33d3c7) 12%, transparent), transparent 68%)",
          }}
        />
        <div className="relative mx-auto max-w-[92rem] px-5 pt-8 sm:px-8 sm:pt-12 lg:px-10 lg:pt-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-px max-w-[92rem] bg-gradient-to-r from-transparent via-[color:var(--home-accent)]/45 to-transparent"
          />

          {/* Top trust strip — 3 micro signals + the always-available track link.
              Sets the operating-company tone before the headline lands. */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--home-ink-60)]">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="inline-flex items-center gap-1.5 text-[color:var(--home-accent-text)]">
                <ShieldCheck className="h-3.5 w-3.5" />
                {heroBadge}
              </span>
              <span aria-hidden className="hidden h-1 w-1 rounded-full bg-[color:var(--home-line-15)] sm:inline-block" />
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500/85" />
                {settings.pickup_hours || t("8:00 AM – 6:00 PM")}
              </span>
            </div>
            <Link
              href="/track"
              className="inline-flex items-center gap-1.5 text-[color:var(--home-ink-65)] transition hover:text-[color:var(--home-ink)]"
            >
              {t("Track a booking")}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              {chipUser ? (
                <p className="text-sm font-semibold tracking-tight text-[color:var(--home-ink-70)]">
                  {t("Welcome back")}
                  {careHeroFirstName ? `, ${careHeroFirstName}` : ""}.{" "}
                  <Link
                    href="/track"
                    className="text-[color:var(--home-accent-text)] underline-offset-4 transition hover:underline"
                  >
                    {t("Continue tracking your last request")}
                  </Link>
                </p>
              ) : null}

              <h1
                className={`max-w-3xl text-balance care-display text-[color:var(--home-ink)] ${chipUser ? "mt-5" : ""}`}
              >
                {heroTitle}
              </h1>

              <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[color:var(--home-ink-70)] sm:text-lg">
                {heroSubtitle}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/book"
                  className="care-button-primary inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--home-accent)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--home-canvas)] active:translate-y-[0.5px]"
                >
                  {t("Book a service")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-3 rounded-full border border-[color:var(--home-line)] bg-[color:var(--home-surface-02)] px-6 py-3.5 text-sm font-semibold text-[color:var(--home-ink)] transition outline-none hover:border-[color:var(--home-line-15)] hover:bg-[color:var(--home-surface-04)] focus-visible:ring-2 focus-visible:ring-[color:var(--home-accent)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--home-canvas)] active:translate-y-[0.5px]"
                >
                  {t("Review pricing")}
                </Link>
              </div>

              {/* Three concierge service paths — clear next step for every kind of
                  visitor. Hover lift is scoped to fine pointers so touch devices
                  never see a stuck-hover state. Each card lands directly in the
                  booking flow with the right service preselected. */}
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
                    aria-label={`${path.eyebrow}: ${path.title}`}
                    className="group flex flex-col justify-between gap-4 rounded-2xl border border-[color:var(--home-line)] bg-[color:var(--home-surface-02)] p-4 outline-none transition hover:border-[color:var(--home-accent)] hover:bg-[color:var(--home-surface-04)] focus-visible:ring-2 focus-visible:ring-[color:var(--home-accent)]/45 active:translate-y-[0.5px] [@media(hover:hover)]:hover:-translate-y-0.5"
                  >
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--home-accent-text)]">
                        {path.eyebrow}
                      </p>
                      <p className="mt-2 text-[15px] font-semibold leading-snug tracking-[-0.005em] text-[color:var(--home-ink)]">
                        {path.title}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--home-ink-60)] transition [@media(hover:hover)]:group-hover:text-[color:var(--home-ink)]">
                      {t("Start booking")}
                      <ArrowRight className="h-3 w-3 transition [@media(hover:hover)]:group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Aside — when imagery is configured, a full-bleed photographic spread
                with a single editorial caption (white ink sits on the photo, not the
                page). Otherwise a theme-aware service-desk dial (hours + phone +
                recurring care) on --home-* tokens that flips with the page. */}
            <aside>
              {heroImageUrl ? (
                <div className="relative overflow-hidden rounded-[2rem] border border-[color:var(--home-line)] bg-[color:var(--home-sheet)] shadow-[0_30px_80px_-40px_rgb(var(--home-ink-rgb)/0.45)]">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${heroImageUrl})` }}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.06)_0%,rgba(7,17,31,0.20)_55%,rgba(7,17,31,0.85)_100%)]" />
                  <div className="relative flex min-h-[22rem] flex-col justify-end p-6 sm:p-8">
                    <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/85 backdrop-blur-sm">
                      <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--home-accent)]" />
                      {t("Signature service")}
                    </div>
                    <p
                      className="mt-4 max-w-md text-balance font-semibold text-white"
                      style={{
                        fontSize: "clamp(1.4rem, 3.4vw + 0.5rem, 1.85rem)",
                        lineHeight: 1.12,
                        letterSpacing: "-0.015em",
                        overflowWrap: "break-word",
                        hyphens: "auto",
                      }}
                    >
                      {t("Hand it off. Watch it move, finish, and come back to you.")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-[2rem] border border-[color:var(--home-line)] bg-[color:var(--home-sheet)] p-6 shadow-[0_30px_80px_-45px_rgb(var(--home-ink-rgb)/0.32)] sm:p-8">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--home-accent-text)]">
                    {t("At your service")}
                  </p>
                  <p className="mt-3 max-w-sm text-balance care-section-title text-[1.5rem] leading-tight text-[color:var(--home-ink)]">
                    {t("Hand it off. We keep it moving.")}
                  </p>
                  <dl className="mt-6 divide-y divide-[color:var(--home-line)] border-y border-[color:var(--home-line)]">
                    {[
                      {
                        key: "hours",
                        icon: <Clock3 className="h-4 w-4" />,
                        label: t("Service hours"),
                        value: settings.pickup_hours || t("8:00 AM – 6:00 PM"),
                      },
                      {
                        key: "desk",
                        icon: <PhoneCall className="h-4 w-4" />,
                        label: t("Talk to the desk"),
                        value: supportEmail || BRAND_EMAILS.care,
                      },
                    ].map((row) => (
                      <div key={row.key} className="flex items-center gap-3 py-3.5">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--home-accent-soft)] text-[color:var(--home-accent-text)]">
                          {row.icon}
                        </span>
                        <div className="min-w-0">
                          <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--home-ink-50)]">
                            {row.label}
                          </dt>
                          <dd className="mt-0.5 truncate text-sm font-semibold text-[color:var(--home-ink)]">
                            {row.value}
                          </dd>
                        </div>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </aside>
          </div>

          {/* Editorial "what happens next" rail — sets expectations before the
              visitor scrolls into product detail. Three steps, hairline only. */}
          <div className="mt-12 grid gap-6 border-y border-[color:var(--home-line)] py-6 sm:grid-cols-3">
            {[
              { step: "01", title: t("Tell us what you need") },
              { step: "02", title: t("Receive one tracking code") },
              { step: "03", title: t("Finish on the right note") },
            ].map((item, index) => (
              <div
                key={item.step}
                className={index > 0 ? "sm:border-l sm:border-[color:var(--home-line)] sm:pl-6" : ""}
              >
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--home-accent-text)]">
                  {t("Step")} {item.step}
                </p>
                <p className="mt-3 text-base font-semibold tracking-[-0.005em] text-[color:var(--home-ink)]">
                  {item.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Residential + Commercial packages — kept as 2-col, but flatter chrome */}
      <section id="pickup" className="mx-auto mt-20 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="care-card rounded-[2.2rem] p-7 sm:p-8">
            <h2 className="care-section-title text-[color:var(--home-ink)]">
              {t("Home cleaning packages")}
            </h2>
            <div className="mt-6 grid gap-4">
              {homePackagesLocalized.map((item) => (
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
            <h2 className="care-section-title text-[color:var(--home-ink)]">
              {t("Office cleaning packages")}
            </h2>
            <div className="mt-6 grid gap-4">
              {officePackagesLocalized.map((item) => (
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
        <div className="grid gap-12 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h2 className="max-w-md text-balance care-section-title text-[color:var(--home-ink)]">
              {t("Current garment pricing")}
            </h2>
            <ul className="mt-7 divide-y divide-[color:var(--home-line)] border-y border-[color:var(--home-line)]">
              {garmentPreviewLocalized.map((item) => (
                <li key={item.id} className="flex items-baseline justify-between gap-6 py-4">
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--home-ink-50)]">
                      {item.category}
                    </p>
                    <p className="mt-1 text-base font-semibold tracking-tight text-[color:var(--home-ink)]">
                      {item.item_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[1.5rem] font-semibold leading-tight tracking-tight text-[color:var(--home-accent-text)]">
                      {formatMoney(item.price)}
                    </p>
                    <p className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[color:var(--home-ink-50)]">
                      /{item.unit}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {hasReviews ? (
            <div>
              <h2 className="max-w-md text-balance care-section-title text-[color:var(--home-ink)]">
                {t("Client reviews")}
              </h2>
              <ul className="mt-7 divide-y divide-[color:var(--home-line)] border-y border-[color:var(--home-line)]">
                {reviewsLocalized.map((review) => (
                  <li key={review.id} className="py-5">
                    <div className="flex items-center gap-1 text-[color:var(--home-accent-text)]">
                      {stars(review.rating).map((_, index) => (
                        <Star key={index} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--home-ink-70)]">
                      “{review.review_text}”
                    </p>
                    {review.photo_url ? (
                      <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-[color:var(--home-line)]">
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
                    <p className="mt-3 text-sm font-semibold text-[color:var(--home-ink)]">
                      {review.customer_name}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      {/* Closing band — Care-native cobalt CTA (theme-aware, no off-brand contrast tone) */}
      <section className="mx-auto mt-24 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <div
          className="relative overflow-hidden rounded-[2.4rem] border border-[color:var(--care-border)] px-6 py-12 sm:px-12 sm:py-16"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--accent) 9%, var(--home-sheet)) 0%, var(--home-sheet) 48%, color-mix(in srgb, var(--accent-secondary, #33d3c7) 9%, var(--home-sheet)) 100%)",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--accent) 24%, transparent), transparent 70%)",
            }}
          />
          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <h2 className="max-w-2xl text-balance care-section-title text-[color:var(--care-text)]">
                {t("Ready when you are")}
              </h2>
            </div>
            <div className="flex flex-col gap-3 lg:items-end">
              <Link
                href="/book"
                className="care-button-primary inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
              >
                {t("Plan service")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--care-border)] bg-[color:var(--home-surface-04)] px-6 py-3.5 text-sm font-semibold text-[color:var(--care-text)] transition hover:border-[color:var(--accent)] hover:bg-[color:var(--home-surface-07)]"
              >
                {t("Explore service families")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
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
    <div className="rounded-[1.4rem] border border-[color:var(--home-line)] bg-[color:var(--home-surface-02)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-tight text-[color:var(--home-ink)]">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-7 text-[color:var(--home-ink-70)]">{body}</p>
        </div>
        <div className="text-right">
          <p className="text-[1.4rem] font-semibold leading-tight tracking-tight text-[color:var(--home-accent-text)]">
            {value}
          </p>
          <p className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[color:var(--home-ink-50)]">
            {meta}
          </p>
        </div>
      </div>
    </div>
  );
}
