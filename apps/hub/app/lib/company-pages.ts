import { createClient } from "@supabase/supabase-js";
import { fetchNoStore } from "./no-store-fetch";

export type CompanyPageStat = {
  id?: string;
  label?: string;
  value?: string;
};

export type CompanyPageItem = {
  id?: string;
  label?: string;
  value?: string;
  title?: string;
  body?: string;
  href?: string;
  image_url?: string;
};

export type CompanyPageSection = {
  id?: string;
  eyebrow?: string;
  title?: string;
  body?: string;
  layout?: "default" | "cards" | "grid" | "legal" | "timeline" | string;
  image_url?: string;
  items: CompanyPageItem[];
};

export type CompanyPageRecord = {
  id?: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  hero_badge?: string | null;
  intro?: string | null;
  hero_image_url?: string | null;
  primary_cta_label?: string | null;
  primary_cta_href?: string | null;
  secondary_cta_label?: string | null;
  secondary_cta_href?: string | null;
  stats: CompanyPageStat[];
  sections: CompanyPageSection[];
  seo_title?: string | null;
  seo_description?: string | null;
  is_published: boolean;
  sort_order: number;
  created_at?: string | null;
  updated_at?: string | null;
};

type CompanyPageDbRow = Partial<CompanyPageRecord> & {
  page_key?: string | null;
  hero_kicker?: string | null;
  hero_title?: string | null;
  hero_body?: string | null;
  hero_primary_label?: string | null;
  hero_primary_href?: string | null;
  hero_secondary_label?: string | null;
  hero_secondary_href?: string | null;
  intro_title?: string | null;
  intro_body?: string | null;
  cta_primary_label?: string | null;
  cta_primary_href?: string | null;
  cta_secondary_label?: string | null;
  cta_secondary_href?: string | null;
  cover_image_url?: string | null;
  body?: unknown;
  content?: unknown;
  stats?: unknown;
  sections?: unknown;
};

function toText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function toNullableText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function toArray<T>(value: unknown, map: (item: unknown, index: number) => T): T[] {
  if (!Array.isArray(value)) return [];
  return value.map(map);
}

function normalizeStat(value: unknown, index: number): CompanyPageStat {
  const item = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    id: toText(item.id, `stat-${index + 1}`),
    label: toNullableText(item.label) ?? "Metric",
    value: toNullableText(item.value) ?? "—",
  };
}

function normalizeItem(value: unknown, index: number): CompanyPageItem {
  const item = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    id: toText(item.id, `item-${index + 1}`),
    label: toNullableText(item.label) ?? undefined,
    value: toNullableText(item.value) ?? undefined,
    title: toNullableText(item.title) ?? undefined,
    body: toNullableText(item.body) ?? undefined,
    href: toNullableText(item.href) ?? undefined,
    image_url:
      toNullableText(item.image_url) ??
      toNullableText(item.imageUrl) ??
      undefined,
  };
}

function normalizeSection(value: unknown, index: number): CompanyPageSection {
  const section = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    id: toText(section.id, `section-${index + 1}`),
    eyebrow: toNullableText(section.eyebrow) ?? undefined,
    title: toNullableText(section.title) ?? undefined,
    body: toNullableText(section.body) ?? undefined,
    layout: toText(section.layout, "default"),
    image_url:
      toNullableText(section.image_url) ??
      toNullableText(section.imageUrl) ??
      undefined,
    items: toArray(section.items, normalizeItem),
  };
}

export function normalizeCompanyPage(
  row: CompanyPageDbRow | null | undefined,
  slugFallback = "page"
): CompanyPageRecord {
  const statsSource =
    Array.isArray(row?.stats)
      ? row?.stats
      : row?.content &&
          typeof row.content === "object" &&
          !Array.isArray(row.content) &&
          Array.isArray((row.content as { stats?: unknown[] }).stats)
        ? (row.content as { stats: unknown[] }).stats
        : [];
  const sectionsSource = Array.isArray(row?.sections) ? row?.sections : row?.body;

  return {
    id: row?.id ? String(row.id) : undefined,
    slug: toText(row?.slug ?? row?.page_key, slugFallback),
    title: toText(row?.title, "Henry & Co."),
    subtitle: toNullableText(row?.subtitle),
    hero_badge: toNullableText(row?.hero_badge) ?? toNullableText(row?.hero_kicker),
    intro:
      toNullableText(row?.intro) ??
      toNullableText(row?.hero_body) ??
      toNullableText(row?.intro_body),
    hero_image_url:
      toNullableText(row?.hero_image_url) ?? toNullableText(row?.cover_image_url),
    primary_cta_label:
      toNullableText(row?.primary_cta_label) ??
      toNullableText(row?.cta_primary_label) ??
      toNullableText(row?.hero_primary_label),
    primary_cta_href:
      toNullableText(row?.primary_cta_href) ??
      toNullableText(row?.cta_primary_href) ??
      toNullableText(row?.hero_primary_href),
    secondary_cta_label:
      toNullableText(row?.secondary_cta_label) ??
      toNullableText(row?.cta_secondary_label) ??
      toNullableText(row?.hero_secondary_label),
    secondary_cta_href:
      toNullableText(row?.secondary_cta_href) ??
      toNullableText(row?.cta_secondary_href) ??
      toNullableText(row?.hero_secondary_href),
    stats: toArray(statsSource, normalizeStat),
    sections: toArray(sectionsSource, normalizeSection),
    seo_title: toNullableText(row?.seo_title),
    seo_description: toNullableText(row?.seo_description),
    is_published: Boolean(row?.is_published ?? true),
    sort_order: Number(row?.sort_order ?? 100),
    created_at: toNullableText(row?.created_at),
    updated_at: toNullableText(row?.updated_at),
  };
}

export function createFallbackCompanyPage(slug: string): CompanyPageRecord {
  const pageSlug = slug.trim().toLowerCase();

  const base: CompanyPageRecord = {
    slug: pageSlug,
    title: "Henry & Co.",
    subtitle: "Corporate platform",
    hero_badge: "Company page",
    intro:
      "One operating standard across every division, held consistent across every public surface of the group.",
    hero_image_url: null,
    primary_cta_label: "Contact the company",
    primary_cta_href: "/contact",
    secondary_cta_label: "Browse divisions",
    secondary_cta_href: "/#divisions",
    stats: [
      { id: "stat-1", label: "Operating standard", value: "Consistent" },
      { id: "stat-2", label: "Structure", value: "Multi-division" },
      { id: "stat-3", label: "Horizon", value: "Long-term" },
    ],
    sections: [],
    seo_title: null,
    seo_description: null,
    is_published: true,
    sort_order: 100,
    created_at: null,
    updated_at: null,
  };

  switch (pageSlug) {
    case "about":
      return {
        ...base,
        title: "About Henry & Co.",
        subtitle: "Who we are",
        hero_badge: "Company overview",
        intro:
          "Henry & Co. is a multi-division operating group. Each division runs its own market, under one shared standard of execution, presentation, and trust.",
        sections: [
          {
            id: "about-profile",
            eyebrow: "What this is",
            title: "Focused businesses, one operating standard",
            body:
              "Specialised business capability combined with disciplined corporate identity. Divisions grow on their own terms while contributing to a stronger, more credible group presence.",
            layout: "cards",
            items: [
              {
                id: "about-profile-1",
                title: "Focused divisions",
                body: "Each division serves a defined market, service line, or operating need \u2014 not a bundle of everything.",
              },
              {
                id: "about-profile-2",
                title: "Shared quality standard",
                body: "One standard for presentation, trust signals, and professionalism holds across every public surface.",
              },
              {
                id: "about-profile-3",
                title: "Expansion-ready",
                body: "New divisions, new company pages, new markets \u2014 introduced inside the same premium framework.",
              },
            ],
          },
          {
            id: "about-leadership",
            eyebrow: "Direction",
            title: "How the group is led",
            body:
              "Ownership, leadership philosophy, and long-term direction are held explicit so the group behaves predictably for customers, partners, investors, and talent.",
            layout: "default",
            items: [
              { id: "about-leadership-1", label: "Vision", value: "A respected, premium operating group." },
              { id: "about-leadership-2", label: "Direction", value: "Expand with discipline. Preserve quality." },
              { id: "about-leadership-3", label: "Commitment", value: "Operate with clarity, seriousness, and trust." },
            ],
          },
        ],
      };

    case "contact":
      return {
        ...base,
        title: "Contact Henry & Co.",
        subtitle: "Reach the company",
        hero_badge: "Business enquiries",
        intro:
          "Company-level communication, strategic partnerships, media enquiries, supplier introductions, and anything else that belongs to the parent group rather than a single division.",
        sections: [
          {
            id: "contact-usage",
            eyebrow: "When to use this page",
            title: "Group-level conversations only",
            body:
              "For anything specific to a division, go directly to that division \u2014 you will get a faster and more accurate answer.",
            layout: "cards",
            items: [
              {
                id: "contact-usage-1",
                title: "General company enquiries",
                body: "Group-level questions, introductions, and broader brand communication.",
              },
              {
                id: "contact-usage-2",
                title: "Partnership and vendor discussions",
                body: "Collaboration, procurement, and business development across the group.",
              },
              {
                id: "contact-usage-3",
                title: "Media and investor relations",
                body: "Interview requests, profile enquiries, and investor-facing information.",
              },
            ],
          },
        ],
      };

    case "privacy":
      return {
        ...base,
        title: "Privacy Policy",
        subtitle: "How we handle information",
        hero_badge: "Privacy commitment",
        intro:
          "Information is handled responsibly, unnecessary data use is avoided, and a professional privacy posture is maintained across every Henry & Co. public surface.",
        primary_cta_label: "Contact the company",
        primary_cta_href: "/contact",
        secondary_cta_label: "Terms & Conditions",
        secondary_cta_href: "/terms",
        sections: [
          {
            id: "privacy-collection",
            eyebrow: "Collection",
            title: "Information we may collect",
            body:
              "Depending on how the site is used, Henry & Co. may receive contact details, enquiry information, device information, browser metadata, and analytics data necessary to operate and improve digital services.",
            layout: "cards",
            items: [
              {
                id: "privacy-collection-1",
                title: "Contact data",
                body: "Information voluntarily submitted through forms, enquiries, or company communication channels.",
              },
              {
                id: "privacy-collection-2",
                title: "Technical data",
                body: "Browser, device, and interaction data used to support security and service improvement.",
              },
              {
                id: "privacy-collection-3",
                title: "Operational data",
                body: "Information necessary to route enquiries and maintain appropriate business administration.",
              },
            ],
          },
          {
            id: "privacy-use",
            eyebrow: "Use",
            title: "How information may be used",
            body:
              "Information may be used to respond to enquiries, improve services, operate site functionality, maintain security, and support business administration where relevant.",
            layout: "default",
            items: [
              { id: "privacy-use-1", label: "Use case", value: "Communication and enquiry response" },
              { id: "privacy-use-2", label: "Use case", value: "Service improvement and performance analysis" },
              { id: "privacy-use-3", label: "Use case", value: "Security, compliance, and internal administration" },
            ],
          },
        ],
      };

    case "terms":
      return {
        ...base,
        title: "Terms & Conditions",
        subtitle: "Terms of use",
        hero_badge: "Legal terms",
        intro:
          "These terms govern access to and use of Henry & Co. public-facing pages, content, and related digital properties.",
        primary_cta_label: "Privacy Policy",
        primary_cta_href: "/privacy",
        secondary_cta_label: "Contact the company",
        secondary_cta_href: "/contact",
        sections: [
          {
            id: "terms-use",
            eyebrow: "Use",
            title: "Acceptable use",
            body:
              "Users are expected to access and use the site lawfully, responsibly, and in a manner consistent with legitimate business or informational purposes.",
            layout: "cards",
            items: [
              {
                id: "terms-use-1",
                title: "Lawful access only",
                body: "The site must not be used for unlawful activity, interference, or abuse.",
              },
              {
                id: "terms-use-2",
                title: "No misuse of content",
                body: "Company materials, branding, and site content must not be copied or misrepresented without authorization.",
              },
              {
                id: "terms-use-3",
                title: "No service disruption",
                body: "Users must not attempt to interfere with platform availability, security, or operational integrity.",
              },
            ],
          },
          {
            id: "terms-legal",
            eyebrow: "Legal",
            title: "General legal position",
            body:
              "Henry & Co. reserves the right to revise site content, update legal information, restrict misuse, and take appropriate action where required to protect the company, its users, and its operations.",
            layout: "default",
            items: [
              { id: "terms-legal-1", label: "Content status", value: "Subject to revision" },
              { id: "terms-legal-2", label: "Access rights", value: "May be limited or withdrawn where necessary" },
              { id: "terms-legal-3", label: "Questions", value: "Use the company contact page for legal or site-related enquiries" },
            ],
          },
        ],
      };

    default:
      return base;
  }
}

export async function getCompanyPage(slug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    return {
      page: null as CompanyPageRecord | null,
      hasServerError: true,
    };
  }

  const supabase = createClient(url, anon, {
    global: {
      fetch: fetchNoStore,
    },
  });

  const { data, error } = await supabase
    .from("company_pages")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return {
      page: null as CompanyPageRecord | null,
      hasServerError: Boolean(error),
    };
  }

  return {
    page: normalizeCompanyPage(data, slug),
    hasServerError: false,
  };
}
