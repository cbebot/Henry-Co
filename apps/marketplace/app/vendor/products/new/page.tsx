import { translateSurfaceLabel } from "@henryco/i18n";
import { isAiSurfaceEnabled } from "@henryco/ai-gateway";
import { MarketplaceActionForm } from "@/components/marketplace/actions/MarketplaceActionForm";
import { DraftWithIntelligencePanel } from "@/components/marketplace/ai/DraftWithIntelligencePanel";
import { ImageUploadField } from "@/components/marketplace/vendor/image-upload-field";
import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getMarketplaceHomeData, getVendorWorkspaceData } from "@/lib/marketplace/data";
import { vendorWorkspaceNav } from "@/lib/marketplace/navigation";
import { formatVendorMoney } from "@/lib/marketplace/vendor/money";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

// Flag-dark by default. The metered draft-a-listing surface renders only when the company
// explicitly turns it on AND the global AI kill switch is enabled (the gateway enforces the
// latter server-side; this gates the UI). Reconcile the rate card to live provider prices
// and set PAYMENTS_DATABASE_URL before enabling.
const AI_LISTING_ASSIST_ENABLED = isAiSurfaceEnabled(process.env.MARKETPLACE_AI_LISTING_ASSIST, process.env);

export default async function NewVendorProductPage() {
  const locale = await getMarketplacePublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  await requireMarketplaceRoles(["vendor", "marketplace_owner", "marketplace_admin"], "/vendor/products/new");
  const [data, vendorData] = await Promise.all([getMarketplaceHomeData(), getVendorWorkspaceData()]);

  return (
    <WorkspaceShell
      title={t("New product")}
      description={t(
        "Listings are built with moderation, pricing governance, and trust scoring in mind: title, story, delivery proof, featured-slot requests, and posting-fee visibility are explicit.",
      )}
      {...vendorWorkspaceNav("/vendor/products", locale)}
    >
      {AI_LISTING_ASSIST_ENABLED ? (
        <DraftWithIntelligencePanel
          copy={{
            heading: t("Draft with Henry Onyx Intelligence"),
            intro: t(
              "Describe your product and Henry Onyx Intelligence will draft a listing you can edit before publishing.",
            ),
            ideaLabel: t("Product idea"),
            notesLabel: t("Anything else to include? (optional)"),
            draftButton: t("Draft listing"),
            drafting: t("Drafting…"),
            useDraft: t("Use this draft"),
            errorFallback: t("Henry Onyx Intelligence couldn’t help with that. Please try again."),
            priceTemplate: t("Henry Onyx Intelligence · {price} (incl. {vat} VAT) · {tier}"),
            advisory: t("Drafts are advisory — review and edit every field before you submit."),
          }}
        />
      ) : null}
      <section className="market-panel rounded-[1.75rem] p-5">
        <p className="market-kicker">{t("Seller economics in this flow")}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.4rem] border border-[var(--market-line)] bg-[var(--market-fill-faint)] p-4 text-sm text-[var(--market-paper-white)]">
            {t("Plan: {plan}").replace("{plan}", vendorData.trustProfile.plan.name)}
          </div>
          <div className="rounded-[1.4rem] border border-[var(--market-line)] bg-[var(--market-fill-faint)] p-4 text-sm text-[var(--market-paper-white)]">
            {t("Commission: {rate}%").replace(
              "{rate}",
              String(Math.round(vendorData.trustProfile.plan.commissionRate * 100)),
            )}
          </div>
          <div className="rounded-[1.4rem] border border-[var(--market-line)] bg-[var(--market-fill-faint)] p-4 text-sm text-[var(--market-paper-white)]">
            {t("Featured request fee: {fee}").replace(
              "{fee}",
              formatVendorMoney(Math.round(vendorData.trustProfile.plan.featuredSlotFee * 100), locale),
            )}
          </div>
        </div>
      </section>
      <MarketplaceActionForm
        intent="vendor_product_upsert"
        hidden={{ return_to: "/vendor/products" }}
        successTitle={t("Product saved.")}
        errorTitle={t("Product could not be saved.")}
        resetOnSuccess
        className="market-paper space-y-5 rounded-[1.75rem] p-6"
        submitButtons={[
          {
            name: "submission_mode",
            value: "draft",
            label: t("Save draft"),
            pendingLabel: t("Saving draft"),
            className: "market-button-secondary rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-80",
            successTitle: t("Draft saved."),
            successBody: t("The listing stays private until you submit it for moderation."),
          },
          {
            name: "submission_mode",
            value: "submit",
            label: t("Submit for moderation"),
            pendingLabel: t("Submitting for moderation"),
            className: "market-button-primary rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-80",
            successTitle: t("Submitted for moderation."),
            successBody: t("The listing enters review with pricing governance and trust scoring applied."),
            chime: true,
          },
        ]}
      >
        <section className="space-y-4">
          <p className="market-kicker">{t("Essentials")}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <input name="title" className="market-input rounded-2xl px-4 py-3" placeholder={t("Product title")} required />
            <input name="slug" className="market-input rounded-2xl px-4 py-3" placeholder={t("product-handle")} />
            <input name="summary" className="market-input rounded-2xl px-4 py-3 sm:col-span-2" placeholder={t("Short conversion summary")} required />
            <textarea
              name="description"
              rows={5}
              className="market-textarea rounded-[1.5rem] px-4 py-3 sm:col-span-2"
              placeholder={t("Longer product story and detail.")}
              required
            />
            <select name="category_slug" aria-label={t("Category")} className="market-select rounded-2xl px-4 py-3">
              {data.categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
            <select name="brand_slug" aria-label={t("Brand")} className="market-select rounded-2xl px-4 py-3">
              <option value="">{t("No brand")}</option>
              {data.brands.map((brand) => (
                <option key={brand.slug} value={brand.slug}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
        </section>
        <section className="space-y-4 border-t border-[var(--market-line)] pt-5">
          <p className="market-kicker">{t("Media")}</p>
          <ImageUploadField
            name="image_url"
            scope="product"
            label={t("Primary image")}
            hint={t("JPG, PNG, or WebP, up to 8MB.")}
            labels={{
              drop: t("Add a photo"),
              replace: t("Replace photo"),
              remove: t("Remove photo"),
              uploading: t("Uploading…"),
              failed: t("That upload didn’t go through. Try again."),
            }}
          />
        </section>
        <section className="space-y-4 border-t border-[var(--market-line)] pt-5">
          <p className="market-kicker">{t("Pricing & stock")}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <input name="base_price" type="number" className="market-input rounded-2xl px-4 py-3" placeholder={t("Base price")} required />
            <input name="compare_at_price" type="number" className="market-input rounded-2xl px-4 py-3" placeholder={t("Compare-at price")} />
            <input name="stock" type="number" className="market-input rounded-2xl px-4 py-3" placeholder={t("Stock")} required />
            <input name="sku" className="market-input rounded-2xl px-4 py-3" placeholder={t("SKU")} required />
            <input name="lead_time" className="market-input rounded-2xl px-4 py-3" placeholder={t("Lead time")} />
          </div>
        </section>
        <section className="space-y-4 border-t border-[var(--market-line)] pt-5">
          <p className="market-kicker">{t("Fulfillment & trust")}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <input name="delivery_note" className="market-input rounded-2xl px-4 py-3 sm:col-span-2" placeholder={t("Delivery note")} />
            <input name="material" className="market-input rounded-2xl px-4 py-3" placeholder={t("Material")} />
            <input name="warranty" className="market-input rounded-2xl px-4 py-3" placeholder={t("Warranty")} />
          </div>
          <label className="flex items-center gap-3 rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-4 py-4">
            <input type="checkbox" name="cod_eligible" />
            <span className="text-sm text-[var(--market-ink)]">{t("Eligible for cash on delivery")}</span>
          </label>
          <label className="flex items-center gap-3 rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-4 py-4">
            <input type="checkbox" name="feature_requested" />
            <span className="text-sm text-[var(--market-ink)]">
              {t("Request featured placement review (extra fee applies if approved)")}
            </span>
          </label>
        </section>
      </MarketplaceActionForm>
    </WorkspaceShell>
  );
}
