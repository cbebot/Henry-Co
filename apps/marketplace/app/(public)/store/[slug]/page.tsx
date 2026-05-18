import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageSquare } from "lucide-react";
import { notFound } from "next/navigation";
import { resolveLocalizedDynamicField } from "@henryco/i18n/server";
import { ProductCard, TrustPassport } from "@/components/marketplace/shell";
import { StoreActionsClient } from "@/components/marketplace/store-actions-client";
import { getMarketplaceVendorBySlug } from "@/lib/marketplace/data";
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
  const data = await getMarketplaceVendorBySlug(slug);
  const storeName = data?.vendor.name ?? slug;

  return {
    title: copy.store.metadataTitle.replace("{store}", storeName),
    description: data?.vendor.description
      ? copy.store.metadataDescription.replace("{store}", storeName)
      : copy.store.metadataDescriptionFallback,
  };
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, locale] = await Promise.all([params, getMarketplacePublicLocale()]);
  const copy = getMarketplacePublicCopy(locale);
  const data = await getMarketplaceVendorBySlug(slug);
  if (!data) notFound();

  // Store name is a proper noun and stays as-is; the marketing description is
  // the seller's story and is the field non-EN buyers most benefit from
  // having translated.
  const localizedVendorDescription = await resolveLocalizedDynamicField({
    record: data.vendor as unknown as Record<string, unknown>,
    field: "description",
    locale,
    fallback: data.vendor.description ?? "",
    machineTranslate: locale !== "en",
  });

  const supportSubject = copy.store.support.subjectTemplate.replace("{store}", data.vendor.name);
  const helpHref = `/help?vendor=${encodeURIComponent(data.vendor.slug)}&subject=${encodeURIComponent(
    supportSubject,
  )}&return_to=${encodeURIComponent(`/store/${data.vendor.slug}`)}`;

  return (
    <div className="mx-auto max-w-[1480px] space-y-14 px-4 py-10 sm:px-6 xl:px-8">
      {/* Editorial passport hero — eyebrow + display + body + CTA + ProofRail */}
      <section className="grid gap-12 xl:grid-cols-[1.1fr,0.9fr]">
        <article>
          <p className="market-kicker">{copy.store.hero.eyebrow}</p>
          <h1 className="market-display mt-5 max-w-3xl text-balance">{data.vendor.name}</h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-[1.7] text-[var(--market-muted)] sm:text-lg">
            {localizedVendorDescription || copy.store.hero.bodyFallback}
          </p>
          <div className="mt-7">
            <StoreActionsClient vendorSlug={data.vendor.slug} />
          </div>
          <dl className="mt-10 grid grid-cols-3 gap-x-6 gap-y-5 border-y border-[var(--market-line)] py-6 sm:flex sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-12">
            <div className="flex flex-col gap-1">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                {copy.store.stats.trustScore}
              </dt>
              <dd className="text-[1.7rem] font-semibold leading-tight tracking-tight text-[var(--market-paper-white)] sm:text-[2rem]">
                {data.vendor.trustScore}%
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                {copy.store.stats.responseSla}
              </dt>
              <dd className="text-[1.7rem] font-semibold leading-tight tracking-tight text-[var(--market-paper-white)] sm:text-[2rem]">
                {data.vendor.responseSlaHours}
                {copy.store.stats.responseSlaSuffix}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                {copy.store.stats.followers}
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
            {copy.store.standards.eyebrow}
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
              {copy.store.support.eyebrow}
            </p>
            <p className="mt-2 max-w-md text-sm leading-7 text-white/72">
              <Link
                href={helpHref}
                className="font-semibold text-[var(--market-brass)] underline-offset-4 outline-none transition hover:underline focus-visible:underline focus-visible:ring-2 focus-visible:ring-[var(--market-brass)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
              >
                {copy.store.support.contactLinkLabel}
              </Link>
              {copy.store.support.contactBodySuffix}
            </p>
            <Link
              href={helpHref}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--market-paper-white)] transition hover:bg-white/[0.08] motion-safe:hover:-translate-y-[1px] motion-safe:hover:shadow-[0_12px_28px_rgba(178,134,59,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--market-brass)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <MessageSquare className="h-3.5 w-3.5 text-[var(--market-brass)]" aria-hidden />
              {copy.store.support.ctaLabel}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </aside>
      </section>

      <TrustPassport vendor={data.vendor} />

      {data.reviews.length ? (
        <section>
          <div className="flex items-baseline gap-4">
            <p className="market-kicker">{copy.store.reviews.eyebrow}</p>
            <span className="h-px flex-1 bg-[var(--market-line)]" />
          </div>
          {/* TODO(wave3-catalogue): paginate translation — review list carries
              buyer voice; translate per-row via client-side fetch on demand. */}
          <ul className="mt-6 divide-y divide-[var(--market-line)] border-y border-[var(--market-line)]">
            {data.reviews.slice(0, 4).map((review) => (
              <li key={review.id} className="grid gap-5 py-6 lg:grid-cols-[0.3fr,0.7fr]">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-brass)]">
                  {review.verifiedPurchase ? copy.store.reviews.verifiedPurchase : copy.store.reviews.review}
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
            <p className="market-kicker">{copy.store.catalog.kicker}</p>
            <h2 className="mt-4 max-w-2xl text-balance text-[1.7rem] font-semibold leading-[1.15] tracking-[-0.015em] text-[var(--market-paper-white)] sm:text-[2.2rem]">
              {copy.store.catalog.title}
            </h2>
          </div>
          <Link
            href="/search?verified=1"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--market-brass)] underline-offset-4 hover:underline"
          >
            {copy.store.catalog.exploreLink}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {data.products.length ? (
          /* TODO(wave3-catalogue): paginate translation — store catalogue is a
             list surface; ProductCard reads raw product.title / product.summary
             and translating every row on hot routes blows up DeepL quota. */
          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {data.products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.8rem] border border-dashed border-[var(--market-line)] px-6 py-10 text-center">
            <p className="text-[1.05rem] font-semibold tracking-tight text-[var(--market-paper-white)]">
              {copy.store.catalog.emptyTitle}
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">
              {copy.store.catalog.emptyBody}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
