# Studio-Agency — Migration Activation Apply Order

**Pass:** V3-73-RELAND-01 · **Compiled:** 2026-07-19 · **Prod:** `rzkbgwuznmdxnnhmjazy`
**Method:** ground-truthed against `git origin/main` + the live prod catalog (read-only `to_regclass`/`information_schema` probes) + **rolled-back-transaction dry-runs on prod-actual** (Postgres DDL is transactional; every dry-run ran inside `begin … rollback` and was leak-checked afterwards → **zero prod change**).

> **Why this file exists.** The studio-agency stack (SA-1/2/3) cannot activate until **V3-73** is applied first. V3-73 was correctly logged as un-applied by `RECONCILE-01` / `PROGRAM-STATUS-2026-06-21`, but those 2026-06-21 ledgers (authored a month before SA-1/2/3 existed) classified it as an ordinary "dormant feature, no action" — masking that it is a **hard prerequisite** of the SA stack. This runbook is the corrected, dry-run-verified activation order.

---

## The blocker, in one line

`SA-2` (`20260719120000_studio_build_jobs.sql`) creates the view `studio_build_jobs_client_stage_v`, whose predicate reads `sp.client_business_id`. That column is added **only by V3-73** (`20260620120000_studio_deliverable_revisions.sql`). Apply SA-2 without V3-73 and it aborts:

```
ERROR: 42703: column sp.client_business_id does not exist
```

**Proven** by a negative dry-run (SA-2 alone, in a rolled-back txn, on prod-actual, 2026-07-19).

---

## Prod ground truth (verified 2026-07-19, read-only)

| Fact | Evidence |
|---|---|
| Last-applied migration on prod | `20260715221056` `harden_account_set_updated_at_search_path` (`list_migrations`) |
| V3-73 + SA-1 + SA-2 + SA-3 in prod migration history | **absent** (none of the four versions present) |
| V3-73 target objects on prod | **absent**: `studio_deliverable_revisions`, `studio_asset_exports`, `studio_projects.client_business_id`, `studio_deliverables.revision_allowance` |
| SA-1/2/3 target objects on prod | **absent**: `studio_briefs.brief_class`, `studio_brief_flow_drafts`, `studio_build_jobs`, `studio_sites`, `studio_agency_decisions`, `studio_agency_tick_lock`, … |
| Every object the four migrations **reference** | **present**: `studio_projects`(`.id/.client_user_id/.normalized_email`), `businesses`(`.id` PK), `business_members`(`.business_id/.user_id`), `studio_deliverables`, `studio_briefs`, `studio_project_milestones/invoices/messages/updates/payments`(`.project_id`), `pricing_rule_books`, fns `studio_is_staff()→bool` + `studio_auth_email()→text` |

**Consequence:** V3-73 has **no missing dependency and needs no drift-fix** — it applies as-authored. The only "gap" was the ledger classification, now corrected.

---

## The apply order (ordered, dry-run-verified)

Apply **in this exact order**. Each was confirmed to apply on the state left by the previous, cumulatively, in a single rolled-back transaction on prod-actual.

| # | Pass | Migration file | On | Commit | PR | Hard dependency it satisfies |
|---|---|---|---|---|---|---|
| 1 | **V3-73** | `apps/studio/supabase/migrations/20260620120000_studio_deliverable_revisions.sql` | `origin/main` | `b7f51f27` | #321 (merged) | adds `studio_projects.client_business_id` (the V3-57 link) that SA-2 needs |
| 2 | **SA-1** | `apps/studio/supabase/migrations/20260718120000_studio_brief_flow_persistence.sql` | `origin/main` | `8c9794b5` | #511 (merged) | independent (only ALTERs `studio_briefs`); ordered here per ratification |
| 3 | **SA-2** | `apps/studio/supabase/migrations/20260719120000_studio_build_jobs.sql` | `codex/sa-3-orchestration` | `8220f072` | #512 (open, stacked) | needs V3-73's `client_business_id`; creates `studio_build_jobs` |
| 4 | **SA-3** | `apps/studio/supabase/migrations/20260720120000_studio_agency_orchestration.sql` | `codex/sa-3-orchestration` | `469e127a` + `1e4ff7e6` (tick-lock fix) | #513 (open, stacked) | needs SA-2's `studio_build_jobs` (ALTERs it; redefines the transition trigger) |

**Dependency graph (hard edges only):** `V3-73 → SA-2` (column), `SA-2 → SA-3` (table). SA-1 is independent but ratified between them. The filename timestamps (`0620 < 0718 < 0719 < 0720`) already encode the correct order.

### Dry-run evidence (prod-actual, rolled back — no prod change)

- **Negative** — SA-2 alone → `ERROR 42703: column sp.client_business_id does not exist`. ✔ blocker reproduced.
- **Positive** — `begin;` V3-73; SA-1; SA-2; SA-3; `<verify>`; `rollback;` → transaction completed; the verify SELECT reported **every** target object present in-txn (incl. `studio_build_jobs_client_stage_v`, which only resolves because V3-73 ran first). ✔
- **Leak check** — after both rollbacks, all target objects `NULL`, `client_business_id` count `0`, rate-card seed `0`. ✔ zero residue.

---

## Operational caveats for the person applying

1. **Apply in the listed order, one at a time.** Do **not** rely on `supabase db push` auto-ordering: V3-73's timestamp (`20260620`) is **older than prod's last-applied** (`20260715`), so it is an *out-of-order* pending migration a plain push can skip. Apply each migration explicitly (MCP `apply_migration` or the SQL editor), V3-73 first.
2. **SA-2 + SA-3 are on the open stacked branch** `codex/sa-3-orchestration` (#512/#513). Merge that stack to `main` before (or alongside) applying, so repo == prod.
3. **Env / app-flag activation is separate** from the DB apply and stays owner-gated: V3-73's signed-approval path needs `STUDIO_APPROVAL_SIGNATURE_SECRET`; the SA build-agent/executor + reauth + `studio_agency` flag remain dark until the owner flips them (see `PHASED-PLAN.md` / `SAFETY-MODEL.md`). Applying these migrations is schema-only and safe to hold dark — every new table is deny-RLS / service-role-write and every writer no-ops on a missing flag/table.
4. **Money spine untouched.** None of the four migrations touches `payments_private`, the 5 money RPCs, or search-ui. `studio_build_usage` is operational metering, not a ledger post.

## Post-apply verification (run after applying all four)

```sql
select
  to_regclass('public.studio_deliverable_revisions')       as v373_revisions,      -- expect non-null
  to_regclass('public.studio_asset_exports')               as v373_exports,        -- expect non-null
  to_regclass('public.studio_build_jobs')                  as sa2_jobs,            -- expect non-null
  to_regclass('public.studio_build_jobs_client_stage_v')   as sa2_view,            -- expect non-null
  to_regclass('public.studio_agency_decisions')            as sa3_decisions,       -- expect non-null
  to_regclass('public.studio_agency_tick_lock')            as sa3_tick_lock,       -- expect non-null
  (select count(*) from information_schema.columns
     where table_schema='public' and table_name='studio_projects'
       and column_name='client_business_id')               as v373_client_business_id;  -- expect 1
```
