import { createClient } from "@supabase/supabase-js";
import { fetchNoStore } from "./no-store-fetch";

export type HomepageFaqItem = {
  id: string;
  page_slug: string;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
};

export async function getHomepageFaqs() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    return {
      items: [] as HomepageFaqItem[],
      hasServerError: true,
    };
  }

  const supabase = createClient(url, anon, {
    global: {
      fetch: fetchNoStore,
    },
  });

  const { data, error } = await supabase
    .from("company_homepage_faqs")
    .select("*")
    .eq("page_slug", "home")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error || !data) {
    return {
      items: [] as HomepageFaqItem[],
      hasServerError: true,
    };
  }

  return {
    items: data as HomepageFaqItem[],
    hasServerError: false,
  };
}
