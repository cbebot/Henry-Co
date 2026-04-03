import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase";

async function logStatusReceipt(status: Record<string, unknown>) {
  try {
    const admin = createAdminSupabase();
    await admin.from("care_security_logs").insert({
      event_type: "studio_whatsapp_delivery_receipt",
      route: "/api/webhooks/whatsapp",
      success: true,
      details: status,
    } as never);
  } catch {
    // ignore logging failure
  }
}

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entries = Array.isArray(body?.entry) ? body.entry : [];

    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const change of changes) {
        const statuses = Array.isArray(change?.value?.statuses) ? change.value.statuses : [];
        for (const status of statuses) {
          await logStatusReceipt(status as Record<string, unknown>);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
