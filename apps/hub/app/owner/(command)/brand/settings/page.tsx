import type { Metadata } from "next";
import { getHubOwnerCopy } from "@henryco/i18n/server";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { CompanySettingsForm, HubSiteSettingsForm } from "@/components/owner/BrandSettingsForms";
import { getHubPublicLocale } from "@/lib/locale-server";
import { getBrandCenterData } from "@/lib/owner-data";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getHubPublicLocale();
  const copy = getHubOwnerCopy(locale).brand.settings;
  return {
    title: copy.metadataTitle,
    description: copy.metadataDescription,
  };
}

export default async function BrandSettingsPage() {
  const [data, locale] = await Promise.all([getBrandCenterData(), getHubPublicLocale()]);
  const copy = getHubOwnerCopy(locale).brand.settings;
  const company = data.companySettings || {};
  const site = data.siteSettings || {};

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />

      <OwnerPanel title={copy.companyPanelTitle} description={copy.companyPanelDescription}>
        <CompanySettingsForm company={company as Record<string, unknown>} />
      </OwnerPanel>

      <OwnerPanel title={copy.hubPanelTitle} description={copy.hubPanelDescription}>
        <HubSiteSettingsForm site={site as Record<string, unknown>} />
      </OwnerPanel>
    </div>
  );
}
