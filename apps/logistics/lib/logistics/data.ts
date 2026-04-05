import "server-only";

import {
  DEFAULT_LOGISTICS_SETTINGS,
  DEFAULT_LOGISTICS_ZONES,
  LOGISTICS_PUBLIC_METRICS,
  LOGISTICS_SERVICES,
  TIMELINE_DESCRIPTIONS,
  TIMELINE_LABELS,
} from "@/lib/logistics/content";
import { DEFAULT_RATE_CARDS, calculatePromiseConfidence } from "@/lib/logistics/pricing";
import { normalizeEmail, normalizePhone } from "@/lib/env";
import { createAdminSupabase } from "@/lib/supabase";
import type {
  LogisticsAddress,
  LogisticsAssignment,
  LogisticsDashboardQueue,
  LogisticsEvent,
  LogisticsExpense,
  LogisticsIssue,
  LogisticsNotification,
  LogisticsProofOfDelivery,
  LogisticsRateCard,
  LogisticsSettings,
  LogisticsShipment,
  LogisticsTrackingPoint,
  LogisticsViewer,
  LogisticsZone,
} from "@/lib/logistics/types";

function cleanText(value?: unknown) {
  return String(value ?? "").trim();
}

function asNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function asBool(value: unknown) {
  return Boolean(value);
}

function safeObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

async function safeSelect<T>(table: string, select: string, orderBy?: string) {
  try {
    const admin = createAdminSupabase();
    let query = admin.from(table).select(select);
    if (orderBy) {
      query = query.order(orderBy, { ascending: false });
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as T[];
  } catch {
    return [] as T[];
  }
}

function mapZone(row: Record<string, unknown>): LogisticsZone {
  return {
    id: cleanText(row.id),
    key: cleanText(row.zone_key || row.key),
    name: cleanText(row.name),
    summary: cleanText(row.summary),
    city: cleanText(row.city || "Enugu"),
    region: cleanText(row.region || "Enugu"),
    baseFee: asNumber(row.base_fee, 0),
    sameDayMultiplier: asNumber(row.same_day_multiplier, 1.25),
    interCityMultiplier: asNumber(row.inter_city_multiplier, 1),
    etaHoursMin: asNumber(row.eta_hours_min, 2),
    etaHoursMax: asNumber(row.eta_hours_max, 8),
    active: row.is_active == null ? true : asBool(row.is_active),
    sortOrder: asNumber(row.sort_order, 100),
  };
}

function mapRateCard(row: Record<string, unknown>): LogisticsRateCard {
  return {
    id: cleanText(row.id),
    zoneId: cleanText(row.zone_id) || null,
    serviceType: cleanText(row.service_type) as LogisticsRateCard["serviceType"],
    urgency: cleanText(row.urgency) as LogisticsRateCard["urgency"],
    baseAmount: asNumber(row.base_amount, 0),
    weightFeePerKg: asNumber(row.weight_fee_per_kg, 0),
    fragileFee: asNumber(row.fragile_fee, 0),
    sizeSurcharge: asNumber(row.size_surcharge, 0),
    manualOnly: asBool(row.manual_only),
    active: row.is_active == null ? true : asBool(row.is_active),
  };
}

function mapAddress(row: Record<string, unknown>): LogisticsAddress {
  return {
    id: cleanText(row.id),
    shipmentId: cleanText(row.shipment_id),
    kind: cleanText(row.kind) as LogisticsAddress["kind"],
    label: cleanText(row.label),
    contactName: cleanText(row.contact_name),
    phone: cleanText(row.phone) || null,
    email: cleanText(row.email) || null,
    line1: cleanText(row.line1),
    line2: cleanText(row.line2) || null,
    city: cleanText(row.city),
    region: cleanText(row.region),
    country: cleanText(row.country || "Nigeria"),
    landmark: cleanText(row.landmark) || null,
    instructions: cleanText(row.instructions) || null,
    latitude: row.latitude == null ? null : asNumber(row.latitude),
    longitude: row.longitude == null ? null : asNumber(row.longitude),
  };
}

function mapShipment(row: Record<string, unknown>, addresses: LogisticsAddress[]): LogisticsShipment {
  const pickupAddress = addresses.find(
    (address) => address.shipmentId === cleanText(row.id) && address.kind === "pickup"
  );
  const dropoffAddress = addresses.find(
    (address) => address.shipmentId === cleanText(row.id) && address.kind === "dropoff"
  );
  const breakdown = safeObject(row.pricing_breakdown);
  const zoneLabel = cleanText(row.zone_label) || cleanText(breakdown.zoneLabel);
  const lifecycleStatus = cleanText(row.lifecycle_status || row.status) as LogisticsShipment["lifecycleStatus"];

  return {
    id: cleanText(row.id),
    trackingCode: cleanText(row.tracking_code),
    requestType: cleanText(row.request_type) as LogisticsShipment["requestType"],
    serviceType: cleanText(row.service_type) as LogisticsShipment["serviceType"],
    lifecycleStatus,
    paymentStatus: cleanText(row.payment_status) as LogisticsShipment["paymentStatus"],
    pricingStatus: cleanText(row.pricing_status) as LogisticsShipment["pricingStatus"],
    customerUserId: cleanText(row.customer_user_id) || null,
    normalizedEmail: normalizeEmail(row.normalized_email as string | null),
    senderName: cleanText(row.sender_name),
    senderPhone: cleanText(row.sender_phone) || null,
    senderEmail: cleanText(row.sender_email) || null,
    recipientName: cleanText(row.recipient_name),
    recipientPhone: cleanText(row.recipient_phone) || null,
    recipientEmail: cleanText(row.recipient_email) || null,
    parcelType: cleanText(row.parcel_type || "Parcel"),
    parcelDescription: cleanText(row.parcel_description) || null,
    fragile: asBool(row.fragile),
    weightKg: asNumber(row.weight_kg, 0),
    sizeTier: cleanText(row.size_tier || "small") as LogisticsShipment["sizeTier"],
    urgency: cleanText(row.urgency || "standard") as LogisticsShipment["urgency"],
    zoneId: cleanText(row.zone_id) || null,
    zoneLabel: zoneLabel || null,
    scheduledPickupAt: cleanText(row.scheduled_pickup_at) || null,
    scheduledDeliveryAt: cleanText(row.scheduled_delivery_at) || null,
    assignedRiderUserId: cleanText(row.assigned_rider_user_id) || null,
    assignedRiderName: cleanText(row.assigned_rider_name) || null,
    paymentReference: cleanText(row.payment_reference) || null,
    amountQuoted: asNumber(row.amount_quoted, asNumber(breakdown.total)),
    amountPaid: asNumber(row.amount_paid, 0),
    pricingBreakdown: {
      currency: cleanText(breakdown.currency || "NGN"),
      zoneLabel,
      serviceType: cleanText(breakdown.serviceType || row.service_type || "scheduled") as LogisticsShipment["serviceType"],
      urgency: cleanText(breakdown.urgency || row.urgency || "standard") as LogisticsShipment["urgency"],
      baseFee: asNumber(breakdown.baseFee, 0),
      urgencyFee: asNumber(breakdown.urgencyFee, 0),
      weightFee: asNumber(breakdown.weightFee, 0),
      sizeFee: asNumber(breakdown.sizeFee, 0),
      fragileFee: asNumber(breakdown.fragileFee, 0),
      interCityFee: asNumber(breakdown.interCityFee, 0),
      manualAdjustment: asNumber(breakdown.manualAdjustment, 0),
      total: asNumber(breakdown.total, asNumber(row.amount_quoted, 0)),
      promiseWindowHours: Array.isArray(breakdown.promiseWindowHours)
        ? [
            asNumber((breakdown.promiseWindowHours as unknown[])[0], 2),
            asNumber((breakdown.promiseWindowHours as unknown[])[1], 8),
          ]
        : [2, 8],
      promiseConfidence: asNumber(
        breakdown.promiseConfidence,
        calculatePromiseConfidence({
          zone: DEFAULT_LOGISTICS_ZONES[0],
          urgency: cleanText(row.urgency || "standard") as LogisticsShipment["urgency"],
          serviceType: cleanText(row.service_type || "scheduled") as LogisticsShipment["serviceType"],
          sizeTier: cleanText(row.size_tier || "small") as LogisticsShipment["sizeTier"],
        })
      ),
    },
    overrideMeta: safeObject(row.override_meta),
    supportSummary: cleanText(row.support_summary) || null,
    requiresPod: row.requires_pod == null ? true : asBool(row.requires_pod),
    lastEventAt: cleanText(row.last_event_at) || null,
    createdAt: cleanText(row.created_at),
    updatedAt: cleanText(row.updated_at),
    pickupAddress: pickupAddress ?? null,
    dropoffAddress: dropoffAddress ?? null,
  };
}

function mapAssignment(row: Record<string, unknown>): LogisticsAssignment {
  return {
    id: cleanText(row.id),
    shipmentId: cleanText(row.shipment_id),
    riderUserId: cleanText(row.rider_user_id) || null,
    riderName: cleanText(row.rider_name) || null,
    riderPhone: cleanText(row.rider_phone) || null,
    assignedByUserId: cleanText(row.assigned_by_user_id) || null,
    assignedByName: cleanText(row.assigned_by_name) || null,
    etaCommittedAt: cleanText(row.eta_committed_at) || null,
    status: cleanText(row.status || "assigned") as LogisticsAssignment["status"],
    notes: cleanText(row.notes) || null,
    createdAt: cleanText(row.created_at),
  };
}

function mapEvent(row: Record<string, unknown>): LogisticsEvent {
  return {
    id: cleanText(row.id),
    shipmentId: cleanText(row.shipment_id),
    eventType: cleanText(row.event_type),
    lifecycleStatus: cleanText(row.lifecycle_status) as LogisticsEvent["lifecycleStatus"],
    title: cleanText(row.title),
    description: cleanText(row.description),
    actorUserId: cleanText(row.actor_user_id) || null,
    actorName: cleanText(row.actor_name) || null,
    actorRole: cleanText(row.actor_role) || null,
    meta: safeObject(row.meta),
    customerVisible: row.customer_visible == null ? true : asBool(row.customer_visible),
    createdAt: cleanText(row.created_at),
  };
}

function mapProof(row: Record<string, unknown>): LogisticsProofOfDelivery {
  return {
    id: cleanText(row.id),
    shipmentId: cleanText(row.shipment_id),
    recipientName: cleanText(row.recipient_name),
    deliveredAt: cleanText(row.delivered_at),
    proofType: cleanText(row.proof_type) as LogisticsProofOfDelivery["proofType"],
    note: cleanText(row.note) || null,
    photoPath: cleanText(row.photo_path) || null,
    signaturePath: cleanText(row.signature_path) || null,
    geoLat: row.geo_lat == null ? null : asNumber(row.geo_lat),
    geoLng: row.geo_lng == null ? null : asNumber(row.geo_lng),
    createdAt: cleanText(row.created_at),
  };
}

function mapIssue(row: Record<string, unknown>): LogisticsIssue {
  return {
    id: cleanText(row.id),
    shipmentId: cleanText(row.shipment_id),
    severity: cleanText(row.severity || "medium") as LogisticsIssue["severity"],
    status: cleanText(row.status || "open") as LogisticsIssue["status"],
    issueType: cleanText(row.issue_type),
    summary: cleanText(row.summary),
    details: cleanText(row.details),
    openedByUserId: cleanText(row.opened_by_user_id) || null,
    ownerUserId: cleanText(row.owner_user_id) || null,
    resolution: cleanText(row.resolution) || null,
    createdAt: cleanText(row.created_at),
    updatedAt: cleanText(row.updated_at),
  };
}

function mapExpense(row: Record<string, unknown>): LogisticsExpense {
  return {
    id: cleanText(row.id),
    shipmentId: cleanText(row.shipment_id) || null,
    riderUserId: cleanText(row.rider_user_id) || null,
    category: cleanText(row.category),
    amount: asNumber(row.amount, 0),
    currency: cleanText(row.currency || "NGN"),
    note: cleanText(row.note) || null,
    receiptPath: cleanText(row.receipt_path) || null,
    status: cleanText(row.status || "submitted") as LogisticsExpense["status"],
    createdAt: cleanText(row.created_at),
  };
}

function mapTrackingPoint(row: Record<string, unknown>): LogisticsTrackingPoint {
  return {
    id: cleanText(row.id),
    shipmentId: cleanText(row.shipment_id),
    latitude: asNumber(row.latitude),
    longitude: asNumber(row.longitude),
    accuracyMeters: row.accuracy_meters == null ? null : asNumber(row.accuracy_meters),
    source: cleanText(row.source || "rider_app"),
    recordedAt: cleanText(row.recorded_at),
  };
}

function mapNotification(row: Record<string, unknown>): LogisticsNotification {
  return {
    id: cleanText(row.id),
    shipmentId: cleanText(row.shipment_id) || null,
    channel: cleanText(row.channel) as LogisticsNotification["channel"],
    templateKey: cleanText(row.template_key),
    recipient: cleanText(row.recipient),
    subject: cleanText(row.subject),
    status: cleanText(row.status || "queued") as LogisticsNotification["status"],
    reason: cleanText(row.reason) || null,
    meta: safeObject(row.meta),
    createdAt: cleanText(row.created_at),
  };
}

export async function getLogisticsSettings(): Promise<LogisticsSettings> {
  try {
    const admin = createAdminSupabase();
    const { data } = await admin
      .from("logistics_settings")
      .select("key, value")
      .order("created_at", { ascending: false });

    const merged = { ...DEFAULT_LOGISTICS_SETTINGS };
    for (const row of (data ?? []) as Array<{ key?: string | null; value?: Record<string, unknown> | null }>) {
      if (row.key === "platform" && row.value) {
        Object.assign(merged, row.value);
      }
    }
    return merged;
  } catch {
    return DEFAULT_LOGISTICS_SETTINGS;
  }
}

export async function getLogisticsZones() {
  const rows = await safeSelect<Record<string, unknown>>(
    "logistics_zones",
    "id, zone_key, name, summary, city, region, base_fee, same_day_multiplier, inter_city_multiplier, eta_hours_min, eta_hours_max, is_active, sort_order",
    "sort_order"
  );
  const zones = rows.map(mapZone).filter((zone) => zone.active);
  return zones.length > 0 ? zones.sort((a, b) => a.sortOrder - b.sortOrder) : DEFAULT_LOGISTICS_ZONES;
}

export async function getLogisticsRateCards() {
  const rows = await safeSelect<Record<string, unknown>>(
    "logistics_rate_cards",
    "id, zone_id, service_type, urgency, base_amount, weight_fee_per_kg, fragile_fee, size_surcharge, manual_only, is_active",
    "created_at"
  );
  const rates = rows.map(mapRateCard).filter((rate) => rate.active);
  return rates.length > 0 ? rates : DEFAULT_RATE_CARDS;
}

export async function getLogisticsSnapshot() {
  const [
    zones,
    rateCards,
    addressesRaw,
    shipmentsRaw,
    assignmentsRaw,
    eventsRaw,
    proofsRaw,
    issuesRaw,
    expensesRaw,
    notificationsRaw,
    settings,
  ] = await Promise.all([
    getLogisticsZones(),
    getLogisticsRateCards(),
    safeSelect<Record<string, unknown>>(
      "logistics_addresses",
      "id, shipment_id, kind, label, contact_name, phone, email, line1, line2, city, region, country, landmark, instructions, latitude, longitude",
      "created_at"
    ),
    safeSelect<Record<string, unknown>>(
      "logistics_shipments",
      "id, tracking_code, request_type, service_type, lifecycle_status, payment_status, pricing_status, customer_user_id, normalized_email, sender_name, sender_phone, sender_email, recipient_name, recipient_phone, recipient_email, parcel_type, parcel_description, fragile, weight_kg, size_tier, urgency, zone_id, zone_label, scheduled_pickup_at, scheduled_delivery_at, assigned_rider_user_id, assigned_rider_name, payment_reference, amount_quoted, amount_paid, pricing_breakdown, override_meta, support_summary, requires_pod, last_event_at, created_at, updated_at",
      "created_at"
    ),
    safeSelect<Record<string, unknown>>(
      "logistics_assignments",
      "id, shipment_id, rider_user_id, rider_name, rider_phone, assigned_by_user_id, assigned_by_name, eta_committed_at, status, notes, created_at",
      "created_at"
    ),
    safeSelect<Record<string, unknown>>(
      "logistics_events",
      "id, shipment_id, event_type, lifecycle_status, title, description, actor_user_id, actor_name, actor_role, meta, customer_visible, created_at",
      "created_at"
    ),
    safeSelect<Record<string, unknown>>(
      "logistics_proof_of_delivery",
      "id, shipment_id, recipient_name, delivered_at, proof_type, note, photo_path, signature_path, geo_lat, geo_lng, created_at",
      "created_at"
    ),
    safeSelect<Record<string, unknown>>(
      "logistics_issues",
      "id, shipment_id, severity, status, issue_type, summary, details, opened_by_user_id, owner_user_id, resolution, created_at, updated_at",
      "created_at"
    ),
    safeSelect<Record<string, unknown>>(
      "logistics_expenses",
      "id, shipment_id, rider_user_id, category, amount, currency, note, receipt_path, status, created_at",
      "created_at"
    ),
    safeSelect<Record<string, unknown>>(
      "logistics_notifications",
      "id, shipment_id, channel, template_key, recipient, subject, status, reason, meta, created_at",
      "created_at"
    ),
    getLogisticsSettings(),
  ]);

  const addresses = addressesRaw.map(mapAddress);
  const shipments = shipmentsRaw.map((row) => mapShipment(row, addresses));

  return {
    settings,
    zones,
    rateCards,
    addresses,
    shipments,
    assignments: assignmentsRaw.map(mapAssignment),
    events: eventsRaw.map(mapEvent),
    proofs: proofsRaw.map(mapProof),
    issues: issuesRaw.map(mapIssue),
    expenses: expensesRaw.map(mapExpense),
    notifications: notificationsRaw.map(mapNotification),
  };
}

export async function getPublicLogisticsSnapshot() {
  const snapshot = await getLogisticsSnapshot();
  const shipmentCount = snapshot.shipments.length;
  const deliveredCount = snapshot.shipments.filter((shipment) => shipment.lifecycleStatus === "delivered").length;
  const issueCount = snapshot.issues.filter((issue) => issue.status !== "resolved").length;

  return {
    settings: snapshot.settings,
    services: LOGISTICS_SERVICES,
    metrics: LOGISTICS_PUBLIC_METRICS,
    zones: snapshot.zones,
    rateCards: snapshot.rateCards,
    stats: {
      shipmentCount,
      deliveredCount,
      issueCount,
      activeZones: snapshot.zones.filter((zone) => zone.active).length,
    },
  };
}

export async function getShipmentByTrackingLookup(input: {
  trackingCode?: string | null;
  phone?: string | null;
}) {
  const snapshot = await getLogisticsSnapshot();
  const trackingCode = cleanText(input.trackingCode).toUpperCase().replace(/\s+/g, "");
  const normalizedPhone = normalizePhone(input.phone);
  if (!trackingCode || !normalizedPhone) {
    return null;
  }

  const phonesMatch = (raw: string | null | undefined) => {
    const n = normalizePhone(raw);
    return Boolean(n && n === normalizedPhone);
  };

  return (
    snapshot.shipments.find(
      (shipment) =>
        shipment.trackingCode.toUpperCase().replace(/\s+/g, "") === trackingCode &&
        (phonesMatch(shipment.senderPhone) ||
          phonesMatch(shipment.recipientPhone) ||
          phonesMatch(shipment.pickupAddress?.phone) ||
          phonesMatch(shipment.dropoffAddress?.phone))
    ) ?? null
  );
}

export async function getTrackingPointsForShipment(shipmentId: string, limit = 48): Promise<LogisticsTrackingPoint[]> {
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("logistics_tracking_points")
      .select("id, shipment_id, latitude, longitude, accuracy_meters, source, recorded_at")
      .eq("shipment_id", shipmentId)
      .order("recorded_at", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((row) => mapTrackingPoint(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function getShipmentDetail(shipmentId: string) {
  const snapshot = await getLogisticsSnapshot();
  const shipment = snapshot.shipments.find((item) => item.id === shipmentId) ?? null;

  if (!shipment) return null;

  const trackingPoints = await getTrackingPointsForShipment(shipmentId);

  return {
    shipment,
    events: snapshot.events
      .filter((event) => event.shipmentId === shipmentId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
    assignments: snapshot.assignments.filter((assignment) => assignment.shipmentId === shipmentId),
    proof: snapshot.proofs.find((proof) => proof.shipmentId === shipmentId) ?? null,
    issues: snapshot.issues.filter((issue) => issue.shipmentId === shipmentId),
    expenses: snapshot.expenses.filter((expense) => expense.shipmentId === shipmentId),
    trackingPoints,
  };
}

export async function getCustomerShipments(viewer: LogisticsViewer) {
  const snapshot = await getLogisticsSnapshot();
  return snapshot.shipments.filter(
    (shipment) =>
      (viewer.user?.id && shipment.customerUserId === viewer.user.id) ||
      (viewer.normalizedEmail && shipment.normalizedEmail === viewer.normalizedEmail)
  );
}

function isResolvedShipment(shipment: LogisticsShipment) {
  return ["delivered", "returned", "cancelled"].includes(shipment.lifecycleStatus);
}

function isStaleShipment(shipment: LogisticsShipment, hours = 12) {
  if (isResolvedShipment(shipment)) return false;
  const updated = new Date(shipment.updatedAt || shipment.createdAt);
  if (Number.isNaN(updated.getTime())) return false;
  return Date.now() - updated.getTime() >= hours * 3_600_000;
}

function isDelayedShipment(shipment: LogisticsShipment) {
  return shipment.lifecycleStatus === "delayed" || shipment.lifecycleStatus === "failed_delivery";
}

export function groupShipmentsForDispatch(shipments: LogisticsShipment[]): LogisticsDashboardQueue[] {
  const unassigned = shipments.filter(
    (shipment) =>
      !isResolvedShipment(shipment) &&
      !shipment.assignedRiderUserId &&
      ["booked", "awaiting_payment", "quoted", "assigned"].includes(shipment.lifecycleStatus)
  );
  const delayed = shipments.filter((shipment) => !isResolvedShipment(shipment) && isDelayedShipment(shipment));
  const stale = shipments.filter(
    (shipment) =>
      !isResolvedShipment(shipment) &&
      !delayed.some((item) => item.id === shipment.id) &&
      isStaleShipment(shipment)
  );
  const active = shipments.filter(
    (shipment) =>
      !isResolvedShipment(shipment) &&
      !delayed.some((item) => item.id === shipment.id) &&
      !stale.some((item) => item.id === shipment.id) &&
      !unassigned.some((item) => item.id === shipment.id)
  );

  return [
    {
      id: "unassigned",
      title: "Unassigned",
      description: "Shipment requests that still need rider ownership.",
      tone: "warning",
      shipments: unassigned,
    },
    {
      id: "delayed",
      title: "Delayed or failed attempts",
      description: "Shipments that need immediate operator action.",
      tone: "critical",
      shipments: delayed,
    },
    {
      id: "stale",
      title: "Stale shipments",
      description: "Active shipments without recent movement.",
      tone: "warning",
      shipments: stale,
    },
    {
      id: "active",
      title: "In motion",
      description: "Assigned shipments that are progressing cleanly.",
      tone: "info",
      shipments: active,
    },
  ];
}

export async function getDispatchDashboardData() {
  const snapshot = await getLogisticsSnapshot();
  return {
    ...snapshot,
    queues: groupShipmentsForDispatch(snapshot.shipments),
  };
}

export async function getRiderDashboardData(viewer: LogisticsViewer) {
  const snapshot = await getLogisticsSnapshot();
  const riderShipments = snapshot.shipments.filter(
    (shipment) =>
      viewer.user?.id &&
      (shipment.assignedRiderUserId === viewer.user.id ||
        snapshot.assignments.some(
          (assignment) => assignment.shipmentId === shipment.id && assignment.riderUserId === viewer.user?.id
        ))
  );

  return {
    ...snapshot,
    riderShipments,
  };
}

export async function getFinanceDashboardData() {
  const snapshot = await getLogisticsSnapshot();
  const quoted = snapshot.shipments.reduce((sum, shipment) => sum + shipment.amountQuoted, 0);
  const paid = snapshot.shipments.reduce((sum, shipment) => sum + shipment.amountPaid, 0);
  const expenses = snapshot.expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return {
    ...snapshot,
    totals: {
      quoted,
      paid,
      expenses,
      margin: paid - expenses,
    },
  };
}

export async function getSupportDashboardData() {
  const snapshot = await getLogisticsSnapshot();
  const escalations = snapshot.issues.filter((issue) => issue.status !== "resolved");
  return {
    ...snapshot,
    escalations,
  };
}

export function buildTrackingTimeline(shipment: LogisticsShipment, events: LogisticsEvent[]) {
  const baseSteps = [
    "quote_requested",
    "quoted",
    "awaiting_payment",
    "booked",
    "assigned",
    "pickup_confirmed",
    "in_transit",
    "delayed",
    "attempted_delivery",
    "delivered",
    "failed_delivery",
    "return_initiated",
    "returned",
    "cancelled",
  ] as const;

  const currentIndex = baseSteps.indexOf(shipment.lifecycleStatus);
  return baseSteps
    .filter((status) => {
      if (status === "delayed") return shipment.lifecycleStatus === "delayed";
      if (status === "failed_delivery") return shipment.lifecycleStatus === "failed_delivery";
      if (status === "return_initiated") return ["return_initiated", "returned"].includes(shipment.lifecycleStatus);
      if (status === "returned") return shipment.lifecycleStatus === "returned";
      if (status === "cancelled") return shipment.lifecycleStatus === "cancelled";
      return currentIndex >= 0 ? baseSteps.indexOf(status) <= currentIndex : false;
    })
    .map((status) => {
      const relatedEvent =
        [...events]
          .reverse()
          .find((event) => event.lifecycleStatus === status || event.eventType === status) ?? null;
      return {
        key: status,
        label: TIMELINE_LABELS[status] || status.replaceAll("_", " "),
        description: TIMELINE_DESCRIPTIONS[status] || "Shipment event recorded.",
        when: relatedEvent?.createdAt || null,
        active: shipment.lifecycleStatus === status,
      };
    });
}
