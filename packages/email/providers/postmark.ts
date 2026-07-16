import { BRAND_EMAILS } from "@henryco/config";

import type {
  EmailDispatchResult,
  EmailPurpose,
  ResolvedSender,
  SendTransactionalEmailInput,
} from "../types";

/**
 * Postmark transactional provider — the single outbound email rail.
 *
 * EMAIL-POSTMARK (2026-07-14): Postmark replaces the retired Amazon SES rail.
 * Dependency-free by design — it speaks Postmark's HTTPS API directly with a
 * single server-token header (no `postmark` SDK, no `@aws-sdk/*`), so it adds
 * zero install weight and runs in both the Node and Edge runtimes. With no
 * server token present `getPostmarkServerToken()` returns null and the router
 * reports `skipped`; there is no fallback vendor by design.
 *
 * POSTMARK_SERVER_TOKEN is set in the shared environment variables. After merge
 * it will automatically sync to every subdomain deployment — a single Postmark
 * Server token unlocks every Message Stream on that server, so no per-subdomain
 * secret is ever needed.
 */

const POSTMARK_ENDPOINT = "https://api.postmarkapp.com/email";

export function getPostmarkServerToken(): string | null {
  // POSTMARK_SERVER_TOKEN is the canonical name; POSTMARK_API_TOKEN is accepted
  // as an alias so either naming convention in the shared env system works.
  const value = (process.env.POSTMARK_SERVER_TOKEN || process.env.POSTMARK_API_TOKEN || "").trim();
  return value ? value : null;
}

/**
 * Per-division Message Streams isolate sender reputation: a bounce storm in one
 * division can never taint another. `outbound` is Postmark's built-in
 * transactional stream (always present — zero setup), so the bulk of
 * transactional mail (auth, support, jobs, learn, logistics, marketplace,
 * generic) rides it safely from day one. Only the five custom streams below
 * must be created in the Postmark dashboard before those divisions cut over.
 * `marketing-broadcast` is a Broadcast-type stream — Postmark's single-send
 * `/email` endpoint routes to it fine when its ID is set as MessageStream.
 *
 * Override precedence: explicit `input.messageStream` > per-purpose map >
 * `POSTMARK_MESSAGE_STREAM` env default > Postmark's built-in `outbound`.
 */
const PURPOSE_TO_STREAM: Partial<Record<EmailPurpose, string>> = {
  care: "fabric-care",
  studio: "studio-notifications",
  property: "property-inquiries",
  security: "software-alerts",
  newsletter: "marketing-broadcast",
};

export function resolvePostmarkStream(input: SendTransactionalEmailInput): string {
  if (input.messageStream?.trim()) return input.messageStream.trim();
  if (input.purpose) {
    const mapped = PURPOSE_TO_STREAM[input.purpose];
    if (mapped) return mapped;
  }
  return (process.env.POSTMARK_MESSAGE_STREAM || "outbound").trim() || "outbound";
}

export function getPostmarkSender(input: SendTransactionalEmailInput): ResolvedSender {
  // Accept either a bare "a@b.com" or a combined "Name <a@b.com>" in BOTH
  // input.from and POSTMARK_FROM_EMAIL, so a caller that passes a combined value
  // is never double-wrapped into a malformed "Name <Name <a@b.com>>" From.
  const parse = (raw: string | undefined | null): { email: string; name: string } => {
    const s = (raw || "").trim();
    const m = s.match(/^(.*?)<([^<>]+)>\s*$/);
    return m
      ? { email: m[2].trim(), name: m[1].replace(/^["']|["']$/g, "").trim() }
      : { email: s, name: "" };
  };
  const fromParsed = parse(input.from);
  const envParsed = parse(process.env.POSTMARK_FROM_EMAIL);

  const email = fromParsed.email || envParsed.email || BRAND_EMAILS.noreply;
  const name = input.fromName?.trim() || fromParsed.name || envParsed.name || "Henry Onyx";
  return { email, name };
}

function formatFrom(sender: ResolvedSender): string {
  return sender.name ? `${sender.name} <${sender.email}>` : sender.email;
}

// Defense-in-depth: drop C0 control characters (CR, LF, tab, ...) and DEL from
// header-like fields. Postmark is a JSON API (not SMTP) so a newline here cannot
// inject a new SMTP header, but stripping keeps a stray CRLF in From/To/Subject/
// ReplyTo from corrupting the rendered header. A code-point filter keeps every
// space and printable character (so "Henry Onyx" survives) and removes only the
// control range 0-31 plus 127.
function sanitizeHeader(value: string): string {
  let out = "";
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 32 && code !== 127) out += ch;
  }
  return out.trim();
}

// SECURITY: open/click tracking must never touch auth or security mail.
// Postmark's link tracking rewrites every URL through its redirect domain — for
// one-time magic-link / password-reset / sign-in-alert links that both leaks
// open/click PII and lets mail-security scanners pre-fetch (and burn) the
// single-use token. Tracking is enabled only for non-sensitive purposes.
function trackingAllowed(purpose: EmailPurpose | undefined): boolean {
  return purpose !== "auth" && purpose !== "security";
}

function safeProviderError(payload: unknown, status: number): string {
  // Postmark error shape: { ErrorCode: number, Message: string }.
  if (payload && typeof payload === "object") {
    const obj = payload as { Message?: unknown; ErrorCode?: unknown };
    if (typeof obj.Message === "string" && obj.Message.trim()) {
      const code = typeof obj.ErrorCode === "number" ? `${obj.ErrorCode}:` : "";
      return `postmark ${code}${obj.Message.trim()}`.slice(0, 280);
    }
  }
  return `postmark http ${status}`;
}

export async function sendPostmarkEmail(
  input: SendTransactionalEmailInput,
): Promise<EmailDispatchResult> {
  const token = getPostmarkServerToken();
  if (!token) {
    return {
      provider: "postmark",
      status: "skipped",
      skippedReason: "POSTMARK_SERVER_TOKEN is not configured for this deployment.",
    };
  }

  const sender = getPostmarkSender(input);
  const track = trackingAllowed(input.purpose);

  const body: Record<string, unknown> = {
    From: sanitizeHeader(formatFrom(sender)),
    To: sanitizeHeader(input.to),
    Subject: sanitizeHeader(input.subject),
    MessageStream: resolvePostmarkStream(input),
    // Tracking is a deliverability nicety for non-sensitive mail, but is forced
    // OFF for auth/security so one-time links are never rewritten (see above).
    TrackOpens: track,
    TrackLinks: track ? "HtmlAndText" : "None",
  };
  if (input.html) body.HtmlBody = input.html;
  if (input.text) body.TextBody = input.text;
  if (input.replyTo) body.ReplyTo = sanitizeHeader(input.replyTo);

  let response: Response;
  try {
    response = await fetch(POSTMARK_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": token,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return {
      provider: "postmark",
      status: "error",
      safeError: err instanceof Error ? err.message.slice(0, 280) : "postmark network error",
    };
  }

  const out = (await response.json().catch(() => null)) as
    | { MessageID?: string; ErrorCode?: number; Message?: string }
    | null;

  // Postmark returns HTTP 200 with ErrorCode 0 on success; validation and auth
  // failures return a non-2xx status (422/401) with ErrorCode != 0. Guard on
  // both so a 200-with-error-code payload can never be mistaken for a send.
  if (!response.ok || (typeof out?.ErrorCode === "number" && out.ErrorCode !== 0)) {
    return {
      provider: "postmark",
      status: "error",
      safeError: safeProviderError(out, response.status),
    };
  }

  return {
    provider: "postmark",
    status: "sent",
    messageId: out?.MessageID,
  };
}
