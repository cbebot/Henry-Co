import { NextResponse } from "next/server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { writeReauthCookieToJar } from "@henryco/auth/server/reauth-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/auth/reauth — establish the server-side fresh-credential marker
 * (`hc_last_reauth`) that the sensitive-action guard requires.
 *
 * WHY THIS EXISTS (V3-02-FIX): the reauth modal (and the /auth/reauth page) used to
 * call `supabase.auth.signInWithPassword` CLIENT-side. That refreshes the Supabase
 * session but NEVER writes `hc_last_reauth` — the cookie the guard reads. So the
 * cookie was never set by anything (its writer had zero callers), every sensitive
 * action re-challenged, and re-entering the password just looped ("confirm your
 * identity" forever). This route closes the loop: it verifies the password
 * server-side and, ONLY on success, writes the signed reauth marker.
 *
 * SECURITY: the marker is written only after a real password check, so a walk-up
 * attacker holding a live session (the exact threat reauth defends against) cannot
 * set it without the password. The password is verified against Supabase's
 * password-grant endpoint and the returned tokens are DISCARDED — the live session
 * is never rotated or mutated. Supabase rate-limits the grant; a 429 surfaces as
 * `rate_limited`.
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
    // Magic-link reauth is established by the link-click callback, not this route.
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

  // Verify the password without touching the live session: a raw password grant whose
  // returned tokens we never read. 200 = correct, 400 = invalid, 429 = rate-limited.
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
    await writeReauthCookieToJar(user.id); // the fresh-credential marker the guard reads
    return NextResponse.json({ ok: true });
  }
  if (verifyStatus === 429) {
    return NextResponse.json({ ok: false, reason: "rate_limited" }, { status: 429 });
  }
  // 400 (invalid grant) and anything else → incorrect; never leak which part failed.
  return NextResponse.json({ ok: false, reason: "incorrect" });
}
