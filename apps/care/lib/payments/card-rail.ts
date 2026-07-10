import "server-only";

import { randomUUID } from "node:crypto";
import { createPaymentRouter } from "@henryco/payment-router";
import type { PaymentProviderKey } from "@henryco/payment-router/types";
import { getAccountUrl } from "@henryco/config";
import { createAdminSupabase } from "@/lib/supabase";
import { buildTrackingUrl, sendPaymentReceivedEmail } from "@/lib/email/send";
import { careChargeMinor } from "@/lib/payments/card-math";

/**
 * Task 3 — the care CARD checkout on the SAME proven rail as studio/marketplace:
 *
 *   start     → payment intent via `@henryco/payment-router` (provider surfaces only via
 *               the hook, never named to the client) + opaque hosted-checkout action.
 *   settle    → the FROZEN account webhook confirms the INTENT (cash→clearing). This
 *               module writes NO money function and NO `payment_intents.status`.
 *   reconcile → on the payer's return: a provider-confirmed (`succeeded`) care intent with
 *               the EXACT open-request amount settles through care's own guarded RPC
 *               (`care_record_manual_payment` — SEC-HARDEN-05: validates the amount,
 *               idempotent per request, inserts care_payments as owner so the ledger +
 *               recalc triggers fire, posts balanced double-entry, flips the request to
 *               'paid' ATOMICALLY). No raw status write anywhere.
 *
 * Anonymous note: `payment_intents.user_id` is NOT NULL, so the card option exists only
 * for bookings linked to a customer account (94% today) — the intent belongs to the
 * booking's customer. Guest bookings keep the transfer/proof path until the intents
 * schema decision (owner call). FLAG-DARK: CARE_CARD_CHECKOUT=1 + the pooled money path.
 */

export function isCareCardCheckoutEnabled(): boolean {
  return process.env.CARE_CARD_CHECKOUT === "1";
}

/** Offered only when operable: the flag AND the pooled money path are both present. */
export function isCareCardCheckoutReady(): boolean {
  return isCareCardCheckoutEnabled() && Boolean(process.env.PAYMENTS_DATABASE_URL);
}

/**
 * Bank transfer retired → card-first surface. INTERLOCKED to a ready card rail so
 * retiring transfer can never strand a payer; flipping off restores it instantly.
 */
export function isCareBankTransferRetired(): boolean {
  return process.env.CARE_BANK_TRANSFER_RETIRED === "1" && isCareCardCheckoutReady();
}

/** Booking id + linked customer for the card flows (tracking code = the capability). */
export async function getCareBookingIdentityForCard(
  trackingCode: string,
): Promise<{ bookingId: string; customerId: string | null } | null> {
  const admin = createAdminSupabase();
  const { data } = await admin
    .from("care_bookings")
    .select("id, customer_id")
    .eq("tracking_code", trackingCode)
    .maybeSingle();
  if (!data) return null;
  const row = data as { id: string; customer_id: string | null };
  return { bookingId: row.id, customerId: row.customer_id };
}

type CareChargeContext = {
  bookingId: string;
  customerId: string;
  trackingCode: string;
  requestId: string;
  amountMajor: number;
  currency: string;
  customerEmail?: string | null;
};

export type CareCardClientAction =
  | { type: "redirect"; url: string }
  | { type: "sdk"; token: string }
  | { type: "none" };

export type StartCareCardResult =
  | { ok: true; intentId: string; reference: string; clientAction: CareCardClientAction }
  | { ok: false; reason: "amount" | "no_provider" | "provider_error" | "db" };

export async function startCareCardCharge(
  ctx: CareChargeContext,
  returnTo: string,
): Promise<StartCareCardResult> {
  const amountMinor = careChargeMinor(ctx.amountMajor, ctx.currency);
  if (amountMinor == null) return { ok: false, reason: "amount" };

  const reference = randomUUID();
  const admin = createAdminSupabase();

  // The care_payment_requests row is the pre-existing durable record; the intent's
  // metadata carries the join anchors (request + booking + tracking code).
  const intentInsert = await admin
    .from("payment_intents")
    .insert({
      user_id: ctx.customerId,
      amount_minor: amountMinor,
      currency: "NGN",
      country: "NG",
      method: "card",
      idempotency_key: reference,
      division: "care",
      metadata: {
        return_to: returnTo,
        care_request_id: ctx.requestId,
        care_booking_id: ctx.bookingId,
        tracking_code: ctx.trackingCode,
      },
    } as never)
    .select("id")
    .single();
  if (intentInsert.error || !intentInsert.data) {
    return { ok: false, reason: "db" };
  }
  const intentId = (intentInsert.data as { id: string }).id;

  let winningProvider: PaymentProviderKey | null = null;
  const router = createPaymentRouter({
    hooks: { onProviderSucceeded: (key: PaymentProviderKey) => { winningProvider = key; } },
    callbackUrl: getAccountUrl("/payments/callback"),
  });
  const routed = await router.route({
    intentId,
    amountMinor,
    currency: "NGN",
    country: "NG",
    method: "card",
    idempotencyKey: reference,
    customerEmail: ctx.customerEmail ?? undefined,
  });
  if (!routed.ok) {
    return { ok: false, reason: routed.error.kind === "no_suitable_provider" ? "no_provider" : "provider_error" };
  }

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

/**
 * Reconcile-on-return (flag-gated, called by the pay page): a provider-confirmed care
 * intent for this request with the EXACT amount settles through the guarded RPC —
 * idempotent per request (`care_card:<request_id>`), balanced ledger, atomic 'paid'.
 * Amount mismatch never settles.
 */
export async function reconcileCareCardPayment(input: {
  bookingId: string;
  requestId: string;
  requestStatus: string;
  amountMajor: number;
  currency: string;
  customerId: string | null;
}): Promise<"paid" | "unchanged"> {
  if (!isCareCardCheckoutReady()) return "unchanged";
  if (input.requestStatus === "paid" || input.requestStatus === "cancelled") return "unchanged";

  const expectedMinor = careChargeMinor(input.amountMajor, input.currency);
  if (expectedMinor == null) return "unchanged";

  const admin = createAdminSupabase();
  const { data: intents, error } = await admin
    .from("payment_intents")
    .select("id, status, amount_minor")
    .eq("division", "care")
    .eq("metadata->>care_request_id", input.requestId)
    .eq("status", "succeeded");
  if (error || !intents || intents.length === 0) return "unchanged";

  const matched = (intents as Array<{ id: string; amount_minor: number }>).find(
    (intent) => intent.amount_minor === expectedMinor,
  );
  if (!matched) {
    console.error("[care][card] amount mismatch on succeeded intent", {
      requestId: input.requestId,
      expectedMinor,
    });
    return "unchanged";
  }

  // SEC-HARDEN-05: the ONLY paid path. Idempotent per request — a repeat page load
  // (or the second of two succeeded intents) is a no-op inside the RPC.
  const { error: rpcError } = await admin.rpc("care_record_manual_payment", {
    p_idempotency_key: `care_card:${input.requestId}`,
    p_booking_id: input.bookingId,
    p_amount: input.amountMajor,
    p_payment_method: "card",
    p_reference: matched.id,
    p_notes: "Card payment confirmed by the payment provider.",
    p_received_by: input.customerId,
    p_request_id: input.requestId,
    p_request_payload_patch: null,
  } as never);
  if (rpcError) {
    console.error("[care][card] settle RPC failed", { code: rpcError.code, requestId: input.requestId });
    return "unchanged";
  }

  // EMAIL-TPL-02 / money-email matrix: the card settle previously paid in
  // SILENCE while the manual-approval path emailed. Send the SAME receipt —
  // AFTER the guarded RPC committed, best-effort by construction (an email
  // failure never surfaces into the money path). Deduped inside sendCareEmail
  // (`payment-received:{trackingCode}:{amount}`), so a repeat page load after
  // the RPC's idempotent no-op cannot re-email.
  try {
    const { data: booking } = await admin
      .from("care_bookings")
      .select("id, email, customer_name, tracking_code, balance_due, phone")
      .eq("id", input.bookingId)
      .maybeSingle();
    const row = booking as {
      id: string;
      email: string | null;
      customer_name: string | null;
      tracking_code: string;
      balance_due: number | null;
      phone: string | null;
    } | null;
    if (row?.email) {
      const trackUrl = await buildTrackingUrl(row.tracking_code, row.phone);
      await sendPaymentReceivedEmail(row.email, row.id, {
        customerName: row.customer_name || "Customer",
        trackingCode: row.tracking_code,
        amountPaid: `₦${input.amountMajor.toLocaleString()}`,
        balanceDue: `₦${Number(row.balance_due ?? 0).toLocaleString()}`,
        paymentMethod: "card",
        reference: matched.id,
        trackUrl,
      });
    }
  } catch {
    /* best-effort — the settle already committed via the guarded RPC */
  }

  return "paid";
}
