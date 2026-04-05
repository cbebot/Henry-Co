import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ensureAccountProfileRecords } from "@/lib/account-profile";
import { USER_FACING_SAVE, logApiError } from "@/lib/user-facing-error";

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("customer_payout_methods")
      .select("id, bank_name, account_name, account_number, is_default, currency, created_at")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("is_default", { ascending: false });

    if (error) {
      logApiError("wallet/payout-methods GET", error);
      return NextResponse.json({ methods: [] });
    }

    return NextResponse.json({ methods: data ?? [] });
  } catch (error) {
    logApiError("wallet/payout-methods GET", error);
    return NextResponse.json({ methods: [] });
  }
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
    const bankName = String(body.bank_name || "").trim();
    const accountName = String(body.account_name || "").trim();
    const accountNumber = String(body.account_number || "").replace(/\s+/g, "");

    if (!bankName || !accountName || !accountNumber || accountNumber.length < 8) {
      return NextResponse.json(
        { error: "Enter your bank name, account name, and a valid account number." },
        { status: 400 }
      );
    }

    const admin = createAdminSupabase();
    const { count } = await admin
      .from("customer_payout_methods")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_active", true);

    const isDefault = (count ?? 0) === 0;

    if (isDefault) {
      await admin.from("customer_payout_methods").update({ is_default: false }).eq("user_id", user.id);
    }

    const { data, error } = await admin
      .from("customer_payout_methods")
      .insert({
        user_id: user.id,
        method_type: "bank_transfer",
        bank_name: bankName,
        account_name: accountName,
        account_number: accountNumber,
        currency: "NGN",
        is_default: isDefault,
        is_active: true,
      } as never)
      .select("id, bank_name, account_name, account_number, is_default")
      .single();

    if (error || !data) {
      logApiError("wallet/payout-methods POST", error);
      return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
    }

    return NextResponse.json({ method: data });
  } catch (error) {
    logApiError("wallet/payout-methods POST", error);
    return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
  }
}
