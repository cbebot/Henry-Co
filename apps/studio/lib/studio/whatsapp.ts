import "server-only";

import { normalizePhone } from "@/lib/env";

export type StudioWhatsAppResult = {
  ok: boolean;
  status: "sent" | "skipped" | "failed";
  reason: string | null;
  messageId: string | null;
  provider: "twilio" | "meta" | null;
};

function cleanText(value?: string | null) {
  return String(value || "").trim();
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

async function sendViaTwilio(to: string, body: string): Promise<StudioWhatsAppResult> {
  const accountSid = cleanText(process.env.TWILIO_ACCOUNT_SID);
  const authToken = cleanText(process.env.TWILIO_AUTH_TOKEN);
  const from = cleanText(process.env.TWILIO_WHATSAPP_FROM);

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
    | { sid?: string; message?: string }
    | null;

  if (!response.ok || !json?.sid) {
    return {
      ok: false,
      status: "failed",
      reason: json?.message || `Twilio rejected the message with status ${response.status}.`,
      messageId: null,
      provider: "twilio",
    };
  }

  return {
    ok: true,
    status: "sent",
    reason: null,
    messageId: json.sid,
    provider: "twilio",
  };
}

async function sendViaMeta(to: string, body: string): Promise<StudioWhatsAppResult> {
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
      to: to.replace(/^\+/, ""),
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
      reason:
        json?.error?.message || `Meta WhatsApp API rejected the message with status ${response.status}.`,
      messageId: null,
      provider: "meta",
    };
  }

  return {
    ok: true,
    status: "sent",
    reason: null,
    messageId,
    provider: "meta",
  };
}

export async function sendStudioWhatsAppText(input: {
  phone?: string | null;
  body: string;
}) {
  const phone = normalizePhone(input.phone);
  if (!phone) {
    return {
      ok: false,
      status: "skipped",
      reason: "A valid customer phone number is not available for WhatsApp delivery.",
      messageId: null,
      provider: null,
    } satisfies StudioWhatsAppResult;
  }

  if (hasTwilioConfig()) {
    return sendViaTwilio(phone, input.body);
  }

  if (hasMetaConfig()) {
    return sendViaMeta(phone, input.body);
  }

  return {
    ok: false,
    status: "skipped",
    reason: "WhatsApp delivery is not configured for this deployment.",
    messageId: null,
    provider: null,
  } satisfies StudioWhatsAppResult;
}
