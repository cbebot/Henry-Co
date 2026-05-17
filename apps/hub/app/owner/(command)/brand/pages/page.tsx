import type { Metadata } from "next";
import { getHubOwnerCopy } from "@henryco/i18n/server";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import CompanyPageEditorForm from "@/components/owner/CompanyPageEditorForm";
import { getHubPublicLocale } from "@/lib/locale-server";
import { getBrandCenterData } from "@/lib/owner-data";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getHubPublicLocale();
  const copy = getHubOwnerCopy(locale).brand.pages;
  return {
    title: copy.metadataTitle,
    description: copy.metadataDescription,
  };
}

export default async function BrandPagesPage() {
  const [data, locale] = await Promise.all([getBrandCenterData(), getHubPublicLocale()]);
  const copy = getHubOwnerCopy(locale).brand.pages;

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />

      <OwnerPanel title={copy.panelTitle} description={copy.panelDescription}>
        <div className="space-y-4">
          {data.pages.map((page) => (
            <CompanyPageEditorForm key={String(page.id)} page={page as Record<string, unknown>} />
          ))}
        </div>
      </OwnerPanel>
    </div>
  );
}
