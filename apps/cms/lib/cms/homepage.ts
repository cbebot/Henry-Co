import "server-only";
import { createCmsSupabaseServer } from "@/lib/supabase/server";
import { HOME_PAGE_KEY } from "./homepage-shared";

/**
 * Server data layer for the editorial hub homepage (table `hub_homepage_content`).
 *
 * The live hub reader (apps/hub/app/lib/homepage.ts) keys this single record by
 * `page_key = "home"` and consumes four jsonb columns with these exact shapes:
 *   - operating_points / value_cards / ecosystem_points: { id, eyebrow?, title?, body? }
 *   - faqs:                                               { id, q, a }
 * The reader filters list items to those with a title or body (faqs need both q
 * and a), so the editor writes those keys precisely. We normalize every read so
 * the client editor always receives stable, fully-typed values.
 */

// HOME_PAGE_KEY lives in homepage-shared so the client write layer can import it.
export { HOME_PAGE_KEY };

/** A point/card item (operating_points, value_cards, ecosystem_points). */
export type HomepageItem = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
};

/** A single FAQ entry — the hub reader uses `q` / `a`, not question/answer. */
export type HomepageFaq = {
  id: string;
  q: string;
  a: string;
};

export type HomepageContent = {
  page_key: string;
  hero_badge: string;
  hero_title: string;
  hero_highlight: string;
  hero_description: string;
  hero_image_url: string;
  primary_cta_label: string;
  primary_cta_href: string;
  secondary_cta_label: string;
  secondary_cta_href: string;
  operating_title: string;
  operating_body: string;
  operating_points: HomepageItem[];
  value_cards: HomepageItem[];
  featured_title: string;
  featured_body: string;
  directory_title: string;
  directory_body: string;
  ecosystem_title: string;
  ecosystem_body: string;
  ecosystem_points: HomepageItem[];
  owner_section_badge: string;
  owner_section_title: string;
  owner_name: string;
  owner_role: string;
  owner_message: string;
  owner_image_url: string;
  owner_signature: string;
  faq_title: string;
  faq_body: string;
  faqs: HomepageFaq[];
  footer_blurb: string;
  is_published: boolean;
};

/** The editor state: the normalized content plus the row id (null when no row exists yet). */
export type HomepageState = {
  id: string | null;
  content: HomepageContent;
  updated_at: string | null;
};

type Row = Record<string, unknown>;

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeItem(value: unknown, index: number): HomepageItem {
  const item = value && typeof value === "object" ? (value as Row) : {};
  return {
    id: str(item.id) || `item-${index + 1}`,
    eyebrow: str(item.eyebrow),
    title: str(item.title),
    body: str(item.body),
  };
}

function normalizeFaq(value: unknown, index: number): HomepageFaq {
  const item = value && typeof value === "object" ? (value as Row) : {};
  return {
    id: str(item.id) || `faq-${index + 1}`,
    q: str(item.q),
    a: str(item.a),
  };
}

function normalizeItems(value: unknown): HomepageItem[] {
  return Array.isArray(value) ? value.map(normalizeItem) : [];
}

function normalizeFaqs(value: unknown): HomepageFaq[] {
  return Array.isArray(value) ? value.map(normalizeFaq) : [];
}

/** Build the canonical content object from a raw DB row (or an empty record). */
export function normalizeHomepage(row: Row): HomepageContent {
  return {
    page_key: str(row.page_key) || HOME_PAGE_KEY,
    hero_badge: str(row.hero_badge),
    hero_title: str(row.hero_title),
    hero_highlight: str(row.hero_highlight),
    hero_description: str(row.hero_description),
    hero_image_url: str(row.hero_image_url),
    primary_cta_label: str(row.primary_cta_label),
    primary_cta_href: str(row.primary_cta_href),
    secondary_cta_label: str(row.secondary_cta_label),
    secondary_cta_href: str(row.secondary_cta_href),
    operating_title: str(row.operating_title),
    operating_body: str(row.operating_body),
    operating_points: normalizeItems(row.operating_points),
    value_cards: normalizeItems(row.value_cards),
    featured_title: str(row.featured_title),
    featured_body: str(row.featured_body),
    directory_title: str(row.directory_title),
    directory_body: str(row.directory_body),
    ecosystem_title: str(row.ecosystem_title),
    ecosystem_body: str(row.ecosystem_body),
    ecosystem_points: normalizeItems(row.ecosystem_points),
    owner_section_badge: str(row.owner_section_badge),
    owner_section_title: str(row.owner_section_title),
    owner_name: str(row.owner_name),
    owner_role: str(row.owner_role),
    owner_message: str(row.owner_message),
    owner_image_url: str(row.owner_image_url),
    owner_signature: str(row.owner_signature),
    faq_title: str(row.faq_title),
    faq_body: str(row.faq_body),
    faqs: normalizeFaqs(row.faqs),
    footer_blurb: str(row.footer_blurb),
    is_published: Boolean(row.is_published),
  };
}

/** Sensible empty defaults when the table has no row yet (it currently has zero rows). */
export function emptyHomepageContent(): HomepageContent {
  return normalizeHomepage({ page_key: HOME_PAGE_KEY });
}

/**
 * Read the single homepage record. Prefers the canonical `page_key = "home"`
 * row, but falls back to any existing row so a stray record is still editable.
 * Returns empty defaults (with id = null) when the table is empty.
 */
export async function getHomepage(): Promise<HomepageState> {
  const supabase = await createCmsSupabaseServer();

  const { data: keyed } = await supabase
    .from("hub_homepage_content")
    .select("*")
    .eq("page_key", HOME_PAGE_KEY)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let row = keyed as Row | null;

  if (!row) {
    const { data: fallbackRow } = await supabase
      .from("hub_homepage_content")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    row = fallbackRow as Row | null;
  }

  if (!row) {
    return { id: null, content: emptyHomepageContent(), updated_at: null };
  }

  return {
    id: typeof row.id === "string" ? row.id : null,
    content: normalizeHomepage(row),
    updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
  };
}
