import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { ProductCard, TrustPassport } from "@/components/marketplace/shell";
import { StoreActionsClient } from "@/components/marketplace/store-actions-client";
import { getMarketplaceVendorBySlug } from "@/lib/marketplace/data";

export const dynamic = "force-dynamic";

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getMarketplaceVendorBySlug(slug);
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-[1480px] space-y-14 px-4 py-10 sm:px-6 xl:px-8">
      {/* Editorial passport hero — eyebrow + display + body + CTA + ProofRail */}
      <section className="grid gap-12 xl:grid-cols-[1.1fr,0.9fr]">
        <article>
          <p className="market-kicker">Store passport</p>
          <h1 className="market-display mt-5 max-w-3xl text-balance">{data.vendor.name}</h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--market-muted)] sm:text-lg">
            {data.vendor.description}
          </p>
          <div className="mt-7">
            <StoreActionsClient vendorSlug={data.vendor.slug} />
          </div>
          <dl className="mt-10 grid grid-cols-3 gap-x-6 gap-y-5 border-y border-[var(--market-line)] py-6 sm:flex sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-12">
            <div className="flex flex-col gap-1">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                Trust score
              </dt>
              <dd className="text-[1.7rem] font-semibold leading-tight tracking-tight text-[var(--market-paper-white)] sm:text-[2rem]">
                {data.vendor.trustScore}%
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                Response SLA
              </dt>
              <dd className="text-[1.7rem] font-semibold leading-tight tracking-tight text-[var(--market-paper-white)] sm:text-[2rem]">
                {data.vendor.responseSlaHours}h
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                Followers
              </dt>
              <dd className="text-[1.7rem] font-semibold leading-tight tracking-tight text-[var(--market-paper-white)] sm:text-[2rem]">
                {data.vendor.followersCount}
              </dd>
            </div>
          </dl>
        </article>

        {/* Standards aside — noir gradient with editorial divided list */}
        <aside className="rounded-[2.4rem] border border-[var(--market-line-strong)] bg-[linear-gradient(135deg,#0c0a09_0%,#1a1410_55%,#2a1f17_100%)] px-7 py-9 text-[var(--market-paper-white)] shadow-[0_36px_110px_rgba(17,13,9,0.3)] sm:px-9 sm:py-11">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.32em] text-[var(--market-brass)]">
            Store standards
          </p>
          <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
            {data.vendor.badges.map((badge) => (
              <li
                key={badge}
                className="flex items-baseline gap-3 py-3 text-sm leading-7 text-white/82"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--market-brass)]" />
                <span>{badge}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-l-2 border-[var(--market-brass)]/55 pl-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-white/55">
              Support
            </p>
            <p className="mt-2 max-w-md text-sm leading-7 text-white/72">
              Use HenryCo Marketplace to contact this store. Messages are logged and tied to your
              order reference so every update stays in one place.
            </p>
          </div>
        </aside>
      </section>

      <TrustPassport vendor={data.vendor} />

      {data.reviews.length ? (
        <section>
          <div className="flex items-baseline gap-4">
            <p className="market-kicker">Recent reviews</p>
            <span className="h-px flex-1 bg-[var(--market-line)]" />
          </div>
          <ul className="mt-6 divide-y divide-[var(--market-line)] border-y border-[var(--market-line)]">
            {data.reviews.slice(0, 4).map((review) => (
              <li key={review.id} className="grid gap-5 py-6 lg:grid-cols-[0.3fr,0.7fr]">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-brass)]">
                  {review.verifiedPurchase ? "Verified purchase" : "Review"}
                </p>
                <div>
                  <h3 className="text-[1.15rem] font-semibold leading-snug tracking-tight text-[var(--market-paper-white)] sm:text-[1.25rem]">
                    {review.title}
                  </h3>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--market-muted)]">
                    {review.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="market-kicker">Store catalog</p>
            <h2 className="mt-4 max-w-2xl text-balance text-[1.7rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-paper-white)] sm:text-[2.2rem]">
              Everything currently live from this store.
            </h2>
          </div>
          <Link
            href="/search?verified=1"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--market-brass)] underline-offset-4 hover:underline"
          >
            Explore more verified listings
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {data.products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
