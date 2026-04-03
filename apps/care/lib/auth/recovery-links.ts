import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import { buildCarePublicUrl } from "@/lib/care-links";
import { STAFF_CALLBACK_ROUTE } from "@/lib/auth/routes";

export type StaffAccessLinkIntent = "invite" | "recovery";

export async function createStaffAccessLink(
  email: string,
  intent: StaffAccessLinkIntent = "recovery"
) {
  const admin = createAdminSupabase();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const redirectTo = await buildCarePublicUrl(STAFF_CALLBACK_ROUTE, {
    intent,
  });

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: normalizedEmail,
    options: {
      redirectTo,
    },
  });

  if (error || !data?.properties?.hashed_token) {
    return {
      error: error ?? { message: "Recovery link could not be generated." },
      url: null,
      tokenHash: null,
    };
  }

  const fallbackUrl = await buildCarePublicUrl(STAFF_CALLBACK_ROUTE, {
    token_hash: data.properties.hashed_token,
    type: "recovery",
    intent,
  });
  const actionLink =
    typeof data.properties.action_link === "string"
      ? data.properties.action_link.trim()
      : "";
  const prefersActionLink =
    actionLink &&
    (actionLink.includes(encodeURIComponent(redirectTo)) ||
      actionLink.includes(redirectTo) ||
      actionLink.includes(encodeURIComponent(STAFF_CALLBACK_ROUTE)) ||
      actionLink.includes(STAFF_CALLBACK_ROUTE));
  const url = prefersActionLink ? actionLink : fallbackUrl;

  return {
    error: null,
    url,
    tokenHash: data.properties.hashed_token,
  };
}

export async function findAuthUserByEmail(email: string) {
  const admin = createAdminSupabase();
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail) return null;

  let page = 1;

  while (page <= 10) {
    const result = await admin.auth.admin.listUsers({ page, perPage: 200 });
    const users = result.data?.users ?? [];
    const match = users.find((user) => String(user.email || "").trim().toLowerCase() === normalizedEmail);

    if (match) return match;
    if (users.length < 200) break;

    page += 1;
  }

  return null;
}
