"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ShoppingBag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMarketplaceCart, useMarketplaceWishlist } from "@/components/marketplace/runtime-provider";
import type { MarketplaceProduct } from "@/lib/marketplace/types";
import { cn, formatCurrency } from "@/lib/utils";

const fallbackImage =
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80";

export function ProductCardClient({ product }: { product: MarketplaceProduct }) {
  const { addToCart, pendingCartSlugs } = useMarketplaceCart();
  const { isWishlisted, pendingWishlistSlugs, toggleWishlist } = useMarketplaceWishlist();
  const saving = pendingWishlistSlugs.includes(product.slug);
  const adding = pendingCartSlugs.includes(product.slug);
  const wishlisted = isWishlisted(product.slug);
  const [justAdded, setJustAdded] = useState(false);
  const flashTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) {
        window.clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);

  async function handleAddToCart() {
    const added = await addToCart(
      {
        productSlug: product.slug,
        title: product.title,
        price: product.basePrice,
        compareAtPrice: product.compareAtPrice,
        currency: product.currency,
        image: product.gallery[0] || null,
        vendorSlug: product.vendorSlug,
        vendorName: null,
        trustBadges: product.trustBadges,
        inventoryOwnerType: product.inventoryOwnerType,
        deliveryNote: product.deliveryNote,
      },
      1
    );

    if (!added) return;
    setJustAdded(true);
    if (flashTimeoutRef.current) {
      window.clearTimeout(flashTimeoutRef.current);
    }
    flashTimeoutRef.current = window.setTimeout(() => setJustAdded(false), 1800);
  }

  return (
    <motion.article
      layout
      whileHover={{ y: -4 }}
      className={cn(
        "group relative z-10 flex h-full scroll-mt-40 flex-col overflow-hidden rounded-[1.9rem] border border-[var(--market-line)] bg-[var(--market-paper-white)] shadow-[0_24px_70px_rgba(28,24,18,0.08)] transition duration-300",
        justAdded && "border-[color:rgba(92,124,78,0.38)] shadow-[0_28px_84px_rgba(72,95,60,0.14)]"
      )}
    >
      <div className="relative aspect-[4/4.5] overflow-hidden bg-[var(--market-soft-wash)]">
        <Image
          src={product.gallery[0] || fallbackImage}
          alt={product.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[rgba(10,8,6,0.72)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
              {product.inventoryOwnerType === "company" ? "HenryCo stocked" : "Verified seller"}
            </span>
            {product.stock > 0 && product.stock <= 3 ? (
              <span className="rounded-full bg-[var(--market-alert)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                Only {product.stock} left
              </span>
            ) : null}
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => void toggleWishlist(product.slug)}
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-full border transition",
              wishlisted
                ? "border-[var(--market-alert)] bg-[rgba(124,36,25,0.14)] text-[var(--market-alert)]"
                : "border-[rgba(255,255,255,0.4)] bg-[rgba(255,255,255,0.84)] text-[var(--market-ink)]"
            )}
            aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
          >
            <Heart className={cn("h-4 w-4", wishlisted ? "fill-current" : "")} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--market-muted)]">
              {product.categorySlug.replace(/-/g, " ")}
            </p>
            {product.codEligible ? (
              <span className="rounded-full bg-[var(--market-soft-olive)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-success)]">
                COD ready
              </span>
            ) : null}
          </div>
          <div>
            <h3 className="text-[1.25rem] font-semibold tracking-tight text-[var(--market-ink)]">
              {product.title}
            </h3>
            <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">{product.summary}</p>
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--market-muted)]">
            {product.deliveryNote || product.leadTime}
          </p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-4">
          <div>
            <p className="text-2xl font-semibold text-[var(--market-ink)]">
              {formatCurrency(product.basePrice, product.currency)}
            </p>
            {product.compareAtPrice ? (
              <p className="text-sm text-[var(--market-muted)] line-through">
                {formatCurrency(product.compareAtPrice, product.currency)}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={adding}
              onClick={() => void handleAddToCart()}
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--market-paper-white)] shadow-[0_16px_34px_rgba(18,14,10,0.18)] transition",
                adding
                  ? "bg-[var(--market-brass)]"
                  : justAdded
                    ? "bg-[var(--market-success)]"
                    : "bg-[var(--market-noir)] hover:scale-[1.02]"
              )}
              aria-label={`Add ${product.title} to cart`}
            >
              <ShoppingBag className="h-4 w-4" />
            </button>

            <Link
              href={`/product/${product.slug}`}
              className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--market-line-strong)] px-4 text-sm font-semibold text-[var(--market-ink)] transition hover:border-[var(--market-brass)] hover:text-[var(--market-brass)]"
            >
              View
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
