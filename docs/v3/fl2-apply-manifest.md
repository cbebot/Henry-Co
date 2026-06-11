# FL2 apply manifest — the authoritative migration ledger

**Produced by:** SCHEMA-TRUTH-01 (2026-06-11) · **Method:** read-only introspection of
production (`supabase/prod-actual/schema.sql`, captured by
`scripts/db/introspect-prod-schema.mjs` — zero prod DDL) + object-evidence
classification of every committed migration file + a full dress rehearsal on the
prod-actual shadow (`scripts/db/build-shadow-db.mjs`).

**Why this document exists:** prod's migration history (75 rows in
`supabase_migrations.schema_migrations`) does **not** map 1:1 to the 137
committed migration files. Early files were applied under consolidated dashboard
runs with different names/versions; several were applied **out-of-band with no
history row at all**; four were applied **partially**; and a large 2026-05-14/15
feature wave was never applied. Filename ↔ history matching is therefore
unreliable — every verdict below is grounded in **object evidence** (does prod
actually hold the tables/columns/functions/policies the file creates?), checked
against the introspected snapshot.

**Counts:** backlog = 48 · not-applied = 1 · partially-applied = 5 · applied = 74 · superseded = 1 · partially-superseded = 1 · FL2 = 6 · applied (data-only) = 2 (of 138 files incl. the new completion file).

---

## 1. THE FL2 APPLY LIST (execute in this exact order)

FL2 applies these six migrations to production, in order, as `postgres`
(dashboard SQL editor or `supabase migration up`), recording a history row per
file. Each row notes the CI invariant suite that must pass at that position —
**suite position is part of the contract** (the payments grant invariant asserts
on the public RPCs *before* the isolation migration relocates them).

| # | migration | invariant suite at this position |
|---|---|---|
| 1 | `apps/hub/supabase/migrations/20260529120000_payment_intents.sql` | `apps/hub/supabase/tests/payments_grant_invariant.sql` |
| 2 | `apps/hub/supabase/migrations/20260605123000_payments_private_isolation.sql` | — |
| 3 | `apps/hub/supabase/migrations/20260607120000_double_entry_ledger.sql` | `apps/hub/supabase/tests/ledger_invariants.sql + ledger_grant_invariant.sql` |
| 4 | `apps/hub/supabase/migrations/20260607130000_v3_18_payment_documents.sql` | `apps/hub/supabase/tests/payment_documents_invariants.sql` |
| 5 | `apps/hub/supabase/migrations/20260607140000_v3_vat_01_settlement_vat.sql` | `apps/hub/supabase/tests/vat_invariants.sql + vat_grant_invariant.sql` |
| 6 | `apps/hub/supabase/migrations/20260611120000_fl2_wallet_rail_completion.sql` | — |

**Rehearsal proof:** the full set applies cleanly on the prod-actual shadow,
**twice** (idempotency, second pass with money fixture data present), with all
six suites green at their CI positions. Re-run anytime:

```
node scripts/db/build-shadow-db.mjs all --prod-types <prod types> --prod-columns <csv> --prod-acl <csv>
```

**After FL2 lands:** regenerate `packages/data/src/database.types.ts` from prod
(`pnpm dlx supabase gen types typescript --project-id rzkbgwuznmdxnnhmjazy --schema public`)
— it must byte-match the committed composite (modulo the `__InternalSupabase`
header block). A mismatch means prod drifted again.

### Findings folded into the list

- **V3-18 was narrowed** (this pass): prod carries a LIVE legacy
  `customer_invoices` (kobo-shaped, rows written daily). The original draft's
  minor-shaped table under the same name silently no-op'd its CREATE and then
  failed its constraint blocks (`column "source_kind" named in key does not
  exist` — caught by the shadow rehearsal). The migration now ships the
  **receipts system only**; its invoice writer had zero application callers.
  Ledger-tied invoice issuance returns as its own pass with a legacy-table
  reconciliation design.
- **The wallet-rail completion file is new** (this pass): the merged Job B
  surfaces (/api/wallet/fund, topup/init, funding-proof, withdrawal/request,
  payout-methods, account idempotency + webhook receipts) read five tables that
  the partially-applied April files never landed on prod. Without them FL2
  lights the card rail while its sibling tables are missing. The file is a
  verbatim, idempotent extraction of exactly the missing objects.

---

## 2. Applied on production (76 files)

Verified by object evidence against the introspected snapshot (and/or a history
row). These files are **history — never edit, never re-apply**.

| migration | status | evidence |
|---|---|---|
| `apps/hub/…/20260405120000_hq_internal_communications.sql` | applied | object evidence (+2); history 20260405132914 |
| `apps/hub/…/20260405123000_hq_internal_comm_members.sql` | applied | object evidence (+1); history 20260405132927 |
| `apps/hub/…/20260407150000_hq_internal_comm_thread_touch.sql` | applied | object evidence (+2); history 20260405132937 |
| `apps/hub/…/20260407160000_staff_navigation_audit_prep.sql` | applied | object evidence (+1); history 20260416025820 |
| `apps/hub/…/20260408120000_hq_internal_comms_attachments_visibility_rls.sql` | applied | all objects verified in prod (incl. the 4 storage.objects policies — classifier key artifact) |
| `apps/hub/…/20260410120000_referral_fraud_hardening.sql` | applied | object evidence (+3); history 20260413112814 |
| `apps/hub/…/20260410130000_kyc_verification_infra.sql` | applied | object evidence (+3); history 20260413112827 |
| `apps/hub/…/20260416120000_trust_scoring_infra.sql` | applied | object evidence (+5); history 20260416134553 |
| `apps/hub/…/20260417170000_shared_pricing_governance.sql` | applied | object evidence (+6); history 20260417063230 |
| `apps/hub/…/20260419120000_multi_currency_schema_foundation.sql` | applied | history row 20260419042336 (constraint/policy/index-only file) |
| `apps/hub/…/20260419150000_notification_delivery_log.sql` | applied | object evidence (+1); history 20260419184310 |
| `apps/hub/…/20260420160000_notification_signal_preferences.sql` | applied | object evidence (+1) — out-of-band, no history row |
| `apps/hub/…/20260420193000_profiles_role_customer_constraint.sql` | applied | history row 20260420232812 (constraint/policy/index-only file) |
| `apps/hub/…/20260421191500_handle_new_customer_search_path.sql` | applied | object evidence (+1); history 20260421191500 |
| `apps/hub/…/20260423143000_data_governance_foundation.sql` | applied | object evidence (+9); history 20260424111014 |
| `apps/hub/…/20260424140000_customer_lifecycle_snapshot.sql` | applied | object evidence (+3); history 20260424112139 |
| `apps/hub/…/20260424160000_newsletter_foundation.sql` | applied | object evidence (+23); history 20260424112330 |
| `apps/hub/…/20260501120000_notification_signal_foundation_extensions.sql` | applied | object evidence (+3); history 20260508105640 |
| `apps/hub/…/20260501130000_notification_realtime_publication.sql` | applied | customer_notifications is published; landed as history row 20260523073251 |
| `apps/hub/…/20260502120000_staff_notifications_audience.sql` | applied | object evidence (+5) — out-of-band, no history row |
| `apps/hub/…/20260502160000_user_addresses_canonical.sql` | applied | object evidence (+14); history 20260502160000 |
| `apps/hub/…/20260502170000_v2_cart_01_saved_items_engagement.sql` | applied | object evidence (+21); history 20260502170000 |
| `apps/hub/…/20260502180000_search_index_outbox_v2_search_01.sql` | applied | object evidence (+8); history 20260502180000 |
| `apps/hub/…/20260507120000_get_signal_feed.sql` | applied | object evidence (+1); history 20260507182134 |
| `apps/hub/…/20260508120000_is_staff_in_any.sql` | applied | object evidence (+4) — out-of-band, no history row |
| `apps/hub/…/20260509120000_v2_closure_d8_rls_hot_patch.sql` | applied | object evidence (+2); history 20260509092455 |
| `apps/hub/…/20260510010000_i18n_translation_cache.sql` | applied | object evidence (+3); history 20260509233549 |
| `apps/hub/…/20260513200000_support_thread_state_pass24_phase5.sql` | applied | object evidence (+2) — out-of-band, no history row |
| `apps/hub/…/20260514100000_security_invoker_views.sql` | applied | history row 20260515054839 (constraint/policy/index-only file) |
| `apps/hub/…/20260514110000_function_search_path_lockdown.sql` | applied | history row 20260515055412 (constraint/policy/index-only file) |
| `apps/hub/…/20260514120000_unindexed_foreign_keys.sql` | applied | history row 20260515055507 (constraint/policy/index-only file) |
| `apps/hub/…/20260514130000_drop_duplicate_indexes.sql` | applied | history row 20260515055526 (constraint/policy/index-only file) |
| `apps/hub/…/20260514140000_auth_rls_initplan_wrap.sql` | applied | history row 20260515055657 (constraint/policy/index-only file) |
| `apps/hub/…/20260515060000_auth_rls_initplan_storage_policies.sql` | applied | history row 20260515055818 (constraint/policy/index-only file) |
| `apps/hub/…/20260522103000_v3_01_henry_events.sql` | applied | object evidence (+3); history 20260522124106 |
| `apps/hub/…/20260522154818_message_read_state.sql` | applied | object evidence (+14); history 20260523041459 |
| `apps/hub/…/20260522235119_v3_01_henry_events_anon_insert_policy.sql` | applied | object evidence (+1); history 20260522124106 |
| `apps/hub/…/20260523103000_diag_account_01_customer_preferences_missing_columns.sql` | applied | object evidence (+1); history 20260523104313 |
| `apps/hub/…/20260602120000_v3_division_name_brand_fix.sql` | applied (data-only) | content rebrand executed on prod CMS rows; reads additionally guarded by toBrandName (#192) |
| `apps/hub/…/20260605120000_customer_notifications_metadata_column.sql` | applied | object evidence (+1); history 20260605052924 |
| `apps/hub/…/20260605160000_push_subscriptions_known_devices.sql` | applied | object evidence (+5); history 20260605155217 |
| `apps/hub/…/20260605210000_service_role_statement_timeout_cap.sql` | applied | history row 20260605225852 (constraint/policy/index-only file) |
| `apps/hub/…/20260606120500_customer_notifications_category_constraint_reconcile.sql` | applied | history row 20260606120817 (constraint/policy/index-only file) |
| `apps/hub/…/20260606121500_customer_notifications_priority_constraint_reconcile.sql` | applied | history row 20260606124833 (constraint/policy/index-only file) |
| `apps/jobs/…/20260504130000_jobs_employer_subscriptions.sql` | applied | object evidence (+2); history 20260504133803 |
| `apps/learn/…/20260402233000_learn_init.sql` | applied | object evidence (+37); history 20260504135613 |
| `apps/learn/…/20260402233500_learn_policies.sql` | applied | object evidence (+1); history 20260504135700 |
| `apps/learn/…/20260403120000_learn_teacher_applications.sql` | applied | object evidence (+2); history 20260504135721 |
| `apps/learn/…/20260501000000_learn_unlock_policy.sql` | applied | history row 20260504135726 (constraint/policy/index-only file) |
| `apps/marketplace/…/20260402180000_marketplace_init.sql` | applied | object evidence (+63) — out-of-band, no history row |
| `apps/marketplace/…/20260402180500_marketplace_policies.sql` | applied | object evidence (+27) — out-of-band, no history row |
| `apps/marketplace/…/20260402223000_marketplace_events_and_application_state.sql` | applied | object evidence (+11) — out-of-band, no history row |
| `apps/marketplace/…/20260417160000_marketplace_pricing_breakdowns.sql` | applied | history row 20260417063220 (constraint/policy/index-only file) |
| `apps/marketplace/…/20260501010000_marketplace_deals_curation.sql` | applied | object evidence (+3); history 20260501080620 |
| `apps/marketplace/…/20260501020000_marketplace_seller_tiers.sql` | applied | object evidence (+5); history 20260501080658 |
| `apps/marketplace/…/20260505090000_marketplace_checkout_payment_completion.sql` | applied | multi-column ALTER; all 8 columns live in prod (out-of-band, no history row) |
| `apps/marketplace/…/20260514120000_marketplace_inventory_movements.sql` | applied | object evidence (+4); history 20260605202350 |
| `apps/marketplace/…/20260514120500_marketplace_refunds.sql` | applied | object evidence (+6); history 20260605202602 |
| `apps/marketplace/…/20260514121000_marketplace_review_photos.sql` | applied | object evidence (+9); history 20260605202712 |
| `apps/marketplace/…/20260514121500_marketplace_recommendation_signals.sql` | applied | object evidence (+4) — out-of-band, no history row |
| `apps/marketplace/…/20260514122000_marketplace_product_variants_matrix.sql` | applied | history row 20260605202941 (constraint/policy/index-only file) |
| `apps/property/…/20260402183000_property_init.sql` | applied | object evidence (+23); history 20260504135417 |
| `apps/property/…/20260402183500_property_policies.sql` | applied | object evidence (+1); history 20260504135452 |
| `apps/property/…/20260504135000_property_lock_owner_status_visibility.sql` | applied | object evidence (+2); history 20260504135744 |
| `apps/studio/…/20260402190000_studio_init.sql` | applied | object evidence (+34) — out-of-band, no history row |
| `apps/studio/…/20260402190500_studio_policies.sql` | applied | object evidence (+20) — out-of-band, no history row |
| `apps/studio/…/20260402223000_studio_extensions.sql` | applied | object evidence (+4) — out-of-band, no history row |
| `apps/studio/…/20260405120000_studio_brief_domain_intent.sql` | applied | object evidence (+1) — out-of-band, no history row |
| `apps/studio/…/20260503120000_studio_client_portal.sql` | applied | object evidence (+17) — out-of-band, no history row |
| `apps/studio/…/20260503120500_studio_client_portal_seed.sql` | applied (data-only) | seed rows verified live (studio_settings keys present) |
| `apps/studio/…/20260503130000_studio_brief_drafts.sql` | applied | object evidence (+4); history 20260504170556 |
| `apps/studio/…/20260503140000_studio_messaging.sql` | applied | object evidence (+16) — out-of-band, no history row |
| `apps/studio/…/20260504100000_studio_brief_drafts_guards.sql` | applied | object evidence (+1); history 20260504170556 |
| `apps/studio/…/20260505110000_studio_live_schema_guards.sql` | applied | object evidence (+5) — out-of-band, no history row |
| `apps/studio/…/20260505111000_studio_project_updates_live_drift.sql` | applied | object evidence (+1) — out-of-band, no history row |
| `apps/studio/…/20260505112000_studio_legacy_table_compatibility.sql` | applied | object evidence (+37) — out-of-band, no history row |

---

## 3. Partially applied / superseded (7 files)

Prod holds **part** of these files (out-of-band partial applies). They stay in
the tree untouched as historical record. Their missing **money-path** objects
were extracted verbatim into `20260611120000_fl2_wallet_rail_completion.sql`
(FL2 #6); their remaining non-money objects are backlog (§4). Do NOT re-apply
these files wholesale — they predate newer prod state (policies, constraint
reconciles) and could regress it.

| migration | status | evidence |
|---|---|---|
| `apps/hub/…/20260402235500_workspace_staff_platform.sql` | not-applied | only the trigger fn exists in prod (out-of-band residue); all 10 workspace_* tables absent — hub internal-comms access + owner DM route read them (live-risk) |
| `apps/hub/…/20260403183000_account_integration_hardening.sql` | partially-applied | customer_preferences/care_bookings/notification/security columns are live; funding+payout tables extracted VERBATIM to the FL2 completion file; referrals/trust/interview tables remain backlog |
| `apps/hub/…/20260405150000_logistics_customer_surface.sql` | partially-applied | 11 of 12 tables live; logistics_tracking_points absent (read by apps/logistics/lib/logistics/data.ts) |
| `apps/hub/…/20260406140000_wallet_withdrawals.sql` | partially-applied | withdrawal_pin_hash column is live; the withdrawal-requests table extracted VERBATIM to the FL2 completion file |
| `apps/hub/…/20260407190000_account_webhook_receipts.sql` | superseded | not applied; extracted VERBATIM into the FL2 completion file |
| `apps/hub/…/20260407193000_idempotency_and_nonce_scope.sql` | partially-superseded | account_idempotency_keys extracted to the FL2 completion file; the hq nonce-index swap (global → per author+thread) is still unapplied — messaging-correctness backlog ticket |
| `apps/hub/…/20260523190000_realtime_publication_backfill.sql` | partially-applied | customer_notifications third is live (history 20260523073251); the rooms_messages/rooms_participants thirds wait on the rooms family (tables absent) |
| `apps/super-app/…/20260405120000_super_app_core.sql` | partially-applied | profiles + handle_new_user trigger are live; divisions + contact_submissions absent (read only by the dormant super-app adapter/seed) |

---

## 4. Committed-not-applied feature backlog (48 files) — NOT part of FL2

The 2026-05-14/15 division feature wave + rooms. None of their objects exist in
prod. **FL2 must not apply these** — each family ships with its own feature
pass, after a prod-shape rehearsal (`build-shadow-db.mjs` pattern), or gets
archived by owner decision. Until then, code paths that read these tables fail
at runtime on prod (silently or 500) — the live-risk notes below feed the
drift-triage (PASS-REGISTER tickets).

### care feature wave (2026-05-15) (7 files)

*Live readers today:* live API readers: /api/care/pod, /api/care/track, /api/care/recurring, /api/care/claims, /api/care/preferences/garments + recurring-auto-book automation

- `apps/care/supabase/migrations/20260515120000_care_garment_types.sql`
- `apps/care/supabase/migrations/20260515120500_care_user_preferences.sql`
- `apps/care/supabase/migrations/20260515121000_care_recurring_schedules.sql`
- `apps/care/supabase/migrations/20260515121500_care_claims.sql`
- `apps/care/supabase/migrations/20260515122000_care_pod_records.sql`
- `apps/care/supabase/migrations/20260515122500_care_booking_garments.sql`
- `apps/care/supabase/migrations/20260515123000_care_realtime_publication.sql`

### rooms (interview/live rooms) (7 files)

*Live readers today:* packages/rooms/src/server/actions.ts reads all six rooms_* tables; 2 baseline drift entries (rooms_sessions.kind/.status)

- `apps/hub/supabase/migrations/20260515100000_rooms_sessions.sql`
- `apps/hub/supabase/migrations/20260515100100_rooms_participants.sql`
- `apps/hub/supabase/migrations/20260515100200_rooms_recordings_consent.sql`
- `apps/hub/supabase/migrations/20260515100300_rooms_recordings.sql`
- `apps/hub/supabase/migrations/20260515100400_rooms_scorecards.sql`
- `apps/hub/supabase/migrations/20260515100500_rooms_messages.sql`
- `apps/hub/supabase/migrations/20260515100600_rooms_realtime_publication.sql`

### jobs feature wave (2026-05-15) (7 files)

*Live readers today:* live API readers: jobs-alerts cron, /api/jobs/salary, /api/jobs/verifications/skill, interview-room + offer-letter libs

- `apps/jobs/supabase/migrations/20260515120000_jobs_taxonomy.sql`
- `apps/jobs/supabase/migrations/20260515120500_jobs_skill_verifications.sql`
- `apps/jobs/supabase/migrations/20260515121000_jobs_interview_rooms.sql`
- `apps/jobs/supabase/migrations/20260515121500_jobs_offer_letters.sql`
- `apps/jobs/supabase/migrations/20260515122000_jobs_salary_benchmarks.sql`
- `apps/jobs/supabase/migrations/20260515122500_jobs_pipeline_extras.sql`
- `apps/jobs/supabase/migrations/20260515123000_jobs_realtime_publication.sql`

### learn pass-21 player wave (2026-05-15) (3 files)

*Live readers today:* no direct .from() readers found in the scan

- `apps/learn/supabase/migrations/20260515000000_learn_v3_pass21_player.sql`
- `apps/learn/supabase/migrations/20260515001000_learn_v3_pass21_policies.sql`
- `apps/learn/supabase/migrations/20260515002000_learn_v3_pass21_realtime.sql`

### logistics feature wave (2026-05-14) (7 files)

*Live readers today:* live staff-page readers: dispatcher/manager fleet, manager claims, owner business/calendar + /api/logistics/{quote,book,dispatch,pod,claims}

- `apps/logistics/supabase/migrations/20260514120000_logistics_quotes.sql`
- `apps/logistics/supabase/migrations/20260514120500_logistics_shipment_legs.sql`
- `apps/logistics/supabase/migrations/20260514121000_logistics_pod.sql`
- `apps/logistics/supabase/migrations/20260514121500_logistics_claims.sql`
- `apps/logistics/supabase/migrations/20260514122000_logistics_fleet.sql`
- `apps/logistics/supabase/migrations/20260514122500_logistics_b2b_accounts.sql`
- `apps/logistics/supabase/migrations/20260514123000_logistics_realtime_publication.sql`

### property feature wave (2026-05-15) (10 files)

*Live readers today:* no direct .from() readers found (pages read via views/joins not present) — lowest live-risk of the waves

- `apps/property/supabase/migrations/20260515120000_property_amenities_catalog.sql`
- `apps/property/supabase/migrations/20260515120500_property_floorplans.sql`
- `apps/property/supabase/migrations/20260515121000_property_virtual_tours.sql`
- `apps/property/supabase/migrations/20260515121500_property_neighborhood_signals.sql`
- `apps/property/supabase/migrations/20260515122000_property_saved_searches.sql`
- `apps/property/supabase/migrations/20260515122500_property_inspection_rules.sql`
- `apps/property/supabase/migrations/20260515123000_property_rent_payments.sql`
- `apps/property/supabase/migrations/20260515123500_property_maintenance_tickets.sql`
- `apps/property/supabase/migrations/20260515124000_property_viewings_extensions.sql`
- `apps/property/supabase/migrations/20260515124500_property_realtime_publication.sql`

### studio feature wave (2026-05-14) (7 files)

*Live readers today:* live API readers: /api/studio/asset-packs/generate, /api/studio/proposals/sign (+2 baseline drift entries)

- `apps/studio/supabase/migrations/20260514130000_studio_proposal_signatures.sql`
- `apps/studio/supabase/migrations/20260514130500_studio_revisions_versioning.sql`
- `apps/studio/supabase/migrations/20260514131000_studio_milestone_extensions.sql`
- `apps/studio/supabase/migrations/20260514131500_studio_payment_plans.sql`
- `apps/studio/supabase/migrations/20260514132000_studio_resource_allocations.sql`
- `apps/studio/supabase/migrations/20260514132500_studio_asset_packs.sql`
- `apps/studio/supabase/migrations/20260514133000_studio_realtime_publication.sql`

---

## 5. Standing rules this manifest encodes

1. **Object evidence outranks history naming** — prod was modified out-of-band;
   never classify a migration by filename/history alone.
2. **Never edit or re-apply an applied file.** Forward-fix with a new file.
3. **Committed-not-applied files are editable** (they are not history) — that is
   how V3-18 was narrowed safely.
4. **Every future FL-gate apply list must be rehearsed on the prod-actual
   shadow first** (`scripts/db/introspect-prod-schema.mjs` to refresh the
   snapshot → `scripts/db/build-shadow-db.mjs` to rehearse). The two defects
   this pass caught (live-table name collision; trigger-chain NOT NULL) are
   invisible on a fresh-DB proof.
5. **After any prod apply, regenerate the types and re-baseline the drift
   guard** so the declared schema stays true.

---

## 6. Post-rebase addendum (2026-06-11, same day)

The rebase onto main brought two new committed-NOT-applied files from V3-37
(merged PR #265, its own FL gate — deliberately NOT part of the FL2 list):

| migration | status | note |
|---|---|---|
| `apps/hub/…/20260610120000_v3_37_abandoned_tasks.sql` | committed-not-applied (V3-37 FL gate) | its `abandoned_tasks` types entry is HAND-CARRIED in database.types.ts (see the file header) because the table is in neither prod-actual nor the FL2 set; re-splice after every regeneration until it lands |
| `apps/hub/…/20260610121000_v3_37_recovery_notification_category.sql` | committed-not-applied (V3-37 FL gate) | widens the customer_notifications category CHECK for the recovery events (the PR #241 constraint-drift rule) |

Guard note discovered while reconciling: the drift guard's migration-DDL parser
does not see MULTI-LINE column definitions (e.g. `task_type text not null` with
its `check (…)` on the next line) — the types side of the union is what keeps
such references green. Folded into the SD-ticket list as a guard-upgrade item.
