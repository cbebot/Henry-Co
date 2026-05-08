import "server-only";

import { ShoppingBag } from "lucide-react";
import type {
  StaffDashboardModule,
  RouteEntry,
  PaletteEntry,
  NotificationCategory,
  BulkAction,
  QueueColumn,
  QueueRow,
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

export type MarketplaceQueueClient = {
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

export type MarketplaceOrderRow = {
  id: string;
  orderNumber: string;
  customerName: string;
  vendorName: string | null;
  status: string;
  totalAmount: number;
  createdAt: string;
  shippingDeadlineAt: string | null;
  disputeOpen: boolean;
};

export type MarketplaceQueueSnapshot = {
  rows: ReadonlyArray<MarketplaceOrderRow>;
  pendingCount: number;
  slaWarningCount: number;
  slaBreachCount: number;
};

export async function loadMarketplaceQueueSnapshot(
  supabase: MarketplaceQueueClient,
): Promise<MarketplaceQueueSnapshot> {
  let rows: MarketplaceOrderRow[] = [];
  try {
    const { data } = await supabase
      .from("marketplace_orders")
      .select(
        "id,order_number,customer_name,vendor_name,status,total_amount,created_at,shipping_deadline_at,dispute_open",
      )
      .order("created_at", { ascending: false })
      .limit(150);
    if (data) {
      rows = data.map((r) => ({
        id: String(r.id ?? ""),
        orderNumber: String(r.order_number ?? r.id ?? ""),
        customerName: String(r.customer_name ?? "—"),
        vendorName: r.vendor_name ? String(r.vendor_name) : null,
        status: String(r.status ?? "—"),
        totalAmount: Number(r.total_amount ?? 0),
        createdAt: String(r.created_at ?? ""),
        shippingDeadlineAt: r.shipping_deadline_at ? String(r.shipping_deadline_at) : null,
        disputeOpen: Boolean(r.dispute_open ?? false),
      }));
    }
  } catch {
    // empty fallback
  }
  let pending = 0,
    warn = 0,
    breach = 0;
  for (const r of rows) {
    if (!["delivered", "completed", "cancelled", "refunded"].includes(r.status)) {
      pending++;
      const bucket = deriveSLABucket(r.shippingDeadlineAt, {
        donePredicate: r.status === "delivered",
      });
      if (bucket === "warning") warn++;
      if (bucket === "breach") breach++;
    }
  }
  return { rows, pendingCount: pending, slaWarningCount: warn, slaBreachCount: breach };
}

const FILTERS: ReadonlyArray<FilterField> = [
  ...DEFAULT_STAFF_QUEUE_FILTERS,
  {
    id: "dispute",
    label: "Dispute",
    kind: "segmented",
    options: [
      { value: "open", label: "Open" },
      { value: "none", label: "None" },
    ],
  },
];

const BULK_ACTIONS: ReadonlyArray<BulkAction> = [
  {
    id: "approve-shipment",
    label: "Approve shipment",
    variant: "primary",
    confirmCopy: (n) => `Approve shipment for ${n} orders.`,
  },
  {
    id: "mark-disputed",
    label: "Open dispute",
    variant: "secondary",
    requiresReason: true,
    confirmCopy: (n) => `Open a dispute on ${n} orders. Reason recorded in audit log.`,
  },
  {
    id: "refund",
    label: "Refund",
    variant: "destructive",
    requiresReason: true,
    confirmCopy: (n) => `Refund ${n} orders. This is irreversible.`,
  },
];

function matchesFilter(row: MarketplaceOrderRow, filters: FilterValueMap): boolean {
  const status = typeof filters.status === "string" ? filters.status : null;
  const dispute = typeof filters.dispute === "string" ? filters.dispute : null;
  const sla = typeof filters.sla === "string" ? filters.sla : null;
  const search = typeof filters.search === "string" ? filters.search.toLowerCase() : null;
  const dr = filters.createdAt as { from?: string; to?: string } | null | undefined;

  if (status === "open" && ["delivered", "completed", "cancelled", "refunded"].includes(row.status))
    return false;
  if (status === "in_progress" && !["paid", "shipped", "in_transit"].includes(row.status)) return false;
  if (status === "escalated" && !row.disputeOpen) return false;
  if (status === "resolved" && row.status !== "delivered" && row.status !== "completed") return false;

  if (dispute === "open" && !row.disputeOpen) return false;
  if (dispute === "none" && row.disputeOpen) return false;

  if (sla) {
    const bucket = deriveSLABucket(row.shippingDeadlineAt, {
      donePredicate: row.status === "delivered",
    });
    if (bucket !== sla) return false;
  }

  if (search) {
    const hay = `${row.orderNumber} ${row.customerName} ${row.vendorName ?? ""}`.toLowerCase();
    if (!hay.includes(search)) return false;
  }

  if (dr?.from && row.createdAt < dr.from) return false;
  if (dr?.to && row.createdAt > dr.to) return false;
  return true;
}

const COLUMNS: ReadonlyArray<QueueColumn<MarketplaceOrderRow>> = [
  {
    id: "order",
    label: "Order",
    width: "10rem",
    render: (row) => (
      <span style={{ fontFamily: "ui-monospace,monospace", fontSize: "0.8rem" }}>
        {row.data.orderNumber}
      </span>
    ),
  },
  {
    id: "customer",
    label: "Customer",
    width: "minmax(10rem,1fr)",
    render: (row) => <strong>{row.data.customerName}</strong>,
  },
  {
    id: "vendor",
    label: "Vendor",
    width: "minmax(8rem,1fr)",
    render: (row) =>
      row.data.vendorName ? <Chip tone="neutral">{row.data.vendorName}</Chip> : <span>—</span>,
  },
  {
    id: "status",
    label: "Status",
    width: "8rem",
    render: (row) => {
      const tone =
        row.data.status === "delivered" || row.data.status === "completed"
          ? "success"
          : row.data.disputeOpen
            ? "urgent"
            : "neutral";
      return <Chip tone={tone}>{row.data.status}</Chip>;
    },
  },
  {
    id: "total",
    label: "Total",
    width: "7rem",
    align: "right",
    render: (row) => (
      <span style={{ fontVariantNumeric: "tabular-nums" }}>
        ₦{row.data.totalAmount.toLocaleString()}
      </span>
    ),
  },
  {
    id: "created",
    label: "Created",
    width: "5rem",
    render: (row) => (
      <span style={{ fontSize: "0.74rem", color: "rgba(10,10,10,0.55)" }}>
        {formatRelative(row.data.createdAt)}
      </span>
    ),
  },
];

export const staffMarketplaceModule: StaffDashboardModule = {
  slug: "staff-marketplace",
  title: "Marketplace",
  description: "Orders, disputes, vendor applications, payout reconciliation.",
  icon: () => <ShoppingBag size={18} aria-hidden />,
  scope: { kind: "division", division: "marketplace" },
  getEligibleViewer(viewer) {
    return hasStaffAccessIn(viewer, "marketplace") ? "allowed" : "hidden";
  },
  getRoleGate(viewer) {
    if (!hasStaffAccessIn(viewer, "marketplace")) return null;
    return { kind: "allow", role: viewer.role };
  },
  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "", kind: "home", label: "Marketplace queue" },
      { path: "orders/[orderId]", kind: "detail", label: "Order detail", params: ["orderId"] },
    ];
  },
  async getCommandPaletteEntries(viewer): Promise<ReadonlyArray<PaletteEntry>> {
    if (!hasStaffAccessIn(viewer, "marketplace")) return [];
    return [
      {
        id: "staff-marketplace.queue",
        source: "staff-marketplace",
        groupLabel: "Open" as const,
        label: "Open Marketplace queue",
        kicker: "Staff",
        href: "/modules/staff-marketplace",
        keywords: ["marketplace", "orders", "disputes"],
      },
      {
        id: "staff-marketplace.disputes",
        source: "staff-marketplace",
        groupLabel: "Open" as const,
        label: "Marketplace · open disputes",
        kicker: "Staff",
        href: "/modules/staff-marketplace?dispute=open",
        keywords: ["dispute", "chargeback"],
      },
    ];
  },
  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [
      { slug: "marketplace.dispute", label: "Marketplace · dispute", accent: "#B91C1C", source: "staff-marketplace" },
      { slug: "marketplace.order", label: "Marketplace · order", accent: "#C04A1F", source: "staff-marketplace" },
      { slug: "marketplace.application", label: "Marketplace · vendor app", accent: "#C9A227", source: "staff-marketplace" },
    ];
  },
};

export type StaffMarketplacePageProps = {
  viewer: StaffViewer;
  supabase: MarketplaceQueueClient;
  bulkActionHandler: (
    actionId: string,
    selectedIds: string[],
    reason: string | null,
  ) => Promise<void>;
  exportHandler: (
    format: BulkExportFormat,
    capturedFilters: ReadonlyArray<{ label: string; value: string }>,
    visibleIds: string[],
  ) => Promise<void>;
};

export async function StaffMarketplacePageServer({
  supabase,
  bulkActionHandler,
  exportHandler,
}: StaffMarketplacePageProps) {
  const snapshot = await loadMarketplaceQueueSnapshot(supabase);
  const adapted = snapshot.rows.map((r): QueueRow<MarketplaceOrderRow> => ({
    id: r.id,
    sla: deriveSLABucket(r.shippingDeadlineAt, { donePredicate: r.status === "delivered" }),
    slaDueAt: r.shippingDeadlineAt ?? undefined,
    divisionAccent: STAFF_DIVISION_ACCENT.marketplace,
    data: r,
  }));
  return (
    <GenericStaffQueueClient<MarketplaceOrderRow>
      kicker="Marketplace · operator"
      title="Orders & disputes"
      snapshot={{
        rows: snapshot.rows,
        pendingCount: snapshot.pendingCount,
        slaWarningCount: snapshot.slaWarningCount,
        slaBreachCount: snapshot.slaBreachCount,
      }}
      filterFields={FILTERS}
      rowAdapter={(r) => adapted.find((a) => a.id === r.id) ?? {
        id: r.id,
        sla: "done",
        divisionAccent: STAFF_DIVISION_ACCENT.marketplace,
        data: r,
      }}
      matchesFilter={matchesFilter}
      columns={COLUMNS}
      bulkActions={BULK_ACTIONS}
      onBulkAction={bulkActionHandler}
      onExport={exportHandler}
      rowDeepLink={(r) => `/modules/staff-marketplace/orders/${r.id}`}
    />
  );
}
