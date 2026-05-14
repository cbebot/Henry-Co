import { NextResponse, type NextRequest } from "next/server";
import {
  verifyWhatsAppSignature,
  whatsAppFailureResponseInit,
} from "@henryco/config/whatsapp-webhook";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * V3 PASS 21 — POST /api/webhooks/whatsapp (logistics)
 *
 * Meta-signed WhatsApp Business webhook. Mirrors the V5-3 §12 HMAC
 * pattern shipped on apps/care, apps/property, apps/studio:
 *
 *   1. Read raw body.
 *   2. Verify HMAC-SHA256(rawBody, WHATSAPP_APP_SECRET) against
 *      x-hub-signature-256.
 *   3. Fail closed on missing env / mismatched signature.
 *   4. Inspect incoming text message — if it looks like a tracking
 *      code (`HCL-XXXX`), log the inbound lookup and ACK 200.
 *
 * The outbound reply (sending status text back to the customer)
 * requires Twilio / Meta send credentials and is left as a TODO with
 * a logged record so a follow-up agent can wire it without re-tracing
 * this route.
 *
 * GET handler echoes the Meta verification challenge (subscribe mode).
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "verification_failed" }, { status: 403 });
}

type WhatsAppMessage = {
  from?: string;
  text?: { body?: string };
  type?: string;
};

function extractTrackingCode(text: string | undefined | null): string | null {
  if (!text) return null;
  const match = String(text).toUpperCase().match(/HCL-[A-Z0-9]{4,12}/);
  return match ? match[0] : null;
}

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
    let admin: ReturnType<typeof createAdminSupabase> | null = null;
    try {
      admin = createAdminSupabase();
    } catch {
      admin = null;
    }

    for (const entry of entries) {
      const changes = Array.isArray((entry as Record<string, unknown>)?.changes)
        ? ((entry as Record<string, unknown>).changes as unknown[])
        : [];
      for (const change of changes) {
        const value = (change as Record<string, unknown>)?.value as
          | Record<string, unknown>
          | undefined;
        const messages = Array.isArray(value?.messages)
          ? (value?.messages as WhatsAppMessage[])
          : [];
        for (const message of messages) {
          if (message?.type !== "text") continue;
          const code = extractTrackingCode(message?.text?.body);
          if (!code || !admin) continue;

          // Look up the shipment and log the inbound for analytics.
          const { data: shipment } = await admin
            .from("logistics_shipments")
            .select(
              "id, tracking_code, lifecycle_status, last_event_at, zone_label",
            )
            .eq("tracking_code", code)
            .maybeSingle<{
              id: string;
              tracking_code: string;
              lifecycle_status: string;
              last_event_at: string | null;
              zone_label: string | null;
            }>();

          await admin.from("logistics_notifications").insert({
            shipment_id: shipment?.id ?? null,
            channel: "whatsapp",
            template_key: "tracking.lookup.inbound",
            recipient: message.from ?? "unknown",
            subject: `Inbound lookup ${code}`,
            status: shipment ? "sent" : "skipped",
            reason: shipment ? null : "tracking_code_not_found",
            meta: {
              tracking_code: code,
              lifecycle_status: shipment?.lifecycle_status ?? null,
              last_event_at: shipment?.last_event_at ?? null,
              zone_label: shipment?.zone_label ?? null,
            },
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[logistics-whatsapp] webhook handler failed", err);
    // Always 200 to prevent Meta retries on transient errors.
    return NextResponse.json({ ok: true });
  }
}
