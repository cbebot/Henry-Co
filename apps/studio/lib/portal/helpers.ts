// helpers.ts holds pure formatters consumed by both server and client
// components (e.g. message-thread renders relativeTime). It must NOT
// be marked server-only or the client bundles fail to build.

import { formatCurrency } from "@/lib/env";
import type {
  ClientDeliverable,
  ClientFileType,
  ClientMessage,
  ClientMilestone,
  ClientMilestoneStatus,
  ClientProject,
  ClientProjectStatus,
  ClientProjectUpdate,
  StudioInvoice,
  StudioPaymentSubmission,
} from "@/types/portal";

export function clean(value: unknown): string {
  return String(value ?? "").trim();
}

export function num(value: unknown, fallback = 0): number {
  const v = Number(value);
  return Number.isFinite(v) ? v : fallback;
}

export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function safeRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export function koboFromAmount(amount: unknown, fallbackKobo = 0) {
  const direct = Number(amount);
  if (!Number.isFinite(direct)) return fallbackKobo;
  return Math.round(direct * 100);
}

export function formatKobo(kobo: number, currency = "NGN") {
  return formatCurrency(Math.max(0, Math.round(kobo / 100)), currency);
}

export function detectFileType(mimeType?: string | null, url?: string | null): ClientFileType {
  const mime = clean(mimeType).toLowerCase();
  const path = clean(url).toLowerCase();

  if (mime.startsWith("image/") || /\.(png|jpe?g|webp|gif|avif|svg)(\?|$)/.test(path)) {
    return "image";
  }
  if (mime === "application/pdf" || /\.pdf(\?|$)/.test(path)) return "pdf";
  if (mime.startsWith("video/") || /\.(mp4|mov|webm|m4v)(\?|$)/.test(path)) return "video";
  if (
    mime.includes("zip") ||
    mime.includes("rar") ||
    mime.includes("compressed") ||
    /\.(zip|rar|7z|tar|gz)(\?|$)/.test(path)
  ) {
    return "archive";
  }
  return "other";
}

export function mapInvoiceRow(row: Record<string, unknown>): StudioInvoice {
  return {
    id: clean(row.id),
    projectId: clean(row.project_id),
    milestoneId: clean(row.milestone_id) || null,
    clientUserId: clean(row.client_user_id) || null,
    normalizedEmail: clean(row.normalized_email).toLowerCase() || null,
    invoiceNumber: clean(row.invoice_number),
    amountKobo: num(row.amount_kobo),
    currency: clean(row.currency) || "NGN",
    description: clean(row.description),
    dueDate: clean(row.due_date) || null,
    status: (clean(row.status) || "sent") as StudioInvoice["status"],
    invoiceToken: clean(row.invoice_token) || null,
    issuedAt: clean(row.issued_at) || clean(row.created_at),
    paidAt: clean(row.paid_at) || null,
    createdAt: clean(row.created_at),
    updatedAt: clean(row.updated_at) || clean(row.created_at),
    paymentCount: row.payment_count == null ? undefined : num(row.payment_count),
    lastPaymentStatus: clean(row.last_payment_status) as StudioPaymentSubmission["status"] | null || null,
    lastPaymentId: clean(row.last_payment_id) || null,
  };
}

export function mapPaymentRow(row: Record<string, unknown>): StudioPaymentSubmission {
  const amountKobo = row.amount_kobo != null ? num(row.amount_kobo) : koboFromAmount(row.amount);
  const status = clean(row.status) || "submitted";

  return {
    id: clean(row.id),
    invoiceId: clean(row.invoice_id) || null,
    projectId: clean(row.project_id),
    clientUserId: clean(row.client_user_id) || null,
    amountKobo,
    currency: clean(row.currency) || "NGN",
    paymentReference: clean(row.payment_reference) || clean(row.reference) || null,
    proofUrl: clean(row.proof_url) || null,
    proofPublicId: clean(row.proof_public_id) || null,
    proofName: clean(row.proof_name) || null,
    submittedAt: clean(row.submitted_at) || clean(row.created_at),
    verifiedAt: clean(row.verified_at) || null,
    verifiedBy: clean(row.verified_by) || null,
    status: status as StudioPaymentSubmission["status"],
    rejectionReason: clean(row.rejection_reason) || null,
    notes: clean(row.notes) || null,
  };
}

const projectStatusMap: Record<string, ClientProjectStatus> = {
  pending_deposit: "pending_deposit",
  onboarding: "onboarding",
  active: "active",
  in_review: "review",
  delivered: "complete",
  archived: "complete",
  enquiry: "enquiry",
  proposal: "proposal",
  review: "review",
  revision: "revision",
  approved: "approved",
  complete: "complete",
  paused: "paused",
  cancelled: "cancelled",
};

export function normaliseProjectStatus(value: unknown): ClientProjectStatus {
  const key = clean(value).toLowerCase();
  return projectStatusMap[key] || "active";
}

const milestoneStatusMap: Record<string, ClientMilestoneStatus> = {
  planned: "upcoming",
  upcoming: "upcoming",
  in_progress: "in_progress",
  ready_for_review: "ready_for_review",
  approved: "approved",
  complete: "complete",
};

export function normaliseMilestoneStatus(value: unknown): ClientMilestoneStatus {
  const key = clean(value).toLowerCase();
  return milestoneStatusMap[key] || "upcoming";
}

export function mapProjectRow(row: Record<string, unknown>): ClientProject {
  return {
    id: clean(row.id),
    title: clean(row.title) || "Untitled project",
    brief: clean(row.brief) || null,
    summary: clean(row.summary),
    nextAction: clean(row.next_action) || null,
    type: clean(row.project_type) || null,
    status: normaliseProjectStatus(row.status),
    startDate: clean(row.start_date) || null,
    estimatedCompletion: clean(row.estimated_completion) || null,
    actualCompletion: clean(row.actual_completion) || null,
    clientUserId: clean(row.client_user_id) || null,
    teamLeadId: clean(row.team_lead_id) || null,
    createdAt: clean(row.created_at),
    updatedAt: clean(row.updated_at) || clean(row.created_at),
    accessKey: clean(row.access_token_hint) || null,
  };
}

export function mapMilestoneRow(
  row: Record<string, unknown>,
  currency = "NGN",
  currentUserId?: string | null
): ClientMilestone {
  void currentUserId;
  return {
    id: clean(row.id),
    projectId: clean(row.project_id),
    title: clean(row.name) || clean(row.title) || "Milestone",
    description: clean(row.description),
    dueDate: clean(row.due_date) || null,
    dueLabel: clean(row.due_label),
    amountKobo: num(row.amount_kobo) || koboFromAmount(row.amount),
    currency: clean(row.currency) || currency,
    status: normaliseMilestoneStatus(row.status),
    orderIndex: num(row.order_index) || num(row.sort_order),
  };
}

export function mapDeliverableRow(row: Record<string, unknown>): ClientDeliverable {
  const fileUrl = clean(row.file_url) || null;
  const fileType = detectFileType(clean(row.file_type) || null, fileUrl);
  const status = (clean(row.status) || "shared") as ClientDeliverable["status"];

  return {
    id: clean(row.id),
    projectId: clean(row.project_id),
    milestoneId: clean(row.milestone_id) || null,
    title: clean(row.label) || clean(row.title) || "Deliverable",
    description: clean(row.summary) || clean(row.description),
    fileUrl,
    filePublicId: clean(row.file_public_id) || null,
    fileType,
    thumbnailUrl: clean(row.thumbnail_url) || null,
    version: num(row.version, 1),
    status,
    sharedAt: clean(row.shared_at) || null,
    approvedAt: clean(row.approved_at) || null,
    approvedBy: clean(row.approved_by) || null,
    uploadedBy: clean(row.uploaded_by) || null,
    createdAt: clean(row.created_at),
  };
}

export function mapMessageRow(
  row: Record<string, unknown>,
  currentUserId: string | null
): ClientMessage {
  const senderId = clean(row.sender_id) || null;
  const role = clean(row.sender_role) || (senderId === currentUserId ? "client" : "team");
  const attachments = asArray<Record<string, unknown>>(row.attachments).map((item) => ({
    url: clean(item.url),
    name: clean(item.name),
    type: clean(item.type),
    size: num(item.size),
  }));
  const readBy = asArray<string>(row.read_by)
    .map((value) => clean(value))
    .filter(Boolean);

  return {
    id: clean(row.id),
    projectId: clean(row.project_id),
    senderId,
    senderName: clean(row.sender) || (role === "client" ? "You" : "HenryCo Studio"),
    senderRole: role,
    body: clean(row.body),
    attachments,
    readBy,
    createdAt: clean(row.created_at),
    editedAt: clean(row.edited_at) || null,
    isOwnMessage: Boolean(currentUserId && senderId === currentUserId),
  };
}

export function mapProjectUpdateRow(row: Record<string, unknown>): ClientProjectUpdate {
  return {
    id: clean(row.id),
    projectId: clean(row.project_id),
    authorId: clean(row.author_id) || null,
    updateType: clean(row.update_type) || clean(row.kind) || "note",
    title: clean(row.title),
    body: clean(row.body) || clean(row.summary) || null,
    metadata: safeRecord(row.metadata),
    createdAt: clean(row.created_at),
  };
}

export function clientMilestoneMoney(milestone: ClientMilestone) {
  return formatKobo(milestone.amountKobo, milestone.currency);
}

export function shortDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function relativeTime(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}
