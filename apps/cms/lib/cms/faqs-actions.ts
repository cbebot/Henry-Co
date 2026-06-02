"use client";

import { createCmsSupabaseBrowser } from "@/lib/supabase/browser";

type Result = { ok: true } | { ok: false; error: string };

/** The editable shape of a FAQ — everything except server-managed columns. */
export type FaqInput = {
  page_key: string;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
};

/**
 * Create a new FAQ. The owner RLS policy (is_owner()) authorises the insert.
 * Returns the new row id so the UI can track it without a full reload.
 */
export async function createFaq(input: FaqInput): Promise<Result & { id?: string }> {
  const supabase = createCmsSupabaseBrowser();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("company_faqs")
    .insert({
      page_key: input.page_key,
      question: input.question,
      answer: input.answer,
      sort_order: input.sort_order,
      is_published: input.is_published,
      updated_at: now,
    })
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  const id = data && typeof data.id === "string" ? data.id : undefined;
  return { ok: true, id };
}

/** Update an existing FAQ in place. updated_at is always refreshed. */
export async function updateFaq(id: string, input: FaqInput): Promise<Result> {
  const supabase = createCmsSupabaseBrowser();
  const { error } = await supabase
    .from("company_faqs")
    .update({
      page_key: input.page_key,
      question: input.question,
      answer: input.answer,
      sort_order: input.sort_order,
      is_published: input.is_published,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Permanently delete a FAQ. */
export async function deleteFaq(id: string): Promise<Result> {
  const supabase = createCmsSupabaseBrowser();
  const { error } = await supabase.from("company_faqs").delete().eq("id", id);
  return error ? { ok: false, error: error.message } : { ok: true };
}
