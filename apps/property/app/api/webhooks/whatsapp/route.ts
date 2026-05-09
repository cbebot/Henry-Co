import { NextResponse, type NextRequest } from "next/server";
import {
  verifyWhatsAppSignature,
  whatsAppFailureResponseInit,
} from "@henryco/config/whatsapp-webhook";
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

/**
 * V5-3 B1: HMAC-SHA256 of the raw body must match x-hub-signature-256
 * against WHATSAPP_APP_SECRET, otherwise the receiver fails closed.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const verdict = verifyWhatsAppSignature({
    rawBody: raw,
    header: request.headers.get("x-hub-signature-256"),
    appSecret: process.env.WHATSAPP_APP_SECRET,
  });
  if (!verdict.valid) {
    const init = whatsAppFailureResponseInit(verdict.reason);
    return NextResponse.json(init.body, { status: init.status });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    const root = body as Record<string, unknown>;
    const entries = Array.isArray(root?.entry) ? root.entry : [];

    for (const entry of entries) {
      const changes = Array.isArray((entry as Record<string, unknown>)?.changes)
        ? ((entry as Record<string, unknown>).changes as unknown[])
        : [];
      for (const change of changes) {
        const value = (change as Record<string, unknown>)?.value as
          | Record<string, unknown>
          | undefined;
        const statuses = Array.isArray(value?.statuses)
          ? (value!.statuses as unknown[])
          : [];
        for (const status of statuses) {
          const s = status as Record<string, unknown>;
          await appendPropertyNotification({
            entityType: "whatsapp_webhook",
            entityId: String(s?.id || "") || null,
            channel: "whatsapp",
            templateKey: "webhook_receipt",
            recipient: String(s?.recipient_id || s?.id || "unknown"),
            subject: "WhatsApp delivery receipt",
            status: "sent",
            reason: JSON.stringify(s),
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
