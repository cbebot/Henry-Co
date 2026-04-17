import "server-only";

import { Resend } from "resend";
import { cleanEnv, getOptionalEnv, looksLikeEmailAddress } from "@/lib/env";

type ResendReceivingCapability = {
  configured: boolean;
  reason: string;
  supportInbox: string | null;
  canFetchContent: boolean;
};

export type ResendReceivedEmailListItem = {
  id: string;
  to: string[];
  from: string;
  created_at: string | null;
  subject: string | null;
  bcc: string[];
  cc: string[];
  reply_to: string[];
  message_id: string | null;
  attachments: unknown[];
};

let resendClient: Resend | null = null;

export function getResendApiKey() {
  return getOptionalEnv("INBOUND_EMAIL_API_KEY") || getOptionalEnv("RESEND_API_KEY");
}

function getRawResendWebhookSecret() {
  return getOptionalEnv("INBOUND_EMAIL_WEBHOOK_SECRET") || getOptionalEnv("RESEND_WEBHOOK_SECRET");
}

export function getResendWebhookSecret() {
  const webhookSecret = getRawResendWebhookSecret();
  return looksLikeEmailAddress(webhookSecret) ? null : webhookSecret;
}

export function getResendSupportInbox() {
  const supportInbox =
    getOptionalEnv("INBOUND_SUPPORT_INBOX") || getOptionalEnv("RESEND_SUPPORT_INBOX");
  if (supportInbox) {
    return supportInbox;
  }

  const webhookSecret = getRawResendWebhookSecret();
  return looksLikeEmailAddress(webhookSecret) ? cleanEnv(webhookSecret) : null;
}

export function getResendClient() {
  const apiKey = getResendApiKey();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

export async function probeResendReceivingCapability(): Promise<ResendReceivingCapability> {
  const apiKey = getResendApiKey();
  const rawWebhookSecret = getRawResendWebhookSecret();
  const webhookSecret = getResendWebhookSecret();
  const supportInbox = getResendSupportInbox();

  if (!webhookSecret) {
    return {
      configured: false,
      reason:
        looksLikeEmailAddress(rawWebhookSecret)
          ? "RESEND_WEBHOOK_SECRET currently contains the support inbox address instead of the Resend signing secret. Inbound support email will stay blocked until the real webhook secret is saved."
          : "RESEND_WEBHOOK_SECRET is missing, so inbound support email cannot be verified safely yet.",
      supportInbox,
      canFetchContent: false,
    };
  }

  if (!supportInbox) {
    return {
      configured: false,
      reason:
        "Set RESEND_SUPPORT_INBOX to the receiving mailbox address before customer email replies can route into the support desk.",
      supportInbox,
      canFetchContent: false,
    };
  }

  if (!apiKey) {
    return {
      configured: false,
      reason:
        "RESEND_API_KEY is missing, so inbound mailbox state cannot be verified from this runtime.",
      supportInbox,
      canFetchContent: false,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch("https://api.resend.com/emails/receiving?limit=1", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as
      | { message?: string; name?: string }
      | null;

    if (response.ok) {
      return {
        configured: true,
        reason:
          "Inbound mailbox env, webhook verification, and Resend Receiving API access are available.",
        supportInbox,
        canFetchContent: true,
      };
    }

    const restrictedApiKey =
      payload?.message && payload.message.toLowerCase().includes("restricted_api_key");

    if (restrictedApiKey) {
      return {
        configured: true,
        reason:
          "Inbound email routing is ready through the signed webhook path. The current Resend key is still send-only, so mailbox body retrieval remains limited until Receiving API access is enabled.",
        supportInbox,
        canFetchContent: false,
      };
    }

    const reason =
      payload?.message || `Resend inbound verification returned status ${response.status}.`;

    return {
      configured: false,
      reason,
      supportInbox,
      canFetchContent: false,
    };
  } catch (error) {
    return {
      configured: false,
      reason:
        error instanceof Error && error.name === "AbortError"
          ? "Inbound mailbox verification timed out. The webhook route is ready, but provider-side receiving could not be confirmed from this runtime."
          : error instanceof Error
          ? error.message
          : "Inbound mailbox verification could not be completed from this runtime.",
      supportInbox,
      canFetchContent: false,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function listRecentReceivedEmails(limit = 10) {
  const apiKey = getResendApiKey();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is missing.");
  }

  const response = await fetch(
    `https://api.resend.com/emails/receiving?limit=${Math.max(1, Math.min(limit, 100))}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    }
  );

  const payload = (await response.json().catch(() => null)) as
    | {
        message?: string;
        data?: ResendReceivedEmailListItem[];
      }
    | null;

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        `Resend receiving list request failed with status ${response.status}.`
    );
  }

  return Array.isArray(payload?.data) ? payload.data : [];
}
