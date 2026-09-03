import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { requireSensitiveAction } from "@henryco/auth/server/sensitive-action-guard";
import { createPaymentRouter } from "@henryco/payment-router";
import { resolveProviderFromSucceededAttempt } from "@/lib/payments/server";
import { emitPaymentEvent } from "@/lib/payments/telemetry";
import { callPaymentRpc } from "@/lib/payments/db";

export const runtime = "nodejs";

/**
 * V3-19 — refund initiation (staff/owner ops action).
 *
 * AUTHORIZATION (SQL truth): the caller must satisfy `public.is_platform_staff()`
 * evaluated under THEIR OWN JWT (hub/staff/account/security × owner/admin/
 * superadmin) — any TS-side staff mirror is UI-only. Customer self-serve refund
 * REQUESTS are a separate, deliberately-unbuilt surface (out of V3-19's scope);
 * the V3-15-era self-refund authorization is retired — a customer must not be
 * able to refund themselves at will.
 *
 * Body: { refundKey: uuid (required — idempotency), amountMinor?: number
 * (PARTIAL; omitted = full remaining), reason?: string }.
 *
 * Money truth (Q3): `initiate_payment_refund` atomically claims the intent
 * (succeeded → refund_processing), records the attempt (UNIQUE(intent,
 * refund_key); cumulative ≤ captured enforced by the DB trigger), and — for
 * wallet top-ups — debits the wallet HOLD under a never-negative CAS. Only then
 * does this route call the provider. A synchronous provider rejection unwinds
 * everything through `fail_payment_refund` (row failed + hold released + intent
 * reverted, one transaction). `refunded` is ONLY ever reached by the provider's
 * refund.processed webhook.
 *
 * ADOPT-DON'T-REDRIVE: the provider's create-refund is NOT idempotent. If a
 * prior attempt crashed between recording and creating (row exists,
 * provider_refund_reference null), a same-refundKey retry LISTS the provider's
 * refunds for the transaction and adopts a queued match instead of creating a
 * second real-money refund. When the list is unavailable, we refuse (503) —
 * never risk a double refund.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // SQL staff/owner truth under the caller's JWT — RLS-grade, not a TS mirror.
  const staff = await supabase.rpc("is_platform_staff");
  if (staff.error || staff.data !== true) {
    return NextResponse.json({ error: "Not found" }, { status: 404 }); // do not reveal the surface
  }

  const guard = await requireSensitiveAction(request, {
    action: "payment.refund", // R1: refund is sensitive — recent reauth required
    entityType: "payment_intent",
    entityId: id,
    resolveUser: async () => user,
    userId: (u) => u.id,
  });
  if (!guard.ok) return guard.response;

  let body: { refundKey?: string; amountMinor?: number; reason?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    // empty body tolerated below only if refundKey is present — it never is here
  }
  const refundKey = typeof body.refundKey === "string" ? body.refundKey.trim() : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(refundKey)) {
    return NextResponse.json({ error: "refundKey (uuid) is required" }, { status: 400 });
  }
  const amountMinor =
    body.amountMinor === undefined
      ? null
      : Number.isSafeInteger(body.amountMinor) && body.amountMinor > 0
        ? body.amountMinor
        : NaN;
  if (Number.isNaN(amountMinor)) {
    return NextResponse.json({ error: "amountMinor must be a positive integer (kobo)" }, { status: 400 });
  }
  const reason = typeof body.reason === "string" && body.reason.trim() !== "" ? body.reason.trim() : null;

  const admin = createAdminSupabase();
  const intent = await admin
    .from("payment_intents")
    .select("id, status, amount_minor")
    .eq("id", id)
    .single();
  const intentRow = intent.data as { id: string; status: string; amount_minor: number } | null;
  if (intent.error || !intentRow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Resolve the provider that holds the money (Q2) — failover means it may not
  // be the country-default. No succeeded attempt → we cannot refund safely.
  const owner = await resolveProviderFromSucceededAttempt(admin, id);
  if (!owner) return NextResponse.json({ error: "Cannot refund" }, { status: 409 });
  const adapter = createPaymentRouter().getAdapter(owner.provider);
  if (!adapter) return NextResponse.json({ error: "Cannot refund" }, { status: 409 });

  // Claim + record + wallet hold, ONE transaction. The DB is the over-refund,
  // one-in-flight, and never-negative truth; this route only narrates outcomes.
  const initiated = await callPaymentRpc<{
    initiated?: boolean;
    reason?: string;
    refund_id?: string;
    status?: string;
    amount_minor?: number;
    provider_refund_reference?: string | null;
    remaining_minor?: number;
    available_kobo?: number;
    wallet_hold?: boolean;
  }>("initiate_payment_refund", [
    id,
    refundKey,
    amountMinor != null ? String(amountMinor) : null,
    reason,
    user.id,
  ]);
  if (initiated.error || !initiated.data) {
    return NextResponse.json({ error: "Refund could not start" }, { status: 500 });
  }
  const init = initiated.data;

  let refundId: string;
  let refundAmountMinor: number;
  let adoptProviderReference: string | null = null;

  if (init.initiated === true) {
    refundId = init.refund_id as string;
    refundAmountMinor = init.amount_minor as number;
  } else if (init.reason === "duplicate") {
    // Same (intent, refundKey): idempotent replay. Terminal rows just report;
    // an in-flight row with NO provider reference is the crash window — adopt.
    if (init.status !== "processing") {
      return NextResponse.json(
        { intentId: id, refundId: init.refund_id, status: init.status },
        { status: 200 },
      );
    }
    if (init.provider_refund_reference) {
      return NextResponse.json(
        { intentId: id, refundId: init.refund_id, status: "refund_processing" },
        { status: 200 },
      );
    }
    refundId = init.refund_id as string;
    refundAmountMinor = init.amount_minor as number;
    if (!adapter.listRefunds) {
      return NextResponse.json({ error: "Refund attempt pending provider review" }, { status: 503 });
    }
    const listed = await adapter.listRefunds({ providerReference: owner.providerReference });
    if (!listed.ok) {
      // Never create a second real-money refund blind — refuse and retry later.
      return NextResponse.json({ error: "Refund attempt pending provider review" }, { status: 503 });
    }
    const match = listed.value.find(
      (r) =>
        (r.amountMinor === null || r.amountMinor === refundAmountMinor) &&
        ["pending", "processing", "processed"].includes(r.status),
    );
    if (match) adoptProviderReference = match.refundReference;
  } else {
    const failures: Record<string, { error: string; status: number }> = {
      intent_not_found: { error: "Not found", status: 404 },
      non_base_currency: { error: "Only NGN payments can be refunded", status: 409 },
      refund_in_flight: { error: "A refund is already in progress", status: 409 },
      not_refundable: { error: "Only succeeded payments can be refunded", status: 409 },
      no_charge_settlement: { error: "This payment predates the ledger and needs manual review", status: 409 },
      exceeds_refundable: { error: "Amount exceeds the refundable balance", status: 409 },
      wallet_balance_insufficient: {
        error: "Wallet balance is insufficient for this reversal — refund a smaller amount",
        status: 409,
      },
    };
    const mapped = failures[init.reason ?? ""] ?? { error: "Refund could not start", status: 500 };
    return NextResponse.json(
      {
        error: mapped.error,
        ...(init.remaining_minor !== undefined ? { remainingMinor: init.remaining_minor } : {}),
        ...(init.available_kobo !== undefined ? { availableKobo: init.available_kobo } : {}),
      },
      { status: mapped.status },
    );
  }

  emitPaymentEvent("henry.payment.refund.initiated", {
    actorId: user.id,
    payload: { provider: owner.provider, intentId: id, amountMinor: refundAmountMinor },
  });

  // Provider call (or adoption of an already-queued refund from a prior crash).
  let providerRefundReference: string;
  if (adoptProviderReference) {
    providerRefundReference = adoptProviderReference;
  } else {
    const refunded = await adapter.refund({
      providerReference: owner.providerReference,
      amountMinor: refundAmountMinor,
      reason,
    });
    if (!refunded.ok) {
      // Synchronous provider rejection — no refund.processed webhook will come.
      // Unwind atomically: row failed + wallet hold released + intent reverted.
      const failed = await callPaymentRpc<{ failed?: boolean }>("fail_payment_refund", [refundId]);
      if (failed.error) {
        // The unwind itself failed: the intent stays honestly in refund_processing
        // (nothing was lost; a retry of this route with the same refundKey will
        // adopt/repair). Flag loudly rather than pretend.
        emitPaymentEvent("henry.payment.refund.orphaned", {
          actorId: user.id,
          payload: { provider: owner.provider, intentId: id, reason: "sync_reject_unwind_failed" },
        });
        return NextResponse.json({ error: "Refund failed; state pending review" }, { status: 500 });
      }
      emitPaymentEvent("henry.payment.refund.failed", {
        actorId: user.id,
        payload: { provider: owner.provider, intentId: id, stage: "synchronous" },
      });
      return NextResponse.json({ error: "Refund failed" }, { status: 502 });
    }
    providerRefundReference = refunded.value.refundReference;
  }

  const referenced = await callPaymentRpc<{ updated?: boolean }>("set_refund_provider_reference", [
    refundId,
    providerRefundReference,
  ]);
  if (referenced.error) {
    // The provider refund IS queued; only our pointer write failed. The webhook
    // path resolves by the in-flight row, so money truth is unaffected — flag it.
    emitPaymentEvent("henry.payment.refund.orphaned", {
      actorId: user.id,
      payload: { provider: owner.provider, intentId: id, reason: "provider_reference_unrecorded" },
    });
  }

  // Q3: money has NOT moved yet — the provider queued the refund. The intent
  // stays refund_processing and becomes `refunded`/back-to-`succeeded` ONLY when
  // the provider's refund webhook confirms what actually happened.
  return NextResponse.json(
    { intentId: id, refundId, status: "refund_processing" },
    { status: 200 },
  );
}
