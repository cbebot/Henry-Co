import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { MarketplaceProduct } from "@/lib/marketplace/types";
import { formatCurrency } from "@/lib/utils";

type RecommendationRailProps = {
  /** Editorial kicker above the headline (e.g. "Customers also bought"). */
  kicker: string;
  /** Headline rendered with the marketplace display face. */
  headline: string;
  /** Sub-line under the headline. Optional. */
  caption?: string;
  /** Products to render. */
  products: MarketplaceProduct[];
  /** Optional "see more" CTA at the right edge of the header. */
  cta?: { label: string; href: string };
};

/**
 * V3 PASS 21 — <RecommendationRail>
 *
 * Editorial product rail consumed by home + product-detail. Reads
 * from the `marketplace_recommendation_signals` table when wired
 * (co_purchase / co_view / similar_attributes); falls back to the
 * existing related-products list otherwise. Avoids the bulky
 * carousel pattern — horizontal scroll, 4 items visible at md+, with
 * a kicker + headline frame on the left side at xl+.
 */
export function RecommendationRail({
  kicker,
  headline,
  caption,
  products,
  cta,
}: RecommendationRailProps) {
  if (!products.length) return null;
  return (
    <section className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="market-kicker">{kicker}</p>
          <h2 className="mt-4 max-w-2xl text-balance text-[1.7rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-paper-white)] sm:text-[2.1rem]">
            {headline}
          </h2>
          {caption ? (
            <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--market-muted)]">
              {caption}
            </p>
          ) : null}
        </div>
        {cta ? (
          <Link
            href={cta.href}
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[var(--market-brass)] underline-offset-4 hover:underline"
          >
            {cta.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </header>
      <ul className="grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
        {products.map((product) => (
          <li key={product.slug}>
            <Link
              href={`/product/${product.slug}`}
              className="group flex flex-col gap-3 rounded-2xl border border-[var(--market-line)] bg-[color:rgb(255_255_255/0.02)] p-5 transition hover:border-[var(--market-brass)]"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                {product.categorySlug.replace(/-/g, " ")}
              </p>
              <p className="text-[1.05rem] font-semibold leading-snug tracking-tight text-[var(--market-paper-white)] group-hover:text-[var(--market-brass)]">
                {product.title}
              </p>
              <p className="text-sm font-semibold text-[var(--market-brass)]">
                {formatCurrency(product.basePrice, product.currency)}
              </p>
              <p className="text-xs text-[var(--market-muted)]">
                {product.stock > 0 ? `${product.stock} in stock` : "Currently unavailable"}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
