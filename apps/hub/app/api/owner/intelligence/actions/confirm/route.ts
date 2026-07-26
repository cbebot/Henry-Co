import { NextResponse, type NextRequest } from "next/server";

import { writeAuditLog } from "@henryco/observability/audit-log";
import { requireSensitiveAction } from "@henryco/auth/server/sensitive-action-guard";
import { requireOwner } from "@/app/lib/owner-auth";
import { createAdminSupabase } from "@/lib/supabase";
import { getFounderAction } from "@/lib/founder-intelligence/action-catalog";

export const runtime = "nodejs";

/** The live action tranche — the same gate both propose paths apply, so a
 *  darkened tranche also blocks the EXECUTE of an already-minted card. */
function liveTranche(): number {
  const raw = Number(process.env.FOUNDER_ACTIONS_TRANCHE ?? "1");
  return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
}

/**
 * POST /api/owner/intelligence/actions/confirm — the OWNER-initiated execute
 * step of a governed founder action (F3). NOT called from a chat turn; the AI
 * is entirely absent here.
 *
 * The spine (adversarial-audit fixes folded in):
 *   1. requireOwner again (independent re-authorization).
 *   2. Load proposal by token; guards: ownerId==caller, pending, not expired.
 *   3. CAS claim (pending→executing, single-winner, owner_id in WHERE) — a
 *      double-confirm can never double-execute.
 *   4. requiresReauth actions demand a fresh identity step-up (money tranche).
 *   5. Drift re-check: re-read true state; any change to a driftKey aborts to a
 *      fresh card — the owner never confirms against stale state.
 *   6. Execute via the catalog's executionBinding (the EXISTING guarded path),
 *      with the token as the deterministic idempotency anchor.
 *   7. Flip status=executed + execution_ref (guaranteed compensating write),
 *      then the execute audit row (owner-scoped client → actor = founder).
 *
 * Fail-dark: FOUNDER_ACTIONS_LIVE off → 404 (indistinguishable from absent).
 */
export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_FOUNDER_INTELLIGENCE_LIVE !== "1" || process.env.FOUNDER_ACTIONS_LIVE !== "1") {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const auth = await requireOwner();
  if (!auth.ok) {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
  const token = typeof body?.token === "string" ? body.token : "";
  if (!token) {
    return NextResponse.json({ error: "Missing action token." }, { status: 400 });
  }

  const admin = createAdminSupabase();

  // 2. Load + guard.
  const { data: proposalRow } = await admin
    .from("founder_action_proposals")
    .select("token, user_id, action_key, params, true_state, status, expires_at")
    .eq("token", token)
    .maybeSingle();
  const proposal = proposalRow as
    | {
        token: string;
        user_id: string;
        action_key: string;
        params: Record<string, unknown>;
        true_state: Record<string, unknown>;
        status: string;
        expires_at: string;
      }
    | null;

  if (!proposal || proposal.user_id !== auth.user.id) {
    return NextResponse.json({ error: "Action not found." }, { status: 404 });
  }
  if (proposal.status !== "pending") {
    // Already claimed/executed/conflicted — idempotent no-op.
    return NextResponse.json({ outcome: "already_resolved", status: proposal.status });
  }
  if (new Date(proposal.expires_at).getTime() <= Date.now()) {
    await admin
      .from("founder_action_proposals")
      .update({ status: "expired", resolved_at: new Date().toISOString() } as never)
      .eq("token", token)
      .eq("status", "pending");
    return NextResponse.json({ outcome: "expired" }, { status: 409 });
  }

  const entry = getFounderAction(proposal.action_key);
  if (!entry) {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  // Tranche kill-switch (SA-4 adversarial round 1): re-gate the EXECUTE path on
  // the live tranche, exactly as both propose paths do. Without this, a pending
  // card minted while a tranche was live still executes after the tranche is
  // darkened — so lowering FOUNDER_ACTIONS_TRANCHE would not actually stop
  // already-queued actions. Now a dark tranche means no execute, no exceptions.
  if (entry.tranche > liveTranche()) {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  // The real owner role for audit fidelity — the app-gate returns only
  // {id, email}, so an admin acting via F3 must not be logged as "owner"
  // (review finding, 2026-07-10). Falls back to "owner" if unreadable.
  const { data: ownerProfile } = await admin
    .from("owner_profiles")
    .select("role")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  const ownerRole = String((ownerProfile as { role?: string } | null)?.role || "owner")
    .trim()
    .toLowerCase() || "owner";

  // 4. Deep-action step-up — the founder's "print". requiresReauth entries
  //    demand a fresh identity proof: the platform sensitive-action guard
  //    verifies the signed hc_last_reauth cookie (5-minute window, HMAC-bound
  //    to this user) and rate-limits attempts. Absent/stale → the standard
  //    401 challenge {code: "sensitive_action_reauth_required"}; the client
  //    collects the owner's password inline (POST /api/auth/reauth on this
  //    origin writes the marker) and retries the confirm. Runs BEFORE the CAS
  //    claim so a challenged proposal stays pending and confirmable.
  if (entry.requiresReauth) {
    const guard = await requireSensitiveAction(request, {
      action: entry.auditAction,
      entityType: entry.entityType,
      resolveUser: async () => auth.user,
      userId: (user) => user.id,
    });
    if (!guard.ok) return guard.response;
  }

  // 3. CAS claim — single-winner. owner_id in WHERE so a race cannot let anyone
  //    else claim another owner's proposal.
  const { data: claimed } = await admin
    .from("founder_action_proposals")
    .update({ status: "executing", claimed_at: new Date().toISOString() } as never)
    .eq("token", token)
    .eq("user_id", auth.user.id)
    .eq("status", "pending")
    .select("token")
    .maybeSingle();
  if (!claimed) {
    return NextResponse.json({ outcome: "conflict", reason: "already_claimed" }, { status: 409 });
  }

  // 5. Drift re-check — re-read true state; any driftKey change aborts.
  const freshState = await entry.trueStateReader({ params: proposal.params });
  if (!freshState) {
    await resolveProposal(admin, token, "conflict");
    return NextResponse.json({ outcome: "conflict", reason: "record_gone" }, { status: 409 });
  }
  for (const driftKey of entry.driftKeys) {
    if (String(freshState[driftKey] ?? "") !== String(proposal.true_state[driftKey] ?? "")) {
      // Revert to pending so the owner can re-review a fresh card.
      await admin
        .from("founder_action_proposals")
        .update({ status: "pending", claimed_at: null } as never)
        .eq("token", token)
        .eq("status", "executing");
      return NextResponse.json({ outcome: "conflict", reason: "state_drifted", driftKey }, { status: 409 });
    }
  }

  // 6. Execute through the existing guarded path. For tranche-1 (settings =
  //    last-write-wins, staff toggle = naturally idempotent) the CAS claim is
  //    the double-execute guard. The token is passed as the idempotency ANCHOR
  //    the money-tranche RPCs (F3c) will key on so the claim is not the sole
  //    guard once real cash moves.
  let executionRef: string | null = null;
  let executionError: string | null = null;
  try {
    const result = await entry.executionBinding({
      params: proposal.params,
      trueState: freshState,
      ownerId: auth.user.id,
      ownerRole,
      token,
    });
    if (result.ok) {
      executionRef = result.executionRef;
    } else {
      executionError = result.error;
    }
  } catch (error) {
    executionError = error instanceof Error ? error.message : "Execution failed.";
  }

  if (executionError) {
    await resolveProposal(admin, token, "failed", { execution_ref: null });
    return NextResponse.json({ outcome: "failed", error: executionError }, { status: 502 });
  }

  // 7. Guaranteed forward-ledger write, then the execute audit.
  const auditId = await writeAuditLog(auth.supabase as never, {
    action: entry.auditAction,
    entityType: entry.entityType,
    entityId: executionRef,
    oldValues: proposal.true_state,
    newValues: { executionRef, params: proposal.params },
    reason: "founder_confirmed",
    division: entry.division,
    correlationId: token,
  });

  await resolveProposal(admin, token, "executed", { execution_ref: executionRef, audit_id: auditId });

  return NextResponse.json({ outcome: "executed", executionRef });
}

async function resolveProposal(
  admin: ReturnType<typeof createAdminSupabase>,
  token: string,
  status: "executed" | "failed" | "conflict",
  extra?: { execution_ref?: string | null; audit_id?: string | null },
): Promise<void> {
  await admin
    .from("founder_action_proposals")
    .update({
      status,
      resolved_at: new Date().toISOString(),
      ...(extra?.execution_ref !== undefined ? { execution_ref: extra.execution_ref } : {}),
      ...(extra?.audit_id !== undefined ? { audit_id: extra.audit_id } : {}),
    } as never)
    .eq("token", token);
}
