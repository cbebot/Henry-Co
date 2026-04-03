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
      <div className="space-y-4">
        {data.products.map((product) => (
          <article key={product.id} className="market-paper rounded-[1.75rem] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="market-kicker">{product.approvalStatus}</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--market-ink)]">{product.title}</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">
                  {formatCurrency(product.basePrice)} · {product.stock} in stock
                </p>
              </div>
              <Link href={`/vendor/products/${product.id}`} className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold">
                Edit
              </Link>
            </div>
          </article>
        ))}
      </div>
    </WorkspaceShell>
  );
}
