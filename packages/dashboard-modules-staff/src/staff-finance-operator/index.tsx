import "server-only";

import { Banknote } from "lucide-react";
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
import type { StaffViewer } from "@henryco/auth/staff";

import {
  GenericStaffQueueClient,
  STAFF_DIVISION_ACCENT,
  deriveSLABucket,
  DEFAULT_STAFF_QUEUE_FILTERS,
  formatRelative,
} from "../shared";

/**
 * staff-finance-operator — LIMITED finance surface for operators.
 *
 * Distinct from Track B owner finance (DASH-8): operators see ONLY:
 *   - payout review
 *   - refund authorization
 *   - vendor invoice approval
 *
 * Owner-only surfaces (P&L, cohorts, currency drift, brand finance)
 * are NOT mounted here.
 */

export type FinanceSupabaseClient = {
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

export type PayoutRequestRow = {
  id: string;
  amount: number;
  reference: string;
  status: string;
  vendorId: string | null;
  requestedBy: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export async function loadFinanceQueueSnapshot(supabase: FinanceSupabaseClient) {
  let rows: PayoutRequestRow[] = [];
  try {
    const { data } = await supabase
      .from("marketplace_payout_requests")
      .select("id,amount,reference,status,vendor_id,requested_by,reviewed_by,reviewed_at,created_at")
      .order("created_at", { ascending: false })
      .limit(150);
    if (data) {
      rows = data.map((r) => ({
        id: String(r.id ?? ""),
        amount: Number(r.amount ?? 0),
        reference: String(r.reference ?? ""),
        status: String(r.status ?? "pending"),
        vendorId: r.vendor_id ? String(r.vendor_id) : null,
        requestedBy: r.requested_by ? String(r.requested_by) : null,
        reviewedBy: r.reviewed_by ? String(r.reviewed_by) : null,
        reviewedAt: r.reviewed_at ? String(r.reviewed_at) : null,
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
    if (r.status === "pending" || r.status === "in_review") {
      pending++;
      // SLA: payouts must be reviewed within 24h of request.
      const targetAt = r.createdAt
        ? new Date(Date.parse(r.createdAt) + 24 * 60 * 60_000).toISOString()
        : null;
      const bucket = deriveSLABucket(targetAt);
      if (bucket === "warning") warn++;
      if (bucket === "breach") breach++;
    }
  }
  return { rows, pendingCount: pending, slaWarningCount: warn, slaBreachCount: breach };
}

const FILTERS: ReadonlyArray<FilterField> = [
  ...DEFAULT_STAFF_QUEUE_FILTERS,
  {
    id: "payout_status",
    label: "Payout state",
    kind: "segmented",
    options: [
      { value: "pending", label: "Pending" },
      { value: "approved", label: "Approved" },
      { value: "denied", label: "Denied" },
    ],
  },
];

const BULK_ACTIONS: ReadonlyArray<BulkAction> = [
  {
    id: "approve-payout",
    label: "Approve payout",
    variant: "primary",
    requiresReason: true,
    confirmCopy: (n) =>
      `Approve ${n} payout${n === 1 ? "" : "s"}. Reason recorded in audit log; funds release on next batch.`,
  },
  {
    id: "deny-payout",
    label: "Deny payout",
    variant: "destructive",
    requiresReason: true,
    confirmCopy: (n) => `Deny ${n} payout${n === 1 ? "" : "s"}. Vendor receives a denial notice with the reason.`,
  },
  {
    id: "request-info",
    label: "Request info",
    variant: "secondary",
    requiresReason: true,
    confirmCopy: (n) => `Email ${n} vendor${n === 1 ? "" : "s"} with info request below.`,
  },
];

function matchesFilter(row: PayoutRequestRow, filters: FilterValueMap): boolean {
  const status = typeof filters.status === "string" ? filters.status : null;
  const payout = typeof filters.payout_status === "string" ? filters.payout_status : null;
  const sla = typeof filters.sla === "string" ? filters.sla : null;
  const search = typeof filters.search === "string" ? filters.search.toLowerCase() : null;

  if (status === "open" && !["pending", "in_review"].includes(row.status)) return false;
  if (status === "in_progress" && row.status !== "in_review") return false;
  if (status === "resolved" && !["approved", "denied"].includes(row.status)) return false;
  if (payout && row.status !== payout) return false;
  if (sla) {
    const targetAt = row.createdAt
      ? new Date(Date.parse(row.createdAt) + 24 * 60 * 60_000).toISOString()
      : null;
    const bucket = deriveSLABucket(targetAt);
    if (bucket !== sla) return false;
  }
  if (search && !row.reference.toLowerCase().includes(search)) return false;
  return true;
}

const COLUMNS: ReadonlyArray<QueueColumn<PayoutRequestRow>> = [
  {
    id: "ref",
    label: "Reference",
    width: "minmax(10rem, 1.5fr)",
    render: (row) => (
      <span style={{ fontFamily: "ui-monospace,monospace", fontSize: "0.8rem" }}>{row.data.reference}</span>
    ),
  },
  {
    id: "amount",
    label: "Amount",
    width: "10rem",
    align: "right",
    render: (row) => (
      <span style={{ fontVariantNumeric: "tabular-nums" }}>
        ₦{row.data.amount.toLocaleString()}
      </span>
    ),
  },
  {
    id: "status",
    label: "Status",
    width: "8rem",
    render: (row) => {
      const tone =
        row.data.status === "approved"
          ? "success"
          : row.data.status === "denied"
            ? "urgent"
            : "warning";
      return <Chip tone={tone}>{row.data.status}</Chip>;
    },
  },
  {
    id: "created",
    label: "Requested",
    width: "5rem",
    render: (row) => (
      <span style={{ fontSize: "0.74rem", color: "rgba(10,10,10,0.55)" }}>
        {formatRelative(row.data.createdAt)}
      </span>
    ),
  },
];

export const staffFinanceOperatorModule: StaffDashboardModule = {
  slug: "staff-finance-operator",
  title: "Finance · operator",
  description: "Payout review, refund authorization, vendor invoice approval.",
  icon: () => <Banknote size={18} aria-hidden />,
  scope: { kind: "cross_division" },
  getEligibleViewer() {
    return "allowed";
  },
  getRoleGate(viewer) {
    return { kind: "allow", role: viewer.role };
  },
  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "", kind: "home", label: "Finance · operator queue" },
      { path: "[payoutId]", kind: "detail", label: "Payout detail", params: ["payoutId"] },
    ];
  },
  async getCommandPaletteEntries(): Promise<ReadonlyArray<PaletteEntry>> {
    return [
      {
        id: "staff-finance-operator.queue",
        source: "staff-finance-operator",
        groupLabel: "Open" as const,
        label: "Open Finance · operator queue",
        kicker: "Staff",
        href: "/modules/staff-finance-operator",
        keywords: ["finance", "payout", "refund"],
      },
    ];
  },
  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [
      { slug: "finance.payout", label: "Finance · payout", accent: "#1F8B4C", source: "staff-finance-operator" },
      { slug: "finance.refund", label: "Finance · refund", accent: "#C9A227", source: "staff-finance-operator" },
    ];
  },
};

export type StaffFinanceOperatorPageProps = {
  viewer: StaffViewer;
  supabase: FinanceSupabaseClient;
  bulkActionHandler: (id: string, ids: string[], reason: string | null) => Promise<void>;
  exportHandler: (
    format: BulkExportFormat,
    capturedFilters: ReadonlyArray<{ label: string; value: string }>,
    visibleIds: string[],
  ) => Promise<void>;
};

export async function StaffFinanceOperatorPageServer({
  supabase,
  bulkActionHandler,
  exportHandler,
}: StaffFinanceOperatorPageProps) {
  const snapshot = await loadFinanceQueueSnapshot(supabase);
  return (
    <GenericStaffQueueClient<PayoutRequestRow>
      kicker="Finance · operator"
      title="Payouts & refunds"
      description={`${snapshot.pendingCount} pending review · ${snapshot.slaBreachCount} breach · ${snapshot.slaWarningCount} warning`}
      snapshot={snapshot}
      filterFields={FILTERS}
      rowAdapter={(r) => {
        const targetAt = r.createdAt
          ? new Date(Date.parse(r.createdAt) + 24 * 60 * 60_000).toISOString()
          : null;
        return {
          id: r.id,
          sla: deriveSLABucket(targetAt),
          slaDueAt: targetAt ?? undefined,
          divisionAccent: STAFF_DIVISION_ACCENT.marketplace,
          data: r,
        };
      }}
      matchesFilter={matchesFilter}
      columns={COLUMNS}
      bulkActions={BULK_ACTIONS}
      onBulkAction={bulkActionHandler}
      onExport={exportHandler}
      rowDeepLink={(r) => `/modules/staff-finance-operator/${r.id}`}
    />
  );
}
