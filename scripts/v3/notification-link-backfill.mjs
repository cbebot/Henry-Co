#!/usr/bin/env node
/**
 * V3-03 — Legacy notification link backfill.
 *
 * Per PRODUCT-GAP-LEDGER 2026-04-09:
 *   "409 customer_notifications referenced legacy `/care?booking=%`
 *    URLs at audit. Owner decision required: rewrite or accept."
 *
 * This script implements the rewrite path:
 *   /care?booking=<id>            → /care/bookings/<id>
 *   /care?booking=<id>&...         → /care/bookings/<id>?...
 *
 * Modes:
 *   --dry-run (default)            — emits count + samples, no writes
 *   --apply                         — actually performs the UPDATE
 *                                     in batches; ONLY honored when
 *                                     OWNER_OK=true is set in env.
 *
 * Idempotent — re-running in apply mode is a no-op because the
 * matcher only targets rows whose action_url still matches the
 * legacy regex.
 *
 * Usage (DRY RUN, default):
 *   node scripts/v3/notification-link-backfill.mjs
 *
 * Usage (APPLY — requires OWNER_OK):
 *   OWNER_OK=true node scripts/v3/notification-link-backfill.mjs --apply
 *
 * Required env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Output:
 *   - Stdout: human-readable summary + sample rows.
 *   - Exit code 0 = OK; 1 = error; 2 = mis-config (missing env / --apply
 *     without OWNER_OK).
 */

import { createClient } from "@supabase/supabase-js";

// ─── CLI parsing ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const VERBOSE = args.includes("--verbose") || args.includes("-v");
const SAMPLE_COUNT = (() => {
  const idx = args.indexOf("--samples");
  if (idx === -1) return 10;
  const n = Number.parseInt(args[idx + 1] ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 10;
})();

const OWNER_OK = (process.env.OWNER_OK || "").trim().toLowerCase() === "true";

if (APPLY && !OWNER_OK) {
  console.error(
    "[notification-link-backfill] --apply requires OWNER_OK=true env. Refusing to write.",
  );
  console.error("[notification-link-backfill] Re-run with: OWNER_OK=true ... --apply");
  process.exit(2);
}

// ─── Supabase admin client ─────────────────────────────────────────────────

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const SERVICE_ROLE = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error(
    "[notification-link-backfill] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env. Cannot proceed.",
  );
  process.exit(2);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Legacy URL matcher + rewriter ─────────────────────────────────────────

/**
 * Patterns:
 *   /care?booking=<id>                            → /care/bookings/<id>
 *   /care?booking=<id>&<rest>                     → /care/bookings/<id>?<rest>
 *   (with optional leading host — we strip it for the rewrite, since
 *    action_url is host-relative by convention in customer_notifications)
 *
 * We use a single regex with a capture group for the booking id and
 * an optional capture for trailing query. Negative-lookbehind for `\w`
 * before the `?` is unnecessary because the action_url starts with `/`.
 */
const LEGACY_REGEX =
  /^(?:https?:\/\/[^/]+)?\/care\?booking=([^&\s#]+)(?:&([^\s#]+))?(#.*)?$/;

function rewriteLegacyUrl(input) {
  if (typeof input !== "string") return null;
  const m = input.match(LEGACY_REGEX);
  if (!m) return null;
  const bookingId = m[1];
  const rest = m[2] ?? "";
  const hash = m[3] ?? "";
  let rewritten = `/care/bookings/${encodeURIComponent(bookingId)}`;
  if (rest) rewritten += `?${rest}`;
  if (hash) rewritten += hash;
  return rewritten;
}

// ─── Scan ──────────────────────────────────────────────────────────────────

async function scan() {
  // We use the LIKE pattern as a coarse pre-filter so the query is
  // index-friendly. The regex above does the final disqualification.
  const { data, error } = await supabase
    .from("customer_notifications")
    .select("id, action_url, created_at, division, category")
    .like("action_url", "%/care?booking=%")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[notification-link-backfill] scan error:", error.message);
    process.exit(1);
  }

  const candidates = (data || []).filter((row) => {
    if (!row.action_url) return false;
    const rewritten = rewriteLegacyUrl(row.action_url);
    return rewritten !== null && rewritten !== row.action_url;
  });

  return candidates;
}

// ─── Apply ─────────────────────────────────────────────────────────────────

async function applyRewrites(rows) {
  const BATCH = 100;
  let applied = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    // Apply individually — UPDATE ... IN (...) in supabase-js requires
    // a single new value per row, so we loop. 100/batch keeps the
    // log readable.
    for (const row of batch) {
      const rewritten = rewriteLegacyUrl(row.action_url);
      if (!rewritten) continue;
      const { error } = await supabase
        .from("customer_notifications")
        .update({ action_url: rewritten })
        .eq("id", row.id)
        .eq("action_url", row.action_url); // optimistic guard — idempotent
      if (error) {
        failed += 1;
        console.warn(
          `[notification-link-backfill] update failed id=${row.id}: ${error.message}`,
        );
      } else {
        applied += 1;
      }
    }
    if (VERBOSE) {
      console.info(
        `[notification-link-backfill] batch progress applied=${applied} failed=${failed}`,
      );
    }
  }

  return { applied, failed };
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.info("[notification-link-backfill] V3-03 legacy /care?booking= rewrite");
  console.info(`[notification-link-backfill] mode=${APPLY ? "APPLY" : "DRY-RUN"}`);
  console.info("[notification-link-backfill] scanning customer_notifications...");

  const candidates = await scan();
  console.info(
    `[notification-link-backfill] candidates_count=${candidates.length}`,
  );

  // Sample
  const samples = candidates.slice(0, SAMPLE_COUNT).map((row) => ({
    id: row.id,
    division: row.division,
    category: row.category,
    legacy: row.action_url,
    rewritten: rewriteLegacyUrl(row.action_url),
    created_at: row.created_at,
  }));

  console.info(
    `[notification-link-backfill] sample (first ${samples.length}):`,
  );
  for (const sample of samples) {
    console.info(
      `  - id=${sample.id} legacy=${sample.legacy} → ${sample.rewritten}`,
    );
  }

  if (!APPLY) {
    console.info(
      `[notification-link-backfill] DRY-RUN complete. ${candidates.length} rows would be rewritten.`,
    );
    console.info(
      "[notification-link-backfill] To apply: OWNER_OK=true ... --apply",
    );
    return;
  }

  console.info(
    `[notification-link-backfill] APPLY mode — rewriting ${candidates.length} rows...`,
  );
  const result = await applyRewrites(candidates);
  console.info(
    `[notification-link-backfill] APPLY complete. applied=${result.applied} failed=${result.failed}`,
  );
}

main().catch((err) => {
  console.error("[notification-link-backfill] fatal:", err);
  process.exit(1);
});
