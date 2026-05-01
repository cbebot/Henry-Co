import { NextResponse } from "next/server";
import { normalizeEmail } from "@henryco/config";
import { publishNotification } from "@henryco/notifications";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase";
import { getPendingWithdrawalHoldKobo, getWalletSummary, getWithdrawalRequests } from "@/lib/account-data";

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id: paymentId } = await context.params;
    const admin = createAdminSupabase();

    const { data: paymentRow, error: paymentError } = await admin
      .from("studio_payments")
      .select("id, project_id, amount, currency, status, label")
      .eq("id", paymentId)
      .maybeSingle();
    if (paymentError || !paymentRow) {
      return NextResponse.json({ error: "Payment checkpoint not found." }, { status: 404 });
    }

    const { data: projectRow } = await admin
      .from("studio_projects")
      .select("id, title, client_user_id, normalized_email")
      .eq("id", paymentRow.project_id)
      .maybeSingle();
    if (!projectRow) {
      return NextResponse.json({ error: "Project context not found for this payment." }, { status: 404 });
    }

    const canAccess =
      asText(projectRow.client_user_id) === user.id ||
      (!!user.email && normalizeEmail(projectRow.normalized_email) === normalizeEmail(user.email));
    if (!canAccess) {
      return NextResponse.json({ error: "You do not have access to this Studio payment." }, { status: 403 });
    }

    if (paymentRow.status === "paid" || paymentRow.status === "processing") {
      return NextResponse.json(
        { error: "This checkpoint is already paid or under finance review." },
        { status: 400 }
      );
    }

    const amountKobo = Math.max(0, Math.round(Number(paymentRow.amount || 0) * 100));
    if (!amountKobo) {
      return NextResponse.json({ error: "Payment amount is invalid." }, { status: 400 });
    }

    const [wallet, withdrawals] = await Promise.all([
      getWalletSummary(user.id),
      getWithdrawalRequests(user.id),
    ]);
    const walletId = asText(wallet.id);
    if (!walletId) {
      return NextResponse.json({ error: "Wallet is not ready yet. Open wallet and retry." }, { status: 400 });
    }
    const pendingWithdrawalKobo = getPendingWithdrawalHoldKobo(withdrawals as never);
    const currentBalanceKobo = Math.max(0, Number(wallet.balance_kobo || 0));
    const availableKobo = Math.max(0, currentBalanceKobo - pendingWithdrawalKobo);
    if (availableKobo < amountKobo) {
      return NextResponse.json(
        {
          error:
            "Insufficient wallet balance for this Studio checkpoint. Fund your wallet or use bank transfer proof upload.",
        },
        { status: 400 }
      );
    }

    const nextBalanceKobo = Math.max(0, currentBalanceKobo - amountKobo);
    const { data: existingDebit } = await admin
      .from("customer_wallet_transactions")
      .select("id")
      .eq("reference_type", "studio_payment")
      .eq("reference_id", paymentRow.id)
      .eq("type", "debit")
      .maybeSingle();
    if (existingDebit?.id) {
      return NextResponse.json(
        { error: "A wallet debit for this Studio checkpoint already exists." },
        { status: 400 }
      );
    }

    const { data: walletUpdateRow, error: walletUpdateError } = await admin
      .from("customer_wallets")
      .update({ balance_kobo: nextBalanceKobo, updated_at: new Date().toISOString() } as never)
      .eq("user_id", user.id)
      .eq("balance_kobo", currentBalanceKobo)
      .select("id")
      .maybeSingle();
    if (walletUpdateError || !walletUpdateRow?.id) {
      return NextResponse.json(
        { error: "Wallet changed while processing this payment. Please retry once." },
        { status: 500 }
      );
    }

    const debitReference = `studio-wallet-${paymentRow.id}`;
    await admin.from("customer_wallet_transactions").insert({
      wallet_id: walletId,
      user_id: user.id,
      type: "debit",
      amount_kobo: amountKobo,
      balance_after_kobo: nextBalanceKobo,
      description: `Studio payment: ${asText(paymentRow.label) || "Milestone checkpoint"}`,
      status: "completed",
      reference_type: "studio_payment",
      reference_id: paymentRow.id,
      metadata: {
        source: "studio_wallet_checkout",
        project_id: projectRow.id,
        project_title: projectRow.title,
        payment_currency: paymentRow.currency || "NGN",
        debit_reference: debitReference,
      },
    } as never);

    await admin
      .from("studio_payments")
      .update({
        status: "processing",
        method: "wallet_balance",
        proof_name: `Wallet debit • ${debitReference}`,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", paymentRow.id);

    await admin.from("customer_activity").insert({
      user_id: user.id,
      division: "studio",
      activity_type: "studio_wallet_payment_submitted",
      title: "Studio wallet payment submitted",
      description: `Wallet debit applied to ${asText(paymentRow.label) || "Studio checkpoint"}. Finance review is in progress.`,
      amount_kobo: amountKobo,
      status: "processing",
      reference_type: "studio_payment",
      reference_id: paymentRow.id,
      action_url: `/studio/payments/${paymentRow.id}`,
      metadata: { project_id: projectRow.id, debit_reference: debitReference },
    } as never);
    await publishNotification({
      userId: user.id,
      division: "studio",
      eventType: "studio.project.update",
      severity: "info",
      title: "Studio wallet payment submitted",
      body: "Your wallet debit is recorded and waiting for finance confirmation.",
      deepLink: `/studio/payments/${paymentRow.id}`,
      relatedType: "studio_payment",
      relatedId: String(paymentRow.id),
      publisher: "bridge:apps/account/app/api/studio/payments/wallet",
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
