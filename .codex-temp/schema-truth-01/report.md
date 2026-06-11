# SCHEMA-TRUTH-01 — make the committed schema true

**Owner:** autonomous agent (Claude Fable 5, max effort)
**Date:** 2026-06-11
**Prod project:** `rzkbgwuznmdxnnhmjazy` (PG 17.6) — **zero prod DDL performed; introspection was read-only throughout**
**Branch / worktree:** `v3/schema-truth-01` off `origin/main@537a5e73` (`C:\Users\HP VICTUS\hc-schema-truth`)

---

## TL;DR

The committed schema sources lied (stale types from 2026-05-07; 137 migration
files vs 75 prod history rows; out-of-band prod changes nobody recorded). This
pass captured **PROD-ACTUAL truth by read-only catalog introspection**, built a
local **shadow DB** proven byte-identical to prod (types + columns + effective
ACLs), ran the **FL2 dress rehearsal** on it — which caught and fixed a
**hard FL2 blocker** (V3-18's new `customer_invoices` collides with a LIVE
legacy table of the same name) and a **stranding gap** (the merged Job B wallet
rail reads five tables prod doesn't have) — regenerated
`packages/data/src/database.types.ts` from the prod-actual + FL2 composite,
produced the authoritative **FL2 apply manifest** classifying all 138 files,
and **shrank the drift baseline 33 → 21** (2 by truthful types, 10 by verified
read-side fixes — including three live-today bugs).

---

## 1. Prod-actual capture method (read-only, no Docker, no DB password)

No prod DB password exists locally, so `pg_dump` was impossible. Capture went
through the Supabase **Management API** (the CLI keyring token has prod access):

- `supabase db query --linked` ran **sectioned pg_catalog introspection** —
  rendered by Postgres' own deparsers (`pg_get_functiondef/constraintdef/
  indexdef/triggerdef/viewdef`), paged via row_number windows. ~40 read-only
  calls total. Output: **`supabase/prod-actual/schema.sql`** (646 KB, 9.5k
  lines, 16 deterministic sections — now the committed declared baseline),
  plus `prod-columns.csv` (full information_schema inventory) and
  `prod-acl.csv` (945 effective-privilege probes for anon/authenticated/
  service_role).
- `supabase gen types typescript --project-id …` produced the prod-actual types
  reference (the same generator family as the committed file).
- Captured by the committed, reusable **`scripts/db/introspect-prod-schema.mjs`**.

Prod surface: 233 public tables / 6 views / 123 functions / 411 policies
(incl. storage) / 126+2 triggers / 4 enums. No `payments_private` schema —
confirming the money set absent.

## 2. The shadow DB + fidelity gates

Docker Desktop's engine was down (WSL distro provisioning failure), so the
shadow runs on a **native PostgreSQL 17.10** (winget, port 55432) with a
platform stub (`scripts/db/shadow-bootstrap.sql`) extending the CI's
`_bootstrap_supabase_env.sql` to full prod shape: request roles + the
load-bearing Supabase **default privileges** (the FL1 trap condition), auth
claim functions (uid/role/jwt/email), `auth.users` with the trigger-read
columns, `storage.objects/buckets` for the bucket policies, the
`supabase_realtime` publication, the `extensions` schema, and Supabase's
database-level `search_path = "$user", public, extensions` (why prod DDL
renders `uuid_generate_v4()` unqualified).

`supabase gen types --db-url` shells into a Docker image, so typegen for the
shadow runs the same engine from npm (`@supabase/postgres-meta@0.96.6`, HTTP
`/generators/typescript`) — proven **byte-identical** to the platform generator
except the platform-only `__InternalSupabase` block.

**Fidelity gates (all three must pass before the FL2 layer goes on):**

| gate | result |
|---|---|
| `gen types`(shadow) vs `gen types`(prod) | **identical** (modulo `__InternalSupabase`) |
| information_schema.columns inventory | **identical** |
| effective ACLs (945 probes ×3 roles) | **identical** |

Orchestrated by the committed **`scripts/db/build-shadow-db.mjs`**
(`reset → bootstrap → apply-prod → gate → apply-fl2 → gen-types`).

## 3. FL2 dress rehearsal — what it caught

Pass 1 applies each migration then its CI invariant suite at the CI position;
pass 2 re-applies everything (idempotency **with money fixture data present**).

**Caught #1 — V3-18 collides with a LIVE legacy table (hard FL2 blocker).**
Prod has a legacy `customer_invoices` (kobo-shaped, 18 cols, 35 rows, last
written 2026-06-10; the invoice PDF route reads exactly that shape). V3-18's
draft created a minor-shaped table under the same name: `create table if not
exists` silently no-ops on prod, then its constraint DO-blocks explode
(`column "source_kind" named in key does not exist` — reproduced verbatim on
the shadow). Its `record_customer_invoice` writer had **zero application
callers**. **Fix:** the migration (committed-NOT-applied → editable) was
narrowed to the receipts system only (counters + `customer_receipts` + the two
writers); `customer_receipts.invoice_id` now binds its FK to the legacy table
conditionally (absent on the bare CI DB). Ledger-tied invoice issuance returns
as its own pass. The invariant suite was narrowed to match (proof (d) removed,
(e)/(f) scoped to receipts).

**Caught #2 — fixtures violated the real signup trigger chain.** On prod-shape,
`auth.users` INSERT fires `handle_new_customer()` → `customer_profiles.email`
is NOT NULL → two suites' email-less fixture users failed (they false-greened
on bare CI). Fixed the fixtures (+ the CI stub's `auth.users` gains `email`).

**Caught #3 — FL2 would strand the merged wallet rail.** Object-evidence
classification revealed the April files were only **partially applied
out-of-band**: `customer_wallet_funding_requests` (6 readers — the Job B
top-up rail itself), `customer_wallet_withdrawal_requests`,
`customer_payout_methods`, `account_idempotency_keys`,
`account_webhook_receipts` do not exist in prod, while sibling columns from
the same files do. **Fix:** new
`20260611120000_fl2_wallet_rail_completion.sql` — a verbatim, idempotent
extraction of exactly the missing objects (re-applying the old files wholesale
could regress newer prod state). Appended to the FL2 set and rehearsed.

**Final rehearsal: all 6 migrations × 2 passes green, all 6 invariant suites
green at their CI positions.**

## 4. Types regeneration

`packages/data/src/database.types.ts` (13,461 → 14,854 lines) is now the
**prod-actual + FL2 composite**: +13 prod tables the old types lacked
(`henry_events`, `push_subscriptions`, marketplace quintet,
`staff_notifications`×2, CMS pages, `i18n_translation_cache`,
`account_known_devices`), +13 FL2 tables (money core, ledger, receipts,
wallet-rail completion), every out-of-band column (e.g.
`customer_notifications.email_dispatched_at`,
`marketplace_product_variants.sort_order`), zero phantom tables. Tables that
exist only in unapplied feature migrations (rooms_*, workspace_*, the
2026-05-14/15 wave) are deliberately NOT in the types — they are not part of
the post-FL2 database. Monorepo `typecheck:all` is green against the new types
with zero code changes (the absent-table readers all use untyped admin
clients — the exact blind spot the guard documented).

## 5. The manifest — docs/v3/fl2-apply-manifest.md

All 138 files classified by object evidence: **74 applied** + 2 data-only
applied + **6 FL2** (the exact ordered apply list with suite positions) +
5 partially-applied / 2 superseded (money bits extracted to the completion
file) + 1 not-applied + **48 feature-backlog** (NOT part of FL2; grouped by
family with live-reader risk notes). Key systemic finding: prod history rows
(75) ≠ files (137) — consolidated dashboard applies, re-stamped versions,
out-of-band applies with no history row, and partial applies all exist; only
object evidence is reliable.

## 6. Drift baseline: 33 → 21

- **2** resolved by the truthful types (the known stale-source artifacts).
- **10** resolved by verified read-side fixes (every mapping checked against
  prod-actual):
  - `jobs_applications.created_at→applied_at`, `candidate_user_id→candidate_id`
    (×3 sites; "candidate_id = auth user id by construction" per the messages
    route), `jobs_conversations.last_message_at→updated_at` — jobs hiring lib +
    alerts cron.
  - **Live bug:** the candidate profile **draft autosave was triple-broken on
    prod** — `upsert(onConflict: "reference_id")` with no unique constraint,
    a non-existent `updated_at` column in the write, a non-existent
    `normalized_email` column, and `division` NOT NULL unset. Rewritten as a
    truthful lookup-then-update/insert; GET reads `metadata.savedAt`.
  - **Live bug:** care staff notification read-state **never persisted** — the
    writer inserted non-existent `actor_user_id`/`actor_role` columns (insert
    silently failed) and the reader filtered on `actor_user_id`. Both sides
    fixed to the real `user_id`/`role` columns.
  - `studio_projects.name→title` (asset-packs + revisions routes),
    `platform_moderation_queue.action_taken→review_action` (jobs trust),
    `marketplace_orders.total_naira→grand_total` + the owner reconcile-trace
    SQL text corrected to real columns (`amount_paid`, `customer_invoices.total_kobo`;
    there is no `invoices` table).
- **21 remain** — all wave-dependent or needing design; ticketed as SD-1…SD-9
  in the PASS-REGISTER appendix (incl. the guard's table-existence blind spot
  and a proposed upgrade against the new declared baseline).

## 7. Verification

- Shadow fidelity gates: **3/3 identical** (types / columns / ACL).
- FL2 rehearsal (prod-shape shadow): **6 migrations × 2 passes + 6 invariant
  suites green** at their CI positions.
- Bare-PG CI sequence replicated locally (vanilla PG 17 + the edited
  bootstrap, full 13-step interleave incl. the conditional-FK ABSENT branch):
  **all green**.
- `pnpm run typecheck:all`: **green** (all apps + packages, zero code changes
  required by the new types).
- `pnpm run build:all`: **green — 14 apps built** (account, care, cms, command,
  company-hub, hub, jobs, learn, logistics, marketplace, property, staff,
  studio, work).
- `pnpm run test:workspace`: **green** (3 suites / 6 tests).
- `pnpm run schema-drift:check`: **green** — baseline 21, no new drift.
- `prove:receipts`: **green** (all proofs — validated post-narrowing).
- `pnpm run i18n:check:strict` + `pnpm run lint:all`: **green**.

## 8. Where things live

| artifact | path |
|---|---|
| Declared prod baseline (DDL) | `supabase/prod-actual/schema.sql` |
| Introspection tool | `scripts/db/introspect-prod-schema.mjs` |
| Shadow builder + gates + rehearsal | `scripts/db/build-shadow-db.mjs` + `scripts/db/shadow-bootstrap.sql` |
| The manifest | `docs/v3/fl2-apply-manifest.md` |
| Regenerated types | `packages/data/src/database.types.ts` |
| New FL2 completion migration | `apps/hub/supabase/migrations/20260611120000_fl2_wallet_rail_completion.sql` |
| Narrowed V3-18 migration | `apps/hub/supabase/migrations/20260607130000_v3_18_payment_documents.sql` |
| Shrunk baseline | `scripts/ci/schema-drift-baseline.json` (33 → 21) |
| Drift-debt tickets | `docs/v3/PASS-REGISTER.md` appendix (SD-1…SD-9) |
| Evidence (history, columns, ACL, classification) | `.codex-temp/schema-truth-01/` |
