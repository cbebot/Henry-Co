import { resolveAdminClient } from "./admin";
import type { DeliveryLogEntry, StoredSubscription } from "./types";

const FAILURE_REVOKE_THRESHOLD = 10;

type Row = {
  id: string;
  user_id: string;
  channel: "web" | "expo";
  endpoint: string | null;
  p256dh: string | null;
  auth: string | null;
  expo_token: string | null;
  device_id: string | null;
};

function mapRow(row: Row): StoredSubscription {
  return {
    id: row.id,
    userId: row.user_id,
    channel: row.channel,
    endpoint: row.endpoint,
    p256dh: row.p256dh,
    auth: row.auth,
    expoToken: row.expo_token,
    deviceId: row.device_id,
  };
}

const SELECT_COLS = "id,user_id,channel,endpoint,p256dh,auth,expo_token,device_id";

/** Active (non-revoked) subscriptions for a user — the dispatch fan-out target. */
export async function listActiveSubscriptions(userId: string): Promise<StoredSubscription[]> {
  const resolved = resolveAdminClient();
  if (!resolved.ok) return [];
  const { data } = await resolved.client
    .from("push_subscriptions")
    .select(SELECT_COLS)
    .eq("user_id", userId)
    .is("revoked_at", null);
  return ((data as Row[] | null) ?? []).map(mapRow);
}

/** Revoke a permanently-dead credential so it is never tried again. */
export async function pruneSubscription(id: string, reason: string): Promise<void> {
  const resolved = resolveAdminClient();
  if (!resolved.ok) return;
  await resolved.client
    .from("push_subscriptions")
    .update({ revoked_at: new Date().toISOString(), failure_count: 0 } as never)
    .eq("id", id)
    .is("revoked_at", null);
  void reason;
}

/**
 * Bump failure_count on a transient (non-dead) failure; auto-revoke once a
 * credential has failed enough times that it is effectively dead. Best-effort
 * read-modify-write — a lost increment under a rare race just delays cleanup.
 */
export async function recordFailure(id: string): Promise<void> {
  const resolved = resolveAdminClient();
  if (!resolved.ok) return;
  const { data } = await resolved.client
    .from("push_subscriptions")
    .select("failure_count")
    .eq("id", id)
    .maybeSingle();
  const next = ((data as { failure_count?: number } | null)?.failure_count ?? 0) + 1;
  if (next >= FAILURE_REVOKE_THRESHOLD) {
    await resolved.client
      .from("push_subscriptions")
      .update({ failure_count: next, revoked_at: new Date().toISOString() } as never)
      .eq("id", id);
    return;
  }
  await resolved.client
    .from("push_subscriptions")
    .update({ failure_count: next } as never)
    .eq("id", id);
}

/** Write one push delivery attempt to the shared notification delivery log. */
export async function logPushDelivery(entry: DeliveryLogEntry): Promise<void> {
  const resolved = resolveAdminClient();
  if (!resolved.ok) return;
  await resolved.client.from("notification_delivery_log").insert({
    user_id: entry.userId,
    notification_id: entry.notificationId,
    channel: entry.channel,
    provider: entry.provider,
    status: entry.status,
    provider_message_id: entry.providerMessageId ?? null,
    error_message: entry.errorMessage ?? null,
    division: entry.division,
    metadata: {},
  } as never);
}

// ── registration ────────────────────────────────────────────────────────────

export type WebSubscriptionInput = {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  deviceId?: string | null;
  uaSummary?: string | null;
};

/**
 * Register (or reactivate) a Web Push subscription. Reactivate-or-insert keeps a
 * single ACTIVE row per (user, endpoint) — re-subscribing on a device updates
 * its keys + un-revokes rather than duplicating.
 */
export async function registerWebSubscription(input: WebSubscriptionInput): Promise<void> {
  const resolved = resolveAdminClient();
  if (!resolved.ok) return;
  const now = new Date().toISOString();
  const { data: active } = await resolved.client
    .from("push_subscriptions")
    .select("id")
    .eq("user_id", input.userId)
    .eq("endpoint", input.endpoint)
    .is("revoked_at", null)
    .limit(1)
    .maybeSingle();

  if ((active as { id?: string } | null)?.id) {
    await resolved.client
      .from("push_subscriptions")
      .update({
        p256dh: input.p256dh,
        auth: input.auth,
        device_id: input.deviceId ?? null,
        ua_summary: input.uaSummary ?? null,
        last_used_at: now,
        failure_count: 0,
      } as never)
      .eq("id", (active as { id: string }).id);
    return;
  }

  await resolved.client.from("push_subscriptions").insert({
    user_id: input.userId,
    channel: "web",
    endpoint: input.endpoint,
    p256dh: input.p256dh,
    auth: input.auth,
    device_id: input.deviceId ?? null,
    ua_summary: input.uaSummary ?? null,
  } as never);
}

export type ExpoTokenInput = {
  userId: string;
  expoToken: string;
  deviceId?: string | null;
  uaSummary?: string | null;
};

/** Register (or reactivate) a native Expo push token. */
export async function registerExpoToken(input: ExpoTokenInput): Promise<void> {
  const resolved = resolveAdminClient();
  if (!resolved.ok) return;
  const now = new Date().toISOString();
  const { data: active } = await resolved.client
    .from("push_subscriptions")
    .select("id")
    .eq("user_id", input.userId)
    .eq("expo_token", input.expoToken)
    .is("revoked_at", null)
    .limit(1)
    .maybeSingle();

  if ((active as { id?: string } | null)?.id) {
    await resolved.client
      .from("push_subscriptions")
      .update({
        device_id: input.deviceId ?? null,
        ua_summary: input.uaSummary ?? null,
        last_used_at: now,
        failure_count: 0,
      } as never)
      .eq("id", (active as { id: string }).id);
    return;
  }

  await resolved.client.from("push_subscriptions").insert({
    user_id: input.userId,
    channel: "expo",
    expo_token: input.expoToken,
    device_id: input.deviceId ?? null,
    ua_summary: input.uaSummary ?? null,
  } as never);
}

/** Owner-initiated removal (the /security "remove this device" control). */
export async function revokeSubscription(userId: string, id: string): Promise<void> {
  const resolved = resolveAdminClient();
  if (!resolved.ok) return;
  await resolved.client
    .from("push_subscriptions")
    .update({ revoked_at: new Date().toISOString() } as never)
    .eq("id", id)
    .eq("user_id", userId);
}

export async function revokeWebSubscriptionByEndpoint(
  userId: string,
  endpoint: string,
): Promise<void> {
  const resolved = resolveAdminClient();
  if (!resolved.ok) return;
  await resolved.client
    .from("push_subscriptions")
    .update({ revoked_at: new Date().toISOString() } as never)
    .eq("user_id", userId)
    .eq("endpoint", endpoint)
    .is("revoked_at", null);
}
