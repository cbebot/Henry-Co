import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { resolveLocalizedDynamicField } from "@henryco/i18n/server";
import { ProductCard } from "@/components/marketplace/shell";
import { getMarketplaceHomeData } from "@/lib/marketplace/data";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { getMarketplacePublicCopy } from "@/lib/public-copy";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, getMarketplacePublicLocale()]);
  const copy = getMarketplacePublicCopy(locale);
  const snapshot = await getMarketplaceHomeData();
  const brand = snapshot.brands.find((item) => item.slug === slug);
  // Brand name is a proper noun and stays as-is — only description translates.
  const brandName = brand?.name ?? slug;
  const description = brand
    ? await resolveLocalizedDynamicField({
        record: brand as unknown as Record<string, unknown>,
        field: "description",
        locale,
        fallback: brand.description ?? copy.brand.metadataDescription.replace("{brand}", brandName),
        machineTranslate: locale !== "en",
      })
    : copy.brand.metadataDescription.replace("{brand}", brandName);

  return {
    title: copy.brand.metadataTitle.replace("{brand}", brandName),
    description,
  };
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, locale, snapshot] = await Promise.all([
    params,
    getMarketplacePublicLocale(),
    getMarketplaceHomeData(),
  ]);
  const copy = getMarketplacePublicCopy(locale);
  const brand = snapshot.brands.find((item) => item.slug === slug);
  if (!brand) notFound();

  // Brand name is a proper noun and stays as-is; description is editorial copy
  // and translates for non-EN buyers.
  const localizedBrandDescription = await resolveLocalizedDynamicField({
    record: brand as unknown as Record<string, unknown>,
    field: "description",
    locale,
    fallback: brand.description ?? "",
    machineTranslate: locale !== "en",
  });

  const products = snapshot.products.filter((item) => item.brandSlug === slug);

  return (
    <main className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
      <section>
        <div className="grid gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
          <div>
            <p className="market-kicker text-[10.5px] uppercase tracking-[0.32em]">{copy.brand.eyebrow}</p>
            <h1 className="mt-4 text-balance text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.025em] text-[var(--market-ink)] sm:text-[2.7rem] md:text-[3.1rem]">
              {brand.name}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--market-muted)]">
              {localizedBrandDescription || copy.brand.bodyFallback}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={`/search?brand=${brand.slug}`}
                className="market-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                {copy.brand.searchCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/trust"
                className="market-button-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                {copy.brand.trustCta}
              </Link>
            </div>
          </div>
          <ul className="grid gap-3 text-sm">
            <li className="flex items-baseline gap-3 border-b border-[var(--market-line)] py-3">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                {copy.brand.stats.activeProducts}
              </span>
              <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--market-ink)]">
                {products.length}
              </span>
            </li>
            <li className="flex items-baseline gap-3 border-b border-[var(--market-line)] py-3">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                {copy.brand.stats.listingsReviewed}
              </span>
              <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--market-ink)]">
                {copy.brand.stats.listingsReviewedValue}
              </span>
            </li>
            <li className="flex items-baseline gap-3 border-b border-[var(--market-line)] py-3 last:border-b-0">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                {copy.brand.stats.buyerProtection}
              </span>
              <span className="ml-auto text-right text-sm font-semibold tracking-tight text-[var(--market-ink)]">
                {copy.brand.stats.buyerProtectionValue}
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4 border-b border-[var(--market-line)] pb-4">
          <p className="market-kicker text-[10.5px] uppercase tracking-[0.22em]">
            {copy.brand.liveKicker.replace("{brand}", brand.name)}
          </p>
          <Link
            href={`/search?brand=${brand.slug}`}
            className="text-sm font-semibold text-[var(--market-brass)] underline-offset-4 hover:underline"
          >
            {copy.brand.openFullSearch}
          </Link>
        </div>
        {/* TODO(wave3-catalogue): paginate translation — brand product list is
            a catalogue surface; ProductCard reads raw product.title and
            translating every row hits DeepL too often on hot routes. */}
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
