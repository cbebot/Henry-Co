import { NextResponse, type NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  renderAuthEmail,
  sendBrevoEmail,
  sendResendEmail,
  type AuthHookEmailData,
  type EmailDispatchResult,
  type SendTransactionalEmailInput,
} from "@henryco/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOOK_SECRET_ENV = "SUPABASE_AUTH_HOOK_SECRET";
const REPLAY_WINDOW_SECONDS = 5 * 60;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const DEDUPE_TTL_MS = 60_000;
const SENDER_EMAIL = "accounts@henrycogroup.com";
const SENDER_NAME = "HenryCo Accounts";

type Bucket = { count: number; windowStartedAt: number };
const rateBuckets = new Map<string, Bucket>();
const dedupe = new Map<string, number>();

function safe401() {
  return new NextResponse(null, { status: 401 });
}
function safe400() {
  return new NextResponse(null, { status: 400 });
}
function safe200() {
  return NextResponse.json({});
}
function safe5xx() {
  return new NextResponse(null, { status: 502 });
}
function safe429() {
  return new NextResponse(null, { status: 429 });
}

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now - bucket.windowStartedAt > RATE_LIMIT_WINDOW_MS) {
    rateBuckets.set(ip, { count: 1, windowStartedAt: now });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= RATE_LIMIT_MAX;
}

function decodeStandardWebhookSecret(raw: string): Buffer | null {
  // Standard Webhooks secret format from Supabase: "v1,whsec_<base64>"
  // We accept either the prefixed form or a raw base64 secret.
  const trimmed = raw.trim();
  const m = trimmed.match(/whsec_([A-Za-z0-9+/=_-]+)/);
  const b64 = m ? m[1] : trimmed;
  try {
    return Buffer.from(b64, "base64");
  } catch {
    return null;
  }
}

function verifyStandardWebhookSignature(
  body: string,
  webhookId: string,
  webhookTimestamp: string,
  webhookSignature: string,
  secret: Buffer,
): boolean {
  const tsSeconds = Number(webhookTimestamp);
  if (!Number.isFinite(tsSeconds)) return false;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - tsSeconds) > REPLAY_WINDOW_SECONDS) return false;

  const signedPayload = `${webhookId}.${webhookTimestamp}.${body}`;
  const expected = createHmac("sha256", secret).update(signedPayload).digest("base64");

  // webhook-signature header format: "v1,<base64sig> v1,<otherBase64sig>"
  const candidates = webhookSignature.split(/\s+/).filter(Boolean);
  for (const candidate of candidates) {
    const parts = candidate.split(",");
    if (parts.length !== 2 || parts[0] !== "v1") continue;
    const provided = parts[1];
    if (provided.length !== expected.length) continue;
    try {
      if (timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return true;
    } catch {
      // length mismatch path; ignore
    }
  }
  return false;
}

function isFreshDelivery(webhookId: string): boolean {
  const now = Date.now();
  for (const [id, expiresAt] of dedupe) {
    if (expiresAt < now) dedupe.delete(id);
  }
  if (dedupe.has(webhookId)) return false;
  dedupe.set(webhookId, now + DEDUPE_TTL_MS);
  return true;
}

type AuthHookPayload = {
  user?: { id?: unknown; email?: unknown };
  email_data?: Partial<AuthHookEmailData> & { email_action_type?: unknown };
};

function parsePayload(raw: string): { user_email: string; data: AuthHookEmailData } | null {
  let parsed: AuthHookPayload;
  try {
    parsed = JSON.parse(raw) as AuthHookPayload;
  } catch {
    return null;
  }
  const email = typeof parsed.user?.email === "string" ? parsed.user!.email!.trim() : "";
  if (!email || !email.includes("@") || email.length > 320) return null;

  const ed = parsed.email_data || {};
  const action = typeof ed.email_action_type === "string" ? ed.email_action_type : "";
  const tokenHash = typeof ed.token_hash === "string" ? ed.token_hash : "";
  const token = typeof ed.token === "string" ? ed.token : "";
  if (!action || !tokenHash) return null;

  return {
    user_email: email,
    data: {
      token,
      token_hash: tokenHash,
      redirect_to: typeof ed.redirect_to === "string" ? ed.redirect_to : null,
      email_action_type: action,
      site_url: typeof ed.site_url === "string" ? ed.site_url : null,
      token_new: typeof ed.token_new === "string" ? ed.token_new : null,
      token_hash_new: typeof ed.token_hash_new === "string" ? ed.token_hash_new : null,
    },
  };
}

async function dispatchWithFallback(input: SendTransactionalEmailInput): Promise<EmailDispatchResult> {
  const primary = await sendResendEmail(input);
  if (primary.status === "sent") return primary;

  // Resend failed (error or skipped). Log and try Brevo as fallback.
  console.error("[auth-hook] resend failed", {
    status: primary.status,
    safeError: primary.safeError,
    skippedReason: primary.skippedReason,
  });

  const fallback = await sendBrevoEmail(input);
  if (fallback.status === "sent") {
    console.warn("[auth-hook] brevo fallback succeeded after resend failure");
    return fallback;
  }
  console.error("[auth-hook] brevo fallback also failed", {
    status: fallback.status,
    safeError: fallback.safeError,
    skippedReason: fallback.skippedReason,
  });
  return fallback;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip)) return safe429();

  const secretRaw = process.env[HOOK_SECRET_ENV];
  if (!secretRaw) return safe5xx();
  const secret = decodeStandardWebhookSecret(secretRaw);
  if (!secret) return safe5xx();

  const webhookId = req.headers.get("webhook-id") || "";
  const webhookTimestamp = req.headers.get("webhook-timestamp") || "";
  const webhookSignature = req.headers.get("webhook-signature") || "";
  if (!webhookId || !webhookTimestamp || !webhookSignature) return safe401();

  const body = await req.text();
  if (body.length > 16_384) return safe400();

  if (!verifyStandardWebhookSignature(body, webhookId, webhookTimestamp, webhookSignature, secret)) {
    return safe401();
  }

  if (!isFreshDelivery(webhookId)) {
    // Idempotent replay — Supabase retried within 60s. Already handled.
    return safe200();
  }

  const parsed = parsePayload(body);
  if (!parsed) return safe400();

  // Build the email link against the deployment that's serving this hook
  // request, NOT against the payload's site_url. Supabase's `site_url` field
  // in the hook payload is the auth API base (e.g. https://<ref>.supabase.co/
  // auth/v1), not the project Site URL — concatenating /auth/confirm onto it
  // produces a Supabase-domain URL that 404s. Using the request origin ensures
  // the confirmation link returns to the same deployment, preserving cookie
  // domain alignment.
  const requestUrl = new URL(req.url);
  const forwardedHost = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const baseHost = forwardedHost || requestUrl.host;
  const baseProto = req.headers.get("x-forwarded-proto") || requestUrl.protocol.replace(/:$/, "") || "https";
  const fallbackSiteUrl = `${baseProto}://${baseHost}`;
  const rendered = renderAuthEmail(parsed.data, fallbackSiteUrl);

  const result = await dispatchWithFallback({
    to: parsed.user_email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    from: SENDER_EMAIL,
    fromName: SENDER_NAME,
    purpose: "auth",
  });

  if (result.status !== "sent") return safe5xx();
  return safe200();
}

export async function GET() {
  // Health check that does NOT leak whether the hook is configured.
  return new NextResponse(null, { status: 405 });
}
