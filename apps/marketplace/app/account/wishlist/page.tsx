import { EmptyState, ProductCard, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import { accountNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

type SearchParams = {
  saved?: string;
  removed?: string;
};

export default async function AccountWishlistPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireMarketplaceUser("/account/wishlist");
  const [data, params] = await Promise.all([getBuyerDashboardData(), searchParams]);

  const toast = params.removed
    ? "Removed from wishlist."
    : params.saved
      ? "Saved to wishlist."
      : null;

  return (
    <WorkspaceShell
      title="Wishlist"
      description="Saved products stay attached to the account so future recommendations and concierge basket flows can start from intent, not guesswork."
      nav={accountNav("/account/wishlist")}
    >
      {toast ? (
        <div className="rounded-[1.25rem] border border-[rgba(76,201,160,0.35)] bg-[rgba(76,201,160,0.12)] px-4 py-3 text-sm font-medium text-[var(--market-success,#4CC9A0)]">
          {toast}
        </div>
      ) : null}

      {data.wishlist.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.wishlist.map((product) => (
            <div key={product.slug} className="flex flex-col gap-3">
              <ProductCard product={product} />
              <form action="/api/marketplace" method="POST">
                <input type="hidden" name="intent" value="wishlist_toggle" />
                <input type="hidden" name="product_slug" value={product.slug} />
                <input type="hidden" name="return_to" value="/account/wishlist" />
                <button
                  type="submit"
                  className="w-full rounded-full border border-[rgba(232,88,88,0.35)] bg-[rgba(232,88,88,0.08)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-alert,#F87171)] hover:bg-[rgba(232,88,88,0.16)]"
                >
                  Remove from wishlist
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Wishlist is empty."
          body="Save products to build a quieter, more deliberate buying shortlist."
          ctaHref="/search"
          ctaLabel="Browse marketplace"
        />
      )}
    </WorkspaceShell>
  );
}
