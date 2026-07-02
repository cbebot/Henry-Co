/**
 * Stage 3 — one-time backfill of property listings from the Storage-JSON snapshot into the
 * `property_listings` Postgres table (docs/v3/property/PROPERTY-STORAGE-TO-DB-MIGRATION.md).
 *
 * Idempotent (upsert on id). DRY-RUN by default — prints what it WOULD write; pass `--apply` to
 * actually write. Never touches `henry_onyx_verified` (the badge is the SECURITY DEFINER writer's
 * column). Requires the property app env (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY +
 * the property-runtime bucket).
 *
 * Run (mirrors property's verify:live runner so server-only imports resolve):
 *   node --conditions=react-server --import tsx apps/property/scripts/backfill-listings-to-db.ts          # dry run
 *   node --conditions=react-server --import tsx apps/property/scripts/backfill-listings-to-db.ts --apply  # write
 *
 * Cutover order: run --apply, confirm PARITY OK, THEN set PROPERTY_DB_LISTINGS=true (Stage 4).
 * Never flip the flag before parity is confirmed — reads prefer the DB, so a partial backfill
 * would hide listings.
 */
import { readPropertyRuntimeSnapshot } from "@/lib/property/store";
import { writeListingToDb, listListingsFromDb } from "@/lib/property/db";

const apply = process.argv.includes("--apply");

async function main() {
  const snapshot = await readPropertyRuntimeSnapshot();
  const listings = snapshot.listings;
  console.log(`Storage snapshot: ${listings.length} listings.`);

  const before = await listListingsFromDb();
  console.log(`property_listings (DB) currently: ${before.length} row(s).`);

  if (!apply) {
    console.log(`\nDRY RUN — would upsert ${listings.length} listing(s) into property_listings.`);
    console.log("Re-run with --apply to write.");
    return;
  }

  // Force the (normally flag-gated) dual-writer for the one-time backfill.
  process.env.PROPERTY_DB_LISTINGS = "true";
  let written = 0;
  for (const listing of listings) {
    await writeListingToDb(listing);
    written += 1;
  }

  const after = await listListingsFromDb();
  console.log(`\nBackfilled ${written} listing(s). property_listings (DB) now: ${after.length} row(s).`);
  console.log(after.length >= listings.length ? "PARITY OK ✓" : "PARITY MISMATCH — investigate before Stage 4 cutover");
}

main().catch((error) => {
  console.error("backfill failed:", error);
  process.exit(1);
});
