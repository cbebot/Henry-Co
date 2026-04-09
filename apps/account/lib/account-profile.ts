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

function fullNameFromUser(user: User) {
  return (
    (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "") ||
    (typeof user.user_metadata?.name === "string" ? user.user_metadata.name.trim() : "") ||
    null
  );
}

function avatarFromUser(user: User) {
  return (
    (typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url.trim() : "") ||
    (typeof user.user_metadata?.picture === "string" ? user.user_metadata.picture.trim() : "") ||
    null
  );
}

function phoneFromUser(user: User) {
  return normalizePhone(
    typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : null
  );
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
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();

  if (!existingPreferences?.id) {
    await admin.from("customer_preferences").insert({
      user_id: user.id,
      default_division: "account",
      email_marketing: false,
      email_transactional: true,
      email_digest: true,
      push_enabled: true,
      sms_enabled: false,
      notification_care: true,
      notification_marketplace: true,
      notification_studio: true,
      notification_wallet: true,
      notification_security: true,
      theme: "system",
      updated_at: now,
    } as never);
  }
}
