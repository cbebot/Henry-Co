import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/marketplace/shell";
import { getMarketplaceCollectionBySlug } from "@/lib/marketplace/data";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { getMarketplacePublicCopy } from "@/lib/public-copy";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [locale, data] = await Promise.all([
    getMarketplacePublicLocale(),
    getMarketplaceCollectionBySlug(slug),
  ]);
  const copy = getMarketplacePublicCopy(locale);

  if (!data) {
    return { description: copy.collections.metadata.fallbackDescription };
  }

  const title = copy.collections.metadata.titleTemplate.replace(
    "{collection}",
    data.collection.title,
  );
  const description = copy.collections.metadata.descriptionTemplate.replace(
    "{collection}",
    data.collection.title,
  );

  return { title, description };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [locale, data] = await Promise.all([
    getMarketplacePublicLocale(),
    getMarketplaceCollectionBySlug(slug),
  ]);
  if (!data) notFound();

  const copy = getMarketplacePublicCopy(locale);
  const c = copy.collections;

  return (
    <main className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
      <section>
        <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
          <div>
            <p className="market-kicker text-[10.5px] uppercase tracking-[0.32em]">
              {data.collection.kicker}
            </p>
            <h1 className="mt-4 text-balance text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-[var(--market-ink)] sm:text-[2.7rem] md:text-[3.1rem]">
              {data.collection.title}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--market-muted)]">
              {data.collection.description}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/search"
                className="market-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                {c.hero.primaryCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/trust"
                className="market-button-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                {c.hero.secondaryCta}
              </Link>
            </div>
          </div>
          <ul className="grid gap-3 text-sm">
            <li className="flex items-baseline gap-3 border-b border-[var(--market-line)] py-3">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                {c.sidebar.itemsLabel}
              </span>
              <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--market-ink)]">
                {data.products.length}
              </span>
            </li>
            <li className="flex items-baseline gap-3 border-b border-[var(--market-line)] py-3">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                {c.sidebar.editedByLabel}
              </span>
              <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--market-ink)]">
                {c.sidebar.editedByValue}
              </span>
            </li>
            <li className="flex items-baseline gap-3 border-b border-[var(--market-line)] py-3 last:border-b-0">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                {c.sidebar.buyerProtectionLabel}
              </span>
              <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--market-ink)]">
                {c.sidebar.buyerProtectionValue}
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4 border-b border-[var(--market-line)] pb-4">
          <p className="market-kicker text-[10.5px] uppercase tracking-[0.22em]">
            {c.rail.kicker}
          </p>
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
            {data.products.length} {c.rail.itemsSuffix}
          </span>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
