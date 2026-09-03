import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createLogisticsRequest } from "@/lib/logistics/write";
import { getLogisticsPublicLocale } from "@/lib/locale-server";
import type { LogisticsServiceType, LogisticsUrgency } from "@/lib/logistics/types";

/**
 * V3 PASS 21 — POST /api/logistics/book
 *
 * Accepts either:
 *   1. { quote_id } + minimum identity payload — hydrates the booking
 *      from the persisted quote (preferred path; no re-entry).
 *   2. A full booking payload (legacy path; matches BookRequestForm).
 *
 * On success, returns { tracking_code, shipment_id }.
 *
 * The route stamps converted_shipment_id / converted_at on the quote
 * row so finance + analytics can compute quote-to-book conversion.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type BookFromQuotePayload = {
  quote_id: string;
  senderName: string;
  senderPhone: string;
  senderEmail?: string | null;
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string | null;
  parcelType?: string;
  parcelDescription?: string | null;
  scheduledPickupAt?: string | null;
  pickupLine1: string;
  pickupCity: string;
  pickupRegion: string;
  pickupLandmark?: string | null;
  pickupInstructions?: string | null;
  dropLine1: string;
  dropCity: string;
  dropRegion: string;
  dropLandmark?: string | null;
  dropInstructions?: string | null;
};

type QuoteRow = {
  id: string;
  payload: {
    zoneKey?: string;
    serviceType?: LogisticsServiceType;
    urgency?: LogisticsUrgency;
    weightKg?: number;
    sizeTier?: "small" | "medium" | "large" | "oversize";
    fragile?: boolean;
  } | null;
  expires_at: string;
  converted_shipment_id: string | null;
};

export async function POST(request: NextRequest) {
  const locale = await getLogisticsPublicLocale();
  let body: BookFromQuotePayload;
  try {
    body = (await request.json()) as BookFromQuotePayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  if (!body.quote_id || typeof body.quote_id !== "string") {
    return NextResponse.json(
      { ok: false, error: "quote_id_required" },
      { status: 400 },
    );
  }

  const admin = createAdminSupabase();
  const { data: quoteRow, error: quoteError } = await admin
    .from("logistics_quotes")
    .select("id, payload, expires_at, converted_shipment_id")
    .eq("id", body.quote_id)
    .maybeSingle<QuoteRow>();

  if (quoteError) {
    console.error("[logistics-book] quote lookup failed", quoteError);
    return NextResponse.json(
      { ok: false, error: "quote_lookup_failed" },
      { status: 500 },
    );
  }
  if (!quoteRow) {
    return NextResponse.json(
      { ok: false, error: "quote_not_found" },
      { status: 404 },
    );
  }
  if (quoteRow.converted_shipment_id) {
    return NextResponse.json(
      { ok: false, error: "quote_already_converted" },
      { status: 409 },
    );
  }
  if (new Date(quoteRow.expires_at).getTime() < Date.now()) {
    return NextResponse.json(
      { ok: false, error: "quote_expired" },
      { status: 410 },
    );
  }

  const payload = quoteRow.payload ?? {};

  let viewerUserId: string | null = null;
  try {
    const supabase = await createSupabaseServer();
    const { data } = await supabase.auth.getUser();
    viewerUserId = data.user?.id ?? null;
  } catch {
    viewerUserId = null;
  }

  const result = await createLogisticsRequest({
    mode: "book",
    serviceType: (payload.serviceType ?? "scheduled") as LogisticsServiceType,
    urgency: (payload.urgency ?? "standard") as LogisticsUrgency,
    zoneKey: payload.zoneKey ?? "enugu-metro",
    senderName: body.senderName,
    senderPhone: body.senderPhone,
    senderEmail: body.senderEmail ?? null,
    recipientName: body.recipientName,
    recipientPhone: body.recipientPhone,
    recipientEmail: body.recipientEmail ?? null,
    parcelType: body.parcelType || "Parcel",
    parcelDescription: body.parcelDescription ?? null,
    weightKg: payload.weightKg ?? 0,
    sizeTier: payload.sizeTier ?? "small",
    fragile: Boolean(payload.fragile),
    scheduledPickupAt: body.scheduledPickupAt ?? null,
    pickupLine1: body.pickupLine1,
    pickupCity: body.pickupCity,
    pickupRegion: body.pickupRegion,
    pickupLandmark: body.pickupLandmark ?? null,
    pickupInstructions: body.pickupInstructions ?? null,
    dropLine1: body.dropLine1,
    dropCity: body.dropCity,
    dropRegion: body.dropRegion,
    dropLandmark: body.dropLandmark ?? null,
    dropInstructions: body.dropInstructions ?? null,
    customerUserId: viewerUserId,
    locale,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }

  // Stamp the quote row with the resulting shipment id.
  await admin
    .from("logistics_quotes")
    .update({
      converted_shipment_id: result.shipmentId,
      converted_at: new Date().toISOString(),
    })
    .eq("id", quoteRow.id);

  return NextResponse.json({
    ok: true,
    tracking_code: result.trackingCode,
    shipment_id: result.shipmentId,
    amount: result.amountQuoted,
    currency: result.currency,
    promise_window_hours: result.promiseWindowHours,
    promise_confidence: result.promiseConfidence,
  });
}
