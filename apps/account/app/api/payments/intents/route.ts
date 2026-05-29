import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { requireSensitiveAction } from "@henryco/auth/server/sensitive-action-guard";
import { createPaymentRouter } from "@henryco/payment-router";
import { validateAmountMinor, normalizeCurrency, type PaymentMethod } from "@henryco/payment-router/types";

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
    intentId = row.id; status = row.status;
  }

  const router = createPaymentRouter();
  const routed = await router.route({
    intentId, amountMinor: amount.value, currency: currency.value,
    country: body.country, method: body.method, idempotencyKey: body.idempotencyKey,
  });
  if (!routed.ok) {
    if (routed.error.kind === "no_suitable_provider") {
      // A5: manual fallback — client gets a generic actionable error, never a provider name.
      return NextResponse.json({ error: "No payment method available for your region", code: "manual_fallback" }, { status: 422 });
    }
    return NextResponse.json({ error: "Payment could not be started" }, { status: 502 });
  }

  // Persist provider_reference SERVER-SIDE; OMIT it + any provider identity from the client response (Principle 9).
  await admin
    .from("payment_intents")
    .update({ provider_reference: routed.value.providerReference } as never)
    .eq("id", intentId);

  return NextResponse.json({
    intentId,
    status,
    clientAction: routed.value.clientAction, // opaque; no provider name
  }, { status: 200 });
}
