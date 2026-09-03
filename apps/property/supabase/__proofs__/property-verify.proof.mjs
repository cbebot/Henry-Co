// Throwaway PGlite proof for 20260701120000_v3_ai_verify_property_listing_verifications.sql.
// NOT part of the apply path; runs the committed migration against an in-memory Postgres and
// asserts: grant lockdown (no client writes to the audit table; service_role-only writer),
// badge award/revoke via the SECURITY DEFINER writer, RLS select-own + cross-user isolation,
// the IDOR-blocked case (non-owner refused, victim badge unchanged, no spoofed audit row),
// staff-can-verify, and the null-listing pre-save dry run.
//
// Run:  node apps/property/supabase/__proofs__/property-verify.proof.mjs
// Exits non-zero on any failed assertion.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATION = path.resolve(__dirname, "../migrations/20260701120000_v3_ai_verify_property_listing_verifications.sql");

const OWNER = "11111111-1111-1111-1111-111111111111";
const STRANGER = "22222222-2222-2222-2222-222222222222";
const STAFF = "33333333-3333-3333-3333-333333333333"; // property_admin
const LISTING = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"; // owned by OWNER
const USAGE_EVENT = "evt-0001";

let failures = 0;
function check(name, ok, detail = "") {
  const tag = ok ? "PASS" : "FAIL";
  if (!ok) failures += 1;
  console.log(`  [${tag}] ${name}${detail ? ` — ${detail}` : ""}`);
}

const db = new PGlite();

// RLS is bypassed by the superuser owner, so we drop to the real `authenticated` role and stamp
// the JWT-sub GUC our auth.uid() shim reads (mirroring Supabase).
async function setActor(uid) {
  await db.exec(`set request.jwt.claim.sub = '${uid}';`);
  await db.exec(`set role authenticated;`);
}
async function resetActor() {
  await db.exec(`reset role;`);
  await db.exec(`reset request.jwt.claim.sub;`);
}
async function countAs(uid, sql) {
  await setActor(uid);
  try {
    const res = await db.query(sql);
    return Number(res.rows[0].n);
  } finally {
    await resetActor();
  }
}
// Call the service-role-only writer as owner/superuser (mirrors the app's admin/service-role
// call). The IDOR decision is made INSIDE the fn from p_user_id, not from who calls it.
async function record(listingId, actorUid, outcome, opts = {}) {
  const res = await db.query(
    `select public.record_property_listing_verification(
       ${listingId ? `'${listingId}'` : "null"}, '${actorUid}', '${outcome}',
       ${opts.trustScore ?? 90}, ${opts.honest ?? true}, ${opts.aiMedia ?? false},
       ${opts.standards ?? true}, ${opts.safe ?? true}, '[]'::jsonb, '${opts.usageEvent ?? USAGE_EVENT}'
     ) as r`,
  );
  return res.rows[0].r;
}
async function badge(listingId) {
  const r = await db.query(`select henry_onyx_verified, henry_onyx_verified_at from public.property_listings where id = '${listingId}'`);
  return r.rows[0];
}
async function auditCount() {
  const r = await db.query(`select count(*)::int n from public.property_listing_verifications`);
  return r.rows[0].n;
}

async function main() {
  // 1. Bootstrap: the Supabase roles the migration grants to, the auth shim, and the minimal
  //    stand-ins the migration references (created BEFORE the migration loads).
  await db.exec(`
    do $$ begin
      if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
      if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
      if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
    end $$;

    create schema if not exists auth;
    create table if not exists auth.users (id uuid primary key, email text);
    create or replace function auth.uid() returns uuid language sql stable
      as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated;
    grant execute on function auth.uid() to authenticated;

    -- Stand-in property_listings: the columns the migration reads/writes (id, owner_user_id,
    -- updated_at) + the badge columns it adds via alter-if-not-exists.
    create table if not exists public.property_listings (
      id uuid primary key default gen_random_uuid(),
      slug text,
      owner_user_id uuid null,
      updated_at timestamptz not null default timezone('utc', now())
    );
    create table if not exists public.property_role_memberships (
      id uuid primary key default gen_random_uuid(),
      user_id uuid null,
      role text not null,
      is_active boolean not null default true
    );
    grant usage on schema public to authenticated;
    grant select on public.property_listings, public.property_role_memberships to authenticated;
  `);

  // 2. Load the migration under test.
  const migrationSql = await readFile(MIGRATION, "utf8");
  await db.exec(migrationSql);
  console.log("Migration loaded cleanly.\n");

  // 3. Seed as owner/superuser (RLS bypassed).
  await db.exec(`
    insert into auth.users (id, email) values
      ('${OWNER}', 'owner@example.com'), ('${STRANGER}', 'stranger@example.com'), ('${STAFF}', 'staff@example.com');
    insert into public.property_listings (id, slug, owner_user_id) values ('${LISTING}', 'a-listing', '${OWNER}');
    insert into public.property_role_memberships (user_id, role, is_active) values ('${STAFF}', 'property_admin', true);
  `);

  console.log("Assertions:");

  // --- A. Grant lockdown: authenticated cannot write the audit table, nor execute the writer ---
  {
    await setActor(OWNER);
    let insRejected = false, execRejected = false;
    try {
      await db.query(`insert into public.property_listing_verifications (listing_id, user_id, outcome) values ('${LISTING}', '${OWNER}', 'verified')`);
    } catch (e) { insRejected = /permission denied|row-level security|violates/i.test(String(e.message || e)); }
    try {
      await db.query(`select public.record_property_listing_verification('${LISTING}', '${OWNER}', 'verified', 90, true, false, true, true, '[]'::jsonb, 'x')`);
    } catch (e) { execRejected = /permission denied/i.test(String(e.message || e)); }
    await resetActor();
    check("authenticated direct INSERT into audit table REJECTED", insRejected);
    check("authenticated EXECUTE of record_* writer REJECTED (service_role-only)", execRejected);
  }

  // --- B. Badge award: owner verdict 'verified' → badge set + one audit row ---
  {
    const r = await record(LISTING, OWNER, "verified");
    const b = await badge(LISTING);
    check("record(verified) returns badge=true", r.badge === true, JSON.stringify(r));
    check("listing henry_onyx_verified = true", b.henry_onyx_verified === true);
    check("henry_onyx_verified_at set", b.henry_onyx_verified_at !== null);
    check("exactly one audit row exists", (await auditCount()) === 1);
  }

  // --- C. RLS select-own + cross-user isolation ---
  check("owner reads OWN verification row (1)", (await countAs(OWNER, `select count(*) n from public.property_listing_verifications`)) === 1);
  check("stranger reads NO verification rows (0)", (await countAs(STRANGER, `select count(*) n from public.property_listing_verifications`)) === 0);

  // --- D. Badge revoke: a later 'review' clears the now-stale badge ---
  {
    const r = await record(LISTING, OWNER, "review", { trustScore: 40, safe: false });
    const b = await badge(LISTING);
    check("record(review) returns badge=false", r.badge === false);
    check("listing henry_onyx_verified = false (revoked)", b.henry_onyx_verified === false);
    check("henry_onyx_verified_at cleared to null", b.henry_onyx_verified_at === null);
  }

  // --- E. IDOR-blocked: a NON-owner cannot award/revoke on the owner's listing ---
  {
    // Re-award as owner so we can prove the stranger's attempt changes nothing.
    await record(LISTING, OWNER, "verified");
    const before = await badge(LISTING);
    const auditBefore = await auditCount();
    let raised = false;
    try {
      await record(LISTING, STRANGER, "reject", { trustScore: 0, honest: false, standards: false, safe: false });
    } catch (e) { raised = /insufficient_privilege|not authorized/i.test(String(e.message || e)); }
    const after = await badge(LISTING);
    check("non-owner record_* RAISES (insufficient_privilege)", raised);
    check("victim listing badge UNCHANGED by blocked call", after.henry_onyx_verified === true && before.henry_onyx_verified === true);
    check("NO spoofed audit row written by blocked call", (await auditCount()) === auditBefore);
  }

  // --- F. Staff (property_admin) may verify any listing ---
  {
    await record(LISTING, OWNER, "review"); // clear first
    const r = await record(LISTING, STAFF, "verified");
    const b = await badge(LISTING);
    check("staff (property_admin) record(verified) succeeds", r.badge === true);
    check("staff verify sets the badge", b.henry_onyx_verified === true);
  }

  // --- G. Null listing = pre-save dry run: audited, touches no listing ---
  {
    const auditBefore = await auditCount();
    const beforeBadge = await badge(LISTING);
    const r = await record(null, STRANGER, "verified"); // even a stranger may dry-run their OWN draft
    check("null-listing record returns (audited)", r.verification_id != null);
    check("null-listing added exactly one audit row", (await auditCount()) === auditBefore + 1);
    check("null-listing did NOT change any real listing badge", (await badge(LISTING)).henry_onyx_verified === beforeBadge.henry_onyx_verified);
  }

  console.log(`\n${failures === 0 ? "ALL ASSERTIONS PASSED" : `${failures} ASSERTION(S) FAILED`}`);
  await db.close();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("PROOF HARNESS ERROR:", e);
  process.exit(1);
});
