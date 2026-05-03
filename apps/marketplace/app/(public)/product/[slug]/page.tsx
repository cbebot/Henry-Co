import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { ProductDetailActions } from "@/components/marketplace/product-detail-actions";
import { ProductMediaGallery } from "@/components/marketplace/product-media-gallery";
import { ProductCard, TrustPassport } from "@/components/marketplace/shell";
import { getMarketplaceProductBySlug } from "@/lib/marketplace/data";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getMarketplaceProductBySlug(slug);
  if (!data) notFound();

  const fulfillmentRows: Array<{
    icon: typeof BadgeCheck;
    label: string;
    value: string;
  }> = [
    {
      icon: BadgeCheck,
      label: "Seller trust",
      value: data.vendor
        ? `${data.vendor.name} passport visible`
        : "Seller passport pending",
    },
    {
      icon: PackageCheck,
      label: "Availability",
      value: `${data.product.stock} unit${data.product.stock === 1 ? "" : "s"} in current stock`,
    },
    {
      icon: Truck,
      label: "Fulfillment",
      value: data.product.deliveryNote || data.product.leadTime,
    },
    {
      icon: ShieldCheck,
      label: "Payment",
      value: data.product.codEligible
        ? "COD or verified transfer"
        : "Verified transfer flow",
    },
  ];

  return (
    <div className="mx-auto max-w-[1480px] space-y-16 px-4 py-10 pb-28 sm:px-6 xl:px-8">
      {/* Editorial product hero — gallery + sticky detail aside, no panel-on-panel */}
      <section className="grid gap-12 xl:grid-cols-[1.06fr,0.94fr]">
        <ProductMediaGallery title={data.product.title} gallery={data.product.gallery} />

        <div className="space-y-10 xl:sticky xl:top-28 xl:self-start">
          <article>
            <div className="flex flex-wrap gap-1.5">
              {data.product.trustBadges.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--market-line)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]"
                >
                  {badge}
                </span>
              ))}
            </div>
            <h1 className="mt-5 max-w-2xl text-balance font-[family:var(--font-marketplace-display)] text-[2.2rem] leading-[1.04] tracking-[-0.045em] text-[var(--market-paper-white)] sm:text-[2.7rem] md:text-[3rem]">
              {data.product.title}
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-[15px] leading-[1.7] text-[var(--market-muted)] sm:text-base">
              {data.product.description}
            </p>

            {/* Price line — editorial, divided */}
            <div className="mt-7 flex flex-wrap items-end justify-between gap-5 border-y border-[var(--market-line)] py-6">
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                  Price
                </p>
                <p className="mt-2 text-[2rem] font-semibold leading-tight tracking-tight text-[var(--market-paper-white)] sm:text-[2.2rem]">
                  {formatCurrency(data.product.basePrice, data.product.currency)}
                </p>
                {data.product.compareAtPrice ? (
                  <p className="mt-1 text-sm text-[var(--market-muted)] line-through">
                    {formatCurrency(data.product.compareAtPrice, data.product.currency)}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                  Lead time
                </p>
                <p className="text-sm font-semibold text-[var(--market-paper-white)]">
                  {data.product.leadTime}
                </p>
                <p className="text-xs text-[var(--market-muted)]">
                  {data.product.deliveryNote}
                </p>
              </div>
            </div>

            {/* Fulfillment grid — divided list, not 4 tiles */}
            <ul className="mt-7 grid gap-5 sm:grid-cols-2 sm:divide-x sm:divide-[var(--market-line)]">
              {fulfillmentRows.map(({ icon: Icon, label, value }, i) => (
                <li
                  key={label}
                  className={`${i % 2 === 1 ? "sm:pl-6" : ""} ${i >= 2 ? "sm:border-t sm:border-[var(--market-line)] sm:pt-5" : ""}`}
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--market-line)] text-[var(--market-brass)]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="mt-3 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-snug text-[var(--market-paper-white)]">
                    {value}
                  </p>
                </li>
              ))}
            </ul>

            {/* Specs — divided <dl> */}
            {Object.keys(data.product.specifications).length > 0 ? (
              <dl className="mt-7 divide-y divide-[var(--market-line)] border-y border-[var(--market-line)]">
                {Object.entries(data.product.specifications).map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-baseline gap-4 py-3 sm:flex-row sm:justify-between"
                  >
                    <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                      {label}
                    </dt>
                    <dd className="text-right text-sm font-semibold tracking-tight text-[var(--market-paper-white)]">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div className="mt-8">
              <ProductDetailActions product={data.product} vendor={data.vendor} />
            </div>
          </article>

          {/* Why this feels safer — editorial border-l ribbon */}
          <article className="border-l-2 border-[var(--market-brass)]/55 pl-5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--market-brass)]">
              Why this listing feels safer
            </p>
            <ul className="mt-3 space-y-2.5">
              {[
                `${data.product.stock} units currently visible to inventory`,
                data.product.codEligible
                  ? "Cash on delivery eligible where supported"
                  : "Manual verification flow available",
                data.vendor
                  ? `${data.vendor.name} seller passport is linked directly from this page`
                  : "Vendor trust surface is still pending linkage",
                /* Suppress rating line entirely until a genuine review exists.
                 * Showing "0 reviews at 0.0 average rating" reads as broken,
                 * not new. */
                data.product.reviewCount > 0
                  ? `${data.product.reviewCount} review${data.product.reviewCount === 1 ? "" : "s"} at ${data.product.rating.toFixed(1)} average rating`
                  : null,
              ]
                .filter((item): item is string => Boolean(item))
                .map((item) => (
                <li
                  key={item}
                  className="flex gap-2.5 text-sm leading-7 text-[var(--market-muted)]"
                >
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--market-brass)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      {data.vendor ? <TrustPassport vendor={data.vendor} /> : null}

      {/* Product detail accordion + Complete the set — 2-col editorial */}
      <section className="grid gap-12 xl:grid-cols-[1.05fr,0.95fr]">
        <article>
          <p className="market-kicker">Product detail</p>
          <h2 className="mt-4 max-w-md text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-paper-white)] sm:text-[1.85rem]">
            Everything that matters before checkout.
          </h2>
          <div className="mt-7 border-t border-[var(--market-line)]">
            <details className="group border-b border-[var(--market-line)] py-5" open>
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                <h3 className="text-[1.05rem] font-semibold leading-snug tracking-tight text-[var(--market-paper-white)]">
                  Delivery, support, and post-order care
                </h3>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--market-muted)] transition group-open:rotate-90 group-open:text-[var(--market-brass)]" />
              </summary>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--market-muted)]">
                {data.product.deliveryNote ||
                  "Delivery windows will be clarified at checkout."}{" "}
                Orders stay traceable from payment to fulfillment, and disputes or support
                threads stay attached to the same order record.
              </p>
            </details>
            <details className="group border-b border-[var(--market-line)] py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                <h3 className="text-[1.05rem] font-semibold leading-snug tracking-tight text-[var(--market-paper-white)]">
                  Specifications and material clarity
                </h3>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--market-muted)] transition group-open:rotate-90 group-open:text-[var(--market-brass)]" />
              </summary>
              <dl className="mt-4 divide-y divide-[var(--market-line)]/60">
                {Object.entries(data.product.specifications).map(([label, value]) => (
                  <div key={label} className="flex items-baseline gap-4 py-2.5">
                    <dt className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                      {label}
                    </dt>
                    <dd className="ml-auto text-right text-sm font-semibold text-[var(--market-paper-white)]">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </details>
            <details className="group border-b border-[var(--market-line)] py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                <h3 className="text-[1.05rem] font-semibold leading-snug tracking-tight text-[var(--market-paper-white)]">
                  Store passport and related discovery
                </h3>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--market-muted)] transition group-open:rotate-90 group-open:text-[var(--market-brass)]" />
              </summary>
              <div className="mt-3 flex flex-wrap gap-3">
                {data.vendor ? (
                  <Link
                    href={`/store/${data.vendor.slug}`}
                    className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold"
                  >
                    Visit {data.vendor.name}
                  </Link>
                ) : null}
                {data.category ? (
                  <Link
                    href={`/category/${data.category.slug}`}
                    className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold"
                  >
                    Explore {data.category.name}
                  </Link>
                ) : null}
                {data.brand ? (
                  <Link
                    href={`/brand/${data.brand.slug}`}
                    className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold"
                  >
                    See {data.brand.name}
                  </Link>
                ) : null}
              </div>
            </details>
          </div>
        </article>

        <article>
          <p className="market-kicker">Complete the set</p>
          <h2 className="mt-4 max-w-sm text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-paper-white)] sm:text-[1.85rem]">
            More from this buying context.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-[var(--market-muted)]">
            Recommendation rails stay curated and clean instead of becoming noisy upsell clutter.
          </p>
          <ul className="mt-7 divide-y divide-[var(--market-line)] border-y border-[var(--market-line)]">
            {data.related.slice(0, 4).map((product) => (
              <li key={product.slug}>
                <Link
                  href={`/product/${product.slug}`}
                  className="group flex items-baseline justify-between gap-4 py-4 transition hover:bg-white/[0.02]"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                      {product.categorySlug.replace(/-/g, " ")}
                    </p>
                    <p className="mt-1.5 text-[1rem] font-semibold leading-snug tracking-tight text-[var(--market-paper-white)] group-hover:text-[var(--market-brass)]">
                      {product.title}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-[var(--market-brass)]">
                    {formatCurrency(product.basePrice, product.currency)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </article>
      </section>

      {data.reviews.length ? (
        <section>
          <div className="grid gap-12 lg:grid-cols-[0.85fr,1.15fr]">
            <div>
              <p className="market-kicker">Review highlights</p>
              <h2 className="mt-4 max-w-sm text-balance text-[1.7rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-paper-white)] sm:text-[2rem]">
                Verified buying signals, not noisy filler.
              </h2>
            </div>
            <ul className="divide-y divide-[var(--market-line)] border-y border-[var(--market-line)]">
              {data.reviews.slice(0, 4).map((review) => (
                <li key={review.id} className="grid gap-4 py-6 md:grid-cols-[0.32fr,0.68fr]">
                  <div>
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-brass)]">
                      {review.verifiedPurchase ? "Verified purchase" : "Review"}
                    </p>
                    <p className="mt-2 text-sm font-semibold tracking-tight text-[var(--market-paper-white)]">
                      {review.buyerName}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-[1.05rem] font-semibold leading-snug tracking-tight text-[var(--market-paper-white)]">
                      {review.title}
                    </h3>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--market-muted)]">
                      {review.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="market-kicker">More to discover</p>
            <h2 className="mt-4 max-w-2xl text-balance text-[1.7rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-paper-white)] sm:text-[2.1rem]">
              Continue browsing without losing your place.
            </h2>
          </div>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--market-brass)] underline-offset-4 hover:underline"
          >
            Open search
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
          {data.related.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
