import "server-only";

import { cache } from "react";
import { after } from "next/server";
import { redirect } from "next/navigation";
import {
  isRecoverableSupabaseAuthError,
  normalizeEmail,
  normalizePhone,
  resolveUserAvatarFromSources,
} from "@henryco/config";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { scheduleLinkedCareBookingsSync } from "@/lib/care-sync";
import { ensureAccountProfileRecords } from "@/lib/account-profile";

/**
 * STAB-01: how long a freshly-reconciled session stays "fresh" before
 * getAccountUser will re-run the deferred profile-seed + care-linkage jobs.
 * RouteLiveRefresh fires router.refresh() every 12–45s; without this throttle
 * each refresh re-ran both jobs (≈4 reconciliations/minute/tab), which flooded
 * PostgREST and — under the reprovisioned 60-connection ceiling — tipped the
 * pool into FATAL 53300, throttling the shared money path. 5 minutes keeps the
 * linkage feeling live while cutting the reconciliation rate ~20×.
 */
const ACCOUNT_RECONCILE_TTL_MS = 5 * 60_000;

export type AccountUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  isVerified: boolean;
  isOwner: boolean;
  ownerRole: string | null;
};

export const getAccountUser = cache(async (): Promise<AccountUser | null> => {
  const supabase = await createSupabaseServer();
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] | null = null;

  try {
    const auth = await supabase.auth.getUser();
    user = auth.data.user;
  } catch (error) {
    if (!isRecoverableSupabaseAuthError(error)) {
      throw error;
    }
  }

  if (!user) return null;

  const admin = createAdminSupabase();
  const [{ data: profile }, { data: ownerProfile }] = await Promise.all([
    admin
      .from("customer_profiles")
      .select("full_name, avatar_url, phone, is_verified, last_seen_at")
      .eq("id", user.id)
      .maybeSingle(),
    admin
      .from("owner_profiles")
      .select("role, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  const fullName =
    profile?.full_name ||
    (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
    (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null) ||
    null;
  const phone =
    normalizePhone(
      profile?.phone ||
        (typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : null) ||
        null
    ) || null;
  const email = normalizeEmail(user.email);

  // STAB-01: only run the deferred reconciliation jobs when this session hasn't
  // been reconciled within ACCOUNT_RECONCILE_TTL_MS. Both jobs bump
  // customer_profiles.last_seen_at, so the freshness read below naturally
  // throttles them — a router.refresh() storm no longer re-fires them. A brand
  // new session (no row yet, or stale last_seen_at) always reconciles.
  const lastSeenMs = (() => {
    const raw = (profile as { last_seen_at?: string | null } | null)?.last_seen_at;
    return raw ? Date.parse(raw) : Number.NaN;
  })();
  const shouldReconcile =
    Number.isNaN(lastSeenMs) || Date.now() - lastSeenMs > ACCOUNT_RECONCILE_TTL_MS;

  if (shouldReconcile) {
    after(() => {
      void ensureAccountProfileRecords(user).catch((error) => {
        console.error("[henryco/account] Deferred profile seed failed:", error);
      });
    });
    scheduleLinkedCareBookingsSync({
      userId: user.id,
      email,
      fullName,
      phone,
    });
  }

  return {
    id: user.id,
    email,
    fullName,
    avatarUrl: resolveUserAvatarFromSources(profile?.avatar_url ?? null, user.user_metadata as Record<
      string,
      unknown
    > | null),
    phone,
    isVerified: profile?.is_verified || false,
    isOwner: !!ownerProfile,
    ownerRole: ownerProfile?.role || null,
  };
});

export async function requireAccountUser(): Promise<AccountUser> {
  const user = await getAccountUser();
  if (!user) redirect("/login");
  return user;
}
