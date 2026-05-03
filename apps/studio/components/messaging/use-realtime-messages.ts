"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import {
  REALTIME_CONNECTING_THRESHOLD_MS,
  projectChannelName,
} from "@/lib/messaging/constants";
import type { StudioMessage } from "@/lib/messaging/types";

export type RealtimeStatus =
  | "idle"
  | "connecting"
  | "live"
  | "reconnecting"
  | "offline";

type State = {
  messages: StudioMessage[];
  status: RealtimeStatus;
};

type Action =
  | { type: "set"; messages: StudioMessage[] }
  | { type: "prepend"; messages: StudioMessage[] }
  | { type: "append"; message: StudioMessage }
  | { type: "update"; message: StudioMessage }
  | { type: "remove"; messageId: string }
  | { type: "status"; status: RealtimeStatus };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "set":
      return { ...state, messages: action.messages };
    case "prepend": {
      const ids = new Set(state.messages.map((m) => m.id));
      const fresh = action.messages.filter((m) => !ids.has(m.id));
      return { ...state, messages: [...fresh, ...state.messages] };
    }
    case "append": {
      const existsIndex = state.messages.findIndex(
        (m) => m.id === action.message.id,
      );
      if (existsIndex >= 0) {
        const next = [...state.messages];
        next[existsIndex] = action.message;
        return { ...state, messages: next };
      }
      return { ...state, messages: [...state.messages, action.message] };
    }
    case "update": {
      const idx = state.messages.findIndex((m) => m.id === action.message.id);
      if (idx < 0) return state;
      const next = [...state.messages];
      next[idx] = { ...next[idx], ...action.message };
      return { ...state, messages: next };
    }
    case "remove":
      return {
        ...state,
        messages: state.messages.filter((m) => m.id !== action.messageId),
      };
    case "status":
      return { ...state, status: action.status };
    default:
      return state;
  }
}

type RealtimeMessagesOptions = {
  projectId: string;
  initialMessages: StudioMessage[];
  viewerId: string | null;
  /** Enrich an incoming raw row into the StudioMessage shape. */
  enrichIncoming?: (
    raw: RawIncomingMessage,
  ) => Promise<StudioMessage> | StudioMessage;
};

export type RawIncomingMessage = {
  id: string;
  project_id: string;
  sender: string | null;
  sender_id: string | null;
  sender_role: string | null;
  body: string | null;
  message_type: string | null;
  metadata: Record<string, unknown> | null;
  attachments: unknown;
  reply_to_id: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
};

function defaultEnrich(raw: RawIncomingMessage): StudioMessage {
  return {
    id: raw.id,
    projectId: raw.project_id,
    senderName: raw.sender || "Studio",
    senderId: raw.sender_id,
    senderRole:
      raw.sender_role === "team" || raw.sender_role === "system"
        ? raw.sender_role
        : "client",
    body: raw.body || "",
    messageType:
      raw.message_type === "text" ||
      raw.message_type === "file" ||
      raw.message_type === "milestone_update" ||
      raw.message_type === "file_share" ||
      raw.message_type === "payment_update" ||
      raw.message_type === "approval_request" ||
      raw.message_type === "system"
        ? raw.message_type
        : "text",
    metadata:
      raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {},
    attachments: Array.isArray(raw.attachments)
      ? (raw.attachments as StudioMessage["attachments"])
      : [],
    reactions: [],
    readReceipts: [],
    createdAt: raw.created_at,
    editedAt: raw.edited_at,
    deletedAt: raw.deleted_at,
    isOwnMessage: false,
    readByViewer: false,
  };
}

/**
 * Subscribe to live changes on studio_project_messages (and reactions
 * + read receipts) for a single project. Handles graceful reconnect,
 * a "Connecting…" → "Live" status indicator, and exposes the merged
 * message list.
 */
export function useRealtimeMessages({
  projectId,
  initialMessages,
  viewerId,
  enrichIncoming,
}: RealtimeMessagesOptions) {
  const [state, dispatch] = useReducer(reducer, {
    messages: initialMessages,
    status: "idle" as RealtimeStatus,
  });
  const enrichRef = useRef(enrichIncoming || defaultEnrich);
  enrichRef.current = enrichIncoming || defaultEnrich;
  const viewerIdRef = useRef(viewerId);
  viewerIdRef.current = viewerId;

  // Reset to fresh server-loaded messages when the project switches.
  useEffect(() => {
    dispatch({ type: "set", messages: initialMessages });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    const supabase = getBrowserSupabase();
    const channelName = projectChannelName(projectId);
    const channel: RealtimeChannel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    const handleMessageChange = async (
      payload: RealtimePostgresChangesPayload<RawIncomingMessage>,
    ) => {
      if (cancelled) return;
      if (payload.eventType === "DELETE") {
        const oldRow = payload.old as { id?: string };
        if (oldRow?.id) {
          dispatch({ type: "remove", messageId: oldRow.id });
        }
        return;
      }

      const raw = payload.new as RawIncomingMessage;
      if (!raw || raw.project_id !== projectId) return;

      // Soft-delete arrives as an UPDATE with deleted_at set.
      if (payload.eventType === "UPDATE" && raw.deleted_at) {
        dispatch({ type: "update", message: await enrichRef.current(raw) });
        return;
      }

      const enriched = await enrichRef.current(raw);
      const isOwn = Boolean(
        viewerIdRef.current &&
          raw.sender_id &&
          viewerIdRef.current === raw.sender_id,
      );
      const message: StudioMessage = { ...enriched, isOwnMessage: isOwn };

      if (payload.eventType === "INSERT") {
        dispatch({ type: "append", message });
      } else {
        dispatch({ type: "update", message });
      }
    };

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "studio_project_messages",
          filter: `project_id=eq.${projectId}`,
        },
        handleMessageChange,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "studio_message_reactions",
        },
        () => {
          // Reactions arrive as their own change events. We rely on
          // the message-list to refresh affected rows from the server
          // when these fire — broadcasting an internal hint.
          dispatch({ type: "status", status: state.status });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "studio_message_read_receipts",
        },
        () => {
          /* Receipt changes — handled by the parent via refetch. */
        },
      );

    let connectingTimer: ReturnType<typeof setTimeout> | null = null;
    dispatch({ type: "status", status: "idle" });
    connectingTimer = setTimeout(() => {
      if (!cancelled) dispatch({ type: "status", status: "connecting" });
    }, REALTIME_CONNECTING_THRESHOLD_MS);

    channel.subscribe((status) => {
      if (cancelled) return;
      if (connectingTimer) {
        clearTimeout(connectingTimer);
        connectingTimer = null;
      }
      if (status === "SUBSCRIBED") {
        dispatch({ type: "status", status: "live" });
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        dispatch({ type: "status", status: "reconnecting" });
      } else if (status === "CLOSED") {
        dispatch({ type: "status", status: "offline" });
      }
    });

    const handleOnline = () => {
      dispatch({ type: "status", status: "reconnecting" });
      // Channel auto-rejoins via Supabase client; we just surface UI.
    };
    const handleOffline = () => {
      dispatch({ type: "status", status: "offline" });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      cancelled = true;
      if (connectingTimer) clearTimeout(connectingTimer);
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
      void channel.unsubscribe();
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const replaceMessages = useCallback((messages: StudioMessage[]) => {
    dispatch({ type: "set", messages });
  }, []);

  const prependHistory = useCallback((messages: StudioMessage[]) => {
    dispatch({ type: "prepend", messages });
  }, []);

  const upsertOptimistic = useCallback((message: StudioMessage) => {
    dispatch({ type: "append", message });
  }, []);

  const removeOptimistic = useCallback((messageId: string) => {
    dispatch({ type: "remove", messageId });
  }, []);

  return {
    messages: state.messages,
    status: state.status,
    replaceMessages,
    prependHistory,
    upsertOptimistic,
    removeOptimistic,
  };
}

export function useStableState<T>(initial: T) {
  const [value, setValue] = useState<T>(initial);
  return [value, setValue] as const;
}
