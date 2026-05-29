import type { Metadata } from "next";
import { headers } from "next/headers";
import HubHomeClient from "./HubHomeClient";
import { getHubHomeCopy, resolveLocalizedDynamicField } from "@henryco/i18n/server";
import { getAccountUrl, henryWebRoot } from "@henryco/config";
import { getHubPublicLocale } from "../../lib/locale-server";
import { getCompanySettings } from "../lib/company-settings";
import { getHubSharedLoginUrl, getHubSharedSignupUrl } from "@/lib/hub-public-links";
import { getHubPublicChipUser } from "@/lib/hub-public-viewer";
import {
  normalizeCompanySettings,
  type CompanySettingsRecord,
} from "../lib/company-settings-shared";
import { getPublishedDivisions, type DivisionRow } from "../lib/divisions";
import { getDivisionLiveStats, type DivisionLiveStat } from "../lib/division-stats";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "HenryCo — Care, Marketplace, Property, Studio, and more",
  description:
    "HenryCo is a multi-division group: garment care, marketplace, property, studio, jobs, learn, and logistics — built around clear pricing, real records, and trusted delivery.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Henry & Co.",
    description:
      "Care, Marketplace, Property, Studio, Jobs, Learn, Logistics — premium services with honest delivery records.",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Henry & Co.",
    description:
      "Care, Marketplace, Property, Studio, Jobs, Learn, Logistics — premium services with honest delivery records.",
  },
};

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
  let divisionStats: Record<string, DivisionLiveStat> = {};

  try {
    const [settingsResult, divisionsResult, faqsResult] = await Promise.all([
      getCompanySettings().catch(() => null),
      getPublishedDivisions().catch(() => ({ divisions: [], hasServerError: true })),
      getHomeFaqs().catch(() => []),
    ]);

    settings = normalizeCompanySettings(settingsResult);
    /*
     * CHROME-01B FIX 10: coming-soon divisions are excluded from the public
     * home page entirely. They will earn their place when they launch — until
     * then, the hub presents only active operating businesses.
     */
    const allDivisions = Array.isArray(divisionsResult?.divisions)
      ? divisionsResult.divisions
      : [];
    divisions = allDivisions.filter((d) => d.status !== "coming_soon");
    faqs = Array.isArray(faqsResult) ? faqsResult : [];
    hasServerError = Boolean(
      settingsResult?.hasServerError || divisionsResult?.hasServerError
    );

    if (divisions.length) {
      const activeKeys = divisions
        .filter((d) => d.status === "active")
        .map((d) => String(d.key || "").toLowerCase())
        .filter(Boolean);
      divisionStats = await getDivisionLiveStats(activeKeys).catch(() => ({}));
    }
  } catch {
    hasServerError = true;
  }

  const locale = await getHubPublicLocale();
  const copy = getHubHomeCopy(locale);
  const machineTranslate = locale !== "en";

  // PASS i18n-100 — translate Supabase-row-driven text for the public hub
  // home through the cached DeepL pipeline. Brand strings, IDs, slugs,
  // URLs, colors, and numerics are left untouched. Array fields
  // (highlights / who_its_for / how_it_works / trust) are translated
  // element-by-element via `resolveLocalizedDynamicField` against a
  // synthetic single-field record.
  const settingsRecord = settings as unknown as Record<string, unknown>;
  const [
    brandTitleI18n,
    brandSubtitleI18n,
    brandDescriptionI18n,
    footerBlurbI18n,
  ] = await Promise.all([
    resolveLocalizedDynamicField({
      record: settingsRecord,
      field: "brand_title",
      locale,
      fallback: settings.brand_title ?? "Henry & Co.",
      machineTranslate,
    }),
    resolveLocalizedDynamicField({
      record: settingsRecord,
      field: "brand_subtitle",
      locale,
      fallback: settings.brand_subtitle ?? "Corporate Platform",
      machineTranslate,
    }),
    resolveLocalizedDynamicField({
      record: settingsRecord,
      field: "brand_description",
      locale,
      fallback: settings.brand_description ?? "",
      machineTranslate,
    }),
    resolveLocalizedDynamicField({
      record: settingsRecord,
      field: "footer_blurb",
      locale,
      fallback: settings.footer_blurb ?? settings.brand_description ?? "",
      machineTranslate,
    }),
  ]);

  const translateRowField = async (
    record: Record<string, unknown>,
    field: string,
    fallback: string,
  ) =>
    resolveLocalizedDynamicField({
      record,
      field,
      locale,
      fallback,
      machineTranslate,
    });

  const translateStringArray = async (items: string[]) =>
    Promise.all(
      items.map((item) =>
        item
          ? resolveLocalizedDynamicField({
              record: { value: item } as Record<string, unknown>,
              field: "value",
              locale,
              fallback: item,
              machineTranslate,
            })
          : Promise.resolve(item),
      ),
    );

  const localizedDivisions = await Promise.all(
    divisions.map(async (division) => {
      const record = division as unknown as Record<string, unknown>;
      const [name, tagline, description, highlights] = await Promise.all([
        translateRowField(record, "name", division.name),
        division.tagline
          ? translateRowField(record, "tagline", division.tagline)
          : Promise.resolve(division.tagline),
        division.description
          ? translateRowField(record, "description", division.description)
          : Promise.resolve(division.description),
        translateStringArray(division.highlights ?? []),
      ]);
      // `categories` are treated as filter taxonomy / enum-like keys and are
      // left in source language to keep cross-language filter behaviour
      // consistent with the public selector. Lead names are PII (skip).
      return {
        ...division,
        name,
        tagline,
        description,
        highlights,
      };
    }),
  );

  const localizedFaqs = await Promise.all(
    faqs.map(async (faq) => {
      const record = faq as unknown as Record<string, unknown>;
      const [question, answer] = await Promise.all([
        faq.question
          ? translateRowField(record, "question", faq.question)
          : Promise.resolve(faq.question ?? ""),
        faq.answer
          ? translateRowField(record, "answer", faq.answer)
          : Promise.resolve(faq.answer ?? ""),
      ]);
      return {
        ...faq,
        question,
        answer,
      };
    }),
  );

  const [chipUser, h] = await Promise.all([getHubPublicChipUser(), headers()]);
  const returnPath = h.get("x-hub-return-path") || "/";
  const accountChip = {
    user: chipUser,
    loginHref: getHubSharedLoginUrl(returnPath),
    signupHref: getHubSharedSignupUrl(returnPath),
    accountHref: getAccountUrl("/"),
  };
  const firstName = chipUser?.displayName?.trim().split(/\s+/).filter(Boolean)[0];
  const heroWelcome = firstName ? `Signed in · ${firstName}` : null;

  // V3-07(S2): Knowledge-Panel logo + canonical-URL JSON-LD pulls from
  // henryWebRoot() so preview/staging serve their own base domain in the
  // schema.org payload. CMS-driven `logo_url` still overrides the default.
  const organizationLogo =
    settings.logo_url || henryWebRoot("/brand/monogram.svg");
  const canonicalSiteUrl = henryWebRoot();
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brandTitleI18n || "HenryCo",
    url: canonicalSiteUrl,
    logo: organizationLogo,
    description:
      brandDescriptionI18n ||
      "HenryCo is a multi-division group: Care, Marketplace, Property, Studio, Jobs, Learn, and Logistics.",
  };
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brandTitleI18n || "HenryCo",
    url: canonicalSiteUrl,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    <HubHomeClient
      brandTitle={brandTitleI18n || "Henry & Co."}
      brandSub={brandSubtitleI18n || "Corporate Platform"}
      brandAccent={settings.brand_accent ?? "#C9A227"}
      brandLogoUrl={settings.logo_url ?? null}
      brandFooterBlurb={footerBlurbI18n}
      intro={brandDescriptionI18n}
      initialDivisions={localizedDivisions}
      initialFaqs={localizedFaqs}
      divisionStats={divisionStats}
      hasServerError={hasServerError}
      copy={copy}
      locale={locale}
      accountChip={accountChip}
      heroWelcome={heroWelcome}
    />
    </>
  );
}
