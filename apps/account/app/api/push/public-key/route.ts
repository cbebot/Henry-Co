import { NextResponse } from "next/server";
import { getPublicVapidKey } from "@henryco/push";

/**
 * The VAPID public key the browser needs to create a Web Push subscription.
 * The public key is, by design, public — but the endpoint returns `null` when
 * push is not configured so the client can degrade gracefully.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ key: getPublicVapidKey() });
}
