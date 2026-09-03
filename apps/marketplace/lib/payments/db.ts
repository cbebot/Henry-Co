import "server-only";
import { callPaymentRpc as sharedCallPaymentRpc, getPaymentsSqlExecutor, isPaymentsDbConfigured } from "@henryco/payments-db";

/**
 * Marketplace's money-RPC access — now a thin, typed facade over the company-wide shared
 * rail `@henryco/payments-db` (one pooled, TLS-verified direct-Postgres connection to the
 * guarded `payments_private` RPCs). Marketplace mints no money function and no second pool:
 * the card-sale reconciler and the AI billing both run over the SAME shared connection.
 */
export { getPaymentsSqlExecutor };

/** Preserved name for existing marketplace callers (the shared export is `isPaymentsDbConfigured`). */
export const isPaymentDbConfigured = isPaymentsDbConfigured;

/**
 * The constrained set of `payments_private` RPCs the division card-sale path calls. NO new
 * money function — these exist (V3-VAT-01 / V3-18), granted to service_role only:
 *   - post_sale_revenue        — clearing→revenue+output-VAT allocation (the sale edge)
 *   - record_customer_receipt  — the ledger-tied HO-RCT receipt writer
 */
export type PaymentRpc = "post_sale_revenue" | "record_customer_receipt";

/**
 * Invoke a marketplace `payments_private` money RPC over the shared pooled connection.
 * A typed facade over the shared `callPaymentRpc`: `fn` is constrained to the marketplace
 * union (no injection); returns the same supabase-js-shaped `{ data, error }` so call sites
 * stay drop-in.
 */
export function callPaymentRpc<T = unknown>(
  fn: PaymentRpc,
  args: ReadonlyArray<string | null>,
): Promise<{ data: T | null; error: { message: string; code?: string } | null }> {
  return sharedCallPaymentRpc<T>(fn, args);
}
