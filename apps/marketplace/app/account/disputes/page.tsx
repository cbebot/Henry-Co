import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceUser } from "@/lib/marketplace/auth";
import { getBuyerDashboardData } from "@/lib/marketplace/data";
import { accountNav } from "@/lib/marketplace/navigation";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountDisputesPage() {
  await requireMarketplaceUser("/account/disputes");
  const data = await getBuyerDashboardData();

  return (
    <WorkspaceShell
      title="Disputes"
      description="Open an issue with context, keep the order linked, and see support-stage updates without losing the trail."
      nav={accountNav("/account/disputes")}
    >
      <form action="/api/marketplace" method="POST" className="market-paper rounded-[1.75rem] p-5">
        <input type="hidden" name="intent" value="dispute_create" />
        <input type="hidden" name="return_to" value="/account/disputes" />
        <div className="grid gap-4 md:grid-cols-2">
          <input name="order_no" className="market-input rounded-2xl px-4 py-3" placeholder="MKT-ORD-..." required />
          <input name="vendor_slug" className="market-input rounded-2xl px-4 py-3" placeholder="Vendor slug (optional)" />
          <input name="reason" className="market-input rounded-2xl px-4 py-3 md:col-span-2" placeholder="Reason for dispute" required />
          <textarea name="note" rows={4} className="market-textarea rounded-[1.5rem] px-4 py-3 md:col-span-2" placeholder="Explain what went wrong and what resolution you expect." />
        </div>
        <button className="market-button-primary mt-4 rounded-full px-5 py-3 text-sm font-semibold">Open dispute</button>
      </form>

      <div className="space-y-4">
        {data.disputes.map((dispute) => (
          <article key={dispute.id} className="market-paper rounded-[1.75rem] p-5">
            <p className="market-kicker">{dispute.disputeNo}</p>
            <h2 className="mt-3 text-xl font-semibold capitalize text-[var(--market-ink)]">{dispute.status}</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">{dispute.reason}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">{formatDate(dispute.updatedAt)}</p>
          </article>
        ))}
      </div>
    </WorkspaceShell>
  );
}
