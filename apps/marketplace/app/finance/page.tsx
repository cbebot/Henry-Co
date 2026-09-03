import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getStaffQueueData } from "@/lib/marketplace/data";
import { staffNav } from "@/lib/marketplace/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import {
  CheckCircle2,
  XCircle,
  Lock,
  ArrowUpRight,
  Banknote,
  Receipt,
  Send,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const locale = await getMarketplacePublicLocale();
  await requireMarketplaceRoles(["marketplace_owner", "marketplace_admin", "finance"], "/finance");
  const data = await getStaffQueueData();

  const pendingPayments = (data.payments as Array<Record<string, unknown>>).filter(
    (p) => !["verified", "failed"].includes(String(p.status ?? ""))
  );
  const pendingPayouts = (data.payouts as Array<Record<string, unknown>>).filter(
    (p) => String(p.status ?? "") === "requested"
  );
  const approvedPayouts = (data.payouts as Array<Record<string, unknown>>).filter(
    (p) => String(p.status ?? "") === "approved"
  );

  return (
    <WorkspaceShell
      title="Finance"
      description="Verify incoming payments and action payout requests. Payments unlock escrow; payout approvals signal release to vendor accounts."
      nav={staffNav("/finance", "/finance", locale)}
    >
      <div className="space-y-8">

        {/* ── Payment verification ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Receipt className="h-4 w-4 text-[var(--market-brass)]" />
            <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
              Payments awaiting verification
              {pendingPayments.length > 0 ? (
                <span className="ml-2 rounded-full bg-[rgba(246,240,222,0.12)] px-2 py-0.5 text-[var(--market-brass)]">
                  {pendingPayments.length}
                </span>
              ) : null}
            </h2>
          </div>

          {pendingPayments.length === 0 ? (
            <div className="market-paper rounded-[1.5rem] p-6 text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-[rgba(72,199,120,0.7)]" />
              <p className="mt-3 text-sm text-[var(--market-muted)]">No payments pending verification.</p>
            </div>
          ) : (
            pendingPayments.map((payment) => {
              const id = String(payment.id ?? "");
              const orderNo = String(payment.order_no ?? "");
              const reference = String(payment.reference ?? "");
              const bankRef = String(payment.bank_reference ?? "");
              const amount = Number(payment.amount ?? 0);
              const method = String(payment.method ?? "bank_transfer").replace(/_/g, " ");
              const status = String(payment.status ?? "pending").replace(/_/g, " ");
              const proofUrl = payment.proof_url ? String(payment.proof_url) : null;
              const proofName = String(payment.proof_name ?? "View proof");
              const submittedAt = payment.submitted_at ? String(payment.submitted_at) : null;

              return (
                <article key={id} className="market-paper rounded-[1.75rem] p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-brass)]">
                        Order {orderNo || reference}
                      </p>
                      <p className="mt-2 text-[1.8rem] font-semibold leading-tight tracking-tight text-[var(--market-paper-white)]">
                        {formatCurrency(amount)}
                      </p>
                      <p className="mt-1 text-sm capitalize text-[var(--market-muted)]">
                        {method} · <span className="font-medium">{status}</span>
                      </p>
                    </div>
                    <div className="space-y-2 text-right">
                      {reference ? (
                        <p className="rounded-full border border-[var(--market-line)] px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[var(--market-muted)]">
                          {reference}
                        </p>
                      ) : null}
                      {submittedAt ? (
                        <p className="text-xs text-[var(--market-muted)]">{formatDate(submittedAt)}</p>
                      ) : null}
                    </div>
                  </div>

                  {(bankRef || proofUrl) ? (
                    <div className="mt-5 rounded-[1rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.02)] p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">Evidence</p>
                      <div className="mt-2 flex flex-wrap items-center gap-4">
                        {bankRef ? (
                          <div>
                            <p className="text-[10px] text-[var(--market-muted)]">Bank reference</p>
                            <p className="font-mono text-sm font-semibold text-[var(--market-paper-white)]">{bankRef}</p>
                          </div>
                        ) : null}
                        {proofUrl ? (
                          <a
                            href={proofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--market-brass)]/35 px-4 py-2 text-xs font-semibold text-[var(--market-brass)] transition hover:bg-[rgba(246,240,222,0.08)]"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                            {proofName}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <form action="/api/marketplace" method="POST" className="mt-6 space-y-4">
                    <input type="hidden" name="intent" value="payment_verify" />
                    <input type="hidden" name="order_no" value={orderNo} />
                    <input type="hidden" name="return_to" value="/finance" />
                    <input
                      name="review_note"
                      className="market-input w-full rounded-[1rem] px-4 py-3 text-sm"
                      placeholder="Finance note (optional)"
                    />
                    <div className="flex flex-wrap gap-3">
                      <button
                        className="inline-flex items-center gap-2 rounded-full bg-[rgba(72,199,120,0.15)] px-5 py-2.5 text-sm font-semibold text-[rgba(72,199,120,0.95)] ring-1 ring-[rgba(72,199,120,0.35)] transition hover:bg-[rgba(72,199,120,0.25)]"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Verify &amp; activate escrow
                      </button>
                    </div>
                  </form>
                </article>
              );
            })
          )}
        </section>

        {/* ── Payout requests ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Banknote className="h-4 w-4 text-[var(--market-brass)]" />
            <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
              Payout requests
              {pendingPayouts.length > 0 ? (
                <span className="ml-2 rounded-full bg-[rgba(246,240,222,0.12)] px-2 py-0.5 text-[var(--market-brass)]">
                  {pendingPayouts.length}
                </span>
              ) : null}
            </h2>
          </div>

          {pendingPayouts.length === 0 ? (
            <div className="market-paper rounded-[1.5rem] p-6 text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-[rgba(72,199,120,0.7)]" />
              <p className="mt-3 text-sm text-[var(--market-muted)]">No payout requests waiting.</p>
            </div>
          ) : (
            pendingPayouts.map((payout) => {
              const id = String(payout.id ?? "");
              const reference = String(payout.reference ?? "Payout");
              const amount = Number(payout.amount ?? 0);
              const createdAt = payout.created_at ? String(payout.created_at) : null;

              return (
                <article key={id} className="market-paper rounded-[1.75rem] p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-brass)]">{reference}</p>
                      <p className="mt-2 text-[1.8rem] font-semibold leading-tight tracking-tight text-[var(--market-paper-white)]">
                        {formatCurrency(amount)}
                      </p>
                    </div>
                    {createdAt ? (
                      <p className="text-xs text-[var(--market-muted)]">{formatDate(createdAt)}</p>
                    ) : null}
                  </div>

                  <form action="/api/marketplace" method="POST" className="mt-6 space-y-4">
                    <input type="hidden" name="intent" value="payout_decision" />
                    <input type="hidden" name="payout_id" value={id} />
                    <input type="hidden" name="return_to" value="/finance" />
                    <input
                      name="note"
                      className="market-input w-full rounded-[1rem] px-4 py-3 text-sm"
                      placeholder="Finance note (optional)"
                    />
                    <div className="flex flex-wrap gap-3">
                      <button
                        name="decision"
                        value="approved"
                        className="inline-flex items-center gap-2 rounded-full bg-[rgba(72,199,120,0.15)] px-5 py-2.5 text-sm font-semibold text-[rgba(72,199,120,0.95)] ring-1 ring-[rgba(72,199,120,0.35)] transition hover:bg-[rgba(72,199,120,0.25)]"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        name="decision"
                        value="released"
                        className="inline-flex items-center gap-2 rounded-full bg-[rgba(117,209,255,0.08)] px-5 py-2.5 text-sm font-semibold text-[rgba(117,209,255,0.85)] ring-1 ring-[rgba(117,209,255,0.2)] transition hover:bg-[rgba(117,209,255,0.16)]"
                      >
                        <Send className="h-4 w-4" />
                        Approve &amp; release
                      </button>
                      <button
                        name="decision"
                        value="frozen"
                        className="inline-flex items-center gap-2 rounded-full bg-[rgba(255,180,50,0.08)] px-5 py-2.5 text-sm font-semibold text-[rgba(255,180,50,0.85)] ring-1 ring-[rgba(255,180,50,0.2)] transition hover:bg-[rgba(255,180,50,0.16)]"
                      >
                        <Lock className="h-4 w-4" />
                        Freeze
                      </button>
                      <button
                        name="decision"
                        value="rejected"
                        className="inline-flex items-center gap-2 rounded-full bg-[rgba(255,90,80,0.08)] px-5 py-2.5 text-sm font-semibold text-[rgba(255,90,80,0.85)] ring-1 ring-[rgba(255,90,80,0.2)] transition hover:bg-[rgba(255,90,80,0.16)]"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </form>
                </article>
              );
            })
          )}

          {approvedPayouts.length > 0 ? (
            <details>
              <summary className="cursor-pointer select-none text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)] hover:text-[var(--market-paper-white)]">
                {approvedPayouts.length} approved payouts — release when ready
              </summary>
              <div className="mt-4 space-y-3">
                {approvedPayouts.map((payout) => {
                  const id = String(payout.id ?? "");
                  const reference = String(payout.reference ?? "Payout");
                  const amount = Number(payout.amount ?? 0);
                  return (
                    <article key={id} className="market-paper flex flex-wrap items-center justify-between gap-4 rounded-[1.25rem] px-5 py-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--market-muted)]">{reference}</p>
                        <p className="mt-1 font-semibold text-[var(--market-paper-white)]">{formatCurrency(amount)}</p>
                      </div>
                      <form action="/api/marketplace" method="POST" className="flex gap-2">
                        <input type="hidden" name="intent" value="payout_decision" />
                        <input type="hidden" name="payout_id" value={id} />
                        <input type="hidden" name="return_to" value="/finance" />
                        <button
                          name="decision"
                          value="released"
                          className="inline-flex items-center gap-2 rounded-full bg-[rgba(117,209,255,0.08)] px-4 py-2 text-xs font-semibold text-[rgba(117,209,255,0.85)] ring-1 ring-[rgba(117,209,255,0.2)]"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Release
                        </button>
                        <button
                          name="decision"
                          value="frozen"
                          className="inline-flex items-center gap-2 rounded-full bg-[rgba(255,180,50,0.08)] px-4 py-2 text-xs font-semibold text-[rgba(255,180,50,0.85)] ring-1 ring-[rgba(255,180,50,0.2)]"
                        >
                          <Lock className="h-3.5 w-3.5" />
                          Freeze
                        </button>
                      </form>
                    </article>
                  );
                })}
              </div>
            </details>
          ) : null}
        </section>

      </div>
    </WorkspaceShell>
  );
}
