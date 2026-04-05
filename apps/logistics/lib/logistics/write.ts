import "server-only";

import { normalizeEmail } from "@/lib/env";
import { createAdminSupabase } from "@/lib/supabase";
import { buildPricingBreakdown, resolveZone } from "@/lib/logistics/pricing";
import { getLogisticsRateCards, getLogisticsZones } from "@/lib/logistics/data";
import { appendCustomerActivity, ensureCustomerProfile } from "@/lib/logistics/shared-account";
import type { LogisticsServiceType, LogisticsUrgency } from "@/lib/logistics/types";

function cleanText(value?: unknown) {
  return String(value ?? "").trim();
}

function createId() {
  return crypto.randomUUID();
}

function generateTrackingCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)]!;
  }
  return `HCL-${suffix}`;
}

export type CreateLogisticsRequestInput = {
  mode: "quote" | "book";
  serviceType: LogisticsServiceType;
  urgency: LogisticsUrgency;
  zoneKey: string;
  senderName: string;
  senderPhone: string;
  senderEmail?: string | null;
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string | null;
  parcelType: string;
  parcelDescription?: string | null;
  weightKg: number;
  sizeTier: "small" | "medium" | "large" | "oversize";
  fragile: boolean;
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
  customerUserId?: string | null;
  /** Public logistics origin (e.g. https://logistics.example.com) for account deep links. */
  trackingPortalBaseUrl?: string | null;
};

export type CreateLogisticsRequestResult =
  | {
      ok: true;
      shipmentId: string;
      trackingCode: string;
      amountQuoted: number;
      currency: string;
      promiseWindowHours: [number, number];
      promiseConfidence: number;
    }
  | { ok: false; error: string };

async function ensureUniqueTrackingCode(admin: ReturnType<typeof createAdminSupabase>) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateTrackingCode();
    const { data } = await admin.from("logistics_shipments").select("id").eq("tracking_code", code).maybeSingle();
    if (!data?.id) return code;
  }
  return `HCL-${createId().slice(0, 8).toUpperCase()}`;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function createLogisticsRequest(input: CreateLogisticsRequestInput): Promise<CreateLogisticsRequestResult> {
  let admin: ReturnType<typeof createAdminSupabase>;
  try {
    admin = createAdminSupabase();
  } catch {
    return { ok: false, error: "Logistics is temporarily unavailable. Please try again or contact support." };
  }

  const senderName = cleanText(input.senderName);
  const recipientName = cleanText(input.recipientName);
  const senderPhone = cleanText(input.senderPhone);
  const recipientPhone = cleanText(input.recipientPhone);
  const pickupLine1 = cleanText(input.pickupLine1);
  const dropLine1 = cleanText(input.dropLine1);
  const pickupCity = cleanText(input.pickupCity);
  const pickupRegion = cleanText(input.pickupRegion);
  const dropCity = cleanText(input.dropCity);
  const dropRegion = cleanText(input.dropRegion);

  if (!senderName || !recipientName || !senderPhone || !recipientPhone) {
    return { ok: false, error: "Please complete sender and recipient names and phone numbers." };
  }

  if (!pickupLine1 || !dropLine1 || !pickupCity || !dropCity) {
    return { ok: false, error: "Pickup and delivery addresses need at least a street line and city." };
  }

  const zones = await getLogisticsZones();
  const rateCards = await getLogisticsRateCards();
  const zone = resolveZone(input.zoneKey, zones);
  const pricing = buildPricingBreakdown({
    zone,
    serviceType: input.serviceType,
    urgency: input.urgency,
    weightKg: input.weightKg,
    sizeTier: input.sizeTier,
    fragile: input.fragile,
    rateCards,
  });

  const normalizedEmail = normalizeEmail(input.senderEmail);
  const trackingCode = await ensureUniqueTrackingCode(admin);
  const shipmentId = createId();
  const now = new Date().toISOString();

  const lifecycleStatus =
    input.mode === "quote" ? "quoted" : "booked";
  const paymentStatus = input.mode === "quote" ? "not_required" : "pending";
  const pricingStatus = "quoted";
  const requestType = input.mode === "quote" ? "quote" : "booking";

  const shipmentRow = {
    id: shipmentId,
    tracking_code: trackingCode,
    request_type: requestType,
    service_type: input.serviceType,
    lifecycle_status: lifecycleStatus,
    payment_status: paymentStatus,
    pricing_status: pricingStatus,
    customer_user_id: cleanText(input.customerUserId) || null,
    normalized_email: normalizedEmail,
    sender_name: senderName,
    sender_phone: senderPhone,
    sender_email: cleanText(input.senderEmail) || null,
    recipient_name: recipientName,
    recipient_phone: recipientPhone,
    recipient_email: cleanText(input.recipientEmail) || null,
    parcel_type: cleanText(input.parcelType) || "Parcel",
    parcel_description: cleanText(input.parcelDescription) || null,
    fragile: Boolean(input.fragile),
    weight_kg: Math.max(0, Number(input.weightKg) || 0),
    size_tier: input.sizeTier,
    urgency: input.urgency,
    zone_id: isUuid(zone.id) ? zone.id : null,
    zone_label: zone.name,
    scheduled_pickup_at: cleanText(input.scheduledPickupAt) || null,
    scheduled_delivery_at: null,
    assigned_rider_user_id: null,
    assigned_rider_name: null,
    payment_reference: null,
    amount_quoted: pricing.total,
    amount_paid: 0,
    pricing_breakdown: pricing as unknown as Record<string, unknown>,
    override_meta: {},
    support_summary: null,
    requires_pod: true,
    last_event_at: now,
    created_at: now,
    updated_at: now,
  };

  const { error: shipErr } = await admin.from("logistics_shipments").insert(shipmentRow as never);
  if (shipErr) {
    console.error("[logistics] shipment insert", shipErr);
    return { ok: false, error: "We could not save your request. Please check your details and try again." };
  }

  const pickupId = createId();
  const dropId = createId();

  const addresses = [
    {
      id: pickupId,
      shipment_id: shipmentId,
      kind: "pickup",
      label: "Pickup",
      contact_name: senderName,
      phone: senderPhone,
      email: cleanText(input.senderEmail) || null,
      line1: pickupLine1,
      line2: null,
      city: pickupCity,
      region: pickupRegion,
      country: "Nigeria",
      landmark: cleanText(input.pickupLandmark) || null,
      instructions: cleanText(input.pickupInstructions) || null,
      latitude: null,
      longitude: null,
      created_at: now,
    },
    {
      id: dropId,
      shipment_id: shipmentId,
      kind: "dropoff",
      label: "Delivery",
      contact_name: recipientName,
      phone: recipientPhone,
      email: cleanText(input.recipientEmail) || null,
      line1: dropLine1,
      line2: null,
      city: dropCity,
      region: dropRegion,
      country: "Nigeria",
      landmark: cleanText(input.dropLandmark) || null,
      instructions: cleanText(input.dropInstructions) || null,
      latitude: null,
      longitude: null,
      created_at: now,
    },
  ];

  const { error: addrErr } = await admin.from("logistics_addresses").insert(addresses as never);
  if (addrErr) {
    console.error("[logistics] address insert", addrErr);
    await admin.from("logistics_shipments").delete().eq("id", shipmentId);
    return { ok: false, error: "We could not save address details. Please try again." };
  }

  const eventTitle = input.mode === "quote" ? "Quote requested" : "Booking submitted";
  const eventDescription =
    input.mode === "quote"
      ? "Your shipment has been priced. Our team will follow up to confirm the next step."
      : "Your delivery request is booked. Dispatch will assign a rider and you will see updates on your tracking page.";

  const { error: evErr } = await admin.from("logistics_events").insert({
    id: createId(),
    shipment_id: shipmentId,
    event_type: input.mode === "quote" ? "quote_submitted" : "booking_submitted",
    lifecycle_status: lifecycleStatus,
    title: eventTitle,
    description: eventDescription,
    actor_user_id: cleanText(input.customerUserId) || null,
    actor_name: senderName,
    actor_role: "customer",
    meta: { channel: "public_web" },
    customer_visible: true,
    created_at: now,
  } as never);

  if (evErr) {
    console.error("[logistics] event insert", evErr);
  }

  if (normalizedEmail || input.customerUserId) {
    await ensureCustomerProfile({
      userId: input.customerUserId,
      email: normalizedEmail,
      fullName: senderName,
      phone: senderPhone,
    });

    const portal = cleanText(input.trackingPortalBaseUrl);
    const actionUrl = portal
      ? `${portal.replace(/\/$/, "")}/track?code=${encodeURIComponent(trackingCode)}`
      : null;

    await appendCustomerActivity({
      userId: input.customerUserId,
      email: normalizedEmail,
      activityType: input.mode === "quote" ? "logistics_quote" : "logistics_booking",
      title: input.mode === "quote" ? "Logistics quote received" : "Logistics booking created",
      description: `Tracking code ${trackingCode}. ${zone.name} lane.`,
      status: lifecycleStatus,
      referenceType: "logistics_shipment",
      referenceId: shipmentId,
      amount: pricing.total,
      actionUrl,
      metadata: { trackingCode, serviceType: input.serviceType },
    });
  }

  return {
    ok: true,
    shipmentId,
    trackingCode,
    amountQuoted: pricing.total,
    currency: pricing.currency,
    promiseWindowHours: pricing.promiseWindowHours,
    promiseConfidence: pricing.promiseConfidence,
  };
}
