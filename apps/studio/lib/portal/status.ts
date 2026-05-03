// Status tokens shared across the entire client portal. Every status
// indicator across the portal renders through these primitives so the
// colour system stays consistent.

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

export function projectStatusToken(status: string): StatusTokenStyle {
  return projectStatusTokens[status] ?? { tone: "neutral", label: status || "Status" };
}

export function milestoneStatusToken(status: string): StatusTokenStyle {
  return milestoneStatusTokens[status] ?? { tone: "neutral", label: status || "Status" };
}

export function invoiceStatusToken(status: string): StatusTokenStyle {
  return invoiceStatusTokens[status] ?? { tone: "neutral", label: status || "Status" };
}

export function paymentStatusToken(status: string): StatusTokenStyle {
  return paymentStatusTokens[status] ?? { tone: "neutral", label: status || "Status" };
}

export function deliverableStatusToken(status: string): StatusTokenStyle {
  return deliverableStatusTokens[status] ?? { tone: "neutral", label: status || "Status" };
}

export function toneToClasses(tone: StatusTone): string {
  switch (tone) {
    case "info":
      return "border-[rgba(120,180,255,0.45)] bg-[rgba(120,180,255,0.12)] text-[#bcd6ff]";
    case "warn":
      return "border-[rgba(244,196,108,0.45)] bg-[rgba(244,196,108,0.12)] text-[#f3d28a]";
    case "success":
      return "border-[rgba(141,232,179,0.45)] bg-[rgba(141,232,179,0.12)] text-[#bdf2cf]";
    case "danger":
      return "border-[rgba(255,143,143,0.45)] bg-[rgba(255,143,143,0.12)] text-[#ffb8b8]";
    case "accent":
      return "border-[rgba(217,168,109,0.45)] bg-[rgba(217,168,109,0.12)] text-[#f0c89a]";
    case "neutral":
    default:
      return "border-[var(--studio-line-strong)] bg-[rgba(255,255,255,0.05)] text-[var(--studio-ink-soft)]";
  }
}

export function toneToDot(tone: StatusTone): string {
  switch (tone) {
    case "info":
      return "bg-[#7eb6ff]";
    case "warn":
      return "bg-[#f3d28a]";
    case "success":
      return "bg-[#8de8b3]";
    case "danger":
      return "bg-[#ff8f8f]";
    case "accent":
      return "bg-[#d9a86d]";
    case "neutral":
    default:
      return "bg-[var(--studio-ink-soft)]";
  }
}
