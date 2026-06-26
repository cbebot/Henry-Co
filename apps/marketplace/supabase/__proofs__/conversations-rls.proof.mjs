// Throwaway PGlite RLS proof for 20260626120000_marketplace_conversations.sql
// (WS-4 — The Onyx Line for Marketplace). NOT part of the apply path; runs the
// committed migration against an in-memory Postgres and asserts the default-deny
// posture, including the deliberate "participants-tamper non-escalation" property.
//
// Run (pglite is a throwaway install in C:\Users\HP VICTUS\node_modules — the
// repo's parent — so the bare import resolves from anywhere in the repo):
//   node apps/marketplace/supabase/__proofs__/conversations-rls.proof.mjs
//
// Exits non-zero on any failed assertion.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATION = path.resolve(
  __dirname,
  "../migrations/20260626120000_marketplace_conversations.sql",
);

// Fixed ids for legibility.
const BUYER_A = "11111111-1111-1111-1111-111111111111";
const BUYER_B = "22222222-2222-2222-2222-222222222222";
const USER_VX = "33333333-3333-3333-3333-333333333333"; // member of vendorX
const USER_VY = "44444444-4444-4444-4444-444444444444"; // member of vendorY
const VENDOR_X = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const VENDOR_Y = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const CONV_1 = "cccccccc-cccc-cccc-cccc-cccccccccccc"; // buyerA <-> vendorX
const ANCHOR = "dddddddd-dddd-dddd-dddd-dddddddddddd"; // a listing id
const PART_BUYER_A = "e0000000-0000-0000-0000-000000000001";
const PART_VENDOR_X = "e0000000-0000-0000-0000-000000000002";
const PART_BUYER_B = "e0000000-0000-0000-0000-000000000003"; // the "tamper" row

let failures = 0;
function check(name, ok, detail = "") {
  const tag = ok ? "PASS" : "FAIL";
  if (!ok) failures += 1;
  console.log(`  [${tag}] ${name}${detail ? ` — ${detail}` : ""}`);
}

const db = new PGlite();

// --- actor helpers: RLS is bypassed by the owner/superuser, so we drop to a
// non-owner role and stamp the JWT-sub GUC that our auth.uid() shim reads. ---
async function setActor(uid) {
  // Set the GUC as superuser first, then drop privilege.
  await db.exec(`set request.jwt.claim.sub = '${uid}';`);
  await db.exec(`set role app_authenticated;`);
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

async function main() {
  // 1. Bootstrap the surfaces the migration depends on (auth shim + stand-ins).
  await db.exec(`
    -- gen_random_uuid() is core in Postgres 13+; no pgcrypto needed here.
    create schema if not exists auth;
    create table if not exists auth.users (
      id uuid primary key,
      email text
    );
    -- auth.uid() reads the JWT-sub GUC, mirroring Supabase.
    create or replace function auth.uid() returns uuid
      language sql stable
      as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

    create or replace function public.marketplace_set_updated_at()
      returns trigger language plpgsql as $$
      begin
        new.updated_at = timezone('utc', now());
        return new;
      end;
      $$;

    -- Minimal stand-ins for the FK / policy targets the migration references.
    create table if not exists public.marketplace_vendors (
      id uuid primary key default gen_random_uuid(),
      slug text,
      name text
    );
    create table if not exists public.marketplace_role_memberships (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references auth.users(id) on delete cascade,
      scope_type text not null default 'platform',
      scope_id uuid,
      role text not null,
      is_active boolean not null default true
    );
    -- Anchor stand-ins (not referenced by the migration itself, created per task spec).
    create table if not exists public.marketplace_products (
      id uuid primary key default gen_random_uuid(),
      vendor_id uuid references public.marketplace_vendors(id) on delete set null,
      slug text
    );
    create table if not exists public.marketplace_orders (
      id uuid primary key default gen_random_uuid(),
      order_no text,
      user_id uuid references auth.users(id) on delete set null
    );
    create table if not exists public.marketplace_order_groups (
      id uuid primary key default gen_random_uuid(),
      order_id uuid references public.marketplace_orders(id) on delete cascade,
      vendor_id uuid references public.marketplace_vendors(id) on delete set null
    );
  `);

  // 2. Load the migration under test.
  const migrationSql = await readFile(MIGRATION, "utf8");
  await db.exec(migrationSql);
  console.log("Migration loaded cleanly (incl. realtime publication block).\n");

  // 3. A non-owner role that RLS actually applies to + the grants Supabase's
  //    `authenticated` role carries (so rejections come from RLS, not privilege).
  await db.exec(`
    do $$ begin
      if not exists (select 1 from pg_roles where rolname = 'app_authenticated') then
        create role app_authenticated nologin;
      end if;
    end $$;
    grant usage on schema public, auth to app_authenticated;
    grant execute on function auth.uid() to app_authenticated;
    grant select on public.marketplace_role_memberships to app_authenticated;
    grant select, insert, update, delete on public.marketplace_conversations to app_authenticated;
    grant select, insert, update, delete on public.marketplace_conversation_messages to app_authenticated;
    grant select, insert, update, delete on public.marketplace_conversation_participants to app_authenticated;
  `);

  // 4. Seed (as owner / service-role equivalent — RLS bypassed).
  await db.exec(`
    insert into auth.users (id, email) values
      ('${BUYER_A}', 'buyerA@example.com'),
      ('${BUYER_B}', 'buyerB@example.com'),
      ('${USER_VX}', 'vx@example.com'),
      ('${USER_VY}', 'vy@example.com');

    insert into public.marketplace_vendors (id, slug, name) values
      ('${VENDOR_X}', 'vendor-x', 'Vendor X'),
      ('${VENDOR_Y}', 'vendor-y', 'Vendor Y');

    insert into public.marketplace_role_memberships (user_id, scope_type, scope_id, role, is_active) values
      ('${USER_VX}', 'vendor', '${VENDOR_X}', 'vendor', true),
      ('${USER_VY}', 'vendor', '${VENDOR_Y}', 'vendor', true);

    insert into public.marketplace_conversations
      (id, conversation_no, anchor_type, anchor_id, buyer_user_id, vendor_id, subject)
    values
      ('${CONV_1}', 'MKT-CONV-0001', 'listing', '${ANCHOR}', '${BUYER_A}', '${VENDOR_X}', 'About your listing');

    insert into public.marketplace_conversation_messages
      (conversation_id, sender_kind, sender_user_id, body)
    values
      ('${CONV_1}', 'buyer', '${BUYER_A}', 'Hello, is this still available?');

    insert into public.marketplace_conversation_participants
      (id, conversation_id, user_id, party_kind, vendor_id)
    values
      ('${PART_BUYER_A}', '${CONV_1}', '${BUYER_A}', 'buyer', null),
      ('${PART_VENDOR_X}', '${CONV_1}', '${USER_VX}', 'vendor', '${VENDOR_X}'),
      -- The "tamper" row: buyerB is wrongly inserted as a participant of conv1.
      -- Message/conversation access must NOT follow from this mutable row.
      ('${PART_BUYER_B}', '${CONV_1}', '${BUYER_B}', 'buyer', null);
  `);

  console.log("Assertions:");

  // --- buyerA (the conversation's buyer) sees the thread + message ---
  check("buyerA reads conversation", (await countAs(BUYER_A, `select count(*) n from public.marketplace_conversations`)) === 1);
  check("buyerA reads message", (await countAs(BUYER_A, `select count(*) n from public.marketplace_conversation_messages`)) === 1);

  // --- buyerB (non-buyer, but holds a tamper participant row) sees NEITHER ---
  check("buyerB reads NO conversation", (await countAs(BUYER_B, `select count(*) n from public.marketplace_conversations`)) === 0);
  check(
    "buyerB reads NO message (participants-tamper non-escalation)",
    (await countAs(BUYER_B, `select count(*) n from public.marketplace_conversation_messages`)) === 0,
  );

  // --- userVX (member of vendorX) sees the thread + message via membership ---
  check("vendorX member reads conversation", (await countAs(USER_VX, `select count(*) n from public.marketplace_conversations`)) === 1);
  check("vendorX member reads message", (await countAs(USER_VX, `select count(*) n from public.marketplace_conversation_messages`)) === 1);

  // --- userVY (member of unrelated vendorY) sees NEITHER ---
  check("vendorY member reads NO conversation", (await countAs(USER_VY, `select count(*) n from public.marketplace_conversations`)) === 0);
  check("vendorY member reads NO message", (await countAs(USER_VY, `select count(*) n from public.marketplace_conversation_messages`)) === 0);

  // --- no authenticated INSERT policy: a direct client insert is rejected ---
  {
    await setActor(BUYER_A);
    let rejected = false;
    try {
      await db.query(
        `insert into public.marketplace_conversation_messages (conversation_id, sender_kind, sender_user_id, body)
         values ('${CONV_1}', 'buyer', '${BUYER_A}', 'sneaky direct insert')`,
      );
    } catch (e) {
      rejected = /row-level security|violates/i.test(String(e.message || e));
    } finally {
      await resetActor();
    }
    check("buyerA direct INSERT into messages REJECTED (no insert policy)", rejected);
  }

  // --- read-state self-update only ---
  {
    // buyerA updates own participant row -> 1 row affected.
    await setActor(BUYER_A);
    let ownRows = 0;
    let otherRows = 0;
    try {
      const own = await db.query(
        `update public.marketplace_conversation_participants
           set last_read_at = timezone('utc', now())
         where id = '${PART_BUYER_A}'`,
      );
      ownRows = own.affectedRows ?? 0;
      // buyerA attempts to update buyerB's participant row -> RLS filters it out (0 rows).
      const other = await db.query(
        `update public.marketplace_conversation_participants
           set last_read_at = timezone('utc', now())
         where id = '${PART_BUYER_B}'`,
      );
      otherRows = other.affectedRows ?? 0;
    } finally {
      await resetActor();
    }
    check("buyerA updates OWN participant last_read_at (1 row)", ownRows === 1, `affected=${ownRows}`);
    check("buyerA CANNOT update buyerB's participant row (0 rows)", otherRows === 0, `affected=${otherRows}`);

    // Confirm buyerB's row was untouched (read back as owner).
    const after = await db.query(
      `select last_read_at from public.marketplace_conversation_participants where id = '${PART_BUYER_B}'`,
    );
    check("buyerB's participant last_read_at remained NULL", after.rows[0].last_read_at === null);
  }

  // --- realtime: both stream tables landed on the publication ---
  {
    const pub = await db.query(
      `select tablename from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public'
        order by tablename`,
    );
    const tables = pub.rows.map((r) => r.tablename);
    check(
      "conversations + messages registered on supabase_realtime",
      tables.includes("marketplace_conversations") && tables.includes("marketplace_conversation_messages"),
      tables.join(","),
    );
  }

  console.log(`\n${failures === 0 ? "ALL ASSERTIONS PASSED" : `${failures} ASSERTION(S) FAILED`}`);
  await db.close();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("PROOF HARNESS ERROR:", e);
  process.exit(1);
});
