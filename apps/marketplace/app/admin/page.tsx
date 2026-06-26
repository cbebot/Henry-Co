import { WorkspaceShell } from "@/components/marketplace/shell";
import { requireMarketplaceRoles } from "@/lib/marketplace/auth";
import {
  getAdminVendorApplications,
  type AdminVendorApplication,
  type AdminVendorApplicationDoc,
} from "@/lib/marketplace/data";
import { staffNav } from "@/lib/marketplace/navigation";
import { formatDate } from "@/lib/utils";
import { getMarketplacePublicLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  submitted: "var(--market-brass)",
  under_review: "var(--market-brass)",
  changes_requested: "#b45309",
  approved: "#3f6212",
  rejected: "#b91c1c",
  draft: "var(--market-muted)",
};

function StatusPill({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  const tone = STATUS_TONE[status] || "var(--market-muted)";
  return (
    <span
      className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
      style={{ color: tone, borderColor: "var(--market-line-strong)" }}
    >
      {label}
    </span>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--market-muted)]">{label}</p>
      <p className="mt-1 break-words text-sm text-[var(--market-ink)]">{value}</p>
    </div>
  );
}

function DocumentRow({ doc }: { doc: AdminVendorApplicationDoc }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--market-line)] bg-[var(--market-bg-soft)] px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--market-ink)]">{doc.label}</p>
        <p className="truncate text-xs text-[var(--market-muted)]">{doc.name}</p>
      </div>
      {doc.previewUrl ? (
        <a
          href={doc.previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="market-button-secondary rounded-full px-4 py-1.5 text-xs font-semibold"
        >
          View document
        </a>
      ) : (
        <span className="text-xs font-medium text-[var(--market-muted)]">{doc.status || "not provided"}</span>
      )}
    </li>
  );
}

function ReviewCard({ application }: { application: AdminVendorApplication }) {
  return (
    <article className="market-paper rounded-[1.75rem] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="market-kicker">{application.plan ? `${application.plan} plan` : "Seller application"}</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--market-ink)]">
            {application.storeName}
          </h3>
          {application.slug ? (
            <p className="mt-1 text-sm text-[var(--market-muted)]">/{application.slug}</p>
          ) : null}
        </div>
        <div className="text-right">
          <StatusPill status={application.status} />
          {application.submittedAt ? (
            <p className="mt-2 text-xs text-[var(--market-muted)]">Submitted {formatDate(application.submittedAt)}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Legal name" value={application.legalName} />
        <Field label="Email" value={application.email} />
        <Field label="Phone" value={application.phone} />
        <Field label="Category" value={application.category} />
      </div>

      {application.story ? (
        <div className="mt-5 rounded-2xl border border-[var(--market-line)] bg-[var(--market-soft-wash)] p-4">
          <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--market-muted)]">
            Their pitch
          </p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--market-ink)]">
            {application.story}
          </p>
        </div>
      ) : null}

      <div className="mt-5">
        <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--market-muted)]">
          KYC documents
        </p>
        {application.documents.length ? (
          <ul className="mt-2 space-y-2">
            {application.documents.map((doc) => (
              <DocumentRow key={doc.key} doc={doc} />
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[var(--market-muted)]">No documents uploaded.</p>
        )}
      </div>

      <form action="/api/marketplace" method="POST" className="mt-6 border-t border-[var(--market-line)] pt-5">
        <input type="hidden" name="intent" value="admin_vendor_application_decision" />
        <input type="hidden" name="application_id" value={application.id} />
        <input type="hidden" name="return_to" value="/admin" />
        <label
          className="text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--market-muted)]"
          htmlFor={`note-${application.id}`}
        >
          Review note (optional — saved with your decision)
        </label>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            id={`note-${application.id}`}
            name="review_note"
            className="market-input min-w-[240px] flex-1 rounded-full px-4 py-2"
            placeholder="e.g. Verified registration + payout account"
          />
          <button name="decision" value="approved" className="market-button-primary rounded-full px-5 py-2 text-sm font-semibold">
            Approve seller
          </button>
          <button name="decision" value="rejected" className="market-button-secondary rounded-full px-5 py-2 text-sm font-semibold">
            Reject
          </button>
        </div>
      </form>
    </article>
  );
}

function DecidedCard({ application }: { application: AdminVendorApplication }) {
  return (
    <article className="rounded-3xl border border-[var(--market-line)] bg-[var(--market-bg-elevated)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold text-[var(--market-ink)]">{application.storeName}</p>
          <p className="mt-1 text-xs text-[var(--market-muted)]">
            {application.legalName || application.email}
            {application.reviewedAt ? ` · ${formatDate(application.reviewedAt)}` : ""}
          </p>
        </div>
        <StatusPill status={application.status} />
      </div>
      {application.reviewNote ? (
        <p className="mt-3 text-sm text-[var(--market-muted)]">“{application.reviewNote}”</p>
      ) : null}
    </article>
  );
}

function DraftRow({ application }: { application: AdminVendorApplication }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-[var(--market-line)] px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--market-ink)]">{application.storeName}</p>
        <p className="truncate text-xs text-[var(--market-muted)]">
          {application.email || "—"} · stalled at “{application.progressStep.replace(/_/g, " ")}”
        </p>
      </div>
      <span className="text-xs font-medium text-[var(--market-muted)]">Not submitted</span>
    </div>
  );
}

function SectionHeading({ title, count, hint }: { title: string; count: number; hint: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-[var(--market-ink)]">{title}</h2>
        <p className="mt-0.5 text-sm text-[var(--market-muted)]">{hint}</p>
      </div>
      <span className="rounded-full bg-[var(--market-soft-olive)] px-3 py-1 text-sm font-semibold text-[var(--market-ink)]">
        {count}
      </span>
    </div>
  );
}

export default async function AdminPage() {
  const locale = await getMarketplacePublicLocale();
  await requireMarketplaceRoles(["marketplace_owner", "marketplace_admin"], "/admin");
  const { submitted, decided, drafts } = await getAdminVendorApplications();

  return (
    <WorkspaceShell
      title="Seller applications"
      description="Review applicants with full context — KYC documents, their pitch, and contact — then approve or decline. Approving creates the storefront and grants seller access in one step."
      nav={staffNav("/admin", "/admin", locale)}
    >
      <div className="space-y-10">
        <section className="space-y-4">
          <SectionHeading
            title="Awaiting your review"
            count={submitted.length}
            hint="New sellers who have submitted everything and are waiting on you."
          />
          {submitted.length ? (
            <div className="space-y-5">
              {submitted.map((application) => (
                <ReviewCard key={application.id} application={application} />
              ))}
            </div>
          ) : (
            <div className="market-paper rounded-[1.75rem] p-6 text-sm text-[var(--market-muted)]">
              Nothing waiting — you’re all caught up. New applications appear here the moment a seller submits.
            </div>
          )}
        </section>

        {decided.length ? (
          <section className="space-y-4">
            <SectionHeading
              title="Decided"
              count={decided.length}
              hint="Approved and declined applications, kept for your records."
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {decided.map((application) => (
                <DecidedCard key={application.id} application={application} />
              ))}
            </div>
          </section>
        ) : null}

        {drafts.length ? (
          <section className="space-y-4">
            <SectionHeading
              title="Drafts"
              count={drafts.length}
              hint="Started but not yet submitted — no action needed from you."
            />
            <div className="space-y-2">
              {drafts.map((application) => (
                <DraftRow key={application.id} application={application} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </WorkspaceShell>
  );
}
