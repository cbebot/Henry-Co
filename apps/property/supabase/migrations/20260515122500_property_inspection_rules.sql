-- V3 PASS 21 — Property: inspection rules engine.
--
-- WHY:
--   /docs/property-inspection-eligibility-rules.md defines when an
--   inspection should be required. Today that decision is hard-coded
--   inside policy.ts. This migration moves the rules into data so
--   moderation operators can edit thresholds, add new triggers, or
--   waive paths without a code deploy.
--
-- TABLES:
--   property_inspection_rules        — canonical rules catalog
--   property_inspection_rule_evaluations — append-only audit of decisions
--
-- RULE SHAPE (criteria jsonb):
--   { "service_type"?: [...], "intent"?: [...], "kind"?: [...],
--     "min_price"?: number, "max_price"?: number,
--     "min_risk_score"?: number, "max_risk_score"?: number,
--     "requires_authority_proof"?: boolean,
--     "requires_management_authorization"?: boolean }
--
--   The rule MATCHES if every present clause matches the submission.
--   "require_inspection" decides whether a match triggers inspection.
--   "block_publication" decides whether a match should hold publication.
--
-- IDEMPOTENT: yes.

create table if not exists public.property_inspection_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  name text not null,
  description text not null default '',
  criteria jsonb not null default '{}'::jsonb,
  require_inspection boolean not null default true,
  block_publication boolean not null default false,
  priority integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_property_inspection_rules_active
  on public.property_inspection_rules (priority desc)
  where is_active;

create table if not exists public.property_inspection_rule_evaluations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.property_listings(id) on delete cascade,
  submission_id uuid references public.property_listing_applications(id) on delete set null,
  rule_id uuid references public.property_inspection_rules(id) on delete set null,
  rule_key text not null,
  matched boolean not null,
  require_inspection boolean not null,
  block_publication boolean not null,
  reason text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_property_inspection_rule_evals_listing
  on public.property_inspection_rule_evaluations (listing_id, created_at desc);
create index if not exists idx_property_inspection_rule_evals_rule
  on public.property_inspection_rule_evaluations (rule_id, created_at desc);

alter table public.property_inspection_rules enable row level security;
alter table public.property_inspection_rule_evaluations enable row level security;

drop policy if exists "staff can manage inspection rules"
  on public.property_inspection_rules;
create policy "staff can manage inspection rules"
on public.property_inspection_rules
for all
using (public.is_property_staff())
with check (public.is_property_staff());

drop policy if exists "staff can read inspection rules"
  on public.property_inspection_rules;
create policy "staff can read inspection rules"
on public.property_inspection_rules
for select
using (public.is_property_staff());

drop policy if exists "staff can read inspection rule evaluations"
  on public.property_inspection_rule_evaluations;
create policy "staff can read inspection rule evaluations"
on public.property_inspection_rule_evaluations
for select
using (public.is_property_staff());

drop policy if exists "staff can insert inspection rule evaluations"
  on public.property_inspection_rule_evaluations;
create policy "staff can insert inspection rule evaluations"
on public.property_inspection_rule_evaluations
for insert
with check (public.is_property_staff());

drop trigger if exists trg_property_inspection_rules_updated_at
  on public.property_inspection_rules;
create trigger trg_property_inspection_rules_updated_at
before update on public.property_inspection_rules
for each row execute function public.set_updated_at();

-- Seed the documented rules so the engine has a baseline on day one.
-- Each seed is idempotent on rule_key (unique key collision = update).
insert into public.property_inspection_rules
  (rule_key, name, description, criteria, require_inspection, block_publication, priority)
values
  (
    'rule.intent_inspection_request',
    'Owner explicitly requested inspection',
    'When the submission intent is `inspection_request` the rule fires unconditionally.',
    jsonb_build_object('intent', jsonb_build_array('inspection_request')),
    true,
    false,
    900
  ),
  (
    'rule.managed_property',
    'Managed-property always inspects',
    'Managed listings require a HenryCo agent on site before HenryCo accepts the operating handoff.',
    jsonb_build_object('service_type', jsonb_build_array('managed_property')),
    true,
    false,
    850
  ),
  (
    'rule.verified_property',
    'Verified-property listings require inspection',
    'Verified-property is a premium trust tier; HenryCo confirms in person before applying the badge.',
    jsonb_build_object('service_type', jsonb_build_array('verified_property')),
    true,
    false,
    800
  ),
  (
    'rule.land',
    'Land listings always inspect',
    'Land has unique fraud + boundary risk; site verification is non-negotiable.',
    jsonb_build_object('service_type', jsonb_build_array('land')),
    true,
    false,
    750
  ),
  (
    'rule.high_risk_score',
    'High risk score triggers inspection',
    'Listings with a policy risk score at or above 76 are routed through inspection.',
    jsonb_build_object('min_risk_score', 76),
    true,
    false,
    600
  ),
  (
    'rule.high_value_sale',
    'High-value sale routes through inspection',
    'Sale listings priced at or above 50,000,000 NGN are routed through inspection.',
    jsonb_build_object(
      'service_type', jsonb_build_array('sale'),
      'min_price', 50000000
    ),
    true,
    false,
    500
  )
on conflict (rule_key) do update
  set name = excluded.name,
      description = excluded.description,
      criteria = excluded.criteria,
      require_inspection = excluded.require_inspection,
      block_publication = excluded.block_publication,
      priority = excluded.priority,
      updated_at = timezone('utc', now());
