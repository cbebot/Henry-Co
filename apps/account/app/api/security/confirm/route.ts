import { NextResponse } from "next/server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { logSecurityEvent } from "@/lib/security-events";
import { deviceIdForEvent, trustKnownDevice } from "@/lib/security/known-devices";

/**
 * "Yes, it was me" — trust the device that triggered a sign-in alert.
 *
 * Authenticated + same-origin: the live session is the credential (no bearer
 * token in the email URL). The request names only the alert event; the server
 * resolves which device it refers to, so a caller can never trust an arbitrary
 * device. Non-destructive.
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

  let eventId = "";
  try {
    const body = (await request.json()) as { eventId?: unknown };
    if (typeof body.eventId === "string") eventId = body.eventId;
  } catch {
    // fall through to validation error
  }
  if (!eventId) {
    return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  }

  const deviceId = await deviceIdForEvent(user.id, eventId);
  if (!deviceId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const ok = await trustKnownDevice(user.id, deviceId);
  if (!ok) {
    return NextResponse.json(
      { error: "We couldn't update this device. Please try again." },
      { status: 500 },
    );
  }

  await logSecurityEvent({
    userId: user.id,
    eventType: "device_trusted",
    metadata: { source: "sign_in_review", device_id: deviceId, event_id: eventId },
  });

  return NextResponse.json({ ok: true });
}
