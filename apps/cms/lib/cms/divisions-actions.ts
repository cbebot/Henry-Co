"use client";

import { createCmsSupabaseBrowser } from "@/lib/supabase/browser";
import type { Division } from "./divisions";

type Result = { ok: true } | { ok: false; error: string };

/** The owner-editable fields of a division (slug + id stay read-only). */
export type DivisionInput = Omit<Division, "id" | "slug" | "updated_at">;

function trimOrNull(value: string): string | null {
  const t = value.trim();
  return t ? t : null;
}

/** Drop empty/whitespace entries so saved TEXT[] columns stay clean. */
function cleanList(values: string[]): string[] {
  return values.map((v) => v.trim()).filter((v) => v.length > 0);
}

/**
 * Save edits to a single division. Writes directly to the live
 * company_divisions row (this surface has no draft buffer) keyed by slug —
 * owner RLS (is_owner()) authorizes the update. updated_at is always refreshed.
 */
export async function saveDivision(slug: string, input: DivisionInput): Promise<Result> {
  const supabase = createCmsSupabaseBrowser();
  const { error } = await supabase
    .from("company_divisions")
    .update({
      name: input.name.trim(),
      tagline: trimOrNull(input.tagline),
      category: trimOrNull(input.category),
      status: input.status.trim() || "live",
      description: trimOrNull(input.description),
      short_description: trimOrNull(input.short_description),
      primary_url: trimOrNull(input.primary_url),
      domain: trimOrNull(input.domain),
      subdomain: trimOrNull(input.subdomain),
      accent: trimOrNull(input.accent),
      logo_url: trimOrNull(input.logo_url),
      cover_url: trimOrNull(input.cover_url),
      sort_order: Number.isFinite(input.sort_order) ? Math.trunc(input.sort_order) : 100,
      is_published: input.is_published,
      is_featured: input.is_featured,
      lead_name: trimOrNull(input.lead_name),
      lead_title: trimOrNull(input.lead_title),
      lead_avatar_url: trimOrNull(input.lead_avatar_url),
      highlights: cleanList(input.highlights),
      who_its_for: cleanList(input.who_its_for),
      how_it_works: cleanList(input.how_it_works),
      trust: cleanList(input.trust),
      categories: cleanList(input.categories),
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug);

  return error ? { ok: false, error: error.message } : { ok: true };
}
