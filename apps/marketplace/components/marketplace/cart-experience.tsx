"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { HenryCoActivityIndicator } from "@henryco/ui";
import { useMarketplaceCart, useMarketplaceWishlist } from "@/components/marketplace/runtime-provider";
import { summarizeMarketplaceCartCurrencies } from "@/lib/cart-truth";
import { formatCurrency } from "@/lib/utils";

export function CartExperience() {
  const { cart, cartBusy, updateCartQuantity } = useMarketplaceCart();
  const { isWishlisted, pendingWishlistSlugs, toggleWishlist } = useMarketplaceWishlist();
  const cartSummary = summarizeMarketplaceCartCurrencies(cart.items);

  const grouped = Object.entries(
    cart.items.reduce<Record<string, typeof cart.items>>((accumulator, item) => {
      const key = item.vendorName || item.vendorSlug || "HenryCo";
      accumulator[key] = accumulator[key] ? [...accumulator[key], item] : [item];
      return accumulator;
    }, {})
  );

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr,380px]">
      <div className="space-y-5">
        {grouped.map(([groupName, items]) => (
          <article
            key={groupName}
            className="market-paper rounded-[2rem] p-5"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--market-brass)]">
                  Split-order clarity
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--market-paper-white)]">
                  {groupName}
                </h2>
              </div>
              <p className="rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-paper-white)]">
                {items[0]?.inventoryOwnerType === "company" ? "HenryCo stocked" : "Verified vendor"}
              </p>
            </div>

            <div className="mt-5 space-y-4">
              {items.map((item) => {
                const saving = pendingWishlistSlugs.includes(item.productSlug);
                const saved = isWishlisted(item.productSlug);

                return (
                  <div
                    key={item.id}
                    className="grid gap-4 rounded-[1.7rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-4 sm:grid-cols-[148px,1fr]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[1.35rem] bg-[var(--market-soft-wash)]">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          sizes="148px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--market-muted)]">
                          {item.vendorName || "Trusted seller"}
                        </p>
                        <h3 className="mt-2 text-xl font-semibold tracking-tight text-[var(--market-paper-white)]">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">{item.deliveryNote}</p>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex items-center rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-1">
                          <button
                            type="button"
                            disabled={cartBusy}
                            aria-busy={cartBusy}
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--market-paper-white)] disabled:cursor-wait"
                          >
                            {cartBusy ? <HenryCoActivityIndicator size="sm" className="text-[var(--market-paper-white)]" label="Updating cart" /> : "-"}
                          </button>
                          <span className="min-w-10 text-center text-sm font-semibold text-[var(--market-paper-white)]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={cartBusy}
                            aria-busy={cartBusy}
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--market-paper-white)] disabled:cursor-wait"
                          >
                            {cartBusy ? <HenryCoActivityIndicator size="sm" className="text-[var(--market-paper-white)]" label="Updating cart" /> : "+"}
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-semibold text-[var(--market-paper-white)]">
                            {formatCurrency(item.price * item.quantity, item.currency)}
                          </p>
                          {item.compareAtPrice ? (
                            <p className="text-sm text-[var(--market-muted)] line-through">
                              {formatCurrency(item.compareAtPrice, item.currency)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={saving}
                          aria-busy={saving}
                          onClick={() => void toggleWishlist(item.productSlug)}
                          className="market-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-wait"
                        >
                          {saving ? (
                            <HenryCoActivityIndicator size="sm" label="Updating wishlist" />
                          ) : (
                            <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
                          )}
                          <span>{saving ? "Saving..." : saved ? "Saved for later" : "Move to wishlist"}</span>
                        </button>
                        <Link
                          href={`/product/${item.productSlug}`}
                          className="text-sm font-semibold text-[var(--market-brass)]"
                        >
                          Open product
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>

      <aside className="market-panel sticky top-28 h-fit rounded-[2rem] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--market-brass)]">
          Checkout readiness
        </p>
        <div className="mt-5 space-y-3 text-sm text-[var(--market-muted)]">
          <div className="flex items-center justify-between">
            <span>Items</span>
            <span className="font-semibold text-[var(--market-paper-white)]">{cart.count}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-[var(--market-paper-white)]">
              {cartSummary.mixedPricing
                ? cartSummary.currencies.join(" + ")
                : formatCurrency(cartSummary.subtotal, cartSummary.primaryCurrency || "NGN")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Estimated shipping</span>
            <span className="font-semibold text-[var(--market-paper-white)]">
              {cartSummary.shipping == null
                ? "Quoted at supported checkout"
                : cartSummary.shipping === 0
                  ? "Free"
                  : formatCurrency(cartSummary.shipping, cartSummary.primaryCurrency || "NGN")}
            </span>
          </div>
        </div>
        <div className="mt-6 rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-4 text-sm leading-7 text-[var(--market-muted)]">
          {cartSummary.blockingReason || cartSummary.helperText}
        </div>
        <div className="mt-6 grid gap-3">
          {cartSummary.canCheckout ? (
            <Link
              href="/checkout"
              className="market-button-primary inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
            >
              Continue to checkout
            </Link>
          ) : (
            <div className="rounded-full border border-[rgba(255,171,151,0.24)] bg-[rgba(126,33,18,0.08)] px-5 py-3 text-center text-sm font-semibold text-[var(--market-paper-white)]">
              Checkout is paused until pricing and settlement truth line up.
            </div>
          )}
          <Link
            href="/search"
            className="market-button-secondary inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
          >
            Keep browsing
          </Link>
        </div>
      </aside>
    </section>
  );
}
