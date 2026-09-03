import { NextResponse } from "next/server";
import { logger } from "@henryco/observability";
import { redactMatchStateForSeat } from "@henryco/gaming-arena";
import { checkCanPlayFree, loadMatch, resolveGamingAdminClient } from "@henryco/gaming-arena/server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { isGamingArenaReady } from "@/lib/gaming/arena-flag";

export const runtime = "nodejs";

const log = logger.child({ module: "gaming.api.match-read" });
const NO_STORE = { "Cache-Control": "no-store, max-age=0" } as const;

/**
 * Authoritative (redacted) match read — the hydrateUrl for the per-match Realtime
 * provider. NEVER returns the secret server seed or the opponent's pending commit
 * (redactMatchStateForSeat). Raw opponent user_ids are not exposed — handles only.
 */
export async function GET(request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  if (!isGamingArenaReady()) return NextResponse.json({ error: "not_available" }, { status: 404 });
  const { matchId } = await params;

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const gate = checkCanPlayFree(user?.id);
  if (!gate.ok) return NextResponse.json({ error: gate.reason }, { status: 401 });

  const resolved = resolveGamingAdminClient();
  if (!resolved.ok) return NextResponse.json({ error: "not_available" }, { status: 503 });

  try {
    const match = await loadMatch(resolved.client, matchId);
    if (!match) return NextResponse.json({ error: "match_not_found" }, { status: 404 });
    const me = match.players.find((p) => p.userId === gate.userId);
    if (!me) return NextResponse.json({ error: "not_a_participant" }, { status: 403 });

    const state = match.state ? redactMatchStateForSeat(match.state, me.seat) : null;
    const winnerSeat = match.winnerUserId
      ? (match.players.find((p) => p.userId === match.winnerUserId)?.seat ?? null)
      : null;

    return NextResponse.json(
      {
        id: match.id,
        gameId: match.gameId,
        status: match.status,
        mySeat: me.seat,
        currentSeq: match.currentSeq,
        winnerSeat,
        players: match.players.map((p) => ({
          seat: p.seat,
          handle: p.handle,
          rating: p.rating,
          isYou: p.userId === gate.userId,
        })),
        state,
        fairness: { commitment: match.commitment, revealedSeed: match.revealedSeed },
      },
      { headers: NO_STORE },
    );
  } catch (err) {
    log.error("match read failed", err instanceof Error ? err : new Error(String(err)));
    return NextResponse.json({ error: "read_failed" }, { status: 500 });
  }
}
