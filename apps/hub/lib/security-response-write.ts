import "server-only";

import { createAdminSupabase } from "@/lib/supabase";

/**
 * Founder Intelligence F3 — security containment core.
 *
 * The "respond" half of the owner security watchtower: when the Threat watch
 * flags an account (impossible travel, a shared/compromised device, a takeover
 * pattern), the owner can SECURE it. Securing = revoke every recognised device
 * so each one must re-verify AND re-alert on its next sign-in, and strip any
 * "trusted" mark. This mirrors the account app's own `revokeAllKnownDevices`
 * used in the customer-facing "secure my account" flow, executed here via
 * service role from the owner console.
 *
 * Honest scope (the confirmation copy says this): this forces re-verification
 * on the NEXT sign-in and drops trust — it does not instantly kill a live
 * access token (that lives in the account app's own session, not reachable by
 * user-id from here). It is a strong containment step, not a session murder.
 *
 * Every write is audit-FIRST-abort: no trail, no action.
 */

export type SecureAccountTarget = {
  userId: string;
  userEmail: string | null;
  userLabel: string;
  /** Recognised devices that are not already revoked — the drift anchor. */
  activeDeviceCount: number;
};

/**
 * Read the containment target: who the account is + how many live recognised
 * devices it has. Returns null when the user id resolves to no account, so the
 * propose step shows no card for a phantom id.
 */
export async function readSecureAccountTarget(userId: string): Promise<SecureAccountTarget | null> {
  try {
    const admin = createAdminSupabase();
    const { data: profile } = await admin
      .from("customer_profiles")
      .select("id, full_name, email")
      .eq("id", userId)
      .maybeSingle();
    if (!profile) return null;

    const { count } = await admin
      .from("account_known_devices")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("revoked_at", null);

    const p = profile as { id: string; full_name: string | null; email: string | null };
    return {
      userId: p.id,
      userEmail: p.email,
      userLabel: p.full_name || p.email || `${userId.slice(0, 8)}…`,
      activeDeviceCount: typeof count === "number" ? count : 0,
    };
  } catch {
    return null;
  }
}

export type SecureAccountResult =
  | { ok: true; executionRef: string }
  | { ok: false; error: string };

/**
 * Secure an account: audit-first, then revoke every active recognised device,
 * then record the action on the security trail so it is visible in the console.
 */
export async function applySecureAccount(params: {
  userId: string;
  actorId: string;
  actorRole: string;
}): Promise<SecureAccountResult> {
  const admin = createAdminSupabase();
  const nowIso = new Date().toISOString();

  // Audit-FIRST-abort — matching every other founder-action core.
  const { error: auditError } = await admin.from("staff_audit_logs").insert({
    actor_id: params.actorId,
    actor_role: params.actorRole || "owner",
    action: "security.account.secure",
    entity: "customer_account",
    entity_id: params.userId,
    meta: { via: "founder_action", source: "owner_security_action" },
  } as never);
  if (auditError) {
    return { ok: false, error: "Audit logging failed; nothing was changed." };
  }

  // Revoke every device not already revoked. Count them first so the ref is honest.
  const { data: liveDevices } = await admin
    .from("account_known_devices")
    .select("id")
    .eq("user_id", params.userId)
    .is("revoked_at", null);
  const revokedCount = Array.isArray(liveDevices) ? liveDevices.length : 0;

  const { error: revokeError } = await admin
    .from("account_known_devices")
    .update({ revoked_at: nowIso, trusted_at: null } as never)
    .eq("user_id", params.userId)
    .is("revoked_at", null);
  if (revokeError) {
    return { ok: false, error: "Could not revoke the account's devices. Nothing was changed." };
  }

  // Record on the security trail so the action shows in the audit console and
  // (because event_type contains "secured"/"alert") reads as a sensitive change.
  try {
    await admin.from("customer_security_log").insert({
      user_id: params.userId,
      event_type: "account_secured_by_owner",
      metadata: {
        source: "owner_security_action",
        actor_id: params.actorId,
        revoked_devices: revokedCount,
        event_category: "sensitive_change",
        risk_level: "high",
      },
    } as never);
  } catch {
    // The trail entry is best-effort; the staff_audit_logs row above is the
    // authoritative record and it already committed.
  }

  return { ok: true, executionRef: `security:secure:${params.userId}:${revokedCount}` };
}
