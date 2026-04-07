import { NextResponse } from "next/server";
import { buildLocaleCookieOptions, normalizeLocale } from "@henryco/i18n/server";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ensureAccountProfileRecords } from "@/lib/account-profile";
import { USER_FACING_SAVE, logApiError } from "@/lib/user-facing-error";
import { normalizePhone } from "@henryco/config";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureAccountProfileRecords(user);

    const { full_name, phone, country, contact_preference, language } = await request.json();

    const admin = createAdminSupabase();
    const updates: Record<string, unknown> = {
      full_name: full_name || null,
      phone: normalizePhone(phone || null),
      email: user.email || null,
      updated_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    };
    if (country) updates.country = country;
    if (contact_preference) updates.contact_preference = contact_preference;
    if (language) updates.language = normalizeLocale(language);

    const { error } = await admin
      .from("customer_profiles")
      .upsert({ id: user.id, ...updates }, { onConflict: "id" });

    if (error) {
      logApiError("profile/update", error);
      return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
    }
    const normalizedLanguage = language ? normalizeLocale(language) : null;
    const metadataPatch: Record<string, unknown> = {};
    if (full_name) metadataPatch.full_name = full_name;
    if (country) metadataPatch.country = country;
    if (contact_preference) metadataPatch.contact_preference = contact_preference;
    if (normalizedLanguage) metadataPatch.language = normalizedLanguage;
    if (Object.keys(metadataPatch).length > 0) {
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...(user.user_metadata || {}), ...metadataPatch },
      });
    }

    const res = NextResponse.json({ success: true });
    if (language) {
      const host =
        request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
        request.headers.get("host") ||
        "";
      const loc = normalizeLocale(language);
      const o = buildLocaleCookieOptions(loc, host);
      res.cookies.set(o.name, o.value, {
        path: o.path,
        maxAge: o.maxAge,
        sameSite: o.sameSite,
        ...(o.domain ? { domain: o.domain } : {}),
      });
    }

    return res;
  } catch (error) {
    logApiError("profile/update", error);
    return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
  }
}
