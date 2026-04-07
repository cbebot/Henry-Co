import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getOptionalEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

function getCareBookingSupabase() {
  const url = getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getCareBookingSupabase();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Booking is temporarily unavailable. Please try again shortly." },
        { status: 500 }
      );
    }

    const body = await req.json();

    const { data, error } = await supabase.rpc("create_care_booking", {
      p_customer_name: body.customer_name,
      p_phone: body.phone,
      p_email: body.email || null,
      p_service_type: body.service_type,
      p_item_summary: body.item_summary || null,
      p_pickup_address: body.pickup_address,
      p_pickup_date: body.pickup_date,
      p_pickup_slot: body.pickup_slot,
      p_special_instructions: body.special_instructions || null,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message || "Booking failed." },
        { status: 400 }
      );
    }

    const booking = Array.isArray(data) ? data[0] : data;

    return NextResponse.json({
      ok: true,
      booking,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Network/server error." },
      { status: 500 }
    );
  }
}
