import { NextResponse, type NextRequest } from "next/server";
import { appendPropertyNotification } from "@/lib/property/store";

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
          await appendPropertyNotification({
            entityType: "whatsapp_webhook",
            entityId: String(status?.id || "") || null,
            channel: "whatsapp",
            templateKey: "webhook_receipt",
            recipient: String(status?.recipient_id || status?.id || "unknown"),
            subject: "WhatsApp delivery receipt",
            status: "sent",
            reason: JSON.stringify(status),
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
