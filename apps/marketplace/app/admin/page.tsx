import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getStaffQueueData } from "@/lib/marketplace/data";
import { staffNav } from "@/lib/marketplace/navigation";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireMarketplaceRoles(["marketplace_owner", "marketplace_admin"], "/admin");
  const data = await getStaffQueueData();

  return (
    <WorkspaceShell
      title="Admin"
      description="Vendor approval and catalog administration remain separate from moderation heat and finance decisions."
      nav={staffNav("/admin", "/admin")}
    >
      <div className="space-y-4">
        {data.applications.map((application: Record<string, unknown>) => (
          <article key={String(application.id)} className="market-paper rounded-[1.75rem] p-5">
            <p className="market-kicker">{String(application.status || "submitted")}</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--market-ink)]">
              {String(application.store_name || application.proposed_store_slug || "Store application")}
            </h2>
            <p className="mt-2 text-sm text-[var(--market-muted)]">{formatDate(String(application.submitted_at || new Date().toISOString()))}</p>
            <form action="/api/marketplace" method="POST" className="mt-4 flex flex-wrap gap-3">
              <input type="hidden" name="intent" value="admin_vendor_application_decision" />
              <input type="hidden" name="application_id" value={String(application.id)} />
              <input type="hidden" name="return_to" value="/admin" />
              <input name="review_note" className="market-input min-w-[220px] rounded-full px-4 py-2" placeholder="Review note" />
              <button name="decision" value="approved" className="market-button-primary rounded-full px-4 py-2 text-sm font-semibold">Approve</button>
              <button name="decision" value="rejected" className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold">Reject</button>
            </form>
          </article>
        ))}
      </div>
    </WorkspaceShell>
  );
}
