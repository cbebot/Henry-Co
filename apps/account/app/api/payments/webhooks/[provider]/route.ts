import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase";
import { MockProvider } from "@henryco/payment-router";

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

  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") ?? request.headers.get("x-paystack-signature");

  // Only the mock adapter exists in V3-13; real adapters land in V3-14/15/16.
  if (provider !== "mock") {
    return NextResponse.json({ error: "Provider not yet activated" }, { status: 501 });
  }
  const adapter = new MockProvider();
  const verified = await adapter.verifyWebhook({ rawBody, signature, secret });
  if (!verified.ok) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 }); // henry.payment.webhook.rejected
  }
  if (!verified.value.impliedStatus) {
    return NextResponse.json({ received: true }, { status: 200 }); // no-op event
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

  // A3: dedup-insert first, effect second — atomic in the RPC. A duplicate delivery is an idempotent ack.
  const applied = await admin.rpc("apply_payment_webhook", {
    p_provider: provider,
    p_provider_event_id: verified.value.providerEventId,
    p_intent_id: intentRow.id,
    p_new_status: verified.value.impliedStatus,
  });
  if (applied.error) {
    return NextResponse.json({ error: "Apply failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true }, { status: 200 });
}
