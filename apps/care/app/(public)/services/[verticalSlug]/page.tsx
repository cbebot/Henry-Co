import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BadgeCheck } from "lucide-react";
import { getDivisionConfig } from "@henryco/config";
import { getServicesCopy, resolveLocalizedDynamicField } from "@henryco/i18n/server";
import { getCarePublicLocale } from "@/lib/locale-server";
import { getServicesCatalog } from "@/lib/care-data";
import { findVerticalBySlug } from "@/lib/services-catalog";
import { formatServicePrice } from "@/lib/services-format";
import { CARE_ACCENT, CARE_ACCENT_SECONDARY } from "@/lib/care-theme";

export const revalidate = 60;

const care = getDivisionConfig("care");

type RouteParams = { params: Promise<{ verticalSlug: string }> };

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { verticalSlug } = await params;
  const locale = await getCarePublicLocale();
  const copy = getServicesCopy(locale);
  const catalog = await getServicesCatalog();
  const vertical = findVerticalBySlug(catalog, verticalSlug);
  if (!vertical) {
    return { title: copy.directory.titleTemplate.replace("{division}", care.name) };
  }
  const name = await resolveLocalizedDynamicField({
    record: vertical as unknown as Record<string, unknown>,
    field: "name",
    locale,
    fallback: vertical.name,
    machineTranslate: locale !== "en",
  });
  return {
    title: copy.vertical.titleTemplate.replace("{vertical}", name).replace("{division}", care.name),
    description: vertical.summary,
    alternates: { canonical: `/services/${vertical.slug}` },
  };
}

export default async function VerticalPage({ params }: RouteParams) {
  const { verticalSlug } = await params;
  const locale = await getCarePublicLocale();
  const copy = getServicesCopy(locale);
  const catalog = await getServicesCatalog();
  const vertical = findVerticalBySlug(catalog, verticalSlug);
  if (!vertical) {
    notFound();
  }

  const services = catalog.services
    .filter((service) => service.status === "active" && service.vertical_slug === vertical.slug)
    .sort((a, b) => a.name.localeCompare(b.name));

  const [verticalName, verticalSummary] = await Promise.all([
    resolveLocalizedDynamicField({
      record: vertical as unknown as Record<string, unknown>,
      field: "name",
      locale,
      fallback: vertical.name,
      machineTranslate: locale !== "en",
    }),
    resolveLocalizedDynamicField({
      record: vertical as unknown as Record<string, unknown>,
      field: "summary",
      locale,
      fallback: vertical.summary,
      machineTranslate: locale !== "en",
    }),
  ]);

  const localizedServices = await Promise.all(
    services.map(async (service) => ({
      ...service,
      name: await resolveLocalizedDynamicField({
        record: service as unknown as Record<string, unknown>,
        field: "name",
        locale,
        fallback: service.name,
        machineTranslate: locale !== "en",
      }),
      summary: await resolveLocalizedDynamicField({
        record: service as unknown as Record<string, unknown>,
        field: "summary",
        locale,
        fallback: service.summary,
        machineTranslate: locale !== "en",
      }),
    })),
  );

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
      <section className="mx-auto max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <Link
          href="/services"
          className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--home-ink-50)] transition-colors hover:text-[color:var(--home-accent-text)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {copy.vertical.backToDirectory}
        </Link>
        <div className="mt-5 max-w-3xl">
          <h1 className="text-balance care-display text-[color:var(--home-ink)]">{verticalName}</h1>
          <p className="hc-font-reading mt-4 max-w-2xl text-pretty text-base leading-[1.7] text-[color:var(--home-ink-70)]">
            {verticalSummary}
          </p>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <div className="flex items-baseline gap-4">
          <p className="care-kicker">{copy.vertical.servicesHeading}</p>
          <span className="h-px flex-1 bg-[color:var(--home-line)]" />
        </div>

        {localizedServices.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-[color:var(--home-line)] bg-[color:var(--home-sheet)] px-8 py-12 text-center">
            <h2 className="care-section-title text-[color:var(--home-ink)]">
              {copy.vertical.emptyTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[color:var(--home-ink-70)]">
              {copy.vertical.emptyBody}
            </p>
            <Link
              href="/services"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--home-accent-text)]"
            >
              {copy.vertical.backToDirectory}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <ul className="mt-8 border-t border-[color:var(--home-line)]">
            {localizedServices.map((service) => {
              const price = formatServicePrice(service, {
                fromLabel: copy.vertical.fromLabel,
                onRequestLabel: copy.vertical.onRequestLabel,
              });
              return (
                <li key={service.id} className="transition-opacity">
                  <Link
                    href={`/services/${vertical.slug}/${service.slug}`}
                    className="group grid grid-cols-1 items-baseline gap-4 border-b border-[color:var(--home-line)] py-6 transition-colors hover:bg-[color:var(--home-surface-04)] sm:grid-cols-[1fr_auto]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-[1.15rem] font-semibold tracking-tight text-[color:var(--home-ink)]">
                          {service.name}
                        </h2>
                        {service.provider_supplied ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--home-line)] bg-[color:var(--home-surface-04)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--home-accent-text)]">
                            <BadgeCheck className="h-3 w-3" />
                            {copy.service.providersHeading}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1.5 max-w-2xl text-sm leading-7 text-[color:var(--home-ink-70)]">
                        {service.summary}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 sm:justify-end">
                      <span className="text-[1.05rem] font-semibold tracking-tight text-[color:var(--home-accent-text)]">
                        {price.text}
                      </span>
                      <ArrowRight className="h-4 w-4 text-[color:var(--home-ink-50)] transition-colors group-hover:text-[color:var(--home-accent-text)]" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
