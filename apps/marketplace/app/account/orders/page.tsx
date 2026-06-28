import { AccountOrderFeedClient } from "@/components/marketplace/account-order-feed-client";
import { EmptyState, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData, toMarketplaceOrderFeed } from "@/lib/marketplace/data";
import { accountWorkspaceNav } from "@/lib/marketplace/navigation";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { getMarketplaceCustomerAccountCopy } from "@henryco/i18n";

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  const locale = await getMarketplacePublicLocale();
  const copy = getMarketplaceCustomerAccountCopy(locale);
  await requireMarketplaceUser("/account/orders");
  const data = await getBuyerDashboardData();
  const feed = toMarketplaceOrderFeed(data.orders);

  return (
    <WorkspaceShell
      title={copy.orders.title}
      description={copy.orders.description}
      {...accountWorkspaceNav("/account/orders", locale)}
    >
      {feed.length ? (
        <AccountOrderFeedClient initialItems={feed} />
      ) : (
        <EmptyState
          title={copy.orders.emptyTitle}
          body={copy.orders.emptyBody}
        />
      )}
    </WorkspaceShell>
  );
}
