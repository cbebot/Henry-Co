import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import {
  Body,
  DisplayHeading,
  EditorialList,
  EditorialRow,
  Eyebrow,
  Lede,
  PublicCTA,
  PublicProofRail,
  Section,
} from "@henryco/ui/public-design";
import { JsonLd, buildProductLd } from "@henryco/seo";
import { resolveLocalizedDynamicField } from "@henryco/i18n/server";
import { henryDomain } from "@henryco/config";
import { ProductDetailActions } from "@/components/marketplace/product-detail-actions";
import { ProductMediaGallery } from "@/components/marketplace/product-media-gallery";
import { TrustPassport } from "@/components/marketplace/shell";
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

  // V3 PASS 21 — Product + Offer + AggregateRating JSON-LD (M9).
  // V3-07(S2): henryDomain() routes preview/staging at their matching domain.
  const productUrl = henryDomain("marketplace", `/product/${data.product.slug}`);
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

  // Honest hero proof — real figures only; null self-suppresses (no "0 reviews").
  const heroProof = [
    { value: stockCount > 0 ? String(stockCount) : null, label: productCopy.fulfillment.availabilityLabel },
    { value: localizedLeadTime || null, label: productCopy.price.leadTimeLabel },
    {
      value: data.product.reviewCount > 0 ? data.product.rating.toFixed(1) : null,
      label: productCopy.reviews.kicker,
    },
  ];

  // Fulfillment promises as a hairline list (not a 4-tile wall).
  const fulfillmentRows = [
    { label: productCopy.fulfillment.sellerTrustLabel, value: sellerTrustValue },
    { label: productCopy.fulfillment.availabilityLabel, value: stockLabel },
    {
      label: productCopy.fulfillment.fulfillmentLabel,
      value: localizedDeliveryNote || localizedLeadTime,
    },
    {
      label: productCopy.fulfillment.paymentLabel,
      value: data.product.codEligible
        ? productCopy.fulfillment.paymentValueCod
        : productCopy.fulfillment.paymentValueVerified,
    },
  ].filter((row) => Boolean(row.value));

  // The trust beat — only genuinely-true lines (rating suppressed until real).
  const safetyItems = [
    productCopy.safety.stockTemplate.replace("{count}", String(stockCount)),
    data.product.codEligible ? productCopy.safety.codEligible : productCopy.safety.codFallback,
    data.vendor
      ? productCopy.safety.vendorLinkedTemplate.replace("{vendor}", data.vendor.name)
      : productCopy.safety.vendorPending,
    data.product.reviewCount > 0
      ? (data.product.reviewCount === 1
          ? productCopy.safety.reviewsTemplateSingular
          : productCopy.safety.reviewsTemplatePlural
        )
          .replace("{count}", String(data.product.reviewCount))
          .replace("{rating}", data.product.rating.toFixed(1))
      : null,
  ].filter((item): item is string => Boolean(item));

  // One quiet, real buyer voice as proof (prefer a verified purchase). No reviews → null.
  const featuredReview =
    data.reviews.find((review) => review.verifiedPurchase) ?? data.reviews[0] ?? null;

  const specEntries = Object.entries(data.product.specifications);
  const passportLinks = [
    data.vendor
      ? {
          href: `/store/${data.vendor.slug}`,
          label: productCopy.detail.visitVendorTemplate.replace("{vendor}", data.vendor.name),
        }
      : null,
    data.category
      ? {
          href: `/category/${data.category.slug}`,
          label: productCopy.detail.exploreCategoryTemplate.replace("{category}", localizedCategoryName),
        }
      : null,
    data.brand
      ? {
          href: `/brand/${data.brand.slug}`,
          label: productCopy.detail.seeBrandTemplate.replace("{brand}", data.brand.name),
        }
      : null,
  ].filter((link): link is { href: string; label: string } => Boolean(link));

  return (
    <main id="henryco-main" tabIndex={-1}>
      <JsonLd id={`marketplace-product-${data.product.slug}-jsonld`} data={productLd} />

      {/* ── HERO — the image leads; one display title, one price focal, locked buy box ── */}
      <Section rhythm="hero">
        <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          {/* The image is the heart of listing presentation — tasteful, on the light system. */}
          <ProductMediaGallery title={localizedTitle} gallery={data.product.gallery} />

          <div className="lg:sticky lg:top-28 lg:self-start">
            {localizedCategoryName ? <Eyebrow>{localizedCategoryName}</Eyebrow> : null}
            <DisplayHeading level={1} size="display" className="mt-4 max-w-xl">
              {localizedTitle}
            </DisplayHeading>
            {localizedDescription ? (
              <Lede className="mt-5 max-w-xl">{localizedDescription}</Lede>
            ) : null}

            {/* The one focal line — price as the climax of the hero. */}
            <div className="mt-8 flex flex-wrap items-end gap-x-5 gap-y-2 border-t border-[color:var(--home-line)] pt-7">
              <span className="home-num text-[2.1rem] font-semibold leading-none text-[color:var(--home-accent-text)] sm:text-[2.4rem]">
                {formatCurrency(data.product.basePrice, data.product.currency)}
              </span>
              {data.product.compareAtPrice ? (
                <span className="home-num text-base text-[color:var(--home-ink-50)] line-through">
                  {formatCurrency(data.product.compareAtPrice, data.product.currency)}
                </span>
              ) : null}
            </div>

            {/* LOCKED — variant select + buy/cart controls. Style tokens flow via aliases;
                logic, props, and handlers are untouched. */}
            {data.product.variants && data.product.variants.length > 0 ? (
              <div className="mt-7">
                <VariantMatrix product={data.product} variants={data.product.variants} />
              </div>
            ) : null}

            <div className="mt-8">
              <ProductDetailActions product={data.product} vendor={data.vendor} />
            </div>

            {/* Honest proof — real figures only; the rail self-suppresses if nothing's true. */}
            <PublicProofRail className="mt-9" items={heroProof} />
          </div>
        </div>
      </Section>

      {/* ── TRUST PASSPORT — the vendor's accountability, surfaced before payment ── */}
      {data.vendor ? (
        <Section rhythm="tight">
          <TrustPassport vendor={data.vendor} copy={copy} />
        </Section>
      ) : null}

      {/* ── DETAIL — fulfillment + specs as hairline lists, not card-walls ── */}
      {fulfillmentRows.length > 0 || specEntries.length > 0 ? (
        <Section>
          <div className="grid gap-x-12 gap-y-12 lg:grid-cols-[0.42fr_0.58fr]">
            <SectionHeaderInline
              eyebrow={productCopy.detail.kicker}
              title={productCopy.detail.title}
              lede={localizedDeliveryNote || productCopy.detail.deliveryFallback}
            />
            <div className="space-y-10">
              {fulfillmentRows.length > 0 ? (
                <EditorialList>
                  {fulfillmentRows.map((row, i) => (
                    <EditorialRow
                      key={row.label}
                      index={String(i + 1).padStart(2, "0")}
                      title={row.label}
                      body={row.value}
                    />
                  ))}
                </EditorialList>
              ) : null}

              {specEntries.length > 0 ? (
                <div>
                  <p className="home-eyebrow">{productCopy.detail.specsTitle}</p>
                  <dl className="mt-4 divide-y divide-[color:var(--home-line)] border-t border-[color:var(--home-line)]">
                    {specEntries.map(([label, value]) => (
                      <div key={label} className="flex items-baseline justify-between gap-6 py-3.5">
                        <dt className="home-caption">{label}</dt>
                        <dd className="home-body-sm text-right font-medium text-[color:var(--home-ink)]">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
            </div>
          </div>
        </Section>
      ) : null}

      {/* ── THE ONE REASON — the climax: trust visible before payment ── */}
      {safetyItems.length > 0 ? (
        <Section rhythm="hero" tone="sunken">
          <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <Eyebrow>{productCopy.safety.kicker}</Eyebrow>
              <DisplayHeading level={2} size="display" className="mt-4 max-w-md">
                {copy.home.whyTitle}
              </DisplayHeading>
            </div>
            <EditorialList>
              {safetyItems.map((item, i) => (
                <EditorialRow key={item} index={String(i + 1).padStart(2, "0")} title={item} />
              ))}
            </EditorialList>
          </div>

          {featuredReview ? (
            <figure className="mt-12 max-w-2xl">
              <p className="home-eyebrow">
                {featuredReview.verifiedPurchase
                  ? productCopy.reviews.verifiedPurchase
                  : productCopy.reviews.reviewLabel}
              </p>
              <blockquote
                className="home-headline mt-4 text-[color:var(--home-ink-85)]"
                style={{ fontFamily: "var(--home-font-display)" }}
              >
                <span className="text-[color:var(--home-accent-text)]">&ldquo;</span>
                {featuredReview.title || featuredReview.body}
                <span className="text-[color:var(--home-accent-text)]">&rdquo;</span>
              </blockquote>
              <figcaption className="home-caption mt-4">{featuredReview.buyerName}</figcaption>
            </figure>
          ) : null}
        </Section>
      ) : null}

      {/* ── COMPLETE THE SET — related products as a hairline list with the price focal ── */}
      {data.related.length > 0 ? (
        <Section>
          <header className="flex max-w-2xl flex-col gap-4">
            <Eyebrow>{productCopy.related.kicker}</Eyebrow>
            <DisplayHeading level={2} size="display">
              {productCopy.related.title}
            </DisplayHeading>
            <Lede>{productCopy.related.body}</Lede>
          </header>
          <EditorialList className="mt-10">
            {data.related.slice(0, 4).map((product, i) => (
              <EditorialRow
                key={product.slug}
                index={String(i + 1).padStart(2, "0")}
                href={`/product/${product.slug}`}
                title={product.title}
                body={product.categorySlug.replace(/-/g, " ")}
                trailing={
                  <span className="home-num text-sm font-semibold text-[color:var(--home-accent-text)]">
                    {formatCurrency(product.basePrice, product.currency)}
                  </span>
                }
              />
            ))}
          </EditorialList>
        </Section>
      ) : null}

      {/* ── INVITATION — one dominant primary ── */}
      <Section>
        <div className="flex flex-col gap-6 rounded-[var(--home-radius-lg)] border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-02)] p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div className="max-w-xl">
            <DisplayHeading level={2} size="headline">
              {productCopy.rail.headline}
            </DisplayHeading>
            <Body className="mt-2">{productCopy.rail.caption}</Body>
          </div>
          <PublicCTA
            href="/search"
            variant="primary"
            size="lg"
            trailingIcon={<ArrowRight aria-hidden className="h-4 w-4" />}
          >
            {productCopy.rail.ctaLabel}
          </PublicCTA>
        </div>
      </Section>

      {/* Store passport + cross-discovery — quiet ghost links, demoted under the climax. */}
      {passportLinks.length > 0 ? (
        <Section rhythm="tight">
          <p className="home-eyebrow">{productCopy.detail.passportTitle}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {passportLinks.map((link) => (
              <PublicCTA
                key={link.href}
                href={link.href}
                variant="secondary"
                trailingIcon={<ArrowUpRight aria-hidden className="h-4 w-4" />}
              >
                {link.label}
              </PublicCTA>
            ))}
          </div>
        </Section>
      ) : null}
    </main>
  );
}

/** Local inline section header (start-aligned, no max-width clamp on the column). */
function SectionHeaderInline({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
}) {
  return (
    <header className="flex flex-col gap-4">
      <Eyebrow>{eyebrow}</Eyebrow>
      <DisplayHeading level={2} size="headline">
        {title}
      </DisplayHeading>
      {lede ? <Lede>{lede}</Lede> : null}
    </header>
  );
}
