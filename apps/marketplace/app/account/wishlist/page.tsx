import { EmptyState, ProductCard, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import { accountWorkspaceNav } from "@/lib/marketplace/navigation";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { getMarketplaceCustomerAccountCopy } from "@henryco/i18n";

export const dynamic = "force-dynamic";

/* TODO(wave3-catalogue): paginate translation — wishlist is a catalogue
   list surface; ProductCard reads raw product.title and translating every
   row would compound DeepL spend on hot routes. */

type SearchParams = {
  saved?: string;
  removed?: string;
};

export default async function AccountWishlistPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplaceCustomerAccountCopy(locale);
  await requireMarketplaceUser("/account/wishlist");
  const [data, params] = await Promise.all([getBuyerDashboardData(), searchParams]);

  const toast = params.removed
    ? copy.wishlist.toastRemoved
    : params.saved
      ? copy.wishlist.toastSaved
      : null;

  return (
    <WorkspaceShell
      title={copy.wishlist.title}
      description={copy.wishlist.description}
      {...accountWorkspaceNav("/account/wishlist", locale)}
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
                  {copy.wishlist.remove}
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={copy.wishlist.emptyTitle}
          body={copy.wishlist.emptyBody}
          ctaHref="/search"
          ctaLabel={copy.wishlist.emptyCta}
        />
      )}
    </WorkspaceShell>
  );
}
