import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getVendorWorkspaceData } from "@/lib/marketplace/data";
import { vendorNav } from "@/lib/marketplace/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function VendorPayoutsPage() {
  await requireMarketplaceRoles(["vendor", "marketplace_owner", "marketplace_admin"], "/vendor/payouts");
  const data = await getVendorWorkspaceData();

  return (
    <WorkspaceShell
      title="Payouts"
      description="Payout requests, finance review, and decision history stay separate from general vendor activity."
      nav={vendorNav("/vendor/payouts")}
    >
      <form action="/api/marketplace" method="POST" className="market-paper rounded-[1.75rem] p-5">
        <input type="hidden" name="intent" value="payout_request" />
        <input type="hidden" name="return_to" value="/vendor/payouts" />
        <div className="flex flex-col gap-4 sm:flex-row">
          <input name="amount" type="number" className="market-input rounded-full px-4 py-3" placeholder="Amount" required />
          <button className="market-button-primary rounded-full px-5 py-3 text-sm font-semibold">Request payout</button>
        </div>
      </form>
      <div className="space-y-4">
        {data.payouts.map((payout) => (
          <article key={payout.id} className="market-paper rounded-[1.75rem] p-5">
            <p className="market-kicker">{payout.reference}</p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--market-ink)]">{formatCurrency(payout.amount)}</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--market-muted)]">
              {payout.status} · {formatDate(payout.requestedAt)}
            </p>
          </article>
        ))}
      </div>
    </WorkspaceShell>
  );
}
