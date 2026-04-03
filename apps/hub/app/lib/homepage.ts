import { createClient } from "@supabase/supabase-js";
import { fetchNoStore } from "./no-store-fetch";

export type HubHomepageItem = {
  id?: string;
  eyebrow?: string;
  title?: string;
  body?: string;
};

export type HubHomepageFaq = {
  id?: string;
  q?: string;
  a?: string;
};

export type HubHomepageContent = {
  page_key: string;
  hero_badge?: string | null;
  hero_title?: string | null;
  hero_highlight?: string | null;
  hero_description?: string | null;
  hero_image_url?: string | null;
  primary_cta_label?: string | null;
  primary_cta_href?: string | null;
  secondary_cta_label?: string | null;
  secondary_cta_href?: string | null;
  operating_title?: string | null;
  operating_body?: string | null;
  operating_points: HubHomepageItem[];
  value_cards: HubHomepageItem[];
  featured_title?: string | null;
  featured_body?: string | null;
  directory_title?: string | null;
  directory_body?: string | null;
  ecosystem_title?: string | null;
  ecosystem_body?: string | null;
  ecosystem_points: HubHomepageItem[];
  owner_section_badge?: string | null;
  owner_section_title?: string | null;
  owner_name?: string | null;
  owner_role?: string | null;
  owner_message?: string | null;
  owner_image_url?: string | null;
  owner_signature?: string | null;
  faq_title?: string | null;
  faq_body?: string | null;
  faqs: HubHomepageFaq[];
  footer_blurb?: string | null;
  is_published: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

type HubHomepageDbRow = Partial<HubHomepageContent> & {
  operating_points?: unknown;
  value_cards?: unknown;
  ecosystem_points?: unknown;
  faqs?: unknown;
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

function normalizeItem(value: unknown, index: number): HubHomepageItem {
  const item = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    id: toText(item.id, `item-${index + 1}`),
    eyebrow: toNullableText(item.eyebrow) ?? undefined,
    title: toNullableText(item.title) ?? undefined,
    body: toNullableText(item.body) ?? undefined,
  };
}

function normalizeFaq(value: unknown, index: number): HubHomepageFaq {
  const item = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    id: toText(item.id, `faq-${index + 1}`),
    q: toNullableText(item.q) ?? undefined,
    a: toNullableText(item.a) ?? undefined,
  };
}

export function createFallbackHubHomepageContent(): HubHomepageContent {
  return {
    page_key: "home",
    hero_badge: "Group Platform",
    hero_title: "The operating gateway for Henry & Co.",
    hero_highlight: "Premium divisions. One standard.",
    hero_description:
      "Henry & Co. brings together specialized business units under one disciplined company standard. This platform is designed to communicate structure, trust, and premium brand quality while guiding visitors to the right division.",
    hero_image_url: null,
    primary_cta_label: "Explore divisions",
    primary_cta_href: "/#divisions",
    secondary_cta_label: "Contact the company",
    secondary_cta_href: "/contact",
    operating_title: "Built for structured growth",
    operating_body:
      "A serious company platform should communicate confidence, structure, and long-term operating discipline. The Henry & Co. hub is designed to function as the public-facing gateway to the wider ecosystem while remaining ready for future expansion.",
    operating_points: [
      {
        id: "op-1",
        title: "Multi-division structure",
        body: "Each business unit can maintain its own market focus while benefiting from a unified company standard.",
      },
      {
        id: "op-2",
        title: "Corporate-grade trust",
        body: "The platform supports stronger customer confidence, partner credibility, and future investor visibility.",
      },
      {
        id: "op-3",
        title: "Scalable publishing model",
        body: "New divisions, corporate pages, and media assets can be added without redesigning the entire public experience.",
      },
    ],
    value_cards: [
      {
        id: "value-1",
        eyebrow: "Discovery",
        title: "Clear division routing",
        body: "Users can identify the correct business unit quickly and proceed with confidence.",
      },
      {
        id: "value-2",
        eyebrow: "Presentation",
        title: "Professional company narrative",
        body: "The public experience reinforces the quality and seriousness of the Henry & Co. brand.",
      },
      {
        id: "value-3",
        eyebrow: "Scale",
        title: "Built for future expansion",
        body: "The structure supports additional services, divisions, and company-wide pages over time.",
      },
    ],
    featured_title: "Featured divisions",
    featured_body:
      "These destinations represent important public-facing parts of the Henry & Co. operating ecosystem and should reflect the strongest brand standard.",
    directory_title: "Division directory",
    directory_body:
      "The directory is the primary discovery layer for the group. It should help visitors understand the breadth of the business and reach the correct destination efficiently.",
    ecosystem_title: "Why the hub matters",
    ecosystem_body:
      "The hub is more than a directory. It is a strategic company layer that communicates legitimacy, organization, and premium business intent.",
    ecosystem_points: [
      {
        id: "eco-1",
        title: "Stronger corporate identity",
        body: "A unified entry point improves how the company is perceived across public channels.",
      },
      {
        id: "eco-2",
        title: "Better stakeholder navigation",
        body: "Customers, suppliers, media contacts, talent, and partners can identify the right path more quickly.",
      },
      {
        id: "eco-3",
        title: "Future-ready public infrastructure",
        body: "The same structure supports legal pages, leadership pages, newsroom content, and future corporate storytelling.",
      },
    ],
    owner_section_badge: "Leadership",
    owner_section_title: "Leadership and ownership",
    owner_name: "Company Owner",
    owner_role: "Founder / Group Principal",
    owner_message:
      "Henry & Co. is being built with a long-term view: disciplined growth, premium presentation, and serious business credibility across every division.",
    owner_image_url: null,
    owner_signature: null,
    faq_title: "Frequently asked questions",
    faq_body:
      "These questions are intended to reduce uncertainty, reinforce trust, and help visitors understand how to navigate the company platform.",
    faqs: [
      {
        id: "faq-1",
        q: "Can each division operate independently?",
        a: "Yes. Each division can maintain its own services, pages, and workflows while remaining part of the wider Henry & Co. ecosystem.",
      },
      {
        id: "faq-2",
        q: "Will additional divisions appear here over time?",
        a: "Yes. The platform is designed to support additional divisions as the company expands.",
      },
      {
        id: "faq-3",
        q: "Is this platform only for customers?",
        a: "No. It also supports partners, media contacts, prospective talent, suppliers, and broader corporate visibility.",
      },
      {
        id: "faq-4",
        q: "Can company-wide pages be managed centrally?",
        a: "Yes. About, Contact, Privacy, Terms, and future company pages are designed to be managed from the admin layer.",
      },
    ],
    footer_blurb:
      "Henry & Co. is a premium multi-division company ecosystem designed to communicate trust, structure, and long-term business quality.",
    is_published: true,
    created_at: null,
    updated_at: null,
  };
}

export function normalizeHubHomepageContent(
  row: HubHomepageDbRow | null | undefined
): HubHomepageContent {
  const fallback = createFallbackHubHomepageContent();

  return {
    page_key: toText(row?.page_key, fallback.page_key),
    hero_badge: toNullableText(row?.hero_badge) ?? fallback.hero_badge,
    hero_title: toNullableText(row?.hero_title) ?? fallback.hero_title,
    hero_highlight: toNullableText(row?.hero_highlight) ?? fallback.hero_highlight,
    hero_description: toNullableText(row?.hero_description) ?? fallback.hero_description,
    hero_image_url: toNullableText(row?.hero_image_url),
    primary_cta_label: toNullableText(row?.primary_cta_label) ?? fallback.primary_cta_label,
    primary_cta_href: toNullableText(row?.primary_cta_href) ?? fallback.primary_cta_href,
    secondary_cta_label:
      toNullableText(row?.secondary_cta_label) ?? fallback.secondary_cta_label,
    secondary_cta_href:
      toNullableText(row?.secondary_cta_href) ?? fallback.secondary_cta_href,
    operating_title: toNullableText(row?.operating_title) ?? fallback.operating_title,
    operating_body: toNullableText(row?.operating_body) ?? fallback.operating_body,
    operating_points:
      toArray(row?.operating_points, normalizeItem).filter(
        (item) => item.title || item.body
      ) || fallback.operating_points,
    value_cards:
      toArray(row?.value_cards, normalizeItem).filter(
        (item) => item.title || item.body
      ) || fallback.value_cards,
    featured_title: toNullableText(row?.featured_title) ?? fallback.featured_title,
    featured_body: toNullableText(row?.featured_body) ?? fallback.featured_body,
    directory_title: toNullableText(row?.directory_title) ?? fallback.directory_title,
    directory_body: toNullableText(row?.directory_body) ?? fallback.directory_body,
    ecosystem_title: toNullableText(row?.ecosystem_title) ?? fallback.ecosystem_title,
    ecosystem_body: toNullableText(row?.ecosystem_body) ?? fallback.ecosystem_body,
    ecosystem_points:
      toArray(row?.ecosystem_points, normalizeItem).filter(
        (item) => item.title || item.body
      ) || fallback.ecosystem_points,
    owner_section_badge:
      toNullableText(row?.owner_section_badge) ?? fallback.owner_section_badge,
    owner_section_title:
      toNullableText(row?.owner_section_title) ?? fallback.owner_section_title,
    owner_name: toNullableText(row?.owner_name) ?? fallback.owner_name,
    owner_role: toNullableText(row?.owner_role) ?? fallback.owner_role,
    owner_message: toNullableText(row?.owner_message) ?? fallback.owner_message,
    owner_image_url: toNullableText(row?.owner_image_url),
    owner_signature: toNullableText(row?.owner_signature),
    faq_title: toNullableText(row?.faq_title) ?? fallback.faq_title,
    faq_body: toNullableText(row?.faq_body) ?? fallback.faq_body,
    faqs:
      toArray(row?.faqs, normalizeFaq).filter((item) => item.q && item.a) ||
      fallback.faqs,
    footer_blurb: toNullableText(row?.footer_blurb) ?? fallback.footer_blurb,
    is_published: Boolean(row?.is_published ?? true),
    created_at: toNullableText(row?.created_at),
    updated_at: toNullableText(row?.updated_at),
  };
}

export async function getHubHomepageContent(pageKey = "home") {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    return {
      content: createFallbackHubHomepageContent(),
      hasServerError: true,
    };
  }

  const supabase = createClient(url, anon, {
    global: {
      fetch: fetchNoStore,
    },
  });

  const { data, error } = await supabase
    .from("hub_homepage_content")
    .select("*")
    .eq("page_key", pageKey)
    .maybeSingle();

  if (error || !data) {
    return {
      content: createFallbackHubHomepageContent(),
      hasServerError: Boolean(error),
    };
  }

  return {
    content: normalizeHubHomepageContent(data),
    hasServerError: false,
  };
}
