"use client";

import Link from "next/link";
import React, { createContext, useContext, useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import type { AppLocale, HubHomeCopy } from "@henryco/i18n";
import { getAccountUrl } from "@henryco/config";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ChevronRight,
  ExternalLink,
  Filter,
  Globe2,
  Landmark,
  Layers3,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import HubParticles from "./HubParticles";
import type { PublicAccountUser } from "@henryco/ui";
import {
  cn,
  HenryCoHeroCard,
  HenryCoPublicAccountPresets,
  PublicAccountChip,
} from "@henryco/ui";
import { HenryCoLogo } from "@henryco/brand";
import type { DivisionRow } from "../lib/divisions";

type StatusFilter = "all" | "active" | "coming_soon" | "paused";

type DivisionExtras = {
  logo_url?: string | null;
  cover_url?: string | null;
  who_its_for?: string[] | null;
  how_it_works?: string[] | null;
  trust?: string[] | null;
  lead?:
    | {
        name?: string | null;
        title?: string | null;
        avatar_url?: string | null;
      }
    | null;
  links?:
    | {
        label: string;
        url: string;
      }[]
    | null;
};

type FaqItem = {
  q: string;
  a: string;
};

type HubChrome = {
  copy: HubHomeCopy;
  locale: AppLocale;
  formatShort: Intl.DateTimeFormat;
  formatLong: Intl.DateTimeFormat;
};

const HubChromeContext = createContext<HubChrome | null>(null);

function useHubChrome(): HubChrome {
  const ctx = useContext(HubChromeContext);
  if (!ctx) {
    throw new Error("Hub chrome context missing");
  }
  return ctx;
}

function normalizeText(value: unknown, fallback = ""): string {
  const text = typeof value === "string" ? value.trim() : String(value ?? "").trim();
  return text || fallback;
}

function normalizeImageUrl(value: unknown): string | null {
  const text = normalizeText(value);
  return text || null;
}

function getAccent(value: unknown, fallback = "#C9A227"): string {
  const text = normalizeText(value);
  return text || fallback;
}

function getExtras(division: DivisionRow) {
  return division as DivisionRow & DivisionExtras;
}

function domainFromUrl(primaryUrl?: string | null, subdomain?: string | null) {
  const cleanPrimaryUrl = normalizeText(primaryUrl);
  if (cleanPrimaryUrl) {
    try {
      return new URL(cleanPrimaryUrl).host;
    } catch {
      return cleanPrimaryUrl;
    }
  }

  const cleanSubdomain = normalizeText(subdomain).toLowerCase();
  if (!cleanSubdomain) return null;

  if (typeof window !== "undefined" && window.location.hostname.includes("localhost")) {
    return `${cleanSubdomain}.localhost:3000`;
  }

  const baseDomain = normalizeText(
    process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com"
  )
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");

  return `${cleanSubdomain}.${baseDomain}`;
}

function safeOpen(url?: string | null) {
  const cleanUrl = normalizeText(url);
  if (!cleanUrl || typeof window === "undefined") return;
  window.open(cleanUrl, "_blank", "noopener,noreferrer");
}

function getStatusLabel(status: DivisionRow["status"], labels: HubHomeCopy["status"]) {
  if (status === "coming_soon") return labels.comingSoon;
  if (status === "paused") return labels.paused;
  return labels.active;
}

function getStatusTone(status: DivisionRow["status"]) {
  if (status === "coming_soon") {
    return "border-amber-500/25 bg-amber-500/12 text-amber-200";
  }

  if (status === "paused") {
    return "border-rose-500/25 bg-rose-500/12 text-rose-200";
  }

  return "border-emerald-500/25 bg-emerald-500/12 text-emerald-200";
}

function formatUpdatedAt(value: string | undefined | null, fmt: Intl.DateTimeFormat) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return fmt.format(date);
}

function formatUpdatedAtLong(value: string | undefined | null, fmt: Intl.DateTimeFormat) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return fmt.format(date);
}

function toFaqItems(
  records: Array<{ question?: string | null; answer?: string | null } | FaqItem> | undefined,
  fallback: FaqItem[]
): FaqItem[] {
  if (!Array.isArray(records) || !records.length) {
    return fallback;
  }

  const items = records
    .map((item) => {
      if ("q" in item && "a" in item) {
        return {
          q: normalizeText(item.q),
          a: normalizeText(item.a),
        };
      }

      return {
        q: normalizeText(item.question),
        a: normalizeText(item.answer),
      };
    })
    .filter((item) => item.q && item.a);

  return items.length ? items : fallback;
}

/**
 * BrandMark — renders the canonical HenryCo monogram SVG.
 *
 * No image is loaded. `src` is intentionally ignored to enforce one source of
 * truth across the platform; surfaces that previously fed a Supabase
 * `logo_url` now resolve to the same SVG and color it via `accent`.
 */
function BrandMark({
  alt,
  accent,
  wrapperClassName,
  imageClassName,
}: {
  src?: string | null;
  alt: string;
  accent: string;
  wrapperClassName?: string;
  imageClassName?: string;
  iconClassName?: string;
}) {
  return (
    <div
      className={cn(
        "grid place-items-center overflow-hidden rounded-2xl border border-white/12 bg-white/[0.06]",
        wrapperClassName
      )}
    >
      <HenryCoLogo
        tone="mono"
        accent={accent}
        variant="mark"
        label={alt}
        className={cn("h-full w-full p-1.5", imageClassName)}
      />
    </div>
  );
}

/**
 * DivisionMark — division thumbnail using the canonical HenryCo SVG, colored
 * by the division accent. No image asset is loaded; division identity is
 * conveyed through accent + label, not through a separate logo upload.
 */
function DivisionMark({
  alt,
  accent,
  wrapperClassName,
  imageClassName,
}: {
  src?: string | null;
  alt: string;
  accent: string;
  wrapperClassName?: string;
  imageClassName?: string;
}) {
  const safeAccent = getAccent(accent);
  return (
    <div
      className={cn(
        "grid place-items-center overflow-hidden rounded-2xl border border-white/12 bg-black/25",
        wrapperClassName
      )}
    >
      <HenryCoLogo
        tone="mono"
        accent={safeAccent}
        variant="mark"
        label={alt}
        className={cn("h-full w-full p-1.5", imageClassName)}
      />
    </div>
  );
}

export default function HubHomeClient({
  brandTitle,
  brandSub,
  brandAccent,
  brandLogoUrl,
  brandFooterBlurb,
  intro,
  initialDivisions,
  initialFaqs,
  hasServerError,
  copy,
  locale,
  accountChip,
  heroWelcome,
}: {
  brandTitle?: string | null;
  brandSub?: string | null;
  brandAccent?: string | null;
  brandLogoUrl?: string | null;
  brandFooterBlurb?: string | null;
  intro?: string | null;
  initialDivisions?: DivisionRow[];
  initialFaqs?: Array<{ question?: string | null; answer?: string | null }>;
  hasServerError?: boolean;
  copy: HubHomeCopy;
  locale: AppLocale;
  accountChip?: {
    user: PublicAccountUser | null;
    loginHref: string;
    signupHref: string;
    accountHref: string;
  };
  /** Subtle signed-in hero line (first name). */
  heroWelcome?: string | null;
}) {
  const reduceMotion = useReducedMotion();

  const formatShort = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-NG", {
        timeZone: "UTC",
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    [locale]
  );

  const formatLong = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-NG", {
        timeZone: "UTC",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    [locale]
  );

  const chrome = useMemo(
    () => ({ copy, locale, formatShort, formatLong }),
    [copy, locale, formatShort, formatLong]
  );

  const brandTitleSafe = normalizeText(brandTitle, "Henry & Co.");
  const brandSubSafe = normalizeText(brandSub, "Corporate Platform");
  const brandAccentSafe = getAccent(brandAccent);
  const brandLogoUrlSafe = normalizeImageUrl(brandLogoUrl);
  const brandFooterBlurbSafe = normalizeText(brandFooterBlurb);

  const initialDivisionsSafe = useMemo(
    () => (Array.isArray(initialDivisions) ? initialDivisions : []),
    [initialDivisions]
  );

  const initialFaqItems = useMemo(
    () => toFaqItems(initialFaqs, copy.faqFallback),
    [initialFaqs, copy.faqFallback]
  );

  const [divisions, setDivisions] = useState<DivisionRow[]>(initialDivisionsSafe);
  const [faqItems, setFaqItems] = useState<FaqItem[]>(initialFaqItems);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [category, setCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [selected, setSelected] = useState<DivisionRow | null>(null);

  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDivisions(initialDivisionsSafe);
  }, [initialDivisionsSafe]);

  useEffect(() => {
    setFaqItems(initialFaqItems);
  }, [initialFaqItems]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement | null;
        const typing =
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable);

        if (!typing) {
          e.preventDefault();
          searchRef.current?.focus();
        }
      }

      if (e.key === "Escape") {
        setSelected(null);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();

    for (const division of divisions) {
      for (const item of division.categories ?? []) {
        if (normalizeText(item)) {
          set.add(normalizeText(item));
        }
      }
    }

    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [divisions]);

  const categoryHighlights = useMemo(
    () => categories.filter((item) => item !== "all").slice(0, 8),
    [categories]
  );

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();

    return [...divisions]
      .filter((division) => (featuredOnly ? division.is_featured : true))
      .filter((division) =>
        statusFilter === "all" ? true : division.status === statusFilter
      )
      .filter((division) =>
        category === "all" ? true : (division.categories ?? []).includes(category)
      )
      .filter((division) => {
        if (!q) return true;

        const extra = getExtras(division);

        const hay = [
          division.name,
          division.key,
          division.tagline ?? "",
          division.description ?? "",
          division.subdomain ?? "",
          division.primary_url ?? "",
          ...(division.categories ?? []),
          ...(division.highlights ?? []),
          ...(extra.who_its_for ?? []),
          ...(extra.how_it_works ?? []),
          ...(extra.trust ?? []),
          extra.lead?.name ?? "",
          extra.lead?.title ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return hay.includes(q);
      })
      .sort((a, b) => Number(a.sort_order ?? 999) - Number(b.sort_order ?? 999));
  }, [divisions, deferredQuery, category, featuredOnly, statusFilter]);

  const featured = useMemo(() => {
    const explicit = [...divisions]
      .filter((division) => division.is_featured)
      .sort((a, b) => Number(a.sort_order ?? 999) - Number(b.sort_order ?? 999));

    if (explicit.length) return explicit.slice(0, 3);

    return [...divisions]
      .filter((division) => division.status === "active")
      .sort((a, b) => Number(a.sort_order ?? 999) - Number(b.sort_order ?? 999))
      .slice(0, 3);
  }, [divisions]);

  const stats = useMemo(
    () => ({
      total: divisions.length,
      active: divisions.filter((division) => division.status === "active").length,
      soon: divisions.filter((division) => division.status === "coming_soon").length,
      sectors: categories.filter((item) => item !== "all").length,
    }),
    [divisions, categories]
  );

  const latestUpdate = useMemo(() => {
    const values = divisions
      .map((division) => division.updated_at)
      .filter(Boolean)
      .map((value) => new Date(String(value)).getTime())
      .filter((value) => !Number.isNaN(value));

    if (!values.length) return "—";
    return formatUpdatedAt(new Date(Math.max(...values)).toISOString(), formatShort);
  }, [divisions, formatShort]);

  const activeFilterCount = useMemo(() => {
    let total = 0;
    if (query.trim()) total += 1;
    if (category !== "all") total += 1;
    if (statusFilter !== "all") total += 1;
    if (featuredOnly) total += 1;
    return total;
  }, [query, category, statusFilter, featuredOnly]);

  const companyLinks = useMemo(
    () => [
      { label: copy.nav.featured, href: "#featured" },
      { label: copy.nav.directory, href: "#divisions" },
      { label: copy.nav.company, href: "#ecosystem" },
      { label: copy.nav.faq, href: "#faq" },
      { label: copy.nav.about, href: "/about" },
      { label: copy.nav.contact, href: "/contact" },
    ],
    [copy.nav]
  );

  const nextPages = useMemo(
    () => [
      { label: copy.companyPages.about, href: "/about" },
      { label: copy.companyPages.contact, href: "/contact" },
      { label: copy.companyPages.privacy, href: "/privacy" },
      { label: copy.companyPages.terms, href: "/terms" },
    ],
    [copy.companyPages]
  );

  const clearAllFilters = () => {
    setQuery("");
    setCategory("all");
    setStatusFilter("all");
    setFeaturedOnly(false);
  };

  const introText = normalizeText(intro) || copy.introDefault;

  const footerText = brandFooterBlurbSafe || introText;

  const spotlightDivision = featured[0] ?? null;
  const spotlightHost = spotlightDivision
    ? domainFromUrl(spotlightDivision.primary_url, spotlightDivision.subdomain)
    : null;

  return (
    <HubChromeContext.Provider value={chrome}>
    <div
      className="relative min-h-screen overflow-x-hidden bg-[#050816] text-white"
      style={{ "--accent": brandAccentSafe } as React.CSSProperties}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* Restrained, architectural backdrop: single accent wash from the top
            corner + a soft horizon glow at the base. Multi-color rainbow has
            been retired for a calmer, premium feel. */}
        <div className="absolute inset-0 bg-[radial-gradient(1100px_580px_at_15%_-5%,rgba(201,162,39,0.18),transparent_60%),radial-gradient(820px_460px_at_50%_108%,rgba(255,255,255,0.05),transparent_60%)]" />
        <div className="absolute inset-0 hidden opacity-30 md:block">
          <HubParticles />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.04)_1px,transparent_0)] [background-size:32px_32px] opacity-50" />
      </div>

      <TopBar
        brandTitle={brandTitleSafe}
        brandSub={brandSubSafe}
        brandAccent={brandAccentSafe}
        brandLogoUrl={brandLogoUrlSafe}
        links={companyLinks}
        accountChip={accountChip}
      />

      <main>
        <section id="top" className="relative overflow-hidden">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-12 pt-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:pt-20">
            <div>
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-xs font-medium text-white/82"
              >
                {brandLogoUrlSafe ? (
                  <BrandMark
                    src={brandLogoUrlSafe}
                    alt={`${brandTitleSafe} logo`}
                    accent={brandAccentSafe}
                    wrapperClassName="h-5 w-5 rounded-full border-white/10 bg-transparent"
                    imageClassName="object-contain p-0.5"
                    iconClassName="h-3.5 w-3.5"
                  />
                ) : (
                  <Sparkles className="h-4 w-4 text-[color:var(--accent)]" />
                )}
                {copy.hero.badgeBefore}
                <b>/</b>
                {copy.hero.badgeAfter}
              </motion.div>

              {heroWelcome ? (
                <motion.p
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.42, delay: 0.02 }}
                  className="mt-4 text-sm font-medium tracking-wide text-white/52"
                >
                  {heroWelcome}
                </motion.p>
              ) : null}

              <motion.h1
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.04 }}
                /* Bounded clamp — cap at ~3.4rem so the headline never
                   eats the viewport. Mobile floor at 1.95rem keeps the
                   320–360px clip fix from V2-HERO-01 intact. */
                style={{
                  fontSize: "clamp(1.95rem, 3.8vw + 0.6rem, 3.4rem)",
                  lineHeight: 1.06,
                  letterSpacing: "-0.022em",
                  wordBreak: "normal",
                  overflowWrap: "break-word",
                  hyphens: "auto",
                }}
                className="mt-6 max-w-4xl text-balance font-semibold text-white"
              >
                {copy.hero.titleBefore}
                <span className="text-[color:var(--accent)]">{brandTitleSafe}</span>
                {copy.hero.titleAfter}
              </motion.h1>

              <motion.p
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08 }}
                className="mt-7 max-w-2xl text-pretty text-base leading-8 text-white/72 sm:text-lg"
              >
                {introText}
              </motion.p>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12 }}
                className="mt-7 flex flex-col gap-3 sm:flex-row"
              >
                <a
                  href="#divisions"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  {copy.hero.ctaExplore}
                  <ArrowRight className="h-4 w-4" />
                </a>

                <a
                  href="#featured"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-5 py-3 text-sm text-white/88 transition hover:bg-white/10"
                >
                  {copy.hero.ctaFeatured}
                  <ChevronRight className="h-4 w-4" />
                </a>
              </motion.div>

              <motion.dl
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.16 }}
                className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-white/10 py-5 sm:flex sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-10"
              >
                <StatCard
                  icon={<Building2 className="h-4 w-4" />}
                  label={copy.stats.divisions}
                  value={`${stats.total}`}
                />
                <StatCard
                  icon={<Zap className="h-4 w-4" />}
                  label={copy.stats.activeNow}
                  value={`${stats.active}`}
                />
                <StatCard
                  icon={<Star className="h-4 w-4" />}
                  label={copy.stats.comingSoon}
                  value={`${stats.soon}`}
                />
                <StatCard
                  icon={<Globe2 className="h-4 w-4" />}
                  label={copy.stats.sectors}
                  value={`${stats.sectors}`}
                />
              </motion.dl>
            </div>

            <motion.aside
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.14 }}
              className="relative space-y-4 lg:pt-2"
            >
              {/* Premium first-card on the landing page hero. The
                  HenryCoHeroCard primitive guarantees mobile-safe typography
                  (clamp + overflow-wrap) and consistent motion across every
                  HenryCo public surface. */}
              <HenryCoHeroCard
                eyebrow={copy.standardCard.eyebrow}
                title={copy.standardCard.title}
                accentVar={brandAccentSafe}
                tone="spotlight"
                brandMark={
                  <BrandMark
                    src={brandLogoUrlSafe}
                    alt={`${brandTitleSafe} logo`}
                    accent={brandAccentSafe}
                    wrapperClassName="h-11 w-11 shrink-0"
                    imageClassName="object-contain p-2"
                    iconClassName="h-5 w-5"
                  />
                }
                bullets={copy.standardCard.bullets}
                rows={[
                  {
                    key: "latestUpdate",
                    icon: <TrendingUp className="h-4 w-4" />,
                    label: copy.standardCard.latestUpdate,
                    value: latestUpdate,
                  },
                  {
                    key: "operatingStandard",
                    icon: <Workflow className="h-4 w-4" />,
                    label: copy.standardCard.operatingStandard,
                    value: copy.standardCard.operatingStandardValue,
                  },
                ]}
              />

              {spotlightDivision ? (
                <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.02] p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                        {copy.standardCard.spotlightEyebrow}
                      </p>
                      <p className="mt-2 text-[1.05rem] font-semibold tracking-tight text-white">
                        {spotlightDivision.name}
                      </p>
                      <p className="mt-2 max-w-md text-sm leading-7 text-white/68">
                        {spotlightDivision.tagline ||
                          spotlightDivision.description ||
                          copy.standardCard.spotlightFallback}
                      </p>
                    </div>

                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-black"
                      style={{
                        background: getAccent(
                          spotlightDivision.accent,
                          brandAccentSafe,
                        ),
                      }}
                    >
                      {copy.standardCard.featured}
                    </span>
                  </div>

                  {(spotlightDivision.categories ?? []).length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(spotlightDivision.categories ?? []).slice(0, 3).map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-medium text-white/72"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <button
                      onClick={() => setSelected(spotlightDivision)}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-transparent px-4 py-2.5 text-sm font-semibold text-white/85 transition outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 active:translate-y-[0.5px] [@media(hover:hover)]:hover:border-white/35 [@media(hover:hover)]:hover:bg-white/[0.04]"
                    >
                      {copy.standardCard.viewDetails}
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    {spotlightDivision.primary_url ? (
                      <button
                        onClick={() => safeOpen(spotlightDivision.primary_url)}
                        className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-black transition outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 active:translate-y-[0.5px] [@media(hover:hover)]:hover:opacity-90"
                        style={{
                          background: getAccent(
                            spotlightDivision.accent,
                            brandAccentSafe,
                          ),
                        }}
                      >
                        {copy.standardCard.visitDivision}
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>

                  {spotlightHost ? (
                    <p className="mt-4 font-mono text-[11px] tracking-tight text-white/45 [overflow-wrap:anywhere]">
                      {spotlightHost}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {hasServerError ? (
                <p className="border-l-2 border-amber-400/55 pl-4 text-sm leading-7 text-white/72">
                  {copy.standardCard.serverError}
                </p>
              ) : null}
            </motion.aside>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3 md:gap-0">
            <PremiumFeature
              icon={<Sparkles className="h-5 w-5" />}
              eyebrow={copy.premiumRow.discovery.eyebrow}
              title={copy.premiumRow.discovery.title}
              text={copy.premiumRow.discovery.text}
            />
            <PremiumFeature
              icon={<Landmark className="h-5 w-5" />}
              eyebrow={copy.premiumRow.corporate.eyebrow}
              title={copy.premiumRow.corporate.title}
              text={copy.premiumRow.corporate.text}
            />
            <PremiumFeature
              icon={<Workflow className="h-5 w-5" />}
              eyebrow={copy.premiumRow.scale.eyebrow}
              title={copy.premiumRow.scale.title}
              text={copy.premiumRow.scale.text}
            />
          </div>
        </section>

        {featured.length ? (
          <section id="featured" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-white/55">
                  <Star className="h-3.5 w-3.5 text-[color:var(--accent)]" />
                  {copy.featuredSection.eyebrow}
                </p>

                <h2 className="mt-4 max-w-2xl text-balance text-[1.7rem] font-semibold leading-[1.15] tracking-[-0.015em] sm:text-[2rem]">
                  {copy.featuredSection.title}
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/68">
                  {copy.featuredSection.body}
                </p>
              </div>

              <a
                href="#divisions"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-transparent px-4 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/35 hover:bg-white/[0.04]"
              >
                {copy.featuredSection.viewDirectory}
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-8 grid gap-5 xl:grid-cols-3">
              {featured.map((division) => (
                <FeaturedDivisionCard key={division.id} division={division} />
              ))}
            </div>
          </section>
        ) : null}

        <section id="divisions" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-white/55">
                <Search className="h-3.5 w-3.5 text-[color:var(--accent)]" />
                {copy.directory.eyebrow}
              </p>

              <h2 className="mt-4 max-w-md text-balance text-[1.7rem] font-semibold leading-[1.15] tracking-[-0.015em] sm:text-[2rem]">
                {copy.directory.title}
              </h2>

              <p className="mt-3 max-w-md text-sm leading-7 text-white/68">
                {copy.directory.body}
              </p>

              <div className="mt-7 space-y-5">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={copy.directory.searchPlaceholder}
                    className="h-14 w-full rounded-2xl border border-white/12 bg-black/30 pl-11 pr-12 text-sm text-white outline-none placeholder:text-white/30 focus:border-[color:var(--accent)]"
                  />
                  {query ? (
                    <button
                      onClick={() => setQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/65 hover:bg-white/10 hover:text-white"
                      aria-label={copy.directory.clearSearchAria}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                {query !== deferredQuery ? (
                  <div className="text-xs text-white/55">Searching...</div>
                ) : null}

                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-white/88 transition hover:bg-white/10"
                >
                  Search HenryCo workflows and help
                  <ArrowRight className="h-4 w-4" />
                </Link>

                {categoryHighlights.length ? (
                  <div>
                    <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-white/45">
                      {copy.directory.popularSectors}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {categoryHighlights.map((item) => (
                        <button
                          key={item}
                          onClick={() => setCategory(item)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs transition",
                            category === item
                              ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-black"
                              : "border-white/12 bg-white/[0.06] text-white/74 hover:bg-white/10"
                          )}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => setFeaturedOnly((value) => !value)}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm transition",
                      featuredOnly
                        ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-black"
                        : "border-white/12 bg-white/[0.06] text-white/78 hover:bg-white/10"
                    )}
                  >
                    <BadgeCheck className="h-4 w-4" />
                    {featuredOnly ? copy.directory.featuredOn : copy.directory.featuredOff}
                  </button>

                  <div className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-3 py-3 text-sm text-white/78">
                    <Filter className="h-4 w-4 text-[color:var(--accent)]" />
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-transparent outline-none"
                    >
                      {categories.map((item) => (
                        <option
                          key={item}
                          value={item}
                          className="bg-[#0B1020] text-white"
                        >
                          {item === "all" ? copy.directory.allCategories : item}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: copy.directory.filterAll },
                    { value: "active", label: copy.directory.filterActive },
                    { value: "coming_soon", label: copy.directory.filterSoon },
                    { value: "paused", label: copy.directory.filterPaused },
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setStatusFilter(item.value as StatusFilter)}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
                        statusFilter === item.value
                          ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-black"
                          : "border-white/12 bg-white/[0.06] text-white/75 hover:bg-white/10"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-7 grid grid-cols-3 gap-x-6 gap-y-5 border-y border-white/10 py-5">
                <DirectoryMiniStat label={copy.directory.showing} value={String(filtered.length)} />
                <DirectoryMiniStat label={copy.directory.total} value={String(divisions.length)} />
                <DirectoryMiniStat label={copy.directory.featured} value={String(featured.length)} />
              </div>

              <div className="mt-7">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                    {copy.directory.overviewEyebrow}
                  </p>
                  {activeFilterCount ? (
                    <button
                      onClick={clearAllFilters}
                      className="text-[11px] font-semibold text-white/70 underline-offset-4 transition hover:text-white hover:underline"
                    >
                      {copy.directory.clearAll}
                    </button>
                  ) : (
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-emerald-300/85">
                      {copy.directory.ready}
                    </span>
                  )}
                </div>

                <dl className="mt-3 divide-y divide-white/10 border-y border-white/10 text-sm">
                  <div className="flex items-baseline justify-between gap-3 py-3 text-white/72">
                    <dt>{copy.directory.activeRefinements}</dt>
                    <dd className="font-semibold text-white">{activeFilterCount}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 py-3 text-white/72">
                    <dt>{copy.directory.lastUpdated}</dt>
                    <dd className="font-semibold text-white">{latestUpdate}</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-7">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                  {copy.directory.companyPagesEyebrow}
                </p>
                <ul className="mt-3 divide-y divide-white/10 border-y border-white/10">
                  {nextPages.map((page) => (
                    <li key={page.href}>
                      <a
                        href={page.href}
                        className="group flex items-center justify-between gap-3 py-3 text-sm font-medium text-white/82 transition hover:text-white"
                      >
                        <span>{page.label}</span>
                        <ChevronRight className="h-4 w-4 text-white/45 transition group-hover:translate-x-0.5 group-hover:text-white" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {filtered.length ? (
                filtered.map((division) => (
                  <DivisionCard
                    key={division.id}
                    d={division}
                    onOpen={() => setSelected(division)}
                  />
                ))
              ) : (
                <div className="border-l-2 border-[color:var(--accent)]/55 px-6 py-8 text-sm leading-7 text-white/68 sm:col-span-2">
                  {copy.directory.empty}
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="ecosystem" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-white/55">
                <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--accent)]" />
                {copy.ecosystem.eyebrow}
              </p>

              <h2 className="mt-4 max-w-md text-balance text-[1.7rem] font-semibold leading-[1.15] tracking-[-0.015em] sm:text-[2rem]">
                {copy.ecosystem.title}
              </h2>

              <p className="mt-3 max-w-md text-sm leading-7 text-white/68">
                {copy.ecosystem.body}
              </p>

              <ul className="mt-7 divide-y divide-white/10 border-y border-white/10">
                {copy.ecosystem.bullets.map((item) => (
                  <li key={item} className="flex gap-3 py-3 text-sm leading-7 text-white/75">
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[color:var(--accent)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <BigFeature
                icon={<Building2 className="h-5 w-5" />}
                title={copy.ecosystem.big[0]}
                text={copy.ecosystem.bigText[0]}
              />
              <BigFeature
                icon={<Landmark className="h-5 w-5" />}
                title={copy.ecosystem.big[1]}
                text={copy.ecosystem.bigText[1]}
              />
              <BigFeature
                icon={<Zap className="h-5 w-5" />}
                title={copy.ecosystem.big[2]}
                text={copy.ecosystem.bigText[2]}
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
          <div className="grid gap-10 border-t border-white/10 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-white/55">
                <Workflow className="h-3.5 w-3.5 text-[color:var(--accent)]" />
                {copy.access.eyebrow}
              </p>

              <h2 className="mt-4 max-w-2xl text-balance text-[1.7rem] font-semibold leading-[1.15] tracking-[-0.015em] sm:text-[2rem]">
                {copy.access.title}
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/68">
                {copy.access.body}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="/about"
                  className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:opacity-90"
                >
                  {copy.access.ctaPages}
                  <ArrowRight className="h-4 w-4" />
                </a>

                <a
                  href="#divisions"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-transparent px-5 py-3 text-sm font-semibold text-white/85 transition hover:border-white/35 hover:bg-white/[0.04]"
                >
                  {copy.access.ctaDirectory}
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            <dl className="divide-y divide-white/10 border-y border-white/10">
              <div className="flex items-baseline gap-3 py-3">
                <Layers3 className="h-3.5 w-3.5 text-[color:var(--accent)]" />
                <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                  {copy.access.cards[0]}
                </dt>
                <dd className="ml-auto text-right text-sm font-semibold tracking-tight text-white">
                  {copy.access.cardValues[0]}
                </dd>
              </div>
              <div className="flex items-baseline gap-3 py-3">
                <TrendingUp className="h-3.5 w-3.5 text-[color:var(--accent)]" />
                <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                  {copy.access.cards[1]}
                </dt>
                <dd className="ml-auto text-right text-sm font-semibold tracking-tight text-white">
                  {copy.access.cardValues[1]}
                </dd>
              </div>
              <div className="flex items-baseline gap-3 py-3">
                <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--accent)]" />
                <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
                  {copy.access.cards[2]}
                </dt>
                <dd className="ml-auto text-right text-sm font-semibold tracking-tight text-white">
                  {copy.access.cardValues[2]}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.85fr,1.15fr]">
            <div>
              <p className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-white/55">
                <Globe2 className="h-3.5 w-3.5 text-[color:var(--accent)]" />
                {copy.faq.eyebrow}
              </p>

              <h2 className="mt-4 max-w-sm text-balance text-[1.7rem] font-semibold leading-[1.15] tracking-[-0.015em] sm:text-[2rem]">
                {copy.faq.title}
              </h2>

              <p className="mt-3 max-w-md text-sm leading-7 text-white/68">
                {copy.faq.subtitle}
              </p>
            </div>

            <div className="border-t border-white/10">
              {faqItems.map((item) => (
                <Faq key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <PageFooter
        brandTitle={brandTitleSafe}
        brandSub={brandSubSafe}
        brandAccent={brandAccentSafe}
        brandLogoUrl={brandLogoUrlSafe}
        footerText={footerText}
        companyLinks={companyLinks}
        nextPages={nextPages}
      />

      <AnimatePresence>
        {selected ? (
          <DetailsModal
            division={selected}
            onClose={() => setSelected(null)}
            reduceMotion={Boolean(reduceMotion)}
          />
        ) : null}
      </AnimatePresence>
    </div>
    </HubChromeContext.Provider>
  );
}

function TopBar({
  brandTitle,
  brandSub,
  brandAccent,
  brandLogoUrl,
  links,
  accountChip,
}: {
  brandTitle: string;
  brandSub: string;
  brandAccent: string;
  brandLogoUrl?: string | null;
  links: { label: string; href: string }[];
  accountChip?: {
    user: PublicAccountUser | null;
    loginHref: string;
    signupHref: string;
    accountHref: string;
  };
}) {
  const { copy } = useHubChrome();
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050816]/93 backdrop-blur-0 md:backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-3">
            <BrandMark
              src={brandLogoUrl}
              alt={`${brandTitle} logo`}
              accent={brandAccent}
              wrapperClassName="h-11 w-11"
              imageClassName="object-contain p-2"
              iconClassName="h-5 w-5"
            />

            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-[0.18em] text-white/90">
                {brandTitle}
              </div>
              <div className="text-[11px] uppercase tracking-[0.26em] text-white/45">
                {brandSub}
              </div>
            </div>
          </a>

          <nav className="hidden items-center gap-6 text-sm text-white/68 lg:flex">
            {links.slice(0, 4).map((link) => (
              <a key={link.href} href={link.href} className="transition hover:text-white">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {accountChip ? (
              <PublicAccountChip
                {...HenryCoPublicAccountPresets.onDarkMarketing}
                user={accountChip.user}
                loginHref={accountChip.loginHref}
                signupHref={accountChip.signupHref}
                accountHref={accountChip.accountHref}
                preferencesHref={getAccountUrl("/settings")}
                settingsHref={getAccountUrl("/security")}
                showSignOut
                menuItems={[
                  { label: copy.nav.directory, href: "/#divisions" },
                  { label: copy.nav.about, href: "/about" },
                  { label: copy.nav.contact, href: "/contact" },
                ]}
              />
            ) : null}
            <div className="hidden items-center gap-3 sm:flex">
              <Link
                href="/search"
                className="rounded-xl border border-white/12 bg-white/[0.06] px-3.5 py-2 text-sm text-white/88 transition hover:bg-white/10"
              >
                {copy.topBar.search}
              </Link>
              <a
                href="#divisions"
                className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--accent)] px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
              >
                {copy.topBar.explore}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="border-b border-white/8 bg-black/15 lg:hidden">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs text-white/78 transition hover:bg-white/10"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}

function PageFooter({
  brandTitle,
  brandSub,
  brandAccent,
  brandLogoUrl,
  footerText,
  companyLinks,
  nextPages,
}: {
  brandTitle: string;
  brandSub: string;
  brandAccent: string;
  brandLogoUrl?: string | null;
  footerText: string;
  companyLinks: { label: string; href: string }[];
  nextPages: { label: string; href: string }[];
}) {
  const { copy } = useHubChrome();
  return (
    <footer className="mt-16 border-t border-white/10 bg-black/20">
      <div
        aria-hidden
        className="pointer-events-none mx-auto h-px max-w-7xl bg-gradient-to-r from-transparent via-amber-300/35 to-transparent"
      />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <BrandMark
              src={brandLogoUrl}
              alt={`${brandTitle} logo`}
              accent={brandAccent}
              wrapperClassName="h-10 w-10"
              imageClassName="object-contain p-2"
              iconClassName="h-5 w-5"
            />
            <div>
              <div className="text-sm font-semibold tracking-[0.18em] text-white/90">
                {brandTitle}
              </div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-white/45">
                {brandSub}
              </div>
            </div>
          </div>

          <p className="max-w-md text-sm leading-7 text-white/62">{footerText}</p>
        </div>

        <FooterColumn title={copy.footer.colHub} links={companyLinks} />
        <FooterColumn title={copy.footer.colGlobal} links={nextPages} />
      </div>

      <div className="border-t border-white/10 px-4 py-5 text-xs text-white/45 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>© {new Date().getFullYear()} {brandTitle}. All rights reserved.</span>
            <a
              href="/privacy"
              className="text-white/55 transition hover:text-white"
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="text-white/55 transition hover:text-white"
            >
              Terms
            </a>
            <a
              href="/preferences"
              className="text-white/55 transition hover:text-white"
            >
              Preferences
            </a>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
            <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-amber-300/85" />
            Designed and built in-house by HenryCo Studio for the HenryCo ecosystem
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
        {title}
      </div>
      <div className="mt-4 grid gap-2">
        {links.map((item) => (
          <a
            key={`${item.label}-${item.href}`}
            href={item.href}
            className="text-sm text-white/68 transition hover:text-white"
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/52">
        <span className="text-[color:var(--accent)]">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="text-[1.6rem] font-semibold leading-tight tracking-tight text-white sm:text-[1.8rem]">
        {value}
      </div>
    </div>
  );
}

function GlassMiniCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-baseline gap-3 border-b border-white/10 py-3 last:border-b-0">
      <span className="text-[color:var(--accent)]">{icon}</span>
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
        {label}
      </span>
      <span className="ml-auto text-right text-sm font-semibold tracking-tight text-white">
        {value}
      </span>
    </div>
  );
}

function DirectoryMiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/50">
        {label}
      </div>
      <div className="text-[1.25rem] font-semibold leading-tight tracking-tight text-white">
        {value}
      </div>
    </div>
  );
}

function PremiumFeature({
  eyebrow,
  title,
  text,
  icon,
}: {
  eyebrow: string;
  title: string;
  text: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="border-t border-white/10 pt-6 md:border-l md:border-t-0 md:pl-6 md:pt-0 md:first:border-l-0 md:first:pl-0">
      <span className="text-[color:var(--accent)]">{icon}</span>
      <div className="mt-4 text-[10.5px] font-semibold uppercase tracking-[0.24em] text-white/55">
        {eyebrow}
      </div>
      <h3 className="mt-2 text-base font-semibold tracking-tight text-white">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-white/68">{text}</p>
    </div>
  );
}

function BigFeature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-5 border-b border-white/10 py-6 last:border-b-0">
      <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 text-[color:var(--accent)]">
        {icon}
      </span>
      <div>
        <h3 className="text-base font-semibold tracking-tight text-white">{title}</h3>
        <p className="mt-1.5 text-sm leading-7 text-white/68">{text}</p>
      </div>
    </div>
  );
}

function FeaturedDivisionCard({ division }: { division: DivisionRow }) {
  const { copy } = useHubChrome();
  const host = domainFromUrl(division.primary_url, division.subdomain);
  const extra = getExtras(division);
  const accent = getAccent(division.accent);

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-[1.8rem] border border-white/10 bg-[rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-1 hover:border-white/22"
      style={{ "--cardAccent": accent } as React.CSSProperties}
    >
      {extra.cover_url ? (
        <div className="relative h-44 overflow-hidden">
          <img
            src={extra.cover_url}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(5,8,22,0.78)] via-[rgba(5,8,22,0.16)] to-transparent" />
        </div>
      ) : (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-70"
          style={{
            background: `radial-gradient(650px 160px at 50% 0%, ${accent}38, transparent 72%)`,
          }}
        />
      )}

      <div className="relative flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]",
                getStatusTone(division.status),
              )}
            >
              <Star className="h-3 w-3" />
              {getStatusLabel(division.status, copy.status)}
            </span>

            <h3 className="mt-4 text-[1.4rem] font-semibold leading-tight tracking-[-0.015em] text-white sm:text-[1.55rem]">
              {division.name}
            </h3>

            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/68">
              {division.description ||
                division.tagline ||
                copy.cards.divisionFallbackLong}
            </p>
          </div>

          <DivisionMark
            src={extra.logo_url}
            alt={`${division.name} logo`}
            accent={accent}
            wrapperClassName="h-12 w-12 shrink-0 rounded-2xl border-0"
            imageClassName="rounded-2xl object-contain p-2"
          />
        </div>

        {(division.categories ?? []).length ? (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {(division.categories ?? []).slice(0, 3).map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/15 px-2.5 py-1 text-[10.5px] font-medium text-white/72"
              >
                {item}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-6 flex items-end justify-between gap-3 border-t border-white/10 pt-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/50">
              {copy.cards.destination}
            </p>
            <p className="mt-1 truncate font-mono text-[12px] tracking-tight text-white/82">
              {host ?? copy.cards.notConfigured}
            </p>
          </div>
          <button
            onClick={() => safeOpen(division.primary_url)}
            disabled={!division.primary_url}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition",
              division.primary_url
                ? "bg-[color:var(--cardAccent)] text-black hover:-translate-y-0.5 hover:opacity-95"
                : "cursor-not-allowed border border-white/10 text-white/35",
            )}
          >
            {copy.cards.openDivision}
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

function DivisionCard({
  d,
  onOpen,
}: {
  d: DivisionRow;
  onOpen: () => void;
}) {
  const { copy } = useHubChrome();
  const host = domainFromUrl(d.primary_url, d.subdomain);
  const extra = getExtras(d);
  const accent = getAccent(d.accent);

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-[1.8rem] border border-white/10 bg-[rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-1 hover:border-white/22"
      style={{ "--cardAccent": accent } as React.CSSProperties}
    >
      {extra.cover_url ? (
        <div className="relative h-40 overflow-hidden">
          <img
            src={extra.cover_url}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(5,8,22,0.72)] via-[rgba(5,8,22,0.14)] to-transparent" />
        </div>
      ) : (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-70"
          style={{
            background: `radial-gradient(650px 150px at 50% 0%, ${accent}32, transparent 72%)`,
          }}
        />
      )}

      <div className="relative flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <DivisionMark
              src={extra.logo_url}
              alt={`${d.name} logo`}
              accent={accent}
              wrapperClassName="h-11 w-11 shrink-0"
              imageClassName="rounded-xl object-contain p-1.5"
            />
            <div className="min-w-0">
              <h3 className="truncate text-[1.1rem] font-semibold tracking-tight text-white">
                {d.name}
              </h3>
              <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                {(d.categories ?? []).join(" · ") || d.key}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]",
                getStatusTone(d.status),
              )}
            >
              <Zap className="h-3 w-3" />
              {getStatusLabel(d.status, copy.status)}
            </span>
            {d.is_featured ? (
              <span
                className="rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.22em] text-black"
                style={{ background: accent }}
              >
                {copy.cards.featured}
              </span>
            ) : null}
          </div>
        </div>

        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-white/72">
          {d.description || d.tagline || copy.cards.divisionFallbackShort}
        </p>

        {(d.highlights ?? []).length ? (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {(d.highlights ?? []).slice(0, 3).map((item) => (
              <li
                key={item}
                className="rounded-full border border-white/15 px-2.5 py-1 text-[10.5px] font-medium text-white/72"
              >
                {item}
              </li>
            ))}
          </ul>
        ) : null}

        <dl className="mt-5 divide-y divide-white/10 border-y border-white/10">
          <div className="flex items-baseline gap-3 py-3">
            <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/50">
              {copy.cards.divisionDestination}
            </dt>
            <dd className="ml-auto truncate text-right font-mono text-[12px] tracking-tight text-white/82">
              {host ?? copy.cards.notConfigured}
            </dd>
          </div>
          {extra.lead?.name ? (
            <div className="flex items-baseline gap-3 py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/50">
                {copy.cards.lead}
              </dt>
              <dd className="ml-auto truncate text-right text-sm font-semibold tracking-tight text-white">
                {extra.lead.name}
                {extra.lead.title ? (
                  <span className="ml-1 font-normal text-white/55">· {extra.lead.title}</span>
                ) : null}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <button
            onClick={onOpen}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-transparent px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/[0.04]"
          >
            {copy.cards.details}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => safeOpen(d.primary_url)}
            disabled={!d.primary_url}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition",
              d.primary_url
                ? "text-black hover:-translate-y-0.5 hover:opacity-95"
                : "cursor-not-allowed border border-white/10 text-white/35",
            )}
            style={d.primary_url ? { background: accent } : undefined}
          >
            {copy.cards.open}
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

function DetailsModal({
  division,
  onClose,
  reduceMotion,
}: {
  division: DivisionRow;
  onClose: () => void;
  reduceMotion: boolean;
}) {
  const { copy, formatLong } = useHubChrome();
  const host = domainFromUrl(division.primary_url, division.subdomain);
  const extra = getExtras(division);
  const links = Array.isArray(extra.links) ? extra.links : [];
  const whoItsFor = Array.isArray(extra.who_its_for) ? extra.who_its_for : [];
  const howItWorks = Array.isArray(extra.how_it_works) ? extra.how_it_works : [];
  const trustItems = Array.isArray(extra.trust) ? extra.trust : [];
  const accent = getAccent(division.accent);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 30);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const root = panelRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      previouslyFocusedRef.current?.focus?.();
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-md sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <motion.div
        ref={panelRef}
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] border border-white/10 bg-[#0B1020] text-white shadow-[0_40px_140px_rgba(0,0,0,0.45)] sm:max-h-[88dvh] sm:max-w-4xl sm:rounded-[34px]"
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.985 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.985 }}
      >
        {/* Sticky header — close button always visible */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-[#0B1020]/95 px-4 py-3 backdrop-blur-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: accent }}
            />
            <h2
              id={titleId}
              className="truncate text-base font-semibold tracking-tight text-white sm:text-[1.05rem]"
            >
              {division.name}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            type="button"
            className="rounded-full border border-white/10 bg-white/[0.06] p-2 text-white/80 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
            aria-label={copy.modal.closeAria}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: "touch" as const }}
        >
        {extra.cover_url ? (
          <div className="h-44 overflow-hidden border-b border-white/10 sm:h-52">
            <img
              src={extra.cover_url}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : null}

        <div
          className="relative p-6 sm:p-8"
          style={{
            background: `radial-gradient(900px 320px at 18% 0%, ${accent}35, transparent 60%), radial-gradient(800px 220px at 82% 12%, rgba(255,255,255,0.12), transparent 60%)`,
          }}
        >
          <div className="flex items-start gap-4">
            <DivisionMark
              src={extra.logo_url}
              alt={`${division.name} logo`}
              accent={accent}
              wrapperClassName="h-14 w-14 border-0"
              imageClassName="rounded-2xl object-contain p-2"
            />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-2xl font-semibold tracking-tight">{division.name}</div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                    getStatusTone(division.status)
                  )}
                >
                  <Zap className="h-3.5 w-3.5" />
                  {getStatusLabel(division.status, copy.status)}
                </span>
              </div>

              <div className="mt-2 text-sm text-white/66">
                {division.tagline ?? host ?? division.key}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(division.categories ?? []).map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/12 bg-white/[0.06] px-2.5 py-1 text-[11px] text-white/75"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:p-8">
          {division.description ? (
            <p className="text-sm leading-7 text-white/72">{division.description}</p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <MiniKPI label={copy.modal.kpiStatus} value={getStatusLabel(division.status, copy.status)} />
            <MiniKPI label={copy.modal.kpiSubdomain} value={host ?? "—"} />
            <MiniKPI
              label={copy.modal.kpiFeatured}
              value={division.is_featured ? copy.modal.kpiYes : copy.modal.kpiNo}
            />
            <MiniKPI
              label={copy.modal.kpiUpdated}
              value={formatUpdatedAtLong(division.updated_at, formatLong)}
            />
          </div>

          {(whoItsFor.length || howItWorks.length || trustItems.length) && (
            <div className="grid gap-4 lg:grid-cols-3">
              {whoItsFor.length ? (
                <InsightList title={copy.modal.who} items={whoItsFor.slice(0, 6)} />
              ) : null}

              {howItWorks.length ? (
                <InsightList title={copy.modal.how} items={howItWorks.slice(0, 6)} />
              ) : null}

              {trustItems.length ? (
                <InsightList title={copy.modal.trust} items={trustItems.slice(0, 6)} />
              ) : null}
            </div>
          )}

          {division.highlights?.length ? (
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">
                {copy.modal.highlights}
              </p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {division.highlights.slice(0, 10).map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-white/15 px-2.5 py-1 text-[10.5px] font-medium text-white/74"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {extra.lead?.name ? (
            <div className="border-l-2 border-[color:var(--accent)]/55 pl-5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">
                {copy.modal.leadEyebrow}
              </p>
              <p className="mt-3 text-[1.05rem] font-semibold tracking-tight text-white">
                {extra.lead.name}
              </p>
              <p className="mt-1 text-sm text-white/68">
                {extra.lead.title ?? copy.modal.leadFallbackTitle}
              </p>
            </div>
          ) : null}

          {links.length ? (
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">
                {copy.modal.links}
              </p>
              <ul className="mt-3 divide-y divide-white/10 border-y border-white/10">
                {links.slice(0, 8).map((link, index) => (
                  <li key={`${link.url}-${index}`}>
                    <button
                      onClick={() => safeOpen(link.url)}
                      className="group flex w-full items-center justify-between gap-3 py-3 text-left transition hover:bg-white/[0.02]"
                    >
                      <span className="text-sm font-semibold text-white">{link.label}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-white/45 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        </div>

        {/* Sticky bottom CTA — never hidden by iOS home indicator */}
        {division.primary_url ? (
          <div
            className="sticky bottom-0 z-10 border-t border-white/10 bg-[#0B1020]/95 backdrop-blur-sm"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <div className="min-w-0 text-xs text-white/60 sm:text-sm">
                {host ?? division.key}
              </div>
              <button
                onClick={() => safeOpen(division.primary_url)}
                type="button"
                className="inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/40"
                style={{ background: accent }}
              >
                {copy.modal.enterDivision}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </motion.div>
    </motion.div>
  );
}

function InsightList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">
        {title}
      </p>
      <ul className="mt-3 divide-y divide-white/10 border-y border-white/10">
        {items.map((item) => (
          <li key={item} className="py-2.5 text-sm leading-relaxed text-white/75">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MiniKPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/50">
        {label}
      </div>
      <div className="text-sm font-semibold tracking-tight text-white">{value}</div>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-b border-white/10 py-5 last:border-b-0">
      <summary className="cursor-pointer list-none">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-[1.05rem] font-semibold leading-snug tracking-tight text-white">
            {q}
          </h3>
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-white/55 transition duration-200 group-open:rotate-90 group-open:text-white" />
        </div>
      </summary>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-white/68">{a}</p>
    </details>
  );
}
