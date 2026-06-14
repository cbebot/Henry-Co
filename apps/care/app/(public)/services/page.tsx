import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Home,
  ListChecks,
  PartyPopper,
  Shirt,
  Sparkles,
  Truck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { WashingMachine } from "lucide-react";
import { getDivisionConfig } from "@henryco/config";
import { getServicesCopy, resolveLocalizedDynamicField } from "@henryco/i18n/server";
import { getCarePublicLocale } from "@/lib/locale-server";
import { getServicesCatalog } from "@/lib/care-data";
import { groupServicesByVertical } from "@/lib/services-catalog";
import { CARE_ACCENT, CARE_ACCENT_SECONDARY } from "@/lib/care-theme";
import { emitServicesCatalogViewed } from "@/lib/services-telemetry";

export const revalidate = 60;

const care = getDivisionConfig("care");

const VERTICAL_ICONS: Record<string, LucideIcon> = {
  Shirt,
  WashingMachine,
  Home,
  Building2,
  Sparkles,
  Wrench,
  ListChecks,
  Truck,
  PartyPopper,
  Briefcase,
  BadgeCheck,
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCarePublicLocale();
  const copy = getServicesCopy(locale);
  return {
    title: copy.directory.titleTemplate.replace("{division}", care.name),
    description: copy.directory.description,
    alternates: { canonical: "/services" },
  };
}

function serviceCountLabel(count: number, copy: ReturnType<typeof getServicesCopy>) {
  return count === 1
    ? copy.directory.serviceCountOne
    : copy.directory.serviceCountOther.replace("{count}", String(count));
}

export default async function ServicesPage() {
  const locale = await getCarePublicLocale();
  const copy = getServicesCopy(locale);
  const catalog = await getServicesCatalog();
  const groups = groupServicesByVertical(catalog);

  // Localize Supabase-driven vertical names/summaries (Pattern B runtime fallback).
  const localizedGroups = await Promise.all(
    groups.map(async (group) => ({
      slug: group.vertical.slug,
      icon: group.vertical.icon,
      count: group.services.length,
      name: await resolveLocalizedDynamicField({
        record: group.vertical as unknown as Record<string, unknown>,
        field: "name",
        locale,
        fallback: group.vertical.name,
        machineTranslate: locale !== "en",
      }),
      summary: await resolveLocalizedDynamicField({
        record: group.vertical as unknown as Record<string, unknown>,
        field: "summary",
        locale,
        fallback: group.vertical.summary,
        machineTranslate: locale !== "en",
      }),
    })),
  );

  emitServicesCatalogViewed({ surface: "care_directory", verticalCount: localizedGroups.length });

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
      {/* Editorial hero — compressed so the directory is visible above the fold. */}
      <section className="mx-auto max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <div className="rounded-[2.2rem] border border-[color:var(--home-line)] bg-[color:var(--home-sheet)] px-6 py-6 sm:px-8 sm:py-7 lg:px-10 lg:py-8">
          <div className="max-w-3xl">
            <div className="care-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--home-ink-70)]">
              <Sparkles className="h-3.5 w-3.5 text-[color:var(--home-accent-text)]" />
              {copy.directory.eyebrow}
            </div>
            <h1 className="mt-3 max-w-3xl text-balance text-[1.7rem] font-semibold leading-[1.1] tracking-[-0.025em] text-[color:var(--home-ink)] sm:text-[2rem] md:text-[2.3rem]">
              {copy.directory.title}
            </h1>
            <p className="hc-font-reading mt-3 max-w-2xl text-pretty text-sm leading-[1.65] text-[color:var(--home-ink-70)] sm:text-base">
              {copy.directory.body}
            </p>
          </div>
        </div>
      </section>

      {/* Vertical directory — a full-width typographic index, not a card stack. */}
      <section className="mx-auto mt-12 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <div className="flex items-baseline gap-4">
          <p className="care-kicker">{copy.directory.linesEyebrow}</p>
          <span className="h-px flex-1 bg-[color:var(--home-line)]" />
        </div>
        <ul className="mt-8 border-t border-[color:var(--home-line)] [&:hover>li:not(:hover)]:opacity-60 [&:focus-within>li:not(:focus-within)]:opacity-60">
          {localizedGroups.map((group) => {
            const Icon = VERTICAL_ICONS[group.icon] ?? Sparkles;
            return (
              <li key={group.slug} className="transition-opacity duration-300">
                <Link
                  href={`/services/${group.slug}`}
                  className="group relative grid grid-cols-[auto_1fr_auto] items-center gap-5 border-b border-[color:var(--home-line)] py-7 transition-colors hover:bg-[color:var(--home-surface-04)]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[color:var(--home-line)] bg-[color:var(--home-surface-04)] text-[color:var(--home-accent-text)]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[1.25rem] font-semibold tracking-tight text-[color:var(--home-ink)]">
                      {group.name}
                    </h2>
                    <p className="mt-1 max-w-2xl truncate text-sm leading-7 text-[color:var(--home-ink-70)]">
                      {group.summary}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="hidden text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[color:var(--home-ink-50)] sm:inline">
                      {serviceCountLabel(group.count, copy)}
                    </span>
                    <ArrowUpRight className="h-5 w-5 text-[color:var(--home-ink-50)] transition-colors group-hover:text-[color:var(--home-accent-text)]" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Closing band — theme-aware raised surface (flips light/dark). */}
      <section className="mx-auto mt-24 max-w-[92rem] px-5 sm:px-8 lg:px-10">
        <div className="rounded-[2.5rem] border border-[color:var(--home-line)] bg-[color:var(--home-sheet)] px-8 py-10 sm:px-10 lg:flex lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="care-kicker">{copy.directory.closingEyebrow}</p>
            <h2 className="mt-4 care-section-title text-[color:var(--home-ink)]">
              {copy.directory.closingTitle}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[color:var(--home-ink-70)]">
              {copy.directory.closingBody}
            </p>
          </div>
          <Link
            href="/book"
            className="care-button-primary mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold lg:mt-0"
          >
            {copy.directory.closingCta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
