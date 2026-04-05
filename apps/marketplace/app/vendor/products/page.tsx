import Link from "next/link";
import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getVendorWorkspaceData } from "@/lib/marketplace/data";
import { vendorNav } from "@/lib/marketplace/navigation";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function VendorProductsPage() {
  await requireMarketplaceRoles(["vendor", "marketplace_owner", "marketplace_admin"], "/vendor/products");
  const data = await getVendorWorkspaceData();

  return (
    <WorkspaceShell
      title="Products"
      description="Seller product management keeps draft, submission, and moderation state obvious."
      nav={vendorNav("/vendor/products")}
      actions={
        <Link href="/vendor/products/new" className="market-button-primary rounded-full px-5 py-3 text-sm font-semibold">
          New product
        </Link>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[1.1fr,0.9fr]">
        <section className="space-y-4">
          {data.products.map((product) => (
            <article key={product.id} className="market-paper rounded-[1.9rem] p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <p className="market-kicker">{product.approvalStatus}</p>
                  <h2 className="text-2xl font-semibold tracking-tight text-[var(--market-ink)]">{product.title}</h2>
                  <p className="text-sm leading-7 text-[var(--market-muted)]">{product.summary || product.description}</p>
                  <div className="flex flex-wrap gap-3 text-sm text-[var(--market-muted)]">
                    <span>{formatCurrency(product.basePrice)} base</span>
                    <span>{product.stock} in stock</span>
                    <span>{product.leadTime || "Lead time pending"}</span>
                    <span>Quality {String((product.filterData as Record<string, unknown>).qualityScore || "n/a")}</span>
                    <span>Risk {String((product.filterData as Record<string, unknown>).riskScore || "n/a")}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href={`/product/${product.slug}`} className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold">
                    Preview
                  </Link>
                  <Link href={`/vendor/products/${product.id}`} className="market-button-primary rounded-full px-4 py-2 text-sm font-semibold">
                    Manage
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>

        <aside className="space-y-4">
          <article className="market-paper rounded-[1.9rem] p-6">
            <p className="market-kicker">Catalog guidance</p>
            <div className="mt-5 space-y-4">
              {[
                "Listings with clearer summaries, stronger trust badges, and realistic lead times move through moderation faster.",
                "Use compare-at pricing sparingly and keep stock current to avoid conversion leakage and dispute pressure.",
                "Keep one strong primary image and concise delivery notes so product cards stay sharp across mobile discovery.",
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
