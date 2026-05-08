import "server-only";

import { Truck } from "lucide-react";
import type {
  StaffDashboardModule,
  RouteEntry,
  PaletteEntry,
  NotificationCategory,
  BulkAction,
  QueueColumn,
  FilterField,
  FilterValueMap,
  BulkExportFormat,
} from "@henryco/dashboard-shell";
import { Chip } from "@henryco/dashboard-shell/components";
import { hasStaffAccessIn, type StaffViewer } from "@henryco/auth/staff";

import {
  GenericStaffQueueClient,
  STAFF_DIVISION_ACCENT,
  deriveSLABucket,
  DEFAULT_STAFF_QUEUE_FILTERS,
  formatRelative,
} from "../shared";

export type LogisticsSupabaseClient = {
  from: (table: string) => {
    select: (cols: string) => {
      order: (col: string, opts?: { ascending?: boolean }) => {
        limit: (n: number) => Promise<{
          data: Array<Record<string, unknown>> | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

export type LogisticsShipmentRow = {
  id: string;
  parcelType: string | null;
  parcelDescription: string | null;
  lifecycleStatus: string;
  paymentStatus: string;
  assignedRiderName: string | null;
  amountQuoted: number | null;
  currency: string;
  lastEventAt: string | null;
  createdAt: string;
};

export async function loadLogisticsQueueSnapshot(supabase: LogisticsSupabaseClient) {
  let rows: LogisticsShipmentRow[] = [];
  try {
    const { data } = await supabase
      .from("logistics_shipments")
      .select(
        "id,parcel_type,parcel_description,lifecycle_status,payment_status,assigned_rider_name,amount_quoted,currency,last_event_at,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(150);
    if (data) {
      rows = data.map((r) => ({
        id: String(r.id ?? ""),
        parcelType: r.parcel_type ? String(r.parcel_type) : null,
        parcelDescription: r.parcel_description ? String(r.parcel_description) : null,
        lifecycleStatus: String(r.lifecycle_status ?? "pending"),
        paymentStatus: String(r.payment_status ?? "pending"),
        assignedRiderName: r.assigned_rider_name ? String(r.assigned_rider_name) : null,
        amountQuoted: r.amount_quoted ? Number(r.amount_quoted) : null,
        currency: String(r.currency ?? "NGN"),
        lastEventAt: r.last_event_at ? String(r.last_event_at) : null,
        createdAt: String(r.created_at ?? ""),
      }));
    }
  } catch {
    // empty
  }
  let pending = 0,
    warn = 0,
    breach = 0;
  for (const r of rows) {
    if (!["delivered", "cancelled", "failed"].includes(r.lifecycleStatus)) {
      pending++;
      const bucket = deriveSLABucket(r.lastEventAt, { warningMinutes: 60 });
      if (bucket === "warning") warn++;
      if (bucket === "breach") breach++;
    }
  }
  return { rows, pendingCount: pending, slaWarningCount: warn, slaBreachCount: breach };
}

const FILTERS: ReadonlyArray<FilterField> = [
  ...DEFAULT_STAFF_QUEUE_FILTERS,
  {
    id: "rider",
    label: "Rider",
    kind: "segmented",
    options: [
      { value: "assigned", label: "Assigned" },
      { value: "unassigned", label: "Unassigned" },
    ],
  },
];

const BULK_ACTIONS: ReadonlyArray<BulkAction> = [
  {
    id: "assign-rider",
    label: "Assign rider",
    variant: "primary",
    confirmCopy: (n) => `Assign next available rider across ${n} shipment${n === 1 ? "" : "s"}.`,
  },
  {
    id: "mark-failed",
    label: "Mark failed",
    variant: "destructive",
    requiresReason: true,
    confirmCopy: (n) => `Mark ${n} shipment${n === 1 ? "" : "s"} as failed. Customer is notified.`,
  },
  {
    id: "refund",
    label: "Refund",
    variant: "destructive",
    requiresReason: true,
    confirmCopy: (n) => `Refund ${n} shipment${n === 1 ? "" : "s"}. Reason recorded in audit log.`,
  },
];

function matchesFilter(row: LogisticsShipmentRow, filters: FilterValueMap): boolean {
  const status = typeof filters.status === "string" ? filters.status : null;
  const rider = typeof filters.rider === "string" ? filters.rider : null;
  const sla = typeof filters.sla === "string" ? filters.sla : null;
  const search = typeof filters.search === "string" ? filters.search.toLowerCase() : null;

  if (status === "open" && ["delivered", "cancelled", "failed"].includes(row.lifecycleStatus)) return false;
  if (status === "in_progress" && !["picked_up", "in_transit"].includes(row.lifecycleStatus)) return false;
  if (status === "resolved" && row.lifecycleStatus !== "delivered") return false;
  if (rider === "assigned" && !row.assignedRiderName) return false;
  if (rider === "unassigned" && row.assignedRiderName) return false;
  if (sla) {
    const bucket = deriveSLABucket(row.lastEventAt, { warningMinutes: 60 });
    if (bucket !== sla) return false;
  }
  if (search && !`${row.parcelDescription ?? ""} ${row.parcelType ?? ""}`.toLowerCase().includes(search))
    return false;
  return true;
}

const COLUMNS: ReadonlyArray<QueueColumn<LogisticsShipmentRow>> = [
  {
    id: "parcel",
    label: "Parcel",
    width: "minmax(12rem, 2fr)",
    render: (row) => (
      <span>
        <strong>{row.data.parcelType ?? "Parcel"}</strong>
        {row.data.parcelDescription ? (
          <span style={{ marginLeft: "0.4rem", fontSize: "0.78rem", color: "rgba(10,10,10,0.55)" }}>
            {row.data.parcelDescription}
          </span>
        ) : null}
      </span>
    ),
  },
  {
    id: "rider",
    label: "Rider",
    width: "9rem",
    render: (row) =>
      row.data.assignedRiderName ? (
        <Chip tone="accent">{row.data.assignedRiderName}</Chip>
      ) : (
        <Chip tone="warning">Unassigned</Chip>
      ),
  },
  {
    id: "status",
    label: "Status",
    width: "8rem",
    render: (row) => (
      <Chip tone={row.data.lifecycleStatus === "delivered" ? "success" : "neutral"}>
        {row.data.lifecycleStatus}
      </Chip>
    ),
  },
  {
    id: "amount",
    label: "Amount",
    width: "8rem",
    align: "right",
    render: (row) =>
      row.data.amountQuoted !== null ? (
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {row.data.currency} {row.data.amountQuoted.toLocaleString()}
        </span>
      ) : (
        <span>—</span>
      ),
  },
  {
    id: "last",
    label: "Last event",
    width: "5rem",
    render: (row) => (
      <span style={{ fontSize: "0.74rem", color: "rgba(10,10,10,0.55)" }}>
        {formatRelative(row.data.lastEventAt)}
      </span>
    ),
  },
];

export const staffLogisticsModule: StaffDashboardModule = {
  slug: "staff-logistics",
  title: "Logistics",
  description: "Dispatch, driver coordination, quote review.",
  icon: () => <Truck size={18} aria-hidden />,
  scope: { kind: "division", division: "logistics" },
  getEligibleViewer(viewer) {
    return hasStaffAccessIn(viewer, "logistics") ? "allowed" : "hidden";
  },
  getRoleGate(viewer) {
    if (!hasStaffAccessIn(viewer, "logistics")) return null;
    return { kind: "allow", role: viewer.role };
  },
  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "", kind: "home", label: "Logistics queue" },
      { path: "[shipmentId]", kind: "detail", label: "Shipment detail", params: ["shipmentId"] },
    ];
  },
  async getCommandPaletteEntries(viewer): Promise<ReadonlyArray<PaletteEntry>> {
    if (!hasStaffAccessIn(viewer, "logistics")) return [];
    return [
      {
        id: "staff-logistics.queue",
        source: "staff-logistics",
        groupLabel: "Open" as const,
        label: "Open Logistics queue",
        kicker: "Staff",
        href: "/modules/staff-logistics",
        keywords: ["logistics", "dispatch", "rider"],
      },
    ];
  },
  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [
      { slug: "logistics.dispatch", label: "Logistics · dispatch", accent: "#C9A227", source: "staff-logistics" },
      { slug: "logistics.exception", label: "Logistics · exception", accent: "#B91C1C", source: "staff-logistics" },
    ];
  },
};

export type StaffLogisticsPageProps = {
  viewer: StaffViewer;
  supabase: LogisticsSupabaseClient;
  bulkActionHandler: (id: string, ids: string[], reason: string | null) => Promise<void>;
  exportHandler: (
    format: BulkExportFormat,
    capturedFilters: ReadonlyArray<{ label: string; value: string }>,
    visibleIds: string[],
  ) => Promise<void>;
};

export async function StaffLogisticsPageServer({ supabase, bulkActionHandler, exportHandler }: StaffLogisticsPageProps) {
  const snapshot = await loadLogisticsQueueSnapshot(supabase);
  return (
    <GenericStaffQueueClient<LogisticsShipmentRow>
      kicker="Logistics · operator"
      title="Dispatch & shipments"
      snapshot={snapshot}
      filterFields={FILTERS}
      rowAdapter={(r) => ({
        id: r.id,
        sla: deriveSLABucket(r.lastEventAt, { warningMinutes: 60 }),
        slaDueAt: r.lastEventAt ?? undefined,
        divisionAccent: STAFF_DIVISION_ACCENT.logistics,
        data: r,
      })}
      matchesFilter={matchesFilter}
      columns={COLUMNS}
      bulkActions={BULK_ACTIONS}
      onBulkAction={bulkActionHandler}
      onExport={exportHandler}
      rowDeepLink={(r) => `/modules/staff-logistics/${r.id}`}
    />
  );
}
