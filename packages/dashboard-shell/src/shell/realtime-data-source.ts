/**
 * Data-source contract for the shell realtime spine.
 *
 * The shell does NOT own the REST endpoints — they live per-app
 * (e.g. `apps/account/app/api/notifications/recent/route.ts`). The
 * provider asks the host for the URLs at mount time; the rest of the
 * spine machinery (Supabase channel, debounce, backoff) is generic.
 *
 * This indirection keeps the package portable: when the staff bell
 * rolls out across the 9 workspace apps in V2-NOT-02-B / DASH-9, each
 * app passes its own thin endpoint and the spine works unchanged.
 */

import type { RealtimePreferences, RealtimeSignal } from "./realtime-types";

/**
 * Hydration response from a host endpoint. The provider re-shapes into
 * `RealtimeSignal` after fetch.
 */
export type HydrationPayload = {
  unreadCount: number;
  items: ReadonlyArray<RealtimeSignal>;
  /**
   * Set by a host endpoint that degraded (read timeout / error) and returned an
   * empty payload + HTTP 207 instead of failing. The realtime provider treats a
   * degraded hydration as UNtrusted: existing signals are preserved rather than
   * wiped by the empty set, so a transient read never blanks the bell.
   */
  degraded?: boolean;
};

/**
 * Preferences hydration response.
 */
export type PreferencesPayload = {
  preferences: Partial<RealtimePreferences> | null;
};

/**
 * Source URLs the host app supplies. Either may be omitted to disable
 * that audience entirely.
 */
export type RealtimeSourceConfig = {
  /**
   * GET endpoint returning HydrationPayload for the customer audience.
   * Default: `/api/notifications/recent` (apps/account convention).
   */
  customerHydrateUrl?: string;
  /**
   * GET endpoint returning HydrationPayload for the staff audience.
   * Default: `/api/staff-notifications/recent` (workspace apps; only
   * implemented in V2-NOT-02-B).
   */
  staffHydrateUrl?: string;
  /**
   * GET endpoint returning PreferencesPayload for the customer audience.
   * Default: `/api/notifications/preferences`.
   */
  preferencesUrl?: string;
};

/** Default endpoint URLs for apps/account. Workspace apps override. */
export const DEFAULT_SOURCE_CONFIG: Required<RealtimeSourceConfig> = {
  customerHydrateUrl: "/api/notifications/recent?limit=20",
  staffHydrateUrl: "/api/staff-notifications/recent?limit=20",
  preferencesUrl: "/api/notifications/preferences",
};
