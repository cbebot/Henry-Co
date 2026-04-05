import "server-only";

import { randomUUID } from "crypto";
import { inferCareServiceFamily } from "@/lib/care-tracking";
import { getCareSettings } from "@/lib/care-data";
import {
  buildTrackingUrl,
  sendCareEmail,
  sendPaymentReceivedEmail,
} from "@/lib/email/send";
import { notifyStaffRoles } from "@/lib/staff-alerts";
import { createAdminSupabase } from "@/lib/supabase";
import { normalizePhone } from "@henryco/config";

export type PaymentVerificationStatus =
  | "awaiting_receipt"
  | "receipt_submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "awaiting_corrected_proof";

export type PaymentProofAttachment = {
  url: string | null;
  publicId: string | null;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  kind: "image" | "pdf" | "file";
};

export type PaymentProofSubmission = {
  id: string;
  source: "tracking_page" | "support_email" | "support_upload";
  sourceId: string | null;
  submittedAt: string;
  payerName: string | null;
  amountPaid: number | null;
  paymentReference: string | null;
  paidAt: string | null;
  note: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  threadId: string | null;
  threadRef: string | null;
  suspiciousMismatch: boolean;
  attachments: PaymentProofAttachment[];
};

export type PaymentVerificationSnapshot = {
  requestId: string | null;
  requestNo: string | null;
  requestKind: string | null;
  requestStatus: string | null;
  verificationStatus: PaymentVerificationStatus;
  verificationLabel: string;
  verificationMessage: string;
  trackingCode: string;
  serviceFamily: "garment" | "home" | "office";
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  amountDue: number;
  amountPaidRecorded: number;
  balanceDue: number;
  paymentStatus: string | null;
  currency: string;
  supportEmail: string | null;
  supportWhatsApp: string | null;
  lastSubmittedAt: string | null;
  lastReviewedAt: string | null;
  latestReviewReason: string | null;
  latestSubmission: PaymentProofSubmission | null;
  receiptCount: number;
  canSubmitReceipt: boolean;
  suspiciousMismatch: boolean;
};

export type PaymentReviewQueueItem = PaymentVerificationSnapshot & {
  bookingId: string;
  serviceType: string;
  bookingStatus: string | null;
  requestedAt: string | null;
  sentAt: string | null;
  paidAt: string | null;
};

type BookingRow = {
  id: string;
  tracking_code: string;
  customer_name: string;
  email: string | null;
  phone: string | null;
  phone_normalized: string | null;
  service_type: string;
  item_summary: string | null;
  status: string | null;
  quoted_total: number | null;
  amount_paid: number | null;
  balance_due: number | null;
  payment_status: string | null;
};

type PaymentRequestRow = {
  id: string;
  request_no: string | null;
  booking_id: string;
  request_kind: string | null;
  currency: string | null;
  amount_due: number | null;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  instructions: string | null;
  recipient_email: string | null;
  status: string | null;
  requested_at: string | null;
  sent_at: string | null;
  paid_at: string | null;
  payload: Record<string, unknown> | null;
};

type EnsurePaymentRequestInput = {
  bookingId: string;
  requestKind?: string | null;
  recipientEmail?: string | null;
  amountDue?: number | null;
  requestedAt?: string | null;
  instructionsOverride?: string | null;
};

type SubmitPaymentProofInput = {
  trackingCode: string;
  phone?: string | null;
  source: PaymentProofSubmission["source"];
  sourceId?: string | null;
  payerName?: string | null;
  amountPaid?: number | null;
  paymentReference?: string | null;
  paidAt?: string | null;
  note?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  threadId?: string | null;
  threadRef?: string | null;
  attachments?: PaymentProofAttachment[];
};

type ReviewPaymentProofInput = {
  requestId: string;
  actorUserId: string;
  actorRole: string;
  actorName: string;
  decision: "approve" | "reject" | "request_more" | "under_review";
  reason?: string | null;
  amountApproved?: number | null;
  paymentMethod?: string | null;
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

function asNumber(value: unknown) {
  const normalized = Number(value ?? null);
  return Number.isFinite(normalized) ? normalized : null;
}

function asBoolean(value: unknown) {
  return Boolean(value);
}

function sanitizeAmount(value?: number | null) {
  const normalized = Number(value ?? 0);
  return Number.isFinite(normalized) ? Math.max(0, normalized) : 0;
}

function normalizePaymentProofAttachment(value: unknown): PaymentProofAttachment | null {
  const record = asRecord(value);
  if (!record) return null;

  const url = asText(record.url);
  const fileName = asText(record.fileName) || asText(record.file_name);
  if (!url && !fileName) return null;

  const mimeType = asText(record.mimeType) || asText(record.mime_type);
  const kind =
    mimeType === "application/pdf"
      ? "pdf"
      : mimeType?.startsWith("image/")
        ? "image"
        : "file";

  return {
    url,
    publicId: asText(record.publicId) || asText(record.public_id),
    fileName,
    mimeType,
    sizeBytes: asNumber(record.sizeBytes) || asNumber(record.size_bytes),
    kind,
  };
}

function normalizePaymentProofSubmission(value: unknown): PaymentProofSubmission | null {
  const record = asRecord(value);
  if (!record) return null;

  const id = asText(record.id);
  const submittedAt = asText(record.submittedAt) || asText(record.submitted_at);
  const source = asText(record.source) as PaymentProofSubmission["source"] | null;

  if (!id || !submittedAt || !source) {
    return null;
  }

  const attachments = Array.isArray(record.attachments)
    ? record.attachments
        .map((item) => normalizePaymentProofAttachment(item))
        .filter(Boolean) as PaymentProofAttachment[]
    : [];

  return {
    id,
    source,
    sourceId: asText(record.sourceId) || asText(record.source_id),
    submittedAt,
    payerName: asText(record.payerName) || asText(record.payer_name),
    amountPaid: asNumber(record.amountPaid) || asNumber(record.amount_paid),
    paymentReference:
      asText(record.paymentReference) || asText(record.payment_reference),
    paidAt: asText(record.paidAt) || asText(record.paid_at),
    note: asText(record.note),
    customerEmail: asText(record.customerEmail) || asText(record.customer_email),
    customerPhone: asText(record.customerPhone) || asText(record.customer_phone),
    threadId: asText(record.threadId) || asText(record.thread_id),
    threadRef: asText(record.threadRef) || asText(record.thread_ref),
    suspiciousMismatch:
      asBoolean(record.suspiciousMismatch) || asBoolean(record.suspicious_mismatch),
    attachments,
  };
}

function normalizeReceiptSubmissions(value: unknown) {
  if (!Array.isArray(value)) return [] as PaymentProofSubmission[];
  return value
    .map((item) => normalizePaymentProofSubmission(item))
    .filter(Boolean) as PaymentProofSubmission[];
}

function currentVerificationStatus(
  booking: BookingRow,
  request: PaymentRequestRow | null,
  payload: Record<string, unknown> | null
): PaymentVerificationStatus {
  if (String(request?.status || "").trim().toLowerCase() === "paid") {
    return "approved";
  }

  if (sanitizeAmount(booking.balance_due) <= 0) {
    return "approved";
  }

  const explicit =
    (asText(payload?.verification_status) as PaymentVerificationStatus | null) ||
    null;

  if (explicit) {
    return explicit;
  }

  return "awaiting_receipt";
}

function verificationLabel(status: PaymentVerificationStatus) {
  if (status === "receipt_submitted") return "Receipt submitted";
  if (status === "under_review") return "Under verification";
  if (status === "approved") return "Payment approved";
  if (status === "rejected") return "Payment rejected";
  if (status === "awaiting_corrected_proof") return "Awaiting corrected proof";
  return "Payment pending";
}

function verificationMessage(input: {
  status: PaymentVerificationStatus;
  amountDue: number;
  supportEmail: string | null;
  supportWhatsApp: string | null;
  latestReason: string | null;
}) {
  const supportFallback = [input.supportEmail, input.supportWhatsApp]
    .filter(Boolean)
    .join(" • ");

  if (input.status === "receipt_submitted") {
    return "Your receipt has been received and queued for manual verification by the Care team.";
  }

  if (input.status === "under_review") {
    return "The submitted proof is under manual review. You will receive a confirmation as soon as the account-side check is complete.";
  }

  if (input.status === "approved") {
    return "Payment has been verified successfully. The booking can now continue to the next operational step.";
  }

  if (input.status === "rejected") {
    return input.latestReason
      ? `The previous proof could not be verified. ${input.latestReason}`
      : "The submitted proof could not be verified against the booking yet.";
  }

  if (input.status === "awaiting_corrected_proof") {
    return input.latestReason
      ? `Please send corrected proof so the team can continue. ${input.latestReason}`
      : "The team needs a clearer receipt or corrected payment details before the booking can continue.";
  }

  return supportFallback
    ? `Payment is still pending. Once you transfer the balance, reply to the payment email with your receipt or use the secure upload section below. ${supportFallback}`
    : "Payment is still pending. Once you transfer the balance, reply to the payment email with your receipt or use the secure upload section below.";
}

function buildRequestPayloadDefaults(
  booking: BookingRow,
  settings: Awaited<ReturnType<typeof getCareSettings>>
) {
  return {
    tracking_code: booking.tracking_code,
    customer_name: booking.customer_name,
    service_type: booking.service_type,
    quoted_total: sanitizeAmount(booking.quoted_total),
    amount_paid: sanitizeAmount(booking.amount_paid),
    balance_due: sanitizeAmount(booking.balance_due),
    support_email: settings.payment_support_email || settings.support_email,
    support_whatsapp: settings.payment_support_whatsapp || settings.payment_whatsapp,
    verification_status: "awaiting_receipt",
    receipt_submissions: [],
  } satisfies Record<string, unknown>;
}

async function getBookingById(bookingId: string) {
  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from("care_bookings")
    .select(
      "id, tracking_code, customer_name, email, phone, phone_normalized, service_type, item_summary, status, quoted_total, amount_paid, balance_due, payment_status"
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (error || !data?.id) {
    throw new Error("Booking could not be found.");
  }

  return data as BookingRow;
}

async function getBookingByTrackingCode(trackingCode: string) {
  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from("care_bookings")
    .select(
      "id, tracking_code, customer_name, email, phone, phone_normalized, service_type, item_summary, status, quoted_total, amount_paid, balance_due, payment_status"
    )
    .eq("tracking_code", trackingCode)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.id) {
    throw new Error("Booking could not be found.");
  }

  return data as BookingRow;
}

async function getLatestPaymentRequest(bookingId: string) {
  const supabase = createAdminSupabase();
  const { data } = await supabase
    .from("care_payment_requests")
    .select(
      "id, request_no, booking_id, request_kind, currency, amount_due, bank_name, account_name, account_number, instructions, recipient_email, status, requested_at, sent_at, paid_at, payload"
    )
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false })
    .limit(10);

  const rows = ((data ?? []) as PaymentRequestRow[]).filter((row) => row.booking_id);
  const active =
    rows.find((row) => String(row.status || "").toLowerCase() !== "paid") ?? rows[0] ?? null;

  return active;
}

export async function ensureBookingPaymentRequest(input: EnsurePaymentRequestInput) {
  const booking = await getBookingById(input.bookingId);
  const settings = await getCareSettings();
  const requestedAt = input.requestedAt || new Date().toISOString();
  const amountDue =
    input.amountDue == null ? sanitizeAmount(booking.balance_due) : sanitizeAmount(input.amountDue);
  const supabase = createAdminSupabase();
  const existing = await getLatestPaymentRequest(booking.id);

  const payloadDefaults = buildRequestPayloadDefaults(booking, settings);

  if (existing?.id) {
    const currentPayload = asRecord(existing.payload) || {};
    const nextPayload = {
      ...payloadDefaults,
      ...currentPayload,
      verification_status:
        asText(currentPayload.verification_status) || "awaiting_receipt",
      receipt_submissions: normalizeReceiptSubmissions(currentPayload.receipt_submissions),
    };

    await supabase
      .from("care_payment_requests")
      .update({
        currency: existing.currency || settings.payment_currency || "NGN",
        amount_due: amountDue,
        bank_name: existing.bank_name || settings.payment_bank_name || settings.company_bank_name,
        account_name:
          existing.account_name ||
          settings.payment_account_name ||
          settings.company_account_name,
        account_number:
          existing.account_number ||
          settings.payment_account_number ||
          settings.company_account_number,
        instructions:
          existing.instructions ||
          input.instructionsOverride ||
          settings.payment_instructions ||
          "Reply to the payment email with your receipt after transfer so the team can verify and continue the booking.",
        recipient_email: existing.recipient_email || input.recipientEmail || booking.email,
        requested_at: existing.requested_at || requestedAt,
        payload: nextPayload,
      } as never)
      .eq("id", existing.id);

    return {
      ...existing,
      amount_due: amountDue,
      currency: existing.currency || settings.payment_currency || "NGN",
      recipient_email: existing.recipient_email || input.recipientEmail || booking.email,
      payload: nextPayload,
    } satisfies PaymentRequestRow;
  }

  const payload = {
    ...payloadDefaults,
    verification_status: "awaiting_receipt",
    receipt_submissions: [],
  };

  const { data, error } = await supabase
    .from("care_payment_requests")
    .insert({
      booking_id: booking.id,
      request_kind: input.requestKind || "booking_payment_request",
      currency: settings.payment_currency || "NGN",
      amount_due: amountDue,
      bank_name: settings.payment_bank_name || settings.company_bank_name,
      account_name: settings.payment_account_name || settings.company_account_name,
      account_number: settings.payment_account_number || settings.company_account_number,
      instructions:
        input.instructionsOverride ||
        settings.payment_instructions ||
        "Reply to the payment email with your receipt after transfer so the team can verify and continue the booking.",
      recipient_email: input.recipientEmail || booking.email,
      status: "queued",
      requested_at: requestedAt,
      payload,
    } as never)
    .select(
      "id, request_no, booking_id, request_kind, currency, amount_due, bank_name, account_name, account_number, instructions, recipient_email, status, requested_at, sent_at, paid_at, payload"
    )
    .maybeSingle();

  if (error || !data?.id) {
    throw new Error(error?.message || "Payment request could not be created.");
  }

  return data as PaymentRequestRow;
}

export async function markPaymentRequestDeliveryState(input: {
  requestId: string;
  deliveryStatus: "sent" | "queued" | "failed";
  notificationId?: string | null;
  messageId?: string | null;
  reason?: string | null;
}) {
  const supabase = createAdminSupabase();
  const { data } = await supabase
    .from("care_payment_requests")
    .select("id, status, payload")
    .eq("id", input.requestId)
    .maybeSingle();

  if (!data?.id) {
    return;
  }

  const currentPayload = asRecord(data.payload) || {};
  const nextPayload = {
    ...currentPayload,
    last_delivery_status: input.deliveryStatus,
    last_delivery_reason: asText(input.reason),
    last_delivery_message_id: asText(input.messageId),
    last_delivery_notification_id: asText(input.notificationId),
    last_delivery_at: new Date().toISOString(),
  };

  await supabase
    .from("care_payment_requests")
    .update({
      status: input.deliveryStatus === "failed" ? "failed" : input.deliveryStatus,
      sent_at: input.deliveryStatus === "sent" ? new Date().toISOString() : null,
      payload: nextPayload,
    } as never)
    .eq("id", input.requestId);
}

function buildVerificationSnapshot(
  booking: BookingRow,
  request: PaymentRequestRow | null,
  settings: Awaited<ReturnType<typeof getCareSettings>>
): PaymentVerificationSnapshot {
  const payload = asRecord(request?.payload) || null;
  const submissions = normalizeReceiptSubmissions(payload?.receipt_submissions);
  const latestSubmission = submissions[0] || submissions[submissions.length - 1] || null;
  const latestReviewReason =
    asText(payload?.latest_review_reason) || asText(payload?.last_review_reason);
  const status = currentVerificationStatus(booking, request, payload);

  return {
    requestId: request?.id || null,
    requestNo: request?.request_no || null,
    requestKind: request?.request_kind || null,
    requestStatus: request?.status || null,
    verificationStatus: status,
    verificationLabel: verificationLabel(status),
    verificationMessage: verificationMessage({
      status,
      amountDue: sanitizeAmount(request?.amount_due ?? booking.balance_due),
      supportEmail:
        asText(payload?.support_email) || settings.payment_support_email || settings.support_email,
      supportWhatsApp:
        asText(payload?.support_whatsapp) ||
        settings.payment_support_whatsapp ||
        settings.payment_whatsapp,
      latestReason: latestReviewReason,
    }),
    trackingCode: booking.tracking_code,
    serviceFamily: inferCareServiceFamily(booking),
    customerName: booking.customer_name,
    customerEmail: booking.email,
    customerPhone: booking.phone,
    amountDue: sanitizeAmount(request?.amount_due ?? booking.balance_due),
    amountPaidRecorded: sanitizeAmount(booking.amount_paid),
    balanceDue: sanitizeAmount(booking.balance_due),
    paymentStatus: booking.payment_status,
    currency: request?.currency || settings.payment_currency || "NGN",
    supportEmail:
      asText(payload?.support_email) || settings.payment_support_email || settings.support_email,
    supportWhatsApp:
      asText(payload?.support_whatsapp) ||
      settings.payment_support_whatsapp ||
      settings.payment_whatsapp,
    lastSubmittedAt:
      latestSubmission?.submittedAt ||
      asText(payload?.latest_submission_at) ||
      asText(payload?.last_submission_at),
    lastReviewedAt:
      asText(payload?.reviewed_at) ||
      asText(payload?.latest_reviewed_at) ||
      request?.paid_at ||
      null,
    latestReviewReason,
    latestSubmission,
    receiptCount: submissions.length,
    canSubmitReceipt: status !== "approved",
    suspiciousMismatch: Boolean(latestSubmission?.suspiciousMismatch),
  };
}

export async function getPaymentVerificationSnapshotForBooking(bookingId: string) {
  const booking = await getBookingById(bookingId);
  const request = await getLatestPaymentRequest(booking.id);
  const settings = await getCareSettings();
  return buildVerificationSnapshot(booking, request, settings);
}

export async function getPaymentVerificationSnapshotForTrackingCode(
  trackingCode: string,
  phone?: string | null
) {
  const booking = await getBookingByTrackingCode(String(trackingCode || "").trim().toUpperCase());
  const normalizedInputPhone = normalizePhone(phone);

  if (normalizedInputPhone) {
    const normalizedSavedPhone = normalizePhone(booking.phone_normalized || booking.phone);
    if (!normalizedSavedPhone || normalizedSavedPhone !== normalizedInputPhone) {
      throw new Error("The phone number does not match that booking.");
    }
  }

  const request = await getLatestPaymentRequest(booking.id);
  const settings = await getCareSettings();
  return buildVerificationSnapshot(booking, request, settings);
}

async function logPaymentSecurityEvent(input: {
  eventType: string;
  success: boolean;
  email?: string | null;
  actorUserId?: string | null;
  actorRole?: string | null;
  details: Record<string, unknown>;
}) {
  try {
    const supabase = createAdminSupabase();
    const actorUserId = input.actorUserId ?? null;
    const actorRole = input.actorRole ?? null;

    await supabase.from("care_security_logs").insert({
      event_type: input.eventType,
      route: "/payments/verification",
      email: input.email ?? null,
      user_id: actorUserId,
      role: actorRole,
      success: input.success,
      details: {
        ...input.details,
        actor_user_id: actorUserId,
        actor_role: actorRole,
      },
    } as never);
  } catch {
    // ignore logging failure
  }
}

export async function submitPaymentProof(input: SubmitPaymentProofInput) {
  const trackingCode = String(input.trackingCode || "").trim().toUpperCase();
  if (!trackingCode) {
    throw new Error("Tracking code is required.");
  }

  const booking = await getBookingByTrackingCode(trackingCode);
  const normalizedInputPhone = normalizePhone(input.phone);

  if (normalizedInputPhone) {
    const normalizedSavedPhone = normalizePhone(booking.phone_normalized || booking.phone);
    if (!normalizedSavedPhone || normalizedSavedPhone !== normalizedInputPhone) {
      throw new Error("The phone number does not match that booking.");
    }
  }

  const request = await ensureBookingPaymentRequest({
    bookingId: booking.id,
    recipientEmail: booking.email,
  });
  const payload = asRecord(request.payload) || {};
  const currentStatus = currentVerificationStatus(booking, request, payload);
  const keepApprovedState = currentStatus === "approved";
  const submissions = normalizeReceiptSubmissions(payload.receipt_submissions);

  const duplicate = submissions.find((submission) => {
    if (input.sourceId && submission.sourceId && submission.sourceId === input.sourceId) {
      return true;
    }

    return Boolean(
      submission.paymentReference &&
        input.paymentReference &&
        submission.paymentReference.toLowerCase() ===
          String(input.paymentReference).trim().toLowerCase() &&
        sanitizeAmount(submission.amountPaid) === sanitizeAmount(input.amountPaid)
    );
  });

  if (duplicate) {
    return {
      duplicate: true,
      submission: duplicate,
      snapshot: buildVerificationSnapshot(booking, request, await getCareSettings()),
      requestId: request.id,
      bookingId: booking.id,
    };
  }

  const submittedAt = new Date().toISOString();
  const amountDue = sanitizeAmount(request.amount_due ?? booking.balance_due);
  const amountPaid = input.amountPaid == null ? null : sanitizeAmount(input.amountPaid);
  const suspiciousMismatch = amountPaid != null && Math.abs(amountPaid - amountDue) > 1;

  const submission: PaymentProofSubmission = {
    id: randomUUID(),
    source: input.source,
    sourceId: asText(input.sourceId),
    submittedAt,
    payerName: asText(input.payerName),
    amountPaid,
    paymentReference: asText(input.paymentReference),
    paidAt: asText(input.paidAt),
    note: asText(input.note),
    customerEmail: asText(input.customerEmail) || booking.email,
    customerPhone: asText(input.customerPhone) || booking.phone,
    threadId: asText(input.threadId),
    threadRef: asText(input.threadRef),
    suspiciousMismatch,
    attachments: (input.attachments || []).filter(
      (item) => Boolean(item.url || item.fileName)
    ),
  };

  const nextPayload = {
    ...payload,
    verification_status: keepApprovedState ? "approved" : "receipt_submitted",
    latest_submission_at: submittedAt,
    latest_submission_id: submission.id,
    latest_submission_source: submission.source,
    latest_review_reason: keepApprovedState
      ? asText(payload.latest_review_reason) || null
      : null,
    latest_follow_up_submission_at: keepApprovedState ? submittedAt : null,
    latest_follow_up_submission_source: keepApprovedState ? submission.source : null,
    receipt_submissions: [submission, ...submissions],
  };

  const supabase = createAdminSupabase();
  const { error } = await supabase
    .from("care_payment_requests")
    .update({
      payload: nextPayload,
    } as never)
    .eq("id", request.id);

  if (error) {
    throw new Error(error.message || "Payment proof could not be saved.");
  }

  const trackUrl = await buildTrackingUrl(booking.tracking_code, booking.phone);

  if (booking.email) {
    await sendCareEmail({
      to: booking.email,
      bookingId: booking.id,
      paymentRequestId: request.id,
      dedupeKey: `payment-receipt-received:${request.id}:${submission.id}`,
      template: {
        type: "payment_receipt_received",
        props: {
          customerName: booking.customer_name,
          trackingCode: booking.tracking_code,
          amountDue: `₦${amountDue.toLocaleString()}`,
          serviceType: booking.service_type,
          trackUrl,
        },
      },
    });
  }

  await logPaymentSecurityEvent({
    eventType: "payment_receipt_submitted",
    success: true,
    email: booking.email,
    details: {
      booking_id: booking.id,
      request_id: request.id,
      tracking_code: booking.tracking_code,
      submission_id: submission.id,
      source: submission.source,
      amount_paid: submission.amountPaid,
      payment_reference: submission.paymentReference,
      attachment_count: submission.attachments.length,
      suspicious_mismatch: submission.suspiciousMismatch,
      thread_id: submission.threadId,
      thread_ref: submission.threadRef,
    },
  });

  try {
    await notifyStaffRoles({
      roles: submission.suspiciousMismatch ? ["support", "owner"] : ["support"],
      heading: `Payment proof submitted • ${booking.tracking_code}`,
      summary: submission.suspiciousMismatch
        ? "A payment proof was submitted with an amount mismatch and needs fast review."
        : "A payment proof was submitted and is ready for support verification.",
      lines: [
        `Tracking code: ${booking.tracking_code}`,
        `Customer: ${booking.customer_name}`,
        `Source: ${submission.source}`,
        `Expected amount: ₦${amountDue.toLocaleString()}`,
        submission.amountPaid != null
          ? `Submitted amount: ₦${submission.amountPaid.toLocaleString()}`
          : "Submitted amount: not stated",
        `Attachments: ${submission.attachments.length}`,
        `Mismatch flagged: ${submission.suspiciousMismatch ? "Yes" : "No"}`,
      ],
    });
  } catch {
    // payment proof intake should not fail because staff alert fanout is unavailable
  }

  const snapshot = buildVerificationSnapshot(
    booking,
    {
      ...request,
      payload: nextPayload,
    },
    await getCareSettings()
  );

  return {
    duplicate: false,
    submission,
    snapshot,
    requestId: request.id,
    bookingId: booking.id,
  };
}

async function recalculateBookingTotals(bookingId: string) {
  const supabase = createAdminSupabase();

  try {
    await supabase.rpc("care_recalculate_booking_totals", {
      p_booking_id: bookingId,
    });
  } catch {
    // ignore recalculation failure
  }
}

async function ensureLedgerEntry(input: {
  sourceId: string;
  bookingId: string;
  amount: number;
  narration: string;
}) {
  const supabase = createAdminSupabase();
  const { data } = await supabase
    .from("care_finance_ledger")
    .select("id")
    .eq("source_table", "care_payments")
    .eq("source_id", input.sourceId)
    .limit(1)
    .maybeSingle();

  if (data?.id) {
    return;
  }

  await supabase.from("care_finance_ledger").insert({
    entry_type: "payment",
    source_table: "care_payments",
    source_id: input.sourceId,
    booking_id: input.bookingId,
    direction: "inflow",
    amount: input.amount,
    narration: input.narration,
  } as never);
}

function verificationStatusFromDecision(
  decision: ReviewPaymentProofInput["decision"]
): PaymentVerificationStatus {
  if (decision === "approve") return "approved";
  if (decision === "reject") return "rejected";
  if (decision === "request_more") return "awaiting_corrected_proof";
  return "under_review";
}

export async function reviewPaymentProof(input: ReviewPaymentProofInput) {
  const supabase = createAdminSupabase();
  const { data: requestData, error: requestError } = await supabase
    .from("care_payment_requests")
    .select(
      "id, request_no, booking_id, request_kind, currency, amount_due, bank_name, account_name, account_number, instructions, recipient_email, status, requested_at, sent_at, paid_at, payload"
    )
    .eq("id", input.requestId)
    .maybeSingle();

  if (requestError || !requestData?.id) {
    throw new Error("Payment verification record could not be found.");
  }

  const request = requestData as PaymentRequestRow;
  const booking = await getBookingById(request.booking_id);
  const payload = asRecord(request.payload) || {};
  const submissions = normalizeReceiptSubmissions(payload.receipt_submissions);
  const latestSubmission = submissions[0] || submissions[submissions.length - 1] || null;
  const reviewStatus = verificationStatusFromDecision(input.decision);

  if (reviewStatus === "approved" || String(request.status || "").toLowerCase() === "paid") {
    if (
      String(request.status || "").toLowerCase() === "paid" ||
      asText(payload.verification_status) === "approved"
    ) {
      throw new Error("This payment proof has already been approved.");
    }
  }

  const reviewedAt = new Date().toISOString();
  const reason = asText(input.reason);

  if (
    (input.decision === "reject" || input.decision === "request_more") &&
    !reason
  ) {
    throw new Error("Add a reason before sending this decision to the customer.");
  }

  if (input.decision === "approve") {
    const approvedAmount =
      input.amountApproved == null
        ? sanitizeAmount(latestSubmission?.amountPaid ?? request.amount_due ?? booking.balance_due)
        : sanitizeAmount(input.amountApproved);

    if (!approvedAmount) {
      throw new Error("An approved amount is required before confirming payment.");
    }

    const approvedReference =
      asText(latestSubmission?.paymentReference) || asText(payload.latest_reference);
    const { data: existingPayment } = await supabase
      .from("care_payments")
      .select("id, amount, payment_method, reference")
      .eq("booking_id", booking.id)
      .eq("amount", approvedAmount)
      .eq("reference", approvedReference)
      .limit(1)
      .maybeSingle();

    let paymentId = asText(existingPayment?.id);

    if (!paymentId) {
      const paymentInsert = await supabase
        .from("care_payments")
        .insert({
          booking_id: booking.id,
          amount: approvedAmount,
          payment_method: asText(input.paymentMethod) || "bank_transfer",
          reference: approvedReference,
          notes:
            reason ||
            `Manually verified by ${input.actorName} from submitted receipt proof.`,
          received_by: input.actorUserId,
        } as never)
        .select("id, amount, payment_method, reference")
        .maybeSingle();

      if (paymentInsert.error || !paymentInsert.data?.id) {
        throw new Error(
          paymentInsert.error?.message || "Payment could not be recorded after approval."
        );
      }

      const createdPaymentId = paymentInsert.data.id;
      paymentId = createdPaymentId;
      await ensureLedgerEntry({
        sourceId: createdPaymentId,
        bookingId: booking.id,
        amount: approvedAmount,
        narration: `Payment verified by support • ${approvedReference || booking.tracking_code}`,
      });
    }

    const nextPayload = {
      ...payload,
      verification_status: "approved",
      latest_review_decision: "approve",
      latest_review_reason: reason,
      reviewed_at: reviewedAt,
      reviewed_by_user_id: input.actorUserId,
      reviewed_by_role: input.actorRole,
      reviewed_by_name: input.actorName,
      approved_payment_id: paymentId,
      approved_amount: approvedAmount,
      approved_reference: approvedReference,
    };

    await supabase
      .from("care_payment_requests")
      .update({
        status: "paid",
        paid_at: reviewedAt,
        payload: nextPayload,
      } as never)
      .eq("id", request.id);

    await recalculateBookingTotals(booking.id);
    const refreshedBooking = await getBookingById(booking.id);
    const trackUrl = await buildTrackingUrl(
      refreshedBooking.tracking_code,
      refreshedBooking.phone
    );

    if (refreshedBooking.email) {
      await sendPaymentReceivedEmail(refreshedBooking.email, refreshedBooking.id, {
        customerName: refreshedBooking.customer_name,
        trackingCode: refreshedBooking.tracking_code,
        amountPaid: `₦${approvedAmount.toLocaleString()}`,
        balanceDue: `₦${sanitizeAmount(refreshedBooking.balance_due).toLocaleString()}`,
        paymentMethod: asText(input.paymentMethod) || "bank transfer",
        reference: approvedReference,
        trackUrl,
      });
    }

    await logPaymentSecurityEvent({
      eventType: "payment_receipt_approved",
      success: true,
      email: refreshedBooking.email,
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      details: {
        booking_id: refreshedBooking.id,
        request_id: request.id,
        tracking_code: refreshedBooking.tracking_code,
        approved_amount: approvedAmount,
        approved_reference: approvedReference,
        payment_id: paymentId,
      },
    });

    return {
      snapshot: buildVerificationSnapshot(
        refreshedBooking,
        {
          ...request,
          status: "paid",
          paid_at: reviewedAt,
          payload: nextPayload,
        },
        await getCareSettings()
      ),
      bookingId: refreshedBooking.id,
      requestId: request.id,
    };
  }

  const nextPayload = {
    ...payload,
    verification_status: reviewStatus,
    latest_review_decision: input.decision,
    latest_review_reason: reason,
    reviewed_at: reviewedAt,
    reviewed_by_user_id: input.actorUserId,
    reviewed_by_role: input.actorRole,
    reviewed_by_name: input.actorName,
  };

  await supabase
    .from("care_payment_requests")
    .update({
      payload: nextPayload,
    } as never)
    .eq("id", request.id);

  const trackUrl = await buildTrackingUrl(booking.tracking_code, booking.phone);
  if (
    booking.email &&
    (input.decision === "reject" || input.decision === "request_more")
  ) {
    await sendCareEmail({
      to: booking.email,
      bookingId: booking.id,
      paymentRequestId: request.id,
      dedupeKey: `payment-proof-update:${request.id}:${input.decision}:${reviewedAt}`,
      template: {
        type: "payment_proof_update",
        props: {
          customerName: booking.customer_name,
          trackingCode: booking.tracking_code,
          serviceType: booking.service_type,
          statusLabel:
            input.decision === "reject"
              ? "Payment proof could not be verified"
              : "A clearer receipt is needed",
          message:
            reason ||
            "Please resend a clearer proof of payment so the booking can continue without delay.",
          trackUrl,
        },
      },
    });
  }

  await logPaymentSecurityEvent({
    eventType: "payment_receipt_review_updated",
    success: true,
    email: booking.email,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    details: {
      booking_id: booking.id,
      request_id: request.id,
      tracking_code: booking.tracking_code,
      decision: input.decision,
      verification_status: reviewStatus,
      reason,
    },
  });

  return {
    snapshot: buildVerificationSnapshot(
      booking,
      {
        ...request,
        payload: nextPayload,
      },
      await getCareSettings()
    ),
    bookingId: booking.id,
    requestId: request.id,
  };
}

export async function getPaymentReviewQueue(limit = 120) {
  const supabase = createAdminSupabase();
  const settings = await getCareSettings();
  const { data } = await supabase
    .from("care_payment_requests")
    .select(
      "id, request_no, booking_id, request_kind, currency, amount_due, bank_name, account_name, account_number, instructions, recipient_email, status, requested_at, sent_at, paid_at, payload, booking:care_bookings(id, tracking_code, customer_name, email, phone, phone_normalized, service_type, item_summary, status, quoted_total, amount_paid, balance_due, payment_status)"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as Array<Record<string, unknown>>)
    .map((row) => {
      const booking = asRecord(row.booking) as BookingRow | null;
      if (!booking?.id) return null;
      const request = {
        id: String(row.id || ""),
        request_no: asText(row.request_no),
        booking_id: String(row.booking_id || booking.id),
        request_kind: asText(row.request_kind),
        currency: asText(row.currency),
        amount_due: asNumber(row.amount_due),
        bank_name: asText(row.bank_name),
        account_name: asText(row.account_name),
        account_number: asText(row.account_number),
        instructions: asText(row.instructions),
        recipient_email: asText(row.recipient_email),
        status: asText(row.status),
        requested_at: asText(row.requested_at),
        sent_at: asText(row.sent_at),
        paid_at: asText(row.paid_at),
        payload: asRecord(row.payload),
      } satisfies PaymentRequestRow;

      const snapshot = buildVerificationSnapshot(booking, request, settings);
      return {
        ...snapshot,
        bookingId: booking.id,
        serviceType: booking.service_type,
        bookingStatus: booking.status,
        requestedAt: request.requested_at,
        sentAt: request.sent_at,
        paidAt: request.paid_at,
      } satisfies PaymentReviewQueueItem;
    })
    .filter(Boolean)
    .sort((a, b) => {
      const left = new Date(a!.lastSubmittedAt || a!.requestedAt || 0).getTime();
      const right = new Date(b!.lastSubmittedAt || b!.requestedAt || 0).getTime();
      return right - left;
    }) as PaymentReviewQueueItem[];
}

export function extractTrackingCodeFromText(value?: string | null) {
  const match = String(value || "").match(/\bTRK-[A-Z0-9]{6,}\b/i);
  return match ? match[0].toUpperCase() : null;
}
