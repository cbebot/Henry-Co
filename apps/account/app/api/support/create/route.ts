import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminSupabase } from "@/lib/supabase";
import { cookies } from "next/headers";

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

    const { subject, category, message } = await request.json();

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message required" }, { status: 400 });
    }

    const admin = createAdminSupabase();

    // Create thread
    const { data: thread, error: threadErr } = await admin
      .from("support_threads")
      .insert({
        user_id: user.id,
        subject,
        category: category || "general",
        status: "open",
      })
      .select("id")
      .single();

    if (threadErr || !thread) {
      return NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
    }

    // Create first message
    await admin.from("support_messages").insert({
      thread_id: thread.id,
      sender_id: user.id,
      sender_type: "customer",
      body: message,
    });

    // Activity
    await admin.from("customer_activity").insert({
      user_id: user.id,
      division: "account",
      activity_type: "support_created",
      title: `Support request: ${subject}`,
      reference_type: "support_thread",
      reference_id: thread.id,
    });

    // Notification
    await admin.from("customer_notifications").insert({
      user_id: user.id,
      title: "Support request created",
      body: `Your request "${subject}" has been submitted. We'll get back to you soon.`,
      category: "support",
      action_url: `/support/${thread.id}`,
    });

    return NextResponse.json({ success: true, thread_id: thread.id });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
