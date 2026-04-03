import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getStaffQueueData } from "@/lib/marketplace/data";
import { staffNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  await requireMarketplaceRoles(["marketplace_owner", "marketplace_admin", "support"], "/support");
  const data = await getStaffQueueData();

  return (
    <WorkspaceShell
      title="Support"
      description="Buyer issues, dispute notes, and order pressure are resolved here with the audit trail preserved."
      nav={staffNav("/support", "/support")}
    >
      <div className="space-y-4">
        {data.disputes.map((dispute: Record<string, unknown>) => (
          <article key={String(dispute.id)} className="market-paper rounded-[1.75rem] p-5">
            <p className="market-kicker">{String(dispute.dispute_no || "Dispute")}</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--market-ink)]">{String(dispute.reason || "Issue")}</h2>
            <form action="/api/marketplace" method="POST" className="mt-4 flex flex-wrap gap-3">
              <input type="hidden" name="intent" value="dispute_update" />
              <input type="hidden" name="dispute_id" value={String(dispute.id)} />
              <input type="hidden" name="return_to" value="/support" />
              <input name="note" className="market-input min-w-[220px] rounded-full px-4 py-2" placeholder="Support note" />
              <button name="status" value="investigating" className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold">Investigating</button>
              <button name="status" value="resolved" className="market-button-primary rounded-full px-4 py-2 text-sm font-semibold">Resolve</button>
            </form>
          </article>
        ))}
      </div>
    </WorkspaceShell>
  );
}
