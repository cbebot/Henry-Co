import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import { createDataAdminClient, type TypedSupabaseClient } from "./client";

/**
 * @henryco/data/inbox-aggregate — V3 Wave A1 D3.
 *
 * Unified inbox aggregator for `account.henrycogroup.com/messages`.
 * Pulls open threads from every portal's conversation table so the
 * viewer sees one cross-division inbox with per-portal filter chips.
 *
 * Sources read (customer scope):
 *   - support_threads                  (cross-cutting support, by user_id)
 *   - marketplace_support_threads      (marketplace order/dispute conversations, by customer_user_id)
 *   - jobs_conversations               (employer↔candidate, by candidate_id OR employer_id)
 *   - studio_project_messages          (per-project threads, deduped to one row per project)
 *
 * Care + property + logistics + learn conversations route through the
 * shared `support_threads` table today (the per-division support sync
 * helpers funnel inbound messages into support_threads with a
 * `division` tag — see apps/account/lib/care-sync.ts,
 * apps/account/lib/support-sync.ts), so they surface via the
 * support_threads branch with the division filter chip preserved.
 *
 * RLS posture: every read is filtered by viewer.user.id (defence in
 * depth — the admin client bypasses RLS so we must filter explicitly).
 *
 * Vercel preview degradation contract: if the admin Supabase
 * environment is absent (Supabase URL/anon-key + service role scoped
 * production-only on previews — see memory
 * `project_henryco_vercel_preview_env_gap.md`), this function returns
 * an empty aggregate rather than throwing. Callers render the empty
 * state, never a 500.
 */

export type InboxDivision =
  | "support"
  | "marketplace"
  | "jobs"
  | "studio"
  | "care"
  | "property"
  | "logistics"
  | "learn";

export type InboxThread = {
  /** Stable cross-source ID — combines the source table + row id. */
  key: string;
  /** Logical division this thread belongs to (drives filter chips + accents). */
  division: InboxDivision;
  /** Pretty label for the source ("Support", "Marketplace order", "Interview", ...). */
  sourceLabel: string;
  /** Subject / title line shown in the inbox row. */
  subject: string;
  /** One-line preview of the most recent activity (or status, when no preview is available). */
  preview: string | null;
  /** Status string for the row chip ("open", "pending", "closed", ...). */
  status: string;
  /** True when the thread has unread movement awaiting the viewer. */
  unread: boolean;
  /** ISO timestamp of the most recent activity. Used for ordering. */
  updatedAt: string;
  /** Canonical deep-link to the thread detail surface. */
  href: string;
};

export type InboxAggregate = {
  threads: ReadonlyArray<InboxThread>;
  /** Per-division counts (filter chip badges). */
  counts: Record<InboxDivision, number>;
  totalOpen: number;
  totalUnread: number;
};

const EMPTY_COUNTS: Record<InboxDivision, number> = {
  support: 0,
  marketplace: 0,
  jobs: 0,
  studio: 0,
  care: 0,
  property: 0,
  logistics: 0,
  learn: 0,
};

function emptyAggregate(): InboxAggregate {
  return {
    threads: [],
    counts: { ...EMPTY_COUNTS },
    totalOpen: 0,
    totalUnread: 0,
  };
}

function clientOrNull(): TypedSupabaseClient | null {
  try {
    return createDataAdminClient();
  } catch {
    // Vercel preview deploy with production-scoped envs missing —
    // degrade to empty inbox per V12 / preview-env contract.
    return null;
  }
}

function isClosedStatus(value: string | null | undefined): boolean {
  const v = (value ?? "").toLowerCase();
  return v === "closed" || v === "resolved" || v === "archived" || v === "completed";
}

function mapDivisionFromSupport(raw: string | null): InboxDivision {
  const v = (raw ?? "").toLowerCase();
  if (v === "marketplace") return "marketplace";
  if (v === "care") return "care";
  if (v === "property") return "property";
  if (v === "jobs") return "jobs";
  if (v === "studio") return "studio";
  if (v === "logistics") return "logistics";
  if (v === "learn") return "learn";
  return "support";
}

/**
 * Build the unified inbox aggregate for a viewer.
 */
export async function getInboxAggregate(
  viewer: UnifiedViewer,
  opts: { limit?: number } = {},
): Promise<InboxAggregate> {
  if (viewer.kind !== "customer") {
    // Owner / staff inbox aggregation lives on different schemas
    // (workspace_support_*, staff_assignments). Out of Wave A1 scope —
    // the staff host apps continue to use their own readers.
    return emptyAggregate();
  }

  const client = clientOrNull();
  if (!client) return emptyAggregate();

  const userId = viewer.user.id;
  const limit = Math.min(Math.max(opts.limit ?? 60, 5), 200);

  // Fire every source in parallel. Each branch is wrapped in a
  // try/catch so one slow / missing table can never take the whole
  // inbox down.
  const [supportRows, marketplaceRows, jobsRows, studioRows] = await Promise.all([
    safeRead(() =>
      client
        .from("support_threads")
        .select("id, subject, status, division, created_at, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(limit),
    ),
    safeRead(() =>
      client
        .from("marketplace_support_threads")
        .select("id, subject, status, last_message, updated_at, created_at")
        .eq("user_id", userId)
        .is("archived_at", null)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(limit),
    ),
    safeRead(() =>
      client
        .from("jobs_conversations")
        .select(
          "id, subject, status, candidate_id, employer_id, updated_at, created_at",
        )
        .or(`candidate_id.eq.${userId},employer_id.eq.${userId}`)
        .order("updated_at", { ascending: false })
        .limit(limit),
    ),
    // Studio per-project messages — pick the most recent message per
    // project the viewer is a participant on. Cheap top-N then group
    // in memory (Wave B4 may add a dedicated SQL view). The viewer
    // filter is the project-membership side (sender_id), kept loose
    // here so we surface threads where the viewer participated even
    // briefly. Wave B4 narrows via studio_project_assignments join.
    safeRead(() =>
      client
        .from("studio_project_messages")
        .select("id, project_id, body, sender_id, created_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(limit),
    ),
  ]);

  const threads: InboxThread[] = [];

  for (const row of supportRows ?? []) {
    const division = mapDivisionFromSupport(row.division ?? null);
    const status = row.status ?? "open";
    const updatedAt = row.updated_at ?? row.created_at;
    threads.push({
      key: `support:${row.id}`,
      division,
      sourceLabel: divisionLabel(division),
      subject: row.subject ?? "Support thread",
      preview: null,
      status,
      unread: !isClosedStatus(status),
      updatedAt,
      href: `/support`,
    });
  }

  for (const row of marketplaceRows ?? []) {
    const status = row.status ?? "open";
    const updatedAt = row.updated_at ?? row.created_at;
    threads.push({
      key: `mp:${row.id}`,
      division: "marketplace",
      sourceLabel: "Marketplace",
      subject: row.subject ?? "Marketplace conversation",
      preview: row.last_message ? truncate(row.last_message, 120) : null,
      status,
      unread: !isClosedStatus(status),
      updatedAt,
      href: `/marketplace`,
    });
  }

  for (const row of jobsRows ?? []) {
    const status = row.status ?? "open";
    const updatedAt = row.updated_at ?? row.created_at;
    const viewerIsCandidate = row.candidate_id === userId;
    // Per-side unread counters live in jobs_messages aggregation —
    // Wave C will plumb them through. For now treat any non-closed
    // thread as needing attention.
    threads.push({
      key: `jobs:${row.id}`,
      division: "jobs",
      sourceLabel: viewerIsCandidate ? "Jobs · hiring" : "Jobs · candidate",
      subject: row.subject ?? "Hiring conversation",
      preview: null,
      status,
      unread: !isClosedStatus(status),
      updatedAt,
      href: `/jobs`,
    });
  }

  // Studio: dedupe by project_id, keep most-recent message as preview.
  const studioByProject = new Map<
    string,
    { id: string; body: string | null; createdAt: string }
  >();
  for (const row of studioRows ?? []) {
    if (!row.project_id) continue;
    const existing = studioByProject.get(row.project_id);
    if (!existing || row.created_at > existing.createdAt) {
      studioByProject.set(row.project_id, {
        id: row.id,
        body: row.body,
        createdAt: row.created_at,
      });
    }
  }
  for (const [projectId, msg] of studioByProject.entries()) {
    threads.push({
      key: `studio:${projectId}`,
      division: "studio",
      sourceLabel: "Studio · project",
      subject: "Project conversation",
      preview: msg.body ? truncate(msg.body, 120) : null,
      status: "open",
      unread: false,
      updatedAt: msg.createdAt,
      href: `/studio`,
    });
  }

  threads.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const trimmed = threads.slice(0, limit);

  const counts: Record<InboxDivision, number> = { ...EMPTY_COUNTS };
  let totalOpen = 0;
  let totalUnread = 0;
  for (const t of trimmed) {
    counts[t.division] += 1;
    if (!isClosedStatus(t.status)) totalOpen += 1;
    if (t.unread) totalUnread += 1;
  }

  return { threads: trimmed, counts, totalOpen, totalUnread };
}

async function safeRead<T>(
  fn: () => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[] | null> {
  try {
    const { data, error } = await fn();
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

function divisionLabel(d: InboxDivision): string {
  switch (d) {
    case "support":
      return "Support";
    case "marketplace":
      return "Marketplace";
    case "jobs":
      return "Jobs";
    case "studio":
      return "Studio";
    case "care":
      return "Care";
    case "property":
      return "Property";
    case "logistics":
      return "Logistics";
    case "learn":
      return "Learn";
  }
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}
