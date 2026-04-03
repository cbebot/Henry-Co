import { EmptyState, ProductCard, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import { accountNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

export default async function AccountWishlistPage() {
  await requireMarketplaceUser("/account/wishlist");
  const data = await getBuyerDashboardData();

  return (
    <WorkspaceShell
      title="Wishlist"
      description="Saved products stay attached to the account so future recommendations and concierge basket flows can start from intent, not guesswork."
      nav={accountNav("/account/wishlist")}
    >
      {data.wishlist.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.wishlist.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState title="Wishlist is empty." body="Save products to build a quieter, more deliberate buying shortlist." />
      )}
    </WorkspaceShell>
  );
}
