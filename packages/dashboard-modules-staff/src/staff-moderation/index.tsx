import "server-only";

import { ShieldAlert } from "lucide-react";
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

export type ModerationSupabaseClient = {
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

export type ModerationCaseRow = {
  id: string;
  division: string;
  entityType: string;
  entityId: string;
  reason: string;
  severity: string;
  status: string;
  flaggedBy: string | null;
  assignedTo: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

export async function loadModerationQueueSnapshot(supabase: ModerationSupabaseClient) {
  let rows: ModerationCaseRow[] = [];
  try {
    const { data } = await supabase
      .from("platform_moderation_queue")
      .select(
        "id,division,entity_type,entity_id,reason,severity,status,flagged_by,assigned_to,created_at,resolved_at",
      )
      .order("created_at", { ascending: false })
      .limit(150);
    if (data) {
      rows = data.map((r) => ({
        id: String(r.id ?? ""),
        division: String(r.division ?? "unknown"),
        entityType: String(r.entity_type ?? "—"),
        entityId: String(r.entity_id ?? ""),
        reason: String(r.reason ?? "—"),
        severity: String(r.severity ?? "low"),
        status: String(r.status ?? "open"),
        flaggedBy: r.flagged_by ? String(r.flagged_by) : null,
        assignedTo: r.assigned_to ? String(r.assigned_to) : null,
        createdAt: String(r.created_at ?? ""),
        resolvedAt: r.resolved_at ? String(r.resolved_at) : null,
      }));
    }
  } catch {
    // empty
  }

  // V3-25: merge the unified cross-division user reports into the same queue.
  // RLS gates these to staff (is_staff_in_any); maps into the shared row shape
  // so they render in the existing queue with no generics changes.
  try {
    const { data: reportData } = await supabase
      .from("moderation_reports")
      .select("id,content_type,content_id,reason_code,status,reporter_id,created_at")
      .order("created_at", { ascending: false })
      .limit(150);
    if (reportData) {
      const HIGH = new Set(["prohibited_item", "offensive_content", "scam_or_fraud"]);
      const reportRows: ModerationCaseRow[] = reportData.map((r) => {
        const reasonCode = String(r.reason_code ?? "other");
        const status = String(r.status ?? "open");
        return {
          id: `report:${String(r.id ?? "")}`,
          division: String(r.content_type ?? "unknown"),
          entityType: String(r.content_type ?? "—"),
          entityId: String(r.content_id ?? ""),
          reason: reasonCode,
          severity: HIGH.has(reasonCode) ? "high" : "normal",
          // dismissed reports are terminal — treat as resolved for SLA counting.
          status: status === "dismissed" ? "resolved" : status === "reviewing" ? "in_review" : status,
          flaggedBy: r.reporter_id ? String(r.reporter_id) : null,
          assignedTo: null,
          createdAt: String(r.created_at ?? ""),
          resolvedAt: status === "resolved" || status === "dismissed" ? String(r.created_at ?? "") : null,
        };
      });
      rows = [...rows, ...reportRows];
    }
  } catch {
    // moderation_reports not applied yet (committed-NOT-applied) — degrade quietly.
  }
  let pending = 0,
    warn = 0,
    breach = 0;
  for (const r of rows) {
    if (r.status !== "resolved") {
      pending++;
      // Severity-driven SLA: high = 30min, normal = 4h, low = 24h
      const slaMinutes = r.severity === "high" ? 30 : r.severity === "low" ? 60 * 24 : 240;
      const targetAt = r.createdAt
        ? new Date(Date.parse(r.createdAt) + slaMinutes * 60_000).toISOString()
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
    id: "severity",
    label: "Severity",
    kind: "segmented",
    options: [
      { value: "high", label: "High" },
      { value: "normal", label: "Normal" },
      { value: "low", label: "Low" },
    ],
  },
  {
    id: "division",
    label: "Division",
    kind: "select",
    options: [
      { value: "marketplace", label: "Marketplace" },
      { value: "property", label: "Property" },
      { value: "studio", label: "Studio" },
      { value: "jobs", label: "Jobs" },
      { value: "learn", label: "Learn" },
      { value: "logistics", label: "Logistics" },
      { value: "care", label: "Care" },
    ],
  },
];

const BULK_ACTIONS: ReadonlyArray<BulkAction> = [
  {
    id: "approve-content",
    label: "Approve content",
    variant: "primary",
    confirmCopy: (n) => `Mark ${n} case${n === 1 ? "" : "s"} as compliant. Content stays live.`,
  },
  {
    id: "remove-content",
    label: "Remove content",
    variant: "destructive",
    requiresReason: true,
    confirmCopy: (n) =>
      `Remove ${n} flagged item${n === 1 ? "" : "s"} from public surface. Reason recorded in audit log.`,
  },
  {
    id: "ban-user",
    label: "Ban user",
    variant: "destructive",
    requiresReason: true,
    confirmCopy: (n) => `Ban ${n} user${n === 1 ? "" : "s"} from the platform. Action is reversible by an admin.`,
  },
];

function matchesFilter(row: ModerationCaseRow, filters: FilterValueMap): boolean {
  const status = typeof filters.status === "string" ? filters.status : null;
  const severity = typeof filters.severity === "string" ? filters.severity : null;
  const division = typeof filters.division === "string" ? filters.division : null;
  const sla = typeof filters.sla === "string" ? filters.sla : null;
  const search = typeof filters.search === "string" ? filters.search.toLowerCase() : null;
  if (status === "open" && row.status === "resolved") return false;
  if (status === "resolved" && row.status !== "resolved") return false;
  if (severity && row.severity !== severity) return false;
  if (division && row.division !== division) return false;
  if (sla) {
    const slaMinutes = row.severity === "high" ? 30 : row.severity === "low" ? 60 * 24 : 240;
    const targetAt = row.createdAt
      ? new Date(Date.parse(row.createdAt) + slaMinutes * 60_000).toISOString()
      : null;
    const bucket = deriveSLABucket(targetAt);
    if (bucket !== sla) return false;
  }
  if (search && !`${row.reason} ${row.entityType}`.toLowerCase().includes(search)) return false;
  return true;
}

const COLUMNS: ReadonlyArray<QueueColumn<ModerationCaseRow>> = [
  {
    id: "case",
    label: "Case",
    width: "minmax(14rem, 2fr)",
    render: (row) => (
      <span>
        <strong>{row.data.reason}</strong>
        <span style={{ marginLeft: "0.4rem", color: "rgba(10,10,10,0.55)", fontSize: "0.78rem" }}>
          {row.data.entityType}#{row.data.entityId.slice(0, 8)}
        </span>
      </span>
    ),
  },
  {
    id: "division",
    label: "Division",
    width: "8rem",
    render: (row) => <Chip tone="neutral">{row.data.division}</Chip>,
  },
  {
    id: "severity",
    label: "Severity",
    width: "7rem",
    render: (row) => {
      const tone =
        row.data.severity === "high"
          ? "urgent"
          : row.data.severity === "low"
            ? "neutral"
            : "warning";
      return <Chip tone={tone}>{row.data.severity}</Chip>;
    },
  },
  {
    id: "status",
    label: "Status",
    width: "8rem",
    render: (row) => <Chip tone={row.data.status === "resolved" ? "success" : "neutral"}>{row.data.status}</Chip>,
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

export const staffModerationModule: StaffDashboardModule = {
  slug: "staff-moderation",
  title: "Moderation",
  description: "Cross-division content moderation, ToS enforcement, user reports.",
  icon: () => <ShieldAlert size={18} aria-hidden />,
  scope: { kind: "cross_division" },
  getEligibleViewer() {
    return "allowed";
  },
  getRoleGate(viewer) {
    return { kind: "allow", role: viewer.role };
  },
  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "", kind: "home", label: "Moderation queue" },
      { path: "[caseId]", kind: "detail", label: "Case detail", params: ["caseId"] },
    ];
  },
  async getCommandPaletteEntries(): Promise<ReadonlyArray<PaletteEntry>> {
    return [
      {
        id: "staff-moderation.queue",
        source: "staff-moderation",
        groupLabel: "Open" as const,
        label: "Open Moderation queue",
        kicker: "Staff",
        href: "/modules/staff-moderation",
        keywords: ["moderation", "tos", "report", "flag"],
      },
    ];
  },
  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [{ slug: "moderation.case", label: "Moderation · case", accent: "#B91C1C", source: "staff-moderation" }];
  },
};

export type StaffModerationPageProps = {
  viewer: StaffViewer;
  supabase: ModerationSupabaseClient;
  bulkActionHandler: (id: string, ids: string[], reason: string | null) => Promise<void>;
  exportHandler: (
    format: BulkExportFormat,
    capturedFilters: ReadonlyArray<{ label: string; value: string }>,
    visibleIds: string[],
  ) => Promise<void>;
};

export async function StaffModerationPageServer({ supabase, bulkActionHandler, exportHandler }: StaffModerationPageProps) {
  const snapshot = await loadModerationQueueSnapshot(supabase);
  return (
    <GenericStaffQueueClient<ModerationCaseRow>
      kicker="Moderation · cross-division"
      title="Content moderation & ToS"
      snapshot={snapshot}
      filterFields={FILTERS}
      rowAdapter={(r) => {
        const slaMinutes = r.severity === "high" ? 30 : r.severity === "low" ? 60 * 24 : 240;
        const targetAt = r.createdAt
          ? new Date(Date.parse(r.createdAt) + slaMinutes * 60_000).toISOString()
          : null;
        return {
          id: r.id,
          sla: deriveSLABucket(targetAt),
          slaDueAt: targetAt ?? undefined,
          divisionAccent:
            STAFF_DIVISION_ACCENT[r.division as keyof typeof STAFF_DIVISION_ACCENT] ?? "#0A0A0A",
          data: r,
        };
      }}
      matchesFilter={matchesFilter}
      columns={COLUMNS}
      bulkActions={BULK_ACTIONS}
      onBulkAction={bulkActionHandler}
      onExport={exportHandler}
      rowDeepLink={(r) => `/modules/staff-moderation/${r.id}`}
    />
  );
}
