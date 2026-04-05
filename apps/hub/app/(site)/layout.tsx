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
  const { settings } = await getCompanySettings();
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
  const [company, locale, h, chipUser] = await Promise.all([
    getCompanySettings(),
    getHubPublicLocale(),
    headers(),
    getHubPublicChipUser(),
  ]);
  const { settings } = company;
  const consentCopy = getConsentCopy(locale);
  const returnPath = h.get("x-hub-return-path") || "/";
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
