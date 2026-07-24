import { NextResponse } from "next/server";
import { getPublicVapidKey } from "@henryco/push";

/** SA-4 — the public VAPID key for the hub owner push surface (mirrors the
 *  account route; `null` when unconfigured so the client degrades calmly). */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ key: getPublicVapidKey() });
}
