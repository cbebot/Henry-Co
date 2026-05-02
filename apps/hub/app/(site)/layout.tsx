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

export async function generateMetadata(): Promise<Metadata> {
  /** Belt-and-braces: getCompanySettings() already returns a fallback,
   * but if any future regression made it throw, we want metadata
   * generation to keep working rather than poisoning the route render. */
  const { settings } = await getCompanySettings().catch(() => ({
    settings: { default_meta_title: null, brand_title: null, brand_description: null, base_domain: null, favicon_url: null, logo_url: null } as never,
    hasServerError: true,
  }));
  const title = settings.default_meta_title || settings.brand_title || "Henry & Co.";
  const description =
    settings.default_meta_description ||
    settings.brand_description ||
    "Explore the businesses, services, and operating divisions of Henry & Co.";
  const icon = settings.favicon_url || settings.logo_url || undefined;

  return {
    metadataBase: toMetadataUrl(settings.base_domain),
    title,
    description,
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
