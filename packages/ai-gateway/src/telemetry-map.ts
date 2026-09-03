import type { AiUsageSignal } from "./orchestrator";

/** The provider/model-free record an AI usage signal maps to — the input to the
 *  observability/audit writers. Pure, so the mapping is unit-tested without a DB. */
export interface AiTelemetryRecord {
  eventName: "henry.ai.usage.estimated" | "henry.ai.usage.metered" | "henry.ai.usage.blocked" | "henry.ai.provider.failed";
  outcome: "started" | "completed" | "paid" | "blocked" | "failed";
  /** Write a durable V19 audit-log row? (every state-changing/refusing call). */
  audit: boolean;
  auditAction: string;
  payload: {
    surface: string;
    tier: string;
    billable: boolean;
    totalKobo?: number;
    vatKobo?: number;
    usageEventId?: string;
    code?: string;
    cappedToReserve?: boolean;
  };
}

/**
 * Map a gateway usage signal to its observability + audit record. Every call — estimate,
 * settled charge, refusal, provider failure — produces a record, so "audit every call"
 * (V3-33 / the V19 operator-action gate) is enforceable. The payload carries only safe,
 * already-redacted fields: NO provider, model, cost, margin, prompt, or output.
 */
export function mapSignalToTelemetry(signal: AiUsageSignal): AiTelemetryRecord {
  const eventName =
    signal.kind === "estimated"
      ? "henry.ai.usage.estimated"
      : signal.kind === "metered"
        ? "henry.ai.usage.metered"
        : signal.kind === "blocked"
          ? "henry.ai.usage.blocked"
          : "henry.ai.provider.failed";

  const outcome =
    signal.kind === "estimated"
      ? "started"
      : signal.kind === "metered"
        ? signal.totalKobo && signal.totalKobo > 0
          ? "paid"
          : "completed"
        : signal.kind === "blocked"
          ? "blocked"
          : "failed";

  // Estimates are pre-flight intent (not a state change) — telemetry only. Every other
  // outcome (a settled charge, a refusal, a provider failure) is audited.
  const audit = signal.kind !== "estimated";

  return {
    eventName,
    outcome,
    audit,
    auditAction: `ai.usage.${signal.kind}`,
    payload: {
      surface: signal.surface,
      tier: signal.tier,
      billable: signal.billable,
      totalKobo: signal.totalKobo,
      vatKobo: signal.vatKobo,
      usageEventId: signal.usageEventId,
      code: signal.code,
      cappedToReserve: signal.cappedToReserve,
    },
  };
}
