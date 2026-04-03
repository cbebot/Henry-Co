import { NextResponse } from "next/server";
import { getResendClient, getResendWebhookSecret } from "@/lib/resend-server";
import { ingestInboundSupportEmail } from "@/lib/support/data";
import { createAdminSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

async function logWebhookEvent(input: {
  eventType: string;
  success: boolean;
  details: Record<string, unknown>;
  email?: string | null;
}) {
  try {
    const supabase = createAdminSupabase();

    await supabase.from("care_security_logs").insert({
      event_type: input.eventType,
      route: "/api/webhooks/resend",
      email: input.email ?? null,
      success: input.success,
      details: input.details,
    } as never);
  } catch {
    // ignore logging failure
  }
}

export async function POST(request: Request) {
  const webhookSecret = getResendWebhookSecret();

  if (!webhookSecret) {
    await logWebhookEvent({
      eventType: "resend_webhook_unavailable",
      success: false,
      details: {
        reason: "RESEND_WEBHOOK_SECRET is missing or malformed.",
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error: "Webhook secret is not configured.",
      },
      { status: 503 }
    );
  }

  const rawBody = await request.text();
  let event: ReturnType<ReturnType<typeof getResendClient>["webhooks"]["verify"]>;

  try {
    const resend = getResendClient();
    event = resend.webhooks.verify({
      payload: rawBody,
      headers: {
        id: request.headers.get("svix-id") || "",
        timestamp: request.headers.get("svix-timestamp") || "",
        signature: request.headers.get("svix-signature") || "",
      },
      webhookSecret,
    });
  } catch (error) {
    await logWebhookEvent({
      eventType: "resend_webhook_rejected",
      success: false,
      details: {
        reason: error instanceof Error ? error.message : "Webhook signature verification failed.",
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error: "Webhook signature verification failed.",
      },
      { status: 401 }
    );
  }

  if (event.type !== "email.received") {
    return NextResponse.json({
      ok: true,
      ignored: true,
      eventType: event.type,
    });
  }

  try {
    const result = await ingestInboundSupportEmail({
      emailId: event.data.email_id,
      messageId: event.data.message_id,
      receivedAt: event.data.created_at || event.created_at,
      from: event.data.from,
      to: event.data.to,
      cc: event.data.cc,
      bcc: event.data.bcc,
      subject: event.data.subject,
    });

    await logWebhookEvent({
      eventType: "resend_webhook_processed",
      success: true,
      email: event.data.from,
      details: {
        inbound_email_id: event.data.email_id,
        inbound_message_id: event.data.message_id,
        subject: event.data.subject,
        result_mode: result.mode,
        thread_id: result.threadId,
        thread_ref: result.threadRef,
      },
    });

    return NextResponse.json({
      ok: true,
      result: result.mode,
      threadId: result.threadId,
      threadRef: result.threadRef,
    });
  } catch (error) {
    await logWebhookEvent({
      eventType: "resend_webhook_processing_failed",
      success: false,
      email: event.data.from,
      details: {
        inbound_email_id: event.data.email_id,
        inbound_message_id: event.data.message_id,
        subject: event.data.subject,
        reason: error instanceof Error ? error.message : "Inbound support ingestion failed.",
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Inbound support ingestion failed.",
      },
      { status: 500 }
    );
  }
}
