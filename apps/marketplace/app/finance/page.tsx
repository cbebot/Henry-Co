import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getStaffQueueData } from "@/lib/marketplace/data";
import { staffNav } from "@/lib/marketplace/navigation";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PricingLine = {
  label?: unknown;
  code?: unknown;
  amount?: unknown;
};

type PricingBreakdown = {
  lines: PricingLine[];
};

function hasPricingLines(value: unknown): value is PricingBreakdown {
  return typeof value === "object" && value !== null && Array.isArray((value as PricingBreakdown).lines);
}

export default async function FinancePage() {
  await requireMarketplaceRoles(["marketplace_owner", "marketplace_admin", "finance"], "/finance");
  const data = await getStaffQueueData();

  return (
    <WorkspaceShell
      title="Finance"
      description="Manual payment verification, payout approvals, and finance-led exceptions stay isolated here."
      nav={staffNav("/finance", "/finance")}
    >
      <section className="space-y-4">
        {data.payments
          .filter((payment: Record<string, unknown>) => String(payment.status || "pending") !== "verified")
          .slice(0, 6)
          .map((payment: Record<string, unknown>) => (
          <article key={String(payment.id)} className="market-paper rounded-[1.75rem] p-5">
            <p className="market-kicker">{String(payment.order_no || payment.reference || "Payment")}</p>
            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-[var(--market-ink)]">
                  {formatCurrency(Number(payment.amount || 0))}
                </h2>
                <p className="mt-1 text-sm capitalize text-[var(--market-muted)]">
                  {String(payment.method || "bank_transfer").replace(/_/g, " ")} · {String(payment.status || "pending").replace(/_/g, " ")}
                </p>
                {payment.proof_url ? (
                  <a
                    href={String(payment.proof_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-sm font-semibold text-[var(--market-brass)]"
                  >
                    {String(payment.proof_name || "View payment proof")}
                  </a>
                ) : null}
              </div>
              <p className="rounded-full border border-[var(--market-line)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--market-muted)]">
                {String(payment.reference || "No reference")}
              </p>
            </div>
            {hasPricingLines(payment.pricing_breakdown) ? (
              <div className="mt-3 grid gap-2 text-sm text-[var(--market-muted)]">
                {payment.pricing_breakdown.lines.slice(0, 6).map((line, idx) => {
                  const amount = typeof line.amount === "object" && line.amount !== null && "amount" in line.amount ? line.amount.amount : line.amount;

                  return (
                    <div key={idx} className="flex items-center justify-between gap-3">
                      <span>{String(line.label || line.code || "Fee")}</span>
                      <span className="font-semibold text-[var(--market-ink)]">{formatCurrency(Number(amount ?? 0))}</span>
                    </div>
                  );
                })}
              </div>
            ) : null}
            <form action="/api/marketplace" method="POST" className="mt-4 flex flex-wrap gap-3">
              <input type="hidden" name="intent" value="payment_verify" />
              <input type="hidden" name="order_no" value={String(payment.order_no || "")} />
              <input type="hidden" name="return_to" value="/finance" />
              <input name="review_note" className="market-input min-w-[220px] rounded-full px-4 py-2" placeholder="Verification note" />
              <button className="market-button-primary rounded-full px-4 py-2 text-sm font-semibold">Verify payment</button>
            </form>
          </article>
        ))}
        {data.payouts.map((payout: Record<string, unknown>) => (
          <article key={String(payout.id)} className="market-paper rounded-[1.75rem] p-5">
            <p className="market-kicker">{String(payout.reference || "Payout")}</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--market-ink)]">{formatCurrency(Number(payout.amount || 0))}</h2>
            <form action="/api/marketplace" method="POST" className="mt-4 flex flex-wrap gap-3">
              <input type="hidden" name="intent" value="payout_decision" />
              <input type="hidden" name="payout_id" value={String(payout.id)} />
              <input type="hidden" name="return_to" value="/finance" />
              <input name="note" className="market-input min-w-[220px] rounded-full px-4 py-2" placeholder="Finance note" />
              <button name="decision" value="approved" className="market-button-primary rounded-full px-4 py-2 text-sm font-semibold">Approve</button>
              <button name="decision" value="rejected" className="market-button-secondary rounded-full px-4 py-2 text-sm font-semibold">Reject</button>
            </form>
          </article>
        ))}
      </section>
    </WorkspaceShell>
  );
}
