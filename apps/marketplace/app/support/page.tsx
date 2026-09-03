import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getStaffQueueData } from "@/lib/marketplace/data";
import { staffNav } from "@/lib/marketplace/navigation";
import { formatDate } from "@/lib/utils";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import {
  CheckCircle2,
  Search,
  RefreshCw,
  Banknote,
  MessageSquare,
} from "lucide-react";

export const dynamic = "force-dynamic";

const DISPUTE_STATUS_STYLES: Record<string, string> = {
  open:          "bg-[rgba(255,90,80,0.1)] text-[rgba(255,90,80,0.9)] border-[rgba(255,90,80,0.25)]",
  investigating: "bg-[rgba(255,180,50,0.1)] text-[rgba(255,180,50,0.9)] border-[rgba(255,180,50,0.25)]",
  resolved:      "bg-[rgba(72,199,120,0.1)] text-[rgba(72,199,120,0.9)] border-[rgba(72,199,120,0.25)]",
  closed:        "bg-[rgba(255,255,255,0.06)] text-[var(--market-muted)] border-[var(--market-line)]",
};

function DisputePill({ status }: { status: string }) {
  const style = DISPUTE_STATUS_STYLES[status] ?? DISPUTE_STATUS_STYLES.open;
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] ${style}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default async function SupportPage() {
  const locale = await getMarketplacePublicLocale();
  await requireMarketplaceRoles(["marketplace_owner", "marketplace_admin", "support"], "/support");
  const data = await getStaffQueueData();

  const activeDisputes = (data.disputes as Array<Record<string, unknown>>).filter((d) =>
    ["open", "investigating"].includes(String(d.status ?? ""))
  );
  const resolvedDisputes = (data.disputes as Array<Record<string, unknown>>).filter((d) =>
    ["resolved", "closed"].includes(String(d.status ?? ""))
  );

  const openThreads = (data.supportThreads as Array<Record<string, unknown>>).filter(
    (t) => String(t.status ?? "") !== "closed"
  );

  return (
    <WorkspaceShell
      title="Support"
      description="Resolve buyer disputes and monitor open support threads. Dispute resolution updates payout status automatically."
      nav={staffNav("/support", "/support", locale)}
    >
      <div className="space-y-8">

        {/* ── Active disputes ── */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-[var(--market-brass)]" />
            <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
              Active disputes
              {activeDisputes.length > 0 ? (
                <span className="ml-2 rounded-full bg-[rgba(255,90,80,0.12)] px-2 py-0.5 text-[rgba(255,90,80,0.9)]">
                  {activeDisputes.length}
                </span>
              ) : null}
            </h2>
          </div>

          {activeDisputes.length === 0 ? (
            <div className="market-paper rounded-[1.5rem] p-6 text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-[rgba(72,199,120,0.7)]" />
              <p className="mt-3 text-sm text-[var(--market-muted)]">No open disputes. All clear.</p>
            </div>
          ) : (
            activeDisputes.map((dispute) => {
              const id = String(dispute.id ?? "");
              const disputeNo = String(dispute.dispute_no ?? "Dispute");
              const orderNo = String(dispute.order_no ?? "");
              const reason = String(dispute.reason ?? "Issue reported").replace(/_/g, " ");
              const details = String(dispute.details ?? "");
              const status = String(dispute.status ?? "open");
              const updatedAt = dispute.updated_at ? String(dispute.updated_at) : null;

              return (
                <article key={id} className="market-paper rounded-[1.75rem] p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <DisputePill status={status} />
                      <h2 className="mt-3 text-[1.3rem] font-semibold capitalize leading-tight tracking-tight text-[var(--market-paper-white)]">
                        {reason}
                      </h2>
                      <p className="mt-1 text-xs text-[var(--market-muted)]">
                        {disputeNo}{orderNo ? ` · Order ${orderNo}` : ""}
                      </p>
                    </div>
                    {updatedAt ? (
                      <p className="text-xs text-[var(--market-muted)]">{formatDate(updatedAt)}</p>
                    ) : null}
                  </div>

                  {details ? (
                    <div className="mt-4 rounded-[1rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.02)] p-4">
                      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                        <MessageSquare className="h-3 w-3" />
                        Buyer note
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--market-muted)]">{details}</p>
                    </div>
                  ) : null}

                  {/* Investigation action — no resolution type needed */}
                  <form action="/api/marketplace" method="POST" className="mt-4 flex flex-wrap gap-2">
                    <input type="hidden" name="intent" value="dispute_update" />
                    <input type="hidden" name="dispute_id" value={id} />
                    <input type="hidden" name="return_to" value="/support" />
                    {status === "open" ? (
                      <button
                        name="status"
                        value="investigating"
                        className="inline-flex items-center gap-2 rounded-full bg-[rgba(255,180,50,0.08)] px-4 py-2.5 text-sm font-semibold text-[rgba(255,180,50,0.85)] ring-1 ring-[rgba(255,180,50,0.2)] transition hover:bg-[rgba(255,180,50,0.16)]"
                      >
                        <Search className="h-4 w-4" />
                        Mark investigating
                      </button>
                    ) : null}
                  </form>

                  {/* Resolution — requires picking outcome */}
                  <div className="mt-4 rounded-[1rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.02)] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">Resolve dispute</p>

                    <form action="/api/marketplace" method="POST" className="mt-4 space-y-3">
                      <input type="hidden" name="intent" value="dispute_update" />
                      <input type="hidden" name="dispute_id" value={id} />
                      <input type="hidden" name="status" value="resolved" />
                      <input type="hidden" name="return_to" value="/support" />
                      <input
                        name="note"
                        className="market-input w-full rounded-[1rem] px-4 py-3 text-sm"
                        placeholder="Resolution note — what happened and what was decided"
                      />
                      <div className="flex flex-wrap gap-3">
                        <button
                          name="resolution_type"
                          value="refund_to_buyer"
                          className="inline-flex items-center gap-2 rounded-full bg-[rgba(72,199,120,0.15)] px-5 py-2.5 text-sm font-semibold text-[rgba(72,199,120,0.95)] ring-1 ring-[rgba(72,199,120,0.35)] transition hover:bg-[rgba(72,199,120,0.25)]"
                        >
                          <Banknote className="h-4 w-4" />
                          Resolve — refund buyer
                        </button>
                        <button
                          name="resolution_type"
                          value="release_to_vendor"
                          className="inline-flex items-center gap-2 rounded-full bg-[rgba(117,209,255,0.08)] px-5 py-2.5 text-sm font-semibold text-[rgba(117,209,255,0.85)] ring-1 ring-[rgba(117,209,255,0.2)] transition hover:bg-[rgba(117,209,255,0.16)]"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Resolve — release to vendor
                        </button>
                      </div>
                    </form>
                  </div>
                </article>
              );
            })
          )}

          {resolvedDisputes.length > 0 ? (
            <details>
              <summary className="cursor-pointer select-none text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)] hover:text-[var(--market-paper-white)]">
                {resolvedDisputes.length} resolved disputes
              </summary>
              <div className="mt-4 space-y-2">
                {resolvedDisputes.slice(0, 15).map((dispute) => {
                  const id = String(dispute.id ?? "");
                  const disputeNo = String(dispute.dispute_no ?? "Dispute");
                  const reason = String(dispute.reason ?? "Issue").replace(/_/g, " ");
                  const status = String(dispute.status ?? "resolved");
                  const updatedAt = dispute.updated_at ? String(dispute.updated_at) : null;
                  return (
                    <article key={id} className="market-paper flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] px-5 py-3">
                      <div className="flex items-center gap-3">
                        <DisputePill status={status} />
                        <span className="text-sm capitalize text-[var(--market-muted)]">{reason}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[var(--market-muted)]">
                        <span>{disputeNo}</span>
                        {updatedAt ? <span>{formatDate(updatedAt)}</span> : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </details>
          ) : null}
        </section>

        {/* ── Support threads ── */}
        {openThreads.length > 0 ? (
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-[var(--market-brass)]" />
              <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
                Open support threads
                <span className="ml-2 rounded-full bg-[rgba(246,240,222,0.12)] px-2 py-0.5 text-[var(--market-brass)]">
                  {openThreads.length}
                </span>
              </h2>
            </div>
            <div className="space-y-3">
              {openThreads.slice(0, 10).map((thread) => {
                const id = String(thread.id ?? "");
                const subject = String(thread.subject ?? "Support enquiry");
                const email = String(thread.normalized_email ?? "");
                const status = String(thread.status ?? "open");
                const updatedAt = thread.updated_at ? String(thread.updated_at) : null;
                const lastMessage = String(thread.last_message ?? "");

                return (
                  <article key={id} className="market-paper rounded-[1.5rem] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-brass)]">{status}</p>
                        <h3 className="mt-2 font-semibold text-[var(--market-paper-white)]">{subject}</h3>
                        {email ? <p className="mt-1 text-xs text-[var(--market-muted)]">{email}</p> : null}
                        {lastMessage ? (
                          <p className="mt-2 line-clamp-2 text-sm text-[var(--market-muted)]">{lastMessage}</p>
                        ) : null}
                      </div>
                      {updatedAt ? (
                        <p className="shrink-0 text-xs text-[var(--market-muted)]">{formatDate(updatedAt)}</p>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

      </div>
    </WorkspaceShell>
  );
}
