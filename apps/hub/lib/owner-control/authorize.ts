import "server-only";

import { NextResponse } from "next/server";
import { requireOwner } from "@/app/lib/owner-auth";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * V3-OWNER-CONTROL-01 — authorization for the owner action rail.
 *
 * TWO INDEPENDENT GATES, both server-side, and the request must clear BOTH:
 *
 *   1. `requireOwner()` — the app gate. Resolves the session and checks
 *      `owner_profiles`. This is TypeScript reading a table.
 *   2. `owner_control_is_owner()` — the SQL gate, executed under the CALLER'S
 *      OWN JWT (the cookie-scoped client, never the service-role client). It is
 *      SECURITY DEFINER over `auth.uid()`, so it cannot be satisfied by any
 *      value the request supplies; it can only be satisfied by actually being
 *      the signed-in owner.
 *
 * Gate 2 is not decoration. The pass brief requires that authorization be
 * SQL-verified and "never a TS mirror alone", because a TS-only check is only
 * as good as every future caller remembering to run it. Anchoring on
 * `auth.uid()` means the database itself, not app code, decides.
 *
 * WHY NOT THE SHARED `is_owner()`: on prod as captured in
 * supabase/prod-actual/schema.sql it is SECURITY INVOKER, so it reads
 * owner_profiles subject to owner_profiles' own RLS — whose
 * `owner_profiles_owner_write ... using (is_owner())` policy calls it again.
 * That is the HUB-1 recursion trap, masked today only because every existing
 * caller reaches that table through service-role. The hardening migration that
 * fixes it is committed but not confirmed applied, and a gate that fails closed
 * on a recursion error would leave the owner unable to act — reproducing the
 * outage this pass exists to end. So the rail ships and calls its own
 * SECURITY DEFINER predicate; see the note above it in the migration.
 *
 * DELIBERATELY NARROWER THAN THE PAGE GATE: `requireOwner()` will match an
 * owner_profiles row by EMAIL when the session's email is confirmed and no
 * user_id row exists (the HUB-4 fallback). The SQL gate matches on `user_id`
 * only. The rail therefore refuses an email-only-bound owner. That is
 * intentional — the "email-OR role binding" pattern is a named ecosystem-wide
 * finding from the FIRE audits, and a surface that suspends sellers is the last
 * place to honour the looser binding. The live owner row is user_id-bound, so
 * this narrowing locks nobody out today; if a future owner is seeded by email
 * alone they must be given a user_id before they can act, which is the correct
 * outcome rather than a silent widening.
 *
 * WHAT `owner_control_assert_actor()` DOES AND DOES NOT DO. An earlier draft of
 * this comment said it "applies the SAME user_id-only rule inside every RPC, so
 * the posture holds even if this module is bypassed". That overstated it, and
 * the overstatement is the dangerous kind — it invites a future caller to skip
 * this module believing the database will still catch them.
 *
 * The RPCs run through the SERVICE-ROLE client, where `auth.uid()` is NULL. No
 * function invoked that way can verify that the CALLER is the actor it was
 * handed; that binding is structurally unavailable. What assert_actor does is
 * check that the uuid it was given names a live owner_profiles row with role
 * owner or admin — an EXISTENCE check, fail-closed on NULL and on no-match.
 *
 * So it defends against a trusted server path passing a wrong or non-owner id
 * (a bug, a future careless caller, a compromised code path), not against a
 * forged caller. The caller→actor binding happens HERE and only here, in gate 2,
 * which runs under the caller's own JWT where `auth.uid()` is real. That is why
 * this module is not optional, and why the RPCs are additionally revoked from
 * anon and authenticated so no browser session can reach them directly.
 *
 * FAIL-CLOSED: an RPC transport error is treated as "not an owner". A database
 * that cannot answer must never resolve to permission granted.
 */

export type OwnerControlActor = {
  id: string;
  email: string | null;
  /**
   * Real `owner_profiles.role`, verbatim. Recorded on the owner-control ledger,
   * whose `actor_role` is plain text — so an admin acting is not logged as
   * "owner".
   */
  role: string;
  /**
   * The same role narrowed to something `staff_audit_logs.actor_role` can hold.
   * That column is the `app_role` ENUM ('owner','manager','rider','customer',
   * 'support','cashier','promoter'); `owner_profiles.role` is free text under a
   * CHECK admitting ('owner','editor','viewer'), and the SQL gate additionally
   * accepts 'admin'. Those vocabularies overlap only at 'owner'.
   *
   * Today the intersection makes this a no-op: passing the gate requires
   * ('owner','admin') and the CHECK forbids 'admin', so the role is always
   * 'owner'. The mapping exists because of what happens WHEN that changes — an
   * out-of-enum value makes the audit INSERT fail with 22P02, and since the
   * audit is written BEFORE the mutation ("no trail, no action"), the owner's
   * button would simply stop working with a type error in the logs. Fail-closed,
   * but a silly way to lose the console. The ledger keeps the true role either
   * way, so nothing is lost by narrowing here.
   */
  auditRole: string;
};

/** Members of the `app_role` enum — see supabase/prod-actual/schema.sql. */
const APP_ROLE_VALUES = new Set([
  "owner",
  "manager",
  "rider",
  "customer",
  "support",
  "cashier",
  "promoter",
]);

/**
 * The caller's cookie-scoped Supabase client. It must be carried out of this
 * module because `add_audit_log_v2` derives `actor_id` from `auth.uid()`: written
 * through the service-role client every owner action would be recorded with a
 * NULL actor — an audit trail that proves something happened but not who did it,
 * which is precisely the failure the manual-SQL incident already demonstrated.
 */
type OwnerScopedClient = Extract<Awaited<ReturnType<typeof requireOwner>>, { ok: true }>["supabase"];

export type OwnerControlAuthz =
  | { ok: true; actor: OwnerControlActor; supabase: OwnerScopedClient }
  | { ok: false; response: NextResponse };

/**
 * A single opaque refusal for every failure mode. The caller learns that it may
 * not act; it never learns WHICH gate refused, whether the entity exists, or
 * whether it is signed in as the wrong person. Distinguishing those would turn
 * this endpoint into an owner-identity oracle for anyone who can reach it.
 */
function refuse(): NextResponse {
  return NextResponse.json({ error: "Not available." }, { status: 403 });
}

/**
 * Gate 2 on its own, for callers that already hold a `requireOwner()` result and
 * need the SQL half without re-running the app half.
 *
 * IT EXISTS BECAUSE OF A SECOND DOOR. Three of the six write cores — seller
 * decisions, KYC review, product review — are also reachable through
 * `lib/founder-intelligence/action-catalog.ts`, driven by
 * `/api/owner/intelligence/chat` (propose) and
 * `/api/owner/intelligence/actions/confirm` (execute). Those routes ran
 * `requireOwner()` and stopped there, so for those three cores the authorization
 * was exactly what this module's own docstring forbids: a TS mirror alone.
 *
 * Two concrete consequences, neither exploitable on today's data but both real:
 * that path inherited `requireOwner()`'s email fallback, which matches an
 * owner_profiles row by EMAIL when no user_id row exists — the binding the rail
 * deliberately refuses — so an email-only-seeded owner could have approved
 * sellers and reviewed KYC through chat while being correctly refused at
 * `/api/owner/control`. And a posture that holds on one door and not the other
 * is one someone will later "simplify" toward the weaker side.
 *
 * Fail-closed on every branch, same as the composite gate.
 */
export async function assertSqlOwner(supabase: OwnerScopedClient): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("owner_control_is_owner");
    if (error) {
      console.error("[owner-control] SQL owner gate failed", error.message);
      return false;
    }
    return data === true;
  } catch (error) {
    console.error("[owner-control] SQL owner gate threw", error);
    return false;
  }
}

export async function authorizeOwnerControl(): Promise<OwnerControlAuthz> {
  // Gate 1 — app gate. Non-redirecting variant: a route handler must answer
  // with a status code, never a redirect to a login page.
  const auth = await requireOwner();
  if (!auth.ok) {
    return { ok: false, response: refuse() };
  }

  // Gate 2 — SQL gate under the caller's own JWT.
  let sqlOwner = false;
  try {
    const { data, error } = await auth.supabase.rpc("owner_control_is_owner");
    if (error) {
      console.error("[owner-control] owner_control_is_owner() gate failed", error.message);
      return { ok: false, response: refuse() };
    }
    sqlOwner = data === true;
  } catch (error) {
    console.error("[owner-control] owner_control_is_owner() gate threw", error);
    return { ok: false, response: refuse() };
  }
  if (!sqlOwner) {
    return { ok: false, response: refuse() };
  }

  // Audit fidelity: record the real role. Bound on user_id only, matching the
  // SQL gate — an email-bound row must not decide how this actor is logged.
  let role = "owner";
  try {
    const admin = createAdminSupabase();
    const { data: profile } = await admin
      .from("owner_profiles")
      .select("role")
      .eq("user_id", auth.user.id)
      .eq("is_active", true)
      .maybeSingle();
    const resolved = String((profile as { role?: string } | null)?.role || "").trim().toLowerCase();
    if (resolved) role = resolved;
  } catch (error) {
    // Non-fatal: both gates already passed, so the actor IS an owner. Falling
    // back to "owner" costs audit precision, not authorization correctness.
    console.error("[owner-control] owner role lookup failed; defaulting to owner", error);
  }

  return {
    ok: true,
    actor: {
      id: auth.user.id,
      email: auth.user.email?.trim().toLowerCase() || null,
      role,
      // Both gates have already passed, so whatever this actor is called, they
      // are owner-class. 'owner' is the honest enum member for that.
      auditRole: APP_ROLE_VALUES.has(role) ? role : "owner",
    },
    supabase: auth.supabase,
  };
}
