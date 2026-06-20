-- =============================================================================
-- V3-70 — Employer Hiring Suite · S2/S3/S4: collaboration spine
-- =============================================================================
-- Builds the enterprise collaboration layer on the prod-actual jobs_* table model
-- (jobs_applications.current_stage, jobs_hiring_pipelines.stages jsonb). All three
-- new tables are RLS-gated to the hiring team via
-- is_hiring_team_member_for_application() (S1). Writes are service-role-only
-- (SEC-HARDEN posture: revoke authenticated writes; authenticated keeps only
-- RLS-gated SELECT). Candidate-supplied data here is NEVER candidate-readable —
-- candidates are not business members, so the predicate denies them.
--
-- Depends on: 20260620130000_v3_70_hiring_business_scope.sql (the predicates).
-- Posture: ADDITIVE + committed-NOT-applied. No money mutation.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- S2 — stage-change audit trail
-- -----------------------------------------------------------------------------
create table if not exists public.jobs_application_stage_events (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.jobs_applications(id) on delete cascade,
  from_stage     text,
  to_stage       text not null,
  actor_user_id  uuid references auth.users(id) on delete set null,
  occurred_at    timestamptz not null default now()
);
create index if not exists jobs_application_stage_events_app_idx
  on public.jobs_application_stage_events (application_id, occurred_at desc);

-- -----------------------------------------------------------------------------
-- S3 — structured candidate scoring (idempotent per scorer/rubric/stage)
-- -----------------------------------------------------------------------------
create table if not exists public.jobs_application_scores (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.jobs_applications(id) on delete cascade,
  stage          text not null,
  scorer_user_id uuid not null references auth.users(id) on delete cascade,
  rubric_key     text not null,
  score          int  not null check (score between 1 and 5),
  comment        text,
  created_at     timestamptz not null default timezone('utc', now()),
  updated_at     timestamptz not null default timezone('utc', now()),
  unique (application_id, stage, scorer_user_id, rubric_key)
);
create index if not exists jobs_application_scores_app_idx
  on public.jobs_application_scores (application_id);

-- Team-aggregated read model: per-rubric mean + overall mean + scorer count, with
-- a reserved nullable predictive_score column for the future V3-41 quality model
-- (rendered when present, never blocking). security_invoker so the underlying
-- jobs_application_scores RLS applies through the view (avoids security-definer-view
-- advisor warning); the app reads it via service-role which bypasses RLS anyway.
create or replace view public.jobs_application_score_summary
with (security_invoker = on) as
with per_rubric as (
  select application_id,
         rubric_key,
         round(avg(score)::numeric, 2) as rubric_mean,
         count(*)                      as rubric_count
  from public.jobs_application_scores
  group by application_id, rubric_key
)
select
  sc.application_id,
  count(distinct sc.scorer_user_id)        as scorer_count,
  count(*)                                 as score_count,
  round(avg(sc.score)::numeric, 2)         as overall_mean,
  (
    select jsonb_object_agg(pr.rubric_key,
             jsonb_build_object('mean', pr.rubric_mean, 'count', pr.rubric_count))
    from per_rubric pr
    where pr.application_id = sc.application_id
  )                                        as rubric_means,
  null::numeric                            as predictive_score
from public.jobs_application_scores sc
group by sc.application_id;

-- -----------------------------------------------------------------------------
-- S4 — internal team notes thread (+ @mentions). Distinct from the candidate-
-- visible jobs_conversations/jobs_messages thread: this is operator-only.
-- -----------------------------------------------------------------------------
create table if not exists public.jobs_application_team_notes (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.jobs_applications(id) on delete cascade,
  parent_note_id uuid references public.jobs_application_team_notes(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  body           text not null check (char_length(btrim(body)) > 0),
  mentions       uuid[] not null default '{}',
  created_at     timestamptz not null default timezone('utc', now()),
  updated_at     timestamptz not null default timezone('utc', now())
);
create index if not exists jobs_application_team_notes_app_idx
  on public.jobs_application_team_notes (application_id, created_at);
create index if not exists jobs_application_team_notes_parent_idx
  on public.jobs_application_team_notes (parent_note_id)
  where parent_note_id is not null;

-- -----------------------------------------------------------------------------
-- Row Level Security — default-deny; authenticated gets RLS-gated SELECT only;
-- writes are service-role-only (the app mutates via createAdminSupabase after a
-- server-side resolveActingContext membership check). Mirrors SEC-HARDEN-03/04.
-- -----------------------------------------------------------------------------
alter table public.jobs_application_stage_events enable row level security;
alter table public.jobs_application_scores       enable row level security;
alter table public.jobs_application_team_notes   enable row level security;

revoke all on public.jobs_application_stage_events from anon;
revoke all on public.jobs_application_scores       from anon;
revoke all on public.jobs_application_team_notes   from anon;
revoke insert, update, delete on public.jobs_application_stage_events from authenticated;
revoke insert, update, delete on public.jobs_application_scores       from authenticated;
revoke insert, update, delete on public.jobs_application_team_notes   from authenticated;

drop policy if exists jobs_application_stage_events_team_read on public.jobs_application_stage_events;
create policy jobs_application_stage_events_team_read on public.jobs_application_stage_events
  for select to authenticated
  using (public.is_hiring_team_member_for_application(application_id));

drop policy if exists jobs_application_scores_team_read on public.jobs_application_scores;
create policy jobs_application_scores_team_read on public.jobs_application_scores
  for select to authenticated
  using (public.is_hiring_team_member_for_application(application_id));

drop policy if exists jobs_application_team_notes_team_read on public.jobs_application_team_notes;
create policy jobs_application_team_notes_team_read on public.jobs_application_team_notes
  for select to authenticated
  using (public.is_hiring_team_member_for_application(application_id));

-- -----------------------------------------------------------------------------
-- S2 — bulk stage move RPC: all-or-nothing, audited, business-membership-checked.
-- SERVICE-ROLE ONLY: the jobs route calls it via the service-role admin client
-- AFTER resolveActingContext has server-verified the actor's membership; both
-- p_actor and p_business are REQUIRED and re-validated here (defense in depth).
-- It is deliberately NOT granted to `authenticated` — were it, an authenticated
-- caller could pass a spoofed p_actor (a victim business's member id) and move
-- that business's applications, since the SECURITY DEFINER body bypasses RLS.
-- Aborts the WHOLE batch if any application is cross-business / invalid / missing.
-- -----------------------------------------------------------------------------
create or replace function public.move_applications_to_stage(
  p_application_ids uuid[],
  p_to_stage        text,
  p_actor           uuid,
  p_business        uuid
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor    uuid := p_actor;
  v_expected int  := (select count(distinct x) from unnest(coalesce(p_application_ids, '{}'::uuid[])) as x);
  v_found    int;
  v_app      record;
  v_moved    int := 0;
begin
  if v_actor is null or p_business is null then
    raise exception 'actor and business are required' using errcode = '42501';
  end if;
  if p_to_stage is null or btrim(p_to_stage) = '' then
    raise exception 'target stage required';
  end if;
  if v_expected = 0 then
    raise exception 'no applications supplied';
  end if;

  -- Every supplied id must resolve to a real application (no silent drops).
  select count(distinct a.id) into v_found
    from public.jobs_applications a
    where a.id = any(p_application_ids);
  if v_found <> v_expected then
    raise exception 'one or more applications were not found';
  end if;

  -- Validate EVERY application before mutating anything (no partial moves).
  for v_app in
    select a.id, p.business_id, p.stages
    from public.jobs_applications a
    join public.jobs_hiring_pipelines p on p.id = a.pipeline_id
    where a.id = any(p_application_ids)
  loop
    if v_app.business_id is null then
      raise exception 'application % belongs to an unbound pipeline', v_app.id;
    end if;
    if v_app.business_id <> p_business then
      raise exception 'application % is outside the acting business', v_app.id;
    end if;
    if not public.is_business_member(v_app.business_id, v_actor) then
      raise exception 'actor is not a member of the owning business';
    end if;
    if not (v_app.stages ? p_to_stage) then
      raise exception 'stage % is not valid for the pipeline', p_to_stage;
    end if;
  end loop;

  -- Apply: update current_stage + write one audit event per actual move.
  for v_app in
    select a.id, a.current_stage
    from public.jobs_applications a
    where a.id = any(p_application_ids)
  loop
    if v_app.current_stage is distinct from p_to_stage then
      update public.jobs_applications
        set current_stage = p_to_stage, updated_at = now()
        where id = v_app.id;
      insert into public.jobs_application_stage_events
        (application_id, from_stage, to_stage, actor_user_id)
        values (v_app.id, v_app.current_stage, p_to_stage, v_actor);
      v_moved := v_moved + 1;
    end if;
  end loop;

  return v_moved;
end
$$;

-- Service-role only (NOT authenticated): the route calls it via the admin client
-- after a server-side membership check; an authenticated grant would expose the
-- spoofable-p_actor escalation described in the function header.
revoke all on function public.move_applications_to_stage(uuid[], text, uuid, uuid) from public, authenticated;
grant execute on function public.move_applications_to_stage(uuid[], text, uuid, uuid) to service_role;

comment on table public.jobs_application_stage_events is
  'V3-70: append-only audit of hiring-pipeline stage moves (one row per move). RLS: hiring-team read; writes service-role/RPC only.';
comment on table public.jobs_application_scores is
  'V3-70: structured candidate scores (1-5) per scorer/rubric/stage; idempotent via the unique key. Never candidate-readable.';
comment on table public.jobs_application_team_notes is
  'V3-70: operator-only threaded internal notes + @mentions. Distinct from candidate-visible jobs_messages. Never candidate-readable.';
comment on function public.move_applications_to_stage(uuid[], text, uuid, uuid) is
  'V3-70: all-or-nothing bulk stage move; validates business membership + stage validity per application; audits each move.';
