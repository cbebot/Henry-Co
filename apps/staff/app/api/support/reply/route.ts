import { NextResponse } from "next/server";
import { createStaffSupabaseServer } from "@/lib/supabase/server";
import { createStaffAdminSupabase } from "@/lib/supabase/admin";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

export async function POST(request: Request) {
  try {
    const supabase = await createStaffSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    const { error: msgErr } = await admin.from("support_messages").insert({
      thread_id,
      sender_id: user.id,
      sender_type: "staff",
      body: message,
      attachments: [],
    });
    if (msgErr) {
      return NextResponse.json({ error: "Failed to insert reply" }, { status: 500 });
    }

    await admin
      .from("support_threads")
      .update({ status: "awaiting_customer", updated_at: new Date().toISOString() })
      .eq("id", thread_id);

    const { data: profile } = await admin
      .from("customer_profiles")
      .select("language")
      .eq("id", String(thread.user_id))
      .maybeSingle();

    const locale = clean(profile?.language) || "en";
    const subject = clean(thread.subject) || "your request";

    const renderedTitle = "Support reply received";
    const renderedBody = `A reply has been added to your request "${subject}".`;

    await admin.from("customer_notifications").insert({
      user_id: thread.user_id,
      division: clean(thread.division) || "support",
      category: "support",
      title: renderedTitle,
      body: renderedBody,
      priority: "normal",
      action_url: `/support/${thread_id}`,
      reference_type: "support_thread",
      reference_id: thread_id,
      detail_payload: {
        localization: {
          key: "support.reply.received",
          locale,
          params: { subject },
          rendered: { title: renderedTitle, body: renderedBody },
        },
      },
    } as never);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[staff/support/reply] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
