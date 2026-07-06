import "server-only";

import { randomUUID } from "node:crypto";
import { createAdminSupabase } from "@/lib/supabase";
import { createPaymentRouter } from "@henryco/payment-router";
import type { PaymentProviderKey } from "@henryco/payment-router/types";
import { getAccountUrl } from "@henryco/config";
import { isPaymentDbConfigured } from "@/lib/payments/db";

/**
 * V3-DIVISION-CHECKOUT-01 — marketplace CARD checkout start.
 *
 * Ignites the dormant `cardCta` seam on the SAME proven rail the account wallet
 * top-up uses: it creates a `payment_intent` through `@henryco/payment-router`
 * (test or live purely by which provider secret is configured — G3) and hands the
 * buyer the opaque hosted-checkout action. The charge is confirmed by the existing,
 * frozen account webhook/finalize (`apply_payment_webhook` → cash→clearing); the
 * order's revenue allocation + receipt are the marketplace reconciler's job on the
 * buyer's return (`./sale-reconcile-port`). This module writes NO money function
 * and NO `payment_intents.status`.
 *
 * Idempotency anchor (mirrors the wallet rail): ONE fresh UUID is BOTH the
 * intent's `idempotency_key` (A1: UNIQUE(user_id, idempotency_key)) AND the
 * `marketplace_payment_records.reference` (UNIQUE) — the reconciler joins them.
 * The durable payment record is written BEFORE the charge starts, so a charge can
 * never exist without a record to reconcile it against (never strand).
 */

/**
 * TEST-MODE GATE. The card method/CTA is offered ONLY when this flag is set.
 * Production leaves it unset → marketplace stays bank-transfer-only. Per-division
 * LIVE activation (set this flag + a live provider key + PAYMENTS_DATABASE_URL on
 * the marketplace project) is a SEPARATE owner-gated step after the FL2 soak.
 */
export function isMarketplaceCardCheckoutEnabled(): boolean {
  return process.env.MARKETPLACE_CARD_CHECKOUT === "1";
}

/**
 * Card checkout is OFFERED only when it is also operable — the flag AND the pooled
 * money path (`PAYMENTS_DATABASE_URL`, needed to settle the sale into the ledger) are
 * both present. Use this at the points that CREATE a card order (the checkout method +
 * allowlist) so a misconfigured env (flag on, DB off) can never strand a buyer with a
 * card order that has no rail to settle it.
 */
export function isMarketplaceCardCheckoutReady(): boolean {
  return isMarketplaceCardCheckoutEnabled() && isPaymentDbConfigured();
}

export type CardCheckoutClientAction =
  | { type: "redirect"; url: string }
  | { type: "sdk"; token: string }
  | { type: "none" };

export type StartCardCheckoutResult =
  | { ok: true; intentId: string; reference: string; clientAction: CardCheckoutClientAction }
  | { ok: false; reason: "amount" | "no_provider" | "provider_error" | "db" };

const MIN_KOBO = 10_000; // NGN 100
// A high SANITY ceiling, not a product limit: expensive marketplace orders (electronics,
// furniture, bulk) must go through, so this bounds only absurd amounts — a fat-finger/pricing-bug
// charge or an obviously-fraudulent total. Real per-transaction limits live at the card + provider
// layer (the issuing bank's online limit, the processor's fraud checks), not here.
const MAX_KOBO = 10_000_000_000; // NGN 100,000,000

export async function startMarketplaceCardCheckout(input: {
  order: { id: string; orderNo: string; grandTotalMajor: number; currency: string };
  userId: string;
  customerEmail?: string | null;
  /** Absolute, trusted marketplace URL to return the buyer to (the /pay status page). */
  returnTo: string;
}): Promise<StartCardCheckoutResult> {
  const currency = (input.order.currency || "NGN").toUpperCase();
  const grossMinor = Math.round(Math.max(0, input.order.grandTotalMajor) * 100);
  if (currency !== "NGN" || !Number.isSafeInteger(grossMinor) || grossMinor < MIN_KOBO || grossMinor > MAX_KOBO) {
    return { ok: false, reason: "amount" };
  }

  const reference = randomUUID(); // shared anchor: intent idempotency_key === record.reference
  const admin = createAdminSupabase();

  // 1) Durable payment record FIRST — so a started charge always has a row to
  //    reconcile against. status 'awaiting_payment' is the reconciler's claimable
  //    initial phase. amount is stored in MAJOR units to match the order columns.
  const recordInsert = await admin
    .from("marketplace_payment_records")
    .insert({
      order_id: input.order.id,
      order_no: input.order.orderNo,
      provider: "card",
      method: "card",
      status: "awaiting_payment",
      reference,
      amount: Math.round(input.order.grandTotalMajor),
      submitted_at: new Date().toISOString(),
      metadata: { rail: "card", order_no: input.order.orderNo },
    } as never)
    .select("id")
    .maybeSingle();
  if (recordInsert.error || !recordInsert.data) {
    return { ok: false, reason: "db" };
  }

  // 2) Create the payment intent (A1 idempotent). division + return_to ride in
  //    metadata so the account callback returns the buyer to THIS order, and the
  //    division surfaces for finance reconciliation.
  const intentInsert = await admin
    .from("payment_intents")
    .insert({
      user_id: input.userId,
      amount_minor: grossMinor,
      currency: "NGN",
      country: "NG",
      method: "card",
      idempotency_key: reference,
      division: "marketplace",
      metadata: { return_to: input.returnTo, order_no: input.order.orderNo },
    } as never)
    .select("id, status")
    .single();

  if (intentInsert.error || !intentInsert.data) {
    return { ok: false, reason: "db" };
  }
  const intentRow = intentInsert.data as { id: string; status: string };
  const intentId = intentRow.id;

  // 3) Route to a provider. The winning provider surfaces ONLY via the hook
  //    (Principle 9 — never named to the client); we persist its reference
  //    server-side for the webhook to resolve the intent on confirmation.
  let winningProvider: PaymentProviderKey | null = null;
  const router = createPaymentRouter({
    hooks: { onProviderSucceeded: (key) => { winningProvider = key; } },
    callbackUrl: getAccountUrl("/payments/callback"),
  });
  const routed = await router.route({
    intentId,
    amountMinor: grossMinor,
    currency: "NGN",
    country: "NG",
    method: "card",
    idempotencyKey: reference,
    customerEmail: input.customerEmail ?? undefined,
  });

  if (!routed.ok) {
    return { ok: false, reason: routed.error.kind === "no_suitable_provider" ? "no_provider" : "provider_error" };
  }

  // Record the winning routing attempt (refund/reconciliation anchor) + persist the
  // provider reference server-side — NOT a status write (D3 unaffected).
  if (winningProvider) {
    await admin.from("payment_attempts").insert({
      intent_id: intentId,
      provider: winningProvider,
      provider_reference: routed.value.providerReference,
      status: "succeeded",
    } as never);
  }
  await admin
    .from("payment_intents")
    .update({ provider_reference: routed.value.providerReference } as never)
    .eq("id", intentId);

  return { ok: true, intentId, reference, clientAction: routed.value.clientAction };
}
