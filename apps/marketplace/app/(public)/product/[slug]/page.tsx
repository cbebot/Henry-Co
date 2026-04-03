import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetailActions } from "@/components/marketplace/product-detail-actions";
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

  return (
    <div className="mx-auto max-w-[1480px] space-y-10 px-4 py-8 pb-28 sm:px-6 xl:px-8">
      <section className="grid gap-6 xl:grid-cols-[1.08fr,0.92fr]">
        <div className="space-y-4">
          <article className="overflow-hidden rounded-[2.2rem] border border-[var(--market-line-strong)] bg-[var(--market-paper-white)] shadow-[0_26px_72px_rgba(28,24,18,0.07)]">
            <div className="relative aspect-[4/4.5]">
              <Image
                src={
                  data.product.gallery[0] ||
                  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1600&q=80"
                }
                alt={data.product.title}
                fill
                sizes="(max-width: 1280px) 100vw, 54vw"
                className="object-cover"
              />
            </div>
          </article>

          {data.product.gallery.length > 1 ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {data.product.gallery.slice(1, 4).map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  className="relative aspect-[4/3] overflow-hidden rounded-[1.4rem] border border-[var(--market-line)] bg-[var(--market-paper-white)]"
                >
                  <Image src={image} alt={`${data.product.title} ${index + 2}`} fill sizes="33vw" className="object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
          <article className="rounded-[2.2rem] border border-[var(--market-line-strong)] bg-[var(--market-paper-white)] p-6 shadow-[0_26px_72px_rgba(28,24,18,0.07)] sm:p-8">
            <p className="market-kicker">Product detail</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.product.trustBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full bg-[var(--market-bg-elevated)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]"
                >
                  {badge}
                </span>
              ))}
            </div>
            <h1 className="mt-4 font-[family:var(--font-marketplace-display)] text-[3rem] leading-[0.98] tracking-[-0.04em] text-[var(--market-ink)]">
              {data.product.title}
            </h1>
            <p className="mt-4 text-base leading-8 text-[var(--market-muted)]">{data.product.description}</p>

            <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-y border-[var(--market-line)] py-5">
              <div>
                <p className="text-3xl font-semibold text-[var(--market-ink)]">
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

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {Object.entries(data.product.specifications).map(([label, value]) => (
                <div key={label} className="rounded-[1.4rem] border border-[var(--market-line)] bg-[var(--market-bg-elevated)] px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--market-ink)]">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <ProductDetailActions product={data.product} vendor={data.vendor} />
            </div>
          </article>

          <article className="rounded-[2rem] border border-[var(--market-line-strong)] bg-[var(--market-paper-white)] p-6 shadow-[0_20px_52px_rgba(28,24,18,0.06)]">
            <p className="market-kicker">Why buyers trust this listing</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                `${data.product.stock} units currently available`,
                data.product.codEligible ? "COD-eligible with trust policy support" : "Manual verification flow available",
                data.vendor ? `${data.vendor.name} seller passport visible` : "Seller passport pending",
                `${data.product.reviewCount} review${data.product.reviewCount === 1 ? "" : "s"} with ${data.product.rating.toFixed(1)} rating`,
              ].map((item) => (
                <div key={item} className="rounded-[1.4rem] border border-[var(--market-line)] bg-[var(--market-bg-elevated)] px-4 py-4 text-sm leading-7 text-[var(--market-ink)]">
                  {item}
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      {data.vendor ? <TrustPassport vendor={data.vendor} /> : null}

      <section className="grid gap-6 xl:grid-cols-[1.08fr,0.92fr]">
        <article className="market-paper rounded-[2rem] p-6 sm:p-8">
          <p className="market-kicker">Product story</p>
          <div className="mt-5 space-y-4">
            <details className="group rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-bg-elevated)] px-5 py-4" open>
              <summary className="cursor-pointer list-none text-lg font-semibold tracking-tight text-[var(--market-ink)]">
                Delivery, support, and post-order care
              </summary>
              <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">
                {data.product.deliveryNote || "Delivery windows will be clarified at checkout."} Orders stay traceable from payment to fulfillment, and disputes or support threads stay attached to the same order record.
              </p>
            </details>
            <details className="group rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-bg-elevated)] px-5 py-4">
              <summary className="cursor-pointer list-none text-lg font-semibold tracking-tight text-[var(--market-ink)]">
                Specifications and material clarity
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {Object.entries(data.product.specifications).map(([label, value]) => (
                  <div key={label} className="rounded-[1.2rem] border border-[var(--market-line)] bg-[var(--market-paper-white)] px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">{label}</p>
                    <p className="mt-2 text-sm font-semibold text-[var(--market-ink)]">{value}</p>
                  </div>
                ))}
              </div>
            </details>
            <details className="group rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-bg-elevated)] px-5 py-4">
              <summary className="cursor-pointer list-none text-lg font-semibold tracking-tight text-[var(--market-ink)]">
                Store passport and trust context
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

        <article className="rounded-[2rem] border border-[var(--market-line-strong)] bg-[var(--market-noir)] p-6 text-[var(--market-paper-white)] shadow-[0_30px_80px_rgba(17,13,9,0.28)] sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--market-brass)]">
            Buyer confidence
          </p>
          <div className="mt-6 space-y-4">
            {[
              `${data.product.stock} units currently visible to inventory`,
              data.product.codEligible ? "Cash on delivery eligible in supported zones" : "Manual verification and cleaner payment traceability enabled",
              data.vendor ? `${data.vendor.name} storefront and trust passport are linked directly from this page` : "Vendor trust passport will appear once the store is linked",
              `${data.product.reviewCount} published review${data.product.reviewCount === 1 ? "" : "s"} at ${data.product.rating.toFixed(1)} average rating`,
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.35rem] border border-[color:rgba(255,255,255,0.12)] bg-[color:rgba(255,255,255,0.04)] px-4 py-4 text-sm leading-7 text-[color:rgba(255,255,255,0.72)]"
              >
                {item}
              </div>
            ))}
          </div>
        </article>
      </section>

      {data.reviews.length ? (
        <section className="space-y-5">
          <div>
            <p className="market-kicker">Review highlights</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--market-ink)]">
              Verified buying signals, not noisy filler.
            </h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {data.reviews.slice(0, 2).map((review) => (
              <article key={review.id} className="market-paper rounded-[1.85rem] p-6">
                <p className="market-kicker">{review.verifiedPurchase ? "verified purchase" : "review"}</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--market-ink)]">{review.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{review.body}</p>
                <p className="mt-4 text-sm font-semibold text-[var(--market-ink)]">{review.buyerName}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-5">
        <div>
          <p className="market-kicker">Complete the set</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">More from this shopping context.</h2>
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
