/**
 * @henryco/rooms/providers/daily — Daily.co driver.
 *
 * Server-side room creation, signed-token issuance, recording start/stop.
 * No candidate sign-up required: participants join via signed join token
 * URLs that Daily honours for the room's lifetime.
 *
 * Why no @daily-co/daily-js SDK import here: the driver makes plain HTTPS
 * calls against `https://api.daily.co/v1/*` so the package does not
 * inflate the host-app bundle with an SDK that's only needed in the
 * client iframe (which Daily serves directly from prebuilt JS at
 * `daily.co/static/*`). The room iframe is mounted in `<RoomShell>`
 * via a plain `<iframe src={joinUrl} />` — no SDK needed there either.
 *
 * Env vars consumed (see audit §6.1.14):
 *   - DAILY_API_KEY (S)     — Daily REST API key. Required.
 *   - DAILY_DOMAIN (S)      — `your-subdomain.daily.co` value.
 *     Used to construct the join URL host. Required.
 *   - NEXT_PUBLIC_DAILY_DOMAIN (C) — same value mirrored client-side for
 *     iframe src construction; the driver does NOT read this — the UI
 *     primitive does.
 */

import "server-only";

import type {
  ParticipantRole,
  ProviderDriver,
  RoomKind,
} from "../types";

const DAILY_API_BASE = "https://api.daily.co/v1";

/**
 * The shape Daily's REST API returns for `POST /rooms`. We only model
 * the fields we read; Daily returns more but they're not relevant to
 * the driver.
 */
type DailyRoomResponse = {
  id: string;
  name: string;
  url: string;
  config?: Record<string, unknown>;
};

/**
 * Daily's meeting-token response. The `token` is a JWT the participant
 * appends as `?t=<token>` (or sends via the iframe `meetingToken` param)
 * to the room URL.
 */
type DailyMeetingTokenResponse = {
  token: string;
};

export type DailyDriverConfig = {
  apiKey: string;
  domain: string;
  /** Override the API base — useful for the test harness. */
  apiBase?: string;
  /** Custom fetch — for tests + lambda runtimes that need polyfills. */
  fetchImpl?: typeof fetch;
};

/**
 * Build a Daily.co driver instance bound to the supplied credentials.
 *
 * The driver returned here implements `ProviderDriver`. The provider
 * selector instantiates it lazily — drivers are not created at module
 * load so a missing env var doesn't crash an unrelated import path.
 */
export function createDailyDriver(config: DailyDriverConfig): ProviderDriver {
  const apiKey = config.apiKey;
  const domain = config.domain.replace(/\.daily\.co$/i, "");
  const apiBase = config.apiBase ?? DAILY_API_BASE;
  const fetchImpl = config.fetchImpl ?? fetch;

  async function callDaily<T>(
    path: string,
    init: RequestInit & { json?: unknown },
  ): Promise<T> {
    const headers: Record<string, string> = {
      authorization: `Bearer ${apiKey}`,
      accept: "application/json",
      ...(init.headers as Record<string, string> | undefined),
    };
    let body = init.body;
    if (init.json !== undefined) {
      headers["content-type"] = "application/json";
      body = JSON.stringify(init.json);
    }
    const response = await fetchImpl(`${apiBase}${path}`, {
      ...init,
      headers,
      body,
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new DailyApiError(
        response.status,
        `Daily API ${response.status} on ${path}: ${text || response.statusText}`,
      );
    }
    return (await response.json()) as T;
  }

  return {
    provider: "daily",

    async createRoom({ kind, sessionId, scheduledAt, options }) {
      // Daily room name: stable per session id so a re-create on retry
      // is idempotent (Daily returns 409 on duplicate names, which we
      // intercept and treat as success).
      const name = roomNameForSession(sessionId);
      const exp = scheduledAt
        ? Math.floor(new Date(scheduledAt).getTime() / 1000) + 60 * 60 * 24
        : Math.floor(Date.now() / 1000) + 60 * 60 * 24;

      // Map our internal kind to Daily room config flags.
      const dailyConfig = buildDailyRoomConfig(kind, exp, options);

      let room: DailyRoomResponse;
      try {
        room = await callDaily<DailyRoomResponse>("/rooms", {
          method: "POST",
          json: { name, properties: dailyConfig },
        });
      } catch (err) {
        // 409 = room already exists. Re-fetch and return its url.
        if (err instanceof DailyApiError && err.status === 409) {
          room = await callDaily<DailyRoomResponse>(`/rooms/${name}`, {
            method: "GET",
          });
        } else {
          throw err;
        }
      }

      const joinUrl = room.url ?? `https://${domain}.daily.co/${name}`;

      return {
        providerRoomId: name,
        joinUrl,
      };
    },

    async issueJoinToken({ providerRoomId, userId, displayName, role, ttlSeconds }) {
      const exp = Math.floor(Date.now() / 1000) + (ttlSeconds ?? 3600);
      const isOwner = role === "host" || role === "interviewer" || role === "operator";

      const token = await callDaily<DailyMeetingTokenResponse>("/meeting-tokens", {
        method: "POST",
        json: {
          properties: {
            room_name: providerRoomId,
            user_id: userId,
            user_name: displayName,
            is_owner: isOwner,
            exp,
            // `enable_screenshare` is granted to everyone by default in
            // the room config; we don't override per-token.
            // Recording start is gated on the owner role inside the
            // room — the meeting-token's `enable_recording` would
            // permit cloud recording start; we set it per recording
            // role in `startRecording` via a separate /recordings call,
            // so we keep the token minimal here.
          },
        },
      });

      return {
        joinToken: token.token,
        expiresAt: new Date(exp * 1000).toISOString(),
      };
    },

    async startRecording({ providerRoomId }) {
      // Daily cloud recording is started via /recordings/start. The
      // endpoint returns a `recordingId` we persist in
      // `rooms_recordings.provider_recording_id`. The recording url +
      // expiry come back via webhook (consumer wires the webhook in
      // their app's /api/webhooks/daily/* route — out of Wave A2 scope).
      const result = await callDaily<{ id: string }>(`/recordings/start`, {
        method: "POST",
        json: { room_name: providerRoomId },
      });
      return { providerRecordingId: result.id };
    },

    async stopRecording({ providerRoomId, providerRecordingId }) {
      // Daily's stop endpoint takes the room name; the recording id is
      // included for audit clarity. Returns an empty body on success.
      await callDaily(`/recordings/stop`, {
        method: "POST",
        json: { room_name: providerRoomId, recording_id: providerRecordingId },
      });
      // The final URL + expiry arrive via webhook. The server action
      // persists what the webhook provides; here we return what we know.
      return {};
    },

    async endRoom({ providerRoomId }) {
      // Daily's eject-all endpoint kicks every participant. Room itself
      // can stay (will time out) or be deleted; we leave it so a brief
      // network reconnect doesn't 404 a slow-leaving participant.
      await callDaily(`/rooms/${providerRoomId}/presence/eject`, {
        method: "POST",
        json: {},
      });
    },
  };
}

/**
 * Map a HenryCo room kind onto Daily.co room config. We keep this map
 * close to the driver so a future provider-specific tweak (e.g. enabling
 * live captions for academy_class) is a one-file change.
 *
 * Defaults applied to every kind:
 *   - exp: 24h after creation OR scheduledAt+24h (rooms auto-expire)
 *   - max_participants: 50 (well above any consumer's expected use)
 *   - enable_chat: true (we render our own chat in <RoomChat>, but
 *     Daily's in-iframe chat is a useful fallback when the host page
 *     hides our chat panel)
 *   - enable_screenshare: true
 *
 * Per-kind overrides:
 *   - jobs_interview: enable_recording on by default (consent flow gates)
 *   - academy_class: enable_recording on by default
 *   - property_tour: smaller max_participants (10) — touring is intimate
 */
function buildDailyRoomConfig(
  kind: RoomKind,
  exp: number,
  options?: Record<string, unknown>,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    exp,
    max_participants: 50,
    enable_chat: true,
    enable_screenshare: true,
    enable_network_ui: true,
    enable_prejoin_ui: true,
  };

  if (kind === "jobs_interview" || kind === "academy_class") {
    base.enable_recording = "cloud";
    base.enable_transcription_storage = false; // consumer-side opt-in
  }

  if (kind === "property_tour") {
    base.max_participants = 10;
  }

  // Allow caller to override anything (Wave-B/C consumer can fine-tune
  // per-room).
  return { ...base, ...(options ?? {}) };
}

/**
 * Stable Daily room name for a session id. Daily room names must match
 * `[a-zA-Z0-9_-]+`; our session ids are uuids — we replace the dashes
 * with underscores to satisfy the regex while keeping the mapping
 * 1:1 reversible.
 *
 * Length budget: Daily allows up to 41 chars; uuid (32 hex + 4 dashes
 * = 36) fits comfortably.
 */
function roomNameForSession(sessionId: string): string {
  return `hc_${sessionId.replace(/-/g, "_")}`;
}

/**
 * Typed Daily REST API error — the driver throws this on non-2xx so
 * the server action can branch on `err.status` to issue the correct
 * `RoomError` (rate_limited at 429, provider_unavailable on 5xx).
 */
export class DailyApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "DailyApiError";
    this.status = status;
  }
}
