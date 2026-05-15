"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type {
  RoomMessage,
  RoomParticipant,
} from "../types";

/**
 * RoomsRealtimeProvider — single shared session-scoped subscription.
 *
 * Mounts ONE realtime channel per session that streams
 * `rooms_participants` and `rooms_messages` rows. The lifecycle hook
 * (`useRoomLifecycle`) and chat panel (`<RoomChat>`) consume from this
 * context — no per-widget subscriptions.
 *
 * Closes anti-pattern #9 (per-widget Supabase realtime subscriptions):
 *   - PresencePane reads participants from this context.
 *   - RoomChat reads messages + posts via server action.
 *   - useRoomLifecycle reads participants + hand-raise state.
 *
 * COORDINATES WITH WAVE A1
 *   The shell's customer_notifications + staff_notifications subscription
 *   is owned by `@henryco/dashboard-shell`'s `SupabaseRealtimeProvider`
 *   (single shell-wide channel). Rooms ships its OWN provider because:
 *     a) The shell channel is shell-scoped (lives at the layout root,
 *        re-used across page navigations). A room session is page-scoped
 *        (mount the provider on the room page, tear down on leave).
 *     b) Rooms subscribes to different tables (rooms_messages,
 *        rooms_participants) than the shell does. Adding rooms tables
 *        to the shell channel would force the shell to know about
 *        rooms — anti-pattern.
 *     c) Both providers use the host app's existing `createSupabaseBrowser`
 *        factory, so there's one browser supabase client repo-wide.
 *
 *   `// TODO Wave-A1 integration:` if Wave A1 ships a helper to add
 *   table subscriptions to the shell-level channel, the rooms provider
 *   may migrate to that helper. For now it owns its own channel.
 *
 * RLS POSTURE
 *   The subscription respects RLS on rooms_messages + rooms_participants
 *   (see `apps/hub/supabase/migrations/20260515100100_rooms_participants.sql`
 *   and `..._rooms_messages.sql`). Cross-session isolation holds at the
 *   channel layer without extra client filters; the explicit
 *   `session_id=eq.<id>` filter we set is defence-in-depth.
 */

/**
 * Minimum surface of `@supabase/supabase-js` the rooms spine exercises.
 * Mirrors the shell's `SupabaseLike` shape — the host app passes its own
 * `createSupabaseBrowser()` so this package does not import the SDK.
 */
type SupabaseLike = {
  channel: (name: string) => RealtimeChannelLike;
  removeChannel: (channel: RealtimeChannelLike) => unknown;
};

type RealtimeChannelLike = {
  on: (
    event: string,
    options: { event: string; schema: string; table: string; filter?: string },
    handler: (payload: {
      new?: Record<string, unknown>;
      old?: Record<string, unknown>;
      eventType?: string;
    }) => void,
  ) => RealtimeChannelLike;
  subscribe: (callback?: (status: string) => void) => RealtimeChannelLike;
};

const REALTIME_BACKOFF_INITIAL_MS = 1_000;
const REALTIME_BACKOFF_MAX_MS = 30_000;
const REALTIME_CONNECT_TIMEOUT_MS = 10_000;

export type RoomsRealtimeChannelStatus =
  | "idle"
  | "connecting"
  | "subscribed"
  | "closed"
  | "error"
  | "disabled";

export type RoomsRealtimeContextValue = {
  sessionId: string | null;
  participants: ReadonlyArray<RoomParticipant>;
  messages: ReadonlyArray<RoomMessage>;
  status: RoomsRealtimeChannelStatus;
  refresh: () => Promise<void>;
};

const RoomsRealtimeContext = createContext<RoomsRealtimeContextValue | null>(null);

export type RoomsRealtimeProviderProps = {
  children: ReactNode;
  /** Session to subscribe to. Required — the provider is page-scoped. */
  sessionId: string;
  /**
   * Browser Supabase client factory. Same shape as the shell's
   * `getSupabase` — returns null in environments without realtime
   * (SSR, tests), in which case the provider degrades to polling.
   */
  getSupabase?: () => SupabaseLike | null;
  /**
   * Optional initial hydration — host can pass a server-side read of
   * participants + messages to avoid a flash.
   */
  initialParticipants?: ReadonlyArray<RoomParticipant>;
  initialMessages?: ReadonlyArray<RoomMessage>;
  /**
   * URL the provider GETs to re-hydrate when a realtime event arrives
   * (or on a polling tick). The host wires a route like
   * `/api/rooms/<sessionId>` that returns { participants, messages }.
   *
   * Set to null to disable polling entirely (tests).
   */
  hydrateUrl?: string | null;
};

function projectParticipantRow(raw: unknown): RoomParticipant | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = typeof row.id === "string" ? row.id : null;
  const sessionId = typeof row.session_id === "string" ? row.session_id : null;
  const userId = typeof row.user_id === "string" ? row.user_id : null;
  const role = typeof row.role === "string" ? row.role : null;
  if (!id || !sessionId || !userId || !role) return null;
  return {
    id,
    sessionId,
    userId,
    role: role as RoomParticipant["role"],
    joinedAt: typeof row.joined_at === "string" ? row.joined_at : null,
    leftAt: typeof row.left_at === "string" ? row.left_at : null,
    handRaised: row.hand_raised === true,
    createdAt:
      typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
  };
}

function projectMessageRow(raw: unknown): RoomMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = typeof row.id === "string" ? row.id : null;
  const sessionId = typeof row.session_id === "string" ? row.session_id : null;
  const senderUserId = typeof row.sender_user_id === "string" ? row.sender_user_id : null;
  if (!id || !sessionId || !senderUserId) return null;
  return {
    id,
    sessionId,
    senderUserId,
    bodyMd: typeof row.body_md === "string" ? row.body_md : "",
    attachments: Array.isArray(row.attachments)
      ? (row.attachments as RoomMessage["attachments"])
      : [],
    sentAt:
      typeof row.sent_at === "string" ? row.sent_at : new Date().toISOString(),
  };
}

export function RoomsRealtimeProvider({
  children,
  sessionId,
  getSupabase,
  initialParticipants = [],
  initialMessages = [],
  hydrateUrl = null,
}: RoomsRealtimeProviderProps) {
  const [participants, setParticipants] = useState<ReadonlyArray<RoomParticipant>>(
    () => Object.freeze([...initialParticipants]),
  );
  const [messages, setMessages] = useState<ReadonlyArray<RoomMessage>>(
    () => Object.freeze([...initialMessages]),
  );
  const [status, setStatus] = useState<RoomsRealtimeChannelStatus>("idle");

  const supabaseRef = useRef<SupabaseLike | null>(null);
  const getSupabaseRef = useRef<typeof getSupabase>(getSupabase);
  useEffect(() => {
    getSupabaseRef.current = getSupabase;
  }, [getSupabase]);

  const hydrateUrlRef = useRef(hydrateUrl);
  useEffect(() => {
    hydrateUrlRef.current = hydrateUrl;
  }, [hydrateUrl]);

  const hydrate = useCallback(async () => {
    const url = hydrateUrlRef.current;
    if (!url) return;
    try {
      const response = await fetch(url, { method: "GET", cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as {
        participants?: ReadonlyArray<unknown>;
        messages?: ReadonlyArray<unknown>;
      };
      if (Array.isArray(payload.participants)) {
        const next = payload.participants
          .map(projectParticipantRow)
          .filter((p): p is RoomParticipant => p !== null);
        setParticipants(Object.freeze(next));
      }
      if (Array.isArray(payload.messages)) {
        const next = payload.messages
          .map(projectMessageRow)
          .filter((m): m is RoomMessage => m !== null);
        setMessages(Object.freeze(next));
      }
    } catch {
      // Network blip — leave state as-is.
    }
  }, []);

  // Initial hydration.
  useEffect(() => {
    if (!hydrateUrl) return;
    void hydrate();
  }, [hydrateUrl, hydrate]);

  // Realtime channel — single subscription per session.
  useEffect(() => {
    if (!sessionId) return;
    const factory = getSupabaseRef.current;
    if (!factory) {
      setStatus("disabled");
      return;
    }
    let cancelled = false;
    let backoffMs = REALTIME_BACKOFF_INITIAL_MS;
    let retryTimer: number | null = null;
    let channel: RealtimeChannelLike | null = null;

    const teardown = () => {
      if (channel && supabaseRef.current) {
        try {
          supabaseRef.current.removeChannel(channel);
        } catch {
          /* ignore */
        }
        channel = null;
      }
      if (retryTimer !== null) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
    };

    const handleParticipantChange = (payload: {
      new?: Record<string, unknown>;
      old?: Record<string, unknown>;
      eventType?: string;
    }) => {
      const projected = projectParticipantRow(payload.new ?? payload.old ?? {});
      if (!projected) {
        void hydrate();
        return;
      }
      setParticipants((current) => {
        const next = [...current];
        const idx = next.findIndex((p) => p.id === projected.id);
        if (payload.eventType === "DELETE") {
          if (idx >= 0) next.splice(idx, 1);
        } else if (idx >= 0) {
          next[idx] = projected;
        } else {
          next.push(projected);
        }
        return Object.freeze(
          next.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          ),
        );
      });
    };

    const handleMessageInsert = (payload: { new?: Record<string, unknown> }) => {
      const projected = projectMessageRow(payload.new ?? {});
      if (!projected) return;
      setMessages((current) => {
        if (current.some((m) => m.id === projected.id)) return current;
        return Object.freeze(
          [...current, projected].sort(
            (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
          ),
        );
      });
    };

    const start = () => {
      if (cancelled) return;
      let supabase = supabaseRef.current;
      if (!supabase) {
        const created = factory();
        if (!created) {
          setStatus("disabled");
          return;
        }
        supabase = created;
        supabaseRef.current = supabase;
      }
      const filter = `session_id=eq.${sessionId}`;
      setStatus("connecting");

      let watchdog: number | null = window.setTimeout(() => {
        if (cancelled) return;
        setStatus("error");
        teardown();
        retryTimer = window.setTimeout(() => {
          backoffMs = Math.min(backoffMs * 2, REALTIME_BACKOFF_MAX_MS);
          start();
        }, backoffMs);
      }, REALTIME_CONNECT_TIMEOUT_MS);
      const clearWatchdog = () => {
        if (watchdog !== null) {
          window.clearTimeout(watchdog);
          watchdog = null;
        }
      };

      channel = supabase
        .channel(`rooms:${sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "rooms_participants",
            filter,
          },
          handleParticipantChange,
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "rooms_participants",
            filter,
          },
          handleParticipantChange,
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "rooms_participants",
            filter,
          },
          handleParticipantChange,
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "rooms_messages",
            filter,
          },
          handleMessageInsert,
        )
        .subscribe((s: string) => {
          if (cancelled) return;
          if (s === "SUBSCRIBED") {
            clearWatchdog();
            setStatus("subscribed");
            backoffMs = REALTIME_BACKOFF_INITIAL_MS;
            // Hydrate once on connect so we catch any rows inserted
            // while we were connecting.
            void hydrate();
            return;
          }
          if (s === "CLOSED" || s === "CHANNEL_ERROR" || s === "TIMED_OUT") {
            clearWatchdog();
            setStatus(s === "CLOSED" ? "closed" : "error");
            teardown();
            retryTimer = window.setTimeout(() => {
              backoffMs = Math.min(backoffMs * 2, REALTIME_BACKOFF_MAX_MS);
              start();
            }, backoffMs);
          }
        });
    };

    start();

    return () => {
      cancelled = true;
      teardown();
    };
  }, [sessionId, hydrate]);

  const value = useMemo<RoomsRealtimeContextValue>(
    () => ({
      sessionId,
      participants,
      messages,
      status,
      refresh: hydrate,
    }),
    [sessionId, participants, messages, status, hydrate],
  );

  return (
    <RoomsRealtimeContext.Provider value={value}>
      {children}
    </RoomsRealtimeContext.Provider>
  );
}

/**
 * Consume the rooms realtime context. Throws when called outside a
 * provider so a forgotten mount surfaces at first render rather than
 * silent stale-data bugs.
 */
export function useRoomsRealtime(): RoomsRealtimeContextValue {
  const ctx = useContext(RoomsRealtimeContext);
  if (!ctx) {
    throw new Error(
      "useRoomsRealtime() must be called inside a <RoomsRealtimeProvider>. " +
        "Wrap the room page in <RoomsRealtimeProvider sessionId={...}>.",
    );
  }
  return ctx;
}

/**
 * Non-throwing variant — for components that may render outside the
 * room page (e.g. a sidebar widget that previews live rooms).
 */
export function useRoomsRealtimeOptional(): RoomsRealtimeContextValue | null {
  return useContext(RoomsRealtimeContext);
}
