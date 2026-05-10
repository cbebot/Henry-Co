import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { LocaleProvider } from "@henryco/i18n/react";
import { getConsentCopy } from "@henryco/i18n/server";
import { EcosystemPreferences } from "@henryco/ui/public";
import { getAccountUrl } from "@henryco/config";
import PublicSiteShell from "../components/PublicSiteShell";
import { HubPublicProviders } from "../components/HubPublicProviders";
import { getCompanySettings } from "../lib/company-settings";
import { getHubPublicLocale } from "../../lib/locale-server";
import { getHubSharedLoginUrl, getHubSharedSignupUrl } from "@/lib/hub-public-links";
import { getHubPublicChipUser } from "@/lib/hub-public-viewer";

function toMetadataUrl(domain?: string | null) {
  const clean = String(domain || "").trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  if (!clean) return undefined;

  try {
    return new URL(`https://${clean}`);
  } catch {
    return undefined;
  }
}

// PASS 18C — locale-aware site metadata. Emits hreflang `languages` map and
// OpenGraph `locale` so the public hub announces its language alternates to
// crawlers. Locale is resolved per request from cookie/profile.
const PUBLIC_HUB_LOCALES = ["en", "fr", "es", "pt", "ar", "de", "it"] as const;
const HUB_OG_LOCALE: Record<string, string> = {
  en: "en_US",
  fr: "fr_FR",
  es: "es_ES",
  pt: "pt_PT",
  ar: "ar_EG",
  de: "de_DE",
  it: "it_IT",
};

export async function generateMetadata(): Promise<Metadata> {
  /** Belt-and-braces: getCompanySettings() already returns a fallback,
   * but if any future regression made it throw, we want metadata
   * generation to keep working rather than poisoning the route render. */
  const [{ settings }, locale] = await Promise.all([
    getCompanySettings().catch(() => ({
      settings: { default_meta_title: null, brand_title: null, brand_description: null, base_domain: null, favicon_url: null, logo_url: null } as never,
      hasServerError: true,
    })),
    getHubPublicLocale().catch(() => "en"),
  ]);
  const title = settings.default_meta_title || settings.brand_title || "Henry & Co.";
  const description =
    settings.default_meta_description ||
    settings.brand_description ||
    "Explore the businesses, services, and operating divisions of Henry & Co.";
  const icon = settings.favicon_url || settings.logo_url || undefined;
  const metadataBase = toMetadataUrl(settings.base_domain);
  const canonical = metadataBase ? metadataBase.toString().replace(/\/$/, "") + "/" : "/";
  const languagesMap: Record<string, string> = {};
  for (const code of PUBLIC_HUB_LOCALES) languagesMap[code] = canonical;
  languagesMap["x-default"] = canonical;
  const ogLocale = HUB_OG_LOCALE[locale] || HUB_OG_LOCALE.en;
  const ogAlternateLocale = PUBLIC_HUB_LOCALES.filter((l) => l !== locale).map(
    (l) => HUB_OG_LOCALE[l] || HUB_OG_LOCALE.en,
  );

  return {
    metadataBase,
    title,
    description,
    alternates: {
      canonical,
      languages: languagesMap,
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: ogLocale,
      alternateLocale: ogAlternateLocale,
      siteName: title,
      url: canonical,
    },
    icons: icon
      ? {
          icon: [{ url: icon }],
          shortcut: [{ url: icon }],
          apple: [{ url: icon }],
        }
      : undefined,
  };
}

export default async function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  /** Use allSettled so one failing fetcher (e.g. supabase auth flake on a
   * preview deploy where env is partially configured) cannot crash the
   * entire (site) tree and leak through to error.tsx. Each fetcher
   * already returns a safe shape; this is a hard barrier on top. */
  const [companyResult, localeResult, headerResult, chipResult] = await Promise.allSettled([
    getCompanySettings(),
    getHubPublicLocale(),
    headers(),
    getHubPublicChipUser(),
  ]);
  const company = companyResult.status === "fulfilled"
    ? companyResult.value
    : { settings: { brand_accent: "#C9A227" } as never, hasServerError: true };
  const locale = localeResult.status === "fulfilled" ? localeResult.value : "en";
  /** headers() shouldn't realistically reject in this context, but if it
   * ever did we want to fall back to a "no headers known" reader rather
   * than crash the layout. The narrow contract used downstream is .get(). */
  const headerReader: { get: (name: string) => string | null } =
    headerResult.status === "fulfilled" ? headerResult.value : { get: () => null };
  const chipUser = chipResult.status === "fulfilled" ? chipResult.value : null;
  const { settings } = company;
  const consentCopy = getConsentCopy(locale);
  const returnPath = headerReader.get("x-hub-return-path") || "/";
  const accountChip = {
    user: chipUser,
    loginHref: getHubSharedLoginUrl(returnPath),
    signupHref: getHubSharedSignupUrl(returnPath),
    accountHref: getAccountUrl("/"),
  };

  return (
    <HubPublicProviders>
        <LocaleProvider locale={locale}>
          <PublicSiteShell initialSettings={settings} accountChip={accountChip}>
            {children}
          </PublicSiteShell>
          <EcosystemPreferences copy={consentCopy} initialLocale={locale} />
        </LocaleProvider>
      </HubPublicProviders>
  );
}
