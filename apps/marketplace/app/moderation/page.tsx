import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getStaffQueueData } from "@/lib/marketplace/data";
import { staffNav } from "@/lib/marketplace/navigation";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import { formatCurrency } from "@/lib/utils";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Package,
  ShieldAlert,
  Star,
} from "lucide-react";

export const dynamic = "force-dynamic";

const APPROVAL_STYLES: Record<string, string> = {
  submitted:         "bg-[rgba(246,240,222,0.12)] text-[var(--market-brass)] border-[var(--market-brass)]/30",
  under_review:      "bg-[rgba(117,209,255,0.1)] text-[rgba(117,209,255,0.9)] border-[rgba(117,209,255,0.25)]",
  changes_requested: "bg-[rgba(255,180,50,0.1)] text-[rgba(255,180,50,0.9)] border-[rgba(255,180,50,0.25)]",
  approved:          "bg-[rgba(72,199,120,0.1)] text-[rgba(72,199,120,0.9)] border-[rgba(72,199,120,0.25)]",
  rejected:          "bg-[rgba(255,90,80,0.1)] text-[rgba(255,90,80,0.9)] border-[rgba(255,90,80,0.25)]",
  draft:             "bg-[rgba(255,255,255,0.06)] text-[var(--market-muted)] border-[var(--market-line)]",
};

function ApprovalPill({ status }: { status: string }) {
  const style = APPROVAL_STYLES[status] ?? APPROVAL_STYLES.draft;
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] ${style}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function RiskBadge({ score }: { score: number }) {
  const color =
    score >= 60 ? "text-[rgba(255,90,80,0.9)]" :
    score >= 35 ? "text-[rgba(255,180,50,0.9)]" :
    "text-[rgba(72,199,120,0.9)]";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${color}`}>
      <ShieldAlert className="h-3.5 w-3.5" />
      Risk {score}
    </span>
  );
}

export default async function ModerationPage() {
  const locale = await getMarketplacePublicLocale();
  await requireMarketplaceRoles(["marketplace_owner", "marketplace_admin", "moderation"], "/moderation");
  const data = await getStaffQueueData();

  const pendingProducts = (data.products as Array<Record<string, unknown>>).filter((p) =>
    ["submitted", "under_review", "changes_requested"].includes(String(p.approval_status ?? ""))
  );
  const otherProducts = (data.products as Array<Record<string, unknown>>).filter((p) =>
    !["submitted", "under_review", "changes_requested"].includes(String(p.approval_status ?? ""))
  );

  return (
    <WorkspaceShell
      title="Moderation"
      description="Review product listings before they go live. Check quality scores, risk signals, and pricing before approving or requesting changes."
      nav={staffNav("/moderation", "/moderation", locale)}
    >
      <div className="space-y-6">
        {pendingProducts.length === 0 ? (
          <div className="market-paper rounded-[1.75rem] p-8 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-[rgba(72,199,120,0.7)]" />
            <p className="mt-4 text-[1.1rem] font-semibold text-[var(--market-paper-white)]">Queue clear</p>
            <p className="mt-2 text-sm text-[var(--market-muted)]">No products pending moderation.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
              {pendingProducts.length} pending · review required
            </p>
            {pendingProducts.map((product) => {
              const id = String(product.id ?? "");
              const title = String(product.title ?? "Untitled product");
              const summary = String(product.summary ?? "");
              const approvalStatus = String(product.approval_status ?? "submitted");
              const price = Number(product.base_price ?? 0);
              const stock = Number(product.total_stock ?? 0);
              const filterData = (product.filter_data && typeof product.filter_data === "object") ? product.filter_data as Record<string, unknown> : {};
              const qualityScore = Number(filterData.qualityScore ?? 0);
              const riskScore = Number(filterData.riskScore ?? 0);
              const reviewReasons = Array.isArray(filterData.reviewReasons) ? filterData.reviewReasons as string[] : [];
              const sellerTier = String(filterData.sellerTrustTier ?? "");

              return (
                <article key={id} className="market-paper rounded-[1.75rem] p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <ApprovalPill status={approvalStatus} />
                      <h2 className="mt-3 text-[1.4rem] font-semibold leading-tight tracking-tight text-[var(--market-paper-white)]">
                        {title}
                      </h2>
                      {summary ? (
                        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[var(--market-muted)]">{summary}</p>
                      ) : null}
                    </div>
                  </div>

                  <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 border-y border-[var(--market-line)] py-4">
                    <div>
                      <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--market-muted)]">Price</dt>
                      <dd className="mt-1 font-semibold text-[var(--market-paper-white)]">{formatCurrency(price)}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--market-muted)]">Stock</dt>
                      <dd className={`mt-1 font-semibold ${stock <= 5 ? "text-[rgba(255,90,80,0.9)]" : "text-[var(--market-paper-white)]"}`}>
                        <Package className="mr-1 inline h-3.5 w-3.5" />
                        {stock}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--market-muted)]">Quality</dt>
                      <dd className="mt-1 inline-flex items-center gap-1 font-semibold text-[var(--market-paper-white)]">
                        <Star className="h-3.5 w-3.5 text-[var(--market-brass)]" />
                        {qualityScore}/100
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--market-muted)]">Risk</dt>
                      <dd className="mt-1"><RiskBadge score={riskScore} /></dd>
                    </div>
                    {sellerTier ? (
                      <div>
                        <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--market-muted)]">Seller tier</dt>
                        <dd className="mt-1 text-sm font-semibold capitalize text-[var(--market-paper-white)]">{sellerTier.replace(/_/g, " ")}</dd>
                      </div>
                    ) : null}
                  </dl>

                  {reviewReasons.length > 0 ? (
                    <div className="mt-4 rounded-[1rem] border border-[rgba(255,180,50,0.2)] bg-[rgba(255,180,50,0.05)] p-4">
                      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[rgba(255,180,50,0.9)]">
                        <AlertTriangle className="h-3 w-3" />
                        Moderation signals
                      </p>
                      <ul className="mt-2 space-y-1">
                        {reviewReasons.map((reason, i) => (
                          <li key={i} className="text-xs text-[var(--market-muted)]">· {String(reason)}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <form action="/api/marketplace" method="POST" className="mt-6 space-y-4">
                    <input type="hidden" name="intent" value="admin_product_decision" />
                    <input type="hidden" name="product_id" value={id} />
                    <input type="hidden" name="return_to" value="/moderation" />
                    <input
                      name="review_note"
                      className="market-input w-full rounded-[1rem] px-4 py-3 text-sm"
                      placeholder="Moderation note — required when rejecting or requesting changes"
                    />
                    <div className="flex flex-wrap gap-3">
                      <button
                        name="decision"
                        value="approved"
                        className="inline-flex items-center gap-2 rounded-full bg-[rgba(72,199,120,0.15)] px-5 py-2.5 text-sm font-semibold text-[rgba(72,199,120,0.95)] ring-1 ring-[rgba(72,199,120,0.35)] transition hover:bg-[rgba(72,199,120,0.25)]"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve listing
                      </button>
                      <button
                        name="decision"
                        value="changes_requested"
                        className="inline-flex items-center gap-2 rounded-full bg-[rgba(255,180,50,0.08)] px-5 py-2.5 text-sm font-semibold text-[rgba(255,180,50,0.85)] ring-1 ring-[rgba(255,180,50,0.2)] transition hover:bg-[rgba(255,180,50,0.16)]"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        Request changes
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
            })}
          </div>
        )}

        {otherProducts.length > 0 ? (
          <details>
            <summary className="cursor-pointer select-none text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)] hover:text-[var(--market-paper-white)]">
              {otherProducts.length} other listings (approved / draft / rejected)
            </summary>
            <div className="mt-4 space-y-2">
              {otherProducts.slice(0, 20).map((product) => {
                const id = String(product.id ?? "");
                const title = String(product.title ?? "Product");
                const status = String(product.approval_status ?? "draft");
                const price = Number(product.base_price ?? 0);
                return (
                  <article key={id} className="market-paper flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] px-5 py-3">
                    <div className="flex items-center gap-3">
                      <ApprovalPill status={status} />
                      <span className="text-sm font-semibold text-[var(--market-paper-white)]">{title}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-[var(--market-muted)]">{formatCurrency(price)}</span>
                      {status === "approved" ? (
                        <form action="/api/marketplace" method="POST" className="flex gap-2">
                          <input type="hidden" name="intent" value="admin_product_decision" />
                          <input type="hidden" name="product_id" value={id} />
                          <input type="hidden" name="return_to" value="/moderation" />
                          <button
                            name="decision"
                            value="rejected"
                            className="rounded-full bg-[rgba(255,90,80,0.08)] px-3 py-1 text-xs font-semibold text-[rgba(255,90,80,0.85)] ring-1 ring-[rgba(255,90,80,0.2)]"
                          >
                            Pull listing
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </details>
        ) : null}
      </div>
    </WorkspaceShell>
  );
}
