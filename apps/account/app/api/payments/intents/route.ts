import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { requireSensitiveAction } from "@henryco/auth/server/sensitive-action-guard";
import { getAccountUrl } from "@henryco/config";
import { createPaymentRouter, buildRouterAuditInput } from "@henryco/payment-router";
import {
  validateAmountMinor,
  normalizeCurrency,
  type PaymentMethod,
  type PaymentProviderKey,
} from "@henryco/payment-router/types";
import { writeAuditLog } from "@henryco/observability/audit-log";
import { emitPaymentEvent } from "@/lib/payments/telemetry";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // R1: starting a payment is a sensitive action — require a fresh reauth.
  const guard = await requireSensitiveAction(request, {
    action: "payment.intent.create",
    entityType: "payment_intent",
    resolveUser: async () => user,
    userId: (u) => u.id,
  });
  if (!guard.ok) return guard.response;

  const body = (await request.json().catch(() => null)) as {
    amountMinor?: number; currency?: string; country?: string;
    method?: PaymentMethod; idempotencyKey?: string; division?: string;
  } | null;
  if (!body?.idempotencyKey || !body.country || !body.method) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const amount = validateAmountMinor(body.amountMinor ?? NaN);
  if (!amount.ok) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  const currency = normalizeCurrency(body.currency ?? "");
  if (!currency.ok) return NextResponse.json({ error: "Unsupported currency" }, { status: 400 }); // A4: never fall back to NGN

  const admin = createAdminSupabase();

  // A1: idempotent create — UNIQUE(user_id, idempotency_key). On 23505, SELECT and return the existing row.
  const insert = await admin
    .from("payment_intents")
    .insert({
      user_id: user.id, amount_minor: amount.value, currency: currency.value,
      country: body.country, method: body.method, idempotency_key: body.idempotencyKey,
      division: body.division ?? null,
    } as never)
    .select("id, status")
    .single();

  let intentId: string;
  let status: string;
  let wasFreshInsert = false;
  if (insert.error) {
    if (insert.error.code === "23505") {
      const existing = await admin
        .from("payment_intents")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("idempotency_key", body.idempotencyKey)
        .single();
      const existingRow = existing.data as { id: string; status: string } | null;
      if (existing.error || !existingRow) {
        return NextResponse.json({ error: "Conflict" }, { status: 409 });
      }
      intentId = existingRow.id; status = existingRow.status;
    } else {
      return NextResponse.json({ error: "Failed to create intent" }, { status: 500 });
    }
  } else {
    const row = insert.data as { id: string; status: string };
    intentId = row.id; status = row.status; wasFreshInsert = true;
  }

  // Replay of an intent that already moved past pending: nothing to (re)start.
  // Return current truth with no client action (re-initializing a charge that
  // already succeeded/failed at the provider would be a double-charge hazard).
  if (status !== "pending") {
    return NextResponse.json({ intentId, status, clientAction: { type: "none" } }, { status: 200 });
  }

  // Capture the failover trail + winner via hooks — the ONLY place provider
  // identity surfaces (route() returns a provider-agnostic result, Principle 9).
  let winningProvider: PaymentProviderKey | null = null;
  const failedOver: Array<{ provider: PaymentProviderKey; code: string }> = [];
  const router = createPaymentRouter({
    hooks: {
      onProviderSucceeded: (key) => { winningProvider = key; },
      onProviderFailover: (from, code) => { failedOver.push({ provider: from, code }); },
    },
    // G7: config-driven return URL (env-aware account origin, base-domain-migration
    // safe) — injected so the package never hardcodes a host or reads a phantom env.
    callbackUrl: getAccountUrl("/payments/callback"),
  });
  const t0 = Date.now();
  const routed = await router.route({
    intentId, amountMinor: amount.value, currency: currency.value,
    country: body.country, method: body.method, idempotencyKey: body.idempotencyKey,
    customerEmail: user.email ?? undefined, // Paystack opens no charge without it
  });
  const latencyMs = Date.now() - t0;

  // G4: server-side audit trail of the routing decision (provider, outcome,
  // latency) for reconciliation. The selected provider is recorded HERE (server
  // side) — Principle 9 governs the client response, not the internal audit log.
  // Best-effort: writeAuditLog swallows its own errors and never blocks the buyer.
  const outcome = routed.ok
    ? "started"
    : routed.error.kind === "no_suitable_provider" ? "blocked" : "failed";
  await writeAuditLog(admin as unknown as Parameters<typeof writeAuditLog>[0], buildRouterAuditInput({
    intentId, country: body.country, currency: currency.value, method: body.method,
    selectedProvider: routed.ok ? winningProvider : null,
    outcome, latencyMs, division: body.division ?? null,
  }));

  if (!routed.ok) {
    if (routed.error.kind === "no_suitable_provider") {
      // A5: manual fallback — client gets a generic actionable error, never a provider name.
      emitPaymentEvent("henry.payment.no_suitable_provider", {
        actorId: user.id,
        payload: { country: body.country, currency: currency.value, method: body.method },
      });
      return NextResponse.json({ error: "No payment method available for your region", code: "manual_fallback" }, { status: 422 });
    }
    return NextResponse.json({ error: "Payment could not be started" }, { status: 502 });
  }

  // Q2/G4: record routing attempts (each failover 'failed' + the winner
  // 'succeeded' with its reference) ONCE, on the fresh create. This single
  // succeeded row is the refund/finalize provider source and the reconciliation
  // anchor; replays skip it so the anchor never duplicates.
  if (wasFreshInsert) {
    const attempts: Array<Record<string, unknown>> = failedOver.map((f) => ({
      intent_id: intentId, provider: f.provider, status: "failed", error_code: f.code,
    }));
    if (winningProvider) {
      attempts.push({
        intent_id: intentId, provider: winningProvider,
        provider_reference: routed.value.providerReference, status: "succeeded",
      });
    }
    if (attempts.length > 0) {
      await admin.from("payment_attempts").insert(attempts as never);
    }
    emitPaymentEvent("henry.payment.intent.created", {
      actorId: user.id,
      payload: {
        provider: winningProvider, country: body.country,
        currency: currency.value, method: body.method, amountMinor: amount.value,
      },
    });
  }

  // Persist provider_reference SERVER-SIDE (NOT a status write — D3 unaffected);
  // OMIT it + any provider identity from the client response (Principle 9).
  await admin
    .from("payment_intents")
    .update({ provider_reference: routed.value.providerReference } as never)
    .eq("id", intentId);

  return NextResponse.json({
    intentId,
    status, // 'pending' — the buyer must still complete clientAction
    clientAction: routed.value.clientAction, // opaque; no provider name
  }, { status: 200 });
}
