import { translateSurfaceLabel } from "@henryco/i18n/server";
import { DisplayHeading, Eyebrow, Lede, Section } from "@henryco/ui/public-design";
import {
  SearchExperience,
  type SearchExperienceLabels,
} from "@/components/marketplace/search-experience";
import { getMarketplaceHomeData, searchMarketplace } from "@/lib/marketplace/data";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

/**
 * Search — standardized onto the locked --home-* public design system (same
 * opener grammar as the home page: eyebrow → display heading with ONE
 * accent-italic phrase → one lede). The page is the server boundary: every
 * surface label runs through translateSurfaceLabel here (Pattern B) and is
 * handed to the client SearchExperience as a plain-strings prop, so the
 * interactive component stays locale-dumb.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const [locale, snapshot, products] = await Promise.all([
    getMarketplacePublicLocale(),
    getMarketplaceHomeData(),
    searchMarketplace(params),
  ]);
  const t = (text: string) => translateSurfaceLabel(locale, text);

  const labels: SearchExperienceLabels = {
    searchKicker: t("Search"),
    searchPlaceholder: t("Desk lamp, cashmere throw, executive chair"),
    category: t("Category"),
    allCategories: t("All categories"),
    brand: t("Brand"),
    allBrands: t("All brands"),
    trustFilters: t("Trust filters"),
    onyxVerified: t("Henry Onyx Verified"),
    onyxVerifiedHint: t("Listings independently checked by Henry Onyx."),
    verifiedSellersOnly: t("Verified sellers only"),
    verifiedSellersChip: t("Verified sellers"),
    codEligible: t("Cash on delivery eligible"),
    codChip: t("COD eligible"),
    filters: t("Filters"),
    done: t("Done"),
    resultsKicker: t("Results"),
    refreshingKicker: t("Refreshing"),
    refreshingResults: t("Refreshing results..."),
    resultCountOne: t("1 result"),
    resultCountMany: t("{count} results"),
    sortFeatured: t("Sort: Featured"),
    sortPriceLow: t("Price: Low to high"),
    sortPriceHigh: t("Price: High to low"),
    sortRating: t("Rating first"),
    activeFilters: t("Active filters"),
    showingOf: t("Showing {shown} of {total} products"),
    showMore: t("Show {count} more"),
    allShown: t("All {count} products shown."),
    moreArrivingKicker: t("More arriving soon"),
    moreArrivingTitle: t(
      "Henry Onyx Marketplace is opening with a small, hand-picked set of vendors so the trust signals stay real.",
    ),
    moreArrivingBody: t(
      "New stores and listings are being verified weekly. Save the categories you care about and we will surface fresh inventory as it lands.",
    ),
    applyToSell: t("Apply to sell"),
    howTrustWorks: t("How trust works"),
    emptyTitle: t("Nothing matched that exact combination."),
    emptyBody: t("Ease one trust filter or widen the keyword."),
    resetSearch: t("Reset search"),
  };

  return (
    <Section rhythm="tight" width="wide" as="div">
      <header>
        <Eyebrow>{t("Search")}</Eyebrow>
        <DisplayHeading level={1} size="display" className="mt-4 max-w-2xl">
          {t("Find it fast.")}{" "}
          <span className="italic text-[color:var(--home-accent-text)]">
            {t("Trust what you see.")}
          </span>
        </DisplayHeading>
        <Lede className="mt-5 max-w-xl">
          {t("Refine by seller, brand, category, and delivery terms — trust signals stay beside every result.")}
        </Lede>
      </header>

      <div className="mt-12">
        <SearchExperience
          categories={snapshot.categories}
          brands={snapshot.brands}
          initialItems={products}
          labels={labels}
          initialQuery={{
            q: Array.isArray(params.q) ? params.q[0] : params.q,
            category: Array.isArray(params.category) ? params.category[0] : params.category,
            brand: Array.isArray(params.brand) ? params.brand[0] : params.brand,
            verified: Array.isArray(params.verified) ? params.verified[0] : params.verified,
            onyxVerified: Array.isArray(params.onyxverified)
              ? params.onyxverified[0]
              : params.onyxverified,
            cod: Array.isArray(params.cod) ? params.cod[0] : params.cod,
          }}
        />
      </div>
    </Section>
  );
}
