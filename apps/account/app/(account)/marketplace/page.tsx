import { RouteLiveRefresh } from "@henryco/ui";
import { getAccountCopy } from "@henryco/i18n/server";
import { formatAccountTemplate } from "@henryco/i18n";
import { henryDomain } from "@henryco/config";

import { requireAccountUser } from "@/lib/auth";
import {
  getDivisionActivity,
  getMarketplaceDivisionSummary,
} from "@/lib/division-data";
import { getAccountAppLocale } from "@/lib/locale-server";

import "@/components/marketplace/styles.css";
import { MarketplaceHero } from "@/components/marketplace/MarketplaceHero";
import { MarketplaceMatters } from "@/components/marketplace/MarketplaceMatters";
import { MarketplaceOrders } from "@/components/marketplace/MarketplaceOrders";
import { MarketplaceActivity } from "@/components/marketplace/MarketplaceActivity";
import {
  heroState,
  marketStats,
  toApplicationRow,
  toDisputeRows,
  toMarketActivityRows,
  toMembershipRows,
  toOrderRows,
  toPayoutRows,
} from "@/components/marketplace/helpers";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getAccountAppLocale();
  const copy = getAccountCopy(locale).divisionMarketplace;
  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
  };
}

export default async function MarketplacePage() {
  const [locale, user] = await Promise.all([getAccountAppLocale(), requireAccountUser()]);
  const copy = getAccountCopy(locale).divisionMarketplace;

  const [summary, activityRaw] = await Promise.all([
    getMarketplaceDivisionSummary(user.id),
    getDivisionActivity(user.id, "marketplace", 20, locale),
  ]);

  const orders = toOrderRows((summary.orders ?? []) as Array<Record<string, unknown>>);
  const disputes = toDisputeRows((summary.disputes ?? []) as Array<Record<string, unknown>>);
  const application = toApplicationRow(summary.application as Record<string, unknown> | null);
  const memberships = toMembershipRows((summary.memberships ?? []) as Array<Record<string, unknown>>);
  const payouts = toPayoutRows((summary.payouts ?? []) as Array<Record<string, unknown>>);
  const stats = marketStats({ orders, disputes, application, memberships, payouts });
  const activityRows = toMarketActivityRows(activityRaw);

  const marketplaceOrigin = henryDomain("marketplace");

  // Resolve hero copy from i18n slice.
  const state = heroState(stats);
  let heroHeadline: string;
  let heroBlurb: string;
  let heroCtaPrimaryLabel: string;
  let heroCtaSecondaryLabel: string;
  let heroCtaPrimaryHref: string;
  let heroCtaSecondaryHref: string;

  if (state === "empty") {
    const s = copy.hero.state.empty;
    heroHeadline = s.headline;
    heroBlurb = s.blurb;
    heroCtaPrimaryLabel = s.ctaPrimary;
    heroCtaSecondaryLabel = s.ctaSecondary;
    heroCtaPrimaryHref = marketplaceOrigin;
    heroCtaSecondaryHref = `${marketplaceOrigin}/sell`;
  } else if (state === "attention") {
    const s = copy.hero.state.attention;
    const n = stats.openDisputes + stats.issueOrders;
    heroHeadline = formatAccountTemplate(
      n === 1 ? s.headlineTemplateSingular : s.headlineTemplatePlural,
      { count: n },
    );
    heroBlurb = s.blurb;
    heroCtaPrimaryLabel = s.ctaPrimary;
    heroCtaSecondaryLabel = s.ctaSecondary;
    heroCtaPrimaryHref = "#marketplace-matters";
    heroCtaSecondaryHref = marketplaceOrigin;
  } else if (state === "active") {
    if (stats.payoutsPending > 0 && stats.inFlight === 0) {
      const s = copy.hero.state.activePayouts;
      const n = stats.payoutsPending;
      heroHeadline = formatAccountTemplate(
        n === 1 ? s.headlineTemplateSingular : s.headlineTemplatePlural,
        { count: n },
      );
      heroBlurb = s.blurb;
      heroCtaPrimaryLabel = s.ctaPrimary;
      heroCtaSecondaryLabel = s.ctaSecondary;
      heroCtaPrimaryHref = `${marketplaceOrigin}/seller`;
      heroCtaSecondaryHref = marketplaceOrigin;
    } else {
      const s = copy.hero.state.activeOrders;
      const n = stats.inFlight;
      heroHeadline = formatAccountTemplate(
        n === 1 ? s.headlineTemplateSingular : s.headlineTemplatePlural,
        { count: n },
      );
      heroBlurb = s.blurb;
      heroCtaPrimaryLabel = s.ctaPrimary;
      heroCtaSecondaryLabel = s.ctaSecondary;
      heroCtaPrimaryHref = marketplaceOrigin;
      heroCtaSecondaryHref = `${marketplaceOrigin}/sell`;
    }
  } else {
    // calm
    const s = stats.sellerActive ? copy.hero.state.calmSeller : copy.hero.state.calmBuyer;
    const n = stats.totalOrders;
    heroHeadline = formatAccountTemplate(
      n === 1 ? s.headlineTemplateSingular : s.headlineTemplatePlural,
      { count: n },
    );
    heroBlurb = s.blurb;
    heroCtaPrimaryLabel = s.ctaPrimary;
    heroCtaSecondaryLabel = s.ctaSecondary;
    heroCtaPrimaryHref = marketplaceOrigin;
    heroCtaSecondaryHref = stats.sellerActive
      ? `${marketplaceOrigin}/seller`
      : `${marketplaceOrigin}/sell`;
  }

  const ordersMeta =
    orders.length === 0
      ? copy.sections.orders.empty
      : formatAccountTemplate(
          orders.length === 1
            ? copy.sections.orders.metaTemplateSingular
            : copy.sections.orders.metaTemplatePlural,
          { count: orders.length },
        );
  const activityMeta =
    activityRows.length === 0
      ? copy.sections.activity.empty
      : formatAccountTemplate(
          activityRows.length === 1
            ? copy.sections.activity.metaTemplateSingular
            : copy.sections.activity.metaTemplatePlural,
          { count: activityRows.length },
        );

  return (
    <div className="acct-mkt acct-fade-in">
      <RouteLiveRefresh />
      <MarketplaceHero
        stats={stats}
        labels={{
          eyebrow: copy.hero.eyebrow,
          ariaLabel: copy.hero.ariaLabel,
          sideAriaLabel: copy.hero.sideAriaLabel,
          sideKicker: copy.hero.sideKicker,
          sideTitle: copy.hero.sideTitle,
          sideBody: copy.hero.sideBody,
          breakdownLabel: copy.hero.breakdownLabel,
          breakdownAriaLabel: copy.hero.breakdownAriaLabel,
          tilesAriaLabel: copy.hero.tilesAriaLabel,
          tileLabels: copy.hero.tileLabels,
          tileFoot: copy.hero.tileFoot,
          breakdownLabels: copy.hero.breakdownLabels,
          applicationStatusLabels: copy.applicationStatusLabels,
          headline: heroHeadline,
          blurb: heroBlurb,
          ctaPrimary: { label: heroCtaPrimaryLabel, href: heroCtaPrimaryHref },
          ctaSecondary: { label: heroCtaSecondaryLabel, href: heroCtaSecondaryHref },
        }}
      />

      <section id="marketplace-matters" aria-labelledby="acct-mkt-matters">
        <div className="acct-mkt__section-head">
          <h2 id="acct-mkt-matters" className="acct-mkt__section-title">
            {copy.sections.matters.title}
          </h2>
          <span className="acct-mkt__section-meta">{copy.sections.matters.meta}</span>
        </div>
        {stats.openDisputes === 0 &&
        stats.payoutsPending === 0 &&
        (!stats.applicationStatus || stats.applicationStatus.toLowerCase() === "approved") ? (
          <div className="acct-mkt__empty">
            <strong>{copy.sections.matters.emptyTitle}</strong>
            {copy.sections.matters.emptyBody}
          </div>
        ) : (
          <MarketplaceMatters
            disputes={disputes}
            application={application}
            payouts={payouts}
            marketplaceOrigin={marketplaceOrigin}
            labels={{
              ariaLabel: copy.sections.matters.ariaLabel,
              disputes: copy.matters.disputes,
              application: copy.matters.application,
              payouts: copy.matters.payouts,
              applicationStatusLabels: copy.applicationStatusLabels,
              dash: copy.formatLabels.dash,
            }}
          />
        )}
      </section>

      <section aria-labelledby="acct-mkt-orders">
        <div className="acct-mkt__section-head">
          <h2 id="acct-mkt-orders" className="acct-mkt__section-title">
            {copy.sections.orders.title}
          </h2>
          <span className="acct-mkt__section-meta">{ordersMeta}</span>
        </div>
        {orders.length === 0 ? (
          <div className="acct-mkt__empty">
            <strong>{copy.sections.orders.emptyTitle}</strong>
            {copy.sections.orders.emptyBody}
          </div>
        ) : (
          <MarketplaceOrders
            orders={orders}
            marketplaceOrigin={marketplaceOrigin}
            labels={{
              ariaLabel: copy.sections.orders.ariaLabel,
              rowTitleTemplate: copy.orders.rowTitleTemplate,
              rowSubTemplate: copy.orders.rowSubTemplate,
              rowAriaLabelTemplate: copy.orders.rowAriaLabelTemplate,
              statusFallbackDraft: copy.orders.statusFallbackDraft,
              statusValueLabels: copy.statusValueLabels,
              dash: copy.formatLabels.dash,
            }}
          />
        )}
      </section>

      <section aria-labelledby="acct-mkt-activity">
        <div className="acct-mkt__section-head">
          <h2 id="acct-mkt-activity" className="acct-mkt__section-title">
            {copy.sections.activity.title}
          </h2>
          <span className="acct-mkt__section-meta">{activityMeta}</span>
        </div>
        {activityRows.length === 0 ? (
          <div className="acct-mkt__empty">
            <strong>{copy.sections.activity.emptyTitle}</strong>
            {copy.sections.activity.emptyBody}
          </div>
        ) : (
          <MarketplaceActivity
            activity={activityRows}
            ariaLabel={copy.sections.activity.ariaLabel}
            dash={copy.formatLabels.dash}
          />
        )}
      </section>
    </div>
  );
}
