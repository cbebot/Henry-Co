import "server-only";

import { emitEvent, persistEvent } from "@henryco/observability";
import { writeAuditLog } from "@henryco/observability/audit-log";

import type { AiUsageSignal } from "../orchestrator";
import { mapSignalToTelemetry } from "../telemetry-map";

type PersistSupabase = Parameters<typeof persistEvent>[0]["supabase"];
type AuditSupabase = Parameters<typeof writeAuditLog>[0];

export interface AiTelemetryDeps {
  /** A user-scoped Supabase client (so `add_audit_log_v2`'s `auth.uid()` resolves to the
   *  actor) — the same client the surface used to authenticate the request. */
  supabase: PersistSupabase & AuditSupabase;
  /** The authenticated actor's id, or null for an anonymous (refused) call. */
  actorId: string | null;
  traceId?: string;
}

/**
 * V3-33 — "audit every call". Maps the gateway's per-call usage signal to the durable
 * telemetry + audit spine: a structured `emitEvent` (log + Sentry breadcrumb), a queryable
 * `henry_events` row (`persistEvent`), and — for every state-changing/refusing call — a
 * V19 `add_audit_log_v2` row (`writeAuditLog`). All three are BEST-EFFORT and never throw,
 * so telemetry can never break the money/auth path. The payload is provider/model-free.
 */
export function createAiTelemetry(deps: AiTelemetryDeps): (signal: AiUsageSignal) => void {
  return (signal) => {
    const rec = mapSignalToTelemetry(signal);
    try {
      emitEvent({
        name: rec.eventName,
        classification: "system_state",
        outcome: rec.outcome,
        actorId: deps.actorId ?? undefined,
        traceId: deps.traceId,
        payload: rec.payload,
      });
    } catch {
      /* telemetry must never break the money/auth path */
    }
    void persistEvent({ supabase: deps.supabase, name: rec.eventName, actorId: deps.actorId ?? null, payload: rec.payload });
    if (rec.audit) {
      void writeAuditLog(deps.supabase, {
        action: rec.auditAction,
        entityType: "ai_usage",
        entityId: rec.payload.usageEventId ?? null,
        reason: rec.payload.code ?? null,
        division: "ai",
        newValues: rec.payload,
      });
    }
  };
}
