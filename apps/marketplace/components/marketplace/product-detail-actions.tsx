"use client";

import Link from "next/link";
import { Heart, ShoppingBag, Sparkles, Store } from "lucide-react";
import { HenryCoActivityIndicator } from "@henryco/ui";
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
  const { addToCart, pendingCartSlugs } = useMarketplaceCart();
  const { isWishlisted, pendingWishlistSlugs, toggleWishlist } = useMarketplaceWishlist();
  const { isFollowing, pendingFollowSlugs, toggleFollow } = useMarketplaceFollows();
  const adding = pendingCartSlugs.includes(product.slug);
  const saving = pendingWishlistSlugs.includes(product.slug);
  const followingBusy = vendor ? pendingFollowSlugs.includes(vendor.slug) : false;

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
                <HenryCoActivityIndicator size="sm" className="text-[var(--market-noir)]" label="Adding to cart" />
                Adding…
              </>
            ) : (
              "Add to cart"
            )}
          </button>
          <button
            type="button"
            onClick={() => void toggleWishlist(product.slug)}
            disabled={saving}
            aria-busy={saving}
            className="market-button-secondary inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-wait"
          >
            {saving ? (
              <HenryCoActivityIndicator size="sm" label="Updating wishlist" />
            ) : (
              <Heart className={`h-4 w-4 ${isWishlisted(product.slug) ? "fill-current" : ""}`} />
            )}
            {saving ? "Saving…" : isWishlisted(product.slug) ? "Saved" : "Save"}
          </button>
          {vendor ? (
            <button
              type="button"
              onClick={() => void toggleFollow(vendor.slug)}
              disabled={followingBusy}
              aria-busy={followingBusy}
              className="market-button-secondary inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-wait"
            >
              {followingBusy ? (
                <HenryCoActivityIndicator size="sm" label="Updating store follow" />
              ) : (
                <Store className="h-4 w-4" />
              )}
              {followingBusy ? "Updating…" : isFollowing(vendor.slug) ? "Following store" : "Follow store"}
            </button>
          ) : null}
          <Link href="/search" className="market-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold">
            <Sparkles className="h-4 w-4" />
            Compare more
          </Link>
        </div>
        <div className="rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-4 text-sm leading-7 text-[var(--market-muted)]">
          Quick-add updates the mini-cart instantly. Saved items, follows, notifications, and future payment events stay attached to the same HenryCo account identity.
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--market-line)] bg-[rgba(5,7,13,0.92)] p-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <button
            type="button"
            onClick={() => void toggleWishlist(product.slug)}
            disabled={saving}
            aria-busy={saving}
            aria-label={saving ? "Updating wishlist" : isWishlisted(product.slug) ? "Remove from wishlist" : "Save to wishlist"}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] text-[var(--market-paper-white)]"
          >
            {saving ? (
              <HenryCoActivityIndicator size="sm" className="text-[var(--market-paper-white)]" label="Updating wishlist" />
            ) : (
              <Heart className={`h-4 w-4 ${isWishlisted(product.slug) ? "fill-current" : ""}`} />
            )}
          </button>
          {vendor ? (
            <button
              type="button"
              onClick={() => void toggleFollow(vendor.slug)}
              disabled={followingBusy}
              aria-busy={followingBusy}
              aria-label={followingBusy ? "Updating store follow" : isFollowing(vendor.slug) ? "Following store" : "Follow store"}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] text-[var(--market-paper-white)]"
            >
              {followingBusy ? (
                <HenryCoActivityIndicator size="sm" className="text-[var(--market-paper-white)]" label="Updating store follow" />
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
              <HenryCoActivityIndicator size="sm" className="text-[var(--market-noir)]" label="Adding to cart" />
            ) : (
              <ShoppingBag className="h-4 w-4" />
            )}
            {adding ? "Adding…" : "Add to cart"}
          </button>
        </div>
      </div>
    </>
  );
}
