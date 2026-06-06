import { NextResponse } from "next/server";
import { emitEvent } from "@henryco/observability/events";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getNotificationBellFeed } from "@/lib/account-data";
import { getAccountAppLocale } from "@/lib/locale-server";
import { TimeoutError, withTimeout } from "@/lib/with-timeout";

/**
 * Bell/popover hydration endpoint. The account shell's realtime provider GETs
 * this on mount and on every realtime tick, so it runs on effectively every
 * authenticated session.
 *
 * Resilience contract (Directive 8): this read must NEVER surface a 500/504.
 * A saturated DB or any read failure would otherwise stall the notifications
 * spine and, under load, compound the very DB pressure that destabilises
 * navigation. Instead we BOUND the read with a timeout and DEGRADE to an
 * empty-but-valid payload + HTTP 207 (Multi-Status), tagged `degraded: true`.
 * The shell provider treats a degraded hydration as untrusted — it keeps the
 * last-known signals rather than wiping the bell — so the user keeps navigating.
 */

const READ_TIMEOUT_MS = 4_000;

const NO_STORE = { "Cache-Control": "no-store, max-age=0" } as const;

// Shape matches HydrationPayload consumed by packages/dashboard-shell
// (realtime-data-source.ts): { unreadCount, items }. `degraded` is the additive
// hint the provider reads to preserve existing signals instead of clearing them.
const DEGRADED_PAYLOAD = { unreadCount: 0, items: [] as never[], degraded: true } as const;

function degraded(stage: "auth" | "feed", reason: "timeout" | "error", actorId?: string) {
  emitEvent({
    name: "henry.notification.recent.degraded",
    classification: "system_state",
    outcome: "failed",
    actorId,
    payload: { stage, reason },
  });
  return NextResponse.json(DEGRADED_PAYLOAD, { status: 207, headers: NO_STORE });
}

export async function GET(request: Request) {
  // --- Auth. A genuine no-session stays 401 (client treats as untrusted-empty);
  // a thrown/slow auth resolution degrades rather than 500-ing. ---
  let userId: string;
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await withTimeout(supabase.auth.getUser(), READ_TIMEOUT_MS);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.id;
  } catch (error) {
    return degraded("auth", error instanceof TimeoutError ? "timeout" : "error");
  }

  // --- Feed read. Bounded; degrade on timeout or any throw (schema drift,
  // statement-timeout, transient outage) — never a 500/504. ---
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 8), 3), 12);
    const locale = await getAccountAppLocale();
    const payload = await withTimeout(
      getNotificationBellFeed(userId, limit, locale),
      READ_TIMEOUT_MS,
    );
    return NextResponse.json(payload, { headers: NO_STORE });
  } catch (error) {
    return degraded("feed", error instanceof TimeoutError ? "timeout" : "error", userId);
  }
}
