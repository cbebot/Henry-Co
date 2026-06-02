"use client";

import { DivisionImage, ActionButton } from "@henryco/dashboard-shell/components";
import { SaveForLaterButton } from "@henryco/cart-saved-items/client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { HenryCoActivityIndicator } from "@henryco/ui";
import { useMarketplaceCart, useMarketplaceRuntime } from "@/components/marketplace/runtime-provider";
import { formatCurrency } from "@/lib/utils";

export function MarketplaceCartDrawer() {
  const runtime = useMarketplaceRuntime();
  const {
    cart,
    cartBusy,
    cartOpen,
    closeCart,
    pendingCartSlugs,
    updateCartQuantity,
    removeCartItem,
    moveCartItemToSaved,
    pendingSavedItemIds,
  } = useMarketplaceCart();
  const cartSyncing = cartBusy || pendingCartSlugs.length > 0;

  return (
    <AnimatePresence>
      {cartOpen ? (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            onClick={closeCart}
            className="fixed inset-0 z-50 bg-[rgb(var(--home-ink-rgb)/0.42)] backdrop-blur-sm md:pointer-events-none md:bg-transparent md:backdrop-blur-0"
          />
          <motion.aside
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 48 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-[440px] flex-col border-l border-[var(--home-line-15)] bg-[var(--home-glass-strong)] text-[var(--home-ink)] shadow-[0_40px_140px_-60px_rgb(var(--home-ink-rgb)/0.4)] backdrop-blur-3xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--home-line-12)] px-6 py-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--home-accent-text)]">
                  Mini cart
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  {cart.count ? `${cart.count} item${cart.count === 1 ? "" : "s"} ready` : "Your basket is empty"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--home-line-15)] text-[var(--home-ink)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {cart.items.length ? (
                cart.items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[1.6rem] border border-[var(--home-line)] bg-[var(--home-surface-04)] p-4"
                  >
                    <div className="grid grid-cols-[84px,1fr] gap-4">
                      <div className="relative aspect-square overflow-hidden rounded-[1.15rem] bg-[var(--home-surface-07)]">
                        {item.image ? (
                          <DivisionImage
                            src={item.image}
                            alt={item.title}
                            fill
                            sizes="84px"
                            className="object-cover"
                            radius="0"
                          />
                        ) : null}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--home-ink-60)]">
                            {item.inventoryOwnerType === "company" ? "Henry & Co. stocked" : item.vendorName || "Verified store"}
                          </p>
                          <p className="mt-1 text-base font-semibold leading-6">{item.title}</p>
                          <p className="mt-1 text-sm text-[var(--home-ink-65)]">{item.deliveryNote}</p>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--home-line)] bg-[var(--home-surface-04)] px-2 py-1">
                            <button
                              type="button"
                              disabled={cartBusy}
                              aria-busy={cartBusy}
                              onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--home-surface-07)] disabled:cursor-wait"
                            >
                              {cartBusy ? (
                                <HenryCoActivityIndicator size="sm" className="text-[var(--home-ink)]" label="Updating cart" />
                              ) : (
                                <Minus className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <span className="min-w-6 text-center text-sm font-semibold">{item.quantity}</span>
                            <button
                              type="button"
                              disabled={cartBusy}
                              aria-busy={cartBusy}
                              onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--home-surface-07)] disabled:cursor-wait"
                            >
                              {cartBusy ? (
                                <HenryCoActivityIndicator size="sm" className="text-[var(--home-ink)]" label="Updating cart" />
                              ) : (
                                <Plus className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-semibold">
                              {formatCurrency(item.price * item.quantity, item.currency)}
                            </p>
                            {item.compareAtPrice ? (
                              <p className="text-xs text-[var(--home-ink-60)] line-through">
                                {formatCurrency(item.compareAtPrice, item.currency)}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--home-ink-60)]">
                      <SaveForLaterButton
                        onMove={async () => {
                          await moveCartItemToSaved(item.id);
                        }}
                        pending={pendingSavedItemIds.includes(item.id)}
                        compact
                        className="inline-flex items-center gap-1.5 hover:text-[var(--home-accent-text)] disabled:cursor-wait"
                        labelIdle="Save for later"
                        labelBusy="Saving..."
                      />
                      <span aria-hidden="true">·</span>
                      <ActionButton
                        tone="ghost"
                        spinner={cartBusy}
                        disabled={cartBusy}
                        onClick={async () => {
                          await removeCartItem(item.id);
                        }}
                      >
                        {cartBusy ? "Updating..." : "Remove"}
                      </ActionButton>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[1.8rem] border border-dashed border-[var(--home-line)] bg-[var(--home-surface-04)] p-8 text-center">
                  <ShoppingBag className="mx-auto h-8 w-8 text-[var(--home-accent-text)]" />
                  <p className="mt-4 text-xl font-semibold tracking-tight">Start building the basket.</p>
                  <p className="mt-3 text-sm leading-7 text-[var(--home-ink-65)]">
                    Quick-add from any card and the basket will stay updated here without a hard refresh.
                  </p>
                  <div className="mt-5 flex flex-col items-center gap-2">
                    <Link
                      href="/search"
                      onClick={closeCart}
                      className="inline-flex rounded-full bg-[var(--home-accent)] px-5 py-3 text-sm font-semibold text-[var(--home-accent-ink)]"
                    >
                      Explore products
                    </Link>
                    <Link
                      href="/account/saved"
                      onClick={closeCart}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--home-accent-text)]"
                    >
                      <Bookmark className="h-3 w-3" />
                      View saved items
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[var(--home-line-12)] px-6 py-5">
              {runtime.shell.issue ? (
                <div className="mb-4 rounded-[1.3rem] border border-[var(--home-line-15)] bg-[var(--home-surface-07)] px-4 py-3 text-sm text-[var(--home-ink)]">
                  {runtime.shell.issue}
                </div>
              ) : null}
              <div className="flex items-center justify-between text-sm text-[var(--home-ink-65)]">
                <span>Subtotal</span>
                <span className="text-base font-semibold text-[var(--home-ink)]">
                  {formatCurrency(cart.subtotal, cart.items[0]?.currency || "NGN")}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--home-ink-65)]">
                Split-order clarity, delivery windows, and payment states stay visible again at checkout.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {cartSyncing ? (
                  <div className="sm:col-span-2 rounded-[1.35rem] border border-[var(--home-line)] bg-[var(--home-surface-04)] px-4 py-4 text-center text-sm font-semibold text-[var(--home-ink-65)]">
                    Finalizing basket before navigation...
                  </div>
                ) : (
                  <>
                    <Link
                      href="/cart"
                      onClick={closeCart}
                      className="market-button-secondary inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
                    >
                      View cart
                    </Link>
                    <Link
                      href="/checkout"
                      onClick={closeCart}
                      className="market-button-primary inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
                    >
                      Checkout
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
