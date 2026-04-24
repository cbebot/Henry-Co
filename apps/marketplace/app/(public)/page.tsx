import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
  WandSparkles,
} from "lucide-react";
import { PublicProofRail, PublicSpotlight } from "@henryco/ui/public-shell";
import {
  CampaignBanner,
  CollectionCard,
  EmptyState,
  ProductCard,
  TrustPassport,
  VendorCard,
} from "@/components/marketplace/shell";
import { getMarketplaceHomeData } from "@/lib/marketplace/data";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { getMarketplacePublicCopy } from "@/lib/public-copy";

export const dynamic = "force-dynamic";

export default async function MarketplaceHomePage() {
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplacePublicCopy(locale);
  const data = await getMarketplaceHomeData();
  const featuredProducts = data.products.filter((item) => item.featured).slice(0, 6);
  const newInProducts = [...data.products].slice(0, 4);
  const featuredCategories = data.categories.filter((item) => item.featured).slice(0, 4);
  const leadVendor = data.vendors[0] ?? null;
  const supportVendor = data.vendors[1] ?? leadVendor;
  const [sellerBodyStart, sellerBodyEnd = ""] = copy.home.sellerBody.split("/sell");
  const kpis = data.kpis.map((item, index) => ({
    ...item,
    label:
      index === 0
        ? copy.kpiLabels.verifiedStores
        : index === 1
          ? copy.kpiLabels.activeListings
          : copy.kpiLabels.trustRating,
    hint:
      index === 0
        ? copy.kpiHints.verifiedStores
        : index === 1
          ? copy.kpiHints.activeListings
          : copy.kpiHints.trustRating,
  }));

  return (
    <div className="mx-auto max-w-[1480px] space-y-12 px-4 py-8 sm:px-6 xl:px-8">
      <section className="grid gap-6 xl:grid-cols-[1.18fr,0.82fr]">
        <article className="market-panel relative overflow-hidden rounded-[2.8rem] p-7 sm:p-10 xl:p-12">
          <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-[radial-gradient(circle_at_center,rgba(154,174,164,0.18),transparent_64%)] xl:block" />
          <div className="relative max-w-4xl space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
              <Sparkles className="h-3.5 w-3.5 text-[var(--market-brass)]" />
              {copy.home.heroKicker}
            </div>
            <div className="space-y-4">
              <h1 className="market-display max-w-4xl text-balance text-[var(--market-paper-white)]">
                {copy.home.heroTitle}
              </h1>
              <p className="max-w-2xl text-pretty text-base leading-8 text-[var(--market-muted)]">
                {copy.home.heroBody}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/search"
                className="market-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                {copy.home.primaryCta} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/sell"
                className="market-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                {copy.home.secondaryCta}
              </Link>
            </div>
          </div>
        </article>

        <article>
          <p className="market-kicker">{copy.home.whyKicker}</p>
          <ul className="mt-5 divide-y divide-[var(--market-line)] border-y border-[var(--market-line)]">
            {copy.home.whyCards.map(({ title, body }, index) => {
              const Icon = [ShieldCheck, Truck, Store][index] ?? ShieldCheck;
              return (
                <li key={title} className="flex gap-4 py-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] text-[var(--market-brass)]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-[var(--market-paper-white)]">
                      {title}
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--market-muted)]">{body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </article>
      </section>

      <PublicProofRail
        density="default"
        variant="rail"
        items={kpis.map((k) => ({ label: k.label, value: k.value, hint: k.hint }))}
      />

      {data.campaigns[0] ? <CampaignBanner campaign={data.campaigns[0]} /> : null}

      {data.products.length === 0 ? (
        <EmptyState
          title={copy.home.emptyTitle}
          body={copy.home.emptyBody}
          ctaHref="/help"
          ctaLabel={copy.home.emptyCta}
        />
      ) : null}

      <section className="grid gap-8 lg:grid-cols-[0.92fr,1.08fr]">
        <div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="market-kicker">{copy.home.categoryKicker}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--market-paper-white)] sm:text-[2.4rem]">
                {copy.home.categoryTitle}
              </h2>
            </div>
            <Link href="/search" className="text-sm font-semibold text-[var(--market-brass)]">
              {copy.home.categoryLink}
            </Link>
          </div>
          <ul className="mt-6 divide-y divide-[var(--market-line)] border-y border-[var(--market-line)]">
            {featuredCategories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/category/${category.slug}`}
                  className="flex items-center justify-between gap-4 py-4 transition hover:bg-[rgba(255,255,255,0.02)]"
                >
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-[var(--market-paper-white)]">
                      {category.name}
                    </h3>
                    <p className="mt-1 max-w-md text-sm leading-relaxed text-[var(--market-muted)]">{category.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--market-muted)]">
                      {category.productCount} listings
                    </span>
                    <ArrowRight className="h-4 w-4 text-[var(--market-brass)]" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="market-panel rounded-[2.2rem] p-6 sm:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="market-kicker">{copy.home.freshKicker}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--market-paper-white)] sm:text-[2.2rem]">
                {copy.home.freshTitle}
              </h2>
            </div>
            <WandSparkles className="h-5 w-5 text-[var(--market-brass)]" />
          </div>
          <ul className="mt-6 divide-y divide-[var(--market-line)]">
            {newInProducts.slice(0, 3).map((product) => (
              <li key={product.slug}>
                <Link
                  href={`/product/${product.slug}`}
                  className="block py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[var(--market-muted)]">
                        {product.categorySlug.replace(/-/g, " ")}
                      </p>
                      <h3 className="mt-1 truncate text-base font-semibold tracking-tight text-[var(--market-paper-white)]">
                        {product.title}
                      </h3>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-[var(--market-brass)]" />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--market-muted)] line-clamp-2">{product.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="market-kicker">{copy.home.featuredKicker}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--market-paper-white)] sm:text-[2.4rem]">
              {copy.home.featuredTitle}
            </h2>
          </div>
          <Link href="/search" className="text-sm font-semibold text-[var(--market-brass)]">
            {copy.home.browseAll}
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.82fr,1.18fr]">
        <div className="space-y-5">
          <div>
            <p className="market-kicker">{copy.home.collectionsKicker}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--market-paper-white)] sm:text-[2.2rem]">
              {copy.home.collectionsTitle}
            </h2>
          </div>
          <div className="grid gap-5">
            {data.collections.map((collection) => (
              <CollectionCard key={collection.slug} collection={collection} copy={copy} />
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <p className="market-kicker">{copy.home.vendorsKicker}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--market-paper-white)] sm:text-[2.2rem]">
              {copy.home.vendorsTitle}
            </h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {data.vendors.map((vendor) => (
              <VendorCard key={vendor.slug} vendor={vendor} copy={copy} />
            ))}
          </div>
        </div>
      </section>

      {leadVendor ? <TrustPassport vendor={leadVendor} copy={copy} /> : null}

      {supportVendor ? (
        <PublicSpotlight
          tone="contrast"
          eyebrow={copy.home.standardsKicker}
          title={copy.home.standardsTitle}
          aside={
            <div className="space-y-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/65">
                  {copy.home.sellerKicker}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">{copy.home.sellerTitle}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">
                  {sellerBodyStart}
                  <Link href="/sell" className="text-[var(--market-brass)] underline-offset-4 hover:underline">/sell</Link>
                  {sellerBodyEnd}
                </p>
              </div>
              <ul className="space-y-2">
                {copy.home.sellerBullets.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/85"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          }
        >
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {copy.home.standardsBullets.map((item) => (
              <li
                key={item}
                className="border-l border-white/15 pl-3 text-sm leading-relaxed text-white/80"
              >
                {item}
              </li>
            ))}
          </ul>
        </PublicSpotlight>
      ) : null}
    </div>
  );
}
