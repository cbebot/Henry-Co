import "server-only";

import { BrevoClient } from "@getbrevo/brevo";
import { asRecord, cleanEnv, normalizeEmailAddress, parseNamedEmail } from "./_env";

type DispatchStatus = "sent" | "queued" | "skipped" | "failed";

export type SendTransactionalEmailInput = {
  to: string | string[] | null | undefined;
  subject: string;
  html?: string | null;
  text?: string | null;
  fromName?: string | null;
  fromEmail?: string | null;
  replyTo?: string | null;
  headers?: Record<string, string> | null;
  tags?: string[] | null;
  missingConfigStatus?: Extract<DispatchStatus, "queued" | "skipped">;
};

export type SendTransactionalEmailResult = {
  ok: boolean;
  status: DispatchStatus;
  reason: string | null;
  messageId: string | null;
  provider: "brevo" | null;
  recipients: string[];
};

let brevoClient: BrevoClient | null = null;

function getBrevoApiKey() {
  return cleanEnv(process.env.BREVO_API_KEY);
}

function getBrevoClient() {
  const apiKey = getBrevoApiKey();
  if (!apiKey) return null;

  if (!brevoClient) {
    brevoClient = new BrevoClient({ apiKey });
  }

  return brevoClient;
}

function sanitizeRecipients(value: SendTransactionalEmailInput["to"]) {
  const list = Array.isArray(value) ? value : [value];
  return [...new Set(list.map((entry) => normalizeEmailAddress(entry)).filter(Boolean))] as string[];
}

function resolveSender(input: Pick<SendTransactionalEmailInput, "fromEmail" | "fromName">) {
  const legacySender = parseNamedEmail(
    process.env.BREVO_SENDER_EMAIL || "HenryCo <noreply@henrycogroup.com>"
  );

  return {
    email:
      normalizeEmailAddress(input.fromEmail) ||
      legacySender.email ||
      "noreply@henrycogroup.com",
    name:
      cleanEnv(input.fromName) ||
      cleanEnv(process.env.BREVO_SENDER_NAME) ||
      legacySender.name ||
      "HenryCo",
  };
}

function resolveReplyTo(input: Pick<SendTransactionalEmailInput, "replyTo">) {
  const explicit = parseNamedEmail(input.replyTo);
  if (explicit.email) {
    return explicit;
  }

  const configured = parseNamedEmail(
    process.env.BREVO_REPLY_TO_EMAIL || "support@henrycogroup.com"
  );

  return configured.email ? configured : null;
}

function getMessageId(value: unknown) {
  const record = asRecord(value);
  const rootMessageId = cleanEnv(String(record?.messageId || ""));
  if (rootMessageId) return rootMessageId;

  const data = asRecord(record?.data);
  const nestedMessageId = cleanEnv(String(data?.messageId || ""));
  if (nestedMessageId) return nestedMessageId;

  const messageIds = Array.isArray(record?.messageIds)
    ? record?.messageIds
    : Array.isArray(data?.messageIds)
      ? data?.messageIds
      : [];

  const first = cleanEnv(String(messageIds[0] || ""));
  return first || null;
}

export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput
): Promise<SendTransactionalEmailResult> {
  const recipients = sanitizeRecipients(input.to);
  if (!recipients.length) {
    return {
      ok: false,
      status: "skipped",
      reason: "Recipient email is missing.",
      messageId: null,
      provider: null,
      recipients: [],
    };
  }

  const client = getBrevoClient();
  if (!client) {
    return {
      ok: false,
      status: input.missingConfigStatus || "queued",
      reason: "BREVO_API_KEY is not configured.",
      messageId: null,
      provider: null,
      recipients,
    };
  }

  try {
    const sender = resolveSender(input);
    const replyTo = resolveReplyTo(input);

    const response = await client.transactionalEmails.sendTransacEmail({
      sender: {
        email: sender.email,
        name: sender.name || undefined,
      },
      to: recipients.map((email) => ({ email })),
      replyTo: replyTo?.email
        ? {
            email: replyTo.email,
            name: replyTo.name || undefined,
          }
        : undefined,
      subject: input.subject,
      htmlContent: cleanEnv(input.html) ? input.html || undefined : undefined,
      textContent: cleanEnv(input.text) ? input.text || undefined : undefined,
      headers: input.headers && Object.keys(input.headers).length ? input.headers : undefined,
      tags: input.tags?.length ? input.tags : undefined,
    } as never);

    return {
      ok: true,
      status: "sent",
      reason: null,
      messageId: getMessageId(response),
      provider: "brevo",
      recipients,
    };
  } catch (error) {
    return {
      ok: false,
      status: "failed",
      reason: error instanceof Error ? error.message : "Brevo email dispatch failed.",
      messageId: null,
      provider: "brevo",
      recipients,
    };
  }
}
