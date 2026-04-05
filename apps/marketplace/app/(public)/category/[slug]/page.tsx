import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionCard, ProductCard } from "@/components/marketplace/shell";
import { getMarketplaceHomeData } from "@/lib/marketplace/data";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const snapshot = await getMarketplaceHomeData();
  const category = snapshot.categories.find((item) => item.slug === slug);
  if (!category) notFound();

  const products = snapshot.products.filter((item) => item.categorySlug === slug);
  const relatedCollections = snapshot.collections.filter((collection) =>
    collection.productSlugs.some((productSlug) => products.some((product) => product.slug === productSlug))
  );

  return (
    <div className="mx-auto max-w-[1480px] space-y-8 px-4 py-8 sm:px-6 xl:px-8">
      <section className="grid gap-6 xl:grid-cols-[1.08fr,0.92fr]">
        <article className="market-panel rounded-[2.5rem] p-8 sm:p-10">
          <p className="market-kicker">Category edit</p>
          <h1 className="market-display mt-5 max-w-4xl">{category.name}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--market-muted)]">{category.hero}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/search?category=${category.slug}`} className="market-button-primary rounded-full px-5 py-3 text-sm font-semibold">
              Search this category
            </Link>
            <Link href="/trust" className="market-button-secondary rounded-full px-5 py-3 text-sm font-semibold">
              Review trust standards
            </Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {category.filterPresets.map((preset) => (
              <div
                key={preset}
                className="market-soft rounded-[1.35rem] px-4 py-4 text-sm font-medium text-[var(--market-ink)]"
              >
                {preset}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2.5rem] border border-[var(--market-line-strong)] bg-[var(--market-noir)] p-8 text-[var(--market-paper-white)] shadow-[0_36px_110px_rgba(17,13,9,0.3)] sm:p-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--market-brass)]">
            Category confidence
          </p>
          <div className="mt-6 grid gap-4">
            <div className="rounded-[1.5rem] border border-[color:rgba(255,255,255,0.12)] bg-[color:rgba(255,255,255,0.04)] px-5 py-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[color:rgba(255,255,255,0.56)]">Active listings</p>
              <p className="mt-3 text-4xl font-semibold tracking-tight">{products.length}</p>
            </div>
            {category.trustNotes.map((note) => (
              <div
                key={note}
                className="rounded-[1.5rem] border border-[color:rgba(255,255,255,0.12)] bg-[color:rgba(255,255,255,0.04)] px-4 py-4 text-sm leading-7 text-[color:rgba(255,255,255,0.72)]"
              >
                {note}
              </div>
            ))}
          </div>
        </article>
      </section>

      {relatedCollections.length ? (
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="market-kicker">Curated rails</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--market-ink)]">
                Collections that shorten decision-making.
              </h2>
            </div>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {relatedCollections.slice(0, 2).map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="market-kicker">Category catalog</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--market-ink)]">
              Premium products, tighter hierarchy.
            </h2>
          </div>
          <Link href={`/search?category=${category.slug}`} className="text-sm font-semibold text-[var(--market-brass)]">
            Open full search
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
