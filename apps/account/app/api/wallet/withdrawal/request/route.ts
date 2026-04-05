import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ensureAccountProfileRecords } from "@/lib/account-profile";
import { getWalletSummary } from "@/lib/account-data";
import { verifyWithdrawalPin } from "@/lib/wallet-pin";
import { USER_FACING_SAVE, logApiError } from "@/lib/user-facing-error";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureAccountProfileRecords(user);

    const body = await request.json();
    const amountNaira = Number(body.amountNaira ?? body.amount_naira ?? 0);
    const payoutMethodId = String(body.payoutMethodId || "").trim();
    const pin = String(body.pin || "");

    const amountKobo = Math.round(amountNaira * 100);
    if (!amountKobo || amountKobo < 10000) {
      return NextResponse.json({ error: "Minimum withdrawal is NGN 100." }, { status: 400 });
    }

    if (!payoutMethodId) {
      return NextResponse.json({ error: "Choose a verified payout account." }, { status: 400 });
    }

    const admin = createAdminSupabase();
    const { data: prefs } = await admin
      .from("customer_preferences")
      .select("withdrawal_pin_hash")
      .eq("user_id", user.id)
      .maybeSingle();

    const pinHash = (prefs as { withdrawal_pin_hash?: string } | null)?.withdrawal_pin_hash ?? null;
    if (!pinHash || !verifyWithdrawalPin(pin, pinHash)) {
      return NextResponse.json({ error: "Withdrawal PIN is required or incorrect." }, { status: 400 });
    }

    const { data: method, error: methodError } = await admin
      .from("customer_payout_methods")
      .select("id")
      .eq("id", payoutMethodId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (methodError || !method) {
      return NextResponse.json({ error: "That payout account is not available." }, { status: 400 });
    }

    const wallet = await getWalletSummary(user.id);
    const balance = Number((wallet as { balance_kobo?: number }).balance_kobo ?? 0);
    if (amountKobo > balance) {
      return NextResponse.json({ error: "Amount exceeds your available balance." }, { status: 400 });
    }

    const { data: row, error: insertError } = await admin
      .from("customer_wallet_withdrawal_requests")
      .insert({
        user_id: user.id,
        payout_method_id: payoutMethodId,
        amount_kobo: amountKobo,
        currency: "NGN",
        status: "pending_review",
        metadata: { requested_from: "account_wallet" },
      } as never)
      .select("id")
      .single();

    if (insertError || !row) {
      logApiError("wallet/withdrawal/request insert", insertError);
      return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
    }

    await admin.from("customer_notifications").insert({
      user_id: user.id,
      division: "wallet",
      title: "Withdrawal requested",
      body: `We received your withdrawal request for NGN ${amountNaira.toLocaleString()}. Finance will review and process it.`,
      category: "wallet",
      action_url: "/wallet/withdrawals",
    } as never);

    return NextResponse.json({ success: true, id: (row as { id: string }).id });
  } catch (error) {
    logApiError("wallet/withdrawal/request", error);
    return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
  }
}
