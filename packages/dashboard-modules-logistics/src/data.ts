import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import {
  createDataAdminClient,
  loadOperatorMembership,
  type OperatorMembershipResult,
} from "@henryco/data";
import { getDivisionUrl } from "@henryco/config";

/**
 * Module-local data layer for the logistics (Henry Onyx Logistics) home
 * widgets. Every read here uses the typed admin client from
 * `@henryco/data`; nothing mutates state.
 *
 * This mirrors the account app's `getLogisticsSnapshotForAccountUser`
 * (`apps/account/lib/logistics-module.ts`) — the same `logistics_shipments`
 * source, the same active/completed status taxonomy, and the same metric
 * derivations (active count, delivered-this-month, on-time rate, total
 * spend) — so the module's home widgets and the `/logistics` page read the
 * one truth. The package keeps its own copy because `apps/*` path aliases
 * (`@/lib/...`) are not importable from `packages/*`.
 */

export const LOGISTICS_HOME_HREF = "/logistics";

/**
 * The dispatch WINDOW (AWARE-SP5). Reads whether the viewer holds a granted
 * `logistics_role_memberships` seat (rider / dispatch / ops) and, if so,
 * deep-links into the REAL dispatch console at logistics.henryonyx.com/
 * dispatcher. The dashboard is the RECORD; the console is the TOOL — this
 * never re-implements dispatch.
 */
export function loadDispatchSnapshot(
  viewer: UnifiedViewer,
): Promise<OperatorMembershipResult | null> {
  return loadOperatorMembership(viewer, {
    table: "logistics_role_memberships",
    division: "logistics",
    workspacePath: "/dispatcher",
  });
}

export type QuickActionGroup = "Open" | "Create" | "Search";

export type QuickAction = {
  id: string;
  label: string;
  description: string;
  href: string;
  group: QuickActionGroup;
  keywords: ReadonlyArray<string>;
};

export type LogisticsActiveShipment = {
  id: string;
  trackingCode: string;
  lifecycleStatus: string;
  amountMinor: number;
  currency: string;
  lastActivityAt: string;
};

export type LogisticsMetrics = {
  /** Shipments currently in flight. */
  activeCount: number;
  /** Shipments delivered in the current calendar month. */
  deliveredThisMonth: number;
  /** On-time delivery rate as a whole percent, or null when no completed
   * shipment carried a promised-delivery timestamp to measure against. */
  onTimeRatePct: number | null;
  /** Lifetime logistics spend, in minor currency units (kobo). */
  totalSpendMinor: number;
  /** Total shipments on record for the viewer. */
  lifetimeShipments: number;
};

export type LogisticsSnapshot = {
  active: ReadonlyArray<LogisticsActiveShipment>;
  metrics: LogisticsMetrics;
  hasAnyShipments: boolean;
  currency: string;
};

// Mirrors apps/account/lib/logistics-module.ts.
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

const DEFAULT_CURRENCY = "NGN";

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

function monthIsoFromDate(d: Date): string {
  const m = d.getUTCMonth() + 1;
  return `${d.getUTCFullYear()}-${m.toString().padStart(2, "0")}`;
}

/**
 * Build the logistics snapshot for the current viewer. Returns `null`
 * when the viewer is not a customer-context viewer (owner/staff lanes
 * load their operator data elsewhere), matching the marketplace and
 * wallet modules' data-layer gate.
 */
export async function loadLogisticsSnapshot(
  viewer: UnifiedViewer,
): Promise<LogisticsSnapshot | null> {
  if (viewer.kind !== "customer") return null;

  const client = createDataAdminClient();
  const userId = viewer.user.id;
  const norm = viewer.user.email ? viewer.user.email.trim().toLowerCase() : "";

  let query = client
    .from("logistics_shipments")
    .select(
      "id, tracking_code, lifecycle_status, payment_status, amount_quoted, amount_paid, scheduled_delivery_at, last_event_at, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(48);

  query = norm
    ? query.or(`customer_user_id.eq.${userId},normalized_email.eq.${norm}`)
    : query.eq("customer_user_id", userId);

  const { data, error } = await query;
  if (error) {
    console.error("[dashboard-modules-logistics] logistics_shipments", error);
    return emptySnapshot();
  }

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  if (rows.length === 0) return emptySnapshot();

  type Row = {
    id: string;
    trackingCode: string;
    lifecycleStatus: string;
    amountMinor: number;
    scheduledDeliveryAt: string | null;
    lastEventAt: string | null;
    updatedAt: string;
    createdAt: string;
    isActive: boolean;
    isCompleted: boolean;
  };

  const shipments: Row[] = rows.map((row) => {
    const lifecycleStatus =
      typeof row.lifecycle_status === "string" && row.lifecycle_status.length > 0
        ? row.lifecycle_status
        : "pending";
    const amountPaid = safeNumber(row.amount_paid);
    const amountQuoted = safeNumber(row.amount_quoted);
    // Mirror the account page: spend is amount_paid (major NGN) → minor.
    const amountMinor = (amountPaid || amountQuoted) * 100;
    return {
      id: safeString(row.id),
      trackingCode: safeString(row.tracking_code),
      lifecycleStatus,
      amountMinor,
      scheduledDeliveryAt: nullableString(row.scheduled_delivery_at),
      lastEventAt: nullableString(row.last_event_at),
      updatedAt: safeString(row.updated_at),
      createdAt: safeString(row.created_at),
      isActive: ACTIVE_STATUSES.has(lifecycleStatus),
      isCompleted: COMPLETED_STATUSES.has(lifecycleStatus),
    };
  });

  const activeRows = shipments.filter((s) => s.isActive);
  const completed = shipments.filter((s) => s.isCompleted);

  const thisMonth = monthIsoFromDate(new Date());
  const deliveredThisMonth = completed.filter((s) => {
    const ref = s.lastEventAt || s.updatedAt || s.createdAt;
    if (!ref) return false;
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
  const onTimeRatePct =
    onTimeTotal > 0 ? Math.round((onTimeOf / onTimeTotal) * 100) : null;

  const totalSpendMinor = shipments.reduce((acc, s) => acc + s.amountMinor, 0);

  const active: LogisticsActiveShipment[] = activeRows
    .sort(
      (a, b) =>
        Date.parse(b.lastEventAt || b.updatedAt || b.createdAt) -
        Date.parse(a.lastEventAt || a.updatedAt || a.createdAt),
    )
    .slice(0, 6)
    .map((s) => ({
      id: s.id,
      trackingCode: s.trackingCode,
      lifecycleStatus: s.lifecycleStatus,
      amountMinor: s.amountMinor,
      currency: DEFAULT_CURRENCY,
      lastActivityAt: s.lastEventAt || s.updatedAt || s.createdAt,
    }));

  return {
    active,
    metrics: {
      activeCount: activeRows.length,
      deliveredThisMonth,
      onTimeRatePct,
      totalSpendMinor,
      lifetimeShipments: shipments.length,
    },
    hasAnyShipments: shipments.length > 0,
    currency: DEFAULT_CURRENCY,
  };
}

function emptySnapshot(): LogisticsSnapshot {
  return {
    active: [],
    metrics: {
      activeCount: 0,
      deliveredThisMonth: 0,
      onTimeRatePct: null,
      totalSpendMinor: 0,
      lifetimeShipments: 0,
    },
    hasAnyShipments: false,
    currency: DEFAULT_CURRENCY,
  };
}

/**
 * Canonical "book a shipment" URL on the logistics division surface.
 * Mirrors `logisticsBookUrl()` in apps/account/lib/logistics-module.ts.
 */
export function logisticsBookUrl(): string {
  return `${getDivisionUrl("logistics").replace(/\/$/, "")}/book`;
}

/**
 * Canonical public-tracking URL for a tracking code on the logistics
 * division surface. Mirrors `logisticsTrackUrl()` in the account app.
 */
export function logisticsTrackUrl(trackingCode: string): string {
  const base = getDivisionUrl("logistics").replace(/\/$/, "");
  return `${base}/track?code=${encodeURIComponent(trackingCode)}`;
}

/**
 * The logistics module's command-palette / quick-action set. Pure — no
 * data access — so the palette can render without a DB round-trip. Every
 * action lands on the live top-level `/logistics` surface.
 */
export function getLogisticsQuickActions(): ReadonlyArray<QuickAction> {
  return [
    {
      id: "logistics.book",
      label: "Book a shipment",
      description: "Send a parcel across the network.",
      href: LOGISTICS_HOME_HREF,
      group: "Create",
      keywords: ["shipment", "send", "parcel", "delivery", "book"],
    },
    {
      id: "logistics.track",
      label: "Track a shipment",
      description: "Follow your delivery in real time.",
      href: LOGISTICS_HOME_HREF,
      group: "Open",
      keywords: ["track", "shipment", "parcel", "status", "delivery"],
    },
    {
      id: "logistics.shipments",
      label: "My shipments",
      description: "Review your active and past shipments.",
      href: LOGISTICS_HOME_HREF,
      group: "Open",
      keywords: ["shipments", "history", "deliveries", "orders"],
    },
  ];
}
