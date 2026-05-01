import { NextResponse } from "next/server";
import { publishNotification } from "@henryco/notifications";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ensureAccountProfileRecords } from "@/lib/account-profile";
import { getPendingWithdrawalHoldKobo, getWalletSummary, getWithdrawalRequests } from "@/lib/account-data";
import { requireVerification } from "@/lib/verification";
import { verifyWithdrawalPin } from "@/lib/wallet-pin";
import { USER_FACING_SAVE, logApiError } from "@/lib/user-facing-error";
import {
  buildLegacyWithdrawalRequestInsert,
  extractLegacyWithdrawalPinHash,
  isLegacyPayoutMethodRow,
  isMissingPostgrestResourceError,
  mapLegacyPayoutMethod,
} from "@/lib/wallet-storage";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureAccountProfileRecords(user);

    // KYC gate: withdrawals require verified identity.
    const verification = await requireVerification(user.id);
    if (!verification.allowed) {
      return NextResponse.json({ error: verification.reason }, { status: 403 });
    }

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
    const { data: prefs, error: prefsError } = await admin
      .from("customer_preferences")
      .select("withdrawal_pin_hash")
      .eq("user_id", user.id)
      .maybeSingle();

    let pinHash = (prefs as { withdrawal_pin_hash?: string } | null)?.withdrawal_pin_hash ?? null;
    if (prefsError && !isMissingPostgrestResourceError(prefsError)) {
      logApiError("wallet/withdrawal/request prefs", prefsError);
      return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
    }

    if (prefsError && isMissingPostgrestResourceError(prefsError)) {
      const { data: legacyRows, error: legacyError } = await admin
        .from("customer_payment_methods")
        .select("id, type, provider, provider_token")
        .eq("user_id", user.id);

      if (legacyError) {
        logApiError("wallet/withdrawal/request prefs legacy", legacyError);
        return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
      }

      pinHash = extractLegacyWithdrawalPinHash((legacyRows ?? []) as Array<Record<string, unknown>>);
    }

    if (!pinHash) {
      const { data: legacyRows, error: legacyError } = await admin
        .from("customer_payment_methods")
        .select("id, type, provider, provider_token")
        .eq("user_id", user.id);

      if (!legacyError) {
        pinHash = extractLegacyWithdrawalPinHash((legacyRows ?? []) as Array<Record<string, unknown>>);
      }
    }

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

    let payoutMethod =
      method && !methodError
        ? {
            id: String((method as { id: string }).id),
            account_name: null as string | null,
            bank_name: null as string | null,
            account_number: null as string | null,
            is_default: false,
          }
        : null;

    if ((!payoutMethod && !methodError) || (methodError && isMissingPostgrestResourceError(methodError))) {
      const { data: legacyMethods, error: legacyMethodError } = await admin
        .from("customer_payment_methods")
        .select("id, type, label, last_four, bank_name, is_default, provider, metadata")
        .eq("user_id", user.id)
        .eq("id", payoutMethodId)
        .maybeSingle();

      if (legacyMethodError) {
        logApiError("wallet/withdrawal/request payout legacy", legacyMethodError);
        return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
      }

      if (legacyMethods && isLegacyPayoutMethodRow(legacyMethods as Record<string, unknown>)) {
        payoutMethod = mapLegacyPayoutMethod(legacyMethods as Record<string, unknown>);
      }
    } else if (methodError) {
      logApiError("wallet/withdrawal/request payout", methodError);
      return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
    }

    if (!payoutMethod) {
      return NextResponse.json({ error: "That payout account is not available." }, { status: 400 });
    }

    const wallet = await getWalletSummary(user.id);
    const balance = Number((wallet as { balance_kobo?: number }).balance_kobo ?? 0);
    const existingRequests = await getWithdrawalRequests(user.id);
    const pendingHoldKobo = getPendingWithdrawalHoldKobo(existingRequests);
    const availableBalance = Math.max(0, balance - pendingHoldKobo);

    if (amountKobo > availableBalance) {
      return NextResponse.json(
        { error: "Amount exceeds your available balance after pending withdrawals." },
        { status: 400 }
      );
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

    if (insertError && isMissingPostgrestResourceError(insertError)) {
      const walletId = String((wallet as { id?: string | null }).id || "");
      if (!walletId) {
        return NextResponse.json({ error: "We couldn’t load your wallet. Please refresh and try again." }, { status: 400 });
      }

      const { data: legacyRow, error: legacyInsertError } = await admin
        .from("customer_wallet_transactions")
        .insert(
          buildLegacyWithdrawalRequestInsert({
            walletId,
            userId: user.id,
            amountKobo,
            balanceAfterKobo: balance,
            payoutMethodId,
            payoutMethodLabel: payoutMethod.account_name,
            payoutBankName: payoutMethod.bank_name,
            payoutLastFour: payoutMethod.account_number?.slice(-4) || null,
          }) as never
        )
        .select("id")
        .single();

      if (legacyInsertError || !legacyRow) {
        logApiError("wallet/withdrawal/request legacy insert", legacyInsertError);
        return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
      }

      await admin.from("customer_activity").insert({
        user_id: user.id,
        division: "wallet",
        activity_type: "wallet_withdrawal_requested",
        title: `Wallet withdrawal request — NGN ${amountNaira.toLocaleString()}`,
        description: "Finance will review this withdrawal request before payout.",
        amount_kobo: amountKobo,
        status: "pending_review",
        reference_type: "wallet_withdrawal_request",
        reference_id: String((legacyRow as { id: string }).id),
        action_url: "/wallet/withdrawals",
      } as never);

      await publishNotification({
        userId: user.id,
        division: "account",
        eventType: "wallet.transaction.update",
        severity: "info",
        title: "Withdrawal requested",
        body: `We received your withdrawal request for NGN ${amountNaira.toLocaleString()}. Finance will review and process it.`,
        deepLink: "/wallet/withdrawals",
        relatedType: "wallet_withdrawal_request",
        publisher: "bridge:apps/account/app/api/wallet/withdrawal/request",
      });

      return NextResponse.json({ success: true, id: String((legacyRow as { id: string }).id) });
    }

    if (insertError || !row) {
      logApiError("wallet/withdrawal/request insert", insertError);
      return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
    }

    await admin.from("customer_activity").insert({
      user_id: user.id,
      division: "wallet",
      activity_type: "wallet_withdrawal_requested",
      title: `Wallet withdrawal request — NGN ${amountNaira.toLocaleString()}`,
      description: "Finance will review this withdrawal request before payout.",
      amount_kobo: amountKobo,
      status: "pending_review",
      reference_type: "wallet_withdrawal_request",
      reference_id: String((row as { id: string }).id),
      action_url: "/wallet/withdrawals",
    } as never);

    await publishNotification({
      userId: user.id,
      division: "account",
      eventType: "wallet.transaction.update",
      severity: "info",
      title: "Withdrawal requested",
      body: `We received your withdrawal request for NGN ${amountNaira.toLocaleString()}. Finance will review and process it.`,
      deepLink: "/wallet/withdrawals",
      relatedType: "wallet_withdrawal_request",
      publisher: "bridge:apps/account/app/api/wallet/withdrawal/request",
    });

    return NextResponse.json({ success: true, id: (row as { id: string }).id });
  } catch (error) {
    logApiError("wallet/withdrawal/request", error);
    return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
  }
}
