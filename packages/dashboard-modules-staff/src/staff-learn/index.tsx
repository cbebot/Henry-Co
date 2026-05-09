import "server-only";

import { GraduationCap } from "lucide-react";
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

export type LearnSupabaseClient = {
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

export type LearnCourseRow = {
  id: string;
  title: string;
  difficulty: string;
  isCertification: boolean;
  status: string;
  reviewDueAt: string | null;
  createdAt: string;
};

export async function loadLearnQueueSnapshot(supabase: LearnSupabaseClient) {
  let rows: LearnCourseRow[] = [];
  try {
    const { data } = await supabase
      .from("learn_courses")
      .select("id,title,difficulty,is_certification,status,review_due_at,created_at")
      .order("created_at", { ascending: false })
      .limit(150);
    if (data) {
      rows = data.map((r) => ({
        id: String(r.id ?? ""),
        title: String(r.title ?? "—"),
        difficulty: String(r.difficulty ?? "intro"),
        isCertification: Boolean(r.is_certification ?? false),
        status: String(r.status ?? "draft"),
        reviewDueAt: r.review_due_at ? String(r.review_due_at) : null,
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
    if (["draft", "pending_review", "in_review"].includes(r.status)) {
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
    id: "difficulty",
    label: "Level",
    kind: "select",
    options: [
      { value: "intro", label: "Intro" },
      { value: "intermediate", label: "Intermediate" },
      { value: "advanced", label: "Advanced" },
    ],
  },
];

const BULK_ACTIONS: ReadonlyArray<BulkAction> = [
  { id: "approve", label: "Approve", variant: "primary", confirmCopy: (n) => `Publish ${n} course${n === 1 ? "" : "s"}.` },
  {
    id: "request-edits",
    label: "Request edits",
    variant: "secondary",
    requiresReason: true,
    confirmCopy: (n) => `Send edit requests to ${n} course author${n === 1 ? "" : "s"}.`,
  },
  {
    id: "reject",
    label: "Reject",
    variant: "destructive",
    requiresReason: true,
    confirmCopy: (n) => `Reject ${n} course${n === 1 ? "" : "s"}. Reason recorded in audit log.`,
  },
];

function matchesFilter(row: LearnCourseRow, filters: FilterValueMap): boolean {
  const status = typeof filters.status === "string" ? filters.status : null;
  const diff = typeof filters.difficulty === "string" ? filters.difficulty : null;
  const sla = typeof filters.sla === "string" ? filters.sla : null;
  const search = typeof filters.search === "string" ? filters.search.toLowerCase() : null;
  if (status === "open" && !["draft", "pending_review", "in_review"].includes(row.status)) return false;
  if (status === "in_progress" && row.status !== "in_review") return false;
  if (status === "resolved" && row.status !== "published") return false;
  if (diff && row.difficulty !== diff) return false;
  if (sla) {
    const bucket = deriveSLABucket(row.reviewDueAt);
    if (bucket !== sla) return false;
  }
  if (search && !row.title.toLowerCase().includes(search)) return false;
  return true;
}

const COLUMNS: ReadonlyArray<QueueColumn<LearnCourseRow>> = [
  {
    id: "title",
    label: "Course",
    width: "minmax(14rem, 2fr)",
    render: (row) => (
      <span>
        <strong>{row.data.title}</strong>
        {row.data.isCertification ? (
          <Chip tone="accent" leading={null}>
            Cert
          </Chip>
        ) : null}
      </span>
    ),
  },
  {
    id: "level",
    label: "Level",
    width: "7rem",
    render: (row) => <Chip tone="neutral">{row.data.difficulty}</Chip>,
  },
  {
    id: "status",
    label: "Status",
    width: "8rem",
    render: (row) => <Chip tone={row.data.status === "published" ? "success" : "warning"}>{row.data.status}</Chip>,
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

export const staffLearnModule: StaffDashboardModule = {
  slug: "staff-learn",
  title: "Learn",
  description: "Course moderation, certification verification, payment dispute.",
  icon: () => <GraduationCap size={18} aria-hidden />,
  scope: { kind: "division", division: "learn" },
  getEligibleViewer(viewer) {
    return hasStaffAccessIn(viewer, "learn") ? "allowed" : "hidden";
  },
  getRoleGate(viewer) {
    if (!hasStaffAccessIn(viewer, "learn")) return null;
    return { kind: "allow", role: viewer.role };
  },
  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "", kind: "home", label: "Learn queue" },
      { path: "[courseId]", kind: "detail", label: "Course detail", params: ["courseId"] },
    ];
  },
  async getCommandPaletteEntries(viewer): Promise<ReadonlyArray<PaletteEntry>> {
    if (!hasStaffAccessIn(viewer, "learn")) return [];
    return [
      {
        id: "staff-learn.queue",
        source: "staff-learn",
        groupLabel: "Open" as const,
        label: "Open Learn queue",
        kicker: "Staff",
        href: "/modules/staff-learn",
        keywords: ["learn", "courses", "moderation"],
      },
    ];
  },
  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [{ slug: "learn.course", label: "Learn · course", accent: "#1D4ED8", source: "staff-learn" }];
  },
};

export type StaffLearnPageProps = {
  viewer: StaffViewer;
  supabase: LearnSupabaseClient;
  bulkActionHandler: (id: string, ids: string[], reason: string | null) => Promise<void>;
  exportHandler: (
    format: BulkExportFormat,
    capturedFilters: ReadonlyArray<{ label: string; value: string }>,
    visibleIds: string[],
  ) => Promise<void>;
};

export async function StaffLearnPageServer({ supabase, bulkActionHandler, exportHandler }: StaffLearnPageProps) {
  const snapshot = await loadLearnQueueSnapshot(supabase);
  return (
    <GenericStaffQueueClient<LearnCourseRow>
      kicker="Learn · operator"
      title="Courses & certification"
      snapshot={snapshot}
      filterFields={FILTERS}
      rowAdapter={(r) => ({
        id: r.id,
        sla: deriveSLABucket(r.reviewDueAt),
        slaDueAt: r.reviewDueAt ?? undefined,
        divisionAccent: STAFF_DIVISION_ACCENT.learn,
        data: r,
      })}
      matchesFilter={matchesFilter}
      columns={COLUMNS}
      bulkActions={BULK_ACTIONS}
      onBulkAction={bulkActionHandler}
      onExport={exportHandler}
      rowDeepLink={(r) => `/modules/staff-learn/${r.id}`}
    />
  );
}
