import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import { createDataAdminClient } from "@henryco/data";

/**
 * Module-local data layer for the support home widgets. Returns a
 * single typed snapshot the widgets render against. Issues all reads in
 * parallel via the typed admin client; each branch handles its own
 * missing-row case so an empty table doesn't cascade into a widget-
 * level error.
 *
 * Per V2 scope §"NOT permitted in DASH-3: New API surfaces — module
 * home widgets read existing API/DB." No new state-changing endpoints.
 *
 * The customer-facing support inbox lives in `support_threads` (live
 * prod table — not `customer_support_threads`). Staff-side support
 * threads sit on a separate schema (workspace_support_*) which DASH-3
 * does not surface; the support module's getEligibleViewer/getRoleGate
 * gate keeps the home widgets customer-only.
 */

const ACTIVE_STATUSES = new Set(["open", "awaiting_reply", "in_progress"]);
const RESOLVED_STATUSES = new Set(["resolved", "closed"]);

export type SupportThreadStatus =
  | "open"
  | "awaiting_reply"
  | "in_progress"
  | "resolved"
  | "closed";

export type SupportThreadPriority = "low" | "normal" | "high" | "urgent";

export type SupportThreadRow = {
  id: string;
  subject: string;
  status: SupportThreadStatus;
  priority: SupportThreadPriority | null;
  division: string | null;
  updatedAt: string;
  createdAt: string;
};

export type SupportSnapshot = {
  /** Threads not in a resolved/closed state. */
  openCount: number;
  /** Threads where the customer needs to reply (status = awaiting_reply). */
  awaitingReplyCount: number;
  /** Threads where priority is high or urgent. */
  escalatedCount: number;
  /** Recent active threads, capped at 3 for the panel widget. Newest first. */
  recentOpen: ReadonlyArray<SupportThreadRow>;
  /** Whether the user has any thread at all (history exists, even if all resolved). */
  hasAnyHistory: boolean;
  /** Most recent activity timestamp across all threads. */
  lastActivityAt: string | null;
};

function normaliseStatus(value: unknown): SupportThreadStatus {
  const raw = String(value ?? "").toLowerCase();
  if (raw === "awaiting_reply") return "awaiting_reply";
  if (raw === "in_progress") return "in_progress";
  if (raw === "resolved") return "resolved";
  if (raw === "closed") return "closed";
  return "open";
}

function normalisePriority(value: unknown): SupportThreadPriority | null {
  const raw = String(value ?? "").toLowerCase();
  if (raw === "low") return "low";
  if (raw === "normal") return "normal";
  if (raw === "high") return "high";
  if (raw === "urgent") return "urgent";
  return null;
}

/**
 * Build the snapshot the support widgets render against.
 *
 * Reads `support_threads` rows scoped to `user_id`. Open / awaiting-
 * reply / escalated counts are derived in-memory from the same row set
 * to avoid a second round-trip — typical user has < 50 threads.
 */
export async function loadSupportSnapshot(
  viewer: UnifiedViewer,
): Promise<SupportSnapshot | null> {
  if (viewer.kind !== "customer") return null;

  const client = createDataAdminClient();
  const userId = viewer.user.id;

  const { data, error } = await client
    .from("support_threads")
    .select("id, subject, status, priority, division, updated_at, created_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error || !data) {
    return {
      openCount: 0,
      awaitingReplyCount: 0,
      escalatedCount: 0,
      recentOpen: [],
      hasAnyHistory: false,
      lastActivityAt: null,
    };
  }

  let openCount = 0;
  let awaitingReplyCount = 0;
  let escalatedCount = 0;
  const allThreads: SupportThreadRow[] = [];
  const recentOpen: SupportThreadRow[] = [];

  for (const row of data) {
    const status = normaliseStatus(row.status);
    const priority = normalisePriority(row.priority);
    const thread: SupportThreadRow = {
      id: String(row.id),
      subject: String(row.subject ?? "Untitled request"),
      status,
      priority,
      division: row.division ? String(row.division) : null,
      updatedAt: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
      createdAt: String(row.created_at ?? new Date().toISOString()),
    };
    allThreads.push(thread);

    const isResolved = RESOLVED_STATUSES.has(status);
    const isActive = ACTIVE_STATUSES.has(status);

    if (!isResolved) openCount++;
    if (status === "awaiting_reply") awaitingReplyCount++;
    if (priority === "high" || priority === "urgent") {
      if (!isResolved) escalatedCount++;
    }

    if (isActive && recentOpen.length < 3) recentOpen.push(thread);
  }

  return {
    openCount,
    awaitingReplyCount,
    escalatedCount,
    recentOpen,
    hasAnyHistory: allThreads.length > 0,
    lastActivityAt: allThreads.length > 0 ? allThreads[0]!.updatedAt : null,
  };
}
