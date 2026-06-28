"use client";

import Link from "next/link";
import { Heart, ShoppingBag, Sparkles, Store } from "lucide-react";
import { HenryCoActivityIndicator } from "@henryco/ui";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { getMarketplaceCheckoutCopy } from "@henryco/i18n";
import {
  useMarketplaceCart,
  useMarketplaceFollows,
  useMarketplaceWishlist,
} from "@/components/marketplace/runtime-provider";
import type { MarketplaceProduct, MarketplaceVendor } from "@/lib/marketplace/types";

export function ProductDetailActions({
  product,
  vendor,
}: {
  product: MarketplaceProduct;
  vendor: MarketplaceVendor | null;
}) {
  const locale = useHenryCoLocale();
  const copy = getMarketplaceCheckoutCopy(locale).productActions;
  const { addToCart, pendingCartSlugs } = useMarketplaceCart();
  const { isWishlisted, pendingWishlistSlugs, toggleWishlist } = useMarketplaceWishlist();
  const { isFollowing, pendingFollowSlugs, toggleFollow } = useMarketplaceFollows();
  const adding = pendingCartSlugs.includes(product.slug);
  const saving = pendingWishlistSlugs.includes(product.slug);
  const followingBusy = vendor ? pendingFollowSlugs.includes(vendor.slug) : false;
  const wishlisted = isWishlisted(product.slug);
  const following = vendor ? isFollowing(vendor.slug) : false;

  const payload = {
    productSlug: product.slug,
    title: product.title,
    price: product.basePrice,
    compareAtPrice: product.compareAtPrice,
    currency: product.currency,
    image: product.gallery[0] || null,
    vendorSlug: product.vendorSlug,
    vendorName: vendor?.name || null,
    trustBadges: product.trustBadges,
    inventoryOwnerType: product.inventoryOwnerType,
    deliveryNote: product.deliveryNote,
  } as const;

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void addToCart(payload, 1)}
            disabled={adding}
            aria-busy={adding}
            className="market-button-primary inline-flex min-h-[48px] min-w-[10.5rem] items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-90"
          >
            {adding ? (
              <>
                <HenryCoActivityIndicator size="sm" className="text-[var(--market-noir)]" label={copy.addingToCart} />
                {copy.adding}
              </>
            ) : (
              copy.addToCart
            )}
          </button>
          <button
            type="button"
            onClick={() => void toggleWishlist(product.slug)}
            disabled={saving}
            aria-busy={saving}
            className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-wait ${
              wishlisted
                ? "border border-[rgba(221,182,120,0.26)] bg-[rgba(221,182,120,0.14)] text-[var(--market-paper-white)]"
                : "market-button-secondary"
            }`}
          >
            {saving ? (
              <HenryCoActivityIndicator size="sm" label={copy.updatingWishlist} />
            ) : (
              <Heart className={`h-4 w-4 ${wishlisted ? "fill-current" : ""}`} />
            )}
            {saving ? copy.saving : wishlisted ? copy.savedToWishlist : copy.save}
          </button>
          {vendor ? (
            <button
              type="button"
              onClick={() => void toggleFollow(vendor.slug)}
              disabled={followingBusy}
              aria-busy={followingBusy}
              className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-wait ${
                following
                  ? "border border-[rgba(117,209,255,0.26)] bg-[rgba(117,209,255,0.12)] text-[var(--market-paper-white)]"
                  : "market-button-secondary"
              }`}
            >
              {followingBusy ? (
                <HenryCoActivityIndicator size="sm" label={copy.updatingFollow} />
              ) : (
                <Store className="h-4 w-4" />
              )}
              {followingBusy ? copy.updating : following ? copy.followingStore : copy.followStore}
            </button>
          ) : null}
          <Link href="/search" className="market-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold">
            <Sparkles className="h-4 w-4" />
            {copy.compareMore}
          </Link>
        </div>
        <p className="border-l-2 border-[var(--market-brass)]/55 pl-4 text-sm leading-7 text-[var(--market-muted)]">
          {copy.note}
        </p>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--market-line)] bg-[rgba(5,7,13,0.92)] p-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <button
            type="button"
            onClick={() => void toggleWishlist(product.slug)}
            disabled={saving}
            aria-busy={saving}
            aria-label={saving ? copy.updatingWishlist : wishlisted ? copy.removeFromWishlist : copy.saveToWishlist}
            className={`inline-flex h-12 w-12 items-center justify-center rounded-full border text-[var(--market-paper-white)] ${
              wishlisted
                ? "border-[rgba(221,182,120,0.26)] bg-[rgba(221,182,120,0.14)]"
                : "border-[var(--market-line)] bg-[rgba(255,255,255,0.04)]"
            }`}
          >
            {saving ? (
              <HenryCoActivityIndicator size="sm" className="text-[var(--market-paper-white)]" label={copy.updatingWishlist} />
            ) : (
              <Heart className={`h-4 w-4 ${wishlisted ? "fill-current" : ""}`} />
            )}
          </button>
          {vendor ? (
            <button
              type="button"
              onClick={() => void toggleFollow(vendor.slug)}
              disabled={followingBusy}
              aria-busy={followingBusy}
              aria-label={followingBusy ? copy.updatingFollow : following ? copy.followingStore : copy.followStore}
              className={`inline-flex h-12 w-12 items-center justify-center rounded-full border text-[var(--market-paper-white)] ${
                following
                  ? "border-[rgba(117,209,255,0.26)] bg-[rgba(117,209,255,0.12)]"
                  : "border-[var(--market-line)] bg-[rgba(255,255,255,0.04)]"
              }`}
            >
              {followingBusy ? (
                <HenryCoActivityIndicator size="sm" className="text-[var(--market-paper-white)]" label={copy.updatingFollow} />
              ) : (
                <Store className="h-4 w-4" />
              )}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void addToCart(payload, 1)}
            disabled={adding}
            aria-busy={adding}
            className="market-button-primary inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-wait"
          >
            {adding ? (
              <HenryCoActivityIndicator size="sm" className="text-[var(--market-noir)]" label={copy.addingToCart} />
            ) : (
              <ShoppingBag className="h-4 w-4" />
            )}
            {adding ? copy.adding : copy.addToCart}
          </button>
        </div>
      </div>
    </>
  );
}
