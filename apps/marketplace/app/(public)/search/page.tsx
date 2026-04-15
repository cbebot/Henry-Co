import type { Metadata } from "next";
import { createDivisionMetadata } from "@henryco/config";
import { PageIntro } from "@/components/marketplace/shell";
import { SearchExperience } from "@/components/marketplace/search-experience";
import { getMarketplaceHomeData, searchMarketplace } from "@/lib/marketplace/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = createDivisionMetadata("marketplace", {
  title: "Search | Henry & Co. Marketplace",
  description:
    "Search premium marketplace listings by query, verified seller, brand, category, and delivery trust signals.",
  path: "/search",
});

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const [snapshot, products] = await Promise.all([
    getMarketplaceHomeData(),
    searchMarketplace(params),
  ]);

  return (
    <div className="mx-auto max-w-[1480px] space-y-8 px-4 py-8 sm:px-6 xl:px-8">
      <PageIntro
        kicker="Search"
        title="Reactive discovery with premium filters and calmer hierarchy."
        description="Search by intent, then refine by verified seller, brand, category, and COD readiness without drowning the buyer in clutter. Results update quickly, filters stay mobile-friendly, and empty states stay useful."
      />

      <SearchExperience
        categories={snapshot.categories}
        brands={snapshot.brands}
        initialItems={products}
        initialQuery={{
          q: Array.isArray(params.q) ? params.q[0] : params.q,
          category: Array.isArray(params.category) ? params.category[0] : params.category,
          brand: Array.isArray(params.brand) ? params.brand[0] : params.brand,
          verified: Array.isArray(params.verified) ? params.verified[0] : params.verified,
          cod: Array.isArray(params.cod) ? params.cod[0] : params.cod,
        }}
      />
    </div>
  );
}
