import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import { getStaffQueueData } from "@/lib/marketplace/data";
import { staffNav } from "@/lib/marketplace/navigation";
import { formatDate } from "@/lib/utils";
import { getMarketplacePublicLocale } from "@/lib/locale-server";
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  XCircle,
  AlertTriangle,
  User,
  Phone,
  Tag,
  Store,
} from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  submitted:         "bg-[rgba(246,240,222,0.12)] text-[var(--market-brass)] border-[var(--market-brass)]/30",
  under_review:      "bg-[rgba(117,209,255,0.1)] text-[rgba(117,209,255,0.9)] border-[rgba(117,209,255,0.25)]",
  changes_requested: "bg-[rgba(255,180,50,0.1)] text-[rgba(255,180,50,0.9)] border-[rgba(255,180,50,0.25)]",
  approved:          "bg-[rgba(72,199,120,0.1)] text-[rgba(72,199,120,0.9)] border-[rgba(72,199,120,0.25)]",
  rejected:          "bg-[rgba(255,90,80,0.1)] text-[rgba(255,90,80,0.9)] border-[rgba(255,90,80,0.25)]",
};

function StatusPill({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.submitted;
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] ${style}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default async function AdminPage() {
  const locale = await getMarketplacePublicLocale();
  await requireMarketplaceRoles(["marketplace_owner", "marketplace_admin"], "/admin");
  const data = await getStaffQueueData();

  const pending = (data.applications as Array<Record<string, unknown>>).filter((a) =>
    ["submitted", "under_review", "changes_requested"].includes(String(a.status ?? ""))
  );
  const settled = (data.applications as Array<Record<string, unknown>>).filter((a) =>
    ["approved", "rejected"].includes(String(a.status ?? ""))
  );

  return (
    <WorkspaceShell
      title="Vendor Applications"
      description="Review seller applications before granting store access. Approve to create the vendor store, hold for further checks, or reject with a note."
      nav={staffNav("/admin", "/admin", locale)}
    >
      <div className="space-y-6">
        {pending.length === 0 ? (
          <div className="market-paper rounded-[1.75rem] p-8 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-[rgba(72,199,120,0.7)]" />
            <p className="mt-4 text-[1.1rem] font-semibold text-[var(--market-paper-white)]">Queue clear</p>
            <p className="mt-2 text-sm text-[var(--market-muted)]">No pending vendor applications right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)]">
              {pending.length} pending · action required
            </p>
            {pending.map((app) => {
              const id = String(app.id ?? "");
              const storeName = String(app.store_name ?? "Unnamed store");
              const slug = String(app.proposed_store_slug ?? "");
              const legalName = String(app.legal_name ?? "");
              const email = String(app.normalized_email ?? "");
              const phone = String(app.contact_phone ?? "");
              const category = String(app.category_focus ?? "");
              const story = String(app.story ?? "");
              const status = String(app.status ?? "submitted");
              const submittedAt = String(app.submitted_at ?? "");

              return (
                <article key={id} className="market-paper rounded-[1.75rem] p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <StatusPill status={status} />
                      <h2 className="mt-3 text-[1.5rem] font-semibold leading-tight tracking-tight text-[var(--market-paper-white)]">
                        {storeName}
                      </h2>
                    </div>
                    {submittedAt ? (
                      <p className="shrink-0 text-xs text-[var(--market-muted)]">{formatDate(submittedAt)}</p>
                    ) : null}
                  </div>

                  <dl className="mt-5 grid gap-y-4 gap-x-6 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    {legalName ? (
                      <div className="flex items-start gap-2">
                        <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--market-muted)]" />
                        <div>
                          <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--market-muted)]">Legal name</dt>
                          <dd className="font-semibold text-[var(--market-paper-white)]">{legalName}</dd>
                        </div>
                      </div>
                    ) : null}
                    {email ? (
                      <div className="flex items-start gap-2">
                        <Store className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--market-muted)]" />
                        <div>
                          <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--market-muted)]">Email</dt>
                          <dd className="break-all font-semibold text-[var(--market-paper-white)]">{email}</dd>
                        </div>
                      </div>
                    ) : null}
                    {phone ? (
                      <div className="flex items-start gap-2">
                        <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--market-muted)]" />
                        <div>
                          <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--market-muted)]">Phone</dt>
                          <dd className="font-semibold text-[var(--market-paper-white)]">{phone}</dd>
                        </div>
                      </div>
                    ) : null}
                    {category ? (
                      <div className="flex items-start gap-2">
                        <Tag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--market-muted)]" />
                        <div>
                          <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--market-muted)]">Category</dt>
                          <dd className="font-semibold text-[var(--market-paper-white)]">{category}</dd>
                        </div>
                      </div>
                    ) : null}
                    {slug ? (
                      <div className="sm:col-span-2">
                        <dt className="text-[10px] uppercase tracking-[0.18em] text-[var(--market-muted)]">Proposed slug</dt>
                        <dd className="font-mono text-xs text-[var(--market-muted)]">/{slug}</dd>
                      </div>
                    ) : null}
                  </dl>

                  {story ? (
                    <div className="mt-5 rounded-[1rem] border border-[var(--market-line)] bg-[rgba(255,255,255,0.02)] p-4">
                      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--market-muted)]">
                        <MessageSquare className="h-3 w-3" />
                        Store story
                      </p>
                      <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-[var(--market-muted)]">{story}</p>
                    </div>
                  ) : null}

                  <form action="/api/marketplace" method="POST" className="mt-6 space-y-4">
                    <input type="hidden" name="intent" value="admin_vendor_application_decision" />
                    <input type="hidden" name="application_id" value={id} />
                    <input type="hidden" name="return_to" value="/admin" />
                    <input
                      name="review_note"
                      className="market-input w-full rounded-[1rem] px-4 py-3 text-sm"
                      placeholder="Review note — required when rejecting or requesting changes"
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
                        value="under_review"
                        className="inline-flex items-center gap-2 rounded-full bg-[rgba(117,209,255,0.08)] px-5 py-2.5 text-sm font-semibold text-[rgba(117,209,255,0.85)] ring-1 ring-[rgba(117,209,255,0.2)] transition hover:bg-[rgba(117,209,255,0.16)]"
                      >
                        <Clock className="h-4 w-4" />
                        Hold for review
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

        {settled.length > 0 ? (
          <details className="group">
            <summary className="cursor-pointer select-none text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--market-muted)] hover:text-[var(--market-paper-white)]">
              {settled.length} settled (approved / rejected) — click to expand
            </summary>
            <div className="mt-4 space-y-3">
              {settled.map((app) => {
                const id = String(app.id ?? "");
                const storeName = String(app.store_name ?? "Store");
                const status = String(app.status ?? "");
                const email = String(app.normalized_email ?? "");
                const submittedAt = String(app.submitted_at ?? "");
                return (
                  <article key={id} className="market-paper rounded-[1.5rem] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <StatusPill status={status} />
                        <span className="font-semibold text-[var(--market-paper-white)]">{storeName}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[var(--market-muted)]">
                        {email ? <span>{email}</span> : null}
                        {submittedAt ? <span>{formatDate(submittedAt)}</span> : null}
                      </div>
                    </div>
                    {status === "approved" ? (
                      <form action="/api/marketplace" method="POST" className="mt-3 flex flex-wrap gap-2">
                        <input type="hidden" name="intent" value="admin_vendor_application_decision" />
                        <input type="hidden" name="application_id" value={id} />
                        <input type="hidden" name="return_to" value="/admin" />
                        <input name="review_note" className="market-input rounded-full px-3 py-1.5 text-xs" placeholder="Reason for revocation" />
                        <button
                          name="decision"
                          value="rejected"
                          className="rounded-full bg-[rgba(255,90,80,0.08)] px-4 py-1.5 text-xs font-semibold text-[rgba(255,90,80,0.85)] ring-1 ring-[rgba(255,90,80,0.2)] transition hover:bg-[rgba(255,90,80,0.16)]"
                        >
                          Revoke approval
                        </button>
                      </form>
                    ) : null}
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
