import { NextResponse } from "next/server";
import { revokeWebSubscriptionByEndpoint } from "@henryco/push";

import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * Forget this browser's Web Push subscription (e.g. the user turned alerts off
 * on this device). Authenticated + scoped to the caller's own subscriptions.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let endpoint = "";
  try {
    const body = (await request.json()) as { endpoint?: unknown };
    if (typeof body.endpoint === "string") endpoint = body.endpoint;
  } catch {
    // fall through
  }
  if (!endpoint) {
    return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  }

  await revokeWebSubscriptionByEndpoint(user.id, endpoint);
  return NextResponse.json({ ok: true });
}
