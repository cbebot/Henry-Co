import { notFound } from "next/navigation";
import { PageIntro, ProductCard, TrustPassport } from "@/components/marketplace/shell";
import { getMarketplaceViewer } from "@/lib/marketplace/auth";
import { getMarketplaceVendorBySlug } from "@/lib/marketplace/data";

export const dynamic = "force-dynamic";

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [data, viewer] = await Promise.all([getMarketplaceVendorBySlug(slug), getMarketplaceViewer()]);
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageIntro
        kicker="Store"
        title={data.vendor.name}
        description={data.vendor.description}
        actions={
          <form action="/api/marketplace" method="POST">
            <input type="hidden" name="intent" value="vendor_follow_toggle" />
            <input type="hidden" name="vendor_slug" value={data.vendor.slug} />
            <input type="hidden" name="return_to" value={`/store/${data.vendor.slug}`} />
            <button className="market-button-primary rounded-full px-5 py-3 text-sm font-semibold">
              {viewer.user ? "Follow this store" : "Sign in to follow"}
            </button>
          </form>
        }
      />
      <TrustPassport vendor={data.vendor} />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {data.products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
