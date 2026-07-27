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
 *   2. `is_owner()` — the SQL gate, executed under the CALLER'S OWN JWT (the
 *      cookie-scoped client, never the service-role client). The function is
 *      SECURITY DEFINER over `auth.uid()`, so it cannot be satisfied by any
 *      value the request supplies; it can only be satisfied by actually being
 *      the signed-in owner.
 *
 * Gate 2 is not decoration. The pass brief requires that authorization be
 * SQL-verified and "never a TS mirror alone", because a TS-only check is only
 * as good as every future caller remembering to run it. Anchoring on
 * `auth.uid()` means the database itself, not app code, decides.
 *
 * DELIBERATELY NARROWER THAN THE PAGE GATE: `requireOwner()` will match an
 * owner_profiles row by EMAIL when the session's email is confirmed and no
 * user_id row exists (the HUB-4 fallback). `is_owner()` matches on `user_id`
 * only. The rail therefore refuses an email-only-bound owner. That is
 * intentional — the "email-OR role binding" pattern is a named ecosystem-wide
 * finding from the FIRE audits, and a surface that suspends sellers is the last
 * place to honour the looser binding. The live owner row is user_id-bound, so
 * this narrowing locks nobody out today; if a future owner is seeded by email
 * alone they must be given a user_id before they can act, which is the correct
 * outcome rather than a silent widening.
 *
 * `owner_control_assert_actor()` in the migration applies the SAME user_id-only
 * rule inside every RPC, so the posture holds even if this module is bypassed.
 *
 * FAIL-CLOSED: an RPC transport error is treated as "not an owner". A database
 * that cannot answer must never resolve to permission granted.
 */

export type OwnerControlActor = {
  id: string;
  email: string | null;
  /** Real `owner_profiles.role` — so an admin acting is not logged as "owner". */
  role: string;
};

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
    const { data, error } = await auth.supabase.rpc("is_owner");
    if (error) {
      console.error("[owner-control] is_owner() gate failed", error.message);
      return { ok: false, response: refuse() };
    }
    sqlOwner = data === true;
  } catch (error) {
    console.error("[owner-control] is_owner() gate threw", error);
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
    },
    supabase: auth.supabase,
  };
}
