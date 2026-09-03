import type { PaymentQuote, PaymentResult, PaymentsAdapter } from "@/platform/contracts/payments";

/** Real provider (Stripe, Paystack, etc.) not wired yet — safe staging default. */
export class DeferredPaymentsAdapter implements PaymentsAdapter {
  async startCheckout(_quote: PaymentQuote): Promise<PaymentResult> {
    return {
      ok: false,
      error: "Payments aren't available yet. Please try again later.",
    };
  }
}
