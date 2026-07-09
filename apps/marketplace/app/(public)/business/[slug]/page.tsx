import { notFound } from "next/navigation";
import { toBrandName } from "@henryco/config";
import { getBusinessCopy } from "@henryco/i18n/server";
import type { AppLocale } from "@henryco/i18n";

import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { getPublicBusinessProfile, recordBusinessProfileView } from "@/lib/marketplace/business";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: toBrandName(`${slug} · Business · Henry Onyx`) };
}

export default async function PublicBusinessProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, locale] = await Promise.all([params, getMarketplacePublicLocale()]);
  const copy = getBusinessCopy(locale as AppLocale);
  const business = await getPublicBusinessProfile(slug);
  if (!business) notFound();

  // best-effort view telemetry (anonymous viewer on the public storefront)
  await recordBusinessProfileView({ businessId: business.id, viewerUserId: null });

  const verified = Boolean(business.verifiedAt);

  return (
    <div className="mx-auto max-w-[1480px] space-y-14 px-4 py-10 sm:px-6 xl:px-8">
      <section className="grid gap-12 xl:grid-cols-[1.1fr,0.9fr]">
        <article>
          <p className="market-kicker">{toBrandName("Henry Onyx · Business")}</p>
          <h1 className="market-display mt-5">{business.tradingName}</h1>
          <p className="mt-5 text-[var(--market-muted)]">{business.legalName}</p>
          <dl className="mt-8 grid grid-cols-2 gap-6 border-y border-[var(--market-line)] py-6 sm:grid-cols-3">
            <Stat label={copy.profile.country} value={business.country} />
            <Stat
              label={copy.profile.status}
              value={verified ? copy.profile.verified : copy.profile.unverified}
            />
          </dl>
        </article>
        <aside className="rounded-2xl border border-[var(--market-line)] bg-[color-mix(in_srgb,var(--market-paper-white)_4%,transparent)] p-6">
          <p className="market-kicker">{copy.profile.verified}</p>
          <p className="mt-3 text-sm text-[var(--market-muted)]">
            {verified ? copy.profile.verified : copy.profile.unverified}
          </p>
        </aside>
      </section>

      <section className="space-y-6">
        <div className="flex items-baseline gap-4">
          <p className="market-kicker">{copy.profile.listingsHeading}</p>
          <span className="h-px flex-1 bg-[var(--market-line)]" />
        </div>
        <p className="text-sm text-[var(--market-muted)]">{copy.profile.emptyListings}</p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-[var(--market-muted)]">{label}</dt>
      <dd className="mt-1 text-lg text-[var(--market-paper-white)]">{value}</dd>
    </div>
  );
}
