"use client";

import Image from "next/image";
import Link from "next/link";
import { useMarketplaceCart } from "@/components/marketplace/runtime-provider";
import { formatCurrency } from "@/lib/utils";

export function CartExperience() {
  const { cart, cartBusy, updateCartQuantity } = useMarketplaceCart();

  const grouped = Object.entries(
    cart.items.reduce<Record<string, typeof cart.items>>((accumulator, item) => {
      const key = item.vendorName || item.vendorSlug || "HenryCo";
      accumulator[key] = accumulator[key] ? [...accumulator[key], item] : [item];
      return accumulator;
    }, {})
  );

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr,360px]">
      <div className="space-y-5">
        {grouped.map(([groupName, items]) => (
          <article
            key={groupName}
            className="rounded-[2rem] border border-[var(--market-line-strong)] bg-[var(--market-paper-white)] p-5 shadow-[0_20px_52px_rgba(28,24,18,0.06)]"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--market-brass)]">
                  Split-order clarity
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--market-ink)]">
                  {groupName}
                </h2>
              </div>
              <p className="rounded-full bg-[var(--market-soft-olive)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-success)]">
                {items[0]?.inventoryOwnerType === "company" ? "HenryCo stocked" : "Verified vendor"}
              </p>
            </div>

            <div className="mt-5 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-4 rounded-[1.6rem] border border-[var(--market-line)] bg-[var(--market-bg-elevated)] p-4 sm:grid-cols-[140px,1fr]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[1.3rem] bg-[var(--market-soft-wash)]">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="140px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--market-muted)]">
                        {item.vendorName || "Trusted seller"}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold tracking-tight text-[var(--market-ink)]">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">{item.deliveryNote}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center rounded-full border border-[var(--market-line)] bg-[var(--market-paper-white)] p-1">
                        <button
                          type="button"
                          disabled={cartBusy}
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--market-ink)]"
                        >
                          -
                        </button>
                        <span className="min-w-10 text-center text-sm font-semibold text-[var(--market-ink)]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={cartBusy}
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--market-ink)]"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-semibold text-[var(--market-ink)]">
                          {formatCurrency(item.price * item.quantity, item.currency)}
                        </p>
                        {item.compareAtPrice ? (
                          <p className="text-sm text-[var(--market-muted)] line-through">
                            {formatCurrency(item.compareAtPrice, item.currency)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <aside className="sticky top-28 h-fit rounded-[2rem] border border-[var(--market-line-strong)] bg-[var(--market-paper-white)] p-6 shadow-[0_20px_52px_rgba(28,24,18,0.06)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--market-brass)]">
          Checkout readiness
        </p>
        <div className="mt-5 space-y-3 text-sm text-[var(--market-muted)]">
          <div className="flex items-center justify-between">
            <span>Items</span>
            <span className="font-semibold text-[var(--market-ink)]">{cart.count}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-[var(--market-ink)]">
              {formatCurrency(cart.subtotal, cart.items[0]?.currency || "NGN")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Estimated shipping</span>
            <span className="font-semibold text-[var(--market-ink)]">
              {cart.subtotal > 350000 ? "Free" : formatCurrency(18000, cart.items[0]?.currency || "NGN")}
            </span>
          </div>
        </div>
        <div className="mt-6 rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-bg-elevated)] px-4 py-4 text-sm leading-7 text-[var(--market-muted)]">
          Each vendor segment stays visible during checkout so buyers understand delivery timing, payment state, and post-order support before confirming.
        </div>
        <div className="mt-6 grid gap-3">
          <Link
            href="/checkout"
            className="market-button-primary inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
          >
            Continue to checkout
          </Link>
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
