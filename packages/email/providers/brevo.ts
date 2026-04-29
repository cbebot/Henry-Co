import type {
  EmailDispatchResult,
  ResolvedSender,
  SendTransactionalEmailInput,
} from "../types";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export function getBrevoApiKey(): string | null {
  const value = process.env.BREVO_API_KEY;
  return value && value.trim() ? value.trim() : null;
}

export function getBrevoSender(input: SendTransactionalEmailInput): ResolvedSender {
  const fallbackEmail = process.env.BREVO_SENDER_EMAIL?.trim() || "noreply@henrycogroup.com";
  const fallbackName = process.env.BREVO_SENDER_NAME?.trim() || "HenryCo";
  return {
    email: input.from?.trim() || fallbackEmail,
    name: input.fromName?.trim() || fallbackName,
  };
}

function safeProviderError(payload: unknown, status: number): string {
  if (payload && typeof payload === "object") {
    const obj = payload as { message?: unknown; code?: unknown };
    if (typeof obj.message === "string" && obj.message.trim()) {
      return obj.message.trim().slice(0, 280);
    }
    if (typeof obj.code === "string" && obj.code.trim()) {
      return `brevo:${obj.code.trim()}`.slice(0, 280);
    }
  }
  return `brevo http ${status}`;
}

export async function sendBrevoEmail(
  input: SendTransactionalEmailInput,
): Promise<EmailDispatchResult> {
  const apiKey = getBrevoApiKey();
  if (!apiKey) {
    return {
      provider: "brevo",
      status: "skipped",
      skippedReason: "BREVO_API_KEY is not configured for this deployment.",
    };
  }

  const sender = getBrevoSender(input);

  let response: Response;
  try {
    response = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender,
        to: [{ email: input.to }],
        subject: input.subject,
        htmlContent: input.html,
        textContent: input.text,
        replyTo: input.replyTo ? { email: input.replyTo } : undefined,
      }),
    });
  } catch (err) {
    return {
      provider: "brevo",
      status: "error",
      safeError: err instanceof Error ? err.message.slice(0, 280) : "brevo network error",
    };
  }

  const payload = (await response.json().catch(() => null)) as
    | { messageId?: string; message?: string; code?: string }
    | null;

  if (!response.ok) {
    return {
      provider: "brevo",
      status: "error",
      safeError: safeProviderError(payload, response.status),
    };
  }

  return {
    provider: "brevo",
    status: "sent",
    messageId: payload?.messageId,
  };
}
