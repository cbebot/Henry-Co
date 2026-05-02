/**
 * V2-CART-01 — Server helpers.
 *
 * Each consuming app owns its own Supabase client; the helpers here are
 * pure functions of (client, input). Auth checks happen in the calling
 * route — these helpers trust the caller. RLS still backs every read/write.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  EngagementEventInput,
  SaveItemInput,
  SavedItemDivision,
  SavedItemRecord,
  SavedItemSnapshotCore,
  SavedItemStatus,
} from "../types";

type Db = SupabaseClient;

type SavedItemRow = {
  id: string;
  user_id: string;
  division: string;
  item_type: string;
  item_id: string;
  item_snapshot: Record<string, unknown>;
  source_cart_item_id: string | null;
  status: string;
  notes: string | null;
  added_at: string;
  expires_at: string;
  warned_at: string | null;
  soft_deleted_at: string | null;
  restored_to_cart_at: string | null;
};

function rowToRecord(row: SavedItemRow): SavedItemRecord {
  return {
    id: row.id,
    userId: row.user_id,
    division: row.division as SavedItemDivision,
    itemType: row.item_type,
    itemId: row.item_id,
    itemSnapshot: (row.item_snapshot ?? {}) as SavedItemSnapshotCore & Record<string, unknown>,
    sourceCartItemId: row.source_cart_item_id,
    status: row.status as SavedItemStatus,
    notes: row.notes,
    addedAt: row.added_at,
    expiresAt: row.expires_at,
    warnedAt: row.warned_at,
    softDeletedAt: row.soft_deleted_at,
    restoredToCartAt: row.restored_to_cart_at,
  };
}

/**
 * Save an item for later. Idempotent — repeating with the same
 * (user, division, item_type, item_id) refreshes added_at and resets expiry.
 */
export async function saveItemForLater(
  db: Db,
  userId: string,
  input: SaveItemInput
): Promise<SavedItemRecord | null> {
  const { data, error } = await db
    .from("saved_items")
    .upsert(
      {
        user_id: userId,
        division: input.division,
        item_type: input.itemType,
        item_id: input.itemId,
        item_snapshot: input.snapshot ?? {},
        source_cart_item_id: input.sourceCartItemId ?? null,
        notes: input.notes ?? null,
        status: "active",
        added_at: new Date().toISOString(),
        // Server default sets +90 days, but on conflict-update we want it bumped.
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        warned_at: null,
        soft_deleted_at: null,
      },
      { onConflict: "user_id,division,item_type,item_id" }
    )
    .select(
      "id, user_id, division, item_type, item_id, item_snapshot, source_cart_item_id, status, notes, added_at, expires_at, warned_at, soft_deleted_at, restored_to_cart_at"
    )
    .maybeSingle();

  if (error || !data) return null;
  return rowToRecord(data as SavedItemRow);
}

export type ListSavedItemsOptions = {
  division?: SavedItemDivision;
  includeStatuses?: SavedItemStatus[];
  limit?: number;
};

export async function listSavedItems(
  db: Db,
  userId: string,
  options: ListSavedItemsOptions = {}
): Promise<SavedItemRecord[]> {
  let query = db
    .from("saved_items")
    .select(
      "id, user_id, division, item_type, item_id, item_snapshot, source_cart_item_id, status, notes, added_at, expires_at, warned_at, soft_deleted_at, restored_to_cart_at"
    )
    .eq("user_id", userId)
    .order("added_at", { ascending: false });

  const statuses = options.includeStatuses ?? ["active"];
  query = query.in("status", statuses);

  if (options.division) {
    query = query.eq("division", options.division);
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as SavedItemRow[]).map(rowToRecord);
}

export async function countActiveSavedItems(
  db: Db,
  userId: string
): Promise<number> {
  const { count, error } = await db
    .from("saved_items")
    .select("id", { head: true, count: "exact" })
    .eq("user_id", userId)
    .eq("status", "active");
  if (error) return 0;
  return count ?? 0;
}

export async function restoreSavedItem(
  db: Db,
  userId: string,
  savedItemId: string
): Promise<SavedItemRecord | null> {
  const { data, error } = await db
    .from("saved_items")
    .update({
      status: "restored",
      restored_to_cart_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("id", savedItemId)
    .select(
      "id, user_id, division, item_type, item_id, item_snapshot, source_cart_item_id, status, notes, added_at, expires_at, warned_at, soft_deleted_at, restored_to_cart_at"
    )
    .maybeSingle();
  if (error || !data) return null;
  return rowToRecord(data as SavedItemRow);
}

export async function removeSavedItem(
  db: Db,
  userId: string,
  savedItemId: string
): Promise<boolean> {
  const { error } = await db
    .from("saved_items")
    .delete()
    .eq("user_id", userId)
    .eq("id", savedItemId);
  return !error;
}

export async function bulkRestoreSavedItems(
  db: Db,
  userId: string,
  savedItemIds: string[]
): Promise<SavedItemRecord[]> {
  if (savedItemIds.length === 0) return [];
  const { data, error } = await db
    .from("saved_items")
    .update({
      status: "restored",
      restored_to_cart_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .in("id", savedItemIds)
    .select(
      "id, user_id, division, item_type, item_id, item_snapshot, source_cart_item_id, status, notes, added_at, expires_at, warned_at, soft_deleted_at, restored_to_cart_at"
    );
  if (error || !data) return [];
  return (data as SavedItemRow[]).map(rowToRecord);
}

/**
 * Append an engagement event. Dedupes per (user, type, dedupe_key, day) via
 * a partial unique index — calling repeatedly within the same day is a no-op.
 */
export async function emitEngagementEvent(
  db: Db,
  input: EngagementEventInput
): Promise<{ ok: boolean; deduped: boolean }> {
  const { error } = await db.from("user_engagement_events").insert({
    user_id: input.userId,
    event_type: input.eventType,
    division: input.division ?? null,
    subject_type: input.subjectType ?? null,
    subject_id: input.subjectId ?? null,
    dedupe_key: input.dedupeKey,
    payload: input.payload ?? {},
  });

  if (!error) return { ok: true, deduped: false };
  // Postgres unique violation = silently deduped (expected, not a bug).
  const code = (error as { code?: string }).code ?? "";
  if (code === "23505") return { ok: true, deduped: true };
  return { ok: false, deduped: false };
}

export async function recordCartRecoveryState(
  db: Db,
  userId: string,
  state: {
    division: string;
    surface: string;
    cartToken?: string | null;
    itemCount: number;
    subtotalKobo: number;
  }
): Promise<void> {
  await db.from("cart_recovery_state").upsert(
    {
      user_id: userId,
      last_division: state.division,
      last_surface: state.surface,
      last_cart_token: state.cartToken ?? null,
      last_item_count: state.itemCount,
      last_subtotal_kobo: state.subtotalKobo,
      last_visited_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}

export async function getCartRecoveryState(
  db: Db,
  userId: string
): Promise<{
  division: string | null;
  surface: string | null;
  itemCount: number;
  subtotalKobo: number;
  visitedAt: string | null;
} | null> {
  const { data, error } = await db
    .from("cart_recovery_state")
    .select(
      "last_division, last_surface, last_item_count, last_subtotal_kobo, last_visited_at"
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    division: (data as { last_division: string | null }).last_division ?? null,
    surface: (data as { last_surface: string | null }).last_surface ?? null,
    itemCount: Number((data as { last_item_count: number }).last_item_count ?? 0),
    subtotalKobo: Number(
      (data as { last_subtotal_kobo: number }).last_subtotal_kobo ?? 0
    ),
    visitedAt:
      (data as { last_visited_at: string | null }).last_visited_at ?? null,
  };
}

export async function trackRecentlyViewed(
  db: Db,
  userId: string,
  input: {
    division: SavedItemDivision;
    itemType: string;
    itemId: string;
    title?: string;
    href?: string;
    imageUrl?: string;
  }
): Promise<void> {
  await db.from("recently_viewed_items").upsert(
    {
      user_id: userId,
      division: input.division,
      item_type: input.itemType,
      item_id: input.itemId,
      title: input.title ?? null,
      href: input.href ?? null,
      image_url: input.imageUrl ?? null,
      last_viewed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,division,item_type,item_id" }
  );
}

export async function listRecentlyViewed(
  db: Db,
  userId: string,
  options: { division?: SavedItemDivision; limit?: number } = {}
): Promise<
  Array<{
    division: SavedItemDivision;
    itemType: string;
    itemId: string;
    title: string | null;
    href: string | null;
    imageUrl: string | null;
    lastViewedAt: string;
  }>
> {
  let query = db
    .from("recently_viewed_items")
    .select("division, item_type, item_id, title, href, image_url, last_viewed_at")
    .eq("user_id", userId)
    .order("last_viewed_at", { ascending: false });

  if (options.division) query = query.eq("division", options.division);
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error || !data) return [];
  return (
    data as Array<{
      division: string;
      item_type: string;
      item_id: string;
      title: string | null;
      href: string | null;
      image_url: string | null;
      last_viewed_at: string;
    }>
  ).map((row) => ({
    division: row.division as SavedItemDivision,
    itemType: row.item_type,
    itemId: row.item_id,
    title: row.title,
    href: row.href,
    imageUrl: row.image_url,
    lastViewedAt: row.last_viewed_at,
  }));
}
