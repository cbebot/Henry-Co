import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { CompanySettingsForm, HubSiteSettingsForm } from "@/components/owner/BrandSettingsForms";
import { getBrandCenterData } from "@/lib/owner-data";

export const dynamic = "force-dynamic";

export default async function BrandSettingsPage() {
  const data = await getBrandCenterData();
  const company = data.companySettings || {};
  const site = data.siteSettings || {};

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Brand Settings"
        title="Company-wide identity controls"
        description="These controls write directly into the shared company settings rows used by the group brand layer."
      />

      <OwnerPanel title="Company settings" description="Top-level company identity, contact, and SEO defaults.">
        <CompanySettingsForm company={company as Record<string, unknown>} />
      </OwnerPanel>

      <OwnerPanel title="Hub site shell" description="The current live hub shell row for the public group site.">
        <HubSiteSettingsForm site={site as Record<string, unknown>} />
      </OwnerPanel>
    </div>
  );
}
