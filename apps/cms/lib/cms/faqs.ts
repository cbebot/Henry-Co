import "server-only";
import { createCmsSupabaseServer } from "@/lib/supabase/server";
import { FAQ_PAGE_KEYS, faqPageLabel, type Faq, type FaqGroup } from "./faqs-shared";

// Re-export the client-safe surface so server-side importers keep a stable API.
export type { Faq, FaqGroup } from "./faqs-shared";
export { FAQ_PAGE_KEYS, faqPageLabel } from "./faqs-shared";

type Row = Record<string, unknown>;

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeFaq(row: Row): Faq {
  return {
    id: str(row.id),
    page_key: str(row.page_key) || "home",
    question: str(row.question),
    answer: str(row.answer),
    sort_order: Number(row.sort_order ?? 0),
    is_published: Boolean(row.is_published),
    updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
  };
}

/**
 * Every FAQ the owner can manage — published or not — ordered by page_key then
 * sort_order so the manager renders in a stable, predictable order.
 */
export async function listFaqs(): Promise<Faq[]> {
  const supabase = await createCmsSupabaseServer();
  const { data: rows } = await supabase
    .from("company_faqs")
    .select("*")
    .order("page_key", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: true });
  return (rows ?? []).map((r: Row) => normalizeFaq(r));
}

const KEY_RANK: Record<string, number> = Object.fromEntries(
  FAQ_PAGE_KEYS.map((key, index) => [key, index])
);

/**
 * The same data as `listFaqs`, bucketed by page_key for the grouped UI. Known
 * page keys lead in their canonical order; any unexpected key sorts after them.
 */
export async function listFaqGroups(): Promise<FaqGroup[]> {
  const faqs = await listFaqs();
  const buckets = new Map<string, Faq[]>();
  for (const faq of faqs) {
    const existing = buckets.get(faq.page_key);
    if (existing) existing.push(faq);
    else buckets.set(faq.page_key, [faq]);
  }
  return Array.from(buckets.entries())
    .map(([page_key, groupFaqs]): FaqGroup => ({
      page_key,
      label: faqPageLabel(page_key),
      faqs: groupFaqs,
    }))
    .sort((a, b) => {
      const rankA = KEY_RANK[a.page_key] ?? FAQ_PAGE_KEYS.length;
      const rankB = KEY_RANK[b.page_key] ?? FAQ_PAGE_KEYS.length;
      if (rankA !== rankB) return rankA - rankB;
      return a.page_key.localeCompare(b.page_key);
    });
}
