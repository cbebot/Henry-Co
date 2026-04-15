import { NextResponse } from "next/server";
import {
  mapAccountSupportCategoryToDivision,
} from "@henryco/config";
import { buildCanonicalActivityMetadata } from "@henryco/intelligence";
import { createServerClient } from "@supabase/ssr";
import { createAdminSupabase } from "@/lib/supabase";
import { ensureAccountProfileRecords } from "@/lib/account-profile";
import { mirrorCareSupportThreadOpened } from "@/lib/support-sync";
import { cookies } from "next/headers";
import { AccountIntelEvents, emitIntelligenceEvent, triageSupportInput } from "@/lib/intelligence-rollout";
import { getIdempotentResponse, rememberIdempotentResponse } from "@/lib/idempotency";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(tokens) {
            for (const { name, value, options } of tokens) {
              try { cookieStore.set(name, value, options); } catch {}
            }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const prior = await getIdempotentResponse({
      userId: user.id,
      routeKey: "support.create",
      request,
    });
    if (prior) return NextResponse.json(prior);

    const { subject, category, message } = await request.json();

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message required" }, { status: 400 });
    }

    const admin = createAdminSupabase();
    await ensureAccountProfileRecords(user);

    const triage = triageSupportInput(message);
    const division = mapAccountSupportCategoryToDivision(category);

    const { data: customerProfile } = await admin
      .from("customer_profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    // Create thread
    const { data: thread, error: threadErr } = await admin
      .from("support_threads")
      .insert({
        user_id: user.id,
        subject: cleanText(subject),
        division,
        category: category || "general",
        status: "open",
        priority: triage.shouldEscalate ? "high" : "normal",
      })
      .select("id, division, category, priority, status")
      .single();

    if (threadErr || !thread) {
      return NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
    }

    // Create first message (must succeed or thread is rolled back)
    const { error: messageErr } = await admin.from("support_messages").insert({
      thread_id: thread.id,
      sender_id: user.id,
      sender_type: "customer",
      body: message,
    });
    if (messageErr) {
      await admin.from("support_threads").delete().eq("id", thread.id).eq("user_id", user.id);
      return NextResponse.json({ error: "Failed to create support message" }, { status: 500 });
    }

    const sideEffectFailures: string[] = [];

    if (thread.division === "care") {
      try {
        await mirrorCareSupportThreadOpened({
          threadId: thread.id,
          subject,
          category: thread.category,
          priority: thread.priority,
          status: thread.status,
          message,
          customer: {
            userId: user.id,
            email: user.email,
            fullName: cleanText(customerProfile?.full_name) || cleanText(user.user_metadata?.full_name) || cleanText(user.user_metadata?.name) || user.email || "Customer",
            phone: cleanText(customerProfile?.phone) || cleanText(user.user_metadata?.phone),
          },
        });
      } catch {
        sideEffectFailures.push("care_support_bridge");
      }
    }

    // Activity
    const { error: activityErr } = await admin.from("customer_activity").insert({
      user_id: user.id,
      division,
      activity_type: "support_created",
      title: `Support request: ${subject}`,
      description: triage.shouldEscalate
        ? "Support request flagged for human attention."
        : "Support request submitted and triaged.",
      status: triage.shouldEscalate ? "escalated" : "open",
      reference_type: "support_thread",
      reference_id: thread.id,
      metadata: buildCanonicalActivityMetadata({
        division,
        activityType: "support_created",
        status: triage.shouldEscalate ? "escalated" : "open",
        referenceType: "support_thread",
        referenceId: thread.id,
        metadata: {
          triage_intent: triage.intent,
          triage_confidence: triage.confidence,
          triage_queue: triage.handoffSummary.suggestedQueue || "general",
        },
      }),
    });
    if (activityErr) sideEffectFailures.push("activity");

    // Notification
    const { error: notificationErr } = await admin.from("customer_notifications").insert({
      user_id: user.id,
      division,
      title: "Support request created",
      body: `Your request "${subject}" has been submitted. We'll get back to you soon.`,
      category: "support",
      priority: triage.shouldEscalate ? "high" : "normal",
      action_url: `/support/${thread.id}`,
      reference_type: "support_thread",
      reference_id: thread.id,
      detail_payload: {
        triage_intent: triage.intent,
        triage_confidence: triage.confidence,
      },
    });
    if (notificationErr) sideEffectFailures.push("notification");

    try {
      await emitIntelligenceEvent({
        name: triage.shouldEscalate ? AccountIntelEvents.supportEscalated : AccountIntelEvents.supportOpened,
        division,
        eventId: `support_open:${thread.id}`,
        actor: { kind: "user", subjectRef: user.id, roleHint: "customer" },
        properties: {
          title: "Support thread opened",
          summary: `Support request created with ${triage.intent} intent.`,
          threadId: thread.id,
          triageIntent: triage.intent,
          triageQueue: triage.handoffSummary.suggestedQueue || "general",
          escalated: triage.shouldEscalate,
        },
      });
    } catch {
      sideEffectFailures.push("intelligence_event");
    }

    const payload = {
      success: true,
      thread_id: thread.id,
      side_effects_ok: sideEffectFailures.length === 0,
      side_effect_failures: sideEffectFailures,
    };
    await rememberIdempotentResponse({
      userId: user.id,
      routeKey: "support.create",
      request,
      responsePayload: payload,
    });

    return NextResponse.json(payload, sideEffectFailures.length ? { status: 207 } : undefined);
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
