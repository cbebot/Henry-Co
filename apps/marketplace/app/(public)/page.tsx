import Link from "next/link";
import {
  CampaignBanner,
  CollectionCard,
  EmptyState,
  KpiGrid,
  ProductCard,
  TrustPassport,
  VendorCard,
} from "@/components/marketplace/shell";
import { getMarketplaceHomeData } from "@/lib/marketplace/data";

export const dynamic = "force-dynamic";

export default async function MarketplaceHomePage() {
  const data = await getMarketplaceHomeData();
  const featuredProducts = data.products.filter((item) => item.featured).slice(0, 6);
  const featuredCategories = data.categories.filter((item) => item.featured).slice(0, 4);
  const leadVendor = data.vendors[0] ?? null;

  return (
    <div className="mx-auto max-w-[1480px] space-y-10 px-4 py-8 sm:px-6 xl:px-8">
      <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <article className="market-panel relative overflow-hidden rounded-[2.5rem] p-8 sm:p-10 xl:p-12">
          <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-[radial-gradient(circle_at_top,rgba(184,150,86,0.28),transparent_62%)] xl:block" />
          <div className="relative max-w-3xl space-y-6">
            <p className="market-kicker">Editorial commerce, premium trust</p>
            <h1 className="market-display max-w-4xl">
              Shop a calmer marketplace with better structure, better trust, and faster decisions.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-[var(--market-muted)]">
              HenryCo Marketplace combines editorial merchandising, verified seller passports, split-order clarity, and cleaner buyer support without the clutter of generic marketplace UX.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/search"
                className="market-button-primary rounded-full px-5 py-3 text-sm font-semibold"
              >
                Explore products
              </Link>
              <Link
                href="/account/seller-application"
                className="market-button-secondary rounded-full px-5 py-3 text-sm font-semibold"
              >
                Start seller application
              </Link>
            </div>
            <div className="grid gap-3 pt-4 sm:grid-cols-3">
              {[
                "Quick-add from any product card",
                "Split-order clarity before checkout",
                "Premium vendor trust surfaces and support escalation",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.4rem] border border-[var(--market-line)] bg-[var(--market-paper-white)] px-4 py-4 text-sm leading-7 text-[var(--market-ink)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="rounded-[2.5rem] border border-[var(--market-line-strong)] bg-[var(--market-noir)] p-8 text-[var(--market-paper-white)] shadow-[0_36px_110px_rgba(17,13,9,0.3)] sm:p-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--market-brass)]">
            Buyer confidence
          </p>
          <h2 className="mt-4 font-[family:var(--font-marketplace-display)] text-[2.5rem] leading-[1.02] tracking-[-0.04em]">
            Fewer doubts before checkout.
          </h2>
          <div className="mt-6 space-y-4">
            {[
              "Verified sellers and HenryCo-stocked inventory are clearly separated.",
              "Delivery windows and payment expectations stay visible, not buried in the flow.",
              "Support, disputes, payouts, and notifications all persist to one unified account trail.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.5rem] border border-[color:rgba(255,255,255,0.12)] bg-[color:rgba(255,255,255,0.04)] px-4 py-4 text-sm leading-7 text-[color:rgba(255,255,255,0.72)]"
              >
                {item}
              </div>
            ))}
          </div>
        </article>
      </section>

      <KpiGrid items={data.kpis} />

      {data.campaigns[0] ? <CampaignBanner campaign={data.campaigns[0]} /> : null}

      {data.products.length === 0 ? (
        <EmptyState
          title="Catalog not populated yet."
          body="Marketplace schema and public surfaces are live. Products and collections appear here only after approved listings are published."
          ctaHref="/help"
          ctaLabel="Contact marketplace support"
        />
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <article className="rounded-[2.2rem] border border-[var(--market-line-strong)] bg-[var(--market-paper-white)] p-6 shadow-[0_24px_70px_rgba(28,24,18,0.06)] sm:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="market-kicker">Featured categories</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--market-ink)]">
                Browse with more context, not more noise.
              </h2>
            </div>
            <Link href="/search" className="text-sm font-semibold text-[var(--market-brass)]">
              Open search
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {featuredCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className="rounded-[1.65rem] border border-[var(--market-line)] bg-[var(--market-bg-elevated)] p-5 transition hover:-translate-y-0.5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--market-muted)]">
                  {category.productCount} listings
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight">{category.name}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{category.description}</p>
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-[2.2rem] border border-[var(--market-line-strong)] bg-[var(--market-paper-white)] p-6 shadow-[0_24px_70px_rgba(28,24,18,0.06)] sm:p-8">
          <p className="market-kicker">Marketplace advantages</p>
          <div className="mt-5 space-y-4">
            {[
              "Quick-add, wishlist, and cart preview stay responsive across the storefront.",
              "Trust passport surfaces response SLA, dispute rate, and fulfillment reliability clearly.",
              "Seller onboarding, moderation, finance, and support are split into cleaner operational surfaces.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-bg-elevated)] px-4 py-4 text-sm font-medium leading-7 text-[var(--market-ink)]"
              >
                {item}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="market-kicker">Featured products</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">Luxury retail polish, marketplace practicality.</h2>
          </div>
          <Link href="/search" className="text-sm font-semibold text-[var(--market-brass)]">
            Browse all
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.82fr,1.18fr]">
        <div className="space-y-5">
          <div>
            <p className="market-kicker">Curated collections</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">Editorial rails that guide decisions.</h2>
          </div>
          <div className="grid gap-5">
            {data.collections.map((collection) => (
              <CollectionCard key={collection.slug} collection={collection} />
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <p className="market-kicker">Trusted stores</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">Verified vendors with clearer accountability.</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {data.vendors.map((vendor) => (
              <VendorCard key={vendor.slug} vendor={vendor} />
            ))}
          </div>
        </div>
      </section>

      {leadVendor ? <TrustPassport vendor={leadVendor} /> : null}
    </div>
  );
}
