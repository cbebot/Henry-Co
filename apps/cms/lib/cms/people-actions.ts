"use client";

import { createCmsSupabaseBrowser } from "@/lib/supabase/browser";
import type { PersonInput } from "./people-shared";

// Re-export so the editor can import the input type from the actions module.
export type { PersonInput } from "./people-shared";

type Result = { ok: true } | { ok: false; error: string };

/**
 * Build the DB payload from editor input, keeping every alias pair in sync so
 * the public reader sees the same value whichever column it coalesces first:
 *   page_key ↔ page_slug, image_url ↔ photo_url, role_label ↔ role_title.
 * `bio` mirrors the long bio (it is NOT NULL in the table). NOT-NULL text
 * columns are written as empty strings rather than null.
 */
function toRow(input: PersonInput, updatedAt: string): Record<string, unknown> {
  const pageSlug = input.page_slug.trim() || "about";
  return {
    full_name: input.full_name.trim(),
    role_title: input.role_title || null,
    role_label: input.role_title || null,
    job_title: input.job_title || null,
    kind: input.kind || "team",
    group_key: input.group_key || "leadership",
    department: input.department,
    page_slug: pageSlug,
    page_key: pageSlug,
    division_slug: input.division_slug || null,
    short_bio: input.short_bio || null,
    long_bio: input.long_bio || null,
    bio: input.long_bio,
    photo_url: input.photo_url || null,
    image_url: input.photo_url,
    email: input.email || null,
    phone: input.phone || null,
    linkedin_url: input.linkedin_url || null,
    is_owner: input.is_owner,
    is_manager: input.is_manager,
    is_featured: input.is_featured,
    is_published: input.is_published,
    sort_order: Number.isFinite(input.sort_order) ? input.sort_order : 100,
    updated_at: updatedAt,
  };
}

/**
 * Save a person: UPDATE by id when an id is present, otherwise INSERT and
 * return the new id so the editor can route to the freshly created record.
 */
export async function savePerson(input: PersonInput): Promise<Result & { id?: string }> {
  const supabase = createCmsSupabaseBrowser();
  const now = new Date().toISOString();
  const row = toRow(input, now);

  if (input.id) {
    const { error } = await supabase.from("company_people").update(row).eq("id", input.id);
    return error ? { ok: false, error: error.message } : { ok: true, id: input.id };
  }

  const { data, error } = await supabase
    .from("company_people")
    .insert(row)
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  const newId = typeof data?.id === "string" ? data.id : undefined;
  return { ok: true, id: newId };
}

export async function deletePerson(id: string): Promise<Result> {
  const supabase = createCmsSupabaseBrowser();
  const { error } = await supabase.from("company_people").delete().eq("id", id);
  return error ? { ok: false, error: error.message } : { ok: true };
}
