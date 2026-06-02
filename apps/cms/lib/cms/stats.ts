import "server-only";
import { createCmsSupabaseServer } from "@/lib/supabase/server";

export type CmsStats = {
  pages: number;
  divisions: number;
  people: number;
  faqs: number;
  pageDrafts: number;
};

type Client = Awaited<ReturnType<typeof createCmsSupabaseServer>>;

async function countRows(supabase: Client, table: string): Promise<number> {
  try {
    const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Live record counts for the dashboard overview. Resilient: any failure → 0. */
export async function getCmsStats(): Promise<CmsStats> {
  const supabase = await createCmsSupabaseServer();
  const [pages, divisions, people, faqs, pageDrafts] = await Promise.all([
    countRows(supabase, "company_pages"),
    countRows(supabase, "company_divisions"),
    countRows(supabase, "company_people"),
    countRows(supabase, "company_faqs"),
    countRows(supabase, "company_page_drafts"),
  ]);
  return { pages, divisions, people, faqs, pageDrafts };
}
