import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BadgeCheck, Clock, ShieldCheck, Tag } from "lucide-react";
import { getDivisionConfig } from "@henryco/config";
import { getServicesCopy, resolveLocalizedDynamicField } from "@henryco/i18n/server";
import { getCarePublicLocale } from "@/lib/locale-server";
import { getServicesCatalog } from "@/lib/care-data";
import { findServiceBySlug, findVerticalBySlug } from "@/lib/services-catalog";
import { formatServiceDuration, formatServicePrice } from "@/lib/services-format";
import { emitServiceViewed } from "@/lib/services-telemetry";
import { CARE_ACCENT, CARE_ACCENT_SECONDARY } from "@/lib/care-theme";

export const revalidate = 60;

const care = getDivisionConfig("care");

type RouteParams = { params: Promise<{ verticalSlug: string; serviceSlug: string }> };

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { verticalSlug, serviceSlug } = await params;
  const locale = await getCarePublicLocale();
  const copy = getServicesCopy(locale);
  const catalog = await getServicesCatalog();
  const service = findServiceBySlug(catalog, verticalSlug, serviceSlug);
  if (!service) {
    return { title: copy.directory.titleTemplate.replace("{division}", care.name) };
  }
  const name = await resolveLocalizedDynamicField({
    record: service as unknown as Record<string, unknown>,
    field: "name",
    locale,
    fallback: service.name,
    machineTranslate: locale !== "en",
  });
  return {
    title: copy.service.titleTemplate.replace("{service}", name).replace("{division}", care.name),
    description: service.summary,
    alternates: { canonical: `/services/${verticalSlug}/${serviceSlug}` },
  };
}

export default async function ServiceDetailPage({ params }: RouteParams) {
  const { verticalSlug, serviceSlug } = await params;
  const locale = await getCarePublicLocale();
  const copy = getServicesCopy(locale);
  const catalog = await getServicesCatalog();

  const service = findServiceBySlug(catalog, verticalSlug, serviceSlug);
  const vertical = findVerticalBySlug(catalog, verticalSlug);
  if (!service || !vertical) {
    notFound();
  }

  const [serviceName, serviceSummary, serviceDescription, verticalName] = await Promise.all([
    resolveLocalizedDynamicField({
      record: service as unknown as Record<string, unknown>,
      field: "name",
      locale,
      fallback: service.name,
      machineTranslate: locale !== "en",
    }),
    resolveLocalizedDynamicField({
      record: service as unknown as Record<string, unknown>,
      field: "summary",
      locale,
      fallback: service.summary,
      machineTranslate: locale !== "en",
    }),
    resolveLocalizedDynamicField({
      record: service as unknown as Record<string, unknown>,
      field: "description",
      locale,
      fallback: service.description,
      machineTranslate: locale !== "en",
    }),
    resolveLocalizedDynamicField({
      record: vertical as unknown as Record<string, unknown>,
      field: "name",
      locale,
      fallback: vertical.name,
      machineTranslate: locale !== "en",
    }),
  ]);

  const price = formatServicePrice(service, {
    fromLabel: copy.service.fromLabel,
    onRequestLabel: copy.service.onRequestLabel,
  });
  const duration = formatServiceDuration(service.duration_minutes, {
    minutesUnit: copy.service.minutesUnit,
    hoursUnit: copy.service.hoursUnit,
  });

  emitServiceViewed({
    verticalSlug: vertical.slug,
    serviceSlug: service.slug,
    providerSupplied: service.provider_supplied,
  });

  return (
    <main
      id="henryco-main"
      tabIndex={-1}
      className="overflow-hidden bg-transparent pb-24 pt-8"
      style={
        {
          "--accent": CARE_ACCENT,
          "--accent-secondary": CARE_ACCENT_SECONDARY,
        } as CSSProperties
      }
    >
      <div className="mx-auto max-w-[92rem] px-5 sm:px-8 lg:px-10">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--home-ink-50)]">
          <Link href="/services" className="transition-colors hover:text-[color:var(--home-accent-text)]">
            {copy.service.breadcrumbServices}
          </Link>
          <span aria-hidden>/</span>
          <Link
            href={`/services/${vertical.slug}`}
            className="transition-colors hover:text-[color:var(--home-accent-text)]"
          >
            {verticalName}
          </Link>
        </nav>

        <div className="mt-8 grid items-start gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Left: editorial detail */}
          <section className="space-y-10">
            <div>
              {service.provider_supplied ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--home-line)] bg-[color:var(--home-surface-04)] px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[color:var(--home-accent-text)]">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {copy.service.providerSuppliedNote}
                </span>
              ) : null}
              <h1 className="mt-4 max-w-3xl text-balance care-display text-[color:var(--home-ink)]">
                {serviceName}
              </h1>
              <p className="hc-font-reading mt-4 max-w-2xl text-pretty text-base leading-[1.7] text-[color:var(--home-ink-70)]">
                {serviceSummary}
              </p>
            </div>

            <div>
              <p className="care-kicker">{copy.service.aboutHeading}</p>
              <p className="hc-font-reading mt-4 max-w-2xl text-pretty text-[0.975rem] leading-[1.8] text-[color:var(--home-ink-70)]">
                {serviceDescription}
              </p>
            </div>

            {/* Providers slot — honest empty-state until V3-50 lands. */}
            <div className="border-l-2 border-[color:var(--accent)]/55 pl-5">
              <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[color:var(--home-accent-text)]">
                <ShieldCheck className="h-3.5 w-3.5" />
                {copy.service.providersHeading}
              </p>
              <p className="mt-2 max-w-xl text-sm leading-7 text-[color:var(--home-ink-70)]">
                {copy.service.providersComingSoon}
              </p>
            </div>
          </section>

          {/* Right: booking card */}
          <section className="lg:sticky lg:top-8">
            <div className="rounded-[1.8rem] border border-[color:var(--home-line)] bg-[color:var(--home-sheet)] p-6 shadow-[0_18px_60px_rgba(16,19,31,0.06)] sm:p-7">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-[color:var(--home-accent-text)]">
                {copy.service.priceLabel}
              </p>
              <p className="mt-2 text-[1.9rem] font-semibold leading-tight tracking-tight text-[color:var(--home-ink)]">
                {price.text}
              </p>

              <dl className="mt-6 space-y-4 border-t border-[color:var(--home-line)] pt-6">
                {duration ? (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="flex items-center gap-2 text-sm text-[color:var(--home-ink-70)]">
                      <Clock className="h-4 w-4 text-[color:var(--home-accent-text)]" />
                      {copy.service.durationLabel}
                    </dt>
                    <dd className="text-sm font-semibold text-[color:var(--home-ink)]">{duration}</dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-4">
                  <dt className="flex items-center gap-2 text-sm text-[color:var(--home-ink-70)]">
                    <Tag className="h-4 w-4 text-[color:var(--home-accent-text)]" />
                    {verticalName}
                  </dt>
                  <dd className="text-sm font-semibold text-[color:var(--home-ink)]">
                    {price.isOnRequest ? copy.service.onRequestLabel : price.text}
                  </dd>
                </div>
              </dl>

              <Link
                href={`/book?service=${encodeURIComponent(service.slug)}`}
                className="care-button-primary mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
              >
                {copy.service.bookCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-center text-xs leading-6 text-[color:var(--home-ink-50)]">
                {copy.service.bookNote}
              </p>
            </div>

            <Link
              href={`/services/${vertical.slug}`}
              className="mt-6 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--home-ink-50)] transition-colors hover:text-[color:var(--home-accent-text)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {copy.service.backToVertical.replace("{vertical}", verticalName)}
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
