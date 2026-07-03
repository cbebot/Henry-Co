import { notFound } from "next/navigation";
import { translateSurfaceLabel } from "@henryco/i18n";
import { isAiSurfaceEnabled } from "@henryco/ai-gateway";
import { MarketplaceActionForm } from "@/components/marketplace/actions/MarketplaceActionForm";
import { VerifyListingPanel } from "@/components/marketplace/ai/VerifyListingPanel";
import { ImageUploadField } from "@/components/marketplace/vendor/image-upload-field";
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
        <MarketplaceActionForm
          intent="vendor_product_upsert"
          hidden={{ return_to: `/vendor/products/${product.id}`, slug: product.slug }}
          successTitle={t("Product updated.")}
          errorTitle={t("Product could not be updated.")}
          className="market-paper space-y-5 rounded-[1.9rem] p-6"
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
              label: t("Submit update"),
              pendingLabel: t("Submitting update"),
              className: "market-button-primary rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-80",
              successTitle: t("Update submitted."),
              successBody: t("The revised listing enters moderation review."),
              chime: true,
            },
          ]}
        >
          <section className="space-y-4">
            <p className="market-kicker">{t("Essentials")}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <input name="title" defaultValue={product.title} className="market-input rounded-2xl px-4 py-3" placeholder={t("Product title")} required />
              <input name="summary" defaultValue={product.summary} className="market-input rounded-2xl px-4 py-3" placeholder={t("Short conversion summary")} required />
              <textarea
                name="description"
                defaultValue={product.description}
                rows={6}
                className="market-textarea rounded-[1.5rem] px-4 py-3 sm:col-span-2"
                placeholder={t("Long-form story and detail.")}
                required
              />
              <select name="category_slug" defaultValue={product.categorySlug} aria-label={t("Category")} className="market-select rounded-2xl px-4 py-3">
                {snapshot.categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select name="brand_slug" defaultValue={product.brandSlug ?? ""} aria-label={t("Brand")} className="market-select rounded-2xl px-4 py-3">
                <option value="">{t("No brand")}</option>
                {snapshot.brands.map((brand) => (
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
              hint={t("JPG, PNG, or WebP, up to 8MB. Leave as is to keep the current photo.")}
              initialUrl={resolveMarketplaceImageUrl(product.gallery[0] ?? null)}
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
              <input name="base_price" type="number" defaultValue={product.basePrice} className="market-input rounded-2xl px-4 py-3" placeholder={t("Base price")} required />
              <input name="compare_at_price" type="number" defaultValue={product.compareAtPrice ?? undefined} className="market-input rounded-2xl px-4 py-3" placeholder={t("Compare-at price")} />
              <input name="stock" type="number" defaultValue={product.stock} className="market-input rounded-2xl px-4 py-3" placeholder={t("Stock")} required />
              <input name="sku" defaultValue={product.sku} className="market-input rounded-2xl px-4 py-3" placeholder={t("SKU")} required />
              <input name="lead_time" defaultValue={product.leadTime} className="market-input rounded-2xl px-4 py-3" placeholder={t("Lead time")} />
            </div>
          </section>
          <section className="space-y-4 border-t border-[var(--market-line)] pt-5">
            <p className="market-kicker">{t("Fulfillment & trust")}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                name="delivery_note"
                defaultValue={product.deliveryNote}
                className="market-input rounded-2xl px-4 py-3 sm:col-span-2"
                placeholder={t("Delivery note")}
              />
              <input
                name="material"
                defaultValue={product.specifications.Material ?? ""}
                className="market-input rounded-2xl px-4 py-3"
                placeholder={t("Material")}
              />
              <input
                name="warranty"
                defaultValue={product.specifications.Warranty ?? ""}
                className="market-input rounded-2xl px-4 py-3"
                placeholder={t("Warranty")}
              />
            </div>
            <label className="flex items-center gap-3 rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-4 py-4">
              <input type="checkbox" name="cod_eligible" defaultChecked={product.codEligible} />
              <span className="text-sm text-[var(--market-ink)]">{t("Eligible for cash on delivery")}</span>
            </label>
          </section>
        </MarketplaceActionForm>

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
