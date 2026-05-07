/**
 * @henryco/dashboard-shell/register — DashboardModule contract +
 * registry.
 *
 * Modules are how divisions plug into the unified shell. Each module
 * exports a single `module` object that the registry can register;
 * the shell composes the registered modules into the WorkspaceRail
 * (entries), Smart Home signal feed (home widgets), command palette
 * (entries), notification drawer (categories), and route gate (role
 * decisions).
 *
 * DASH-1 SHIPS THE TYPES. DASH-2 SHIPS THE REGISTRY + 2 REFERENCE
 * MODULES (customer-overview, marketplace). DASH-3 SHIPS THE
 * REMAINING MODULES.
 *
 * Registering a module in DASH-1 has NO EFFECT — the shell
 * (`apps/account/app/(account)/layout.tsx`) renders the existing
 * customer-overview content directly until DASH-2 introduces the
 * registry consumer. This is intentional: it lets DASH-1 ship the
 * contract surface for downstream consumers without forcing the
 * registry's runtime composition into the same phase.
 */

import type { ReactNode } from "react";
import type { DashboardRole, UnifiedViewer } from "@henryco/auth";

import type { HomeWidget } from "./home-widget";
import type { PaletteEntry } from "./command-palette";
import type { NotificationCategory } from "./notification-categories";
import type { RoleDecision } from "./role-gate";

/**
 * The 11 divisions a module may belong to (matches
 * `packages/config/company.ts:DivisionKey`). The shell uses the slug
 * to look up division accent colors, support emails, and navigation
 * entries from `COMPANY.divisions`.
 */
export type ModuleSlug =
  | "customer-overview"
  | "care"
  | "marketplace"
  | "studio"
  | "jobs"
  | "learn"
  | "logistics"
  | "property"
  | "wallet"
  | "support"
  | "notifications"
  | "settings"
  | "building" // hidden until V3 launch
  | "hotel"; // hidden until V3 launch

/**
 * The size signal a module's home widget renders at. The Smart Home
 * signal feed (DASH-4) packs these into a CSS grid; sizes are
 * suggestions that the rank-and-pack algorithm honours when possible
 * and overrides when ranking demands it.
 */
export type ModuleSize = "sm" | "md" | "lg";

/**
 * The slot a module wishes to occupy in the WorkspaceRail. `primary`
 * = top-of-rail, `secondary` = below the divider, `utility` = bottom
 * (settings, support, sign-out adjacents).
 */
export type RailSlot = "primary" | "secondary" | "utility";

/**
 * One route entry a module owns. The shell's catch-all module router
 * (`apps/account/app/(account)/modules/[...slug]/page.tsx`) consumes
 * these to know which sub-paths under `/modules/<slug>/...` map to a
 * registered surface.
 *
 * `path` is the relative path under the module's slug (no leading
 * slash). For example, the marketplace module's `orders` entry
 * resolves to `/modules/marketplace/orders` at the shell level.
 *
 * `kind` distinguishes a module's home from its detail/sub-routes;
 * the shell renders the home view by default and uses sub-route
 * entries for deep-linked navigation.
 */
export type RouteEntry = {
  /** Relative path under the module slug, no leading slash. */
  path: string;
  /** "home" = the module's main view; "detail" = a sub-page. */
  kind: "home" | "detail";
  /** Display label for breadcrumbs / tooltips. */
  label: string;
  /** Optional dynamic-segment names — e.g. `["orderId"]` for `/orders/[orderId]`. */
  params?: ReadonlyArray<string>;
};

/**
 * The contract every dashboard module ships.
 *
 * Modules are server-side objects (no React state, no hooks at the
 * registry level). The shell calls each method on demand during a
 * server-component render, so each method receives the live viewer
 * and can decide what to surface based on the viewer's access.
 *
 * 8 manifest exports per the DASH-2 spec:
 *   1. getEligibleViewer  → quick "allowed" | "hidden" decision
 *   2. getRoleGate        → RoleDecision detail (subset of #1)
 *   3. getHomeWidgets     → home-grid contributions
 *   4. getRoutes          → owned URL templates for the catch-all router
 *   5. getCommandPaletteEntries → DASH-5 consumes
 *   6. getNotificationCategories → DASH-6 consumes
 *   7. getEmptyTeaching   → empty-state UI when the module has no content
 *   8. getDeepLinkTemplate → realtime spine URL interpolation
 */
export type DashboardModule = {
  /** Stable slug — used as the URL segment and as the registry key. */
  slug: ModuleSlug;

  /** Display name shown in the WorkspaceRail entry. */
  title: string;

  /** Short subtitle for accessible descriptions and tooltips. */
  description: string;

  /** Lucide icon identifier or a tree-shaken icon component. */
  icon: ReactNode | (() => ReactNode);

  /** Where in the rail this module appears. */
  railSlot: RailSlot;

  /**
   * Coarse eligibility check — used by the rail to decide whether to
   * render the module's entry at all. Equivalent to "is `getRoleGate`
   * non-null", but expressed as a literal "allowed" | "hidden" for
   * call sites that want a single boolean-shaped answer without
   * branching on the RoleDecision shape.
   */
  getEligibleViewer: (viewer: UnifiedViewer) => "allowed" | "hidden";

  /**
   * Module-side gate. Returns `null` to hide the module entirely from
   * the viewer; returns a RoleDecision to gate specific features
   * within the module. `getEligibleViewer` is the boolean projection
   * of this method.
   */
  getRoleGate: (viewer: UnifiedViewer) => RoleDecision | null;

  /**
   * Smart Home signal feed widgets the module contributes (DASH-4
   * consumes). Each widget is rendered at the size it requests; the
   * pack algorithm decides final placement.
   */
  getHomeWidgets: (viewer: UnifiedViewer) => Promise<ReadonlyArray<HomeWidget>>;

  /**
   * Owned URL templates. The shell's catch-all module router
   * (`/modules/[...slug]/page.tsx`) consults this to resolve which
   * registered module owns a given sub-path. Returning at least one
   * entry with `kind: "home"` is required for the module's home view
   * to be reachable via `/modules/<slug>`.
   */
  getRoutes: () => ReadonlyArray<RouteEntry>;

  /**
   * Cmd+K palette entries the module contributes (DASH-5 consumes).
   * Each entry is a deep-link with a label, optional kicker, and
   * keywords for fuzzy matching.
   */
  getCommandPaletteEntries: (
    viewer: UnifiedViewer,
  ) => Promise<ReadonlyArray<PaletteEntry>>;

  /**
   * Notification categories the module owns (DASH-6 consumes). Each
   * category has a slug, label, accent color, and an optional
   * deep-link template the drawer uses to route on click.
   */
  getNotificationCategories: () => ReadonlyArray<NotificationCategory>;

  /**
   * Optional empty-state teaching surface for new users. Returned by
   * the WorkspaceSlot when the module has no content to render.
   */
  getEmptyTeaching?: (viewer: UnifiedViewer) => Promise<EmptyTeaching | null>;

  /**
   * Optional deep-link template the realtime spine (DASH-6) uses to
   * route a notification of a given event type into the module's
   * canonical surface. The template is interpolated with the
   * notification's payload at click time.
   */
  getDeepLinkTemplate?: (eventType: string) => string | null;
};

/**
 * The empty-state teaching surface a module may render when the
 * viewer has no content. Three slots — kicker, headline, action —
 * matching the EmptyState primitive's contract.
 */
export type EmptyTeaching = {
  kicker?: string;
  headline: string;
  body?: string;
  action?: { label: string; href: string };
};

/**
 * The registry is a Map keyed by module slug.
 */
export type ModuleRegistry = Map<ModuleSlug, DashboardModule>;

/**
 * Process-wide module registry. Modules call `registerModule()` once
 * at module-load time; the shell calls `getEligibleModules(viewer)`
 * during a server-component render to walk the registry.
 *
 * The registry is a singleton because Next.js App Router caches
 * imported modules per server worker; a single registry per worker
 * is the natural shape (modules registered once, viewer-scoped walks
 * resolve eligibility per request).
 */
const REGISTRY: ModuleRegistry = new Map();

/**
 * Registers a module. Idempotent — re-registering the same slug is a
 * no-op so HMR + double-imports don't throw. Different modules
 * registering the same slug throws so a typo'd slug doesn't silently
 * collide with another module.
 */
export function registerModule(module: DashboardModule): void {
  const existing = REGISTRY.get(module.slug);
  if (existing && existing !== module) {
    throw new Error(
      `[@henryco/dashboard-shell] module slug collision: ` +
        `"${module.slug}" registered twice with different module objects.`,
    );
  }
  REGISTRY.set(module.slug, module);
}

/**
 * Returns every registered module, in registration order. Mostly for
 * dev tooling; production callers want `getEligibleModules(viewer)`
 * which applies the role gate.
 */
export function getRegisteredModules(): ReadonlyArray<DashboardModule> {
  return Array.from(REGISTRY.values());
}

/**
 * Returns the modules this viewer is eligible to see, gated by each
 * module's `getRoleGate`. A module that returns `null` from its
 * `getRoleGate(viewer)` is filtered out entirely.
 *
 * Called once per shell render (server-side); the result is the
 * registry walk for the current viewer at the current request.
 */
export function getEligibleModules(viewer: UnifiedViewer): ReadonlyArray<DashboardModule> {
  const eligible: DashboardModule[] = [];
  for (const module of REGISTRY.values()) {
    const decision = module.getRoleGate(viewer);
    if (decision && decision.kind === "allow") {
      eligible.push(module);
    }
  }
  return eligible;
}

/**
 * Test-only: clear the registry. Lets unit tests register a fixture
 * module without leaking state across tests. Not exposed in the
 * package barrel.
 */
export function _resetRegistryForTests(): void {
  REGISTRY.clear();
}

/**
 * Helper: derive the role lanes a module should appear in from its
 * RoleDecision. Used by the WorkspaceRail to pre-filter modules
 * before paint.
 */
export function moduleVisibleToRole(
  module: DashboardModule,
  viewer: UnifiedViewer,
): boolean {
  const decision = module.getRoleGate(viewer);
  if (!decision) return false;
  return decision.kind === "allow";
}

export type { DashboardRole };
