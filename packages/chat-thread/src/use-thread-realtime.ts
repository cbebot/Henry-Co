"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ThreadChannelLike,
  ThreadSupabaseLike,
} from "@henryco/messaging-thread/types";

export type ThreadRealtimeStatus = "idle" | "connecting" | "live" | "reconnecting";

export type UseThreadRealtimeOptions = {
  /**
   * Host-supplied browser Supabase factory (structural — the package never
   * imports supabase-js). Return null in environments without realtime
   * (SSR, tests); the hook degrades to status "idle".
   */
  getSupabase?: () => ThreadSupabaseLike | null;
  channelName: string;
  table: string;
  schema?: string;
  /** e.g. `thread_id=eq.<id>` */
  filter: string;
  onInsert: (row: Record<string, unknown>) => void;
  enabled?: boolean;
};

/**
 * Headless INSERT subscription with explicit reconnect-on-drop — a port of
 * @henryco/messaging-thread's proven realtime effect (capped exponential
 * backoff 1.5s → 15s on CHANNEL_ERROR / TIMED_OUT / CLOSED). The host owns
 * row → message mapping and list merging via `onInsert`.
 */
export function useThreadRealtime(options: UseThreadRealtimeOptions): {
  status: ThreadRealtimeStatus;
} {
  const {
    getSupabase,
    channelName,
    table,
    schema = "public",
    filter,
    onInsert,
    enabled = true,
  } = options;

  const [status, setStatus] = useState<ThreadRealtimeStatus>("idle");

  // Latest-ref pattern: the subscription effect must not re-run when hosts
  // pass a fresh inline closure each render, but incoming rows must always
  // reach the newest handler.
  const onInsertRef = useRef(onInsert);
  useEffect(() => {
    onInsertRef.current = onInsert;
  });

  useEffect(() => {
    if (!enabled || !getSupabase) {
      setStatus("idle");
      return;
    }
    const supabase = getSupabase();
    if (!supabase) {
      setStatus("idle");
      return;
    }
    setStatus("connecting");

    let channel: ThreadChannelLike | null = null;
    let cancelled = false;
    let retryHandle: ReturnType<typeof setTimeout> | null = null;
    let retryDelay = 1500;

    const handleInsert = (payload: Record<string, unknown>) => {
      const newRow = (payload as { new?: Record<string, unknown> }).new;
      if (!newRow) return;
      onInsertRef.current(newRow);
    };

    const connect = () => {
      if (cancelled) return;
      const ch = supabase.channel(channelName);
      channel = ch
        .on(
          "postgres_changes",
          { event: "INSERT", schema, table, filter },
          handleInsert,
        )
        .subscribe((subscriptionStatus: string) => {
          if (cancelled) return;
          if (subscriptionStatus === "SUBSCRIBED") {
            setStatus("live");
            retryDelay = 1500;
            return;
          }
          if (
            subscriptionStatus === "CHANNEL_ERROR" ||
            subscriptionStatus === "TIMED_OUT" ||
            subscriptionStatus === "CLOSED"
          ) {
            setStatus("reconnecting");
            if (channel) {
              try {
                supabase.removeChannel(channel);
              } catch {
                // ignore — channel was already torn down
              }
              channel = null;
            }
            retryHandle = setTimeout(connect, retryDelay);
            retryDelay = Math.min(retryDelay * 2, 15000);
          }
        });
    };

    connect();

    return () => {
      cancelled = true;
      if (retryHandle) {
        clearTimeout(retryHandle);
        retryHandle = null;
      }
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {
          // ignore
        }
      }
    };
  }, [enabled, getSupabase, channelName, table, schema, filter]);

  return { status };
}
