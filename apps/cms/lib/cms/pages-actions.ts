"use client";

import { createCmsSupabaseBrowser } from "@/lib/supabase/browser";
import type { CmsPageContent } from "./pages";

type Result = { ok: true } | { ok: false; error: string };

/**
 * Save edits to the owner-only draft buffer. The LIVE page is never touched —
 * the public site keeps showing the published version until you publish.
 */
export async function saveDraft(slug: string, content: CmsPageContent): Promise<Result> {
  const supabase = createCmsSupabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("company_page_drafts").upsert(
    {
      page_slug: slug,
      draft: content,
      author_id: user?.id ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "page_slug" }
  );
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function discardDraft(slug: string): Promise<Result> {
  const supabase = createCmsSupabaseBrowser();
  const { error } = await supabase.from("company_page_drafts").delete().eq("page_slug", slug);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/**
 * Publish: write the canonical columns to the live company_pages row (the public
 * reader coalesces these first, so they win over any legacy aliases), bump the
 * version with optimistic-concurrency, append a restorable revision, and clear
 * the draft. The live site updates within its realtime round-trip — no redeploy.
 */
export async function publishPage(
  slug: string,
  content: CmsPageContent,
  expectedVersion: number
): Promise<Result & { version?: number }> {
  const supabase = createCmsSupabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const now = new Date().toISOString();
  const nextVersion = expectedVersion + 1;

  const { data, error } = await supabase
    .from("company_pages")
    .update({
      title: content.title,
      subtitle: content.subtitle || null,
      hero_badge: content.hero_badge || null,
      intro: content.intro || null,
      hero_image_url: content.hero_image_url || null,
      primary_cta_label: content.primary_cta_label || null,
      primary_cta_href: content.primary_cta_href || null,
      secondary_cta_label: content.secondary_cta_label || null,
      secondary_cta_href: content.secondary_cta_href || null,
      sections: content.sections,
      stats: content.stats,
      seo_title: content.seo_title || null,
      seo_description: content.seo_description || null,
      status: "published",
      is_published: true,
      published_at: now,
      published_by: user?.id ?? null,
      version: nextVersion,
      updated_at: now,
    })
    .eq("slug", slug)
    .eq("version", expectedVersion)
    .select("slug")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) {
    return {
      ok: false,
      error: "This page changed in another session — reload before publishing.",
    };
  }

  // Best-effort: append a restorable revision and clear the draft buffer.
  await supabase
    .from("company_page_revisions")
    .insert({
      page_slug: slug,
      revision_no: nextVersion,
      snapshot: content,
      author_id: user?.id ?? null,
      label: "publish",
    })
    .then(() => undefined, () => undefined);
  await supabase
    .from("company_page_drafts")
    .delete()
    .eq("page_slug", slug)
    .then(() => undefined, () => undefined);

  return { ok: true, version: nextVersion };
}
