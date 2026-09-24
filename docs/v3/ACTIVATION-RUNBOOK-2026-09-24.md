# V3 Activation Runbook — cross-program migration apply order

**Pass:** V3-ACTIVATION-RUNBOOK-01 · **Compiled:** 2026-09-24 · **Base:** `origin/main @ b1efffe3` (V3-42, #537) · **Prod:** `rzkbgwuznmdxnnhmjazy` — **PAUSED / unreachable at compile time**
**Type:** documentation only — no code change, no migration-file edit, **no prod connection attempted**. `payments_private` and the money RPCs untouched.

> **Why this file exists.** Merged-to-main ≠ applied-to-prod (the V3-73 and V3-34 lesson, `docs/v3/automation/RE-GROUNDING-2026-07-24.md:76`). Several passes shipped "flag-dark, committed-not-applied" migrations. Prod is paused, so it can't be queried. This runbook turns everything git knows into (1) one dependency-ordered apply sequence and (2) a single read-only query. The moment Supabase resumes, that query converts every NEEDS-PROD-CONFIRMATION row into ground truth, so the apply session starts from facts, not memory.

---

## 0 · TL;DR

- **200** migration files on `main` across 9 app folders. **107** are baseline, recorded applied by RECONCILE-01 (`9851ecdb`, 2026-06-21); see Appendix A. **93** are activation candidates, catalogued in §3.
- Candidate status: **4 CONFIRMED-APPLIED** (V3-73, SA-1, SA-2, SA-3 — architect live query, this session) · **1 CONFIRMED-UNAPPLIED** (V3-34 — architect live query, this session) · **88 NEEDS-PROD-CONFIRMATION**. The last column of §3 gives each one's last git-recorded state.
- **Apply order = global filename-timestamp order, name as tie-break.** This order satisfies every hard dependency edge found in the SQL (§2), and it was **dry-run end-to-end on a local PG17 shadow** built from `supabase/prod-actual/schema.sql` (local only — §8).
- **SA-4 vs V3-43 (question b):** the two are **DDL-independent**. They share no object, and both orders applied cleanly in the shadow. The retarget is a *runtime* coupling: the operator tick uses V3-43's `workflow_locks` / `internal_ai_spend_ledger`. Apply SA-4 (#72) then V3-43 (#76), both before `FOUNDER_ACTIONS_TRANCHE≥3`. The real constraints sit *around* them: **F2 → F3 → SA-4**, **V3-37-category → SA-4**, and **SA-3 + `ai_free_spend_ledger` → V3-43** (§2).
- **Not apply-ready as authored — 14 files:** 12 **BLOCKED** (the rooms family is cyclic; 5 PASS-21 care/jobs files reference columns prod doesn't have) + 2 **DO-NOT-APPLY** (`super_app_core` would replace prod's live `handle_new_user()`; `workspace_staff_platform` is superseded). See §4.
- **10 destructive / order-sensitive migrations** get the before/after row-count dry-run treatment (§5). Worst cases: V3-43's fold-and-drop of `ai_free_spend_ledger` + `studio_agency_tick_lock`, and three CHECK re-states that **silently narrow** if applied out of order (shadow-proven).
- **Day-of:** run the query in §6.2, also saved as `Downloads\V3-ACTIVATION-RUNBOOK-01-DAY-OF-confirm-applied-state.sql`. It's read-only, matches on **normalized name** (never version), and cross-checks each row with a **calibrated object probe**.

---

## 1 · Evidence rules & the two unresolved questions

Every status in this file cites one of three sources:
- **(A) architect direct-query evidence from this session, before the pause.** Applied: V3-73 `20260620120000_studio_deliverable_revisions`, SA-1 `20260718120000_studio_brief_flow_persistence`, SA-2 `20260719120000_studio_build_jobs`, SA-3 `20260720120000_studio_agency_orchestration`. Unapplied: V3-34 `20260718120000_v3_34_personalization_home` (zero personalization tables/columns).
- **(G) a specific git commit or committed doc line.**
- **NEEDS-PROD-CONFIRMATION**, when neither of the above exists.

"Last git-recorded state" is a **lead, not a status**. Git records can't see anything that happened on prod after they were written. Memory notes were used only to *find* git evidence and are never cited as proof.

### (a) Was PR #524 (SA-4, `founder_operator_spine`) merged, and is its migration applied?

- **Merged: YES.** Squash commit `241f068a` "feat(hub): SA-4 — the Owner-AI operator … (#524)", on `main`, 2026-07-24.
- **Rewritten after merge:** V3-43 (`29aac1f2`, #527, 2026-07-25) **retargeted the SA-4 file in place**. It removed `ai_operator_tick_lock` + `ai_operator_spend_ledger` (+ RPCs); the operator now reuses `workflow_locks('hub.operator.tick')` + `internal_ai_spend_ledger('operator')`. The file on `main` now only (1) adds `founder_action_proposals.origin` (+ index) and (2) re-states `customer_notifications_category_check` (adds `owner.operator.escalation` + the latent `marketplace.seller.review` / `marketplace.product.review`).
- **Applied: last recorded UNAPPLIED.** Two live-probe records: `RE-GROUNDING-2026-07-24.md:17` (R5: both tables `to_regclass = NULL`), and the V3-43 migration header ("verified on prod 2026-07-23 … SA-4 … NOT applied"). No later apply record exists anywhere on `main` → **NEEDS-PROD-CONFIRMATION**.
- **Divergence to rule out on day-of:** if anyone applied the **pre-retarget** #524 content between 07-24 and 07-25, prod would hold the "second" lock and ledger. The shadow reproduces this (T5: original SA-4 then V3-43 leaves `ai_operator_tick_lock` + `ai_operator_spend_ledger` behind). The §6.3 guard query checks for it.

### (b) Was V3-43's migration (PR #527) ever applied?

- **No evidence it was.** The pass itself applied nothing (commit `29aac1f2`; `ACTIVATION-APPLY-ORDER.md` § V3-43 is a plan, not a record).
- `git log origin/main --grep 'V3-43\|v3_43\|workflow rail'` and a repo-wide grep for `v3_43_workflow_rail` (2026-09-24) find only the CI step (`ci.yml:460`, a throwaway PG), two tests, and the plan doc. None records a prod apply.
- **Status: NEEDS-PROD-CONFIRMATION (last recorded: dry-run-verified, NOT applied).**

---

## 2 · Dependency edges (from the SQL, not from memory)

The edges come from three sources:
- a parser over all 93 candidate files (creates / alters / `references` / `from public.*`);
- a hand read of every function, constraint and guard dependency the parser can't see;
- confirmation or refutation in the local shadow (§8).

| # | Edge (prereq → dependent) | Kind | Evidence | Consequence if violated |
|---|---|---|---|---|
| E1 | V3-73 `studio_deliverable_revisions` → SA-2 `studio_build_jobs` | column (`studio_projects.client_business_id` read by `studio_build_jobs_client_stage_v`) | negative dry-run `ACTIVATION-APPLY-ORDER.md` (2026-07-19); shadow ✓ | SA-2 aborts `42703` |
| E2 | SA-2 → SA-3 `studio_agency_orchestration` | table (`studio_build_jobs`) | graph; shadow ✓ | SA-3 aborts |
| E3 | F2 `founder_intelligence` → F3 `founder_action_proposals` | function (`founder_intelligence_is_owner()` in F3's RLS) | **shadow: F3 alone → `function public.founder_intelligence_is_owner() does not exist`** | F3 aborts |
| E4 | F3 → SA-4 `founder_operator_spine` | table, **`to_regclass`-guarded** | **shadow T3: SA-4 applied "OK" with F3 absent; `origin` column count = 0** | **SILENT**: SA-4 recorded applied but `origin` never added; the operator breaks at activation |
| E5 | V3-37 `recovery_notification_category` → SA-4 | CHECK re-state (set containment `0606 ⊂ V3-37 ⊂ SA-4`, 24 ⊂ 25 ⊂ 28 values) | set diff; **shadow T2b: V3-37 applied after SA-4 succeeds and drops `owner.operator.escalation` + both marketplace review ids**; T2: with such a row present it aborts `23514` | **SILENT narrowing**; every operator escalation / seller-review insert then fails the CHECK (the 2026-06-06 incident class) |
| E6 | SA-3 → V3-43 `workflow_rail` | fold + `DROP TABLE studio_agency_tick_lock` | V3-43 `:234-253` | SA-3 applied after V3-43 resurrects a second lock primitive ("never two" broken; studio code already reads `workflow_locks`) |
| E7 | `ai_free_spend_ledger` → V3-43 | fold rows + redefine `ai_free_spend_today/add` + `DROP TABLE` | V3-43 `:324-375`; **shadow T3/T4: 12,345 kobo carried exactly; re-apply keeps 12,345** | the 0705 file applied after V3-43 would re-point the live free-AI RPCs at a resurrected second ledger |
| E8 | `email_provider_allow_ses` → `email_provider_allow_postmark` | CHECK re-state (`{brevo,resend,ses}` ⊂ `{…,postmark}`) | set diff | **SILENT narrowing**: ses after postmark drops `postmark`; the email-fallback cron's writes fail |
| E9 | `care_services_catalog_expansion` → `care_services_catalog_seed` | table | graph | seed aborts |
| E10 | care: `garment_types` → `user_preferences`, `booking_garments`; `care_claims` → `booking_garments` | FK | graph; shadow | cascade |
| E11 | learn PASS-21 `player` → `policies` → `realtime` | tables | graph; shadow ✓ | cascade |
| E12 | logistics `shipment_legs` → `pod`; each PASS-21 family → its `*_realtime_publication` | FK / publication | graph; shadow ✓ | realtime files are table-guarded, so an early apply is a no-op: **re-run after the family lands** |
| E13 | (prod data) `data_governance_domains('identity_account')` → V3-37 `abandoned_tasks` | FK on reference data | shadow: FK error on the schema-only snapshot; **T1b: applies once the row exists** | V3-37 aborts. Preflight in §6.3 |
| E14 | V3-40 / V3-41 → V3-42 | runtime read only | commit `b1efffe3` | none at DDL; V3-42 dashboards read empty |
| — | V3-40 ⇄ V3-41 ⇄ V3-43 (`workflow_locks`) | **order-free**: byte-compatible `create table if not exists` + seed-on-conflict | V3-40 header "converge in either apply order"; shadow ✓ | — |
| — | SA-4 ⇄ V3-43 | **order-free at DDL** (no shared object) | shadow: both orders ✓ (T3 reverse, main run forward) | — |
| — | V3-34 ⇄ V3-39 (`customer_preferences`) | independent columns | graph | — |
| ✗ | `rooms_sessions` ⇄ `rooms_participants` | **CYCLE**: sessions' SELECT policy sub-selects participants; participants FK → sessions | **shadow + PGlite: `relation "public.rooms_participants" does not exist`** | family cannot apply as authored (§4) |

**Why filename-timestamp order is the right global order:** every hard edge above (E1–E13) points from an earlier stamp to a later one (e.g. 0610 < 0723, 0620 < 0719, 0705/0720 < 0724, 0709 < 0714), and the order-free pairs don't care. The four-way stamp collision `20260724120000` (V3-35 / V3-38 / V3-39 / V3-43) is internally independent; alphabetical tie-break is used.

**Do NOT use `supabase db push`.** Most candidate stamps are *older* than prod's last-applied version, so a push treats them as out-of-order. The four colliding `20260724120000` files would also clash on the `schema_migrations` primary key. Apply each file explicitly, in §3 order, using MCP `apply_migration` with `name` = the file stem, or the SQL editor. That keeps the §6.2 name-match working.

---

## 3 · The catalog — all 93 candidates, in apply order

**Tier:**
- **NOW** — program activation set.
- **GATED** — dormant feature family; apply only inside its own launch pass (env/owner gate cited in RECONCILE-01).
- **BLOCKED** — cannot apply as authored.
- **DNA** — do not apply.

`#` is the position in the single global sequence (BLOCKED/DNA are unnumbered). "Local shadow dry-run" = result of applying the file at its position on the prod-actual shadow (§8), then re-applying the whole sequence a second time.

| # | Migration (app) | PR / commit | Creates | Must follow (hard edges) | Tier | Status | Last git-recorded state | Local shadow dry-run | Destructive |
|---|---|---|---|---|---|---|---|---|---|
| — | `20260402235500_workspace_staff_platform.sql` (hub) | — `30f67f9a` | `workspace_division_memberships`, `workspace_helper_signals`, `workspace_internal_notes`, `workspace_module_registry` +6 | baseline only | DNA | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21); RECONCILE-01 verdict: “never adopted — superseded by staff_* / *_role_memberships” | ✓ · re-apply ✓ | — |
| — | `20260405120000_super_app_core.sql` (super-app) | — `30f67f9a` (edited `09cacb70`) | `contact_submissions`, `divisions`, `profiles` | baseline only | DNA | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✗ policy "profiles_update_self" for table "profiles" already exists | ⚠ **REPLACES live `public.handle_new_user()`** (prod body sets role/phone/is_active — `schema.sql:901`) + re-creates `on_auth_user_created`; policy clash on `profiles` |
| 1 | `20260514120000_logistics_quotes.sql` (logistics) | — `30f67f9a` | `logistics_quotes` | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 2 | `20260514120500_logistics_shipment_legs.sql` (logistics) | — `30f67f9a` | `logistics_shipment_legs` | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 3 | `20260514121000_logistics_pod.sql` (logistics) | — `30f67f9a` | `logistics_pod_records` | 20260514120500…logistics_shipment_legs.s (logistics_shipment_legs) | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 4 | `20260514121500_logistics_claims.sql` (logistics) | — `30f67f9a` | `logistics_claims` | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 5 | `20260514122000_logistics_fleet.sql` (logistics) | — `30f67f9a` | `logistics_fleet_riders`, `logistics_fleet_vehicles`, `logistics_rider_assignments` | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 6 | `20260514122500_logistics_b2b_accounts.sql` (logistics) | — `30f67f9a` | `logistics_b2b_accounts`, `logistics_b2b_admins` | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 7 | `20260514123000_logistics_realtime_publication.sql` (logistics) | — `30f67f9a` | (alters/grants only) | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 8 | `20260514130000_studio_proposal_signatures.sql` (studio) | — `6b5cb38f` (edited `7dc4d2c8`) | `studio_proposal_signatures` | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 9 | `20260514130500_studio_revisions_versioning.sql` (studio) | — `6b5cb38f` | (alters/grants only) | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 10 | `20260514131000_studio_milestone_extensions.sql` (studio) | — `6b5cb38f` | (alters/grants only) | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 11 | `20260514131500_studio_payment_plans.sql` (studio) | — `6b5cb38f` | `studio_payment_plan_releases`, `studio_payment_plans` | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 12 | `20260514132000_studio_resource_allocations.sql` (studio) | — `6b5cb38f` | `studio_resource_allocations` | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 13 | `20260514132500_studio_asset_packs.sql` (studio) | — `6b5cb38f` (edited `7dc4d2c8`) | `studio_asset_packs` | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 14 | `20260514133000_studio_realtime_publication.sql` (studio) | — `6b5cb38f` | (alters/grants only) | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 15 | `20260515000000_learn_v3_pass21_player.sql` (learn) | — `30f67f9a` | `learn_assignment_grades`, `learn_assignment_submissions`, `learn_badge_awards`, `learn_badges` +11 | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 16 | `20260515001000_learn_v3_pass21_policies.sql` (learn) | — `30f67f9a` | (alters/grants only) | 20260515000000…learn_v3_pass21_player.sq (learn_assignment_grades, learn_assignment_submissions) | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 17 | `20260515002000_learn_v3_pass21_realtime.sql` (learn) | — `30f67f9a` | (alters/grants only) | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| — | `20260515100000_rooms_sessions.sql` (hub) | — `30f67f9a` | `rooms_sessions` | baseline only | BLOCKED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✗ relation "public.rooms_participants" does not exist | — |
| — | `20260515100100_rooms_participants.sql` (hub) | — `30f67f9a` | `rooms_participants` | baseline only | BLOCKED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✗ relation "public.rooms_sessions" does not exist | — |
| — | `20260515100200_rooms_recordings_consent.sql` (hub) | — `30f67f9a` | `rooms_recordings_consent` | baseline only | BLOCKED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✗ relation "public.rooms_sessions" does not exist | — |
| — | `20260515100300_rooms_recordings.sql` (hub) | — `30f67f9a` | `rooms_recordings` | baseline only | BLOCKED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✗ relation "public.rooms_sessions" does not exist | — |
| — | `20260515100400_rooms_scorecards.sql` (hub) | — `30f67f9a` | `rooms_scorecards` | baseline only | BLOCKED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✗ relation "public.rooms_sessions" does not exist | — |
| — | `20260515100500_rooms_messages.sql` (hub) | — `30f67f9a` | `rooms_messages` | baseline only | BLOCKED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✗ relation "public.rooms_sessions" does not exist | — |
| — | `20260515100600_rooms_realtime_publication.sql` (hub) | — `30f67f9a` | (alters/grants only) | baseline only | BLOCKED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✗ relation "public.rooms_messages" does not exist | — |
| 18 | `20260515120000_care_garment_types.sql` (care) | — `30f67f9a` | `care_garment_types` | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 19 | `20260515120000_property_amenities_catalog.sql` (property) | — `30f67f9a` | `property_amenity_catalog`, `property_listing_amenities` | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 20 | `20260515120500_care_user_preferences.sql` (care) | — `30f67f9a` | `care_user_preferences` | 20260515120000…care_garment_types.sql (care_garment_types) | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 21 | `20260515120500_property_floorplans.sql` (property) | — `30f67f9a` | `property_floorplans` | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 22 | `20260515121000_care_recurring_schedules.sql` (care) | — `30f67f9a` | `care_recurring_schedules` | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| — | `20260515121000_jobs_interview_rooms.sql` (jobs) | — `30f67f9a` | `jobs_interview_room_events`, `jobs_interview_rooms` | baseline only | BLOCKED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✗ column app.candidate_user_id does not exist | — |
| 23 | `20260515121000_property_virtual_tours.sql` (property) | — `30f67f9a` | `property_virtual_tours` | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| — | `20260515121500_care_claims.sql` (care) | — `30f67f9a` | `care_claims` | baseline only | BLOCKED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✗ column b.user_id does not exist | — |
| — | `20260515121500_jobs_offer_letters.sql` (jobs) | — `30f67f9a` | `jobs_offer_letter_events`, `jobs_offer_letters` | baseline only | BLOCKED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✗ column app.candidate_user_id does not exist | — |
| 24 | `20260515121500_property_neighborhood_signals.sql` (property) | — `30f67f9a` | `property_neighborhood_signals` | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| — | `20260515122000_care_pod_records.sql` (care) | — `30f67f9a` | `care_pod_records` | baseline only | BLOCKED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✗ column b.user_id does not exist | — |
| 25 | `20260515122000_jobs_salary_benchmarks.sql` (jobs) | — `30f67f9a` | `jobs_salary_benchmarks` | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 26 | `20260515122000_property_saved_searches.sql` (property) | — `30f67f9a` | `property_saved_searches` | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| — | `20260515122500_care_booking_garments.sql` (care) | — `30f67f9a` | `care_booking_garments` | 20260515120000…care_garment_types.sql (care_garment_types); 20260515121500…care_claims.sql (care_claims) | BLOCKED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✗ relation "public.care_claims" does not exist | — |
| 27 | `20260515122500_jobs_pipeline_extras.sql` (jobs) | — `30f67f9a` | `jobs_application_notes`, `jobs_pipeline_stages` | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 28 | `20260515122500_property_inspection_rules.sql` (property) | — `30f67f9a` | `property_inspection_rule_evaluations`, `property_inspection_rules` | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 29 | `20260515123000_care_realtime_publication.sql` (care) | — `30f67f9a` | (alters/grants only) | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 30 | `20260515123000_jobs_realtime_publication.sql` (jobs) | — `30f67f9a` | (alters/grants only) | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 31 | `20260515123000_property_rent_payments.sql` (property) | — `30f67f9a` | `property_rent_payments` | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 32 | `20260515123500_property_maintenance_tickets.sql` (property) | — `30f67f9a` | `property_maintenance_tickets` | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 33 | `20260515124000_property_viewings_extensions.sql` (property) | — `30f67f9a` | (alters/grants only) | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | ⚠ drop + re-add live `property_viewing_requests_status_check` (widening only) |
| 34 | `20260515124500_property_realtime_publication.sql` (property) | — `30f67f9a` | (alters/grants only) | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 35 | `20260610120000_v3_37_abandoned_tasks.sql` (hub) | #265 `506be4db` | `abandoned_tasks` | (prod data) — needs reference row data_governance_domains('identity_account') (FK) | NOW | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21); re-stated unapplied in `docs/v3/automation/REGROUNDING-LEDGER.md:117` (V3-43-era) | ✗ insert or update on table "data_retention_policies" violates foreign key constraint "data… | ⚠ own BEGIN/COMMIT |
| 36 | `20260610121000_v3_37_recovery_notification_category.sql` (hub) | #265 `506be4db` | (alters/grants only) | baseline only | NOW | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | ⚠ drop + re-add live `customer_notifications_category_check` — NARROWS if applied after SA-4 (shadow-proven) |
| 37 | `20260614120000_care_services_catalog_expansion.sql` (care) | #284 `4222feb3` | `catalog_services`, `service_verticals` | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21); ⚠ CONFLICT: V3-38 header (`8ff790f2`, 2026-09-03) calls it “the applied V3-49 seed” | ✓ · re-apply ✓ | — |
| 38 | `20260614120500_care_services_catalog_seed.sql` (care) | #284 `4222feb3` | (alters/grants only) | 20260614120000…care_services_catalog_exp (service_verticals) | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21); same V3-38 conflict | ✓ · re-apply ✓ | — |
| 39 | `20260620090000_kyc_vault_envelope_encryption.sql` (hub) | #320 `45aaa57d` | `kyc_vault_artifacts` | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21); `PROGRAM-STATUS-2026-06-21.md:210` | ✓ · re-apply ✓ | ⚠ own BEGIN/COMMIT |
| 40 | `20260620120000_studio_deliverable_revisions.sql` (studio) | #321 `b7f51f27` | `studio_asset_exports`, `studio_deliverable_revisions` | baseline only | NOW | **CONFIRMED-APPLIED** | architect live query this session: APPLIED (git's last record, `ACTIVATION-APPLY-ORDER.md` 2026-07-19, predates the apply and lists it absent) | ✓ · re-apply ✓ | — |
| 41 | `20260620130000_v3_70_hiring_business_scope.sql` (jobs) | #319 `67c9a2a3` | (alters/grants only) | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21); `PROGRAM-STATUS-2026-06-21.md:159` | ✓ · re-apply ✓ | — |
| 42 | `20260620131000_v3_70_hiring_collaboration.sql` (jobs) | #319 `67c9a2a3` | `jobs_application_score_summary`, `jobs_application_scores`, `jobs_application_stage_events`, `jobs_application_team_notes` | baseline only | GATED | NEEDS-PROD-CONFIRMATION | last recorded UNAPPLIED — RECONCILE-01 DORMANT (`9851ecdb`, 2026-06-21) | ✓ · re-apply ✓ | — |
| 43 | `20260623090000_notification_rls_withcheck_and_signal_feed_guard.sql` (hub) | #333 `29866177` | (alters/grants only) | baseline only | NOW | NEEDS-PROD-CONFIRMATION | no apply record on main (commit `29866177` body silent) | ✓ · re-apply ✓ | — |
| 44 | `20260626120000_marketplace_conversations.sql` (marketplace) | #343 `c4e7873e` | `marketplace_conversation_messages`, `marketplace_conversation_participants`, `marketplace_conversations` | baseline only | NOW | NEEDS-PROD-CONFIRMATION | file header “Committed-NOT-applied” (`c4e7873e`); no later apply record on main | ✓ · re-apply ✓ | — |
| 45 | `20260626130000_jobs_messaging_realtime.sql` (jobs) | #343 `c4e7873e` | (alters/grants only) | baseline only | NOW | NEEDS-PROD-CONFIRMATION | proposal doc “committed-NOT-applied” (`c4e7873e`); no later apply record on main | ✓ · re-apply ✓ | — |
| 46 | `20260627120000_sec_harden_07_is_staff_email_lockdown.sql` (hub) | #349 `6648e974` | (alters/grants only) | baseline only | NOW | NEEDS-PROD-CONFIRMATION | file header: “safe to sit committed-not-applied until [owner review]” (`6648e974`) | ✓ · re-apply ✓ | — |
| 47 | `20260627120000_v3_ai_01_metered_billing.sql` (hub) | #352 `96e72bc2` (edited `6d35a56a`) | `ai_usage_events`, `customer_wallet_ai_holds` | baseline only | NOW | NEEDS-PROD-CONFIRMATION | RECORDED APPLIED 2026-07-03 — `docs/v3/ai/APPLY-v3-ai-01-metered-billing.md` (✅ APPLIED banner); header still says CNA (stale) | ✓ · re-apply ✓ | — |
| 48 | `20260627121000_learn_quiz_answer_key_lockdown.sql` (learn) | #350 `f906d1c9` | `learn_quiz_questions_public` | baseline only | NOW | NEEDS-PROD-CONFIRMATION | file header “HELD / committed-not-applied” (`f906d1c9`) | ✓ · re-apply ✓ | — |
| 49 | `20260627121500_learn_reviews_pii_lockdown.sql` (learn) | #350 `f906d1c9` | `learn_reviews_public` | baseline only | NOW | NEEDS-PROD-CONFIRMATION | file header “HELD / committed-not-applied” (`f906d1c9`) | ✓ · re-apply ✓ | — |
| 50 | `20260627122000_learn_lessons_content_gate.sql` (learn) | #350 `f906d1c9` | `learn_lessons_public` | baseline only | NOW | NEEDS-PROD-CONFIRMATION | file header “HELD / committed-not-applied” (`f906d1c9`) | ✓ · re-apply ✓ | — |
| 51 | `20260627130000_v3_ai_verify_01_listing_verifications.sql` (marketplace) | — `7f1be9ef` (edited `2c53bb04`) | `marketplace_listing_verifications` | baseline only | NOW | NEEDS-PROD-CONFIRMATION | no apply record on main; header “COMMITTED; apply with …” | ✓ · re-apply ✓ | — |
| 52 | `20260627213858_sec_harden_08_money_table_grant_lockdown.sql` (hub) | #353 `a2c181f1` | (alters/grants only) | baseline only | NOW | NEEDS-PROD-CONFIRMATION | RECORDED APPLIED 2026-06-27 as version `20260627213858` — file header + `a2c181f1` (#353) | ✓ · re-apply ✓ | — |
| 53 | `20260701120000_v3_ai_verify_property_listing_verifications.sql` (property) | — `7c149841` | `property_listing_verifications` | baseline only | NOW | NEEDS-PROD-CONFIRMATION | no apply record on main (`7c149841`) | ✓ · re-apply ✓ | — |
| 54 | `20260701130000_v3_property_db_listings_data.sql` (property) | — `6e3725c3` | (alters/grants only) | baseline only | NOW | NEEDS-PROD-CONFIRMATION | no apply record on main (`6e3725c3`) | ✓ · re-apply ✓ | — |
| 55 | `20260704120000_intelligence_live_conversations.sql` (hub) | — `c4fa710f` | `intelligence_conversations`, `intelligence_messages` | baseline only | NOW | NEEDS-PROD-CONFIRMATION | no apply record on main (`c4fa710f`) | ✓ · re-apply ✓ | — |
| 56 | `20260705120000_marketplace_category_expansion.sql` (marketplace) | — `4d922ccf` | (alters/grants only) | baseline only | NOW | NEEDS-PROD-CONFIRMATION | no apply record on main (`4d922ccf`) | ✓ · re-apply ✓ | — |
| 57 | `20260705140000_ai_free_abuse_guard.sql` (hub) | — `639fbba7` | `ai_free_actor_state` | baseline only | NOW | NEEDS-PROD-CONFIRMATION | no apply record on main (`639fbba7`: “dark until activation”) | ✓ · re-apply ✓ | — |
| 58 | `20260705150000_ai_free_spend_ledger.sql` (hub) | — `3b4fa488` | `ai_free_spend_ledger` | baseline only | NOW | NEEDS-PROD-CONFIRMATION | RECORDED APPLIED — live-probed 2026-07-24, prod version `20260705200844` (`docs/v3/automation/RE-GROUNDING-2026-07-24.md:49,70`; `AI-IN-AUTOMATION.md:53`) | ✓ · re-apply ✓ | — |
| 59 | `20260706120000_v3_money_mc_multicurrency_ledger.sql` (hub) | — `330a7ba9` | (alters/grants only) | baseline only | NOW | NEEDS-PROD-CONFIRMATION | no apply record on main (`330a7ba9`: “Apply to prod dry-run-first after merge”) | ✓ · re-apply ✓ | ⚠ drops `journal_entries_currency_base` on the money-spine `journal_entries`; redefines ledger RPCs |
| 60 | `20260706130000_v3_money_payout_rail.sql` (hub) | — `f2dfaff8` | (alters/grants only) | baseline only | NOW | NEEDS-PROD-CONFIRMATION | no apply record on main (`f2dfaff8`) | ✓ · re-apply ✓ | — |
| 61 | `20260709090000_email_provider_allow_ses.sql` (hub) | — `3e8ce4a8` | (alters/grants only) | baseline only | NOW | NEEDS-PROD-CONFIRMATION | no apply record on main; `REGROUNDING-LEDGER.md:51` notes the prod snapshot CHECK = resend/brevo only | ✓ · re-apply ✓ | ⚠ drop + re-add live `customer_notifications_email_provider_known` — NARROWS (drops postmark) if applied after 0714 |
| 62 | `20260709093000_brand_purge_company_settings.sql` (hub) | — `d0c7e933` | (alters/grants only) | baseline only | NOW | NEEDS-PROD-CONFIRMATION | no apply record on main (`d0c7e933`) | ✓ · re-apply ✓ | ⚠ irreversible UPDATE of live `company_settings` / `company_site_settings` rows |
| 63 | `20260710140000_founder_intelligence.sql` (hub) | — `13b585eb` (edited `e16336dd`) | `founder_intelligence_conversations`, `founder_intelligence_messages` | baseline only | NOW | NEEDS-PROD-CONFIRMATION | implied APPLIED: F3 is recorded on prod (next row) and F3 cannot apply without F2's `founder_intelligence_is_owner()` (shadow-proven, T2/T3) | ✓ · re-apply ✗ (not idempotent) | not re-runnable |
| 64 | `20260710160000_founder_action_proposals.sql` (hub) | — `4d24a4a1` (edited `7949478c`) | `founder_action_proposals` | 20260710140000_founder_intelligence.sql — RLS uses founder_intelligence_is_owner() | NOW | NEEDS-PROD-CONFIRMATION | RECORDED on prod — `docs/v3/automation/ENGINE-UNIFICATION.md:7` (re-grounded 2026-07-24: “founder_action_proposals … real and on prod”) | ✓ · re-apply ✗ (not idempotent) | not re-runnable |
| 65 | `20260710180000_hub_security_hardening.sql` (hub) | — `7ae249c1` | (alters/grants only) | baseline only | NOW | NEEDS-PROD-CONFIRMATION | no apply record on main (`7ae249c1` says “DEPLOY: apply migration 20260710180000”) | ✓ · re-apply ✓ | — |
| 66 | `20260714090000_email_provider_allow_postmark.sql` (hub) | #500 `67488320` | (alters/grants only) | 20260709090000_email_provider_allow_ses. — email_provider CHECK re-state: ses-set ⊂ postmark-set; ses after postmark silently drops 'postmark' | NOW | NEEDS-PROD-CONFIRMATION | no apply record on main; `REGROUNDING-LEDGER.md:114` asks to confirm it | ✓ · re-apply ✓ | ⚠ drop + re-add (validated) live `customer_notifications_email_provider_known` |
| 67 | `20260714093000_harden_account_set_updated_at_search_path.sql` (hub) | #500 `67488320` | (alters/grants only) | baseline only | NOW | NEEDS-PROD-CONFIRMATION | RECORDED APPLIED — file header “Applied to prod … 2026-07-14”; prod version `20260715221056` (`ACTIVATION-APPLY-ORDER.md:26`, list_migrations) | ✓ · re-apply ✓ | — |
| 68 | `20260718120000_studio_brief_flow_persistence.sql` (studio) | #511 `8c9794b5` | `studio_brief_conversation_messages`, `studio_brief_conversations`, `studio_brief_flow_drafts` | baseline only | NOW | **CONFIRMED-APPLIED** | architect live query this session: APPLIED | ✓ · re-apply ✓ | — |
| 69 | `20260718120000_v3_34_personalization_home.sql` (hub) | #514 `34c52291` | `personalization_consent_events`, `user_home_layouts` | baseline only | NOW | **CONFIRMED-UNAPPLIED** | architect live query this session: UNAPPLIED; git: `RE-GROUNDING-2026-07-24.md:18,74` (R6) | ✓ · re-apply ✓ | — |
| 70 | `20260719120000_studio_build_jobs.sql` (studio) | #512 `334afd80` | `studio_build_bundles`, `studio_build_events`, `studio_build_jobs`, `studio_build_jobs_client_stage_v` +2 | 20260620120000_studio_deliverable_revisi — view reads studio_projects.client_business_id (V3-73 column) | NOW | **CONFIRMED-APPLIED** | architect live query this session: APPLIED | ✓ · re-apply ✓ | — |
| 71 | `20260720120000_studio_agency_orchestration.sql` (studio) | #523 `b08b1e9b` | `studio_agency_decisions`, `studio_agency_tick_lock` | 20260719120000…studio_build_jobs.sql (studio_build_jobs) | NOW | **CONFIRMED-APPLIED** | architect live query this session: APPLIED | ✓ · re-apply ✓ | — |
| 72 | `20260723130000_founder_operator_spine.sql` (hub) | #524 `241f068a` (edited `29aac1f2`) | (alters/grants only) | 20260710160000_founder_action_proposals. — ALTERs founder_action_proposals — block is to_regclass-guarded, so a missing F3 = SILENT no-op (origin column never added); 20260610121000_v3_37_recovery_notificati — category CHECK re-state: 0606 ⊂ V3-37 ⊂ SA-4; V3-… | NOW | NEEDS-PROD-CONFIRMATION | RECORDED UNAPPLIED — live probe `RE-GROUNDING-2026-07-24.md:17` (R5) + V3-43 header “verified on prod 2026-07-23” | ✓ · re-apply ✓ | ⚠ drop + re-add (VALIDATED) live `customer_notifications_category_check` |
| 73 | `20260724120000_v3_35_deals.sql` (hub) | #528 `bc5cabf1` | `deal_impressions`, `deals` | baseline only | NOW | NEEDS-PROD-CONFIRMATION | RECORDED UNAPPLIED — `bc5cabf1` body “Migration committed, NOT applied” | ✓ · re-apply ✓ | ⚠ drop + re-add live moderation `content_type` CHECKs (widening) + bulk copy of `marketplace_deals_curation` rows (old table kept)<br>⚠ own BEGIN/COMMIT |
| 74 | `20260724120000_v3_38_service_area_coverage.sql` (hub) | #529 `8ff790f2` | `service_area_coverage`, `service_availability_gaps` | baseline only | NOW | NEEDS-PROD-CONFIRMATION | RECORDED UNAPPLIED — pass report “flag-dark, committed-not-applied” (architect brief); `8ff790f2` records CI apply only | ✓ · re-apply ✓ | — |
| 75 | `20260724120000_v3_39_next_action_prompts.sql` (hub) | #530 `2918c853` | `next_action_dismissals` | baseline only | NOW | NEEDS-PROD-CONFIRMATION | RECORDED UNAPPLIED — `2918c853` body “Migration remains unapplied until owner apply” | ✓ · re-apply ✓ | — |
| 76 | `20260724120000_v3_43_workflow_rail.sql` (hub) | #527 `29aac1f2` | `internal_ai_spend_ledger`, `workflow_jobs`, `workflow_locks`, `workflow_runs` | 20260720120000_studio_agency_orchestrati — folds + drops studio_agency_tick_lock; SA-3 applied AFTER V3-43 would re-create a 2nd lock (“never two” broken); 20260705150000_ai_free_spend_ledger.sql — folds rows + drops ai_free_spend_ledger; the 0705 file applie… | NOW | NEEDS-PROD-CONFIRMATION | RECORDED UNAPPLIED — pass applied nothing (`29aac1f2`); no later apply record anywhere on main (git log/grep 2026-09-24) | ✓ · re-apply ✓ | ⚠ **DROP TABLE** `studio_agency_tick_lock` (after fold) + **DROP TABLE** `ai_free_spend_ledger` (live data, after fold) + redefines live `ai_free_spend_today()/add()` |
| 77 | `20260725120000_v3_40_risk_scores_and_models.sql` (hub) | #533 `ff3951ee` | `model_versions`, `risk_batch_runs`, `risk_enforcement_log`, `risk_scores` +1 | baseline only | NOW | NEEDS-PROD-CONFIRMATION | RECORDED UNAPPLIED — header “committed-NOT-applied until owner activation” (`ff3951ee`) | ✓ · re-apply ✓ | — |
| 78 | `20260902120000_v3_41_predictive_quality_workload.sql` (hub) | #534 `c0efba66` | `dispute_likelihoods`, `predictive_batch_runs`, `quality_assessments`, `workflow_locks` +1 | baseline only | NOW | NEEDS-PROD-CONFIRMATION | RECORDED UNAPPLIED — header + `c0efba66` body “committed, NOT applied” | ✓ · re-apply ✓ | — |
| 79 | `20260922120000_v3_42_staff_recommendation_state.sql` (hub) | #537 `b1efffe3` | `staff_recommendation_state` | 20260725120000_v3_40_risk_scores_and_mod — runtime reads V3-40/V3-41 tables (migration itself independent); 20260902120000_v3_41_predictive_quality_ — runtime reads | NOW | NEEDS-PROD-CONFIRMATION | RECORDED UNAPPLIED — header “committed-NOT-applied until owner activation” (`b1efffe3`) | ✓ · re-apply ✓ | — |

### 3.1 · NOW — the operational list (apply in this order, skipping anything §6.2 reports as applied)

35. `20260610120000_v3_37_abandoned_tasks.sql` — V3-37 abandoned-journey recovery (E-D4 apply; V3-45 prerequisite)
36. `20260610121000_v3_37_recovery_notification_category.sql` — V3-37 companion — category CHECK widen (+account.recovery.reminder)
40. `20260620120000_studio_deliverable_revisions.sql` — V3-73 studio project suite (SA-2 hard prerequisite)  ·  **CONFIRMED-APPLIED** (skip)
43. `20260623090000_notification_rls_withcheck_and_signal_feed_guard.sql` — V3-NOTIF-RLS-01 — close notification write/read IDOR
44. `20260626120000_marketplace_conversations.sql` — Onyx Line — marketplace buyer↔seller messaging store
45. `20260626130000_jobs_messaging_realtime.sql` — Onyx Line — jobs messaging realtime
46. `20260627120000_sec_harden_07_is_staff_email_lockdown.sql` — SEC-HARDEN-07 — drop email-OR branch from learn/studio staff resolvers (role-membership)
47. `20260627120000_v3_ai_01_metered_billing.sql` — V3-AI-01 metered AI billing (money spine — payments_private RPCs)
48. `20260627121000_learn_quiz_answer_key_lockdown.sql` — FIRE-LEARN LRN-2 quiz answer-key lockdown (HELD — owner verify)
49. `20260627121500_learn_reviews_pii_lockdown.sql` — FIRE-LEARN LRN-3 reviews PII lockdown (HELD — owner verify)
50. `20260627122000_learn_lessons_content_gate.sql` — FIRE-LEARN LRN-4 lesson content gate (HELD — owner verify)
51. `20260627130000_v3_ai_verify_01_listing_verifications.sql` — V3-AI-VERIFY-01 marketplace Verified badge (+IDOR fix `2c53bb04`)
52. `20260627213858_sec_harden_08_money_table_grant_lockdown.sql` — SEC-HARDEN-08 money-table grant lockdown
53. `20260701120000_v3_ai_verify_property_listing_verifications.sql` — Property Verified badge (flag-dark)
54. `20260701130000_v3_property_db_listings_data.sql` — Property DB listings read path (cutover-gated: backfill → parity → flag)
55. `20260704120000_intelligence_live_conversations.sql` — Intelligence Live L1a — conversation persistence
56. `20260705120000_marketplace_category_expansion.sql` — Marketplace category taxonomy expansion (data seed)
57. `20260705140000_ai_free_abuse_guard.sql` — AI abuse guard pass 2
58. `20260705150000_ai_free_spend_ledger.sql` — Free-AI economic guardrail ledger (FOLDED + DROPPED by V3-43)
59. `20260706120000_v3_money_mc_multicurrency_ledger.sql` — Money M1a multi-currency ledger (money spine — redefines ledger RPCs)
60. `20260706130000_v3_money_payout_rail.sql` — Money W2 withdrawal payout rail (money spine)
61. `20260709090000_email_provider_allow_ses.sql` — email_provider CHECK +ses
62. `20260709093000_brand_purge_company_settings.sql` — Brand purge of company settings rows (data rewrite)
63. `20260710140000_founder_intelligence.sql` — F2 Founder Intelligence tables
64. `20260710160000_founder_action_proposals.sql` — F3 governed write-action rail
65. `20260710180000_hub_security_hardening.sql` — F5 FIRE-HUB owner-gate fixes HUB-1..4
66. `20260714090000_email_provider_allow_postmark.sql` — email_provider CHECK +postmark (Postmark migration #500)
67. `20260714093000_harden_account_set_updated_at_search_path.sql` — Advisor 0011 — pin account_set_updated_at search_path
68. `20260718120000_studio_brief_flow_persistence.sql` — SA-1 studio brief flow persistence  ·  **CONFIRMED-APPLIED** (skip)
69. `20260718120000_v3_34_personalization_home.sql` — V3-34 personalization home + NDPR consent (#514)  ·  **CONFIRMED-UNAPPLIED**
70. `20260719120000_studio_build_jobs.sql` — SA-2 studio build-job spine  ·  **CONFIRMED-APPLIED** (skip)
71. `20260720120000_studio_agency_orchestration.sql` — SA-3 agency orchestration (tick lock FOLDED+DROPPED by V3-43)  ·  **CONFIRMED-APPLIED** (skip)
72. `20260723130000_founder_operator_spine.sql` — SA-4 Owner-AI operator spine (#524, retargeted by #527)
73. `20260724120000_v3_35_deals.sql` — V3-35 deals & campaigns (#528)
74. `20260724120000_v3_38_service_area_coverage.sql` — V3-38 local availability (#529)
75. `20260724120000_v3_39_next_action_prompts.sql` — V3-39 smart next action (#530)
76. `20260724120000_v3_43_workflow_rail.sql` — V3-43 @henryco/workflow rail + lock/ledger consolidation (#527)
77. `20260725120000_v3_40_risk_scores_and_models.sql` — V3-40 predictive fraud & risk (#533)
78. `20260902120000_v3_41_predictive_quality_workload.sql` — V3-41 predictive quality & workload (#534)
79. `20260922120000_v3_42_staff_recommendation_state.sql` — V3-42 predictive staff dashboards (#537)

**Money-spine rows (#47, #59, #60) are out of this pass's authority.** They create or redefine `payments_private` / ledger RPCs. Apply them only in an owner-authorized money window using the `docs/v3/ai/APPLY-v3-ai-01-metered-billing.md` pattern (journal digest before/after, DR = CR). #47 is already recorded applied (2026-07-03).
**HELD rows (#48–#50)** need the owner's prod verification first; their file headers say "Apply only after the owner verifies on prod".
**#54** is cutover-gated: backfill `--apply` → confirm parity → `PROPERTY_DB_LISTINGS=true`.

### 3.2 · GATED — dormant families (apply only with their launch pass, still in this relative order)

1. `20260514120000_logistics_quotes.sql` — PASS-21 logistics depth
2. `20260514120500_logistics_shipment_legs.sql` — PASS-21 logistics depth
3. `20260514121000_logistics_pod.sql` — PASS-21 logistics depth
4. `20260514121500_logistics_claims.sql` — PASS-21 logistics depth
5. `20260514122000_logistics_fleet.sql` — PASS-21 logistics depth
6. `20260514122500_logistics_b2b_accounts.sql` — PASS-21 logistics depth
7. `20260514123000_logistics_realtime_publication.sql` — PASS-21 logistics depth (realtime; re-run after family)
8. `20260514130000_studio_proposal_signatures.sql` — PASS-21 / V3-73 studio depth
9. `20260514130500_studio_revisions_versioning.sql` — PASS-21 / V3-73 studio depth
10. `20260514131000_studio_milestone_extensions.sql` — PASS-21 / V3-73 studio depth
11. `20260514131500_studio_payment_plans.sql` — PASS-21 / V3-73 studio depth (money-adjacent)
12. `20260514132000_studio_resource_allocations.sql` — PASS-21 / V3-73 studio depth
13. `20260514132500_studio_asset_packs.sql` — PASS-21 / V3-73 studio depth
14. `20260514133000_studio_realtime_publication.sql` — PASS-21 / V3-73 studio depth (realtime; re-run after family)
15. `20260515000000_learn_v3_pass21_player.sql` — PASS-21 learn player
16. `20260515001000_learn_v3_pass21_policies.sql` — PASS-21 learn player (policies)
17. `20260515002000_learn_v3_pass21_realtime.sql` — PASS-21 learn player (realtime)
18. `20260515120000_care_garment_types.sql` — PASS-21 care depth
19. `20260515120000_property_amenities_catalog.sql` — PASS-21 property depth
20. `20260515120500_care_user_preferences.sql` — PASS-21 care depth
21. `20260515120500_property_floorplans.sql` — PASS-21 property depth
22. `20260515121000_care_recurring_schedules.sql` — PASS-21 care depth
23. `20260515121000_property_virtual_tours.sql` — PASS-21 property depth
24. `20260515121500_property_neighborhood_signals.sql` — PASS-21 property depth
25. `20260515122000_jobs_salary_benchmarks.sql` — PASS-21 jobs depth
26. `20260515122000_property_saved_searches.sql` — PASS-21 property depth
27. `20260515122500_jobs_pipeline_extras.sql` — PASS-21 jobs depth
28. `20260515122500_property_inspection_rules.sql` — PASS-21 property depth
29. `20260515123000_care_realtime_publication.sql` — PASS-21 care depth (realtime; re-run after family)
30. `20260515123000_jobs_realtime_publication.sql` — PASS-21 jobs depth (realtime; re-run after family)
31. `20260515123000_property_rent_payments.sql` — PASS-21 property depth (rent ledger — money-adjacent)
32. `20260515123500_property_maintenance_tickets.sql` — PASS-21 property depth
33. `20260515124000_property_viewings_extensions.sql` — PASS-21 property depth
34. `20260515124500_property_realtime_publication.sql` — PASS-21 property depth (realtime)
37. `20260614120000_care_services_catalog_expansion.sql` — V3-49 services catalog
38. `20260614120500_care_services_catalog_seed.sql` — V3-49 services catalog (seed)
39. `20260620090000_kyc_vault_envelope_encryption.sql` — V3-KYC-VAULT-01 (D6; needs master key)
41. `20260620130000_v3_70_hiring_business_scope.sql` — V3-70 employer hiring suite
42. `20260620131000_v3_70_hiring_collaboration.sql` — V3-70 employer hiring suite

---

## 4 · BLOCKED and DO-NOT-APPLY — 14 files that are not apply-ready as authored

These need a **migration fix pass**, which is out of scope here because migration files must not be edited. They're listed so nobody tries a blind apply.

| File | Verdict | Proof | Fix direction (for a future pass) |
|---|---|---|---|
| `hub/20260515100000_rooms_sessions.sql` … `20260515100600_rooms_realtime_publication.sql` (7) | **BLOCKED — cyclic** | local PGlite + PG17: sessions → `relation "public.rooms_participants" does not exist`; participants → `relation "public.rooms_sessions" does not exist`; the other 5 cascade | move the participant-subselect policy on `rooms_sessions` into (or after) `rooms_participants` |
| `care/20260515121500_care_claims.sql`, `care/20260515122000_care_pod_records.sql` | **BLOCKED — schema drift** | shadow: `column b.user_id does not exist`. Prod `care_bookings` has `customer_id`, not `user_id` (`prod-actual/schema.sql`, `create table public.care_bookings`) | rebind to `customer_id` |
| `care/20260515122500_care_booking_garments.sql` | **BLOCKED — cascade** | `relation "public.care_claims" does not exist` | after the care_claims fix |
| `jobs/20260515121000_jobs_interview_rooms.sql`, `jobs/20260515121500_jobs_offer_letters.sql` | **BLOCKED — schema drift** | shadow: `column app.candidate_user_id does not exist`. Prod `jobs_applications` has `candidate_id` (no applied migration adds `candidate_user_id` to it) | rebind to `candidate_id` |
| `super-app/20260405120000_super_app_core.sql` | **DO-NOT-APPLY** | `create or replace function public.handle_new_user()` would **replace prod's live signup trigger function**. Prod's body inserts `role='customer', phone, is_active` (`schema.sql:901-915`); this one inserts `(id, full_name)` only. It also re-creates `on_auth_user_created` (prod has it, `schema.sql:7345`) and adds an anon `insert … with check (true)` policy. The shadow also hits a policy clash on `profiles`. | the Expo program is deferred; this file must be rewritten against prod before it ever applies |
| `hub/20260402235500_workspace_staff_platform.sql` | **DO-NOT-APPLY (retire)** | RECONCILE-01: "never adopted — superseded by the staff_* / *_role_memberships model". It applies cleanly in the shadow, but it creates 10 orphan `workspace_*` tables. | owner decision: delete the file, or keep it permanently dormant |

The GATED realtime files that sit next to blocked tables (`care_realtime_publication` #29, `jobs_realtime_publication` #30) are table-guarded and harmless. Re-run them after their families are fixed.

---

## 5 · Destructive & order-sensitive migrations — dry-run treatment required (10)

**Treatment for every row:**
1. Run the "before" counts.
2. Dry-run the file in `begin; … rollback;`, **except the three files with their own `BEGIN/COMMIT`** (next paragraph).
3. Apply.
4. Run the "after" counts and compare.

**⚠ Inner-transaction files:** V3-35 `deals`, V3-37 `abandoned_tasks`, KYC vault. Their own `COMMIT` would **commit a `begin; … rollback;` dry-run on prod** (the outer transaction ends at the inner `COMMIT`). Dry-run these on a Supabase branch or the local shadow only, never with begin/rollback on prod.

| # | Migration | What it destroys / rewrites | Before → after check (read-only) |
|---|---|---|---|
| 1 | **V3-43** `20260724120000_v3_43_workflow_rail` | **DROP TABLE `ai_free_spend_ledger`** (live free-AI spend history) after folding rows into `internal_ai_spend_ledger('free_ai')`; **DROP TABLE `studio_agency_tick_lock`** after folding into `workflow_locks('studio.agency.tick')`; redefines the live `ai_free_spend_today()` / `ai_free_spend_add(bigint)` as wrappers | before: `select count(*), sum(spent_kobo) from ai_free_spend_ledger; select * from studio_agency_tick_lock; select ai_free_spend_today();` after: `select count(*), sum(spent_kobo) from internal_ai_spend_ledger where budget_key='free_ai'` (**must equal before**); `select ai_free_spend_today()` (**must equal before**); `workflow_locks` has `studio.agency.tick` + `hub.operator.tick`; both old tables `to_regclass` NULL. Shadow T3/T4: exact carry-over, and re-apply doesn't double-count. |
| 2 | **super_app_core** (DNA) | replaces live `handle_new_user()` + trigger | not to be applied (§4) |
| 3 | **SA-4** `founder_operator_spine` | drop + re-add (validated) `customer_notifications_category_check` | before: `select category, count(*) from customer_notifications group by 1` → every value must be in SA-4's 28-value list, or the ADD aborts. after: constraint contains `owner.operator.escalation` and `account.recovery.reminder` |
| 4 | **V3-37** `recovery_notification_category` | drop + re-add the same CHECK | **must precede SA-4 (E5)**. If §6.2 says SA-4 is already applied and V3-37-category is not, **do NOT apply V3-37-category** — SA-4's list already contains `account.recovery.reminder`, and applying it would silently narrow |
| 5 | `email_provider_allow_ses` | drop + re-add `customer_notifications_email_provider_known` | if postmark is already applied, **skip it** (its set is a subset) — same rule as #4 |
| 6 | `email_provider_allow_postmark` | same CHECK, widening | before: `select email_provider, count(*) from customer_notifications group by 1` ⊂ `{resend,brevo,ses,postmark}` |
| 7 | `v3_money_mc_multicurrency_ledger` | drops `journal_entries_currency_base` on money-spine `journal_entries`; redefines ledger RPCs | **money window only**: `select count(*), sum(debit_minor), sum(credit_minor) from journal_lines` before = after; `select distinct currency from payment_intents` (commit `330a7ba9`: "confirm zero non-NGN payment_intents") |
| 8 | `brand_purge_company_settings` | irreversible UPDATE of `company_settings` / `company_site_settings` text columns | before: `select * from company_settings; select * from company_site_settings;` (**save the output — it's the only undo**) |
| 9 | `property_viewings_extensions` (GATED) | drop + re-add `property_viewing_requests_status_check` (widening: +`no_show`, +`waitlisted`) | before: `select status, count(*) from property_viewing_requests group by 1` |
| 10 | **V3-35** `deals` | drop + re-add moderation `content_type` CHECKs (widening: +`deal`); bulk-copies `marketplace_deals_curation` → `deals` (old table kept) | before: `select count(*) from marketplace_deals_curation`; after: `select count(*) from deals where source='curation_migration'` (= before) |

Also note: `sec_harden_07` re-creates `learn_is_staff()` **without** the `SET search_path` pin that prod's version carries (`schema.sql:1256`). It's a SECURITY INVOKER sql function, so the risk is low, but expect advisor 0011 to flag it after apply.

Re-runnability: F2 `founder_intelligence` and F3 `founder_action_proposals` are **not idempotent** (bare `create policy`; shadow pass 2 fails). Prod history names aren't guaranteed to equal the repo filename; RECONCILE-01:27 records re-versioned rows. So a naive exact-name check can mis-read an applied file as unapplied. §6.2 normalizes names for exactly this reason, and F3 is independently git-recorded on prod (`ENGINE-UNIFICATION.md:7`). If a row is still ambiguous, trust the object probe and **do not re-run**.

---

## 6 · DAY-OF — the moment Supabase resumes

### 6.1 · Order of operations

1. **Health only:** `select 1;` Wait until the project reports ACTIVE and the query returns without a timeout.
2. **Run §6.2** (read-only). Paste the full result into the apply session's notes. Every row now has a ground-truth verdict:
   - **CONFIRMED-APPLIED** / **APPLIED OUT-OF-BAND** → skip; never re-run.
   - **CONFIRMED-UNAPPLIED** → apply candidate.
   - **INVESTIGATE** → a history row exists but the objects don't. Stop and diff that row's file against prod before anything else.
3. **Run §6.3** (read-only guards and preflight).
4. Apply the **NOW** rows that are CONFIRMED-UNAPPLIED, **in §3.1 order**, one at a time, and run §5's before/after treatment where it applies. Money rows (#47/#59/#60) and HELD rows (#48–#50) go in their own owner windows.
5. Re-run §6.2. Every applied NOW row must now read CONFIRMED-APPLIED.
6. Run §6.4 (post-apply invariants).

### 6.2 · The single confirmation query (read-only)

Also saved as **`C:\Users\HP VICTUS\Downloads\V3-ACTIVATION-RUNBOOK-01-DAY-OF-confirm-applied-state.sql`**.

How it works:
- `schema_migrations` is matched on the **name column, normalized**: a leading or trailing 8–14-digit stamp and any `.sql` suffix are stripped.
- Each row's verdict is cross-checked against an **object probe**.
- Every probe was **calibrated in the local shadow**: all 93 read FALSE before their file is applied and TRUE after it, and none is NULL. The query also runs without error on a DB where none of the candidates' objects exist.

```sql
-- =============================================================================
-- V3-ACTIVATION-RUNBOOK-01 — DAY-OF APPLIED-STATE CONFIRMATION (READ-ONLY)
-- Project: rzkbgwuznmdxnnhmjazy · Run ONCE, the moment Supabase resumes, BEFORE
-- applying anything. Pure SELECT: no DDL, no DML, no function calls with side
-- effects. Safe to paste into the Supabase SQL editor.
--
-- Matching is on the NORMALIZED NAME, never the version: prod versions are
-- apply-time stamps (git-recorded examples: repo 20260514120000_marketplace_
-- inventory_movements <-> prod 20260605202350 'marketplace_inventory_movements',
-- RECONCILE-01:27; ai_free_spend_ledger -> prod 20260705200844), and repo
-- versions collide (4 hub files share 20260724120000). The normalizer strips a
-- leading and a trailing 8–14-digit stamp and a trailing .sql, so a CLI-style
-- '<stem>_<stamp>' or '<stamp>_<stem>' name also matches.
--
-- Each row also carries an OBJECT PROBE (a read-only catalog check), because
-- (a) hand-applied migrations have NO schema_migrations row (RECONCILE-01
-- follow-up #2), and (b) a history row does not prove the CURRENT file content
-- landed (e.g. SA-4 pre-retarget vs post-retarget).
-- Source of truth for each row: docs/v3/ACTIVATION-RUNBOOK-2026-09-24.md
-- =============================================================================
with cand(ord, seq, tier, file, stem, pr, pre_status, objects_present) as (values
  (  1, '—', 'DNA', '20260402235500_workspace_staff_platform.sql', 'workspace_staff_platform', '—', 'NPC', to_regclass('public.workspace_tasks') is not null),
  (  2, '—', 'DNA', '20260405120000_super_app_core.sql', 'super_app_core', '—', 'NPC', to_regclass('public.contact_submissions') is not null),
  (  3, '1', 'GATED', '20260514120000_logistics_quotes.sql', 'logistics_quotes', '—', 'NPC', to_regclass('public.logistics_quotes') is not null),
  (  4, '2', 'GATED', '20260514120500_logistics_shipment_legs.sql', 'logistics_shipment_legs', '—', 'NPC', to_regclass('public.logistics_shipment_legs') is not null),
  (  5, '3', 'GATED', '20260514121000_logistics_pod.sql', 'logistics_pod', '—', 'NPC', to_regclass('public.logistics_pod_records') is not null),
  (  6, '4', 'GATED', '20260514121500_logistics_claims.sql', 'logistics_claims', '—', 'NPC', to_regclass('public.logistics_claims') is not null),
  (  7, '5', 'GATED', '20260514122000_logistics_fleet.sql', 'logistics_fleet', '—', 'NPC', to_regclass('public.logistics_fleet_riders') is not null),
  (  8, '6', 'GATED', '20260514122500_logistics_b2b_accounts.sql', 'logistics_b2b_accounts', '—', 'NPC', to_regclass('public.logistics_b2b_accounts') is not null),
  (  9, '7', 'GATED', '20260514123000_logistics_realtime_publication.sql', 'logistics_realtime_publication', '—', 'NPC', exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='logistics_shipment_legs')),
  ( 10, '8', 'GATED', '20260514130000_studio_proposal_signatures.sql', 'studio_proposal_signatures', '—', 'NPC', to_regclass('public.studio_proposal_signatures') is not null),
  ( 11, '9', 'GATED', '20260514130500_studio_revisions_versioning.sql', 'studio_revisions_versioning', '—', 'NPC', exists(select 1 from information_schema.columns where table_schema='public' and table_name='studio_revisions' and column_name='approved_by_pm_user_id')),
  ( 12, '10', 'GATED', '20260514131000_studio_milestone_extensions.sql', 'studio_milestone_extensions', '—', 'NPC', exists(select 1 from information_schema.columns where table_schema='public' and table_name='studio_project_milestones' and column_name='payment_plan_id')),
  ( 13, '11', 'GATED', '20260514131500_studio_payment_plans.sql', 'studio_payment_plans', '—', 'NPC', to_regclass('public.studio_payment_plans') is not null),
  ( 14, '12', 'GATED', '20260514132000_studio_resource_allocations.sql', 'studio_resource_allocations', '—', 'NPC', to_regclass('public.studio_resource_allocations') is not null),
  ( 15, '13', 'GATED', '20260514132500_studio_asset_packs.sql', 'studio_asset_packs', '—', 'NPC', to_regclass('public.studio_asset_packs') is not null),
  ( 16, '14', 'GATED', '20260514133000_studio_realtime_publication.sql', 'studio_realtime_publication', '—', 'NPC', exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='studio_payment_plans')),
  ( 17, '15', 'GATED', '20260515000000_learn_v3_pass21_player.sql', 'learn_v3_pass21_player', '—', 'NPC', to_regclass('public.learn_lesson_playback') is not null),
  ( 18, '16', 'GATED', '20260515001000_learn_v3_pass21_policies.sql', 'learn_v3_pass21_policies', '—', 'NPC', exists(select 1 from pg_policies where schemaname='public' and tablename='learn_lesson_playback')),
  ( 19, '17', 'GATED', '20260515002000_learn_v3_pass21_realtime.sql', 'learn_v3_pass21_realtime', '—', 'NPC', exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='learn_lesson_playback')),
  ( 20, '—', 'BLOCKED', '20260515100000_rooms_sessions.sql', 'rooms_sessions', '—', 'NPC', to_regclass('public.rooms_sessions') is not null),
  ( 21, '—', 'BLOCKED', '20260515100100_rooms_participants.sql', 'rooms_participants', '—', 'NPC', to_regclass('public.rooms_participants') is not null),
  ( 22, '—', 'BLOCKED', '20260515100200_rooms_recordings_consent.sql', 'rooms_recordings_consent', '—', 'NPC', to_regclass('public.rooms_recordings_consent') is not null),
  ( 23, '—', 'BLOCKED', '20260515100300_rooms_recordings.sql', 'rooms_recordings', '—', 'NPC', to_regclass('public.rooms_recordings') is not null),
  ( 24, '—', 'BLOCKED', '20260515100400_rooms_scorecards.sql', 'rooms_scorecards', '—', 'NPC', to_regclass('public.rooms_scorecards') is not null),
  ( 25, '—', 'BLOCKED', '20260515100500_rooms_messages.sql', 'rooms_messages', '—', 'NPC', to_regclass('public.rooms_messages') is not null),
  ( 26, '—', 'BLOCKED', '20260515100600_rooms_realtime_publication.sql', 'rooms_realtime_publication', '—', 'NPC', exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='rooms_messages')),
  ( 27, '18', 'GATED', '20260515120000_care_garment_types.sql', 'care_garment_types', '—', 'NPC', to_regclass('public.care_garment_types') is not null),
  ( 28, '19', 'GATED', '20260515120000_property_amenities_catalog.sql', 'property_amenities_catalog', '—', 'NPC', to_regclass('public.property_amenity_catalog') is not null),
  ( 29, '20', 'GATED', '20260515120500_care_user_preferences.sql', 'care_user_preferences', '—', 'NPC', to_regclass('public.care_user_preferences') is not null),
  ( 30, '21', 'GATED', '20260515120500_property_floorplans.sql', 'property_floorplans', '—', 'NPC', to_regclass('public.property_floorplans') is not null),
  ( 31, '22', 'GATED', '20260515121000_care_recurring_schedules.sql', 'care_recurring_schedules', '—', 'NPC', to_regclass('public.care_recurring_schedules') is not null),
  ( 32, '—', 'BLOCKED', '20260515121000_jobs_interview_rooms.sql', 'jobs_interview_rooms', '—', 'NPC', to_regclass('public.jobs_interview_rooms') is not null),
  ( 33, '23', 'GATED', '20260515121000_property_virtual_tours.sql', 'property_virtual_tours', '—', 'NPC', to_regclass('public.property_virtual_tours') is not null),
  ( 34, '—', 'BLOCKED', '20260515121500_care_claims.sql', 'care_claims', '—', 'NPC', to_regclass('public.care_claims') is not null),
  ( 35, '—', 'BLOCKED', '20260515121500_jobs_offer_letters.sql', 'jobs_offer_letters', '—', 'NPC', to_regclass('public.jobs_offer_letters') is not null),
  ( 36, '24', 'GATED', '20260515121500_property_neighborhood_signals.sql', 'property_neighborhood_signals', '—', 'NPC', to_regclass('public.property_neighborhood_signals') is not null),
  ( 37, '—', 'BLOCKED', '20260515122000_care_pod_records.sql', 'care_pod_records', '—', 'NPC', to_regclass('public.care_pod_records') is not null),
  ( 38, '25', 'GATED', '20260515122000_jobs_salary_benchmarks.sql', 'jobs_salary_benchmarks', '—', 'NPC', to_regclass('public.jobs_salary_benchmarks') is not null),
  ( 39, '26', 'GATED', '20260515122000_property_saved_searches.sql', 'property_saved_searches', '—', 'NPC', to_regclass('public.property_saved_searches') is not null),
  ( 40, '—', 'BLOCKED', '20260515122500_care_booking_garments.sql', 'care_booking_garments', '—', 'NPC', to_regclass('public.care_booking_garments') is not null),
  ( 41, '27', 'GATED', '20260515122500_jobs_pipeline_extras.sql', 'jobs_pipeline_extras', '—', 'NPC', to_regclass('public.jobs_pipeline_stages') is not null),
  ( 42, '28', 'GATED', '20260515122500_property_inspection_rules.sql', 'property_inspection_rules', '—', 'NPC', to_regclass('public.property_inspection_rules') is not null),
  ( 43, '29', 'GATED', '20260515123000_care_realtime_publication.sql', 'care_realtime_publication', '—', 'NPC', exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='care_recurring_schedules')),
  ( 44, '30', 'GATED', '20260515123000_jobs_realtime_publication.sql', 'jobs_realtime_publication', '—', 'NPC', exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='jobs_pipeline_stages')),
  ( 45, '31', 'GATED', '20260515123000_property_rent_payments.sql', 'property_rent_payments', '—', 'NPC', to_regclass('public.property_rent_payments') is not null),
  ( 46, '32', 'GATED', '20260515123500_property_maintenance_tickets.sql', 'property_maintenance_tickets', '—', 'NPC', to_regclass('public.property_maintenance_tickets') is not null),
  ( 47, '33', 'GATED', '20260515124000_property_viewings_extensions.sql', 'property_viewings_extensions', '—', 'NPC', exists(select 1 from pg_constraint where conname='property_viewing_requests_status_check' and pg_get_constraintdef(oid) like '%waitlisted%')),
  ( 48, '34', 'GATED', '20260515124500_property_realtime_publication.sql', 'property_realtime_publication', '—', 'NPC', exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='property_saved_searches')),
  ( 49, '35', 'NOW', '20260610120000_v3_37_abandoned_tasks.sql', 'v3_37_abandoned_tasks', '#265', 'NPC', to_regclass('public.abandoned_tasks') is not null),
  ( 50, '36', 'NOW', '20260610121000_v3_37_recovery_notification_category.sql', 'v3_37_recovery_notification_category', '#265', 'NPC', exists(select 1 from pg_constraint where conname='customer_notifications_category_check' and pg_get_constraintdef(oid) like '%account.recovery.reminder%')),
  ( 51, '37', 'GATED', '20260614120000_care_services_catalog_expansion.sql', 'care_services_catalog_expansion', '#284', 'NPC', to_regclass('public.service_verticals') is not null),
  ( 52, '38', 'GATED', '20260614120500_care_services_catalog_seed.sql', 'care_services_catalog_seed', '#284', 'NPC', (case when to_regclass('public.service_verticals') is null then false else (xpath('/row/c/text()', query_to_xml('select count(*) > 0 as c from public.service_verticals', false, true, '')))[1]::text::boolean end)),
  ( 53, '39', 'GATED', '20260620090000_kyc_vault_envelope_encryption.sql', 'kyc_vault_envelope_encryption', '#320', 'NPC', to_regclass('public.kyc_vault_artifacts') is not null),
  ( 54, '40', 'NOW', '20260620120000_studio_deliverable_revisions.sql', 'studio_deliverable_revisions', '#321', 'CA', exists(select 1 from information_schema.columns where table_schema='public' and table_name='studio_projects' and column_name='client_business_id')),
  ( 55, '41', 'GATED', '20260620130000_v3_70_hiring_business_scope.sql', 'v3_70_hiring_business_scope', '#319', 'NPC', exists(select 1 from information_schema.columns where table_schema='public' and table_name='jobs_hiring_pipelines' and column_name='business_id')),
  ( 56, '42', 'GATED', '20260620131000_v3_70_hiring_collaboration.sql', 'v3_70_hiring_collaboration', '#319', 'NPC', to_regclass('public.jobs_application_scores') is not null),
  ( 57, '43', 'NOW', '20260623090000_notification_rls_withcheck_and_signal_feed_guard.sql', 'notification_rls_withcheck_and_signal_feed_guard', '#333', 'NPC', exists(select 1 from pg_policies where schemaname='public' and tablename='customer_notifications' and cmd='UPDATE' and with_check is not null)),
  ( 58, '44', 'NOW', '20260626120000_marketplace_conversations.sql', 'marketplace_conversations', '#343', 'NPC', to_regclass('public.marketplace_conversations') is not null),
  ( 59, '45', 'NOW', '20260626130000_jobs_messaging_realtime.sql', 'jobs_messaging_realtime', '#343', 'NPC', exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='jobs_messages')),
  ( 60, '46', 'NOW', '20260627120000_sec_harden_07_is_staff_email_lockdown.sql', 'sec_harden_07_is_staff_email_lockdown', '#349', 'NPC', (select prosrc !~* 'email' from pg_proc where oid = to_regprocedure('public.learn_is_staff()'))),
  ( 61, '47', 'NOW', '20260627120000_v3_ai_01_metered_billing.sql', 'v3_ai_01_metered_billing', '#352', 'NPC', to_regclass('public.customer_wallet_ai_holds') is not null),
  ( 62, '48', 'NOW', '20260627121000_learn_quiz_answer_key_lockdown.sql', 'learn_quiz_answer_key_lockdown', '#350', 'NPC', to_regclass('public.learn_quiz_questions_public') is not null),
  ( 63, '49', 'NOW', '20260627121500_learn_reviews_pii_lockdown.sql', 'learn_reviews_pii_lockdown', '#350', 'NPC', to_regclass('public.learn_reviews_public') is not null),
  ( 64, '50', 'NOW', '20260627122000_learn_lessons_content_gate.sql', 'learn_lessons_content_gate', '#350', 'NPC', to_regclass('public.learn_lessons_public') is not null),
  ( 65, '51', 'NOW', '20260627130000_v3_ai_verify_01_listing_verifications.sql', 'v3_ai_verify_01_listing_verifications', '—', 'NPC', coalesce((select bool_or(prosrc ~ 'not authorized for product') from pg_proc where proname='record_listing_verification'), false)),
  ( 66, '52', 'NOW', '20260627213858_sec_harden_08_money_table_grant_lockdown.sql', 'sec_harden_08_money_table_grant_lockdown', '#353', 'NPC', (case when to_regclass('public.payment_intents') is null then null else not has_table_privilege('anon', 'public.payment_intents', 'INSERT') end)),
  ( 67, '53', 'NOW', '20260701120000_v3_ai_verify_property_listing_verifications.sql', 'v3_ai_verify_property_listing_verifications', '—', 'NPC', to_regclass('public.property_listing_verifications') is not null),
  ( 68, '54', 'NOW', '20260701130000_v3_property_db_listings_data.sql', 'v3_property_db_listings_data', '—', 'NPC', exists(select 1 from information_schema.columns where table_schema='public' and table_name='property_listings' and column_name='data')),
  ( 69, '55', 'NOW', '20260704120000_intelligence_live_conversations.sql', 'intelligence_live_conversations', '—', 'NPC', to_regclass('public.intelligence_conversations') is not null),
  ( 70, '56', 'NOW', '20260705120000_marketplace_category_expansion.sql', 'marketplace_category_expansion', '—', 'NPC', (case when to_regclass('public.marketplace_categories') is null then false else (xpath('/row/c/text()', query_to_xml('select count(*) > 0 as c from public.marketplace_categories where slug = ''fashion-apparel''', false, true, '')))[1]::text::boolean end)),
  ( 71, '57', 'NOW', '20260705140000_ai_free_abuse_guard.sql', 'ai_free_abuse_guard', '—', 'NPC', to_regclass('public.ai_free_actor_state') is not null),
  ( 72, '58', 'NOW', '20260705150000_ai_free_spend_ledger.sql', 'ai_free_spend_ledger', '—', 'NPC', (to_regclass('public.ai_free_spend_ledger') is not null or to_regclass('public.internal_ai_spend_ledger') is not null)),
  ( 73, '59', 'NOW', '20260706120000_v3_money_mc_multicurrency_ledger.sql', 'v3_money_mc_multicurrency_ledger', '—', 'NPC', exists(select 1 from pg_constraint where conname='journal_entries_currency_iso')),
  ( 74, '60', 'NOW', '20260706130000_v3_money_payout_rail.sql', 'v3_money_payout_rail', '—', 'NPC', exists(select 1 from pg_proc where proname='reserve_withdrawal')),
  ( 75, '61', 'NOW', '20260709090000_email_provider_allow_ses.sql', 'email_provider_allow_ses', '—', 'NPC', exists(select 1 from pg_constraint where conname='customer_notifications_email_provider_known' and pg_get_constraintdef(oid) like '%ses%')),
  ( 76, '62', 'NOW', '20260709093000_brand_purge_company_settings.sql', 'brand_purge_company_settings', '—', 'NPC', exists(select 1 from pg_attrdef d join pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum where d.adrelid = to_regclass('public.company_settings') and a.attname = 'company_name' and pg_get_expr(d.adbin, d.adrelid) like '%Henry Onyx Fabric Care%')),
  ( 77, '63', 'NOW', '20260710140000_founder_intelligence.sql', 'founder_intelligence', '—', 'NPC', to_regclass('public.founder_intelligence_conversations') is not null),
  ( 78, '64', 'NOW', '20260710160000_founder_action_proposals.sql', 'founder_action_proposals', '—', 'NPC', to_regclass('public.founder_action_proposals') is not null),
  ( 79, '65', 'NOW', '20260710180000_hub_security_hardening.sql', 'hub_security_hardening', '—', 'NPC', coalesce((select prosecdef from pg_proc where oid = to_regprocedure('public.is_owner()')), false)),
  ( 80, '66', 'NOW', '20260714090000_email_provider_allow_postmark.sql', 'email_provider_allow_postmark', '#500', 'NPC', exists(select 1 from pg_constraint where conname='customer_notifications_email_provider_known' and pg_get_constraintdef(oid) like '%postmark%')),
  ( 81, '67', 'NOW', '20260714093000_harden_account_set_updated_at_search_path.sql', 'harden_account_set_updated_at_search_path', '#500', 'NPC', exists(select 1 from pg_proc where proname='account_set_updated_at' and proconfig::text like '%search_path%')),
  ( 82, '68', 'NOW', '20260718120000_studio_brief_flow_persistence.sql', 'studio_brief_flow_persistence', '#511', 'CA', to_regclass('public.studio_brief_flow_drafts') is not null),
  ( 83, '69', 'NOW', '20260718120000_v3_34_personalization_home.sql', 'v3_34_personalization_home', '#514', 'CU', to_regclass('public.user_home_layouts') is not null),
  ( 84, '70', 'NOW', '20260719120000_studio_build_jobs.sql', 'studio_build_jobs', '#512', 'CA', to_regclass('public.studio_build_jobs') is not null),
  ( 85, '71', 'NOW', '20260720120000_studio_agency_orchestration.sql', 'studio_agency_orchestration', '#523', 'CA', to_regclass('public.studio_agency_decisions') is not null),
  ( 86, '72', 'NOW', '20260723130000_founder_operator_spine.sql', 'founder_operator_spine', '#524', 'NPC', exists(select 1 from information_schema.columns where table_schema='public' and table_name='founder_action_proposals' and column_name='origin') and exists(select 1 from pg_constraint where conname='customer_notifications_category_check' and pg_get_constraintdef(oid) like '%owner.operator.escalation%')),
  ( 87, '73', 'NOW', '20260724120000_v3_35_deals.sql', 'v3_35_deals', '#528', 'NPC', to_regclass('public.deals') is not null),
  ( 88, '74', 'NOW', '20260724120000_v3_38_service_area_coverage.sql', 'v3_38_service_area_coverage', '#529', 'NPC', to_regclass('public.service_area_coverage') is not null),
  ( 89, '75', 'NOW', '20260724120000_v3_39_next_action_prompts.sql', 'v3_39_next_action_prompts', '#530', 'NPC', to_regclass('public.next_action_dismissals') is not null),
  ( 90, '76', 'NOW', '20260724120000_v3_43_workflow_rail.sql', 'v3_43_workflow_rail', '#527', 'NPC', to_regclass('public.workflow_jobs') is not null and to_regclass('public.internal_ai_spend_ledger') is not null),
  ( 91, '77', 'NOW', '20260725120000_v3_40_risk_scores_and_models.sql', 'v3_40_risk_scores_and_models', '#533', 'NPC', to_regclass('public.risk_scores') is not null),
  ( 92, '78', 'NOW', '20260902120000_v3_41_predictive_quality_workload.sql', 'v3_41_predictive_quality_workload', '#534', 'NPC', to_regclass('public.workload_forecasts') is not null),
  ( 93, '79', 'NOW', '20260922120000_v3_42_staff_recommendation_state.sql', 'v3_42_staff_recommendation_state', '#537', 'NPC', to_regclass('public.staff_recommendation_state') is not null)
),
hist as (
  select version, name,
         lower(regexp_replace(regexp_replace(regexp_replace(coalesce(name, ''),
               '\.sql$', ''), '^[0-9]{8,14}_', ''), '_[0-9]{8,14}$', '')) as stem
  from supabase_migrations.schema_migrations
)
select c.ord, c.seq, c.tier, c.file, c.pr, c.pre_status,
       string_agg(h.version || ' ' || h.name, ' | ' order by h.version) as history_rows,
       c.objects_present,
       case
         when count(h.version) > 0 and c.objects_present is true  then 'CONFIRMED-APPLIED'
         when count(h.version) > 0 and c.objects_present is null  then 'CONFIRMED-APPLIED (history row; no object probe)'
         when count(h.version) = 0 and c.objects_present is false then 'CONFIRMED-UNAPPLIED'
         when count(h.version) = 0 and c.objects_present is true  then 'APPLIED OUT-OF-BAND (objects present, no history row) — treat as applied; do NOT re-run'
         when count(h.version) = 0 and c.objects_present is null  then 'UNAPPLIED? (no history row, no probe) — inspect the file''s effect by hand'
         else 'INVESTIGATE — history row present but objects absent/stale (wrong content or later drop)'
       end as verdict
from cand c
left join hist h on h.stem = c.stem
group by c.ord, c.seq, c.tier, c.file, c.pr, c.pre_status, c.objects_present
order by c.ord;
```

### 6.3 · Guards & preflight (read-only; run right after §6.2)

```sql
-- G1: pre-retarget SA-4 divergence (expect both false)
select to_regclass('public.ai_operator_tick_lock') is not null  as sa4_original_lock_present,
       to_regclass('public.ai_operator_spend_ledger') is not null as sa4_original_ledger_present;
-- G2: current category CHECK — which re-state is live? (drives the E5 rule in §5 #4)
select pg_get_constraintdef(oid) like '%account.recovery.reminder%'  as has_v337,
       pg_get_constraintdef(oid) like '%owner.operator.escalation%' as has_sa4
from pg_constraint where conname = 'customer_notifications_category_check';
-- G3: rows SA-4's validated CHECK must accept (expect zero rows)
select category, count(*) from public.customer_notifications
where category <> all (array['general','care','marketplace','studio','wallet','security','support','account','promotion',
  'auth.signup.welcome','auth.password.changed','auth.security.new_device','system.welcome','logistics.shipment.update',
  'marketplace.order.update','property.viewing.update','learn.enrollment.update','studio.project.update','care.booking.update',
  'support.reply.received','support.thread.created','wallet.transaction.update','kyc.review.update','system.notification.relay',
  'account.recovery.reminder','marketplace.seller.review','marketplace.product.review','owner.operator.escalation'])
group by 1;
-- G4: email_provider CHECK — which re-state is live? (drives §5 #5)
select pg_get_constraintdef(oid) as email_provider_check
from pg_constraint where conname = 'customer_notifications_email_provider_known';
-- G5: V3-37 reference-data prerequisite (E13) — expect true
select exists(select 1 from public.data_governance_domains where domain_key = 'identity_account') as v337_domain_present;
-- G6: V3-43 fold baselines (save the output; §5 #1 compares against it)
select (select count(*) from public.ai_free_spend_ledger)                  as free_rows,
       (select coalesce(sum(spent_kobo),0) from public.ai_free_spend_ledger) as free_kobo,
       public.ai_free_spend_today()                                         as free_today;
select * from public.studio_agency_tick_lock;
-- G7: F3 present before SA-4 (E4) — expect true
select to_regclass('public.founder_action_proposals') is not null as f3_present;
```

(If G6 errors because `ai_free_spend_ledger` doesn't exist, V3-43 has already folded it. Cross-check §6.2 row #76.)

### 6.4 · Post-apply invariants (read-only)

```sql
select
  to_regclass('public.workflow_jobs')            is not null as rail_jobs,          -- t
  to_regclass('public.workflow_locks')           is not null as rail_locks,         -- t
  to_regclass('public.internal_ai_spend_ledger') is not null as rail_spend,         -- t
  to_regclass('public.studio_agency_tick_lock')  is null     as sa3_lock_folded,    -- t (dropped)
  to_regclass('public.ai_free_spend_ledger')     is null     as free_ledger_folded, -- t (dropped)
  to_regclass('public.ai_operator_tick_lock')    is null     as no_second_lock,     -- t
  to_regclass('public.ai_operator_spend_ledger') is null     as no_second_ledger,   -- t
  (select count(*) from information_schema.columns where table_schema='public'
     and table_name='founder_action_proposals' and column_name='origin') = 1 as sa4_origin,  -- t
  (select pg_get_constraintdef(oid) like '%owner.operator.escalation%' and pg_get_constraintdef(oid) like '%account.recovery.reminder%'
     from pg_constraint where conname='customer_notifications_category_check') as category_superset,     -- t
  to_regclass('public.user_home_layouts')        is not null as v334,               -- t
  to_regclass('public.deals')                    is not null as v335,
  to_regclass('public.service_area_coverage')    is not null as v338,
  to_regclass('public.next_action_dismissals')   is not null as v339,
  to_regclass('public.risk_scores')              is not null as v340,
  to_regclass('public.workload_forecasts')       is not null as v341,
  to_regclass('public.staff_recommendation_state') is not null as v342,
  (select string_agg(lock_key, ',' order by lock_key) from public.workflow_locks) as lock_keys; -- hub.operator.tick,hub.predictive.tick,hub.risk.score,studio.agency.tick
```

Then run the Supabase security advisors. Expect only the by-design zero-policy INFO lines on the deny-RLS tables, plus the `learn_is_staff` search_path note from §5.

---

## 7 · Operational rules for the apply session

1. **One file per `apply_migration` call, `name` = the file stem** (e.g. `v3_43_workflow_rail`), so the §6.2 normalizer matches it next time.
2. **Never re-run** a row §6.2 reports as applied, even if the file "looks idempotent". F2 and F3 aren't.
3. **Flags stay dark.** Applying any NOW row is schema-only. Every new table is deny-RLS or service-role-write, and every writer no-ops on a missing flag. Activation (`WORKFLOW_RAIL_LIVE`, `FOUNDER_ACTIONS_TRANCHE≥3`, `STUDIO_AGENCY_LIVE`, `predictive_*`, personalization flags) is a separate owner step.
4. **Code on `main` already expects some of these objects.** For example, the studio agency tick and hub operator tick read `workflow_locks` / `internal_ai_spend_ledger` (V3-43 rewiring). They're flag-dark, so nothing breaks today, but don't flip those flags before V3-43 is CONFIRMED-APPLIED.
5. **Backfill `schema_migrations` bookkeeping is optional.** Out-of-band rows (hand-applied SEC-HARDEN-02/03/04, captures) are legitimate, and §6.2 reports them as APPLIED OUT-OF-BAND.

---

## 8 · How the order was verified (local only — prod was never contacted)

- **Engine:** a throwaway PostgreSQL 17.10 cluster in the job's scratch dir (port 55497), built with the repo's own `scripts/db/build-shadow-db.mjs` steps `reset → bootstrap → apply-prod → apply-fl2`. That's the SCHEMA-TRUTH-01 shadow: `supabase/prod-actual/schema.sql` (captured 2026-06-11/13) plus the 8-file FL2 manifest.
- **Catch-up:** the snapshot pre-dates later prod applies, so all 107 baseline files and the 13 `prod-actual/captured-migrations` were replayed in timestamp order (two tolerant passes). The only files still failing are re-creations of objects the snapshot already holds (`policy … already exists`) and two early-era, non-candidate files. Local shadow fixes: two missing `storage.buckets` columns (`file_size_limit`, `allowed_mime_types`) were added to the bootstrap stub.
- **Pass 1:** all 93 candidates applied in §3 order, each in its own transaction → **79 OK / 14 failed**. The failures:
  - the 12 BLOCKED files (§4);
  - `super_app_core` (DNA);
  - V3-37 `abandoned_tasks`: a schema-only-snapshot artifact that applies once its reference row exists (T1b).

  `workspace_staff_platform` (DNA) applied cleanly; it's DNA for product reasons, not SQL ones.
- **Pass 2:** the whole sequence re-applied → 77 OK. The two new failures, F2 and F3, are the non-idempotent files (§5).
- **Targeted tests:**
  - T1b — V3-37 with its reference row;
  - T2 / T2b — V3-37-category after SA-4, with a violating row (aborts) and without one (silent narrowing);
  - T3 — V3-43 before SA-4, with fold data;
  - T4 — V3-43 re-apply;
  - T5 — the pre-retarget SA-4 followed by V3-43 (divergence reproduced);
  - T6 — F2 → F3 → SA-4 (origin present);
  - rooms on PGlite.
- **Day-of query:** executed on the fully-applied and the empty shadow, against a stub `supabase_migrations.schema_migrations` holding names in every plausible prod format (bare stem, `<ts>_stem`, `stem_<ts>`). The verdicts were correct in both, and all 93 probes are calibrated.
- **Limits, stated plainly:** the shadow is a June snapshot plus replay, **not** prod. It has no row data (hence E13 and the §5 data checks). It can't see anything done to prod after 06-13 outside of git. That's exactly why §6.2 exists.
- The harness scripts and raw JSON results are kept with the pass report (`.codex-temp/v3-activation-runbook-01/`, untracked).

---

## Appendix A · Every migration file on `main` (200) — nothing silently dropped

Baseline classifications come from RECONCILE-01 (`docs/v3/RECONCILE-01-2026-06-21.md`, commit `9851ecdb`): 73 matched by name + 32 APPLIED_EQUIVALENT = the 105 files classified applied, plus the 2 re-landed SEC-HARDEN-04 files (verified live) = **107 baseline**. The 161 files RECONCILE-01 classified = exactly the migration set at `9851ecdb^` (checked with `git ls-tree`).

| # | File (app) | Classification | Evidence |
|---|---|---|---|
| 1 | `20260402180000_marketplace_init.sql` (marketplace) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 2 | `20260402180500_marketplace_policies.sql` (marketplace) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 3 | `20260402183000_property_init.sql` (property) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 4 | `20260402183500_property_policies.sql` (property) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 5 | `20260402190000_studio_init.sql` (studio) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 6 | `20260402190500_studio_policies.sql` (studio) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 7 | `20260402223000_marketplace_events_and_application_state.sql` (marketplace) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 8 | `20260402223000_studio_extensions.sql` (studio) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 9 | `20260402233000_learn_init.sql` (learn) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 10 | `20260402233500_learn_policies.sql` (learn) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 11 | `20260402235500_workspace_staff_platform.sql` (hub) | CANDIDATE #— (DNA) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 12 | `20260403120000_learn_teacher_applications.sql` (learn) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 13 | `20260403183000_account_integration_hardening.sql` (hub) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 14 | `20260405120000_hq_internal_communications.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 15 | `20260405120000_studio_brief_domain_intent.sql` (studio) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 16 | `20260405120000_super_app_core.sql` (super-app) | CANDIDATE #— (DNA) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 17 | `20260405123000_hq_internal_comm_members.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 18 | `20260405150000_logistics_customer_surface.sql` (hub) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 19 | `20260406140000_wallet_withdrawals.sql` (hub) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 20 | `20260407150000_hq_internal_comm_thread_touch.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 21 | `20260407160000_staff_navigation_audit_prep.sql` (hub) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 22 | `20260407190000_account_webhook_receipts.sql` (hub) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 23 | `20260407193000_idempotency_and_nonce_scope.sql` (hub) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 24 | `20260408120000_hq_internal_comms_attachments_visibility_rls.sql` (hub) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 25 | `20260410120000_referral_fraud_hardening.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 26 | `20260410130000_kyc_verification_infra.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 27 | `20260416120000_trust_scoring_infra.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 28 | `20260417160000_marketplace_pricing_breakdowns.sql` (marketplace) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 29 | `20260417170000_shared_pricing_governance.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 30 | `20260419120000_multi_currency_schema_foundation.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 31 | `20260419150000_notification_delivery_log.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 32 | `20260420160000_notification_signal_preferences.sql` (hub) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 33 | `20260420193000_profiles_role_customer_constraint.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 34 | `20260421191500_handle_new_customer_search_path.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 35 | `20260423143000_data_governance_foundation.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 36 | `20260424140000_customer_lifecycle_snapshot.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 37 | `20260424160000_newsletter_foundation.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 38 | `20260501000000_learn_unlock_policy.sql` (learn) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 39 | `20260501010000_marketplace_deals_curation.sql` (marketplace) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 40 | `20260501020000_marketplace_seller_tiers.sql` (marketplace) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 41 | `20260501120000_notification_signal_foundation_extensions.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 42 | `20260501130000_notification_realtime_publication.sql` (hub) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 43 | `20260502120000_staff_notifications_audience.sql` (hub) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 44 | `20260502160000_user_addresses_canonical.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 45 | `20260502170000_v2_cart_01_saved_items_engagement.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 46 | `20260502180000_search_index_outbox_v2_search_01.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 47 | `20260503120000_studio_client_portal.sql` (studio) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 48 | `20260503120500_studio_client_portal_seed.sql` (studio) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 49 | `20260503130000_studio_brief_drafts.sql` (studio) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 50 | `20260503140000_studio_messaging.sql` (studio) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 51 | `20260504100000_studio_brief_drafts_guards.sql` (studio) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 52 | `20260504130000_jobs_employer_subscriptions.sql` (jobs) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 53 | `20260504135000_property_lock_owner_status_visibility.sql` (property) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 54 | `20260505090000_marketplace_checkout_payment_completion.sql` (marketplace) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 55 | `20260505110000_studio_live_schema_guards.sql` (studio) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 56 | `20260505111000_studio_project_updates_live_drift.sql` (studio) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 57 | `20260505112000_studio_legacy_table_compatibility.sql` (studio) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 58 | `20260507120000_get_signal_feed.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 59 | `20260508120000_is_staff_in_any.sql` (hub) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 60 | `20260509120000_v2_closure_d8_rls_hot_patch.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 61 | `20260510010000_i18n_translation_cache.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 62 | `20260513200000_support_thread_state_pass24_phase5.sql` (hub) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 63 | `20260514100000_security_invoker_views.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 64 | `20260514110000_function_search_path_lockdown.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 65 | `20260514120000_logistics_quotes.sql` (logistics) | CANDIDATE #1 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 66 | `20260514120000_marketplace_inventory_movements.sql` (marketplace) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 67 | `20260514120000_unindexed_foreign_keys.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 68 | `20260514120500_logistics_shipment_legs.sql` (logistics) | CANDIDATE #2 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 69 | `20260514120500_marketplace_refunds.sql` (marketplace) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 70 | `20260514121000_logistics_pod.sql` (logistics) | CANDIDATE #3 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 71 | `20260514121000_marketplace_review_photos.sql` (marketplace) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 72 | `20260514121500_logistics_claims.sql` (logistics) | CANDIDATE #4 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 73 | `20260514121500_marketplace_recommendation_signals.sql` (marketplace) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 74 | `20260514122000_logistics_fleet.sql` (logistics) | CANDIDATE #5 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 75 | `20260514122000_marketplace_product_variants_matrix.sql` (marketplace) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 76 | `20260514122500_logistics_b2b_accounts.sql` (logistics) | CANDIDATE #6 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 77 | `20260514123000_logistics_realtime_publication.sql` (logistics) | CANDIDATE #7 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 78 | `20260514130000_drop_duplicate_indexes.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 79 | `20260514130000_studio_proposal_signatures.sql` (studio) | CANDIDATE #8 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 80 | `20260514130500_studio_revisions_versioning.sql` (studio) | CANDIDATE #9 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 81 | `20260514131000_studio_milestone_extensions.sql` (studio) | CANDIDATE #10 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 82 | `20260514131500_studio_payment_plans.sql` (studio) | CANDIDATE #11 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 83 | `20260514132000_studio_resource_allocations.sql` (studio) | CANDIDATE #12 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 84 | `20260514132500_studio_asset_packs.sql` (studio) | CANDIDATE #13 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 85 | `20260514133000_studio_realtime_publication.sql` (studio) | CANDIDATE #14 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 86 | `20260514140000_auth_rls_initplan_wrap.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 87 | `20260515000000_learn_v3_pass21_player.sql` (learn) | CANDIDATE #15 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 88 | `20260515001000_learn_v3_pass21_policies.sql` (learn) | CANDIDATE #16 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 89 | `20260515002000_learn_v3_pass21_realtime.sql` (learn) | CANDIDATE #17 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 90 | `20260515060000_auth_rls_initplan_storage_policies.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 91 | `20260515100000_rooms_sessions.sql` (hub) | CANDIDATE #— (BLOCKED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 92 | `20260515100100_rooms_participants.sql` (hub) | CANDIDATE #— (BLOCKED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 93 | `20260515100200_rooms_recordings_consent.sql` (hub) | CANDIDATE #— (BLOCKED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 94 | `20260515100300_rooms_recordings.sql` (hub) | CANDIDATE #— (BLOCKED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 95 | `20260515100400_rooms_scorecards.sql` (hub) | CANDIDATE #— (BLOCKED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 96 | `20260515100500_rooms_messages.sql` (hub) | CANDIDATE #— (BLOCKED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 97 | `20260515100600_rooms_realtime_publication.sql` (hub) | CANDIDATE #— (BLOCKED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 98 | `20260515120000_care_garment_types.sql` (care) | CANDIDATE #18 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 99 | `20260515120000_jobs_taxonomy.sql` (jobs) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 100 | `20260515120000_property_amenities_catalog.sql` (property) | CANDIDATE #19 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 101 | `20260515120500_care_user_preferences.sql` (care) | CANDIDATE #20 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 102 | `20260515120500_jobs_skill_verifications.sql` (jobs) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 103 | `20260515120500_property_floorplans.sql` (property) | CANDIDATE #21 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 104 | `20260515121000_care_recurring_schedules.sql` (care) | CANDIDATE #22 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 105 | `20260515121000_jobs_interview_rooms.sql` (jobs) | CANDIDATE #— (BLOCKED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 106 | `20260515121000_property_virtual_tours.sql` (property) | CANDIDATE #23 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 107 | `20260515121500_care_claims.sql` (care) | CANDIDATE #— (BLOCKED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 108 | `20260515121500_jobs_offer_letters.sql` (jobs) | CANDIDATE #— (BLOCKED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 109 | `20260515121500_property_neighborhood_signals.sql` (property) | CANDIDATE #24 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 110 | `20260515122000_care_pod_records.sql` (care) | CANDIDATE #— (BLOCKED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 111 | `20260515122000_jobs_salary_benchmarks.sql` (jobs) | CANDIDATE #25 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 112 | `20260515122000_property_saved_searches.sql` (property) | CANDIDATE #26 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 113 | `20260515122500_care_booking_garments.sql` (care) | CANDIDATE #— (BLOCKED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 114 | `20260515122500_jobs_pipeline_extras.sql` (jobs) | CANDIDATE #27 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 115 | `20260515122500_property_inspection_rules.sql` (property) | CANDIDATE #28 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 116 | `20260515123000_care_realtime_publication.sql` (care) | CANDIDATE #29 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 117 | `20260515123000_jobs_realtime_publication.sql` (jobs) | CANDIDATE #30 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 118 | `20260515123000_property_rent_payments.sql` (property) | CANDIDATE #31 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 119 | `20260515123500_property_maintenance_tickets.sql` (property) | CANDIDATE #32 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 120 | `20260515124000_property_viewings_extensions.sql` (property) | CANDIDATE #33 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 121 | `20260515124500_property_realtime_publication.sql` (property) | CANDIDATE #34 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 122 | `20260522103000_v3_01_henry_events.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 123 | `20260522154818_message_read_state.sql` (hub) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 124 | `20260522235119_v3_01_henry_events_anon_insert_policy.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 125 | `20260523103000_diag_account_01_customer_preferences_missing_columns.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 126 | `20260523190000_realtime_publication_backfill.sql` (hub) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 127 | `20260529120000_payment_intents.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 128 | `20260602120000_v3_division_name_brand_fix.sql` (hub) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 129 | `20260605120000_customer_notifications_metadata_column.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 130 | `20260605123000_payments_private_isolation.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 131 | `20260605160000_push_subscriptions_known_devices.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 132 | `20260605210000_service_role_statement_timeout_cap.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 133 | `20260606120500_customer_notifications_category_constraint_reconcile.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 134 | `20260606121500_customer_notifications_priority_constraint_reconcile.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 135 | `20260607120000_double_entry_ledger.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 136 | `20260607130000_v3_18_payment_documents.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 137 | `20260607140000_v3_vat_01_settlement_vat.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 138 | `20260610120000_v3_37_abandoned_tasks.sql` (hub) | CANDIDATE #35 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 139 | `20260610121000_v3_37_recovery_notification_category.sql` (hub) | CANDIDATE #36 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 140 | `20260611120000_fl2_wallet_rail_completion.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 141 | `20260611130000_v3_19_refunds.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 142 | `20260612120000_sec_harden_01_audit_grants_and_bucket.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 143 | `20260612140000_sec_harden_02_role_membership_lockdown.sql` (hub) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 144 | `20260613133434_stab01_handle_new_customer_idempotent.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 145 | `20260614120000_care_services_catalog_expansion.sql` (care) | CANDIDATE #37 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 146 | `20260614120000_sec_harden_03_world_writable_lockdown.sql` (hub) | BASELINE — applied-equivalent | RECONCILE-01 §#4 APPLIED_EQUIVALENT (`9851ecdb`) |
| 147 | `20260614120500_care_services_catalog_seed.sql` (care) | CANDIDATE #38 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 148 | `20260614160000_sec_harden_04_profiles_anon_and_learn_trigger.sql` (hub) | BASELINE — applied (hand-applied, no history row) | RECONCILE-01 §#1 “ALREADY LIVE on prod (verified read-only)” |
| 149 | `20260614161000_sec_harden_04_studio_payments_money_safe_lockdown.sql` (hub) | BASELINE — applied (hand-applied, no history row) | RECONCILE-01 §#1 “ALREADY LIVE on prod (verified read-only)” |
| 150 | `20260615103000_owner_inbox_foundation.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 151 | `20260615120000_sec_harden_05_care_payment_guard.sql` (care) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 152 | `20260616120000_v3_25_moderation.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 153 | `20260618120000_v3_57_business_profiles.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 154 | `20260619120000_v3_58_seller_tiers.sql` (marketplace) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 155 | `20260620090000_kyc_vault_envelope_encryption.sql` (hub) | CANDIDATE #39 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 156 | `20260620120000_marketplace_delivery_promises.sql` (marketplace) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 157 | `20260620120000_studio_deliverable_revisions.sql` (studio) | CANDIDATE #40 (NOW) — **CONFIRMED-APPLIED** | catalogued above |
| 158 | `20260620120000_v3_56_learn_to_earn_jobs.sql` (jobs) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 159 | `20260620120500_v3_56_learn_candidate_optins.sql` (learn) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 160 | `20260620130000_v3_70_hiring_business_scope.sql` (jobs) | CANDIDATE #41 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 161 | `20260620131000_v3_70_hiring_collaboration.sql` (jobs) | CANDIDATE #42 (GATED) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 162 | `20260621120000_sec_harden_06_secdef_idor_lockdown.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 163 | `20260621120001_v3_gaming_01_free_play.sql` (hub) | BASELINE — applied (history row matched by name) | RECONCILE-01 matched set (73) (`9851ecdb`) |
| 164 | `20260623090000_notification_rls_withcheck_and_signal_feed_guard.sql` (hub) | CANDIDATE #43 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 165 | `20260626120000_marketplace_conversations.sql` (marketplace) | CANDIDATE #44 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 166 | `20260626130000_jobs_messaging_realtime.sql` (jobs) | CANDIDATE #45 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 167 | `20260627120000_sec_harden_07_is_staff_email_lockdown.sql` (hub) | CANDIDATE #46 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 168 | `20260627120000_v3_ai_01_metered_billing.sql` (hub) | CANDIDATE #47 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 169 | `20260627121000_learn_quiz_answer_key_lockdown.sql` (learn) | CANDIDATE #48 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 170 | `20260627121500_learn_reviews_pii_lockdown.sql` (learn) | CANDIDATE #49 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 171 | `20260627122000_learn_lessons_content_gate.sql` (learn) | CANDIDATE #50 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 172 | `20260627130000_v3_ai_verify_01_listing_verifications.sql` (marketplace) | CANDIDATE #51 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 173 | `20260627213858_sec_harden_08_money_table_grant_lockdown.sql` (hub) | CANDIDATE #52 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 174 | `20260701120000_v3_ai_verify_property_listing_verifications.sql` (property) | CANDIDATE #53 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 175 | `20260701130000_v3_property_db_listings_data.sql` (property) | CANDIDATE #54 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 176 | `20260704120000_intelligence_live_conversations.sql` (hub) | CANDIDATE #55 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 177 | `20260705120000_marketplace_category_expansion.sql` (marketplace) | CANDIDATE #56 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 178 | `20260705140000_ai_free_abuse_guard.sql` (hub) | CANDIDATE #57 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 179 | `20260705150000_ai_free_spend_ledger.sql` (hub) | CANDIDATE #58 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 180 | `20260706120000_v3_money_mc_multicurrency_ledger.sql` (hub) | CANDIDATE #59 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 181 | `20260706130000_v3_money_payout_rail.sql` (hub) | CANDIDATE #60 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 182 | `20260709090000_email_provider_allow_ses.sql` (hub) | CANDIDATE #61 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 183 | `20260709093000_brand_purge_company_settings.sql` (hub) | CANDIDATE #62 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 184 | `20260710140000_founder_intelligence.sql` (hub) | CANDIDATE #63 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 185 | `20260710160000_founder_action_proposals.sql` (hub) | CANDIDATE #64 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 186 | `20260710180000_hub_security_hardening.sql` (hub) | CANDIDATE #65 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 187 | `20260714090000_email_provider_allow_postmark.sql` (hub) | CANDIDATE #66 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 188 | `20260714093000_harden_account_set_updated_at_search_path.sql` (hub) | CANDIDATE #67 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 189 | `20260718120000_studio_brief_flow_persistence.sql` (studio) | CANDIDATE #68 (NOW) — **CONFIRMED-APPLIED** | catalogued above |
| 190 | `20260718120000_v3_34_personalization_home.sql` (hub) | CANDIDATE #69 (NOW) — **CONFIRMED-UNAPPLIED** | catalogued above |
| 191 | `20260719120000_studio_build_jobs.sql` (studio) | CANDIDATE #70 (NOW) — **CONFIRMED-APPLIED** | catalogued above |
| 192 | `20260720120000_studio_agency_orchestration.sql` (studio) | CANDIDATE #71 (NOW) — **CONFIRMED-APPLIED** | catalogued above |
| 193 | `20260723130000_founder_operator_spine.sql` (hub) | CANDIDATE #72 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 194 | `20260724120000_v3_35_deals.sql` (hub) | CANDIDATE #73 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 195 | `20260724120000_v3_38_service_area_coverage.sql` (hub) | CANDIDATE #74 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 196 | `20260724120000_v3_39_next_action_prompts.sql` (hub) | CANDIDATE #75 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 197 | `20260724120000_v3_43_workflow_rail.sql` (hub) | CANDIDATE #76 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 198 | `20260725120000_v3_40_risk_scores_and_models.sql` (hub) | CANDIDATE #77 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 199 | `20260902120000_v3_41_predictive_quality_workload.sql` (hub) | CANDIDATE #78 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |
| 200 | `20260922120000_v3_42_staff_recommendation_state.sql` (hub) | CANDIDATE #79 (NOW) — NEEDS-PROD-CONFIRMATION | catalogued above |

### A.1 · Scope check — agency / workflow / personalization / role-membership / founder-operator files

The 20 files on `main` whose name or path touches these areas, each accounted for:

| File | Where accounted for |
|---|---|
| `apps/hub/supabase/migrations/20260610120000_v3_37_abandoned_tasks.sql` | §3 #35 · NOW · NEEDS-PROD-CONFIRMATION |
| `apps/hub/supabase/migrations/20260610121000_v3_37_recovery_notification_category.sql` | §3 #36 · NOW · NEEDS-PROD-CONFIRMATION |
| `apps/hub/supabase/migrations/20260612140000_sec_harden_02_role_membership_lockdown.sql` | Appendix A · BASELINE applied-equivalent (RECONCILE-01) |
| `apps/hub/supabase/migrations/20260710140000_founder_intelligence.sql` | §3 #63 · NOW · NEEDS-PROD-CONFIRMATION |
| `apps/hub/supabase/migrations/20260710160000_founder_action_proposals.sql` | §3 #64 · NOW · NEEDS-PROD-CONFIRMATION |
| `apps/hub/supabase/migrations/20260718120000_v3_34_personalization_home.sql` | §3 #69 · NOW · CONFIRMED-UNAPPLIED |
| `apps/hub/supabase/migrations/20260723130000_founder_operator_spine.sql` | §3 #72 · NOW · NEEDS-PROD-CONFIRMATION |
| `apps/hub/supabase/migrations/20260724120000_v3_35_deals.sql` | §3 #73 · NOW · NEEDS-PROD-CONFIRMATION |
| `apps/hub/supabase/migrations/20260724120000_v3_38_service_area_coverage.sql` | §3 #74 · NOW · NEEDS-PROD-CONFIRMATION |
| `apps/hub/supabase/migrations/20260724120000_v3_39_next_action_prompts.sql` | §3 #75 · NOW · NEEDS-PROD-CONFIRMATION |
| `apps/hub/supabase/migrations/20260724120000_v3_43_workflow_rail.sql` | §3 #76 · NOW · NEEDS-PROD-CONFIRMATION |
| `apps/hub/supabase/migrations/20260725120000_v3_40_risk_scores_and_models.sql` | §3 #77 · NOW · NEEDS-PROD-CONFIRMATION |
| `apps/hub/supabase/migrations/20260902120000_v3_41_predictive_quality_workload.sql` | §3 #78 · NOW · NEEDS-PROD-CONFIRMATION |
| `apps/hub/supabase/migrations/20260922120000_v3_42_staff_recommendation_state.sql` | §3 #79 · NOW · NEEDS-PROD-CONFIRMATION |
| `apps/marketplace/supabase/migrations/20260501010000_marketplace_deals_curation.sql` | Appendix A · BASELINE applied (RECONCILE-01 matched) |
| `apps/marketplace/supabase/migrations/20260514121500_marketplace_recommendation_signals.sql` | Appendix A · BASELINE applied (RECONCILE-01 matched) |
| `apps/studio/supabase/migrations/20260620120000_studio_deliverable_revisions.sql` | §3 #40 · NOW · CONFIRMED-APPLIED |
| `apps/studio/supabase/migrations/20260718120000_studio_brief_flow_persistence.sql` | §3 #68 · NOW · CONFIRMED-APPLIED |
| `apps/studio/supabase/migrations/20260719120000_studio_build_jobs.sql` | §3 #70 · NOW · CONFIRMED-APPLIED |
| `apps/studio/supabase/migrations/20260720120000_studio_agency_orchestration.sql` | §3 #71 · NOW · CONFIRMED-APPLIED |
