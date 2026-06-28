import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import { createDataAdminClient, type TypedSupabaseClient } from "@henryco/data";
import { normalizeEmail } from "@henryco/config";

/**
 * Module-local data layer for the learn (Henry Onyx Academy) home
 * widgets.
 *
 * The account shell renders the learn landing in
 * `apps/account/app/(account)/learn/page.tsx` from
 * `getLearnAccountSummary` (`apps/account/lib/learn-module.ts`),
 * `getDivisionActivity` (`apps/account/lib/division-data.ts`), and the
 * `learnStats` / `heroState` taxonomy in
 * `apps/account/components/learn/helpers.ts`. Those modules live behind
 * the app's `@/` path alias and pull in app-only side effects (the
 * admin Supabase client, the i18n server runtime), so a workspace
 * package cannot import them directly — mirroring how the marketplace,
 * wallet, and care module packages re-issue their reads through
 * `@henryco/data` rather than reaching into `apps/account`.
 *
 * This file therefore ports the *read-only* slice of that pipeline:
 *   - the same `learn_*` collection read with the
 *     `care_security_logs` fallback used when the relational `learn_*`
 *     tables are not present in an environment (verbatim from
 *     `learn-module.ts:readLearnCollection`),
 *   - the same `user_id` OR `normalized_email` identity match
 *     (`matchesIdentity`),
 *   - the same per-metric status filters and the source fn's `.slice(0, 4)`
 *     caps, so the numbers these widgets render are byte-for-byte the
 *     same figures the `/learn` hero tiles show, and
 *   - the `learnStats` / `heroState` derivation from `helpers.ts`.
 *
 * No writes happen here — home widgets read existing API/DB only. The
 * numbers the widgets render are the real per-viewer learning aggregates;
 * nothing is fabricated. A viewer with no enrollments sees honest zeros.
 */

/* ------------------------------------------------------------------ *
 * Quick actions (shared by the command palette + the entry card)
 * ------------------------------------------------------------------ */

/**
 * The palette groups a quick action may belong to. A strict subset of
 * the shell's `PaletteGroupLabel` so the module can map 1:1 without a
 * lossy cast.
 */
export type QuickActionGroup = "Open" | "Create" | "Search";

export type QuickAction = {
  id: string;
  label: string;
  description: string;
  href: string;
  group: QuickActionGroup;
  keywords: ReadonlyArray<string>;
};

/** The live top-level surface this module routes to. */
export const LEARN_HOME_HREF = "/learn";

export function getLearnQuickActions(): ReadonlyArray<QuickAction> {
  return [
    {
      id: "learn.browse",
      label: "Browse courses",
      description: "Explore the Academy catalog.",
      href: LEARN_HOME_HREF,
      group: "Search",
      keywords: ["courses", "learn", "academy", "catalog", "classes"],
    },
    {
      id: "learn.continue",
      label: "Continue learning",
      description: "Pick up where you left off.",
      href: LEARN_HOME_HREF,
      group: "Open",
      keywords: ["continue", "progress", "lessons", "resume"],
    },
    {
      id: "learn.certificates",
      label: "Certificates",
      description: "View and download earned certificates.",
      href: LEARN_HOME_HREF,
      group: "Open",
      keywords: ["certificate", "download", "achievement", "credential"],
    },
  ];
}

/* ------------------------------------------------------------------ *
 * Learning aggregate types
 * ------------------------------------------------------------------ */

/**
 * Per-viewer learning metrics. 1:1 with the `metrics` block returned by
 * `getLearnAccountSummary` in `apps/account/lib/learn-module.ts`.
 *
 * NOTE: each count is capped at 4, faithfully matching the source fn,
 * which derives every metric from a `.slice(0, 4)` list. The account
 * `/learn` hero tiles render these same capped figures (the page feeds
 * `summary.metrics` straight into `learnStats`), so capping here keeps
 * the module card and the division landing perfectly consistent.
 */
export type LearnMetrics = {
  /** In-progress enrollments (status active / awaiting_payment / paused). */
  activeCourses: number;
  /** Completed enrollments. */
  completedCourses: number;
  /** Issued certificates. */
  certificates: number;
  /** Assigned learning items. */
  assignedLearning: number;
  /** Saved (bookmarked) courses. */
  savedCourses: number;
};

/** Mirrors `helpers.ts:LearnStats` (teacher-application signal omitted —
 *  it is not one of this module's surfaced metrics). */
export type LearnStats = {
  metrics: LearnMetrics;
  hasAnyEnrollment: boolean;
  hasAnyAssignment: boolean;
};

/** Mirrors `helpers.ts:HeroState`. */
export type LearnHeroState = "empty" | "calm" | "active";

/** A recent learn activity row (mirrors `helpers.ts:LearnActivityRow`). */
export type LearnActivityRow = {
  id: string;
  activityType: string | null;
  title: string | null;
  description: string | null;
  status: string | null;
  occurredAt: string;
  actionUrl: string | null;
};

export type LearnSnapshot = {
  stats: LearnStats;
  hero: LearnHeroState;
  /** Most recent learn activity (newest first), capped for the widget. */
  recentActivity: ReadonlyArray<LearnActivityRow>;
};

/* ------------------------------------------------------------------ *
 * Stats + hero state — verbatim from components/learn/helpers.ts
 * ------------------------------------------------------------------ */

/** Build the learn stats. Mirrors `helpers.ts:learnStats`. */
export function learnStats(metrics: LearnMetrics): LearnStats {
  return {
    metrics,
    hasAnyEnrollment: metrics.activeCourses + metrics.completedCourses > 0,
    hasAnyAssignment: metrics.assignedLearning > 0,
  };
}

/** Derive the hero mood. Mirrors `helpers.ts:heroState` (teacher-application
 *  branch omitted — not surfaced by this module). */
export function heroState(stats: LearnStats): LearnHeroState {
  if (
    !stats.hasAnyEnrollment &&
    !stats.hasAnyAssignment &&
    stats.metrics.savedCourses === 0
  ) {
    return "empty";
  }
  if (stats.metrics.activeCourses > 0 || stats.hasAnyAssignment) return "active";
  return "calm";
}

/* ------------------------------------------------------------------ *
 * Collection read (read-only port of learn-module.ts)
 * ------------------------------------------------------------------ */

type DataClient = TypedSupabaseClient;
type LearnRow = Record<string, unknown>;

const LEARN_STORE_ROUTE = "/learn/store";
const ACTIVE_ENROLLMENT_STATUSES = new Set(["active", "awaiting_payment", "paused"]);

/** Per-worker presence cache — mirrors `learn-module.ts:tablePresenceCache`. */
const tablePresenceCache = new Map<string, boolean>();

function cleanText(value: unknown): string {
  return String(value ?? "").trim();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function matchesIdentity(
  row: LearnRow,
  userId: string,
  normalizedEmail: string | null,
): boolean {
  return (
    cleanText(row.user_id) === userId ||
    (!!normalizedEmail && cleanText(row.normalized_email) === normalizedEmail)
  );
}

/**
 * True when the relational `learn_*` table exists in this environment.
 * Verbatim logic from `learn-module.ts:hasLearnTable`. The typed
 * `@henryco/data` client does not accept a dynamic table name on its
 * `.from()` overloads, so the call casts through `as never` (the same
 * untyped-table posture the wallet module uses).
 */
async function hasLearnTable(client: DataClient, table: string): Promise<boolean> {
  if (tablePresenceCache.has(table)) {
    return tablePresenceCache.get(table) ?? false;
  }
  try {
    const { error } = await client
      .from(table as never)
      .select("id")
      .limit(1);
    const exists =
      !error || !cleanText(error.message).includes("Could not find the table");
    tablePresenceCache.set(table, exists);
    return exists;
  } catch {
    tablePresenceCache.set(table, false);
    return false;
  }
}

/**
 * Reconstruct a learn collection from the `care_security_logs` mirror
 * rows the learn store writes when the relational tables are absent.
 * Verbatim logic from `learn-module.ts:readFallbackRows`, minus the
 * `throw` (a home widget degrades to honest empty rather than crashing
 * the whole home feed).
 */
async function readFallbackRows(client: DataClient, table: string): Promise<LearnRow[]> {
  const { data, error } = await client
    .from("care_security_logs")
    .select("details, created_at")
    .eq("route", LEARN_STORE_ROUTE)
    .eq("event_type", `learn_store_${table}`)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) return [];

  const merged = new Map<string, LearnRow>();
  for (const row of (data ?? []) as Array<{ details: unknown }>) {
    const details = asRecord(row.details);
    const payload = asRecord(details?.payload);
    const recordId =
      cleanText(details?.record_id) ||
      cleanText(payload?.id) ||
      cleanText(payload?.key);

    if (!payload || !recordId || merged.has(recordId)) continue;
    if (payload.__deleted === true) continue;
    merged.set(recordId, payload);
  }

  return [...merged.values()];
}

/**
 * Read a learn collection — the relational table when present, otherwise
 * the `care_security_logs` fallback. Counts are order-independent (every
 * metric is `min(matches, 4)`), so no ordering is applied.
 */
async function readLearnCollection(client: DataClient, table: string): Promise<LearnRow[]> {
  if (await hasLearnTable(client, table)) {
    const { data, error } = await client.from(table as never).select("*");
    if (error) return [];
    return (data ?? []) as LearnRow[];
  }
  return readFallbackRows(client, table);
}

/**
 * Recent learn activity. Read-only port of
 * `getDivisionActivity(userId, "learn", 20)` from
 * `apps/account/lib/division-data.ts` (the app's locale machine-translation
 * step needs the i18n server runtime and is intentionally dropped here).
 */
async function loadRecentLearnActivity(
  client: DataClient,
  userId: string,
  limit: number,
): Promise<LearnActivityRow[]> {
  const { data } = await client
    .from("customer_activity")
    .select("id, activity_type, title, description, status, created_at, action_url")
    .eq("user_id", userId)
    .eq("division", "learn")
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = (data ?? []) as Array<{
    id: string | null;
    activity_type: string | null;
    title: string | null;
    description: string | null;
    status: string | null;
    created_at: string | null;
    action_url: string | null;
  }>;

  return rows.map((row, idx) => ({
    id: String(row.id || `${row.activity_type || "learn"}-${idx}`),
    activityType: row.activity_type ? String(row.activity_type) : null,
    title: row.title ? String(row.title) : null,
    description: row.description ? String(row.description) : null,
    status: row.status ? String(row.status) : null,
    occurredAt: String(row.created_at || ""),
    actionUrl: row.action_url ? String(row.action_url) : null,
  }));
}

/**
 * Build the learn snapshot for the current viewer. Returns null when the
 * viewer is not a customer-context viewer (owner / staff lanes that don't
 * carry a customer learning surface). The eligibility gate in
 * `getRoleGate` is broader (any customer-surface viewer) — this null is
 * the data-layer guard, matching the wallet / marketplace / care modules.
 */
export async function loadLearnSnapshot(viewer: UnifiedViewer): Promise<LearnSnapshot | null> {
  if (viewer.kind !== "customer") return null;

  const client = createDataAdminClient();
  const userId = viewer.user.id;
  const normalizedEmail = normalizeEmail(viewer.user.email);

  const [courseRows, enrollmentRows, assignmentRows, certificateRows, savedRows, recentActivity] =
    await Promise.all([
      readLearnCollection(client, "learn_courses"),
      readLearnCollection(client, "learn_enrollments"),
      readLearnCollection(client, "learn_assignments"),
      readLearnCollection(client, "learn_certificates"),
      readLearnCollection(client, "learn_saved_courses"),
      loadRecentLearnActivity(client, userId, 20),
    ]);

  // Course id set — an enrollment / saved row only counts when its course
  // resolves, matching `learn-module.ts` (which keys off the courses map).
  const courseIds = new Set(
    courseRows.map((row) => cleanText(row.id)).filter(Boolean),
  );

  const enrollments = enrollmentRows.filter((row) => matchesIdentity(row, userId, normalizedEmail));
  const assignments = assignmentRows.filter((row) => matchesIdentity(row, userId, normalizedEmail));
  const certificates = certificateRows.filter((row) => matchesIdentity(row, userId, normalizedEmail));
  const saved = savedRows.filter((row) => matchesIdentity(row, userId, normalizedEmail));

  // Each metric mirrors the source fn's filter + `.slice(0, 4)` cap.
  const activeCourses = enrollments.filter(
    (row) =>
      ACTIVE_ENROLLMENT_STATUSES.has(cleanText(row.status)) &&
      courseIds.has(cleanText(row.course_id)),
  );
  const completedCourses = enrollments.filter(
    (row) => cleanText(row.status) === "completed" && courseIds.has(cleanText(row.course_id)),
  );
  const savedWithCourse = saved.filter((row) => courseIds.has(cleanText(row.course_id)));

  const metrics: LearnMetrics = {
    activeCourses: activeCourses.slice(0, 4).length,
    completedCourses: completedCourses.slice(0, 4).length,
    certificates: certificates.slice(0, 4).length,
    assignedLearning: assignments.slice(0, 4).length,
    savedCourses: savedWithCourse.slice(0, 4).length,
  };

  const stats = learnStats(metrics);

  return {
    stats,
    hero: heroState(stats),
    recentActivity,
  };
}
