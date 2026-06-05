import webpush from "web-push";

import { getVapidConfig } from "./config";
import type { PushPayload, SendResult, StoredSubscription } from "./types";

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;
  const vapid = getVapidConfig();
  if (!vapid) return false;
  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
  configured = true;
  return true;
}

/**
 * Send one encrypted Web Push (RFC 8291) message. Maps the push service's
 * permanent-gone statuses (404 Not Found, 410 Gone) to `dead` so the dispatcher
 * prunes the subscription; everything else is a transient failure to retry next
 * time. When VAPID isn't configured the web channel degrades to a no-op (native
 * + email still deliver) rather than throwing.
 */
export async function sendWebPush(
  sub: StoredSubscription,
  payload: PushPayload,
): Promise<SendResult> {
  if (!ensureConfigured()) {
    return { ok: false, dead: false, error: "vapid_not_configured" };
  }
  if (!sub.endpoint || !sub.p256dh || !sub.auth) {
    return { ok: false, dead: true, error: "incomplete_web_subscription" };
  }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body ?? "",
    url: payload.url ?? "/",
    tag: payload.tag,
    data: payload.data ?? {},
  });

  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      body,
      { TTL: 60 * 60 * 24, headers: { Urgency: "high" } },
    );
    return { ok: true, providerMessageId: null };
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    const dead = statusCode === 404 || statusCode === 410;
    return { ok: false, dead, error: `web_push_${statusCode ?? "error"}` };
  }
}

/** Test/hot-reload reset of the one-time VAPID configuration. */
export function _resetWebPushForTests(): void {
  configured = false;
}
