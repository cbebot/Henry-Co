/**
 * DEPRECATED — Henry Onyx Jobs careers seed.
 *
 * The careers catalog (employers + open roles) is now seeded by the
 * canonical, idempotent, version-gated auto-seed that runs automatically on
 * first public read:
 *
 *     apps/jobs/lib/jobs/seed-catalog.ts   ← curated employers + roles (data)
 *     apps/jobs/lib/jobs/seed.ts           ← ensureJobsBootstrap() engine
 *
 * That engine writes every row with a DETERMINISTIC UUID and upserts on the
 * `customer_activity.id` primary key, so it is idempotent and race-safe.
 *
 * This standalone script wrote the same job slugs with RANDOM ids via a
 * select-then-insert. Running it alongside the auto-seed would create a
 * SECOND row per job slug (the deterministic upsert can't match a random id),
 * and the public board does not dedupe postings — so it has been retired to a
 * no-op to remove that footgun.
 *
 * To re-seed / refresh content: edit `seed-catalog.ts` and bump
 * `JOBS_SEED_VERSION`. The next public load re-applies the (idempotent)
 * upserts. There is no longer anything to run here.
 */

console.log(
  [
    "seed-jobs.mjs is deprecated and does nothing.",
    "The careers catalog is auto-seeded by apps/jobs/lib/jobs/seed.ts",
    "(ensureJobsBootstrap) on first public read.",
    "To refresh content: edit seed-catalog.ts and bump JOBS_SEED_VERSION.",
  ].join("\n"),
);
