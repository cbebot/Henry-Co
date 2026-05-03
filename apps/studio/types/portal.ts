// STUDIO-CP-01 — Client portal types.
//
// These types speak the spec's vocabulary on top of the existing studio_*
// schema. They are NOT a replacement for the legacy types in
// `lib/studio/types.ts` — those continue to drive the staff workspace.
// The portal data layer maps legacy rows into these views.

export type StudioInvoiceStatus =
  | "draft"
  | "sent"
  | "pending_verification"
  | "paid"
  | "overdue"
  | "cancelled";

export type ClientPaymentStatus =
  | "submitted"
  | "verified"
  | "rejected"
  | "requested"
  | "processing"
  | "paid"
  | "overdue"
  | "cancelled";

export type StudioInvoice = {
  id: string;
  projectId: string;
  milestoneId: string | null;
  clientUserId: string | null;
  normalizedEmail: string | null;
  invoiceNumber: string;
  amountKobo: number;
  currency: string;
  description: string;
  dueDate: string | null;
  status: StudioInvoiceStatus;
  invoiceToken: string | null;
  issuedAt: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  paymentCount?: number;
  lastPaymentStatus?: ClientPaymentStatus | null;
  lastPaymentId?: string | null;
};

export type StudioPaymentSubmission = {
  id: string;
  invoiceId: string | null;
  projectId: string;
  clientUserId: string | null;
  amountKobo: number;
  currency: string;
  paymentReference: string | null;
  proofUrl: string | null;
  proofPublicId: string | null;
  proofName: string | null;
  submittedAt: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  status: ClientPaymentStatus;
  rejectionReason: string | null;
  notes: string | null;
};

export type ClientProjectStatus =
  | "enquiry"
  | "proposal"
  | "active"
  | "review"
  | "revision"
  | "approved"
  | "complete"
  | "paused"
  | "cancelled"
  | "pending_deposit"
  | "onboarding"
  | "in_review"
  | "delivered"
  | "archived";

export type ClientMilestoneStatus =
  | "upcoming"
  | "in_progress"
  | "ready_for_review"
  | "approved"
  | "complete"
  | "planned";

export type ClientDeliverableStatus =
  | "draft"
  | "shared"
  | "approved"
  | "superseded";

export type ClientFileType = "image" | "pdf" | "video" | "archive" | "other";

export type ClientProject = {
  id: string;
  title: string;
  brief: string | null;
  summary: string;
  nextAction: string | null;
  type: string | null;
  status: ClientProjectStatus;
  startDate: string | null;
  estimatedCompletion: string | null;
  actualCompletion: string | null;
  clientUserId: string | null;
  teamLeadId: string | null;
  createdAt: string;
  updatedAt: string;
  accessKey: string | null;
};

export type ClientMilestone = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  dueDate: string | null;
  dueLabel: string;
  amountKobo: number;
  currency: string;
  status: ClientMilestoneStatus;
  orderIndex: number;
};

export type ClientDeliverable = {
  id: string;
  projectId: string;
  milestoneId: string | null;
  title: string;
  description: string;
  fileUrl: string | null;
  filePublicId: string | null;
  fileType: ClientFileType;
  thumbnailUrl: string | null;
  version: number;
  status: ClientDeliverableStatus;
  sharedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  uploadedBy: string | null;
  createdAt: string;
};

export type ClientMessageAttachment = {
  url: string;
  name: string;
  type: string;
  size: number;
};

export type ClientMessage = {
  id: string;
  projectId: string;
  senderId: string | null;
  senderName: string;
  senderRole: "client" | "team" | string;
  body: string;
  attachments: ClientMessageAttachment[];
  readBy: string[];
  createdAt: string;
  editedAt: string | null;
  isOwnMessage: boolean;
};

export type ClientProjectUpdate = {
  id: string;
  projectId: string;
  authorId: string | null;
  updateType: string;
  title: string;
  body: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type ClientPaymentSummary = {
  totalKobo: number;
  paidKobo: number;
  outstandingKobo: number;
  currency: string;
};

export type ClientDashboardData = {
  primaryProject: ClientProject | null;
  primaryMilestones: ClientMilestone[];
  attentionItems: AttentionItem[];
  recentActivity: ClientProjectUpdate[];
  unreadMessages: number;
};

export type AttentionItem =
  | {
      kind: "invoice";
      invoice: StudioInvoice;
      projectTitle: string;
    }
  | {
      kind: "deliverable";
      deliverable: ClientDeliverable;
      projectTitle: string;
    }
  | {
      kind: "message";
      message: ClientMessage;
      projectTitle: string;
    };

export type ClientPortalViewer = {
  userId: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  normalizedEmail: string | null;
};

export type PaymentScenario =
  | { kind: "token"; invoice: StudioInvoice; project: ClientProject | null }
  | { kind: "authenticated"; invoices: StudioInvoice[]; viewer: ClientPortalViewer }
  | { kind: "unauthenticated_no_token" };
