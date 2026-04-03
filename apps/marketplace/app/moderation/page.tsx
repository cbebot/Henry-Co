import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getStaffQueueData } from "@/lib/marketplace/data";
import { staffNav } from "@/lib/marketplace/navigation";

export const dynamic = "force-dynamic";

export default async function ModerationPage() {
  await requireMarketplaceRoles(["marketplace_owner", "marketplace_admin", "moderation"], "/moderation");
  const data = await getStaffQueueData();

  return (
    <WorkspaceShell
      title="Moderation"
      description="Product review, risk notes, pricing anomalies, and listing quality signals live here."
      nav={staffNav("/moderation", "/moderation")}
    >
      <div className="space-y-4">
        {data.products.slice(0, 8).map((product: Record<string, unknown>) => (
          <article key={String(product.id)} className="market-paper rounded-[1.75rem] p-5">
            <p className="market-kicker">{String(product.approval_status || "draft")}</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--market-ink)]">{String(product.title || "Product")}</h2>
            <p className="mt-2 text-sm text-[var(--market-muted)]">Stock: {String(product.total_stock || 0)}</p>
            <form action="/api/marketplace" method="POST" className="mt-4 flex flex-wrap gap-3">
              <input type="hidden" name="intent" value="admin_product_decision" />
              <input type="hidden" name="product_id" value={String(product.id)} />
              <input type="hidden" name="return_to" value="/moderation" />
              <input name="review_note" className="market-input min-w-[220px] rounded-full px-4 py-2" placeholder="Moderation note" />
              <button name="decision" value="approved" className="market-button-primary rounded-full px-4 py-2 text-sm font-semibold">Approve</button>
              <button name="decision" value="changes_requested" className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold">Changes</button>
              <button name="decision" value="rejected" className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold">Reject</button>
            </form>
          </article>
        ))}
      </div>
    </WorkspaceShell>
  );
}
