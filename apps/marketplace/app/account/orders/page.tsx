import { AccountOrderFeedClient } from "@/components/marketplace/account-order-feed-client";
import { EmptyState, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData, toMarketplaceOrderFeed } from "@/lib/marketplace/data";
import { accountWorkspaceNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  await requireMarketplaceUser("/account/orders");
  const data = await getBuyerDashboardData();
  const feed = toMarketplaceOrderFeed(data.orders);

  return (
    <WorkspaceShell
      title="Orders"
      description="Each order keeps payment state, split fulfillment, and dispute context visible in one buyer-friendly timeline."
      {...accountWorkspaceNav("/account/orders")}
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
