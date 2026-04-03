import { CampaignBanner, PageIntro, ProductCard } from "@/components/marketplace/shell";
import { getMarketplaceHomeData } from "@/lib/marketplace/data";

export const dynamic = "force-dynamic";

export default async function DealsPage() {
  const data = await getMarketplaceHomeData();
  const products = data.products.filter((product) => product.compareAtPrice && product.compareAtPrice > product.basePrice);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageIntro
        kicker="Verified Deals"
        title="Discounts filtered for trust, stock certainty, and seller accountability."
        description="Deals are only surfaced when the listing quality, seller trust passport, and stock status are clean enough to protect conversion and reduce buyer regret."
      />
      {data.campaigns[1] ? <CampaignBanner campaign={data.campaigns[1]} /> : null}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
