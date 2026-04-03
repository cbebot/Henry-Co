import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { DivisionDbRow, DivisionRow } from "./divisions";
import { normalizeDivision } from "./divisions";

type DivisionPublicRecord = DivisionDbRow & {
  id: string;
  slug: string | null;
  name: string | null;
  tagline: string | null;
  description: string | null;
  accent: string | null;
  primary_url: string | null;
  subdomain: string | null;
  logo_url: string | null;
  cover_url: string | null;
  categories: string[] | null;
  highlights: string[] | null;
  who_its_for: string[] | null;
  how_it_works: string[] | null;
  trust: string[] | null;
  status: "active" | "coming_soon" | "paused" | null;
  lead_person_id: string | null;
  lead_name: string | null;
  lead_title: string | null;
  lead_avatar_url: string | null;
  is_featured: boolean | null;
  sort_order: number | null;
  is_published: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

async function createSupabaseServer() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {},
    },
  });
}

export async function getPublishedDivisions(): Promise<{
  divisions: DivisionRow[];
  hasServerError: boolean;
}> {
  try {
    const supabase = await createSupabaseServer();

    const { data, error } = await supabase
      .from("company_divisions")
      .select(
        `
        id,
        slug,
        name,
        tagline,
        description,
        accent,
        primary_url,
        subdomain,
        logo_url,
        cover_url,
        categories,
        highlights,
        who_its_for,
        how_it_works,
        trust,
        status,
        lead_name,
        lead_title,
        lead_avatar_url,
        is_featured,
        sort_order,
        is_published,
        created_at,
        updated_at
      `
      )
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("updated_at", { ascending: false });

    if (error || !data) {
      return { divisions: [], hasServerError: true };
    }

    const divisions = (data as DivisionPublicRecord[]).map((row) =>
      normalizeDivision({
        ...row,
        accent: row.accent ?? "#C9A227",
        categories: Array.isArray(row.categories) ? row.categories : [],
        highlights: Array.isArray(row.highlights) ? row.highlights : [],
        who_its_for: Array.isArray(row.who_its_for) ? row.who_its_for : [],
        how_it_works: Array.isArray(row.how_it_works) ? row.how_it_works : [],
        trust: Array.isArray(row.trust) ? row.trust : [],
      })
    );

    return { divisions, hasServerError: false };
  } catch {
    return { divisions: [], hasServerError: true };
  }
}
