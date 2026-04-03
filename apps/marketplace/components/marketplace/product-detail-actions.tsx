"use client";

import Link from "next/link";
import { Heart, ShoppingBag, Store } from "lucide-react";
import { useMarketplaceCart, useMarketplaceFollows, useMarketplaceWishlist } from "@/components/marketplace/runtime-provider";
import type { MarketplaceProduct, MarketplaceVendor } from "@/lib/marketplace/types";

export function ProductDetailActions({
  product,
  vendor,
}: {
  product: MarketplaceProduct;
  vendor: MarketplaceVendor | null;
}) {
  const { addToCart } = useMarketplaceCart();
  const { isWishlisted, toggleWishlist } = useMarketplaceWishlist();
  const { isFollowing, toggleFollow } = useMarketplaceFollows();

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
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void addToCart(payload, 1)}
          className="market-button-primary rounded-full px-5 py-3 text-sm font-semibold"
        >
          Add to cart
        </button>
        <button
          type="button"
          onClick={() => void toggleWishlist(product.slug)}
          className="market-button-secondary rounded-full px-5 py-3 text-sm font-semibold"
        >
          {isWishlisted(product.slug) ? "Saved" : "Save"}
        </button>
        {vendor ? (
          <button
            type="button"
            onClick={() => void toggleFollow(vendor.slug)}
            className="market-button-secondary rounded-full px-5 py-3 text-sm font-semibold"
          >
            {isFollowing(vendor.slug) ? "Following store" : "Follow store"}
          </button>
        ) : null}
        <Link href="/search" className="market-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
          Compare more
        </Link>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--market-line-strong)] bg-[color:rgba(255,253,248,0.94)] p-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <button
            type="button"
            onClick={() => void toggleWishlist(product.slug)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--market-line)] bg-[var(--market-paper-white)] text-[var(--market-ink)]"
          >
            <Heart className={`h-4 w-4 ${isWishlisted(product.slug) ? "fill-current" : ""}`} />
          </button>
          {vendor ? (
            <button
              type="button"
              onClick={() => void toggleFollow(vendor.slug)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--market-line)] bg-[var(--market-paper-white)] text-[var(--market-ink)]"
            >
              <Store className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void addToCart(payload, 1)}
            className="market-button-primary inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
          >
            <ShoppingBag className="h-4 w-4" />
            Add to cart
          </button>
        </div>
      </div>
    </>
  );
}
