import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ensureAccountProfileRecords } from "@/lib/account-profile";
import { USER_FACING_SAVE, logApiError } from "@/lib/user-facing-error";
import {
  buildLegacyPayoutMethodInsert,
  isLegacyPayoutMethodRow,
  isMissingPostgrestResourceError,
  mapLegacyPayoutMethod,
} from "@/lib/wallet-storage";

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

    if (error && !isMissingPostgrestResourceError(error)) {
      logApiError("wallet/payout-methods GET", error);
      return NextResponse.json({ methods: [] });
    }

    const { data: legacyRows, error: legacyError } = await admin
      .from("customer_payment_methods")
      .select("id, type, label, last_four, bank_name, is_default, provider, metadata, created_at")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (legacyError) {
      logApiError("wallet/payout-methods GET legacy", legacyError);
      return NextResponse.json({ methods: data ?? [] });
    }

    const legacyMethods = ((legacyRows ?? []) as Array<Record<string, unknown>>)
      .filter((row) => isLegacyPayoutMethodRow(row))
      .map(mapLegacyPayoutMethod);

    if (error && isMissingPostgrestResourceError(error)) {
      return NextResponse.json({ methods: legacyMethods });
    }

    return NextResponse.json({
      methods: [...(data ?? []), ...legacyMethods].filter(
        (item, index, list) => list.findIndex((entry) => String(entry.id) === String(item.id)) === index
      ),
    });
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
    const userId = user.id;

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
    async function insertLegacyMethod() {
      const { data: legacyRows, error: legacyError } = await admin
        .from("customer_payment_methods")
        .select("id, type, label, last_four, bank_name, is_default, provider, metadata, created_at")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (legacyError) {
        logApiError("wallet/payout-methods POST legacy load", legacyError);
        return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
      }

      const existingLegacy = ((legacyRows ?? []) as Array<Record<string, unknown>>).filter((row) =>
        isLegacyPayoutMethodRow(row)
      );
      const isDefault = existingLegacy.length === 0;

      if (isDefault) {
        await admin
          .from("customer_payment_methods")
          .update({ is_default: false })
          .eq("user_id", userId)
          .eq("provider", "manual_payout");
      }

      const { data: insertedLegacy, error: insertedLegacyError } = await admin
        .from("customer_payment_methods")
        .insert(
          buildLegacyPayoutMethodInsert({
            userId,
            bankName,
            accountName,
            accountNumber,
            isDefault,
          }) as never
        )
        .select("id, type, label, last_four, bank_name, is_default, provider, metadata, created_at")
        .single();

      if (insertedLegacyError || !insertedLegacy) {
        logApiError("wallet/payout-methods POST legacy insert", insertedLegacyError);
        return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
      }

      return NextResponse.json({
        method: mapLegacyPayoutMethod(insertedLegacy as unknown as Record<string, unknown>),
      });
    }

    const { count, error: countError } = await admin
      .from("customer_payout_methods")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_active", true);

    if (countError && isMissingPostgrestResourceError(countError)) {
      return insertLegacyMethod();
    }

    if (countError) {
      logApiError("wallet/payout-methods POST count", countError);
      return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
    }

    const isDefault = (count ?? 0) === 0;

    if (isDefault) {
      await admin.from("customer_payout_methods").update({ is_default: false }).eq("user_id", userId);
    }

    const { data, error } = await admin
      .from("customer_payout_methods")
      .insert({
        user_id: userId,
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

    if (error && isMissingPostgrestResourceError(error)) {
      return insertLegacyMethod();
    }

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
