import { translateSurfaceLabel } from "@henryco/i18n";
import { MarketplaceActionForm } from "@/components/marketplace/actions/MarketplaceActionForm";
import { ImageUploadField } from "@/components/marketplace/vendor/image-upload-field";
import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getVendorWorkspaceData } from "@/lib/marketplace/data";
import { vendorWorkspaceNav } from "@/lib/marketplace/navigation";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function VendorStorePage() {
  const locale = await getMarketplacePublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  await requireMarketplaceRoles(["vendor", "marketplace_owner", "marketplace_admin"], "/vendor/store");
  const data = await getVendorWorkspaceData();

  return (
    <WorkspaceShell
      title={t("Store profile")}
      description={t(
        "Branding, trust narrative, and contact clarity belong on a focused surface rather than being buried in settings.",
      )}
      {...vendorWorkspaceNav("/vendor/store", locale)}
    >
      <MarketplaceActionForm
        intent="vendor_store_update"
        hidden={{ return_to: "/vendor/store" }}
        submitLabel={t("Update store profile")}
        pendingLabel={t("Updating store profile")}
        successTitle={t("Store profile updated.")}
        errorTitle={t("Store profile could not be updated.")}
        className="market-paper rounded-[1.75rem] p-6"
        buttonClassName="market-button-primary mt-4 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-80"
      >
        <p className="market-kicker">{data.vendor.verificationLevel}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input name="name" defaultValue={data.vendor.name} className="market-input rounded-2xl px-4 py-3" placeholder={t("Store name")} required />
          <input name="support_phone" defaultValue={data.vendor.supportPhone} className="market-input rounded-2xl px-4 py-3" placeholder={t("Support phone")} />
          <input name="support_email" defaultValue={data.vendor.supportEmail} className="market-input rounded-2xl px-4 py-3 md:col-span-2" placeholder={t("Support email")} />
          <textarea
            name="description"
            defaultValue={data.vendor.description}
            rows={5}
            className="market-textarea rounded-[1.5rem] px-4 py-3 md:col-span-2"
            placeholder={t("Store story and trust promise")}
          />
          <div className="md:col-span-2">
            <ImageUploadField
              name="hero_image_url"
              scope="store"
              label={t("Store hero image")}
              hint={t("Shown on your storefront card. JPG, PNG, or WebP, up to 8MB. Leave as is to keep the current image.")}
              initialUrl={data.vendor.heroImage || null}
              labels={{
                drop: t("Add a photo"),
                replace: t("Replace photo"),
                remove: t("Remove photo"),
                uploading: t("Uploading…"),
                failed: t("That upload didn’t go through. Try again."),
              }}
            />
          </div>
        </div>
      </MarketplaceActionForm>
    </WorkspaceShell>
  );
}
