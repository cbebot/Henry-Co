import Link from "next/link";
import { MetricCard, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getStaffOverviewData, getStaffQueueData } from "@/lib/marketplace/data";
import { staffNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

export default async function OwnerPage() {
  await requireMarketplaceRoles(["marketplace_owner"], "/owner");
  const [data, queue] = await Promise.all([getStaffOverviewData(), getStaffQueueData()]);
  const pendingAuthenticity = queue.reviews.filter(
    (review: Record<string, unknown>) =>
      String(review.status || "").toLowerCase() === "pending" &&
      !Boolean(review.is_verified_purchase)
  ).length;
  const failedNotifications = queue.notifications.filter(
    (notification: Record<string, unknown>) => String(notification.status || "").toLowerCase() === "failed"
  ).length;

  return (
    <WorkspaceShell
      title="Owner"
      description="Marketplace overview with trust, payout, dispute, and delivery-health pressure visible at the executive layer."
      nav={staffNav("/owner", "/owner")}
    >
      <div className="grid gap-5 md:grid-cols-5">
        <MetricCard label="Pending applications" value={String(data.pendingApplications)} hint="Vendor trust review queue." />
        <MetricCard label="Open disputes" value={String(data.openDisputes)} hint="Support and moderation pressure." />
        <MetricCard label="Stalled orders" value={String(data.stalledOrders)} hint="Operational recovery watchlist." />
        <MetricCard label="Pending review authenticity" value={String(pendingAuthenticity)} hint="Unverified reviews still waiting on moderation." />
        <MetricCard label="Failed notifications" value={String(failedNotifications)} hint="Owner-visible delivery health failures." />
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <article className="market-paper rounded-[1.75rem] p-5">
          <p className="market-kicker">Executive summary</p>
          <p className="mt-3 text-sm leading-7 text-[var(--market-muted)]">
            Marketplace trust now treats seller applications, review authenticity, payout review, and failed notification delivery as owner-visible operating signals instead of passive admin trivia.
          </p>
        </article>
        <article className="market-paper rounded-[1.75rem] p-5">
          <p className="market-kicker">Direct command links</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/owner/alerts" className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold">
              Owner alerts
            </Link>
            <Link href="/moderation/reviews" className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold">
              Review moderation
            </Link>
            <Link href="/finance/payouts" className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold">
              Payout review
            </Link>
          </div>
        </article>
      </div>
    </WorkspaceShell>
  );
}
