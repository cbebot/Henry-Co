import { AccountOrderFeedClient } from "@/components/marketplace/account-order-feed-client";
import { EmptyState, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData, toMarketplaceOrderFeed } from "@/lib/marketplace/data";
import { accountWorkspaceNav } from "@/lib/marketplace/navigation";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  const locale = await getMarketplacePublicLocale();
  await requireMarketplaceUser("/account/orders");
  const data = await getBuyerDashboardData();
  const feed = toMarketplaceOrderFeed(data.orders);

  return (
    <WorkspaceShell
      title="Orders"
      description="Each order keeps payment state, split fulfillment, and dispute context visible in one buyer-friendly timeline."
      {...accountWorkspaceNav("/account/orders", locale)}
    >
      {feed.length ? (
        <AccountOrderFeedClient initialItems={feed} />
      ) : (
        <EmptyState
          title="No orders yet."
          body="The order history surface is ready. Once you check out, split-order tracking and payment verification history will show up here."
        />
      )}
    </WorkspaceShell>
  );
}
