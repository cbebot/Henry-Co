"use client";

import { DivisionImage, ActionButton } from "@henryco/dashboard-shell/components";
import { SaveForLaterButton } from "@henryco/cart-saved-items/client";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { HenryCoActivityIndicator } from "@henryco/ui";
import { useHenryCoLocale } from "@henryco/i18n/react";
import { getMarketplaceCheckoutCopy } from "@henryco/i18n";
import {
  useMarketplaceCart,
  useMarketplaceWishlist,
} from "@/components/marketplace/runtime-provider";
import { formatCurrency } from "@/lib/utils";

export function CartExperience() {
  const locale = useHenryCoLocale();
  const copy = getMarketplaceCheckoutCopy(locale).cartExperience;
  const {
    cart,
    cartBusy,
    updateCartQuantity,
    removeCartItem,
    moveCartItemToSaved,
    pendingSavedItemIds,
  } = useMarketplaceCart();
  const { isWishlisted, pendingWishlistSlugs, toggleWishlist } = useMarketplaceWishlist();

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
                  {copy.splitOrderClarity}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--market-paper-white)]">
                  {groupName}
                </h2>
              </div>
              <p className="rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-paper-white)]">
                {items[0]?.inventoryOwnerType === "company" ? copy.henryCoStocked : copy.verifiedVendor}
              </p>
            </div>

            <div className="mt-5 space-y-4">
              {items.map((item) => {
                const saving = pendingWishlistSlugs.includes(item.productSlug);
                const saved = isWishlisted(item.productSlug);
                const movingToSaved = pendingSavedItemIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className="grid gap-4 rounded-[1.7rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-4 sm:grid-cols-[148px,1fr]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[1.35rem] bg-[var(--market-soft-wash)]">
                      {item.image ? (
                        <DivisionImage
                          src={item.image}
                          alt={item.title}
                          fill
                          sizes="148px"
                          className="object-cover"
                          radius="0"
                        />
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--market-muted)]">
                          {item.vendorName || copy.trustedSeller}
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
                            {cartBusy ? <HenryCoActivityIndicator size="sm" className="text-[var(--market-paper-white)]" label={copy.updatingCart} /> : "-"}
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
                            {cartBusy ? <HenryCoActivityIndicator size="sm" className="text-[var(--market-paper-white)]" label={copy.updatingCart} /> : "+"}
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
                      <div className="flex flex-wrap items-center gap-2">
                        <SaveForLaterButton
                          onMove={async () => {
                            await moveCartItemToSaved(item.id);
                          }}
                          pending={movingToSaved}
                          className="market-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-wait"
                          labelIdle={copy.saveForLater}
                          labelBusy={copy.saving}
                        />
                        <ActionButton
                          tone="ghost"
                          onClick={async () => {
                            await removeCartItem(item.id);
                          }}
                          disabled={cartBusy}
                          icon={<Trash2 className="h-4 w-4" />}
                          aria-label={copy.removeAria.replace("{title}", item.title)}
                        >
                          {copy.remove}
                        </ActionButton>
                        <ActionButton
                          tone="ghost"
                          onClick={async () => {
                            await toggleWishlist(item.productSlug);
                          }}
                          spinner={saving}
                          disabled={saving}
                        >
                          {saved ? copy.wishlisted : copy.addToWishlist}
                        </ActionButton>
                        <Link
                          href={`/product/${item.productSlug}`}
                          className="ml-auto text-sm font-semibold text-[var(--market-brass)]"
                        >
                          {copy.openProduct}
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
          {copy.checkoutReadiness}
        </p>
        <div className="mt-5 space-y-3 text-sm text-[var(--market-muted)]">
          <div className="flex items-center justify-between">
            <span>{copy.items}</span>
            <span className="font-semibold text-[var(--market-paper-white)]">{cart.count}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{copy.subtotal}</span>
            <span className="font-semibold text-[var(--market-paper-white)]">
              {formatCurrency(cart.subtotal, cart.items[0]?.currency || "NGN")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>{copy.estimatedShipping}</span>
            <span className="font-semibold text-[var(--market-paper-white)]">
              {cart.subtotal > 350000 ? copy.free : formatCurrency(18000, cart.items[0]?.currency || "NGN")}
            </span>
          </div>
        </div>
        <div className="mt-6 rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-4 text-sm leading-7 text-[var(--market-muted)]">
          {copy.vendorSegmentNote}
        </div>
        <div className="mt-6 grid gap-3">
          <Link
            href="/checkout"
            className="market-button-primary inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
          >
            {copy.continueToCheckout}
          </Link>
          <Link
            href="/search"
            className="market-button-secondary inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
          >
            {copy.keepBrowsing}
          </Link>
        </div>
      </aside>
    </section>
  );
}
