import { EmptyState, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import type { MarketplaceNotification } from "@/lib/marketplace/types";
import { accountNav } from "@/lib/marketplace/navigation";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountNotificationsPage() {
  await requireMarketplaceUser("/account/notifications");
  const data = await getBuyerDashboardData();

  return (
    <WorkspaceShell
      title="Notifications"
      description="In-app, email, and WhatsApp lifecycle updates are designed to show up here as a single readable account timeline."
      nav={accountNav("/account/notifications")}
    >
      {data.notifications.length ? (
        <div className="space-y-4">
          {data.notifications.map((notification: MarketplaceNotification) => (
            <article key={notification.id} className="market-paper rounded-[1.75rem] p-5">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-lg font-semibold text-[var(--market-ink)]">{notification.title}</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">{notification.body}</p>
                </div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">{formatDate(notification.createdAt)}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No notifications yet." body="Marketplace lifecycle updates will appear here." />
      )}
    </WorkspaceShell>
  );
}
