import Link from "next/link";
import {
  ShieldCheck,
  FileCheck,
  Camera,
  MapPin,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { requireAccountUser } from "@/lib/auth";
import { getAccountTrustProfile, getTrustTierLabel } from "@/lib/trust";
import {
  getVerificationState,
  getDocumentTypeLabel,
  type VerificationStatus,
} from "@/lib/verification";
import { formatDate } from "@/lib/format";
import PageHeader from "@/components/layout/PageHeader";

export const dynamic = "force-dynamic";

const statusConfig: Record<
  VerificationStatus,
  { label: string; chipClass: string; description: string }
> = {
  none: {
    label: "Not submitted",
    chipClass: "acct-chip-gold",
    description:
      "Submit your identity documents to unlock wallet withdrawals, seller privileges, and higher trust access.",
  },
  pending: {
    label: "Under review",
    chipClass: "acct-chip-orange",
    description:
      "Your documents are being reviewed. Most reviews complete within 24 hours on business days.",
  },
  verified: {
    label: "Verified",
    chipClass: "acct-chip-green",
    description:
      "Your identity has been verified. Wallet withdrawals, seller approval, and sensitive actions are unlocked.",
  },
  rejected: {
    label: "Needs resubmission",
    chipClass: "acct-chip-red",
    description:
      "Your documents could not be verified. Please review the feedback below and resubmit.",
  },
};

const docTypeIcon: Record<string, typeof FileCheck> = {
  government_id: FileCheck,
  selfie: Camera,
  address_proof: MapPin,
  business_cert: Building2,
};

const docTypeDescription: Record<string, string> = {
  government_id:
    "National ID, international passport, driver's license, or voter's card. Must be valid and clearly legible.",
  selfie:
    "A photo of you holding the same ID document next to your face. Both your face and the document must be clearly visible.",
  address_proof:
    "Utility bill, bank statement, or official correspondence dated within the last 3 months showing your current address.",
  business_cert:
    "CAC certificate, business name registration, or equivalent local documentation. Required only for seller accounts.",
};

const REQUIRED_DOC_TYPES = ["government_id", "selfie"] as const;
const OPTIONAL_DOC_TYPES = ["address_proof", "business_cert"] as const;

export default async function VerifyPage() {
  const user = await requireAccountUser();
  const [trust, verification] = await Promise.all([
    getAccountTrustProfile(user.id),
    getVerificationState(user.id),
  ]);

  const config = statusConfig[verification.status];
  const submissionsByType = new Map(
    verification.submissions.map((s) => [s.documentType, s])
  );

  return (
    <div className="space-y-6 acct-fade-in">
      <PageHeader
        title="Verify your identity"
        description="Document-based verification unlocks sensitive actions and higher trust tiers."
        icon={ShieldCheck}
      />

      {/* Status Banner */}
      <div className="acct-card p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="acct-kicker mb-1">Verification status</p>
            <div className="flex items-center gap-3">
              {verification.status === "verified" ? (
                <CheckCircle2 size={24} className="text-emerald-600" />
              ) : verification.status === "rejected" ? (
                <XCircle size={24} className="text-[var(--acct-red)]" />
              ) : (
                <Clock size={24} className="text-[var(--acct-muted)]" />
              )}
              <p className="text-lg font-semibold text-[var(--acct-ink)]">
                {config.label}
              </p>
            </div>
            <p className="mt-2 text-sm text-[var(--acct-muted)]">
              {config.description}
            </p>
            {verification.reviewerNote ? (
              <p className="mt-2 rounded-xl bg-[var(--acct-surface)] p-3 text-sm text-[var(--acct-ink)]">
                {verification.reviewerNote}
              </p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="text-[0.65rem] font-semibold uppercase text-[var(--acct-muted)]">
              Trust tier
            </p>
            <p className="mt-1 text-lg font-bold text-[var(--acct-gold)]">
              {getTrustTierLabel(trust.tier)}
            </p>
            <p className="text-xs text-[var(--acct-muted)]">
              Score: {trust.score}/100
            </p>
          </div>
        </div>
      </div>

      {/* What verification unlocks */}
      <div className="acct-card p-5">
        <p className="acct-kicker mb-3">What verification unlocks</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            "Wallet withdrawals and payouts",
            "Marketplace seller approval",
            "Higher referral reward limits",
            "Priority support queue placement",
            "Jobs verified-employer badge",
            "Property booking verification bypass",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-xl bg-[var(--acct-surface)] px-4 py-3 text-sm text-[var(--acct-ink)]"
            >
              <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Required Documents */}
      <div>
        <p className="acct-kicker mb-3">Required documents</p>
        <div className="space-y-3">
          {REQUIRED_DOC_TYPES.map((type) => {
            const Icon = docTypeIcon[type] || FileCheck;
            const submission = submissionsByType.get(type);
            const canUpload =
              !submission || submission.status === "rejected";
            return (
              <div key={type} className="acct-card p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--acct-surface)]">
                    <Icon size={18} className="text-[var(--acct-muted)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--acct-ink)]">
                        {getDocumentTypeLabel(type)}
                      </p>
                      {submission ? (
                        <span
                          className={`acct-chip ${
                            submission.status === "approved"
                              ? "acct-chip-green"
                              : submission.status === "rejected"
                                ? "acct-chip-red"
                                : "acct-chip-orange"
                          }`}
                        >
                          {submission.status}
                        </span>
                      ) : (
                        <span className="acct-chip acct-chip-gold">
                          required
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[var(--acct-muted)]">
                      {docTypeDescription[type]}
                    </p>
                    {submission?.reviewerNote ? (
                      <p className="mt-2 rounded-lg bg-[rgba(232,88,88,0.08)] px-3 py-2 text-xs text-[var(--acct-red)]">
                        {submission.reviewerNote}
                      </p>
                    ) : null}
                    {submission?.submittedAt ? (
                      <p className="mt-2 text-xs text-[var(--acct-muted)]">
                        Submitted {formatDate(submission.submittedAt)}
                        {submission.reviewedAt
                          ? ` · Reviewed ${formatDate(submission.reviewedAt)}`
                          : ""}
                      </p>
                    ) : null}
                  </div>
                </div>
                {canUpload ? (
                  <form
                    action="/api/verify"
                    method="POST"
                    encType="multipart/form-data"
                    className="mt-4"
                  >
                    <input type="hidden" name="document_type" value={type} />
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        name="file"
                        accept="image/*,.pdf"
                        required
                        className="block w-full text-sm text-[var(--acct-muted)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--acct-gold-soft)] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-[var(--acct-gold)]"
                      />
                      <button
                        type="submit"
                        className="shrink-0 rounded-full bg-[var(--acct-gold)] px-5 py-2 text-xs font-semibold text-white"
                      >
                        Upload
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Optional Documents */}
      <div>
        <p className="acct-kicker mb-3">Optional documents</p>
        <div className="space-y-3">
          {OPTIONAL_DOC_TYPES.map((type) => {
            const Icon = docTypeIcon[type] || FileCheck;
            const submission = submissionsByType.get(type);
            const canUpload =
              !submission || submission.status === "rejected";
            return (
              <div key={type} className="acct-card p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--acct-surface)]">
                    <Icon size={18} className="text-[var(--acct-muted)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--acct-ink)]">
                        {getDocumentTypeLabel(type)}
                      </p>
                      {submission ? (
                        <span
                          className={`acct-chip ${
                            submission.status === "approved"
                              ? "acct-chip-green"
                              : submission.status === "rejected"
                                ? "acct-chip-red"
                                : "acct-chip-orange"
                          }`}
                        >
                          {submission.status}
                        </span>
                      ) : (
                        <span className="acct-chip acct-chip-gold">
                          optional
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[var(--acct-muted)]">
                      {docTypeDescription[type]}
                    </p>
                    {submission?.submittedAt ? (
                      <p className="mt-2 text-xs text-[var(--acct-muted)]">
                        Submitted {formatDate(submission.submittedAt)}
                      </p>
                    ) : null}
                  </div>
                </div>
                {canUpload ? (
                  <form
                    action="/api/verify"
                    method="POST"
                    encType="multipart/form-data"
                    className="mt-4"
                  >
                    <input type="hidden" name="document_type" value={type} />
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        name="file"
                        accept="image/*,.pdf"
                        required
                        className="block w-full text-sm text-[var(--acct-muted)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--acct-gold-soft)] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-[var(--acct-gold)]"
                      />
                      <button
                        type="submit"
                        className="shrink-0 rounded-full bg-[var(--acct-gold)] px-5 py-2 text-xs font-semibold text-white"
                      >
                        Upload
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Trust Advancement */}
      {trust.requirements.length > 0 ? (
        <div className="acct-card p-5">
          <p className="acct-kicker mb-3">
            Steps to reach {trust.nextTier ? getTrustTierLabel(trust.nextTier) : "next tier"}
          </p>
          <div className="space-y-2">
            {trust.requirements.map((req) => (
              <div
                key={req}
                className="flex items-center gap-3 rounded-xl bg-[var(--acct-surface)] px-4 py-3 text-sm text-[var(--acct-muted)]"
              >
                <ChevronRight size={14} className="shrink-0 text-[var(--acct-gold)]" />
                {req}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Links */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/security"
          className="rounded-full border border-[var(--acct-line)] px-4 py-2 text-xs font-semibold text-[var(--acct-ink)] hover:bg-[var(--acct-surface)]"
        >
          Security settings
        </Link>
        <Link
          href="/support/new"
          className="rounded-full border border-[var(--acct-line)] px-4 py-2 text-xs font-semibold text-[var(--acct-ink)] hover:bg-[var(--acct-surface)]"
        >
          Contact support
        </Link>
      </div>
    </div>
  );
}
