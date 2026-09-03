import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { ensureAccountProfileRecords } from "@/lib/account-profile";
import {
  RAIL_TOPUP_METHODS,
  TOPUP_FUNDING_STATUS,
  WALLET_FUNDING_MIN_NAIRA,
  validateFundingAmountKobo,
  type RailTopupMethod,
} from "@/lib/wallet-topup";

export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isRailMethod(value: unknown): value is RailTopupMethod {
  return typeof value === "string" && (RAIL_TOPUP_METHODS as readonly string[]).includes(value);
}

/**
 * V3-15-JOB-B — create (or return) the durable funding record for an instant
 * card/bank/USSD wallet top-up, BEFORE the buyer is sent to the proven payment
 * rail (`POST /api/payments/intents`).
 *
 * The client generates ONE idempotency UUID and passes it here AND to the rail:
 *   - here it becomes `payment_reference` (globally UNIQUE) → a double-submit
 *     yields exactly ONE funding request (23505 → return existing);
 *   - at the rail it becomes the intent `idempotency_key` (A1) → exactly ONE intent.
 * The reconciler later joins the two on that shared value.
 *
 * This route only records intent to top up; it never starts a charge and never
 * writes any payment_intents status (D3). The charge itself is started by the
 * proven rail, which enforces the sensitive-action reauth (R1).
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    amountKobo?: number;
    method?: string;
    idempotencyKey?: string;
  } | null;

  if (!body?.idempotencyKey || !UUID_RE.test(body.idempotencyKey)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!isRailMethod(body.method)) {
    return NextResponse.json({ error: "Choose a payment method." }, { status: 400 });
  }
  // Single shared floor; NO upper bound (owner decision — R1 reauth on the
  // payment rail + provider limits are the guardrails, not a hardcoded ceiling).
  const amountKobo = Number(body.amountKobo);
  if (validateFundingAmountKobo(amountKobo) !== null) {
    return NextResponse.json(
      { error: `Enter at least NGN ${WALLET_FUNDING_MIN_NAIRA.toLocaleString("en-NG")} to top up.` },
      { status: 400 },
    );
  }

  await ensureAccountProfileRecords(user);
  const admin = createAdminSupabase();

  const insert = await admin
    .from("customer_wallet_funding_requests")
    .insert({
      user_id: user.id,
      provider: body.method,
      amount_kobo: amountKobo,
      currency: "NGN",
      status: TOPUP_FUNDING_STATUS.pending,
      payment_reference: body.idempotencyKey, // shared UUID — the reconcile join anchor
      source_division: "account",
      metadata: { rail_topup: true, method: body.method },
    } as never)
    .select("id")
    .single();

  if (!insert.error && insert.data) {
    return NextResponse.json(
      { fundingRequestId: String((insert.data as { id: string }).id), returnTo: "/wallet" },
      { status: 200 },
    );
  }

  // A1-equivalent at the wallet layer: a double-submit hits the UNIQUE
  // payment_reference constraint — return the existing request, never a second.
  if (insert.error?.code === "23505") {
    const existing = await admin
      .from("customer_wallet_funding_requests")
      .select("id, user_id")
      .eq("payment_reference", body.idempotencyKey)
      .maybeSingle();
    const row = existing.data as { id: string; user_id: string } | null;
    if (row && row.user_id === user.id) {
      return NextResponse.json({ fundingRequestId: String(row.id), returnTo: "/wallet" }, { status: 200 });
    }
    return NextResponse.json({ error: "Conflict" }, { status: 409 });
  }

  return NextResponse.json({ error: "We couldn't start your top-up. Please try again." }, { status: 500 });
}
