import "server-only";
import { createCmsSupabaseServer } from "@/lib/supabase/server";

export type PageSection = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  layout: string;
};

export type PageStat = { id: string; label: string; value: string };

export type CmsPageContent = {
  title: string;
  subtitle: string;
  hero_badge: string;
  intro: string;
  hero_image_url: string;
  primary_cta_label: string;
  primary_cta_href: string;
  secondary_cta_label: string;
  secondary_cta_href: string;
  sections: PageSection[];
  stats: PageStat[];
  seo_title: string;
  seo_description: string;
};

export type CmsPage = CmsPageContent & {
  slug: string;
  status: string;
  is_published: boolean;
  version: number;
  updated_at: string | null;
  has_draft: boolean;
};

const PAGE_LABELS: Record<string, string> = {
  home: "Homepage",
  about: "About",
  contact: "Contact",
  privacy: "Privacy",
  terms: "Terms",
};

export function pageLabel(slug: string): string {
  return PAGE_LABELS[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
}

function str(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v;
  }
  return "";
}

type Row = Record<string, unknown>;

function normalizeSections(row: Row): PageSection[] {
  const raw = Array.isArray(row.sections) && row.sections.length
    ? row.sections
    : Array.isArray(row.body) && (row.body as unknown[]).length
      ? row.body
      : [];
  return (raw as Row[]).map((s, i) => ({
    id: typeof s?.id === "string" ? (s.id as string) : `section-${i + 1}`,
    eyebrow: str(s?.eyebrow),
    title: str(s?.title),
    body: str(s?.body),
    layout: str(s?.layout) || "default",
  }));
}

/** Read the canonical content from a raw company_pages row, taming the aliases. */
export function normalizeContent(row: Row): CmsPageContent {
  return {
    title: str(row.title, row.hero_title),
    subtitle: str(row.subtitle),
    hero_badge: str(row.hero_badge, row.hero_kicker),
    intro: str(row.intro, row.hero_body, row.intro_body),
    hero_image_url: str(row.hero_image_url, row.cover_image_url),
    primary_cta_label: str(row.primary_cta_label, row.cta_primary_label, row.hero_primary_label),
    primary_cta_href: str(row.primary_cta_href, row.cta_primary_href, row.hero_primary_href),
    secondary_cta_label: str(row.secondary_cta_label, row.cta_secondary_label, row.hero_secondary_label),
    secondary_cta_href: str(row.secondary_cta_href, row.cta_secondary_href, row.hero_secondary_href),
    sections: normalizeSections(row),
    stats: (Array.isArray(row.stats) ? row.stats : []).map((s: Row, i: number) => ({
      id: typeof s?.id === "string" ? (s.id as string) : `stat-${i + 1}`,
      label: str(s?.label),
      value: str(s?.value),
    })),
    seo_title: str(row.seo_title),
    seo_description: str(row.seo_description),
  };
}

function normalizePage(row: Row, hasDraft: boolean): CmsPage {
  return {
    ...normalizeContent(row),
    slug: str(row.slug, row.page_key),
    status: str(row.status) || (row.is_published ? "published" : "draft"),
    is_published: Boolean(row.is_published),
    version: Number(row.version ?? 1),
    updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
    has_draft: hasDraft,
  };
}

export async function listPages(): Promise<CmsPage[]> {
  const supabase = await createCmsSupabaseServer();
  const [{ data: rows }, { data: drafts }] = await Promise.all([
    supabase.from("company_pages").select("*").is("deleted_at", null),
    supabase.from("company_page_drafts").select("page_slug"),
  ]);
  const draftSlugs = new Set((drafts ?? []).map((d: Row) => str(d.page_slug)));
  return (rows ?? [])
    .map((r: Row) => normalizePage(r, draftSlugs.has(str(r.slug, r.page_key))))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export type PageEditState = {
  page: CmsPage;
  /** The unpublished draft content, if one exists (overlays the live page in the editor). */
  draft: CmsPageContent | null;
};

export async function getPageForEdit(slug: string): Promise<PageEditState | null> {
  const supabase = await createCmsSupabaseServer();
  const [{ data: row }, { data: draftRow }] = await Promise.all([
    supabase.from("company_pages").select("*").eq("slug", slug).maybeSingle(),
    supabase.from("company_page_drafts").select("draft").eq("page_slug", slug).maybeSingle(),
  ]);
  if (!row) return null;
  const draft = draftRow?.draft ? normalizeContent(draftRow.draft as Row) : null;
  return { page: normalizePage(row, Boolean(draft)), draft };
}
