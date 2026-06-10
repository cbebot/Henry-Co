import "server-only";

/**
 * Henry Onyx Jobs — idempotent careers auto-seed.
 *
 * The public read layer (`./data.ts`) shows whatever published roles live in
 * the `customer_activity` table; in production that was empty, so the careers
 * board read "0 open roles". This bootstrap writes the company's own
 * employers + curated openings (see `./seed-catalog.ts`) into the live tables
 * on first read, exactly once per content version.
 *
 * Properties:
 *   - Idempotent AND race-safe: jobs/employers live in the shared
 *     `customer_activity` table, which has no natural unique key on
 *     (division, activity_type, reference_id). So instead of the app's
 *     non-atomic select-then-insert, every seeded row gets a DETERMINISTIC
 *     UUID and is upserted on the `id` primary key — two concurrent cold
 *     starts converge on the same rows instead of duplicating them. (The
 *     board read also de-dupes postings by slug as a belt-and-braces guard
 *     against any pre-existing random-id rows.)
 *   - Attributed to a SYSTEM user, never a human. `customer_activity.user_id`
 *     is a required FK to auth.users, and several per-user readers (the
 *     account /activity feed, the Smart Home signal feed, dashboard summaries)
 *     surface a user's rows with NO activity_type filter. Attributing 30+
 *     company-content rows to the platform owner would flood their personal
 *     feeds. Instead we resolve (or create once) a dedicated, non-login
 *     "Henry Onyx Careers" service user and own the catalog under it, so no
 *     human's feed is polluted. The public board reads by division +
 *     activity_type (never user_id), so attribution does not affect rendering.
 *   - Version-gated: skips entirely once the persisted seed marker matches
 *     `JOBS_SEED_VERSION`; bump the version to re-apply.
 *   - Service-role-guarded: without the service-role key it no-ops, so a
 *     misconfigured deploy still renders (empty) rather than 500-ing.
 *   - Backed-off: a deferred/failed run is retried on a cooldown, not on
 *     every request.
 *   - Schema-drift-resilient: `writeWithSchemaRetry` strips any column the
 *     live table is missing and retries (committed schema can lag prod). It
 *     does NOT swallow NOT-NULL/CHECK/FK/trigger errors — those surface.
 *   - Content only: NO applications/offers/payments are written.
 *   - Additive/refresh-only: this upserts; it does NOT auto-retire rows
 *     dropped from the catalog in a later version. Retire a removed role
 *     deliberately.
 */

import { getOptionalEnv } from "@/lib/env";
import { createAdminSupabase } from "@/lib/supabase";
import {
  JOBS_SEED_CURRENCY,
  JOBS_SEED_POSTED_BASE,
  JOBS_SEED_VERSION,
  seedEmployers,
  seedJobs,
  type SeedEmployer,
  type SeedJob,
} from "@/lib/jobs/seed-catalog";

const JOBS_DIVISION = "jobs";
const ACTIVITY_EMPLOYER_PROFILE = "jobs_employer_profile";
const ACTIVITY_EMPLOYER_VERIFICATION = "jobs_employer_verification";
const ACTIVITY_JOB_POST = "jobs_post";
/** Internal, non-user-facing marker row that records the seeded version. */
const ACTIVITY_SEED_MARKER = "jobs_seed_marker";
const SEED_MARKER_REFERENCE = "bootstrap";

/**
 * Dedicated service identity that OWNS the seeded careers content. A
 * non-login account on the company domain (no email is ever sent — created
 * with email_confirm), so the catalog never lands in a real person's
 * activity/signal/dashboard feeds.
 */
const SEED_SYSTEM_EMAIL = "careers-system@henryonyx.com";

const DEFAULT_PIPELINE_STAGES = [
  "applied",
  "reviewing",
  "shortlisted",
  "interview",
  "offer",
  "hired",
  "rejected",
];

/** Retry a deferred/failed bootstrap at most this often (ms). */
const RETRY_COOLDOWN_MS = 60_000;

let bootstrapPromise: Promise<void> | null = null;
let verifiedCurrent = false;
let lastAttemptAt = 0;

function hasServiceRole() {
  return Boolean(getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

/** Deterministic UUID so re-seeds (and concurrent instances) converge on the
 *  same `customer_activity.id` instead of inserting duplicate rows. */
function seedUuid(block: string, n: number): string {
  return `${block}-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

/** Stable posting timestamp per catalog index — keeps "latest" ordering
 *  deterministic across re-seeds (the version gate stops re-runs anyway). */
function postedAtForIndex(index: number): string {
  return new Date(new Date(JOBS_SEED_POSTED_BASE).getTime() + index * 3_600_000).toISOString();
}

/** Strip a column the live table doesn't have, then retry — committed schema
 *  can lag prod, and the careers board must never crash on a seed. */
function extractMissingColumn(error: unknown, table: string): string | null {
  const message = cleanText((error as { message?: string } | null)?.message);
  const match = message.match(/Could not find the '([^']+)' column of '([^']+)'/i);
  if (!match) return null;
  if (cleanText(match[2]) && cleanText(match[2]) !== cleanText(table)) return null;
  return cleanText(match[1]) || null;
}

async function writeWithSchemaRetry(
  table: string,
  rows: Record<string, unknown>[],
  operation: (next: Record<string, unknown>[]) => Promise<{ error: unknown }>,
) {
  let next = rows.map((row) => ({ ...row }));
  const stripped = new Set<string>();
  for (;;) {
    const { error } = await operation(next);
    if (!error) return;
    const missing = extractMissingColumn(error, table);
    if (!missing || stripped.has(missing)) throw error;
    next = next.map((row) => {
      if (!(missing in row)) return row;
      const copy = { ...row };
      delete copy[missing];
      return copy;
    });
    stripped.add(missing);
  }
}

type Admin = ReturnType<typeof createAdminSupabase>;

/** Batched, schema-drift-resilient upsert: one round-trip per table. */
async function upsert(
  admin: Admin,
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string,
) {
  if (rows.length === 0) return;
  await writeWithSchemaRetry(table, rows, async (next) =>
    admin.from(table).upsert(next as never, { onConflict }),
  );
}

/** Look up the service user by its (indexed) profile email — cheap, and far
 *  lighter than scanning the auth user list. The new-user trigger always
 *  mirrors a fresh auth user into customer_profiles, so an existing service
 *  user is guaranteed to have a row here. */
async function findServiceUserId(admin: Admin): Promise<string | null> {
  const { data } = await admin
    .from("customer_profiles")
    .select("id")
    .eq("email", SEED_SYSTEM_EMAIL)
    .limit(1)
    .maybeSingle();
  return cleanText((data as { id?: unknown } | null)?.id) || null;
}

/**
 * Creating any auth user fires handle_new_customer, which seeds an
 * `account`/`account_created` activity row + a welcome notification for the
 * new user. For the NON-human service user those would surface in the GLOBAL
 * owner analytics / division feeds (which read customer_activity without a
 * user filter), so remove them. Best-effort + idempotent — never block the
 * seed.
 */
async function cleanupServiceUserByproducts(admin: Admin, userId: string): Promise<void> {
  try {
    await admin
      .from("customer_activity")
      .delete()
      .eq("user_id", userId)
      .eq("activity_type", "account_created");
    await admin.from("customer_notifications").delete().eq("user_id", userId);
  } catch (err) {
    console.warn("[henryco/jobs] service-user byproduct cleanup skipped:", err);
  }
}

/**
 * Resolve (or create once) the dedicated "Henry Onyx Careers" service user
 * that owns the seeded catalog. A cheap profile lookup first; only when truly
 * absent do we create the auth user (email_confirm → no mail, no sign-in
 * alert), then strip the trigger byproducts. Returns null only if the admin
 * auth API is unavailable.
 */
async function resolveSeedSystemUserId(admin: Admin): Promise<string | null> {
  const existing = await findServiceUserId(admin);
  if (existing) return existing;

  const { data, error } = await admin.auth.admin.createUser({
    email: SEED_SYSTEM_EMAIL,
    email_confirm: true,
    user_metadata: { system: true, seeded: true, full_name: "Henry Onyx Careers" },
  });
  const createdId = cleanText(data?.user?.id) || null;
  if (!error && createdId) {
    await cleanupServiceUserByproducts(admin, createdId);
    return createdId;
  }

  // Lost a create race (email already exists) — the winner's trigger created
  // the profile row, so re-read it. Still clean up byproducts idempotently.
  const raced = await findServiceUserId(admin);
  if (raced) {
    await cleanupServiceUserByproducts(admin, raced);
    return raced;
  }
  return null;
}

function employerProfileMetadata(employer: SeedEmployer) {
  return {
    employerSlug: employer.slug,
    name: employer.name,
    tagline: employer.tagline,
    description: employer.description,
    employerType: employer.employerType,
    internal: employer.employerType === "internal",
    industry: employer.industry,
    website: employer.href,
    locations: employer.locations,
    headcount: employer.headcount,
    remotePolicy: employer.remotePolicy,
    culturePoints: employer.culturePoints,
    benefitsHeadline: employer.benefitsHeadline,
    verificationNotes: employer.verificationNotes,
    trustScore: employer.trustScore,
    responseSlaHours: employer.responseSlaHours,
    accent: employer.accent,
    updatedAt: JOBS_SEED_POSTED_BASE,
    seeded: true,
  };
}

function jobPostMetadata(job: SeedJob, index: number) {
  return {
    ...job,
    isPublished: true,
    moderationStatus: "approved",
    employerVerification: "verified",
    trustHighlights: ["Verified employer", "Moderated posting", "Structured pipeline"],
    pipelineStages: DEFAULT_PIPELINE_STAGES,
    salaryMin: job.salaryMin ?? null,
    salaryMax: job.salaryMax ?? null,
    currency: JOBS_SEED_CURRENCY,
    postedAt: postedAtForIndex(index),
    closesAt: null,
    updatedAt: JOBS_SEED_POSTED_BASE,
    seeded: true,
  };
}

/**
 * Seed (or refresh) the curated employers + roles under the service user.
 * Safe to call repeatedly: every write is an upsert on a stable key.
 */
export async function seedJobsBaseline(admin: Admin, systemUserId: string): Promise<void> {
  // 1) Employer company records (keyed on slug — companies.slug is unique).
  await upsert(
    admin,
    "companies",
    seedEmployers.map((employer) => ({
      slug: employer.slug,
      name: employer.name,
      subdomain: employer.slug,
      href: employer.href,
      tagline: employer.tagline,
      description: employer.description,
      category: employer.category,
      status: "active",
      accent: employer.accent,
    })),
    "slug",
  );

  // 2) Employer profile + verification activity rows (deterministic id).
  await upsert(
    admin,
    "customer_activity",
    seedEmployers.map((employer, i) => ({
      id: seedUuid("a0b10000", i),
      user_id: systemUserId,
      division: JOBS_DIVISION,
      activity_type: ACTIVITY_EMPLOYER_PROFILE,
      title: employer.name,
      description: employer.description,
      status: "active",
      reference_type: "jobs_employer",
      reference_id: employer.slug,
      metadata: employerProfileMetadata(employer),
    })),
    "id",
  );

  await upsert(
    admin,
    "customer_activity",
    seedEmployers.map((employer, i) => ({
      id: seedUuid("a0b20000", i),
      user_id: systemUserId,
      division: JOBS_DIVISION,
      activity_type: ACTIVITY_EMPLOYER_VERIFICATION,
      title: `${employer.name} verification`,
      description: "Employer verification is active.",
      status: "verified",
      reference_type: "jobs_employer",
      reference_id: employer.slug,
      metadata: {
        employerSlug: employer.slug,
        employerName: employer.name,
        status: "verified",
        trustScore: employer.trustScore,
        verificationNotes: employer.verificationNotes,
        updatedAt: JOBS_SEED_POSTED_BASE,
        seeded: true,
      },
    })),
    "id",
  );

  // 3) Job postings (deterministic id; status published → renders on board).
  await upsert(
    admin,
    "customer_activity",
    seedJobs.map((job, i) => ({
      id: seedUuid("a0c00000", i),
      user_id: systemUserId,
      division: JOBS_DIVISION,
      activity_type: ACTIVITY_JOB_POST,
      title: job.title,
      description: job.summary,
      status: "published",
      reference_type: "jobs_post",
      reference_id: job.slug,
      metadata: jobPostMetadata(job, i),
    })),
    "id",
  );

  // 4) Version marker (LAST, so a partial failure re-runs next load). Owned
  //    by the service user, archived, and flagged seeded — invisible to every
  //    public/candidate getter and to per-user activity/signal/dashboard
  //    readers (which scope to a human viewer's id, never the service user).
  await upsert(
    admin,
    "customer_activity",
    [
      {
        id: seedUuid("a0d00000", 1),
        user_id: systemUserId,
        division: JOBS_DIVISION,
        activity_type: ACTIVITY_SEED_MARKER,
        title: "Henry Onyx careers catalog",
        description: "Internal bootstrap marker for the seeded careers catalog.",
        status: "archived",
        archived_at: new Date().toISOString(),
        reference_type: "jobs_seed",
        reference_id: SEED_MARKER_REFERENCE,
        metadata: { version: JOBS_SEED_VERSION, seededAt: new Date().toISOString(), seeded: true },
      },
    ],
    "id",
  );
}

async function currentBootstrapVersion(): Promise<string | null> {
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin
      .from("customer_activity")
      .select("metadata")
      .eq("division", JOBS_DIVISION)
      .eq("activity_type", ACTIVITY_SEED_MARKER)
      .eq("reference_id", SEED_MARKER_REFERENCE)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    const metadata = (data?.metadata ?? null) as { version?: string } | null;
    return cleanText(metadata?.version) || null;
  } catch {
    return null;
  }
}

/**
 * Ensure the curated careers catalog exists before the board reads it.
 * Cheap and safe to call on every public load: it short-circuits once the
 * current version is confirmed, memoizes the in-flight seed, backs off after
 * a deferred/failed attempt, and swallows failures (logged) so the page never
 * 500s on a seeding hiccup.
 */
export async function ensureJobsBootstrap(): Promise<void> {
  if (verifiedCurrent) return;
  if (!hasServiceRole()) return;
  if (Date.now() - lastAttemptAt < RETRY_COOLDOWN_MS) return;

  const version = await currentBootstrapVersion();
  if (version === JOBS_SEED_VERSION) {
    verifiedCurrent = true;
    return;
  }

  if (!bootstrapPromise) {
    lastAttemptAt = Date.now();
    bootstrapPromise = (async () => {
      try {
        const admin = createAdminSupabase();
        const systemUserId = await resolveSeedSystemUserId(admin);
        if (!systemUserId) {
          // Admin auth API unavailable — retry on the next cooldown window
          // rather than writing rows under no/invalid owner.
          console.warn("[henryco/jobs] careers bootstrap deferred: no service user");
          return;
        }
        await seedJobsBaseline(admin, systemUserId);
        verifiedCurrent = true;
      } catch (err) {
        console.error("[henryco/jobs] careers bootstrap failed:", err);
      } finally {
        bootstrapPromise = null;
      }
    })();
  }
  await bootstrapPromise;
}
