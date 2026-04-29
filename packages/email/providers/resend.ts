import type {
  EmailDispatchResult,
  ResolvedSender,
  SendTransactionalEmailInput,
} from "../types";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function getResendApiKey(): string | null {
  const value = process.env.RESEND_API_KEY;
  return value && value.trim() ? value.trim() : null;
}

export function getResendSender(input: SendTransactionalEmailInput): ResolvedSender {
  const envFromRaw = (process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM || "").trim();
  const angle = envFromRaw.match(/^(.*?)<([^<>]+)>\s*$/);
  const envEmail = angle ? angle[2].trim() : envFromRaw;
  const envName = angle ? angle[1].replace(/^["']|["']$/g, "").trim() : "";

  const email = input.from?.trim() || envEmail || "noreply@henrycogroup.com";
  const name = input.fromName?.trim() || envName || "HenryCo";
  return { email, name };
}

function formatResendFrom(sender: ResolvedSender): string {
  return sender.name ? `${sender.name} <${sender.email}>` : sender.email;
}

function safeProviderError(payload: unknown, status: number): string {
  if (payload && typeof payload === "object") {
    const obj = payload as { message?: unknown; name?: unknown };
    if (typeof obj.message === "string" && obj.message.trim()) {
      return obj.message.trim().slice(0, 280);
    }
    if (typeof obj.name === "string" && obj.name.trim()) {
      return `resend:${obj.name.trim()}`.slice(0, 280);
    }
  }
  return `resend http ${status}`;
}

export async function sendResendEmail(
  input: SendTransactionalEmailInput,
): Promise<EmailDispatchResult> {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    return {
      provider: "resend",
      status: "skipped",
      skippedReason: "RESEND_API_KEY is not configured for this deployment.",
    };
  }

  const sender = getResendSender(input);

  let response: Response;
  try {
    response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: formatResendFrom(sender),
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo,
      }),
    });
  } catch (err) {
    return {
      provider: "resend",
      status: "error",
      safeError: err instanceof Error ? err.message.slice(0, 280) : "resend network error",
    };
  }

  const payload = (await response.json().catch(() => null)) as
    | { id?: string; message?: string; name?: string }
    | null;

  if (!response.ok) {
    return {
      provider: "resend",
      status: "error",
      safeError: safeProviderError(payload, response.status),
    };
  }

  return {
    provider: "resend",
    status: "sent",
    messageId: payload?.id,
  };
}
