import { notFound } from "next/navigation";
import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getMarketplaceHomeData, getVendorWorkspaceData } from "@/lib/marketplace/data";
import { vendorNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

export default async function VendorProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireMarketplaceRoles(["vendor", "marketplace_owner", "marketplace_admin"], "/vendor/products");
  const { id } = await params;
  const [data, snapshot] = await Promise.all([getVendorWorkspaceData(), getMarketplaceHomeData()]);
  const product = data.products.find((item) => item.id === id);
  if (!product) notFound();

  return (
    <WorkspaceShell
      title={product.title}
      description="Product detail editing stays anchored to moderation readiness."
      nav={vendorNav("/vendor/products")}
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <form action="/api/marketplace" method="POST" className="market-paper space-y-5 rounded-[1.9rem] p-6">
          <input type="hidden" name="intent" value="vendor_product_upsert" />
          <input type="hidden" name="return_to" value={`/vendor/products/${product.id}`} />
          <input type="hidden" name="slug" value={product.slug} />
          <div className="grid gap-4 sm:grid-cols-2">
            <input name="title" defaultValue={product.title} className="market-input rounded-2xl px-4 py-3" placeholder="Product title" required />
            <input name="sku" defaultValue={product.sku} className="market-input rounded-2xl px-4 py-3" placeholder="SKU" required />
            <input name="summary" defaultValue={product.summary} className="market-input rounded-2xl px-4 py-3 sm:col-span-2" placeholder="Short conversion summary" required />
            <textarea name="description" defaultValue={product.description} rows={6} className="market-textarea rounded-[1.5rem] px-4 py-3 sm:col-span-2" placeholder="Long-form story and detail." required />
            <select name="category_slug" defaultValue={product.categorySlug} className="market-select rounded-2xl px-4 py-3">
              {snapshot.categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
            <select name="brand_slug" defaultValue={product.brandSlug ?? ""} className="market-select rounded-2xl px-4 py-3">
              <option value="">No brand</option>
              {snapshot.brands.map((brand) => (
                <option key={brand.slug} value={brand.slug}>
                  {brand.name}
                </option>
              ))}
            </select>
            <input name="base_price" type="number" defaultValue={product.basePrice} className="market-input rounded-2xl px-4 py-3" placeholder="Base price" required />
            <input name="compare_at_price" type="number" defaultValue={product.compareAtPrice ?? undefined} className="market-input rounded-2xl px-4 py-3" placeholder="Compare-at price" />
            <input name="stock" type="number" defaultValue={product.stock} className="market-input rounded-2xl px-4 py-3" placeholder="Stock" required />
            <input name="lead_time" defaultValue={product.leadTime} className="market-input rounded-2xl px-4 py-3" placeholder="Lead time" />
            <input
              name="delivery_note"
              defaultValue={product.deliveryNote}
              className="market-input rounded-2xl px-4 py-3 sm:col-span-2"
              placeholder="Delivery note"
            />
            <input
              name="image_url"
              defaultValue={product.gallery[0] ?? ""}
              className="market-input rounded-2xl px-4 py-3 sm:col-span-2"
              placeholder="Primary image URL"
            />
          </div>
          <label className="flex items-center gap-3 rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-4 py-4">
            <input type="checkbox" name="cod_eligible" defaultChecked={product.codEligible} />
            <span className="text-sm text-[var(--market-ink)]">Eligible for cash on delivery</span>
          </label>
          <div className="flex flex-wrap gap-3">
            <button name="submission_mode" value="draft" className="market-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
              Save draft
            </button>
            <button name="submission_mode" value="submit" className="market-button-primary rounded-full px-5 py-3 text-sm font-semibold">
              Submit update
            </button>
          </div>
        </form>

        <aside className="space-y-4">
          <article className="market-paper rounded-[1.9rem] p-6">
            <p className="market-kicker">Moderation readiness</p>
            <div className="mt-5 grid gap-4">
              {[
                `${product.approvalStatus} status is visible to moderation and admin queues.`,
                `${product.stock} units are currently available for order acceptance.`,
                product.leadTime || "Lead time should be explicit before resubmission.",
                product.deliveryNote || "Delivery note should clarify dispatch and city coverage.",
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
