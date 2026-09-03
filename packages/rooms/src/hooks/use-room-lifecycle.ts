"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  joinRoom as joinRoomAction,
  leaveRoom as leaveRoomAction,
  startRecording as startRecordingAction,
  stopRecording as stopRecordingAction,
  toggleHand as toggleHandAction,
} from "../server/actions";
import { isRoomError } from "../types";
import type {
  ParticipantRole,
  RoomError,
  RoomLifecycleState,
  RoomProvider,
} from "../types";
import { useRoomsRealtime } from "../realtime/rooms-realtime";

/**
 * useRoomLifecycle — typed hook for the room lifecycle state machine.
 *
 * Composes:
 *   - the realtime context (`useRoomsRealtime`) for participants + chat
 *   - server actions (`joinRoom`, `leaveRoom`, `startRecording`,
 *     `stopRecording`, `toggleHand`) for state transitions
 *
 * The hook owns ONLY local UI state — `state` (idle/joining/live/...),
 * `recordingActive`, and `error`. Everything else (participants,
 * hand-raise state) is derived from the realtime context, which is
 * the single source of truth.
 *
 * Anti-pattern #9 — does NOT open its own realtime channel; reads from
 * the page-level `<RoomsRealtimeProvider>`.
 */
export type UseRoomLifecycleArgs = {
  sessionId: string;
  /** The role the caller intends to join as. */
  role: ParticipantRole;
  /** The selected provider — caller pre-resolves via the server action. */
  provider: RoomProvider;
  /** Whether the caller has already granted recording consent. */
  consentGiven: boolean;
};

export function useRoomLifecycle(args: UseRoomLifecycleArgs): RoomLifecycleState {
  const realtime = useRoomsRealtime();
  const [state, setState] = useState<RoomLifecycleState["state"]>("idle");
  const [recordingActive, setRecordingActive] = useState(false);
  const [error, setError] = useState<RoomError | undefined>(undefined);

  // When realtime reports a status change, propagate to local UI state.
  // The realtime context's "subscribed" status doesn't change our
  // lifecycle (joining is server-action-driven), but a "closed" /
  // "error" status does — surface as recoverable error.
  useEffect(() => {
    if (realtime.status === "error" && state === "live") {
      setError({
        error: "internal_error",
        message: "Realtime connection dropped. Trying to reconnect…",
      });
    } else if (realtime.status === "subscribed" && error?.error === "internal_error") {
      // Reconnected — clear the error.
      setError(undefined);
    }
  }, [realtime.status, state, error]);

  const join = useCallback(async () => {
    setState("joining");
    setError(undefined);
    const result = await joinRoomAction({
      sessionId: args.sessionId,
      role: args.role,
    });
    if (isRoomError(result)) {
      setState("error");
      setError(result);
      return;
    }
    setState("live");
  }, [args.sessionId, args.role]);

  const leave = useCallback(async () => {
    setState("leaving");
    const result = await leaveRoomAction({ sessionId: args.sessionId });
    if (isRoomError(result)) {
      setState("error");
      setError(result);
      return;
    }
    setState("ended");
  }, [args.sessionId]);

  const toggleHand = useCallback(async () => {
    const result = await toggleHandAction({ sessionId: args.sessionId });
    if (isRoomError(result)) {
      setError(result);
      return;
    }
    // Optimistic UI is handled by the realtime context — the row UPDATE
    // is broadcast and we see it on the next realtime tick. We don't
    // need to manually toggle here.
  }, [args.sessionId]);

  const startRecording = useCallback(async () => {
    setError(undefined);
    const result = await startRecordingAction({ sessionId: args.sessionId });
    if (isRoomError(result)) {
      setError(result);
      return;
    }
    setRecordingActive(true);
  }, [args.sessionId]);

  const stopRecording = useCallback(async () => {
    const result = await stopRecordingAction({ sessionId: args.sessionId });
    if (isRoomError(result)) {
      setError(result);
      return;
    }
    setRecordingActive(false);
  }, [args.sessionId]);

  // Aggregate hand-raise state from realtime participants.
  const hands = useMemo<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const p of realtime.participants) {
      if (p.handRaised) map[p.userId] = true;
    }
    return map;
  }, [realtime.participants]);

  return {
    state,
    participants: realtime.participants,
    provider: args.provider,
    recording: {
      active: recordingActive,
      consentGiven: args.consentGiven,
    },
    hands: Object.freeze(hands),
    join,
    leave,
    toggleHand,
    startRecording,
    stopRecording,
    error,
  };
}
