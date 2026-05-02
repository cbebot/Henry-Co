/**
 * V2-CART-01 — Save-for-Later types (cross-division).
 *
 * The shape mirrors public.saved_items. Snapshots stay opaque to the package
 * because each division shapes its own snapshot — but a small set of common
 * keys (title, image, priceKobo) lets the unified UI render cleanly without
 * the package needing to know division internals.
 */

export type SavedItemDivision =
  | "marketplace"
  | "care"
  | "learn"
  | "logistics"
  | "property"
  | "jobs"
  | "studio"
  | "account";

export type SavedItemStatus =
  | "active"
  | "expired"
  | "soft_deleted"
  | "restored";

/**
 * Common snapshot keys every division should fill so the unified
 * /account/saved-items page renders consistently. Divisions are free to add
 * their own extra keys — those round-trip via item_snapshot untouched.
 */
export type SavedItemSnapshotCore = {
  title: string;
  subtitle?: string | null;
  image?: string | null;
  href?: string | null;
  priceKobo?: number | null;
  compareAtKobo?: number | null;
  currency?: string;
  vendorName?: string | null;
  badges?: string[];
};

export type SavedItemRecord = {
  id: string;
  userId: string;
  division: SavedItemDivision;
  itemType: string;
  itemId: string;
  itemSnapshot: SavedItemSnapshotCore & Record<string, unknown>;
  sourceCartItemId: string | null;
  status: SavedItemStatus;
  notes: string | null;
  addedAt: string;
  expiresAt: string;
  warnedAt: string | null;
  softDeletedAt: string | null;
  restoredToCartAt: string | null;
};

export type SaveItemInput = {
  division: SavedItemDivision;
  itemType: string;
  itemId: string;
  snapshot: SavedItemSnapshotCore & Record<string, unknown>;
  sourceCartItemId?: string | null;
  notes?: string | null;
};

export type EngagementEventType =
  | "cart_abandoned"
  | "cart_resumed"
  | "saved_item_added"
  | "saved_item_about_to_expire"
  | "saved_item_restored"
  | "saved_item_expired"
  | "checkout_started"
  | "checkout_resumed"
  | "checkout_abandoned_at_step"
  | "kyc_incomplete_after_signup"
  | "comeback_visit";

export type EngagementEventInput = {
  userId: string;
  eventType: EngagementEventType;
  division?: SavedItemDivision | null;
  subjectType?: string | null;
  subjectId?: string | null;
  /** Stable per-event-instance key — same key + same day = no duplicate row. */
  dedupeKey: string;
  payload?: Record<string, unknown>;
};

/** Soft-removed cart items kept for 30 days for restore. */
export type SoftDeletedCartItem = {
  id: string;
  division: SavedItemDivision;
  itemType: string;
  itemId: string;
  snapshot: SavedItemSnapshotCore & Record<string, unknown>;
  removedAt: string;
  /** ISO timestamp — past this, the item is hard-deleted by the sweeper. */
  recoverableUntil: string;
};

export const SAVED_ITEM_DEFAULT_TTL_DAYS = 90;
export const SAVED_ITEM_WARNING_WINDOW_DAYS = 7;
export const SOFT_DELETE_RECOVERY_WINDOW_DAYS = 30;
