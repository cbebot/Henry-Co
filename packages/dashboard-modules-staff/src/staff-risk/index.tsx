import "server-only";

/**
 * V3-40 — staff risk-review queue (Track C module, Register-D operator surface).
 *
 * The review instrument for the predictive fraud & risk system. Shows the latest
 * review/freeze-tier score per entity with its explainable factors, the current
 * enforcement state, and the four one-tap staff actions (hold / freeze / release /
 * override). Doctrine surfaces here:
 *   * everything the queue reads is RLS-gated to `is_staff_in('security')` — the
 *     cookie client runs as the signed-in staffer, so the DB is the gate;
 *   * the system only ever FLAGS — every user-affecting action in this UI writes
 *     with the acting STAFF user as actor (the server action enforces it through
 *     assertEnforcementAllowed + the DB CHECK);
 *   * shadow rows are labelled as shadow — the queue is exactly how the owner
 *     reviews shadow mode (V3-42 builds the full dashboards on top).
 */

import { ShieldHalf } from "lucide-react";
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
import { hasStaffAccessIn } from "@henryco/auth/staff";
import { getStaffRiskCopy, type StaffRiskCopy } from "@henryco/i18n";

import {
  GenericStaffQueueClient,
  STAFF_DIVISION_ACCENT,
  deriveSLABucket,
  DEFAULT_STAFF_QUEUE_FILTERS,
  formatRelative,
} from "../shared";

/** Structural duck type — same shape the sibling modules use (RLS applies). */
export type RiskSupabaseClient = {
  from: (table: string) => {
    select: (cols: string) => {
      order: (
        col: string,
        opts?: { ascending?: boolean },
      ) => {
        limit: (n: number) => Promise<{
          data: Array<Record<string, unknown>> | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

export type RiskQueueRow = {
  /** `${entityType}|${entityId}` — the bulk-action selection id. */
  id: string;
  entityType: string;
  entityId: string;
  riskScore: number;
  deterministicScore: number;
  tier: string;
  shadow: boolean;
  modelVersion: string;
  /** Top contributing factors, pre-formatted server-side (no raw JSON client-bound). */
  topFactors: string[];
  enforcement: "none" | "flag" | "hold" | "freeze";
  scoredAt: string;
};

type FactorJson = { signal?: unknown; weight?: unknown; value?: unknown };

function factorLabel(copy: StaffRiskCopy, factor: FactorJson): string {
  const key = String(factor.signal ?? "");
  const [ns, ...rest] = key.split(".");
  const kind =
    ns === "signal"
      ? copy.factorKinds.signal
      : ns === "threat"
        ? copy.factorKinds.threat
        : ns === "behavioral"
          ? copy.factorKinds.behavioral
          : copy.factorKinds.advisory;
  const name = rest.join(".").replace(/_/g, " ");
  const points = Number(factor.weight ?? 0);
  return `${kind}: ${name} (+${points})`;
}

export async function loadRiskQueueSnapshot(supabase: RiskSupabaseClient, copy: StaffRiskCopy) {
  let scores: Array<Record<string, unknown>> = [];
  try {
    const { data } = await supabase
      .from("risk_scores")
      .select(
        "entity_type, entity_id, risk_score, deterministic_score, tier, shadow, model_version, contributing_factors, scored_at",
      )
      .order("scored_at", { ascending: false })
      .limit(300);
    scores = data ?? [];
  } catch {
    // committed-not-applied / dark — render the calm empty state.
  }

  let enforcement: Array<Record<string, unknown>> = [];
  try {
    const { data } = await supabase
      .from("risk_enforcement_log")
      .select("entity_type, entity_id, action, created_at")
      .order("created_at", { ascending: false })
      .limit(600);
    enforcement = data ?? [];
  } catch {
    // degrade quietly
  }

  // Latest user-affecting state per entity (rows arrive newest-first).
  const state = new Map<string, "flag" | "hold" | "freeze" | "none">();
  for (const row of enforcement) {
    const key = `${String(row.entity_type)}|${String(row.entity_id)}`;
    if (state.has(key)) continue;
    const action = String(row.action ?? "");
    if (action === "hold" || action === "freeze") state.set(key, action);
    else if (action === "release" || action === "staff_override") state.set(key, "none");
    else if (action === "flag") state.set(key, "flag");
  }

  // Latest score per entity; queue = review/freeze tiers only.
  const seen = new Set<string>();
  const rows: RiskQueueRow[] = [];
  for (const row of scores) {
    const key = `${String(row.entity_type)}|${String(row.entity_id)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const tier = String(row.tier ?? "pass");
    if (tier !== "review" && tier !== "freeze") continue;
    const factors = Array.isArray(row.contributing_factors)
      ? (row.contributing_factors as FactorJson[])
      : [];
    rows.push({
      id: key,
      entityType: String(row.entity_type ?? ""),
      entityId: String(row.entity_id ?? ""),
      riskScore: Number(row.risk_score ?? 0),
      deterministicScore: Number(row.deterministic_score ?? 0),
      tier,
      shadow: Boolean(row.shadow),
      modelVersion: String(row.model_version ?? ""),
      topFactors: factors.slice(0, 3).map((factor) => factorLabel(copy, factor)),
      enforcement: state.get(key) ?? "none",
      scoredAt: String(row.scored_at ?? ""),
    });
  }

  let pending = 0,
    warn = 0,
    breach = 0;
  for (const row of rows) {
    if (row.enforcement === "hold" || row.enforcement === "freeze") continue; // handled
    pending++;
    const bucket = deriveSLABucket(slaTarget(row));
    if (bucket === "warning") warn++;
    if (bucket === "breach") breach++;
  }
  return { rows, pendingCount: pending, slaWarningCount: warn, slaBreachCount: breach };
}

/** Freeze-tier entities want eyes within 30 min; review within 4 h. */
function slaTarget(row: RiskQueueRow): string | null {
  if (!row.scoredAt) return null;
  const minutes = row.tier === "freeze" ? 30 : 240;
  return new Date(Date.parse(row.scoredAt) + minutes * 60_000).toISOString();
}

function buildFilters(copy: StaffRiskCopy): ReadonlyArray<FilterField> {
  return [
    ...DEFAULT_STAFF_QUEUE_FILTERS,
    {
      id: "tier",
      label: copy.columns.tier,
      kind: "segmented",
      options: [
        { value: "review", label: copy.tiers.review },
        { value: "freeze", label: copy.tiers.freeze },
      ],
    },
    {
      id: "entityType",
      label: copy.columns.entity,
      kind: "select",
      options: [
        { value: "account", label: "account" },
        { value: "listing", label: "listing" },
        { value: "transaction", label: "transaction" },
        { value: "support_ticket", label: "support_ticket" },
      ],
    },
  ];
}

function buildBulkActions(copy: StaffRiskCopy): ReadonlyArray<BulkAction> {
  const fill = (template: string) => (n: number) => template.replace("{count}", String(n));
  return [
    {
      id: "apply-hold",
      label: copy.actions.applyHold.label,
      variant: "secondary",
      confirmCopy: fill(copy.actions.applyHold.confirm),
    },
    {
      id: "apply-freeze",
      label: copy.actions.applyFreeze.label,
      variant: "destructive",
      confirmCopy: fill(copy.actions.applyFreeze.confirm),
    },
    {
      id: "release",
      label: copy.actions.release.label,
      variant: "primary",
      requiresReason: true,
      confirmCopy: fill(copy.actions.release.confirm),
    },
    {
      id: "override",
      label: copy.actions.override.label,
      variant: "secondary",
      requiresReason: true,
      confirmCopy: fill(copy.actions.override.confirm),
    },
  ];
}

function matchesFilter(row: RiskQueueRow, filters: FilterValueMap): boolean {
  const tier = typeof filters.tier === "string" ? filters.tier : null;
  const entityType = typeof filters.entityType === "string" ? filters.entityType : null;
  const sla = typeof filters.sla === "string" ? filters.sla : null;
  const search = typeof filters.search === "string" ? filters.search.toLowerCase() : null;
  if (tier && row.tier !== tier) return false;
  if (entityType && row.entityType !== entityType) return false;
  if (sla && deriveSLABucket(slaTarget(row)) !== sla) return false;
  if (search && !`${row.entityId} ${row.topFactors.join(" ")}`.toLowerCase().includes(search)) return false;
  return true;
}

function buildColumns(copy: StaffRiskCopy): ReadonlyArray<QueueColumn<RiskQueueRow>> {
  return [
    {
      id: "entity",
      label: copy.columns.entity,
      width: "minmax(12rem, 1.6fr)",
      render: (row) => (
        <span>
          <strong>{row.data.entityType}</strong>
          <span style={{ marginLeft: "0.4rem", color: "var(--hc-text-tertiary, rgba(10,10,10,0.55))", fontSize: "0.78rem" }}>
            #{row.data.entityId.slice(0, 8)}
          </span>
        </span>
      ),
    },
    {
      id: "tier",
      label: copy.columns.tier,
      width: "7rem",
      render: (row) => (
        <Chip tone={row.data.tier === "freeze" ? "urgent" : "warning"}>
          {row.data.tier === "freeze" ? copy.tiers.freeze : copy.tiers.review}
        </Chip>
      ),
    },
    {
      id: "score",
      label: copy.columns.score,
      width: "6rem",
      render: (row) => (
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {row.data.riskScore}
          {row.data.shadow ? (
            <span style={{ marginLeft: "0.35rem", fontSize: "0.68rem", color: "var(--hc-text-tertiary, rgba(10,10,10,0.55))" }}>
              {copy.shadowBadge}
            </span>
          ) : null}
        </span>
      ),
    },
    {
      id: "factors",
      label: copy.columns.factors,
      width: "minmax(14rem, 2fr)",
      render: (row) => (
        <span style={{ fontSize: "0.78rem", color: "var(--hc-text-tertiary, rgba(10,10,10,0.65))" }}>
          {row.data.topFactors.join(" · ")}
        </span>
      ),
    },
    {
      id: "enforcement",
      label: copy.columns.enforcement,
      width: "8rem",
      render: (row) => {
        const tone =
          row.data.enforcement === "freeze"
            ? "urgent"
            : row.data.enforcement === "hold"
              ? "warning"
              : "neutral";
        return <Chip tone={tone}>{copy.enforcement[row.data.enforcement]}</Chip>;
      },
    },
    {
      id: "scored",
      label: copy.columns.scored,
      width: "5rem",
      render: (row) => (
        <span style={{ fontSize: "0.74rem", color: "var(--hc-text-tertiary, rgba(10,10,10,0.55))" }}>
          {formatRelative(row.data.scoredAt)}
        </span>
      ),
    },
  ];
}

export const staffRiskModule: StaffDashboardModule = {
  slug: "staff-risk",
  title: "Risk",
  description: "Predictive risk review — versioned scores, human-only enforcement.",
  icon: () => <ShieldHalf size={18} aria-hidden />,
  scope: { kind: "cross_division" },
  getEligibleViewer(viewer) {
    return hasStaffAccessIn(viewer, "security") ? "allowed" : "hidden";
  },
  getRoleGate(viewer) {
    if (!hasStaffAccessIn(viewer, "security")) return null;
    return { kind: "allow", role: viewer.role };
  },
  getRoutes(): ReadonlyArray<RouteEntry> {
    return [{ path: "", kind: "home", label: "Risk queue" }];
  },
  async getCommandPaletteEntries(): Promise<ReadonlyArray<PaletteEntry>> {
    return [
      {
        id: "staff-risk.queue",
        source: "staff-risk",
        groupLabel: "Open" as const,
        label: "Open Risk review queue",
        kicker: "Staff",
        href: "/modules/staff-risk",
        keywords: ["risk", "review", "hold", "freeze", "score"],
      },
    ];
  },
  getNotificationCategories(): ReadonlyArray<NotificationCategory> {
    return [{ slug: "risk.review", label: "Risk · review", accent: "#B91C1C", source: "staff-risk" }];
  },
};

export type StaffRiskPageProps = {
  viewer: StaffViewer;
  supabase: RiskSupabaseClient;
  bulkActionHandler: (id: string, ids: string[], reason: string | null) => Promise<void>;
  exportHandler: (
    format: BulkExportFormat,
    capturedFilters: ReadonlyArray<{ label: string; value: string }>,
    visibleIds: string[],
  ) => Promise<void>;
  /** Rendered above the queue by the host (model lifecycle strip — owner actions). */
  lifecycleSlot?: React.ReactNode;
};

export async function StaffRiskPageServer({
  supabase,
  bulkActionHandler,
  exportHandler,
  lifecycleSlot,
}: StaffRiskPageProps) {
  const copy = getStaffRiskCopy("en");
  const snapshot = await loadRiskQueueSnapshot(supabase, copy);
  return (
    <>
      {lifecycleSlot}
      <GenericStaffQueueClient<RiskQueueRow>
        kicker={copy.module.kicker}
        title={copy.module.title}
        description={copy.module.description}
        snapshot={snapshot}
        filterFields={buildFilters(copy)}
        rowAdapter={(row) => ({
          id: row.id,
          sla: deriveSLABucket(slaTarget(row)),
          slaDueAt: slaTarget(row) ?? undefined,
          divisionAccent: STAFF_DIVISION_ACCENT.security ?? "#B91C1C",
          data: row,
        })}
        matchesFilter={matchesFilter}
        columns={buildColumns(copy)}
        bulkActions={buildBulkActions(copy)}
        onBulkAction={bulkActionHandler}
        onExport={exportHandler}
      />
    </>
  );
}
