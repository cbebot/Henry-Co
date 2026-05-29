import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { requireSensitiveAction } from "@henryco/auth/server/sensitive-action-guard";
import { createPaymentRouter } from "@henryco/payment-router";

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
    .select("id, user_id, status, provider_reference, amount_minor")
    .eq("id", id)
    .single();
  const intentRow = intent.data as
    | { id: string; user_id: string; status: string; provider_reference: string | null; amount_minor: number }
    | null;
  if (intent.error || !intentRow || intentRow.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (intentRow.status !== "succeeded") {
    return NextResponse.json({ error: "Only succeeded payments can be refunded" }, { status: 409 }); // A2 client-side guard
  }

  const router = createPaymentRouter();
  // Refund executes against whichever adapter owns the reference; provider identity stays server-side.
  // V3-14/15/16 resolve the real adapter from provider_reference; in V3-13 only the mock adapter exists.
  const refundProvider = router.getAdapter("mock");
  const refunded = refundProvider
    ? await refundProvider.refund({ providerReference: intentRow.provider_reference ?? "", amountMinor: intentRow.amount_minor })
    : ({ ok: false } as const);
  if (!refunded.ok) {
    return NextResponse.json({ error: "Refund failed" }, { status: 502 });
  }

  const update = await admin
    .from("payment_intents")
    .update({ status: "refunded" } as never)
    .eq("id", id)
    .eq("status", "succeeded")
    .select("id, status")
    .maybeSingle();
  if (update.error) return NextResponse.json({ error: "Refund state update failed" }, { status: 409 });

  return NextResponse.json({ intentId: id, status: "refunded" }, { status: 200 });
}
