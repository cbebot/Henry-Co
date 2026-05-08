import "server-only";

import { LifeBuoy } from "lucide-react";
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

export type SupportSupabaseClient = {
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

export type SupportThreadRow = {
  id: string;
  subject: string;
  status: string;
  priority: string | null;
  category: string | null;
  division: string | null;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  staffLastReadAt: string | null;
};

export async function loadSupportQueueSnapshot(supabase: SupportSupabaseClient) {
  let rows: SupportThreadRow[] = [];
  try {
    const { data } = await supabase
      .from("support_threads")
      .select(
        "id,subject,status,priority,category,division,assigned_to,created_at,updated_at,staff_last_read_at",
      )
      .order("updated_at", { ascending: false })
      .limit(150);
    if (data) {
      rows = data.map((r) => ({
        id: String(r.id ?? ""),
        subject: String(r.subject ?? "—"),
        status: String(r.status ?? "open"),
        priority: r.priority ? String(r.priority) : null,
        category: r.category ? String(r.category) : null,
        division: r.division ? String(r.division) : null,
        assignedTo: r.assigned_to ? String(r.assigned_to) : null,
        createdAt: String(r.created_at ?? ""),
        updatedAt: String(r.updated_at ?? ""),
        staffLastReadAt: r.staff_last_read_at ? String(r.staff_last_read_at) : null,
      }));
    }
  } catch {
    // empty
  }
  let pending = 0,
    warn = 0,
    breach = 0;
  for (const r of rows) {
    if (!["closed", "resolved"].includes(r.status)) {
      pending++;
      // SLA target = first response within 1h of last customer message;
      // here we proxy with updatedAt vs staffLastReadAt.
      const targetAt = r.updatedAt
        ? new Date(Date.parse(r.updatedAt) + 60 * 60_000).toISOString()
        : null;
      const bucket = deriveSLABucket(targetAt, {
        warningMinutes: 30,
        donePredicate:
          r.staffLastReadAt !== null && r.updatedAt
            ? Date.parse(r.staffLastReadAt) >= Date.parse(r.updatedAt)
            : false,
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
    id: "division",
    label: "Division",
    kind: "select",
    options: [
      { value: "care", label: "Care" },
      { value: "marketplace", label: "Marketplace" },
      { value: "property", label: "Property" },
      { value: "studio", label: "Studio" },
      { value: "jobs", label: "Jobs" },
      { value: "learn", label: "Learn" },
      { value: "logistics", label: "Logistics" },
      { value: "account", label: "Account" },
    ],
  },
  {
    id: "priority",
    label: "Priority",
    kind: "segmented",
    options: [
      { value: "high", label: "High" },
      { value: "normal", label: "Normal" },
      { value: "low", label: "Low" },
    ],
  },
];

const BULK_ACTIONS: ReadonlyArray<BulkAction> = [
  {
    id: "assign-to-me",
    label: "Assign to me",
    variant: "primary",
    confirmCopy: (n) => `Take ownership of ${n} thread${n === 1 ? "" : "s"}.`,
  },
  {
    id: "escalate",
    label: "Escalate",
    variant: "secondary",
    requiresReason: true,
    confirmCopy: (n) => `Escalate ${n} thread${n === 1 ? "" : "s"} to senior support.`,
  },
  {
    id: "close",
    label: "Close",
    variant: "destructive",
    requiresReason: true,
    confirmCopy: (n) => `Close ${n} thread${n === 1 ? "" : "s"}. Reason recorded in audit log.`,
  },
];

function matchesFilter(row: SupportThreadRow, filters: FilterValueMap): boolean {
  const status = typeof filters.status === "string" ? filters.status : null;
  const division = typeof filters.division === "string" ? filters.division : null;
  const priority = typeof filters.priority === "string" ? filters.priority : null;
  const sla = typeof filters.sla === "string" ? filters.sla : null;
  const search = typeof filters.search === "string" ? filters.search.toLowerCase() : null;
  if (status === "open" && ["closed", "resolved"].includes(row.status)) return false;
  if (status === "in_progress" && row.status !== "in_progress") return false;
  if (status === "resolved" && row.status !== "resolved") return false;
  if (status === "escalated" && row.status !== "escalated") return false;
  if (division && row.division !== division) return false;
  if (priority && row.priority !== priority) return false;
  if (sla) {
    const targetAt = row.updatedAt ? new Date(Date.parse(row.updatedAt) + 60 * 60_000).toISOString() : null;
    const bucket = deriveSLABucket(targetAt, { warningMinutes: 30 });
    if (bucket !== sla) return false;
  }
  if (search && !row.subject.toLowerCase().includes(search)) return false;
  return true;
}

const COLUMNS: ReadonlyArray<QueueColumn<SupportThreadRow>> = [
  {
    id: "subject",
    label: "Subject",
    width: "minmax(14rem, 2fr)",
    render: (row) => <strong>{row.data.subject}</strong>,
  },
  {
    id: "division",
    label: "Division",
    width: "8rem",
    render: (row) => (row.data.division ? <Chip tone="neutral">{row.data.division}</Chip> : <span>—</span>),
  },
  {
    id: "priority",
    label: "Priority",
    width: "7rem",
    render: (row) => {
      const tone = row.data.priority === "high" ? "urgent" : row.data.priority === "low" ? "neutral" : "warning";
      return <Chip tone={tone}>{row.data.priority ?? "normal"}</Chip>;
    },
  },
  {
    id: "status",
    label: "Status",
    width: "8rem",
    render: (row) => <Chip tone={row.data.status === "resolved" ? "success" : "neutral"}>{row.data.status}</Chip>,
  },
  {
    id: "updated",
    label: "Updated",
    width: "5rem",
    render: (row) => (
      <span style={{ fontSize: "0.74rem", color: "rgba(10,10,10,0.55)" }}>
        {formatRelative(row.data.updatedAt)}
      </span>
    ),
  },
];

export const staffSupportModule: StaffDashboardModule = {
  slug: "staff-support",
  title: "Support",
  description: "Cross-division support queue with division filter.",
  icon: () => <LifeBuoy size={18} aria-hidden />,
  scope: { kind: "cross_division" },
  getEligibleViewer() {
    return "allowed";
  },
  getRoleGate(viewer) {
    return { kind: "allow", role: viewer.role };
  },
  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "", kind: "home", label: "Support inbox" },
      { path: "[threadId]", kind: "detail", label: "Thread detail", params: ["threadId"] },
    ];
  },
  async getCommandPaletteEntries(): Promise<ReadonlyArray<PaletteEntry>> {
    return [
      {
        id: "staff-support.inbox",
        source: "staff-support",
        groupLabel: "Open" as const,
        label: "Open support inbox",
        kicker: "Staff",
        href: "/modules/staff-support",
        keywords: ["support", "inbox", "tickets"],
      },
    ];
  },
  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [{ slug: "support.thread", label: "Support · thread", accent: "#0E5A6F", source: "staff-support" }];
  },
};

export type StaffSupportPageProps = {
  viewer: StaffViewer;
  supabase: SupportSupabaseClient;
  bulkActionHandler: (id: string, ids: string[], reason: string | null) => Promise<void>;
  exportHandler: (
    format: BulkExportFormat,
    capturedFilters: ReadonlyArray<{ label: string; value: string }>,
    visibleIds: string[],
  ) => Promise<void>;
};

export async function StaffSupportPageServer({ supabase, bulkActionHandler, exportHandler }: StaffSupportPageProps) {
  const snapshot = await loadSupportQueueSnapshot(supabase);
  return (
    <GenericStaffQueueClient<SupportThreadRow>
      kicker="Support · operator"
      title="Cross-division support inbox"
      snapshot={snapshot}
      filterFields={FILTERS}
      rowAdapter={(r) => ({
        id: r.id,
        sla: deriveSLABucket(
          r.updatedAt ? new Date(Date.parse(r.updatedAt) + 60 * 60_000).toISOString() : null,
          { warningMinutes: 30 },
        ),
        slaDueAt: r.updatedAt ?? undefined,
        divisionAccent: r.division
          ? (STAFF_DIVISION_ACCENT[r.division as keyof typeof STAFF_DIVISION_ACCENT] ?? "#0A0A0A")
          : "#0A0A0A",
        data: r,
      })}
      matchesFilter={matchesFilter}
      columns={COLUMNS}
      bulkActions={BULK_ACTIONS}
      onBulkAction={bulkActionHandler}
      onExport={exportHandler}
      rowDeepLink={(r) => `/modules/staff-support/${r.id}`}
    />
  );
}
