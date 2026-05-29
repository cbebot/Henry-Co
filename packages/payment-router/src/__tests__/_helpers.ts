import { MockProvider, type MockFailureMode } from "../providers/mock-provider";
import type { PaymentProviderAdapter } from "../providers/adapter-interface";
import type { PaymentProviderKey } from "../types";

/**
 * A MockProvider relabelled as another provider key, for routing tests. Lets a
 * single mock stand in for paystack/flutterwave/stripe so the country ∩
 * capability ∩ registered routing logic can be exercised without live SDKs.
 * Uses Object.defineProperty to set the otherwise-readonly `key`.
 */
export function providerWithKey(
  key: PaymentProviderKey,
  opts?: { failureMode?: MockFailureMode },
): PaymentProviderAdapter {
  const p = new MockProvider(opts);
  Object.defineProperty(p, "key", { value: key });
  return p;
}
