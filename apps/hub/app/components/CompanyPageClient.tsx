"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronRight, Clock3, Globe2, Landmark, ShieldCheck } from "lucide-react";
import type { HubPublicCopy } from "@henryco/i18n";
import { PublicCTA, PublicProofRail } from "@henryco/ui/public-design";
import type { CompanyPageRecord } from "../lib/company-pages";
import { normalizeCompanyPage } from "../lib/company-pages";
import SectionBlock from "./SectionBlock";

function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) return null;
  return createClient(url, anon);
}

function formatUpdatedAt(value: string | null | undefined, locale: string, fallback: string) {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Company page (about / privacy / terms / contact) presentation.
 *
 * Data + realtime CMS subscription + honest-stat filtering are unchanged. The
 * presentation was moved onto the shared public design system (V3-PUBLIC-DESIGN-01):
 * theme-aware `--home-*` tokens (no more hardcoded `#0a0807` / `#d6a851`), the brand
 * accent, the editorial serif (Fraunces via .home-display*), and the shared
 * `PublicCTA` / `PublicProofRail` primitives. The surrounding `PublicSiteShell`
 * now owns the theme-aware canvas, so this surface renders transparently on top.
 */
export default function CompanyPageClient({
  pageKey,
  initialData,
  serverWarning,
  hideSections = false,
  hideFooter = false,
  hideHero = false,
  copy,
  locale,
}: {
  pageKey: string;
  initialData: CompanyPageRecord;
  serverWarning?: boolean;
  /**
   * When true, the long-form CMS sections list is skipped — useful when a
   * company page wants to render a hand-crafted layout below the hero
   * instead of the generic SectionBlock loop. (CHROME-01B FIX 2.)
   */
  hideSections?: boolean;
  /**
   * When true, the trailing editorial footer block is skipped. The about
   * page (FIX 2) replaces it with a founder-note placeholder.
   */
  hideFooter?: boolean;
  /**
   * When true, the editorial hero is skipped — for pages that own their
   * own above-the-fold layout (CHROME-01B FIX 3 contact form).
   */
  hideHero?: boolean;
  copy: HubPublicCopy["companyPage"];
  locale: string;
}) {
  const reduceMotion = useReducedMotion();
  const [page, setPage] = useState<CompanyPageRecord>(initialData);

  useEffect(() => {
    setPage(initialData);
  }, [initialData]);

  useEffect(() => {
    const supabase = supabaseBrowser();
    if (!supabase) return;

    const fetchLatest = async () => {
      const { data, error } = await supabase
        .from("company_pages")
        .select("*")
        .eq("slug", pageKey)
        .maybeSingle();

      if (error || !data) return;
      setPage(normalizeCompanyPage(data, pageKey));
    };

    const channel = supabase
      .channel(`company-page-${pageKey}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "company_pages",
          filter: `slug=eq.${pageKey}`,
        },
        () => {
          void fetchLatest();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [pageKey]);

  const sectionLinks = useMemo(
    () =>
      page.sections
        .filter((section) => section.title)
        .map((section, index) => ({
          id: section.id || `section-${index + 1}`,
          label: section.title || `Section ${index + 1}`,
        })),
    [page.sections],
  );

  // Real metadata items only — no filler "Standard: Corporate-grade" lines.
  const metaItems = useMemo(() => {
    const items: Array<{ icon: React.ReactNode; label: string; value: string }> = [];
    items.push({
      icon: <Clock3 className="h-3.5 w-3.5" aria-hidden />,
      label: copy.metaUpdated,
      value: formatUpdatedAt(page.updated_at, locale, copy.recentlyUpdated),
    });
    if (page.subtitle) {
      items.push({
        icon: <Landmark className="h-3.5 w-3.5" aria-hidden />,
        label: copy.metaSection,
        value: page.subtitle,
      });
    }
    items.push({
      icon: <ShieldCheck className="h-3.5 w-3.5" aria-hidden />,
      label: copy.metaStandard,
      value: copy.metaCorporateGrade,
    });
    return items;
  }, [page.subtitle, page.updated_at, copy, locale]);

  /** Reject stats whose numeric value is zero. CMS-edited stats with
   * label="Management" value="0" otherwise survive (since "0" is non-empty)
   * and undermine the credibility the about page is trying to build. */
  const isMeaningfulStat = (s: { label?: string; value?: string }) => {
    const label = (s.label || "").trim();
    const raw = (s.value || "").trim();
    if (!label || !raw) return false;
    const numeric = Number(raw.replace(/[\s,]/g, ""));
    return !(Number.isFinite(numeric) && numeric === 0);
  };
  const realStats = page.stats.filter(isMeaningfulStat);

  return (
    <div className="relative">
      {/* Editorial hero — eyebrow + display + body + CTAs, with an aside that
          either shows the real hero image or a clean editorial summary card. */}
      {!hideHero ? (
        <section className="relative">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-14 pt-14 sm:px-8 sm:pt-18 lg:grid-cols-[1.15fr,0.85fr] lg:px-8 lg:pt-20">
            <div>
              {page.hero_badge ? (
                <motion.p
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="home-eyebrow text-[color:var(--home-accent-text)]"
                >
                  {page.hero_badge}
                </motion.p>
              ) : null}

              <motion.h1
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.04 }}
                /** overflow hardening so /about /contact /privacy /terms cannot clip
                 * a long word on 320–360 px; size/family come from .home-display-xl. */
                style={{ overflowWrap: "break-word", hyphens: "auto" }}
                className="home-display-xl mt-5 max-w-3xl"
              >
                {page.title}
              </motion.h1>

              {page.subtitle ? (
                <motion.p
                  initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                  animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.08 }}
                  className="home-eyebrow mt-4 text-[color:var(--home-ink-50)]"
                >
                  {page.subtitle}
                </motion.p>
              ) : null}

              {page.intro ? (
                <motion.p
                  initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                  animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.12 }}
                  className="home-lede mt-6 max-w-2xl"
                >
                  {page.intro}
                </motion.p>
              ) : null}

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.16 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                {page.primary_cta_label && page.primary_cta_href ? (
                  <PublicCTA
                    href={page.primary_cta_href}
                    variant="primary"
                    size="lg"
                    trailingIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    {page.primary_cta_label}
                  </PublicCTA>
                ) : null}

                {page.secondary_cta_label && page.secondary_cta_href ? (
                  <PublicCTA
                    href={page.secondary_cta_href}
                    variant="secondary"
                    size="lg"
                    trailingIcon={<ChevronRight className="h-4 w-4" />}
                  >
                    {page.secondary_cta_label}
                  </PublicCTA>
                ) : null}
              </motion.div>

              {/* Stats — only when real, non-zero values exist (honest proof rail). */}
              {realStats.length ? (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                  animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.2 }}
                  className="mt-10"
                >
                  <PublicProofRail
                    items={realStats.map((stat) => ({ value: stat.value, label: stat.label }))}
                  />
                </motion.div>
              ) : null}
            </div>

            {/* Aside — real hero image when set, otherwise a quiet meta rail. */}
            <motion.aside
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="lg:pt-2"
            >
              {page.hero_image_url ? (
                <div className="overflow-hidden rounded-[2rem] border border-[color:var(--home-line)] sm:rounded-[2.4rem]">
                  <Image
                    src={page.hero_image_url}
                    alt={page.title}
                    width={760}
                    height={920}
                    priority
                    unoptimized
                    className="h-[280px] w-full object-cover sm:h-[460px]"
                  />
                </div>
              ) : (
                <dl className="divide-y divide-[color:var(--home-line)] border-y border-[color:var(--home-line)]">
                  {metaItems.map((meta, index) => (
                    <div
                      key={`${meta.label}-${index}`}
                      className="flex items-baseline gap-3 py-3 text-sm"
                    >
                      <span className="text-[color:var(--home-accent-text)]">{meta.icon}</span>
                      <dt className="home-eyebrow text-[color:var(--home-ink-50)]">{meta.label}</dt>
                      <dd className="ml-auto text-right text-sm font-semibold tracking-tight text-[color:var(--home-ink)]">
                        {meta.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              {serverWarning ? (
                <p className="mt-4 border-l-2 border-[color:var(--home-accent)] pl-4 text-sm leading-7 text-[color:var(--home-ink-65)]">
                  {copy.serverWarning}
                </p>
              ) : null}
            </motion.aside>
          </div>
        </section>
      ) : null}

      {/* Section navigator — hairline rule, no panel chrome */}
      {!hideSections && sectionLinks.length ? (
        <nav
          aria-label={copy.pageSectionsAria}
          className="mx-auto max-w-6xl px-5 pb-2 sm:px-8 lg:px-8"
        >
          <div className="flex gap-2 overflow-x-auto border-y border-[color:var(--home-line)] py-3">
            {sectionLinks.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="home-focus whitespace-nowrap rounded-full border border-[color:var(--home-line-12)] bg-transparent px-3.5 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-[color:var(--home-ink-60)] transition hover:border-[color:var(--home-accent)] hover:bg-[color:var(--home-surface-04)] hover:text-[color:var(--home-ink)]"
              >
                {section.label}
              </a>
            ))}
          </div>
        </nav>
      ) : null}

      {/* Long-form sections — SectionBlock owns its own (theme-aware) typography. */}
      {!hideSections ? (
        <section className="mx-auto max-w-6xl space-y-10 px-5 py-14 sm:px-8 lg:px-8">
          {page.sections.map((section, index) => (
            <SectionBlock
              key={section.id || `section-${index + 1}`}
              section={section}
              index={index}
            />
          ))}
        </section>
      ) : null}

      {/* Footer — restrained editorial, no fake "trust quality" InfoPills */}
      {!hideFooter ? (
        <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8 lg:px-8">
          <div className="grid gap-8 border-t border-[color:var(--home-line)] pt-10 lg:grid-cols-[1.05fr,0.95fr] lg:items-end">
            <div>
              <p className="home-eyebrow text-[color:var(--home-accent-text)]">{copy.footerEyebrow}</p>
              <h2 className="home-headline mt-4 max-w-2xl text-balance">{copy.footerTitle}</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-[color:var(--home-ink-65)]">
                {copy.footerBody}
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <li className="flex items-baseline gap-3 border-b border-[color:var(--home-line)] py-3">
                <span className="text-[color:var(--home-accent-text)]">
                  <Globe2 className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span className="home-eyebrow text-[color:var(--home-ink-50)]">{copy.footerUseCase}</span>
                <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[color:var(--home-ink)]">
                  {copy.footerUseCaseValue}
                </span>
              </li>
              <li className="flex items-baseline gap-3 border-b border-[color:var(--home-line)] py-3">
                <span className="text-[color:var(--home-accent-text)]">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span className="home-eyebrow text-[color:var(--home-ink-50)]">{copy.footerStandard}</span>
                <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[color:var(--home-ink)]">
                  {copy.footerStandardValue}
                </span>
              </li>
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
