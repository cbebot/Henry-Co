import "server-only";

import {
  recordWhatsAppOutboundTrace,
  type WhatsAppTraceContext,
} from "@/lib/support/whatsapp-observability";

type DeliveryStatus = "sent" | "skipped" | "failed";

export type DeliveryStage =
  | "api_accepted"
  | "sent_to_provider"
  | "delivered"
  | "read"
  | "failed"
  | "skipped"
  | "unknown";

export type SupportWhatsAppDeliveryResult = {
  ok: boolean;
  status: DeliveryStatus;
  /** Clarified delivery stage — API acceptance does NOT mean actual delivery */
  deliveryStage: DeliveryStage;
  provider: "twilio" | "meta" | null;
  reason: string | null;
  messageId: string | null;
  statusCode: number | null;
  graphErrorCode: number | null;
  responseSummary: string | null;
  normalizedPhone?: string | null;
  resolvedWaId?: string | null;
  contactStatus?: string | null;
  messageType?: "text" | "template";
  conversationType?: "freeform" | "template";
  templateName?: string | null;
  templateLanguage?: string | null;
};

type WhatsAppTemplateInput = {
  name: string;
  language?: string | null;
  category?: string | null;
  components?: Array<Record<string, unknown>>;
};

function cleanText(value?: string | null) {
  return String(value || "").trim();
}

function normalizePhone(value?: string | null) {
  const raw = cleanText(value);
  if (!raw) return null;

  if (raw.startsWith("+")) {
    const digits = raw.replace(/[^\d+]/g, "");
    return digits.length > 8 ? digits : null;
  }

  const digits = raw.replace(/\D+/g, "");
  if (!digits) return null;

  if (digits.startsWith("234") && digits.length >= 13) {
    return `+${digits}`;
  }

  if (digits.startsWith("0") && digits.length === 11) {
    return `+234${digits.slice(1)}`;
  }

  if (digits.length >= 10) {
    return `+${digits}`;
  }

  return null;
}

export function normalizeWhatsAppPhone(value?: string | null) {
  return normalizePhone(value);
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

export function getWhatsAppCapability() {
  if (hasTwilioConfig()) {
    return {
      configured: true,
      provider: "twilio" as const,
      reason: null,
    };
  }

  if (hasMetaConfig()) {
    return {
      configured: true,
      provider: "meta" as const,
      reason: null,
    };
  }

  return {
    configured: false,
    provider: null,
    reason:
      "WhatsApp delivery is not configured. Add either TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM, or WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_BUSINESS_ACCOUNT_ID, and WHATSAPP_ACCESS_TOKEN.",
  };
}

async function sendViaTwilio(to: string, body: string): Promise<SupportWhatsAppDeliveryResult> {
  const accountSid = cleanText(process.env.TWILIO_ACCOUNT_SID);
  const authToken = cleanText(process.env.TWILIO_AUTH_TOKEN);
  const from = cleanText(process.env.TWILIO_WHATSAPP_FROM);

  if (!accountSid || !authToken || !from) {
    return {
      ok: false,
      status: "skipped",
      deliveryStage: "skipped",
      provider: "twilio",
      reason:
        "Twilio WhatsApp is missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_WHATSAPP_FROM.",
      messageId: null,
      statusCode: null,
      graphErrorCode: null,
      responseSummary: null,
      normalizedPhone: to,
      messageType: "text",
      conversationType: "freeform",
    };
  }

  const payload = new URLSearchParams();
  payload.set("From", from.startsWith("whatsapp:") ? from : `whatsapp:${from}`);
  payload.set("To", to.startsWith("whatsapp:") ? to : `whatsapp:${to}`);
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

  const json = (await response.json().catch(() => null)) as
    | {
        sid?: string;
        message?: string;
      }
    | null;

  if (!response.ok || !json?.sid) {
    return {
      ok: false,
      status: "failed",
      deliveryStage: "failed",
      provider: "twilio",
      reason: json?.message || `Twilio rejected the message with status ${response.status}.`,
      messageId: null,
      statusCode: response.status,
      graphErrorCode: null,
      responseSummary: json?.message || null,
      normalizedPhone: to,
      messageType: "text",
      conversationType: "freeform",
    };
  }

  return {
    ok: true,
    status: "sent",
    deliveryStage: "api_accepted",
    provider: "twilio",
    reason: null,
    messageId: json.sid,
    statusCode: response.status,
    graphErrorCode: null,
    responseSummary: `Twilio accepted the message and returned sid ${json.sid}.`,
    normalizedPhone: to,
    messageType: "text",
    conversationType: "freeform",
  };
}

async function resolveMetaRecipient(input: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
}) {
  const response = await fetch(`https://graph.facebook.com/v22.0/${input.phoneNumberId}/contacts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      blocking: "wait",
      force_check: true,
      contacts: [input.to.replace(/^\+/, "")],
    }),
  });

  const json = (await response.json().catch(() => null)) as
    | {
        contacts?: Array<{
          input?: string;
          status?: string;
          wa_id?: string;
        }>;
        error?: { message?: string };
      }
    | null;

  const contact = json?.contacts?.[0];
  return {
    ok: response.ok,
    status: response.status,
    input: cleanText(contact?.input) || input.to.replace(/^\+/, ""),
    contactStatus: cleanText(contact?.status) || null,
    waId: cleanText(contact?.wa_id) || null,
    summary:
      response.ok && contact
        ? [
            cleanText(contact.input) ? `input ${cleanText(contact.input)}` : "",
            cleanText(contact.status) ? `contact ${cleanText(contact.status)}` : "",
            cleanText(contact.wa_id) ? `wa_id ${cleanText(contact.wa_id)}` : "",
          ]
            .filter(Boolean)
            .join(" • ")
        : cleanText(json?.error?.message) || null,
  };
}

async function sendViaMeta(input: {
  to: string;
  body: string;
  template?: WhatsAppTemplateInput | null;
  context?: WhatsAppTraceContext | null;
}): Promise<SupportWhatsAppDeliveryResult> {
  const phoneNumberId = cleanText(process.env.WHATSAPP_PHONE_NUMBER_ID);
  const accessToken = cleanText(process.env.WHATSAPP_ACCESS_TOKEN);
  const businessAccountId = cleanText(process.env.WHATSAPP_BUSINESS_ACCOUNT_ID);
  const template = input.template || null;
  const messageType = template ? "template" : "text";
  const conversationType = template ? "template" : "freeform";

  if (!phoneNumberId || !accessToken || !businessAccountId) {
    return {
      ok: false,
      status: "skipped",
      deliveryStage: "skipped",
      provider: "meta",
      reason:
        "Meta WhatsApp Cloud API is missing WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_BUSINESS_ACCOUNT_ID, or WHATSAPP_ACCESS_TOKEN.",
      messageId: null,
      statusCode: null,
      graphErrorCode: null,
      responseSummary: null,
      normalizedPhone: input.to,
      messageType,
      conversationType,
      templateName: template?.name || null,
      templateLanguage: template?.language || null,
    };
  }

  const contactLookup = await resolveMetaRecipient({
    phoneNumberId,
    accessToken,
    to: input.to,
  }).catch(() => ({
    ok: false,
    status: 0,
    input: input.to.replace(/^\+/, ""),
    contactStatus: null,
    waId: null,
    summary: "Meta contact resolution was not available for this attempt.",
  }));

  const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: contactLookup.waId || input.to.replace(/^\+/, ""),
      type: messageType,
      ...(template
        ? {
            template: {
              name: template.name,
              language: {
                code: cleanText(template.language) || "en_US",
              },
              ...(template.components?.length ? { components: template.components } : {}),
            },
          }
        : {
            text: {
              preview_url: false,
              body: input.body,
            },
          }),
    }),
  });

  const json = (await response.json().catch(() => null)) as
    | {
        error?: { message?: string; code?: number; type?: string; fbtrace_id?: string };
        messages?: Array<{ id?: string }>;
      }
    | null;

  const messageId = json?.messages?.[0]?.id ?? null;

  if (!response.ok || !messageId) {
    return {
      ok: false,
      status: "failed",
      deliveryStage: "failed",
      provider: "meta",
      reason:
        json?.error?.message || `Meta WhatsApp API rejected the message with status ${response.status}.`,
      messageId: null,
      statusCode: response.status,
      graphErrorCode: json?.error?.code ?? null,
      responseSummary:
        [
          contactLookup.ok ? contactLookup.summary : null,
          json?.error?.message || null,
          input.context?.conversationPolicy === "business_initiated" && !template
            ? "Business-initiated delivery needs an approved template or an open 24-hour customer service window."
            : null,
        ]
          .filter(Boolean)
          .join(" • ") || null,
      normalizedPhone: input.to,
      resolvedWaId: contactLookup.waId,
      contactStatus: contactLookup.contactStatus,
      messageType,
      conversationType,
      templateName: template?.name || null,
      templateLanguage: template?.language || null,
    };
  }

  // Note: "api_accepted" means Meta received the request. Actual delivery to the
  // recipient's device is tracked separately via webhook status callbacks.
  // Meta requires approved message templates for business-initiated conversations
  // outside the 24-hour customer service window. Freeform text works within 24h
  // of last customer message but fails for proactive outreach (error 131047).
  return {
    ok: true,
    status: "sent",
    deliveryStage: "api_accepted",
    provider: "meta",
    reason: null,
    messageId,
    statusCode: response.status,
    graphErrorCode: null,
    responseSummary: [
      contactLookup.ok ? contactLookup.summary : null,
      template
        ? `Meta accepted template ${template.name} and returned id ${messageId}.`
        : `Meta accepted the message and returned id ${messageId}.`,
      !template && input.context?.conversationPolicy === "business_initiated"
        ? "Business-initiated delivery still needs an approved template or an open 24-hour customer service window."
        : "Actual delivery status will be updated via webhook.",
    ]
      .filter(Boolean)
      .join(" • "),
    normalizedPhone: input.to,
    resolvedWaId: contactLookup.waId,
    contactStatus: contactLookup.contactStatus,
    messageType,
    conversationType,
    templateName: template?.name || null,
    templateLanguage: template?.language || null,
  };
}

async function traceWhatsAppAttempt(input: {
  normalizedPhone?: string | null;
  result: SupportWhatsAppDeliveryResult;
  template?: WhatsAppTemplateInput | null;
  context?: WhatsAppTraceContext | null;
}) {
  await recordWhatsAppOutboundTrace({
    normalizedPhone: input.normalizedPhone,
    resolvedWaId: input.result.resolvedWaId || null,
    contactStatus: input.result.contactStatus || null,
    messageId: input.result.messageId,
    messageType: input.result.messageType || (input.template ? "template" : "text"),
    conversationType:
      input.result.conversationType || (input.template ? "template" : "freeform"),
    template: input.template
      ? {
          name: input.template.name,
          language: input.template.language || null,
          category: input.template.category || null,
        }
      : null,
    provider: input.result.provider,
    status: input.result.status,
    deliveryStage: input.result.deliveryStage,
    reason: input.result.reason,
    responseSummary: input.result.responseSummary,
    statusCode: input.result.statusCode,
    graphErrorCode: input.result.graphErrorCode,
    context: input.context || null,
  });
}

export async function sendWhatsAppText(input: {
  phone?: string | null;
  body: string;
  template?: WhatsAppTemplateInput | null;
  metadata?: WhatsAppTraceContext | null;
}): Promise<SupportWhatsAppDeliveryResult> {
  const normalizedPhone = normalizePhone(input.phone);
  const template = input.template || null;

  if (!normalizedPhone) {
    const result = {
      ok: false,
      status: "skipped",
      deliveryStage: "skipped",
      provider: null,
      reason: "A valid customer phone number is not available for WhatsApp delivery.",
      messageId: null,
      statusCode: null,
      graphErrorCode: null,
      responseSummary: null,
      normalizedPhone: null,
      messageType: template ? "template" : "text",
      conversationType: template ? "template" : "freeform",
      templateName: template?.name || null,
      templateLanguage: template?.language || null,
    } satisfies SupportWhatsAppDeliveryResult;
    await traceWhatsAppAttempt({
      normalizedPhone: null,
      result,
      template,
      context: input.metadata || null,
    });
    return result;
  }

  const capability = getWhatsAppCapability();
  if (!capability.configured) {
    const result = {
      ok: false,
      status: "skipped",
      deliveryStage: "skipped",
      provider: null,
      reason: capability.reason,
      messageId: null,
      statusCode: null,
      graphErrorCode: null,
      responseSummary: null,
      normalizedPhone,
      messageType: template ? "template" : "text",
      conversationType: template ? "template" : "freeform",
      templateName: template?.name || null,
      templateLanguage: template?.language || null,
    } satisfies SupportWhatsAppDeliveryResult;
    await traceWhatsAppAttempt({
      normalizedPhone,
      result,
      template,
      context: input.metadata || null,
    });
    return result;
  }

  if (capability.provider === "twilio") {
    const result = await sendViaTwilio(normalizedPhone, input.body);
    await traceWhatsAppAttempt({
      normalizedPhone,
      result,
      template,
      context: input.metadata || null,
    });
    return result;
  }

  const result = await sendViaMeta({
    to: normalizedPhone,
    body: input.body,
    template,
    context: input.metadata || null,
  });
  await traceWhatsAppAttempt({
    normalizedPhone,
    result,
    template,
    context: input.metadata || null,
  });
  return result;
}

export async function sendSupportReplyWhatsApp(input: {
  phone?: string | null;
  customerName?: string | null;
  threadRef: string;
  threadId?: string | null;
  subject: string;
  message: string;
}) {
  const body = [
    `HenryCo Care support • ${input.threadRef}`,
    input.customerName ? `Hello ${input.customerName},` : "Hello,",
    "",
    input.subject,
    input.message,
    "",
    "If you need to continue the conversation, reply by email or use the Care contact page.",
  ]
    .filter(Boolean)
    .join("\n");

  return sendWhatsAppText({
    phone: input.phone,
    body,
    metadata: {
      sourceKind: "support_reply",
      sourceId: input.threadId || null,
      sourceLabel: input.threadRef,
      conversationPolicy: "unknown",
    },
  });
}
