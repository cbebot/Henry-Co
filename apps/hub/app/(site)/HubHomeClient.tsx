"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { cn } from "@henryco/ui";
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

const FALLBACK_FAQS: FaqItem[] = [
  {
    q: "Can I go directly to a division without starting from this page?",
    a: "Yes. Each division may still be accessed directly through its own destination. This hub exists to make the wider company easier to understand and to help visitors reach the right business more quickly.",
  },
  {
    q: "Will additional divisions appear here as the company grows?",
    a: "Yes. As Henry & Co. expands, new divisions can be introduced through the same company framework so the public experience remains clear, consistent, and well organized.",
  },
  {
    q: "Who is this website designed for?",
    a: "The hub serves customers, partners, suppliers, media, talent, and stakeholders who need a clearer view of the Henry & Co. group and its operating businesses.",
  },
  {
    q: "What company pages should I review first?",
    a: "The best starting points are the About, Contact, Privacy Notice, and Terms & Conditions pages. Together, they provide a clearer view of the company, its standards, and its public policies.",
  },
];

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

function getStatusLabel(status: DivisionRow["status"]) {
  if (status === "coming_soon") return "Coming soon";
  if (status === "paused") return "Paused";
  return "Active";
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

function formatUpdatedAt(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatUpdatedAtLong(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toFaqItems(
  records?: Array<{ question?: string | null; answer?: string | null } | FaqItem>
): FaqItem[] {
  if (!Array.isArray(records) || !records.length) {
    return FALLBACK_FAQS;
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

  return items.length ? items : FALLBACK_FAQS;
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
}) {
  const reduceMotion = useReducedMotion();

  const brandTitleSafe = normalizeText(brandTitle, "Henry & Co.");
  const brandSubSafe = normalizeText(brandSub, "Corporate Platform");
  const brandAccentSafe = getAccent(brandAccent);
  const brandLogoUrlSafe = normalizeImageUrl(brandLogoUrl);
  const brandFooterBlurbSafe = normalizeText(brandFooterBlurb);

  const initialDivisionsSafe = useMemo(
    () => (Array.isArray(initialDivisions) ? initialDivisions : []),
    [initialDivisions]
  );

  const initialFaqItems = useMemo(() => toFaqItems(initialFaqs), [initialFaqs]);

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
    return formatUpdatedAt(new Date(Math.max(...values)).toISOString());
  }, [divisions]);

  const activeFilterCount = useMemo(() => {
    let total = 0;
    if (query.trim()) total += 1;
    if (category !== "all") total += 1;
    if (statusFilter !== "all") total += 1;
    if (featuredOnly) total += 1;
    return total;
  }, [query, category, statusFilter, featuredOnly]);

  const companyLinks = [
    { label: "Featured", href: "#featured" },
    { label: "Directory", href: "#divisions" },
    { label: "Company", href: "#ecosystem" },
    { label: "FAQ", href: "#faq" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  const nextPages = [
    { label: "About Henry & Co.", href: "/about" },
    { label: "Contact the company", href: "/contact" },
    { label: "Privacy notice", href: "/privacy" },
    { label: "Terms & conditions", href: "/terms" },
  ];

  const clearAllFilters = () => {
    setQuery("");
    setCategory("all");
    setStatusFilter("all");
    setFeaturedOnly(false);
  };

  const introText =
    normalizeText(intro) ||
    "Henry & Co. brings together focused businesses under one respected group identity. This hub helps customers, partners, and stakeholders understand the company, locate the right division, and move forward with confidence.";

  const footerText = brandFooterBlurbSafe || introText;

  const spotlightDivision = featured[0] ?? null;
  const spotlightHost = spotlightDivision
    ? domainFromUrl(spotlightDivision.primary_url, spotlightDivision.subdomain)
    : null;

  return (
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
                Premium company network • press <b>/</b> to search
              </motion.div>

              <motion.h1
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.04 }}
                className="mt-6 max-w-5xl text-4xl font-semibold leading-[0.96] tracking-tight text-white sm:text-6xl xl:text-7xl"
              >
                Explore the businesses, services, and operating divisions of{" "}
                <span className="bg-gradient-to-r from-[color:var(--accent)] via-white to-white/70 bg-clip-text text-transparent">
                  {brandTitleSafe}
                </span>
                .
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
                  Explore all divisions
                  <ArrowRight className="h-4 w-4" />
                </a>

                <a
                  href="#featured"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-5 py-3 text-sm text-white/88 transition hover:bg-white/10"
                >
                  View featured divisions
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
                      Company brand system
                    </div>
                    <div className="mt-2 text-xl font-semibold tracking-tight text-white">
                      {brandTitleSafe}
                    </div>
                    <div className="mt-1 text-sm text-white/62">{brandSubSafe}</div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <DirectoryMiniStat
                    label="Base domain"
                    value={normalizeText(process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com")
                      .replace(/^https?:\/\//i, "")
                      .replace(/\/+$/, "")}
                  />
                  <DirectoryMiniStat label="Accent" value={brandAccentSafe} />
                  <DirectoryMiniStat
                    label="Logo status"
                    value={brandLogoUrlSafe ? "Configured" : "Fallback mark"}
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
                  label="Divisions"
                  value={`${stats.total}`}
                />
                <StatCard
                  icon={<Zap className="h-5 w-5" />}
                  label="Active now"
                  value={`${stats.active}`}
                />
                <StatCard
                  icon={<Star className="h-5 w-5" />}
                  label="Coming soon"
                  value={`${stats.soon}`}
                />
                <StatCard
                  icon={<Globe2 className="h-5 w-5" />}
                  label="Service sectors"
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
                      Group standard
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                      A unified standard across every division.
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
                  {[
                    "Each division operates with its own market focus while reflecting the standards of the wider Henry & Co. group.",
                    "The company hub helps visitors understand where to go, who to engage, and how the group is organized.",
                    "As the company expands, new divisions can be introduced inside one clear and credible structure.",
                    "The result is a stronger public presence, better navigation, and a more professional experience at every touchpoint.",
                  ].map((line) => (
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
                    label="Latest company update"
                    value={latestUpdate}
                  />
                  <GlassMiniCard
                    icon={<Workflow className="h-4 w-4" />}
                    label="Operating standard"
                    value="Consistent and maintained"
                  />
                </div>

                {spotlightDivision ? (
                  <div className="mt-6 rounded-[28px] border border-white/10 bg-black/25 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                          Current spotlight
                        </div>
                        <div className="mt-2 text-lg font-semibold text-white">
                          {spotlightDivision.name}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-white/64">
                          {spotlightDivision.tagline ||
                            spotlightDivision.description ||
                            "A featured Henry & Co. division representing the group with clarity and focus."}
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
                        Featured
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
                        View details
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
                          Visit division
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
                    Some information is currently being refreshed.
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
              eyebrow="Discovery"
              title="Direct people to the right business"
              text="The hub removes ambiguity, strengthens confidence, and helps every visitor reach the most relevant Henry & Co. division without confusion."
            />
            <PremiumFeature
              icon={<Landmark className="h-5 w-5" />}
              eyebrow="Corporate presence"
              title="Present the group with maturity"
              text="This public layer supports company reputation, clearer communication, and a stronger group-level identity across every market-facing touchpoint."
            />
            <PremiumFeature
              icon={<Workflow className="h-5 w-5" />}
              eyebrow="Scalability"
              title="Built for growth and continuity"
              text="As the group grows, new businesses and corporate pages can be introduced inside the same premium framework without weakening consistency."
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
                    Featured divisions
                  </div>

                  <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                    Selected divisions currently representing the group
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-7 text-white/64">
                    These businesses currently serve as key public entry points into the
                    Henry &amp; Co. group.
                  </p>
                </div>

                <a
                  href="#divisions"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-white/88 transition hover:bg-white/10"
                >
                  View full directory
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
                Directory
              </div>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                Locate the right Henry &amp; Co. business
              </h2>

              <p className="mt-3 text-sm leading-7 text-white/64">
                Search by division name, category, service emphasis, or business focus.
                This directory exists to help people move quickly and confidently to the
                right part of the company.
              </p>

              <div className="mt-6 space-y-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search divisions, services, categories, subdomains…"
                    className="h-14 w-full rounded-2xl border border-white/12 bg-black/30 pl-11 pr-12 text-sm text-white outline-none placeholder:text-white/30 focus:border-[color:var(--accent)]"
                  />
                  {query ? (
                    <button
                      onClick={() => setQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/65 hover:bg-white/10 hover:text-white"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                {categoryHighlights.length ? (
                  <div>
                    <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-white/45">
                      Popular sectors
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
                    {featuredOnly ? "Showing featured only" : "Limit to featured"}
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
                          {item === "all" ? "All categories" : item}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "All" },
                    { value: "active", label: "Active" },
                    { value: "coming_soon", label: "Coming soon" },
                    { value: "paused", label: "Paused" },
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
                <DirectoryMiniStat label="Showing" value={String(filtered.length)} />
                <DirectoryMiniStat label="Total" value={String(divisions.length)} />
                <DirectoryMiniStat label="Featured" value={String(featured.length)} />
              </div>

              <div className="mt-6 rounded-[28px] border border-white/10 bg-black/25 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                    Directory overview
                  </div>

                  {activeFilterCount ? (
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-white/70 transition hover:text-white"
                    >
                      Clear all
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-300">Ready</span>
                  )}
                </div>

                <div className="mt-4 space-y-2 text-sm text-white/72">
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <span>Active refinements</span>
                    <span className="font-semibold text-white">{activeFilterCount}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <span>Last updated</span>
                    <span className="font-semibold text-white">{latestUpdate}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[28px] border border-white/10 bg-black/25 p-5">
                <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                  Company-level pages
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
                  No matching divisions were found. Clear your filters or broaden the
                  search criteria.
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
                Why this matters
              </div>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                A clearer company presence creates trust before the first conversation
              </h2>

              <p className="mt-3 text-sm leading-7 text-white/64">
                A well-structured corporate hub helps audiences understand the scope of
                the company, the relationship between its divisions, and the level of
                professionalism behind every service.
              </p>

              <div className="mt-6 grid gap-3">
                {[
                  "Stronger brand confidence across all public touchpoints.",
                  "More efficient routing for customers, partners, and stakeholders.",
                  "A better foundation for future businesses, campaigns, and announcements.",
                  "A credible base for company, media, and investor-facing communication.",
                ].map((item) => (
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
                title="Independent business units"
                text="Each division can grow through its own workflows, public pages, and commercial direction while remaining aligned with the parent company."
              />
              <BigFeature
                icon={<Landmark className="h-6 w-6" />}
                title="Corporate-grade presentation"
                text="The group can communicate with greater maturity, stronger trust signals, and clearer positioning across markets and audiences."
              />
              <BigFeature
                icon={<Zap className="h-6 w-6" />}
                title="Prepared for long-term growth"
                text="As new divisions and public initiatives are introduced, the company can continue expanding without compromising consistency."
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
                  Company access
                </div>

                <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Everything starts with a clearer first impression
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/64">
                  Whether someone is discovering the company for the first time or
                  returning to work with a specific division, the hub provides a clear,
                  polished pathway into the wider Henry &amp; Co. group.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="/about"
                    className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                  >
                    Explore company pages
                    <ArrowRight className="h-4 w-4" />
                  </a>

                  <a
                    href="#divisions"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-white/88 transition hover:bg-white/10"
                  >
                    View the directory
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="grid gap-3">
                <GlassMiniCard
                  icon={<Layers3 className="h-4 w-4" />}
                  label="Company standard"
                  value="Consistent and professional"
                />
                <GlassMiniCard
                  icon={<TrendingUp className="h-4 w-4" />}
                  label="Customer navigation"
                  value="Clear and guided"
                />
                <GlassMiniCard
                  icon={<ShieldCheck className="h-4 w-4" />}
                  label="Brand confidence"
                  value="Premium public presence"
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
                Frequently asked
              </div>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                Frequently asked questions
              </h2>

              <p className="mt-3 text-sm leading-7 text-white/64">
                These answers help customers, partners, and stakeholders understand
                how the company works before they need to reach out.
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
  );
}

function TopBar({
  brandTitle,
  brandSub,
  brandAccent,
  brandLogoUrl,
  searchRef,
  links,
}: {
  brandTitle: string;
  brandSub: string;
  brandAccent: string;
  brandLogoUrl?: string | null;
  searchRef: React.RefObject<HTMLInputElement | null>;
  links: { label: string; href: string }[];
}) {
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

          <div className="hidden items-center gap-3 sm:flex">
            <button
              onClick={() => searchRef.current?.focus()}
              className="rounded-xl border border-white/12 bg-white/[0.06] px-3.5 py-2 text-sm text-white/88 transition hover:bg-white/10"
            >
              Search hub
            </button>
            <a
              href="#divisions"
              className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--accent)] px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Explore
              <ArrowRight className="h-4 w-4" />
            </a>
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
              Explore divisions
              <ArrowRight className="h-4 w-4" />
            </a>

            <a
              href="/about"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-white/85 transition hover:bg-white/10"
            >
              Company pages
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <FooterColumn title="Company hub" links={companyLinks} />
          <FooterColumn title="Global pages" links={nextPages} />
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
              {getStatusLabel(division.status)}
            </span>

            <h3 className="mt-3 text-xl font-semibold tracking-tight text-white">
              {division.name}
            </h3>

            <p className="mt-2 text-sm leading-7 text-white/64">
              {division.description ||
                division.tagline ||
                "A public-facing Henry & Co. division built to serve a focused market with clarity and premium presentation."}
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
              Destination
            </div>
            <div className="mt-1 text-sm font-medium text-white/88">
              {host ?? "Not configured yet"}
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
              Open division
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
                  {getStatusLabel(d.status)}
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
              Featured
            </span>
          ) : null}
        </div>

        <p className="mt-4 line-clamp-3 text-sm leading-7 text-white/66">
          {d.description ||
            d.tagline ||
            "A focused Henry & Co. division presented as an independent operating brand inside the wider company ecosystem."}
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
            Division destination
          </div>

          <div className="mt-1 text-sm font-medium text-white/88">
            {host ?? "Not configured yet"}
          </div>

          {extra.lead?.name ? (
            <div className="mt-3 text-xs text-white/55">
              Lead: {extra.lead.name}
              {extra.lead.title ? ` • ${extra.lead.title}` : ""}
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            onClick={onOpen}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white/88 transition hover:bg-white/10"
          >
            Details
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
            Open
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
            aria-label="Close"
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
                  {getStatusLabel(division.status)}
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
                  Enter division
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
            <MiniKPI label="Status" value={getStatusLabel(division.status)} />
            <MiniKPI label="Subdomain" value={host ?? "—"} />
            <MiniKPI label="Featured" value={division.is_featured ? "Yes" : "No"} />
            <MiniKPI label="Updated" value={formatUpdatedAtLong(division.updated_at)} />
          </div>

          {(whoItsFor.length || howItWorks.length || trustItems.length) && (
            <div className="grid gap-4 lg:grid-cols-3">
              {whoItsFor.length ? (
                <InsightList title="Who it serves" items={whoItsFor.slice(0, 6)} />
              ) : null}

              {howItWorks.length ? (
                <InsightList title="How it works" items={howItWorks.slice(0, 6)} />
              ) : null}

              {trustItems.length ? (
                <InsightList title="Why clients choose it" items={trustItems.slice(0, 6)} />
              ) : null}
            </div>
          )}

          {division.highlights?.length ? (
            <div>
              <div className="text-sm font-semibold">Highlights</div>
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
                Division lead
              </div>
              <div className="mt-2 text-lg font-semibold text-white">{extra.lead.name}</div>
              <div className="mt-1 text-sm text-white/64">
                {extra.lead.title ?? "Leadership profile"}
              </div>
            </div>
          ) : null}

          {links.length ? (
            <div>
              <div className="text-sm font-semibold">Links</div>
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
