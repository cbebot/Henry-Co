import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
  WandSparkles,
} from "lucide-react";
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
import { createDivisionMetadata } from "@henryco/config";

export const dynamic = "force-dynamic";
export const metadata: Metadata = createDivisionMetadata("marketplace", {
  path: "/",
});

export default async function MarketplaceHomePage() {
  const data = await getMarketplaceHomeData();
  const featuredProducts = data.products.filter((item) => item.featured).slice(0, 6);
  const newInProducts = [...data.products].slice(0, 4);
  const featuredCategories = data.categories.filter((item) => item.featured).slice(0, 4);
  const leadVendor = data.vendors[0] ?? null;
  const supportVendor = data.vendors[1] ?? leadVendor;

  return (
    <div className="mx-auto max-w-[1480px] space-y-10 px-4 py-8 sm:px-6 xl:px-8">
      <section className="grid gap-6 xl:grid-cols-[1.18fr,0.82fr]">
        <article className="market-panel relative overflow-hidden rounded-[2.8rem] p-7 sm:p-10 xl:p-12">
          <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-[radial-gradient(circle_at_center,rgba(154,174,164,0.18),transparent_64%)] xl:block" />
          <div className="relative max-w-4xl space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
              <Sparkles className="h-3.5 w-3.5 text-[var(--market-brass)]" />
              Refined premium marketplace
            </div>
            <div className="space-y-4">
              <h1 className="market-display max-w-5xl text-[var(--market-paper-white)]">
                Buy from verified stores without the noise, clutter, or trust guesswork.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-[var(--market-muted)]">
                HenryCo Marketplace turns multi-vendor commerce into a calmer experience: cleaner discovery,
                quick-add from every card, split-order clarity, stronger seller passports, and a single
                HenryCo account for orders, payments, reviews, and support.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/search"
                className="market-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                Explore the catalog <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/sell"
                className="market-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                Sell on HenryCo
              </Link>
            </div>
            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              {[
                {
                  title: "Quick-add everywhere",
                  body: "Small card-level cart controls, instant mini-cart updates, and no clumsy refresh loops.",
                },
                {
                  title: "Verified trust rails",
                  body: "Seller passports, delivery promises, review quality, and stock ownership stay easy to read.",
                },
                {
                  title: "One account, less friction",
                  body: "Orders, payments, wishlist, follows, and notifications stay together in one HenryCo account.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.55rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-4"
                >
                  <p className="text-sm font-semibold text-[var(--market-paper-white)]">{item.title}</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="market-paper rounded-[2.8rem] p-7 sm:p-8">
          <p className="market-kicker">Why this feels different</p>
          <div className="mt-5 space-y-4">
            {[
              {
                icon: ShieldCheck,
                title: "Trust is visible before payment",
                body: "Verification level, dispute rate, support responsiveness, and fulfillment reliability stay close to the buying decision.",
              },
              {
                icon: Truck,
                title: "Split-order clarity stays readable",
                body: "When inventory comes from different vendors or HenryCo stock, delivery segmentation stays obvious instead of becoming checkout confusion.",
              },
              {
                icon: Store,
                title: "Sellers are curated, not dumped into a grid",
                body: "The marketplace favors stronger stores, cleaner listings, and better post-order accountability over catalog sprawl.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-[1.65rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-5"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--market-line)] bg-[rgba(255,255,255,0.05)] text-[var(--market-brass)]">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <h2 className="mt-4 text-xl font-semibold tracking-tight text-[var(--market-paper-white)]">
                  {title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{body}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <KpiGrid items={data.kpis} />

      {data.campaigns[0] ? <CampaignBanner campaign={data.campaigns[0]} /> : null}

      {data.products.length === 0 ? (
        <EmptyState
          title="The catalog is being prepared."
          body="Approved products, collections, and campaigns will appear here as they go live."
          ctaHref="/help"
          ctaLabel="Contact marketplace support"
        />
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[0.92fr,1.08fr]">
        <article className="market-paper rounded-[2.2rem] p-6 sm:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="market-kicker">Category discovery</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--market-paper-white)]">
                Discover by mood, room, and trust level.
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
                className="rounded-[1.7rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-5 transition hover:-translate-y-0.5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--market-muted)]">
                  {category.productCount} listings
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--market-paper-white)]">
                  {category.name}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{category.description}</p>
              </Link>
            ))}
          </div>
        </article>

        <article className="market-panel rounded-[2.2rem] p-6 sm:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="market-kicker">Fresh approvals</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--market-paper-white)]">
                New in the marketplace right now.
              </h2>
            </div>
            <WandSparkles className="h-5 w-5 text-[var(--market-brass)]" />
          </div>
          <div className="mt-6 grid gap-4">
            {newInProducts.slice(0, 3).map((product) => (
              <Link
                key={product.slug}
                href={`/product/${product.slug}`}
                className="rounded-[1.6rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">
                      {product.categorySlug.replace(/-/g, " ")}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold tracking-tight text-[var(--market-paper-white)]">
                      {product.title}
                    </h3>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[var(--market-brass)]" />
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{product.summary}</p>
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="market-kicker">Featured products</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--market-paper-white)]">
              Premium cards, instant carting, and cleaner buying signals.
            </h2>
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
            <p className="market-kicker">Editorial collections</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--market-paper-white)]">
              Curated rails that guide decisions without shouting.
            </h2>
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
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--market-paper-white)]">
              Verified vendors with clearer accountability.
            </h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {data.vendors.map((vendor) => (
              <VendorCard key={vendor.slug} vendor={vendor} />
            ))}
          </div>
        </div>
      </section>

      {leadVendor ? <TrustPassport vendor={leadVendor} /> : null}

      {supportVendor ? (
        <section className="grid gap-6 xl:grid-cols-[1fr,0.94fr]">
          <article className="market-panel rounded-[2.2rem] p-6 sm:p-8">
            <p className="market-kicker">Marketplace standards</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-[var(--market-paper-white)]">
              Built for trust, clarity, and a calmer buying experience.
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                "Seller applications, moderation, and approvals are reviewed through dedicated HenryCo review lanes.",
                "Order updates, reviews, support, and payments stay connected to the same buyer account.",
                "Support, payment review, and delivery operations stay organized so responses remain consistent.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.55rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-4 text-sm leading-7 text-[var(--market-muted)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </article>

          <article className="market-paper rounded-[2.2rem] p-6 sm:p-8">
            <p className="market-kicker">Seller quality</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--market-paper-white)]">
              Serious sellers start inside their HenryCo account.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--market-muted)]">
              Public visitors can learn about selling on <Link href="/sell" className="text-[var(--market-brass)]">/sell</Link>, while the application, draft progress, review updates, and approval status stay inside the seller account experience.
            </p>
            <div className="mt-5 grid gap-3">
              {[
                "Draft saving and progress visibility",
                "Private document handling in the right place",
                "Clear approval updates for every seller",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.35rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.04)] px-4 py-4 text-sm font-medium text-[var(--market-paper-white)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : null}
    </div>
  );
}
