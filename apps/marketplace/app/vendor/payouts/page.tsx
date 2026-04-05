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
      description="Payout requests only draw from releasable balances. HenryCo keeps held, frozen, requested, approved, and released funds separated for audit and finance review."
      nav={vendorNav("/vendor/payouts")}
    >
      <section className="grid gap-4 md:grid-cols-4">
        <article className="market-paper rounded-[1.5rem] p-5">
          <p className="market-kicker">Held</p>
          <p className="mt-3 text-2xl font-semibold text-[var(--market-ink)]">{formatCurrency(data.balanceSummary.held)}</p>
        </article>
        <article className="market-paper rounded-[1.5rem] p-5">
          <p className="market-kicker">Awaiting auto-release</p>
          <p className="mt-3 text-2xl font-semibold text-[var(--market-ink)]">{formatCurrency(data.balanceSummary.awaitingAutoRelease)}</p>
        </article>
        <article className="market-paper rounded-[1.5rem] p-5">
          <p className="market-kicker">Releasable</p>
          <p className="mt-3 text-2xl font-semibold text-[var(--market-ink)]">{formatCurrency(data.balanceSummary.releasable)}</p>
        </article>
        <article className="market-paper rounded-[1.5rem] p-5">
          <p className="market-kicker">Frozen</p>
          <p className="mt-3 text-2xl font-semibold text-[var(--market-ink)]">{formatCurrency(data.balanceSummary.frozen)}</p>
        </article>
      </section>
      <form action="/api/marketplace" method="POST" className="market-paper rounded-[1.75rem] p-5">
        <input type="hidden" name="intent" value="payout_request" />
        <input type="hidden" name="return_to" value="/vendor/payouts" />
        <div className="flex flex-col gap-4 sm:flex-row">
          <input
            name="amount"
            type="number"
            className="market-input rounded-full px-4 py-3"
            placeholder="Amount"
            max={Math.max(0, data.balanceSummary.releasable)}
            required
          />
          <button className="market-button-primary rounded-full px-5 py-3 text-sm font-semibold">Request payout</button>
        </div>
        <p className="mt-4 text-sm leading-7 text-[var(--market-muted)]">
          Trust tier: {data.trustProfile.label}. Reserve window: {data.trustProfile.payoutDelayDays} days. Auto-release after delivery: {data.trustProfile.autoReleaseDays} days unless disputes or risk holds intervene.
        </p>
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
