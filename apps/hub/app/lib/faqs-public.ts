import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export type PublicFaq = {
  id: string;
  page_key: string;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
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

export async function getPublishedFaqs(pageKey = "home"): Promise<{
  faqs: PublicFaq[];
  hasServerError: boolean;
}> {
  try {
    const supabase = await createSupabaseServer();

    const { data, error } = await supabase
      .from("company_faqs")
      .select("id, page_key, question, answer, sort_order, is_published")
      .eq("page_key", pageKey)
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (error || !data) {
      return { faqs: [], hasServerError: true };
    }

    return {
      faqs: (data as PublicFaq[]) ?? [],
      hasServerError: false,
    };
  } catch {
    return { faqs: [], hasServerError: true };
  }
}