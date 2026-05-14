import { RouteLiveRefresh } from "@henryco/ui";

import { requireAccountUser } from "@/lib/auth";
import {
  getDivisionActivity,
  getMarketplaceDivisionSummary,
} from "@/lib/division-data";

import "@/components/marketplace/styles.css";
import { MarketplaceHero } from "@/components/marketplace/MarketplaceHero";
import { MarketplaceMatters } from "@/components/marketplace/MarketplaceMatters";
import { MarketplaceOrders } from "@/components/marketplace/MarketplaceOrders";
import { MarketplaceActivity } from "@/components/marketplace/MarketplaceActivity";
import {
  marketStats,
  toApplicationRow,
  toDisputeRows,
  toMarketActivityRows,
  toMembershipRows,
  toOrderRows,
  toPayoutRows,
} from "@/components/marketplace/helpers";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const user = await requireAccountUser();
  const [summary, activityRaw] = await Promise.all([
    getMarketplaceDivisionSummary(user.id),
    getDivisionActivity(user.id, "marketplace"),
  ]);

  const orders = toOrderRows((summary.orders ?? []) as Array<Record<string, unknown>>);
  const disputes = toDisputeRows((summary.disputes ?? []) as Array<Record<string, unknown>>);
  const application = toApplicationRow(summary.application as Record<string, unknown> | null);
  const memberships = toMembershipRows((summary.memberships ?? []) as Array<Record<string, unknown>>);
  const payouts = toPayoutRows((summary.payouts ?? []) as Array<Record<string, unknown>>);
  const stats = marketStats({ orders, disputes, application, memberships, payouts });
  const activityRows = toMarketActivityRows(activityRaw);

  const marketplaceOrigin = `https://marketplace.${process.env.NEXT_PUBLIC_BASE_DOMAIN || "henrycogroup.com"}`;

  return (
    <div className="acct-mkt acct-fade-in">
      <RouteLiveRefresh />
      <MarketplaceHero stats={stats} marketplaceOrigin={marketplaceOrigin} />

      <section id="marketplace-matters" aria-labelledby="acct-mkt-matters">
        <div className="acct-mkt__section-head">
          <h2 id="acct-mkt-matters" className="acct-mkt__section-title">
            Active matters
          </h2>
          <span className="acct-mkt__section-meta">
            Disputes, seller application status, and pending payouts surface here when action is needed.
          </span>
        </div>
        {stats.openDisputes === 0 &&
        stats.payoutsPending === 0 &&
        (!stats.applicationStatus || stats.applicationStatus.toLowerCase() === "approved") ? (
          <div className="acct-mkt__empty">
            <strong>Nothing requires action</strong>
            All your marketplace activity is moving normally — no open disputes, no payouts in review, and (if applicable) your seller application has cleared.
          </div>
        ) : (
          <MarketplaceMatters
            disputes={disputes}
            application={application}
            payouts={payouts}
            marketplaceOrigin={marketplaceOrigin}
          />
        )}
      </section>

      <section aria-labelledby="acct-mkt-orders">
        <div className="acct-mkt__section-head">
          <h2 id="acct-mkt-orders" className="acct-mkt__section-title">
            Recent orders
          </h2>
          <span className="acct-mkt__section-meta">
            {orders.length === 0
              ? "Orders placed on Marketplace appear here in real time."
              : `${orders.length} order${orders.length === 1 ? "" : "s"} · most recent first`}
          </span>
        </div>
        {orders.length === 0 ? (
          <div className="acct-mkt__empty">
            <strong>No orders yet</strong>
            Place your first order on HenryCo Marketplace — order status, payment state, and any follow-up land here automatically.
          </div>
        ) : (
          <MarketplaceOrders orders={orders} marketplaceOrigin={marketplaceOrigin} />
        )}
      </section>

      <section aria-labelledby="acct-mkt-activity">
        <div className="acct-mkt__section-head">
          <h2 id="acct-mkt-activity" className="acct-mkt__section-title">
            Recent activity
          </h2>
          <span className="acct-mkt__section-meta">
            {activityRows.length === 0
              ? "Status updates, payments, and reviews mirror here as they happen."
              : `${activityRows.length} update${activityRows.length === 1 ? "" : "s"} · most recent first`}
          </span>
        </div>
        {activityRows.length === 0 ? (
          <div className="acct-mkt__empty">
            <strong>No marketplace activity yet</strong>
            Order confirmations, dispute updates, and seller payout outcomes will appear here as they happen.
          </div>
        ) : (
          <MarketplaceActivity activity={activityRows} ariaLabel="Marketplace activity" />
        )}
      </section>
    </div>
  );
}
