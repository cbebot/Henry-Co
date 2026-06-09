import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { createPaymentRouter } from "@henryco/payment-router";
import { resolveProviderFromSucceededAttempt } from "@/lib/payments/server";
import { emitPaymentEvent, intentEventForStatus } from "@/lib/payments/telemetry";
import { callPaymentRpc } from "@/lib/payments/db";

export const runtime = "nodejs";

// The Paystack callback return: the buyer is back from hosted checkout. We read
// the provider's authoritative charge state (transaction/verify) rather than
// trusting the client, and confirm it through the SAME deduped RPC the async
// webhook uses — so finalize and a later charge.success can't double-apply (G2).
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabase();
  const intent = await admin.from("payment_intents").select("id, user_id, status").eq("id", id).single();
  const intentRow = intent.data as { id: string; user_id: string; status: string } | null;
  if (intent.error || !intentRow || intentRow.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Resolve the provider that actually charged this intent (Q2). No succeeded
  // attempt → routing never completed; there is nothing to finalize.
  const owner = await resolveProviderFromSucceededAttempt(admin, id);
  if (!owner) return NextResponse.json({ error: "Cannot finalize" }, { status: 409 });

  // Best-effort visible advance pending → processing (D3: via the guarded RPC,
  // never a raw UPDATE). Not gated — the provider verify below is the truth.
  await callPaymentRpc("advance_payment_intent", [id, "pending", "processing"]);

  const adapter = createPaymentRouter().getAdapter(owner.provider);
  const verified = await adapter?.finalize?.({ providerReference: owner.providerReference });

  // Still pending at the provider (or no synchronous finalize): leave at
  // processing; the async webhook will confirm the terminal status later.
  if (!verified?.ok || !verified.value.impliedStatus) {
    return NextResponse.json({ intentId: id, status: "processing" }, { status: 200 });
  }

  const terminal = verified.value.impliedStatus;
  // D3: the ONLY status writer for money-confirming edges. Deduped by the shared
  // reference key, so whichever of finalize / webhook lands first wins exactly once.
  // V3-VAT-01: the verify call is the RELIABLE fee source — Paystack returns the real
  // `data.fees` here. Thread it (+ any provider-reported fee VAT) so the settlement
  // posts the fee split (processor fee expense + recoverable input VAT) against the net.
  const applied = await callPaymentRpc<{ applied?: boolean }>("apply_payment_webhook", [
    owner.provider,
    verified.value.providerEventId,
    id,
    terminal,
    verified.value.feeMinor != null ? String(verified.value.feeMinor) : null,
    verified.value.feeVatMinor != null ? String(verified.value.feeVatMinor) : null,
  ]);
  if (applied.error) return NextResponse.json({ error: "Apply failed" }, { status: 500 });
  if ((applied.data as { applied?: boolean } | null)?.applied === true) {
    emitPaymentEvent(intentEventForStatus(terminal), { actorId: user.id, payload: { provider: owner.provider } });
  }

  return NextResponse.json({ intentId: id, status: terminal }, { status: 200 });
}
