import "server-only";

import type { User } from "@supabase/supabase-js";
import { normalizeEmail, normalizePhone } from "@henryco/config";
import { DEFAULT_COUNTRY, getCountry, normalizeLocale } from "@henryco/i18n";
import { createAdminSupabase } from "@/lib/supabase";

type CustomerProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  country?: string | null;
  language?: string | null;
  currency?: string | null;
  timezone?: string | null;
};

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function fullNameFromUser(user: User) {
  return asText(user.user_metadata?.full_name) || asText(user.user_metadata?.name) || null;
}

function avatarFromUser(user: User) {
  return asText(user.user_metadata?.avatar_url) || asText(user.user_metadata?.picture) || null;
}

function phoneFromUser(user: User) {
  return normalizePhone(asText(user.user_metadata?.phone) || null);
}

function defaultPreferences(userId: string, updatedAt: string) {
  return {
    user_id: userId,
    default_division: "account",
    email_marketing: true,
    email_transactional: true,
    email_digest: false,
    push_enabled: true,
    sms_enabled: false,
    whatsapp_enabled: false,
    notification_care: true,
    notification_marketplace: true,
    notification_studio: true,
    notification_wallet: true,
    notification_security: true,
    notification_jobs: true,
    notification_learn: true,
    notification_property: true,
    notification_logistics: true,
    notification_referrals: true,
    in_app_toast_enabled: true,
    notification_sound_enabled: false,
    notification_vibration_enabled: false,
    high_priority_only: false,
    quiet_hours_enabled: false,
    quiet_hours_start: "22:00",
    quiet_hours_end: "07:00",
    theme: "system",
    updated_at: updatedAt,
  };
}

export async function ensureAccountProfileRecords(user: User) {
  const admin = createAdminSupabase();
  const now = new Date().toISOString();
  const email = normalizeEmail(user.email);
  const fullName = fullNameFromUser(user);
  const phone = phoneFromUser(user);
  const avatarUrl = avatarFromUser(user);
  const countryCode =
    String(user.user_metadata?.country || "").trim().toUpperCase() || DEFAULT_COUNTRY;
  const country = getCountry(countryCode) || getCountry(DEFAULT_COUNTRY)!;
  const language = normalizeLocale(
    typeof user.user_metadata?.language === "string" ? user.user_metadata.language : country.locale
  );

  const { data: existingProfile } = await admin
    .from("customer_profiles")
    .select("id, email, full_name, phone, avatar_url, country, language, currency, timezone")
    .eq("id", user.id)
    .maybeSingle<CustomerProfileRow>();

  if (existingProfile?.id) {
    const updates: Record<string, unknown> = {
      email: email || existingProfile.email,
      is_active: true,
      last_seen_at: now,
      updated_at: now,
      currency: existingProfile.currency || country.currencyCode,
      timezone: existingProfile.timezone || country.timezone,
      language: existingProfile.language || language,
    };

    if (fullName && fullName !== existingProfile.full_name) {
      updates.full_name = fullName;
    }

    if (phone && phone !== existingProfile.phone) {
      updates.phone = phone;
    }

    if (avatarUrl && avatarUrl !== existingProfile.avatar_url) {
      updates.avatar_url = avatarUrl;
    }

    if (countryCode && countryCode !== existingProfile.country) {
      updates.country = countryCode;
    }

    await admin.from("customer_profiles").update(updates as never).eq("id", user.id);
  } else {
    // STAB-01: upsert-ignore instead of bare INSERT. The on_auth_user_created_customer
    // trigger (handle_new_customer) also seeds this row, and concurrent renders can
    // race this branch — a plain INSERT loses that race with a duplicate-key error
    // (the customer_profiles_pkey flood seen in prod logs). ignoreDuplicates makes it
    // a no-throw INSERT ... ON CONFLICT DO NOTHING; if another writer already created
    // the row, we leave their copy intact (the UPDATE branch above owns refreshes).
    await admin.from("customer_profiles").upsert(
      {
        id: user.id,
        email,
        full_name: fullName,
        phone,
        avatar_url: avatarUrl,
        country: country.code,
        language,
        currency: country.currencyCode,
        timezone: country.timezone,
        is_active: true,
        onboarded_at: now,
        last_seen_at: now,
        updated_at: now,
      } as never,
      { onConflict: "id", ignoreDuplicates: true },
    );
  }

  const { data: existingPreferences } = await admin
    .from("customer_preferences")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle<{ user_id: string }>();

  if (!existingPreferences?.user_id) {
    // DIAG-ACCOUNT-01 hardening: the original INSERT enumerated every key in
    // `defaultPreferences()` — including columns added by historical
    // migrations that hadn't landed in production. The insert silently failed
    // inside the `after()` callback in apps/account/lib/auth.ts, so signed-up
    // users never got a preferences row created.
    //
    // First-pass attempt: full default shape (includes every column tracked
    // by the source-of-truth migration set).
    //
    // STAB-01: upsert-ignore instead of bare INSERT. handle_new_customer seeds
    // this row on signup and concurrent renders race this branch, so a plain
    // INSERT produced the customer_preferences_user_id_key duplicate-key flood.
    // ignoreDuplicates → no-throw ON CONFLICT DO NOTHING; the existence check
    // above already covers the common case, this just closes the race window.
    const { error } = await admin
      .from("customer_preferences")
      .upsert(defaultPreferences(user.id, now) as never, {
        onConflict: "user_id",
        ignoreDuplicates: true,
      });

    // If the schema is drifted (42703 undefined_column), fall back to the
    // minimal viable upsert — just `user_id` + the trigger / table defaults
    // fill the rest. This guarantees first-login users ALWAYS get a row
    // regardless of which migration tier the prod DB is on. A drifted
    // preferences row missing 2-3 booleans is strictly better than no row
    // at all (the GET endpoint merges over defaults anyway).
    if (error && typeof (error as { code?: unknown }).code === "string") {
      const code = (error as { code?: unknown }).code as string;
      if (code === "42703") {
        await admin
          .from("customer_preferences")
          .upsert({ user_id: user.id } as never, {
            onConflict: "user_id",
            ignoreDuplicates: true,
          })
          .then(() => undefined);
      }
    }
  }
}
