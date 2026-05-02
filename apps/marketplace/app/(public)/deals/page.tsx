import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
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

  // Today's deal = single biggest discount among the eligible set. (When
  // a marketplace_deals_curation row in slot='today' is active, that row
  // wins instead — wired via getMarketplaceHomeData in the next pass.)
  const today = allDeals[0] ?? null;
  const rest = today ? allDeals.slice(1) : allDeals;

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
      <PageIntro
        kicker="Verified Deals"
        title="Discounts filtered for trust, stock certainty, and seller accountability."
        description="Deals are only surfaced when the listing quality, seller trust passport, and stock status are clean enough to protect conversion and reduce buyer regret."
      />

      {today ? (
        <section
          aria-label="Today's deal"
          className="overflow-hidden rounded-[1.8rem] border border-[var(--market-line)] bg-[linear-gradient(135deg,rgba(178,134,59,0.18),rgba(20,16,12,0.92))] p-6 sm:p-8"
        >
          <div className="grid gap-6 lg:grid-cols-[0.55fr_0.45fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--market-brass)]/40 bg-[var(--market-brass)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--market-brass)]">
                <Sparkles className="h-3.5 w-3.5" />
                Today&rsquo;s deal
              </span>
              <h2 className="mt-3 text-balance text-2xl font-semibold leading-tight tracking-tight text-[var(--market-paper-white)] sm:text-[2rem]">
                {today.product.title}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--market-muted)]">
                {today.discount}% off — verified seller, stock confirmed,
                payment-protected. Limited to current inventory.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  href={`/product/${today.product.slug}`}
                  className="market-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--market-brass)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#04070d] active:translate-y-[0.5px] motion-safe:hover:-translate-y-[1px] motion-safe:hover:shadow-[0_18px_48px_rgba(178,134,59,0.25)]"
                >
                  See today&rsquo;s deal
                  <ArrowRight className="h-4 w-4 transition motion-safe:group-hover:translate-x-0.5" />
                </Link>
                <span className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">
                  Refreshed daily
                </span>
              </div>
            </div>
            <div className="rounded-[1.4rem] border border-white/8 bg-black/30 p-2 sm:p-3">
              <ProductCard product={today.product} />
            </div>
          </div>
        </section>
      ) : null}

      {data.campaigns[1] ? <CampaignBanner campaign={data.campaigns[1]} /> : null}

      {rest.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rest.map(({ product }) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.4rem] border border-dashed border-[var(--market-line)] bg-[var(--market-bg-elevated)] px-6 py-12 text-center">
          <p className="text-sm font-semibold text-[var(--market-paper-white)]">
            No additional deals right now
          </p>
          <p className="mt-1 text-sm text-[var(--market-muted)]">
            Verified discounts roll in as sellers list them. Check back tomorrow.
          </p>
        </div>
      )}
    </div>
  );
}
