import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/marketplace/shell";
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
    <main className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
      <section>
        <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
          <div>
            <p className="market-kicker text-[10.5px] uppercase tracking-[0.32em]">Brand</p>
            <h1 className="mt-4 text-balance text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-[var(--market-ink)] sm:text-[2.7rem] md:text-[3.1rem]">
              {brand.name}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--market-muted)]">
              {brand.description}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={`/search?brand=${brand.slug}`}
                className="market-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                Search this brand
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/trust"
                className="market-button-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                Trust standards
              </Link>
            </div>
          </div>
          <ul className="grid gap-3 text-sm">
            <li className="flex items-baseline gap-3 border-b border-[var(--market-line)] py-3">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                Active products
              </span>
              <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--market-ink)]">
                {products.length}
              </span>
            </li>
            <li className="flex items-baseline gap-3 border-b border-[var(--market-line)] py-3">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                Listings reviewed
              </span>
              <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--market-ink)]">
                Trust passport visible per item
              </span>
            </li>
            <li className="flex items-baseline gap-3 border-b border-[var(--market-line)] py-3 last:border-b-0">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                Buyer protection
              </span>
              <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--market-ink)]">
                Escrowed checkout
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4 border-b border-[var(--market-line)] pb-4">
          <p className="market-kicker text-[10.5px] uppercase tracking-[0.22em]">
            Live from {brand.name}
          </p>
          <Link
            href={`/search?brand=${brand.slug}`}
            className="text-sm font-semibold text-[var(--market-brass)] underline-offset-4 hover:underline"
          >
            Open full search
          </Link>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
