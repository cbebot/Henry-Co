import "server-only";

import { getDivisionUrl } from "@henryco/config";
import {
  renderHenryCoEmail,
  sendTransactionalEmail,
  type HenryCoEmailLayout,
} from "@henryco/email";
import { getOptionalEnv } from "@/lib/env";
import { createAdminSupabase } from "@/lib/supabase";
import { sendLogisticsWhatsAppText } from "@/lib/logistics/whatsapp";
import { appendCustomerNotification } from "@/lib/logistics/shared-account";
import { autoTranslate } from "@/lib/i18n/auto-translate";

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
  /** Recipient locale — used for email/WhatsApp content + customer action label. */
  locale?: string;
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
  const locale = input.locale || "en";
  const tx = (text: string) => autoTranslate(text, locale);

  const subjectBase =
    input.mode === "quote"
      ? await tx("Henry Onyx Logistics quote")
      : await tx("Henry Onyx Logistics booking");
  const subject = `${subjectBase} — ${input.trackingCode}`;

  const greeting = await tx("Hi");
  const intro =
    input.mode === "quote"
      ? await tx("We received your logistics quote request.")
      : await tx("We received your delivery booking.");
  const trackingCodeLabel = await tx("Tracking code");
  const laneLabel = await tx("Lane");
  const indicativeTotalLabel = await tx("Indicative total");
  const paymentReferenceLabel = input.mode === "book" ? await tx("Payment reference") : null;
  const invoiceNote = input.mode === "book"
    ? await tx("A Henry Onyx account invoice has been opened for this booking; use the tracking code as the transfer reference if paying by bank transfer.")
    : null;
  const typicalWindowPrefix = await tx("Typical window");
  const hoursWord = await tx("hours (estimate, not a guarantee).");
  const trackPrefix = await tx("Track your shipment");
  const signature = await tx("— Henry Onyx Logistics");
  const amountFormatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(input.amountQuoted);

  const bodyText = [
    `${greeting} ${input.senderName},`,
    "",
    intro,
    "",
    `${trackingCodeLabel}: ${input.trackingCode}`,
    `${laneLabel}: ${input.zoneLabel}`,
    `${indicativeTotalLabel}: ${input.currency} ${amountFormatted}`,
    paymentReferenceLabel ? `${paymentReferenceLabel}: ${input.trackingCode}` : null,
    invoiceNote,
    `${typicalWindowPrefix}: ${input.promiseWindowHours[0]}–${input.promiseWindowHours[1]} ${hoursWord}`,
    "",
    `${trackPrefix}: ${input.trackingUrl}`,
    "",
    signature,
  ].filter(Boolean).join("\n");

  const email = cleanText(input.senderEmail);
  const templateKey = input.mode === "quote" ? "quote_created" : "booking_created";

  // EMAIL-TPL-01: logistics was the last division sending PLAIN-TEXT-ONLY
  // customer email. The branded shared layout (renderHenryCoEmail) now carries
  // the same translated strings; `bodyText` stays as the text alternative and
  // the WhatsApp body, so no channel loses content.
  const emailTitle =
    input.mode === "quote"
      ? await tx("Your quote is ready.")
      : await tx("Your booking is confirmed.");
  const layout: HenryCoEmailLayout = {
    purpose: "logistics",
    subject,
    title: emailTitle,
    intro: `${greeting} ${input.senderName} — ${intro}`,
    highlightLabel: trackingCodeLabel,
    highlightValue: input.trackingCode,
    sections: [
      { label: laneLabel, value: input.zoneLabel },
      { label: indicativeTotalLabel, value: `${input.currency} ${amountFormatted}` },
      ...(paymentReferenceLabel
        ? [{ label: paymentReferenceLabel, value: input.trackingCode }]
        : []),
      {
        label: typicalWindowPrefix,
        value: `${input.promiseWindowHours[0]}–${input.promiseWindowHours[1]} ${hoursWord}`,
      },
    ],
    ...(invoiceNote ? { body: invoiceNote } : {}),
    actionLabel: trackPrefix,
    actionHref: input.trackingUrl,
    locale,
  };

  if (email) {
    const dispatch = await sendTransactionalEmail({
      to: email,
      purpose: "logistics",
      subject,
      html: renderHenryCoEmail(layout),
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
    actionLabel: await tx("Track shipment"),
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
