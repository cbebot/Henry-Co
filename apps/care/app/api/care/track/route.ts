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

    // V3 PASS 21 — stage photos: garment intake + completion, plus
    // per-leg POD captures. Best-effort: tables may not exist on
    // older environments, so we tolerate query failures.
    // Public tracking response intentionally excludes operational POD
    // metadata (GPS coordinates of the customer's location, delivery
    // recipient name) — a code-only lookup must not expose it.
    const stagePhotos: Array<{
      id: string;
      url: string;
      caption: string;
      stage: "intake" | "completion" | "pickup_pod" | "delivery_pod";
      captured_at: string;
    }> = [];

    try {
      const { data: garments } = await supabase
        .from("care_booking_garments")
        .select(
          "id, garment_label, intake_photo_url, completion_photo_url, updated_at",
        )
        .eq("booking_id", resolvedBooking.id);

      for (const garment of garments ?? []) {
        const label = (garment as { garment_label?: string }).garment_label || "Garment";
        const intakeUrl = (garment as { intake_photo_url?: string }).intake_photo_url;
        const completionUrl = (garment as { completion_photo_url?: string }).completion_photo_url;
        const updatedAt =
          (garment as { updated_at?: string }).updated_at || resolvedBooking.created_at;
        if (intakeUrl) {
          stagePhotos.push({
            id: `${(garment as { id: string }).id}-intake`,
            url: intakeUrl,
            caption: `${label} — intake`,
            stage: "intake",
            captured_at: updatedAt,
          });
        }
        if (completionUrl) {
          stagePhotos.push({
            id: `${(garment as { id: string }).id}-completion`,
            url: completionUrl,
            caption: `${label} — completion`,
            stage: "completion",
            captured_at: updatedAt,
          });
        }
      }
    } catch {
      // care_booking_garments table absent — leave aggregate empty
    }

    try {
      const { data: pods } = await supabase
        .from("care_pod_records")
        .select("id, leg, photo_url, captured_at")
        .eq("booking_id", resolvedBooking.id)
        .not("photo_url", "is", null);

      for (const pod of pods ?? []) {
        const podRow = pod as {
          id: string;
          leg: string;
          photo_url: string;
          captured_at: string;
        };
        const isPickup = podRow.leg === "pickup";
        stagePhotos.push({
          id: `${podRow.id}-pod`,
          url: podRow.photo_url,
          caption: isPickup ? "Pickup confirmation" : "Delivery confirmation",
          stage: isPickup ? "pickup_pod" : "delivery_pod",
          captured_at: podRow.captured_at,
        });
      }
    } catch {
      // care_pod_records table absent
    }

    return NextResponse.json({
      ok: true,
      booking: {
        ...resolvedBooking,
        family: inferCareServiceFamily(resolvedBooking),
        service_summary: parseServiceBookingSummary(resolvedBooking.item_summary),
        payment,
        stage_photos: stagePhotos,
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
