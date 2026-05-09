/**
 * @henryco/dashboard-shell/staff-register — Track C (staff dashboard)
 * module registry.
 *
 * Parallel to the Track A registry in `./register.ts`. Track C modules
 * are SEPARATE from Track A consumer modules and Track B owner modules
 * — anti-pattern #19 (role-agnostic UI) is enforced by construction
 * because the Track C shell composition reads from this registry, not
 * from `getEligibleModules()`.
 *
 * Each Track C module describes:
 *   - the same module-shaped fields Track A modules have (slug, title,
 *     description, icon, getRoleGate, getCommandPaletteEntries,
 *     getNotificationCategories) — so the Cmd+K palette + the
 *     notification drawer + the role gate all work uniformly across
 *     tracks.
 *   - Track-C-specific fields (scope, getQueues, getBulkActions) that
 *     describe the operator-shaped surfaces queue cards consume.
 *
 * SHIPS WITH DASH-9.
 */

import type { ReactNode } from "react";
import type { StaffDivision, StaffViewer } from "@henryco/auth/staff";

import type { PaletteEntry } from "./command-palette";
import type { NotificationCategory } from "./notification-categories";
import type { RoleDecision } from "./role-gate";
import type { RouteEntry } from "./register";

/**
 * The 13 Track C module slugs. `staff-marketing` is reserved for the
 * newsletter editor sub-module (deep-linked from `staff-overview` per
 * the route inventory).
 */
export type StaffModuleSlug =
  | "staff-overview"
  | "staff-care"
  | "staff-marketplace"
  | "staff-property"
  | "staff-studio"
  | "staff-jobs"
  | "staff-learn"
  | "staff-logistics"
  | "staff-support"
  | "staff-moderation"
  | "staff-finance-operator"
  | "staff-settings"
  | "staff-marketing";

/**
 * Module scope — division-bound vs cross-division. The shell uses this
 * to decide which getRoleGate path runs and which division accent
 * applies.
 */
export type StaffModuleScope =
  | { kind: "cross_division" }
  | { kind: "division"; division: StaffDivision };

// SLABucket is owned by ./components/sla-chip — re-exported via the
// components barrel. Imports here pull from the same source so a
// queue descriptor's slaBreach state aligns with the chip rendering.
import type { SLABucket } from "./components/sla-chip";
export type { SLABucket };

/**
 * One queue surface a Track C module renders. Each queue has its own
 * filter state, bulk-action stack, and export. The shell composes
 * these into the WorkspaceRail division entries (count badges) and
 * the per-module page (the queue table).
 */
export type StaffQueueDescriptor = {
  /** Stable id, unique within the module. */
  id: string;
  /** Display label. */
  title: string;
  /** Short description for tooltips. */
  description?: string;
  /** Module-relative href (e.g. "queues/inbox" → /modules/staff-care/queues/inbox). */
  href: string;
  /** Total open count (every row not in done state). */
  pendingCount: number;
  /** SLA-warning count (target_response_at within warning window). */
  slaWarningCount: number;
  /** SLA-breach count (target_response_at past). */
  slaBreachCount: number;
  /** Optional accent — division accent for division-bound queues, neutral for cross-division. */
  accent?: string;
  /** Optional kicker shown above the queue card title (e.g. "URGENT"). */
  kicker?: string;
};

/**
 * One bulk-action descriptor. The BulkActionBar renders these as
 * buttons; the action handler runs on the server.
 */
export type StaffBulkAction = {
  id: string;
  label: string;
  /** Whether this action requires a reason capture (refund, suspend, ban, etc.). */
  requiresReason?: boolean;
  /** Optional confirmation copy ("This will refund 12 orders…"). */
  confirmCopy?: (selectedCount: number) => string;
  /** Action category — drives icon + accent color. */
  variant: "primary" | "secondary" | "destructive";
};

/**
 * Track C module contract. Mirrors the Track A `DashboardModule`
 * shape on shared fields (slug, title, description, icon, getRoleGate,
 * getCommandPaletteEntries, getNotificationCategories, getRoutes) and
 * adds Track-C-specific fields (scope, getQueues, getBulkActions).
 */
export type StaffDashboardModule = {
  slug: StaffModuleSlug;
  title: string;
  description: string;
  icon: ReactNode | (() => ReactNode);

  /** Cross-division or division-bound. */
  scope: StaffModuleScope;

  /**
   * Coarse eligibility — the rail uses this to decide whether to
   * render the entry at all. For division-bound modules this returns
   * "hidden" if the viewer has no membership in the bound division.
   */
  getEligibleViewer: (viewer: StaffViewer) => "allowed" | "hidden";

  /**
   * Module-side gate. Returns null to hide entirely; returns a
   * RoleDecision to render with optional restrictions.
   */
  getRoleGate: (viewer: StaffViewer) => RoleDecision | null;

  /** Owned URLs under /modules/<slug>/[...]. */
  getRoutes: () => ReadonlyArray<RouteEntry>;

  /** Cmd+K palette entries (DASH-5 consumes). */
  getCommandPaletteEntries: (viewer: StaffViewer) => Promise<ReadonlyArray<PaletteEntry>>;

  /** Notification categories (DASH-6 consumes). */
  getNotificationCategories: () => ReadonlyArray<NotificationCategory>;

  /**
   * Queue descriptors this module renders. The shell consumes these to
   * paint count badges in the rail. Optional — modules without queues
   * (e.g. staff-settings) return an empty list or omit.
   */
  getQueues?: (viewer: StaffViewer) => Promise<ReadonlyArray<StaffQueueDescriptor>>;

  /**
   * Bulk action descriptors. The BulkActionBar renders these. Optional;
   * modules without bulk operations omit.
   */
  getBulkActions?: (viewer: StaffViewer) => ReadonlyArray<StaffBulkAction>;

  /**
   * Optional empty teaching surface — if a queue is empty, the module
   * may surface an instruction to triage the next-most-relevant queue.
   * NO "All caught up!" cartoons (anti-pattern §"Empty / loading /
   * error / success").
   */
  getEmptyTeaching?: (viewer: StaffViewer) => Promise<{
    headline: string;
    body?: string;
    nextQueueHref?: string;
    nextQueueLabel?: string;
  } | null>;

  /**
   * Optional deep-link template for the realtime spine (DASH-6) — when
   * a notification of a given event type lands, this template is
   * interpolated with the notification's payload to produce the click
   * destination.
   */
  getDeepLinkTemplate?: (eventType: string) => string | null;
};

/**
 * Track C module registry — separate Map from Track A's REGISTRY. The
 * Track C shell composition only walks this map; Track A consumer
 * modules cannot leak into Track C even if a misconfigured import
 * registers them in both.
 */
const STAFF_REGISTRY: Map<StaffModuleSlug, StaffDashboardModule> = new Map();

/**
 * Register a Track C module. Idempotent — re-registering the same
 * slug + module identity is a no-op (HMR safe). Different modules
 * registering the same slug throws.
 */
export function registerStaffModule(module: StaffDashboardModule): void {
  const existing = STAFF_REGISTRY.get(module.slug);
  if (existing && existing !== module) {
    throw new Error(
      `[@henryco/dashboard-shell/staff-register] module slug collision: ` +
        `"${module.slug}" registered twice with different module objects.`,
    );
  }
  STAFF_REGISTRY.set(module.slug, module);
}

/**
 * Returns every registered Track C module, in registration order.
 * Mostly for dev tooling.
 */
export function getRegisteredStaffModules(): ReadonlyArray<StaffDashboardModule> {
  return Array.from(STAFF_REGISTRY.values());
}

/**
 * Returns the Track C modules this viewer is eligible to see, gated
 * by each module's `getRoleGate`. A module that returns `null` from
 * its `getRoleGate(viewer)` is filtered out entirely.
 *
 * Called once per shell render (server-side). The result is the
 * Track C composition for the current viewer at the current request.
 */
export function getEligibleStaffModules(viewer: StaffViewer): ReadonlyArray<StaffDashboardModule> {
  const eligible: StaffDashboardModule[] = [];
  for (const module of STAFF_REGISTRY.values()) {
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
export function _resetStaffRegistryForTests(): void {
  STAFF_REGISTRY.clear();
}

/**
 * Helper: derive whether a module is visible to a viewer. Used by
 * the Cmd+K aggregator to decide whether to surface a Track C
 * module's palette entries for the current viewer.
 */
export function staffModuleVisibleToViewer(
  module: StaffDashboardModule,
  viewer: StaffViewer,
): boolean {
  const decision = module.getRoleGate(viewer);
  if (!decision) return false;
  return decision.kind === "allow";
}
