import { NextResponse } from "next/server";
import { normalizeLocale } from "@henryco/i18n";
import { normalizeDivision, publishNotification } from "@henryco/notifications";
import { createStaffSupabaseServer } from "@/lib/supabase/server";
import { createStaffAdminSupabase } from "@/lib/supabase/admin";
import { getStaffViewer } from "@/lib/staff-auth";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function renderSupportReplyNotification(locale: string, subject: string) {
  const normalized = normalizeLocale(locale);
  if (normalized === "fr") return { title: "Nouvelle reponse du support", body: `Une reponse a ete ajoutee a votre demande "${subject}".` };
  if (normalized === "es") return { title: "Nueva respuesta de soporte", body: `Se agrego una respuesta a tu solicitud "${subject}".` };
  if (normalized === "pt") return { title: "Nova resposta do suporte", body: `Uma resposta foi adicionada ao seu pedido "${subject}".` };
  if (normalized === "ar") return { title: "رد جديد من الدعم", body: `تمت إضافة رد على طلبك "${subject}".` };
  if (normalized === "de") return { title: "Neue Supportantwort", body: `Auf deine Anfrage "${subject}" wurde geantwortet.` };
  if (normalized === "it") return { title: "Nuova risposta al supporto", body: `E stata aggiunta una risposta alla tua richiesta "${subject}".` };
  return { title: "Support reply received", body: `A reply has been added to your request "${subject}".` };
}

export async function POST(request: Request) {
  try {
    const supabase = await createStaffSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const viewer = await getStaffViewer();
    if (!viewer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const thread_id = clean(payload?.thread_id);
    const message = clean(payload?.message || payload?.body);

    if (!thread_id || !message) {
      return NextResponse.json({ error: "thread_id and message required" }, { status: 400 });
    }

    const admin = createStaffAdminSupabase();

    const { data: thread } = await admin
      .from("support_threads")
      .select("id, user_id, subject, division")
      .eq("id", thread_id)
      .maybeSingle();

    if (!thread) {
      return NextResponse.json({ error: "Support thread not found" }, { status: 404 });
    }

    const threadDivision = clean(thread.division).toLowerCase();
    const canAccessThread =
      !threadDivision ||
      threadDivision === "account" ||
      threadDivision === "support" ||
      viewer.permissions.includes("workspace.manage") ||
      viewer.permissions.includes("staff.directory.view") ||
      viewer.divisions.some((membership) => membership.division === threadDivision);

    if (!canAccessThread) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: msgErr } = await admin.from("support_messages").insert({
      thread_id,
      sender_id: user.id,
      sender_type: "agent",
      body: message,
      attachments: [],
    });
    if (msgErr) {
      return NextResponse.json({ error: "Failed to insert reply" }, { status: 500 });
    }

    const { error: threadErr } = await admin
      .from("support_threads")
      .update({ status: "in_progress", updated_at: new Date().toISOString() })
      .eq("id", thread_id);
    if (threadErr) {
      return NextResponse.json({ error: "Failed to update support thread" }, { status: 500 });
    }

    const { data: profile } = await admin
      .from("customer_profiles")
      .select("language")
      .eq("id", String(thread.user_id))
      .maybeSingle();

    const locale = clean(profile?.language) || "en";
    const subject = clean(thread.subject) || "your request";
    const rendered = renderSupportReplyNotification(locale, subject);

    const sideEffectFailures: string[] = [];

    const publishResult = await publishNotification({
      userId: String(thread.user_id),
      division: normalizeDivision(clean(thread.division)),
      eventType: "support.reply.received",
      severity: "info",
      title: rendered.title,
      body: rendered.body,
      deepLink: `/support/${thread_id}`,
      relatedType: "support_thread",
      relatedId: thread_id,
      publisher: "bridge:apps/staff/app/api/support/reply",
    });

    if (!publishResult.ok) {
      console.error("[staff/support/reply] Failed to create customer notification:", publishResult.error);
      sideEffectFailures.push("customer_notification");
    }

    return NextResponse.json(
      {
        success: true,
        side_effects_ok: sideEffectFailures.length === 0,
        side_effect_failures: sideEffectFailures,
      },
      sideEffectFailures.length ? { status: 207 } : undefined
    );
  } catch (err) {
    console.error("[staff/support/reply] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
