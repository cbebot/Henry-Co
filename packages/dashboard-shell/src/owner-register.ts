/**
 * @henryco/dashboard-shell/owner-register — Track B (owner dashboard)
 * module registry.
 *
 * Parallel to the Track A registry in `./register.ts` and the Track C
 * registry in `./staff-register.ts`. Track B (owner) modules are
 * SEPARATE from Track A consumer modules and Track C staff modules —
 * anti-pattern #19 (role-agnostic UI) is enforced by construction
 * because the Track B shell composition reads from THIS registry, not
 * from `getEligibleModules()` and not from `getEligibleStaffModules()`.
 *
 * Each Track B module describes:
 *   - the same module-shaped fields all tracks share (slug, title,
 *     description, icon, getRoleGate, getCommandPaletteEntries,
 *     getNotificationCategories) — so the Cmd+K palette + the
 *     notification drawer + the role gate all work uniformly across
 *     tracks.
 *   - Track-B-specific fields (getOwnerKpis, getBulkActions,
 *     getReconcileTraces) that describe the density-power-trust
 *     surfaces owner pages consume.
 *
 * SHIPS WITH DASH-8.
 */

import type { ReactNode } from "react";
import type { OwnerViewer } from "@henryco/auth/owner";

import type { PaletteEntry } from "./command-palette";
import type { NotificationCategory } from "./notification-categories";
import type { RoleDecision } from "./role-gate";
import type { RouteEntry } from "./register";

/**
 * The 9 Track B owner module slugs. Mapped 1:1 to the existing
 * `apps/hub/app/owner/(command)/*` route groups.
 */
export type OwnerModuleSlug =
  | "owner-overview"
  | "owner-divisions"
  | "owner-finance"
  | "owner-staff"
  | "owner-brand"
  | "owner-messaging"
  | "owner-operations"
  | "owner-ai"
  | "owner-settings";

/**
 * One owner KPI descriptor. The owner shell renders these as
 * MetricCards; each KPI card carries a reconcile-trace link that opens
 * a drawer with the underlying SQL filter + result set + timestamp.
 *
 * Per DASH-8 anti-pattern #18 ("Bare metrics"): every owner KPI
 * carries a `compareTo` (period-over-period) and a `traceId` (the
 * reconcile-trace identifier). The shell refuses to render an
 * OwnerKpi without `traceId` — bare metrics are forbidden.
 */
export type OwnerKpiDescriptor = {
  /** Stable id, unique within the module. */
  id: string;
  /** Display label. */
  label: string;
  /** Current period value (already formatted). */
  value: string;
  /** Subtitle / context. */
  subtitle?: string;
  /** Period-over-period comparison ("+12% vs prior 7d", "-3 since yesterday"). */
  compareTo?: string;
  /** Trend direction for the trend pill. */
  trend?: "up" | "down" | "flat";
  /** Reconcile-trace id — opens the trace drawer when clicked. Required. */
  traceId: string;
};

/**
 * One owner bulk-action descriptor. The BulkActionBar renders these
 * as buttons; the action handler runs on the server and emits one
 * audit_log row per affected row + one bulk_correlation_id grouping
 * them (V14 gate).
 */
export type OwnerBulkAction = {
  id: string;
  label: string;
  /** Whether this action requires a reason capture (refund, suspend, ban, etc.). */
  requiresReason?: boolean;
  /** Optional confirmation copy ("This will refund 12 invoices…"). */
  confirmCopy?: (selectedCount: number) => string;
  /** Action category — drives icon + accent color. Owner uses conservative palette. */
  variant: "primary" | "secondary" | "destructive";
};

/**
 * One reconcile-trace descriptor. The owner shell opens a drawer
 * per traceId showing the SQL filter, result set, and timestamp the
 * KPI was computed from (V15 gate).
 */
export type OwnerReconcileTrace = {
  id: string;
  /** The metric label this trace explains. */
  label: string;
  /** The SQL query (with bound parameters substituted). */
  sql: string;
  /** The result set as JSON-serialisable rows (first 25 for large counts). */
  rows: ReadonlyArray<Record<string, unknown>>;
  /** ISO-8601 timestamp the query was executed at. */
  executedAt: string;
  /** Optional caveat ("excludes refunded orders", "30-day window"). */
  caveat?: string;
};

/**
 * Track B module contract. Mirrors the Track A `DashboardModule`
 * shape on shared fields and adds Track-B-specific fields
 * (getOwnerKpis, getBulkActions, getReconcileTraces).
 */
export type OwnerDashboardModule = {
  slug: OwnerModuleSlug;
  title: string;
  description: string;
  icon: ReactNode | (() => ReactNode);

  /**
   * Coarse eligibility — the rail uses this to decide whether to
   * render the entry at all. Most owner modules return "allowed"
   * unconditionally because owner access is binary.
   */
  getEligibleViewer: (viewer: OwnerViewer) => "allowed" | "hidden";

  /**
   * Module-side gate. Returns null to hide entirely; returns a
   * RoleDecision to render with optional restrictions.
   */
  getRoleGate: (viewer: OwnerViewer) => RoleDecision | null;

  /** Owned URLs under /owner/[...]. */
  getRoutes: () => ReadonlyArray<RouteEntry>;

  /** Cmd+K palette entries (DASH-5 consumes). */
  getCommandPaletteEntries: (viewer: OwnerViewer) => Promise<ReadonlyArray<PaletteEntry>>;

  /** Notification categories (DASH-6 consumes). */
  getNotificationCategories: () => ReadonlyArray<NotificationCategory>;

  /**
   * KPI descriptors this module renders. The owner-overview module
   * collects all module KPIs into the executive dashboard. Optional —
   * modules without KPIs (e.g. settings) omit.
   */
  getOwnerKpis?: (viewer: OwnerViewer) => Promise<ReadonlyArray<OwnerKpiDescriptor>>;

  /**
   * Bulk action descriptors. The BulkActionBar renders these.
   * Optional; modules without bulk operations omit.
   */
  getBulkActions?: (viewer: OwnerViewer) => ReadonlyArray<OwnerBulkAction>;

  /**
   * Reconcile-trace lookups. Maps a traceId from a KPI to the
   * underlying SQL + result set. The owner shell opens a drawer per
   * traceId. Required if `getOwnerKpis` is defined.
   */
  getReconcileTrace?: (
    traceId: string,
    viewer: OwnerViewer,
  ) => Promise<OwnerReconcileTrace | null>;

  /**
   * Optional deep-link template for the realtime spine (DASH-6) —
   * when a notification of a given event type lands, this template is
   * interpolated with the notification's payload to produce the click
   * destination.
   */
  getDeepLinkTemplate?: (eventType: string) => string | null;
};

/**
 * Track B module registry — separate Map from Track A's REGISTRY and
 * Track C's STAFF_REGISTRY. The Track B shell composition only walks
 * this map; Track A consumer modules and Track C staff modules
 * cannot leak into Track B even if a misconfigured import registers
 * them in both.
 */
const OWNER_REGISTRY: Map<OwnerModuleSlug, OwnerDashboardModule> = new Map();

/**
 * Register a Track B module. Idempotent — re-registering the same
 * slug + module identity is a no-op (HMR safe). Different modules
 * registering the same slug throws.
 */
export function registerOwnerModule(module: OwnerDashboardModule): void {
  const existing = OWNER_REGISTRY.get(module.slug);
  if (existing && existing !== module) {
    throw new Error(
      `[@henryco/dashboard-shell/owner-register] module slug collision: ` +
        `"${module.slug}" registered twice with different module objects.`,
    );
  }
  OWNER_REGISTRY.set(module.slug, module);
}

/**
 * Returns every registered Track B module, in registration order.
 * Mostly for dev tooling.
 */
export function getRegisteredOwnerModules(): ReadonlyArray<OwnerDashboardModule> {
  return Array.from(OWNER_REGISTRY.values());
}

/**
 * Returns the Track B modules this viewer is eligible to see, gated
 * by each module's `getRoleGate`. A module that returns `null` from
 * its `getRoleGate(viewer)` is filtered out entirely.
 *
 * Called once per shell render (server-side). The result is the
 * Track B composition for the current viewer at the current request.
 */
export function getEligibleOwnerModules(viewer: OwnerViewer): ReadonlyArray<OwnerDashboardModule> {
  const eligible: OwnerDashboardModule[] = [];
  for (const module of OWNER_REGISTRY.values()) {
    const decision = module.getRoleGate(viewer);
    if (decision && decision.kind === "allow") {
      eligible.push(module);
    }
  }
  return eligible;
}

/**
 * Test-only: clear the registry. Lets unit tests register a fixture
 * module without leaking state across tests.
 */
export function _resetOwnerRegistryForTests(): void {
  OWNER_REGISTRY.clear();
}

/**
 * Helper: derive whether a module is visible to a viewer. Used by
 * the Cmd+K aggregator to decide whether to surface a Track B
 * module's palette entries for the current viewer.
 */
export function ownerModuleVisibleToViewer(
  module: OwnerDashboardModule,
  viewer: OwnerViewer,
): boolean {
  const decision = module.getRoleGate(viewer);
  if (!decision) return false;
  return decision.kind === "allow";
}
