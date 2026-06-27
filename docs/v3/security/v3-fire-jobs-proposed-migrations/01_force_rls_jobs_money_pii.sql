-- JOB-8 — Add a DB backstop under the service_role app layer. All jobs base-table access runs through
-- service_role (bypasses RLS) and no jobs table is FORCE-RLS'd. These tables hold candidate PII,
-- DM bodies, and offer/interview data; FORCE subjects the table owner to policies too (service_role
-- keeps BYPASSRLS — this is defense-in-depth + a launch invariant). Verify service_role read paths
-- are unaffected before applying.

alter table public.jobs_applications      force row level security;
alter table public.jobs_conversations     force row level security;
alter table public.jobs_messages          force row level security;
alter table public.jobs_interviews        force row level security;
alter table public.jobs_hiring_pipelines  force row level security;
alter table public.jobs_contact_masks     force row level security;
alter table public.jobs_moderation_queue  force row level security;
