import Link from "next/link";
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
  const vendorPassport = data.vendor.trustPassport;

  return (
    <div className="mx-auto max-w-[1480px] space-y-8 px-4 py-8 sm:px-6 xl:px-8">
      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <article className="market-panel overflow-hidden rounded-[2.5rem] p-8 sm:p-10">
          <p className="market-kicker">Store passport</p>
          <h1 className="market-display mt-5 max-w-4xl">{data.vendor.name}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--market-muted)]">{data.vendor.description}</p>
          <div className="mt-6">
            <StoreActionsClient vendorSlug={data.vendor.slug} />
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="market-soft rounded-[1.5rem] px-5 py-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--market-muted)]">Trust posture</p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-[var(--market-ink)]">{vendorPassport?.score ?? data.vendor.trustScore}</p>
              <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">{vendorPassport?.label || "Store trust score"}</p>
            </div>
            <div className="market-soft rounded-[1.5rem] px-5 py-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--market-muted)]">Response SLA</p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-[var(--market-ink)]">{data.vendor.responseSlaHours}h</p>
            </div>
            <div className="market-soft rounded-[1.5rem] px-5 py-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--market-muted)]">Followers</p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-[var(--market-ink)]">{data.vendor.followersCount}</p>
            </div>
          </div>
        </article>

        <article className="rounded-[2.5rem] border border-[var(--market-line-strong)] bg-[var(--market-noir)] p-8 text-[var(--market-paper-white)] shadow-[0_36px_110px_rgba(17,13,9,0.3)] sm:p-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--market-brass)]">
            Store standards
          </p>
          <div className="mt-6 space-y-4">
            {data.vendor.badges.map((badge) => (
              <div
                key={badge}
                className="rounded-[1.5rem] border border-[color:rgba(255,255,255,0.12)] bg-[color:rgba(255,255,255,0.04)] px-4 py-4 text-sm leading-7 text-[color:rgba(255,255,255,0.72)]"
              >
                {badge}
              </div>
            ))}
          </div>
          {vendorPassport ? (
            <div className="mt-6 rounded-[1.5rem] border border-[color:rgba(255,255,255,0.12)] bg-[color:rgba(255,255,255,0.04)] px-5 py-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[color:rgba(255,255,255,0.56)]">Trust summary</p>
              <p className="mt-3 text-sm leading-7 text-[color:rgba(255,255,255,0.72)]">{vendorPassport.summary}</p>
            </div>
          ) : null}
          <div className="mt-6 rounded-[1.5rem] border border-[color:rgba(255,255,255,0.12)] bg-[color:rgba(255,255,255,0.04)] px-5 py-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[color:rgba(255,255,255,0.56)]">Support</p>
            <p className="mt-3 text-sm text-[color:rgba(255,255,255,0.72)]">{data.vendor.supportEmail}</p>
            <p className="mt-2 text-sm text-[color:rgba(255,255,255,0.72)]">{data.vendor.supportPhone}</p>
          </div>
        </article>
      </section>

      <TrustPassport vendor={data.vendor} />

      {vendorPassport?.warnings.length ? (
        <section className="rounded-[1.9rem] border border-[rgba(255,171,151,0.18)] bg-[rgba(126,33,18,0.08)] px-6 py-5 text-sm leading-7 text-[var(--market-muted)]">
          {vendorPassport.warnings.join(" ")}
        </section>
      ) : null}

      {data.reviews.length ? (
        <section className="grid gap-5 lg:grid-cols-2">
          {data.reviews.slice(0, 2).map((review) => (
            <article key={review.id} className="market-paper rounded-[1.9rem] p-6">
              <p className="market-kicker">{review.verifiedPurchase ? "verified purchase" : "review"}</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--market-paper-white)]">{review.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">{review.body}</p>
            </article>
          ))}
        </section>
      ) : null}

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="market-kicker">Store catalog</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--market-ink)]">
              Everything currently live from this store.
            </h2>
          </div>
          <Link href={`/search?verified=1`} className="text-sm font-semibold text-[var(--market-brass)]">
            Explore more verified listings
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
