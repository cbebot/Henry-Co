import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { requireSensitiveAction } from "@henryco/auth/server/sensitive-action-guard";
import { createPaymentRouter } from "@henryco/payment-router";
import { resolveProviderFromSucceededAttempt } from "@/lib/payments/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guard = await requireSensitiveAction(request, {
    action: "payment.refund", // R1: refund is sensitive
    entityType: "payment_intent",
    entityId: id,
    resolveUser: async () => user,
    userId: (u) => u.id,
  });
  if (!guard.ok) return guard.response;

  const admin = createAdminSupabase();
  const intent = await admin
    .from("payment_intents")
    .select("id, user_id, status, amount_minor")
    .eq("id", id)
    .single();
  const intentRow = intent.data as
    | { id: string; user_id: string; status: string; amount_minor: number }
    | null;
  if (intent.error || !intentRow || intentRow.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (intentRow.status !== "succeeded") {
    return NextResponse.json({ error: "Only succeeded payments can be refunded" }, { status: 409 }); // A2 client-side guard
  }

  // Resolve the provider that holds the money (Q2) — failover means it may not
  // be the country-default. No succeeded attempt → we cannot refund safely.
  const owner = await resolveProviderFromSucceededAttempt(admin, id);
  if (!owner) return NextResponse.json({ error: "Cannot refund" }, { status: 409 });

  // Q1 mutex: succeeded → refund_processing via the guarded RPC (D3, never a raw
  // UPDATE). Exactly one concurrent caller sees advanced=true; the loser 409s.
  // This claims the refund BEFORE calling the provider, so two requests can't
  // both issue a refund.
  const advance = await admin.rpc("advance_payment_intent", {
    p_intent_id: id, p_from: "succeeded", p_to: "refund_processing",
  });
  if (advance.error) return NextResponse.json({ error: "Refund could not start" }, { status: 500 });
  if ((advance.data as { advanced?: boolean } | null)?.advanced !== true) {
    return NextResponse.json({ error: "Refund already in progress" }, { status: 409 });
  }

  // Refund executes against whichever adapter owns the reference; provider
  // identity stays server-side (Principle 9).
  const adapter = createPaymentRouter().getAdapter(owner.provider);
  const refunded = adapter
    ? await adapter.refund({ providerReference: owner.providerReference, amountMinor: intentRow.amount_minor })
    : ({ ok: false } as const);
  if (!refunded.ok) {
    // Synchronous provider rejection — no refund.processed webhook will arrive,
    // so revert the optimistic claim (refund_processing → succeeded). The money
    // never left; the intent returns to a refundable state.
    await admin.rpc("advance_payment_intent", {
      p_intent_id: id, p_from: "refund_processing", p_to: "succeeded",
    });
    return NextResponse.json({ error: "Refund failed" }, { status: 502 });
  }

  // Q3: money has NOT moved yet — Paystack queued the refund. The intent stays
  // refund_processing and becomes 'refunded' ONLY when the refund.processed
  // webhook confirms the money actually moved. 'refunded' always means confirmed.
  return NextResponse.json({ intentId: id, status: "refund_processing" }, { status: 200 });
}
