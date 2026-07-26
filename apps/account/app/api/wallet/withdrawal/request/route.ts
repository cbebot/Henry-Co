import { NextResponse } from "next/server";
import { normalizeAppLocaleSafe } from "@henryco/email";
import { publishNotification } from "@henryco/notifications";
import { evaluateWithdrawal, DEFAULT_WITHDRAWAL_LIMITS } from "@henryco/payment-router";
import { requireSensitiveAction } from "@henryco/auth/server/sensitive-action-guard";
import { createAdminSupabase } from "@/lib/supabase";
import { sendAccountEmail } from "@/lib/email/send";
import { withdrawalRequestedEmail } from "@/lib/email/templates";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ensureAccountProfileRecords } from "@/lib/account-profile";
import { getPendingWithdrawalHoldKobo, getWalletSummary, getWithdrawalRequests } from "@/lib/account-data";
import { requireVerification } from "@/lib/verification";
import { verifyWithdrawalPin } from "@/lib/wallet-pin";
import { USER_FACING_SAVE, logApiError } from "@/lib/user-facing-error";
import { getWindowWithdrawnKobo, isWalletAutoPayoutEnabled, startAutomaticPayout } from "@/lib/wallet-payout";
import {
  buildLegacyWithdrawalRequestInsert,
  extractLegacyWithdrawalPinHash,
  isLegacyPayoutMethodRow,
  isMissingPostgrestResourceError,
  isPendingWithdrawalStatus,
  mapLegacyPayoutMethod,
} from "@/lib/wallet-storage";

/**
 * EMAIL-TPL-01 — withdrawal-requested acknowledgement, dispatched AFTER the
 * request row + activity log are committed. Best-effort by construction: any
 * failure here is swallowed — an email problem must never fail a money
 * request. Mirrors the wallet.funded webhook's preference gate
 * (email_transactional !== false) and locale resolution.
 */
async function sendWithdrawalRequestedEmailBestEffort(
  admin: ReturnType<typeof createAdminSupabase>,
  userId: string,
  amountNaira: number,
) {
  try {
    const [{ data: profile }, { data: prefs }] = await Promise.all([
      admin
        .from("customer_profiles")
        .select("full_name, email, language")
        .eq("id", userId)
        .maybeSingle(),
      admin
        .from("customer_preferences")
        .select("email_transactional")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    const email = (profile as { email?: string | null } | null)?.email;
    const emailTransactional =
      (prefs as { email_transactional?: boolean | null } | null)?.email_transactional !== false;
    if (!email || !emailTransactional) return;
    const name = (profile as { full_name?: string | null } | null)?.full_name || "";
    const locale = normalizeAppLocaleSafe(
      (profile as { language?: string | null } | null)?.language,
    );
    await sendAccountEmail(email, withdrawalRequestedEmail(name, amountNaira, locale));
  } catch {
    // best-effort — never let an email failure surface into the money path
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // V3-02 S4: withdrawals are sensitive actions — require a
    // fresh re-credential within the 5-minute window before any
    // funds movement is initiated. The guard emits the audit
    // log entry on success + rate-limits 5 reauths per 5 min.
    const guard = await requireSensitiveAction(request, {
      action: "wallet.withdrawal.request",
      entityType: "wallet_withdrawal",
      resolveUser: async () => user,
      userId: (u) => u.id,
    });
    if (!guard.ok) return guard.response;

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

    // Track WHERE the method row lives: customer_wallet_withdrawal_requests.payout_method_id is
    // an FK to the MODERN customer_payout_methods table, so a legacy id must never be written
    // there (it 500s on the FK). A legacy method rides in metadata instead.
    let methodIsModern = Boolean(method && !methodError);
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
        methodIsModern = false;
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

    // One withdrawal at a time: a second request while one is pending or in flight is almost
    // always a double-submit (and the daily-cap window is check-then-insert, so concurrency
    // could stack past it). One-at-a-time closes both; the next request opens when this one
    // settles or is released.
    const hasInFlight = existingRequests.some((request) => {
      const status = String((request as { status?: string }).status || "").toLowerCase();
      return isPendingWithdrawalStatus(status) || status === "processing";
    });
    if (hasInFlight) {
      return NextResponse.json(
        { error: "You already have a withdrawal in progress. It completes before a new one starts." },
        { status: 400 }
      );
    }

    if (amountKobo > availableBalance) {
      return NextResponse.json(
        { error: "Amount exceeds your available balance after pending withdrawals." },
        { status: 400 }
      );
    }

    // V3-MONEY-PAYOUT policy gate (owner-approved limits): KYC-tiered, per-currency, fail-closed.
    // requireVerification above already passed, so this account is the "verified" tier; the rolling
    // 24h window counts pending + in-flight + paid (a released failure returned the money).
    const dailyCapKobo = DEFAULT_WITHDRAWAL_LIMITS.NGN?.verified?.dailyCapMinor ?? 0;
    const windowWithdrawnMinor = await getWindowWithdrawnKobo(admin, user.id, dailyCapKobo);
    const policy = evaluateWithdrawal({
      amountMinor: amountKobo,
      currency: "NGN",
      kycTier: "verified",
      windowWithdrawnMinor,
    });
    if (!policy.ok) {
      const message =
        policy.reason === "above_max_single"
          ? "That amount is above the single-withdrawal limit. Split it into smaller withdrawals."
          : policy.reason === "daily_cap_exceeded"
            ? "You have reached the daily withdrawal limit. Please try again tomorrow."
            : policy.reason === "below_min"
              ? "Minimum withdrawal is NGN 100."
              : "Withdrawals are not available for this account yet.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { data: row, error: insertError } = await admin
      .from("customer_wallet_withdrawal_requests")
      .insert({
        user_id: user.id,
        // The FK targets the MODERN payout-methods table only; a legacy method id would violate
        // it (a 500). Legacy methods ride in metadata and stay on the manual review flow.
        payout_method_id: methodIsModern ? payoutMethodId : null,
        amount_kobo: amountKobo,
        currency: "NGN",
        status: "pending_review",
        metadata: methodIsModern
          ? { requested_from: "account_wallet" }
          : { requested_from: "account_wallet", legacy_payout_method_id: payoutMethodId },
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

      await sendWithdrawalRequestedEmailBestEffort(admin, user.id, amountNaira);

      return NextResponse.json({ success: true, id: String((legacyRow as { id: string }).id) });
    }

    if (insertError || !row) {
      logApiError("wallet/withdrawal/request insert", insertError);
      return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
    }

    // V3-MONEY-PAYOUT (flag-dark): run the automatic payout — reserve the balance, resolve the
    // bank account, create the Flutterwave transfer. "manual" falls through to today's review
    // flow untouched; "rejected" already closed the request (nothing held, or safely released).
    // The transfer webhook (settle/release) is the money truth — nothing here marks it paid.
    let autoMode: "auto" | "manual" = "manual";
    let autoConfirmed = false;
    if (isWalletAutoPayoutEnabled()) {
      const auto = await startAutomaticPayout({
        admin,
        requestId: String((row as { id: string }).id),
        userId: user.id,
        amountKobo,
      });
      if (auto.mode === "rejected") {
        return NextResponse.json({ error: auto.error }, { status: 400 });
      }
      autoMode = auto.mode;
      autoConfirmed = auto.mode === "auto" && auto.confirmed;
    }
    const isAuto = autoMode === "auto";

    await admin.from("customer_activity").insert({
      user_id: user.id,
      division: "wallet",
      activity_type: "wallet_withdrawal_requested",
      title: `Wallet withdrawal request — NGN ${amountNaira.toLocaleString()}`,
      description: isAuto
        ? autoConfirmed
          ? "Your payout has started. It is confirmed automatically once the bank transfer completes."
          : "Your payout is being processed. We will confirm it shortly."
        : "Finance will review this withdrawal request before payout.",
      amount_kobo: amountKobo,
      status: isAuto ? "processing" : "pending_review",
      reference_type: "wallet_withdrawal_request",
      reference_id: String((row as { id: string }).id),
      action_url: "/wallet/withdrawals",
    } as never);

    await publishNotification({
      userId: user.id,
      division: "account",
      eventType: "wallet.transaction.update",
      severity: "info",
      title: isAuto ? (autoConfirmed ? "Withdrawal on its way" : "Withdrawal processing") : "Withdrawal requested",
      body: isAuto
        ? autoConfirmed
          ? `Your withdrawal of NGN ${amountNaira.toLocaleString()} is on its way to your bank. We will confirm the moment it lands.`
          : `Your withdrawal of NGN ${amountNaira.toLocaleString()} is being processed. We will confirm it shortly.`
        : `We received your withdrawal request for NGN ${amountNaira.toLocaleString()}. We're reviewing it and will confirm shortly.`,
      deepLink: "/wallet/withdrawals",
      relatedType: "wallet_withdrawal_request",
      publisher: "bridge:apps/account/app/api/wallet/withdrawal/request",
    });

    await sendWithdrawalRequestedEmailBestEffort(admin, user.id, amountNaira);

    return NextResponse.json({
      success: true,
      id: (row as { id: string }).id,
      status: isAuto ? "processing" : "pending_review",
    });
  } catch (error) {
    logApiError("wallet/withdrawal/request", error);
    return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
  }
}
