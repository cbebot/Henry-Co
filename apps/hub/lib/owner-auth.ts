import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAccountUrl, getHqUrl } from "@henryco/config";
import { normalizeEmail } from "@/lib/env";
import { createAdminSupabase } from "@/lib/supabase";
import { requireOwner as requireHubOwnerAccess } from "@/app/lib/owner-auth";
import { logOwnerSurfaceError } from "@/lib/owner-diagnostics";

export type OwnerUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  isOwner: true;
  ownerRole: string;
  /** True when admin/profile queries failed; UI should show a safe notice and avoid white screens. */
  commandCenterProfileIncomplete?: boolean;
};

type HubOwnerSession = Extract<Awaited<ReturnType<typeof requireHubOwnerAccess>>, { ok: true }>;

function degradedOwnerUser(auth: HubOwnerSession, error: unknown): OwnerUser {
  logOwnerSurfaceError("lib/owner-auth.requireOwner.degraded", error, { userId: auth.user.id });
  return {
    id: auth.user.id,
    email: normalizeEmail(auth.user.email),
    fullName: null,
    avatarUrl: null,
    phone: null,
    isOwner: true,
    ownerRole: "owner",
    commandCenterProfileIncomplete: true,
  };
}

async function ownerReturnUrlFromRequest() {
  const h = await headers();
  let pathname = h.get("x-henry-pathname") || "/owner";
  const search = h.get("x-henry-search") || "";

  if (!pathname.startsWith("/")) {
    pathname = `/${pathname}`;
  }

  if (pathname === "/" || pathname === "") {
    return getHqUrl("/owner");
  }

  return getHqUrl(`${pathname}${search}`);
}

export async function requireOwner(): Promise<OwnerUser> {
  const auth = await requireHubOwnerAccess();

  if (!auth.ok) {
    if (auth.reason === "forbidden" || auth.reason === "misconfigured") {
      redirect("/owner/no-access");
    }

    const next = await ownerReturnUrlFromRequest();
    redirect(getAccountUrl(`/login?next=${encodeURIComponent(next)}`));
  }

  try {
    const admin = createAdminSupabase();
    const [profileRes, directOwnerProfileRes] = await Promise.all([
      admin
        .from("customer_profiles")
        .select("full_name, avatar_url, phone")
        .eq("id", auth.user.id)
        .maybeSingle(),
      admin
        .from("owner_profiles")
        .select("role")
        .eq("user_id", auth.user.id)
        .eq("is_active", true)
        .maybeSingle(),
    ]);

    const emailOwnerProfileRes =
      !directOwnerProfileRes.data && auth.user.email
        ? await admin
            .from("owner_profiles")
            .select("role")
            .eq("email", normalizeEmail(auth.user.email))
            .eq("is_active", true)
            .maybeSingle()
        : { data: null, error: null };

    if (profileRes.error) {
      return degradedOwnerUser(auth, profileRes.error);
    }
    if (directOwnerProfileRes.error || emailOwnerProfileRes.error) {
      return degradedOwnerUser(auth, directOwnerProfileRes.error || emailOwnerProfileRes.error);
    }

    const ownerProfile = directOwnerProfileRes.data || emailOwnerProfileRes.data;

    return {
      id: auth.user.id,
      email: normalizeEmail(auth.user.email),
      fullName: profileRes.data?.full_name || null,
      avatarUrl: profileRes.data?.avatar_url || null,
      phone: profileRes.data?.phone || null,
      isOwner: true,
      ownerRole: String(ownerProfile?.role || "owner").trim().toLowerCase() || "owner",
    };
  } catch (error) {
    return degradedOwnerUser(auth, error);
  }
}
