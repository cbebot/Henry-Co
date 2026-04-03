import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminSupabase } from "@/lib/supabase";
import { cookies } from "next/headers";

const ALLOWED_FIELDS = [
  "email_marketing", "email_transactional", "email_digest", "push_enabled",
  "sms_enabled", "notification_care", "notification_marketplace",
  "notification_studio", "notification_wallet", "notification_security", "theme",
];

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

    const body = await request.json();

    // Only allow known fields
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of ALLOWED_FIELDS) {
      if (key in body) updates[key] = body[key];
    }

    const admin = createAdminSupabase();
    const { error } = await admin
      .from("customer_preferences")
      .update(updates)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
