import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { CreateDivisionBrandForm, EditDivisionBrandForm } from "@/components/owner/DivisionBrandForm";
import { getBrandCenterData } from "@/lib/owner-data";

export const dynamic = "force-dynamic";

export default async function BrandSubdomainsPage() {
  const data = await getBrandCenterData();

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Division Branding"
        title="Subdomains, logos, and identity rows"
        description="Each division row can now be updated centrally from the owner command center."
      />

      <OwnerPanel title="Division rows" description="Edit the brand row that represents each division across the shared company registry.">
        <CreateDivisionBrandForm />

        <div className="space-y-4">
          {data.divisions.map((division) => (
            <EditDivisionBrandForm key={String(division.id)} division={division as Record<string, unknown>} />
          ))}
        </div>
      </OwnerPanel>
    </div>
  );
}
