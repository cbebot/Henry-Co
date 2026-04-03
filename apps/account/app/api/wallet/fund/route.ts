import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminSupabase } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(tokens) {
            for (const { name, value, options } of tokens) {
              try { cookieStore.set(name, value, options); } catch {}
            }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { amount_naira } = await request.json();
    const amountKobo = Math.round(amount_naira * 100);

    if (!amountKobo || amountKobo < 10000) {
      return NextResponse.json({ error: "Minimum amount is NGN 100" }, { status: 400 });
    }
    if (amountKobo > 10000000) {
      return NextResponse.json({ error: "Maximum amount is NGN 100,000" }, { status: 400 });
    }

    const admin = createAdminSupabase();

    // Get or create wallet
    let { data: wallet } = await admin
      .from("customer_wallets")
      .select("id, balance_kobo")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!wallet) {
      const { data: newWallet } = await admin
        .from("customer_wallets")
        .insert({ user_id: user.id })
        .select("id, balance_kobo")
        .single();
      wallet = newWallet;
    }

    if (!wallet) return NextResponse.json({ error: "Wallet error" }, { status: 500 });

    const newBalance = wallet.balance_kobo + amountKobo;

    // Update balance
    await admin
      .from("customer_wallets")
      .update({ balance_kobo: newBalance, updated_at: new Date().toISOString() })
      .eq("id", wallet.id);

    // Record transaction
    await admin.from("customer_wallet_transactions").insert({
      wallet_id: wallet.id,
      user_id: user.id,
      type: "credit",
      amount_kobo: amountKobo,
      balance_after_kobo: newBalance,
      description: `Wallet top-up — NGN ${amount_naira.toLocaleString()}`,
      status: "completed",
    });

    // Record activity
    await admin.from("customer_activity").insert({
      user_id: user.id,
      division: "wallet",
      activity_type: "wallet_funded",
      title: `Added NGN ${amount_naira.toLocaleString()} to wallet`,
      amount_kobo: amountKobo,
    });

    // Notification
    await admin.from("customer_notifications").insert({
      user_id: user.id,
      title: "Wallet funded",
      body: `NGN ${amount_naira.toLocaleString()} has been added to your HenryCo wallet.`,
      category: "wallet",
      action_url: "/wallet",
    });

    return NextResponse.json({ success: true, balance_kobo: newBalance });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
