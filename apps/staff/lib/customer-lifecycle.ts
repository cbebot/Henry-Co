import "server-only";

import {
  LIFECYCLE_PILLARS,
  LIFECYCLE_PILLAR_LABEL,
  LIFECYCLE_SNAPSHOT_TABLE,
  LIFECYCLE_STAGE_LABEL,
  LIFECYCLE_STAGES,
  type LifecyclePillar,
  type LifecyclePriority,
  type LifecycleStage,
} from "@henryco/lifecycle";
import { createStaffAdminSupabase } from "@/lib/supabase/admin";

const admin = () => createStaffAdminSupabase();

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNullableText(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function toIso(value: unknown): string | null {
  const text = asNullableText(value);
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function asValidStage(value: unknown): LifecycleStage {
  const text = asText(value).toLowerCase();
  return (LIFECYCLE_STAGES as readonly string[]).includes(text)
    ? (text as LifecycleStage)
    : "in_progress";
}

function asValidPillar(value: unknown): LifecyclePillar {
  const text = asText(value).toLowerCase();
  return (LIFECYCLE_PILLARS as readonly string[]).includes(text)
    ? (text as LifecyclePillar)
    : "identity";
}

function asValidPriority(value: unknown): LifecyclePriority {
  const text = asText(value).toLowerCase();
  if (text === "critical" || text === "high" || text === "normal" || text === "low") {
    return text;
  }
  return "normal";
}

export type LifecycleRow = {
  userId: string;
  pillar: LifecyclePillar;
  division: string;
  stage: LifecycleStage;
  priority: LifecyclePriority;
  status: string;
  blockerReason: string | null;
  lastActiveAt: string | null;
  nextActionLabel: string | null;
  nextActionUrl: string | null;
  referenceType: string | null;
  referenceId: string | null;
  updatedAt: string | null;
};

export type LifecycleStageCounts = Record<LifecycleStage, number>;
export type LifecyclePillarCounts = Record<LifecyclePillar, number>;

export type LifecycleStaffSnapshot = {
  stageCounts: LifecycleStageCounts;
  pillarCounts: LifecyclePillarCounts;
  totalRows: number;
  distinctUsers: number;
  blockedRows: LifecycleRow[];
  stalledBusinessRows: LifecycleRow[];
  reengagementRows: LifecycleRow[];
  churnRiskRows: LifecycleRow[];
};

function emptyStageCounts(): LifecycleStageCounts {
  const counts = {} as LifecycleStageCounts;
  for (const stage of LIFECYCLE_STAGES) {
    counts[stage] = 0;
  }
  return counts;
}

function emptyPillarCounts(): LifecyclePillarCounts {
  const counts = {} as LifecyclePillarCounts;
  for (const pillar of LIFECYCLE_PILLARS) {
    counts[pillar] = 0;
  }
  return counts;
}

function mapRow(row: Record<string, unknown>): LifecycleRow {
  return {
    userId: asText(row.user_id),
    pillar: asValidPillar(row.pillar),
    division: asText(row.division),
    stage: asValidStage(row.stage),
    priority: asValidPriority(row.priority),
    status: asText(row.status),
    blockerReason: asNullableText(row.blocker_reason),
    lastActiveAt: toIso(row.last_active_at),
    nextActionLabel: asNullableText(row.next_action_label),
    nextActionUrl: asNullableText(row.next_action_url),
    referenceType: asNullableText(row.reference_type),
    referenceId: asNullableText(row.reference_id),
    updatedAt: toIso(row.updated_at),
  };
}

/**
 * Read aggregate lifecycle state for the staff workspace.
 * Caller must already have passed a role guard (viewerCanAccessOperations etc.).
 * Does NOT resolve PII — only user_ids, pillar state, and deep-link hints are surfaced.
 */
export async function getStaffLifecycleSnapshot(options?: {
  pillarFilter?: LifecyclePillar[];
  rowLimit?: number;
}): Promise<LifecycleStaffSnapshot> {
  const client = admin();
  const limit = options?.rowLimit ?? 2000;
  let query = client
    .from(LIFECYCLE_SNAPSHOT_TABLE)
    .select(
      "user_id, pillar, division, stage, priority, status, blocker_reason, last_active_at, next_action_label, next_action_url, reference_type, reference_id, updated_at"
    )
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (options?.pillarFilter && options.pillarFilter.length > 0) {
    query = query.in("pillar", options.pillarFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.warn("[staff/lifecycle] snapshot read failed:", error.message);
    return {
      stageCounts: emptyStageCounts(),
      pillarCounts: emptyPillarCounts(),
      totalRows: 0,
      distinctUsers: 0,
      blockedRows: [],
      stalledBusinessRows: [],
      reengagementRows: [],
      churnRiskRows: [],
    };
  }

  const rows = ((data ?? []) as Array<Record<string, unknown>>).map(mapRow);
  const stageCounts = emptyStageCounts();
  const pillarCounts = emptyPillarCounts();
  const userSet = new Set<string>();

  for (const row of rows) {
    stageCounts[row.stage] = (stageCounts[row.stage] ?? 0) + 1;
    pillarCounts[row.pillar] = (pillarCounts[row.pillar] ?? 0) + 1;
    if (row.userId) userSet.add(row.userId);
  }

  const blockedRows = rows.filter((row) => row.stage === "blocked").slice(0, 40);
  const stalledBusinessRows = rows.filter((row) => row.stage === "awaiting_business").slice(0, 40);
  const reengagementRows = rows
    .filter((row) => row.stage === "dormant" || row.stage === "reengagement_candidate")
    .slice(0, 40);
  const churnRiskRows = rows.filter((row) => row.stage === "churn_risk").slice(0, 40);

  return {
    stageCounts,
    pillarCounts,
    totalRows: rows.length,
    distinctUsers: userSet.size,
    blockedRows,
    stalledBusinessRows,
    reengagementRows,
    churnRiskRows,
  };
}

/** Fetch per-customer lifecycle detail — used for staff-side customer-profile views. */
export async function getLifecycleEntriesForUser(userId: string): Promise<LifecycleRow[]> {
  const { data, error } = await admin()
    .from(LIFECYCLE_SNAPSHOT_TABLE)
    .select("*")
    .eq("user_id", userId)
    .is("archived_at", null);

  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map(mapRow);
}

export { LIFECYCLE_STAGE_LABEL, LIFECYCLE_PILLAR_LABEL };
