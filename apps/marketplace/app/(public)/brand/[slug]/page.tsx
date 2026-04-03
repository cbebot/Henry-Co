import { notFound } from "next/navigation";
import { PageIntro, ProductCard } from "@/components/marketplace/shell";
import { getMarketplaceHomeData } from "@/lib/marketplace/data";

export const dynamic = "force-dynamic";

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const snapshot = await getMarketplaceHomeData();
  const brand = snapshot.brands.find((item) => item.slug === slug);
  if (!brand) notFound();

  const products = snapshot.products.filter((item) => item.brandSlug === slug);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageIntro kicker="Brand" title={brand.name} description={brand.description} />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
