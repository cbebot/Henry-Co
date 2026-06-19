import { BRAND_EMAILS } from "@henryco/config";

import type {
  EmailDispatchResult,
  ResolvedSender,
  SendTransactionalEmailInput,
} from "../types";

/**
 * Amazon SES (v2 SendEmail) transactional provider.
 *
 * Dependency-free by design — it speaks the SES HTTPS API directly with AWS
 * Signature V4 signing built on Web Crypto, mirroring the Resend/Brevo fetch
 * providers. No `@aws-sdk/*` dependency, so it adds zero install weight and runs
 * in both the Node and Edge runtimes.
 *
 * Activation is purely env-gated: with no AWS credentials present `getSesConfig()`
 * returns null and `sendSesEmail()` reports `skipped`, so the router transparently
 * falls through to Resend/Brevo. Set the AWS_SES_* env to make SES the primary
 * transactional rail (cost: ~$0.10 / 1,000 emails vs. a vendor markup).
 */

type SesConfig = {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
};

export function getSesConfig(): SesConfig | null {
  const accessKeyId = (process.env.AWS_SES_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || "").trim();
  const secretAccessKey = (
    process.env.AWS_SES_SECRET_ACCESS_KEY ||
    process.env.AWS_SECRET_ACCESS_KEY ||
    ""
  ).trim();
  if (!accessKeyId || !secretAccessKey) return null;
  const region = (process.env.AWS_SES_REGION || process.env.AWS_REGION || "us-east-1").trim();
  const sessionToken =
    (process.env.AWS_SES_SESSION_TOKEN || process.env.AWS_SESSION_TOKEN || "").trim() || undefined;
  return { region, accessKeyId, secretAccessKey, sessionToken };
}

export function getSesSender(input: SendTransactionalEmailInput): ResolvedSender {
  const envFromRaw = (process.env.AWS_SES_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || "").trim();
  const angle = envFromRaw.match(/^(.*?)<([^<>]+)>\s*$/);
  const envEmail = angle ? angle[2].trim() : envFromRaw;
  const envName = angle ? angle[1].replace(/^["']|["']$/g, "").trim() : "";

  const email = input.from?.trim() || envEmail || BRAND_EMAILS.noreply;
  const name = input.fromName?.trim() || envName || "Henry Onyx";
  return { email, name };
}

function formatFrom(sender: ResolvedSender): string {
  return sender.name ? `${sender.name} <${sender.email}>` : sender.email;
}

const encoder = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(data: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(data)));
}

async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
}

async function deriveSigningKey(
  secret: string,
  dateStamp: string,
  region: string,
  service: string,
): Promise<ArrayBuffer> {
  const kDate = await hmac(encoder.encode(`AWS4${secret}`), dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

function amzDates(now: Date): { amzDate: string; dateStamp: string } {
  // 2026-06-19T05:46:00.000Z -> 20260619T054600Z
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amzDate, dateStamp: amzDate.slice(0, 8) };
}

function safeProviderError(payload: unknown, status: number): string {
  if (payload && typeof payload === "object") {
    const obj = payload as { message?: unknown; Message?: unknown; __type?: unknown };
    const msg =
      typeof obj.message === "string"
        ? obj.message
        : typeof obj.Message === "string"
          ? obj.Message
          : "";
    if (msg.trim()) return msg.trim().slice(0, 280);
    if (typeof obj.__type === "string" && obj.__type.trim()) {
      return `ses:${obj.__type.trim()}`.slice(0, 280);
    }
  }
  return `ses http ${status}`;
}

export async function sendSesEmail(
  input: SendTransactionalEmailInput,
): Promise<EmailDispatchResult> {
  const config = getSesConfig();
  if (!config) {
    return {
      provider: "ses",
      status: "skipped",
      skippedReason: "AWS SES credentials are not configured for this deployment.",
    };
  }

  const sender = getSesSender(input);
  const service = "ses";
  const host = `email.${config.region}.amazonaws.com`;
  const path = "/v2/email/outbound-emails";

  const body: Record<string, unknown> = {
    FromEmailAddress: formatFrom(sender),
    Destination: { ToAddresses: [input.to] },
    Content: {
      Simple: {
        Subject: { Data: input.subject, Charset: "UTF-8" },
        Body: {
          ...(input.html ? { Html: { Data: input.html, Charset: "UTF-8" } } : {}),
          ...(input.text ? { Text: { Data: input.text, Charset: "UTF-8" } } : {}),
        },
      },
    },
  };
  if (input.replyTo) body.ReplyToAddresses = [input.replyTo];

  const payload = JSON.stringify(body);
  const { amzDate, dateStamp } = amzDates(new Date());
  const payloadHash = await sha256Hex(payload);

  const canonicalHeaders =
    `content-type:application/json\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n` +
    (config.sessionToken ? `x-amz-security-token:${config.sessionToken}\n` : "");
  const signedHeaders = config.sessionToken
    ? "content-type;host;x-amz-content-sha256;x-amz-date;x-amz-security-token"
    : "content-type;host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = `POST\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const credentialScope = `${dateStamp}/${config.region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${await sha256Hex(
    canonicalRequest,
  )}`;

  const signingKey = await deriveSigningKey(config.secretAccessKey, dateStamp, config.region, service);
  const signature = toHex(await hmac(signingKey, stringToSign));

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  let response: Response;
  try {
    response = await fetch(`https://${host}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Amz-Date": amzDate,
        "X-Amz-Content-Sha256": payloadHash,
        Authorization: authorization,
        ...(config.sessionToken ? { "X-Amz-Security-Token": config.sessionToken } : {}),
      },
      body: payload,
    });
  } catch (err) {
    return {
      provider: "ses",
      status: "error",
      safeError: err instanceof Error ? err.message.slice(0, 280) : "ses network error",
    };
  }

  const out = (await response.json().catch(() => null)) as
    | { MessageId?: string; message?: string; Message?: string; __type?: string }
    | null;

  if (!response.ok) {
    return {
      provider: "ses",
      status: "error",
      safeError: safeProviderError(out, response.status),
    };
  }

  return {
    provider: "ses",
    status: "sent",
    messageId: out?.MessageId,
  };
}
