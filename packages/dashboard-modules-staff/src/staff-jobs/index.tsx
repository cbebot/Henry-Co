import "server-only";

import { Briefcase } from "lucide-react";
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

export type JobsSupabaseClient = {
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

export type JobApplicationRow = {
  id: string;
  candidateName: string | null;
  candidateEmail: string | null;
  status: string;
  currentStage: string;
  appliedAt: string;
  reviewDueAt: string | null;
};

export async function loadJobsQueueSnapshot(supabase: JobsSupabaseClient) {
  let rows: JobApplicationRow[] = [];
  try {
    const { data } = await supabase
      .from("jobs_applications")
      .select("id,candidate_name,candidate_email,status,current_stage,applied_at,review_due_at")
      .order("applied_at", { ascending: false })
      .limit(150);
    if (data) {
      rows = data.map((r) => ({
        id: String(r.id ?? ""),
        candidateName: r.candidate_name ? String(r.candidate_name) : null,
        candidateEmail: r.candidate_email ? String(r.candidate_email) : null,
        status: String(r.status ?? "open"),
        currentStage: String(r.current_stage ?? "screening"),
        appliedAt: String(r.applied_at ?? ""),
        reviewDueAt: r.review_due_at ? String(r.review_due_at) : null,
      }));
    }
  } catch {
    // empty
  }
  let pending = 0,
    warn = 0,
    breach = 0;
  for (const r of rows) {
    if (!["hired", "rejected", "withdrawn"].includes(r.status)) {
      pending++;
      const bucket = deriveSLABucket(r.reviewDueAt);
      if (bucket === "warning") warn++;
      if (bucket === "breach") breach++;
    }
  }
  return { rows, pendingCount: pending, slaWarningCount: warn, slaBreachCount: breach };
}

const FILTERS: ReadonlyArray<FilterField> = [
  ...DEFAULT_STAFF_QUEUE_FILTERS,
  {
    id: "stage",
    label: "Stage",
    kind: "select",
    options: [
      { value: "screening", label: "Screening" },
      { value: "interview", label: "Interview" },
      { value: "offer", label: "Offer" },
    ],
  },
];

const BULK_ACTIONS: ReadonlyArray<BulkAction> = [
  {
    id: "advance-stage",
    label: "Advance stage",
    variant: "primary",
    confirmCopy: (n) => `Advance ${n} application${n === 1 ? "" : "s"} to the next stage.`,
  },
  {
    id: "request-info",
    label: "Request info",
    variant: "secondary",
    requiresReason: true,
    confirmCopy: (n) => `Email ${n} candidate${n === 1 ? "" : "s"} with the request below.`,
  },
  {
    id: "reject",
    label: "Reject",
    variant: "destructive",
    requiresReason: true,
    confirmCopy: (n) => `Reject ${n} application${n === 1 ? "" : "s"}. Reason recorded in audit log.`,
  },
];

function matchesFilter(row: JobApplicationRow, filters: FilterValueMap): boolean {
  const status = typeof filters.status === "string" ? filters.status : null;
  const stage = typeof filters.stage === "string" ? filters.stage : null;
  const sla = typeof filters.sla === "string" ? filters.sla : null;
  const search = typeof filters.search === "string" ? filters.search.toLowerCase() : null;

  if (status === "open" && ["hired", "rejected", "withdrawn"].includes(row.status)) return false;
  if (status === "in_progress" && row.status !== "in_review") return false;
  if (status === "resolved" && row.status !== "hired") return false;
  if (stage && row.currentStage !== stage) return false;
  if (sla) {
    const bucket = deriveSLABucket(row.reviewDueAt);
    if (bucket !== sla) return false;
  }
  if (search && !`${row.candidateName ?? ""} ${row.candidateEmail ?? ""}`.toLowerCase().includes(search))
    return false;
  return true;
}

const COLUMNS: ReadonlyArray<QueueColumn<JobApplicationRow>> = [
  {
    id: "candidate",
    label: "Candidate",
    width: "minmax(12rem, 2fr)",
    render: (row) => (
      <span>
        <strong>{row.data.candidateName ?? "—"}</strong>
        {row.data.candidateEmail ? (
          <span style={{ marginLeft: "0.4rem", fontSize: "0.78rem", color: "rgba(10,10,10,0.55)" }}>
            {row.data.candidateEmail}
          </span>
        ) : null}
      </span>
    ),
  },
  {
    id: "stage",
    label: "Stage",
    width: "8rem",
    render: (row) => <Chip tone="neutral">{row.data.currentStage}</Chip>,
  },
  {
    id: "status",
    label: "Status",
    width: "8rem",
    render: (row) => <Chip tone={row.data.status === "hired" ? "success" : "neutral"}>{row.data.status}</Chip>,
  },
  {
    id: "applied",
    label: "Applied",
    width: "5rem",
    render: (row) => (
      <span style={{ fontSize: "0.74rem", color: "rgba(10,10,10,0.55)" }}>
        {formatRelative(row.data.appliedAt)}
      </span>
    ),
  },
];

export const staffJobsModule: StaffDashboardModule = {
  slug: "staff-jobs",
  title: "Jobs",
  description: "Candidate vetting, posting moderation, interview coordination.",
  icon: () => <Briefcase size={18} aria-hidden />,
  scope: { kind: "division", division: "jobs" },
  getEligibleViewer(viewer) {
    return hasStaffAccessIn(viewer, "jobs") ? "allowed" : "hidden";
  },
  getRoleGate(viewer) {
    if (!hasStaffAccessIn(viewer, "jobs")) return null;
    return { kind: "allow", role: viewer.role };
  },
  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "", kind: "home", label: "Jobs queue" },
      { path: "[applicationId]", kind: "detail", label: "Application detail", params: ["applicationId"] },
    ];
  },
  async getCommandPaletteEntries(viewer): Promise<ReadonlyArray<PaletteEntry>> {
    if (!hasStaffAccessIn(viewer, "jobs")) return [];
    return [
      {
        id: "staff-jobs.queue",
        source: "staff-jobs",
        groupLabel: "Open" as const,
        label: "Open Jobs queue",
        kicker: "Staff",
        href: "/modules/staff-jobs",
        keywords: ["jobs", "candidates", "applications"],
      },
    ];
  },
  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [
      { slug: "jobs.application", label: "Jobs · application", accent: "#16A34A", source: "staff-jobs" },
      { slug: "jobs.moderation", label: "Jobs · moderation", accent: "#B91C1C", source: "staff-jobs" },
    ];
  },
};

export type StaffJobsPageProps = {
  viewer: StaffViewer;
  supabase: JobsSupabaseClient;
  bulkActionHandler: (id: string, ids: string[], reason: string | null) => Promise<void>;
  exportHandler: (
    format: BulkExportFormat,
    capturedFilters: ReadonlyArray<{ label: string; value: string }>,
    visibleIds: string[],
  ) => Promise<void>;
};

export async function StaffJobsPageServer({ supabase, bulkActionHandler, exportHandler }: StaffJobsPageProps) {
  const snapshot = await loadJobsQueueSnapshot(supabase);
  return (
    <GenericStaffQueueClient<JobApplicationRow>
      kicker="Jobs · operator"
      title="Applications & moderation"
      snapshot={snapshot}
      filterFields={FILTERS}
      rowAdapter={(r) => ({
        id: r.id,
        sla: deriveSLABucket(r.reviewDueAt),
        slaDueAt: r.reviewDueAt ?? undefined,
        divisionAccent: STAFF_DIVISION_ACCENT.jobs,
        data: r,
      })}
      matchesFilter={matchesFilter}
      columns={COLUMNS}
      bulkActions={BULK_ACTIONS}
      onBulkAction={bulkActionHandler}
      onExport={exportHandler}
      rowDeepLink={(r) => `/modules/staff-jobs/${r.id}`}
    />
  );
}
