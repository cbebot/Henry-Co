"use client";

import Link from "next/link";
import { useMarketplaceOrderFeed } from "@/components/marketplace/runtime-provider";
import type { MarketplaceOrderFeedItem } from "@/lib/marketplace/types";

export function AccountOrderFeedClient({
  initialItems,
}: {
  initialItems: MarketplaceOrderFeedItem[];
}) {
  const { items } = useMarketplaceOrderFeed(initialItems);

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <article key={item.id} className="market-paper rounded-[1.75rem] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="market-kicker">{item.orderNo}</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--market-ink)]">
                {item.headline}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{item.detail}</p>
            </div>
            <Link
              href={`/account/orders/${item.orderNo}`}
              className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold"
            >
              View details
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
