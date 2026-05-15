/**
 * @henryco/rooms — public type surface.
 *
 * Client-safe — no Supabase imports, no `server-only` directive. The
 * types here cross the server/client boundary freely (server actions
 * return them; client hooks consume them; UI primitives render them).
 *
 * Source of truth: this file. The schema is shadowed in SQL at
 * `apps/hub/supabase/migrations/<TS>_rooms_*.sql`; the two MUST agree.
 */

/**
 * The seven canonical room kinds, mirrored by the CHECK constraint on
 * `rooms_sessions.kind` and the consumption matrix in
 * `docs/audit/dashboard-rebuild-audit.md` §4.1.
 *
 * Every portal consumes exactly one or two of these — never invents
 * a new kind without updating both the SQL constraint and this union.
 */
export type RoomKind =
  | "care_consult"
  | "marketplace_dispute"
  | "studio_review"
  | "academy_class"
  | "logistics_call"
  | "property_tour"
  | "jobs_interview";

/**
 * The two provider drivers Wave A2 ships. `daily` is the primary;
 * `jitsi` is the no-account fallback. `mux` is reserved for future
 * Academy live-class use; it is out of Wave A2 scope per audit §4.2.
 */
export type RoomProvider = "daily" | "jitsi";

/**
 * Lifecycle states for `rooms_sessions.status`. Mirrors the SQL CHECK
 * constraint. Transitions are owner-controlled — the server actions
 * advance the state machine in one direction only:
 *   scheduled → live → ended
 *   scheduled → cancelled
 */
export type RoomStatus = "scheduled" | "live" | "ended" | "cancelled";

/**
 * Participant roles. Generic across kinds — the consumer surface
 * (Care vs Jobs vs Studio) decides which roles to surface. Wave C
 * (Jobs) uses {`host`, `candidate`, `interviewer`, `observer`}.
 * Care + Logistics use {`operator`, `customer`}. Studio + Property
 * tours use {`host`, `customer`, `observer`}.
 */
export type ParticipantRole =
  | "host"
  | "candidate"
  | "interviewer"
  | "observer"
  | "customer"
  | "operator";

/**
 * One row from `rooms_sessions`. The `provider_room_id` is the opaque
 * id the provider issued (Daily.co room name, Jitsi room slug). The
 * `metadata` jsonb is consumer-defined: Jobs stores `{ jobId,
 * applicationId, scorecardId }`; Care stores `{ bookingId }`; etc.
 */
export type RoomSession = {
  id: string;
  kind: RoomKind;
  provider: RoomProvider;
  /** Provider-side opaque room identifier (Daily room name / Jitsi room slug). */
  providerRoomId: string | null;
  scheduledAt: string | null;
  joinedAt: string | null;
  endedAt: string | null;
  status: RoomStatus;
  ownerUserId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

/**
 * One row from `rooms_participants`. `userId` references `auth.users`.
 * `handRaised` is a presence flag — toggled by the participant from
 * the room UI; broadcast via realtime.
 */
export type RoomParticipant = {
  id: string;
  sessionId: string;
  userId: string;
  role: ParticipantRole;
  joinedAt: string | null;
  leftAt: string | null;
  handRaised: boolean;
  createdAt: string;
};

/**
 * One row from `rooms_recordings_consent`. The `consentTextVersion`
 * pins the exact text the user agreed to — required so a future copy
 * change does not retroactively re-consent users.
 */
export type RoomConsent = {
  id: string;
  sessionId: string;
  userId: string;
  grantedAt: string | null;
  withdrewAt: string | null;
  consentTextVersion: string;
  createdAt: string;
};

/**
 * One row from `rooms_recordings`. Inserted by service role only —
 * the provider webhook handler (out of Wave A2 scope; consumers wire
 * their own webhook in Wave B/C) populates `url` + `expiresAt` after
 * the provider finalises the recording. `transcriptUrl` is optional
 * and may be populated by a follow-up pass.
 */
export type RoomRecording = {
  id: string;
  sessionId: string;
  providerRecordingId: string | null;
  url: string | null;
  expiresAt: string | null;
  transcriptUrl: string | null;
  createdAt: string;
};

/**
 * Scorecard dimensions — JSON-driven so each consumer (Jobs vs Studio
 * vs Care peer-review) defines its own shape. The default scaffold the
 * `<ScorecardSidebar>` ships matches the audit §4.3 spec:
 *   `{ technical: 0-5, communication: 0-5, culture: 0-5, recommendation }`
 *
 * Wave C extends this for Jobs interviews; Studio review pass extends
 * for collab review with `{ visual: 0-5, polish: 0-5, brief_match: 0-5 }`.
 */
export type ScorecardDimensions = Record<string, number | string | boolean>;

export type RoomScorecard = {
  id: string;
  sessionId: string;
  reviewerUserId: string;
  dimensions: ScorecardDimensions;
  notesMd: string | null;
  submittedAt: string | null;
  createdAt: string;
};

/**
 * One in-room chat attachment. Mirrors `@henryco/chat-composer`'s
 * `ComposerAttachment` shape on the wire so the composer can hand a
 * payload to `sendRoomMessage` without translation. Cloudinary-hosted
 * by convention; the package does NOT bake in a hosting provider.
 */
export type RoomAttachment = {
  id: string;
  url: string;
  contentType: string;
  bytes: number;
  filename: string;
  /** Optional thumbnail URL for image/video previews. */
  thumbnailUrl?: string;
};

/**
 * One row from `rooms_messages`. The body is Markdown — the rendering
 * surface decides which Markdown subset to permit (consumer-side
 * sanitiser). `senderUserId` references `auth.users`.
 */
export type RoomMessage = {
  id: string;
  sessionId: string;
  senderUserId: string;
  bodyMd: string;
  attachments: ReadonlyArray<RoomAttachment>;
  sentAt: string;
};

/**
 * The `RoomError` envelope every server action returns on failure.
 * Typed-error contract per V5-CLEAR — degrade to 200 + typed body,
 * never 500. The consumer renders a `<Panel>` with `<EmptyState>` on
 * `rooms_unavailable`, an inline retry on `rate_limited`, etc.
 */
export type RoomError =
  | { error: "rooms_unavailable"; retryAfter?: number }
  | { error: "provider_unavailable"; provider: RoomProvider; retryAfter?: number }
  | { error: "unauthorized"; reason: "no_session" | "not_participant" | "wrong_role" }
  | { error: "consent_missing"; missingUserIds: ReadonlyArray<string> }
  | { error: "session_not_found"; sessionId: string }
  | { error: "session_not_joinable"; status: RoomStatus }
  | { error: "rate_limited"; retryAfter: number }
  | { error: "validation_failed"; field: string; message: string }
  | { error: "internal_error"; message: string };

/**
 * Provider driver contract. Every provider (Daily, Jitsi, future Mux)
 * implements this — the server actions abstract over the contract and
 * the UI primitives never touch the SDK.
 *
 * Drivers are PURE: they receive room state + viewer + secrets and
 * return a typed result. No global state, no implicit env reads
 * (selector resolves env once and passes it in).
 *
 * Why this shape:
 *   - `createRoom` returns the provider's opaque id + a join URL. The
 *     server action persists `providerRoomId` to `rooms_sessions`.
 *   - `issueJoinToken` mints a short-lived join token per participant.
 *     Daily uses JWT meeting tokens; Jitsi uses JWT with `aud`/`iss`
 *     when a tenant is configured, otherwise an anonymous room URL.
 *   - `startRecording` / `stopRecording` map onto the provider's
 *     recording API. The cloud recording url + transcript come back
 *     via webhook (consumer-side; out of Wave A2 scope).
 */
export type ProviderDriver = {
  readonly provider: RoomProvider;

  createRoom(input: {
    kind: RoomKind;
    sessionId: string;
    /** Owner of the room (typically the staff / employer / property host). */
    ownerUserId: string;
    /** Optional ISO timestamp for scheduled start. */
    scheduledAt?: string;
    /** Provider-specific config knobs (e.g. recording on by default). */
    options?: Record<string, unknown>;
  }): Promise<{
    providerRoomId: string;
    joinUrl: string;
  }>;

  issueJoinToken(input: {
    providerRoomId: string;
    userId: string;
    /** Display name shown in the provider UI (often the user's full name). */
    displayName: string;
    role: ParticipantRole;
    /** Token lifetime in seconds. Defaults to 3600 (1 hour). */
    ttlSeconds?: number;
  }): Promise<{
    joinToken: string;
    /** ISO timestamp at which the token expires. */
    expiresAt: string;
  }>;

  startRecording?(input: {
    providerRoomId: string;
  }): Promise<{
    providerRecordingId: string;
  }>;

  stopRecording?(input: {
    providerRoomId: string;
    providerRecordingId: string;
  }): Promise<{
    /** Final recording URL — may be a CDN URL or a provider-mediated download. */
    url?: string;
    /** ISO timestamp at which the recording URL expires (provider-defined). */
    expiresAt?: string;
  }>;

  /**
   * End the room — disconnects all participants and marks the room as
   * ended on the provider side. Optional because Jitsi does not have
   * a server-side "end" call; the room just empties.
   */
  endRoom?(input: {
    providerRoomId: string;
  }): Promise<void>;
};

/**
 * The shape `useRoomLifecycle` returns. See
 * `src/hooks/use-room-lifecycle.ts` for behaviour.
 */
export type RoomLifecycleState = {
  state: "idle" | "joining" | "live" | "leaving" | "ended" | "error";
  participants: ReadonlyArray<RoomParticipant>;
  provider: RoomProvider;
  recording: {
    active: boolean;
    consentGiven: boolean;
  };
  hands: Readonly<Record<string, boolean>>;
  join: () => Promise<void>;
  leave: () => Promise<void>;
  toggleHand: () => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  error?: RoomError;
};

/**
 * Result of `createRoom` when it succeeds. Mirrored on the server-action
 * boundary so the consumer can branch on `error in result` cleanly.
 */
export type CreateRoomSuccess = {
  sessionId: string;
  provider: RoomProvider;
  joinUrl: string;
};

export type JoinRoomSuccess = {
  joinToken: string;
  /** ISO timestamp. */
  expiresAt: string;
};

export type RecordingStartSuccess = {
  recordingId: string;
};

export type RecordingStopSuccess = {
  recordingId: string;
  url?: string;
};

export type ScorecardSubmitSuccess = {
  ok: true;
  scorecardId: string;
};

export type SendMessageSuccess = {
  messageId: string;
};

export type RecordConsentSuccess = {
  ok: true;
};

export type EndRoomSuccess = {
  ok: true;
};

/**
 * Helper type guard — the consumer surface uses this to disambiguate the
 * server-action return shape.
 *
 *   const result = await joinRoom({ sessionId, role: "candidate" });
 *   if (isRoomError(result)) { renderError(result); return; }
 *   // result is JoinRoomSuccess
 */
export function isRoomError<T>(value: T | RoomError): value is RoomError {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error?: unknown }).error === "string"
  );
}
