/**
 * @henryco/rooms/providers/jitsi — Jitsi driver (no-account fallback).
 *
 * Public Jitsi instance (meet.jit.si) or self-hosted via
 * `NEXT_PUBLIC_JITSI_DOMAIN`. Token-based JWT auth is optional and only
 * activated when the host configures `JITSI_APP_ID` + `JITSI_APP_SECRET`.
 *
 * Why this is the fallback (not the primary):
 *   - No server-side recording API on the public instance — recording
 *     is browser-local for the moderator (`startRecording` returns a
 *     no-op so the UI can keep the affordance hidden).
 *   - No per-participant identity guarantee without JWT.
 *   - Lower video quality + reliability at scale vs Daily.
 *
 * Why it is the fallback (rather than failing):
 *   - Zero env required at minimum — `NEXT_PUBLIC_JITSI_DOMAIN` defaults
 *     to `meet.jit.si` if absent. Owner can ship a working room flow
 *     without a Daily.co account.
 *   - When `JITSI_APP_ID` + `JITSI_APP_SECRET` are present, the driver
 *     issues signed JWTs that pin room access + identity.
 *
 * Env vars consumed (see audit §6.1.14):
 *   - NEXT_PUBLIC_JITSI_DOMAIN (C) — Jitsi instance hostname.
 *     Defaults to `meet.jit.si` if absent.
 *   - JITSI_APP_ID (S) — Optional JWT issuer id.
 *   - JITSI_APP_SECRET (S) — Optional HS256 signing secret.
 */

import "server-only";

import { createHmac } from "node:crypto";

import type {
  ParticipantRole,
  ProviderDriver,
  RoomKind,
} from "../types";

export type JitsiDriverConfig = {
  /** Jitsi instance hostname, e.g. `meet.jit.si` or `jitsi.henrycogroup.com`. */
  domain: string;
  /** Optional JWT issuer. When set with `appSecret`, tokens are signed. */
  appId?: string | null;
  /** Optional JWT signing secret (HS256). */
  appSecret?: string | null;
};

/**
 * Build a Jitsi driver instance bound to the supplied config.
 *
 * Jitsi requires no server-side room creation — the room exists once
 * someone joins the URL — so `createRoom` is effectively a URL builder
 * with a stable, hard-to-guess slug.
 */
export function createJitsiDriver(config: JitsiDriverConfig): ProviderDriver {
  const domain = config.domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const appId = config.appId ?? null;
  const appSecret = config.appSecret ?? null;

  return {
    provider: "jitsi",

    async createRoom({ kind, sessionId }) {
      const room = roomNameForSession(sessionId, kind);
      const joinUrl = `https://${domain}/${room}`;
      return Promise.resolve({
        providerRoomId: room,
        joinUrl,
      });
    },

    async issueJoinToken({ providerRoomId, userId, displayName, role, ttlSeconds }) {
      const ttl = ttlSeconds ?? 3600;
      const expSeconds = Math.floor(Date.now() / 1000) + ttl;

      // No JWT path: return the room URL with the display name encoded
      // as a fragment param (Jitsi recognises `#userInfo.displayName`).
      if (!appId || !appSecret) {
        // The "token" is really the room URL plus the prejoin params —
        // the consumer concats it into the iframe src directly.
        const params = new URLSearchParams({
          "userInfo.displayName": displayName,
          "userInfo.email": "",
        });
        return Promise.resolve({
          joinToken: `#${params.toString()}`,
          expiresAt: new Date(expSeconds * 1000).toISOString(),
        });
      }

      // JWT path: HS256-signed token. Jitsi expects:
      //   { iss: appId, aud: "jitsi", sub: domain, room, context: {...} }
      const isModerator =
        role === "host" || role === "interviewer" || role === "operator";

      const header = base64UrlJson({ alg: "HS256", typ: "JWT" });
      const payload = base64UrlJson({
        iss: appId,
        aud: "jitsi",
        sub: domain,
        room: providerRoomId,
        exp: expSeconds,
        nbf: Math.floor(Date.now() / 1000) - 30,
        context: {
          user: {
            id: userId,
            name: displayName,
            moderator: isModerator,
          },
          features: {
            recording: isModerator ? "true" : "false",
            "screen-sharing": "true",
            "live-streaming": "false",
            "outbound-call": "false",
            transcription: "false",
          },
        },
      });
      const signingInput = `${header}.${payload}`;
      const signature = base64Url(
        createHmac("sha256", appSecret).update(signingInput).digest(),
      );
      const jwt = `${signingInput}.${signature}`;
      return Promise.resolve({
        joinToken: jwt,
        expiresAt: new Date(expSeconds * 1000).toISOString(),
      });
    },

    // Recording on the public Jitsi instance is browser-local for the
    // moderator — no server-side hook. We intentionally omit
    // `startRecording` / `stopRecording`; the server action's optional
    // call falls through and the UI hides the affordance via the
    // `provider === "jitsi"` branch.

    async endRoom() {
      // Jitsi has no server-side end-room call. The room dissolves once
      // every participant leaves. The server action marks the session
      // `ended` in DB; the UI tells participants to leave.
      return Promise.resolve();
    },
  };
}

/**
 * Stable, hard-to-guess Jitsi room name. Jitsi room names are
 * shareable URLs — without JWT auth, anyone with the URL can join. We
 * embed the session id so a leak is bounded to that session only.
 *
 * Prefix `HenryCo` to namespace the room within the public instance
 * (helps the moderator recognise their room in the Jitsi recent-rooms
 * list).
 */
function roomNameForSession(sessionId: string, kind: RoomKind): string {
  return `HenryCo-${kind}-${sessionId.replace(/-/g, "")}`;
}

/**
 * URL-safe base64 — Jitsi JWT uses standard JWT encoding.
 */
function base64Url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlJson(value: unknown): string {
  return base64Url(JSON.stringify(value));
}
