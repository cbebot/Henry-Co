import { NextResponse } from "next/server";

import { writeReauthCookieToJar } from "@henryco/auth/server/reauth-cookie";
import { requireOwner } from "@/app/lib/owner-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/auth/reauth — the hub-origin fresh-credential marker
 * (`hc_last_reauth`) writer, mirroring the account/learn/jobs routes so the
 * sensitive-action guard works on the owner console too.
 *
 * This is the founder's "print": before a deep governed action executes
 * (requiresReauth entries in the F3 catalog), the confirm route demands a
 * fresh identity proof. This route verifies the owner's PASSWORD server-side
 * (raw Supabase password grant; returned tokens are discarded — the live
 * session is never rotated) and, only on success, writes the signed
 * cross-subdomain marker the guard reads. A walk-up attacker holding the
 * owner's live session cannot produce it without the password.
 *
 * Owner-gated on top of the platform pattern: this is the owner console —
 * nobody else has any business establishing reauth on this origin.
 */
export async function POST(request: Request) {
  const auth = await requireOwner();
  if (!auth.ok || !auth.user.email) {
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

  // Verify the password without touching the live session: a raw password
  // grant whose returned tokens we never read. 200 = correct, 400 = invalid,
  // 429 = rate-limited (Supabase's own limiter).
  let verifyStatus = 0;
  try {
    const verify = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: anon, "Content-Type": "application/json" },
      body: JSON.stringify({ email: auth.user.email, password }),
      cache: "no-store",
    });
    verifyStatus = verify.status;
  } catch {
    return NextResponse.json({ ok: false, reason: "unknown" }, { status: 502 });
  }

  if (verifyStatus === 200) {
    await writeReauthCookieToJar(auth.user.id); // the fresh-credential marker the guard reads
    return NextResponse.json({ ok: true });
  }
  if (verifyStatus === 429) {
    return NextResponse.json({ ok: false, reason: "rate_limited" }, { status: 429 });
  }
  // 400 (invalid grant) and anything else → incorrect; never leak which part failed.
  return NextResponse.json({ ok: false, reason: "incorrect" });
}
