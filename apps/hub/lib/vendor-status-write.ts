import "server-only";

import { publishNotification } from "@henryco/notifications";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * V3-OWNER-CONTROL-01 — marketplace vendor suspend / reinstate.
 *
 * `marketplace_vendors.status = 'suspended'` was declared in the types and
 * written by nothing: the owner could see a live seller misbehaving and had no
 * way to take them offline short of raw SQL. This is that control.
 *
 * WHY AN RPC AND NOT TWO POSTGREST CALLS: suspending a seller is two writes —
 * the storefront status AND the `marketplace_role_memberships` vendor role that
 * grants access to the vendor workspace. Split across two round trips, a
 * failure between them leaves a seller who is hidden from the catalogue but
 * still able to operate (or the reverse). `owner_set_vendor_active` performs
 * both inside one transaction with `SELECT … FOR UPDATE` and a compare-and-set
 * on the prior status, so there is no half-suspended state to land in.
 *
 * The RPC re-asserts the actor against `owner_profiles` itself, so even a
 * caller that skipped this module's callers cannot drive it with a forged id.
 *
 * NO MONEY: suspension changes visibility and access. It does not touch
 * payouts, orders, refunds, or the ledger. Money already owed to a suspended
 * vendor stays exactly where it was, which is the correct default — freezing
 * funds is a separate decision with its own guarded path.
 */

export type VendorStatusIntent = "suspend" | "reinstate";

export type VendorStatusState = {
  vendorId: string;
  name: string;
  slug: string | null;
  status: string;
  ownerUserId: string | null;
};

export async function readVendorStatus(vendorId: string): Promise<VendorStatusState | null> {
  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("marketplace_vendors")
    .select("id, name, slug, status, owner_user_id")
    .eq("id", vendorId)
    .maybeSingle();
  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  return {
    vendorId,
    name: String(row.name || "this store"),
    slug: row.slug ? String(row.slug) : null,
    status: String(row.status || "pending"),
    ownerUserId: row.owner_user_id ? String(row.owner_user_id) : null,
  };
}

export async function applyVendorStatus(input: {
  vendorId: string;
  intent: VendorStatusIntent;
  note: string;
  actorId: string;
  actorRole: string;
  /**
   * Prior status the decision was made against. The atomic guard here is
   * `owner_set_vendor_active`, which decides suspend/reinstate legality inside
   * the database and reports `changed` honestly — so this is the outer half of
   * the same idea: refuse before writing an audit row for a transition the
   * caller was reasoning about from a status that has since moved.
   */
  expectedStatus?: string;
}): Promise<{ ok: true; executionRef: string; changed: boolean } | { ok: false; error: string }> {
  const { vendorId, intent, note, actorId, actorRole, expectedStatus } = input;

  if (intent !== "suspend" && intent !== "reinstate") {
    return { ok: false, error: "Choose a valid vendor status change." };
  }
  if (intent === "suspend" && !note.trim()) {
    return { ok: false, error: "Add a reason before suspending a seller." };
  }

  const admin = createAdminSupabase();

  const before = await readVendorStatus(vendorId);
  if (!before) {
    return { ok: false, error: "That seller could not be found." };
  }
  if (expectedStatus && before.status !== expectedStatus) {
    return {
      ok: false,
      error: "That seller moved while you were deciding. Refresh to see where they stand now.",
    };
  }

  // Audit-first: no trail, no action.
  const { error: auditError } = await admin.from("staff_audit_logs").insert({
    actor_id: actorId,
    actor_role: actorRole || "owner",
    action: `marketplace.vendor.${intent}`,
    entity: "marketplace_vendor",
    entity_id: vendorId,
    meta: {
      store_name: before.name,
      prior_status: before.status,
      target_user_id: before.ownerUserId,
      reviewer_note_present: Boolean(note.trim()),
      via: "owner_control",
    },
  } as never);
  if (auditError) {
    console.error("[vendor-status-write] staff audit insert failed", auditError.message);
    return { ok: false, error: "Audit logging failed; the seller was not changed." };
  }

  const { data, error } = await admin.rpc("owner_set_vendor_active", {
    p_vendor_id: vendorId,
    p_actor: actorId,
    p_suspend: intent === "suspend",
  });
  if (error) {
    console.error("[vendor-status-write] owner_set_vendor_active failed", error.message);
    return { ok: false, error: "That seller status could not be changed." };
  }

  const result = (data ?? {}) as {
    ok?: boolean;
    changed?: boolean;
    error?: string;
    prior_status?: string;
  };
  if (!result.ok) {
    if (result.error === "not_suspended") {
      return { ok: false, error: "Only a suspended seller can be reinstated." };
    }
    if (result.error === "vendor_not_found") {
      return { ok: false, error: "That seller could not be found." };
    }
    return { ok: false, error: "That seller status could not be changed." };
  }

  // Best-effort tail — the status already landed; this must never flip it.
  try {
    if (before.ownerUserId) {
      await publishNotification({
        userId: before.ownerUserId,
        division: "marketplace",
        eventType: "marketplace.vendor.status",
        severity: intent === "suspend" ? "warning" : "success",
        title: intent === "suspend" ? "Your store has been suspended" : "Your store has been reinstated",
        body:
          intent === "suspend"
            ? note.trim() || `${before.name} is suspended and is no longer visible to buyers.`
            : note.trim() || `${before.name} is live again and visible to buyers.`,
        deepLink: "/vendor",
        relatedType: "marketplace_vendor",
        relatedId: vendorId,
        actorUserId: actorId,
        publisher: "bridge:apps/hub/lib/vendor-status-write",
      });
    }
  } catch (error) {
    console.error("[vendor-status-write] notify step failed (status landed)", error);
  }

  return {
    ok: true,
    executionRef: `vendor:${vendorId}:${intent}`,
    changed: result.changed === true,
  };
}
