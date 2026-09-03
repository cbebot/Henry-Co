import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { reconcileWalletTopupsForUser } from "@/lib/wallet-topup-port";

export const runtime = "nodejs";

/**
 * V3-15-JOB-B — reconcile the buyer's wallet top-ups and report the balance.
 *
 * Called when the buyer returns from hosted checkout (and pollable for a few
 * seconds while the confirming webhook lands). Idempotent: a confirmed charge
 * credits exactly once; an unconfirmed one is reported as still pending. No
 * payment_intents status is ever written here (D3) — this only projects the
 * already-confirmed money truth onto the wallet ledger.
 */
export async function POST() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let credited = { creditedKobo: 0, creditedCount: 0 };
  try {
    credited = await reconcileWalletTopupsForUser(user.id);
  } catch {
    return NextResponse.json({ error: "We couldn't refresh your wallet just now." }, { status: 500 });
  }

  const admin = createAdminSupabase();
  const wallet = await admin
    .from("customer_wallets")
    .select("balance_kobo")
    .eq("user_id", user.id)
    .maybeSingle();
  const balanceKobo = Number((wallet.data as { balance_kobo?: number } | null)?.balance_kobo ?? 0);

  return NextResponse.json(
    {
      ok: true,
      balanceKobo,
      creditedKobo: credited.creditedKobo,
      creditedCount: credited.creditedCount,
    },
    { status: 200 },
  );
}
