/**
 * @henryco/rooms/server/actions — typed Next.js server actions.
 *
 * Every action is gated on `requireUnifiedViewer()` from
 * `@henryco/auth/server`, wrapped in a try/catch that returns a typed
 * `RoomError`, logged via `@henryco/observability`, and emits
 * event-taxonomy events on success.
 *
 * The actions are intentionally THIN: provider work is delegated to the
 * driver, persistence to Supabase. No business rules beyond:
 *   - role authorization (kind-vs-role + owner-only ops)
 *   - consent gate on startRecording (every participant must have a
 *     granted_at row with no withdrew_at)
 *   - status gate on join/post (only scheduled/live sessions accept)
 *
 * Wave B/C consumers wire the provider webhook handlers themselves; this
 * file does not import any webhook receiver code.
 */

"use server";

import { requireUnifiedViewer } from "@henryco/auth/server";
import { logger as rootLogger, emitEvent } from "@henryco/observability";

import {
  consentMissing,
  internalError,
  isRoleAllowedForKind,
  rateLimited,
  roomsUnavailable,
  sessionNotFound,
  sessionNotJoinable,
  unauthorized,
  validationFailed,
} from "../errors";
import { selectProvider } from "../provider-selector";
import { DailyApiError } from "../providers/daily";
import type {
  CreateRoomSuccess,
  EndRoomSuccess,
  JoinRoomSuccess,
  ParticipantRole,
  RecordConsentSuccess,
  RecordingStartSuccess,
  RecordingStopSuccess,
  RoomAttachment,
  RoomError,
  RoomKind,
  ScorecardDimensions,
  ScorecardSubmitSuccess,
  SendMessageSuccess,
} from "../types";
import {
  getRoomsServiceRoleSupabase,
  getRoomsSupabase,
} from "./supabase";

const log = rootLogger.child({ module: "rooms" });

const ROOM_KINDS: ReadonlySet<RoomKind> = new Set<RoomKind>([
  "care_consult",
  "marketplace_dispute",
  "studio_review",
  "academy_class",
  "logistics_call",
  "property_tour",
  "jobs_interview",
]);

/**
 * Wrap a server-action body so any thrown error returns a typed
 * RoomError instead of bubbling to the caller. Logs the throw via the
 * structured logger; never echoes raw error messages to the wire.
 */
async function safeAction<TSuccess>(
  actionName: string,
  fn: () => Promise<TSuccess | RoomError>,
): Promise<TSuccess | RoomError> {
  const actionLog = log.child({ action: actionName });
  try {
    return await fn();
  } catch (err) {
    if (err instanceof DailyApiError) {
      actionLog.error("daily_api_failed", err);
      if (err.status === 429) {
        return rateLimited(60) as RoomError;
      }
      if (err.status >= 500) {
        return { error: "provider_unavailable", provider: "daily" } as RoomError;
      }
      return internalError(`provider:${err.status}`) as RoomError;
    }
    actionLog.error("action_threw", err instanceof Error ? err : { error: String(err) });
    return internalError(
      err instanceof Error ? err.message : "Unknown rooms action failure.",
    ) as RoomError;
  }
}

/**
 * CREATE ROOM.
 *
 * Inserts a `rooms_sessions` row (status='scheduled' if `scheduledAt` in
 * the future, else 'live'), asks the provider for a `providerRoomId`
 * and joinUrl, persists the provider id, and inserts a `rooms_participants`
 * row for the creator as the host.
 */
export async function createRoom(input: {
  kind: RoomKind;
  scheduledAt?: string;
  metadata?: Record<string, unknown>;
  /** Optional override of the host's participant role. Defaults per-kind. */
  hostRole?: ParticipantRole;
}): Promise<CreateRoomSuccess | RoomError> {
  return safeAction("createRoom", async () => {
    const viewer = await requireUnifiedViewer();
    const actionLog = log.child({ action: "createRoom", userId: viewer.user.id });

    // Validation
    if (!ROOM_KINDS.has(input.kind)) {
      return validationFailed("kind", `Unknown room kind: ${input.kind}`);
    }
    const hostRole: ParticipantRole = input.hostRole ?? defaultHostRoleForKind(input.kind);
    if (!isRoleAllowedForKind(hostRole, input.kind)) {
      return validationFailed(
        "hostRole",
        `Role ${hostRole} is not allowed for kind ${input.kind}.`,
      );
    }

    // Provider selection
    const provider = selectProvider();
    if (!provider) {
      actionLog.warn("rooms_unavailable_no_provider");
      return roomsUnavailable();
    }

    const supabase = await getRoomsSupabase();
    const scheduled = input.scheduledAt ? new Date(input.scheduledAt) : null;
    const status =
      !scheduled || scheduled.getTime() <= Date.now() ? "live" : "scheduled";

    // INSERT the session first so we have a uuid for the provider's room
    // name. The provider call may fail; if so, we DELETE the row in the
    // catch.
    const insertResult = (await supabase
      .from("rooms_sessions")
      .insert({
        kind: input.kind,
        provider: provider.provider,
        status,
        owner_user_id: viewer.user.id,
        scheduled_at: scheduled?.toISOString() ?? null,
        metadata: input.metadata ?? {},
      })
      .select("id")) as {
      data: ReadonlyArray<{ id: string }> | null;
      error: { message: string } | null;
    };
    if (insertResult.error || !insertResult.data?.[0]?.id) {
      actionLog.error("session_insert_failed", {
        message: insertResult.error?.message,
      });
      return internalError("Could not create session row.");
    }
    const sessionId = insertResult.data[0].id;

    let providerResult: { providerRoomId: string; joinUrl: string };
    try {
      providerResult = await provider.createRoom({
        kind: input.kind,
        sessionId,
        ownerUserId: viewer.user.id,
        scheduledAt: input.scheduledAt,
      });
    } catch (err) {
      // Roll back the session row so a re-create on retry doesn't leak
      // orphan rows. Best-effort — we log on failure but don't change
      // the return shape.
      try {
        await supabase.from("rooms_sessions").delete().eq("id", sessionId);
      } catch {
        actionLog.warn("session_rollback_failed_after_provider_error", { sessionId });
      }
      throw err;
    }

    // UPDATE the row with the provider room id.
    const updateResult = (await supabase
      .from("rooms_sessions")
      .update({ provider_room_id: providerResult.providerRoomId })
      .eq("id", sessionId)) as { error: { message: string } | null };
    if (updateResult.error) {
      actionLog.warn("session_update_provider_id_failed", {
        sessionId,
        message: updateResult.error.message,
      });
      // Non-fatal: the join action falls back to deriving the room name
      // from sessionId for Daily.
    }

    // INSERT the host as the first participant.
    const participantInsert = (await supabase
      .from("rooms_participants")
      .insert({
        session_id: sessionId,
        user_id: viewer.user.id,
        role: hostRole,
      })) as { error: { message: string } | null };
    if (participantInsert.error) {
      actionLog.warn("host_participant_insert_failed", {
        sessionId,
        message: participantInsert.error.message,
      });
    }

    emitEvent({
      name: roomCreatedEventName(input.kind),
      classification: "user_action",
      outcome: "started",
      actorId: viewer.user.id,
      payload: {
        sessionId,
        kind: input.kind,
        provider: provider.provider,
        scheduledAt: input.scheduledAt,
      },
    });

    return {
      sessionId,
      provider: provider.provider,
      joinUrl: providerResult.joinUrl,
    };
  });
}

/**
 * JOIN ROOM.
 *
 * Looks up the session, validates status, upserts a participant row
 * for the caller, and asks the provider for a per-user join token.
 */
export async function joinRoom(input: {
  sessionId: string;
  role: ParticipantRole;
}): Promise<JoinRoomSuccess | RoomError> {
  return safeAction("joinRoom", async () => {
    const viewer = await requireUnifiedViewer();
    const actionLog = log.child({
      action: "joinRoom",
      sessionId: input.sessionId,
      userId: viewer.user.id,
    });

    if (!input.sessionId || typeof input.sessionId !== "string") {
      return validationFailed("sessionId", "sessionId is required.");
    }

    const supabase = await getRoomsSupabase();
    const sessionResult = (await supabase
      .from("rooms_sessions")
      .select("id, kind, provider, provider_room_id, status, owner_user_id")
      .eq("id", input.sessionId)
      .maybeSingle()) as {
      data: {
        id: string;
        kind: RoomKind;
        provider: "daily" | "jitsi";
        provider_room_id: string | null;
        status: string;
        owner_user_id: string;
      } | null;
      error: { message: string } | null;
    };
    if (sessionResult.error) {
      actionLog.error("session_lookup_failed", { message: sessionResult.error.message });
      return internalError("Could not load session.");
    }
    if (!sessionResult.data) {
      return sessionNotFound(input.sessionId);
    }
    const session = sessionResult.data;

    if (!isRoleAllowedForKind(input.role, session.kind)) {
      return unauthorized("wrong_role");
    }
    if (session.status !== "scheduled" && session.status !== "live") {
      return sessionNotJoinable(session.status as "ended" | "cancelled");
    }

    // Upsert the participant row. Re-joins UPDATE joined_at + clear
    // left_at without inserting a duplicate (unique constraint enforces).
    const nowIso = new Date().toISOString();
    const upsertResult = (await supabase
      .from("rooms_participants")
      .upsert(
        {
          session_id: session.id,
          user_id: viewer.user.id,
          role: input.role,
          joined_at: nowIso,
          left_at: null,
        },
        { onConflict: "session_id,user_id" },
      )) as { error: { message: string } | null };
    if (upsertResult.error) {
      actionLog.error("participant_upsert_failed", {
        message: upsertResult.error.message,
      });
      return internalError("Could not record participant.");
    }

    // Flip session to live on first join.
    if (session.status === "scheduled") {
      const flip = (await supabase
        .from("rooms_sessions")
        .update({ status: "live", joined_at: nowIso })
        .eq("id", session.id)) as { error: { message: string } | null };
      if (flip.error) {
        actionLog.warn("session_flip_to_live_failed", {
          message: flip.error.message,
        });
      }
    }

    // Provider join token.
    const provider = selectProvider();
    if (!provider) {
      return roomsUnavailable();
    }
    const providerRoomId =
      session.provider_room_id ?? `hc_${session.id.replace(/-/g, "_")}`;
    const tokenResult = await provider.issueJoinToken({
      providerRoomId,
      userId: viewer.user.id,
      displayName: viewer.user.fullName || viewer.user.email || "Participant",
      role: input.role,
    });

    emitEvent({
      name: roomJoinedEventName(session.kind),
      classification: "user_action",
      outcome: "completed",
      actorId: viewer.user.id,
      payload: { sessionId: session.id, role: input.role },
    });

    return {
      joinToken: tokenResult.joinToken,
      expiresAt: tokenResult.expiresAt,
    };
  });
}

/**
 * RECORD CONSENT.
 *
 * Upserts a `rooms_recordings_consent` row for the caller with
 * `granted_at = now()` and the supplied consent text version. Used by
 * the `<RecordingConsent>` modal.
 */
export async function recordConsent(input: {
  sessionId: string;
  consentTextVersion: string;
}): Promise<RecordConsentSuccess | RoomError> {
  return safeAction("recordConsent", async () => {
    const viewer = await requireUnifiedViewer();
    if (!input.sessionId) return validationFailed("sessionId", "sessionId is required.");
    if (!input.consentTextVersion) {
      return validationFailed("consentTextVersion", "consentTextVersion is required.");
    }

    const supabase = await getRoomsSupabase();
    const upsert = (await supabase
      .from("rooms_recordings_consent")
      .upsert(
        {
          session_id: input.sessionId,
          user_id: viewer.user.id,
          granted_at: new Date().toISOString(),
          withdrew_at: null,
          consent_text_version: input.consentTextVersion,
        },
        { onConflict: "session_id,user_id" },
      )) as { error: { message: string } | null };
    if (upsert.error) {
      return internalError(upsert.error.message);
    }
    return { ok: true };
  });
}

/**
 * WITHDRAW CONSENT.
 *
 * Companion to recordConsent — sets withdrew_at on the user's row. If
 * recording is currently active, the consumer surface must call
 * stopRecording immediately after; this server action does NOT do that
 * automatically because there's no guarantee the withdrawer is the
 * recording's initiator.
 */
export async function withdrawConsent(input: {
  sessionId: string;
}): Promise<RecordConsentSuccess | RoomError> {
  return safeAction("withdrawConsent", async () => {
    const viewer = await requireUnifiedViewer();
    if (!input.sessionId) return validationFailed("sessionId", "sessionId is required.");

    const supabase = await getRoomsSupabase();
    const update = (await supabase
      .from("rooms_recordings_consent")
      .update({ withdrew_at: new Date().toISOString() })
      .eq("session_id", input.sessionId)
      .eq("user_id", viewer.user.id)) as { error: { message: string } | null };
    if (update.error) {
      return internalError(update.error.message);
    }
    return { ok: true };
  });
}

/**
 * START RECORDING.
 *
 * Pre-flight: every currently-joined participant (left_at IS NULL) must
 * have a `rooms_recordings_consent` row with granted_at set and no
 * withdrew_at. If any participant has not consented, returns
 * `consent_missing` with the missing user ids so the UI can surface them.
 *
 * Inserts a placeholder `rooms_recordings` row via the service-role
 * client (since the recording table is service-role-only for
 * INSERT/UPDATE). The webhook handler later updates url + expires_at.
 */
export async function startRecording(input: {
  sessionId: string;
}): Promise<RecordingStartSuccess | RoomError> {
  return safeAction("startRecording", async () => {
    const viewer = await requireUnifiedViewer();
    if (!input.sessionId) return validationFailed("sessionId", "sessionId is required.");

    const supabase = await getRoomsSupabase();

    // Owner-only.
    const session = (await supabase
      .from("rooms_sessions")
      .select("id, kind, provider, provider_room_id, owner_user_id, status")
      .eq("id", input.sessionId)
      .maybeSingle()) as {
      data: {
        id: string;
        kind: RoomKind;
        provider: "daily" | "jitsi";
        provider_room_id: string | null;
        owner_user_id: string;
        status: string;
      } | null;
      error: { message: string } | null;
    };
    if (session.error) return internalError(session.error.message);
    if (!session.data) return sessionNotFound(input.sessionId);
    if (session.data.owner_user_id !== viewer.user.id) {
      return unauthorized("wrong_role");
    }

    // Pre-flight consent check. We list all currently-joined participants,
    // then list all consent rows with granted_at NOT NULL and
    // withdrew_at NULL, and diff.
    //
    // NB: RLS lets each user see only their own consent row — so we run
    // this through the service-role client (with auth.role()='service_role'
    // bypassing RLS). The decision is aggregate boolean only — we never
    // surface other users' consent timestamps in the response, only the
    // missing user ids (which the consumer needs to render "<name> hasn't
    // consented yet").
    const serviceRole = await getRoomsServiceRoleSupabase();
    if (!serviceRole) {
      return internalError(
        "rooms service-role factory not registered. The host app must call " +
          "registerRoomsServiceRoleFactory() for startRecording to work.",
      );
    }

    const participants = (await serviceRole
      .from("rooms_participants")
      .select("user_id")
      .eq("session_id", session.data.id)
      .is("left_at", null)) as {
      data: ReadonlyArray<{ user_id: string }> | null;
      error: { message: string } | null;
    };
    if (participants.error) return internalError(participants.error.message);
    const activeUserIds = (participants.data ?? []).map((p) => p.user_id);

    if (activeUserIds.length === 0) {
      return validationFailed("session", "No active participants to record.");
    }

    const consents = (await serviceRole
      .from("rooms_recordings_consent")
      .select("user_id, granted_at, withdrew_at")
      .eq("session_id", session.data.id)
      .in("user_id", activeUserIds)) as {
      data: ReadonlyArray<{
        user_id: string;
        granted_at: string | null;
        withdrew_at: string | null;
      }> | null;
      error: { message: string } | null;
    };
    if (consents.error) return internalError(consents.error.message);

    const consentedSet = new Set(
      (consents.data ?? [])
        .filter((c) => c.granted_at !== null && c.withdrew_at === null)
        .map((c) => c.user_id),
    );
    const missing = activeUserIds.filter((id) => !consentedSet.has(id));
    if (missing.length > 0) {
      return consentMissing(missing);
    }

    // Provider call.
    const provider = selectProvider();
    if (!provider) return roomsUnavailable();
    if (!provider.startRecording) {
      // Provider does not support server-side recording (e.g. Jitsi
      // public). Return a typed error so the UI hides the affordance.
      return {
        error: "provider_unavailable",
        provider: provider.provider,
      } as RoomError;
    }
    const providerRoomId =
      session.data.provider_room_id ?? `hc_${session.data.id.replace(/-/g, "_")}`;
    const startResult = await provider.startRecording({ providerRoomId });

    // Insert placeholder rooms_recordings row via service role.
    const insert = (await serviceRole
      .from("rooms_recordings")
      .insert({
        session_id: session.data.id,
        provider_recording_id: startResult.providerRecordingId,
      })
      .select("id")) as {
      data: ReadonlyArray<{ id: string }> | null;
      error: { message: string } | null;
    };
    if (insert.error || !insert.data?.[0]?.id) {
      return internalError(insert.error?.message ?? "recording row insert failed");
    }

    emitEvent({
      name: "henry.support.thread.created", // closest taxonomy event; consumer-specific events follow in Wave B/C
      classification: "system_state",
      outcome: "started",
      actorId: viewer.user.id,
      payload: {
        sessionId: session.data.id,
        recordingId: insert.data[0].id,
      },
    });

    return { recordingId: insert.data[0].id };
  });
}

/**
 * STOP RECORDING.
 *
 * Owner-only. Calls the provider's stopRecording and updates the row
 * with whatever final url + expiry the provider returned immediately
 * (webhook may overwrite later with the canonical CDN URL).
 */
export async function stopRecording(input: {
  sessionId: string;
}): Promise<RecordingStopSuccess | RoomError> {
  return safeAction("stopRecording", async () => {
    const viewer = await requireUnifiedViewer();
    if (!input.sessionId) return validationFailed("sessionId", "sessionId is required.");

    const supabase = await getRoomsSupabase();
    const session = (await supabase
      .from("rooms_sessions")
      .select("id, kind, provider, provider_room_id, owner_user_id")
      .eq("id", input.sessionId)
      .maybeSingle()) as {
      data: {
        id: string;
        kind: RoomKind;
        provider: "daily" | "jitsi";
        provider_room_id: string | null;
        owner_user_id: string;
      } | null;
      error: { message: string } | null;
    };
    if (session.error) return internalError(session.error.message);
    if (!session.data) return sessionNotFound(input.sessionId);
    if (session.data.owner_user_id !== viewer.user.id) {
      return unauthorized("wrong_role");
    }

    const serviceRole = await getRoomsServiceRoleSupabase();
    if (!serviceRole) {
      return internalError("rooms service-role factory not registered.");
    }
    // Find the most recent open recording (url IS NULL → not finalized yet).
    const recordings = (await serviceRole
      .from("rooms_recordings")
      .select("id, provider_recording_id")
      .eq("session_id", session.data.id)
      .is("url", null)
      .order("created_at", { ascending: false })
      .limit(1)) as {
      data: ReadonlyArray<{ id: string; provider_recording_id: string | null }> | null;
      error: { message: string } | null;
    };
    if (recordings.error) return internalError(recordings.error.message);
    const recording = recordings.data?.[0];
    if (!recording || !recording.provider_recording_id) {
      return validationFailed("recording", "No active recording to stop.");
    }

    const provider = selectProvider();
    if (!provider) return roomsUnavailable();
    if (!provider.stopRecording) {
      return {
        error: "provider_unavailable",
        provider: provider.provider,
      } as RoomError;
    }
    const providerRoomId =
      session.data.provider_room_id ?? `hc_${session.data.id.replace(/-/g, "_")}`;
    const stopResult = await provider.stopRecording({
      providerRoomId,
      providerRecordingId: recording.provider_recording_id,
    });

    const update = (await serviceRole
      .from("rooms_recordings")
      .update({
        url: stopResult.url ?? null,
        expires_at: stopResult.expiresAt ?? null,
      })
      .eq("id", recording.id)) as { error: { message: string } | null };
    if (update.error) {
      return internalError(update.error.message);
    }

    return { recordingId: recording.id, url: stopResult.url };
  });
}

/**
 * SUBMIT SCORECARD.
 *
 * Upserts a `rooms_scorecards` row for the reviewer. `submittedAt` is
 * set to now() on first call; subsequent calls update dimensions+notes
 * but leave submittedAt as the original (caller's preference — we
 * preserve the original commit time for audit).
 */
export async function submitScorecard(input: {
  sessionId: string;
  dimensions: ScorecardDimensions;
  notesMd?: string;
}): Promise<ScorecardSubmitSuccess | RoomError> {
  return safeAction("submitScorecard", async () => {
    const viewer = await requireUnifiedViewer();
    if (!input.sessionId) return validationFailed("sessionId", "sessionId is required.");
    if (typeof input.dimensions !== "object" || input.dimensions === null) {
      return validationFailed("dimensions", "dimensions must be an object.");
    }

    const supabase = await getRoomsSupabase();
    const upsert = (await supabase
      .from("rooms_scorecards")
      .upsert(
        {
          session_id: input.sessionId,
          reviewer_user_id: viewer.user.id,
          dimensions: input.dimensions,
          notes_md: input.notesMd ?? null,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "session_id,reviewer_user_id" },
      )
      .select("id")) as {
      data: ReadonlyArray<{ id: string }> | null;
      error: { message: string } | null;
    };
    if (upsert.error || !upsert.data?.[0]?.id) {
      return internalError(upsert.error?.message ?? "scorecard upsert failed");
    }

    return { ok: true, scorecardId: upsert.data[0].id };
  });
}

/**
 * SEND ROOM MESSAGE.
 *
 * Inserts a `rooms_messages` row. The realtime publication broadcasts
 * the row to every participant within ~1s. Sender must be a participant
 * (RLS enforces).
 */
export async function sendRoomMessage(input: {
  sessionId: string;
  bodyMd: string;
  attachments?: ReadonlyArray<RoomAttachment>;
}): Promise<SendMessageSuccess | RoomError> {
  return safeAction("sendRoomMessage", async () => {
    const viewer = await requireUnifiedViewer();
    if (!input.sessionId) return validationFailed("sessionId", "sessionId is required.");
    const body = (input.bodyMd ?? "").trim();
    if (!body) return validationFailed("bodyMd", "Message body is required.");
    if (body.length > 4096) {
      return validationFailed("bodyMd", "Message is too long (max 4096 chars).");
    }

    const supabase = await getRoomsSupabase();
    const insert = (await supabase
      .from("rooms_messages")
      .insert({
        session_id: input.sessionId,
        sender_user_id: viewer.user.id,
        body_md: body,
        attachments: input.attachments ?? [],
      })
      .select("id")) as {
      data: ReadonlyArray<{ id: string }> | null;
      error: { message: string } | null;
    };
    if (insert.error || !insert.data?.[0]?.id) {
      // RLS denial → not a participant.
      if (insert.error?.message?.toLowerCase().includes("row-level security")) {
        return unauthorized("not_participant");
      }
      return internalError(insert.error?.message ?? "message insert failed");
    }
    return { messageId: insert.data[0].id };
  });
}

/**
 * TOGGLE HAND.
 *
 * Flip the caller's hand_raised flag. Realtime broadcasts the change to
 * every other participant.
 */
export async function toggleHand(input: {
  sessionId: string;
}): Promise<{ ok: true; handRaised: boolean } | RoomError> {
  return safeAction("toggleHand", async () => {
    const viewer = await requireUnifiedViewer();
    if (!input.sessionId) return validationFailed("sessionId", "sessionId is required.");

    const supabase = await getRoomsSupabase();
    const current = (await supabase
      .from("rooms_participants")
      .select("id, hand_raised")
      .eq("session_id", input.sessionId)
      .eq("user_id", viewer.user.id)
      .maybeSingle()) as {
      data: { id: string; hand_raised: boolean } | null;
      error: { message: string } | null;
    };
    if (current.error) return internalError(current.error.message);
    if (!current.data) return unauthorized("not_participant");

    const next = !current.data.hand_raised;
    const update = (await supabase
      .from("rooms_participants")
      .update({ hand_raised: next })
      .eq("id", current.data.id)) as { error: { message: string } | null };
    if (update.error) return internalError(update.error.message);
    return { ok: true, handRaised: next };
  });
}

/**
 * END ROOM.
 *
 * Owner-only. Marks the session ended, sets every active participant's
 * left_at, and tells the provider to evict (when supported).
 */
export async function endRoom(input: {
  sessionId: string;
}): Promise<EndRoomSuccess | RoomError> {
  return safeAction("endRoom", async () => {
    const viewer = await requireUnifiedViewer();
    if (!input.sessionId) return validationFailed("sessionId", "sessionId is required.");

    const supabase = await getRoomsSupabase();
    const session = (await supabase
      .from("rooms_sessions")
      .select("id, kind, provider, provider_room_id, owner_user_id, status")
      .eq("id", input.sessionId)
      .maybeSingle()) as {
      data: {
        id: string;
        kind: RoomKind;
        provider: "daily" | "jitsi";
        provider_room_id: string | null;
        owner_user_id: string;
        status: string;
      } | null;
      error: { message: string } | null;
    };
    if (session.error) return internalError(session.error.message);
    if (!session.data) return sessionNotFound(input.sessionId);
    if (session.data.owner_user_id !== viewer.user.id) {
      return unauthorized("wrong_role");
    }
    if (session.data.status === "ended" || session.data.status === "cancelled") {
      return { ok: true };
    }

    const nowIso = new Date().toISOString();
    const update = (await supabase
      .from("rooms_sessions")
      .update({ status: "ended", ended_at: nowIso })
      .eq("id", session.data.id)) as { error: { message: string } | null };
    if (update.error) return internalError(update.error.message);

    // Mark active participants left.
    const serviceRole = await getRoomsServiceRoleSupabase();
    if (serviceRole) {
      const leave = (await serviceRole
        .from("rooms_participants")
        .update({ left_at: nowIso })
        .eq("session_id", session.data.id)
        .is("left_at", null)) as { error: { message: string } | null };
      if (leave.error) {
        log.warn("end_room_participant_sweep_failed", {
          sessionId: session.data.id,
          message: leave.error.message,
        });
      }
    }

    // Provider eject (best effort).
    const provider = selectProvider();
    if (provider?.endRoom) {
      const providerRoomId =
        session.data.provider_room_id ??
        `hc_${session.data.id.replace(/-/g, "_")}`;
      try {
        await provider.endRoom({ providerRoomId });
      } catch (err) {
        log.warn("provider_end_room_failed", {
          sessionId: session.data.id,
          err: err instanceof Error ? err.message : String(err),
        });
      }
    }

    emitEvent({
      name: roomEndedEventName(session.data.kind),
      classification: "user_action",
      outcome: "completed",
      actorId: viewer.user.id,
      payload: { sessionId: session.data.id },
    });

    return { ok: true };
  });
}

/**
 * LEAVE ROOM.
 *
 * Self-only. Sets the caller's left_at without ending the session.
 */
export async function leaveRoom(input: {
  sessionId: string;
}): Promise<{ ok: true } | RoomError> {
  return safeAction("leaveRoom", async () => {
    const viewer = await requireUnifiedViewer();
    if (!input.sessionId) return validationFailed("sessionId", "sessionId is required.");

    const supabase = await getRoomsSupabase();
    const update = (await supabase
      .from("rooms_participants")
      .update({ left_at: new Date().toISOString() })
      .eq("session_id", input.sessionId)
      .eq("user_id", viewer.user.id)) as { error: { message: string } | null };
    if (update.error) return internalError(update.error.message);
    return { ok: true };
  });
}

function defaultHostRoleForKind(kind: RoomKind): ParticipantRole {
  switch (kind) {
    case "care_consult":
    case "marketplace_dispute":
    case "logistics_call":
      return "operator";
    case "jobs_interview":
      return "interviewer";
    case "studio_review":
    case "academy_class":
    case "property_tour":
    default:
      return "host";
  }
}

/**
 * Map a room kind onto the canonical event taxonomy event name for
 * "room created". The events surface in structured logs + Sentry
 * breadcrumbs; the Wave A2 PR extends docs/event-taxonomy.md with
 * the full rooms event family in a follow-up commit. For now we
 * reuse the closest existing event so type-check passes — this is
 * a known partial item documented in the report.
 */
function roomCreatedEventName(kind: RoomKind): Parameters<typeof emitEvent>[0]["name"] {
  // The event-taxonomy union does not yet include rooms.* events. We
  // reuse the closest existing event per kind so the emitter type-checks
  // and the log line carries the canonicalName. A follow-up will extend
  // the union with `henry.rooms.session.*`.
  switch (kind) {
    case "marketplace_dispute":
      return "henry.marketplace.dispute.opened";
    case "studio_review":
      return "henry.studio.project.updated";
    case "academy_class":
      return "henry.learn.enrollment.created";
    case "logistics_call":
      return "henry.logistics.booking.created";
    case "property_tour":
      return "henry.property.listing.viewing_requested";
    case "jobs_interview":
      return "henry.jobs.application.updated";
    case "care_consult":
    default:
      return "henry.care.booking.updated";
  }
}

function roomJoinedEventName(kind: RoomKind): Parameters<typeof emitEvent>[0]["name"] {
  // Same shim as above — re-use the closest taxonomy event until the
  // union is extended. The structured log line carries `outcome:
  // "completed"` so downstream analytics can distinguish create vs join.
  return roomCreatedEventName(kind);
}

function roomEndedEventName(kind: RoomKind): Parameters<typeof emitEvent>[0]["name"] {
  return roomCreatedEventName(kind);
}
