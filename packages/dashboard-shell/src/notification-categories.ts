/**
 * @henryco/dashboard-shell/notification-categories — notification
 * category contract.
 *
 * Modules declare which notification categories they own. DASH-6 wires
 * the realtime spine that fans out incoming `customer_notifications` /
 * `staff_notifications` rows to the category-claiming module's
 * deep-link template.
 *
 * The DB-side `category` column on the notification tables is the
 * authoritative grouping; this contract just lets each module declare
 * which categories it OWNS so the drawer UI knows whose accent color
 * + label + deep-link template to use.
 */

import type { ReactNode } from "react";
import type { ModuleSlug } from "./register";

/**
 * One category declaration.
 */
export type NotificationCategory = {
  /**
   * Match against `customer_notifications.category` /
   * `staff_notifications.category` column. Multiple modules MUST
   * NOT claim the same slug — DASH-6 will throw at registry build
   * time if two modules collide.
   */
  slug: string;

  /** Human-readable label shown in the drawer. */
  label: string;

  /** Module that owns this category. */
  source: ModuleSlug;

  /** Lucide icon for the drawer item. */
  icon?: ReactNode;

  /**
   * Accent color for the category chip. Falls back to the module's
   * division accent if absent.
   */
  accent?: string;

  /**
   * Severity-aware accent. If present, the drawer uses this color
   * for `priority='security'` / `priority='urgent'` rows under this
   * category, falling back to `accent` for `info`/`warning`.
   */
  urgentAccent?: string;

  /**
   * Deep-link template. `{{notification_id}}` and `{{reference_id}}`
   * are interpolated at click time using the realtime payload. Used
   * for routing the user from the drawer item to the canonical
   * surface.
   *
   * Example: `/care/bookings/{{reference_id}}`
   */
  deepLinkTemplate?: string;

  /**
   * Default time-to-live for an in-drawer category placeholder.
   * Matches the existing customer notification quiet-hours model.
   */
  ttlSeconds?: number;
};
