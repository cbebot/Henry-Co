import type { PaymentProviderKey, PaymentIntentStatus, ISO4217 } from "./types";

/** A provider's view of a settled charge, normalised for reconciliation. */
export interface ProviderSettlementRecord {
  providerKey: PaymentProviderKey;
  providerReference: string;
  amountMinor: number;
  currency: ISO4217;
  status: PaymentIntentStatus;
  settledAt: string; // ISO 8601
}

/** Our ledger's view of the same intent. */
export interface LedgerRecord {
  intentId: string;
  amountMinor: number;
  currency: ISO4217;
  status: PaymentIntentStatus;
}

export type ReconciliationDiscrepancy =
  | { kind: "amount_mismatch"; intentId: string; ledgerMinor: number; providerMinor: number }
  | { kind: "status_mismatch"; intentId: string; ledgerStatus: PaymentIntentStatus; providerStatus: PaymentIntentStatus }
  | { kind: "missing_in_ledger"; providerReference: string }
  | { kind: "missing_at_provider"; intentId: string };

/** Contract the V3-19 engine implements. Defined here so the router package owns the shape. */
export interface ReconciliationEngine {
  compare(ledger: LedgerRecord[], provider: ProviderSettlementRecord[]): ReconciliationDiscrepancy[];
}
