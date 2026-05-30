import type {
  PaymentProviderAdapter,
  InitiatePaymentResult,
} from "./providers/adapter-interface";
import type {
  Result,
  PaymentProviderKey,
  PaymentMethod,
  ISO3166Alpha2,
  ISO4217,
} from "./types";
import { providerPreferenceForCountry } from "./routing/country-defaults";
import { providerSupportsMethod } from "./routing/capability-matrix";
import { MockProvider } from "./providers/mock-provider";
import { PaystackProvider } from "./providers/paystack-provider";

export interface SelectProviderQuery {
  country: ISO3166Alpha2;
  currency: ISO4217;
  method: PaymentMethod;
}

export interface RouteIntent {
  intentId: string;
  amountMinor: number;
  currency: ISO4217;
  country: ISO3166Alpha2;
  method: PaymentMethod;
  idempotencyKey: string;
  /**
   * The authenticated buyer's email. Optional at the router boundary (kept
   * provider-agnostic), but Paystack cannot open a charge without it — its
   * adapter treats absence as a fatal config error. Threaded verbatim to
   * `initiate`.
   */
  customerEmail?: string;
}

/**
 * Provider-agnostic success payload (ANTI-CLONE Principle 9): it carries the
 * opaque client action and the server-side provider reference, but NEVER the
 * provider key. The HTTP layer forwards `clientAction` to the client and keeps
 * `providerReference` server-side. The winning provider is surfaced separately
 * via {@link RouteHooks.onProviderSucceeded} for server-side persistence.
 */
export interface RouteSuccess {
  intentId: string;
  clientAction: InitiatePaymentResult["clientAction"];
  providerReference: string;
}

export type RouteError =
  | { kind: "no_suitable_provider"; country: string; currency: string; method: string }
  | { kind: "provider_error"; code: string };

export interface RouteHooks {
  /** Fires before each initiate attempt (telemetry: henry.payment.* selection). */
  onProviderSelected?: (key: PaymentProviderKey, intentId: string) => void;
  /** Fires once when an attempt succeeds — the server persists this provider. */
  onProviderSucceeded?: (key: PaymentProviderKey, intentId: string) => void;
  /** Fires when a retryable failure moves routing to the next candidate. */
  onProviderFailover?: (from: PaymentProviderKey, code: string) => void;
  /** Fires when no provider can serve the request (A5 manual fallback). */
  onNoSuitableProvider?: (query: SelectProviderQuery) => void;
}

export interface PaymentRouterOptions {
  providers: PaymentProviderAdapter[];
  hooks?: RouteHooks;
}

export class PaymentRouter {
  private readonly registered: Map<PaymentProviderKey, PaymentProviderAdapter>;
  private readonly hooks: RouteHooks;

  constructor(options: PaymentRouterOptions) {
    this.registered = new Map(options.providers.map((p) => [p.key, p]));
    this.hooks = options.hooks ?? {};
  }

  /**
   * Ordered eligible providers for a request: country preference, filtered to
   * those both registered AND capable of the method. The order is the failover
   * order. This is the single routing rule both {@link selectProvider} and
   * {@link route} consume.
   */
  private eligibleProviders(query: SelectProviderQuery): PaymentProviderKey[] {
    return providerPreferenceForCountry(query.country).filter(
      (key) => this.registered.has(key) && providerSupportsMethod(key, query.method),
    );
  }

  /** The provider that would be tried first, or null if none is eligible. */
  selectProvider(query: SelectProviderQuery): PaymentProviderKey | null {
    return this.eligibleProviders(query)[0] ?? null;
  }

  getAdapter(key: PaymentProviderKey): PaymentProviderAdapter | undefined {
    return this.registered.get(key);
  }

  /**
   * Route an intent: try each eligible provider in order, failing over only on
   * RETRYABLE errors. A fatal error stops immediately (no failover). Returns a
   * provider-agnostic success or a typed error. The A5 path (no eligible
   * provider) returns `no_suitable_provider` so the caller can offer a manual
   * fallback instead of a dead end.
   */
  async route(intent: RouteIntent): Promise<Result<RouteSuccess, RouteError>> {
    const query: SelectProviderQuery = {
      country: intent.country,
      currency: intent.currency,
      method: intent.method,
    };
    const candidates = this.eligibleProviders(query);
    if (candidates.length === 0) {
      this.hooks.onNoSuitableProvider?.(query);
      return { ok: false, error: { kind: "no_suitable_provider", ...query } };
    }

    let lastCode = "unknown";
    for (const key of candidates) {
      const adapter = this.registered.get(key)!;
      this.hooks.onProviderSelected?.(key, intent.intentId);
      const result = await adapter.initiate({
        intentId: intent.intentId,
        amountMinor: intent.amountMinor,
        currency: intent.currency,
        country: intent.country,
        method: intent.method,
        idempotencyKey: intent.idempotencyKey,
        customerEmail: intent.customerEmail,
      });
      if (result.ok) {
        this.hooks.onProviderSucceeded?.(key, intent.intentId);
        return {
          ok: true,
          value: {
            intentId: intent.intentId,
            clientAction: result.value.clientAction,
            providerReference: result.value.providerReference,
          },
        };
      }
      lastCode = result.error.code;
      if (!result.error.retryable) break; // fatal → stop, do not fail over
      this.hooks.onProviderFailover?.(key, result.error.code);
    }
    return { ok: false, error: { kind: "provider_error", code: lastCode } };
  }
}

export interface CreatePaymentRouterOptions {
  /** Server-side routing observers (provider identity surfaces ONLY here). */
  hooks?: RouteHooks;
  /**
   * Absolute URL Paystack returns the buyer to after hosted checkout. Computed
   * by the APP via its env-aware account-origin helper and injected here (G7:
   * config-driven, never a hardcoded host) — so the base-domain migration is a
   * one-place change. The package deliberately does NOT read an env var for
   * this (an uninventoried `PAYSTACK_CALLBACK_URL` would be a phantom env).
   */
  callbackUrl?: string;
}

/**
 * Build the router for app use. Wiring is env-gated and additive — a LIVE
 * adapter always wins its key; the mock only backfills keys nothing live serves:
 *  - `PAYSTACK_SECRET_KEY` set → register the live {@link PaystackProvider}
 *    under `paystack` (V3-15 activation). G3: the same code is test or live
 *    purely by which secret (`sk_test_…`/`sk_live_…`) is supplied.
 *  - `MOCK_PAYMENT=1` → register the MockProvider under every real provider key
 *    NOT already served by a live adapter, so country/capability routing behaves
 *    as in production across the still-dormant rails (the V3-13 mock rail).
 *  - neither → no providers registered; every route resolves to the A5
 *    manual-fallback path.
 *
 * Registering live providers first (and recording their keys in `served`) is
 * what stops the mock loop from shadowing a real provider — so `MOCK_PAYMENT=1`
 * is safe to leave on alongside a real Paystack key.
 */
export function createPaymentRouter(options?: CreatePaymentRouterOptions): PaymentRouter {
  const providers: PaymentProviderAdapter[] = [];
  const served = new Set<PaymentProviderKey>();

  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  if (paystackSecret) {
    providers.push(
      new PaystackProvider({ secretKey: paystackSecret, callbackUrl: options?.callbackUrl }),
    );
    served.add("paystack");
  }

  if (process.env.MOCK_PAYMENT === "1") {
    const keys: PaymentProviderKey[] = ["stripe", "paystack", "flutterwave", "mock"];
    for (const key of keys) {
      if (served.has(key)) continue; // never shadow a live adapter
      const m = new MockProvider();
      Object.defineProperty(m, "key", { value: key });
      providers.push(m as PaymentProviderAdapter);
      served.add(key);
    }
  }

  return new PaymentRouter({ providers, hooks: options?.hooks });
}
