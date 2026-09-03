"use client";

import { DivisionImage } from "@henryco/dashboard-shell/components";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ShieldCheck, ShoppingBag, Star } from "lucide-react";
import { HenryCoActivityIndicator, SellerTierBadge, type SellerTier } from "@henryco/ui";
import { useEffect, useRef, useState } from "react";
import { useMarketplaceCart, useMarketplaceWishlist } from "@/components/marketplace/runtime-provider";
import { DeliveryPromiseBadge } from "@/components/marketplace/DeliveryPromiseBadge";
import { getMarketplacePublicCopy } from "@/lib/public-copy";
import { getSellerAcademyCopy, translateSurfaceLabel } from "@henryco/i18n";
import { useOptionalHenryCoLocale } from "@henryco/i18n/react";
import type { MarketplaceProduct } from "@/lib/marketplace/types";
import { cn, formatCurrency } from "@/lib/utils";

const fallbackImage =
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80";

export function ProductCardClient({
  product,
  priority,
  sellerTier,
  deliveryPromise,
}: {
  product: MarketplaceProduct;
  /** Above-the-fold card hint — eager-loads the image and bypasses lazy. */
  priority?: boolean;
  /** V3-58 server-derived seller tier for this listing's vendor; 'none'/undefined → no chip. */
  sellerTier?: SellerTier;
  /** V3-DELIVERY-COMPLETE-01 tier-clamped Delivery Promise for the vendor; null → no badge. */
  deliveryPromise?: { coveredStates: string[] } | null;
}) {
  const locale = useOptionalHenryCoLocale() ?? "en";
  const copy = getMarketplacePublicCopy(locale);
  const sellerCopy = getSellerAcademyCopy(locale);
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
        "group relative z-10 flex h-full scroll-mt-40 flex-col overflow-hidden rounded-[2rem] border border-[color:var(--home-line-12)] bg-[color:var(--home-sheet)] shadow-[0_26px_90px_-60px_rgb(var(--home-ink-rgb)/0.28)] transition duration-300",
        justAdded &&
          "border-[color:var(--home-accent)] shadow-[0_36px_110px_-60px_var(--home-accent-soft)]"
      )}
    >
      <div className="relative aspect-[4/4.6] overflow-hidden bg-[color:var(--home-surface-04)]">
        <DivisionImage
          src={product.gallery[0] || fallbackImage}
          alt={product.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-[1.04]"
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          radius="0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--home-ink-rgb)/0.42)] via-[rgb(var(--home-ink-rgb)/0.06)] to-transparent" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
        <div className="flex flex-wrap gap-2">
            {product.henryOnyxVerified ? (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-[color:var(--home-accent)] bg-[color:var(--home-accent-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--home-accent-text)] backdrop-blur-xl"
                title={translateSurfaceLabel(locale, "Henry Onyx Verified")}
              >
                <ShieldCheck className="h-3 w-3" aria-hidden />
                {translateSurfaceLabel(locale, "Henry Onyx Verified")}
              </span>
            ) : null}
          <span className="rounded-full border border-[color:var(--home-line-15)] bg-[color:var(--home-glass-strong)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--home-ink-80)] backdrop-blur-xl">
              {product.inventoryOwnerType === "company" ? copy.productCard.stockedByHenryCo : copy.productCard.verifiedSeller}
            </span>
            {sellerTier && sellerTier !== "none" ? (
              <SellerTierBadge
                tier={sellerTier}
                label={sellerCopy.tierNames[sellerTier]}
                tooltip={sellerCopy.badge.tooltip[sellerTier]}
                size="sm"
              />
            ) : null}
            {product.stock > 0 && product.stock <= 3 ? (
              <span className="rounded-full bg-[color:var(--home-accent)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--home-accent-ink)]">
                {copy.productCard.onlyLeft.replace("{count}", String(product.stock))}
              </span>
            ) : null}
            <DeliveryPromiseBadge promise={deliveryPromise ?? null} locale={locale} />
          </div>
          <button
            type="button"
            disabled={saving}
            aria-busy={saving}
            aria-pressed={wishlisted}
            onClick={() => void toggleWishlist(product.slug)}
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-xl transition outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--home-accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--home-canvas)] active:translate-y-[0.5px] disabled:cursor-wait disabled:active:translate-y-0",
              wishlisted
                ? "border-[color:var(--home-accent)] bg-[color:var(--home-accent-soft)] text-[color:var(--home-accent-text)]"
                : "border-[color:var(--home-line-15)] bg-[color:var(--home-glass-strong)] text-[color:var(--home-ink-75)] hover:bg-[color:var(--home-sheet)]"
            )}
            aria-label={wishlisted ? copy.productCard.removeFromWishlist : copy.productCard.saveToWishlist}
          >
            {saving ? (
              <HenryCoActivityIndicator size="sm" className="text-[color:var(--home-ink-75)]" label={copy.productCard.updatingWishlist} />
            ) : (
              <Heart className={cn("h-4 w-4", wishlisted ? "fill-current" : "")} />
            )}
          </button>
        </div>

        {product.reviewCount > 0 ? (
          <div className="absolute inset-x-0 bottom-0 p-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--home-line-12)] bg-[color:var(--home-glass-strong)] px-3 py-1 text-xs text-[color:var(--home-ink-80)] backdrop-blur-xl">
              <Star className="h-3.5 w-3.5 fill-[var(--home-accent)] text-[var(--home-accent)]" />
              <span className="font-semibold">{product.rating.toFixed(1)}</span>
              <span className="text-[color:var(--home-ink-55)]">({product.reviewCount})</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--home-ink-55)]">
              {product.categorySlug.replace(/-/g, " ")}
            </p>
            {product.codEligible ? (
              <span className="rounded-full border border-[color:var(--home-accent-ring)] bg-[color:var(--home-accent-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--home-accent-text)]">
                {copy.productCard.codReady}
              </span>
            ) : null}
          </div>
          <div className="space-y-2">
            <h3
              className="text-[1.28rem] font-semibold tracking-tight text-[color:var(--home-ink-92)]"
              style={{ fontFamily: "var(--home-font-display)" }}
            >
              {product.title}
            </h3>
            <p className="text-sm leading-7 text-[color:var(--home-ink-70)]">{product.summary}</p>
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--home-ink-55)]">
            {product.deliveryNote || product.leadTime}
          </p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-4">
          <div>
            <p className="text-2xl font-semibold text-[color:var(--home-ink-92)]">
              {formatCurrency(product.basePrice, product.currency)}
            </p>
            {product.compareAtPrice ? (
              <p className="text-sm text-[color:var(--home-ink-55)] line-through">
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
                "inline-flex h-11 w-11 items-center justify-center rounded-full transition outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--home-accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--home-canvas)] active:translate-y-[0.5px] disabled:cursor-wait disabled:active:translate-y-0",
                adding
                  ? "bg-[color:var(--home-accent-strong)] text-[color:var(--home-accent-ink)]"
                  : justAdded
                    ? "bg-[color:var(--home-accent-strong)] text-[color:var(--home-accent-ink)]"
                    : "market-button-primary"
              )}
              aria-label={`${copy.productCard.addToCart} ${product.title}`}
            >
              {adding ? (
                <HenryCoActivityIndicator size="sm" className="text-[color:var(--home-accent-ink)]" label={copy.productCard.addingToCart} />
              ) : (
                <ShoppingBag className="h-4 w-4" />
              )}
            </button>

            <Link
              href={`/product/${product.slug}`}
              className="inline-flex h-11 items-center justify-center rounded-full border border-[color:var(--home-line-15)] bg-[color:var(--home-surface-04)] px-4 text-sm font-semibold text-[color:var(--home-ink-80)] transition outline-none hover:border-[color:var(--home-accent)] hover:bg-[color:var(--home-surface-07)] focus-visible:ring-2 focus-visible:ring-[color:var(--home-accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--home-canvas)] active:translate-y-[0.5px]"
            >
              {copy.productCard.view}
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
