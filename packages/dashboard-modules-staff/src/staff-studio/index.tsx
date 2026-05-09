import "server-only";

import { Palette } from "lucide-react";
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

export type StudioSupabaseClient = {
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

export type StudioProjectRow = {
  id: string;
  title: string | null;
  status: string;
  budgetKobo: number | null;
  estimatedCompletion: string | null;
  nextAction: string | null;
  createdAt: string;
};

export async function loadStudioQueueSnapshot(supabase: StudioSupabaseClient) {
  let rows: StudioProjectRow[] = [];
  try {
    const { data } = await supabase
      .from("studio_projects")
      .select("id,title,status,budget_kobo,estimated_completion,next_action,created_at")
      .order("created_at", { ascending: false })
      .limit(150);
    if (data) {
      rows = data.map((r) => ({
        id: String(r.id ?? ""),
        title: r.title ? String(r.title) : null,
        status: String(r.status ?? "lead"),
        budgetKobo: r.budget_kobo ? Number(r.budget_kobo) : null,
        estimatedCompletion: r.estimated_completion ? String(r.estimated_completion) : null,
        nextAction: r.next_action ? String(r.next_action) : null,
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
    if (!["delivered", "completed", "cancelled"].includes(r.status)) {
      pending++;
      const bucket = deriveSLABucket(r.estimatedCompletion);
      if (bucket === "warning") warn++;
      if (bucket === "breach") breach++;
    }
  }
  return { rows, pendingCount: pending, slaWarningCount: warn, slaBreachCount: breach };
}

const FILTERS: ReadonlyArray<FilterField> = DEFAULT_STAFF_QUEUE_FILTERS;

const BULK_ACTIONS: ReadonlyArray<BulkAction> = [
  {
    id: "advance-stage",
    label: "Advance stage",
    variant: "primary",
    confirmCopy: (n) => `Advance ${n} project${n === 1 ? "" : "s"} to the next stage.`,
  },
  {
    id: "request-deliverables",
    label: "Request deliverables",
    variant: "secondary",
    confirmCopy: (n) => `Email project leads requesting deliverables across ${n} project${n === 1 ? "" : "s"}.`,
  },
  {
    id: "cancel",
    label: "Cancel",
    variant: "destructive",
    requiresReason: true,
    confirmCopy: (n) => `Cancel ${n} project${n === 1 ? "" : "s"}. Refund handling is separate.`,
  },
];

function matchesFilter(row: StudioProjectRow, filters: FilterValueMap): boolean {
  const status = typeof filters.status === "string" ? filters.status : null;
  const sla = typeof filters.sla === "string" ? filters.sla : null;
  const search = typeof filters.search === "string" ? filters.search.toLowerCase() : null;
  if (status === "open" && ["delivered", "completed", "cancelled"].includes(row.status)) return false;
  if (status === "in_progress" && !["in_progress", "review"].includes(row.status)) return false;
  if (status === "resolved" && !["delivered", "completed"].includes(row.status)) return false;
  if (sla) {
    const bucket = deriveSLABucket(row.estimatedCompletion);
    if (bucket !== sla) return false;
  }
  if (search && !`${row.title ?? ""} ${row.nextAction ?? ""}`.toLowerCase().includes(search)) return false;
  return true;
}

const COLUMNS: ReadonlyArray<QueueColumn<StudioProjectRow>> = [
  {
    id: "title",
    label: "Project",
    width: "minmax(14rem, 2fr)",
    render: (row) => <strong>{row.data.title ?? row.data.id.slice(0, 8)}</strong>,
  },
  {
    id: "status",
    label: "Stage",
    width: "8rem",
    render: (row) => <Chip tone={row.data.status === "delivered" ? "success" : "neutral"}>{row.data.status}</Chip>,
  },
  {
    id: "budget",
    label: "Budget",
    width: "8rem",
    align: "right",
    render: (row) =>
      row.data.budgetKobo !== null ? (
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          ₦{(row.data.budgetKobo / 100).toLocaleString()}
        </span>
      ) : (
        <span>—</span>
      ),
  },
  {
    id: "next",
    label: "Next action",
    width: "minmax(10rem, 1fr)",
    render: (row) => <span style={{ color: "rgba(10,10,10,0.65)" }}>{row.data.nextAction ?? "—"}</span>,
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

export const staffStudioModule: StaffDashboardModule = {
  slug: "staff-studio",
  title: "Studio",
  description: "Project coordination, milestones, proposal review, deliverable approval.",
  icon: () => <Palette size={18} aria-hidden />,
  scope: { kind: "division", division: "studio" },
  getEligibleViewer(viewer) {
    return hasStaffAccessIn(viewer, "studio") ? "allowed" : "hidden";
  },
  getRoleGate(viewer) {
    if (!hasStaffAccessIn(viewer, "studio")) return null;
    return { kind: "allow", role: viewer.role };
  },
  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "", kind: "home", label: "Studio queue" },
      { path: "[projectId]", kind: "detail", label: "Project detail", params: ["projectId"] },
    ];
  },
  async getCommandPaletteEntries(viewer): Promise<ReadonlyArray<PaletteEntry>> {
    if (!hasStaffAccessIn(viewer, "studio")) return [];
    return [
      {
        id: "staff-studio.queue",
        source: "staff-studio",
        groupLabel: "Open" as const,
        label: "Open Studio queue",
        kicker: "Staff",
        href: "/modules/staff-studio",
        keywords: ["studio", "projects"],
      },
    ];
  },
  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [
      { slug: "studio.project", label: "Studio · project", accent: "#6F2E9C", source: "staff-studio" },
      { slug: "studio.proposal", label: "Studio · proposal", accent: "#C9A227", source: "staff-studio" },
    ];
  },
};

export type StaffStudioPageProps = {
  viewer: StaffViewer;
  supabase: StudioSupabaseClient;
  bulkActionHandler: (id: string, ids: string[], reason: string | null) => Promise<void>;
  exportHandler: (
    format: BulkExportFormat,
    capturedFilters: ReadonlyArray<{ label: string; value: string }>,
    visibleIds: string[],
  ) => Promise<void>;
};

export async function StaffStudioPageServer({ supabase, bulkActionHandler, exportHandler }: StaffStudioPageProps) {
  const snapshot = await loadStudioQueueSnapshot(supabase);
  return (
    <GenericStaffQueueClient<StudioProjectRow>
      kicker="Studio · operator"
      title="Projects & deliverables"
      snapshot={snapshot}
      filterFields={FILTERS}
      rowAdapter={(r) => ({
        id: r.id,
        sla: deriveSLABucket(r.estimatedCompletion),
        slaDueAt: r.estimatedCompletion ?? undefined,
        divisionAccent: STAFF_DIVISION_ACCENT.studio,
        data: r,
      })}
      matchesFilter={matchesFilter}
      columns={COLUMNS}
      bulkActions={BULK_ACTIONS}
      onBulkAction={bulkActionHandler}
      onExport={exportHandler}
      rowDeepLink={(r) => `/modules/staff-studio/${r.id}`}
    />
  );
}
