import { NextResponse } from "next/server";
import { logger } from "@henryco/observability";
import { GamingError, MoveRejectedError } from "@henryco/gaming-arena";
import { checkCanPlayFree, resolveGamingAdminClient, submitMove } from "@henryco/gaming-arena/server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { isGamingArenaReady } from "@/lib/gaming/arena-flag";

export const runtime = "nodejs";

const log = logger.child({ module: "gaming.api.move" });

/**
 * THE move chokepoint (HTTP face). The actor is the SESSION user — never the
 * request body. The server validates + decides the winner; a hostile client
 * cannot forge a move or an outcome (submitMove + the grant-locked RPCs).
 */
export async function POST(request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  if (!isGamingArenaReady()) return NextResponse.json({ error: "not_available" }, { status: 404 });
  const { matchId } = await params;

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const gate = checkCanPlayFree(user?.id);
  if (!gate.ok) return NextResponse.json({ error: gate.reason }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { move?: unknown };
  const move = body.move;
  if (!move || typeof move !== "object" || typeof (move as { type?: unknown }).type !== "string") {
    return NextResponse.json({ error: "malformed_move" }, { status: 400 });
  }

  const resolved = resolveGamingAdminClient();
  if (!resolved.ok) return NextResponse.json({ error: "not_available" }, { status: 503 });

  try {
    const result = await submitMove(resolved.client, {
      matchId,
      userId: gate.userId,
      move: move as { type: string } & Record<string, unknown>,
    });
    if (!result.applied) {
      // optimistic-mutex loser: the board advanced — the client should re-hydrate
      return NextResponse.json({ applied: false, reason: result.reason }, { status: 409 });
    }
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof MoveRejectedError) {
      return NextResponse.json({ error: "move_rejected", reason: err.reason }, { status: 422 });
    }
    if (err instanceof GamingError) {
      return NextResponse.json({ error: err.code }, { status: 422 });
    }
    log.error("submitMove failed", err instanceof Error ? err : new Error(String(err)));
    return NextResponse.json({ error: "move_failed" }, { status: 500 });
  }
}
