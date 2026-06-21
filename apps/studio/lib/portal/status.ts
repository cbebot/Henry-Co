// Status tokens shared across the entire client portal. Every status
// indicator across the portal renders through these primitives so the
// colour system stays consistent.

import { translateSurfaceLabel, type AppLocale } from "@henryco/i18n";

export type StatusTone =
  | "neutral"
  | "info"
  | "warn"
  | "success"
  | "danger"
  | "accent";

export type StatusTokenStyle = {
  tone: StatusTone;
  label: string;
};

const projectStatusTokens: Record<string, StatusTokenStyle> = {
  enquiry: { tone: "neutral", label: "Enquiry" },
  proposal: { tone: "neutral", label: "Proposal" },
  pending_deposit: { tone: "warn", label: "Awaiting deposit" },
  onboarding: { tone: "info", label: "Onboarding" },
  active: { tone: "info", label: "Active" },
  review: { tone: "warn", label: "In review" },
  in_review: { tone: "warn", label: "In review" },
  revision: { tone: "warn", label: "In revision" },
  approved: { tone: "success", label: "Approved" },
  delivered: { tone: "success", label: "Delivered" },
  complete: { tone: "success", label: "Complete" },
  paused: { tone: "accent", label: "Paused" },
  cancelled: { tone: "danger", label: "Cancelled" },
  archived: { tone: "neutral", label: "Archived" },
};

const milestoneStatusTokens: Record<string, StatusTokenStyle> = {
  upcoming: { tone: "neutral", label: "Upcoming" },
  planned: { tone: "neutral", label: "Upcoming" },
  in_progress: { tone: "info", label: "In progress" },
  ready_for_review: { tone: "warn", label: "Ready for review" },
  approved: { tone: "success", label: "Approved" },
  complete: { tone: "success", label: "Complete" },
};

const invoiceStatusTokens: Record<string, StatusTokenStyle> = {
  draft: { tone: "neutral", label: "Draft" },
  sent: { tone: "info", label: "Awaiting payment" },
  pending_verification: { tone: "warn", label: "Verifying" },
  paid: { tone: "success", label: "Paid" },
  overdue: { tone: "danger", label: "Overdue" },
  cancelled: { tone: "neutral", label: "Cancelled" },
};

const paymentStatusTokens: Record<string, StatusTokenStyle> = {
  submitted: { tone: "warn", label: "Submitted" },
  processing: { tone: "warn", label: "Verifying" },
  verified: { tone: "success", label: "Verified" },
  paid: { tone: "success", label: "Paid" },
  rejected: { tone: "danger", label: "Rejected" },
  requested: { tone: "info", label: "Requested" },
  overdue: { tone: "danger", label: "Overdue" },
  cancelled: { tone: "neutral", label: "Cancelled" },
};

const deliverableStatusTokens: Record<string, StatusTokenStyle> = {
  draft: { tone: "neutral", label: "Draft" },
  shared: { tone: "warn", label: "Awaiting review" },
  approved: { tone: "success", label: "Approved" },
  superseded: { tone: "neutral", label: "Replaced" },
};

// V3-73 — per-deliverable revision-round status (client approval depth layer).
const revisionStatusTokens: Record<string, StatusTokenStyle> = {
  submitted: { tone: "info", label: "Submitted" },
  changes_requested: { tone: "warn", label: "Changes requested" },
  approved: { tone: "success", label: "Approved" },
};

function localizeToken(token: StatusTokenStyle, locale?: AppLocale): StatusTokenStyle {
  if (!locale) return token;
  return { ...token, label: translateSurfaceLabel(locale, token.label) };
}

export function revisionStatusToken(status: string, locale?: AppLocale): StatusTokenStyle {
  const token = revisionStatusTokens[status] ?? { tone: "neutral" as StatusTone, label: status || "Status" };
  return localizeToken(token, locale);
}

export function projectStatusToken(status: string, locale?: AppLocale): StatusTokenStyle {
  const token = projectStatusTokens[status] ?? { tone: "neutral" as StatusTone, label: status || "Status" };
  return localizeToken(token, locale);
}

export function milestoneStatusToken(status: string, locale?: AppLocale): StatusTokenStyle {
  const token = milestoneStatusTokens[status] ?? { tone: "neutral" as StatusTone, label: status || "Status" };
  return localizeToken(token, locale);
}

export function invoiceStatusToken(status: string, locale?: AppLocale): StatusTokenStyle {
  const token = invoiceStatusTokens[status] ?? { tone: "neutral" as StatusTone, label: status || "Status" };
  return localizeToken(token, locale);
}

export function paymentStatusToken(status: string, locale?: AppLocale): StatusTokenStyle {
  const token = paymentStatusTokens[status] ?? { tone: "neutral" as StatusTone, label: status || "Status" };
  return localizeToken(token, locale);
}

export function deliverableStatusToken(status: string, locale?: AppLocale): StatusTokenStyle {
  const token = deliverableStatusTokens[status] ?? { tone: "neutral" as StatusTone, label: status || "Status" };
  return localizeToken(token, locale);
}

// Status tones render through dual-valued studio tokens (status families
// defined in app/globals.css). At :root they keep the original dark tints;
// under .studio-workspace-light they resolve to AA-on-light inks; under the
// dark scope they revert — so every badge stays theme-correct with no
// per-call branching. See V3-INNER-L-STUDIO.
export function toneToClasses(tone: StatusTone): string {
  switch (tone) {
    case "info":
      return "border-[var(--studio-blue-line)] bg-[var(--studio-blue-soft)] text-[var(--studio-blue-ink)]";
    case "warn":
      return "border-[var(--studio-amber-line)] bg-[var(--studio-amber-soft)] text-[var(--studio-amber-ink)]";
    case "success":
      return "border-[var(--studio-green-line)] bg-[var(--studio-green-soft)] text-[var(--studio-green-ink)]";
    case "danger":
      return "border-[var(--studio-red-line)] bg-[var(--studio-red-soft)] text-[var(--studio-red-ink)]";
    case "accent":
      return "border-[var(--studio-copper-line)] bg-[var(--studio-copper-soft)] text-[var(--studio-copper-ink)]";
    case "neutral":
    default:
      return "border-[var(--studio-line-strong)] bg-[var(--studio-fill-soft)] text-[var(--studio-ink-soft)]";
  }
}

export function toneToDot(tone: StatusTone): string {
  switch (tone) {
    case "info":
      return "bg-[var(--studio-blue-ink)]";
    case "warn":
      return "bg-[var(--studio-amber-ink)]";
    case "success":
      return "bg-[var(--studio-green-ink)]";
    case "danger":
      return "bg-[var(--studio-red-ink)]";
    case "accent":
      return "bg-[var(--studio-copper-ink)]";
    case "neutral":
    default:
      return "bg-[var(--studio-ink-soft)]";
  }
}
