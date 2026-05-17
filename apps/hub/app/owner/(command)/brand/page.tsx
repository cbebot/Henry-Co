import type { Metadata } from "next";
import Link from "next/link";
import { getHubOwnerCopy } from "@henryco/i18n/server";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getHubPublicLocale } from "@/lib/locale-server";
import { getBrandCenterData } from "@/lib/owner-data";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getHubPublicLocale();
  const copy = getHubOwnerCopy(locale).brand.overview;
  return {
    title: copy.metadataTitle,
    description: copy.metadataDescription,
  };
}

export default async function BrandCenterPage() {
  const [data, locale] = await Promise.all([getBrandCenterData(), getHubPublicLocale()]);
  const copy = getHubOwnerCopy(locale).brand.overview;

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={
          <>
            <Link href="/owner/brand/settings" className="acct-button-secondary">{copy.companySettingsCta}</Link>
            <Link href="/owner/brand/subdomains" className="acct-button-primary">{copy.divisionBrandingCta}</Link>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <OwnerPanel title={copy.sharedIdentityTitle} description={copy.sharedIdentityDescription}>
          <div className="space-y-3 text-sm text-[var(--acct-muted)]">
            <div>{copy.brandTitleLabel}: {String(data.companySettings?.brand_title || copy.defaultBrandTitle)}</div>
            <div>{copy.companyNameLabel}: {String(data.companySettings?.company_name || copy.defaultCompanyName)}</div>
            <div>{copy.supportEmailLabel}: {String(data.companySettings?.support_email || copy.emptyValue)}</div>
            <div>{copy.baseDomainLabel}: {String(data.companySettings?.base_domain || copy.defaultBaseDomain)}</div>
          </div>
        </OwnerPanel>

        <OwnerPanel title={copy.managedSurfacesTitle} description={copy.managedSurfacesDescription}>
          <div className="space-y-3 text-sm text-[var(--acct-muted)]">
            <div>{copy.divisionRowsLabel}: {data.divisions.length}</div>
            <div>{copy.companyPagesLabel}: {data.pages.length}</div>
            <div>{copy.hubSiteSettingsLabel}: {data.siteSettings ? 1 : 0}</div>
          </div>
        </OwnerPanel>
      </div>
    </div>
  );
}
