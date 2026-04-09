import "server-only";

import type { User } from "@supabase/supabase-js";
import { normalizeEmail, normalizePhone } from "@henryco/config";
import { createAdminSupabase } from "@/lib/supabase";

type CustomerProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
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

export async function ensureAccountProfileRecords(user: User) {
  const admin = createAdminSupabase();
  const now = new Date().toISOString();
  const email = normalizeEmail(user.email);
  const fullName = fullNameFromUser(user);
  const phone = phoneFromUser(user);
  const avatarUrl = avatarFromUser(user);

  const { data: existingProfile } = await admin
    .from("customer_profiles")
    .select("id, email, full_name, phone, avatar_url")
    .eq("id", user.id)
    .maybeSingle<CustomerProfileRow>();

  if (existingProfile?.id) {
    const updates: Record<string, unknown> = {
      email: email || existingProfile.email,
      is_active: true,
      last_seen_at: now,
      updated_at: now,
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

    await admin.from("customer_profiles").update(updates as never).eq("id", user.id);
  } else {
    await admin.from("customer_profiles").insert({
      id: user.id,
      email,
      full_name: fullName,
      phone,
      avatar_url: avatarUrl,
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
