import { NextResponse } from "next/server";
import { createAdminSupabase } from "../../../../lib/supabase";

function normalizePhone(phone: string) {
  return String(phone || "").replace(/\D/g, "");
}

function makeTrackingCode() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `HC-${y}${m}${d}-${rand}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const customer_name = String(body?.customer_name || "").trim();
    const phone = String(body?.phone || "").trim();
    const email = String(body?.email || "").trim() || null;
    const service_type = String(body?.service_type || "").trim();
    const items_count = Number(body?.items_count || 0);
    const pickup_address = String(body?.pickup_address || "").trim();
    const pickup_date = String(body?.pickup_date || "").trim() || null;
    const pickup_slot = String(body?.pickup_slot || "").trim() || null;
    const special_instructions =
      String(body?.special_instructions || "").trim() || null;

    if (!customer_name || !phone || !service_type || !pickup_address || !pickup_date) {
      return NextResponse.json(
        { ok: false, error: "Please fill all required booking fields." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(items_count) || items_count < 1) {
      return NextResponse.json(
        { ok: false, error: "Items count must be at least 1." },
        { status: 400 }
      );
    }

    const trackingCode = makeTrackingCode();
    const supabase = createAdminSupabase();

    const { error } = await supabase.from("care_bookings").insert({
      tracking_code: trackingCode,
      customer_name,
      phone,
      phone_normalized: normalizePhone(phone),
      email,
      service_type,
      items_count,
      pickup_address,
      pickup_date,
      pickup_slot,
      special_instructions,
      status: "booked",
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message || "Booking insert failed." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      trackingCode,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Server error.",
      },
      { status: 500 }
    );
  }
}
