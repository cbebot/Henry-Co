import HubHomeClient from "./HubHomeClient";
import { getCompanySettings } from "../lib/company-settings";
import {
  normalizeCompanySettings,
  type CompanySettingsRecord,
} from "../lib/company-settings-shared";
import { getPublishedDivisions, type DivisionRow } from "../lib/divisions";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type PublicFaqRecord = {
  question?: string | null;
  answer?: string | null;
  page_key?: string | null;
  sort_order?: number | null;
  is_published?: boolean | null;
};

async function getHomeFaqs(): Promise<PublicFaqRecord[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) return [];

  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    });

    const { data, error } = await supabase
      .from("company_faqs")
      .select("question, answer, page_key, sort_order, is_published")
      .eq("page_key", "home")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (error || !data) return [];
    return data as PublicFaqRecord[];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  let hasServerError = false;

  const fallbackSettings: CompanySettingsRecord = normalizeCompanySettings(null);
  let settings = fallbackSettings;
  let divisions: DivisionRow[] = [];
  let faqs: PublicFaqRecord[] = [];

  try {
    const [settingsResult, divisionsResult, faqsResult] = await Promise.all([
      getCompanySettings().catch(() => null),
      getPublishedDivisions().catch(() => ({ divisions: [], hasServerError: true })),
      getHomeFaqs().catch(() => []),
    ]);

    settings = normalizeCompanySettings(settingsResult);
    divisions = Array.isArray(divisionsResult?.divisions) ? divisionsResult.divisions : [];
    faqs = Array.isArray(faqsResult) ? faqsResult : [];
    hasServerError = Boolean(
      settingsResult?.hasServerError || divisionsResult?.hasServerError
    );
  } catch {
    hasServerError = true;
  }

  return (
    <HubHomeClient
      brandTitle={settings.brand_title ?? "Henry & Co."}
      brandSub={settings.brand_subtitle ?? "Corporate Platform"}
      brandAccent={settings.brand_accent ?? "#C9A227"}
      brandLogoUrl={settings.logo_url ?? null}
      brandFooterBlurb={settings.footer_blurb ?? settings.brand_description ?? ""}
      intro={settings.brand_description ?? ""}
      initialDivisions={divisions}
      initialFaqs={faqs}
      hasServerError={hasServerError}
    />
  );
}
