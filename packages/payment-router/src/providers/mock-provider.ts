import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  PaymentProviderAdapter,
  InitiatePaymentParams,
  InitiatePaymentResult,
  RefundParams,
  RefundResult,
  ListRefundsParams,
  ProviderRefundSummary,
  VerifyWebhookParams,
  VerifiedWebhook,
  FinalizeParams,
  FinalizeResult,
  BalanceParams,
  BalanceResult,
} from "./adapter-interface";
import type { Result } from "../types";
import type { ProviderError } from "../errors";

export type MockFailureMode = "none" | "retryable" | "fatal";

function envFailureMode(): MockFailureMode {
  const v = process.env.MOCK_PAYMENT_FAILURE;
  return v === "retryable" || v === "fatal" ? v : "none";
}

/**
 * The only adapter built in V3-13. It proves the router contract end-to-end
 * without any live SDK: deterministic provider references, HMAC-signed webhook
 * verification, and `MOCK_PAYMENT_FAILURE`-driven failure injection so the
 * router's failover path is testable. V3-14/15/16 replace this with real
 * Stripe/Paystack/Flutterwave adapters implementing the same interface.
 */
export class MockProvider implements PaymentProviderAdapter {
  readonly key = "mock" as const;
  private readonly failureMode: MockFailureMode;

  constructor(opts?: { failureMode?: MockFailureMode }) {
    this.failureMode = opts?.failureMode ?? envFailureMode();
  }

  /** Deterministic HMAC-SHA256 hex signature — mirrors how real providers sign webhooks. */
  static sign(body: string, secret: string): string {
    return createHmac("sha256", secret).update(body).digest("hex");
  }

  private err(code: string, retryable: boolean): { ok: false; error: ProviderError } {
    return { ok: false, error: { code, message: `mock ${code}`, retryable, providerKey: "mock" } };
  }

  async initiate(
    params: InitiatePaymentParams,
  ): Promise<Result<InitiatePaymentResult, ProviderError>> {
    if (this.failureMode === "retryable") return this.err("mock_retryable", true);
    if (this.failureMode === "fatal") return this.err("mock_fatal", false);
    return {
      ok: true,
      value: {
        providerReference: `mock_${params.intentId}`,
        clientAction: { type: "none" },
      },
    };
  }

  async refund(params: RefundParams): Promise<Result<RefundResult, ProviderError>> {
    if (this.failureMode === "fatal") return this.err("mock_refund_fatal", false);
    return { ok: true, value: { refundReference: `mockrf_${params.providerReference}` } };
  }

  /** V3-19 — the mock holds no refund state; an empty list means "create fresh". */
  async listRefunds(_params: ListRefundsParams): Promise<Result<ProviderRefundSummary[], ProviderError>> {
    if (this.failureMode === "fatal") return this.err("mock_list_refunds_fatal", false);
    return { ok: true, value: [] };
  }

  /**
   * Stateless confirm (D1). `providerEventId` is the reference itself so a
   * finalize and a later charge webhook for the same reference dedup against
   * each other (G2). The mock holds no charge state, so amount/currency are
   * deterministic placeholders — the real adapter reads them from the provider.
   */
  async finalize(params: FinalizeParams): Promise<Result<FinalizeResult, ProviderError>> {
    if (this.failureMode === "retryable") return this.err("mock_finalize_retryable", true);
    if (this.failureMode === "fatal") return this.err("mock_finalize_fatal", false);
    return {
      ok: true,
      value: {
        providerEventId: params.providerReference,
        impliedStatus: "succeeded",
        amountMinor: 0,
        currency: "NGN",
      },
    };
  }

  async getBalance(params: BalanceParams): Promise<Result<BalanceResult, ProviderError>> {
    if (this.failureMode === "fatal") return this.err("mock_balance_fatal", false);
    return {
      ok: true,
      value: { currency: params.currency, availableMinor: 0, asOf: new Date(0).toISOString() },
    };
  }

  async verifyWebhook(
    params: VerifyWebhookParams,
  ): Promise<Result<VerifiedWebhook, ProviderError>> {
    if (params.signature === null) return this.err("mock_missing_signature", false);
    const expected = MockProvider.sign(params.rawBody, params.secret);
    if (!constantTimeEqual(params.signature, expected)) {
      return this.err("mock_bad_signature", false);
    }
    let parsed: {
      id?: string;
      type?: string;
      reference?: string;
      status?: string;
      amount?: number;
      refund_reference?: string;
    };
    try {
      parsed = JSON.parse(params.rawBody);
    } catch {
      return this.err("mock_bad_body", false);
    }
    const impliedStatus =
      parsed.status === "succeeded"
        ? "succeeded"
        : parsed.status === "failed"
          ? "failed"
          : null;
    // V3-19: refund outcomes normalise to `refundEvent` (mirrors the live adapter) —
    // the DB decides the intent's terminal status from cumulative refund truth.
    const refundEvent: VerifiedWebhook["refundEvent"] =
      parsed.status === "refunded" || parsed.status === "refund_processed"
        ? {
            outcome: "processed",
            amountMinor:
              typeof parsed.amount === "number" && Number.isInteger(parsed.amount) && parsed.amount > 0
                ? parsed.amount
                : null,
            refundReference: parsed.refund_reference ?? null,
          }
        : parsed.status === "refund_failed"
          ? {
              outcome: "failed",
              amountMinor:
                typeof parsed.amount === "number" && Number.isInteger(parsed.amount) && parsed.amount > 0
                  ? parsed.amount
                  : null,
              refundReference: parsed.refund_reference ?? null,
            }
          : undefined;
    return {
      ok: true,
      value: {
        providerEventId: parsed.id ?? "",
        eventType: parsed.type ?? "unknown",
        providerReference: parsed.reference ?? "",
        impliedStatus,
        refundEvent,
      },
    };
  }
}

/** Constant-time string compare to avoid leaking signature bytes via timing. */
function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
