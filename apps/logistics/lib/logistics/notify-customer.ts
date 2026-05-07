import "server-only";

import { getDivisionUrl } from "@henryco/config";
import { sendTransactionalEmail } from "@henryco/email";
import { getOptionalEnv } from "@/lib/env";
import { createAdminSupabase } from "@/lib/supabase";
import { sendLogisticsWhatsAppText } from "@/lib/logistics/whatsapp";
import { appendCustomerNotification } from "@/lib/logistics/shared-account";

function cleanText(value?: string | null) {
  return String(value || "").trim();
}

function createId() {
  return crypto.randomUUID();
}

type NotifyRequestCreatedInput = {
  shipmentId: string;
  trackingCode: string;
  mode: "quote" | "book";
  senderName: string;
  senderEmail?: string | null;
  senderPhone?: string | null;
  amountQuoted: number;
  currency: string;
  zoneLabel: string;
  promiseWindowHours: [number, number];
  trackingUrl: string;
  customerUserId?: string | null;
};

async function logNotificationRow(input: {
  shipmentId: string;
  channel: "email" | "whatsapp";
  templateKey: string;
  recipient: string;
  subject: string;
  status: "sent" | "skipped" | "failed";
  reason?: string | null;
}) {
  try {
    const admin = createAdminSupabase();
    await admin.from("logistics_notifications").insert({
      id: createId(),
      shipment_id: input.shipmentId,
      channel: input.channel,
      template_key: input.templateKey,
      recipient: input.recipient,
      subject: input.subject,
      status: input.status,
      reason: input.reason ?? null,
      meta: {},
      created_at: new Date().toISOString(),
    } as never);
  } catch {
    // non-fatal
  }
}

export async function notifyLogisticsRequestCreated(input: NotifyRequestCreatedInput) {
  const subject =
    input.mode === "quote"
      ? `HenryCo Logistics quote — ${input.trackingCode}`
      : `HenryCo Logistics booking — ${input.trackingCode}`;

  const bodyText = [
    `Hi ${input.senderName},`,
    "",
    input.mode === "quote"
      ? "We received your logistics quote request."
      : "We received your delivery booking.",
    "",
    `Tracking code: ${input.trackingCode}`,
    `Lane: ${input.zoneLabel}`,
    `Indicative total: ${input.currency} ${input.amountQuoted.toLocaleString("en-NG")}`,
    input.mode === "book" ? `Payment reference: ${input.trackingCode}` : null,
    input.mode === "book"
      ? "A HenryCo account invoice has been opened for this booking; use the tracking code as the transfer reference if paying by bank transfer."
      : null,
    `Typical window: ${input.promiseWindowHours[0]}–${input.promiseWindowHours[1]} hours (estimate, not a guarantee).`,
    "",
    `Track your shipment: ${input.trackingUrl}`,
    "",
    "— HenryCo Logistics",
  ].filter(Boolean).join("\n");

  const email = cleanText(input.senderEmail);
  const templateKey = input.mode === "quote" ? "quote_created" : "booking_created";

  if (email) {
    const dispatch = await sendTransactionalEmail({
      to: email,
      purpose: "logistics",
      subject,
      text: bodyText,
    });

    if (dispatch.status === "sent") {
      await logNotificationRow({
        shipmentId: input.shipmentId,
        channel: "email",
        templateKey,
        recipient: email,
        subject,
        status: "sent",
      });
    } else if (dispatch.status === "skipped") {
      await logNotificationRow({
        shipmentId: input.shipmentId,
        channel: "email",
        templateKey,
        recipient: email,
        subject,
        status: "skipped",
        reason: dispatch.skippedReason || "Email provider not configured.",
      });
    } else {
      await logNotificationRow({
        shipmentId: input.shipmentId,
        channel: "email",
        templateKey,
        recipient: email,
        subject,
        status: "failed",
        reason: dispatch.safeError || "email_send_error",
      });
    }
  }

  const wa = await sendLogisticsWhatsAppText({
    phone: input.senderPhone,
    body: `${subject}\n\n${bodyText}`,
  });
  await logNotificationRow({
    shipmentId: input.shipmentId,
    channel: "whatsapp",
    templateKey: input.mode === "quote" ? "quote_created" : "booking_created",
    recipient: cleanText(input.senderPhone) || "unknown",
    subject,
    status: wa.status === "sent" ? "sent" : wa.status === "skipped" ? "skipped" : "failed",
    reason: wa.reason,
  });

  await appendCustomerNotification({
    userId: input.customerUserId,
    email: input.senderEmail,
    title: subject,
    body: bodyText.slice(0, 480),
    category: "logistics",
    priority: "normal",
    actionUrl: input.trackingUrl,
    actionLabel: "Track shipment",
    referenceType: "logistics_shipment",
    referenceId: input.shipmentId,
  });
}

export function getPublicTrackingUrl(trackingCode: string, phone?: string | null) {
  const base = getOptionalEnv("NEXT_PUBLIC_LOGISTICS_URL") || getDivisionUrl("logistics");
  const origin = base.replace(/\/$/, "");
  const p = cleanText(phone);
  const q = p ? `&phone=${encodeURIComponent(p)}` : "";
  return `${origin}/track?code=${encodeURIComponent(trackingCode)}${q}`;
}
