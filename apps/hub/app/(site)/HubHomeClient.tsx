"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
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
import { cn, PublicAccountChip } from "@henryco/ui";
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

function BrandMark({
  src,
  alt,
  accent,
  wrapperClassName,
  imageClassName,
  iconClassName,
}: {
  src?: string | null;
  alt: string;
  accent: string;
  wrapperClassName?: string;
  imageClassName?: string;
  iconClassName?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const cleanSrc = normalizeImageUrl(src);
  const isFailed = Boolean(cleanSrc && failedSrc === cleanSrc);

  return (
    <div
      className={cn(
        "grid place-items-center overflow-hidden rounded-2xl border border-white/12 bg-white/[0.06]",
        wrapperClassName
      )}
    >
      {cleanSrc && !isFailed ? (
        <img
          src={cleanSrc}
          alt={alt}
          className={cn("h-full w-full object-contain", imageClassName)}
          loading="eager"
          decoding="async"
          onLoad={() => setFailedSrc(null)}
          onError={() => {
            if (cleanSrc) {
              setFailedSrc(cleanSrc);
            }
          }}
        />
      ) : (
        <Layers3
          className={cn("text-[color:var(--accent)]", iconClassName)}
          style={{ color: accent }}
        />
      )}
    </div>
  );
}

function DivisionMark({
  src,
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
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const cleanSrc = normalizeImageUrl(src);
  const safeAccent = getAccent(accent);
  const isFailed = Boolean(cleanSrc && failedSrc === cleanSrc);

  return (
    <div
      className={cn(
        "grid place-items-center overflow-hidden rounded-2xl border border-white/12 bg-black/25",
        wrapperClassName
      )}
      style={!cleanSrc || isFailed ? { background: safeAccent } : undefined}
    >
      {cleanSrc && !isFailed ? (
        <img
          src={cleanSrc}
          alt={alt}
          className={cn("h-full w-full object-contain", imageClassName)}
          loading="lazy"
          decoding="async"
          onLoad={() => setFailedSrc(null)}
          onError={() => {
            if (cleanSrc) {
              setFailedSrc(cleanSrc);
            }
          }}
        />
      ) : (
        <Building2 className="h-5 w-5 text-black" />
      )}
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
    const q = query.trim().toLowerCase();

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
  }, [divisions, query, category, featuredOnly, statusFilter]);

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
        <div className="absolute inset-0 bg-[radial-gradient(1200px_620px_at_18%_8%,rgba(201,162,39,0.22),transparent_55%),radial-gradient(1000px_620px_at_82%_18%,rgba(59,130,246,0.15),transparent_58%),radial-gradient(900px_520px_at_50%_100%,rgba(168,85,247,0.12),transparent_55%)]" />
        <div className="absolute inset-0 opacity-60">
          <HubParticles />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:26px_26px] opacity-30" />
        <div className="absolute left-1/2 top-[-220px] h-[680px] w-[980px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
      </div>

      <TopBar
        brandTitle={brandTitleSafe}
        brandSub={brandSubSafe}
        brandAccent={brandAccentSafe}
        brandLogoUrl={brandLogoUrlSafe}
        searchRef={searchRef}
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
                className="mt-6 max-w-5xl text-4xl font-semibold leading-[0.96] tracking-tight text-white sm:text-6xl xl:text-7xl"
              >
                {copy.hero.titleBefore}
                <span className="bg-gradient-to-r from-[color:var(--accent)] via-white to-white/70 bg-clip-text text-transparent">
                  {brandTitleSafe}
                </span>
                {copy.hero.titleAfter}
              </motion.h1>

              <motion.p
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08 }}
                className="mt-6 max-w-3xl text-base leading-8 text-white/68 sm:text-lg"
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

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.14 }}
                className="mt-8 rounded-[30px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <BrandMark
                    src={brandLogoUrlSafe}
                    alt={`${brandTitleSafe} logo`}
                    accent={brandAccentSafe}
                    wrapperClassName="h-16 w-16 rounded-[22px] border-white/12 bg-black/20"
                    imageClassName="object-contain p-2.5"
                    iconClassName="h-7 w-7"
                  />

                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                      {copy.brandPanel.eyebrow}
                    </div>
                    <div className="mt-2 text-xl font-semibold tracking-tight text-white">
                      {brandTitleSafe}
                    </div>
                    <div className="mt-1 text-sm text-white/62">{brandSubSafe}</div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <DirectoryMiniStat
                    label={copy.brandPanel.baseDomain}
                    value={normalizeText(process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com")
                      .replace(/^https?:\/\//i, "")
                      .replace(/\/+$/, "")}
                  />
                  <DirectoryMiniStat label={copy.brandPanel.accent} value={brandAccentSafe} />
                  <DirectoryMiniStat
                    label={copy.brandPanel.logoStatus}
                    value={
                      brandLogoUrlSafe ? copy.brandPanel.logoConfigured : copy.brandPanel.logoFallback
                    }
                  />
                </div>
              </motion.div>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.16 }}
                className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
              >
                <StatCard
                  icon={<Building2 className="h-5 w-5" />}
                  label={copy.stats.divisions}
                  value={`${stats.total}`}
                />
                <StatCard
                  icon={<Zap className="h-5 w-5" />}
                  label={copy.stats.activeNow}
                  value={`${stats.active}`}
                />
                <StatCard
                  icon={<Star className="h-5 w-5" />}
                  label={copy.stats.comingSoon}
                  value={`${stats.soon}`}
                />
                <StatCard
                  icon={<Globe2 className="h-5 w-5" />}
                  label={copy.stats.sectors}
                  value={`${stats.sectors}`}
                />
              </motion.div>
            </div>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.14 }}
              className="relative overflow-hidden rounded-[34px] border border-white/12 bg-white/[0.06] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.32)] backdrop-blur-xl"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.14),transparent_35%),radial-gradient(circle_at_85%_18%,rgba(255,255,255,0.08),transparent_28%)]" />

              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                      {copy.standardCard.eyebrow}
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                      {copy.standardCard.title}
                    </h2>
                  </div>

                  <BrandMark
                    src={brandLogoUrlSafe}
                    alt={`${brandTitleSafe} logo`}
                    accent={brandAccentSafe}
                    wrapperClassName="h-12 w-12"
                    imageClassName="object-contain p-2"
                    iconClassName="h-5 w-5"
                  />
                </div>

                <div className="mt-6 grid gap-3">
                  {copy.standardCard.bullets.map((line) => (
                    <div
                      key={line}
                      className="flex gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/72"
                    >
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--accent)]" />
                      <span>{line}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <GlassMiniCard
                    icon={<TrendingUp className="h-4 w-4" />}
                    label={copy.standardCard.latestUpdate}
                    value={latestUpdate}
                  />
                  <GlassMiniCard
                    icon={<Workflow className="h-4 w-4" />}
                    label={copy.standardCard.operatingStandard}
                    value={copy.standardCard.operatingStandardValue}
                  />
                </div>

                {spotlightDivision ? (
                  <div className="mt-6 rounded-[28px] border border-white/10 bg-black/25 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                          {copy.standardCard.spotlightEyebrow}
                        </div>
                        <div className="mt-2 text-lg font-semibold text-white">
                          {spotlightDivision.name}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-white/64">
                          {spotlightDivision.tagline ||
                            spotlightDivision.description ||
                            copy.standardCard.spotlightFallback}
                        </p>
                      </div>

                      <span
                        className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-black"
                        style={{
                          background: getAccent(
                            spotlightDivision.accent,
                            brandAccentSafe
                          ),
                        }}
                      >
                        {copy.standardCard.featured}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {(spotlightDivision.categories ?? []).slice(0, 3).map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] text-white/74"
                        >
                          {item}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        onClick={() => setSelected(spotlightDivision)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white/88 transition hover:bg-white/10"
                      >
                        {copy.standardCard.viewDetails}
                        <ChevronRight className="h-4 w-4" />
                      </button>

                      {spotlightDivision.primary_url ? (
                        <button
                          onClick={() => safeOpen(spotlightDivision.primary_url)}
                          className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                          style={{
                            background: getAccent(
                              spotlightDivision.accent,
                              brandAccentSafe
                            ),
                          }}
                        >
                          {copy.standardCard.visitDivision}
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>

                    {spotlightHost ? (
                      <div className="mt-4 text-xs text-white/48">{spotlightHost}</div>
                    ) : null}
                  </div>
                ) : null}

                {hasServerError ? (
                  <div className="mt-5 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                    {copy.standardCard.serverError}
                  </div>
                ) : null}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
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
            <div className="rounded-[36px] border border-white/10 bg-white/[0.06] p-6 shadow-[0_24px_100px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/58">
                    <Star className="h-3.5 w-3.5 text-[color:var(--accent)]" />
                    {copy.featuredSection.eyebrow}
                  </div>

                  <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                    {copy.featuredSection.title}
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-7 text-white/64">
                    {copy.featuredSection.body}
                  </p>
                </div>

                <a
                  href="#divisions"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-white/88 transition hover:bg-white/10"
                >
                  {copy.featuredSection.viewDirectory}
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>

              <div className="mt-6 grid gap-5 xl:grid-cols-3">
                {featured.map((division) => (
                  <FeaturedDivisionCard key={division.id} division={division} />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section id="divisions" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-[34px] border border-white/10 bg-white/[0.06] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/58">
                <Search className="h-3.5 w-3.5 text-[color:var(--accent)]" />
                {copy.directory.eyebrow}
              </div>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                {copy.directory.title}
              </h2>

              <p className="mt-3 text-sm leading-7 text-white/64">
                {copy.directory.body}
              </p>

              <div className="mt-6 space-y-4">
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

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <DirectoryMiniStat label={copy.directory.showing} value={String(filtered.length)} />
                <DirectoryMiniStat label={copy.directory.total} value={String(divisions.length)} />
                <DirectoryMiniStat label={copy.directory.featured} value={String(featured.length)} />
              </div>

              <div className="mt-6 rounded-[28px] border border-white/10 bg-black/25 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                    {copy.directory.overviewEyebrow}
                  </div>

                  {activeFilterCount ? (
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-white/70 transition hover:text-white"
                    >
                      {copy.directory.clearAll}
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-300">{copy.directory.ready}</span>
                  )}
                </div>

                <div className="mt-4 space-y-2 text-sm text-white/72">
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <span>{copy.directory.activeRefinements}</span>
                    <span className="font-semibold text-white">{activeFilterCount}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <span>{copy.directory.lastUpdated}</span>
                    <span className="font-semibold text-white">{latestUpdate}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[28px] border border-white/10 bg-black/25 p-5">
                <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                  {copy.directory.companyPagesEyebrow}
                </div>

                <div className="mt-4 grid gap-2">
                  {nextPages.map((page) => (
                    <a
                      key={page.href}
                      href={page.href}
                      className="inline-flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/82 transition hover:bg-white/10"
                    >
                      <span>{page.label}</span>
                      <ChevronRight className="h-4 w-4" />
                    </a>
                  ))}
                </div>
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
                <div className="rounded-[32px] border border-white/10 bg-white/[0.06] p-10 text-center text-sm text-white/68 shadow-[0_20px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:col-span-2">
                  {copy.directory.empty}
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="ecosystem" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[34px] border border-white/10 bg-white/[0.06] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/58">
                <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--accent)]" />
                {copy.ecosystem.eyebrow}
              </div>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                {copy.ecosystem.title}
              </h2>

              <p className="mt-3 text-sm leading-7 text-white/64">
                {copy.ecosystem.body}
              </p>

              <div className="mt-6 grid gap-3">
                {copy.ecosystem.bullets.map((item) => (
                  <div
                    key={item}
                    className="flex gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/72"
                  >
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--accent)]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <BigFeature
                icon={<Building2 className="h-6 w-6" />}
                title={copy.ecosystem.big[0]}
                text={copy.ecosystem.bigText[0]}
              />
              <BigFeature
                icon={<Landmark className="h-6 w-6" />}
                title={copy.ecosystem.big[1]}
                text={copy.ecosystem.bigText[1]}
              />
              <BigFeature
                icon={<Zap className="h-6 w-6" />}
                title={copy.ecosystem.big[2]}
                text={copy.ecosystem.bigText[2]}
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
          <div className="rounded-[36px] border border-white/10 bg-white/[0.06] p-6 shadow-[0_24px_100px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/58">
                  <Workflow className="h-3.5 w-3.5 text-[color:var(--accent)]" />
                  {copy.access.eyebrow}
                </div>

                <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                  {copy.access.title}
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/64">
                  {copy.access.body}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="/about"
                    className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                  >
                    {copy.access.ctaPages}
                    <ArrowRight className="h-4 w-4" />
                  </a>

                  <a
                    href="#divisions"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-white/88 transition hover:bg-white/10"
                  >
                    {copy.access.ctaDirectory}
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="grid gap-3">
                <GlassMiniCard
                  icon={<Layers3 className="h-4 w-4" />}
                  label={copy.access.cards[0]}
                  value={copy.access.cardValues[0]}
                />
                <GlassMiniCard
                  icon={<TrendingUp className="h-4 w-4" />}
                  label={copy.access.cards[1]}
                  value={copy.access.cardValues[1]}
                />
                <GlassMiniCard
                  icon={<ShieldCheck className="h-4 w-4" />}
                  label={copy.access.cards[2]}
                  value={copy.access.cardValues[2]}
                />
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="rounded-[36px] border border-white/10 bg-white/[0.06] p-6 shadow-[0_24px_100px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/58">
                <Globe2 className="h-3.5 w-3.5 text-[color:var(--accent)]" />
                {copy.faq.eyebrow}
              </div>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                {copy.faq.title}
              </h2>

              <p className="mt-3 text-sm leading-7 text-white/64">
                {copy.faq.subtitle}
              </p>
            </div>

            <div className="mt-8 grid gap-3">
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
  searchRef,
  links,
  accountChip,
}: {
  brandTitle: string;
  brandSub: string;
  brandAccent: string;
  brandLogoUrl?: string | null;
  searchRef: React.RefObject<HTMLInputElement | null>;
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
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050816]/80 backdrop-blur-2xl">
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
                user={accountChip.user}
                loginHref={accountChip.loginHref}
                signupHref={accountChip.signupHref}
                accountHref={accountChip.accountHref}
                preferencesHref="/preferences"
                settingsHref={getAccountUrl("/security")}
                showSignOut
                dropdownTone="solidDark"
                chipSurface="onDark"
                menuItems={[
                  { label: "Divisions directory", href: "/#divisions" },
                  { label: "About", href: "/about" },
                  { label: "Contact", href: "/contact" },
                ]}
              />
            ) : null}
            <div className="hidden items-center gap-3 sm:flex">
              <button
                type="button"
                onClick={() => searchRef.current?.focus()}
                className="rounded-xl border border-white/12 bg-white/[0.06] px-3.5 py-2 text-sm text-white/88 transition hover:bg-white/10"
              >
                {copy.topBar.search}
              </button>
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
    <footer className="border-t border-white/10 bg-black/20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <BrandMark
              src={brandLogoUrl}
              alt={`${brandTitle} logo`}
              accent={brandAccent}
              wrapperClassName="h-11 w-11"
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

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/62">{footerText}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#divisions"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-white/85 transition hover:bg-white/10"
            >
              {copy.footer.exploreDivisions}
              <ArrowRight className="h-4 w-4" />
            </a>

            <a
              href="/about"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-white/85 transition hover:bg-white/10"
            >
              {copy.footer.companyPages}
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <FooterColumn title={copy.footer.colHub} links={companyLinks} />
          <FooterColumn title={copy.footer.colGlobal} links={nextPages} />
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
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-white/52">
        <span className="text-[color:var(--accent)]">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</div>
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
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-white/48">
        <span className="text-[color:var(--accent)]">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="mt-2 text-sm font-semibold text-white/90">{value}</div>
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
    <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">{label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
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
    <div className="rounded-[30px] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/12 bg-white/[0.06] text-[color:var(--accent)]">
        {icon}
      </div>
      <div className="mt-4 text-xs uppercase tracking-[0.18em] text-white/45">{eyebrow}</div>
      <div className="mt-3 text-lg font-semibold text-white">{title}</div>
      <p className="mt-2 text-sm leading-7 text-white/64">{text}</p>
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
    <div className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)] text-black">
        {icon}
      </div>
      <div className="mt-4 text-lg font-semibold text-white">{title}</div>
      <div className="mt-2 text-sm leading-7 text-white/64">{text}</div>
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
      className="relative overflow-hidden rounded-[30px] border border-white/10 bg-black/25"
      style={{ "--cardAccent": accent } as React.CSSProperties}
    >
      {extra.cover_url ? (
        <div className="h-40 overflow-hidden border-b border-white/10">
          <img
            src={extra.cover_url}
            alt={division.name}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-70"
          style={{
            background: `radial-gradient(650px 140px at 50% 0%, ${accent}35, transparent 70%)`,
          }}
        />
      )}

      <div className="relative p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium",
                getStatusTone(division.status)
              )}
            >
              <Star className="h-3.5 w-3.5" />
              {getStatusLabel(division.status, copy.status)}
            </span>

            <h3 className="mt-3 text-xl font-semibold tracking-tight text-white">
              {division.name}
            </h3>

            <p className="mt-2 text-sm leading-7 text-white/64">
              {division.description ||
                division.tagline ||
                copy.cards.divisionFallbackLong}
            </p>
          </div>

          <DivisionMark
            src={extra.logo_url}
            alt={`${division.name} logo`}
            accent={accent}
            wrapperClassName="h-12 w-12 rounded-2xl border-0"
            imageClassName="rounded-2xl object-contain p-2"
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(division.categories ?? []).slice(0, 3).map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] text-white/72"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-6 grid gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
              {copy.cards.destination}
            </div>
            <div className="mt-1 text-sm font-medium text-white/88">
              {host ?? copy.cards.notConfigured}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => safeOpen(division.primary_url)}
              disabled={!division.primary_url}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                division.primary_url
                  ? "bg-[color:var(--cardAccent)] text-black hover:opacity-90"
                  : "cursor-not-allowed border border-white/10 bg-white/[0.06] text-white/40"
              )}
            >
              {copy.cards.openDivision}
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
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
      className="group relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.06] shadow-[0_20px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_110px_rgba(0,0,0,0.25)]"
      style={{ "--cardAccent": accent } as React.CSSProperties}
    >
      {extra.cover_url ? (
        <div className="h-40 overflow-hidden border-b border-white/10">
          <img
            src={extra.cover_url}
            alt={d.name}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-70"
            style={{
              background: `radial-gradient(650px 150px at 50% 0%, ${accent}30, transparent 70%)`,
            }}
          />
          <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-[460px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl opacity-0 transition duration-500 group-hover:opacity-100" />
        </>
      )}

      <div className="relative p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <DivisionMark
              src={extra.logo_url}
              alt={`${d.name} logo`}
              accent={accent}
              wrapperClassName="h-12 w-12 shrink-0"
              imageClassName="rounded-xl object-contain p-1.5"
            />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-lg font-semibold tracking-tight text-white">
                  {d.name}
                </h3>

                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                    getStatusTone(d.status)
                  )}
                >
                  <Zap className="h-3.5 w-3.5" />
                  {getStatusLabel(d.status, copy.status)}
                </span>
              </div>

              <div className="mt-1 truncate text-xs uppercase tracking-[0.16em] text-white/42">
                {(d.categories ?? []).join(" • ") || d.key}
              </div>
            </div>
          </div>

          {d.is_featured ? (
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-black"
              style={{ background: accent }}
            >
              {copy.cards.featured}
            </span>
          ) : null}
        </div>

        <p className="mt-4 line-clamp-3 text-sm leading-7 text-white/66">
          {d.description ||
            d.tagline ||
            copy.cards.divisionFallbackShort}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(d.highlights ?? []).slice(0, 3).map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[11px] text-white/72"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
          <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
            {copy.cards.divisionDestination}
          </div>

          <div className="mt-1 text-sm font-medium text-white/88">
            {host ?? copy.cards.notConfigured}
          </div>

          {extra.lead?.name ? (
            <div className="mt-3 text-xs text-white/55">
              {copy.cards.lead}: {extra.lead.name}
              {extra.lead.title ? ` • ${extra.lead.title}` : ""}
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            onClick={onOpen}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white/88 transition hover:bg-white/10"
          >
            {copy.cards.details}
            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            onClick={() => safeOpen(d.primary_url)}
            disabled={!d.primary_url}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition",
              d.primary_url
                ? "text-black hover:opacity-90"
                : "cursor-not-allowed border border-white/10 bg-white/[0.06] text-white/40"
            )}
            style={d.primary_url ? { background: accent } : undefined}
          >
            {copy.cards.open}
            <ExternalLink className="h-4 w-4" />
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

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className="w-full max-w-4xl overflow-hidden rounded-[34px] border border-white/10 bg-[#0B1020] text-white shadow-[0_40px_140px_rgba(0,0,0,0.45)]"
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 }}
      >
        {extra.cover_url ? (
          <div className="h-52 overflow-hidden border-b border-white/10">
            <img
              src={extra.cover_url}
              alt={division.name}
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
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/[0.06] p-2 text-white/80 hover:bg-white/10"
            aria-label={copy.modal.closeAria}
          >
            <X className="h-5 w-5" />
          </button>

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

              {division.primary_url ? (
                <button
                  onClick={() => safeOpen(division.primary_url)}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-black hover:opacity-90"
                  style={{ background: accent }}
                >
                  {copy.modal.enterDivision}
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : null}
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
              <div className="text-sm font-semibold">{copy.modal.highlights}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {division.highlights.slice(0, 10).map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] text-white/74"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {extra.lead?.name ? (
            <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
              <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                {copy.modal.leadEyebrow}
              </div>
              <div className="mt-2 text-lg font-semibold text-white">{extra.lead.name}</div>
              <div className="mt-1 text-sm text-white/64">
                {extra.lead.title ?? copy.modal.leadFallbackTitle}
              </div>
            </div>
          ) : null}

          {links.length ? (
            <div>
              <div className="text-sm font-semibold">{copy.modal.links}</div>
              <div className="mt-3 space-y-2">
                {links.slice(0, 8).map((link, index) => (
                  <button
                    key={`${link.url}-${index}`}
                    onClick={() => safeOpen(link.url)}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-left text-sm hover:bg-white/10"
                  >
                    <span className="font-semibold">{link.label}</span>
                    <ExternalLink className="h-4 w-4 opacity-70" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
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
    <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
      <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">{title}</div>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/72"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniKPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-[26px] border border-white/10 bg-black/20 p-5 open:bg-white/[0.06]">
      <summary className="cursor-pointer list-none">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-white">{q}</div>
          <ChevronRight className="h-4 w-4 shrink-0 text-white/60 transition duration-200 group-open:rotate-90" />
        </div>
      </summary>
      <div className="mt-3 text-sm leading-7 text-white/64">{a}</div>
    </details>
  );
}
