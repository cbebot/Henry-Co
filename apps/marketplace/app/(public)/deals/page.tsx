import { Sparkles } from "lucide-react";
import { CampaignBanner, PageIntro, ProductCard } from "@/components/marketplace/shell";
import { getMarketplaceHomeData } from "@/lib/marketplace/data";

export const dynamic = "force-dynamic";

function discountPercent(base: number, compareAt: number) {
  if (!compareAt || compareAt <= base) return 0;
  return Math.round(((compareAt - base) / compareAt) * 100);
}

export default async function DealsPage() {
  const data = await getMarketplaceHomeData();
  const allDeals = data.products
    .filter(
      (product) =>
        product.compareAtPrice &&
        product.compareAtPrice > product.basePrice &&
        // Algorithmic gate: only show stocked listings to avoid the
        // classic "click the deal, find it sold out" frustration.
        (product as { inStock?: boolean }).inStock !== false,
    )
    .map((product) => ({
      product,
      discount: discountPercent(product.basePrice, product.compareAtPrice ?? 0),
    }))
    .sort((a, b) => b.discount - a.discount);

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
      <PageIntro
        kicker="Verified Deals"
        title="Discounts filtered for trust, stock certainty, and seller accountability."
        description="Deals are only surfaced when the listing quality, seller trust passport, and stock status are clean enough to protect conversion and reduce buyer regret."
      />

      {/*
       * CHROME-01B FIX 8: deals shown as a 3-column grid, not a single
       * oversized hero card. "Refreshed daily" was renamed to "Updated
       * regularly" because the page does not yet implement a true daily
       * refresh job.
       */}
      {allDeals.length > 0 ? (
        <section aria-label="Verified deals">
          <div className="flex items-baseline justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--market-brass)]">
              <Sparkles className="h-3.5 w-3.5" />
              Verified deals
            </p>
            <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--market-muted)]">
              Updated regularly
            </span>
          </div>
          <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {allDeals.map(({ product, discount }) => (
              <div key={product.slug} className="relative">
                <span className="pointer-events-none absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[var(--market-brass)] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-black shadow">
                  −{discount}%
                </span>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="rounded-[1.4rem] border border-dashed border-[var(--market-line)] bg-[var(--market-bg-elevated)] px-6 py-12 text-center">
          <p className="text-sm font-semibold text-[var(--market-paper-white)]">
            No verified deals right now
          </p>
          <p className="mt-1 text-sm text-[var(--market-muted)]">
            Verified discounts roll in as sellers list them. Check back soon.
          </p>
        </div>
      )}

      {data.campaigns[1] ? <CampaignBanner campaign={data.campaigns[1]} /> : null}
    </div>
  );
}
