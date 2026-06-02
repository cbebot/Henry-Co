import "server-only";
import { createCmsSupabaseServer } from "@/lib/supabase/server";

/**
 * Canonical shape of a person on the public site (leadership / team members).
 * The DB carries a few alias pairs (page_key↔page_slug, image_url↔photo_url,
 * role_label↔role_title); we read the canonical member and the write layer
 * keeps both members of each pair in sync so public readers stay consistent.
 */
export type Person = {
  id: string;
  full_name: string;
  role_title: string;
  job_title: string;
  kind: string;
  group_key: string;
  department: string;
  page_slug: string;
  division_slug: string;
  short_bio: string;
  long_bio: string;
  photo_url: string;
  email: string;
  phone: string;
  linkedin_url: string;
  is_owner: boolean;
  is_manager: boolean;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  updated_at: string | null;
};

// Re-export the client-safe constant so server-side importers keep a stable API.
export { PERSON_KINDS } from "./people-shared";

type Row = Record<string, unknown>;

function str(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v;
  }
  return "";
}

function normalizePerson(row: Row): Person {
  return {
    id: str(row.id),
    full_name: str(row.full_name),
    role_title: str(row.role_title, row.role_label),
    job_title: str(row.job_title),
    kind: str(row.kind) || "team",
    group_key: str(row.group_key),
    department: str(row.department),
    page_slug: str(row.page_slug, row.page_key) || "about",
    division_slug: str(row.division_slug),
    short_bio: str(row.short_bio),
    long_bio: str(row.long_bio, row.bio),
    photo_url: str(row.photo_url, row.image_url),
    email: str(row.email),
    phone: str(row.phone),
    linkedin_url: str(row.linkedin_url),
    is_owner: Boolean(row.is_owner),
    is_manager: Boolean(row.is_manager),
    is_featured: Boolean(row.is_featured),
    is_published: Boolean(row.is_published),
    sort_order: Number(row.sort_order ?? 100),
    updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
  };
}

export async function listPeople(): Promise<Person[]> {
  const supabase = await createCmsSupabaseServer();
  const { data } = await supabase
    .from("company_people")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("full_name", { ascending: true });
  return (data ?? []).map((r: Row) => normalizePerson(r));
}

export async function getPerson(id: string): Promise<Person | null> {
  const supabase = await createCmsSupabaseServer();
  const { data } = await supabase
    .from("company_people")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? normalizePerson(data as Row) : null;
}
