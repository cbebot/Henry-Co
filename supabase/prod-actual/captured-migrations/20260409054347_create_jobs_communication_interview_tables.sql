-- ============================================================================
-- FAITHFUL PROD CAPTURE — V3-RECONCILE-01 (2026-06-21)
-- prod migration: version=20260409054347  name=create_jobs_communication_interview_tables
-- project: rzkbgwuznmdxnnhmjazy (HENRY ONYX)
-- classification: GENUINE_GAP (applied on prod; no app-folder migration file existed)
--
-- BYTE-FAITHFUL capture of the SQL prod actually applied for this migration
-- (supabase_migrations.schema_migrations.statements). Recorded so the repo
-- migration record mirrors prod. Like supabase/prod-actual/schema.sql this is a
-- REFERENCE capture: NOT part of any app auto-apply chain, and must NOT be
-- re-applied to prod (these objects already exist there). See
-- supabase/prod-actual/captured-migrations/README.md and
-- .codex-temp/v3-reconcile-01/report.md.
-- ============================================================================

-- Jobs hiring pipelines (employer defines stages per job)
CREATE TABLE IF NOT EXISTS jobs_hiring_pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid REFERENCES auth.users(id),
  company_id uuid REFERENCES companies(id),
  job_title text NOT NULL,
  job_reference text,
  status text NOT NULL DEFAULT 'open',
  stages jsonb NOT NULL DEFAULT '["applied","screening","interview","offer","hired","rejected"]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Jobs applications (candidate applies to a pipeline)
CREATE TABLE IF NOT EXISTS jobs_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid REFERENCES jobs_hiring_pipelines(id) ON DELETE CASCADE,
  candidate_id uuid REFERENCES auth.users(id),
  candidate_email text,
  candidate_name text,
  current_stage text NOT NULL DEFAULT 'applied',
  status text NOT NULL DEFAULT 'active',
  resume_url text,
  cover_note text,
  metadata jsonb DEFAULT '{}'::jsonb,
  applied_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Jobs conversations (governed messaging between employer and candidate)
CREATE TABLE IF NOT EXISTS jobs_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES jobs_applications(id) ON DELETE CASCADE,
  pipeline_id uuid REFERENCES jobs_hiring_pipelines(id),
  employer_id uuid REFERENCES auth.users(id),
  candidate_id uuid REFERENCES auth.users(id),
  subject text,
  status text NOT NULL DEFAULT 'active',
  is_moderated boolean NOT NULL DEFAULT false,
  flag_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Jobs messages (individual messages within a conversation)
CREATE TABLE IF NOT EXISTS jobs_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES jobs_conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id),
  sender_type text NOT NULL DEFAULT 'employer',
  body text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  is_flagged boolean NOT NULL DEFAULT false,
  flag_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Jobs interviews (scheduled interviews within a pipeline)
CREATE TABLE IF NOT EXISTS jobs_interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES jobs_applications(id) ON DELETE CASCADE,
  pipeline_id uuid REFERENCES jobs_hiring_pipelines(id),
  conversation_id uuid REFERENCES jobs_conversations(id),
  interviewer_id uuid REFERENCES auth.users(id),
  candidate_id uuid REFERENCES auth.users(id),
  interview_type text NOT NULL DEFAULT 'video',
  title text,
  description text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes int NOT NULL DEFAULT 30,
  timezone text NOT NULL DEFAULT 'Africa/Lagos',
  location text,
  meeting_url text,
  status text NOT NULL DEFAULT 'scheduled',
  employer_notes text,
  candidate_notes text,
  outcome text,
  outcome_notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Jobs moderation queue (staff oversight of hiring activity)
CREATE TABLE IF NOT EXISTS jobs_moderation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  reason text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  flagged_by text DEFAULT 'system',
  flagged_by_user_id uuid,
  reviewed_by uuid,
  review_notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

-- Jobs contact masks (prevent off-platform contact sharing)
CREATE TABLE IF NOT EXISTS jobs_contact_masks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  masked_email text,
  masked_phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE jobs_hiring_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs_moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs_contact_masks ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Service role full access" ON jobs_hiring_pipelines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON jobs_applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON jobs_conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON jobs_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON jobs_interviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON jobs_moderation_queue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON jobs_contact_masks FOR ALL USING (true) WITH CHECK (true);
