import { RouteLiveRefresh } from "@henryco/ui";
import { getAccountCopy } from "@henryco/i18n/server";
import { formatAccountTemplate } from "@henryco/i18n";
import { henryDomain } from "@henryco/config";
import {
  HeroCard,
  EmptyStateCard,
  NextStepRow,
  DivisionLanding,
  type HeroCardTile,
  type HeroCardBreakdownRow,
} from "@henryco/dashboard-shell/surfaces";

import { requireAccountUser } from "@/lib/auth";
import {
  getDivisionActivity,
  getMarketplaceDivisionSummary,
} from "@/lib/division-data";
import { getAccountAppLocale } from "@/lib/locale-server";

import "@/components/marketplace/styles.css";
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
  formatNaira,
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

/**
 * Marketplace landing.
 *
 * ACCOUNT-PREMIUM-01 (session 2, Phase 2B). Lifts MarketplaceHero into the
 * shared <HeroCard variant="paired" /> primitive, switches sections through
 * <DivisionLanding>, and surfaces a NextStepRow when there is a dispute or
 * pending payout that needs the user's attention.
 */
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

  // ── Resolve hero copy from i18n slice ─────────────────────────────
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

  // ── HeroCard tiles ───────────────────────────────────────────────
  const localizeApplicationStatus = (raw: string | null): string => {
    if (!raw) return "";
    const key = raw.toLowerCase();
    const labels = copy.applicationStatusLabels as Record<string, string>;
    return labels[key] ?? raw.replace(/_/g, " ");
  };

  const storeFoot = stats.sellerActive
    ? stats.storeName
      ? formatAccountTemplate(copy.hero.tileFoot.storeActiveWithNameTemplate, {
          name: stats.storeName,
        })
      : copy.hero.tileFoot.storeActiveNoName
    : stats.applicationStatus
      ? formatAccountTemplate(copy.hero.tileFoot.storeApplicationTemplate, {
          status: localizeApplicationStatus(stats.applicationStatus),
        })
      : copy.hero.tileFoot.storeIdle;

  const ordersFoot =
    stats.totalOrders === 0
      ? copy.hero.tileFoot.ordersEmpty
      : stats.inFlight > 0
        ? formatAccountTemplate(copy.hero.tileFoot.ordersInMotionTemplate, {
            inFlight: stats.inFlight,
            delivered: stats.delivered,
          })
        : formatAccountTemplate(copy.hero.tileFoot.ordersDeliveredTemplate, {
            delivered: stats.delivered,
          });

  const disputesFoot =
    stats.openDisputes + stats.resolvingDisputes === 0
      ? copy.hero.tileFoot.disputesClear
      : formatAccountTemplate(copy.hero.tileFoot.disputesActiveTemplate, {
          open: stats.openDisputes,
          resolving: stats.resolvingDisputes,
        });

  const payoutsFoot =
    stats.payoutsPending === 0
      ? stats.payoutsPaid > 0
        ? formatAccountTemplate(copy.hero.tileFoot.payoutsSettledTemplate, {
            count: stats.payoutsPaid,
          })
        : copy.hero.tileFoot.payoutsEmptyNoneSettled
      : formatAccountTemplate(copy.hero.tileFoot.payoutsPendingTemplate, {
          amount: formatNaira(stats.payoutsPendingKobo),
        });

  const tiles: ReadonlyArray<HeroCardTile> = [
    {
      label: copy.hero.tileLabels.orders,
      value: stats.totalOrders,
      foot: ordersFoot,
      tone: stats.inFlight > 0 ? "active" : "default",
    },
    {
      label: copy.hero.tileLabels.disputes,
      value: stats.openDisputes + stats.resolvingDisputes,
      foot: disputesFoot,
      tone: stats.openDisputes > 0 ? "warning" : "default",
    },
    {
      label: copy.hero.tileLabels.store,
      value: stats.sellerActive ? "✓" : "—",
      foot: storeFoot,
    },
    {
      label: copy.hero.tileLabels.payouts,
      value: stats.payoutsPending,
      foot: payoutsFoot,
      tone: stats.payoutsPending > 0 ? "warning" : "default",
    },
  ];

  const breakdownAll: ReadonlyArray<HeroCardBreakdownRow> = [
    { label: copy.hero.breakdownLabels.inMotion, count: stats.inFlight, color: "var(--acct-gold)" },
    { label: copy.hero.breakdownLabels.openDisputes, count: stats.openDisputes, color: "var(--acct-red)" },
    { label: copy.hero.breakdownLabels.delivered, count: stats.delivered, color: "var(--acct-green)" },
    { label: copy.hero.breakdownLabels.pendingPayouts, count: stats.payoutsPending, color: "var(--acct-blue)" },
  ];
  const breakdown = breakdownAll.filter((row) => row.count > 0);

  const heroTone: "calm" | "active" | "attention" | "empty" =
    state === "empty"
      ? "empty"
      : state === "attention"
        ? "attention"
        : state === "active"
          ? "active"
          : "calm";

  // ── NextStepRow picker — dispute first, then pending payout ───────
  let nextStep: React.ReactNode = null;
  if (stats.openDisputes > 0 && disputes.length > 0) {
    const topDispute = disputes.find((d) => {
      const s = String(d.status || "").toLowerCase();
      return ["open", "filed", "evidence_required"].includes(s);
    }) ?? disputes[0];
    const disputesTitle = formatAccountTemplate(
      stats.openDisputes === 1
        ? copy.matters.disputes.titleTemplateSingular
        : copy.matters.disputes.titleTemplatePlural,
      { count: stats.openDisputes },
    );
    nextStep = (
      <NextStepRow
        tone="attention"
        kicker={copy.matters.disputes.kicker}
        title={
          topDispute.orderNo
            ? `${disputesTitle} · ${topDispute.orderNo}`
            : disputesTitle
        }
        detail={topDispute.disputeNo ?? copy.matters.disputes.bodyFallback}
        cta={{
          label: copy.matters.disputes.cta,
          href: "#marketplace-matters",
        }}
      />
    );
  } else if (stats.payoutsPending > 0) {
    const topPayout = payouts.find((p) => {
      const s = String(p.status || "").toLowerCase();
      return !["paid", "settled", "completed", "rejected", "cancelled", "failed"].includes(s);
    }) ?? payouts[0];
    const payoutsTitle = formatAccountTemplate(copy.matters.payouts.titleTemplate, {
      count: stats.payoutsPending,
    });
    nextStep = (
      <NextStepRow
        tone="attention"
        kicker={copy.matters.payouts.kicker}
        title={
          topPayout?.reference
            ? `${payoutsTitle} · ${topPayout.reference}`
            : payoutsTitle
        }
        detail={
          topPayout
            ? formatNaira(topPayout.amount)
            : formatAccountTemplate(
                stats.payoutsPending === 1
                  ? copy.matters.payouts.bodyTemplateSingular
                  : copy.matters.payouts.bodyTemplatePlural,
                { count: stats.payoutsPending },
              )
        }
        cta={{
          label: copy.matters.payouts.cta,
          href: `${marketplaceOrigin}/seller`,
        }}
      />
    );
  }

  // ── Section metas ────────────────────────────────────────────────
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

  const mattersClear =
    stats.openDisputes === 0 &&
    stats.payoutsPending === 0 &&
    (!stats.applicationStatus || stats.applicationStatus.toLowerCase() === "approved");

  const sections = [
    {
      id: "marketplace-matters",
      title: copy.sections.matters.title,
      meta: copy.sections.matters.meta,
      content: mattersClear ? (
        <EmptyStateCard
          kicker={copy.sections.matters.title}
          title={copy.sections.matters.emptyTitle}
          body={copy.sections.matters.emptyBody}
        />
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
      ),
    },
    {
      id: "marketplace-orders",
      title: copy.sections.orders.title,
      meta: ordersMeta,
      content:
        orders.length === 0 ? (
          <EmptyStateCard
            kicker={copy.sections.orders.title}
            title={copy.sections.orders.emptyTitle}
            body={copy.sections.orders.emptyBody}
            cta={{ label: copy.hero.state.empty.ctaPrimary, href: marketplaceOrigin }}
          />
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
        ),
    },
    {
      id: "marketplace-activity",
      title: copy.sections.activity.title,
      meta: activityMeta,
      content:
        activityRows.length === 0 ? (
          <EmptyStateCard
            kicker={copy.sections.activity.title}
            title={copy.sections.activity.emptyTitle}
            body={copy.sections.activity.emptyBody}
          />
        ) : (
          <MarketplaceActivity
            activity={activityRows}
            ariaLabel={copy.sections.activity.ariaLabel}
            dash={copy.formatLabels.dash}
          />
        ),
    },
  ];

  return (
    <DivisionLanding
      className="acct-mkt acct-fade-in"
      hero={
        <HeroCard
          variant="paired"
          tone={heroTone}
          eyebrow={copy.hero.eyebrow}
          headline={heroHeadline}
          blurb={heroBlurb}
          ariaLabel={copy.hero.ariaLabel}
          ariaTilesLabel={copy.hero.tilesAriaLabel}
          ctaPrimary={{ label: heroCtaPrimaryLabel, href: heroCtaPrimaryHref }}
          ctaSecondary={{ label: heroCtaSecondaryLabel, href: heroCtaSecondaryHref }}
          tiles={tiles}
          side={{
            kicker: copy.hero.sideKicker,
            title: copy.hero.sideTitle,
            body: copy.hero.sideBody,
            breakdown:
              breakdown.length > 0
                ? {
                    label: copy.hero.breakdownLabel,
                    rows: breakdown,
                    ariaLabel: copy.hero.breakdownAriaLabel,
                  }
                : undefined,
          }}
        />
      }
      nextStep={nextStep}
      sections={sections}
      footer={<RouteLiveRefresh />}
    />
  );
}
