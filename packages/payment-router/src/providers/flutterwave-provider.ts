import { timingSafeEqual } from "node:crypto";
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
import { type Result, normalizeCurrency, minorUnitExponent } from "../types";
import type { ProviderError } from "../errors";

/**
 * Flutterwave — the multi-rail Africa provider behind the V3-13 router (V3-16,
 * D1 Option A): Naira-native secondary that pairs with Paystack for NG/GH
 * failover, and the ONLY `mobile_money` provider (M-Pesa / MTN / Vodafone).
 *
 * G3 (no test/live branching): the base URL is ALWAYS `api.flutterwave.com/v3`.
 * The only thing that differs between environments is the SECRET KEY itself
 * (`FLWSECK_TEST-…` vs live `FLWSECK-…`) — there is deliberately no `if (test)`.
 *
 * Two hard, provider-specific footguns this adapter encodes (proven on a real
 * TEST charge, id 10292954 — `.codex-temp/v3-16-flutterwave-proofs/`):
 *   1. AMOUNTS ARE MAJOR UNITS. `POST /payments` and the refund endpoint take a
 *      MAJOR-unit amount; verify returns MAJOR. We convert via the per-currency
 *      exponent (NGN ×100, XOF ×1, USD ×100) — never a blanket ×100.
 *   2. WEBHOOKS ARE NOTIFICATION-ONLY. The `verif-hash` header is a STATIC secret
 *      compare (not an HMAC of the body), so a valid hash proves only "from
 *      Flutterwave", not "this exact event is true". Every money-bearing webhook is
 *      RE-VERIFIED server-side against the API, and the payload's amount+currency
 *      must match the verify (the documented Flutterwave verification footgun) — a
 *      mismatch is fatal, never a success.
 *
 * `app_fee` is VAT-EXCLUSIVE (opposite of Paystack's VAT-inclusive `fees`):
 * settlement separately deducts the 7.5% VAT on the fee, so the real identity in
 * integer minor units is `gross − settled − merchant_fee = feeMinor` (VAT-inclusive
 * total) and `feeMinor − app_fee = feeVat`. We report both for the V3-VAT-01 ledger.
 */
const FLW_BASE_URL = "https://api.flutterwave.com/v3";

export interface FlutterwaveHttpResponse {
  status: number;
  json(): Promise<unknown>;
}
export type FlutterwaveFetch = (
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string },
) => Promise<FlutterwaveHttpResponse>;

export interface FlutterwaveProviderOptions {
  /** `FLWSECK_TEST-…` or live `FLWSECK-…`. Bearer for every API call. */
  secretKey: string;
  /** Where Flutterwave returns the buyer after hosted checkout (the finalize route). */
  callbackUrl?: string;
  /** Injected in tests; defaults to the global `fetch`. */
  fetchImpl?: FlutterwaveFetch;
}

/** `PaymentMethod` → Flutterwave hosted-checkout `payment_options` token. Wallet
 *  methods (apple_pay / google_pay) are handled by the hosted page itself — no token. */
const METHOD_TO_OPTION: Partial<Record<InitiatePaymentParams["method"], string>> = {
  card: "card",
  bank_transfer: "banktransfer",
  ussd: "ussd",
  mobile_money: "mobilemoney",
};

interface FlwEnvelope {
  status?: string; // "success" | "error"
  message?: string;
  data?: unknown;
}

interface FlwTxnData {
  id?: number | string;
  tx_ref?: string;
  amount?: number;
  charged_amount?: number;
  app_fee?: number;
  merchant_fee?: number;
  amount_settled?: number;
  currency?: string;
  status?: string;
}

/** What a verify call yields, normalised once for both `finalize` and the webhook re-verify. */
interface VerifiedCharge {
  impliedStatus: FinalizeResult["impliedStatus"];
  amountMinor: number;
  currency: string;
  feeMinor?: number;
  feeVatMinor?: number;
  /** The tx_ref — the G2 dedup key shared by finalize and the async charge webhook. */
  txRef: string;
}

export class FlutterwaveProvider implements PaymentProviderAdapter {
  readonly key = "flutterwave" as const;
  private readonly secretKey: string;
  private readonly callbackUrl?: string;
  private readonly fetchImpl: FlutterwaveFetch;

  constructor(opts: FlutterwaveProviderOptions) {
    this.secretKey = opts.secretKey;
    this.callbackUrl = opts.callbackUrl;
    this.fetchImpl = opts.fetchImpl ?? (globalThis.fetch as unknown as FlutterwaveFetch);
  }

  private err(code: string, retryable: boolean, message?: string): { ok: false; error: ProviderError } {
    return { ok: false, error: { code, message: message ?? `flutterwave ${code}`, retryable, providerKey: "flutterwave" } };
  }

  /**
   * One transport for every call. Normalises failure onto the router's
   * retryable/fatal axis: network throw / 5xx / 408 / 429 → retryable (failover);
   * other non-2xx → fatal; 2xx with envelope `status:"error"` → fatal.
   */
  private async call(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
  ): Promise<Result<FlwEnvelope, ProviderError>> {
    const headers: Record<string, string> = { Authorization: `Bearer ${this.secretKey}` };
    const init: { method: string; headers: Record<string, string>; body?: string } = { method, headers };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }
    let res: FlutterwaveHttpResponse;
    try {
      res = await this.fetchImpl(`${FLW_BASE_URL}${path}`, init);
    } catch {
      return this.err("flutterwave_network_error", true); // transient → failover
    }
    let envelope: FlwEnvelope = {};
    try {
      envelope = ((await res.json()) as FlwEnvelope) ?? {};
    } catch {
      envelope = {};
    }
    if (res.status < 200 || res.status >= 300) {
      return this.err(`flutterwave_http_${res.status}`, isRetryableStatus(res.status), envelope.message);
    }
    if (envelope.status !== "success") {
      return this.err("flutterwave_rejected", false, envelope.message);
    }
    return { ok: true, value: envelope };
  }

  async initiate(
    params: InitiatePaymentParams,
  ): Promise<Result<InitiatePaymentResult, ProviderError>> {
    // Flutterwave's hosted checkout requires a customer identifier; absence is a
    // fatal config error, not something to retry against another provider.
    if (!params.customerEmail) return this.err("flutterwave_missing_email", false);

    // A4: reject an unsupported currency BEFORE any minor→major math — assuming an
    // exponent for an unknown code would mis-scale money (a zero-decimal currency 100×).
    const currency = normalizeCurrency(params.currency);
    if (!currency.ok) return this.err("flutterwave_unsupported_currency", false);

    const amountMajor = minorToMajorString(params.amountMinor, minorUnitExponent(currency.value));
    const body: Record<string, unknown> = {
      tx_ref: params.intentId, // stable per intent → idempotent retries + the G2 dedup anchor
      amount: amountMajor, // MAJOR units — never the raw kobo, never a blanket ×100
      currency: currency.value,
      customer: { email: params.customerEmail },
    };
    if (this.callbackUrl) body.redirect_url = this.callbackUrl;
    const option = METHOD_TO_OPTION[params.method];
    if (option) body.payment_options = option;

    const res = await this.call("POST", "/payments", body);
    if (!res.ok) return res;
    const data = (res.value.data ?? {}) as { link?: string };
    if (!data.link) return this.err("flutterwave_bad_initialize_response", false);
    return {
      ok: true,
      value: {
        providerReference: params.intentId, // verify + webhook both resolve by tx_ref
        clientAction: { type: "redirect", url: data.link }, // Principle 9 — hosted, provider-opaque
      },
    };
  }

  /**
   * Verify a charge by its tx_ref (D1 authoritative confirm). The SAME read backs
   * the webhook re-verify, so finalize and the async webhook share the dedup key.
   */
  private async readVerifiedCharge(txRef: string): Promise<Result<VerifiedCharge, ProviderError>> {
    const res = await this.call(
      "GET",
      `/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`,
    );
    if (!res.ok) return res;
    return this.normaliseVerify(res.value.data, txRef);
  }

  private normaliseVerify(raw: unknown, fallbackTxRef: string): Result<VerifiedCharge, ProviderError> {
    const data = (raw ?? {}) as FlwTxnData;
    const currency = normalizeCurrency(String(data.currency ?? ""));
    if (!currency.ok) return this.err("flutterwave_unsupported_currency", false);
    const exp = minorUnitExponent(currency.value);
    const amountMinor = typeof data.amount === "number" ? majorToMinor(data.amount, exp) : 0;

    // V3-VAT-01 fee identity — ONLY when the provider reports a settlement. app_fee
    // is EX-VAT, so feeMinor (VAT-inclusive) = gross − settled − merchant_fee, and
    // feeVat = feeMinor − app_fee. Never fabricate: no settlement → no fee.
    let feeMinor: number | undefined;
    let feeVatMinor: number | undefined;
    if (typeof data.amount_settled === "number") {
      const grossMajor =
        typeof data.charged_amount === "number"
          ? data.charged_amount
          : typeof data.amount === "number"
            ? data.amount
            : null;
      if (grossMajor !== null) {
        const grossMinor = majorToMinor(grossMajor, exp);
        const settledMinor = majorToMinor(data.amount_settled, exp);
        const merchantFeeMinor = typeof data.merchant_fee === "number" ? majorToMinor(data.merchant_fee, exp) : 0;
        const fm = grossMinor - settledMinor - merchantFeeMinor;
        if (Number.isInteger(fm) && fm >= 0) {
          feeMinor = fm;
          if (typeof data.app_fee === "number") {
            const fv = fm - majorToMinor(data.app_fee, exp);
            if (fv >= 0) feeVatMinor = fv;
          }
        }
      }
    }

    return {
      ok: true,
      value: {
        impliedStatus: mapChargeStatus(data.status),
        amountMinor,
        currency: currency.value,
        feeMinor,
        feeVatMinor,
        txRef: typeof data.tx_ref === "string" && data.tx_ref ? data.tx_ref : fallbackTxRef,
      },
    };
  }

  async finalize(params: FinalizeParams): Promise<Result<FinalizeResult, ProviderError>> {
    const v = await this.readVerifiedCharge(params.providerReference);
    if (!v.ok) return v;
    return {
      ok: true,
      value: {
        providerEventId: v.value.txRef, // G2: == the webhook dedup key
        impliedStatus: v.value.impliedStatus,
        amountMinor: v.value.amountMinor,
        currency: v.value.currency,
        feeMinor: v.value.feeMinor,
        feeVatMinor: v.value.feeVatMinor,
      },
    };
  }

  /**
   * Verify a webhook (G1) then RE-VERIFY server-side (notification-only discipline).
   * Flutterwave sends the dashboard secret hash verbatim in `verif-hash` — a static
   * constant-time compare, NOT an HMAC of the body. A valid hash means "from
   * Flutterwave", so money truth still comes from the API verify, and the payload's
   * amount+currency must match it (the documented verification footgun) or it is fatal.
   */
  async verifyWebhook(
    params: VerifyWebhookParams,
  ): Promise<Result<VerifiedWebhook, ProviderError>> {
    if (params.signature === null) return this.err("flutterwave_missing_signature", false);
    if (!constantTimeEqual(params.signature, params.secret)) {
      return this.err("flutterwave_bad_signature", false);
    }
    let parsed: { event?: string; data?: Record<string, unknown> };
    try {
      parsed = JSON.parse(params.rawBody);
    } catch {
      return this.err("flutterwave_bad_body", false);
    }
    const event = parsed.event ?? "unknown";
    const data = parsed.data ?? {};

    if (event.startsWith("refund")) return this.handleRefundWebhook(event, data);
    if (event.startsWith("charge")) return this.handleChargeWebhook(event, data);

    // Informational event (transfer.*, etc.): ack, no effect, no API call.
    return {
      ok: true,
      value: {
        providerEventId: `event:${event}`,
        eventType: event,
        providerReference: typeof data.tx_ref === "string" ? data.tx_ref : "",
        impliedStatus: null,
      },
    };
  }

  private async handleChargeWebhook(
    event: string,
    data: Record<string, unknown>,
  ): Promise<Result<VerifiedWebhook, ProviderError>> {
    const txRef = typeof data.tx_ref === "string" ? data.tx_ref : "";
    if (!txRef) return this.err("flutterwave_webhook_no_tx_ref", false);

    const v = await this.readVerifiedCharge(txRef);
    if (!v.ok) return v;

    // Footgun guard: the notification's amount + currency must match the verify.
    if (typeof data.currency === "string" && data.currency !== v.value.currency) {
      return this.err("flutterwave_webhook_currency_mismatch", false);
    }
    if (typeof data.amount === "number") {
      const payloadMinor = majorToMinor(data.amount, minorUnitExponent(v.value.currency));
      if (payloadMinor !== v.value.amountMinor) {
        return this.err("flutterwave_webhook_amount_mismatch", false);
      }
    }

    return {
      ok: true,
      value: {
        providerEventId: v.value.txRef, // G2: same key as finalize
        eventType: event,
        providerReference: v.value.txRef,
        impliedStatus: v.value.impliedStatus,
        // amount/currency are NOT surfaced (matching the contract + Paystack): the
        // payload↔verify match was already enforced above, and the route resolves
        // the intent by reference — the amount truth lives in the DB, not the webhook.
        feeMinor: v.value.feeMinor,
        feeVatMinor: v.value.feeVatMinor,
      },
    };
  }

  private async handleRefundWebhook(
    event: string,
    data: Record<string, unknown>,
  ): Promise<Result<VerifiedWebhook, ProviderError>> {
    let txRef = typeof data.tx_ref === "string" && data.tx_ref ? data.tx_ref : null;
    let currency = typeof data.currency === "string" ? data.currency : null;

    // The refund payload usually omits tx_ref; resolve it (and the currency, needed
    // for an exact amount conversion) from the transaction id when present.
    if (!txRef) {
      const txId = data.tx_id ?? data.transaction_id;
      if (txId != null) {
        const res = await this.call("GET", `/transactions/${encodeURIComponent(String(txId))}/verify`);
        if (res.ok) {
          const vd = (res.value.data ?? {}) as FlwTxnData;
          if (typeof vd.tx_ref === "string") txRef = vd.tx_ref;
          if (typeof vd.currency === "string") currency = vd.currency;
        }
      }
    }

    const outcome = refundOutcome(typeof data.status === "string" ? data.status : "");
    const ref = txRef ?? "";
    if (outcome === null) {
      // Unknown refund status (e.g. initiated/processing) — informational only;
      // refund outcomes are never guessed.
      return {
        ok: true,
        value: { providerEventId: `refund:${ref}`, eventType: event, providerReference: ref, impliedStatus: null },
      };
    }

    let amountMinor: number | null = null;
    const refundedMajor = data.amount_refunded ?? data.amount;
    if (typeof refundedMajor === "number" && currency) {
      const norm = normalizeCurrency(currency);
      if (norm.ok) amountMinor = majorToMinor(refundedMajor, minorUnitExponent(norm.value));
    }
    const refundReference = data.id != null ? String(data.id) : null;

    return {
      ok: true,
      value: {
        // Refund truth flows through apply_refund_webhook (resolves the intent's
        // single in-flight refund row), never impliedStatus.
        providerEventId: `refund:${ref}`,
        eventType: event,
        providerReference: ref,
        impliedStatus: null,
        refundEvent: { outcome, amountMinor, refundReference },
      },
    };
  }

  async refund(params: RefundParams): Promise<Result<RefundResult, ProviderError>> {
    // The refund endpoint keys off the NUMERIC transaction id, but our
    // providerReference is the tx_ref. Resolve it (the same verify finalize uses).
    const resolved = await this.call(
      "GET",
      `/transactions/verify_by_reference?tx_ref=${encodeURIComponent(params.providerReference)}`,
    );
    if (!resolved.ok) return resolved;
    const txn = (resolved.value.data ?? {}) as FlwTxnData;
    if (txn.id === undefined || txn.id === null) {
      return this.err("flutterwave_unresolved_transaction_id", false);
    }
    const currency = normalizeCurrency(String(txn.currency ?? "NGN"));
    const exp = currency.ok ? minorUnitExponent(currency.value) : 2;
    const body: Record<string, unknown> = { amount: minorToMajorString(params.amountMinor, exp) };
    if (params.reason) body.comments = params.reason;

    const res = await this.call("POST", `/transactions/${encodeURIComponent(String(txn.id))}/refund`, body);
    if (!res.ok) return res;
    // QUEUED — `refunded` is only truthful once the refund webhook confirms (Q3).
    const data = (res.value.data ?? {}) as { id?: number | string };
    if (data.id === undefined || data.id === null) {
      return this.err("flutterwave_bad_refund_response", false);
    }
    return { ok: true, value: { refundReference: String(data.id) } };
  }

  // NOTE: listRefunds is DELIBERATELY NOT implemented. Flutterwave has no verified
  // per-transaction refund-list filter we can trust for adopt-don't-redrive; an
  // incomplete list would license the refund route to create a SECOND real-money
  // refund (the Paystack #272 double-refund class). Without listRefunds the route
  // 503s the crash window and waits for manual review — the money-safe default.

  async getBalance(params: BalanceParams): Promise<Result<BalanceResult, ProviderError>> {
    const res = await this.call("GET", "/balances");
    if (!res.ok) return res;
    const rows = Array.isArray(res.value.data)
      ? (res.value.data as Array<{ currency?: string; available_balance?: number }>)
      : [];
    const match = rows.find((row) => row.currency === params.currency);
    if (!match || typeof match.available_balance !== "number") {
      return this.err("flutterwave_currency_not_in_balance", false);
    }
    const currency = normalizeCurrency(params.currency);
    const exp = currency.ok ? minorUnitExponent(currency.value) : 2;
    return {
      ok: true,
      value: {
        currency: params.currency,
        availableMinor: majorToMinor(match.available_balance, exp),
        asOf: new Date().toISOString(),
      },
    };
  }
}

/**
 * Convert an integer minor-unit amount to a MAJOR-unit string with no float drift.
 * Pure integer math: split whole/fraction by the exponent, strip trailing zeros.
 *   50000 (exp 2) → "500" · 10050 → "100.5" · 12345 → "123.45" · 5000 (exp 0) → "5000"
 */
function minorToMajorString(amountMinor: number, exp: number): string {
  if (exp <= 0) return String(amountMinor);
  const factor = 10 ** exp;
  const sign = amountMinor < 0 ? "-" : "";
  const abs = Math.abs(amountMinor);
  const whole = Math.trunc(abs / factor);
  const frac = abs % factor;
  if (frac === 0) return `${sign}${whole}`;
  const fracStr = String(frac).padStart(exp, "0").replace(/0+$/, "");
  return `${sign}${whole}.${fracStr}`;
}

/** Convert a MAJOR-unit number to integer minor units (e.g. 492.46 NGN → 49246 kobo). */
function majorToMinor(major: number, exp: number): number {
  return Math.round(major * 10 ** exp);
}

/** Flutterwave transaction `status` → terminal payment-intent status (or null). */
function mapChargeStatus(status: string | undefined): FinalizeResult["impliedStatus"] {
  switch (status) {
    case "successful":
      return "succeeded";
    case "failed":
    case "cancelled":
      return "failed";
    default:
      return null; // pending / ongoing / unknown — not terminal
  }
}

/** Flutterwave refund webhook `status` → normalised outcome, or null when not terminal. */
function refundOutcome(status: string): "processed" | "failed" | null {
  switch (status) {
    case "completed":
      return "processed";
    case "failed":
      return "failed";
    default:
      return null;
  }
}

/** Constant-time compare to avoid leaking secret-hash bytes via timing. */
function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Transient HTTP statuses worth a router failover; everything else 4xx is a definitive no. */
function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || (status >= 500 && status <= 599);
}
