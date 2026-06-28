import "server-only";

import type { UnifiedViewer } from "@henryco/auth";
import { createDataAdminClient, type TypedSupabaseClient } from "@henryco/data";
import { normalizeEmail } from "@henryco/config";

/**
 * Module-local data layer for the studio (Henry Onyx Studio) home
 * widgets.
 *
 * The account shell loads a customer's studio dashboard in
 * `apps/account/lib/studio-module.ts` (`getStudioDashboardData`), then
 * aggregates it with `studioStats` / `heroState` from
 * `apps/account/components/studio/helpers.ts`. Those modules live behind
 * the app's `@/` path alias and pull in app-only side effects (the
 * `createAdminSupabase` storage signer, the `care_security_logs` store
 * fallback, the proposal / milestone / file hydration), so a workspace
 * package cannot import them directly — mirroring how the marketplace,
 * wallet, and care module packages re-issue their reads through
 * `@henryco/data` rather than reaching into `apps/account`.
 *
 * This file therefore ports the *read-only* metric slice of that
 * pipeline. It reproduces, verbatim, the four numbers
 * `getStudioDashboardData().metrics` computes:
 *
 *   - `activeProjects`  — visible projects whose status is not
 *     `delivered` / `archived`.
 *   - `pendingPayments` — visible payments whose status is not
 *     `paid` / `cancelled`.
 *   - `proofSubmitted`  — visible payments carrying a `proof_url`.
 *   - `deliverables`    — visible deliverables count.
 *
 * Visibility mirrors `loadStudioContext`: a project is visible when the
 * viewer owns it (`user_id` / `client_user_id`), when its
 * `normalized_email` matches the viewer's verified mailbox, or when the
 * viewer's `customer_activity` references it. Payments and deliverables
 * are visible when they hang off a visible project (or, for payments,
 * are directly owned / activity-referenced).
 *
 * No writes happen here — home widgets read existing DB only. The
 * numbers the widgets render are the real per-viewer studio aggregates;
 * nothing is fabricated. When the studio tables are absent in an
 * environment, every read degrades to an empty set and the metrics
 * settle to honest zeros rather than throwing.
 */

/** The studio surface inside the account shell. A real, live route. */
export const STUDIO_HOME_HREF = "/studio";

export type StudioMetricsSnapshot = {
  /** Visible projects whose status is not delivered / archived. */
  activeProjects: number;
  /** Visible payments whose status is not paid / cancelled. */
  pendingPayments: number;
  /** Visible payments carrying a payment proof. */
  proofSubmitted: number;
  /** Visible deliverables count. */
  deliverables: number;
  /** Every visible project, regardless of status — drives empty-state copy. */
  totalProjects: number;
  /** Every visible payment, regardless of status. */
  totalPayments: number;
};

// Mirrors `getStudioDashboardData`:
//   activeProjects = projects.filter(status not in {delivered, archived})
//   pendingPayments = payments.filter(status not in {paid, cancelled})
const DELIVERED_PROJECT_STATUSES = new Set(["delivered", "archived"]);
const SETTLED_PAYMENT_STATUSES = new Set(["paid", "cancelled"]);

type DataClient = TypedSupabaseClient;

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

/**
 * Await a Supabase query builder and return its rows, treating any
 * error (including a missing-table error in environments where the
 * studio schema is not applied) as an empty result. This is the same
 * per-read resilience the marketplace and care module data layers use.
 */
async function safeRows<T>(
  query: PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  try {
    const { data, error } = await query;
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

/**
 * Project / payment ids the viewer's studio activity references. Mirrors
 * the `customer_activity` walk in `loadStudioContext`.
 */
async function loadActivityReferences(
  client: DataClient,
  userId: string,
): Promise<{ projectIds: Set<string>; paymentIds: Set<string> }> {
  const rows = await safeRows<{
    reference_id: string | null;
    reference_type: string | null;
    metadata: unknown;
  }>(
    client
      .from("customer_activity")
      .select("reference_id, reference_type, metadata")
      .eq("user_id", userId)
      .eq("division", "studio")
      .order("created_at", { ascending: false })
      .limit(160),
  );

  const projectIds = new Set<string>();
  const paymentIds = new Set<string>();
  for (const row of rows) {
    const referenceType = cleanText(row.reference_type);
    const referenceId = cleanText(row.reference_id);
    const metadata = asObject(row.metadata);
    if (referenceType === "studio_project" && referenceId) projectIds.add(referenceId);
    if (referenceType === "studio_payment" && referenceId) paymentIds.add(referenceId);
    const metaProjectId = cleanText(metadata.project_id);
    if (metaProjectId) projectIds.add(metaProjectId);
  }

  return { projectIds, paymentIds };
}

type ProjectRow = { id: string; status: string | null };

/**
 * Every project the viewer can see — owned (`user_id` / `client_user_id`),
 * email-matched (`normalized_email`), or activity-referenced. Mirrors the
 * `visibleProjects` filter in `loadStudioContext`, merged + deduped by id.
 */
async function loadVisibleProjects(
  client: DataClient,
  userId: string,
  normalizedEmail: string | null,
  activityProjectIds: Set<string>,
): Promise<ProjectRow[]> {
  const select = "id, status";
  const queries: Array<PromiseLike<{ data: ProjectRow[] | null; error: unknown }>> = [
    client
      .from("studio_projects")
      .select(select)
      .or(`client_user_id.eq.${userId},user_id.eq.${userId}`)
      .limit(400),
  ];

  if (normalizedEmail) {
    queries.push(
      client
        .from("studio_projects")
        .select(select)
        .eq("normalized_email", normalizedEmail)
        .limit(400),
    );
  }

  if (activityProjectIds.size > 0) {
    queries.push(
      client
        .from("studio_projects")
        .select(select)
        .in("id", [...activityProjectIds])
        .limit(400),
    );
  }

  const results = await Promise.all(queries.map((query) => safeRows(query)));
  const merged = new Map<string, ProjectRow>();
  for (const rows of results) {
    for (const row of rows) {
      const id = cleanText(row.id);
      if (id && !merged.has(id)) merged.set(id, { id, status: row.status });
    }
  }
  return [...merged.values()];
}

type PaymentRow = { id: string; status: string | null; proof_url: string | null };

/**
 * Every payment the viewer can see — hanging off a visible project,
 * directly owned, email-matched, or activity-referenced. Mirrors the
 * `visiblePayments` filter in `loadStudioContext`.
 */
async function loadVisiblePayments(
  client: DataClient,
  userId: string,
  normalizedEmail: string | null,
  projectIds: Set<string>,
  activityPaymentIds: Set<string>,
): Promise<PaymentRow[]> {
  const select = "id, status, proof_url";
  const queries: Array<PromiseLike<{ data: PaymentRow[] | null; error: unknown }>> = [
    client
      .from("studio_payments")
      .select(select)
      .or(`client_user_id.eq.${userId},user_id.eq.${userId}`)
      .limit(400),
  ];

  if (normalizedEmail) {
    queries.push(
      client
        .from("studio_payments")
        .select(select)
        .eq("normalized_email", normalizedEmail)
        .limit(400),
    );
  }

  if (projectIds.size > 0) {
    queries.push(
      client
        .from("studio_payments")
        .select(select)
        .in("project_id", [...projectIds])
        .limit(400),
    );
  }

  if (activityPaymentIds.size > 0) {
    queries.push(
      client
        .from("studio_payments")
        .select(select)
        .in("id", [...activityPaymentIds])
        .limit(400),
    );
  }

  const results = await Promise.all(queries.map((query) => safeRows(query)));
  const merged = new Map<string, PaymentRow>();
  for (const rows of results) {
    for (const row of rows) {
      const id = cleanText(row.id);
      if (id && !merged.has(id)) {
        merged.set(id, { id, status: row.status, proof_url: row.proof_url });
      }
    }
  }
  return [...merged.values()];
}

/**
 * Count of deliverables hanging off the viewer's visible projects.
 * Mirrors `context.deliverableRows.length` in `getStudioDashboardData`.
 */
async function countVisibleDeliverables(
  client: DataClient,
  projectIds: Set<string>,
): Promise<number> {
  if (projectIds.size === 0) return 0;
  const rows = await safeRows<{ id: string }>(
    client
      .from("studio_deliverables")
      .select("id")
      .in("project_id", [...projectIds])
      .limit(800),
  );
  return rows.length;
}

/**
 * Build the studio metrics snapshot for the current viewer. Returns null
 * when the viewer is not a customer-context viewer (owner / staff lanes
 * load no customer-scoped studio rows) — the same `kind === "customer"`
 * data-layer gate the marketplace and wallet packages apply.
 */
export async function loadStudioSnapshot(
  viewer: UnifiedViewer,
): Promise<StudioMetricsSnapshot | null> {
  if (viewer.kind !== "customer") return null;

  const client = createDataAdminClient();
  const userId = viewer.user.id;
  // Email-membership only when the mailbox is provably the viewer's —
  // an unverified address must not pull in another customer's projects.
  const normalizedEmail = viewer.user.emailVerified
    ? normalizeEmail(viewer.user.email)
    : null;

  const { projectIds: activityProjectIds, paymentIds: activityPaymentIds } =
    await loadActivityReferences(client, userId);

  const projects = await loadVisibleProjects(
    client,
    userId,
    normalizedEmail,
    activityProjectIds,
  );

  // Every visible project id seeds the payment + deliverable visibility,
  // exactly as `loadStudioContext` folds visible projects back into the
  // id set before resolving payments / deliverables.
  const projectIds = new Set<string>(activityProjectIds);
  for (const project of projects) projectIds.add(project.id);

  const [payments, deliverables] = await Promise.all([
    loadVisiblePayments(client, userId, normalizedEmail, projectIds, activityPaymentIds),
    countVisibleDeliverables(client, projectIds),
  ]);

  const activeProjects = projects.filter(
    (project) => !DELIVERED_PROJECT_STATUSES.has(cleanText(project.status)),
  ).length;

  const pendingPayments = payments.filter(
    (payment) => !SETTLED_PAYMENT_STATUSES.has(cleanText(payment.status)),
  ).length;

  const proofSubmitted = payments.filter(
    (payment) => cleanText(payment.proof_url) !== "",
  ).length;

  return {
    activeProjects,
    pendingPayments,
    proofSubmitted,
    deliverables,
    totalProjects: projects.length,
    totalPayments: payments.length,
  };
}

/**
 * True when the viewer has any studio footprint at all — used to decide
 * whether the home widgets surface live metrics or the module defers to
 * its empty-state teaching.
 */
export function hasStudioFootprint(snapshot: StudioMetricsSnapshot | null): boolean {
  if (!snapshot) return false;
  return (
    snapshot.totalProjects > 0 ||
    snapshot.totalPayments > 0 ||
    snapshot.deliverables > 0
  );
}
