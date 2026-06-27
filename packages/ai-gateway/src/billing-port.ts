import type { MeteredUsage, AiModelTier } from "@henryco/pricing";
import type { Result } from "./result";
import type { AiGatewayError } from "./errors";
import type { AiSurfaceKey } from "./surfaces";

/**
 * The seam between the orchestrator and the guarded `payments_private` RPCs. The real
 * implementation (server-only) calls `reserve_wallet_for_ai_usage` / `post_ai_usage_charge`
 * over a direct service-role Postgres connection (those RPCs are NOT PostgREST-exposed).
 * Tests inject an in-memory implementation so the money flow is proven without a DB, and
 * the SQL itself is proven separately on a throwaway database.
 */
export interface ReserveInput {
  userId: string;
  /** The reserved upper-bound total (kobo, VAT-inclusive). */
  estimateKobo: number;
  idempotencyKey: string;
  surface: AiSurfaceKey;
  tier: AiModelTier;
  /** ISO timestamp after which an abandoned hold stops counting against `available`. */
  expiresAt: string;
}

export interface ReserveResult {
  holdId: string;
}

export interface SettleInput {
  holdId: string;
  userId: string;
  surface: AiSurfaceKey;
  tier: AiModelTier;
  /** Provider cost (kobo) — recognised in `platform_revenue` (with margin) + COGS analytics. */
  costKobo: number;
  /** Company margin incl. any floor top-up = net − cost (kobo). */
  marginKobo: number;
  /** Output VAT (kobo) from applyOutputVat / TAX.vat. */
  vatKobo: number;
  usage: MeteredUsage;
  ruleBookKey: string;
  ruleVersion: string;
  /** Redacted breakdown metadata (NO provider/model) for the transaction row. */
  breakdownMeta: Record<string, unknown>;
}

export interface SettleResult {
  /** The canonical per-call id (= ledger source_event_id). Stable across replays. */
  usageEventId: string;
  /** What was actually debited (kobo) = cost + margin + vat. */
  totalKobo: number;
  balanceAfterKobo: number;
  /** true when a replay returned the prior settlement (no second debit / post). */
  duplicate: boolean;
}

export interface AiBillingPort {
  /** Reserve the estimate against the wallet. Returns `insufficient_funds` (so the
   *  provider is never called) when `available < estimateKobo`. */
  reserve(input: ReserveInput): Promise<Result<ReserveResult, AiGatewayError>>;
  /** Settle a hold at actual cost: debit wallet + post the balanced ledger entry, one
   *  atomic idempotent transaction. Returns the prior result on replay. */
  settle(input: SettleInput): Promise<Result<SettleResult, AiGatewayError>>;
  /** Release a hold's reserved remainder without charging (provider failure / refusal). */
  release(input: { holdId: string }): Promise<void>;
}
