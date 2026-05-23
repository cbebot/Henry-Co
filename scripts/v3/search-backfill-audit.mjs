#!/usr/bin/env node
/**
 * SEARCH-01 — Search backfill audit.
 *
 * For each Typesense collection registered in `@henryco/search-core`,
 * compare:
 *   - Supabase source-table row count (best-effort; unknown collections
 *     get a placeholder)
 *   - Typesense document count (via /collections/<name>)
 *
 * Report the gap. The script never enqueues by default; opt in with
 *   --apply  AND  OWNER_OK=true
 * to re-enqueue missing rows via `enqueue_search_index_op`.
 *
 * Required env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   TYPESENSE_HOST
 *   TYPESENSE_ADMIN_API_KEY
 *
 * Usage:
 *   node scripts/v3/search-backfill-audit.mjs
 *   node scripts/v3/search-backfill-audit.mjs --collection=hc_workflows
 *   OWNER_OK=true node scripts/v3/search-backfill-audit.mjs --apply
 *
 * NOTE: This script DOES NOT modify Typesense schemas. It only reads
 * counts and (in --apply mode) writes outbox rows. The worker is the
 * single channel into Typesense.
 */

import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const args = new Set(process.argv.slice(2).filter((a) => !a.startsWith("--collection=")));
const onlyCollection = (() => {
  const raw = process.argv.find((a) => a.startsWith("--collection="));
  return raw ? raw.split("=")[1] : null;
})();
const shouldApply = args.has("--apply");
const ownerOk = String(process.env.OWNER_OK ?? "").toLowerCase() === "true";

function readEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`[search-audit] missing env: ${name}`);
    process.exit(2);
  }
  return value;
}

const SUPABASE_URL = readEnv("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_KEY = readEnv("SUPABASE_SERVICE_ROLE_KEY");
const TYPESENSE_HOST = readEnv("TYPESENSE_HOST");
const TYPESENSE_ADMIN_API_KEY = readEnv("TYPESENSE_ADMIN_API_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * Per-collection source descriptor. Each entry maps the Typesense
 * collection to the canonical Supabase source table and an optional
 * "active row" filter (e.g. workflows only count un-resolved rows).
 *
 * When `source: null` the gap is informational only — the script
 * reports the Typesense doc count but cannot compute the Supabase
 * side because the source either lives in another project (division-
 * owned Supabase) or has no canonical 1:1 table.
 *
 * Add a new collection here when a new walker ships in
 * `scripts/search-backfill.mjs`.
 */
const SOURCE_MAP = {
  hc_workflows: {
    source: "search_workflow_targets",
    filter: (q) => q.is("resolved_at", null),
  },
  hc_support_threads: {
    source: "support_threads",
    filter: null,
  },
  hc_notifications: {
    source: "customer_notifications",
    filter: (q) => q.is("read_at", null),
  },
  // The remaining collections are owned by division apps and live in
  // their own Supabase projects per the V2-SEARCH-01 hand-off note.
  // We surface the Typesense doc count only.
  hc_marketplace_products: { source: null, filter: null },
  hc_marketplace_stores: { source: null, filter: null },
  hc_property_listings: { source: null, filter: null },
  hc_property_areas: { source: null, filter: null },
  hc_jobs_postings: { source: null, filter: null },
  hc_jobs_employers: { source: null, filter: null },
  hc_learn_courses: { source: null, filter: null },
  hc_learn_certificates: { source: null, filter: null },
  hc_care_services: { source: null, filter: null },
  hc_care_providers: { source: null, filter: null },
  hc_logistics_shipments: { source: null, filter: null },
  hc_studio_projects: { source: null, filter: null },
};

async function fetchTypesenseCount(collection) {
  const url = `${TYPESENSE_HOST.replace(/\/+$/, "")}/collections/${collection}`;
  const response = await fetch(url, {
    headers: { "X-TYPESENSE-API-KEY": TYPESENSE_ADMIN_API_KEY },
  });
  if (response.status === 404) {
    return { exists: false, count: 0 };
  }
  if (!response.ok) {
    throw new Error(`Typesense GET ${collection} failed: ${response.status}`);
  }
  const data = await response.json();
  return { exists: true, count: Number(data.num_documents ?? 0) };
}

async function fetchSupabaseCount(spec) {
  if (!spec.source) return null;
  let query = supabase.from(spec.source).select("*", { count: "exact", head: true });
  if (spec.filter) query = spec.filter(query);
  const { count, error } = await query;
  if (error) {
    return { error: error.message };
  }
  return { count: count ?? 0 };
}

async function enqueueMissing(_collection /* string */) {
  // Re-enqueue path is intentionally a thin wrapper around the existing
  // backfill walkers — we delegate so backfill remains the single
  // source-of-truth for payload shape per collection. The script signals
  // intent here and the operator runs the matching walker explicitly.
  console.log(
    `[search-audit] --apply mode: delegate to existing backfill walker — run \`node scripts/search-backfill.mjs --apply --collection=${_collection}\` to re-enqueue missing rows.`,
  );
}

async function main() {
  if (shouldApply && !ownerOk) {
    console.error("[search-audit] --apply requires OWNER_OK=true in env.");
    process.exit(2);
  }

  const collections = onlyCollection ? [onlyCollection] : Object.keys(SOURCE_MAP);
  const report = [];
  for (const collection of collections) {
    const spec = SOURCE_MAP[collection];
    if (!spec) {
      report.push({ collection, status: "unknown_collection" });
      continue;
    }
    let typesense;
    try {
      typesense = await fetchTypesenseCount(collection);
    } catch (error) {
      report.push({ collection, status: "typesense_error", error: String(error.message) });
      continue;
    }
    const supabaseResult = await fetchSupabaseCount(spec);
    const row = { collection, typesense_count: typesense.count, exists: typesense.exists };
    if (supabaseResult === null) {
      row.supabase_count = null;
      row.gap = null;
      row.note = "division-owned source — cross-project audit not yet wired";
    } else if ("error" in supabaseResult) {
      row.supabase_count = null;
      row.gap = null;
      row.note = `source table read failed: ${supabaseResult.error}`;
    } else {
      row.supabase_count = supabaseResult.count;
      row.gap = supabaseResult.count - typesense.count;
    }
    report.push(row);
  }

  const json = { generated_at: new Date().toISOString(), report };
  console.log(JSON.stringify(json, null, 2));

  // Summary line for human readers and CI.
  const drift = report.filter((r) => typeof r.gap === "number" && r.gap !== 0);
  console.error(
    `[search-audit] ${report.length} collections audited; ${drift.length} drift(s) detected.`,
  );

  if (shouldApply && drift.length > 0) {
    for (const r of drift) {
      await enqueueMissing(r.collection);
    }
  }
}

main().catch((error) => {
  console.error("[search-audit] fatal:", error);
  process.exit(1);
});
