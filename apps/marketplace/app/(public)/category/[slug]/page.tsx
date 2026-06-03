import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { resolveLocalizedDynamicField, translateSurfaceLabel } from "@henryco/i18n/server";
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
import { ProductCard } from "@/components/marketplace/shell";
import { getMarketplaceHomeData } from "@/lib/marketplace/data";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { getMarketplacePublicCopy } from "@/lib/public-copy";

export const dynamic = "force-dynamic";

/**
 * Category — the marketplace browse/discovery surface on the locked --home-*
 * system. Editorial Fraunces hero (the category name is the accent-italic focal
 * word) → one lede → one dominant "Search this category" CTA → an honest proof
 * rail (real listing / collection counts; null self-suppresses) → curated rails
 * as a hairline list (not a card-wall) → a calm, spacious ProductCard grid with
 * a truthful result count and empty state.
 *
 * Server component, same source as before (getMarketplaceHomeData /
 * getMarketplacePublicCopy) — re-presented, not refetched. Localized category
 * fields run through resolveLocalizedDynamicField; surface labels through
 * translateSurfaceLabel (the Pattern-B convention). Catalog ROW text stays
 * source-language (the wave-3 catalogue follow-up, like the home/search grids).
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, getMarketplacePublicLocale()]);
  const copy = getMarketplacePublicCopy(locale);
  const snapshot = await getMarketplaceHomeData();
  const category = snapshot.categories.find((item) => item.slug === slug);
  const categoryName = category
    ? await resolveLocalizedDynamicField({
        record: category as unknown as Record<string, unknown>,
        field: "name",
        locale,
        fallback: category.name,
        machineTranslate: locale !== "en",
      })
    : slug;

  return {
    title: copy.category.metadata.titleTemplate.replace("{category}", categoryName),
    description: category?.hero
      ? copy.category.metadata.descriptionTemplate.replace("{category}", categoryName)
      : copy.category.metadata.fallbackDescription,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, locale, snapshot] = await Promise.all([
    params,
    getMarketplacePublicLocale(),
    getMarketplaceHomeData(),
  ]);
  const copy = getMarketplacePublicCopy(locale);
  const category = snapshot.categories.find((item) => item.slug === slug);
  const t = (text: string) => translateSurfaceLabel(locale, text);
  const proof = (n: number) => (n > 0 ? String(n) : null);

  // Truthful empty/unknown category: never 404 a discovery surface, present an
  // honest "nothing here yet" state so the page stays useful and crawlable.
  if (!category) {
    return (
      <main id="henryco-main" tabIndex={-1}>
        <Section rhythm="hero">
          <Eyebrow>{t("Browse")}</Eyebrow>
          <DisplayHeading level={1} size="xl" className="mt-5 max-w-3xl">
            {t("This category isn't")}{" "}
            <span className="italic text-[color:var(--home-accent-text)]">{t("live yet.")}</span>
          </DisplayHeading>
          <Lede className="mt-6 max-w-2xl">
            {t("Browse the full catalogue — verified sellers, honest delivery, one trusted record.")}
          </Lede>
          <div className="mt-9">
            <PublicCTA
              href="/search"
              variant="primary"
              size="lg"
              trailingIcon={<ArrowRight aria-hidden className="h-4 w-4" />}
            >
              {t("Browse everything")}
            </PublicCTA>
          </div>
        </Section>
      </main>
    );
  }

  // Single category surface: translate every visible category text field.
  const [localizedCategoryName, localizedCategoryHero, localizedCategoryDescription] =
    await Promise.all([
      resolveLocalizedDynamicField({
        record: category as unknown as Record<string, unknown>,
        field: "name",
        locale,
        fallback: category.name,
        machineTranslate: locale !== "en",
      }),
      resolveLocalizedDynamicField({
        record: category as unknown as Record<string, unknown>,
        field: "hero",
        locale,
        fallback: category.hero ?? "",
        machineTranslate: locale !== "en",
      }),
      resolveLocalizedDynamicField({
        record: category as unknown as Record<string, unknown>,
        field: "description",
        locale,
        fallback: category.description ?? "",
        machineTranslate: locale !== "en",
      }),
    ]);

  const products = snapshot.products.filter((item) => item.categorySlug === slug);
  const relatedCollections = snapshot.collections.filter((collection) =>
    collection.productSlugs.some((productSlug) =>
      products.some((product) => product.slug === productSlug),
    ),
  );
  const searchHref = `/search?category=${category.slug}`;

  return (
    <main id="henryco-main" tabIndex={-1}>
      {/* ── HOOK — the category name is the accent-italic focal word ── */}
      <Section rhythm="hero">
        <Eyebrow>{t("Browse")}</Eyebrow>
        <DisplayHeading level={1} size="xl" className="mt-5 max-w-3xl">
          {t("The")}{" "}
          <span className="italic text-[color:var(--home-accent-text)]">{localizedCategoryName}</span>{" "}
          {t("edit.")}
        </DisplayHeading>
        <Lede className="mt-6 max-w-2xl">
          {localizedCategoryHero || localizedCategoryDescription || t("Verified sellers, honest delivery, one trusted record.")}
        </Lede>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <PublicCTA
            href={searchHref}
            variant="primary"
            size="lg"
            trailingIcon={<ArrowRight aria-hidden className="h-4 w-4" />}
          >
            {copy.category.hero.searchCta}
          </PublicCTA>
          <PublicCTA href="/trust" variant="ghost">
            {copy.category.hero.trustCta}
          </PublicCTA>
        </div>
        <PublicProofRail
          className="mt-10"
          items={[
            { value: proof(products.length), label: copy.category.stats.activeListingsLabel },
            { value: proof(relatedCollections.length), label: t("Curated rails") },
            { value: proof(category.trustNotes.length), label: t("Trust standards") },
          ]}
        />
        {category.filterPresets.length > 0 ? (
          <div className="mt-8">
            <p className="home-eyebrow">{copy.category.hero.quickFiltersLabel}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {category.filterPresets.map((preset) => (
                <span
                  key={preset}
                  className="rounded-full border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-02)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--home-ink-70)]"
                >
                  {preset}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </Section>

      {/* ── CURATED RAILS — a hairline list, not a wall of cards ── */}
      {relatedCollections.length > 0 ? (
        <Section rhythm="tight">
          <Eyebrow>{copy.category.collectionsRail.kicker}</Eyebrow>
          <DisplayHeading level={2} size="display" className="mt-4 max-w-2xl">
            {copy.category.collectionsRail.title}
          </DisplayHeading>
          <EditorialList className="mt-10">
            {relatedCollections.slice(0, 4).map((collection, i) => (
              <EditorialRow
                key={collection.id}
                index={String(i + 1).padStart(2, "0")}
                href={`/collections/${collection.slug}`}
                title={collection.title}
                body={collection.highlight || collection.description}
                trailing={
                  <ArrowUpRight
                    aria-hidden
                    className="h-4 w-4 text-[color:var(--home-accent-text)]"
                  />
                }
              />
            ))}
          </EditorialList>
        </Section>
      ) : null}

      {/* ── THE CATALOGUE — calm, spacious grid; honest result count ── */}
      <Section rhythm={relatedCollections.length > 0 ? "tight" : "default"}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <Eyebrow>{copy.category.catalog.kicker}</Eyebrow>
            <DisplayHeading level={2} size="display" className="mt-4">
              {copy.category.catalog.title}
            </DisplayHeading>
          </div>
          <p className="home-caption">
            {products.length === 1
              ? t("1 listing")
              : t("{count} listings").replace("{count}", String(products.length))}
          </p>
        </div>

        {products.length > 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-10 max-w-xl border-l-2 border-[color:var(--home-accent)] pl-5">
            <Body className="font-medium text-[color:var(--home-ink)]">
              {t("No listings here yet.")}
            </Body>
            <Body size="sm" className="mt-2">
              {t("Approved products in this category appear here as sellers go live.")}
            </Body>
          </div>
        )}

        <div className="mt-10">
          <PublicCTA
            href={searchHref}
            variant="ghost"
            trailingIcon={<ArrowRight aria-hidden className="h-4 w-4" />}
          >
            {copy.category.catalog.openSearch}
          </PublicCTA>
        </div>
      </Section>

      {/* ── INVITATION — one dominant primary ── */}
      <Section>
        <div className="flex flex-col gap-6 rounded-[var(--home-radius-lg)] border border-[color:var(--home-line-12)] bg-[color:var(--home-surface-02)] p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div className="max-w-xl">
            <DisplayHeading level={2} size="headline">
              {t("Looking for something specific?")}
            </DisplayHeading>
            <Body className="mt-2">
              {t("Search the full catalogue — every listing carries a seller passport and honest delivery before checkout.")}
            </Body>
          </div>
          <PublicCTA
            href={searchHref}
            variant="primary"
            size="lg"
            trailingIcon={<ArrowRight aria-hidden className="h-4 w-4" />}
          >
            {copy.category.hero.searchCta}
          </PublicCTA>
        </div>
      </Section>
    </main>
  );
}
