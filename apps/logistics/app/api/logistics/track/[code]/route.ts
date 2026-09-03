import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase";

/**
 * V3 PASS 21 — GET /api/logistics/track/[code]
 *
 * Public, anonymous-safe tracking lookup. Returns ONLY non-PII fields:
 *   - tracking_code
 *   - status
 *   - eta_at (when present)
 *   - last_event_at
 *   - zone_label / service_type / urgency
 *   - sanitized initials for sender / recipient
 *   - city-only for pickup / dropoff (no street / phone / email)
 *
 * L2 gate: this endpoint MUST NOT leak full address, name, or contact.
 * Authenticated `/track` page does a richer read via Supabase server
 * client; the public JSON endpoint is intentionally minimal.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Curated customer-facing status labels — the public endpoint never returns the
// raw internal lifecycle enum.
const PUBLIC_STATUS_LABEL: Record<string, string> = {
  quote_requested: "Quote requested",
  quoted: "Quoted",
  awaiting_payment: "Awaiting payment",
  booked: "Booked",
  assigned: "Rider assigned",
  pickup_confirmed: "Pickup confirmed",
  in_transit: "In transit",
  delayed: "Delayed",
  attempted_delivery: "Attempted delivery",
  delivered: "Delivered",
  failed_delivery: "Delivery failed",
  return_initiated: "Return initiated",
  returned: "Returned",
  cancelled: "Cancelled",
};

type RouteContext = {
  params: Promise<{ code: string }>;
};

function initials(name: string | null | undefined): string {
  if (!name) return "";
  const cleaned = String(name).trim();
  if (!cleaned) return "";
  return cleaned
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 3)
    .join("");
}

type ShipmentRow = {
  tracking_code: string;
  lifecycle_status: string;
  service_type: string;
  urgency: string;
  zone_label: string | null;
  scheduled_pickup_at: string | null;
  scheduled_delivery_at: string | null;
  last_event_at: string | null;
  sender_name: string;
  recipient_name: string;
};

export async function GET(_request: NextRequest, ctx: RouteContext) {
  const { code } = await ctx.params;
  const normalized = String(code || "").trim().toUpperCase();

  if (!/^HCL-[A-Z0-9]{4,12}$/.test(normalized)) {
    return NextResponse.json(
      { ok: false, error: "invalid_code" },
      { status: 400 },
    );
  }

  let admin: ReturnType<typeof createAdminSupabase>;
  try {
    admin = createAdminSupabase();
  } catch {
    return NextResponse.json(
      { ok: false, error: "service_unavailable" },
      { status: 503 },
    );
  }

  const { data, error } = await admin
    .from("logistics_shipments")
    .select(
      "tracking_code, lifecycle_status, service_type, urgency, zone_label, scheduled_pickup_at, scheduled_delivery_at, last_event_at, sender_name, recipient_name",
    )
    .eq("tracking_code", normalized)
    .maybeSingle<ShipmentRow>();

  if (error) {
    console.error("[logistics-track] lookup failed", error);
    return NextResponse.json(
      { ok: false, error: "lookup_failed" },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json(
      { ok: false, error: "not_found" },
      { status: 404 },
    );
  }

  // Look up just the city columns from logistics_addresses for a
  // city-only return (no line1 / line2 / phone / email leakage).
  const { data: addresses } = await admin
    .from("logistics_addresses")
    .select("kind, city, region")
    .eq("shipment_id", data.tracking_code) // never matches — see note
    .order("kind");

  // The join on tracking_code above intentionally returns nothing
  // because addresses are referenced by shipment.id. Re-query with id.
  let pickupCity: string | null = null;
  let dropoffCity: string | null = null;
  const { data: shipmentIdRow } = await admin
    .from("logistics_shipments")
    .select("id")
    .eq("tracking_code", normalized)
    .maybeSingle<{ id: string }>();

  if (shipmentIdRow?.id) {
    const { data: addressRows } = await admin
      .from("logistics_addresses")
      .select("kind, city")
      .eq("shipment_id", shipmentIdRow.id);
    for (const row of addressRows ?? []) {
      const kind = String(row?.kind || "").toLowerCase();
      if (kind === "pickup" && typeof row?.city === "string")
        pickupCity = row.city;
      if (kind === "dropoff" && typeof row?.city === "string")
        dropoffCity = row.city;
    }
  }

  void addresses; // appease unused

  return NextResponse.json({
    ok: true,
    tracking_code: data.tracking_code,
    status: PUBLIC_STATUS_LABEL[data.lifecycle_status] ?? "In progress",
    service_type: data.service_type,
    urgency: data.urgency,
    zone_label: data.zone_label,
    scheduled_pickup_at: data.scheduled_pickup_at,
    scheduled_delivery_at: data.scheduled_delivery_at,
    last_event_at: data.last_event_at,
    sender_initials: initials(data.sender_name),
    recipient_initials: initials(data.recipient_name),
    pickup_city: pickupCity,
    dropoff_city: dropoffCity,
  });
}
