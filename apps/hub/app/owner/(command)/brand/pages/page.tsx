import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import CompanyPageEditorForm from "@/components/owner/CompanyPageEditorForm";
import { getBrandCenterData } from "@/lib/owner-data";

export const dynamic = "force-dynamic";

export default async function BrandPagesPage() {
  const data = await getBrandCenterData();

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Pages & Content"
        title="Shared company pages"
        description="Hero content, meta, CTAs, and structured sections for the public company pages are now editable from the same central owner dashboard."
      />

      <OwnerPanel title="Page content rows" description="JSON fields stay explicit so the owner can manage page structure without hidden tooling.">
        <div className="space-y-4">
          {data.pages.map((page) => (
            <CompanyPageEditorForm key={String(page.id)} page={page as Record<string, unknown>} />
          ))}
        </div>
      </OwnerPanel>
    </div>
  );
}
