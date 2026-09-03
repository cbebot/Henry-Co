import "server-only";

import { randomUUID } from "node:crypto";
import { createPaymentRouter } from "@henryco/payment-router";
import type { PaymentProviderKey } from "@henryco/payment-router/types";
import { getAccountUrl } from "@henryco/config";
import { getOptionalEnv } from "@/lib/env";
import { createAdminSupabase } from "@/lib/supabase";
import { getStudioSnapshot, writeStudioLog } from "@/lib/studio/store";
import { sendPaymentReceivedNotifications } from "@/lib/studio/email/send";
import { studioChargeMinor } from "@/lib/studio/card-math";

/**
 * Task 3 — the studio CARD checkout on the SAME proven rail as marketplace
 * (V3-DIVISION-CHECKOUT-01 precedent, mirrored):
 *
 *   start   → payment intent through `@henryco/payment-router` (provider surfaces only
 *             via the hook, never named to the client) + opaque hosted-checkout action.
 *   settle  → the FROZEN account webhook confirms the INTENT (cash→clearing). This
 *             module writes NO money function and NO `payment_intents.status`.
 *   reconcile (on the buyer's return) → if the intent for this studio payment reached
 *             provider-confirmed `succeeded` with the exact expected amount, the
 *             `studio_payments` row flips to `paid` (compare-and-swap; idempotent).
 *
 * The durable domain record is the EXISTING `studio_payments` row — it exists before
 * any charge starts, so a charge can never be stranded without a record (the intent's
 * metadata carries `studio_payment_id`, the join anchor).
 *
 * FLAG-DARK: `STUDIO_CARD_CHECKOUT=1` + the pooled money path must both be present.
 * Bank transfer stays untouched alongside — retirement is a separate owner-gated pass
 * after the live settle test.
 *
 * Revenue-allocation note (documented gap, v1): the webhook's cash→clearing posting
 * keeps the ledger balanced; per-sale studio revenue allocation stays with the existing
 * studio finance flow (same as the bank-transfer world today) until the division-sale
 * breakdown for studio is specified.
 */

export function isStudioCardCheckoutEnabled(): boolean {
  return getOptionalEnv("STUDIO_CARD_CHECKOUT") === "1";
}

/** Offered only when operable: the flag AND the pooled money path are both present. */
export function isStudioCardCheckoutReady(): boolean {
  return isStudioCardCheckoutEnabled() && Boolean(getOptionalEnv("PAYMENTS_DATABASE_URL"));
}

/**
 * Bank transfer retired → the pay surface goes card-first (no bank guide, no proof upload).
 * INTERLOCKED to the card rail being READY: retiring transfer can never strand a payer with
 * no way to pay. The owner sets STUDIO_BANK_TRANSFER_RETIRED=1 only AFTER the live card
 * settle test passes; flipping it off instantly restores bank transfer (no code change).
 */
export function isStudioBankTransferRetired(): boolean {
  return getOptionalEnv("STUDIO_BANK_TRANSFER_RETIRED") === "1" && isStudioCardCheckoutReady();
}

export type StudioCardClientAction =
  | { type: "redirect"; url: string }
  | { type: "sdk"; token: string }
  | { type: "none" };

export type StartStudioCardResult =
  | { ok: true; intentId: string; reference: string; clientAction: StudioCardClientAction }
  | { ok: false; reason: "amount" | "no_provider" | "provider_error" | "db" };

export async function startStudioCardCharge(input: {
  payment: { id: string; label: string; amount: number; currency: string };
  userId: string;
  customerEmail?: string | null;
  /** Absolute, trusted studio URL to return the buyer to (the /pay workspace). */
  returnTo: string;
}): Promise<StartStudioCardResult> {
  const amountMinor = studioChargeMinor(input.payment.amount, input.payment.currency);
  if (amountMinor == null) return { ok: false, reason: "amount" };

  const reference = randomUUID(); // intent idempotency anchor
  const admin = createAdminSupabase();

  // Create the payment intent (the studio_payments row is already the durable record;
  // metadata carries the join anchor + the return path for the account callback).
  const intentInsert = await admin
    .from("payment_intents")
    .insert({
      user_id: input.userId,
      amount_minor: amountMinor,
      currency: "NGN",
      country: "NG",
      method: "card",
      idempotency_key: reference,
      division: "studio",
      metadata: {
        return_to: input.returnTo,
        studio_payment_id: input.payment.id,
        label: input.payment.label,
      },
    } as never)
    .select("id, status")
    .single();
  if (intentInsert.error || !intentInsert.data) {
    return { ok: false, reason: "db" };
  }
  const intentId = (intentInsert.data as { id: string }).id;

  // Route to a provider — the winner surfaces ONLY via the hook (never named to the
  // client); its reference persists server-side for the webhook to resolve the charge.
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
    customerEmail: input.customerEmail ?? undefined,
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

  await writeStudioLog({
    eventType: "studio_card_charge_started",
    route: "/pay",
    success: true,
    details: { paymentId: input.payment.id, reference },
  });

  return { ok: true, intentId, reference, clientAction: routed.value.clientAction };
}

/**
 * Reconcile-on-return: called by the pay page load (flag-gated). If a provider-confirmed
 * (`succeeded`) studio intent exists for this payment with the EXACT expected amount,
 * flip the studio_payments row to `paid` (compare-and-swap — a repeat load is a no-op).
 * An amount mismatch never marks paid; it is logged for finance instead.
 */
export async function reconcileStudioCardPayment(payment: {
  id: string;
  amount: number;
  currency: string;
  status: string;
}): Promise<"paid" | "unchanged"> {
  if (!isStudioCardCheckoutReady()) return "unchanged";
  if (payment.status === "paid" || payment.status === "cancelled") return "unchanged";

  const expectedMinor = studioChargeMinor(payment.amount, payment.currency);
  if (expectedMinor == null) return "unchanged";

  const admin = createAdminSupabase();
  const { data: intents, error } = await admin
    .from("payment_intents")
    .select("id, status, amount_minor")
    .eq("division", "studio")
    .eq("metadata->>studio_payment_id", payment.id)
    .eq("status", "succeeded");
  if (error || !intents || intents.length === 0) return "unchanged";

  const matched = (intents as Array<{ id: string; amount_minor: number }>).find(
    (intent) => intent.amount_minor === expectedMinor,
  );
  if (!matched) {
    await writeStudioLog({
      eventType: "studio_card_amount_mismatch",
      route: "/pay",
      success: false,
      details: { paymentId: payment.id, expectedMinor },
    });
    return "unchanged";
  }

  // Compare-and-swap: only a not-yet-paid row flips, so replays are no-ops and the
  // proof-verification path can never be overwritten backwards.
  const { data: updated, error: updateError } = await admin
    .from("studio_payments")
    .update({ status: "paid", method: "card", updated_at: new Date().toISOString() } as never)
    .eq("id", payment.id)
    .neq("status", "paid")
    .select("id")
    .maybeSingle();
  if (updateError || !updated) return "unchanged";

  await writeStudioLog({
    eventType: "studio_card_payment_settled",
    route: "/pay",
    success: true,
    details: { paymentId: payment.id, intentId: matched.id },
  });

  // EMAIL-TPL-02: the card-rail settle previously flipped the payment to paid
  // in SILENCE. Send the same payment-received receipt the manual finance path
  // sends — AFTER the CAS committed, best-effort by construction (an email
  // problem must never surface into the money path or the pay-page load).
  try {
    const snapshot = await getStudioSnapshot();
    const paidPayment = snapshot.payments.find((item) => item.id === payment.id);
    const project = paidPayment
      ? snapshot.projects.find((item) => item.id === paidPayment.projectId)
      : null;
    const lead = project ? snapshot.leads.find((item) => item.id === project.leadId) : null;
    if (paidPayment && project && lead) {
      await sendPaymentReceivedNotifications({ lead, project, payment: paidPayment });
    }
  } catch {
    /* best-effort — the settle already committed and is logged above */
  }

  return "paid";
}
