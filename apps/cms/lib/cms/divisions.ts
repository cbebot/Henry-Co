import "server-only";
import { createCmsSupabaseServer } from "@/lib/supabase/server";

/**
 * Server data layer for the company_divisions surface. The authenticated owner
 * can SELECT every row (incl. unpublished) via the owner RLS policy. Postgres
 * TEXT[] columns are normalized to plain string[]; nullable text columns are
 * coalesced to "" so the editor never receives null in a controlled input.
 */

export type Division = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  status: string;
  description: string;
  short_description: string;
  primary_url: string;
  domain: string;
  subdomain: string;
  accent: string;
  logo_url: string;
  cover_url: string;
  sort_order: number;
  is_published: boolean;
  is_featured: boolean;
  lead_name: string;
  lead_title: string;
  lead_avatar_url: string;
  highlights: string[];
  who_its_for: string[];
  how_it_works: string[];
  trust: string[];
  categories: string[];
  updated_at: string | null;
};

type Row = Record<string, unknown>;

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function strArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeDivision(row: Row): Division {
  return {
    id: str(row.id),
    slug: str(row.slug),
    name: str(row.name),
    tagline: str(row.tagline),
    category: str(row.category),
    status: str(row.status) || "live",
    description: str(row.description),
    short_description: str(row.short_description),
    primary_url: str(row.primary_url),
    domain: str(row.domain),
    subdomain: str(row.subdomain),
    accent: str(row.accent),
    logo_url: str(row.logo_url),
    cover_url: str(row.cover_url),
    sort_order: num(row.sort_order, 100),
    is_published: Boolean(row.is_published),
    is_featured: Boolean(row.is_featured),
    lead_name: str(row.lead_name),
    lead_title: str(row.lead_title),
    lead_avatar_url: str(row.lead_avatar_url),
    highlights: strArray(row.highlights),
    who_its_for: strArray(row.who_its_for),
    how_it_works: strArray(row.how_it_works),
    trust: strArray(row.trust),
    categories: strArray(row.categories),
    updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
  };
}

/** All divisions, ordered by sort_order then name for a stable list. */
export async function listDivisions(): Promise<Division[]> {
  const supabase = await createCmsSupabaseServer();
  const { data } = await supabase
    .from("company_divisions")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  return (data ?? []).map((r: Row) => normalizeDivision(r));
}

/** A single division by its route slug, or null if it does not exist. */
export async function getDivision(slug: string): Promise<Division | null> {
  const supabase = await createCmsSupabaseServer();
  const { data } = await supabase
    .from("company_divisions")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data ? normalizeDivision(data as Row) : null;
}
