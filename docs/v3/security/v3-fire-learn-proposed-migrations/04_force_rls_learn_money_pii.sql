-- LRN-7 — Defense-in-depth: the Learn app reads/writes everything via service_role (bypasses RLS),
-- and no learn table is FORCE-RLS'd. FORCE subjects the table owner to policies too (service_role
-- keeps BYPASSRLS). Apply to the money/PII tables. Verify staff/service read paths first.

alter table public.learn_enrollments   force row level security;
alter table public.learn_payments       force row level security;
alter table public.learn_certificates   force row level security;
alter table public.learn_notifications  force row level security;
alter table public.learn_quiz_attempts  force row level security;
alter table public.learn_progress        force row level security;
