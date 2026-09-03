import { NextResponse } from "next/server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { logSecurityEvent } from "@/lib/security-events";
import { revokeKnownDevice, trustKnownDevice } from "@/lib/security/known-devices";

/**
 * Manage a recognised device from the security page: trust it, or forget it so
 * it must be recognised (and re-alerted) on its next sign-in. Authenticated +
 * scoped to the caller's own devices.
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

  let action: string | null = null;
  let deviceId = "";
  try {
    const body = (await request.json()) as { action?: unknown; deviceId?: unknown };
    if (typeof body.action === "string") action = body.action;
    if (typeof body.deviceId === "string") deviceId = body.deviceId;
  } catch {
    // fall through
  }
  if ((action !== "trust" && action !== "revoke") || !deviceId) {
    return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  }

  const ok =
    action === "trust"
      ? await trustKnownDevice(user.id, deviceId)
      : await revokeKnownDevice(user.id, deviceId);
  if (!ok) {
    return NextResponse.json(
      { error: "We couldn't update this device. Please try again." },
      { status: 500 },
    );
  }

  await logSecurityEvent({
    userId: user.id,
    eventType: action === "trust" ? "device_trusted" : "device_removed",
    metadata: { source: "security_devices", device_id: deviceId },
  });

  return NextResponse.json({ ok: true });
}
