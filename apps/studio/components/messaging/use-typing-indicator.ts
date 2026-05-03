"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import {
  TYPING_INDICATOR_APPEAR_MS,
  TYPING_INDICATOR_LINGER_MS,
  TYPING_INDICATOR_TTL_MS,
  projectChannelName,
} from "@/lib/messaging/constants";
import type { TypingIndicator } from "@/lib/messaging/types";

type Options = {
  projectId: string;
  viewerId: string | null;
  viewerName: string | null;
  /** Optional callback when a remote presence change fires. */
  onChange?: (typists: TypingIndicator[]) => void;
};

/**
 * Realtime presence-based typing indicator. Each tab joins the project
 * presence channel with `{ typing: false }` and toggles to `true` while
 * the local user types. We expose the list of OTHER users currently
 * typing — the local user's own state never appears in this list.
 *
 * Presence is ephemeral: if a tab closes, the user disappears from
 * the typists list automatically. This is exactly the behaviour we
 * want — no DB cleanup needed for the live state.
 */
export function useTypingIndicator({
  projectId,
  viewerId,
  viewerName,
  onChange,
}: Options) {
  const [typists, setTypists] = useState<TypingIndicator[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const startedAtRef = useRef<string | null>(null);
  const lingerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!viewerId) return;
    const supabase = getBrowserSupabase();
    const channelName = `${projectChannelName(projectId)}:typing`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: viewerId },
      },
    });

    const refreshTypists = () => {
      const state = channel.presenceState() as Record<
        string,
        Array<{
          user_id?: string;
          typing?: boolean;
          name?: string;
          started_at?: string;
        }>
      >;
      const next: TypingIndicator[] = [];
      for (const [key, presences] of Object.entries(state)) {
        if (key === viewerId) continue;
        const p = presences[presences.length - 1];
        if (p?.typing) {
          next.push({
            userId: key,
            displayName: p.name || "Someone",
            startedAt: p.started_at || new Date().toISOString(),
          });
        }
      }
      setTypists(next);
      onChangeRef.current?.(next);
    };

    channel
      .on("presence", { event: "sync" }, refreshTypists)
      .on("presence", { event: "join" }, refreshTypists)
      .on("presence", { event: "leave" }, refreshTypists);

    channel.subscribe(async (status: string) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user_id: viewerId,
          name: viewerName || "Studio",
          typing: false,
          started_at: new Date().toISOString(),
        });
      }
    });

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      if (appearTimerRef.current) {
        clearTimeout(appearTimerRef.current);
        appearTimerRef.current = null;
      }
      if (lingerTimerRef.current) {
        clearTimeout(lingerTimerRef.current);
        lingerTimerRef.current = null;
      }
      void channel.untrack();
      void channel.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, [projectId, viewerId, viewerName]);

  /**
   * Notify the channel that the local user is typing. Debounced via
   * the appear timer (so a single keystroke doesn't broadcast) and
   * auto-cleared after the linger window if the user goes quiet.
   */
  const beginTyping = useCallback(() => {
    if (!channelRef.current || !viewerId) return;
    const channel = channelRef.current;

    if (lingerTimerRef.current) {
      clearTimeout(lingerTimerRef.current);
      lingerTimerRef.current = null;
    }

    if (!startedAtRef.current) {
      // Schedule the appear-broadcast after the warm-up.
      if (!appearTimerRef.current) {
        appearTimerRef.current = setTimeout(() => {
          appearTimerRef.current = null;
          startedAtRef.current = new Date().toISOString();
          void channel.track({
            user_id: viewerId,
            name: viewerName || "Studio",
            typing: true,
            started_at: startedAtRef.current,
          });
        }, TYPING_INDICATOR_APPEAR_MS);
      }
    }

    lingerTimerRef.current = setTimeout(() => {
      lingerTimerRef.current = null;
      startedAtRef.current = null;
      if (appearTimerRef.current) {
        clearTimeout(appearTimerRef.current);
        appearTimerRef.current = null;
      }
      void channel.track({
        user_id: viewerId,
        name: viewerName || "Studio",
        typing: false,
        started_at: new Date().toISOString(),
      });
    }, TYPING_INDICATOR_LINGER_MS);
  }, [viewerId, viewerName]);

  /** Explicitly clear the typing state — call on send or blur. */
  const stopTyping = useCallback(() => {
    if (!channelRef.current || !viewerId) return;
    const channel = channelRef.current;

    if (appearTimerRef.current) {
      clearTimeout(appearTimerRef.current);
      appearTimerRef.current = null;
    }
    if (lingerTimerRef.current) {
      clearTimeout(lingerTimerRef.current);
      lingerTimerRef.current = null;
    }
    startedAtRef.current = null;
    void channel.track({
      user_id: viewerId,
      name: viewerName || "Studio",
      typing: false,
      started_at: new Date().toISOString(),
    });
  }, [viewerId, viewerName]);

  /**
   * Prune typing indicators whose started_at is older than the TTL.
   * Defends against a remote tab that crashed without leaving the
   * presence channel cleanly.
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setTypists((current) => {
        const cutoff = Date.now() - TYPING_INDICATOR_TTL_MS;
        const next = current.filter(
          (t) => new Date(t.startedAt).getTime() >= cutoff,
        );
        return next.length === current.length ? current : next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return { typists, beginTyping, stopTyping };
}
