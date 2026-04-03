import Link from "next/link";
import { MetricCard, WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import { accountNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

export default async function AccountOverviewPage() {
  await requireMarketplaceUser("/account");
  const data = await getBuyerDashboardData();

  return (
    <WorkspaceShell
      title="Buyer account"
      description="Orders, payments, disputes, notifications, follows, and seller applications all persist here so HenryCo can unify the account experience across divisions later without reconstructing the trail."
      nav={accountNav("/account")}
      actions={
        <Link href="/search" className="market-button-primary rounded-full px-5 py-3 text-sm font-semibold">
          Continue shopping
        </Link>
      }
    >
      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard label="Orders" value={String(data.orders.length)} hint="Tracked with split-order clarity and payment state." />
        <MetricCard label="Disputes" value={String(data.disputes.length)} hint="Issue flows remain attached to the account record." />
        <MetricCard label="Support threads" value={String(data.supportThreads.length)} hint="Buyer help threads stay tied to the same account identity." />
      </div>
      <section className="market-paper rounded-[1.75rem] p-6">
        <p className="market-kicker">Recent activity</p>
        <div className="mt-5 space-y-3">
          {data.notifications.slice(0, 4).map((item) => (
            <div key={item.id} className="rounded-[1.5rem] border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-4 py-4">
              <p className="text-sm font-semibold text-[var(--market-ink)]">{item.title}</p>
              <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </WorkspaceShell>
  );
}
