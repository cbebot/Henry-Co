import type { VerificationStatus } from "@/lib/verification";

export type HeroState = "verified" | "pending" | "rejected" | "none";

export function heroState(status: VerificationStatus): HeroState {
  if (status === "verified") return "verified";
  if (status === "pending") return "pending";
  if (status === "rejected") return "rejected";
  return "none";
}

const STATUS_HEADLINE: Record<VerificationStatus, string> = {
  verified: "Identity verified.",
  pending: "Submitted for review.",
  rejected: "Needs another submission.",
  none: "Verify your identity.",
};

const STATUS_BLURB: Record<VerificationStatus, string> = {
  verified:
    "Higher-trust lanes — wallet withdrawals, marketplace seller approval, employer verification — now run against real document review.",
  pending:
    "Your documents are in the queue. Review-sensitive actions stay paused until approval is complete. Most reviews finish within 24 hours.",
  rejected:
    "The last submission was not approved. Review the note, replace the affected file, and resubmit — you stay on this page the whole time.",
  none:
    "Wallet withdrawals, seller approval, employer verification, and higher-trust actions stay gated until your identity is reviewed against real documents.",
};

const STATUS_EYEBROW: Record<VerificationStatus, string> = {
  verified: "Identity verification · approved",
  pending: "Identity verification · in review",
  rejected: "Identity verification · action needed",
  none: "Identity verification",
};

export function statusHeadline(status: VerificationStatus): string {
  return STATUS_HEADLINE[status];
}

export function statusBlurb(status: VerificationStatus): string {
  return STATUS_BLURB[status];
}

export function statusEyebrow(status: VerificationStatus): string {
  return STATUS_EYEBROW[status];
}

export type SubmissionChipTone = "verified" | "pending" | "rejected" | "required" | "optional";

export function submissionChipTone(
  submissionStatus: string | undefined,
  required: boolean,
): SubmissionChipTone {
  if (submissionStatus === "approved") return "verified";
  if (submissionStatus === "rejected") return "rejected";
  if (submissionStatus === "pending") return "pending";
  return required ? "required" : "optional";
}

export function submissionChipLabel(
  submissionStatus: string | undefined,
  required: boolean,
): string {
  if (submissionStatus === "approved") return "Approved";
  if (submissionStatus === "rejected") return "Needs more info";
  if (submissionStatus === "pending") return "Under review";
  return required ? "Required" : "Optional";
}

/**
 * Format an ISO timestamp into a compact submission stamp, e.g. "12 May ·
 * 14:38". Falls back to an em-dash for invalid input. Calling `Date`
 * constructors inside this helper file (`.ts`, not `.tsx`) keeps the
 * React 19 `react-hooks/purity` rule clean.
 */
export function formatStamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return "—";
  const d = new Date(ms);
  return `${d.getUTCDate().toString().padStart(2, "0")} ${SHORT_MONTHS[d.getUTCMonth()]} · ${d
    .getUTCHours()
    .toString()
    .padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`;
}

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
