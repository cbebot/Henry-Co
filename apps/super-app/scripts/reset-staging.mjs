/**
 * Staging reset helper — does NOT delete data by default.
 *
 * Full resets are destructive. Run only against non-production Supabase projects.
 *
 * Usage:
 *   # Print checklist only (default)
 *   node apps/super-app/scripts/reset-staging.mjs
 *
 *   # After manual review, wipe app-owned tables (requires explicit confirm + service role)
 *   STAGING_RESET_CONFIRM=YES SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node apps/super-app/scripts/reset-staging.mjs --execute
 *
 * This script intentionally omits TRUNCATE/CASCADE for marketplace/jobs/learn/property data;
 * add division-specific SQL in each vertical’s tooling when those schemas are finalized.
 */

const execute = process.argv.includes("--execute");
const confirmed = process.env.STAGING_RESET_CONFIRM === "YES";
const url = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`
HenryCo staging reset checklist
===============================
1. Confirm project URL is STAGING (not production).
2. Notify testers; capture a backup if required.
3. Optional: revoke test user sessions in Supabase Auth UI.
4. Truncate or delete rows in staging-only tables (per vertical).
5. Re-run seeds: node apps/super-app/scripts/seed.mjs (with service role env).

Super-app related tables (if present): divisions, contact_submissions, activity (when added).
`);

if (!execute) {
  console.log("Dry run only. Pass --execute with STAGING_RESET_CONFIRM=YES and service role to run deletes (when implemented).");
  process.exit(0);
}

if (!confirmed || !url || !key) {
  console.error("Refusing execute: need STAGING_RESET_CONFIRM=YES, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

console.log("Execute path not yet implemented — add explicit table deletes here after schema review.");
process.exit(2);
