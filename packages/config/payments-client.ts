import type { Stripe } from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { getPublicStripeConfig } from "./integrations";

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripeJs() {
  const { publishableKey } = getPublicStripeConfig();
  if (!publishableKey) {
    return Promise.resolve(null);
  }

  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
}

