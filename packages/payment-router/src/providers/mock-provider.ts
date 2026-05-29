import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  PaymentProviderAdapter,
  InitiatePaymentParams,
  InitiatePaymentResult,
  RefundParams,
  RefundResult,
  VerifyWebhookParams,
  VerifiedWebhook,
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

  async verifyWebhook(
    params: VerifyWebhookParams,
  ): Promise<Result<VerifiedWebhook, ProviderError>> {
    if (params.signature === null) return this.err("mock_missing_signature", false);
    const expected = MockProvider.sign(params.rawBody, params.secret);
    if (!constantTimeEqual(params.signature, expected)) {
      return this.err("mock_bad_signature", false);
    }
    let parsed: { id?: string; type?: string; reference?: string; status?: string };
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
          : parsed.status === "refunded"
            ? "refunded"
            : null;
    return {
      ok: true,
      value: {
        providerEventId: parsed.id ?? "",
        eventType: parsed.type ?? "unknown",
        providerReference: parsed.reference ?? "",
        impliedStatus,
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
