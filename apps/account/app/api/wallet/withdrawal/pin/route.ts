import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ensureAccountProfileRecords } from "@/lib/account-profile";
import { hashWithdrawalPin, isValidWithdrawalPinFormat, verifyWithdrawalPin } from "@/lib/wallet-pin";
import { USER_FACING_SAVE, logApiError } from "@/lib/user-facing-error";
import {
  buildLegacyWithdrawalPinUpsert,
  extractLegacyWithdrawalPinHash,
  isMissingPostgrestResourceError,
  isLegacyWithdrawalPinRow,
} from "@/lib/wallet-storage";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureAccountProfileRecords(user);

    const body = await request.json();
    const pin = String(body.pin || "");
    const confirmPin = String(body.confirmPin || "");
    const currentPin = String(body.currentPin || "");

    if (!isValidWithdrawalPinFormat(pin) || pin !== confirmPin) {
      return NextResponse.json(
        { error: "Use a 4–6 digit PIN and make sure both entries match." },
        { status: 400 }
      );
    }

    const admin = createAdminSupabase();
    const { data: prefs, error: prefsError } = await admin
      .from("customer_preferences")
      .select("withdrawal_pin_hash")
      .eq("user_id", user.id)
      .maybeSingle();

    let existing = (prefs as { withdrawal_pin_hash?: string } | null)?.withdrawal_pin_hash ?? null;

    let legacyPinRowId: string | null = null;
    if (prefsError && !isMissingPostgrestResourceError(prefsError)) {
      logApiError("wallet/withdrawal/pin load", prefsError);
      return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
    }

    if (prefsError && isMissingPostgrestResourceError(prefsError)) {
      const { data: legacyRows, error: legacyError } = await admin
        .from("customer_payment_methods")
        .select("id, type, provider, provider_token")
        .eq("user_id", user.id);

      if (legacyError) {
        logApiError("wallet/withdrawal/pin load legacy", legacyError);
        return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
      }

      const rows = (legacyRows ?? []) as Array<Record<string, unknown>>;
      const legacyPinRow = rows.find((row) => isLegacyWithdrawalPinRow(row));
      legacyPinRowId = legacyPinRow ? String(legacyPinRow.id || "") : null;
      existing = extractLegacyWithdrawalPinHash(rows);
    }

    if (!existing) {
      const { data: legacyRows, error: legacyError } = await admin
        .from("customer_payment_methods")
        .select("id, type, provider, provider_token")
        .eq("user_id", user.id);

      if (!legacyError) {
        const rows = (legacyRows ?? []) as Array<Record<string, unknown>>;
        const legacyPinRow = rows.find((row) => isLegacyWithdrawalPinRow(row));
        legacyPinRowId = legacyPinRow ? String(legacyPinRow.id || "") : legacyPinRowId;
        existing = extractLegacyWithdrawalPinHash(rows) || existing;
      }
    }

    if (existing) {
      if (!verifyWithdrawalPin(currentPin, existing)) {
        return NextResponse.json({ error: "Current PIN is incorrect." }, { status: 400 });
      }
    }

    const nextHash = hashWithdrawalPin(pin);
    if (!prefsError) {
      const { error } = await admin.from("customer_preferences").upsert(
        {
          user_id: user.id,
          withdrawal_pin_hash: nextHash,
          updated_at: new Date().toISOString(),
        } as never,
        { onConflict: "user_id" }
      );

      if (error) {
        logApiError("wallet/withdrawal/pin", error);
        return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
      }
    } else {
      const payload = buildLegacyWithdrawalPinUpsert({
        userId: user.id,
        hash: nextHash,
        existingId: legacyPinRowId,
      });
      const write = legacyPinRowId
        ? admin.from("customer_payment_methods").update(payload).eq("id", legacyPinRowId).eq("user_id", user.id)
        : admin.from("customer_payment_methods").insert(payload as never);
      const { error } = await write;

      if (error) {
        logApiError("wallet/withdrawal/pin legacy", error);
        return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logApiError("wallet/withdrawal/pin", error);
    return NextResponse.json({ error: USER_FACING_SAVE }, { status: 500 });
  }
}
