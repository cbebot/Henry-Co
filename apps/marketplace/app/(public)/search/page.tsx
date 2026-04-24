import { PageIntro } from "@/components/marketplace/shell";
import { SearchExperience } from "@/components/marketplace/search-experience";
import { getMarketplaceHomeData, searchMarketplace } from "@/lib/marketplace/data";

export const dynamic = "force-dynamic";

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
        title="Find it fast. Trust what you see."
        description="Refine by verified seller, brand, category, and COD readiness. Results update as you filter, stay readable on mobile, and surface the trust signals you care about before you click through."
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
