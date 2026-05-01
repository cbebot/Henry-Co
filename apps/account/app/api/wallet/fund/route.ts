import { NextResponse } from "next/server";
import { publishNotification } from "@henryco/notifications";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getSharedPaymentRail } from "@/lib/payment-settings";
import { ensureAccountProfileRecords } from "@/lib/account-profile";
import { LEGACY_WALLET_TRANSACTION_PENDING_STATUS } from "@/lib/wallet-storage";

function buildFundingReference(userId: string) {
  const stamp = Date.now().toString(36).toUpperCase();
  return `HCW-${stamp}-${userId.slice(0, 4).toUpperCase()}`;
}

function isMissingRelationError(message: string) {
  const m = message.toLowerCase();
  return m.includes("does not exist") || m.includes("could not find") || m.includes("relation");
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureAccountProfileRecords(user);

    const body = await request.json();
    const provider = typeof body.provider === "string" ? body.provider : "bank_transfer";
    const amountNaira = Number(body.amountNaira ?? body.amount_naira ?? 0);
    const note = typeof body.note === "string" ? body.note.trim() : "";
    const amountKobo = Math.round(amountNaira * 100);

    if (!amountKobo || amountKobo < 10000) {
      return NextResponse.json(
        { error: "Enter at least NGN 100 to create a funding request." },
        { status: 400 }
      );
    }
    if (amountKobo > 10000000) {
      return NextResponse.json({ error: "For this flow, the maximum is NGN 100,000 per request." }, { status: 400 });
    }
    if (provider !== "bank_transfer") {
      return NextResponse.json({ error: "This funding method is not available yet." }, { status: 400 });
    }

    const admin = createAdminSupabase();
    const rail = await getSharedPaymentRail();

    let { data: wallet } = await admin
      .from("customer_wallets")
      .select("id, balance_kobo")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!wallet) {
      const inserted = await admin
        .from("customer_wallets")
        .insert({ user_id: user.id })
        .select("id, balance_kobo")
        .single();
      if (inserted.error) {
        const retry = await admin
          .from("customer_wallets")
          .select("id, balance_kobo")
          .eq("user_id", user.id)
          .maybeSingle();
        wallet = retry.data;
        if (!wallet) {
          console.error("[henryco/account] wallet create failed:", inserted.error);
          return NextResponse.json({ error: "We couldn’t open your wallet. Please try again shortly." }, { status: 500 });
        }
      } else {
        wallet = inserted.data;
      }
    }

    if (!wallet) {
      return NextResponse.json({ error: "We couldn’t open your wallet. Please try again shortly." }, { status: 500 });
    }

    const reference = buildFundingReference(user.id);

    const metadata = {
      provider,
      reference,
      note: note || null,
      bank_name: rail.bankName,
      account_name: rail.accountName,
      account_number: rail.accountNumber,
      instructions: rail.instructions,
      support_email: rail.supportEmail,
      support_whatsapp: rail.supportWhatsApp,
    };

    // Preferred: dedicated funding requests table (avoids legacy transaction CHECK issues)
    const dedicatedInsert = await admin
      .from("customer_wallet_funding_requests")
      .insert({
        user_id: user.id,
        provider: "bank_transfer",
        amount_kobo: amountKobo,
        currency: rail.currency || "NGN",
        status: "pending_verification",
        payment_reference: reference,
        source_division: "account",
        note: note || null,
        metadata,
      })
      .select("id")
      .single();

    if (!dedicatedInsert.error && dedicatedInsert.data?.id) {
      const requestId = String(dedicatedInsert.data.id);

      await admin.from("customer_activity").insert({
        user_id: user.id,
        division: "wallet",
        activity_type: "wallet_funding_requested",
        title: `Wallet funding request — NGN ${amountNaira.toLocaleString()}`,
        description: "Upload proof after you transfer so the team can verify and release your balance.",
        amount_kobo: amountKobo,
        status: "pending_verification",
        reference_type: "wallet_funding_request",
        reference_id: requestId,
        action_url: `/wallet/funding/${requestId}`,
        metadata: {
          provider,
          reference,
        },
      });

      await publishNotification({
        userId: user.id,
        division: "account",
        eventType: "wallet.transaction.update",
        severity: "info",
        title: "Funding request created",
        body: `Transfer NGN ${amountNaira.toLocaleString()} using the bank details on the next screen, then upload proof for verification.`,
        deepLink: `/wallet/funding/${requestId}`,
        relatedType: "wallet_funding_request",
        publisher: "bridge:apps/account/app/api/wallet/fund",
      });

      return NextResponse.json({
        success: true,
        requestId,
        reference,
        status: "pending_verification",
      });
    }

    if (dedicatedInsert.error) {
      const dedicatedErr = dedicatedInsert.error.message || "";
      console.error("[henryco/account] customer_wallet_funding_requests insert:", dedicatedInsert.error);
      if (!isMissingRelationError(dedicatedErr)) {
        // Table may exist but hit constraints — still attempt legacy path before failing.
      }
    }

    // Legacy path: ledger transactions row (older databases)
    const { data: transaction, error: transactionError } = await admin
      .from("customer_wallet_transactions")
      .insert({
        wallet_id: wallet.id,
        user_id: user.id,
        type: "credit",
        amount_kobo: amountKobo,
        balance_after_kobo: wallet.balance_kobo,
        description: `Wallet funding request — NGN ${amountNaira.toLocaleString()}`,
        status: LEGACY_WALLET_TRANSACTION_PENDING_STATUS,
        reference_type: "wallet_funding_request",
        reference_id: reference,
        metadata,
      })
      .select("id, status, reference_id")
      .single();

    if (transactionError || !transaction) {
      return NextResponse.json(
        {
          error:
            "We couldn’t create your funding request. Your account may need a quick wallet setup—try again in a moment or contact support.",
        },
        { status: 500 }
      );
    }

    await admin.from("customer_activity").insert({
      user_id: user.id,
      division: "wallet",
      activity_type: "wallet_funding_requested",
      title: `Wallet funding request — NGN ${amountNaira.toLocaleString()}`,
      description: "Upload proof after the transfer so the team can confirm the funds.",
      amount_kobo: amountKobo,
      status: "pending_verification",
      reference_type: "wallet_funding_request",
      reference_id: transaction.id,
      action_url: `/wallet/funding/${transaction.id}`,
      metadata: {
        provider,
        reference,
      },
    });

    await publishNotification({
      userId: user.id,
      division: "account",
      eventType: "wallet.transaction.update",
      severity: "info",
      title: "Funding request created",
      body: `Transfer NGN ${amountNaira.toLocaleString()} using the bank details shown, then upload proof for verification.`,
      deepLink: `/wallet/funding/${transaction.id}`,
      relatedType: "wallet_funding_request",
      publisher: "bridge:apps/account/app/api/wallet/fund",
    });

    return NextResponse.json({
      success: true,
      requestId: transaction.id,
      reference,
      status: transaction.status,
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
