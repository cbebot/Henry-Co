import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CreditCard, ShieldAlert } from "lucide-react";
import PaymentReviewControls from "@/components/support/PaymentReviewControls";
import {
  WorkspaceEmptyState,
  WorkspaceHero,
  WorkspaceInfoTile,
  WorkspaceMetricCard,
  WorkspacePanel,
  tonePillClasses,
} from "@/components/dashboard/WorkspacePrimitives";
import { requireRoles } from "@/lib/auth/server";
import {
  getPaymentReviewQueue,
  type PaymentReviewQueueItem,
} from "@/lib/payments/verification";
import { logProtectedPageAccess } from "@/lib/security/logger";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Support Payment Proofs | Henry & Co. Fabric Care",
  description:
    "Payment proof review workspace for approvals, clarifications, and customer follow-up.",
};

type PageSearchParams = {
  q?: string | string[];
  status?: string | string[];
  payment?: string | string[];
};

function readParam(value?: string | string[]) {
  return Array.isArray(value) ? String(value[0] || "").trim() : String(value || "").trim();
}

function formatMoney(value?: number | null) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function matchesQuery(item: PaymentReviewQueueItem, query: string) {
  const haystack = JSON.stringify(item).toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function toneForVerification(status?: string | null) {
  const key = String(status || "").toLowerCase();
  if (key === "approved") return "success";
  if (key === "rejected") return "critical";
  if (key === "under_review" || key === "awaiting_corrected_proof") return "warning";
  if (key === "receipt_submitted") return "info";
  return "neutral";
}

function isImage(mimeType?: string | null) {
  return String(mimeType || "").startsWith("image/");
}

export default async function SupportPaymentsPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  await requireRoles(["owner", "manager", "support"]);
  const params = (await searchParams) ?? {};
  const q = readParam(params.q);
  const status = readParam(params.status) || "all";
  const selectedPaymentId = readParam(params.payment);

  await logProtectedPageAccess("/support/payments", {
    q: q || null,
    status: status !== "all" ? status : null,
    selected_payment: selectedPaymentId || null,
  });

  const queue = await getPaymentReviewQueue(220);
  const actionableQueue = queue.filter((item) => item.requestId);
  const filtered = actionableQueue
    .filter((item) => (status === "all" ? true : item.verificationStatus === status))
    .filter((item) => (q ? matchesQuery(item, q) : true));

  const selectedPayment =
    filtered.find((item) => item.requestId === selectedPaymentId) ?? filtered[0] ?? null;

  const submittedCount = actionableQueue.filter(
    (item) => item.verificationStatus === "receipt_submitted"
  ).length;
  const underReviewCount = actionableQueue.filter(
    (item) => item.verificationStatus === "under_review"
  ).length;
  const correctionCount = actionableQueue.filter(
    (item) => item.verificationStatus === "awaiting_corrected_proof"
  ).length;
  const mismatchCount = actionableQueue.filter((item) => item.suspiciousMismatch).length;

  return (
    <div className="space-y-8">
      <WorkspaceHero
        eyebrow="Receipt verification"
        title="Review proof with a cleaner list/detail workflow."
        description="Support payment review now has its own workspace. Triage the queue on the left, inspect the latest submission in detail, then approve, reject, or request a better proof without losing context."
        actions={
          <>
            <Link
              href="/support/inbox"
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
            >
              Open inbox
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/support/notifications"
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
            >
              View support alerts
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        }
      />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <WorkspaceMetricCard
          icon={CreditCard}
          label="Submitted proofs"
          value={String(submittedCount)}
          note="Fresh customer uploads waiting on a first review."
        />
        <WorkspaceMetricCard
          icon={ShieldAlert}
          label="Under review"
          value={String(underReviewCount)}
          note="Cases already moved into manual inspection."
        />
        <WorkspaceMetricCard
          icon={ArrowRight}
          label="Needs correction"
          value={String(correctionCount)}
          note="Customers asked to send clearer or more complete proof."
        />
        <WorkspaceMetricCard
          icon={ShieldAlert}
          label="Mismatch watch"
          value={String(mismatchCount)}
          note="Submissions flagged because the amount or proof pattern looks unusual."
        />
      </section>

      <WorkspacePanel
        eyebrow="Payment queue"
        title="Proof review desk"
        subtitle="Filter the queue, inspect the latest submission, and make the next customer-safe decision."
      >
        <div className="grid gap-6 2xl:grid-cols-[320px_minmax(0,0.78fr)_minmax(0,1.22fr)]">
          <section className="rounded-[1.9rem] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
              Queue filters
            </div>
            <form className="mt-5 grid gap-4" method="get">
              <label className="grid gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
                  Search
                </span>
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Customer, tracking code, request number, reference"
                  className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 outline-none transition focus:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-white/45">
                  Verification status
                </span>
                <select
                  name="status"
                  defaultValue={status}
                  className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-zinc-900 outline-none transition focus:border-[color:var(--accent)]/40 dark:border-white/10 dark:bg-[#0F1A2C] dark:text-white"
                >
                  <option value="all">All statuses</option>
                  <option value="receipt_submitted">Receipt submitted</option>
                  <option value="under_review">Under review</option>
                  <option value="awaiting_corrected_proof">Awaiting corrected proof</option>
                  <option value="rejected">Rejected</option>
                  <option value="approved">Approved</option>
                </select>
              </label>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-[#07111F]"
                >
                  Apply filters
                </button>
                <Link
                  href="/support/payments"
                  className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                >
                  Clear
                </Link>
              </div>
            </form>
          </section>

          <section className="rounded-[1.9rem] border border-black/10 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center justify-between gap-3 px-2 pb-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                  Queue rail
                </div>
                <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white">
                  Payment proofs
                </h3>
              </div>
              <div className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                {filtered.length} visible
              </div>
            </div>

            <div className="max-h-[66rem] space-y-3 overflow-y-auto pr-1">
              {filtered.length > 0 ? (
                filtered.map((item) => {
                  const active = selectedPayment?.requestId === item.requestId;
                  const href = `/support/payments?payment=${encodeURIComponent(
                    item.requestId || ""
                  )}${q ? `&q=${encodeURIComponent(q)}` : ""}${
                    status !== "all" ? `&status=${encodeURIComponent(status)}` : ""
                  }`;

                  return (
                    <Link
                      key={item.requestId}
                      href={href}
                      className={`block rounded-[1.5rem] border p-4 transition ${
                        active
                          ? "border-[color:var(--accent)]/28 bg-[color:var(--accent)]/10 shadow-[0_18px_48px_rgba(56,72,184,0.12)]"
                          : "border-black/10 bg-black/[0.03] hover:border-black/15 hover:bg-black/[0.04] dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                            {item.requestNo || item.trackingCode}
                          </div>
                          <div className="mt-1 truncate text-lg font-semibold text-zinc-950 dark:text-white">
                            {item.customerName}
                          </div>
                          <div className="mt-1 truncate text-sm text-zinc-500 dark:text-white/48">
                            {item.trackingCode} • {item.serviceType}
                          </div>
                        </div>

                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${tonePillClasses(
                            toneForVerification(item.verificationStatus)
                          )}`}
                        >
                          {item.verificationLabel}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                          due {formatMoney(item.amountDue)}
                        </span>
                        <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                          {item.receiptCount} upload{item.receiptCount === 1 ? "" : "s"}
                        </span>
                        {item.suspiciousMismatch ? (
                          <span className="rounded-full border border-red-300/30 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-700 dark:text-red-100">
                            mismatch watch
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-white/64">
                        {item.verificationMessage}
                      </p>
                    </Link>
                  );
                })
              ) : (
                <WorkspaceEmptyState
                  title="No payment proofs matched this filter"
                  text="Try a broader search or switch back to all statuses."
                />
              )}
            </div>
          </section>

          <section className="rounded-[1.9rem] border border-black/10 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            {selectedPayment ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                      Selected proof
                    </div>
                    <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white">
                      {selectedPayment.customerName}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-white/64">
                      {selectedPayment.verificationMessage}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${tonePillClasses(
                      toneForVerification(selectedPayment.verificationStatus)
                    )}`}
                  >
                    {selectedPayment.verificationLabel}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <WorkspaceInfoTile label="Tracking code" value={selectedPayment.trackingCode} />
                  <WorkspaceInfoTile label="Service" value={selectedPayment.serviceType} />
                  <WorkspaceInfoTile label="Booking status" value={selectedPayment.bookingStatus || "Unknown"} />
                  <WorkspaceInfoTile label="Amount due" value={formatMoney(selectedPayment.amountDue)} />
                  <WorkspaceInfoTile label="Recorded paid" value={formatMoney(selectedPayment.amountPaidRecorded)} />
                  <WorkspaceInfoTile label="Balance due" value={formatMoney(selectedPayment.balanceDue)} />
                  <WorkspaceInfoTile label="Requested" value={formatDateTime(selectedPayment.requestedAt)} />
                  <WorkspaceInfoTile label="Latest upload" value={formatDateTime(selectedPayment.lastSubmittedAt)} />
                  <WorkspaceInfoTile label="Last review" value={formatDateTime(selectedPayment.lastReviewedAt)} />
                </div>

                {selectedPayment.latestSubmission ? (
                  <div className="rounded-[1.6rem] border border-black/10 bg-black/[0.03] p-5 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                        {selectedPayment.latestSubmission.source.replaceAll("_", " ")}
                      </span>
                      <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                        submitted {formatDateTime(selectedPayment.latestSubmission.submittedAt)}
                      </span>
                      {selectedPayment.latestSubmission.suspiciousMismatch ? (
                        <span className="rounded-full border border-red-300/30 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-700 dark:text-red-100">
                          flagged mismatch
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <WorkspaceInfoTile
                        label="Payer"
                        value={selectedPayment.latestSubmission.payerName || "Not supplied"}
                      />
                      <WorkspaceInfoTile
                        label="Amount paid"
                        value={formatMoney(selectedPayment.latestSubmission.amountPaid)}
                      />
                      <WorkspaceInfoTile
                        label="Payment reference"
                        value={selectedPayment.latestSubmission.paymentReference || "Not supplied"}
                      />
                      <WorkspaceInfoTile
                        label="Paid at"
                        value={formatDateTime(selectedPayment.latestSubmission.paidAt)}
                      />
                    </div>

                    {selectedPayment.latestSubmission.note ? (
                      <div className="mt-4 rounded-[1.2rem] border border-black/10 bg-white/75 px-4 py-4 text-sm leading-7 text-zinc-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/66">
                        {selectedPayment.latestSubmission.note}
                      </div>
                    ) : null}

                    {selectedPayment.latestSubmission.attachments.length > 0 ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {selectedPayment.latestSubmission.attachments.map((attachment, index) => (
                          <div
                            key={`${attachment.fileName || attachment.url || index}`}
                            className="overflow-hidden rounded-[1.3rem] border border-black/10 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.05]"
                          >
                            {isImage(attachment.mimeType) && attachment.url ? (
                              <Image
                                src={attachment.url}
                                alt={attachment.fileName || "Receipt attachment"}
                                width={900}
                                height={620}
                                unoptimized
                                className="h-44 w-full rounded-[1rem] object-cover"
                              />
                            ) : (
                              <div className="flex h-44 items-center justify-center rounded-[1rem] border border-dashed border-black/10 bg-black/[0.03] text-sm font-semibold text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55">
                                Receipt file
                              </div>
                            )}

                            <div className="mt-3 text-sm font-semibold text-zinc-950 dark:text-white">
                              {attachment.fileName || "Receipt attachment"}
                            </div>

                            {attachment.url ? (
                              <a
                                href={attachment.url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
                              >
                                Open file
                                <ArrowRight className="h-3.5 w-3.5" />
                              </a>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <WorkspaceEmptyState
                    title="No uploaded proof yet"
                    text="The booking is in the review queue, but there is no captured submission attached to this request yet."
                  />
                )}

                <div className="rounded-[1.6rem] border border-black/10 bg-white/75 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                    Review controls
                  </div>
                  <div className="mt-4">
                    <PaymentReviewControls
                      requestId={selectedPayment.requestId || ""}
                      amountDue={selectedPayment.amountDue}
                      latestAmountPaid={selectedPayment.latestSubmission?.amountPaid}
                      latestReference={selectedPayment.latestSubmission?.paymentReference}
                      latestReviewReason={selectedPayment.latestReviewReason}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <WorkspaceEmptyState
                title="Choose a payment proof"
                text="Select a request from the queue to inspect the latest submission and decide the next step."
              />
            )}
          </section>
        </div>
      </WorkspacePanel>
    </div>
  );
}
