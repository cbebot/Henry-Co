import { ArrowRight, ArrowUpRight } from "lucide-react";
import { translateSurfaceLabel } from "@henryco/i18n/server";
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
  SectionHeader,
} from "@henryco/ui/public-design";
import {
  CollectionCard,
  EmptyState,
  ProductCard,
  VendorCard,
} from "@/components/marketplace/shell";
import { getMarketplaceHomeData } from "@/lib/marketplace/data";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { getMarketplacePublicCopy } from "@/lib/public-copy";

export const dynamic = "force-dynamic";

/* TODO(wave3-catalogue): paginate translation — the home page renders many
   catalogue rows (featured products, categories, collections, vendors). Wrapping
   every row through resolveLocalizedDynamicField would compound DeepL spend on a
   hot landing route; defer until the cache layer lands so translations can be
   memoized per locale + record version. */

/**
 * Marketplace home — the calmer-commerce showcase, on the locked --home-* public
 * design system. Narrative arc, one breath per section, one climax:
 *   Hook (the calm-commerce promise) → The one reason (trust on one record) →
 *   Real proof (honest counts) → Featured discovery (image cards) → Invitation.
 *
 * Server component; sources the SAME catalog as before (getMarketplaceHomeData /
 * getMarketplacePublicCopy) and re-presents it. Surface labels run through
 * translateSurfaceLabel (Pattern B); catalogue ROW text (titles, vendor names) is
 * Supabase-source language — per-row translation is the wave-3 follow-up above.
 * No hardcoded user-facing strings; no hardcoded domains. The bronze accent is the
 * single focal mark per beat — never sprinkled.
 */
export default async function MarketplaceHomePage() {
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplacePublicCopy(locale);
  const data = await getMarketplaceHomeData();
  const t = (text: string) => translateSurfaceLabel(locale, text);

  const proof = (n: number) => (n > 0 ? String(n) : null);

  const reviewAverage = data.reviews.length
    ? data.reviews.reduce((sum, review) => sum + review.rating, 0) / data.reviews.length
    : 0;

  const featuredProducts = data.products.filter((item) => item.featured).slice(0, 6);
  const discoveryProducts = (featuredProducts.length >= 3 ? featuredProducts : data.products).slice(0, 6);
  const featuredCollections = data.collections.slice(0, 3);
  const featuredVendors = data.vendors.slice(0, 4);
  const featuredCategories = data.categories.filter((item) => item.featured).slice(0, 5);
  const hasCatalog = data.products.length > 0;

  return (
    <>
      {/* ── HOOK — the calm-commerce promise; one accent-italic focal word ── */}
      <section className="relative isolate overflow-hidden home-section-hero">
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-12%] top-[-16%] h-[34rem] w-[34rem] rounded-full opacity-[0.14] blur-[2px]"
          style={{ background: "radial-gradient(circle, var(--home-accent) 0%, transparent 68%)" }}
        />
        <div className="home-shell relative">
          <Eyebrow className="home-rise">{t("Henry & Co. Marketplace")}</Eyebrow>
          <div className="mt-6 grid gap-x-12 gap-y-10 lg:grid-cols-[1.5fr_1fr] lg:items-end">
            <div>
              <DisplayHeading level={1} size="xl" className="home-rise home-delay-1 max-w-2xl">
                {t("Buy from verified stores,")}{" "}
                <span className="italic text-[color:var(--home-accent-text)]">{t("without the noise.")}</span>
              </DisplayHeading>
              <Lede className="mt-6 max-w-xl home-rise home-delay-2">
                {t(
                  "A calmer marketplace — curated sellers, honest delivery, and every order on one Henry & Co. record.",
                )}
              </Lede>
              <div className="mt-9 flex flex-wrap items-center gap-3 home-rise home-delay-3">
                <PublicCTA
                  href="/search"
                  variant="primary"
                  size="lg"
                  trailingIcon={<ArrowRight aria-hidden className="h-4 w-4" />}
                >
                  {t("Explore the catalog")}
                </PublicCTA>
                <PublicCTA href="/sell" variant="secondary" size="lg">
                  {t("Sell on Henry & Co.")}
                </PublicCTA>
              </div>
            </div>
            <div className="home-rise home-delay-4">
              <PublicProofRail
                label={t("At a glance")}
                items={[
                  { value: proof(data.vendors.length), label: copy.kpiLabels.verifiedStores },
                  { value: proof(data.products.length), label: copy.kpiLabels.activeListings },
                  {
                    value: reviewAverage > 0 ? reviewAverage.toFixed(1) : null,
                    label: copy.kpiLabels.trustRating,
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── THE ONE REASON — the climax: trust, visible before payment ── */}
      <Section rhythm="hero" tone="sunken">
        <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div>
            <Eyebrow>{t("Why it feels different")}</Eyebrow>
            <DisplayHeading level={2} size="display" className="mt-4">
              {t("Trust, visible")}{" "}
              <span className="italic text-[color:var(--home-accent-text)]">{t("before you pay.")}</span>
            </DisplayHeading>
            <Lede className="mt-5 max-w-lg">
              {t(
                "Verification, delivery promises, and dispute history sit beside the buy button — and orders, payments, and support stay on one account.",
              )}
            </Lede>
          </div>
          <EditorialList>
            <EditorialRow
              index="01"
              title={t("Verified, not crowded")}
              body={t("Curated stores with seller passports — quality over catalogue sprawl.")}
            />
            <EditorialRow
              index="02"
              title={t("Honest split orders")}
              body={t("Items from different sellers stay clearly segmented through delivery.")}
            />
            <EditorialRow
              index="03"
              title={t("One record")}
              body={t("Orders, payments, reviews, and support live in one Henry & Co. account.")}
            />
          </EditorialList>
        </div>
      </Section>

      {/* ── REAL PROOF + FEATURED DISCOVERY — products as the heart ── */}
      {hasCatalog ? (
        <Section>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <SectionHeader
              level={2}
              size="display"
              eyebrow={t("Featured")}
              title={t("Worth a closer look.")}
              lede={t("Hand-picked listings from verified Henry & Co. sellers.")}
            />
            <PublicCTA href="/search" variant="ghost" trailingIcon={<ArrowUpRight aria-hidden className="h-4 w-4" />}>
              {copy.home.browseAll}
            </PublicCTA>
          </div>
          <PublicProofRail
            className="mt-9"
            items={[
              { value: proof(data.vendors.length), label: copy.kpiLabels.verifiedStores },
              { value: proof(data.products.length), label: copy.kpiLabels.activeListings },
              { value: proof(data.collections.length), label: t("Collections") },
            ]}
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {discoveryProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </Section>
      ) : (
        <Section>
          <EmptyState
            title={copy.home.emptyTitle}
            body={copy.home.emptyBody}
            ctaHref="/help"
            ctaLabel={copy.home.emptyCta}
          />
        </Section>
      )}

      {/* ── DISCOVER BY CATEGORY — hairline list, no card-wall ── */}
      {featuredCategories.length > 0 ? (
        <Section rhythm="tight">
          <SectionHeader
            level={2}
            size="headline"
            eyebrow={t("Browse")}
            title={t("Find your shelf.")}
          />
          <EditorialList className="mt-9">
            {featuredCategories.map((category) => (
              <EditorialRow
                key={category.slug}
                href={`/category/${category.slug}`}
                title={category.name}
                body={category.description}
                trailing={
                  <span className="home-num hidden text-sm text-[color:var(--home-accent-text)] sm:inline">
                    {category.productCount > 0 ? category.productCount : ""}
                  </span>
                }
              />
            ))}
          </EditorialList>
        </Section>
      ) : null}

      {/* ── CURATED COLLECTIONS — tasteful Card moment (true tiles) ── */}
      {featuredCollections.length > 0 ? (
        <Section>
          <SectionHeader
            level={2}
            size="display"
            eyebrow={t("Curated")}
            title={t("Edits that guide, never shout.")}
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {featuredCollections.map((collection) => (
              <CollectionCard key={collection.slug} collection={collection} copy={copy} />
            ))}
          </div>
        </Section>
      ) : null}

      {/* ── TRUSTED STORES — image cards for genuine discrete objects ── */}
      {featuredVendors.length > 0 ? (
        <Section rhythm="tight">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <SectionHeader
              level={2}
              size="display"
              eyebrow={t("Stores")}
              title={t("Sellers you can read.")}
              lede={t("Verified vendors with accountability you can see before you buy.")}
            />
            <PublicCTA href="/search" variant="ghost" trailingIcon={<ArrowUpRight aria-hidden className="h-4 w-4" />}>
              {t("All stores")}
            </PublicCTA>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {featuredVendors.map((vendor) => (
              <VendorCard key={vendor.slug} vendor={vendor} copy={copy} />
            ))}
          </div>
        </Section>
      ) : null}

      {/* ── INVITATION — one dominant primary ── */}
      <Section>
        <div className="flex flex-col gap-6 rounded-[var(--home-radius-lg)] border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-02)] p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div className="max-w-xl">
            <DisplayHeading level={2} size="headline">
              {t("Start with what you need.")}
            </DisplayHeading>
            <Body className="mt-2">
              {t("Search the catalog, or open a store you can trust — every order lands on one record.")}
            </Body>
          </div>
          <PublicCTA
            href="/search"
            variant="primary"
            size="lg"
            trailingIcon={<ArrowRight aria-hidden className="h-4 w-4" />}
          >
            {t("Explore the catalog")}
          </PublicCTA>
        </div>
      </Section>
    </>
  );
}
