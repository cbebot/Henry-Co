import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import {
  createDivisionMetadata,
  getAbsoluteDivisionUrl,
  toSeoDescription,
  toSeoPlainText,
} from "@henryco/config";
import { ProductDetailActions } from "@/components/marketplace/product-detail-actions";
import { ProductMediaGallery } from "@/components/marketplace/product-media-gallery";
import { ProductCard, TrustPassport } from "@/components/marketplace/shell";
import { getMarketplaceProductBySlug } from "@/lib/marketplace/data";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getMarketplaceProductBySlug(slug);

  if (!data) {
    return createDivisionMetadata("marketplace", {
      title: "Product not found | Henry & Co. Marketplace",
      description: "The requested marketplace product could not be found.",
      path: `/product/${slug}`,
      noIndex: true,
    });
  }

  const description = toSeoDescription(data.product.summary, data.product.description, 158);
  const image = data.product.gallery[0];

  return createDivisionMetadata("marketplace", {
    title: `${data.product.title} | Henry & Co. Marketplace`,
    description,
    openGraphTitle: data.product.title,
    openGraphDescription: description,
    path: `/product/${data.product.slug}`,
    images: image ? [{ url: image, alt: data.product.title }] : undefined,
  });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getMarketplaceProductBySlug(slug);
  if (!data) notFound();
  const productUrl = getAbsoluteDivisionUrl("marketplace", `/product/${data.product.slug}`);
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: data.product.title,
    description: toSeoPlainText(data.product.summary || data.product.description),
    sku: data.product.sku,
    image: data.product.gallery,
    category: data.category?.name,
    brand: data.brand
      ? {
          "@type": "Brand",
          name: data.brand.name,
        }
      : undefined,
    aggregateRating:
      data.product.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: data.product.rating,
            reviewCount: data.product.reviewCount,
          }
        : undefined,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: data.product.currency,
      price: data.product.basePrice,
      availability:
        data.product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: data.vendor
        ? {
            "@type": "Organization",
            name: data.vendor.name,
          }
        : undefined,
    },
  };

  return (
    <div className="mx-auto max-w-[1480px] space-y-10 px-4 py-8 pb-28 sm:px-6 xl:px-8">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <section className="grid gap-6 xl:grid-cols-[1.06fr,0.94fr]">
        <ProductMediaGallery title={data.product.title} gallery={data.product.gallery} />

        <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <article className="market-paper rounded-[2.3rem] p-6 sm:p-8">
            <div className="flex flex-wrap gap-2">
              {data.product.trustBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]"
                >
                  {badge}
                </span>
              ))}
            </div>
            <h1 className="mt-4 font-[family:var(--font-marketplace-display)] text-[3rem] leading-[0.96] tracking-[-0.05em] text-[var(--market-paper-white)]">
              {data.product.title}
            </h1>
            <p className="mt-4 text-base leading-8 text-[var(--market-muted)]">{data.product.description}</p>

            <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-y border-[var(--market-line)] py-5">
              <div>
                <p className="text-3xl font-semibold text-[var(--market-paper-white)]">
                  {formatCurrency(data.product.basePrice, data.product.currency)}
                </p>
                {data.product.compareAtPrice ? (
                  <p className="text-sm text-[var(--market-muted)] line-through">
                    {formatCurrency(data.product.compareAtPrice, data.product.currency)}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1 text-right text-sm text-[var(--market-muted)]">
                <p>{data.product.leadTime}</p>
                <p>{data.product.deliveryNote}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                {
                  icon: BadgeCheck,
                  label: "Seller trust",
                  value: data.vendor ? `${data.vendor.name} passport visible` : "Seller passport pending",
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
                  value: data.product.codEligible ? "COD or verified transfer" : "Verified transfer flow",
                },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="rounded-[1.4rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-4"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.05)] text-[var(--market-brass)]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--market-paper-white)]">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {Object.entries(data.product.specifications).map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[1.4rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                    {label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--market-paper-white)]">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <ProductDetailActions product={data.product} vendor={data.vendor} />
            </div>
          </article>

          <article className="market-panel rounded-[2rem] p-6">
            <p className="market-kicker">Why this listing feels safer</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                `${data.product.stock} units currently visible to inventory`,
                data.product.codEligible ? "Cash on delivery eligible where supported" : "Manual verification flow available",
                data.vendor ? `${data.vendor.name} seller passport is linked directly from this page` : "Vendor trust surface is still pending linkage",
                `${data.product.reviewCount} review${data.product.reviewCount === 1 ? "" : "s"} at ${data.product.rating.toFixed(1)} average rating`,
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.35rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-4 text-sm leading-7 text-[var(--market-muted)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      {data.vendor ? <TrustPassport vendor={data.vendor} /> : null}

      <section className="grid gap-6 xl:grid-cols-[1.06fr,0.94fr]">
        <article className="market-paper rounded-[2rem] p-6 sm:p-8">
          <p className="market-kicker">Product detail</p>
          <div className="mt-5 space-y-4">
            <details className="group rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-5 py-4" open>
              <summary className="cursor-pointer list-none text-lg font-semibold tracking-tight text-[var(--market-paper-white)]">
                Delivery, support, and post-order care
              </summary>
              <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">
                {data.product.deliveryNote || "Delivery windows will be clarified at checkout."} Orders stay traceable from payment to fulfillment, and disputes or support threads stay attached to the same order record.
              </p>
            </details>
            <details className="group rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-5 py-4">
              <summary className="cursor-pointer list-none text-lg font-semibold tracking-tight text-[var(--market-paper-white)]">
                Specifications and material clarity
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {Object.entries(data.product.specifications).map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-[1.2rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-4"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                      {label}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--market-paper-white)]">{value}</p>
                  </div>
                ))}
              </div>
            </details>
            <details className="group rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-5 py-4">
              <summary className="cursor-pointer list-none text-lg font-semibold tracking-tight text-[var(--market-paper-white)]">
                Store passport and related discovery
              </summary>
              <div className="mt-3 flex flex-wrap gap-3">
                {data.vendor ? (
                  <Link href={`/store/${data.vendor.slug}`} className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold">
                    Visit {data.vendor.name}
                  </Link>
                ) : null}
                {data.category ? (
                  <Link href={`/category/${data.category.slug}`} className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold">
                    Explore {data.category.name}
                  </Link>
                ) : null}
                {data.brand ? (
                  <Link href={`/brand/${data.brand.slug}`} className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold">
                    See {data.brand.name}
                  </Link>
                ) : null}
              </div>
            </details>
          </div>
        </article>

        <article className="market-panel rounded-[2rem] p-6 sm:p-8">
          <p className="market-kicker">Complete the set</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--market-paper-white)]">
            More from this buying context.
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">
            Recommendation rails stay curated and clean instead of becoming noisy upsell clutter.
          </p>
          <div className="mt-6 grid gap-4">
            {data.related.slice(0, 3).map((product) => (
              <Link
                key={product.slug}
                href={`/product/${product.slug}`}
                className="rounded-[1.5rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">
                      {product.categorySlug.replace(/-/g, " ")}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--market-paper-white)]">{product.title}</p>
                  </div>
                  <p className="text-sm font-semibold text-[var(--market-brass)]">
                    {formatCurrency(product.basePrice, product.currency)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </article>
      </section>

      {data.reviews.length ? (
        <section className="space-y-5">
          <div>
            <p className="market-kicker">Review highlights</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--market-paper-white)]">
              Verified buying signals, not noisy filler.
            </h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {data.reviews.slice(0, 2).map((review) => (
              <article key={review.id} className="market-paper rounded-[1.85rem] p-6">
                <p className="market-kicker">{review.verifiedPurchase ? "verified purchase" : "review"}</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--market-paper-white)]">
                  {review.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{review.body}</p>
                <p className="mt-4 text-sm font-semibold text-[var(--market-paper-white)]">{review.buyerName}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-5">
        <div>
          <p className="market-kicker">More to discover</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--market-paper-white)]">
            Continue browsing without losing your place.
          </h2>
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
