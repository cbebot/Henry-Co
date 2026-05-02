/**
 * Worker-side outbox helpers.
 *
 * Used by:
 *   - apps/hub/app/api/cron/search-index-worker/route.ts (the periodic worker)
 *   - scripts/search-backfill.ts (one-shot backfill script)
 *
 * Responsibilities:
 *   - Drain pending rows from `public.search_index_outbox`.
 *   - Validate payloads against `searchDocumentSchema`.
 *   - Push to Typesense via the admin client.
 *   - Mark rows complete (or stamp last_error and bump attempts).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { getAdminClient, readTypesenseEnv, type TypesenseAdminClient, type TypesenseEnv } from "./client";
import { COLLECTIONS_BY_NAME } from "./collections";
import { searchDocumentSchema } from "./schema";

interface OutboxRow {
  id: number;
  collection: string;
  document_id: string;
  operation: "upsert" | "delete";
  payload: Record<string, unknown>;
  attempts: number;
}

export interface DrainOutboxResult {
  processed: number;
  upserted: number;
  deleted: number;
  failed: number;
  collections: Record<string, { success: number; failed: number }>;
}

const DEFAULT_BATCH_SIZE = 500;
const MAX_ATTEMPTS = 8;

export async function drainOutbox(input: {
  supabase: SupabaseClient;
  typesenseEnv?: TypesenseEnv;
  batchSize?: number;
}): Promise<DrainOutboxResult> {
  const env = input.typesenseEnv ?? readTypesenseEnv();
  if (!env.host || !env.adminApiKey) {
    throw new Error("[search-core/outbox] Typesense env not configured.");
  }
  const client = getAdminClient(env);
  const batchSize = input.batchSize ?? DEFAULT_BATCH_SIZE;

  // 1. Pull pending rows.
  const { data, error } = await input.supabase
    .from("search_index_outbox")
    .select("id, collection, document_id, operation, payload, attempts")
    .is("completed_at", null)
    .lt("attempts", MAX_ATTEMPTS)
    .order("enqueued_at", { ascending: true })
    .limit(batchSize);

  if (error) {
    throw new Error(`[search-core/outbox] pull failed: ${error.message}`);
  }

  const rows = (data ?? []) as OutboxRow[];
  const result: DrainOutboxResult = {
    processed: 0,
    upserted: 0,
    deleted: 0,
    failed: 0,
    collections: {},
  };
  if (rows.length === 0) return result;

  // 2. Group by (collection, operation) so we can bulk-import upserts.
  const upsertsByCollection = new Map<string, OutboxRow[]>();
  const deletes: OutboxRow[] = [];
  for (const row of rows) {
    if (row.operation === "delete") {
      deletes.push(row);
    } else {
      if (!upsertsByCollection.has(row.collection)) {
        upsertsByCollection.set(row.collection, []);
      }
      upsertsByCollection.get(row.collection)!.push(row);
    }
  }

  // 3. Process upserts per collection (bulk import).
  for (const [collection, batch] of upsertsByCollection) {
    if (!COLLECTIONS_BY_NAME[collection]) {
      await markFailed(input.supabase, batch, `unknown collection: ${collection}`);
      result.failed += batch.length;
      continue;
    }
    const validated: { row: OutboxRow; doc: Record<string, unknown> }[] = [];
    for (const row of batch) {
      const candidate = ensureDocumentId({ ...row.payload, id: row.document_id });
      const parsed = searchDocumentSchema.safeParse(candidate);
      if (!parsed.success) {
        await markFailed(input.supabase, [row], `payload invalid: ${parsed.error.message}`);
        result.failed += 1;
        continue;
      }
      validated.push({ row, doc: parsed.data as Record<string, unknown> });
    }

    if (validated.length === 0) continue;

    let bulkResult = { success: 0, failed: 0 };
    try {
      bulkResult = await client.upsertDocumentsBulk(
        collection,
        validated.map((v) => v.doc),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await markFailed(
        input.supabase,
        validated.map((v) => v.row),
        message,
      );
      result.failed += validated.length;
      result.collections[collection] = {
        success: 0,
        failed: (result.collections[collection]?.failed ?? 0) + validated.length,
      };
      continue;
    }

    if (bulkResult.failed > 0) {
      // Typesense partial-success: mark all as attempted, requeue on next pass.
      await markAttempted(
        input.supabase,
        validated.map((v) => v.row),
        `bulk import partial: ${bulkResult.failed} failed`,
      );
    } else {
      await markCompleted(
        input.supabase,
        validated.map((v) => v.row.id),
      );
    }
    result.processed += validated.length;
    result.upserted += bulkResult.success;
    result.failed += bulkResult.failed;
    result.collections[collection] = {
      success: (result.collections[collection]?.success ?? 0) + bulkResult.success,
      failed: (result.collections[collection]?.failed ?? 0) + bulkResult.failed,
    };
  }

  // 4. Process deletes individually.
  for (const row of deletes) {
    if (!COLLECTIONS_BY_NAME[row.collection]) {
      await markFailed(input.supabase, [row], `unknown collection: ${row.collection}`);
      result.failed += 1;
      continue;
    }
    try {
      await client.deleteDocument(row.collection, row.document_id);
      await markCompleted(input.supabase, [row.id]);
      result.deleted += 1;
      result.processed += 1;
      result.collections[row.collection] = {
        success: (result.collections[row.collection]?.success ?? 0) + 1,
        failed: result.collections[row.collection]?.failed ?? 0,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await markFailed(input.supabase, [row], message);
      result.failed += 1;
      result.collections[row.collection] = {
        success: result.collections[row.collection]?.success ?? 0,
        failed: (result.collections[row.collection]?.failed ?? 0) + 1,
      };
    }
  }

  return result;
}

function ensureDocumentId(payload: Record<string, unknown>): Record<string, unknown> {
  return payload;
}

async function markCompleted(supabase: SupabaseClient, ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const nowIso = new Date().toISOString();
  await supabase
    .from("search_index_outbox")
    .update({ completed_at: nowIso, attempted_at: nowIso, last_error: null })
    .in("id", ids);
}

async function markAttempted(
  supabase: SupabaseClient,
  rows: OutboxRow[],
  error: string,
): Promise<void> {
  if (rows.length === 0) return;
  const nowIso = new Date().toISOString();
  for (const row of rows) {
    await supabase
      .from("search_index_outbox")
      .update({
        attempted_at: nowIso,
        attempts: row.attempts + 1,
        last_error: error.slice(0, 1024),
      })
      .eq("id", row.id);
  }
}

async function markFailed(supabase: SupabaseClient, rows: OutboxRow[], error: string): Promise<void> {
  await markAttempted(supabase, rows, error);
}

/**
 * Provision Typesense collections from the static definitions in
 * `./collections`. Idempotent — uses GET /collections/<name> to check.
 *
 * Callable from a one-shot script or a privileged admin route.
 */
export async function ensureCollectionsExist(input: { client?: TypesenseAdminClient; env?: TypesenseEnv }): Promise<{
  created: string[];
  existed: string[];
}> {
  const env = input.env ?? readTypesenseEnv();
  if (!env.host || !env.adminApiKey) {
    throw new Error("[search-core/outbox] Typesense env not configured.");
  }
  const client = input.client ?? getAdminClient(env);
  const created: string[] = [];
  const existed: string[] = [];

  for (const collection of Object.values(COLLECTIONS_BY_NAME)) {
    try {
      await client.ensureCollection({
        name: collection.name,
        fields: collection.fields as unknown[],
        default_sorting_field: collection.default_sorting_field,
      });
      // ensureCollection swallows 404 + creates; we cannot distinguish here
      // without an extra call, so we record "ensured".
      created.push(collection.name);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("already exists")) {
        existed.push(collection.name);
      } else {
        throw error;
      }
    }
  }

  return { created, existed };
}
