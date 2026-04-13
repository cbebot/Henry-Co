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
    theme: "system",
    updated_at: updatedAt,
  };
}

function shouldRealignRegionalField(input: {
  value: string | null | undefined;
  nigeriaDefault: string;
  countryCode: string;
}) {
  if (!input.value) return true;
  if (input.countryCode === DEFAULT_COUNTRY) return false;
  return input.value === input.nigeriaDefault;
}

export async function ensureAccountProfileRecords(user: User) {
  const admin = createAdminSupabase();
  const now = new Date().toISOString();
  const email = normalizeEmail(user.email);
  const fullName = fullNameFromUser(user);
  const phone = phoneFromUser(user);
  const avatarUrl = avatarFromUser(user);
  const metadataCountryCode = String(user.user_metadata?.country || "").trim().toUpperCase();
  const countryCode = metadataCountryCode || DEFAULT_COUNTRY;
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
    const nextCountryCode = existingProfile.country || metadataCountryCode || DEFAULT_COUNTRY;
    const nextCountry = getCountry(nextCountryCode) || getCountry(DEFAULT_COUNTRY)!;
    const updates: Record<string, unknown> = {
      email: email || existingProfile.email,
      is_active: true,
      last_seen_at: now,
      updated_at: now,
      currency: shouldRealignRegionalField({
        value: existingProfile.currency,
        nigeriaDefault: getCountry(DEFAULT_COUNTRY)!.currencyCode,
        countryCode: nextCountry.code,
      })
        ? nextCountry.currencyCode
        : existingProfile.currency,
      timezone: shouldRealignRegionalField({
        value: existingProfile.timezone,
        nigeriaDefault: getCountry(DEFAULT_COUNTRY)!.timezone,
        countryCode: nextCountry.code,
      })
        ? nextCountry.timezone
        : existingProfile.timezone,
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

    if (metadataCountryCode && metadataCountryCode !== existingProfile.country) {
      updates.country = metadataCountryCode;
    }

    await admin.from("customer_profiles").update(updates as never).eq("id", user.id);
  } else {
    await admin.from("customer_profiles").insert({
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
    } as never);
  }

  const { data: existingPreferences } = await admin
    .from("customer_preferences")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle<{ user_id: string }>();

  if (!existingPreferences?.user_id) {
    await admin.from("customer_preferences").insert(defaultPreferences(user.id, now) as never);
  }
}
