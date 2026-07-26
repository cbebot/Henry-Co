import { NextResponse } from "next/server";
import { revokeWebSubscriptionByEndpoint } from "@henryco/push";
import { requireOwner } from "@/app/lib/owner-auth";

/** SA-4 — revoke this owner device's push subscription (owner-gated; scoped to
 *  the caller's own user id + the presented endpoint, mirroring the account app). */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireOwner();
  if (!auth.ok) {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  let endpoint = "";
  try {
    const body = (await request.json()) as { endpoint?: unknown };
    endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
  } catch {
    // fall through to validation below
  }
  if (!endpoint) {
    return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  }

  await revokeWebSubscriptionByEndpoint(auth.user.id, endpoint);
  return NextResponse.json({ ok: true });
}
