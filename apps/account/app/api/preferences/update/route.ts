import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ensureAccountProfileRecords } from "@/lib/account-profile";
import { USER_FACING_SAVE, logApiError } from "@/lib/user-facing-error";

const ALLOWED_FIELDS = [
  "email_marketing", "email_transactional", "email_digest", "push_enabled",
  "sms_enabled", "notification_care", "notification_marketplace",
  "notification_studio", "notification_wallet", "notification_security", "theme",
  "whatsapp_enabled", "notification_jobs", "notification_learn",
  "notification_property", "notification_logistics", "default_division",
];

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureAccountProfileRecords(user);

    const body = await request.json();

    // Only allow known fields
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of ALLOWED_FIELDS) {
      if (key in body) updates[key] = body[key];
    }

    const admin = createAdminSupabase();
    const { error } = await admin
      .from("customer_preferences")
      .upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" });

    if (error) {
      logApiError("preferences/update", error);
      return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logApiError("preferences/update", error);
    return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
  }
}
