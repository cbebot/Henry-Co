"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useMarketplaceCart, useMarketplaceRuntime } from "@/components/marketplace/runtime-provider";
import { formatCurrency } from "@/lib/utils";

export function MarketplaceCartDrawer() {
  const runtime = useMarketplaceRuntime();
  const { cart, cartBusy, cartOpen, closeCart, pendingCartSlugs, updateCartQuantity, removeCartItem } = useMarketplaceCart();
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
            onClick={closeCart}
            className="fixed inset-0 z-50 bg-[rgba(10,8,6,0.42)] backdrop-blur-sm md:pointer-events-none md:bg-transparent md:backdrop-blur-0"
          />
          <motion.aside
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 48 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
            className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-[440px] flex-col border-l border-[var(--market-line-strong)] bg-[rgba(5,7,13,0.94)] text-[var(--market-paper-white)] shadow-[0_40px_140px_rgba(0,0,0,0.45)] backdrop-blur-3xl"
          >
            <div className="flex items-center justify-between border-b border-[color:rgba(255,255,255,0.12)] px-6 py-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--market-brass)]">
                  Mini cart
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  {cart.count ? `${cart.count} item${cart.count === 1 ? "" : "s"} ready` : "Your basket is empty"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:rgba(255,255,255,0.16)] text-[var(--market-paper-white)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {cart.items.length ? (
                cart.items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[1.6rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-4"
                  >
                    <div className="grid grid-cols-[84px,1fr] gap-4">
                      <div className="relative aspect-square overflow-hidden rounded-[1.15rem] bg-[rgba(255,255,255,0.06)]">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            sizes="84px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--market-muted)]">
                            {item.inventoryOwnerType === "company" ? "HenryCo stocked" : item.vendorName || "Verified store"}
                          </p>
                          <p className="mt-1 text-base font-semibold leading-6">{item.title}</p>
                          <p className="mt-1 text-sm text-[var(--market-muted)]">{item.deliveryNote}</p>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-2 py-1">
                            <button
                              type="button"
                              disabled={cartBusy}
                              onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.08)]"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-6 text-center text-sm font-semibold">{item.quantity}</span>
                            <button
                              type="button"
                              disabled={cartBusy}
                              onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.08)]"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-semibold">
                              {formatCurrency(item.price * item.quantity, item.currency)}
                            </p>
                            {item.compareAtPrice ? (
                              <p className="text-xs text-[var(--market-muted)] line-through">
                                {formatCurrency(item.compareAtPrice, item.currency)}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={cartBusy}
                      onClick={() => removeCartItem(item.id)}
                      className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]"
                    >
                      Remove
                    </button>
                  </article>
                ))
              ) : (
                <div className="rounded-[1.8rem] border border-dashed border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-8 text-center">
                  <ShoppingBag className="mx-auto h-8 w-8 text-[var(--market-brass)]" />
                  <p className="mt-4 text-xl font-semibold tracking-tight">Start building the basket.</p>
                  <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">
                    Quick-add from any card and the basket will stay updated here without a hard refresh.
                  </p>
                  <Link
                    href="/search"
                    onClick={closeCart}
                    className="mt-5 inline-flex rounded-full bg-[var(--market-paper-white)] px-5 py-3 text-sm font-semibold text-[var(--market-noir)]"
                  >
                    Explore products
                  </Link>
                </div>
              )}
            </div>

            <div className="border-t border-[color:rgba(255,255,255,0.12)] px-6 py-5">
              {runtime.shell.issue ? (
                <div className="mb-4 rounded-[1.3rem] border border-[rgba(255,171,151,0.26)] bg-[rgba(27,14,16,0.9)] px-4 py-3 text-sm text-[var(--market-paper-white)]">
                  {runtime.shell.issue}
                </div>
              ) : null}
              <div className="flex items-center justify-between text-sm text-[var(--market-muted)]">
                <span>Subtotal</span>
                <span className="text-base font-semibold text-[var(--market-paper-white)]">
                  {formatCurrency(cart.subtotal, cart.items[0]?.currency || "NGN")}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">
                Split-order clarity, delivery windows, and payment states stay visible again at checkout.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {cartSyncing ? (
                  <div className="sm:col-span-2 rounded-[1.35rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-4 text-center text-sm font-semibold text-[var(--market-muted)]">
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
