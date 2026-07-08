import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Clock3,
  Home,
  Mail,
  Package2,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { BRAND_EMAILS, getDivisionConfig } from "@henryco/config";
import { getCareAboutCopy, resolveLocalizedDynamicField } from "@henryco/i18n/server";
import { getCareBookingCatalog, getCareSettings } from "@/lib/care-data";
import { CARE_ACCENT, CARE_ACCENT_SECONDARY } from "@/lib/care-theme";
import { getCarePublicLocale } from "@/lib/locale-server";

const care = getDivisionConfig("care");

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCarePublicLocale();
  const copy = getCareAboutCopy(locale);
  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
  };
}

export default async function AboutPage() {
  const locale = await getCarePublicLocale();
  const copy = getCareAboutCopy(locale);

  const [settings, catalog] = await Promise.all([
    getCareSettings(),
    getCareBookingCatalog(),
  ]);

  const supportEmail = settings.support_email || care.supportEmail || BRAND_EMAILS.care;
  const supportPhone = settings.support_phone || care.supportPhone;
  const pickupHours = settings.pickup_hours || copy.heroFacts.pickupHoursFallback;
  const [heroTitle, heroBody] = await Promise.all([
    resolveLocalizedDynamicField({
      record: settings as unknown as Record<string, unknown>,
      field: "about_title",
      locale,
      fallback: copy.hero.title,
      machineTranslate: locale !== "en",
    }),
    resolveLocalizedDynamicField({
      record: settings as unknown as Record<string, unknown>,
      field: "about_body",
      locale,
      fallback: copy.hero.body,
      machineTranslate: locale !== "en",
    }),
  ]);

  const linesPackagesValue = copy.heroFacts.linesPackagesTemplate
    .replace("{lines}", String(catalog.serviceTypes.length))
    .replace("{packages}", String(catalog.packages.length));

  const heroFacts = [
    { icon: Clock3, label: copy.heroFacts.serviceHoursLabel, value: pickupHours },
    { icon: Mail, label: copy.heroFacts.careDeskLabel, value: supportEmail },
    {
      icon: Sparkles,
      label: copy.heroFacts.serviceOptionsLabel,
      value: linesPackagesValue,
    },
  ] as const;

  const lanes = [
    {
      icon: Package2,
      title: copy.lanes.garmentCare.title,
      body: copy.lanes.garmentCare.body,
    },
    {
      icon: Home,
      title: copy.lanes.homeCleaning.title,
      body: copy.lanes.homeCleaning.body,
    },
    {
      icon: Building2,
      title: copy.lanes.officeCleaning.title,
      body: copy.lanes.officeCleaning.body,
    },
  ] as const;

  const standards = copy.standards.bullets;

  const flow = copy.flow.steps.map((step, idx) => ({
    step: String(idx + 1).padStart(2, "0"),
    title: step.title,
    body: step.body,
  }));

  const reasons = [
    {
      icon: Truck,
      title: copy.reasons.pickupDelivery.title,
      body: copy.reasons.pickupDelivery.body,
    },
    {
      icon: ShieldCheck,
      title: copy.reasons.qualityStandards.title,
      body: copy.reasons.qualityStandards.body,
    },
    {
      icon: Sparkles,
      title: copy.reasons.convenience.title,
      body: copy.reasons.convenience.body,
    },
  ] as const;

  return (
    <main
      id="henryco-main"
      tabIndex={-1}
      className="px-4 pb-24 pt-10 sm:px-6 lg:px-10"
      style={
        {
          "--accent": CARE_ACCENT,
          "--accent-secondary": CARE_ACCENT_SECONDARY,
        } as CSSProperties
      }
    >
      <div className="mx-auto max-w-[92rem] space-y-16">
        <section>
          <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[color:var(--home-accent-text)]">
                <Sparkles className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />
                {copy.hero.eyebrow}
              </p>
              <h1 className="mt-5 max-w-3xl text-balance care-display text-[color:var(--home-ink)]">
                {heroTitle}
              </h1>
              {/* READING-02: hero body in the editorial serif reading face;
                  ink lifted 65 → 70 (serif reads lighter than sans). */}
              <p className="hc-font-reading mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[color:var(--home-ink-70)] sm:text-lg">
                {heroBody}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/book"
                  className="care-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
                >
                  {copy.hero.bookCta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--home-line)] px-6 py-3 text-sm font-semibold text-[color:var(--home-ink)] transition hover:border-[color:var(--accent)]/50"
                >
                  {copy.hero.contactCta}
                </Link>
              </div>
              {/* NUMBER-PURGE (owner 2026-07-08): the visible support number
               * is gone — contact routes are the CTA above and /contact. */}
            </div>
            <ul className="grid gap-3 text-sm">
              {heroFacts.map(({ icon: Icon, label, value }) => (
                <li
                  key={label}
                  className="flex items-baseline gap-3 border-b border-[color:var(--home-line)] py-3 last:border-b-0"
                >
                  <Icon className="h-3.5 w-3.5 text-[color:var(--home-accent-text)]" aria-hidden />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--home-ink-50)]">
                    {label}
                  </span>
                  <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[color:var(--home-ink)]">
                    {value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <ul className="grid gap-10 lg:grid-cols-3 lg:divide-x lg:divide-[color:var(--home-line)]">
            {lanes.map((item, i) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className={i > 0 ? "lg:pl-10" : ""}>
                  <Icon className="h-5 w-5 text-[color:var(--home-accent-text)]" aria-hidden />
                  <h3 className="mt-4 text-[1.2rem] font-semibold tracking-tight text-[color:var(--home-ink)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--home-ink-65)]">
                    {item.body}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <div className="grid gap-12 xl:grid-cols-2 xl:divide-x xl:divide-[color:var(--home-line)]">
            <div>
              <h2 className="text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[color:var(--home-ink)] sm:text-[1.85rem]">
                {copy.standards.title}
              </h2>
              <ul className="mt-6 divide-y divide-[color:var(--home-line)] border-y border-[color:var(--home-line)]">
                {standards.map((item) => (
                  <li key={item} className="flex gap-3 py-4">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--home-accent-text)]" />
                    <p className="text-sm leading-7 text-[color:var(--home-ink-65)]">{item}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="xl:pl-12">
              <h2 className="text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[color:var(--home-ink)] sm:text-[1.85rem]">
                {copy.flow.title}
              </h2>
              <ol className="mt-6 divide-y divide-[color:var(--home-line)] border-y border-[color:var(--home-line)]">
                {flow.map((item) => (
                  <li
                    key={item.step}
                    className="grid gap-3 py-4 sm:grid-cols-[auto,1fr] sm:gap-6"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--home-accent-text)]">
                      {copy.flow.stepLabel} {item.step}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold tracking-tight text-[color:var(--home-ink)]">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-[color:var(--home-ink-65)]">
                        {item.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section>
          <ul className="grid gap-10 lg:grid-cols-3 lg:divide-x lg:divide-[color:var(--home-line)]">
            {reasons.map((item, i) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className={i > 0 ? "lg:pl-10" : ""}>
                  <Icon className="h-5 w-5 text-[color:var(--home-accent-text)]" aria-hidden />
                  <h3 className="mt-4 text-[1.2rem] font-semibold tracking-tight text-[color:var(--home-ink)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--home-ink-65)]">
                    {item.body}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="border-t border-[color:var(--home-line)] pt-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--home-accent-text)]">
                {copy.closingCta.eyebrow}
              </p>
              <h2 className="mt-3 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[color:var(--home-ink)] sm:text-[1.85rem]">
                {copy.closingCta.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--home-ink-65)]">
                {copy.closingCta.body}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/book"
                className="care-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                {copy.closingCta.bookCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--home-line)] px-6 py-3 text-sm font-semibold text-[color:var(--home-ink)] transition hover:border-[color:var(--accent)]/50"
              >
                {copy.closingCta.exploreCta}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
