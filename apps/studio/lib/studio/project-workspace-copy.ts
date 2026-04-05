import type { StudioProjectStatus } from "@/lib/studio/types";

const STATUS_CLIENT: Record<StudioProjectStatus, string> = {
  pending_deposit: "Awaiting your deposit",
  onboarding: "Onboarding in progress",
  active: "Build in progress",
  in_review: "In your review",
  delivered: "Delivered",
  archived: "Archived",
};

export function clientProjectStatusLabel(status: StudioProjectStatus): string {
  return STATUS_CLIENT[status] ?? status.replaceAll("_", " ");
}

const UPDATE_KIND_LABELS: Record<string, string> = {
  manual_update: "Studio note",
  status: "Progress update",
  milestone: "Milestone update",
  delivery: "Delivery update",
  payment: "Payment update",
  review: "Review",
  onboarding: "Onboarding",
  scope: "Scope update",
  handoff: "Handoff",
};

export function friendlyUpdateKind(kind: string): string {
  const k = kind.trim().toLowerCase().replaceAll("_", " ");
  const normalized = kind.trim().toLowerCase();
  if (UPDATE_KIND_LABELS[normalized]) return UPDATE_KIND_LABELS[normalized];
  if (UPDATE_KIND_LABELS[k]) return UPDATE_KIND_LABELS[k];
  return k ? k.charAt(0).toUpperCase() + k.slice(1) : "Update";
}

const MILESTONE_STATUS_LABELS: Record<string, string> = {
  planned: "Planned",
  in_progress: "In progress",
  ready_for_review: "Ready for your review",
  approved: "Approved",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function friendlyMilestoneStatus(status: string): string {
  return MILESTONE_STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  requested: "Awaiting payment",
  processing: "Under verification",
  paid: "Confirmed",
  overdue: "Payment overdue",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export function friendlyPaymentStatus(status: string): string {
  return PAYMENT_STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

const REVISION_STATUS_LABELS: Record<string, string> = {
  requested: "Open",
  in_progress: "In progress",
  completed: "Completed",
  declined: "Declined",
};

export function friendlyRevisionStatus(status: string): string {
  return REVISION_STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent to client",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
  under_review: "Under review",
  revised: "Revised",
};

export function friendlyProposalStatus(status: string): string {
  return PROPOSAL_STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

export function formatWorkspaceDate(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  return new Date(t).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
