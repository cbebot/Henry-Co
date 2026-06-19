import { notFound } from "next/navigation";
import { toBrandName } from "@henryco/config";
import { getBusinessCopy } from "@henryco/i18n/server";
import type { AppLocale } from "@henryco/i18n";
import { HeroCard, DivisionLanding } from "@henryco/dashboard-shell/surfaces";

import { requireAccountUser } from "@/lib/auth";
import { getAccountAppLocale } from "@/lib/locale-server";
import { getBusinessInsights, getBusinessMembershipBySlug } from "@/lib/business";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: toBrandName(`Insights · ${slug} · HenryCo`) };
}

export default async function BusinessInsightsPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, user, locale] = await Promise.all([
    params,
    requireAccountUser(),
    getAccountAppLocale(),
  ]);
  void user;
  const copy = getBusinessCopy(locale as AppLocale);
  const membership = await getBusinessMembershipBySlug(slug);
  if (!membership) notFound();

  const insights = await getBusinessInsights(membership.business.id);

  const tiles: ReadonlyArray<{ label: string; value: number }> = [
    { label: copy.insights.tiles.orders, value: insights.orders },
    { label: copy.insights.tiles.bookings, value: insights.bookings },
    { label: copy.insights.tiles.jobPosts, value: insights.jobPosts },
    { label: copy.insights.tiles.storefrontViews, value: insights.profileViews },
  ];

  return (
    <DivisionLanding
      hero={
        <HeroCard
          variant="paired"
          tone={insights.hasStream ? "active" : "empty"}
          eyebrow={membership.business.tradingName || membership.business.legalName}
          headline={copy.insights.title}
          blurb={copy.insights.subtitle}
          ariaLabel={copy.insights.title}
          tiles={[{ label: copy.insights.rangeAllTime, value: insights.hasStream ? "—" : copy.insights.noDataYet }]}
          side={{ kicker: copy.insights.rangeAllTime, title: copy.insights.title, body: copy.insights.subtitle }}
        />
      }
      sections={[
        {
          id: "insights-tiles",
          title: copy.insights.title,
          meta: copy.insights.rangeAllTime,
          content: !insights.hasStream ? (
            // V3-08 truth rule: empty stream is "no data yet", not a misleading zero.
            <p className="text-sm text-[color:var(--hc-text-muted,#6b7280)]">{copy.insights.noDataYet}</p>
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {tiles.map((tile) => (
                <div
                  key={tile.label}
                  className="rounded-lg border border-[color:var(--hc-border,#e5e7eb)] p-4"
                >
                  <dt className="text-xs text-[color:var(--hc-text-muted,#6b7280)]">{tile.label}</dt>
                  <dd className="mt-1 text-2xl font-semibold text-[color:var(--hc-text,#111827)]">
                    {tile.value > 0 ? tile.value : copy.insights.noActivity}
                  </dd>
                </div>
              ))}
            </dl>
          ),
        },
      ]}
    />
  );
}
