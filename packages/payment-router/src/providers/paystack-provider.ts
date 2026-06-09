import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  PaymentProviderAdapter,
  InitiatePaymentParams,
  InitiatePaymentResult,
  RefundParams,
  RefundResult,
  VerifyWebhookParams,
  VerifiedWebhook,
  FinalizeParams,
  FinalizeResult,
  BalanceParams,
  BalanceResult,
} from "./adapter-interface";
import type { Result } from "../types";
import type { ProviderError } from "../errors";

/**
 * Paystack — the first LIVE provider behind the V3-13 router (Naira-native, D1).
 *
 * G3 (no test/live branching): the base URL is ALWAYS `api.paystack.co`. The
 * only thing that differs between environments is the SECRET KEY itself
 * (`sk_test_…` vs `sk_live_…`). There is deliberately no `if (test)` anywhere —
 * pointing the same code at a test key gives you the test sandbox.
 */
const PAYSTACK_BASE_URL = "https://api.paystack.co";

/**
 * Minimal structural shape of the parts of `fetch`/`Response` this adapter uses.
 * Declared locally (rather than importing DOM/undici types) so a fake can be
 * injected in tests without constructing a real `Response`. The global `fetch`
 * satisfies it.
 */
export interface PaystackHttpResponse {
  status: number;
  json(): Promise<unknown>;
}
export type PaystackFetch = (
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string },
) => Promise<PaystackHttpResponse>;

export interface PaystackProviderOptions {
  /** `sk_test_…` or `sk_live_…`. Also the key Paystack signs webhooks with. */
  secretKey: string;
  /** Where Paystack returns the buyer after hosted checkout (the finalize route). */
  callbackUrl?: string;
  /** Injected in tests; defaults to the global `fetch`. */
  fetchImpl?: PaystackFetch;
}

/** Paystack `PaymentMethod` → hosted-checkout `channels` value. Biases the
 *  checkout to the method the buyer chose (G8). Methods with no Paystack
 *  channel equivalent fall through to `undefined` (Paystack shows all enabled). */
const METHOD_TO_CHANNEL: Partial<Record<InitiatePaymentParams["method"], string>> = {
  card: "card",
  bank_transfer: "bank_transfer",
  ussd: "ussd",
  mobile_money: "mobile_money",
};

interface PaystackEnvelope {
  status?: boolean;
  message?: string;
  data?: unknown;
}

export class PaystackProvider implements PaymentProviderAdapter {
  readonly key = "paystack" as const;
  private readonly secretKey: string;
  private readonly callbackUrl?: string;
  private readonly fetchImpl: PaystackFetch;

  constructor(opts: PaystackProviderOptions) {
    this.secretKey = opts.secretKey;
    this.callbackUrl = opts.callbackUrl;
    this.fetchImpl = opts.fetchImpl ?? (globalThis.fetch as unknown as PaystackFetch);
  }

  private err(code: string, retryable: boolean, message?: string): { ok: false; error: ProviderError } {
    return { ok: false, error: { code, message: message ?? `paystack ${code}`, retryable, providerKey: "paystack" } };
  }

  /**
   * One transport for every Paystack call. Normalises failure into the router's
   * retryable/fatal axis:
   *   - network throw / 5xx / 408 / 429  → retryable (the router fails over)
   *   - other non-2xx (4xx)              → fatal (a definitive client-side no)
   *   - 2xx with `status:false`          → fatal (provider rejected the request)
   * A successful envelope (`status:true`) is returned for the caller to read `data`.
   */
  private async call(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
  ): Promise<Result<PaystackEnvelope, ProviderError>> {
    const headers: Record<string, string> = { Authorization: `Bearer ${this.secretKey}` };
    const init: { method: string; headers: Record<string, string>; body?: string } = { method, headers };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }
    let res: PaystackHttpResponse;
    try {
      res = await this.fetchImpl(`${PAYSTACK_BASE_URL}${path}`, init);
    } catch {
      return this.err("paystack_network_error", true); // transient → failover
    }
    let envelope: PaystackEnvelope = {};
    try {
      envelope = ((await res.json()) as PaystackEnvelope) ?? {};
    } catch {
      envelope = {};
    }
    if (res.status < 200 || res.status >= 300) {
      return this.err(`paystack_http_${res.status}`, isRetryableStatus(res.status), envelope.message);
    }
    if (envelope.status === false) {
      return this.err("paystack_rejected", false, envelope.message);
    }
    return { ok: true, value: envelope };
  }

  async initiate(
    params: InitiatePaymentParams,
  ): Promise<Result<InitiatePaymentResult, ProviderError>> {
    // Paystack cannot open a charge without a customer identifier. The route
    // threads the authenticated buyer's email; absence is a fatal config error,
    // not something to retry against another provider.
    if (!params.customerEmail) return this.err("paystack_missing_email", false);

    const body: Record<string, unknown> = {
      email: params.customerEmail,
      amount: String(params.amountMinor), // G5: amountMinor IS kobo — verbatim, never x100
      currency: params.currency,
      reference: params.intentId, // stable per intent → idempotent retries + G2 dedup anchor
    };
    if (this.callbackUrl) body.callback_url = this.callbackUrl;
    const channel = METHOD_TO_CHANNEL[params.method];
    if (channel) body.channels = [channel];

    const res = await this.call("POST", "/transaction/initialize", body);
    if (!res.ok) return res;
    const data = (res.value.data ?? {}) as { authorization_url?: string; reference?: string };
    if (!data.authorization_url || !data.reference) {
      return this.err("paystack_bad_initialize_response", false);
    }
    return {
      ok: true,
      value: {
        providerReference: data.reference,
        clientAction: { type: "redirect", url: data.authorization_url },
      },
    };
  }

  async refund(params: RefundParams): Promise<Result<RefundResult, ProviderError>> {
    const body: Record<string, unknown> = {
      transaction: params.providerReference,
      amount: params.amountMinor, // kobo verbatim
    };
    if (params.reason) body.merchant_note = params.reason;
    const res = await this.call("POST", "/refund", body);
    if (!res.ok) return res;
    // The refund is QUEUED (status:"pending"). `refunded` is only truthful once
    // the refund.processed webhook confirms money moved (Q3) — not here.
    const data = (res.value.data ?? {}) as { id?: number | string };
    if (data.id === undefined || data.id === null) {
      return this.err("paystack_bad_refund_response", false);
    }
    return { ok: true, value: { refundReference: String(data.id) } };
  }

  async finalize(params: FinalizeParams): Promise<Result<FinalizeResult, ProviderError>> {
    const res = await this.call("GET", `/transaction/verify/${encodeURIComponent(params.providerReference)}`);
    if (!res.ok) return res;
    const data = (res.value.data ?? {}) as {
      status?: string;
      reference?: string;
      amount?: number;
      currency?: string;
      fees?: unknown;
      fees_breakdown?: unknown;
    };
    return {
      ok: true,
      value: {
        // G2: providerEventId == the transaction reference, the SAME dedup key the
        // async charge.success webhook carries — so the two can't double-apply.
        providerEventId: data.reference ?? params.providerReference,
        impliedStatus: mapChargeStatus(data.status),
        amountMinor: typeof data.amount === "number" ? data.amount : 0,
        currency: data.currency ?? "",
        // V3-VAT-01: the verify call is the RELIABLE fee source. `data.fees` is the
        // real, VAT-inclusive total Paystack deducted (kobo). Read it verbatim; never
        // assume a rate. `fees_breakdown` is usually null → feeVat stays undefined and
        // the ledger derives it by statutory decomposition.
        feeMinor: readProviderFeeMinor(data.fees),
        feeVatMinor: readFeeVatFromBreakdown(data.fees_breakdown),
      },
    };
  }

  async getBalance(params: BalanceParams): Promise<Result<BalanceResult, ProviderError>> {
    const res = await this.call("GET", "/balance");
    if (!res.ok) return res;
    const rows = Array.isArray(res.value.data)
      ? (res.value.data as Array<{ currency?: string; balance?: number }>)
      : [];
    const match = rows.find((row) => row.currency === params.currency);
    if (!match || typeof match.balance !== "number") {
      return this.err("paystack_currency_not_in_balance", false);
    }
    // /balance carries no timestamp; the read time is the freshest honest `asOf`.
    return {
      ok: true,
      value: { currency: params.currency, availableMinor: match.balance, asOf: new Date().toISOString() },
    };
  }

  /**
   * Verify a webhook (G1). Paystack signs the RAW request body with HMAC-SHA512
   * keyed by the secret key and sends the hex digest in `x-paystack-signature`.
   * We HMAC the exact bytes received — never a re-serialized parse, which would
   * change the digest. Fail-closed: any missing/mismatched signature is an
   * error the route turns into a 401. Never throws for an untrusted payload.
   *
   * Event → implied status:
   *   charge.success  → succeeded   (dedup key = transaction reference; matches finalize, G2)
   *   charge.failed   → failed
   *   refund.processed→ refunded    (money confirmed moved — Q3)
   *   refund.failed   → succeeded   (revert: money never left)
   *   everything else → null        (informational; the route just acks)
   * Refund events resolve the intent by the ORIGINAL charge reference
   * (`data.transaction_reference`) and dedup in a distinct `refund:` namespace.
   */
  async verifyWebhook(
    params: VerifyWebhookParams,
  ): Promise<Result<VerifiedWebhook, ProviderError>> {
    if (params.signature === null) return this.err("paystack_missing_signature", false);
    const expected = createHmac("sha512", params.secret).update(params.rawBody).digest("hex");
    if (!constantTimeEqual(params.signature, expected)) {
      return this.err("paystack_bad_signature", false);
    }
    let parsed: { event?: string; data?: Record<string, unknown> };
    try {
      parsed = JSON.parse(params.rawBody);
    } catch {
      return this.err("paystack_bad_body", false);
    }
    const event = parsed.event ?? "unknown";
    const data = parsed.data ?? {};
    const chargeRef = typeof data.reference === "string" ? data.reference : "";
    const txnRef = typeof data.transaction_reference === "string" ? data.transaction_reference : "";

    let impliedStatus: VerifiedWebhook["impliedStatus"] = null;
    let providerReference = chargeRef || txnRef;
    let providerEventId = chargeRef || txnRef;

    switch (event) {
      case "charge.success":
        impliedStatus = "succeeded";
        break;
      case "charge.failed":
        impliedStatus = "failed";
        break;
      case "refund.processed":
        impliedStatus = "refunded";
        providerReference = txnRef;
        providerEventId = `refund:${txnRef}`;
        break;
      case "refund.failed":
        impliedStatus = "succeeded"; // revert refund_processing → succeeded
        providerReference = txnRef;
        providerEventId = `refund:${txnRef}`;
        break;
      default:
        impliedStatus = null; // informational (charge.pending, refund.pending, …)
    }

    return {
      ok: true,
      value: {
        providerEventId,
        eventType: event,
        providerReference,
        impliedStatus,
        // V3-VAT-01: capture the fee if the webhook carries it (charge.success
        // sometimes does, often sends `fees: null` — then it stays undefined and the
        // reliable value comes from the finalize/verify path). Refund payloads have no
        // `fees`, so this is naturally undefined for them.
        feeMinor: readProviderFeeMinor(data.fees),
        feeVatMinor: readFeeVatFromBreakdown(data.fees_breakdown),
      },
    };
  }
}

/**
 * Read a provider-reported fee as whole non-negative kobo, or undefined when it is
 * absent/null/malformed. Deliberately strict: a non-integer or negative value is
 * treated as "not reported" rather than posted as a real fee.
 */
function readProviderFeeMinor(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : undefined;
}

/**
 * Extract a provider-reported VAT-on-fee line from a `fees_breakdown` array, when one
 * exists (forward-compat: Paystack usually sends `null`). Sums any entry whose `type`
 * mentions VAT. Returns undefined when none is present so the ledger falls back to the
 * statutory decomposition of the VAT-inclusive fee.
 */
function readFeeVatFromBreakdown(breakdown: unknown): number | undefined {
  if (!Array.isArray(breakdown)) return undefined;
  let vat = 0;
  let found = false;
  for (const entry of breakdown) {
    if (entry && typeof entry === "object" && /vat/i.test(String((entry as { type?: unknown }).type ?? ""))) {
      const amount = (entry as { amount?: unknown }).amount;
      if (typeof amount === "number" && Number.isInteger(amount) && amount >= 0) {
        vat += amount;
        found = true;
      }
    }
  }
  return found ? vat : undefined;
}

/** Constant-time compare to avoid leaking signature bytes via timing. */
function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Paystack transaction `data.status` → terminal payment-intent status (or null if not yet terminal). */
function mapChargeStatus(status: string | undefined): FinalizeResult["impliedStatus"] {
  switch (status) {
    case "success":
      return "succeeded";
    case "failed":
    case "abandoned":
    case "reversed":
      return "failed";
    default:
      return null; // ongoing / pending / unknown — not terminal
  }
}

/** Transient HTTP statuses worth a router failover; everything else 4xx is a definitive no. */
function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || (status >= 500 && status <= 599);
}
