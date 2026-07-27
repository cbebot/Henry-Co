import { NextResponse, type NextRequest } from "next/server";
import { emitEvent } from "@henryco/observability";
import { writeAuditLog } from "@henryco/observability/audit-log";
import { requireSensitiveAction } from "@henryco/auth/server/sensitive-action-guard";
import { createAdminSupabase } from "@/lib/supabase";
import { authorizeOwnerControl } from "@/lib/owner-control/authorize";
import { getOwnerControlAction } from "@/lib/owner-control/registry";
import { readOwnerControlState, executeOwnerControlAction } from "@/lib/owner-control/execute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/owner/control — THE owner action endpoint.
 *
 * One route for every governed owner action, because the alternative is one
 * route per action and an authorization posture that has to be re-established
 * (and re-reviewed) fourteen times. Here the spine is written once:
 *
 *   1. AUTHORIZE   — app gate + SQL `is_owner()` under the caller's own JWT.
 *                    The actor is taken from the session and NEVER from the
 *                    request body; there is no field a caller could set to
 *                    become someone else.
 *   2. RESOLVE     — the action must be in the closed registry.
 *   3. READ FRESH  — live entity state, re-read now. A queue rendered minutes
 *                    ago is a snapshot, and acting on a snapshot is how an
 *                    already-rejected seller gets approved by a stale click.
 *   4. LEGALITY    — the fresh status must be in the action's `fromStates`.
 *   5. REAUTH      — consequential actions demand a fresh password step-up.
 *                    Deliberately BEFORE the claim: a challenged request must
 *                    leave no ledger row behind, so the retry after the modal
 *                    is a first attempt and not a replay of a phantom.
 *   6. CLAIM       — `owner_control_claim_action`. Idempotency lives in a
 *                    unique index, so a replay cannot mutate twice even if two
 *                    requests race.
 *   7. EXECUTE     — through the existing guarded write core, which itself
 *                    writes its audit row before moving any state.
 *   8. SETTLE      — record the terminal outcome + audit id on the ledger.
 *   9. AUDIT+EMIT  — `audit_log` through the CALLER'S client so `actor_id` is
 *                    the owner, plus a canonical event carrying the verdict.
 *
 * A row left at `outcome = 'claimed'` means the process died between 6 and 8.
 * That is a real signal worth alerting on rather than an ambiguity: the ledger
 * distinguishes "never started" from "started and unknown".
 *
 * MONEY: no branch of this handler moves money. The registry contains no money
 * action, and dispute resolution — whose every branch drives the payout state
 * machine — is deliberately absent rather than partially reimplemented here.
 */

/** One opaque refusal, so the endpoint cannot be walked as an existence oracle. */
function refuse() {
  return NextResponse.json({ error: "Not available." }, { status: 403 });
}

export async function POST(request: NextRequest) {
  // 1. AUTHORIZE
  const authz = await authorizeOwnerControl();
  if (!authz.ok) return authz.response;
  const { actor, supabase } = authz;

  const body = (await request.json().catch(() => null)) as {
    actionKey?: unknown;
    entityId?: unknown;
    note?: unknown;
    idempotencyKey?: unknown;
  } | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // 2. RESOLVE — unknown keys are refused, never defaulted.
  const action = getOwnerControlAction(body.actionKey);
  if (!action) {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const entityId = typeof body.entityId === "string" ? body.entityId.trim() : "";
  if (!entityId) {
    return NextResponse.json({ error: "Missing record id." }, { status: 400 });
  }

  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (action.requiresNote && !note) {
    return NextResponse.json(
      { error: "Add a reason before completing this action." },
      { status: 400 },
    );
  }

  // The client mints one key per operator gesture and reuses it verbatim when
  // the reauth modal replays the request, so the step-up round trip cannot
  // double-apply. Composed with actor + action + entity server-side: a client
  // token reused across two different actions is two distinct ledger keys, and
  // a key minted by one owner can never address another's row.
  const clientKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";
  if (!clientKey || clientKey.length > 100) {
    return NextResponse.json({ error: "Missing request key." }, { status: 400 });
  }
  const idempotencyKey = `${actor.id}:${action.key}:${entityId}:${clientKey}`;

  // 3. READ FRESH
  const state = await readOwnerControlState(action, entityId);
  if (!state) return refuse();

  // 4. LEGALITY — compare case-insensitively; these statuses are written by
  //    several apps over several years and casing is not guaranteed.
  const currentStatus = state.status.trim().toLowerCase();
  if (!action.fromStates.includes(currentStatus)) {
    emitEvent({
      name: "henry.owner.control.action",
      classification: "user_action",
      outcome: "blocked",
      actorId: actor.id,
      payload: { actionKey: action.key, entityType: action.entityType, reason: "illegal_transition", currentStatus },
    });
    return NextResponse.json(
      {
        outcome: "conflict",
        reason: "state_changed",
        currentStatus: state.status,
        error: "That record has already moved on. Refresh to see where it stands now.",
      },
      { status: 409 },
    );
  }

  // 5. REAUTH — before the claim, on purpose (see the spine note above).
  if (action.requiresReauth) {
    const guard = await requireSensitiveAction(request, {
      action: action.auditAction,
      entityType: action.entityType,
      entityId,
      resolveUser: async () => actor,
      userId: (user) => user.id,
    });
    if (!guard.ok) return guard.response;
  }

  const admin = createAdminSupabase();

  // 6. CLAIM
  let claimId: string;
  try {
    const { data, error } = await admin.rpc("owner_control_claim_action", {
      p_actor: actor.id,
      p_actor_role: actor.role,
      p_action_key: action.key,
      p_entity_type: action.entityType,
      p_entity_id: entityId,
      p_division: action.division,
      p_from_state: state.status,
      p_to_state: action.toState,
      p_note: note || null,
      p_idempotency_key: idempotencyKey,
      p_reauth_required: action.requiresReauth,
    });
    if (error) {
      console.error("[owner/control] claim failed", error.message);
      return refuse();
    }
    const claim = (data ?? {}) as { id?: string; replayed?: boolean; outcome?: string };
    if (!claim.id) {
      console.error("[owner/control] claim returned no id");
      return refuse();
    }
    if (claim.replayed) {
      // Already handled under this key. Report what happened; mutate nothing.
      return NextResponse.json({ outcome: "replayed", recordedOutcome: claim.outcome ?? "claimed" });
    }
    claimId = claim.id;
  } catch (error) {
    console.error("[owner/control] claim threw", error);
    return refuse();
  }

  // 7. EXECUTE
  const execution = await executeOwnerControlAction({
    action,
    entityId,
    note,
    actorId: actor.id,
    actorRole: actor.role,
    priorStatus: state.status,
  });

  if (!execution.ok) {
    await settle(admin, claimId, actor.id, "failed", null, execution.error);
    emitEvent({
      name: "henry.owner.control.action",
      classification: "user_action",
      outcome: "failed",
      actorId: actor.id,
      traceId: claimId,
      payload: { actionKey: action.key, entityType: action.entityType, entityId },
    });
    return NextResponse.json({ outcome: "failed", error: execution.error }, { status: 502 });
  }

  // 9a. AUDIT — through the caller's own client so `actor_id` resolves from
  //     auth.uid() to the owner rather than to NULL.
  const auditId = await writeAuditLog(supabase as never, {
    action: action.auditAction,
    entityType: action.entityType,
    entityId,
    oldValues: { status: state.status },
    newValues: { status: action.toState, executionRef: execution.executionRef, changed: execution.changed },
    reason: note || "owner_control",
    division: action.division,
    correlationId: claimId,
  });

  // 8. SETTLE — `no_op` when the guarded core reported nothing actually moved
  //    (a compare-and-set that lost). Recording that honestly matters: an
  //    operator reading the ledger must be able to tell a real change from a
  //    request that arrived after someone else had already decided.
  const outcome = execution.changed ? "applied" : "no_op";
  await settle(admin, claimId, actor.id, outcome, auditId, null);

  // 9b. EMIT
  emitEvent({
    name: "henry.owner.control.action",
    classification: "user_action",
    outcome: verdictOutcome(action.toState, execution.changed),
    actorId: actor.id,
    traceId: claimId,
    payload: {
      actionKey: action.key,
      entityType: action.entityType,
      entityId,
      division: action.division,
      fromState: state.status,
      toState: action.toState,
      reauthRequired: action.requiresReauth,
      changed: execution.changed,
    },
  });

  return NextResponse.json({
    outcome,
    actionId: claimId,
    auditId,
    executionRef: execution.executionRef,
    subject: state.subject,
  });
}

async function settle(
  admin: ReturnType<typeof createAdminSupabase>,
  id: string,
  actorId: string,
  outcome: "applied" | "no_op" | "failed",
  auditId: string | null,
  failureReason: string | null,
): Promise<void> {
  const { error } = await admin.rpc("owner_control_settle_action", {
    p_id: id,
    p_actor: actorId,
    p_outcome: outcome,
    p_audit_id: auditId,
    p_failure_reason: failureReason,
  });
  if (error) {
    // The state change already landed and is recorded in staff_audit_logs. A
    // failed settle leaves the ledger row at 'claimed', which is exactly the
    // "finished unknown" signal that row is for — so log loudly, do not throw.
    console.error("[owner/control] settle failed; ledger row left claimed", id, error.message);
  }
}

/** Map a target state onto the canonical outcome enum. */
function verdictOutcome(toState: string, changed: boolean) {
  if (!changed) return "updated" as const;
  if (toState === "approved") return "approved" as const;
  if (toState === "rejected") return "rejected" as const;
  if (toState === "actioned") return "removed" as const;
  if (toState === "dismissed" || toState === "suspended") return "resolved" as const;
  return "updated" as const;
}
