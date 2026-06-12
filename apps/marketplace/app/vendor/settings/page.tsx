import { translateSurfaceLabel } from "@henryco/i18n";
import { MarketplaceActionForm } from "@/components/marketplace/actions/MarketplaceActionForm";
import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getVendorWorkspaceData } from "@/lib/marketplace/data";
import { vendorNav } from "@/lib/marketplace/navigation";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function VendorSettingsPage() {
  const locale = await getMarketplacePublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  await requireMarketplaceRoles(["vendor", "marketplace_owner", "marketplace_admin"], "/vendor/settings");
  const data = await getVendorWorkspaceData();

  return (
    <WorkspaceShell
      title="Settings"
      description="Marketplace settings stay focused on seller operations: payout details, shipping expectations, support coverage, and moderation policy acknowledgement."
      nav={vendorNav("/vendor/settings", locale)}
    >
      <MarketplaceActionForm
        intent="vendor_store_update"
        hidden={{ return_to: "/vendor/settings" }}
        submitLabel={t("Save seller settings")}
        pendingLabel={t("Saving seller settings")}
        successTitle={t("Seller settings saved.")}
        errorTitle={t("Seller settings could not be saved.")}
        className="market-paper rounded-[1.75rem] p-6"
        buttonClassName="market-button-primary mt-4 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-80"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <input name="support_email" defaultValue={data.vendor.supportEmail} className="market-input rounded-2xl px-4 py-3" placeholder="Support email" />
          <input name="support_phone" defaultValue={data.vendor.supportPhone} className="market-input rounded-2xl px-4 py-3" placeholder="Support phone" />
          <input name="response_sla_hours" type="number" defaultValue={data.vendor.responseSlaHours} className="market-input rounded-2xl px-4 py-3" placeholder="Response SLA hours" />
          <input name="accent" defaultValue={data.vendor.accent} className="market-input rounded-2xl px-4 py-3" placeholder="Accent hex" />
        </div>
      </MarketplaceActionForm>
    </WorkspaceShell>
  );
}
