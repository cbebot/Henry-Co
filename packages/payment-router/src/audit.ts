import type { AuditLogInput } from "@henryco/observability/audit-log";
import type { PaymentProviderKey, PaymentMethod } from "./types";

/**
 * Context folded into a payment-route audit-log row. Note `selectedProvider` is
 * recorded SERVER-SIDE here — that is correct and necessary for refunds and
 * reconciliation. ANTI-CLONE Principle 9 governs the CLIENT response (which
 * never names the provider), not the internal audit trail.
 */
export interface RouterAuditContext {
  intentId: string;
  country: string;
  currency: string;
  method: PaymentMethod;
  selectedProvider: PaymentProviderKey | null;
  outcome: "started" | "paid" | "failed" | "blocked";
  latencyMs: number;
  division?: string | null;
  reason?: string | null;
}

/**
 * Build the {@link AuditLogInput} for a payment-route action. Pure — it takes no
 * Supabase client and imports `AuditLogInput` as a TYPE only, so it carries no
 * `server-only` runtime dependency and is safe to import anywhere (incl. tests).
 * App routes compose it with `writeAuditLog` from `@henryco/observability/audit-log`.
 */
export function buildRouterAuditInput(ctx: RouterAuditContext): AuditLogInput {
  return {
    action: "payment.route",
    entityType: "payment_intent",
    entityId: ctx.intentId,
    division: ctx.division ?? null,
    reason: ctx.reason ?? null,
    newValues: {
      country: ctx.country,
      currency: ctx.currency,
      method: ctx.method,
      selected_provider: ctx.selectedProvider,
      outcome: ctx.outcome,
      latency_ms: ctx.latencyMs,
    },
  };
}
