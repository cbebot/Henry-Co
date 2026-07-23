import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { registerWebSubscription } from "@henryco/push";
import { requireOwner } from "@/app/lib/owner-auth";

/**
 * SA-4 — register the OWNER's browser for push on the hub command portal
 * (mirrors apps/account /api/push/subscribe, narrowed to the owner surface).
 *
 * Auth authority is `requireOwner` — the same gate as every owner API route
 * (session-only; owner devices here are browsers on the hq host). The
 * subscription lands in the SHARED `push_subscriptions` table under the
 * owner's auth user id, so `publishNotification`'s urgent/security fan-out
 * (packages/notifications) reaches this device with zero dispatch changes —
 * that is what lets an operator escalation ring an offline owner.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  endpoint?: unknown;
  keys?: { p256dh?: unknown; auth?: unknown } | null;
};

const str = (v: unknown): string => (typeof v === "string" ? v : "");

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (!auth.ok) {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  }

  const endpoint = str(body.endpoint);
  const p256dh = str(body.keys?.p256dh);
  const authKey = str(body.keys?.auth);
  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  }

  const headerStore = await headers();
  const uaSummary = String(headerStore.get("user-agent") ?? "").slice(0, 160) || undefined;

  await registerWebSubscription({
    userId: auth.user.id,
    endpoint,
    p256dh,
    auth: authKey,
    uaSummary,
  });
  return NextResponse.json({ ok: true });
}
