import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

async function logWebhookEvent(input: {
  eventType: string;
  success: boolean;
  details: Record<string, unknown>;
  email?: string | null;
}) {
  try {
    const admin = createAdminSupabase();
    await admin.from("care_security_logs").insert({
      event_type: input.eventType,
      route: "/api/webhooks/resend",
      email: input.email ?? null,
      success: input.success,
      details: input.details,
    } as never);
  } catch {
    // ignore webhook log failures
  }
}

export async function POST(request: Request) {
  const webhookSecret = String(process.env.RESEND_WEBHOOK_SECRET || "").trim();
  if (!webhookSecret) {
    await logWebhookEvent({
      eventType: "studio_resend_webhook_unavailable",
      success: false,
      details: { reason: "RESEND_WEBHOOK_SECRET is missing." },
    });

    return NextResponse.json({ ok: false, error: "Webhook secret is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const event = resend.webhooks.verify({
      payload: rawBody,
      headers: {
        id: request.headers.get("svix-id") || "",
        timestamp: request.headers.get("svix-timestamp") || "",
        signature: request.headers.get("svix-signature") || "",
      },
      webhookSecret,
    });
    const recipient =
      event.data &&
      typeof event.data === "object" &&
      "to" in event.data &&
      Array.isArray((event.data as { to?: unknown[] }).to) &&
      typeof (event.data as { to?: unknown[] }).to?.[0] === "string"
        ? ((event.data as { to?: string[] }).to?.[0] ?? null)
        : null;

    await logWebhookEvent({
      eventType: "studio_resend_webhook_processed",
      success: true,
      email: recipient,
      details: {
        event_type: event.type,
        created_at: event.created_at,
        data: event.data,
      },
    });

    return NextResponse.json({ ok: true, eventType: event.type });
  } catch (error) {
    await logWebhookEvent({
      eventType: "studio_resend_webhook_rejected",
      success: false,
      details: {
        reason: error instanceof Error ? error.message : "Webhook verification failed.",
      },
    });

    return NextResponse.json(
      { ok: false, error: "Webhook verification failed." },
      { status: 401 }
    );
  }
}
