import type { PaymentQuote, PaymentResult, PaymentsAdapter } from "@/platform/contracts/payments";

export class MockPaymentsAdapter implements PaymentsAdapter {
  async startCheckout(quote: PaymentQuote): Promise<PaymentResult> {
    return {
      ok: true,
      reference: `mock_pay_${quote.currency}_${quote.amountMinor}_${Date.now()}`,
      mock: true,
    };
  }
}
