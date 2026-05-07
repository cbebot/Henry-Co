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
 * The contract every dashboard module ships.
 *
 * Modules are server-side objects (no React state, no hooks at the
 * registry level). The shell calls each method on demand during a
 * server-component render, so each method receives the live viewer
 * and can decide what to surface based on the viewer's access.
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
   * Module-side gate. Returns `null` to hide the module entirely from
   * the viewer; returns a RoleDecision to gate specific features
   * within the module.
   */
  getRoleGate: (viewer: UnifiedViewer) => RoleDecision | null;

  /**
   * Smart Home signal feed widgets the module contributes (DASH-4
   * consumes). Each widget is rendered at the size it requests; the
   * pack algorithm decides final placement.
   */
  getHomeWidgets: (viewer: UnifiedViewer) => Promise<ReadonlyArray<HomeWidget>>;

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
 * The registry is a Map keyed by module slug. DASH-2 introduces
 * `registerModule(module)` and `getRegisteredModules()`. DASH-1 ships
 * the type and an empty stub so consumers can import the type without
 * a registry implementation.
 */
export type ModuleRegistry = Map<ModuleSlug, DashboardModule>;

/**
 * Empty placeholder registry. Replaced in DASH-2 with the real
 * register/getEligibleModules API.
 */
export const _PLACEHOLDER_REGISTRY: ModuleRegistry = new Map();

/**
 * Returns the modules this viewer is eligible to see, gated by each
 * module's `getRoleGate`. DASH-2 implements; DASH-1 stubs to an empty
 * array so type-checkers can verify call sites compile.
 */
export function getEligibleModules(_viewer: UnifiedViewer): ReadonlyArray<DashboardModule> {
  // DASH-2 will replace this with the real registry walk.
  return [];
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
