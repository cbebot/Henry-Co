import { NextResponse } from "next/server";
import { logger } from "@henryco/observability";
import { isGameId } from "@henryco/gaming-arena";
import { checkCanPlayFree, findOrCreateMatch, resolveGamingAdminClient } from "@henryco/gaming-arena/server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { isGamingArenaReady } from "@/lib/gaming/arena-flag";

export const runtime = "nodejs";

const log = logger.child({ module: "gaming.api.quick-match" });

export async function POST(request: Request) {
  if (!isGamingArenaReady()) return NextResponse.json({ error: "not_available" }, { status: 404 });

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const gate = checkCanPlayFree(user?.id);
  if (!gate.ok) return NextResponse.json({ error: gate.reason }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { gameId?: unknown };
  if (typeof body.gameId !== "string" || !isGameId(body.gameId)) {
    return NextResponse.json({ error: "invalid_game" }, { status: 400 });
  }

  const resolved = resolveGamingAdminClient();
  if (!resolved.ok) return NextResponse.json({ error: "not_available" }, { status: 503 });

  try {
    const result = await findOrCreateMatch(resolved.client, {
      gameId: body.gameId,
      userId: gate.userId,
    });
    return NextResponse.json({
      matchId: result.matchId,
      kind: result.kind,
      started: result.kind === "joined" ? result.started : false,
    });
  } catch (err) {
    log.error("quick-match failed", err instanceof Error ? err : new Error(String(err)));
    return NextResponse.json({ error: "match_failed" }, { status: 500 });
  }
}
