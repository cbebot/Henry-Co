import { notFound } from "next/navigation";
import { PageIntro, ProductCard } from "@/components/marketplace/shell";
import { getMarketplaceCollectionBySlug } from "@/lib/marketplace/data";

export const dynamic = "force-dynamic";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getMarketplaceCollectionBySlug(slug);
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageIntro
        kicker={data.collection.kicker}
        title={data.collection.title}
        description={data.collection.description}
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {data.products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
