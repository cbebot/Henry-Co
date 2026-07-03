import { translateSurfaceLabel } from "@henryco/i18n";
import { MarketplaceActionForm } from "@/components/marketplace/actions/MarketplaceActionForm";
import { WorkspaceShell } from "@/components/marketplace/shell";
import { DeliveryPromiseFields } from "@/components/vendor/DeliveryPromiseFields";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getVendorWorkspaceData } from "@/lib/marketplace/data";
import { getOwnerDeliveryPromise, isDeliveryPromisesEnabled } from "@/lib/marketplace/delivery-promises";
import { vendorWorkspaceNav } from "@/lib/marketplace/navigation";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function VendorSettingsPage() {
  const locale = await getMarketplacePublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  await requireMarketplaceRoles(["vendor", "marketplace_owner", "marketplace_admin"], "/vendor/settings");
  const data = await getVendorWorkspaceData();
  const promisesEnabled = isDeliveryPromisesEnabled();
  const promiseRow = await getOwnerDeliveryPromise(data.vendor.id);
  const currentPromise = promiseRow
    ? {
        reachKind: promiseRow.reachKind,
        originState: promiseRow.originState,
        minOrderNaira: promiseRow.minOrderMinor == null ? null : Math.round(promiseRow.minOrderMinor / 100),
        isActive: promiseRow.isActive,
      }
    : null;

  return (
    <WorkspaceShell
      title="Settings"
      description="Marketplace settings stay focused on seller operations: payout details, shipping expectations, support coverage, and moderation policy acknowledgement."
      {...vendorWorkspaceNav("/vendor/settings", locale)}
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
          <input name="support_email" defaultValue={data.vendor.supportEmail} className="market-input rounded-2xl px-4 py-3" placeholder={t("Support email")} />
          <input name="support_phone" defaultValue={data.vendor.supportPhone} className="market-input rounded-2xl px-4 py-3" placeholder={t("Support phone")} />
          <input name="response_sla_hours" type="number" defaultValue={data.vendor.responseSlaHours} className="market-input rounded-2xl px-4 py-3" placeholder={t("Response SLA hours")} />
          <input name="accent" defaultValue={data.vendor.accent} className="market-input rounded-2xl px-4 py-3" placeholder={t("Accent hex")} />
        </div>
      </MarketplaceActionForm>

      {/* V3-DELIVERY-COMPLETE-01 (T5) — seller Delivery Promise. */}
      {promisesEnabled ? (
        <MarketplaceActionForm
          intent="vendor_delivery_promise_upsert"
          hidden={{ return_to: "/vendor/settings", vendor_slug: data.vendor.slug }}
          submitLabel={t("Save delivery promise")}
          pendingLabel={t("Saving delivery promise")}
          successTitle={t("Delivery promise saved.")}
          errorTitle={t("Delivery promise could not be saved.")}
          className="market-paper mt-6 rounded-[1.75rem] p-6"
          buttonClassName="market-button-primary mt-4 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-80"
        >
          <DeliveryPromiseFields tier={data.vendor.verificationLevel} current={currentPromise} />
        </MarketplaceActionForm>
      ) : (
        <div className="market-paper mt-6 rounded-[1.75rem] p-6">
          <DeliveryPromiseFields tier={data.vendor.verificationLevel} current={currentPromise} disabled />
          <p className="mt-4 rounded-2xl border border-[var(--market-line)] bg-[var(--market-fill-faint)] px-4 py-3 text-sm text-[var(--market-muted)]">
            {t("Delivery promises activate once HenryCo turns them on. Preview your reach here in the meantime.")}
          </p>
        </div>
      )}
    </WorkspaceShell>
  );
}
