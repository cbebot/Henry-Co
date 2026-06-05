import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { registerExpoToken, registerWebSubscription } from "@henryco/push";

import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { summarizeUserAgent } from "@/lib/security-events";
import { HC_DEVICE_COOKIE, verifyDeviceCookie } from "@/lib/security/device-cookie";

/**
 * Register this device for push. Accepts a Web Push subscription (browser) or a
 * native Expo token, links it to the signed-in user + recognised device, and
 * upserts it in `push_subscriptions` (reactivating any prior row).
 *
 * Authenticated by EITHER the session cookie (web) OR a `Bearer` access token
 * (native app), so the same endpoint serves both surfaces.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveUser(
  request: Request,
  supabaseServer: Awaited<ReturnType<typeof createSupabaseServer>>,
): Promise<User | null> {
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  if (user) return user;

  // Native fallback: a `Bearer <access_token>` from the mobile app.
  const authz = request.headers.get("authorization") || "";
  const bearer = authz.toLowerCase().startsWith("bearer ") ? authz.slice(7).trim() : "";
  if (bearer) {
    const { data } = await createAdminSupabase().auth.getUser(bearer);
    if (data.user) return data.user;
  }
  return null;
}

type Body = {
  channel?: unknown;
  // web
  endpoint?: unknown;
  keys?: { p256dh?: unknown; auth?: unknown } | null;
  // expo
  expoToken?: unknown;
};

const str = (v: unknown): string => (typeof v === "string" ? v : "");

export async function POST(request: Request) {
  const supabase = await createSupabaseServer();
  const user = await resolveUser(request, supabase);
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const headerStore = await headers();
  const deviceId = verifyDeviceCookie(cookieStore.get(HC_DEVICE_COOKIE)?.value);
  const uaSummary = summarizeUserAgent(headerStore.get("user-agent"));

  const channel = str(body.channel) || (body.expoToken ? "expo" : "web");

  if (channel === "expo") {
    const expoToken = str(body.expoToken);
    if (!expoToken) {
      return NextResponse.json({ error: "validation_failed" }, { status: 400 });
    }
    await registerExpoToken({ userId: user.id, expoToken, deviceId, uaSummary });
    return NextResponse.json({ ok: true });
  }

  const endpoint = str(body.endpoint);
  const p256dh = str(body.keys?.p256dh);
  const auth = str(body.keys?.auth);
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  }

  await registerWebSubscription({ userId: user.id, endpoint, p256dh, auth, deviceId, uaSummary });
  return NextResponse.json({ ok: true });
}
