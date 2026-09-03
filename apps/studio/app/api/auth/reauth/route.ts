import { NextResponse } from "next/server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { writeReauthCookieToJar } from "@henryco/auth/server/reauth-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/auth/reauth — the studio-origin fresh-credential marker writer
 * (`hc_last_reauth`) the sensitive-action guard requires. Byte-identical to the
 * account route (apps/account/app/api/auth/reauth/route.ts): verify the
 * password server-side via a raw Supabase password grant whose tokens are
 * DISCARDED (the live session is never rotated), and ONLY on success write the
 * signed marker. SA-2 adds this so the reauth-gated deploy approval can run on
 * the studio origin (previously studio had no reauth route → any step-up looped).
 *
 * A walk-up attacker holding a live session — the exact threat reauth defends
 * against — cannot set the marker without the password.
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ ok: false, reason: "unknown" }, { status: 401 });
  }

  let method = "password";
  let password = "";
  try {
    const body = (await request.json()) as { method?: string; password?: string };
    if (typeof body.method === "string") method = body.method;
    if (typeof body.password === "string") password = body.password;
  } catch {
    /* validated below */
  }

  if (method !== "password") {
    return NextResponse.json({ ok: false, reason: "unknown" }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ ok: false, reason: "incorrect" });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ ok: false, reason: "unknown" }, { status: 500 });
  }

  let verifyStatus = 0;
  try {
    const verify = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: anon, "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, password }),
      cache: "no-store",
    });
    verifyStatus = verify.status;
  } catch {
    return NextResponse.json({ ok: false, reason: "unknown" }, { status: 502 });
  }

  if (verifyStatus === 200) {
    await writeReauthCookieToJar(user.id);
    return NextResponse.json({ ok: true });
  }
  if (verifyStatus === 429) {
    return NextResponse.json({ ok: false, reason: "rate_limited" }, { status: 429 });
  }
  return NextResponse.json({ ok: false, reason: "incorrect" });
}
