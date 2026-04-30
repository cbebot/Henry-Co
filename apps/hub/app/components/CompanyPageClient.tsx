"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronRight, Clock3, Globe2, Landmark, ShieldCheck } from "lucide-react";
import type { CompanyPageRecord } from "../lib/company-pages";
import { normalizeCompanyPage } from "../lib/company-pages";
import SectionBlock from "./SectionBlock";

function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) return null;
  return createClient(url, anon);
}

function formatUpdatedAt(value?: string | null) {
  if (!value) return "Recently updated";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently updated";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function CompanyPageClient({
  pageKey,
  initialData,
  serverWarning,
}: {
  pageKey: string;
  initialData: CompanyPageRecord;
  serverWarning?: boolean;
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
      label: "Updated",
      value: formatUpdatedAt(page.updated_at),
    });
    if (page.subtitle) {
      items.push({
        icon: <Landmark className="h-3.5 w-3.5" aria-hidden />,
        label: "Section",
        value: page.subtitle,
      });
    }
    items.push({
      icon: <ShieldCheck className="h-3.5 w-3.5" aria-hidden />,
      label: "Standard",
      value: "Corporate-grade",
    });
    return items;
  }, [page.subtitle, page.updated_at]);

  const hasRealStats = page.stats.some((s) => (s.label || "").trim() && (s.value || "").trim());

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-[#0a0807] text-[#f5f1eb]">
      {/* Atmospheric warm-ink gradient — restrained, no grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(900px_440px_at_18%_-2%,rgba(214,168,81,0.10),transparent_55%),radial-gradient(720px_360px_at_82%_4%,rgba(120,70,28,0.10),transparent_55%),radial-gradient(900px_520px_at_50%_100%,rgba(38,22,12,0.7),transparent_60%)]" />
      </div>

      {/* Editorial hero — eyebrow + display + body + CTAs, with an aside that
          either shows the real hero image or a clean editorial summary card. */}
      <section className="relative">
        <div className="mx-auto grid max-w-[88rem] gap-10 px-5 pb-14 pt-16 sm:px-8 sm:pt-20 lg:grid-cols-[1.15fr,0.85fr] lg:px-10 lg:pt-24">
          <div>
            {page.hero_badge ? (
              <motion.p
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[#d6a851]"
              >
                {page.hero_badge}
              </motion.p>
            ) : null}

            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.04 }}
              className="mt-5 max-w-3xl text-balance text-[2.2rem] font-semibold leading-[1.04] tracking-[-0.025em] text-white sm:text-[2.9rem] md:text-[3.4rem]"
            >
              {page.title}
            </motion.h1>

            {page.subtitle ? (
              <motion.p
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.08 }}
                className="mt-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55"
              >
                {page.subtitle}
              </motion.p>
            ) : null}

            {page.intro ? (
              <motion.p
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.12 }}
                className="mt-6 max-w-2xl text-pretty text-[15px] leading-[1.7] text-white/72 sm:text-base"
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
                <a
                  href={page.primary_cta_href}
                  className="inline-flex items-center gap-2 rounded-full bg-[#d6a851] px-6 py-3.5 text-sm font-semibold text-[#0a0807] transition hover:-translate-y-0.5 hover:bg-[#e3b966]"
                >
                  {page.primary_cta_label}
                  <ArrowRight className="h-4 w-4" />
                </a>
              ) : null}

              {page.secondary_cta_label && page.secondary_cta_href ? (
                <a
                  href={page.secondary_cta_href}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-transparent px-6 py-3.5 text-sm font-medium text-white/85 transition hover:border-white/35 hover:bg-white/[0.04]"
                >
                  {page.secondary_cta_label}
                  <ChevronRight className="h-4 w-4" />
                </a>
              ) : null}
            </motion.div>

            {/* Stats — only when real values exist. Compact rail, not 3 dark tiles. */}
            {hasRealStats ? (
              <motion.dl
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.2 }}
                className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-white/10 py-5 sm:flex sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-10"
              >
                {page.stats
                  .filter((s) => (s.label || "").trim() && (s.value || "").trim())
                  .map((stat, index) => (
                    <div key={stat.id || `stat-${index + 1}`} className="flex flex-col gap-1">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                        {stat.label}
                      </dt>
                      <dd className="text-[1.5rem] font-semibold leading-tight tracking-tight text-white sm:text-[1.7rem]">
                        {stat.value}
                      </dd>
                    </div>
                  ))}
              </motion.dl>
            ) : null}
          </div>

          {/* Aside — real hero image OR editorial summary card */}
          <motion.aside
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="lg:pt-2"
          >
            {page.hero_image_url ? (
              <div className="overflow-hidden rounded-[2.4rem] border border-white/10">
                <img
                  src={page.hero_image_url}
                  alt={page.title}
                  className="h-[320px] w-full object-cover sm:h-[460px]"
                />
              </div>
            ) : (
              <div className="rounded-[2.4rem] border border-white/12 bg-[linear-gradient(135deg,rgba(214,168,81,0.08)_0%,rgba(38,22,12,0.4)_100%)] px-7 py-9 sm:px-9 sm:py-11">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[#d6a851]">
                  Henry &amp; Co.
                </p>
                <h2 className="mt-4 text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-white sm:text-[1.8rem]">
                  Premium company surface for trust, clarity, and long-term credibility.
                </h2>
                <p className="mt-4 max-w-md text-sm leading-7 text-white/68">
                  Every public document is signed off by the same standard the operating
                  divisions use internally — no marketing varnish, no hidden footnotes.
                </p>
                <dl className="mt-7 divide-y divide-white/10 border-y border-white/10">
                  {metaItems.map((meta, index) => (
                    <div
                      key={`${meta.label}-${index}`}
                      className="flex items-baseline gap-3 py-3"
                    >
                      <span className="text-[#d6a851]">{meta.icon}</span>
                      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                        {meta.label}
                      </dt>
                      <dd className="ml-auto text-right text-sm font-semibold tracking-tight text-white">
                        {meta.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {serverWarning ? (
              <p className="mt-4 border-l-2 border-[#d6a851]/55 pl-4 text-sm leading-7 text-white/72">
                Some content may still be refreshing.
              </p>
            ) : null}
          </motion.aside>
        </div>
      </section>

      {/* Section navigator — hairline rule, no panel chrome */}
      {sectionLinks.length ? (
        <nav
          aria-label="Page sections"
          className="mx-auto max-w-[88rem] px-5 pb-2 sm:px-8 lg:px-10"
        >
          <div className="flex gap-2 overflow-x-auto border-y border-white/10 py-3">
            {sectionLinks.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="whitespace-nowrap rounded-full border border-white/12 bg-transparent px-3.5 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-white/72 transition hover:border-white/30 hover:bg-white/[0.04] hover:text-white"
              >
                {section.label}
              </a>
            ))}
          </div>
        </nav>
      ) : null}

      {/* Long-form sections — kept as-is. SectionBlock owns its own typography. */}
      <section className="mx-auto max-w-[88rem] space-y-10 px-5 py-14 sm:px-8 lg:px-10">
        {page.sections.map((section, index) => (
          <SectionBlock
            key={section.id || `section-${index + 1}`}
            section={section}
            index={index}
          />
        ))}
      </section>

      {/* Footer — restrained editorial, no fake "trust quality" InfoPills */}
      <section className="mx-auto max-w-[88rem] px-5 pb-20 sm:px-8 lg:px-10">
        <div className="grid gap-8 border-t border-white/10 pt-10 lg:grid-cols-[1.05fr,0.95fr] lg:items-end">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[#d6a851]">
              Henry &amp; Co.
            </p>
            <h2 className="mt-4 max-w-2xl text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-white sm:text-[1.95rem]">
              The same operating standard our customers, partners, and teams trust.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/68">
              Every Henry &amp; Co. company surface — about, contact, governance, policy —
              ships under one editorial standard so what you read in public matches what
              we hold ourselves to in private.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <li className="flex items-baseline gap-3 border-b border-white/10 py-3">
              <span className="text-[#d6a851]">
                <Globe2 className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                Use case
              </span>
              <span className="ml-auto text-right text-sm font-semibold tracking-tight text-white">
                Customers · Partners · Media
              </span>
            </li>
            <li className="flex items-baseline gap-3 border-b border-white/10 py-3">
              <span className="text-[#d6a851]">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                Standard
              </span>
              <span className="ml-auto text-right text-sm font-semibold tracking-tight text-white">
                Structured &middot; Verified
              </span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
