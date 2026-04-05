import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { applyEffectiveBookingStatus } from "@/lib/care-runtime-overrides";
import { inferCareServiceFamily, parseServiceBookingSummary } from "@/lib/care-tracking";
import { getPaymentVerificationSnapshotForBooking } from "@/lib/payments/verification";
import { normalizePhone } from "@henryco/config";

export const dynamic = "force-dynamic";

function normalizeTrackingCode(value: string) {
  return value.trim().toUpperCase();
}

export async function GET(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRole) {
      return NextResponse.json(
        { ok: false, error: "Server env is missing for tracking." },
        { status: 500 }
      );
    }

    const search = req.nextUrl.searchParams;
    const rawCode = search.get("code") || "";
    const rawPhone = search.get("phone") || "";

    const code = normalizeTrackingCode(rawCode);
    const phone = rawPhone.trim();

    if (!code) {
      return NextResponse.json(
        { ok: false, error: "Tracking code is required." },
        { status: 400 }
      );
    }

    const supabase = createClient(url, serviceRole, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // First: try code only
    const { data: bookingByCode, error: codeError } = await supabase
      .from("care_bookings")
      .select(
        "id, tracking_code, customer_name, phone, service_type, item_summary, pickup_address, pickup_date, pickup_slot, special_instructions, status, quoted_total, balance_due, payment_status, created_at, updated_at"
      )
      .eq("tracking_code", code)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (codeError) {
      console.error("Track query error:", codeError);
      return NextResponse.json(
        { ok: false, error: "Tracking query failed." },
        { status: 500 }
      );
    }

    if (!bookingByCode) {
      return NextResponse.json(
        { ok: false, error: "No matching order found." },
        { status: 404 }
      );
    }

    // Optional extra check: if phone is provided, verify loosely
    if (phone) {
      const normalizedInputPhone = normalizePhone(phone);
      const normalizedSavedPhone = normalizePhone(String(bookingByCode.phone || ""));

      if (
        normalizedInputPhone &&
        normalizedSavedPhone &&
        normalizedInputPhone !== normalizedSavedPhone
      ) {
        return NextResponse.json(
          { ok: false, error: "Tracking code found, but phone number did not match." },
          { status: 404 }
        );
      }
    }

    const booking = await applyEffectiveBookingStatus(bookingByCode);
    const resolvedBooking = booking ?? bookingByCode;

    const payment = await getPaymentVerificationSnapshotForBooking(resolvedBooking.id);

    return NextResponse.json({
      ok: true,
      booking: {
        ...resolvedBooking,
        family: inferCareServiceFamily(resolvedBooking),
        service_summary: parseServiceBookingSummary(resolvedBooking.item_summary),
        payment,
      },
    });
  } catch (error) {
    console.error("Track API exception:", error);
    return NextResponse.json(
      { ok: false, error: "Server error while tracking order." },
      { status: 500 }
    );
  }
}
