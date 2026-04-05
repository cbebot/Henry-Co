import Link from "next/link";
import { OwnerPageHeader, OwnerPanel } from "@/components/owner/OwnerPrimitives";
import { getBrandCenterData } from "@/lib/owner-data";

export const dynamic = "force-dynamic";

export default async function BrandCenterPage() {
  const data = await getBrandCenterData();

  return (
    <div className="space-y-6 acct-fade-in">
      <OwnerPageHeader
        eyebrow="Brand & Subdomain Control"
        title="Central identity management"
        description="The central owner dashboard is now the source for shared company identity, division branding, page-level content blocks, and subdomain presentation records."
        actions={
          <>
            <Link href="/owner/brand/settings" className="acct-button-secondary">Company settings</Link>
            <Link href="/owner/brand/subdomains" className="acct-button-primary">Division branding</Link>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <OwnerPanel title="Shared company identity" description="Current top-level brand fields from production.">
          <div className="space-y-3 text-sm text-[var(--acct-muted)]">
            <div>Brand title: {String(data.companySettings?.brand_title || "Henry & Co.")}</div>
            <div>Company name: {String(data.companySettings?.company_name || "Henry & Co.")}</div>
            <div>Support email: {String(data.companySettings?.support_email || "—")}</div>
            <div>Base domain: {String(data.companySettings?.base_domain || "henrycogroup.com")}</div>
          </div>
        </OwnerPanel>

        <OwnerPanel title="Managed surfaces" description="Shared pages and division rows that now belong to the central owner dashboard.">
          <div className="space-y-3 text-sm text-[var(--acct-muted)]">
            <div>Division brand rows: {data.divisions.length}</div>
            <div>Shared company pages: {data.pages.length}</div>
            <div>Hub site settings rows: {data.siteSettings ? 1 : 0}</div>
          </div>
        </OwnerPanel>
      </div>
    </div>
  );
}
