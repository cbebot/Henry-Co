import { NextResponse } from "next/server";
import { buildCanonicalActivityMetadata } from "@henryco/intelligence";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ensureAccountProfileRecords } from "@/lib/account-profile";
import { uploadOwnedAsset } from "@/lib/cloudinary";
import { mirrorCareSupportCustomerReply } from "@/lib/support-sync";
import { AccountIntelEvents, emitIntelligenceEvent, triageSupportInput } from "@/lib/intelligence-rollout";
import { getIdempotentResponse, rememberIdempotentResponse } from "@/lib/idempotency";

const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
]);

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const prior = await getIdempotentResponse({
      userId: user.id,
      routeKey: "support.reply",
      request,
    });
    if (prior) return NextResponse.json(prior);

    await ensureAccountProfileRecords(user);

    const contentType = request.headers.get("content-type") || "";
    let thread_id = "";
    let body = "";
    let attachments: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      thread_id = String(formData.get("thread_id") || "");
      body = String(formData.get("body") || "");
      attachments = formData
        .getAll("attachments")
        .filter((item): item is File => item instanceof File && item.size > 0);
    } else {
      const payload = await request.json();
      thread_id = String(payload.thread_id || "");
      body = String(payload.body || "");
    }

    if (!thread_id || !body) {
      return NextResponse.json({ error: "Thread ID and body required" }, { status: 400 });
    }

    const admin = createAdminSupabase();

    // Verify thread ownership
    const { data: thread } = await admin
      .from("support_threads")
      .select("id, user_id, division, category, priority, subject")
      .eq("id", thread_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

    const uploadedAttachments: Array<Record<string, unknown>> = [];
    for (const attachment of attachments.slice(0, 4)) {
      const upload = await uploadOwnedAsset(attachment, user.id, {
        folder: "support-attachments",
        resourceType: "auto",
        maxBytes: 10 * 1024 * 1024,
        allowedTypes: ALLOWED_ATTACHMENT_TYPES,
        invalidTypeMessage: "Upload JPG, PNG, WebP, PDF, or TXT attachments only.",
        publicIdPrefix: "support-attachment",
      });

      uploadedAttachments.push({
        name: attachment.name,
        url: upload.secureUrl,
        public_id: upload.publicId,
        mime_type: attachment.type || "application/octet-stream",
        size: attachment.size,
      });
    }

    const triage = triageSupportInput(body);
    const { data: customerProfile } = await admin
      .from("customer_profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    // Insert message
    const { error: messageErr } = await admin.from("support_messages").insert({
      thread_id,
      sender_id: user.id,
      sender_type: "customer",
      body,
      attachments: uploadedAttachments,
    });
    if (messageErr) {
      return NextResponse.json({ error: "Failed to add support reply" }, { status: 500 });
    }

    // Update thread
    const { error: threadErr } = await admin
      .from("support_threads")
      .update({
        status: "awaiting_reply",
        priority: triage.shouldEscalate ? "high" : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", thread_id);
    if (threadErr) {
      return NextResponse.json({ error: "Failed to update support thread" }, { status: 500 });
    }

    const sideEffectFailures: string[] = [];

    if (thread.division === "care") {
      try {
        await mirrorCareSupportCustomerReply({
          threadId: thread_id,
          subject: String(thread.subject || "Support conversation"),
          category: String(thread.category || "general"),
          priority: String(thread.priority || "normal"),
          status: "awaiting_reply",
          message: body,
          attachments: uploadedAttachments,
          customer: {
            userId: user.id,
            email: user.email,
            fullName:
              String(customerProfile?.full_name || "").trim() ||
              String(user.user_metadata?.full_name || user.user_metadata?.name || "").trim() ||
              user.email ||
              "Customer",
            phone:
              String(customerProfile?.phone || "").trim() ||
              String(user.user_metadata?.phone || "").trim(),
          },
        });
      } catch {
        sideEffectFailures.push("care_support_bridge");
      }
    }

    if (uploadedAttachments.length > 0) {
      const { error: docsErr } = await admin.from("customer_documents").insert(
        uploadedAttachments.map((attachment) => ({
          user_id: user.id,
          division: thread.division || "support",
          type: "support_attachment",
          name: attachment.name,
          file_url: attachment.url,
          file_size: attachment.size,
          mime_type: attachment.mime_type,
          reference_type: "support_thread",
          reference_id: thread_id,
          metadata: {
            public_id: attachment.public_id,
          },
        }))
      );
      if (docsErr) sideEffectFailures.push("documents");
    }

    const { error: activityErr } = await admin.from("customer_activity").insert({
      user_id: user.id,
      division: thread.division || "account",
      activity_type: "support_replied",
      title: `Replied to ${String(thread.subject || "support thread").trim() || "support thread"}`,
      description: "Customer replied inside an open support conversation.",
      status: triage.shouldEscalate ? "escalated" : "awaiting_reply",
      reference_type: "support_thread",
      reference_id: thread_id,
      action_url: `/support/${thread_id}`,
      metadata: buildCanonicalActivityMetadata({
        division: thread.division || "account",
        activityType: "support_replied",
        status: triage.shouldEscalate ? "escalated" : "awaiting_reply",
        referenceType: "support_thread",
        referenceId: thread_id,
        metadata: {
          triageIntent: triage.intent,
          triageQueue: triage.handoffSummary.suggestedQueue || "general",
          escalated: triage.shouldEscalate,
          attachmentCount: uploadedAttachments.length,
        },
      }),
    });
    if (activityErr) sideEffectFailures.push("activity");

    try {
      await emitIntelligenceEvent({
        name: triage.shouldEscalate ? AccountIntelEvents.supportEscalated : AccountIntelEvents.supportOpened,
        division: thread.division || "account",
        eventId: `support_reply:${thread_id}:${Date.now()}`,
        actor: { kind: "user", subjectRef: user.id, roleHint: "customer" },
        properties: {
          title: "Support thread reply",
          summary: "Customer replied in support thread.",
          threadId: thread_id,
          triageIntent: triage.intent,
          triageQueue: triage.handoffSummary.suggestedQueue || "general",
          escalated: triage.shouldEscalate,
          attachments: uploadedAttachments.length,
        },
      });
    } catch {
      sideEffectFailures.push("intelligence_event");
    }

    const payload = {
      success: true,
      side_effects_ok: sideEffectFailures.length === 0,
      side_effect_failures: sideEffectFailures,
    };
    await rememberIdempotentResponse({
      userId: user.id,
      routeKey: "support.reply",
      request,
      responsePayload: payload,
    });

    return NextResponse.json(payload, sideEffectFailures.length ? { status: 207 } : undefined);
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
