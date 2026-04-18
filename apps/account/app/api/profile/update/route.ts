import { NextResponse } from "next/server";
import { buildLocaleCookieOptions, normalizeLocale } from "@henryco/i18n/server";
import { DEFAULT_COUNTRY, getCountry } from "@henryco/i18n";
import { normalizePhone } from "@henryco/config";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ensureAccountProfileRecords } from "@/lib/account-profile";
import { USER_FACING_SAVE, logApiError } from "@/lib/user-facing-error";

type ProfileUpdateBody = {
  full_name?: string | null;
  phone?: string | null;
  country?: string | null;
  contact_preference?: string | null;
  language?: string | null;
};

function hasOwn(body: ProfileUpdateBody, key: keyof ProfileUpdateBody) {
  return Object.prototype.hasOwnProperty.call(body, key);
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureAccountProfileRecords(user);

    const body = (await request.json()) as ProfileUpdateBody;
    const admin = createAdminSupabase();

    const { data: currentProfile, error: profileError } = await admin
      .from("customer_profiles")
      .select("full_name, phone, country, contact_preference, language, currency, timezone")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      logApiError("profile/update:load-current", profileError);
      return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
    }

    const currentCountry =
      String(currentProfile?.country || user.user_metadata?.country || DEFAULT_COUNTRY).trim().toUpperCase() ||
      DEFAULT_COUNTRY;
    const nextCountry = hasOwn(body, "country")
      ? String(body.country || "").trim().toUpperCase() || currentCountry
      : currentCountry;
    const resolvedCountry = getCountry(nextCountry) || getCountry(currentCountry) || getCountry(DEFAULT_COUNTRY)!;

    const currentLanguage =
      typeof currentProfile?.language === "string" && currentProfile.language.trim()
        ? currentProfile.language
        : typeof user.user_metadata?.language === "string" && user.user_metadata.language.trim()
          ? user.user_metadata.language
          : normalizeLocale(resolvedCountry.locale);
    const nextLanguage = hasOwn(body, "language")
      ? normalizeLocale(body.language)
      : normalizeLocale(currentLanguage);

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = {
      id: user.id,
      email: user.email || null,
      updated_at: now,
      last_seen_at: now,
    };

    if (hasOwn(body, "full_name")) {
      updates.full_name = body.full_name?.trim() || null;
    }

    if (hasOwn(body, "phone")) {
      updates.phone = normalizePhone(body.phone || null);
    }

    if (hasOwn(body, "contact_preference")) {
      updates.contact_preference = body.contact_preference?.trim() || null;
    }

    if (hasOwn(body, "country")) {
      updates.country = resolvedCountry.code;
      updates.currency = resolvedCountry.currencyCode;
      updates.timezone = resolvedCountry.timezone;
    }

    if (hasOwn(body, "language")) {
      updates.language = nextLanguage;
    }

    const { error } = await admin
      .from("customer_profiles")
      .upsert(updates, { onConflict: "id" });

    if (error) {
      logApiError("profile/update", error);
      return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
    }

    const metadataPatch: Record<string, unknown> = {};
    if (hasOwn(body, "full_name") && body.full_name?.trim()) metadataPatch.full_name = body.full_name.trim();
    if (hasOwn(body, "contact_preference")) metadataPatch.contact_preference = body.contact_preference?.trim() || null;
    if (hasOwn(body, "country")) {
      metadataPatch.country = resolvedCountry.code;
      metadataPatch.currency = resolvedCountry.currencyCode;
      metadataPatch.timezone = resolvedCountry.timezone;
    }
    if (hasOwn(body, "language")) metadataPatch.language = nextLanguage;

    if (Object.keys(metadataPatch).length > 0) {
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...(user.user_metadata || {}), ...metadataPatch },
      });
    }

    const response = NextResponse.json({
      success: true,
      language: hasOwn(body, "language") ? nextLanguage : currentLanguage,
      country: hasOwn(body, "country") ? resolvedCountry.code : currentCountry,
    });

    if (hasOwn(body, "language")) {
      const host =
        request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
        request.headers.get("host") ||
        "";
      const localeCookie = buildLocaleCookieOptions(nextLanguage, host);
      response.cookies.set(localeCookie.name, localeCookie.value, {
        path: localeCookie.path,
        maxAge: localeCookie.maxAge,
        sameSite: localeCookie.sameSite,
        ...(localeCookie.domain ? { domain: localeCookie.domain } : {}),
      });
    }

    return response;
  } catch (error) {
    logApiError("profile/update", error);
    return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
  }
}
