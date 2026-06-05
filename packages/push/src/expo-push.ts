import type { PushPayload, SendResult, StoredSubscription } from "./types";

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

type ExpoTicket = {
  status?: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
};

/**
 * Send one native push via the Expo Push API. Maps `DeviceNotRegistered` to
 * `dead` (the token is gone — uninstalled / disabled) so the dispatcher prunes
 * it; network/HTTP/other errors are transient. No SDK dependency — a plain POST.
 */
export async function sendExpoPush(
  sub: StoredSubscription,
  payload: PushPayload,
): Promise<SendResult> {
  if (!sub.expoToken) {
    return { ok: false, dead: true, error: "missing_expo_token" };
  }

  try {
    const response = await fetch(EXPO_PUSH_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify([
        {
          to: sub.expoToken,
          title: payload.title,
          body: payload.body ?? "",
          data: { url: payload.url ?? "/", ...(payload.data ?? {}) },
          priority: "high",
          sound: "default",
          channelId: "default",
        },
      ]),
    });

    if (!response.ok) {
      return { ok: false, dead: false, error: `expo_http_${response.status}` };
    }

    const json = (await response.json()) as { data?: ExpoTicket[] };
    const ticket = json.data?.[0];
    if (ticket?.status === "ok") {
      return { ok: true, providerMessageId: ticket.id ?? null };
    }
    const expoError = ticket?.details?.error;
    const dead = expoError === "DeviceNotRegistered";
    return { ok: false, dead, error: expoError ?? ticket?.message ?? "expo_error" };
  } catch (error) {
    return {
      ok: false,
      dead: false,
      error: error instanceof Error ? error.message : "expo_send_failed",
    };
  }
}
