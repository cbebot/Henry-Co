import { notFound } from "next/navigation";
import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getVendorWorkspaceData } from "@/lib/marketplace/data";
import { vendorNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

export default async function VendorProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireMarketplaceRoles(["vendor", "marketplace_owner", "marketplace_admin"], "/vendor/products");
  const { id } = await params;
  const data = await getVendorWorkspaceData();
  const product = data.products.find((item) => item.id === id);
  if (!product) notFound();

  return (
    <WorkspaceShell
      title={product.title}
      description="Product detail editing stays anchored to moderation readiness."
      nav={vendorNav("/vendor/products")}
    >
      <article className="market-paper rounded-[1.75rem] p-6">
        <p className="market-kicker">{product.approvalStatus}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--market-ink)]">{product.title}</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{product.description}</p>
      </article>
    </WorkspaceShell>
  );
}
