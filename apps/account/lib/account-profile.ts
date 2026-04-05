import "server-only";

import type { User } from "@supabase/supabase-js";
import { normalizeEmail, normalizePhone } from "@henryco/config";
import { createAdminSupabase } from "@/lib/supabase";

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function profileSeed(user: User) {
  const fullName =
    asText(user.user_metadata?.full_name) ||
    asText(user.user_metadata?.name) ||
    null;
  const phone = normalizePhone(asText(user.user_metadata?.phone) || null);

  return {
    id: user.id,
    email: normalizeEmail(user.email),
    full_name: fullName,
    phone,
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true,
  };
}

function defaultPreferences(userId: string) {
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
    updated_at: new Date().toISOString(),
  };
}

export async function ensureAccountProfileRecords(user: User) {
  const admin = createAdminSupabase();
  const seed = profileSeed(user);

  const profilePayload = Object.fromEntries(
    Object.entries(seed).filter(([, value]) => value !== null && value !== "")
  );

  await Promise.all([
    admin.from("customer_profiles").upsert(profilePayload, { onConflict: "id" }),
    admin
      .from("customer_preferences")
      .upsert(defaultPreferences(user.id), {
        onConflict: "user_id",
        ignoreDuplicates: true,
      }),
  ]);
}
