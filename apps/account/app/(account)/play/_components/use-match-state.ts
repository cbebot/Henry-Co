"use client";

import { useCallback, useEffect, useState } from "react";
import type { GameId, GameState, Seat } from "@henryco/gaming-arena";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export type MatchPlayerView = { seat: Seat; handle: string; rating: number; isYou: boolean };

export type MatchView = {
  id: string;
  gameId: GameId;
  status: "lobby" | "matchmaking" | "in_progress" | "completed" | "abandoned";
  mySeat: Seat;
  currentSeq: number;
  winnerSeat: Seat | null;
  players: MatchPlayerView[];
  state: GameState | null;
  fairness: { commitment: string | null; revealedSeed: string | null };
};

/**
 * Per-match authoritative state. Hydrates from the redacted server read, then
 * uses a Realtime signal subscription (the non-sensitive gaming_match_signal
 * table) as a nudge to re-hydrate, with a 5s polling fallback (turn-based does
 * not need sub-second latency; the signal makes it feel instant).
 */
export function useMatchState(matchId: string) {
  const [view, setView] = useState<MatchView | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async () => {
    try {
      const res = await fetch(`/api/play/match/${matchId}`, { cache: "no-store" });
      if (res.ok) {
        setView((await res.json()) as MatchView);
      }
    } catch {
      // keep last-known view; a transient blip must not blank the board
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    const channel = supabase
      .channel(`gaming:match:${matchId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gaming_match_signal", filter: `match_id=eq.${matchId}` },
        () => {
          void hydrate();
        },
      )
      .subscribe();
    const poll = window.setInterval(() => {
      void hydrate();
    }, 5000);
    return () => {
      window.clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [matchId, hydrate]);

  return { view, loading, refresh: hydrate };
}

export async function postMove(
  matchId: string,
  move: Record<string, unknown>,
): Promise<{ ok: boolean; reason?: string }> {
  try {
    const res = await fetch(`/api/play/match/${matchId}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ move }),
    });
    if (res.ok) return { ok: true };
    const data = (await res.json().catch(() => ({}))) as { reason?: string; error?: string };
    return { ok: false, reason: data.reason ?? data.error };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export async function leaveMatch(matchId: string): Promise<void> {
  try {
    await fetch(`/api/play/match/${matchId}/leave`, { method: "POST" });
  } catch {
    // best-effort; the abandon is idempotent server-side
  }
}
