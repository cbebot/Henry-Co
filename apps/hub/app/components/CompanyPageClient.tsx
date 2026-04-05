"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  ChevronRight,
  Clock3,
  Globe2,
  Landmark,
  ShieldCheck,
} from "lucide-react";
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
        }
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
    [page.sections]
  );

  const pageMeta = [
    {
      icon: <Clock3 className="h-4 w-4" />,
      label: "Updated",
      value: formatUpdatedAt(page.updated_at),
    },
    {
      icon: <ShieldCheck className="h-4 w-4" />,
      label: "Standard",
      value: "Corporate-grade",
    },
    {
      icon: <Landmark className="h-4 w-4" />,
      label: "Purpose",
      value: page.subtitle || "Company Information",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050816] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(1000px_520px_at_18%_8%,rgba(201,162,39,0.18),transparent_55%),radial-gradient(900px_520px_at_82%_18%,rgba(59,130,246,0.12),transparent_58%),radial-gradient(900px_520px_at_50%_100%,rgba(168,85,247,0.09),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:26px_26px] opacity-30" />
      </div>

      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-12 pt-14 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:pt-20">
          <div>
            {page.hero_badge ? (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-white/58"
              >
                {page.hero_badge}
              </motion.div>
            ) : null}

            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.04 }}
              className="mt-5 max-w-4xl text-4xl font-semibold leading-[0.98] tracking-tight text-white sm:text-6xl"
            >
              {page.title}
            </motion.h1>

            {page.subtitle ? (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.08 }}
                className="mt-4 text-sm uppercase tracking-[0.24em] text-white/46"
              >
                {page.subtitle}
              </motion.div>
            ) : null}

            {page.intro ? (
              <motion.p
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.12 }}
                className="mt-6 max-w-3xl text-sm leading-8 text-white/66 sm:text-base"
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
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#C9A227] px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  {page.primary_cta_label}
                  <ArrowRight className="h-4 w-4" />
                </a>
              ) : null}

              {page.secondary_cta_label && page.secondary_cta_href ? (
                <a
                  href={page.secondary_cta_href}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-5 py-3 text-sm font-medium text-white/88 transition hover:bg-white/10"
                >
                  {page.secondary_cta_label}
                  <ChevronRight className="h-4 w-4" />
                </a>
              ) : null}
            </motion.div>

            {page.stats.length ? (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.2 }}
                className="mt-8 grid gap-3 sm:grid-cols-3"
              >
                {page.stats.map((stat, index) => (
                  <div
                    key={stat.id || `stat-${index + 1}`}
                    className="rounded-[28px] border border-white/10 bg-black/25 p-4"
                  >
                    <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                      {stat.label || "Metric"}
                    </div>
                    <div className="mt-2 text-lg font-semibold tracking-tight text-white">
                      {stat.value || "—"}
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : null}
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="relative overflow-hidden rounded-[36px] border border-white/12 bg-white/[0.06] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.3)] backdrop-blur-2xl"
          >
            {page.hero_image_url ? (
              <div className="overflow-hidden rounded-[28px] border border-white/10">
                <img
                  src={page.hero_image_url}
                  alt={page.title}
                  className="h-[320px] w-full object-cover sm:h-[420px]"
                />
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/25 p-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(255,255,255,0.16),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.08),transparent_24%)]" />
                <div className="relative">
                  <div className="grid h-16 w-16 place-items-center rounded-3xl bg-[#C9A227]">
                    <Building2 className="h-8 w-8 text-black" />
                  </div>

                  <div className="mt-6 text-2xl font-semibold tracking-tight text-white">
                    {page.title}
                  </div>

                  <p className="mt-3 text-sm leading-8 text-white/66">
                    Henry & Co. maintains a premium public company standard designed
                    for trust, clarity, and long-term brand credibility.
                  </p>

                  <div className="mt-6 grid gap-3">
                    {pageMeta.map((meta, index) => (
                      <div
                        key={`${meta.label}-${index}`}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/78"
                      >
                        <span className="text-[#C9A227]">{meta.icon}</span>
                        <span className="font-medium">{meta.label}</span>
                        <span className="ml-auto text-white/88">{meta.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {serverWarning ? (
              <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-sm text-amber-100">
                Some content may still be refreshing.
              </div>
            ) : null}
          </motion.div>
        </div>
      </section>

      {sectionLinks.length ? (
        <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto rounded-[26px] border border-white/10 bg-white/[0.05] p-3 backdrop-blur-xl">
            {sectionLinks.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="whitespace-nowrap rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-xs uppercase tracking-[0.16em] text-white/72 transition hover:bg-white/10 hover:text-white"
              >
                {section.label}
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        {page.sections.map((section, index) => (
          <SectionBlock
            key={section.id || `section-${index + 1}`}
            section={section}
            index={index}
          />
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-[34px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_24px_100px_rgba(0,0,0,0.18)] backdrop-blur-2xl sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/56">
                Henry & Co.
              </div>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Built to communicate trust, clarity, and corporate quality
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-8 text-white/64">
                These company pages are designed to support serious brand
                presentation, legal clarity, and a more credible public-facing
                experience across the Henry & Co. ecosystem.
              </p>
            </div>

            <div className="grid gap-3">
              <InfoPill
                icon={<Globe2 className="h-4 w-4" />}
                label="Public standard"
                value="Premium company presentation"
              />
              <InfoPill
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Trust & quality"
                value="Structured, professional, and clear"
              />
              <InfoPill
                icon={<Landmark className="h-4 w-4" />}
                label="Use case"
                value="Customers, partners, media, and stakeholders"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-white/45">
        <span className="text-[#C9A227]">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="mt-2 text-sm font-semibold text-white/88">{value}</div>
    </div>
  );
}