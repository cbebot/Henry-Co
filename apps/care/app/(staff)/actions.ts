"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabase } from "@/lib/supabase";
import { getAuthenticatedProfile } from "@/lib/auth/server";
import { homeForRole, normalizeRole, type StaffRole } from "@/lib/auth/roles";

function cleanText(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function normalizeStaffRole(value: string | null | undefined): StaffRole {
  const role = normalizeRole(value);
  return role === "customer" ? "staff" : role;
}

export async function markRoleNotificationsReadAction(formData: FormData) {
  const auth = await getAuthenticatedProfile();
  if (!auth?.user || !auth.profile) {
    return;
  }

  const role = normalizeStaffRole(cleanText(formData.get("role")) || auth.profile.role);
  const section = cleanText(formData.get("section")) || "all";
  const sourceRoute =
    cleanText(formData.get("source_route")) || `${homeForRole(role)}/notifications`;
  const unreadCount = Number(cleanText(formData.get("unread_count")) || 0);
  const supabase = createAdminSupabase();

  await supabase.from("care_security_logs").insert({
    event_type: "notification_center_read",
    route: sourceRoute,
    actor_user_id: auth.profile.id,
    actor_role: auth.profile.role,
    user_id: auth.profile.id,
    role: auth.profile.role,
    email: auth.user.email ?? null,
    success: true,
    details: {
      role,
      section,
      unread_count: Number.isFinite(unreadCount) ? unreadCount : null,
    },
  } as never);

  revalidatePath(`${homeForRole(role)}/notifications`);
  revalidatePath(homeForRole(role));
  revalidatePath(sourceRoute);
}

export async function markRoleNotificationItemReadAction(formData: FormData) {
  const auth = await getAuthenticatedProfile();
  if (!auth?.user || !auth.profile) {
    return;
  }

  const role = normalizeStaffRole(cleanText(formData.get("role")) || auth.profile.role);
  const itemId = cleanText(formData.get("item_id"));
  const sourceRoute =
    cleanText(formData.get("source_route")) || `${homeForRole(role)}/notifications`;

  if (!itemId) {
    return;
  }

  const supabase = createAdminSupabase();

  await supabase.from("care_security_logs").insert({
    event_type: "notification_item_read",
    route: sourceRoute,
    actor_user_id: auth.profile.id,
    actor_role: auth.profile.role,
    user_id: auth.profile.id,
    role: auth.profile.role,
    email: auth.user.email ?? null,
    success: true,
    details: {
      role,
      item_id: itemId,
    },
  } as never);

  revalidatePath(`${homeForRole(role)}/notifications`);
  revalidatePath(homeForRole(role));
  revalidatePath(sourceRoute);
}
