import type { Metadata } from "next";
import type { ReactNode } from "react";
import PublicSiteShell from "../components/PublicSiteShell";
import ThemeModeScript from "../components/ThemeModeScript";
import { getCompanySettings } from "../lib/company-settings";

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
  const { settings } = await getCompanySettings();

  return (
    <>
      <ThemeModeScript />
      <PublicSiteShell initialSettings={settings}>{children}</PublicSiteShell>
    </>
  );
}
