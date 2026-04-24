-- Newsletter, editorial automation, and email audience intelligence foundation.
--
-- Additive migration. Introduces:
--   * email_subscribers            — canonical subscriber record per email address
--   * email_subscriber_topics      — per-subscriber topic opt-ins and frequency overrides
--   * email_suppression_list       — unified suppression (bounces, complaints, trust/dispute holds, manual opt-outs)
--   * email_audience_segments      — saved segment definitions with criteria JSON
--   * email_campaigns              — draft/review/approval/schedule/send lifecycle
--   * email_campaign_sends         — per-recipient send/delivery record linked to campaign + subscriber
--   * email_editorial_events       — audit log of campaign edits, approvals, send starts, pauses
--   * email_brand_voice_rules      — banned phrases, required disclosures, tone rules, compliance checks
--   * email_draft_assists          — AI-assisted draft history + voice score + acceptance audit
--
-- All tables are service-role only unless called out. No browser read policies
-- on campaign/editorial surfaces; staff reads go through server actions with
-- Supabase service role + staff role checks already enforced by hub auth.
--
-- Governance rows are added to data_retention_policies for each new table.

begin;

create extension if not exists pgcrypto;
create extension if not exists citext;

create or replace function public.newsletter_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- Subscribers
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.email_subscribers (
  id uuid primary key default gen_random_uuid(),
  email citext not null,
  user_id uuid references auth.users(id) on delete set null,
  locale text not null default 'en-NG',
  country text,
  status text not null default 'pending_confirmation'
    check (status in ('pending_confirmation', 'active', 'paused', 'unsubscribed', 'suppressed')),
  source_surface text,
  source_division text,
  consent_given_at timestamptz,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  last_engagement_at timestamptz,
  last_bounced_at timestamptz,
  hard_bounce_count integer not null default 0,
  soft_bounce_count integer not null default 0,
  provider_contact_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (email)
);

create index if not exists email_subscribers_user_idx
  on public.email_subscribers(user_id)
  where user_id is not null;
create index if not exists email_subscribers_status_idx
  on public.email_subscribers(status);
create index if not exists email_subscribers_country_idx
  on public.email_subscribers(country);
create index if not exists email_subscribers_source_division_idx
  on public.email_subscribers(source_division);
create index if not exists email_subscribers_last_engagement_idx
  on public.email_subscribers(last_engagement_at)
  where status = 'active';

drop trigger if exists email_subscribers_updated_at on public.email_subscribers;
create trigger email_subscribers_updated_at
  before update on public.email_subscribers
  for each row execute function public.newsletter_set_updated_at();

alter table public.email_subscribers enable row level security;
drop policy if exists email_subscribers_service_role on public.email_subscribers;
create policy email_subscribers_service_role on public.email_subscribers
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- ──────────────────────────────────────────────────────────────────────────────
-- Topic preferences
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.email_subscriber_topics (
  subscriber_id uuid not null references public.email_subscribers(id) on delete cascade,
  topic_key text not null,
  opted_in_at timestamptz,
  opted_out_at timestamptz,
  frequency_override text check (frequency_override in ('weekly','biweekly','monthly','ad_hoc')),
  source_surface text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (subscriber_id, topic_key)
);

create index if not exists email_subscriber_topics_topic_idx
  on public.email_subscriber_topics(topic_key)
  where opted_in_at is not null and opted_out_at is null;

drop trigger if exists email_subscriber_topics_updated_at on public.email_subscriber_topics;
create trigger email_subscriber_topics_updated_at
  before update on public.email_subscriber_topics
  for each row execute function public.newsletter_set_updated_at();

alter table public.email_subscriber_topics enable row level security;
drop policy if exists email_subscriber_topics_service_role on public.email_subscriber_topics;
create policy email_subscriber_topics_service_role on public.email_subscriber_topics
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- ──────────────────────────────────────────────────────────────────────────────
-- Suppression list (unified)
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.email_suppression_list (
  id uuid primary key default gen_random_uuid(),
  email citext not null,
  reason text not null check (reason in (
    'manual_optout','hard_bounce','soft_bounce_repeated','spam_complaint',
    'invalid_address','support_sensitive','trust_hold','dispute_active',
    'payment_incident','unsubscribed','role_address','legal_hold'
  )),
  scope text not null default 'all'
    check (scope in ('all','marketing','lifecycle','digest','transactional_only')),
  division text,
  note text,
  recorded_by uuid references auth.users(id) on delete set null,
  recorded_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  unique (email, reason, scope)
);

create index if not exists email_suppression_list_email_idx
  on public.email_suppression_list(email);
create index if not exists email_suppression_list_scope_idx
  on public.email_suppression_list(scope);

alter table public.email_suppression_list enable row level security;
drop policy if exists email_suppression_list_service_role on public.email_suppression_list;
create policy email_suppression_list_service_role on public.email_suppression_list
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- ──────────────────────────────────────────────────────────────────────────────
-- Audience segments
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.email_audience_segments (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  description text not null default '',
  criteria jsonb not null default '{}'::jsonb,
  estimated_size integer,
  last_resolved_at timestamptz,
  owner_team text not null default 'Editorial',
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists email_audience_segments_updated_at on public.email_audience_segments;
create trigger email_audience_segments_updated_at
  before update on public.email_audience_segments
  for each row execute function public.newsletter_set_updated_at();

alter table public.email_audience_segments enable row level security;
drop policy if exists email_audience_segments_service_role on public.email_audience_segments;
create policy email_audience_segments_service_role on public.email_audience_segments
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- ──────────────────────────────────────────────────────────────────────────────
-- Brand voice rules
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.email_brand_voice_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  kind text not null check (kind in ('banned_phrase','required_disclosure','truth_constraint','tone_rule','compliance')),
  pattern text not null,
  reason text not null,
  severity text not null default 'warning' check (severity in ('info','warning','block')),
  applies_to_classes text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.email_brand_voice_rules enable row level security;
drop policy if exists email_brand_voice_rules_service_role on public.email_brand_voice_rules;
create policy email_brand_voice_rules_service_role on public.email_brand_voice_rules
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- ──────────────────────────────────────────────────────────────────────────────
-- Campaigns
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  status text not null default 'draft'
    check (status in ('draft','in_review','changes_requested','approved','scheduled','sending','paused','sent','cancelled','archived')),
  campaign_class text not null default 'division_digest'
    check (campaign_class in ('company_wide','division_digest','lifecycle_journey','transactional_education','announcement')),
  division text not null default 'hub',
  segment_id uuid references public.email_audience_segments(id) on delete set null,
  topic_keys text[] not null default '{}',
  content jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz,
  send_started_at timestamptz,
  send_completed_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  paused_reason text,
  author_id uuid references auth.users(id) on delete set null,
  voice_guard_score integer,
  voice_guard_warnings jsonb not null default '[]'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists email_campaigns_status_idx
  on public.email_campaigns(status, scheduled_for);
create index if not exists email_campaigns_class_division_idx
  on public.email_campaigns(campaign_class, division);

drop trigger if exists email_campaigns_updated_at on public.email_campaigns;
create trigger email_campaigns_updated_at
  before update on public.email_campaigns
  for each row execute function public.newsletter_set_updated_at();

alter table public.email_campaigns enable row level security;
drop policy if exists email_campaigns_service_role on public.email_campaigns;
create policy email_campaigns_service_role on public.email_campaigns
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- ──────────────────────────────────────────────────────────────────────────────
-- Campaign sends (per-recipient log)
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.email_campaign_sends (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.email_campaigns(id) on delete cascade,
  subscriber_id uuid references public.email_subscribers(id) on delete set null,
  email citext not null,
  status text not null default 'queued' check (status in (
    'queued','skipped_suppressed','skipped_preference','skipped_trust_hold',
    'skipped_support_sensitive','sent','bounced','complained','opened',
    'clicked','unsubscribed_from_send','failed'
  )),
  provider text not null default 'brevo',
  provider_message_id text,
  error_code text,
  error_message text,
  suppression_reason text,
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  complained_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists email_campaign_sends_campaign_idx
  on public.email_campaign_sends(campaign_id, status);
create index if not exists email_campaign_sends_subscriber_idx
  on public.email_campaign_sends(subscriber_id)
  where subscriber_id is not null;
create index if not exists email_campaign_sends_status_recent_idx
  on public.email_campaign_sends(status, created_at desc);

alter table public.email_campaign_sends enable row level security;
drop policy if exists email_campaign_sends_service_role on public.email_campaign_sends;
create policy email_campaign_sends_service_role on public.email_campaign_sends
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- ──────────────────────────────────────────────────────────────────────────────
-- Editorial audit log
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.email_editorial_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.email_campaigns(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in (
    'created','updated','submitted_for_review','changes_requested','approved',
    'scheduled','paused','cancelled','send_started','send_completed','archived',
    'voice_guard_triggered','test_sent'
  )),
  note text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists email_editorial_events_campaign_idx
  on public.email_editorial_events(campaign_id, created_at desc);

alter table public.email_editorial_events enable row level security;
drop policy if exists email_editorial_events_service_role on public.email_editorial_events;
create policy email_editorial_events_service_role on public.email_editorial_events
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- ──────────────────────────────────────────────────────────────────────────────
-- Draft assists (AI-assisted draft audit)
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.email_draft_assists (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.email_campaigns(id) on delete cascade,
  prompt text,
  variant text not null default 'default',
  assist_model text,
  raw_draft jsonb not null default '{}'::jsonb,
  human_edited_draft jsonb,
  voice_score integer,
  voice_warnings jsonb not null default '[]'::jsonb,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists email_draft_assists_campaign_idx
  on public.email_draft_assists(campaign_id, created_at desc);

alter table public.email_draft_assists enable row level security;
drop policy if exists email_draft_assists_service_role on public.email_draft_assists;
create policy email_draft_assists_service_role on public.email_draft_assists
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- ──────────────────────────────────────────────────────────────────────────────
-- Governance: register newsletter tables in the data-retention map.
-- ──────────────────────────────────────────────────────────────────────────────
insert into public.data_governance_domains (
  domain_key, display_name, owner_team, classification, restore_priority,
  source_of_truth, backup_dependency, retention_summary, notes
) values (
  'newsletter_editorial',
  'Newsletter & editorial',
  'Editorial',
  'OPERATIONAL — CONTAINS PII (EMAIL)',
  30,
  'Supabase (email_subscribers, email_campaigns)',
  'Provider database backup; Brevo as secondary provider state (not authoritative).',
  'Retain subscribers while consent is live; purge suppression list only after legal hold clears.',
  'Never store raw support/dispute content in campaign payloads; campaign content is public-facing by design.'
) on conflict (domain_key) do update
  set display_name = excluded.display_name,
      owner_team = excluded.owner_team,
      classification = excluded.classification,
      restore_priority = excluded.restore_priority,
      source_of_truth = excluded.source_of_truth,
      backup_dependency = excluded.backup_dependency,
      retention_summary = excluded.retention_summary,
      notes = excluded.notes,
      updated_at = timezone('utc', now());

insert into public.data_retention_policies (
  domain_key, table_name, data_classification, retention_rule, retention_action,
  soft_delete_required, archive_required, legal_hold_supported,
  destructive_prune_allowed, backup_requirement, restore_source, owner_team, notes
) values
  (
    'newsletter_editorial','email_subscribers','PII — email address',
    'Retain while subscription is live; on unsubscribe, keep minimum to honor suppression.',
    'Mark unsubscribed; do not purge suppressions.',
    true, false, true, false,
    'Provider database backup.','Recreatable only via user re-opt-in.',
    'Editorial',
    'Never delete a record that is the source of a suppression reason.'
  ),
  (
    'newsletter_editorial','email_subscriber_topics','PII — topic preferences',
    'Retain while subscription is live.','Soft-delete with subscriber record.',
    true, false, true, false,'Provider database backup.','Recreatable on re-opt-in.','Editorial',''
  ),
  (
    'newsletter_editorial','email_suppression_list','PII — email address + reason',
    'Retain indefinitely unless legal hold lifts the entry.','Manual lift only.',
    false, false, true, false,'Provider database backup.','Irreversible by design.','Editorial',
    'This table exists to prevent re-sending; do not prune.'
  ),
  (
    'newsletter_editorial','email_audience_segments','DERIVED — no PII in definitions',
    'Retain; derived and cheap to rebuild.','Soft-delete when archived.',
    false, false, false, true,'Provider database backup.','Recreatable from seed list.','Editorial',''
  ),
  (
    'newsletter_editorial','email_campaigns','CONTENT — editorial public-facing',
    'Retain for audit and performance history.','Archive old campaigns after 3 years.',
    false, true, false, false,'Provider database backup.','Recreatable from audit log.','Editorial',''
  ),
  (
    'newsletter_editorial','email_campaign_sends','PII — email + send status',
    'Retain 18 months for analytics; aggregate beyond.','Aggregate + prune.',
    false, true, true, true,'Provider database backup.','Aggregates only after prune.','Editorial',''
  ),
  (
    'newsletter_editorial','email_editorial_events','AUDIT LOG',
    'Retain for governance and approval trail.','No prune without written policy.',
    false, true, true, false,'Provider database backup.','Irreversible by design.','Editorial',''
  ),
  (
    'newsletter_editorial','email_brand_voice_rules','CONFIGURATION',
    'Retain; small table.','Manual updates only.',
    false, false, false, false,'Provider database backup.','Re-seedable from packaged defaults.','Editorial',''
  ),
  (
    'newsletter_editorial','email_draft_assists','CONTENT + MODEL METADATA',
    'Retain 18 months for editorial quality learning.','Aggregate beyond.',
    false, true, false, true,'Provider database backup.','Recreatable from campaign + audit log.','Editorial',''
  )
on conflict (schema_name, table_name) do update
  set data_classification = excluded.data_classification,
      retention_rule = excluded.retention_rule,
      retention_action = excluded.retention_action,
      soft_delete_required = excluded.soft_delete_required,
      archive_required = excluded.archive_required,
      legal_hold_supported = excluded.legal_hold_supported,
      destructive_prune_allowed = excluded.destructive_prune_allowed,
      backup_requirement = excluded.backup_requirement,
      restore_source = excluded.restore_source,
      owner_team = excluded.owner_team,
      notes = excluded.notes,
      updated_at = timezone('utc', now());

-- Seed default brand voice rules (idempotent).
insert into public.email_brand_voice_rules (rule_key, kind, pattern, reason, severity, applies_to_classes, active) values
  ('no_buy_now_pressure','banned_phrase','\bbuy now!?\b','Avoid pressure sales language; use clear, calm CTAs.','warning',ARRAY['company_wide','division_digest','announcement'],true),
  ('no_fake_urgency_last_chance','banned_phrase','\blast chance\b','Fake urgency erodes trust.','warning',ARRAY['company_wide','division_digest','announcement','lifecycle_journey'],true),
  ('no_limited_time_fake_scarcity','banned_phrase','\blimited time (only|offer)!?\b','Avoid fake scarcity.','warning',ARRAY['company_wide','division_digest','announcement'],true),
  ('no_fabricated_trust_claims','truth_constraint','\b(100% guaranteed|guaranteed results|zero risk|risk[- ]free|no.1 in the world)\b','Do not fabricate trust claims that cannot be substantiated.','block',ARRAY['company_wide','division_digest','announcement','lifecycle_journey','transactional_education'],true),
  ('no_customer_testimonial_fabrication','truth_constraint','\b(loved by millions|thousands of happy customers say|rated #1 by experts)\b','Do not invent customer testimonials or ratings.','block',ARRAY['company_wide','division_digest','announcement'],true),
  ('avoid_ai_phrasing_filler','tone_rule','\b(in today''s fast-paced world|in this digital age|unlock the power of|revolutionize)\b','Generic corporate/AI filler; rewrite with specific, human language.','warning',ARRAY['company_wide','division_digest','announcement'],true),
  ('required_unsubscribe_footer','required_disclosure','(unsubscribe|manage preferences|email preferences)','Marketing emails must include a visible unsubscribe/preferences link.','block',ARRAY['company_wide','division_digest','announcement','lifecycle_journey'],true),
  ('avoid_robotic_greeting','tone_rule','\bdear valued customer\b','Sounds generic/robotic; use subscriber name or a direct opener.','info',ARRAY['company_wide','division_digest','announcement','lifecycle_journey'],true),
  ('no_click_here_cta','tone_rule','\bclick here\b','CTA copy should describe the action.','warning',ARRAY['company_wide','division_digest','announcement','lifecycle_journey'],true),
  ('no_spammy_caps_in_subject','tone_rule','([A-Z]{6,})','Long all-caps words look spammy.','warning',ARRAY['company_wide','division_digest','announcement'],true)
on conflict (rule_key) do update
  set kind = excluded.kind,
      pattern = excluded.pattern,
      reason = excluded.reason,
      severity = excluded.severity,
      applies_to_classes = excluded.applies_to_classes,
      active = excluded.active;

-- Seed default audience segments (idempotent).
insert into public.email_audience_segments (key, label, description, criteria, owner_team) values
  ('company_newsletter_all_optins','Company newsletter — all active opt-ins','Anyone who opted into the HenryCo Group Digest and is not suppressed.',
   '{"topics":["company_digest"],"excludeSupportSensitive":true,"excludeTrustHold":true,"excludeDisputeActive":true}'::jsonb,'Editorial'),
  ('marketplace_digest_active_buyers','Marketplace digest — active buyers','Marketplace digest subscribers with engagement in last 90 days.',
   '{"topics":["marketplace_digest"],"minEngagementWithinDays":90,"excludeDormant":true,"excludeSupportSensitive":true,"excludeDisputeActive":true}'::jsonb,'Marketplace Ops'),
  ('jobs_digest_candidates','Jobs digest — candidates','Candidates opted into jobs digest, not in trust hold.',
   '{"topics":["jobs_digest"],"userRoleHints":["guest","buyer","seller"],"excludeTrustHold":true,"excludeSupportSensitive":true}'::jsonb,'Jobs'),
  ('property_spotlights_engaged','Property spotlights — engaged','Subscribers opted into property spotlights with recent engagement.',
   '{"topics":["property_spotlights"],"minEngagementWithinDays":120,"excludeSupportSensitive":true,"excludeDisputeActive":true}'::jsonb,'Property'),
  ('care_seasonal_updates','Care — seasonal update subscribers','Care updates opted-in; excludes active disputes.',
   '{"topics":["care_updates"],"excludeDisputeActive":true,"excludeSupportSensitive":true}'::jsonb,'Care Ops'),
  ('learn_program_subscribers','Learn program subscribers','Learn program updates opted-in; excludes frozen accounts.',
   '{"topics":["learn_programs"],"excludeTrustHold":true}'::jsonb,'Learn Ops')
on conflict (key) do update
  set label = excluded.label,
      description = excluded.description,
      criteria = excluded.criteria,
      owner_team = excluded.owner_team;

commit;
