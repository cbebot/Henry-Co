import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
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
    collection.productSlugs.some((productSlug) =>
      products.some((product) => product.slug === productSlug),
    ),
  );

  return (
    <main className="mx-auto max-w-[1480px] space-y-14 px-4 py-12 sm:px-6 xl:px-8">
      <section>
        <div className="grid gap-10 xl:grid-cols-[1.15fr,0.85fr] xl:items-end">
          <div>
            <p className="market-kicker text-[10.5px] uppercase tracking-[0.32em]">Category edit</p>
            <h1 className="mt-4 text-balance text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-[var(--market-ink)] sm:text-[2.7rem] md:text-[3.1rem]">
              {category.name}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--market-muted)]">
              {category.hero}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={`/search?category=${category.slug}`}
                className="market-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                Search this category
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/trust"
                className="market-button-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                Review trust standards
              </Link>
            </div>
            {category.filterPresets.length > 0 ? (
              <div className="mt-7">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                  Quick filters
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {category.filterPresets.map((preset) => (
                    <span
                      key={preset}
                      className="rounded-full border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--market-ink)]"
                    >
                      {preset}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <ul className="grid gap-3 text-sm">
            <li className="flex items-baseline gap-3 border-b border-[var(--market-line)] py-3">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                Active listings
              </span>
              <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--market-ink)]">
                {products.length}
              </span>
            </li>
            {category.trustNotes.map((note, i) => (
              <li
                key={note}
                className={
                  i === category.trustNotes.length - 1
                    ? "border-b-0 py-3 text-sm leading-7 text-[var(--market-muted)]"
                    : "border-b border-[var(--market-line)] py-3 text-sm leading-7 text-[var(--market-muted)]"
                }
              >
                {note}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {relatedCollections.length ? (
        <section>
          <div className="flex items-end justify-between gap-4 border-b border-[var(--market-line)] pb-4">
            <div>
              <p className="market-kicker text-[10.5px] uppercase tracking-[0.22em]">
                Curated rails
              </p>
              <h2 className="mt-2 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-ink)] sm:text-[1.85rem]">
                Collections that shorten decision-making.
              </h2>
            </div>
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {relatedCollections.slice(0, 2).map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <div className="flex items-end justify-between gap-4 border-b border-[var(--market-line)] pb-4">
          <div>
            <p className="market-kicker text-[10.5px] uppercase tracking-[0.22em]">
              Category catalog
            </p>
            <h2 className="mt-2 text-balance text-[1.55rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-ink)] sm:text-[1.85rem]">
              Premium products, tighter hierarchy.
            </h2>
          </div>
          <Link
            href={`/search?category=${category.slug}`}
            className="text-sm font-semibold text-[var(--market-brass)] underline-offset-4 hover:underline"
          >
            Open full search
          </Link>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
