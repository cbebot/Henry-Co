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

    const { thread_id, body } = await request.json();
    if (!thread_id || !body) {
      return NextResponse.json({ error: "Thread ID and body required" }, { status: 400 });
    }

    const admin = createAdminSupabase();

    // Verify thread ownership
    const { data: thread } = await admin
      .from("support_threads")
      .select("id, user_id")
      .eq("id", thread_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

    // Insert message
    await admin.from("support_messages").insert({
      thread_id,
      sender_id: user.id,
      sender_type: "customer",
      body,
    });

    // Update thread
    await admin
      .from("support_threads")
      .update({ status: "awaiting_reply", updated_at: new Date().toISOString() })
      .eq("id", thread_id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
