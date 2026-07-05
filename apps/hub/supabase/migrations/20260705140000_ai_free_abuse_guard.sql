-- =============================================================================
-- AI FREE ABUSE GUARD — durable per-actor state (pass 2)
-- =============================================================================
-- Free AI (support chat, the brief coach) is a real cost, and a few people burn it. Pass 1
-- added a cheap pre-model junk filter + graduated policy in @henryco/ai-gateway. This is the
-- durable half: a small per-actor ledger so misuse is tracked ACROSS sessions (an anonymous
-- abuser who clears cookies still keys by IP), the anonymous "sign in to continue" taste limit
-- can bind, and repeat offenders get their FREE AI restricted for a cooling-off window.
--
-- The line that must not be crossed: this ledger is written and read ONLY by the governed
-- account server on the service role, through the two RPCs below. RLS is default-deny; no client
-- can read or write it. The abuse thresholds live in TS (the gateway engine) and are PASSED IN,
-- so there is one source of truth.
-- =============================================================================

create table if not exists public.ai_free_actor_state (
  -- 'u:<auth uid>' for a signed-in person, or 'ip:<sha256 of ip>' for an anonymous visitor.
  actor_key         text primary key,
  actor_type        text not null check (actor_type in ('user', 'ip')),
  -- The day the counts below belong to; a new day resets them (handled in the RPCs).
  window_day        date not null default current_date,
  turns             integer not null default 0,
  refused           integer not null default 0,
  -- Set when the actor tripped the refusal threshold; their free AI is held until this time.
  restricted_until  timestamptz,
  updated_at        timestamptz not null default now()
);

create index if not exists ai_free_actor_state_restricted_idx
  on public.ai_free_actor_state (restricted_until) where restricted_until is not null;

alter table public.ai_free_actor_state enable row level security;
-- No policy by design: default-deny. Only the service role (which bypasses RLS) touches it,
-- and only through the SECURITY DEFINER RPCs below.

-- -----------------------------------------------------------------------------
-- Read the current window state for the pre-model access decision. A new day reads as zero.
-- -----------------------------------------------------------------------------
create or replace function public.ai_free_guard_state(p_actor_key text)
returns table (turns integer, refused integer, restricted_until timestamptz)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    case when s.window_day = current_date then s.turns else 0 end,
    case when s.window_day = current_date then s.refused else 0 end,
    s.restricted_until
  from public.ai_free_actor_state s
  where s.actor_key = p_actor_key
$$;

revoke all on function public.ai_free_guard_state(text) from public;
grant execute on function public.ai_free_guard_state(text) to service_role;

-- -----------------------------------------------------------------------------
-- Record a completed free turn: bump turns (+refused when the turn was a refusal/abuse), reset
-- the window on a new day, and trip a restriction when refusals cross the caller-supplied
-- threshold. Returns the updated window state. Atomic (single upsert + a guarded update).
-- -----------------------------------------------------------------------------
create or replace function public.ai_free_guard_record(
  p_actor_key       text,
  p_actor_type      text,
  p_refused         boolean,
  p_threshold       integer,
  p_restrict_seconds integer
)
returns table (turns integer, refused integer, restricted_until timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_turns integer;
  v_refused integer;
  v_restricted timestamptz;
begin
  insert into public.ai_free_actor_state (actor_key, actor_type, window_day, turns, refused)
    values (p_actor_key, p_actor_type, current_date, 1, case when p_refused then 1 else 0 end)
  on conflict (actor_key) do update set
    turns = case when public.ai_free_actor_state.window_day = current_date
                 then public.ai_free_actor_state.turns + 1 else 1 end,
    refused = case when public.ai_free_actor_state.window_day = current_date
                   then public.ai_free_actor_state.refused + (case when p_refused then 1 else 0 end)
                   else (case when p_refused then 1 else 0 end) end,
    window_day = current_date,
    updated_at = now()
  returning public.ai_free_actor_state.turns,
            public.ai_free_actor_state.refused,
            public.ai_free_actor_state.restricted_until
    into v_turns, v_refused, v_restricted;

  -- Graduated: only trip a NEW hold when refusals cross the threshold and none is already live.
  if v_refused >= p_threshold and (v_restricted is null or v_restricted < now()) then
    v_restricted := now() + make_interval(secs => greatest(0, p_restrict_seconds));
    update public.ai_free_actor_state
      set restricted_until = v_restricted, updated_at = now()
      where actor_key = p_actor_key;
  end if;

  return query select v_turns, v_refused, v_restricted;
end
$$;

revoke all on function public.ai_free_guard_record(text, text, boolean, integer, integer) from public;
grant execute on function public.ai_free_guard_record(text, text, boolean, integer, integer) to service_role;
