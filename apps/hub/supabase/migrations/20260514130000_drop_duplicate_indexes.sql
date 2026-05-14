-- Drop the redundant copy of 10 duplicate index pairs flagged by the
-- Supabase advisor (`duplicate_index`).
--
-- For each pair we keep one and drop the other. Where one of the pair is
-- a constraint-backing index (suffix `_pkey` for the primary key or
-- `_key` for a unique constraint), the constraint-backed one is kept —
-- dropping a constraint-backed index requires DROP CONSTRAINT instead.
--
-- NOTE: The advisor's `indexes` array ordering is not significant — both
-- indexes are by definition identical. The selection below is HenryCo's
-- explicit choice (favouring constraint-backed and shorter names).
--
-- Critical override vs the advisor: on `company_settings`, the advisor's
-- suggested-keep order lists `company_settings_pkey` as a drop candidate.
-- That is the primary key constraint's backing index and MUST be kept;
-- we drop the redundant `company_settings_id_uidx` instead.
--
-- Remediation reference:
-- https://supabase.com/docs/guides/database/database-linter?lint=0009_duplicate_index

-- 1. public.care_finance_ledger
--    Keep:  care_finance_ledger_source_table_source_id_direction_key  (unique constraint)
--    Drop:  care_finance_ledger_source_unique  (loose duplicate)
drop index if exists public.care_finance_ledger_source_unique;

-- 2. public.care_order_items
--    Keep:  care_order_items_booking_id_idx
--    Drop:  idx_care_order_items_booking_id
drop index if exists public.idx_care_order_items_booking_id;

-- 3. public.company_divisions (is_published)
--    Keep:  idx_company_divisions_is_published  (clearer name)
--    Drop:  idx_company_divisions_published
drop index if exists public.idx_company_divisions_published;

-- 4. public.company_divisions (sort)
--    Keep:  idx_company_divisions_sort
--    Drop:  idx_company_divisions_sort_order
drop index if exists public.idx_company_divisions_sort_order;

-- 5. public.company_divisions (slug)
--    Keep:  company_divisions_slug_key  (unique constraint)
--    Drop:  company_divisions_slug_uidx
drop index if exists public.company_divisions_slug_uidx;

-- 6. public.company_pages (slug)
--    Keep:  company_pages_slug_idx
--    Drop:  idx_company_pages_slug
drop index if exists public.idx_company_pages_slug;

-- 7. public.company_pages (page_key)
--    Keep:  company_pages_page_key_key  (unique constraint)
--    Drop:  company_pages_page_key_uidx
drop index if exists public.company_pages_page_key_uidx;

-- 8. public.company_people (page_key + sort)
--    Keep:  idx_company_people_page_key_sort
--    Drop:  idx_company_people_page_sort
drop index if exists public.idx_company_people_page_sort;

-- 9. public.company_settings (id) — OVERRIDE: keep pkey, drop uidx
--    Keep:  company_settings_pkey  (PRIMARY KEY — MUST NOT DROP)
--    Drop:  company_settings_id_uidx
drop index if exists public.company_settings_id_uidx;

-- 10. public.customer_activity (division)
--    Keep:  idx_activity_division  (shorter)
--    Drop:  idx_customer_activity_division
drop index if exists public.idx_customer_activity_division;
