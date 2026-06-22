# prod-actual / captured-migrations

**V3-RECONCILE-01 (2026-06-21).** Byte-faithful captures of migrations that were
**applied to production** (`rzkbgwuznmdxnnhmjazy` / HENRY ONYX) but had **no
app-folder migration file** in the repo.

## What these are

Each file here is the exact SQL prod actually ran for one migration, read
read-only from `supabase_migrations.schema_migrations.statements` (the array of
applied statements) and reproduced verbatim under a provenance header. They sit
beside [`../schema.sql`](../schema.sql) (the SCHEMA-TRUTH-01 object-level prod
baseline) and follow the same rule:

> **Reference only. NOT part of any app auto-apply chain. Never re-apply to
> prod** — these objects already exist there.

They exist so the repo's *migration record* mirrors prod for the 13 historical
migrations that the per-app folders never carried, and so each one's intent is
documented and diff-able.

## Why a separate directory (not the app `migrations/` folders)

Production was built from an early **monolithic** lineage *and* later **per-app**
folders that partially recreate the same tables. There is therefore no single
`migrations/` directory that cleanly rebuilds prod. Dropping a verbatim capture
such as `create_logistics_property_hub_tables` into an app chain would make a
fresh `supabase db push` fail (`relation "logistics_shipments" already exists`),
because `apps/hub/.../20260405150000_logistics_customer_surface.sql` already
creates 11 of its tables. The canonical full-schema reproduction is
`../schema.sql`; these per-migration captures complement it without introducing
intra-repo create conflicts.

## The 13 captures

10 GENUINE_GAP (no repo migration creates the objects) + 3 FOLLOWON_HARDEN
(an RLS/column/backfill delta on a prod-only base table). See the per-file
header for the prod `version`/`name` and classification, and
`.codex-temp/v3-reconcile-01/report.md` (V3-RECONCILE-01) for the full
reconciliation, the per-object citations, and the dependency notes (e.g.
`create_logistics_property_hub_tables` overlaps 13/15 tables with existing repo
migrations; only `logistics_role_memberships` + `hub_homepage_content` are
unique).

| version | name | class |
|---|---|---|
| 20260402150914 | account_platform_core | GENUINE_GAP |
| 20260403175430 | add_care_bookings_rls_policies | GENUINE_GAP |
| 20260406065148 | auth_hardening_orders_and_care_reviews | GENUINE_GAP |
| 20260409054321 | create_logistics_property_hub_tables | GENUINE_GAP |
| 20260409054347 | create_jobs_communication_interview_tables | GENUINE_GAP |
| 20260409054419 | create_referral_trust_and_support_read_columns | GENUINE_GAP |
| 20260416025825 | support_thread_events | GENUINE_GAP |
| 20260416025830 | support_thread_internal_notes | GENUINE_GAP |
| 20260416025912 | support_indexes_and_hardening | FOLLOWON_HARDEN |
| 20260416030628 | verification_submissions_rls_policies | FOLLOWON_HARDEN |
| 20260502161000 | user_addresses_legacy_backfill | FOLLOWON_HARDEN |
| 20260602041048 | cms_phase1_publish_workflow_drafts_revisions | GENUINE_GAP |
| 20260619015600 | rename_orphan_businesses_for_v3_57 | GENUINE_GAP |

No prod change was made to produce these — capture is read-only.
