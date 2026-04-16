-- ---------------------------------------------------------------------------
-- Migration: 20260416120000_trust_scoring_infra.sql
-- Trust scoring infrastructure for Jobs and Marketplace.
--
-- Changes:
--  1. marketplace_vendor_trust_snapshots — audit trail for vendor trust changes.
--  2. trust_last_computed_at column on marketplace_vendors.
--  3. Employer trust signal columns in customer_activity metadata — no schema
--     change needed (metadata is already jsonb); documented here for clarity.
--  4. Deferred note on marketplace_reviews duplicate guard (see below).
--
-- Parallel-safety: does NOT touch platform_support_threads, support_messages,
-- or any support backend tables reserved for the live support pass.
-- ---------------------------------------------------------------------------

-- ---- 1. marketplace_vendors: trust tracking column -------------------------

ALTER TABLE marketplace_vendors
  ADD COLUMN IF NOT EXISTS trust_last_computed_at timestamptz;

-- ---- 2. Vendor trust audit snapshots table ----------------------------------
-- Records the before/after of every trust recalculation so staff can explain
-- why a vendor's score or tier changed.

CREATE TABLE IF NOT EXISTS marketplace_vendor_trust_snapshots (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id           uuid        NOT NULL REFERENCES marketplace_vendors(id) ON DELETE CASCADE,
  trust_score         integer     NOT NULL,
  fulfillment_rate    numeric(6, 2),
  dispute_rate        numeric(6, 2),
  review_score        numeric(4, 2),
  tier                text        NOT NULL,
  trigger_reason      text        NOT NULL,
  computed_at         timestamptz NOT NULL DEFAULT now(),
  computed_by         text        NOT NULL DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS marketplace_vendor_trust_snapshots_vendor_idx
  ON marketplace_vendor_trust_snapshots (vendor_id, computed_at DESC);

ALTER TABLE marketplace_vendor_trust_snapshots ENABLE ROW LEVEL SECURITY;

-- Staff (owner, admin, moderation, finance) can read trust snapshots
CREATE POLICY "staff_read_vendor_trust_snapshots"
  ON marketplace_vendor_trust_snapshots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM marketplace_role_memberships m
      WHERE m.user_id    = auth.uid()
        AND m.role       IN ('marketplace_owner', 'marketplace_admin', 'moderation', 'finance')
        AND m.is_active  = true
    )
  );

-- System/service-role writes only (no direct user inserts)
CREATE POLICY "service_role_insert_vendor_trust_snapshots"
  ON marketplace_vendor_trust_snapshots
  FOR INSERT
  WITH CHECK (false);  -- blocked for anon/authenticated; service_role bypasses RLS

-- ---- 3. marketplace_moderation_cases: vendor_id FK for trust queries --------
-- Adds an optional vendor_id column so moderation incidents can be queried
-- per vendor when recalculating trust. Best-effort — applied only if the
-- column does not already exist.

ALTER TABLE marketplace_moderation_cases
  ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES marketplace_vendors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS marketplace_moderation_cases_vendor_idx
  ON marketplace_moderation_cases (vendor_id)
  WHERE vendor_id IS NOT NULL;

-- ---- 4. Deferred: marketplace_reviews duplicate guard -----------------------
-- A UNIQUE constraint on (user_id, product_id) in marketplace_reviews would
-- prevent duplicate reviews at the DB level.  It is NOT applied in this
-- migration because existing data may contain duplicates from before this
-- enforcement was added.
--
-- Action required before deploying this constraint to production:
--   SELECT user_id, product_id, count(*)
--   FROM marketplace_reviews
--   GROUP BY user_id, product_id HAVING count(*) > 1;
--
-- After confirming no duplicates (or cleaning them up):
--   ALTER TABLE marketplace_reviews
--     ADD CONSTRAINT marketplace_reviews_user_product_unique
--     UNIQUE (user_id, product_id);
--
-- The application-level duplicate guard in checkReviewAuthenticity() is
-- active in all environments regardless of this DB constraint.

-- ---- 5. Jobs interview no-show tracking -------------------------------------
-- Interview records are stored as customer_activity rows with
-- activity_type = 'jobs_interview' and metadata jsonb.
-- The no-show flag is tracked in metadata as:
--   { "interviewStatus": "no_show", "employerSlug": "...", "employerCancelled": true }
--
-- No schema change is required — this is documented for data contract clarity.

-- ---- 6. platform_moderation_queue: jobs entity type -------------------------
-- The existing ModerationEntityType union includes "application" which covers
-- jobs hiring applications. Employer profiles use "user_profile".
-- No schema change required — the entity_type column is already text.
-- This migration documents that "employer_profile" is a valid entity_type
-- value for jobs moderation cases.

COMMENT ON TABLE marketplace_vendor_trust_snapshots IS
  'Audit trail of vendor trust score recalculations. Each row records the '
  'post-recalculation signals and the event that triggered the change. '
  'Staff can use this to explain why a vendor trust level changed.';
