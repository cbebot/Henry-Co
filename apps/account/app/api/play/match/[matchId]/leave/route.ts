import { NextResponse } from "next/server";
import { logger } from "@henryco/observability";
import { checkCanPlayFree, abandonMatch, resolveGamingAdminClient } from "@henryco/gaming-arena/server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { isGamingArenaReady } from "@/lib/gaming/arena-flag";

export const runtime = "nodejs";

const log = logger.child({ module: "gaming.api.leave" });

export async function POST(_request: Request, { params }: { params: Promise<{ matchId: string }> }) {
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
    const result = await abandonMatch(resolved.client, { matchId, userId: gate.userId });
    return NextResponse.json(result);
  } catch (err) {
    log.error("abandon failed", err instanceof Error ? err : new Error(String(err)));
    return NextResponse.json({ error: "leave_failed" }, { status: 500 });
  }
}
