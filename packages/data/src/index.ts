/**
 * @henryco/data — unified data access for the HenryCo dashboard.
 *
 * Server-only barrel. Importing this from a client component will
 * fail at build time because each helper carries `import "server-only"`.
 *
 * The package consolidates the cross-division read surface that was
 * previously duplicated across:
 *   - apps/account/lib/account-data.ts
 *   - apps/hub/lib/owner-data.ts
 *   - apps/staff/lib/intelligence-data.ts
 *
 * Closes audit §C.10 #3.
 */

export type { Database, Json, SignalFeedRow } from "./database.types";
export { createDataAdminClient, type TypedSupabaseClient } from "./client";

export {
  getDashboardSummary,
  type DashboardSummary,
  type CustomerSummary,
  type OwnerSummary,
  type StaffSummary,
  type CustomerWalletSnapshot,
  type ActivityRow,
  type NotificationRow,
  type SubscriptionRow,
  type InvoiceRow,
  type SupportThreadRow,
} from "./dashboard-summary";

export {
  getSignalFeed,
  type SignalFeedItem,
  type SignalFeedCursor,
  type SignalFeedOptions,
  type SignalFeedResult,
} from "./signal-feed";

export {
  getCrossDivisionActivity,
  type ActivityItem,
} from "./cross-division-activity";

export {
  getSupportSummary,
  type SupportSummary,
} from "./support-summary";
