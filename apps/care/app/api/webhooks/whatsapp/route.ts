import { NextResponse, type NextRequest } from "next/server";
import { recordWhatsAppDeliveryReceipt } from "@/lib/support/whatsapp-observability";

/**
 * GET handler for Meta WhatsApp webhook verification.
 * Meta sends a challenge on setup that must be echoed back.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

/**
 * POST handler for Meta WhatsApp webhook status updates.
 * Receives sent/delivered/read/failed status for outbound messages.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const entries = Array.isArray(body?.entry) ? body.entry : [];
    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const change of changes) {
        const statuses = Array.isArray(change?.value?.statuses) ? change.value.statuses : [];
        for (const status of statuses) {
          await recordWhatsAppDeliveryReceipt(status);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Always return 200 to prevent Meta retries on transient errors.
    return NextResponse.json({ ok: true });
  }
}
