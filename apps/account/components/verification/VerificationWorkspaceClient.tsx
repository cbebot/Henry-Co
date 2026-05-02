"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCheck,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { ButtonPendingContent } from "@henryco/ui";
import type {
  VerificationState,
  VerificationStatus,
  VerificationSubmission,
} from "@/lib/verification";
import { formatDate } from "@/lib/format";

type TrustSummary = {
  tierLabel: string;
  score: number;
  nextTierLabel: string | null;
  requirements: string[];
};

type VerificationWorkspaceClientProps = {
  initialVerification: VerificationState;
  trust: TrustSummary;
};

const REQUIRED_DOC_TYPES = ["government_id", "selfie"] as const;
const OPTIONAL_DOC_TYPES = ["address_proof", "business_cert"] as const;

const docTypeDescription: Record<string, string> = {
  government_id:
    "National ID, passport, driver's license, or another government document with your full details visible.",
  selfie:
    "A selfie holding the same identity document so review can confirm liveness and document ownership.",
  address_proof:
    "Utility bill, bank statement, or official correspondence from the last three months.",
  business_cert:
    "CAC certificate, business registration, or equivalent operating proof for seller and employer review lanes.",
};

const docTypeIcon: Record<string, typeof FileCheck> = {
  government_id: FileCheck,
  selfie: Camera,
  address_proof: MapPin,
  business_cert: Building2,
};

const statusMeta: Record<
  VerificationStatus,
  {
    label: string;
    tone: string;
    icon: typeof Clock3;
    description: string;
  }
> = {
  none: {
    label: "Not started",
    tone: "acct-chip-gold",
    icon: Clock3,
    description:
      "Identity verification has not started yet. Wallet withdrawals, seller approval, employer verification, and higher-trust actions stay gated.",
  },
  pending: {
    label: "Submitted for review",
    tone: "acct-chip-orange",
    icon: Clock3,
    description:
      "Your documents are in the verification queue. Review-sensitive actions stay paused until approval is complete.",
  },
  verified: {
    label: "Approved",
    tone: "acct-chip-green",
    icon: CheckCircle2,
    description:
      "Identity verification is approved. Higher-trust lanes can now rely on real document review instead of placeholder confidence.",
  },
  rejected: {
    label: "Needs more information",
    tone: "acct-chip-red",
    icon: XCircle,
    description:
      "The last submission was not approved. Review the note, replace the affected file, and resubmit without leaving this page.",
  },
};

function humanizeSubmissionStatus(status: string) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Needs more information";
  return "Under review";
}

function statusChip(status: string) {
  if (status === "approved") return "acct-chip-green";
  if (status === "rejected") return "acct-chip-red";
  return "acct-chip-orange";
}

function buildSubmissionMap(submissions: VerificationSubmission[]) {
  return submissions.reduce<Map<string, VerificationSubmission>>((map, item) => {
    if (!map.has(item.documentType)) {
      map.set(item.documentType, item);
    }
    return map;
  }, new Map<string, VerificationSubmission>());
}

export default function VerificationWorkspaceClient({
  initialVerification,
  trust,
}: VerificationWorkspaceClientProps) {
  const router = useRouter();
  const [verification, setVerification] = useState(initialVerification);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const submissionsByType = useMemo(
    () => buildSubmissionMap(verification.submissions),
    [verification.submissions]
  );

  async function handleUpload(documentType: string, file: File | null, input: HTMLInputElement) {
    if (!file) return;

    setUploadingType(documentType);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.set("document_type", documentType);
      formData.set("file", file, file.name);

      const response = await fetch("/api/verify", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "x-henryco-async": "1",
        },
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string;
            message?: string;
            verification?: VerificationState;
            submission?: VerificationSubmission;
          }
        | null;

      if (!response.ok || !payload?.verification || !payload.submission) {
        console.error("[verification/upload] request failed", {
          status: response.status,
          documentType,
          serverError: payload?.error ?? null,
        });
        setMessage({
          type: "error",
          text: "We couldn't add that file to the review queue. Try again in a moment, or contact support if it keeps happening.",
        });
        return;
      }

      const nextSubmissions = [
        payload.submission,
        ...verification.submissions.filter(
          (item) =>
            item.documentType !== payload.submission?.documentType ||
            (item.status !== "pending" && item.status !== "rejected")
        ),
      ];

      setVerification({
        ...payload.verification,
        submissions: nextSubmissions,
      });
      setMessage({
        type: "success",
        text: payload.message || `${file.name} uploaded and added to the review queue.`,
      });
      input.value = "";
      router.refresh();
    } catch (error) {
      console.error("[verification/upload] network or parse error", error);
      setMessage({
        type: "error",
        text: "We couldn't reach the verification service. Check your connection and try again.",
      });
    } finally {
      setUploadingType(null);
    }
  }

  const currentStatus = statusMeta[verification.status];
  const StatusIcon = currentStatus.icon;

  return (
    <div className="space-y-6" data-live-refresh-pause="true">
      <section className="acct-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="acct-kicker">Identity verification</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <StatusIcon
                size={22}
                className={
                  verification.status === "verified"
                    ? "text-emerald-600"
                    : verification.status === "rejected"
                      ? "text-[var(--acct-red)]"
                      : "text-[var(--acct-gold)]"
                }
              />
              <h2 className="text-2xl font-semibold text-[var(--acct-ink)]">
                {currentStatus.label}
              </h2>
              <span className={`acct-chip ${currentStatus.tone}`}>{currentStatus.label}</span>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--acct-muted)]">
              {currentStatus.description}
            </p>
            {verification.reviewerNote ? (
              <div className="mt-4 rounded-[1.4rem] border border-[var(--acct-line)] bg-[var(--acct-bg-elevated)] p-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--acct-muted)]">
                  Review note
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--acct-ink)]">
                  {verification.reviewerNote}
                </p>
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--acct-muted)]">
              {verification.submittedAt ? (
                <span>Submitted {formatDate(verification.submittedAt)}</span>
              ) : null}
              {verification.reviewedAt ? (
                <span>Reviewed {formatDate(verification.reviewedAt)}</span>
              ) : null}
            </div>
          </div>

          <div className="grid min-w-[250px] gap-3 sm:grid-cols-2">
            <div className="rounded-[1.35rem] bg-[var(--acct-blue-soft)] px-4 py-4">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--acct-blue)]">
                Trust score
              </p>
              <p className="mt-2 text-3xl font-semibold text-[var(--acct-ink)]">{trust.score}</p>
              <p className="mt-1 text-sm text-[var(--acct-muted)]">{trust.tierLabel}</p>
            </div>
            <div className="rounded-[1.35rem] bg-[var(--acct-surface)] px-4 py-4">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--acct-muted)]">
                Review queue
              </p>
              <p className="mt-2 text-3xl font-semibold text-[var(--acct-ink)]">
                {verification.pendingSubmissionCount}
              </p>
              <p className="mt-1 text-sm text-[var(--acct-muted)]">
                pending · {verification.approvedSubmissionCount} approved ·{" "}
                {verification.rejectedSubmissionCount} needs attention
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <article className="acct-card p-5">
          <p className="acct-kicker">What approval unlocks</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              "Wallet withdrawals and payout release requests",
              "Marketplace seller approval and trust passport uplift",
              "Jobs employer verification and higher-trust posting lanes",
              "Higher-risk property submission and ownership review lanes",
              "Cleaner staff review signals across HenryCo divisions",
              "Honest trust scoring that can actually reach premium tiers",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-[1.2rem] bg-[var(--acct-surface)] px-4 py-3 text-sm text-[var(--acct-ink)]"
              >
                <ShieldCheck size={14} className="shrink-0 text-emerald-600" />
                {item}
              </div>
            ))}
          </div>
        </article>

        <article className="acct-card p-5">
          <p className="acct-kicker">Next strongest move</p>
          <div className="mt-4 space-y-3">
            {(trust.requirements.length > 0
              ? trust.requirements
              : ["Your account is already inside the current highest trust lane exposed by shared verification."]).map(
              (item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-[1.2rem] bg-[var(--acct-surface)] px-4 py-3 text-sm leading-7 text-[var(--acct-muted)]"
                >
                  <ChevronRight size={14} className="mt-1 shrink-0 text-[var(--acct-gold)]" />
                  <span>{item}</span>
                </div>
              )
            )}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/documents"
              className="rounded-full border border-[var(--acct-line)] px-4 py-2 text-xs font-semibold text-[var(--acct-ink)] hover:bg-[var(--acct-surface)]"
            >
              Review documents
            </Link>
            <Link
              href="/support/new"
              className="rounded-full border border-[var(--acct-line)] px-4 py-2 text-xs font-semibold text-[var(--acct-ink)] hover:bg-[var(--acct-surface)]"
            >
              Contact support
            </Link>
          </div>
        </article>
      </section>

      {message ? (
        <div
          className={`rounded-[1.35rem] px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-[var(--acct-green-soft)] text-[var(--acct-green)]"
              : "bg-[var(--acct-red-soft)] text-[var(--acct-red)]"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <section className="space-y-4">
        <div>
          <p className="acct-kicker">Required documents</p>
          <p className="mt-2 text-sm leading-7 text-[var(--acct-muted)]">
            These are the files HenryCo uses to review identity truthfully. Uploads are async and replace rejected or in-flight files without throwing you out of the page.
          </p>
        </div>
        {REQUIRED_DOC_TYPES.map((type) => {
          const Icon = docTypeIcon[type] || FileCheck;
          const submission = submissionsByType.get(type);
          const uploading = uploadingType === type;

          return (
            <label key={type} className="acct-card block p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-[var(--acct-surface)]">
                  <Icon size={18} className="text-[var(--acct-muted)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--acct-ink)]">
                        {type === "government_id"
                          ? "Government-issued ID"
                          : type === "selfie"
                            ? "Selfie with ID"
                            : type}
                      </p>
                      <p className="mt-1 text-sm leading-7 text-[var(--acct-muted)]">
                        {docTypeDescription[type]}
                      </p>
                    </div>
                    <span className={`acct-chip ${submission ? statusChip(submission.status) : "acct-chip-gold"}`}>
                      {submission ? humanizeSubmissionStatus(submission.status) : "Required"}
                    </span>
                  </div>
                  {submission?.reviewerNote ? (
                    <div className="mt-3 rounded-[1rem] bg-[rgba(232,88,88,0.08)] px-4 py-3 text-sm text-[var(--acct-red)]">
                      {submission.reviewerNote}
                    </div>
                  ) : null}
                  {submission?.submittedAt ? (
                    <p className="mt-3 text-xs text-[var(--acct-muted)]">
                      Submitted {formatDate(submission.submittedAt)}
                      {submission.reviewedAt ? ` · Reviewed ${formatDate(submission.reviewedAt)}` : ""}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  className="block w-full text-sm text-[var(--acct-muted)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--acct-gold-soft)] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-[var(--acct-gold)]"
                  disabled={uploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    void handleUpload(type, file, event.target);
                  }}
                />
                <span
                  className={`rounded-full bg-[var(--acct-gold)] px-5 py-2 text-xs font-semibold text-white ${
                    uploading ? "opacity-60" : ""
                  }`}
                >
                  <ButtonPendingContent
                    pending={uploading}
                    pendingLabel="Uploading..."
                    spinnerLabel="Uploading verification file"
                  >
                    {submission ? "Replace file" : "Upload file"}
                  </ButtonPendingContent>
                </span>
                {uploading ? (
                  <span className="inline-flex items-center gap-2 text-xs text-[var(--acct-muted)]">
                    <LoaderCircle size={14} className="animate-spin" />
                    Uploading without leaving the page
                  </span>
                ) : null}
              </div>
            </label>
          );
        })}
      </section>

      <section className="space-y-4">
        <div>
          <p className="acct-kicker">Optional reinforcement</p>
          <p className="mt-2 text-sm leading-7 text-[var(--acct-muted)]">
            These files strengthen seller, employer, property, and payout-adjacent reviews when a workflow needs more evidence.
          </p>
        </div>
        {OPTIONAL_DOC_TYPES.map((type) => {
          const Icon = docTypeIcon[type] || FileCheck;
          const submission = submissionsByType.get(type);
          const uploading = uploadingType === type;

          return (
            <label key={type} className="acct-card block p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-[var(--acct-surface)]">
                  <Icon size={18} className="text-[var(--acct-muted)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--acct-ink)]">
                        {type === "address_proof"
                          ? "Proof of address"
                          : type === "business_cert"
                            ? "Business registration"
                            : type}
                      </p>
                      <p className="mt-1 text-sm leading-7 text-[var(--acct-muted)]">
                        {docTypeDescription[type]}
                      </p>
                    </div>
                    <span className={`acct-chip ${submission ? statusChip(submission.status) : "acct-chip-blue"}`}>
                      {submission ? humanizeSubmissionStatus(submission.status) : "Optional"}
                    </span>
                  </div>
                  {submission?.submittedAt ? (
                    <p className="mt-3 text-xs text-[var(--acct-muted)]">
                      Submitted {formatDate(submission.submittedAt)}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  className="block w-full text-sm text-[var(--acct-muted)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--acct-blue-soft)] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-[var(--acct-blue)]"
                  disabled={uploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    void handleUpload(type, file, event.target);
                  }}
                />
                <span
                  className={`rounded-full bg-[var(--acct-blue)] px-5 py-2 text-xs font-semibold text-white ${
                    uploading ? "opacity-60" : ""
                  }`}
                >
                  <ButtonPendingContent
                    pending={uploading}
                    pendingLabel="Uploading..."
                    spinnerLabel="Uploading supporting verification file"
                  >
                    {submission ? "Replace file" : "Upload file"}
                  </ButtonPendingContent>
                </span>
              </div>
            </label>
          );
        })}
      </section>
    </div>
  );
}
