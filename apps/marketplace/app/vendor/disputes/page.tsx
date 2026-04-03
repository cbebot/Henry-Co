import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getVendorWorkspaceData } from "@/lib/marketplace/data";
import { vendorNav } from "@/lib/marketplace/navigation";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function VendorDisputesPage() {
  await requireMarketplaceRoles(["vendor", "marketplace_owner", "marketplace_admin"], "/vendor/disputes");
  const data = await getVendorWorkspaceData();

  return (
    <WorkspaceShell
      title="Disputes"
      description="Vendors can see issue context without losing the order and payout relationship."
      nav={vendorNav("/vendor/disputes")}
    >
      <div className="space-y-4">
        {data.disputes.map((dispute) => (
          <article key={dispute.id} className="market-paper rounded-[1.75rem] p-5">
            <p className="market-kicker">{dispute.disputeNo}</p>
            <h2 className="mt-3 text-2xl font-semibold capitalize text-[var(--market-ink)]">{dispute.status}</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">{dispute.reason}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--market-muted)]">{formatDate(dispute.updatedAt)}</p>
          </article>
        ))}
      </div>
    </WorkspaceShell>
  );
}
