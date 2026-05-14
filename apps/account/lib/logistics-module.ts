import "server-only";

import { createAdminSupabase } from "@/lib/supabase";
import { getDivisionUrl } from "@henryco/config";

export type AccountLogisticsLatLng = { lat: number; lng: number };

export type AccountLogisticsAddress = {
  contactName: string;
  city: string;
  region: string;
  line1: string;
  landmark: string | null;
  coord: AccountLogisticsLatLng | null;
};

export type AccountLogisticsShipment = {
  id: string;
  trackingCode: string;
  lifecycleStatus: string;
  paymentStatus: string;
  serviceType: string;
  urgency: string;
  parcelType: string;
  parcelDescription: string | null;
  fragile: boolean;
  weightKg: number;
  amountQuoted: number;
  amountPaid: number;
  zoneLabel: string | null;
  scheduledPickupAt: string | null;
  scheduledDeliveryAt: string | null;
  lastEventAt: string | null;
  createdAt: string;
  updatedAt: string;
  senderName: string;
  recipientName: string;
  pickup: AccountLogisticsAddress | null;
  dropoff: AccountLogisticsAddress | null;
  isActive: boolean;
  isCompleted: boolean;
};

export type AccountLogisticsSnapshot = {
  shipments: AccountLogisticsShipment[];
  active: AccountLogisticsShipment[];
  recent: AccountLogisticsShipment[];
  metrics: {
    activeCount: number;
    deliveredThisMonth: number;
    onTimeRatePct: number | null;
    totalSpendMinor: number;
    lifetimeShipments: number;
  };
  spendByMonth: Array<{ monthIso: string; label: string; totalMinor: number }>;
  hasAnyShipments: boolean;
};

const ACTIVE_STATUSES = new Set([
  "quote_requested",
  "quote_sent",
  "pending_payment",
  "scheduled",
  "assigned",
  "pickup_confirmed",
  "in_transit",
  "delayed",
  "attempted_delivery",
]);

const COMPLETED_STATUSES = new Set(["delivered", "completed", "closed"]);

function safeNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function coordFromRow(row: Record<string, unknown> | null | undefined): AccountLogisticsLatLng | null {
  if (!row) return null;
  const lat = Number(row.latitude);
  const lng = Number(row.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
}

function rowToAddress(row: Record<string, unknown> | null | undefined): AccountLogisticsAddress | null {
  if (!row) return null;
  const contactName = safeString(row.contact_name);
  const city = safeString(row.city);
  const region = safeString(row.region);
  const line1 = safeString(row.line1);
  if (!contactName && !city && !line1) return null;
  return {
    contactName,
    city,
    region,
    line1,
    landmark: nullableString(row.landmark),
    coord: coordFromRow(row),
  };
}

function rowToShipment(
  row: Record<string, unknown>,
  addresses: Map<string, Array<Record<string, unknown>>>,
): AccountLogisticsShipment {
  const id = safeString(row.id);
  const lifecycleStatus =
    typeof row.lifecycle_status === "string" && row.lifecycle_status.length > 0
      ? row.lifecycle_status
      : "pending";
  const addrRows = addresses.get(id) ?? [];
  const pickupRow = addrRows.find((r) => safeString(r.kind) === "pickup") ?? null;
  const dropoffRow = addrRows.find((r) => safeString(r.kind) === "dropoff") ?? null;
  return {
    id,
    trackingCode: safeString(row.tracking_code),
    lifecycleStatus,
    paymentStatus: safeString(row.payment_status) || "not_required",
    serviceType: safeString(row.service_type) || "scheduled",
    urgency: safeString(row.urgency) || "standard",
    parcelType: safeString(row.parcel_type) || "Parcel",
    parcelDescription: nullableString(row.parcel_description),
    fragile: Boolean(row.fragile),
    weightKg: safeNumber(row.weight_kg),
    amountQuoted: safeNumber(row.amount_quoted),
    amountPaid: safeNumber(row.amount_paid),
    zoneLabel: nullableString(row.zone_label),
    scheduledPickupAt: nullableString(row.scheduled_pickup_at),
    scheduledDeliveryAt: nullableString(row.scheduled_delivery_at),
    lastEventAt: nullableString(row.last_event_at),
    createdAt: safeString(row.created_at),
    updatedAt: safeString(row.updated_at),
    senderName: safeString(row.sender_name) || "—",
    recipientName: safeString(row.recipient_name) || "—",
    pickup: rowToAddress(pickupRow),
    dropoff: rowToAddress(dropoffRow),
    isActive: ACTIVE_STATUSES.has(lifecycleStatus),
    isCompleted: COMPLETED_STATUSES.has(lifecycleStatus),
  };
}

function monthIsoFromDate(d: Date): string {
  const m = d.getUTCMonth() + 1;
  return `${d.getUTCFullYear()}-${m.toString().padStart(2, "0")}`;
}

function monthLabel(monthIso: string): string {
  const [yearStr, monthStr] = monthIso.split("-");
  const date = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, 1));
  return date.toLocaleString(undefined, { month: "short" });
}

export async function getLogisticsSnapshotForAccountUser(
  userId: string,
  email: string | null,
): Promise<AccountLogisticsSnapshot> {
  const admin = createAdminSupabase();
  const norm = email ? email.trim().toLowerCase() : "";

  let shipmentsQuery = admin
    .from("logistics_shipments")
    .select(
      "id, tracking_code, lifecycle_status, payment_status, service_type, urgency, parcel_type, parcel_description, fragile, weight_kg, amount_quoted, amount_paid, zone_label, scheduled_pickup_at, scheduled_delivery_at, last_event_at, sender_name, recipient_name, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(48);

  if (norm) {
    shipmentsQuery = shipmentsQuery.or(`customer_user_id.eq.${userId},normalized_email.eq.${norm}`);
  } else {
    shipmentsQuery = shipmentsQuery.eq("customer_user_id", userId);
  }

  const { data: shipmentRows, error: shipmentsErr } = await shipmentsQuery;
  if (shipmentsErr) {
    console.error("[account] logistics_shipments", shipmentsErr);
    return emptySnapshot();
  }

  const rows = (shipmentRows ?? []) as Array<Record<string, unknown>>;
  if (rows.length === 0) return emptySnapshot();

  const ids = rows
    .map((r) => safeString(r.id))
    .filter((id) => id.length > 0);

  const addressMap = new Map<string, Array<Record<string, unknown>>>();
  if (ids.length > 0) {
    const { data: addrRows, error: addrErr } = await admin
      .from("logistics_addresses")
      .select(
        "shipment_id, kind, contact_name, line1, city, region, country, landmark, latitude, longitude",
      )
      .in("shipment_id", ids);
    if (!addrErr) {
      for (const row of (addrRows ?? []) as Array<Record<string, unknown>>) {
        const sid = safeString(row.shipment_id);
        if (!sid) continue;
        const list = addressMap.get(sid) ?? [];
        list.push(row);
        addressMap.set(sid, list);
      }
    }
  }

  const shipments = rows.map((r) => rowToShipment(r, addressMap));
  const active = shipments.filter((s) => s.isActive);
  const completed = shipments.filter((s) => s.isCompleted);
  const recent = [...completed]
    .sort(
      (a, b) =>
        Date.parse(b.lastEventAt || b.updatedAt || b.createdAt) -
        Date.parse(a.lastEventAt || a.updatedAt || a.createdAt),
    )
    .slice(0, 6);

  const now = new Date();
  const thisMonth = monthIsoFromDate(now);
  const deliveredThisMonth = completed.filter((s) => {
    const ref = s.lastEventAt || s.updatedAt || s.createdAt;
    return monthIsoFromDate(new Date(ref)) === thisMonth;
  }).length;

  let onTimeOf = 0;
  let onTimeTotal = 0;
  for (const s of completed) {
    if (!s.scheduledDeliveryAt) continue;
    const ref = s.lastEventAt || s.updatedAt;
    if (!ref) continue;
    const promised = Date.parse(s.scheduledDeliveryAt);
    const delivered = Date.parse(ref);
    if (!Number.isFinite(promised) || !Number.isFinite(delivered)) continue;
    onTimeTotal += 1;
    if (delivered <= promised + 30 * 60_000) onTimeOf += 1;
  }
  const onTimeRatePct = onTimeTotal > 0 ? Math.round((onTimeOf / onTimeTotal) * 100) : null;

  const totalSpendMinor = shipments.reduce((acc, s) => acc + s.amountPaid * 100, 0);

  const monthBuckets = new Map<string, number>();
  const ordered: string[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const iso = monthIsoFromDate(d);
    monthBuckets.set(iso, 0);
    ordered.push(iso);
  }
  for (const s of shipments) {
    const ref = s.lastEventAt || s.createdAt;
    if (!ref) continue;
    const iso = monthIsoFromDate(new Date(ref));
    if (monthBuckets.has(iso)) {
      monthBuckets.set(iso, (monthBuckets.get(iso) ?? 0) + s.amountPaid * 100);
    }
  }

  return {
    shipments,
    active,
    recent,
    metrics: {
      activeCount: active.length,
      deliveredThisMonth,
      onTimeRatePct,
      totalSpendMinor,
      lifetimeShipments: shipments.length,
    },
    spendByMonth: ordered.map((iso) => ({
      monthIso: iso,
      label: monthLabel(iso),
      totalMinor: monthBuckets.get(iso) ?? 0,
    })),
    hasAnyShipments: shipments.length > 0,
  };
}

function emptySnapshot(): AccountLogisticsSnapshot {
  return {
    shipments: [],
    active: [],
    recent: [],
    metrics: {
      activeCount: 0,
      deliveredThisMonth: 0,
      onTimeRatePct: null,
      totalSpendMinor: 0,
      lifetimeShipments: 0,
    },
    spendByMonth: [],
    hasAnyShipments: false,
  };
}

export function logisticsTrackUrl(trackingCode: string) {
  const base = getDivisionUrl("logistics").replace(/\/$/, "");
  return `${base}/track?code=${encodeURIComponent(trackingCode)}`;
}

export function logisticsBookUrl() {
  return `${getDivisionUrl("logistics").replace(/\/$/, "")}/book`;
}

export function logisticsQuoteUrl() {
  return `${getDivisionUrl("logistics").replace(/\/$/, "")}/quote`;
}

export function getMapboxPublicToken(): string | null {
  const tok =
    (process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "").trim() ||
    (process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "").trim();
  return tok || null;
}

/**
 * Build a Mapbox Static Images URL pinning every pickup + dropoff for the
 * supplied shipments. Returns null when the Mapbox env var is unset or no
 * geocoded shipment is supplied — callers fall back to the static
 * "geocoding pending" tile.
 */
export function buildLogisticsStaticMapUrl(
  shipments: AccountLogisticsShipment[],
  options: { width?: number; height?: number; retina?: boolean; style?: string } = {},
): string | null {
  const token = getMapboxPublicToken();
  if (!token) return null;

  const markers: string[] = [];
  const points: AccountLogisticsLatLng[] = [];
  for (const s of shipments) {
    if (s.pickup?.coord) {
      markers.push(`pin-s-c+D06F32(${s.pickup.coord.lng},${s.pickup.coord.lat})`);
      points.push(s.pickup.coord);
    }
    if (s.dropoff?.coord) {
      markers.push(`pin-s-d+1A1814(${s.dropoff.coord.lng},${s.dropoff.coord.lat})`);
      points.push(s.dropoff.coord);
    }
  }
  if (markers.length === 0) return null;

  const width = options.width ?? 960;
  const height = options.height ?? 380;
  const retina = options.retina !== false;
  const style = options.style ?? "mapbox/light-v11";
  const overlay = markers.slice(0, 25).join(",");
  const dim = `${width}x${height}${retina ? "@2x" : ""}`;

  if (points.length === 1) {
    const only = points[0]!;
    return `https://api.mapbox.com/styles/v1/${style}/static/${overlay}/${only.lng},${only.lat},11,0/${dim}?access_token=${encodeURIComponent(token)}`;
  }

  return `https://api.mapbox.com/styles/v1/${style}/static/${overlay}/auto/${dim}?access_token=${encodeURIComponent(token)}&padding=64`;
}
