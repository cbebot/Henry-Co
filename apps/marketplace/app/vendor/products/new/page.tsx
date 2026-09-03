import { translateSurfaceLabel } from "@henryco/i18n";
import { isAiSurfaceEnabled } from "@henryco/ai-gateway";
import { MultiImageUploadField } from "@/components/marketplace/vendor/multi-image-upload-field";
import { VendorProductEditor } from "@/components/marketplace/vendor/vendor-product-editor";
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
      <VendorProductEditor
        draftPanel={
          AI_LISTING_ASSIST_ENABLED
            ? {
                copy: {
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
                  verifyNudge: t(
                    "Once your listing is saved, you can get it Henry Onyx Verified — an independent review that earns the trust badge buyers filter for.",
                  ),
                },
                appliedNote: t("Draft applied — review each section before you publish."),
              }
            : undefined
        }
        beforeForm={
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
        }
        form={{
          intent: "vendor_product_upsert",
          hidden: { return_to: "/vendor/products" },
          successTitle: t("Product saved."),
          errorTitle: t("Product could not be saved."),
          resetOnSuccess: true,
          className: "market-paper space-y-5 rounded-[1.75rem] p-6",
          submitButtons: [
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
          ],
        }}
        fields={{
          categories: data.categories.map((category) => ({ slug: category.slug, name: category.name })),
          brands: data.brands.map((brand) => ({ slug: brand.slug, name: brand.name })),
          descriptionRows: 5,
          labels: {
            essentials: t("Essentials"),
            title: t("Product title"),
            slug: t("product-handle"),
            summary: t("Short conversion summary"),
            description: t("Longer product story and detail."),
            category: t("Category"),
            brand: t("Brand"),
            noBrand: t("No brand"),
            pricingStock: t("Pricing & stock"),
            basePrice: t("Base price"),
            compareAtPrice: t("Compare-at price"),
            stock: t("Stock"),
            sku: t("SKU"),
            leadTime: t("Lead time"),
            fulfillmentTrust: t("Fulfillment & trust"),
            deliveryNote: t("Delivery note"),
            material: t("Material"),
            warranty: t("Warranty"),
            codEligible: t("Eligible for cash on delivery"),
            featureRequested: t("Request featured placement review (extra fee applies if approved)"),
          },
        }}
        media={
          <section className="space-y-4 border-t border-[var(--market-line)] pt-5">
            <p className="market-kicker">{t("Media")}</p>
            <MultiImageUploadField
              name="image_urls"
              scope="product"
              label={t("Product photos")}
              hint={t("JPG, PNG, or WebP, up to 8MB each. Add several at once.")}
              labels={{
                addFirst: t("Add photos"),
                add: t("Add more"),
                uploading: t("Uploading…"),
                failed: t("That upload didn’t go through. Try again."),
                remove: t("Remove photo"),
                makeCover: t("Make cover"),
                cover: t("Cover"),
                coverHint: t("The first photo is the product’s cover; the rest sit behind it in the gallery."),
              }}
            />
          </section>
        }
      />
    </WorkspaceShell>
  );
}
