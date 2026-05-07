import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  FileCheck2,
  Receipt,
  Shield,
  UploadCloud,
} from "lucide-react";

import { HenryCoHeroCard } from "@henryco/ui/public-shell";
import { StudioFileField } from "@/components/studio/studio-file-field";
import { StudioPaymentGuide } from "@/components/studio/payment-guide";
import { StudioSubmitButton } from "@/components/studio/submit-button";
import { uploadPaymentProofAction } from "@/lib/studio/actions";
import { getStudioViewer } from "@/lib/studio/auth";
import { getPaymentWorkspace } from "@/lib/studio/data";
import { getStudioSnapshot } from "@/lib/studio/store";
import { formatCurrency } from "@/lib/env";
import {
  getStudioAccountUrl,
  getStudioLoginUrl,
} from "@/lib/studio/links";
import { friendlyPaymentStatus } from "@/lib/studio/project-workspace-copy";
import { withStudioToast } from "@/lib/studio/redirect-with-toast";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Studio · Payment workspace",
  description:
    "Send payment proof and track confirmation for your Henry & Co. Studio engagement.",
  robots: { index: false, follow: false },
};

function formatDueDate(value: string | null) {
  if (!value) return "On scope confirmation";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "On scope confirmation";
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function relativeProjectPath(projectId: string, accessKey: string | null) {
  const search = accessKey ? `?access=${encodeURIComponent(accessKey)}` : "";
  return `/project/${projectId}${search}`;
}

function proofDateLabel(value: string | null) {
  if (!value) return "now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "now";
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * /pay/[paymentId] — focused customer-facing payment workspace.
 *
 * Composition (mobile-first):
 *   - HenryCoHeroCard at top with payment context (project, milestone,
 *     amount due, status pill, due-by) — clamp typography, no oversized
 *     hand-rolled hero panel.
 *   - StudioPaymentGuide directly below — bank details + step-by-step +
 *     support contacts. Reuses the rewritten hairline-divided component
 *     so the whole surface stays of-a-piece.
 *   - Inline proof-upload form scoped to THIS payment so customers
 *     don't have to navigate back to /project/<id> to send proof.
 *   - Quiet bottom rail with deep-link back to project workspace and
 *     account home.
 *
 * Access model: same as /project/[projectId]. Either the viewer is
 * authenticated and owns the project's lead, or they hit the route with
 * the project's access key (deep-link from email/proposal). On any
 * mismatch we redirect to login (if no session) or the account hub.
 */
export default async function StudioPaymentWorkspace({
  params,
  searchParams,
}: {
  params: Promise<{ paymentId: string }>;
  searchParams: Promise<{ access?: string }>;
}) {
  const { paymentId } = await params;
  const { access } = await searchParams;
  const accessKey = access?.trim() || null;

  // V5-CLEAR Bug B: parallelize the viewer + snapshot fetch. getPaymentWorkspace
  // accepts a pre-fetched snapshot, so the two independent reads can run as a
  // Promise.all instead of sequentially blocking on viewer first.
  const [viewer, snapshot] = await Promise.all([
    getStudioViewer(),
    getStudioSnapshot(),
  ]);
  const workspace = await getPaymentWorkspace({
    paymentId,
    accessKey,
    viewer,
    snapshot,
  });

  if (!workspace) {
    if (!viewer.user) {
      redirect(getStudioLoginUrl(`/pay/${paymentId}${accessKey ? `?access=${accessKey}` : ""}`));
    }
    redirect(withStudioToast(getStudioAccountUrl(), "payment_not_found"));
  }

  const { payment, project, milestone, platform, sameProjectPayments } = workspace;
  const projectAccessKey = project.accessKey ?? accessKey;
  const projectHref = relativeProjectPath(project.id, projectAccessKey);
  const paidIndex = sameProjectPayments.findIndex((p) => p.id === payment.id);
  const paymentRank = paidIndex >= 0 ? paidIndex + 1 : 1;
  const totalPayments = sameProjectPayments.length || 1;

  const statusLabel = friendlyPaymentStatus(payment.status);
  const dueLabel = formatDueDate(payment.dueDate);
  const isPaid = payment.status === "paid";
  const isProcessing = payment.status === "processing";
  const proofOnFile = Boolean(payment.proofName || payment.proofUrl);

  const heroBody = isPaid
    ? "Payment confirmed. Thank you — your project lane stays moving."
    : isProcessing
      ? "Payment proof received. Finance is verifying — you can track confirmation here."
      : "Send your payment using the verified company details below, then attach your proof so finance can confirm and unlock the next milestone.";

  /** Inline upload submits to the existing uploadPaymentProofAction so
   * we keep one canonical proof pipeline. We redirect back to THIS page
   * post-upload so the customer sees the status update. */
  const uploadRedirect = `/pay/${payment.id}${projectAccessKey ? `?access=${projectAccessKey}` : ""}`;

  return (
    <main className="mx-auto max-w-[64rem] px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
      {/* Quiet breadcrumb back to project — single line, no chrome */}
      <Link
        href={projectHref}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-ink-soft)] transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--studio-signal)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 [@media(hover:hover)]:hover:text-[var(--studio-ink)]"
      >
        <ArrowLeft className="h-3 w-3" />
        Project workspace
      </Link>

      {/* Visually-hidden h1 — gives the page a proper landmark heading
          for screen readers and SEO without duplicating the visible
          HeroCard h2 below. */}
      <h1 className="sr-only">
        Payment workspace · {payment.label || "Studio payment"} · {project.title}
      </h1>

      {/* Premium payment hero — the same HenryCoHeroCard primitive
          used across the platform. Status-aware copy. */}
      <div className="mt-5">
        <HenryCoHeroCard
          tone="contrast"
          accentVar="var(--studio-signal, #97f4f3)"
          eyebrow={`Payment · ${paymentRank} of ${totalPayments}`}
          title={payment.label || "Studio payment"}
          body={heroBody}
          rows={[
            {
              key: "amount",
              icon: <Receipt className="h-4 w-4" />,
              label: "Amount due",
              value: formatCurrency(payment.amount, payment.currency),
            },
            {
              key: "status",
              icon: <Shield className="h-4 w-4" />,
              label: "Status",
              value: statusLabel,
            },
            {
              key: "due",
              icon: <CalendarClock className="h-4 w-4" />,
              label: "Due",
              value: dueLabel,
            },
            ...(milestone
              ? [
                  {
                    key: "milestone",
                    label: "Milestone",
                    value: milestone.name,
                  },
                ]
              : []),
            {
              key: "project",
              label: "Project",
              value: project.title,
            },
          ]}
          footer={
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>Reference your project name on the transfer.</span>
              <Link
                href={projectHref}
                className="font-semibold text-[var(--studio-signal)] underline-offset-4 transition [@media(hover:hover)]:hover:underline"
              >
                Open project workspace
              </Link>
            </div>
          }
        />
      </div>

      {/* Bank details + step-by-step + support — the rewritten,
          hairline-divided StudioPaymentGuide. Identical data shape used
          on the proposal page so finance copy stays consistent. */}
      {!isPaid && !proofOnFile ? (
        <div className="mt-6">
          <StudioPaymentGuide
            title="Send the deposit using the verified company account"
            amount={payment.amount}
            currency={payment.currency}
            statusLabel={statusLabel}
            dueLabel={`Due ${dueLabel}`}
            instructions="Bank transfer is the active payment method. Proof can be a debit alert screenshot, bank receipt, or PDF — anything showing amount, date, and destination."
            bankName={platform.paymentBankName}
            accountName={platform.paymentAccountName}
            accountNumber={platform.paymentAccountNumber}
            supportEmail={platform.paymentSupportEmail}
            supportWhatsApp={platform.paymentSupportWhatsApp}
            proofHint="After sending, attach the proof below — finance reviews within one business day. You'll see the status flip to processing here as soon as the upload lands."
          />
        </div>
      ) : null}

      {proofOnFile && !isPaid ? (
        <section className="mt-6 rounded-[1.4rem] border border-[rgba(151,244,243,0.3)] bg-[rgba(151,244,243,0.07)] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[rgba(151,244,243,0.35)] bg-[rgba(151,244,243,0.08)] text-[var(--studio-signal)]">
              <FileCheck2 className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                Payment proof received
              </div>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--studio-ink)]">
                Finance is verifying this transfer
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--studio-ink-soft)]">
                {payment.proofName ? (
                  <>
                    <span className="font-semibold text-[var(--studio-ink)]">{payment.proofName}</span>{" "}
                    is attached to this payment. We are matching it to the bank transfer and will
                    mark the checkpoint confirmed once it clears.
                  </>
                ) : (
                  "A proof file is attached to this payment. We are matching it to the bank transfer and will mark the checkpoint confirmed once it clears."
                )}
              </p>
              <div className="mt-4 grid gap-3 text-[12.5px] text-[var(--studio-ink-soft)] sm:grid-cols-3">
                <div className="rounded-[1rem] border border-[var(--studio-line)] bg-black/10 px-3 py-2">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-signal)]">
                    Status
                  </span>
                  <span className="mt-1 block font-semibold text-[var(--studio-ink)]">{statusLabel}</span>
                </div>
                <div className="rounded-[1rem] border border-[var(--studio-line)] bg-black/10 px-3 py-2">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-signal)]">
                    Submitted
                  </span>
                  <span className="mt-1 block font-semibold text-[var(--studio-ink)]">
                    {proofDateLabel(payment.updatedAt)}
                  </span>
                </div>
                <div className="rounded-[1rem] border border-[var(--studio-line)] bg-black/10 px-3 py-2">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--studio-signal)]">
                    Next
                  </span>
                  <span className="mt-1 block font-semibold text-[var(--studio-ink)]">Finance confirmation</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Inline proof upload — only when the payment is still open.
          Submits to the existing canonical action so we don't fork the
          finance pipeline. */}
      {!isPaid && !proofOnFile ? (
        <section className="mt-6 rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--studio-line)] bg-[rgba(151,244,243,0.06)] text-[var(--studio-signal)]">
              <UploadCloud className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
                {isProcessing ? "Attach the missing proof" : "Send your proof"}
              </div>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--studio-ink-soft)]">
                Upload your receipt or alert. Finance reviews and confirms within one business day —
                this page will update automatically.
              </p>
            </div>
          </div>
          <form action={uploadPaymentProofAction} className="mt-4 space-y-4">
            <input type="hidden" name="paymentId" value={payment.id} />
            <input type="hidden" name="redirectPath" value={uploadRedirect} />
            <input type="hidden" name="accessKey" value={projectAccessKey ?? ""} />
            <StudioFileField
              name="proof"
              required
              variant="compact"
              title="Payment proof file"
              description="Bank receipt, debit alert screenshot, or PDF — must show amount, date, and destination."
              footerHint="We trim the file name to a clean label finance can scan quickly."
            />
            <StudioSubmitButton label="Submit payment proof" pendingLabel="Uploading…" />
          </form>
        </section>
      ) : null}

      {/* Confirmed payment: quiet receipt-style summary instead of the
          full guide + upload form. */}
      {isPaid ? (
        <section className="mt-6 rounded-[1.4rem] border border-[var(--studio-line)] bg-black/10 p-5 sm:p-6">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[var(--studio-signal)]">
            Receipt
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--studio-ink-soft)]">
            Confirmed on {payment.updatedAt ? new Date(payment.updatedAt).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" }) : "—"}.
            {payment.proofName ? ` Proof on file: ${payment.proofName}.` : ""} Your project
            workspace shows the milestone unlock and the next step.
          </p>
          <Link
            href={projectHref}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--studio-signal)] underline-offset-4 transition [@media(hover:hover)]:hover:underline"
          >
            Open project workspace
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      ) : null}

      {/* Quiet bottom navigation — never a panel-on-panel grid. */}
      <nav className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--studio-line)] pt-6 text-[12.5px] text-[var(--studio-ink-soft)]">
        <Link
          href={projectHref}
          className="inline-flex items-center gap-1.5 font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--studio-signal)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 [@media(hover:hover)]:hover:text-[var(--studio-ink)]"
        >
          <ArrowLeft className="h-3 w-3" />
          Project workspace
        </Link>
        <Link
          href={getStudioAccountUrl()}
          className="inline-flex items-center gap-1.5 font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--studio-signal)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 [@media(hover:hover)]:hover:text-[var(--studio-ink)]"
        >
          HenryCo account home
          <ArrowRight className="h-3 w-3" />
        </Link>
      </nav>
    </main>
  );
}
