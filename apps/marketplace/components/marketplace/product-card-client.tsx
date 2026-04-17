"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { HenryCoActivityIndicator } from "@henryco/ui";
import { useEffect, useRef, useState } from "react";
import { useMarketplaceCart, useMarketplaceWishlist } from "@/components/marketplace/runtime-provider";
import { getMarketplacePublicCopy } from "@/lib/public-copy";
import { useOptionalHenryCoLocale } from "@henryco/i18n/react";
import type { MarketplaceProduct } from "@/lib/marketplace/types";
import { cn, formatCurrency } from "@/lib/utils";

const fallbackImage =
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80";

export function ProductCardClient({ product }: { product: MarketplaceProduct }) {
  const locale = useOptionalHenryCoLocale() ?? "en";
  const copy = getMarketplacePublicCopy(locale);
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
      whileHover={{ y: -6 }}
      className={cn(
        "group relative z-10 flex h-full scroll-mt-40 flex-col overflow-hidden rounded-[2rem] border border-[var(--market-line)] bg-[linear-gradient(180deg,rgba(16,21,32,0.96),rgba(10,14,23,0.9))] shadow-[0_26px_90px_rgba(0,0,0,0.24)] transition duration-300",
        justAdded && "border-[rgba(117,209,255,0.34)] shadow-[0_36px_110px_rgba(117,209,255,0.18)]"
      )}
    >
      <div className="relative aspect-[4/4.6] overflow-hidden bg-[var(--market-soft-wash)]">
        <Image
          src={product.gallery[0] || fallbackImage}
          alt={product.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(4,7,13,0.9)] via-[rgba(4,7,13,0.12)] to-transparent" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(4,7,13,0.62)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-paper-white)]">
              {product.inventoryOwnerType === "company" ? copy.productCard.stockedByHenryCo : copy.productCard.verifiedSeller}
            </span>
            {product.stock > 0 && product.stock <= 3 ? (
              <span className="rounded-full bg-[rgba(255,171,151,0.92)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-noir)]">
                {copy.productCard.onlyLeft.replace("{count}", String(product.stock))}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            disabled={saving}
            aria-busy={saving}
            onClick={() => void toggleWishlist(product.slug)}
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-xl transition disabled:cursor-wait",
              wishlisted
                ? "border-[rgba(255,171,151,0.48)] bg-[rgba(255,171,151,0.16)] text-[var(--market-alert)]"
                : "border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.12)] text-[var(--market-paper-white)]"
            )}
            aria-label={wishlisted ? copy.productCard.removeFromWishlist : copy.productCard.saveToWishlist}
          >
            {saving ? (
              <HenryCoActivityIndicator size="sm" className="text-[var(--market-paper-white)]" label={copy.productCard.updatingWishlist} />
            ) : (
              <Heart className={cn("h-4 w-4", wishlisted ? "fill-current" : "")} />
            )}
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(4,7,13,0.58)] px-3 py-1 text-xs text-[var(--market-paper-white)] backdrop-blur-xl">
            <Star className="h-3.5 w-3.5 fill-[var(--market-brass)] text-[var(--market-brass)]" />
            <span className="font-semibold">{product.rating.toFixed(1)}</span>
            <span className="text-[rgba(255,255,255,0.66)]">({product.reviewCount})</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--market-muted)]">
              {product.categorySlug.replace(/-/g, " ")}
            </p>
            {product.codEligible ? (
              <span className="rounded-full border border-[rgba(144,215,186,0.22)] bg-[rgba(144,215,186,0.12)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-success)]">
                {copy.productCard.codReady}
              </span>
            ) : null}
          </div>
          <div className="space-y-2">
            <h3 className="text-[1.28rem] font-semibold tracking-tight text-[var(--market-paper-white)]">
              {product.title}
            </h3>
            <p className="text-sm leading-7 text-[var(--market-muted)]">{product.summary}</p>
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--market-muted)]">
            {product.deliveryNote || product.leadTime}
          </p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-4">
          <div>
            <p className="text-2xl font-semibold text-[var(--market-paper-white)]">
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
              aria-busy={adding}
              onClick={() => void handleAddToCart()}
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-full transition disabled:cursor-wait",
                adding
                  ? "bg-[rgba(221,182,120,0.9)] text-[var(--market-noir)]"
                  : justAdded
                    ? "bg-[var(--market-success)] text-[var(--market-noir)]"
                    : "market-button-primary"
              )}
              aria-label={`${copy.productCard.addToCart} ${product.title}`}
            >
              {adding ? (
                <HenryCoActivityIndicator size="sm" className="text-[var(--market-noir)]" label={copy.productCard.addingToCart} />
              ) : (
                <ShoppingBag className="h-4 w-4" />
              )}
            </button>

            <Link
              href={`/product/${product.slug}`}
              className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--market-line-strong)] bg-[rgba(255,255,255,0.04)] px-4 text-sm font-semibold text-[var(--market-paper-white)] transition hover:border-[rgba(117,209,255,0.42)] hover:text-[var(--market-paper-white)]"
            >
              {copy.productCard.view}
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
