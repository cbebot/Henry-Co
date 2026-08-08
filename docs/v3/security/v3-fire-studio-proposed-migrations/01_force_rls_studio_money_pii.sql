-- STU-5 — Add a DB backstop under the service_role portal layer. All studio portal writes
-- flow through service_role (bypasses RLS) and no studio table is FORCE-RLS'd, so the money/PII
-- tables have no database-level safety net if the service key leaks or an app owner-filter is
-- forgotten. FORCE subjects the table owner to policies too (service_role keeps BYPASSRLS;
-- defense-in-depth + a launch invariant). Verify staff/service read paths are unaffected first.

alter table public.studio_invoices            force row level security;
alter table public.studio_payments            force row level security;
alter table public.studio_project_milestones  force row level security;
alter table public.studio_proposal_milestones force row level security;
alter table public.studio_proposals           force row level security;
alter table public.studio_leads               force row level security;
alter table public.studio_projects            force row level security;
alter table public.studio_notifications       force row level security;
alter table public.studio_brief_drafts        force row level security;
alter table public.studio_revisions           force row level security;

-- NOTE: when the V3-PASS-21 tables (studio_asset_packs, studio_payment_plans,
-- studio_payment_plan_releases, studio_proposal_signatures) are applied to prod, FORCE them too.
