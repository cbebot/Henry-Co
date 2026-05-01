import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { normalizeLocale } from "@henryco/i18n/server";
import { publishNotification, type Division } from "@henryco/notifications";
import { createAdminSupabase } from "@/lib/supabase";

const KNOWN_DIVISIONS: ReadonlySet<Division> = new Set([
  "hub",
  "account",
  "staff",
  "care",
  "marketplace",
  "property",
  "logistics",
  "jobs",
  "learn",
  "studio",
  "security",
  "system",
]);

function normalizeDivision(value: string | null | undefined, fallback: Division = "account"): Division {
  const lowered = String(value || "").trim().toLowerCase();
  return KNOWN_DIVISIONS.has(lowered as Division) ? (lowered as Division) : fallback;
}
import { sendAccountEmail } from "@/lib/email/send";
import { welcomeEmail, securityAlertEmail, walletFundedEmail } from "@/lib/email/templates";
import {
  buildNotificationLocalization,
  resolveNotificationPresentation,
} from "@/lib/notification-localization";
import { logSecurityEvent } from "@/lib/security-events";
import { qualifyReferralsByReferee } from "@/lib/referral-data";

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

    // Get user profile + preferences in parallel
    const [{ data: profile }, { data: prefs }] = await Promise.all([
      admin
        .from("customer_profiles")
        .select("full_name, email, language")
        .eq("id", userId)
        .maybeSingle(),
      admin
        .from("customer_preferences")
        .select("email_transactional, email_marketing, push_enabled, whatsapp_enabled")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const email = profile?.email;
    const name = profile?.full_name || "";
    const preferredLocale = normalizeLocale(clean(payload.locale) || profile?.language || "en");
    const emailTransactional = prefs?.email_transactional !== false;
    const emailProvider = clean(process.env.EMAIL_PROVIDER) || "resend";

    async function logEmailDelivery(templateKey: string, sent: boolean, category: string) {
      try {
        await admin.from("notification_delivery_log" as never).insert({
          user_id: userId,
          channel: "email",
          provider: emailProvider,
          status: sent ? "sent" : "failed",
          division: "account",
          category,
          event_name: eventName,
          metadata: { templateKey, eventId },
        } as never);
      } catch {
        // delivery log is non-critical — never fail the webhook for a log error
      }
    }

    switch (eventName) {
      case "account.welcome": {
        // Welcome email is transactional — respect email_transactional preference
        if (email && emailTransactional) {
          const sent = await sendAccountEmail(email, welcomeEmail(name, preferredLocale));
          await logEmailDelivery("welcome", sent, "account");
        }
        break;
      }
      case "security.alert": {
        // Security alerts are mandatory — bypass preference gate
        if (email) {
          const sent = await sendAccountEmail(
            email,
            securityAlertEmail(
              clean(payload.event_name) || "Security event",
              clean(payload.details) || "",
              preferredLocale,
            )
          );
          await logEmailDelivery("security_alert", sent, "security");
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
        // Wallet emails are transactional — respect preference
        if (email && emailTransactional) {
          const sent = await sendAccountEmail(
            email,
            walletFundedEmail(
              name,
              asNumber(payload.amount_naira),
              asNumber(payload.new_balance_naira),
              preferredLocale,
            )
          );
          await logEmailDelivery("wallet_funded", sent, "wallet");
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
        const fallbackTitle = clean(payload.title) || "Notification";
        const fallbackBody = clean(payload.body) || "";
        const messageKey = clean(payload.message_key);
        const localization = messageKey
          ? buildNotificationLocalization({
              key: messageKey,
              locale: preferredLocale,
              params: asObject(payload.message_params),
              renderedTitle: fallbackTitle,
              renderedBody: fallbackBody,
            })
          : null;
        const localizedNotification = localization
          ? resolveNotificationPresentation({
              row: {
                title: fallbackTitle,
                body: fallbackBody,
                detail_payload: { localization },
              },
              locale: preferredLocale,
            })
          : { title: fallbackTitle, body: fallbackBody };
        const priority = clean(payload.priority).toLowerCase();
        const severity =
          priority === "high" || priority === "urgent" || priority === "critical"
            ? "urgent"
            : priority === "warning"
              ? "warning"
              : priority === "success"
                ? "success"
                : priority === "security"
                  ? "security"
                  : "info";
        const publishResult = await publishNotification({
          userId,
          division: normalizeDivision(clean(payload.division), "account"),
          eventType: "system.notification.relay",
          severity,
          title: localizedNotification.title,
          body: localizedNotification.body,
          deepLink: clean(payload.action_url) || "/account",
          publisher: `webhook:${eventName}:${eventId}`,
          requestId: eventId,
        });
        if (!publishResult.ok) {
          // Validation failures still return 200 to the webhook caller —
          // the upstream replay logic does not benefit from a retry on a
          // payload-shape error.
          if (publishResult.error !== "validation" && publishResult.error !== "rate_limited") {
            return NextResponse.json(
              { error: `relay publish failed: ${publishResult.error}` },
              { status: 500 },
            );
          }
        }
        break;
      }
      case "referral.qualify": {
        // Another HenryCo app (marketplace, care, property, etc.) is
        // signalling that `user_id` has completed a qualifying transaction.
        // Qualify any outstanding converted referrals so the reward unlocks.
        const reason =
          clean(payload.reason) || `${clean(payload.division) || "order"}_paid`;
        await qualifyReferralsByReferee(userId, { reason });
        break;
      }
      case "support.staff_reply": {
        // Emitted by staff/hub when a staff member replies to a customer support thread.
        // Routes through the shim with the support.reply.received event type.
        const threadId = clean(payload.thread_id);
        const subject = clean(payload.subject) || "your request";
        if (!threadId) break;

        const localization = buildNotificationLocalization({
          key: "support.reply.received",
          locale: preferredLocale,
          params: { subject },
          renderedTitle: "Support reply received",
          renderedBody: `A reply has been added to your request "${subject}".`,
        });
        const localizedNotification = resolveNotificationPresentation({
          row: {
            title: "Support reply received",
            body: `A reply has been added to your request "${subject}".`,
            detail_payload: { localization },
          },
          locale: preferredLocale,
        });
        const publishResult = await publishNotification({
          userId,
          division: normalizeDivision(clean(payload.division), "account"),
          eventType: "support.reply.received",
          severity: "info",
          title: localizedNotification.title,
          body: localizedNotification.body,
          deepLink: `/support/${threadId}`,
          relatedType: "support_thread",
          relatedId: threadId,
          publisher: `webhook:${eventName}:${eventId}`,
          requestId: eventId,
        });
        if (!publishResult.ok) {
          if (publishResult.error !== "validation" && publishResult.error !== "rate_limited") {
            return NextResponse.json(
              { error: `relay publish failed: ${publishResult.error}` },
              { status: 500 },
            );
          }
        }
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
