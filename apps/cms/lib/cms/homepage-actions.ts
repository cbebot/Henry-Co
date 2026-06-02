"use client";

import { createCmsSupabaseBrowser } from "@/lib/supabase/browser";
import { HOME_PAGE_KEY } from "./homepage-shared";
import type { HomepageContent } from "./homepage";

type Result = { ok: true; id: string } | { ok: false; error: string };

/**
 * Map the editor content to the DB column shape. Empty scalar strings are
 * written as null (matching how the hub reader coalesces blanks), while the
 * jsonb arrays are written verbatim in the exact element shape the live hub
 * consumes ({id,eyebrow,title,body} for points/cards; {id,q,a} for faqs).
 */
function toRow(content: HomepageContent): Record<string, unknown> {
  const nz = (v: string) => (v.trim() ? v : null);
  return {
    page_key: content.page_key.trim() || HOME_PAGE_KEY,
    hero_badge: nz(content.hero_badge),
    hero_title: nz(content.hero_title),
    hero_highlight: nz(content.hero_highlight),
    hero_description: nz(content.hero_description),
    hero_image_url: nz(content.hero_image_url),
    primary_cta_label: nz(content.primary_cta_label),
    primary_cta_href: nz(content.primary_cta_href),
    secondary_cta_label: nz(content.secondary_cta_label),
    secondary_cta_href: nz(content.secondary_cta_href),
    operating_title: nz(content.operating_title),
    operating_body: nz(content.operating_body),
    operating_points: content.operating_points,
    value_cards: content.value_cards,
    featured_title: nz(content.featured_title),
    featured_body: nz(content.featured_body),
    directory_title: nz(content.directory_title),
    directory_body: nz(content.directory_body),
    ecosystem_title: nz(content.ecosystem_title),
    ecosystem_body: nz(content.ecosystem_body),
    ecosystem_points: content.ecosystem_points,
    owner_section_badge: nz(content.owner_section_badge),
    owner_section_title: nz(content.owner_section_title),
    owner_name: nz(content.owner_name),
    owner_role: nz(content.owner_role),
    owner_message: nz(content.owner_message),
    owner_image_url: nz(content.owner_image_url),
    owner_signature: nz(content.owner_signature),
    faq_title: nz(content.faq_title),
    faq_body: nz(content.faq_body),
    faqs: content.faqs,
    footer_blurb: nz(content.footer_blurb),
    is_published: content.is_published,
  };
}

/**
 * Save the single homepage record. The table is empty by default, so this is a
 * manual upsert that does NOT rely on a unique constraint:
 *   - if `id` is known, UPDATE that row;
 *   - else read the existing `page_key = "home"` row and UPDATE it;
 *   - else INSERT a fresh row with `page_key = "home"`.
 * `updated_at` is always set to a fresh ISO timestamp. Returns the row id so the
 * client can switch from insert-mode to update-mode after the first save.
 */
export async function saveHomepage(
  id: string | null,
  content: HomepageContent
): Promise<Result> {
  const supabase = createCmsSupabaseBrowser();
  const now = new Date().toISOString();
  const pageKey = content.page_key.trim() || HOME_PAGE_KEY;
  const row: Record<string, unknown> = { ...toRow(content), updated_at: now };

  // Resolve the target row id: explicit prop first, then any existing home row.
  let targetId = id;
  if (!targetId) {
    const { data: existing, error: lookupError } = await supabase
      .from("hub_homepage_content")
      .select("id")
      .eq("page_key", pageKey)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lookupError) return { ok: false, error: lookupError.message };
    if (existing && typeof existing.id === "string") targetId = existing.id;
  }

  if (targetId) {
    const { data, error } = await supabase
      .from("hub_homepage_content")
      .update(row)
      .eq("id", targetId)
      .select("id")
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data || typeof data.id !== "string") {
      return {
        ok: false,
        error: "This record changed in another session — reload before saving.",
      };
    }
    return { ok: true, id: data.id };
  }

  const { data, error } = await supabase
    .from("hub_homepage_content")
    .insert(row)
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  if (!data || typeof data.id !== "string") {
    return { ok: false, error: "Save did not return a record id." };
  }
  return { ok: true, id: data.id };
}
