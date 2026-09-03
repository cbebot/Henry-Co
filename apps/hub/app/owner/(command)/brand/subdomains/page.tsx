import type { Metadata } from "next";
import { getHubOwnerCopy } from "@henryco/i18n/server";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { CreateDivisionBrandForm, EditDivisionBrandForm } from "@/components/owner/DivisionBrandForm";
import { getHubPublicLocale } from "@/lib/locale-server";
import { getBrandCenterData } from "@/lib/owner-data";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getHubPublicLocale();
  const copy = getHubOwnerCopy(locale).brand.subdomains;
  return {
    title: copy.metadataTitle,
    description: copy.metadataDescription,
  };
}

export default async function BrandSubdomainsPage() {
  const [data, locale] = await Promise.all([getBrandCenterData(), getHubPublicLocale()]);
  const copy = getHubOwnerCopy(locale).brand.subdomains;

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />

      <OwnerPanel title={copy.panelTitle} description={copy.panelDescription}>
        <CreateDivisionBrandForm copy={getHubOwnerCopy(locale).divisionBrandForm} />

        <div className="space-y-4">
          {data.divisions.map((division) => (
            <EditDivisionBrandForm key={String(division.id)} division={division as Record<string, unknown>} copy={getHubOwnerCopy(locale).divisionBrandForm} />
          ))}
        </div>
      </OwnerPanel>
    </div>
  );
}
