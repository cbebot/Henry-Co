import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { JsonLd, buildProductLd } from "@henryco/seo";
import { resolveLocalizedDynamicField } from "@henryco/i18n/server";
import { ProductDetailActions } from "@/components/marketplace/product-detail-actions";
import { ProductMediaGallery } from "@/components/marketplace/product-media-gallery";
import { TrustPassport } from "@/components/marketplace/shell";
import { RecommendationRail } from "@/components/marketplace/recommendation-rail";
import { VariantMatrix } from "@/components/marketplace/variant-matrix";
import { getMarketplaceProductBySlug } from "@/lib/marketplace/data";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { getMarketplacePublicCopy } from "@/lib/public-copy";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, getMarketplacePublicLocale()]);
  const copy = getMarketplacePublicCopy(locale);
  const data = await getMarketplaceProductBySlug(slug);
  if (!data) {
    return {
      title: copy.product.metadata.titleTemplate.replace("{title}", slug),
      description: copy.product.metadata.fallbackDescription,
    };
  }
  const [productTitle, productSummary, productDescription] = await Promise.all([
    resolveLocalizedDynamicField({
      record: data.product as unknown as Record<string, unknown>,
      field: "title",
      locale,
      fallback: data.product.title,
      machineTranslate: locale !== "en",
    }),
    resolveLocalizedDynamicField({
      record: data.product as unknown as Record<string, unknown>,
      field: "summary",
      locale,
      fallback: data.product.summary ?? "",
      machineTranslate: locale !== "en",
    }),
    resolveLocalizedDynamicField({
      record: data.product as unknown as Record<string, unknown>,
      field: "description",
      locale,
      fallback: data.product.description ?? "",
      machineTranslate: locale !== "en",
    }),
  ]);
  return {
    title: copy.product.metadata.titleTemplate.replace("{title}", productTitle),
    description:
      productSummary ||
      productDescription ||
      copy.product.metadata.descriptionTemplate.replace("{title}", productTitle),
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, locale] = await Promise.all([params, getMarketplacePublicLocale()]);
  const data = await getMarketplaceProductBySlug(slug);
  if (!data) notFound();
  const copy = getMarketplacePublicCopy(locale);
  const productCopy = copy.product;

  // Single-row detail page: wrap all visible DB-driven text fields so non-EN
  // locales render translated copy on demand.
  const [
    localizedTitle,
    localizedSummary,
    localizedDescription,
    localizedDeliveryNote,
    localizedLeadTime,
    localizedCategoryName,
  ] = await Promise.all([
    resolveLocalizedDynamicField({
      record: data.product as unknown as Record<string, unknown>,
      field: "title",
      locale,
      fallback: data.product.title,
      machineTranslate: locale !== "en",
    }),
    resolveLocalizedDynamicField({
      record: data.product as unknown as Record<string, unknown>,
      field: "summary",
      locale,
      fallback: data.product.summary ?? "",
      machineTranslate: locale !== "en",
    }),
    resolveLocalizedDynamicField({
      record: data.product as unknown as Record<string, unknown>,
      field: "description",
      locale,
      fallback: data.product.description ?? "",
      machineTranslate: locale !== "en",
    }),
    resolveLocalizedDynamicField({
      record: data.product as unknown as Record<string, unknown>,
      field: "deliveryNote",
      locale,
      fallback: data.product.deliveryNote ?? "",
      machineTranslate: locale !== "en",
    }),
    resolveLocalizedDynamicField({
      record: data.product as unknown as Record<string, unknown>,
      field: "leadTime",
      locale,
      fallback: data.product.leadTime ?? "",
      machineTranslate: locale !== "en",
    }),
    data.category
      ? resolveLocalizedDynamicField({
          record: data.category as unknown as Record<string, unknown>,
          field: "name",
          locale,
          fallback: data.category.name,
          machineTranslate: locale !== "en",
        })
      : Promise.resolve(""),
  ]);

  // V3 PASS 21 — Product + Offer + AggregateRating JSON-LD (M9)
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com";
  const productUrl = `https://marketplace.${baseDomain}/product/${data.product.slug}`;
  const productLd = buildProductLd({
    name: localizedTitle,
    description: localizedSummary || localizedDescription,
    sku: data.product.sku,
    brand: data.brand?.name,
    imageUrls: data.product.gallery,
    url: productUrl,
    offers: {
      priceCurrency: data.product.currency,
      price: (data.product.basePrice / 100).toFixed(2),
      availability: data.product.stock > 0 ? "InStock" : "OutOfStock",
      url: productUrl,
    },
    aggregateRating:
      data.product.reviewCount > 0
        ? {
            ratingValue: Number(data.product.rating.toFixed(1)),
            reviewCount: data.product.reviewCount,
          }
        : undefined,
  });

  const stockCount = data.product.stock;
  const stockLabel = (stockCount === 1
    ? productCopy.fulfillment.availabilityValueSingular
    : productCopy.fulfillment.availabilityValuePlural
  ).replace("{count}", String(stockCount));

  const sellerTrustValue = data.vendor
    ? productCopy.fulfillment.sellerTrustValueTemplate.replace("{vendor}", data.vendor.name)
    : productCopy.fulfillment.sellerTrustValueFallback;

  const fulfillmentRows: Array<{
    icon: typeof BadgeCheck;
    label: string;
    value: string;
  }> = [
    {
      icon: BadgeCheck,
      label: productCopy.fulfillment.sellerTrustLabel,
      value: sellerTrustValue,
    },
    {
      icon: PackageCheck,
      label: productCopy.fulfillment.availabilityLabel,
      value: stockLabel,
    },
    {
      icon: Truck,
      label: productCopy.fulfillment.fulfillmentLabel,
      value: localizedDeliveryNote || localizedLeadTime,
    },
    {
      icon: ShieldCheck,
      label: productCopy.fulfillment.paymentLabel,
      value: data.product.codEligible
        ? productCopy.fulfillment.paymentValueCod
        : productCopy.fulfillment.paymentValueVerified,
    },
  ];

  const safetyItems: Array<string | null> = [
    productCopy.safety.stockTemplate.replace("{count}", String(stockCount)),
    data.product.codEligible
      ? productCopy.safety.codEligible
      : productCopy.safety.codFallback,
    data.vendor
      ? productCopy.safety.vendorLinkedTemplate.replace("{vendor}", data.vendor.name)
      : productCopy.safety.vendorPending,
    /* Suppress rating line entirely until a genuine review exists.
     * Showing "0 reviews at 0.0 average rating" reads as broken,
     * not new. */
    data.product.reviewCount > 0
      ? (data.product.reviewCount === 1
          ? productCopy.safety.reviewsTemplateSingular
          : productCopy.safety.reviewsTemplatePlural
        )
          .replace("{count}", String(data.product.reviewCount))
          .replace("{rating}", data.product.rating.toFixed(1))
      : null,
  ];

  return (
    <div className="mx-auto max-w-[1480px] space-y-16 px-4 py-10 pb-28 sm:px-6 xl:px-8">
      <JsonLd id={`marketplace-product-${data.product.slug}-jsonld`} data={productLd} />
      {/* Editorial product hero — gallery + sticky detail aside, no panel-on-panel */}
      <section className="grid gap-12 xl:grid-cols-[1.06fr,0.94fr]">
        <ProductMediaGallery title={localizedTitle} gallery={data.product.gallery} />

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
              {localizedTitle}
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-[15px] leading-[1.7] text-[var(--market-muted)] sm:text-base">
              {localizedDescription}
            </p>

            {/* Price line — editorial, divided */}
            <div className="mt-7 flex flex-wrap items-end justify-between gap-5 border-y border-[var(--market-line)] py-6">
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                  {productCopy.price.label}
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
                  {productCopy.price.leadTimeLabel}
                </p>
                <p className="text-sm font-semibold text-[var(--market-paper-white)]">
                  {localizedLeadTime}
                </p>
                <p className="text-xs text-[var(--market-muted)]">
                  {localizedDeliveryNote}
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

            {data.product.variants && data.product.variants.length > 0 ? (
              <div className="mt-7">
                <VariantMatrix
                  product={data.product}
                  variants={data.product.variants}
                />
              </div>
            ) : null}

            <div className="mt-8">
              <ProductDetailActions product={data.product} vendor={data.vendor} />
            </div>
          </article>

          {/* Why this feels safer — editorial border-l ribbon */}
          <article className="border-l-2 border-[var(--market-brass)]/55 pl-5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[var(--market-brass)]">
              {productCopy.safety.kicker}
            </p>
            <ul className="mt-3 space-y-2.5">
              {safetyItems
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
          <p className="market-kicker">{productCopy.detail.kicker}</p>
          <h2 className="mt-4 max-w-md text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-paper-white)] sm:text-[1.85rem]">
            {productCopy.detail.title}
          </h2>
          <div className="mt-7 border-t border-[var(--market-line)]">
            <details className="group border-b border-[var(--market-line)] py-5" open>
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                <h3 className="text-[1.05rem] font-semibold leading-snug tracking-tight text-[var(--market-paper-white)]">
                  {productCopy.detail.deliverySummaryTitle}
                </h3>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--market-muted)] transition group-open:rotate-90 group-open:text-[var(--market-brass)]" />
              </summary>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--market-muted)]">
                {localizedDeliveryNote || productCopy.detail.deliveryFallback}{" "}
                {productCopy.detail.deliveryTail}
              </p>
            </details>
            <details className="group border-b border-[var(--market-line)] py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                <h3 className="text-[1.05rem] font-semibold leading-snug tracking-tight text-[var(--market-paper-white)]">
                  {productCopy.detail.specsTitle}
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
                  {productCopy.detail.passportTitle}
                </h3>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--market-muted)] transition group-open:rotate-90 group-open:text-[var(--market-brass)]" />
              </summary>
              <div className="mt-3 flex flex-wrap gap-3">
                {data.vendor ? (
                  <Link
                    href={`/store/${data.vendor.slug}`}
                    className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold"
                  >
                    {productCopy.detail.visitVendorTemplate.replace("{vendor}", data.vendor.name)}
                  </Link>
                ) : null}
                {data.category ? (
                  <Link
                    href={`/category/${data.category.slug}`}
                    className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold"
                  >
                    {productCopy.detail.exploreCategoryTemplate.replace("{category}", localizedCategoryName)}
                  </Link>
                ) : null}
                {data.brand ? (
                  <Link
                    href={`/brand/${data.brand.slug}`}
                    className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold"
                  >
                    {productCopy.detail.seeBrandTemplate.replace("{brand}", data.brand.name)}
                  </Link>
                ) : null}
              </div>
            </details>
          </div>
        </article>

        <article>
          <p className="market-kicker">{productCopy.related.kicker}</p>
          <h2 className="mt-4 max-w-sm text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-paper-white)] sm:text-[1.85rem]">
            {productCopy.related.title}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-[var(--market-muted)]">
            {productCopy.related.body}
          </p>
          {/* TODO(wave3-catalogue): paginate translation — related products list
              is a catalogue surface that can render many rows on hot routes. */}
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
              <p className="market-kicker">{productCopy.reviews.kicker}</p>
              <h2 className="mt-4 max-w-sm text-balance text-[1.7rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-paper-white)] sm:text-[2rem]">
                {productCopy.reviews.title}
              </h2>
            </div>
            {/* TODO(wave3-catalogue): paginate translation — buyer review list
                is a list surface and reviews carry buyer voice; translate via
                client-side fetch on demand instead of bulk server-side. */}
            <ul className="divide-y divide-[var(--market-line)] border-y border-[var(--market-line)]">
              {data.reviews.slice(0, 4).map((review) => (
                <li key={review.id} className="grid gap-4 py-6 md:grid-cols-[0.32fr,0.68fr]">
                  <div>
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-brass)]">
                      {review.verifiedPurchase ? productCopy.reviews.verifiedPurchase : productCopy.reviews.reviewLabel}
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

      <RecommendationRail
        kicker={productCopy.rail.kicker}
        headline={productCopy.rail.headline}
        caption={productCopy.rail.caption}
        products={data.related}
        cta={{ label: productCopy.rail.ctaLabel, href: "/search" }}
      />
    </div>
  );
}
