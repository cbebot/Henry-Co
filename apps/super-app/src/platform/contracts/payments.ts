export type PaymentQuote = { amountMinor: number; currency: string; label: string };

export type PaymentResult =
  | { ok: true; reference: string; mock: boolean }
  | { ok: false; error: string };

export type PaymentsAdapter = {
  /** Feature-flagged; local returns instant mock success when disabled. */
  startCheckout(quote: PaymentQuote): Promise<PaymentResult>;
};
