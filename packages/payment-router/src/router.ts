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

/**
 * Build the router for app use. Wiring is env-gated:
 *  - `MOCK_PAYMENT=1` → register the MockProvider under every real provider key
 *    so country/capability routing behaves exactly as in production while the
 *    mock executes charges (the V3-13 dormant rail).
 *  - otherwise → no providers registered. Real Stripe/Paystack/Flutterwave
 *    adapters are wired here in V3-14/15/16; until then every route resolves to
 *    the A5 manual-fallback path.
 */
export function createPaymentRouter(hooks?: RouteHooks): PaymentRouter {
  const useMock = process.env.MOCK_PAYMENT === "1";
  if (!useMock) {
    return new PaymentRouter({ providers: [], hooks });
  }
  const keys: PaymentProviderKey[] = ["stripe", "paystack", "flutterwave", "mock"];
  const providers = keys.map((key) => {
    const m = new MockProvider();
    Object.defineProperty(m, "key", { value: key });
    return m as PaymentProviderAdapter;
  });
  return new PaymentRouter({ providers, hooks });
}
