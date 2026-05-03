import type { Metadata } from "next";
import { headers } from "next/headers";
import HubHomeClient from "./HubHomeClient";
import { getHubHomeCopy } from "@henryco/i18n/server";
import { getAccountUrl } from "@henryco/config";
import { getHubPublicLocale } from "../../lib/locale-server";
import { getCompanySettings } from "../lib/company-settings";
import { getHubSharedLoginUrl, getHubSharedSignupUrl } from "@/lib/hub-public-links";
import { getHubPublicChipUser } from "@/lib/hub-public-viewer";
import {
  normalizeCompanySettings,
  type CompanySettingsRecord,
} from "../lib/company-settings-shared";
import { getPublishedDivisions, type DivisionRow } from "../lib/divisions";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "HenryCo — Care, Marketplace, Property, Studio, and more",
  description:
    "HenryCo is a multi-division group: garment care, marketplace, property, studio, jobs, learn, and logistics — built around clear pricing, real records, and trusted delivery.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "HenryCo Group",
    description:
      "Care, Marketplace, Property, Studio, Jobs, Learn, Logistics — premium services with honest delivery records.",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "HenryCo Group",
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

  const locale = await getHubPublicLocale();
  const copy = getHubHomeCopy(locale);

  const [chipUser, h] = await Promise.all([getHubPublicChipUser(), headers()]);
  const returnPath = h.get("x-hub-return-path") || "/";
  const accountChip = {
    user: chipUser,
    loginHref: getHubSharedLoginUrl(returnPath),
    signupHref: getHubSharedSignupUrl(returnPath),
    accountHref: getAccountUrl("/"),
  };
  const firstName = chipUser?.displayName?.trim().split(/\s+/).filter(Boolean)[0];
  const heroWelcome = firstName ? `Welcome back, ${firstName}` : null;

  // Fall back to the platform-served brand monogram so the Knowledge Panel
  // logo never goes empty. CMS-driven `logo_url` overrides the default.
  const organizationLogo =
    settings.logo_url || "https://henrycogroup.com/brand/monogram.svg";
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.brand_title ?? "HenryCo",
    url: "https://henrycogroup.com",
    logo: organizationLogo,
    description:
      settings.brand_description ??
      "HenryCo is a multi-division group: Care, Marketplace, Property, Studio, Jobs, Learn, and Logistics.",
  };
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.brand_title ?? "HenryCo",
    url: "https://henrycogroup.com",
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
      brandTitle={settings.brand_title ?? "Henry & Co."}
      brandSub={settings.brand_subtitle ?? "Corporate Platform"}
      brandAccent={settings.brand_accent ?? "#C9A227"}
      brandLogoUrl={settings.logo_url ?? null}
      brandFooterBlurb={settings.footer_blurb ?? settings.brand_description ?? ""}
      intro={settings.brand_description ?? ""}
      initialDivisions={divisions}
      initialFaqs={faqs}
      hasServerError={hasServerError}
      copy={copy}
      locale={locale}
      accountChip={accountChip}
      heroWelcome={heroWelcome}
    />
    </>
  );
}
