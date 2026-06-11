import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase";
import { createPaymentRouter } from "@henryco/payment-router";
import type { PaymentProviderKey } from "@henryco/payment-router/types";
import { emitPaymentEvent, intentEventForStatus } from "@/lib/payments/telemetry";
import { callPaymentRpc } from "@/lib/payments/db";

export const runtime = "nodejs";

const WEBHOOK_SECRET_ENV: Record<string, string> = {
  mock: "MOCK_PAYMENT_WEBHOOK_SECRET",
  stripe: "STRIPE_WEBHOOK_SECRET", // wired in V3-14
  paystack: "PAYSTACK_SECRET_KEY", // secret-key HMAC, V3-15
  flutterwave: "FLW_SECRET_HASH", // V3-16
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const secretEnv = WEBHOOK_SECRET_ENV[provider];
  if (!secretEnv) return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  const secret = process.env[secretEnv];
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });

  // G1: HMAC is over the RAW bytes — read as text BEFORE any parse. A
  // re-serialized body would change the digest.
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? request.headers.get("x-signature");

  emitPaymentEvent("henry.payment.webhook.received", { payload: { provider } });

  // The live adapter for this provider owns its signature scheme. Absent (not
  // activated in this env) → 501; we never fall back to a different verifier.
  const adapter = createPaymentRouter().getAdapter(provider as PaymentProviderKey);
  if (!adapter) return NextResponse.json({ error: "Provider not yet activated" }, { status: 501 });

  const verified = await adapter.verifyWebhook({ rawBody, signature, secret });
  if (!verified.ok) {
    // G1 fail-closed: missing OR mismatched signature → 401, never 200/400.
    emitPaymentEvent("henry.payment.webhook.rejected", { payload: { provider } });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  emitPaymentEvent("henry.payment.webhook.verified", {
    payload: { provider, eventType: verified.value.eventType },
  });

  if (!verified.value.impliedStatus && !verified.value.refundEvent) {
    return NextResponse.json({ received: true }, { status: 200 }); // informational event
  }

  const admin = createAdminSupabase();
  // Resolve the intent by provider_reference (recorded server-side at route time).
  const intent = await admin
    .from("payment_intents")
    .select("id")
    .eq("provider_reference", verified.value.providerReference)
    .single();
  const intentRow = intent.data as { id: string } | null;
  if (intent.error || !intentRow) {
    return NextResponse.json({ received: true }, { status: 200 }); // unknown reference — ack, do not leak
  }

  // V3-19: refund OUTCOME events flow through apply_refund_webhook — it resolves
  // the intent's single in-flight refund row, dedups against the ROW (the payload
  // carries no refund id), posts the reversing entries in the same transaction,
  // and decides the intent's terminal status from cumulative refund truth.
  if (verified.value.refundEvent) {
    const refundEvent = verified.value.refundEvent;
    const applied = await callPaymentRpc<{
      applied?: boolean;
      reason?: string;
      refund_id?: string;
      intent_status?: string;
    }>("apply_refund_webhook", [
      provider,
      intentRow.id,
      refundEvent.outcome,
      refundEvent.amountMinor != null ? String(refundEvent.amountMinor) : null,
      refundEvent.refundReference,
    ]);
    if (applied.error) {
      // 500 → the provider redelivers; the RPC is idempotent so a retry is safe.
      return NextResponse.json({ error: "Apply failed" }, { status: 500 });
    }
    const result = applied.data;
    if (result?.applied === true) {
      // Money truth emitted exactly once — only the delivery that applied.
      emitPaymentEvent(
        refundEvent.outcome === "processed" ? "henry.payment.refund.processed" : "henry.payment.refund.failed",
        { payload: { provider, intentStatus: result.intent_status } },
      );
      if (result.intent_status === "refunded") {
        emitPaymentEvent("henry.payment.intent.refunded", { payload: { provider } });
      }
      return NextResponse.json({ received: true }, { status: 200 });
    }
    if (result?.reason === "no_refund_in_flight") {
      // A provider refund we have no record of (e.g. initiated on the provider's
      // dashboard). Retrying cannot help — ack, but flag LOUDLY for finance:
      // money moved at the provider and the books must be reconciled by a human.
      emitPaymentEvent("henry.payment.refund.orphaned", { payload: { provider, intentId: intentRow.id } });
      return NextResponse.json({ received: true }, { status: 200 });
    }
    if (result?.reason === "amount_mismatch") {
      // Should be impossible (we refund exactly what we asked). Never guess —
      // 500 keeps the provider retrying while a human investigates the flag.
      emitPaymentEvent("henry.payment.refund.orphaned", {
        payload: { provider, intentId: intentRow.id, reason: "amount_mismatch" },
      });
      return NextResponse.json({ error: "Refund amount mismatch" }, { status: 500 });
    }
    // duplicate (idempotent redelivery) and other no-op reasons: plain ack.
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // A3/D3: the ONLY money-confirming status writer — dedup-insert first, then the
  // A2-guarded transition, atomically. A duplicate delivery is an idempotent ack.
  // payments_private (V3-15-S3): money writer reached via the pooled direct-pg path,
  // NOT PostgREST (the function is not in an exposed schema).
  // V3-VAT-01: thread the REAL processor fee (+ any provider-reported fee VAT) so the
  // settlement posts the fee split. Often null on the async webhook (Paystack omits
  // `fees` here) — the finalize/verify path is the reliable source; null → the ledger
  // degrades to gross-to-cash rather than fabricate a fee.
  const applied = await callPaymentRpc<{ applied?: boolean }>("apply_payment_webhook", [
    provider,
    verified.value.providerEventId,
    intentRow.id,
    verified.value.impliedStatus,
    verified.value.feeMinor != null ? String(verified.value.feeMinor) : null,
    verified.value.feeVatMinor != null ? String(verified.value.feeVatMinor) : null,
  ]);
  if (applied.error) {
    return NextResponse.json({ error: "Apply failed" }, { status: 500 });
  }
  // Money truth emitted exactly once — only the delivery that actually applied
  // (not a deduped redelivery) fires intent.succeeded/failed/refunded.
  if ((applied.data as { applied?: boolean } | null)?.applied === true) {
    emitPaymentEvent(intentEventForStatus(verified.value.impliedStatus), { payload: { provider } });
  }
  return NextResponse.json({ received: true }, { status: 200 });
}
