import "server-only";

import type { Result } from "../result";
import { aiError, DEFAULT_AI_ERROR_COPY, type AiGatewayError } from "../errors";
import type { AiBillingPort, ReserveInput, ReserveResult, SettleInput, SettleResult } from "../billing-port";

/**
 * A minimal SQL executor the app supplies — a direct service-role Postgres connection
 * (e.g. a pooled `postgres`/`pg` client). The two guarded RPCs live in `payments_private`,
 * which is NOT PostgREST-exposed, so they CANNOT be reached via supabase-js `.rpc()` — they
 * must be called over a direct connection authenticated as `service_role`/`postgres`.
 */
export interface SqlExecutor {
  query<T = Record<string, unknown>>(text: string, params: unknown[]): Promise<{ rows: T[] }>;
}

type ReserveRow = { result: { reserved: boolean; reason?: string; hold_id?: string } | null };
type SettleRow = {
  result: { settled: boolean; reason?: string; usage_event_id?: string; total_kobo?: number; balance_after_kobo?: number; duplicate?: boolean } | null;
};

/**
 * The production billing port: the two atomic, guarded, service-role-only RPCs. The
 * money invariants (balance never negative, balanced ledger entry, idempotent settle)
 * are enforced inside the SQL and proven on a throwaway database; this layer only
 * marshals arguments and maps results back to the gateway's typed errors.
 */
export function createPgBillingPort(sql: SqlExecutor): AiBillingPort {
  return {
    async reserve(input: ReserveInput): Promise<Result<ReserveResult, AiGatewayError>> {
      const { rows } = await sql.query<ReserveRow>(
        "select payments_private.reserve_wallet_for_ai_usage($1::uuid, $2::bigint, $3::text, $4::text, $5::text, $6::timestamptz) as result",
        [input.userId, input.estimateKobo, input.idempotencyKey, input.surface, input.tier, input.expiresAt],
      );
      const result = rows[0]?.result ?? null;
      if (!result || !result.reserved) {
        if (result?.reason === "insufficient_funds") {
          return { ok: false, error: aiError("insufficient_funds", DEFAULT_AI_ERROR_COPY.insufficient_funds) };
        }
        return { ok: false, error: aiError("provider_error", DEFAULT_AI_ERROR_COPY.provider_error) };
      }
      return { ok: true, value: { holdId: String(result.hold_id) } };
    },

    async settle(input: SettleInput): Promise<Result<SettleResult, AiGatewayError>> {
      const { rows } = await sql.query<SettleRow>(
        [
          "select payments_private.post_ai_usage_charge(",
          "  $1::uuid, $2::uuid, $3::text, $4::text,",
          "  $5::bigint, $6::bigint, $7::bigint,",
          "  $8::jsonb, $9::text, $10::text, $11::jsonb",
          ") as result",
        ].join("\n"),
        [
          input.holdId,
          input.userId,
          input.surface,
          input.tier,
          input.costKobo,
          input.marginKobo,
          input.vatKobo,
          JSON.stringify(input.usage),
          input.ruleBookKey,
          input.ruleVersion,
          JSON.stringify(input.breakdownMeta),
        ],
      );
      const result = rows[0]?.result ?? null;
      if (!result || !result.settled) {
        if (result?.reason === "insufficient_funds") {
          return { ok: false, error: aiError("insufficient_funds", DEFAULT_AI_ERROR_COPY.insufficient_funds) };
        }
        return { ok: false, error: aiError("provider_error", DEFAULT_AI_ERROR_COPY.provider_error) };
      }
      return {
        ok: true,
        value: {
          usageEventId: String(result.usage_event_id),
          totalKobo: Number(result.total_kobo ?? 0),
          balanceAfterKobo: Number(result.balance_after_kobo ?? 0),
          duplicate: Boolean(result.duplicate),
        },
      };
    },

    async release(input: { holdId: string }): Promise<void> {
      try {
        await sql.query("select payments_private.release_wallet_ai_hold($1::uuid) as result", [input.holdId]);
      } catch {
        // Best-effort: the hold's expiry frees `available` regardless of an explicit release.
      }
    },
  };
}
