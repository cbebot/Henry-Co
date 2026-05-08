import "server-only";

import { Building2 } from "lucide-react";
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

export type PropertySupabaseClient = {
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

export type PropertyListingRow = {
  id: string;
  title: string;
  district: string;
  kind: string;
  status: string;
  listedAt: string;
  reviewDueAt: string | null;
  rentalPrice: number | null;
  currency: string;
};

export async function loadPropertyQueueSnapshot(supabase: PropertySupabaseClient) {
  let rows: PropertyListingRow[] = [];
  try {
    const { data } = await supabase
      .from("property_listings")
      .select("id,title,district,kind,status,listed_at,review_due_at,rental_price_kobo,currency")
      .order("listed_at", { ascending: false })
      .limit(150);
    if (data) {
      rows = data.map((r) => ({
        id: String(r.id ?? ""),
        title: String(r.title ?? "—"),
        district: String(r.district ?? "—"),
        kind: String(r.kind ?? "—"),
        status: String(r.status ?? "draft"),
        listedAt: String(r.listed_at ?? ""),
        reviewDueAt: r.review_due_at ? String(r.review_due_at) : null,
        rentalPrice: r.rental_price_kobo ? Number(r.rental_price_kobo) / 100 : null,
        currency: String(r.currency ?? "NGN"),
      }));
    }
  } catch {
    // empty
  }
  let pending = 0,
    warn = 0,
    breach = 0;
  for (const r of rows) {
    if (r.status === "pending_review" || r.status === "draft") {
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
    id: "kind",
    label: "Kind",
    kind: "select",
    options: [
      { value: "apartment", label: "Apartment" },
      { value: "house", label: "House" },
      { value: "studio", label: "Studio" },
      { value: "commercial", label: "Commercial" },
    ],
  },
];

const BULK_ACTIONS: ReadonlyArray<BulkAction> = [
  {
    id: "approve-listing",
    label: "Approve listing",
    variant: "primary",
    confirmCopy: (n) => `Approve ${n} listings — they go live immediately.`,
  },
  {
    id: "request-edits",
    label: "Request edits",
    variant: "secondary",
    requiresReason: true,
    confirmCopy: (n) => `Send edit-requested email to ${n} listing owners with the reason below.`,
  },
  {
    id: "reject",
    label: "Reject",
    variant: "destructive",
    requiresReason: true,
    confirmCopy: (n) => `Reject ${n} listings. Reason recorded in audit log.`,
  },
];

function matchesFilter(row: PropertyListingRow, filters: FilterValueMap): boolean {
  const status = typeof filters.status === "string" ? filters.status : null;
  const kind = typeof filters.kind === "string" ? filters.kind : null;
  const sla = typeof filters.sla === "string" ? filters.sla : null;
  const search = typeof filters.search === "string" ? filters.search.toLowerCase() : null;
  const dr = filters.createdAt as { from?: string; to?: string } | null | undefined;

  if (status === "open" && !["pending_review", "draft"].includes(row.status)) return false;
  if (status === "in_progress" && row.status !== "in_review") return false;
  if (status === "resolved" && row.status !== "live") return false;
  if (kind && row.kind !== kind) return false;
  if (sla) {
    const bucket = deriveSLABucket(row.reviewDueAt);
    if (bucket !== sla) return false;
  }
  if (search && !`${row.title} ${row.district}`.toLowerCase().includes(search)) return false;
  if (dr?.from && row.listedAt < dr.from) return false;
  if (dr?.to && row.listedAt > dr.to) return false;
  return true;
}

const COLUMNS: ReadonlyArray<QueueColumn<PropertyListingRow>> = [
  {
    id: "title",
    label: "Listing",
    width: "minmax(14rem, 2fr)",
    render: (row) => (
      <span>
        <strong>{row.data.title}</strong>
        <span style={{ marginLeft: "0.4rem", color: "rgba(10,10,10,0.55)", fontSize: "0.78rem" }}>
          {row.data.district}
        </span>
      </span>
    ),
  },
  {
    id: "kind",
    label: "Kind",
    width: "7rem",
    render: (row) => <Chip tone="neutral">{row.data.kind}</Chip>,
  },
  {
    id: "status",
    label: "Status",
    width: "8rem",
    render: (row) => (
      <Chip tone={row.data.status === "live" ? "success" : row.data.status === "rejected" ? "urgent" : "warning"}>
        {row.data.status}
      </Chip>
    ),
  },
  {
    id: "price",
    label: "Price",
    width: "8rem",
    align: "right",
    render: (row) =>
      row.data.rentalPrice ? (
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {row.data.currency} {row.data.rentalPrice.toLocaleString()}
        </span>
      ) : (
        <span>—</span>
      ),
  },
  {
    id: "listed",
    label: "Listed",
    width: "5rem",
    render: (row) => (
      <span style={{ fontSize: "0.74rem", color: "rgba(10,10,10,0.55)" }}>
        {formatRelative(row.data.listedAt)}
      </span>
    ),
  },
];

export const staffPropertyModule: StaffDashboardModule = {
  slug: "staff-property",
  title: "Property",
  description: "Listings moderation, viewing coordination, submissions, inquiry triage.",
  icon: () => <Building2 size={18} aria-hidden />,
  scope: { kind: "division", division: "property" },
  getEligibleViewer(viewer) {
    return hasStaffAccessIn(viewer, "property") ? "allowed" : "hidden";
  },
  getRoleGate(viewer) {
    if (!hasStaffAccessIn(viewer, "property")) return null;
    return { kind: "allow", role: viewer.role };
  },
  getRoutes(): ReadonlyArray<RouteEntry> {
    return [
      { path: "", kind: "home", label: "Property queue" },
      { path: "[listingId]", kind: "detail", label: "Listing detail", params: ["listingId"] },
    ];
  },
  async getCommandPaletteEntries(viewer): Promise<ReadonlyArray<PaletteEntry>> {
    if (!hasStaffAccessIn(viewer, "property")) return [];
    return [
      {
        id: "staff-property.queue",
        source: "staff-property",
        groupLabel: "Open" as const,
        label: "Open Property queue",
        kicker: "Staff",
        href: "/modules/staff-property",
        keywords: ["property", "listings", "moderation"],
      },
    ];
  },
  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [
      { slug: "property.listing", label: "Property · listing", accent: "#0E5A6F", source: "staff-property" },
      { slug: "property.inquiry", label: "Property · inquiry", accent: "#C9A227", source: "staff-property" },
    ];
  },
};

export type StaffPropertyPageProps = {
  viewer: StaffViewer;
  supabase: PropertySupabaseClient;
  bulkActionHandler: (id: string, ids: string[], reason: string | null) => Promise<void>;
  exportHandler: (
    format: BulkExportFormat,
    capturedFilters: ReadonlyArray<{ label: string; value: string }>,
    visibleIds: string[],
  ) => Promise<void>;
};

export async function StaffPropertyPageServer({ supabase, bulkActionHandler, exportHandler }: StaffPropertyPageProps) {
  const snapshot = await loadPropertyQueueSnapshot(supabase);
  return (
    <GenericStaffQueueClient<PropertyListingRow>
      kicker="Property · operator"
      title="Listings & moderation"
      snapshot={snapshot}
      filterFields={FILTERS}
      rowAdapter={(r) => ({
        id: r.id,
        sla: deriveSLABucket(r.reviewDueAt),
        slaDueAt: r.reviewDueAt ?? undefined,
        divisionAccent: STAFF_DIVISION_ACCENT.property,
        data: r,
      })}
      matchesFilter={matchesFilter}
      columns={COLUMNS}
      bulkActions={BULK_ACTIONS}
      onBulkAction={bulkActionHandler}
      onExport={exportHandler}
      rowDeepLink={(r) => `/modules/staff-property/${r.id}`}
    />
  );
}
