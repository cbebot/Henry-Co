import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getVendorWorkspaceData } from "@/lib/marketplace/data";
import { vendorNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

export default async function VendorStorePage() {
  await requireMarketplaceRoles(["vendor", "marketplace_owner", "marketplace_admin"], "/vendor/store");
  const data = await getVendorWorkspaceData();

  return (
    <WorkspaceShell
      title="Store profile"
      description="Branding, trust narrative, and contact clarity belong on a focused surface rather than being buried in settings."
      nav={vendorNav("/vendor/store")}
    >
      <form action="/api/marketplace" method="POST" className="market-paper rounded-[1.75rem] p-6">
        <input type="hidden" name="intent" value="vendor_store_update" />
        <input type="hidden" name="return_to" value="/vendor/store" />
        <p className="market-kicker">{data.vendor.verificationLevel}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input name="name" defaultValue={data.vendor.name} className="market-input rounded-2xl px-4 py-3" placeholder="Store name" required />
          <input name="support_phone" defaultValue={data.vendor.supportPhone} className="market-input rounded-2xl px-4 py-3" placeholder="Support phone" />
          <input name="support_email" defaultValue={data.vendor.supportEmail} className="market-input rounded-2xl px-4 py-3 md:col-span-2" placeholder="Support email" />
          <textarea name="description" defaultValue={data.vendor.description} rows={5} className="market-textarea rounded-[1.5rem] px-4 py-3 md:col-span-2" placeholder="Store story and trust promise" />
        </div>
        <button className="market-button-primary mt-4 rounded-full px-5 py-3 text-sm font-semibold">Update store profile</button>
      </form>
    </WorkspaceShell>
  );
}
