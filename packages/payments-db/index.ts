// @henryco/payments-db — the company-wide shared money rail (server-only). One pooled,
// TLS-verified direct-Postgres connection to the guarded `payments_private` RPCs, used by
// every division for metered AI billing and (over time) checkout settlement, so there is a
// single rail to audit and keep to standard.
import "server-only";

export {
  getPaymentsSqlExecutor,
  isPaymentsDbConfigured,
  callPaymentRpc,
} from "./src/pool";
export { SUPABASE_POOLER_CA } from "./src/supabase-pooler-ca";
