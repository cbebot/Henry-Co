import "server-only";

import { getDivisionConfig } from "@henryco/config";
import "@/lib/server-env";
import { normalizeEmail, normalizePhone } from "@/lib/env";
import {
  getPropertyUrl,
  getPropertyWorkspaceUrl,
  getSharedAccountPropertyPath,
  getSharedAccountPropertyUrl,
} from "@/lib/property/links";
import { appendPropertyNotification } from "@/lib/property/store";
import { appendCustomerNotification } from "@/lib/property/shared-account";
import {
  renderPropertyEmailTemplate,
  type PropertyTemplateInput,
  type PropertyTemplateKey,
} from "@/lib/property/email/templates";

type DeliveryResult = {
  ok: boolean;
  status: "sent" | "queued" | "skipped" | "failed";
  reason: string | null;
  messageId: string | null;
};

type PropertyEventInput = {
  event: PropertyTemplateKey;
  userId?: string | null;
  normalizedEmail?: string | null;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  payload: Record<string, unknown>;
};

type EventCopy = {
  title: string;
  body: string;
  email?: PropertyTemplateInput | null;
  whatsapp?: string | null;
};

function cleanText(value?: string | null) {
  return String(value || "").trim();
}

function resolvePropertyHref(value: unknown, fallback: string) {
  const href = cleanText(typeof value === "string" ? value : "");
  if (!href) return fallback;
  if (/^https?:\/\//i.test(href)) return href;
  if (href.startsWith("/")) return getPropertyUrl(href);
  return fallback;
}

function hasTwilioConfig() {
  return Boolean(
    cleanText(process.env.TWILIO_ACCOUNT_SID) &&
      cleanText(process.env.TWILIO_AUTH_TOKEN) &&
      cleanText(process.env.TWILIO_WHATSAPP_FROM)
  );
}

function hasMetaConfig() {
  return Boolean(
    cleanText(process.env.WHATSAPP_PHONE_NUMBER_ID) &&
      cleanText(process.env.WHATSAPP_ACCESS_TOKEN) &&
      cleanText(process.env.WHATSAPP_BUSINESS_ACCOUNT_ID)
  );
}

function buildEventCopy(event: PropertyTemplateKey, payload: Record<string, unknown>): EventCopy {
  const listingTitle = String(payload.listingTitle || "your property");
  const viewingTime = String(payload.viewingTime || payload.scheduledFor || "");
  const note = String(payload.note || payload.reviewNote || "");
  const locationLabel = String(payload.locationLabel || "");

  switch (event) {
    case "inquiry_received":
      return {
        title: "Inquiry received",
        body: `${listingTitle} now has a new inquiry awaiting follow-up.`,
        email: {
          templateKey: event,
          eyebrow: "Inquiry received",
          headline: "Your property inquiry is now in motion.",
          summary: "HenryCo Property has logged the inquiry and routed it into the appropriate response queue.",
          bullets: [listingTitle, locationLabel || null, "A relationship manager will follow up next."].filter(Boolean) as string[],
          ctaLabel: "Review the listing",
          ctaHref: resolvePropertyHref(payload.ctaHref, getPropertyUrl("/search")),
        },
        whatsapp: `HenryCo Property: your inquiry for ${listingTitle} has been received.`,
      };
    case "viewing_requested":
      return {
        title: "Viewing request submitted",
        body: `${listingTitle} now has a viewing request waiting for confirmation.`,
        email: {
          templateKey: event,
          eyebrow: "Viewing request",
          headline: "Your viewing request is logged.",
          summary: "HenryCo Property captured the request and placed it in the scheduling queue.",
          bullets: [listingTitle, viewingTime || "Timing will be confirmed shortly"].filter(Boolean) as string[],
          ctaLabel: "Open your HenryCo account",
          ctaHref: getSharedAccountPropertyUrl("viewings"),
        },
        whatsapp: `HenryCo Property: your viewing request for ${listingTitle} is logged.`,
      };
    case "viewing_scheduled":
      return {
        title: "Viewing scheduled",
        body: `${listingTitle} is now scheduled for ${viewingTime}.`,
        email: {
          templateKey: event,
          eyebrow: "Viewing scheduled",
          headline: "Your property viewing is confirmed.",
          summary: "The appointment is scheduled and HenryCo Property will continue follow-up before the meeting.",
          bullets: [listingTitle, viewingTime].filter(Boolean) as string[],
          ctaLabel: "See viewing details",
          ctaHref: getSharedAccountPropertyUrl("viewings"),
        },
        whatsapp: `HenryCo Property: your viewing for ${listingTitle} is confirmed${viewingTime ? ` on ${viewingTime}` : ""}.`,
      };
    case "viewing_reminder":
      return {
        title: "Viewing reminder",
        body: `${listingTitle} is coming up shortly.`,
        email: {
          templateKey: event,
          eyebrow: "Viewing reminder",
          headline: "Your viewing is coming up.",
          summary: "This is a reminder from HenryCo Property to reduce missed appointments and keep coordination clear.",
          bullets: [listingTitle, viewingTime].filter(Boolean) as string[],
          ctaLabel: "Review appointment",
          ctaHref: getSharedAccountPropertyUrl("viewings"),
        },
        whatsapp: `HenryCo Property reminder: ${listingTitle}${viewingTime ? ` at ${viewingTime}` : ""}.`,
      };
    case "listing_submitted":
      return {
        title: "Listing submitted",
        body: `${listingTitle} is now waiting for moderation.`,
        email: {
          templateKey: event,
          eyebrow: "Listing submission",
          headline: "Your listing is under review.",
          summary: "HenryCo Property received the listing and queued it for editorial, trust, and operations review.",
          bullets: [listingTitle, "You will be notified after review or if changes are requested."],
          ctaLabel: "Open listing workspace",
          ctaHref: getPropertyWorkspaceUrl("/owner"),
        },
        whatsapp: `HenryCo Property: ${listingTitle} has been submitted for review.`,
      };
    case "listing_approved":
      return {
        title: "Listing approved",
        body: `${listingTitle} is now live on HenryCo Property.`,
        email: {
          templateKey: event,
          eyebrow: "Listing approved",
          headline: "Your property is now live.",
          summary: "The listing passed moderation and is now available for discovery, inquiry, and viewing requests.",
          bullets: [listingTitle, locationLabel || null].filter(Boolean) as string[],
          ctaLabel: "View live listing",
          ctaHref: resolvePropertyHref(payload.ctaHref, getPropertyUrl("/search")),
        },
        whatsapp: `HenryCo Property: ${listingTitle} is now live.`,
      };
    case "listing_rejected":
      return {
        title: "Listing update",
        body: note || `${listingTitle} needs changes before publication.`,
        email: {
          templateKey: event,
          eyebrow: "Listing review update",
          headline: "Your listing needs attention.",
          summary: note || "The property could not be approved in its current state.",
          bullets: [listingTitle],
          ctaLabel: "Review listing notes",
          ctaHref: getPropertyWorkspaceUrl("/owner"),
        },
        whatsapp: `HenryCo Property updated ${listingTitle}. ${note || "Please review the moderation notes."}`,
      };
    case "managed_update":
      return {
        title: "Managed-property update",
        body: note || "There is a new managed-property operations update.",
        email: {
          templateKey: event,
          eyebrow: "Managed-property operations",
          headline: "There is a new managed-property update.",
          summary: note || "HenryCo Property recorded an important managed-property note.",
          bullets: [listingTitle || "Managed portfolio update"].filter(Boolean) as string[],
          ctaLabel: "Open managed-property workspace",
          ctaHref: getPropertyUrl("/managed"),
        },
        whatsapp: `HenryCo Property managed update: ${note || listingTitle}.`,
      };
    case "support_alert":
    case "owner_alert":
    case "new_lead_alert":
    default:
      return {
        title: "Property alert",
        body: note || "A property workflow crossed an important attention threshold.",
        email: {
          templateKey: event,
          eyebrow: "Operations alert",
          headline: "HenryCo Property needs attention.",
          summary: note || "A tracked property workflow now needs an operator response.",
          bullets: [listingTitle || "Property workflow alert"].filter(Boolean) as string[],
          ctaLabel: "Open operations workspace",
          ctaHref: getPropertyWorkspaceUrl("/operations"),
        },
        whatsapp: `HenryCo Property alert: ${note || listingTitle || "Operator attention required."}`,
      };
  }
}

async function sendEmail(
  notification: Omit<PropertyEventInput, "payload" | "event"> & {
    email: PropertyTemplateInput;
  }
): Promise<DeliveryResult> {
  const recipient = normalizeEmail(notification.recipientEmail);
  if (!recipient) {
    return { ok: false, status: "skipped", reason: "Recipient email is missing.", messageId: null };
  }

  const resendKey = cleanText(process.env.RESEND_API_KEY);
  const property = getDivisionConfig("property");
  const rendered = renderPropertyEmailTemplate(notification.email);

  if (!resendKey) {
    return { ok: false, status: "queued", reason: "RESEND_API_KEY is not configured.", messageId: null };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${property.name} <${process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"}>`,
        to: [recipient],
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      }),
    });

    const payload = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;
    if (!response.ok) {
      return {
        ok: false,
        status: "failed",
        reason: payload?.message || `Resend rejected the email with status ${response.status}.`,
        messageId: null,
      };
    }

    return { ok: true, status: "sent", reason: null, messageId: payload?.id ?? null };
  } catch (error) {
    return {
      ok: false,
      status: "failed",
      reason: error instanceof Error ? error.message : "Email delivery failed.",
      messageId: null,
    };
  }
}

async function sendViaTwilio(phone: string, body: string): Promise<DeliveryResult> {
  const accountSid = cleanText(process.env.TWILIO_ACCOUNT_SID);
  const authToken = cleanText(process.env.TWILIO_AUTH_TOKEN);
  const from = cleanText(process.env.TWILIO_WHATSAPP_FROM);

  const payload = new URLSearchParams();
  payload.set("From", from.startsWith("whatsapp:") ? from : `whatsapp:${from}`);
  payload.set("To", phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`);
  payload.set("Body", body);

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload.toString(),
    }
  );

  const json = (await response.json().catch(() => null)) as { sid?: string; message?: string } | null;
  if (!response.ok || !json?.sid) {
    return {
      ok: false,
      status: "failed",
      reason: json?.message || `Twilio rejected the message with status ${response.status}.`,
      messageId: null,
    };
  }

  return { ok: true, status: "sent", reason: null, messageId: json.sid };
}

async function sendViaMeta(phone: string, body: string): Promise<DeliveryResult> {
  const phoneNumberId = cleanText(process.env.WHATSAPP_PHONE_NUMBER_ID);
  const accessToken = cleanText(process.env.WHATSAPP_ACCESS_TOKEN);

  const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone.replace(/^\+/, ""),
      type: "text",
      text: {
        preview_url: false,
        body,
      },
    }),
  });

  const json = (await response.json().catch(() => null)) as
    | { error?: { message?: string }; messages?: Array<{ id?: string }> }
    | null;

  const messageId = json?.messages?.[0]?.id ?? null;
  if (!response.ok || !messageId) {
    return {
      ok: false,
      status: "failed",
      reason: json?.error?.message || `Meta WhatsApp API rejected the message with status ${response.status}.`,
      messageId: null,
    };
  }

  return { ok: true, status: "sent", reason: null, messageId };
}

async function sendWhatsApp(
  notification: Omit<PropertyEventInput, "payload" | "event"> & { body: string }
): Promise<DeliveryResult> {
  const recipient = normalizePhone(notification.recipientPhone);
  if (!recipient) {
    return { ok: false, status: "skipped", reason: "Recipient phone is missing.", messageId: null };
  }

  if (hasTwilioConfig()) {
    return sendViaTwilio(recipient, notification.body);
  }

  if (hasMetaConfig()) {
    return sendViaMeta(recipient, notification.body);
  }

  return {
    ok: false,
    status: "skipped",
    reason: "WhatsApp delivery is not configured.",
    messageId: null,
  };
}

export async function sendPropertyEvent(input: PropertyEventInput) {
  const copy = buildEventCopy(input.event, input.payload);

  if (input.userId || input.normalizedEmail) {
    await appendCustomerNotification({
      userId: input.userId,
      email: input.normalizedEmail,
      title: copy.title,
      body: copy.body,
      category: input.event === "support_alert" ? "support" : "general",
      referenceType: input.entityType,
      referenceId: input.entityId,
      actionUrl:
        input.event === "viewing_requested" ||
        input.event === "viewing_scheduled" ||
        input.event === "viewing_reminder"
          ? getSharedAccountPropertyPath("viewings")
          : input.event.startsWith("listing")
            ? getSharedAccountPropertyPath("listings")
            : getSharedAccountPropertyPath("inquiries"),
    });
  }

  const emailResult = copy.email
    ? await sendEmail({ ...input, email: copy.email })
    : ({
        ok: false,
        status: "skipped",
        reason: "No email payload.",
        messageId: null,
      } satisfies DeliveryResult);

  const whatsappResult = copy.whatsapp
    ? await sendWhatsApp({ ...input, body: copy.whatsapp })
    : ({
        ok: false,
        status: "skipped",
        reason: "No WhatsApp payload.",
        messageId: null,
      } satisfies DeliveryResult);

  if (input.recipientEmail) {
    await appendPropertyNotification({
      entityType: input.entityType || "property_event",
      entityId: input.entityId || null,
      channel: "email",
      templateKey: input.event,
      recipient: input.recipientEmail,
      subject: copy.email?.headline || copy.title,
      status: emailResult.status,
      reason: emailResult.reason,
    });
  }

  if (input.recipientPhone) {
    await appendPropertyNotification({
      entityType: input.entityType || "property_event",
      entityId: input.entityId || null,
      channel: "whatsapp",
      templateKey: input.event,
      recipient: input.recipientPhone,
      subject: copy.title,
      status: whatsappResult.status,
      reason: whatsappResult.reason,
    });
  }

  return {
    email: emailResult,
    whatsapp: whatsappResult,
    copy,
  };
}
