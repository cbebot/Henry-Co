import "server-only";

import { randomUUID } from "crypto";
import { createAdminSupabase } from "@/lib/supabase";
import { buildCarePublicUrl } from "@/lib/care-links";
import { getCareSettings } from "@/lib/care-data";
import {
  getResendClient,
  listRecentReceivedEmails,
  getResendSupportInbox,
  probeResendReceivingCapability,
} from "@/lib/resend-server";
import {
  sendAdminNotificationEmail,
  sendCareEmail,
} from "@/lib/email/send";
import {
  extractTrackingCodeFromText,
  type PaymentProofAttachment,
  submitPaymentProof,
} from "@/lib/payments/verification";
import {
  formatSupportContactMethodLabel,
  formatSupportServiceCategoryLabel,
  formatSupportThreadStatusLabel,
  formatSupportUrgencyLabel,
  normalizeSupportContactMethod,
  normalizeSupportServiceCategory,
  normalizeSupportThreadStatus,
  normalizeSupportUrgency,
  type SupportContactMethod,
  type SupportServiceCategory,
  type SupportThreadStatus,
  type SupportUrgency,
} from "@/lib/support/shared";
import {
  getWhatsAppCapability,
  sendSupportReplyWhatsApp,
  type SupportWhatsAppDeliveryResult,
} from "@/lib/support/whatsapp";
import {
  syncSupportAssignmentToAccountThread,
  syncSupportReplyToAccountThread,
  syncSupportStatusToAccountThread,
  syncSupportViewToAccountThread,
} from "@/lib/support/account-sync";
import { notifyStaffRoles } from "@/lib/staff-alerts";

const SUPPORT_EVENT_TYPES = {
  threadCreated: "support_thread_created",
  customerReceiptSent: "support_customer_receipt_sent",
  customerReceiptFailed: "support_customer_receipt_failed",
  threadStatusUpdated: "support_thread_status_updated",
  threadAssigned: "support_thread_assigned",
  threadViewed: "support_thread_viewed",
  noteAdded: "support_note_added",
  replySent: "support_reply_sent",
  replyFailed: "support_reply_failed",
  customerEmailReceived: "support_customer_email_received",
  inboundSyncCompleted: "support_inbound_sync_completed",
  inboundSyncFailed: "support_inbound_sync_failed",
  reviewModerationUpdated: "review_moderation_updated",
  reviewSubmitted: "verified_review_submitted",
} as const;

type SupportEventType = (typeof SUPPORT_EVENT_TYPES)[keyof typeof SUPPORT_EVENT_TYPES];

type SupportLogRow = {
  id: string;
  event_type: string;
  email: string | null;
  user_id: string | null;
  role: string | null;
  actor_user_id: string | null;
  actor_role: string | null;
  success: boolean;
  details: Record<string, unknown> | null;
  created_at: string;
};

export type SupportAgent = {
  id: string;
  fullName: string;
  role: string;
};

export type SupportTimelineEntry = {
  id: string;
  kind: "customer" | "support" | "note" | "status" | "assignment" | "system";
  title: string;
  body: string;
  createdAt: string;
  actorName: string | null;
  actorRole: string | null;
  emailStatus?: string | null;
  whatsappStatus?: string | null;
  whatsappReason?: string | null;
  inboundEmail?: {
    subject: string | null;
    sender: string | null;
    recipients: string[];
    cc: string[];
    receivedAt: string | null;
    preview: string | null;
    fetchReason: string | null;
    attachments: Array<{
      fileName: string | null;
      mimeType: string | null;
      sizeBytes: number | null;
      url: string | null;
    }>;
  } | null;
};

export type SupportThread = {
  threadId: string;
  threadRef: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  preferredContactMethod: SupportContactMethod;
  subject: string;
  initialMessage: string;
  serviceCategory: SupportServiceCategory;
  urgency: SupportUrgency;
  trackingCode: string | null;
  status: SupportThreadStatus;
  assignedTo:
    | {
        userId: string | null;
        fullName: string | null;
        role: string | null;
      }
    | null;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  lastPreview: string;
  replyCount: number;
  noteCount: number;
  timeline: SupportTimelineEntry[];
  latestEmailStatus: string | null;
  latestWhatsAppStatus: string | null;
  latestWhatsAppReason: string | null;
  isStale: boolean;
  isRead: boolean;
  isReplied: boolean;
  lastCustomerActivityAt: string | null;
  lastViewedAt: string | null;
  bookingContext: {
    bookingId: string;
    trackingCode: string;
    serviceType: string | null;
    bookingStatus: string | null;
    paymentStatus: string | null;
    balanceDue: number | null;
    pickupDate: string | null;
    pickupSlot: string | null;
    updatedAt: string | null;
    latestPaymentRequestStatus: string | null;
    latestPaymentRequestCreatedAt: string | null;
  } | null;
};

export type SupportReviewContext = {
  reviewId: string;
  trackingCode: string | null;
  bookingId: string | null;
  serviceFamily: string | null;
  latestModerationStatus: SupportThreadStatus | "approved" | "rejected" | "pending";
  latestModerationNote: string | null;
  latestModeratorName: string | null;
  latestModeratorRole: string | null;
};

type SupportThreadFilters = {
  q?: string;
  status?: string | null;
  assignee?: string | null;
  mailbox?: string | null;
  viewerUserId?: string | null;
  limit?: number;
};

type ContactSubmissionInput = {
  fullName: string;
  email: string;
  phone?: string | null;
  preferredContactMethod?: string | null;
  serviceCategory?: string | null;
  urgency?: string | null;
  subject: string;
  message: string;
  trackingCode?: string | null;
};

type ReplyDeliveryResult = {
  email: Awaited<ReturnType<typeof sendCareEmail>>;
  whatsapp: SupportWhatsAppDeliveryResult;
};

type InboundSupportEmailInput = {
  emailId: string;
  messageId?: string | null;
  receivedAt?: string | null;
  from: string;
  to?: string[] | null;
  cc?: string[] | null;
  bcc?: string[] | null;
  subject?: string | null;
};

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asText(value: unknown) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || null;
}

function getLoggedWhatsAppStatus(details: Record<string, unknown> | null | undefined) {
  return asText(details?.whatsapp_delivery_status) || asText(details?.whatsapp_status);
}

function asNumber(value: unknown) {
  const normalized = Number(value ?? null);
  return Number.isFinite(normalized) ? normalized : null;
}

function asTextList(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return value
    .map((item) => asText(item))
    .filter(Boolean) as string[];
}

function cleanPreview(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 120 ? `${normalized.slice(0, 117)}...` : normalized;
}

function extractMailbox(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) {
    return {
      email: null,
      name: null,
    };
  }

  const match = raw.match(/^(.*?)(?:<([^<>]+)>)?$/);
  const name = asText(match?.[1]);
  const emailCandidate = asText(match?.[2]) || raw;
  const emailMatch = emailCandidate.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);

  return {
    email: emailMatch ? emailMatch[0].trim().toLowerCase() : null,
    name:
      name?.replace(/^["']|["']$/g, "") ||
      (emailMatch ? emailMatch[0].split("@")[0]?.replace(/[._-]+/g, " ") || null : null),
  };
}

function stripHtml(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function normalizeInboundMessageBody(value: string | null, subject: string | null) {
  const body = String(value || "")
    .replace(/\r/g, "")
    .trim();

  if (body) {
    return body.length > 4000 ? `${body.slice(0, 3997)}...` : body;
  }

  const fallbackSubject = asText(subject) || "Support request";
  return `Customer replied by email regarding "${fallbackSubject}". Full body retrieval is not available from the current provider configuration.`;
}

function normalizeInboundAttachments(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as PaymentProofAttachment[];
  }

  return value
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;
      const fileName = asText(record.filename) || asText(record.name);
      const mimeType = asText(record.content_type) || asText(record.mime_type);
      const url = asText(record.url) || asText(record.download_url);

      if (!fileName && !mimeType && !url) return null;

        return {
          publicId: asText(record.public_id) || asText(record.publicId),
          fileName,
          mimeType,
          sizeBytes: asNumber(record.size) || asNumber(record.size_bytes),
          url,
          kind:
            mimeType === "application/pdf"
              ? "pdf"
              : String(mimeType || "").startsWith("image/")
                ? "image"
                : "file",
        };
      })
      .filter(Boolean) as PaymentProofAttachment[];
}

function extractSupportThreadReference(value?: string | null) {
  const match = String(value || "").match(/\bSUP-[A-Z0-9]{6,}\b/i);
  return match ? match[0].toUpperCase() : null;
}

function buildSupportReplyToAddress(settings: Awaited<ReturnType<typeof getCareSettings>>) {
  return (
    getResendSupportInbox() ||
    asText(settings.notification_reply_to_email) ||
    asText(settings.support_email)
  );
}

function createThreadReference() {
  return `SUP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function insertSupportEvent(input: {
  eventType: SupportEventType;
  route: string;
  email?: string | null;
  actorUserId?: string | null;
  actorRole?: string | null;
  success?: boolean;
  details: Record<string, unknown>;
}) {
  const supabase = createAdminSupabase();
  const actorUserId = input.actorUserId ?? null;
  const actorRole = input.actorRole ?? null;

  const { data, error } = await supabase
    .from("care_security_logs")
    .insert({
      event_type: input.eventType,
      route: input.route,
      email: input.email ?? null,
      user_id: actorUserId,
      role: actorRole,
      success: input.success ?? true,
      details: {
        ...input.details,
        actor_user_id: actorUserId,
        actor_role: actorRole,
      },
    } as never)
    .select("id")
    .maybeSingle();

  if (error || !data?.id) {
    throw new Error(
      error?.message ||
        `Support event ${input.eventType} could not be written to the operational log.`
    );
  }

  return data.id as string;
}

async function fetchSupportLogs(limit = 900) {
  const supabase = createAdminSupabase();
  const eventTypes = [
    SUPPORT_EVENT_TYPES.threadCreated,
    SUPPORT_EVENT_TYPES.customerReceiptSent,
    SUPPORT_EVENT_TYPES.customerReceiptFailed,
    SUPPORT_EVENT_TYPES.threadStatusUpdated,
    SUPPORT_EVENT_TYPES.threadAssigned,
    SUPPORT_EVENT_TYPES.threadViewed,
    SUPPORT_EVENT_TYPES.noteAdded,
    SUPPORT_EVENT_TYPES.replySent,
    SUPPORT_EVENT_TYPES.replyFailed,
    SUPPORT_EVENT_TYPES.customerEmailReceived,
  ];

  const { data } = await supabase
    .from("care_security_logs")
    .select("id, event_type, email, user_id, role, success, details, created_at")
    .in("event_type", eventTypes)
    .order("created_at", { ascending: true })
    .limit(limit);

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
    const details = asRecord(row.details);
    const actorUserId =
      asText(details?.actor_user_id) || asText(row.user_id);
    const actorRole =
      asText(details?.actor_role) || asText(row.role);

    return {
      id: String(row.id || ""),
      event_type: String(row.event_type || ""),
      email: asText(row.email),
      user_id: asText(row.user_id),
      role: asText(row.role),
      actor_user_id: actorUserId,
      actor_role: actorRole,
      success: Boolean(row.success),
      details,
      created_at: String(row.created_at || ""),
    } satisfies SupportLogRow;
  });
}

function projectThreads(rows: SupportLogRow[], viewerUserId?: string | null) {
  const threads = new Map<string, SupportThread>();

  for (const row of rows) {
    const details = asRecord(row.details);
    const threadId = asText(details?.thread_id);

    if (!threadId) {
      continue;
    }

    if (row.event_type === SUPPORT_EVENT_TYPES.threadCreated) {
      const customerName = asText(details?.full_name) || "Customer";
      const subject = asText(details?.subject) || "Support request";
      const message = asText(details?.message) || "";
      const preferredContactMethod = normalizeSupportContactMethod(
        asText(details?.preferred_contact_method)
      );
      const serviceCategory = normalizeSupportServiceCategory(asText(details?.service_category));
      const urgency = normalizeSupportUrgency(asText(details?.urgency));
      const status = normalizeSupportThreadStatus(asText(details?.status));
      const customerEmail = asText(details?.email) || row.email;
      const customerPhone = asText(details?.phone);

      threads.set(threadId, {
        threadId,
        threadRef: asText(details?.thread_ref) || createThreadReference(),
        customerName,
        customerEmail,
        customerPhone,
        preferredContactMethod,
        subject,
        initialMessage: message,
        serviceCategory,
        urgency,
        trackingCode: asText(details?.tracking_code),
        status,
        assignedTo: null,
        createdAt: row.created_at,
        updatedAt: row.created_at,
        lastActivityAt: row.created_at,
        lastPreview: cleanPreview(message),
        replyCount: 0,
        noteCount: 0,
        timeline: [
          {
            id: row.id,
            kind: "customer",
            title: "Customer message",
            body: message,
            createdAt: row.created_at,
            actorName: customerName,
            actorRole: null,
          },
        ],
        latestEmailStatus: null,
        latestWhatsAppStatus: null,
        latestWhatsAppReason: null,
        isStale: false,
        isRead: true,
        isReplied: false,
        lastCustomerActivityAt: row.created_at,
        lastViewedAt: null,
        bookingContext: null,
      });
      continue;
    }

    const thread = threads.get(threadId);
    if (!thread) {
      continue;
    }

    const actorName = asText(details?.actor_name);
    const actorRole = asText(details?.actor_role) || row.actor_role;

    if (row.event_type === SUPPORT_EVENT_TYPES.customerReceiptSent) {
      const emailStatus = asText(details?.email_status) || "sent";
      thread.latestEmailStatus = emailStatus;
      thread.timeline.push({
        id: row.id,
        kind: "system",
        title: "Receipt delivered",
        body: "The customer received an acknowledgment email with the new support reference.",
        createdAt: row.created_at,
        actorName: null,
        actorRole: null,
        emailStatus,
      });
    } else if (row.event_type === SUPPORT_EVENT_TYPES.customerReceiptFailed) {
      thread.latestEmailStatus = asText(details?.email_status) || "failed";
      thread.timeline.push({
        id: row.id,
        kind: "system",
        title: "Receipt delivery issue",
        body:
          asText(details?.reason) ||
          "The customer receipt could not be sent from the current environment.",
        createdAt: row.created_at,
        actorName: null,
        actorRole: null,
        emailStatus: thread.latestEmailStatus,
      });
    } else if (row.event_type === SUPPORT_EVENT_TYPES.threadStatusUpdated) {
      thread.status = normalizeSupportThreadStatus(asText(details?.status));
      if (viewerUserId && row.actor_user_id === viewerUserId) {
        thread.lastViewedAt = row.created_at;
      }
      thread.timeline.push({
        id: row.id,
        kind: "status",
        title: `Status changed to ${formatSupportThreadStatusLabel(thread.status)}`,
        body: asText(details?.note) || "Thread status was updated.",
        createdAt: row.created_at,
        actorName,
        actorRole,
      });
    } else if (row.event_type === SUPPORT_EVENT_TYPES.threadAssigned) {
      thread.assignedTo = {
        userId: asText(details?.assigned_to_user_id),
        fullName: asText(details?.assigned_to_name),
        role: asText(details?.assigned_to_role),
      };
      if (viewerUserId && row.actor_user_id === viewerUserId) {
        thread.lastViewedAt = row.created_at;
      }
      thread.timeline.push({
        id: row.id,
        kind: "assignment",
        title: thread.assignedTo?.fullName
          ? `Assigned to ${thread.assignedTo.fullName}`
          : "Assignment cleared",
        body:
          thread.assignedTo?.role
            ? `Current assignee role: ${thread.assignedTo.role}.`
            : "No staff owner is currently assigned to this thread.",
        createdAt: row.created_at,
        actorName,
        actorRole,
      });
    } else if (row.event_type === SUPPORT_EVENT_TYPES.noteAdded) {
      const body = asText(details?.note) || "";
      thread.noteCount += 1;
      if (viewerUserId && row.actor_user_id === viewerUserId) {
        thread.lastViewedAt = row.created_at;
      }
      thread.timeline.push({
        id: row.id,
        kind: "note",
        title: "Internal note",
        body,
        createdAt: row.created_at,
        actorName,
        actorRole,
      });
    } else if (row.event_type === SUPPORT_EVENT_TYPES.replySent) {
      const body = asText(details?.message) || "";
      const emailStatus = asText(details?.email_status);
      const whatsappStatus = getLoggedWhatsAppStatus(details);
      const whatsappReason = asText(details?.whatsapp_reason);
      thread.replyCount += 1;
      if (viewerUserId && row.actor_user_id === viewerUserId) {
        thread.lastViewedAt = row.created_at;
      }
      thread.latestEmailStatus = emailStatus || thread.latestEmailStatus;
      thread.latestWhatsAppStatus = whatsappStatus || thread.latestWhatsAppStatus;
      thread.latestWhatsAppReason = whatsappReason || thread.latestWhatsAppReason;
      thread.timeline.push({
        id: row.id,
        kind: "support",
        title: "Support reply sent",
        body,
        createdAt: row.created_at,
        actorName,
        actorRole,
        emailStatus,
        whatsappStatus,
        whatsappReason,
      });
      thread.lastPreview = cleanPreview(body);
    } else if (row.event_type === SUPPORT_EVENT_TYPES.replyFailed) {
      if (viewerUserId && row.actor_user_id === viewerUserId) {
        thread.lastViewedAt = row.created_at;
      }
      thread.timeline.push({
        id: row.id,
        kind: "system",
        title: "Support reply failed",
        body:
          asText(details?.reason) ||
          "A reply was attempted but did not complete successfully.",
        createdAt: row.created_at,
        actorName,
        actorRole,
        emailStatus: asText(details?.email_status),
        whatsappStatus: getLoggedWhatsAppStatus(details),
        whatsappReason: asText(details?.whatsapp_reason),
      });
    } else if (row.event_type === SUPPORT_EVENT_TYPES.customerEmailReceived) {
      const body =
        asText(details?.message) ||
        "Customer replied by email, but the provider did not expose the message body.";
      const customerName = asText(details?.customer_name) || thread.customerName;
      const customerEmail = asText(details?.customer_email) || row.email;
      const attachments = normalizeInboundAttachments(details?.attachments);
      const attachmentCount = attachments.length || Number(details?.attachment_count || 0);
      const subject = asText(details?.subject);
      const preview = asText(details?.preview) || cleanPreview(body);

      thread.customerName = thread.customerName || customerName;
      thread.customerEmail = thread.customerEmail || customerEmail;
      thread.lastCustomerActivityAt = row.created_at;
      thread.timeline.push({
        id: row.id,
        kind: "customer",
        title:
          asText(details?.origin) === "account_portal"
            ? "Customer reply received"
            :
          attachmentCount > 0
            ? `Customer email received • ${attachmentCount} attachment${attachmentCount === 1 ? "" : "s"}`
            : "Customer email received",
        body,
        createdAt: row.created_at,
        actorName: customerName,
        actorRole: null,
        inboundEmail: {
          subject,
          sender: customerEmail,
          recipients: asTextList(details?.to),
          cc: asTextList(details?.cc),
          receivedAt: asText(details?.received_at),
          preview,
          fetchReason: asText(details?.fetch_reason),
          attachments,
        },
      });
      thread.lastPreview = preview;
    } else if (row.event_type === SUPPORT_EVENT_TYPES.threadViewed) {
      if (viewerUserId && row.actor_user_id === viewerUserId) {
        thread.lastViewedAt = row.created_at;
      }
    }

    if (row.event_type !== SUPPORT_EVENT_TYPES.threadViewed) {
      thread.updatedAt = row.created_at;
      thread.lastActivityAt = row.created_at;
    }
  }

  const staleCutoffMs = 12 * 3_600_000;
  const now = Date.now();

  return [...threads.values()]
    .map((thread) => ({
      ...thread,
      isReplied: thread.replyCount > 0,
      isStale:
        Number.isFinite(new Date(thread.lastActivityAt).getTime()) &&
        now - new Date(thread.lastActivityAt).getTime() >= staleCutoffMs,
      isRead: viewerUserId
        ? (() => {
            const lastCustomerAt = thread.lastCustomerActivityAt
              ? new Date(thread.lastCustomerActivityAt).getTime()
              : 0;
            const lastViewedAt = thread.lastViewedAt
              ? new Date(thread.lastViewedAt).getTime()
              : 0;

            if (!lastCustomerAt) return true;
            return Boolean(lastViewedAt && lastViewedAt >= lastCustomerAt);
          })()
        : true,
    }))
    .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());
}

function threadMatchesQuery(thread: SupportThread, query: string) {
  if (!query) return true;
  return JSON.stringify({
    threadRef: thread.threadRef,
    customerName: thread.customerName,
    customerEmail: thread.customerEmail,
    customerPhone: thread.customerPhone,
    subject: thread.subject,
    initialMessage: thread.initialMessage,
    trackingCode: thread.trackingCode,
    assignedTo: thread.assignedTo,
    timeline: thread.timeline.map((item) => item.body),
  })
    .toLowerCase()
    .includes(query.toLowerCase());
}

async function attachSupportBookingContext(threads: SupportThread[]) {
  const trackingCodes = [...new Set(threads.map((thread) => thread.trackingCode).filter(Boolean))] as string[];
  if (trackingCodes.length === 0) {
    return threads;
  }

  const supabase = createAdminSupabase();
  const { data: bookingsData } = await supabase
    .from("care_bookings")
    .select("id, tracking_code, service_type, status, payment_status, balance_due, pickup_date, pickup_slot, updated_at")
    .in("tracking_code", trackingCodes);

  const bookingMap = new Map(
    ((bookingsData ?? []) as Array<Record<string, unknown>>).map((row) => [
      String(row.tracking_code || "").trim(),
      row,
    ])
  );
  const bookingIds = [...new Set(((bookingsData ?? []) as Array<Record<string, unknown>>).map((row) => String(row.id || "").trim()).filter(Boolean))];
  const { data: requestData } =
    bookingIds.length > 0
      ? await supabase
          .from("care_payment_requests")
          .select("booking_id, status, created_at")
          .in("booking_id", bookingIds)
          .order("created_at", { ascending: false })
          .limit(300)
      : { data: [] };
  const paymentRequestMap = new Map<string, { status: string | null; createdAt: string | null }>();

  for (const row of (requestData ?? []) as Array<Record<string, unknown>>) {
    const bookingId = String(row.booking_id || "").trim();
    if (!bookingId || paymentRequestMap.has(bookingId)) continue;

    paymentRequestMap.set(bookingId, {
      status: asText(row.status),
      createdAt: asText(row.created_at),
    });
  }

  return threads.map((thread) => {
    const booking = thread.trackingCode ? bookingMap.get(thread.trackingCode) : null;

    if (!booking) {
      return thread;
    }

    const bookingId = String(booking.id || "").trim();
    const latestPaymentRequest = bookingId ? paymentRequestMap.get(bookingId) ?? null : null;

    return {
      ...thread,
      bookingContext: {
        bookingId,
        trackingCode: String(booking.tracking_code || "").trim(),
        serviceType: asText(booking.service_type),
        bookingStatus: asText(booking.status),
        paymentStatus: asText(booking.payment_status),
        balanceDue: asNumber(booking.balance_due),
        pickupDate: asText(booking.pickup_date),
        pickupSlot: asText(booking.pickup_slot),
        updatedAt: asText(booking.updated_at),
        latestPaymentRequestStatus: latestPaymentRequest?.status ?? null,
        latestPaymentRequestCreatedAt: latestPaymentRequest?.createdAt ?? null,
      },
    };
  });
}

function matchesMailboxFilter(thread: SupportThread, mailboxFilter: string) {
  if (!mailboxFilter || mailboxFilter === "all") return true;
  if (mailboxFilter === "replied") return thread.replyCount > 0;
  if (mailboxFilter === "unreplied") return thread.replyCount === 0;
  if (mailboxFilter === "read") return thread.isRead;
  if (mailboxFilter === "unread") return !thread.isRead;
  if (mailboxFilter === "resolved" || mailboxFilter === "archived") {
    return thread.status === "resolved";
  }
  if (mailboxFilter === "stale") return thread.isStale;
  if (mailboxFilter === "urgent") return thread.urgency === "urgent";
  return true;
}

export async function getSupportThreads(filters?: SupportThreadFilters) {
  const query = String(filters?.q || "").trim();
  const statusFilter = String(filters?.status || "all").trim().toLowerCase();
  const assigneeFilter = String(filters?.assignee || "all").trim();
  const mailboxFilter = String(filters?.mailbox || "all").trim().toLowerCase();
  const rows = await fetchSupportLogs(filters?.limit ?? 900);
  let threads = await attachSupportBookingContext(
    projectThreads(rows, filters?.viewerUserId || null)
  );

  if (statusFilter && statusFilter !== "all") {
    threads = threads.filter((thread) => thread.status === normalizeSupportThreadStatus(statusFilter));
  }

  if (assigneeFilter && assigneeFilter !== "all") {
    if (assigneeFilter === "unassigned") {
      threads = threads.filter((thread) => !thread.assignedTo?.userId);
    } else {
      threads = threads.filter((thread) => thread.assignedTo?.userId === assigneeFilter);
    }
  }

  if (query) {
    threads = threads.filter((thread) => threadMatchesQuery(thread, query));
  }

  if (mailboxFilter && mailboxFilter !== "all") {
    threads = threads.filter((thread) => matchesMailboxFilter(thread, mailboxFilter));
  }

  return threads;
}

export async function getSupportThreadById(threadId: string, viewerUserId?: string | null) {
  const rows = await fetchSupportLogs(900);
  const threads = await attachSupportBookingContext(projectThreads(rows, viewerUserId || null));
  return threads.find((thread) => thread.threadId === threadId) ?? null;
}

async function getSupportThreadByReference(threadRef: string, viewerUserId?: string | null) {
  const rows = await fetchSupportLogs(900);
  const threads = await attachSupportBookingContext(projectThreads(rows, viewerUserId || null));
  return (
    threads.find(
      (thread) => thread.threadRef.toUpperCase() === String(threadRef || "").trim().toUpperCase()
    ) ?? null
  );
}

export async function getSupportAgents() {
  const supabase = createAdminSupabase();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_frozen")
    .in("role", ["owner", "manager", "support"])
    .eq("is_frozen", false)
    .order("full_name", { ascending: true });

  return ((data ?? []) as Array<Record<string, unknown>>)
    .map((row) => ({
      id: String(row.id || ""),
      fullName: String(row.full_name || "").trim() || "Staff member",
      role: String(row.role || "").trim().toLowerCase(),
    }))
    .filter((row) => row.id && row.role);
}

export async function createSupportThread(input: ContactSubmissionInput) {
  const threadId = randomUUID();
  const threadRef = createThreadReference();
  const settings = await getCareSettings();
  const replyTo = buildSupportReplyToAddress(settings);
  const customerEmail = String(input.email || "").trim().toLowerCase();
  const customerPhone = asText(input.phone);
  const preferredContactMethod = normalizeSupportContactMethod(input.preferredContactMethod);
  const serviceCategory = normalizeSupportServiceCategory(input.serviceCategory);
  const urgency = normalizeSupportUrgency(input.urgency);

  await insertSupportEvent({
    eventType: SUPPORT_EVENT_TYPES.threadCreated,
    route: "/contact",
    email: customerEmail,
    details: {
      thread_id: threadId,
      thread_ref: threadRef,
      source: "contact_form",
      status: "new",
      full_name: input.fullName,
      email: customerEmail,
      phone: customerPhone,
      preferred_contact_method: preferredContactMethod,
      service_category: serviceCategory,
      urgency,
      subject: input.subject,
      message: input.message,
      tracking_code: asText(input.trackingCode),
    },
  });

  const contactUrl = await buildCarePublicUrl("/contact");
  const receiptResult = await sendCareEmail({
    to: customerEmail,
    dedupeKey: `contact-receipt:${threadRef}`,
    replyTo,
    template: {
      type: "contact_confirmation",
      props: {
        customerName: input.fullName,
        threadRef,
        subject: input.subject,
        messagePreview: input.message,
        preferredContactMethod: formatSupportContactMethodLabel(preferredContactMethod),
        serviceCategoryLabel: formatSupportServiceCategoryLabel(serviceCategory),
        contactUrl,
      },
    },
  });

  await insertSupportEvent({
    eventType:
      receiptResult.status === "sent"
        ? SUPPORT_EVENT_TYPES.customerReceiptSent
        : SUPPORT_EVENT_TYPES.customerReceiptFailed,
    route: "/contact",
    email: customerEmail,
    success: receiptResult.status === "sent",
    details: {
      thread_id: threadId,
      thread_ref: threadRef,
      email_status: receiptResult.status,
      reason: receiptResult.reason,
    },
  });

  const internalEmail =
    settings.support_email ||
    settings.payment_support_email ||
    settings.notification_reply_to_email;

  if (internalEmail) {
    await sendAdminNotificationEmail(internalEmail, {
      heading: `New contact request • ${threadRef}`,
      summary:
        "A customer submitted a new contact request through the HenryCo Care public support page.",
      lines: [
        `Customer: ${input.fullName}`,
        `Subject: ${input.subject}`,
        `Service category: ${formatSupportServiceCategoryLabel(serviceCategory)}`,
        `Urgency: ${formatSupportUrgencyLabel(urgency)}`,
        `Preferred route: ${formatSupportContactMethodLabel(preferredContactMethod)}`,
        customerPhone ? `Phone: ${customerPhone}` : "Phone: not provided",
        asText(input.trackingCode) ? `Tracking code: ${asText(input.trackingCode)}` : null,
      ].filter(Boolean) as string[],
    });
  }

  try {
    await notifyStaffRoles({
      roles:
        urgency === "urgent"
          ? ["support", "manager", "owner"]
          : ["support", "manager"],
      heading: `Support thread opened • ${threadRef}`,
      summary:
        urgency === "urgent"
          ? "A new urgent customer thread entered the Care support desk."
          : "A new customer support thread entered the Care support desk.",
      lines: [
        `Customer: ${input.fullName}`,
        `Subject: ${input.subject}`,
        `Urgency: ${formatSupportUrgencyLabel(urgency)}`,
        `Service category: ${formatSupportServiceCategoryLabel(serviceCategory)}`,
        `Preferred route: ${formatSupportContactMethodLabel(preferredContactMethod)}`,
        customerPhone ? `Phone: ${customerPhone}` : "Phone: not provided",
        asText(input.trackingCode) ? `Tracking code: ${asText(input.trackingCode)}` : null,
      ].filter(Boolean) as string[],
    });
  } catch {
    // public contact intake must not fail because internal staff alerts could not fan out
  }

  return {
    threadId,
    threadRef,
    receiptStatus: receiptResult.status,
    receiptReason: receiptResult.reason,
  };
}

export async function assignSupportThread(input: {
  threadId: string;
  actorUserId: string;
  actorRole: string;
  actorName: string;
  assignee: SupportAgent | null;
}) {
  const thread = await getSupportThreadById(input.threadId);
  if (!thread) {
    throw new Error("Support thread could not be found.");
  }

  await insertSupportEvent({
    eventType: SUPPORT_EVENT_TYPES.threadAssigned,
    route: "/support",
    email: thread.customerEmail,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    details: {
      thread_id: thread.threadId,
      thread_ref: thread.threadRef,
      actor_name: input.actorName,
      assigned_to_user_id: input.assignee?.id ?? null,
      assigned_to_name: input.assignee?.fullName ?? null,
      assigned_to_role: input.assignee?.role ?? null,
    },
  });

  try {
    await syncSupportAssignmentToAccountThread({
      threadId: thread.threadId,
      assigneeId: input.assignee?.id ?? null,
    });
  } catch {
    // Cross-surface sync should not block the operational action.
  }

  return thread;
}

export async function updateSupportThreadStatus(input: {
  threadId: string;
  actorUserId: string;
  actorRole: string;
  actorName: string;
  status: SupportThreadStatus;
  note?: string | null;
}) {
  const thread = await getSupportThreadById(input.threadId);
  if (!thread) {
    throw new Error("Support thread could not be found.");
  }

  await insertSupportEvent({
    eventType: SUPPORT_EVENT_TYPES.threadStatusUpdated,
    route: "/support",
    email: thread.customerEmail,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    details: {
      thread_id: thread.threadId,
      thread_ref: thread.threadRef,
      actor_name: input.actorName,
      previous_status: thread.status,
      status: input.status,
      note: asText(input.note),
    },
  });

  try {
    await syncSupportStatusToAccountThread({
      threadId: thread.threadId,
      status: input.status,
    });
  } catch {
    // Cross-surface sync should not block the operational action.
  }

  return thread;
}

export async function addSupportInternalNote(input: {
  threadId: string;
  actorUserId: string;
  actorRole: string;
  actorName: string;
  note: string;
}) {
  const thread = await getSupportThreadById(input.threadId);
  if (!thread) {
    throw new Error("Support thread could not be found.");
  }

  await insertSupportEvent({
    eventType: SUPPORT_EVENT_TYPES.noteAdded,
    route: "/support",
    email: thread.customerEmail,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    details: {
      thread_id: thread.threadId,
      thread_ref: thread.threadRef,
      actor_name: input.actorName,
      note: input.note,
    },
  });

  try {
    await syncSupportViewToAccountThread({
      threadId: thread.threadId,
    });
  } catch {
    // Cross-surface sync should not block the operational action.
  }

  return thread;
}

export async function markSupportThreadViewed(input: {
  threadId: string;
  actorUserId: string;
  actorRole: string;
  actorName: string;
}) {
  const thread = await getSupportThreadById(input.threadId, input.actorUserId);
  if (!thread) {
    throw new Error("Support thread could not be found.");
  }

  if (thread.isRead) {
    return thread;
  }

  await insertSupportEvent({
    eventType: SUPPORT_EVENT_TYPES.threadViewed,
    route: "/support",
    email: thread.customerEmail,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    details: {
      thread_id: thread.threadId,
      thread_ref: thread.threadRef,
      actor_name: input.actorName,
      read_state: "read",
      last_customer_activity_at: thread.lastCustomerActivityAt,
    },
  });

  return thread;
}

export async function sendSupportReply(input: {
  threadId: string;
  actorUserId: string;
  actorRole: string;
  actorName: string;
  message: string;
  nextStatus?: SupportThreadStatus | null;
  sendWhatsApp?: boolean;
}) {
  const thread = await getSupportThreadById(input.threadId);
  if (!thread) {
    throw new Error("Support thread could not be found.");
  }

  if (!thread.customerEmail) {
    throw new Error("This support thread does not have a customer email address.");
  }

  const contactUrl = await buildCarePublicUrl("/contact");
  const settings = await getCareSettings();
  const replyTo = buildSupportReplyToAddress(settings);
  const emailResult = await sendCareEmail({
    to: thread.customerEmail,
    dedupeKey: `support-reply:${thread.threadRef}:${Date.now()}`,
    replyTo,
    template: {
      type: "support_reply",
      props: {
        customerName: thread.customerName,
        subject: thread.subject,
        threadRef: thread.threadRef,
        message: input.message,
        contactUrl,
      },
    },
  });

  let whatsappResult: SupportWhatsAppDeliveryResult = {
    ok: false,
    status: "skipped",
    deliveryStage: "skipped",
    provider: null,
    reason: "WhatsApp delivery was not requested for this reply.",
    messageId: null,
    statusCode: null,
    graphErrorCode: null,
    responseSummary: null,
  };

  if (input.sendWhatsApp) {
    whatsappResult = await sendSupportReplyWhatsApp({
      phone: thread.customerPhone,
      customerName: thread.customerName,
      threadRef: thread.threadRef,
      threadId: thread.threadId,
      subject: thread.subject,
      message: input.message,
    });
  }

  const whatsappDeliveryStatus =
    whatsappResult.deliveryStage === "api_accepted"
      ? "accepted"
      : whatsappResult.deliveryStage === "sent_to_provider"
        ? "sent"
        : whatsappResult.deliveryStage === "delivered"
          ? "delivered"
          : whatsappResult.deliveryStage === "read"
            ? "read"
            : whatsappResult.status === "failed"
              ? "failed"
              : whatsappResult.status === "skipped"
                ? "skipped"
                : whatsappResult.status;

  if (emailResult.status !== "sent") {
    await insertSupportEvent({
      eventType: SUPPORT_EVENT_TYPES.replyFailed,
      route: "/support",
      email: thread.customerEmail,
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      success: false,
      details: {
        thread_id: thread.threadId,
        thread_ref: thread.threadRef,
        actor_name: input.actorName,
        reason: emailResult.reason || "Email delivery did not complete successfully.",
        email_status: emailResult.status,
        whatsapp_status: whatsappResult.status,
        whatsapp_delivery_status: whatsappDeliveryStatus,
        whatsapp_delivery_stage: whatsappResult.deliveryStage,
        whatsapp_reason: whatsappResult.reason,
        whatsapp_provider: whatsappResult.provider,
        whatsapp_message_id: whatsappResult.messageId,
        whatsapp_status_code: whatsappResult.statusCode,
        whatsapp_graph_error_code: whatsappResult.graphErrorCode,
        whatsapp_response_summary: whatsappResult.responseSummary,
        whatsapp_target_number: whatsappResult.normalizedPhone,
        whatsapp_resolved_wa_id: whatsappResult.resolvedWaId,
        whatsapp_message_type: whatsappResult.messageType,
        whatsapp_conversation_type: whatsappResult.conversationType,
      },
    });

    return {
      thread,
      delivery: {
        email: emailResult,
        whatsapp: whatsappResult,
      } satisfies ReplyDeliveryResult,
    };
  }

  await insertSupportEvent({
    eventType: SUPPORT_EVENT_TYPES.replySent,
    route: "/support",
    email: thread.customerEmail,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    details: {
      thread_id: thread.threadId,
      thread_ref: thread.threadRef,
      actor_name: input.actorName,
      actor_role: input.actorRole,
      message: input.message,
      email_status: emailResult.status,
      email_reason: emailResult.reason,
      whatsapp_status: whatsappResult.status,
      whatsapp_delivery_status: whatsappDeliveryStatus,
      whatsapp_delivery_stage: whatsappResult.deliveryStage,
      whatsapp_reason: whatsappResult.reason,
      whatsapp_provider: whatsappResult.provider,
      whatsapp_message_id: whatsappResult.messageId,
      whatsapp_status_code: whatsappResult.statusCode,
      whatsapp_graph_error_code: whatsappResult.graphErrorCode,
      whatsapp_response_summary: whatsappResult.responseSummary,
      whatsapp_target_number: whatsappResult.normalizedPhone,
      whatsapp_resolved_wa_id: whatsappResult.resolvedWaId,
      whatsapp_message_type: whatsappResult.messageType,
      whatsapp_conversation_type: whatsappResult.conversationType,
    },
  });

  try {
    await syncSupportReplyToAccountThread({
      threadId: thread.threadId,
      senderId: input.actorUserId,
      message: input.message,
      status: input.nextStatus || "open",
    });
  } catch {
    // Cross-surface sync should not block the operational action.
  }

  if (input.nextStatus) {
    await updateSupportThreadStatus({
      threadId: thread.threadId,
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      actorName: input.actorName,
      status: input.nextStatus,
      note: null,
    });
  }

  return {
    thread,
    delivery: {
      email: emailResult,
      whatsapp: whatsappResult,
    } satisfies ReplyDeliveryResult,
  };
}

async function findExistingInboundEmail(emailId: string) {
  const supabase = createAdminSupabase();
  const { data } = await supabase
    .from("care_security_logs")
    .select("details")
    .in("event_type", [
      SUPPORT_EVENT_TYPES.threadCreated,
      SUPPORT_EVENT_TYPES.customerEmailReceived,
    ])
    .contains("details", { inbound_email_id: emailId })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const details = asRecord(data?.details);

  return {
    threadId: asText(details?.thread_id),
    threadRef: asText(details?.thread_ref),
  };
}

export async function syncInboundSupportEmails(limit = 12) {
  const capability = await probeResendReceivingCapability();

  if (!capability.configured || !capability.canFetchContent) {
    return {
      ok: false,
      processed: 0,
      duplicates: 0,
      ignored: 0,
      reason: capability.reason,
    };
  }

  try {
    const mailboxItems = await listRecentReceivedEmails(limit);
    let processed = 0;
    let duplicates = 0;
    let ignored = 0;

    for (const item of [...mailboxItems].reverse()) {
      const existing = await findExistingInboundEmail(item.id);
      if (existing.threadId && existing.threadRef) {
        duplicates += 1;
        continue;
      }

      const result = await ingestInboundSupportEmail({
        emailId: item.id,
        messageId: item.message_id,
        receivedAt: item.created_at,
        from: item.from,
        to: item.to,
        cc: item.cc,
        bcc: item.bcc,
        subject: item.subject,
      });

      if (result.mode === "duplicate") {
        duplicates += 1;
      } else if (result.mode === "ignored") {
        ignored += 1;
      } else {
        processed += 1;
      }
    }

    await insertSupportEvent({
      eventType: SUPPORT_EVENT_TYPES.inboundSyncCompleted,
      route: "/support",
      success: true,
      details: {
        processed,
        duplicates,
        ignored,
        mailbox_sample: mailboxItems
          .slice(0, 5)
          .map((item) => ({
            email_id: item.id,
            subject: item.subject,
            from: item.from,
            created_at: item.created_at,
          })),
      },
    });

    return {
      ok: true,
      processed,
      duplicates,
      ignored,
      reason: null,
    };
  } catch (error) {
    const reason =
      error instanceof Error
        ? error.message
        : "Inbound mailbox sync could not be completed.";

    await insertSupportEvent({
      eventType: SUPPORT_EVENT_TYPES.inboundSyncFailed,
      route: "/support",
      success: false,
      details: {
        reason,
      },
    });

    return {
      ok: false,
      processed: 0,
      duplicates: 0,
      ignored: 0,
      reason,
    };
  }
}

export async function ingestInboundSupportEmail(input: InboundSupportEmailInput) {
  const emailId = asText(input.emailId);
  if (!emailId) {
    throw new Error("Inbound email id is missing.");
  }

  const existing = await findExistingInboundEmail(emailId);
  if (existing.threadId && existing.threadRef) {
    return {
      mode: "duplicate" as const,
      threadId: existing.threadId,
      threadRef: existing.threadRef,
    };
  }

  const receivedAt = asText(input.receivedAt) || new Date().toISOString();
  const subject = asText(input.subject) || "Support email";
  const sender = extractMailbox(input.from);
  const customerEmail = sender.email;
  const customerName = sender.name || "Customer";
  const settings = await getCareSettings();
  const internalAddresses = [
    extractMailbox(process.env.RESEND_FROM_EMAIL).email,
    extractMailbox(process.env.RESEND_FROM).email,
    extractMailbox(settings.support_email).email,
    extractMailbox(settings.notification_reply_to_email).email,
    extractMailbox(getResendSupportInbox()).email,
  ]
    .filter(Boolean)
    .map((item) => String(item).toLowerCase());

  if (!customerEmail) {
    throw new Error("Inbound email sender address could not be resolved.");
  }

  if (internalAddresses.includes(customerEmail)) {
    return {
      mode: "ignored" as const,
      threadId: null,
      threadRef: null,
    };
  }

  let inboundText: string | null = null;
  let attachments: PaymentProofAttachment[] = [];
  let fetchReason: string | null = null;

  try {
    const receiving = await getResendClient().emails.receiving.get(emailId);

    if (receiving.data) {
      attachments = normalizeInboundAttachments(receiving.data.attachments);
      inboundText = normalizeInboundMessageBody(
        asText(receiving.data.text) || stripHtml(String(receiving.data.html || "")),
        receiving.data.subject || subject
      );
    } else {
      fetchReason =
        receiving.error?.message ||
        "The provider returned metadata without a retrievable message body.";
    }
  } catch (error) {
    fetchReason = error instanceof Error ? error.message : "Inbound body retrieval failed.";
  }

  const message = normalizeInboundMessageBody(inboundText, subject);
  const attachmentCount = attachments.length;
  const extractedThreadRef = extractSupportThreadReference(subject);
  const trackingCode =
    extractTrackingCodeFromText(subject) || extractTrackingCodeFromText(message);
  const existingThread = extractedThreadRef
    ? await getSupportThreadByReference(extractedThreadRef)
    : null;

  if (existingThread) {
    await insertSupportEvent({
      eventType: SUPPORT_EVENT_TYPES.customerEmailReceived,
      route: "/api/webhooks/resend",
      email: customerEmail,
      details: {
        thread_id: existingThread.threadId,
        thread_ref: existingThread.threadRef,
        customer_name: customerName,
        customer_email: customerEmail,
        subject,
        message,
        inbound_email_id: emailId,
        inbound_message_id: asText(input.messageId),
        fetch_reason: fetchReason,
        attachment_count: attachmentCount,
        attachments,
        preview: cleanPreview(message),
        received_at: receivedAt,
        to: input.to ?? [],
        cc: input.cc ?? [],
        bcc: input.bcc ?? [],
      },
    });

    if (existingThread.status !== "open") {
      await insertSupportEvent({
        eventType: SUPPORT_EVENT_TYPES.threadStatusUpdated,
        route: "/api/webhooks/resend",
        email: customerEmail,
        details: {
          thread_id: existingThread.threadId,
          thread_ref: existingThread.threadRef,
          previous_status: existingThread.status,
          status: "open",
          note: "Customer replied by email.",
        },
      });
    }

    if (trackingCode) {
      await submitPaymentProof({
        trackingCode,
        source: "support_email",
        sourceId: emailId,
        payerName: customerName,
        note: message,
        customerEmail,
        threadId: existingThread.threadId,
        threadRef: existingThread.threadRef,
        attachments,
      }).catch(() => null);
    }

    return {
      mode: "existing_thread" as const,
      threadId: existingThread.threadId,
      threadRef: existingThread.threadRef,
    };
  }

  const threadId = randomUUID();
  const threadRef = extractedThreadRef || createThreadReference();

  await insertSupportEvent({
    eventType: SUPPORT_EVENT_TYPES.threadCreated,
    route: "/api/webhooks/resend",
    email: customerEmail,
    details: {
      thread_id: threadId,
      thread_ref: threadRef,
      source: "inbound_email",
      status: "open",
      full_name: customerName,
      email: customerEmail,
      phone: null,
      preferred_contact_method: "email",
      service_category: "general",
      urgency: "routine",
      subject,
      message,
      tracking_code: null,
      inbound_email_id: emailId,
      inbound_message_id: asText(input.messageId),
      fetch_reason: fetchReason,
      attachment_count: attachmentCount,
      attachments,
      preview: cleanPreview(message),
      received_at: receivedAt,
      to: input.to ?? [],
      cc: input.cc ?? [],
      bcc: input.bcc ?? [],
    },
  });

  if (trackingCode) {
    await submitPaymentProof({
      trackingCode,
      source: "support_email",
      sourceId: emailId,
      payerName: customerName,
      note: message,
      customerEmail,
      threadId,
      threadRef,
      attachments,
    }).catch(() => null);
  }

  return {
    mode: "new_thread" as const,
    threadId,
    threadRef,
  };
}

export async function getSupportInfrastructureStatus() {
  const whatsapp = getWhatsAppCapability();
  const inbound = await probeResendReceivingCapability();
  const supabase = createAdminSupabase();
  const { data } = await supabase
    .from("care_security_logs")
    .select("event_type, details, created_at, success")
    .in("event_type", [
      "resend_webhook_processed",
      "resend_webhook_processing_failed",
      "resend_webhook_rejected",
      SUPPORT_EVENT_TYPES.inboundSyncCompleted,
      SUPPORT_EVENT_TYPES.inboundSyncFailed,
      SUPPORT_EVENT_TYPES.customerEmailReceived,
    ])
    .order("created_at", { ascending: false })
    .limit(20);

  const latestProcessed = (data ?? []).find(
    (row) => row.event_type === "resend_webhook_processed"
  );
  const latestSync = (data ?? []).find(
    (row) => row.event_type === SUPPORT_EVENT_TYPES.inboundSyncCompleted
  );
  const latestFailure = (data ?? []).find((row) =>
    [
      "resend_webhook_processing_failed",
      "resend_webhook_rejected",
      SUPPORT_EVENT_TYPES.inboundSyncFailed,
    ].includes(row.event_type)
  );
  const latestInbound = (data ?? []).find(
    (row) => row.event_type === SUPPORT_EVENT_TYPES.customerEmailReceived
  );
  const latestInboundDetails = asRecord(latestInbound?.details);
  const latestFailureDetails = asRecord(latestFailure?.details);

  return {
    whatsapp,
    inboundEmail: {
      configured: inbound.configured,
      reason: inbound.reason,
      supportInbox: inbound.supportInbox,
      canFetchContent: inbound.canFetchContent,
      lastProcessedAt: asText(latestProcessed?.created_at),
      lastSyncAt: asText(latestSync?.created_at),
      lastFailureAt: asText(latestFailure?.created_at),
      lastFailureReason: asText(latestFailureDetails?.reason),
      lastInboundAt: asText(latestInbound?.created_at),
      lastInboundSubject: asText(latestInboundDetails?.subject),
      lastInboundThreadRef: asText(latestInboundDetails?.thread_ref),
    },
  };
}

export async function getReviewSupportContext(reviewIds: string[]) {
  const ids = [...new Set(reviewIds.map((value) => String(value || "").trim()).filter(Boolean))];
  const map = new Map<string, SupportReviewContext>();

  if (ids.length === 0) {
    return map;
  }

  const supabase = createAdminSupabase();
  const { data } = await supabase
    .from("care_security_logs")
    .select("id, event_type, role, details, created_at")
    .in("event_type", [
      SUPPORT_EVENT_TYPES.reviewSubmitted,
      SUPPORT_EVENT_TYPES.reviewModerationUpdated,
    ])
    .order("created_at", { ascending: false })
    .limit(Math.max(200, ids.length * 8));

  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    const details = asRecord(row.details);
    const reviewId = asText(details?.review_id);
    if (!reviewId || !ids.includes(reviewId)) {
      continue;
    }

    const existing = map.get(reviewId) ?? {
      reviewId,
      trackingCode: null,
      bookingId: null,
      serviceFamily: null,
      latestModerationStatus: "pending" as const,
      latestModerationNote: null,
      latestModeratorName: null,
      latestModeratorRole: null,
    };

    if (row.event_type === SUPPORT_EVENT_TYPES.reviewSubmitted) {
      if (!existing.trackingCode) {
        existing.trackingCode = asText(details?.tracking_code);
        existing.bookingId = asText(details?.booking_id);
        existing.serviceFamily = asText(details?.family);
      }
    }

    if (row.event_type === SUPPORT_EVENT_TYPES.reviewModerationUpdated) {
      existing.latestModerationStatus =
        (asText(details?.moderation_status) as SupportReviewContext["latestModerationStatus"]) ||
        existing.latestModerationStatus;
      existing.latestModerationNote =
        asText(details?.moderation_note) || existing.latestModerationNote;
      existing.latestModeratorName =
        asText(details?.actor_name) || existing.latestModeratorName;
      existing.latestModeratorRole =
        asText(details?.actor_role) || asText(row.role) || existing.latestModeratorRole;
    }

    map.set(reviewId, existing);
  }

  return map;
}

export async function logReviewModerationEvent(input: {
  reviewId: string;
  actorUserId: string;
  actorRole: string;
  actorName: string;
  moderationStatus: "approved" | "rejected" | "pending";
  moderationNote?: string | null;
  trackingCode?: string | null;
  bookingId?: string | null;
}) {
  await insertSupportEvent({
    eventType: SUPPORT_EVENT_TYPES.reviewModerationUpdated,
    route: "/support",
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    details: {
      review_id: input.reviewId,
      actor_name: input.actorName,
      actor_role: input.actorRole,
      moderation_status: input.moderationStatus,
      moderation_note: asText(input.moderationNote),
      tracking_code: asText(input.trackingCode),
      booking_id: asText(input.bookingId),
      status:
        input.moderationStatus === "approved"
          ? "resolved"
          : input.moderationStatus === "rejected"
          ? "open"
          : "pending_customer",
    },
  });
}
