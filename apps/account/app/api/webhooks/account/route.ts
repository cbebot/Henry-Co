import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createAdminSupabase } from "@/lib/supabase";
import { sendAccountEmail } from "@/lib/email/send";
import { welcomeEmail, securityAlertEmail, walletFundedEmail } from "@/lib/email/templates";
import { logSecurityEvent } from "@/lib/security-events";

const WEBHOOK_TTL_SECONDS = 5 * 60;

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getSigningSecret() {
  return clean(process.env.ACCOUNT_WEBHOOK_SIGNING_SECRET || process.env.CRON_SECRET);
}

function normalizeSignature(value: string) {
  const raw = clean(value);
  if (!raw) return "";
  return raw.startsWith("sha256=") ? raw.slice("sha256=".length) : raw;
}

function safeEqualHex(expectedHex: string, receivedHex: string) {
  try {
    const expected = Buffer.from(expectedHex, "hex");
    const received = Buffer.from(receivedHex, "hex");
    if (expected.length === 0 || received.length === 0 || expected.length !== received.length) return false;
    return crypto.timingSafeEqual(expected, received);
  } catch {
    return false;
  }
}

function isFreshTimestamp(value: string) {
  const ts = Number(value);
  if (!Number.isFinite(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  return Math.abs(now - ts) <= WEBHOOK_TTL_SECONDS;
}

async function alreadyProcessedEvent(eventId: string) {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("account_webhook_receipts")
    .select("id")
    .eq("event_id", eventId)
    .maybeSingle();
  return Boolean(data?.id);
}

async function recordWebhookReceipt(input: {
  eventId: string;
  eventName: string;
  userId: string;
  signatureValid: boolean;
  payloadHash: string;
}) {
  const admin = createAdminSupabase();
  await admin.from("account_webhook_receipts").insert({
    event_id: input.eventId,
    event_name: input.eventName,
    user_id: input.userId,
    signature_valid: input.signatureValid,
    payload_hash: input.payloadHash,
    processed_at: new Date().toISOString(),
  } as never);
}

// Webhook endpoint for cross-division account events
// Other HenryCo apps can POST here to trigger account-level actions
export async function POST(request: Request) {
  try {
    const signingSecret = getSigningSecret();
    if (!signingSecret) {
      return NextResponse.json({ error: "Webhook signing secret not configured" }, { status: 503 });
    }

    const timestamp = clean(request.headers.get("x-henry-timestamp"));
    const signature = normalizeSignature(String(request.headers.get("x-henry-signature") || ""));
    const headerEventId = clean(request.headers.get("x-henry-event-id"));
    const rawBody = await request.text();

    if (!timestamp || !signature || !isFreshTimestamp(timestamp)) {
      return NextResponse.json({ error: "Invalid webhook timestamp or signature headers" }, { status: 401 });
    }

    const expected = crypto
      .createHmac("sha256", signingSecret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

    if (!safeEqualHex(expected, signature)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = JSON.parse(rawBody) as Record<string, unknown>;
    const { event, user_id, data } = body;
    const payload = asObject(data);
    const eventName = clean(event);
    const userId = clean(user_id);
    const eventId = headerEventId || clean(body.event_id) || `${eventName}:${userId}:${timestamp}`;

    if (!eventName || !userId) {
      return NextResponse.json({ error: "event and user_id required" }, { status: 400 });
    }

    if (await alreadyProcessedEvent(eventId)) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const admin = createAdminSupabase();

    // Get user profile for email
    const { data: profile } = await admin
      .from("customer_profiles")
      .select("full_name, email")
      .eq("id", userId)
      .maybeSingle();

    const email = profile?.email;
    const name = profile?.full_name || "";

    switch (eventName) {
      case "account.welcome": {
        if (email) await sendAccountEmail(email, welcomeEmail(name));
        break;
      }
      case "security.alert": {
        if (email) {
          await sendAccountEmail(
            email,
            securityAlertEmail(clean(payload.event_name) || "Security event", clean(payload.details) || "")
          );
        }
        await logSecurityEvent({
          userId,
          eventType: clean(payload.event_name) || eventName,
          ipAddress: clean(payload.ip) || null,
          userAgent: clean(payload.user_agent) || null,
          locationSummary: clean(payload.location) || null,
          metadata: {
            source: "account_webhook",
            details: clean(payload.details) || null,
            rawEvent: eventName,
            severity: clean(payload.severity) || null,
            webhookEventId: eventId,
          },
        });
        break;
      }
      case "wallet.funded": {
        if (email) {
          await sendAccountEmail(
            email,
            walletFundedEmail(name, asNumber(payload.amount_naira), asNumber(payload.new_balance_naira))
          );
        }
        break;
      }
      case "activity.log": {
        await admin.from("customer_activity").insert({
          user_id: userId,
          division: clean(payload.division) || "account",
          activity_type: clean(payload.activity_type) || "event",
          title: clean(payload.title) || "Activity",
          description: clean(payload.description) || null,
          status: clean(payload.status) || null,
          reference_type: clean(payload.reference_type) || null,
          reference_id: clean(payload.reference_id) || null,
          amount_kobo: asNumber(payload.amount_kobo, 0) || null,
          action_url: clean(payload.action_url) || null,
        });
        break;
      }
      case "notification.send": {
        await admin.from("customer_notifications").insert({
          user_id: userId,
          title: clean(payload.title) || "Notification",
          body: clean(payload.body) || "",
          category: clean(payload.category) || "general",
          priority: clean(payload.priority) || "normal",
          action_url: clean(payload.action_url) || null,
          division: clean(payload.division) || null,
        });
        break;
      }
      default:
        return NextResponse.json({ error: `Unknown event: ${eventName}` }, { status: 400 });
    }

    await recordWebhookReceipt({
      eventId,
      eventName,
      userId,
      signatureValid: true,
      payloadHash: crypto.createHash("sha256").update(rawBody).digest("hex"),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[webhook] Account webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
