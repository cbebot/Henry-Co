import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getVendorWorkspaceData } from "@/lib/marketplace/data";
import { vendorNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

export default async function VendorSettingsPage() {
  await requireMarketplaceRoles(["vendor", "marketplace_owner", "marketplace_admin"], "/vendor/settings");
  const data = await getVendorWorkspaceData();

  return (
    <WorkspaceShell
      title="Settings"
      description="Marketplace settings stay focused on seller operations: payout details, shipping expectations, support coverage, and moderation policy acknowledgement."
      nav={vendorNav("/vendor/settings")}
    >
      <form action="/api/marketplace" method="POST" className="market-paper rounded-[1.75rem] p-6">
        <input type="hidden" name="intent" value="vendor_store_update" />
        <input type="hidden" name="return_to" value="/vendor/settings" />
        <div className="grid gap-4 md:grid-cols-2">
          <input name="support_email" defaultValue={data.vendor.supportEmail} className="market-input rounded-2xl px-4 py-3" placeholder="Support email" />
          <input name="support_phone" defaultValue={data.vendor.supportPhone} className="market-input rounded-2xl px-4 py-3" placeholder="Support phone" />
          <input name="response_sla_hours" type="number" defaultValue={data.vendor.responseSlaHours} className="market-input rounded-2xl px-4 py-3" placeholder="Response SLA hours" />
          <input name="accent" defaultValue={data.vendor.accent} className="market-input rounded-2xl px-4 py-3" placeholder="Accent hex" />
        </div>
        <button className="market-button-primary mt-4 rounded-full px-5 py-3 text-sm font-semibold">Save seller settings</button>
      </form>
    </WorkspaceShell>
  );
}
