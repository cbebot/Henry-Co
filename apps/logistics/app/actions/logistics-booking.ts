"use server";

import { revalidatePath } from "next/cache";
import { getDivisionUrl } from "@henryco/config";
import { getLogisticsZones } from "@/lib/logistics/data";
import { resolveZone } from "@/lib/logistics/pricing";
import { createLogisticsRequest, type CreateLogisticsRequestInput } from "@/lib/logistics/write";
import { notifyLogisticsRequestCreated, getPublicTrackingUrl } from "@/lib/logistics/notify-customer";
import { getLogisticsViewer } from "@/lib/logistics/auth";
import type { LogisticsServiceType, LogisticsUrgency } from "@/lib/logistics/types";

export type BookingFormState =
  | { ok: true; message: string; trackingCode: string; trackingUrl: string }
  | { ok: false; error: string };

const SERVICE_TYPES: LogisticsServiceType[] = [
  "same_day",
  "scheduled",
  "dispatch",
  "inter_city",
  "business_route",
];

const URGENCIES: LogisticsUrgency[] = ["standard", "priority", "rush"];

function clean(v: FormDataEntryValue | null) {
  return String(v ?? "").trim();
}

export async function submitLogisticsBookingAction(
  _prev: BookingFormState | null,
  formData: FormData
): Promise<BookingFormState> {
  const mode = clean(formData.get("mode")) === "quote" ? "quote" : "book";
  const serviceType = clean(formData.get("serviceType")) as LogisticsServiceType;
  const urgency = clean(formData.get("urgency")) as LogisticsUrgency;

  if (!SERVICE_TYPES.includes(serviceType)) {
    return { ok: false, error: "Please choose a valid service type." };
  }
  if (!URGENCIES.includes(urgency)) {
    return { ok: false, error: "Please choose a valid speed option." };
  }

  const zoneKey = clean(formData.get("zoneKey"));
  const zones = await getLogisticsZones();
  const zone = resolveZone(zoneKey, zones);
  if (!zone?.key) {
    return { ok: false, error: "Please choose a delivery zone." };
  }

  const viewer = await getLogisticsViewer();
  const customerUserId = viewer.user?.id ?? null;
  const senderPhone = clean(formData.get("senderPhone"));
  const recipientPhone = clean(formData.get("recipientPhone"));
  if (senderPhone.replace(/[^\d]/g, "").length < 10) {
    return { ok: false, error: "Please enter a valid sender phone number." };
  }
  if (recipientPhone.replace(/[^\d]/g, "").length < 10) {
    return { ok: false, error: "Please enter a valid recipient phone number." };
  }

  const input: CreateLogisticsRequestInput = {
    mode,
    serviceType,
    urgency,
    zoneKey: zone.key,
    senderName: clean(formData.get("senderName")),
    senderPhone,
    senderEmail: clean(formData.get("senderEmail")) || null,
    recipientName: clean(formData.get("recipientName")),
    recipientPhone,
    recipientEmail: clean(formData.get("recipientEmail")) || null,
    parcelType: clean(formData.get("parcelType")) || "Parcel",
    parcelDescription: clean(formData.get("parcelDescription")) || null,
    weightKg: Number(clean(formData.get("weightKg")) || "0"),
    sizeTier: (clean(formData.get("sizeTier")) || "small") as CreateLogisticsRequestInput["sizeTier"],
    fragile: clean(formData.get("fragile")) === "on" || clean(formData.get("fragile")) === "true",
    scheduledPickupAt: clean(formData.get("scheduledPickupAt")) || null,
    pickupLine1: clean(formData.get("pickupLine1")),
    pickupCity: clean(formData.get("pickupCity")),
    pickupRegion: clean(formData.get("pickupRegion")),
    pickupLandmark: clean(formData.get("pickupLandmark")) || null,
    pickupInstructions: clean(formData.get("pickupInstructions")) || null,
    dropLine1: clean(formData.get("dropLine1")),
    dropCity: clean(formData.get("dropCity")),
    dropRegion: clean(formData.get("dropRegion")),
    dropLandmark: clean(formData.get("dropLandmark")) || null,
    dropInstructions: clean(formData.get("dropInstructions")) || null,
    customerUserId,
    trackingPortalBaseUrl: getDivisionUrl("logistics"),
  };

  const result = await createLogisticsRequest(input);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  const trackingUrl = getPublicTrackingUrl(result.trackingCode, input.senderPhone);

  await notifyLogisticsRequestCreated({
    shipmentId: result.shipmentId,
    trackingCode: result.trackingCode,
    mode,
    senderName: input.senderName,
    senderEmail: input.senderEmail,
    senderPhone: input.senderPhone,
    amountQuoted: result.amountQuoted,
    currency: result.currency,
    zoneLabel: zone.name,
    promiseWindowHours: result.promiseWindowHours,
    trackingUrl,
    customerUserId,
  });

  revalidatePath("/");
  revalidatePath("/track");

  const message =
    mode === "quote"
      ? `Quote saved. Your reference is ${result.trackingCode}. We emailed instructions if you provided an address.`
      : `Booking received. Your tracking code is ${result.trackingCode}. You will see live milestones as dispatch progresses.`;

  return {
    ok: true,
    message,
    trackingCode: result.trackingCode,
    trackingUrl,
  };
}
