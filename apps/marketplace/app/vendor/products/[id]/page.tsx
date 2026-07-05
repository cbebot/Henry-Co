import { notFound } from "next/navigation";
import { translateSurfaceLabel } from "@henryco/i18n";
import { isAiSurfaceEnabled } from "@henryco/ai-gateway";
import { VerifyListingPanel } from "@/components/marketplace/ai/VerifyListingPanel";
import { MultiImageUploadField } from "@/components/marketplace/vendor/multi-image-upload-field";
import { VendorProductEditor } from "@/components/marketplace/vendor/vendor-product-editor";
import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getMarketplaceHomeData, getVendorWorkspaceData } from "@/lib/marketplace/data";
import { resolveMarketplaceImageUrl } from "@/lib/marketplace/media-image";
import { approvalStatusLabel, listingGuidance } from "@/lib/marketplace/vendor/listing-guidance";
import { vendorWorkspaceNav } from "@/lib/marketplace/navigation";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

// Flag-dark: the metered "Henry Onyx Verified" trust review renders only when the company
// turns it on (and the global AI kill switch is enabled — the gateway enforces that). The
// review augments human moderation; it never publishes.
const AI_LISTING_VERIFY_ENABLED = isAiSurfaceEnabled(process.env.MARKETPLACE_AI_LISTING_VERIFY, process.env);

export default async function VendorProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getMarketplacePublicLocale();
  const t = (text: string) => translateSurfaceLabel(locale, text);
  await requireMarketplaceRoles(["vendor", "marketplace_owner", "marketplace_admin"], "/vendor/products");
  const { id } = await params;
  const [data, snapshot] = await Promise.all([getVendorWorkspaceData(), getMarketplaceHomeData()]);
  const product = data.products.find((item) => item.id === id);
  if (!product) notFound();

  return (
    <WorkspaceShell
      title={product.title}
      description={t("Product detail editing stays anchored to moderation readiness.")}
      {...vendorWorkspaceNav("/vendor/products", locale)}
    >
      {AI_LISTING_VERIFY_ENABLED ? (
        <VerifyListingPanel
          productId={product.id}
          copy={{
            heading: t("Get Henry Onyx Verified"),
            intro: t("A trusted review checks your listing is honest, original, and safe — so buyers trust it more."),
            request: t("Request review"),
            reviewing: t("Reviewing…"),
            verifiedBadge: t("Henry Onyx Verified"),
            readyForReview: t("Ready for review by our team."),
            needsWork: t("A few things to address before this can be verified."),
            augmentsNote: t("This review augments our human moderation — it does not publish your listing."),
            errorFallback: t("Henry Onyx Intelligence is unavailable right now."),
            priceTemplate: t("Henry Onyx Intelligence · {price} (incl. {vat} VAT) · {tier}"),
          }}
        />
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <VendorProductEditor
          form={{
            intent: "vendor_product_upsert",
            hidden: { return_to: `/vendor/products/${product.id}`, slug: product.slug },
            successTitle: t("Product updated."),
            errorTitle: t("Product could not be updated."),
            className: "market-paper space-y-5 rounded-[1.9rem] p-6",
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
                label: t("Submit update"),
                pendingLabel: t("Submitting update"),
                className: "market-button-primary rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-80",
                successTitle: t("Update submitted."),
                successBody: t("The revised listing enters moderation review."),
                chime: true,
              },
            ],
          }}
          fields={{
            initial: {
              title: product.title,
              summary: product.summary,
              description: product.description,
              category_slug: product.categorySlug,
              brand_slug: product.brandSlug ?? "",
              base_price: String(product.basePrice),
              compare_at_price: product.compareAtPrice == null ? "" : String(product.compareAtPrice),
              stock: String(product.stock),
              sku: product.sku,
              lead_time: product.leadTime,
              delivery_note: product.deliveryNote,
              material: product.specifications.Material ?? "",
              warranty: product.specifications.Warranty ?? "",
              cod_eligible: product.codEligible,
            },
            categories: snapshot.categories.map((category) => ({ slug: category.slug, name: category.name })),
            brands: snapshot.brands.map((brand) => ({ slug: brand.slug, name: brand.name })),
            descriptionRows: 6,
            labels: {
              essentials: t("Essentials"),
              title: t("Product title"),
              summary: t("Short conversion summary"),
              description: t("Long-form story and detail."),
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
            },
          }}
          media={
            <section className="space-y-4 border-t border-[var(--market-line)] pt-5">
              <p className="market-kicker">{t("Media")}</p>
              <MultiImageUploadField
                name="image_urls"
                scope="product"
                label={t("Product photos")}
                hint={t("JPG, PNG, or WebP, up to 8MB each. Leave as is to keep the current photos.")}
                initial={product.gallery
                  .map((image) => resolveMarketplaceImageUrl(image))
                  .filter((url): url is string => Boolean(url))}
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

        <aside className="space-y-4">
          <article className="market-paper rounded-[1.9rem] p-6">
            <p className="market-kicker">{t("Moderation readiness")}</p>
            <div className="mt-5 grid gap-4">
              {[
                t("Current state: {status}. This is visible to moderation and admin queues.").replace(
                  "{status}",
                  approvalStatusLabel(product.approvalStatus, t),
                ),
                t("{count} units are currently available for order acceptance.").replace(
                  "{count}",
                  String(product.stock),
                ),
                product.leadTime || t("Lead time should be explicit before resubmission."),
                product.deliveryNote || t("Delivery note should clarify dispatch and city coverage."),
                listingGuidance(product.filterData, t),
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.35rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-4 py-4 text-sm leading-7 text-[var(--market-ink)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </article>
        </aside>
      </div>
    </WorkspaceShell>
  );
}
