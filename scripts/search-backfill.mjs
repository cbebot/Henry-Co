#!/usr/bin/env node
/**
 * V2-SEARCH-01 — Search index backfill.
 *
 * Provisions every Typesense collection from @henryco/search-core, then
 * walks each indexable Postgres source table and enqueues an outbox row
 * per row. The next worker run pushes those rows to Typesense via the
 * existing drain flow — meaning backfill and incremental indexing share
 * the same code path. (No special-case bulk-import logic; reduces the
 * surface where "backfill broke prod indexing" could ever happen.)
 *
 * Modes:
 *
 *   --dry-run   Print what would happen. No writes.
 *   --apply     Actually enqueue.
 *   --provision Ensure Typesense collections exist (idempotent). Safe with
 *               either of the modes above; on --dry-run alone it still
 *               runs because schema-existence is a precondition for
 *               anything else.
 *
 * Usage:
 *   node scripts/search-backfill.mjs --dry-run
 *   node scripts/search-backfill.mjs --apply
 *   node scripts/search-backfill.mjs --apply --collection hc_workflows
 *
 * Env requirements:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   TYPESENSE_HOST
 *   TYPESENSE_ADMIN_API_KEY
 *
 * Idempotency:
 *   Workflows: keyed on (user_id, workflow_key) UNIQUE — re-run is a no-op
 *   for rows already in `search_workflow_targets`.
 *   Indexed entities: outbox is append-only but Typesense upsert is
 *   idempotent per document_id. Backfill rerun = same N rows enqueued =
 *   same N upserts = identical index state.
 */

import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const args = new Set(process.argv.slice(2));
const isDryRun = args.has("--dry-run");
const shouldApply = args.has("--apply");
const shouldProvision = args.has("--provision") || true; // always provision; cheap.
const onlyCollection = (() => {
  const raw = process.argv.find((a) => a.startsWith("--collection="));
  return raw ? raw.split("=")[1] : null;
})();

if (!isDryRun && !shouldApply) {
  console.error("Usage: search-backfill.mjs --dry-run | --apply [--collection=<name>]");
  process.exit(2);
}

function readEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing env: ${name}`);
    process.exit(2);
  }
  return value;
}

const SUPABASE_URL = readEnv("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_KEY = readEnv("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const supportsTypesense = process.env.TYPESENSE_HOST && process.env.TYPESENSE_ADMIN_API_KEY;

async function provisionCollections() {
  if (!supportsTypesense) {
    console.warn("[backfill] TYPESENSE_HOST/TYPESENSE_ADMIN_API_KEY not set — skipping provisioning.");
    return;
  }
  const { ensureCollectionsExist } = await import("@henryco/search-core");
  const result = await ensureCollectionsExist({});
  console.log("[backfill] Typesense collections ensured:", result);
}

async function enqueue(collection, document_id, operation, payload) {
  if (isDryRun) {
    console.log(`[dry-run] enqueue ${collection} ${operation} ${document_id}`);
    return;
  }
  const { error } = await supabase.rpc("enqueue_search_index_op", {
    p_collection: collection,
    p_document_id: document_id,
    p_operation: operation,
    p_payload: payload ?? {},
  });
  if (error) {
    console.error(`[backfill] enqueue failed for ${document_id}:`, error.message);
  }
}

/* ---------------------------------------------------------------------- */
/* Per-collection backfill walkers.                                        */
/* Each walker:                                                            */
/*   - SELECTs the source table in batches (cursor pagination)             */
/*   - constructs a payload that satisfies SearchDocument                  */
/*   - enqueues an upsert via enqueue_search_index_op                      */
/*                                                                          */
/* The backfill set is the indexable universe AT THE TIME OF V2-SEARCH-01. */
/* New collections added later get their own walker here; new entity       */
/* types within an existing collection are picked up automatically as      */
/* long as the source SELECT is correct.                                   */
/* ---------------------------------------------------------------------- */

async function backfillWorkflows() {
  // search_workflow_targets is owned by sub-systems; backfill just
  // re-projects whatever rows already exist into the index. The trigger
  // would do this on insert, but if Typesense was previously down or
  // backfill is being re-run, we explicitly enqueue.
  const pageSize = 500;
  let from = 0;
  let total = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("search_workflow_targets")
      .select(
        "id, user_id, workflow_key, division, cta_label, title, summary, deep_link, urgency, due_at, created_at, updated_at, resolved_at",
      )
      .is("resolved_at", null)
      .order("updated_at", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const row of data) {
      const docId = `account:workflow:${row.id}`;
      const urgencyValue =
        row.urgency === "critical" ? 1 :
        row.urgency === "high" ? 0.75 :
        row.urgency === "normal" ? 0.5 :
        0.25;
      const payload = {
        id: docId,
        type: "workflow",
        division: row.division,
        title: row.title,
        summary: row.summary ?? "",
        deep_link: row.deep_link,
        role_visibility: ["owner"],
        trust_state: "unknown",
        created_at: Math.floor(new Date(row.created_at).getTime() / 1000),
        updated_at: Math.floor(new Date(row.updated_at).getTime() / 1000),
        tags: ["workflow", row.workflow_key, row.urgency],
        cta_label: row.cta_label,
        due_at: row.due_at,
        owner_user_id: row.user_id,
        ranking_signals: { workflow_urgency: urgencyValue },
      };
      await enqueue("hc_workflows", docId, "upsert", payload);
      total += 1;
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }
  console.log(`[backfill] hc_workflows: enqueued ${total} rows`);
}

async function backfillSupportThreads() {
  const pageSize = 500;
  let from = 0;
  let total = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("support_threads")
      .select("id, user_id, subject, summary, created_at, updated_at, status")
      .order("updated_at", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) {
      // Table may not exist in dev — log + skip rather than abort the run.
      console.warn("[backfill] support_threads skipped:", error.message);
      return;
    }
    if (!data || data.length === 0) break;

    for (const row of data) {
      const docId = `account:support_thread:${row.id}`;
      const trust_state =
        row.status === "closed" ? "closed" :
        row.status === "resolved" ? "closed" :
        "verified";
      const payload = {
        id: docId,
        type: "help",
        division: "account",
        title: row.subject ?? "Support thread",
        summary: row.summary ?? "",
        deep_link: `/support/${row.id}`,
        role_visibility: ["owner", "staff"],
        trust_state,
        created_at: Math.floor(new Date(row.created_at).getTime() / 1000),
        updated_at: Math.floor(new Date(row.updated_at).getTime() / 1000),
        tags: ["support", "thread"],
        owner_user_id: row.user_id,
        ranking_signals: {},
      };
      await enqueue("hc_support_threads", docId, "upsert", payload);
      total += 1;
    }
    if (data.length < pageSize) break;
    from += pageSize;
  }
  console.log(`[backfill] hc_support_threads: enqueued ${total} rows`);
}

async function backfillNotifications() {
  // Notification surface is large + ephemeral; backfill only the unread
  // window so we do not blow up index size with closed alerts.
  const pageSize = 500;
  let from = 0;
  let total = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("customer_notifications")
      .select("id, user_id, title, body, category, created_at, updated_at, read_at")
      .is("read_at", null)
      .order("updated_at", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) {
      console.warn("[backfill] customer_notifications skipped:", error.message);
      return;
    }
    if (!data || data.length === 0) break;

    for (const row of data) {
      const docId = `account:notification:${row.id}`;
      const payload = {
        id: docId,
        type: "account_workflow",
        division: "account",
        title: row.title,
        summary: row.body ?? "",
        deep_link: `/notifications#${row.id}`,
        role_visibility: ["owner"],
        trust_state: "verified",
        created_at: Math.floor(new Date(row.created_at).getTime() / 1000),
        updated_at: Math.floor(new Date(row.updated_at).getTime() / 1000),
        tags: ["notification", row.category ?? "general"],
        owner_user_id: row.user_id,
        ranking_signals: {},
      };
      await enqueue("hc_notifications", docId, "upsert", payload);
      total += 1;
    }
    if (data.length < pageSize) break;
    from += pageSize;
  }
  console.log(`[backfill] hc_notifications: enqueued ${total} rows`);
}

const WALKERS = {
  hc_workflows: backfillWorkflows,
  hc_support_threads: backfillSupportThreads,
  hc_notifications: backfillNotifications,
  // hc_marketplace_*, hc_property_*, hc_jobs_*, hc_learn_*, hc_care_*,
  // hc_logistics_*, hc_studio_* live in their division-owned Supabase
  // projects. Each division ships its own walker (next pass per
  // V2-SEARCH-01 hand-off) using the same enqueue_search_index_op
  // contract documented above. The hub-owned walkers are the canonical
  // implementation reference.
};

async function main() {
  console.log("[backfill] starting", { isDryRun, shouldApply, onlyCollection });

  if (shouldProvision) {
    try {
      await provisionCollections();
    } catch (error) {
      console.error("[backfill] provisioning failed:", error.message);
      process.exit(1);
    }
  }

  const targets = onlyCollection ? [onlyCollection] : Object.keys(WALKERS);
  for (const collection of targets) {
    const walker = WALKERS[collection];
    if (!walker) {
      console.warn(`[backfill] no walker for collection ${collection}; skipping`);
      continue;
    }
    try {
      await walker();
    } catch (error) {
      console.error(`[backfill] ${collection} failed:`, error.message);
    }
  }

  console.log("[backfill] done.");
}

main().catch((error) => {
  console.error("[backfill] fatal:", error);
  process.exit(1);
});
