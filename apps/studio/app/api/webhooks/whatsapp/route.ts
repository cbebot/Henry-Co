import { NextResponse, type NextRequest } from "next/server";
import {
  verifyWhatsAppSignature,
  whatsAppFailureResponseInit,
} from "@henryco/config/whatsapp-webhook";
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
  // V5-3 B1: HMAC-SHA256 verification of x-hub-signature-256 against
  // WHATSAPP_APP_SECRET. Fails closed when the secret is unset (no env →
  // no acceptance), so deploying without provisioning the secret will
  // shut the receiver down rather than silently accept unsigned calls.
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
          await logStatusReceipt(status as Record<string, unknown>);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
