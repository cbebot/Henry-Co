import "server-only";

import type { User } from "@supabase/supabase-js";
import type { StaffRole } from "@/lib/auth/roles";
import { sendAdminNotificationEmail } from "@/lib/email/send";
import { createAdminSupabase } from "@/lib/supabase";

type StaffAlertRecipient = {
  id: string;
  email: string;
  fullName: string | null;
  role: StaffRole;
};

function cleanText(value?: string | null) {
  return String(value || "").trim();
}

async function getStaffAlertRecipients(roles: StaffRole[]) {
  const supabase = createAdminSupabase();
  const roleSet = new Set(roles);
  const [{ data: profileRows }, authUsersResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role, is_frozen")
      .in("role", roles)
      .eq("is_frozen", false),
    supabase.auth.admin.listUsers({ page: 1, perPage: 200 }),
  ]);
  const authUsers = authUsersResult.data?.users ?? [];
  const authUserMap = new Map(authUsers.map((user) => [user.id, user]));

  return ((profileRows ?? []) as Array<Record<string, unknown>>)
    .map((row) => ({
      id: cleanText(String(row.id || "")),
      email: cleanText(authUserMap.get(String(row.id || ""))?.email),
      fullName: cleanText(String(row.full_name || "")) || null,
      role: cleanText(String(row.role || "")).toLowerCase() as StaffRole,
      isFrozen: Boolean(row.is_frozen),
      user: authUserMap.get(String(row.id || "")) ?? null,
    }))
    .filter((row) => row.id && roleSet.has(row.role))
    .filter((row) => !row.isFrozen)
    .filter((row) => !isArchivedUser(row.user))
    .map((row) => ({
      id: row.id,
      email: row.email,
      fullName: row.fullName,
      role: row.role,
    }))
    .filter((row): row is StaffAlertRecipient => Boolean(row.email));
}

function isArchivedUser(user: User | null) {
  const deletedAt =
    cleanText(String(user?.app_metadata?.deleted_at || "")) ||
    cleanText(String(user?.user_metadata?.deleted_at || ""));

  return Boolean(deletedAt);
}

export async function notifyStaffRoles(input: {
  roles: StaffRole[];
  heading: string;
  summary: string;
  lines: string[];
}) {
  const recipients = await getStaffAlertRecipients(input.roles);
  const sent: Array<{ email: string; role: StaffRole; status: string }> = [];

  for (const recipient of recipients) {
    const result = await sendAdminNotificationEmail(recipient.email, {
      heading: input.heading,
      summary: input.summary,
      lines: [
        `Assigned role: ${recipient.role}`,
        ...input.lines,
      ],
    });

    sent.push({
      email: recipient.email,
      role: recipient.role,
      status: result.status,
    });
  }

  return {
    recipients,
    sent,
  };
}
