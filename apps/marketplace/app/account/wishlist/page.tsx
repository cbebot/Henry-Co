import { translateSurfaceLabel } from "@henryco/i18n";
import { MarketplaceActionForm } from "@/components/marketplace/actions/MarketplaceActionForm";
import { EmptyState, ProductCard, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import { accountWorkspaceNav } from "@/lib/marketplace/navigation";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

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
  const t = (text: string) => translateSurfaceLabel(locale, text);
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
      {...accountWorkspaceNav("/account/wishlist", locale)}
    >
      {toast ? (
        <div className="rounded-[1.25rem] border border-[rgba(76,201,160,0.35)] bg-[rgba(76,201,160,0.12)] px-4 py-3 text-sm font-medium text-[color:var(--acct-green-ink)]">
          {toast}
        </div>
      ) : null}

      {data.wishlist.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.wishlist.map((product) => (
            <div key={product.slug} className="flex flex-col gap-3">
              <ProductCard product={product} />
              <MarketplaceActionForm
                intent="wishlist_toggle"
                hidden={{ product_slug: product.slug, return_to: "/account/wishlist" }}
                submitLabel={t("Remove from wishlist")}
                pendingLabel={t("Removing from wishlist")}
                successTitle={t("Removed from wishlist.")}
                errorTitle={t("Wishlist could not be updated.")}
                buttonClassName="w-full rounded-full border border-[rgba(232,88,88,0.35)] bg-[rgba(232,88,88,0.08)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--acct-red-ink)] hover:bg-[rgba(232,88,88,0.16)] disabled:cursor-wait disabled:opacity-80"
              />
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
