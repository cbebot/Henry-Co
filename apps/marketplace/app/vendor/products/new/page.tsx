import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getMarketplaceHomeData, getVendorWorkspaceData } from "@/lib/marketplace/data";
import { vendorNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

export default async function NewVendorProductPage() {
  await requireMarketplaceRoles(["vendor", "marketplace_owner", "marketplace_admin"], "/vendor/products/new");
  const [data, vendorData] = await Promise.all([getMarketplaceHomeData(), getVendorWorkspaceData()]);

  return (
    <WorkspaceShell
      title="New product"
      description="Listings are built with moderation, pricing governance, and trust scoring in mind: title, story, delivery proof, featured-slot requests, and posting-fee visibility are explicit."
      nav={vendorNav("/vendor/products")}
    >
      <section className="market-panel rounded-[1.75rem] p-5">
        <p className="market-kicker">Seller economics in this flow</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.4rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-4 text-sm text-[var(--market-paper-white)]">
            Plan: {vendorData.trustProfile.plan.name}
          </div>
          <div className="rounded-[1.4rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-4 text-sm text-[var(--market-paper-white)]">
            Commission: {Math.round(vendorData.trustProfile.plan.commissionRate * 100)}%
          </div>
          <div className="rounded-[1.4rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-4 text-sm text-[var(--market-paper-white)]">
            Featured request fee: NGN {vendorData.trustProfile.plan.featuredSlotFee.toLocaleString()}
          </div>
        </div>
      </section>
      <form action="/api/marketplace" method="POST" className="market-paper space-y-5 rounded-[1.75rem] p-6">
        <input type="hidden" name="intent" value="vendor_product_upsert" />
        <input type="hidden" name="return_to" value="/vendor/products" />
        <div className="grid gap-4 sm:grid-cols-2">
          <input name="title" className="market-input rounded-2xl px-4 py-3" placeholder="Product title" required />
          <input name="slug" className="market-input rounded-2xl px-4 py-3" placeholder="product-slug" />
          <input name="summary" className="market-input rounded-2xl px-4 py-3 sm:col-span-2" placeholder="Short conversion summary" required />
          <textarea name="description" rows={5} className="market-textarea rounded-[1.5rem] px-4 py-3 sm:col-span-2" placeholder="Longer product story and detail." required />
          <select name="category_slug" className="market-select rounded-2xl px-4 py-3">
            {data.categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <select name="brand_slug" className="market-select rounded-2xl px-4 py-3">
            <option value="">No brand</option>
            {data.brands.map((brand) => (
              <option key={brand.slug} value={brand.slug}>
                {brand.name}
              </option>
            ))}
          </select>
          <input name="base_price" type="number" className="market-input rounded-2xl px-4 py-3" placeholder="Base price" required />
          <input name="compare_at_price" type="number" className="market-input rounded-2xl px-4 py-3" placeholder="Compare-at price" />
          <input name="stock" type="number" className="market-input rounded-2xl px-4 py-3" placeholder="Stock" required />
          <input name="sku" className="market-input rounded-2xl px-4 py-3" placeholder="SKU" required />
          <input name="material" className="market-input rounded-2xl px-4 py-3" placeholder="Material" />
          <input name="warranty" className="market-input rounded-2xl px-4 py-3" placeholder="Warranty" />
          <input name="delivery_note" className="market-input rounded-2xl px-4 py-3" placeholder="Delivery note" />
          <input name="lead_time" className="market-input rounded-2xl px-4 py-3" placeholder="Lead time" />
          <input name="image_url" className="market-input rounded-2xl px-4 py-3 sm:col-span-2" placeholder="Primary image URL" />
        </div>
        <label className="flex items-center gap-3 rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-4 py-4">
          <input type="checkbox" name="cod_eligible" />
          <span className="text-sm text-[var(--market-ink)]">Eligible for cash on delivery</span>
        </label>
        <label className="flex items-center gap-3 rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-4 py-4">
          <input type="checkbox" name="feature_requested" />
          <span className="text-sm text-[var(--market-ink)]">Request featured placement review (extra fee applies if approved)</span>
        </label>
        <div className="flex flex-wrap gap-3">
          <button name="submission_mode" value="draft" className="market-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
            Save draft
          </button>
          <button name="submission_mode" value="submit" className="market-button-primary rounded-full px-5 py-3 text-sm font-semibold">
            Submit for moderation
          </button>
        </div>
      </form>
    </WorkspaceShell>
  );
}
