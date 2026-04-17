import "server-only";

import { getDivisionConfig } from "@henryco/config";
import { sendTransactionalEmail } from "@henryco/config/email";
import { createAdminSupabase } from "@/lib/supabase";
import { getCareSettings } from "@/lib/care-data";
import { buildCarePublicUrl } from "@/lib/care-links";
import {
  renderCareEmailTemplate,
  type AdminNotificationEmailProps,
  type BookingConfirmationEmailProps,
  type BookingStatusUpdateEmailProps,
  type CustomerReengagementEmailProps,
  type CareEmailTemplate,
  type OwnerMonthlySummaryEmailProps,
  type PasswordRecoveryEmailProps,
  type PaymentProofUpdateEmailProps,
  type PaymentReceiptReceivedEmailProps,
  type PaymentReceivedEmailProps,
  type PaymentReminderEmailProps,
  type PaymentRequestEmailProps,
  type ReviewRequestEmailProps,
  type ServiceReminderEmailProps,
  type StaffInvitationEmailProps,
  type TrackingCodeEmailProps,
} from "@/lib/email/templates";
import { getResendSupportInbox } from "@/lib/resend-server";

type EmailDispatchStatus = "sent" | "queued" | "skipped" | "failed";

export type EmailDispatchResult = {
  ok: boolean;
  status: EmailDispatchStatus;
  reason: string | null;
  messageId: string | null;
  notificationId: string | null;
  subject: string;
  templateKey: string;
};

type SendCareEmailInput = {
  to: string | string[] | null | undefined;
  template: CareEmailTemplate;
  bookingId?: string | null;
  paymentRequestId?: string | null;
  dedupeKey?: string | null;
  replyTo?: string | null;
};

const care = getDivisionConfig("care");

function sanitizeHeaderValue(value?: string | null) {
  return String(value || "")
    .replace(/\\r\\n|\\n|\\r/g, " ")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractEmailAddress(value?: string | null) {
  const clean = sanitizeHeaderValue(value);
  if (!clean) return null;

  const angleMatch = clean.match(/<([^<>]+)>/);
  const candidate = angleMatch ? angleMatch[1] : clean;
  const emailMatch = candidate.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return emailMatch ? emailMatch[0].trim().toLowerCase() : null;
}

function cleanEmail(value?: string | null) {
  const email = extractEmailAddress(value);
  return email || null;
}

function cleanEmails(input: SendCareEmailInput["to"]) {
  const items = Array.isArray(input) ? input : [input];
  return [...new Set(items.map((value) => cleanEmail(value)).filter(Boolean))] as string[];
}

function textPreview(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 240);
}

async function findExistingNotification(
  templateKey: string,
  bookingId: string | null | undefined,
  recipient: string,
  dedupeKey?: string | null
) {
  const supabase = createAdminSupabase();
  let query = supabase
    .from("care_notification_queue")
    .select("id, status")
    .eq("channel", "email")
    .eq("template_key", templateKey)
    .eq("recipient", recipient)
    .order("created_at", { ascending: false })
    .limit(1);

  if (bookingId) {
    query = query.eq("booking_id", bookingId);
  }

  if (dedupeKey) {
    query = query.contains("payload", { dedupe_key: dedupeKey });
  }

  const { data } = await query.maybeSingle();
  return data ?? null;
}

async function insertNotificationRecord(input: {
  bookingId?: string | null;
  paymentRequestId?: string | null;
  recipient: string;
  subject: string;
  templateKey: string;
  payload: Record<string, unknown>;
  status: string;
}) {
  const supabase = createAdminSupabase();
  const { data } = await supabase
    .from("care_notification_queue")
    .insert({
      booking_id: input.bookingId ?? null,
      payment_request_id: input.paymentRequestId ?? null,
      channel: "email",
      template_key: input.templateKey,
      recipient: input.recipient,
      subject: input.subject,
      payload: input.payload,
      status: input.status,
    } as never)
    .select("id")
    .maybeSingle();

  return (data?.id as string | undefined) ?? null;
}

async function updateNotificationRecord(
  id: string | null,
  status: string,
  payload: Record<string, unknown>
) {
  if (!id) return;

  const supabase = createAdminSupabase();
  await supabase
    .from("care_notification_queue")
    .update({
      status,
      payload,
    } as never)
    .eq("id", id);
}

async function logEmailDispatch(input: {
  event_type: string;
  recipient: string;
  templateKey: string;
  subject: string;
  success: boolean;
  bookingId?: string | null;
  paymentRequestId?: string | null;
  notificationId?: string | null;
  reason?: string | null;
}) {
  try {
    const supabase = createAdminSupabase();

    await supabase.from("care_security_logs").insert({
      event_type: input.event_type,
      route: "/system/email",
      email: input.recipient,
      success: input.success,
      details: {
        template_key: input.templateKey,
        subject: input.subject,
        booking_id: input.bookingId ?? null,
        payment_request_id: input.paymentRequestId ?? null,
        notification_id: input.notificationId ?? null,
        reason: input.reason ?? null,
      },
    } as never);
  } catch {
    // ignore email log failure
  }
}

export async function sendCareEmail(input: SendCareEmailInput): Promise<EmailDispatchResult> {
  const recipients = cleanEmails(input.to);
  const settings = await getCareSettings();
  const rendered = renderCareEmailTemplate(input.template, settings);

  if (recipients.length === 0) {
    return {
      ok: false,
      status: "skipped",
      reason: "Recipient email is missing.",
      messageId: null,
      notificationId: null,
      subject: rendered.subject,
      templateKey: rendered.templateKey,
    };
  }

  try {
    const recipient = recipients[0];
    const existing = await findExistingNotification(
      rendered.templateKey,
      input.bookingId,
      recipient,
      input.dedupeKey
    );

    if (existing?.id && existing.status === "sent") {
      return {
        ok: true,
        status: "sent",
        reason: "A matching notification record already exists.",
        messageId: null,
        notificationId: existing.id as string,
        subject: rendered.subject,
        templateKey: rendered.templateKey,
      };
    }

    const basePayload = {
      html_preview: rendered.html.slice(0, 4000),
      text_preview: textPreview(rendered.text),
      dedupe_key: input.dedupeKey ?? null,
    };

    const notificationId =
      existing?.id ??
      (await insertNotificationRecord({
        bookingId: input.bookingId,
        paymentRequestId: input.paymentRequestId,
        recipient,
        subject: rendered.subject,
        templateKey: rendered.templateKey,
        payload: basePayload,
        status: "queued",
      }));

    if (existing?.id && existing.status !== "sent") {
      await updateNotificationRecord(notificationId, "queued", {
        ...basePayload,
        previous_status: existing.status,
        retried_at: new Date().toISOString(),
      });
    }

    const replyTo = cleanEmail(
      input.replyTo ??
        getResendSupportInbox() ??
        settings.notification_reply_to_email ??
        settings.payment_support_email ??
        settings.support_email
    );

    const result = await sendTransactionalEmail({
      to: recipients,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      fromName: sanitizeHeaderValue(settings.notification_sender_name || care.name) || care.name,
      fromEmail:
        cleanEmail(process.env.BREVO_SENDER_EMAIL) ||
        cleanEmail(settings.notification_reply_to_email) ||
        cleanEmail(settings.support_email) ||
        "noreply@henrycogroup.com",
      replyTo,
      missingConfigStatus: "queued",
      tags: ["care", rendered.templateKey],
    });

    if (result.status === "queued") {
      await updateNotificationRecord(notificationId, "queued", {
        ...basePayload,
        provider: result.provider ?? null,
        transport_reason: result.reason,
      });
      await logEmailDispatch({
        event_type: "email_dispatch_queued_no_transport",
        recipient,
        templateKey: rendered.templateKey,
        subject: rendered.subject,
        success: false,
        bookingId: input.bookingId,
        paymentRequestId: input.paymentRequestId,
        notificationId,
        reason: result.reason,
      });

      return {
        ok: false,
        status: "queued",
        reason: result.reason,
        messageId: null,
        notificationId,
        subject: rendered.subject,
        templateKey: rendered.templateKey,
      };
    }

    if (!result.ok) {
      await updateNotificationRecord(notificationId, "failed", {
        ...basePayload,
        provider: result.provider ?? null,
        transport_reason: result.reason,
      });
      await logEmailDispatch({
        event_type: "email_dispatch_failed",
        recipient,
        templateKey: rendered.templateKey,
        subject: rendered.subject,
        success: false,
        bookingId: input.bookingId,
        paymentRequestId: input.paymentRequestId,
        notificationId,
        reason: result.reason,
      });

      return {
        ok: false,
        status: "failed",
        reason: result.reason,
        messageId: null,
        notificationId,
        subject: rendered.subject,
        templateKey: rendered.templateKey,
      };
    }

    await updateNotificationRecord(notificationId, "sent", {
      ...basePayload,
      provider: "brevo",
      brevo_id: result.messageId ?? null,
    });
    await logEmailDispatch({
      event_type: "email_dispatch_sent",
      recipient,
      templateKey: rendered.templateKey,
      subject: rendered.subject,
      success: true,
      bookingId: input.bookingId,
      paymentRequestId: input.paymentRequestId,
      notificationId,
      reason: result.messageId ?? null,
    });

    return {
      ok: true,
      status: "sent",
      reason: null,
      messageId: result.messageId ?? null,
      notificationId,
      subject: rendered.subject,
      templateKey: rendered.templateKey,
    };
  } catch (error) {
    const recipient = recipients[0] ?? "";
    if (recipient) {
      await logEmailDispatch({
        event_type: "email_dispatch_failed",
        recipient,
        templateKey: rendered.templateKey,
        subject: rendered.subject,
        success: false,
        bookingId: input.bookingId,
        paymentRequestId: input.paymentRequestId,
        reason: error instanceof Error ? error.message : "Email dispatch failed.",
      });
    }

    return {
      ok: false,
      status: "failed",
      reason: error instanceof Error ? error.message : "Email dispatch failed.",
      messageId: null,
      notificationId: null,
      subject: rendered.subject,
      templateKey: rendered.templateKey,
    };
  }
}

export async function sendBookingConfirmationEmail(
  email: string | null | undefined,
  bookingId: string,
  props: BookingConfirmationEmailProps
) {
  return sendCareEmail({
    to: email,
    bookingId,
    dedupeKey: `booking-confirmation:${props.trackingCode}`,
    template: { type: "booking_confirmation", props },
  });
}

export async function sendTrackingCodeConfirmationEmail(
  email: string | null | undefined,
  bookingId: string,
  props: TrackingCodeEmailProps
) {
  return sendCareEmail({
    to: email,
    bookingId,
    dedupeKey: `tracking-code:${props.trackingCode}`,
    template: { type: "tracking_code_confirmation", props },
  });
}

export async function sendBookingStatusUpdateEmail(
  email: string | null | undefined,
  bookingId: string,
  props: BookingStatusUpdateEmailProps
) {
  return sendCareEmail({
    to: email,
    bookingId,
    dedupeKey: `booking-status:${props.trackingCode}:${props.statusLabel}`,
    template: { type: "booking_status_update", props },
  });
}

export async function sendStaffInvitationEmail(
  email: string | null | undefined,
  props: StaffInvitationEmailProps,
  options?: {
    dedupeKey?: string | null;
  }
) {
  return sendCareEmail({
    to: email,
    dedupeKey: options?.dedupeKey ?? `staff-invite:${cleanEmail(email) ?? "missing"}`,
    template: { type: "staff_invitation", props },
  });
}

export async function sendPasswordRecoveryEmail(
  email: string | null | undefined,
  props: PasswordRecoveryEmailProps,
  options?: {
    dedupeKey?: string | null;
  }
) {
  return sendCareEmail({
    to: email,
    dedupeKey:
      options?.dedupeKey ?? `password-recovery:${cleanEmail(email) ?? "missing"}`,
    template: { type: "password_recovery", props },
  });
}

export async function sendPaymentRequestEmail(
  email: string | null | undefined,
  bookingId: string,
  paymentRequestId: string | null | undefined,
  props: PaymentRequestEmailProps
) {
  return sendCareEmail({
    to: email,
    bookingId,
    paymentRequestId,
    dedupeKey: `payment-request:${props.trackingCode}:${props.amountDue}`,
    template: { type: "payment_request", props },
  });
}

export async function sendPaymentReceivedEmail(
  email: string | null | undefined,
  bookingId: string,
  props: PaymentReceivedEmailProps
) {
  return sendCareEmail({
    to: email,
    bookingId,
    dedupeKey: `payment-received:${props.trackingCode}:${props.amountPaid}`,
    template: { type: "payment_received", props },
  });
}

export async function sendPaymentReceiptReceivedEmail(
  email: string | null | undefined,
  bookingId: string,
  paymentRequestId: string,
  props: PaymentReceiptReceivedEmailProps
) {
  return sendCareEmail({
    to: email,
    bookingId,
    paymentRequestId,
    dedupeKey: `payment-receipt-received:${props.trackingCode}:${paymentRequestId}`,
    template: { type: "payment_receipt_received", props },
  });
}

export async function sendPaymentProofUpdateEmail(
  email: string | null | undefined,
  bookingId: string,
  paymentRequestId: string,
  props: PaymentProofUpdateEmailProps
) {
  return sendCareEmail({
    to: email,
    bookingId,
    paymentRequestId,
    dedupeKey: `payment-proof-update:${props.trackingCode}:${paymentRequestId}:${props.statusLabel}`,
    template: { type: "payment_proof_update", props },
  });
}

export async function sendReviewRequestEmail(
  email: string | null | undefined,
  bookingId: string,
  props: ReviewRequestEmailProps
) {
  return sendCareEmail({
    to: email,
    bookingId,
    dedupeKey: `review-request:${props.trackingCode}`,
    template: { type: "review_request", props },
  });
}

export async function sendAdminNotificationEmail(
  email: string | null | undefined,
  props: AdminNotificationEmailProps,
  options?: {
    dedupeKey?: string | null;
  }
) {
  return sendCareEmail({
    to: email,
    dedupeKey:
      options?.dedupeKey ?? `admin-notification:${props.heading}:${props.summary}`,
    template: { type: "admin_notification", props },
  });
}

export async function sendOwnerMonthlySummaryEmail(
  email: string | null | undefined,
  props: OwnerMonthlySummaryEmailProps
) {
  return sendCareEmail({
    to: email,
    dedupeKey: `owner-monthly-summary:${cleanEmail(email) ?? "missing"}:${props.monthLabel}`,
    template: { type: "owner_monthly_summary", props },
  });
}

export async function sendPaymentReminderEmail(
  email: string | null | undefined,
  bookingId: string,
  props: PaymentReminderEmailProps,
  dedupeKey: string
) {
  return sendCareEmail({
    to: email,
    bookingId,
    dedupeKey,
    template: { type: "payment_reminder", props },
  });
}

export async function sendServiceReminderEmail(
  email: string | null | undefined,
  bookingId: string,
  props: ServiceReminderEmailProps,
  dedupeKey: string
) {
  return sendCareEmail({
    to: email,
    bookingId,
    dedupeKey,
    template: { type: "service_reminder", props },
  });
}

export async function sendCustomerReengagementEmail(
  email: string | null | undefined,
  bookingId: string,
  props: CustomerReengagementEmailProps,
  dedupeKey: string
) {
  return sendCareEmail({
    to: email,
    bookingId,
    dedupeKey,
    template: { type: "customer_reengagement", props },
  });
}

export async function buildTrackingUrl(trackingCode: string, phone?: string | null) {
  return buildCarePublicUrl("/track", {
    code: trackingCode,
    phone: phone ?? null,
  });
}

export async function buildReviewUrl(trackingCode: string, phone?: string | null) {
  return buildCarePublicUrl("/review", {
    code: trackingCode,
    phone: phone ?? null,
  });
}
