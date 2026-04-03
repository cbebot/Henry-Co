import { createClient } from "@supabase/supabase-js";
import {
  normalizeCompanyPerson,
  type CompanyPersonRecord,
} from "./company-people-shared";

export type { CompanyPersonRecord } from "./company-people-shared";

export async function getPublishedPeople(pageKey = "about") {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    return {
      people: [] as CompanyPersonRecord[],
      hasServerError: true,
    };
  }

  const supabase = createClient(url, anon, {
    global: {
      fetch: (input, init) =>
        fetch(input as RequestInfo | URL, {
          ...init,
          cache: "no-store",
        }),
    },
  });

  const { data, error } = await supabase
    .from("company_people")
    .select("*")
    .eq("is_published", true)
    .or(`page_key.eq.${pageKey},page_slug.eq.${pageKey}`)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) {
    return {
      people: [] as CompanyPersonRecord[],
      hasServerError: true,
    };
  }

  return {
    people: (data as Partial<CompanyPersonRecord>[]).map((row) =>
      normalizeCompanyPerson(row)
    ),
    hasServerError: false,
  };
}
