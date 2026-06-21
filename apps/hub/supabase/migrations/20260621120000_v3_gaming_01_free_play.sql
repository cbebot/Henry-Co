-- ============================================================================
-- V3-GAMING-01 — Free-Play Arena Foundation ("Henry Onyx Live")
-- ----------------------------------------------------------------------------
-- The FREE-PLAY half only. NO money: no stake/escrow/wallet object, nothing in
-- payments_private, no ledger account. The real-money match-escrow layer is a
-- separate, later, LEGALLY-GATED migration (ARCHITECTURE.md §3.4, §9, §12).
--
-- Security spine (mirrors V3-57 + the SEC-HARDEN class):
--   * RLS default-deny on every table (enable, NOT force — SECDEF helpers bypass).
--   * Writes ONLY via grant-locked SECURITY DEFINER RPCs. Tables revoke
--     INSERT/UPDATE/DELETE from anon, authenticated, public (the Supabase grant
--     trap: a bare `revoke from anon` is a no-op while a `to public` grant
--     exists — so we revoke from public, anon, authenticated explicitly).
--   * Move log is APPEND-ONLY (revoked from ALL roles incl. service_role; only
--     the SECDEF apply_gaming_move owner inserts; a block trigger rejects
--     UPDATE/DELETE).
--   * Two-layer match state machine: enforce_gaming_match_transition (mirrors
--     the TS LEGAL_MATCH_TRANSITIONS exactly) + guard_gaming_match_completed
--     (only settle path may reach 'completed', via a txn-local marker).
--   * The secret commit-reveal server seed lives in its own table with NO client
--     read path, so it can never leak over Realtime before reveal.
--
-- Trust model for the service-role RPCs: they are revoked from anon/authenticated
-- (clients CANNOT call them — proven by gaming_grant_invariant.sql). The actor is
-- resolved by the authenticated apps/account server action from the session and
-- passed in; these functions additionally RE-VALIDATE participation. No
-- client-supplied id is ever trusted for authorization. Client-facing reads use
-- auth.uid()-derived RLS (gaming_match_signal) or a public-columns-only RPC.
--
-- Idempotent + existence-guarded. COMMITTED-NOT-APPLIED: apply owner-gated via
-- `supabase db query --linked` (one atomic txn), never `db push`.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

-- Catalog mirror (kept in lockstep with the TS GameId union).
create table if not exists public.gaming_games (
  id            text primary key,
  skill_weight  numeric not null,
  uses_randomness boolean not null,
  enabled       boolean not null default true,
  rules_doc_path text not null,
  created_at    timestamptz not null default now(),
  constraint gaming_games_id_valid check (id in ('onyx-lines', 'onyx-cards'))
);

create table if not exists public.gaming_profiles (
  user_id      uuid primary key,
  handle       text not null,
  rating       integer not null default 1200,
  wins         integer not null default 0,
  losses       integer not null default 0,
  ties         integer not null default 0,
  abandoned    integer not null default 0,
  achievements jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint gaming_profiles_handle_unique unique (handle),
  constraint gaming_profiles_handle_format check (handle ~ '^[a-z0-9_]{3,24}$')
);

create table if not exists public.gaming_matches (
  id                     uuid primary key default gen_random_uuid(),
  game_id                text not null references public.gaming_games (id),
  status                 text not null default 'lobby',
  created_by             uuid not null,
  winner_user_id         uuid,
  current_seq            bigint not null default 0,
  state                  jsonb,
  draw_seed              text,
  fairness_commitment    text,
  fairness_revealed_seed text,
  rating_recorded        boolean not null default false,
  created_at             timestamptz not null default now(),
  started_at             timestamptz,
  completed_at           timestamptz,
  updated_at             timestamptz not null default now(),
  constraint gaming_matches_status_valid
    check (status in ('lobby', 'matchmaking', 'in_progress', 'completed', 'abandoned'))
);

-- The SECRET commit-reveal server seed. NO client read path (RLS deny + no policy).
create table if not exists public.gaming_match_secrets (
  match_id    uuid primary key references public.gaming_matches (id) on delete cascade,
  server_seed text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.gaming_match_players (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references public.gaming_matches (id) on delete cascade,
  user_id     uuid not null,
  seat        smallint not null,
  client_seed text,
  joined_at   timestamptz not null default now(),
  constraint gaming_match_players_seat_valid check (seat in (0, 1)),
  constraint gaming_match_players_unique_user unique (match_id, user_id),
  constraint gaming_match_players_unique_seat unique (match_id, seat)
);

-- APPEND-ONLY authoritative move log (the replay + audit substrate).
create table if not exists public.gaming_match_moves (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references public.gaming_matches (id) on delete cascade,
  seq         bigint not null,
  user_id     uuid not null,
  seat        smallint not null,
  move        jsonb not null,
  state_hash  text not null,
  created_at  timestamptz not null default now(),
  constraint gaming_match_moves_unique_seq unique (match_id, seq)
);

-- Non-sensitive Realtime nudge (the ONLY table clients subscribe to).
create table if not exists public.gaming_match_signal (
  match_id   uuid primary key references public.gaming_matches (id) on delete cascade,
  seq        bigint not null default 0,
  status     text not null default 'lobby',
  updated_at timestamptz not null default now()
);

create table if not exists public.gaming_invitations (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.gaming_matches (id) on delete cascade,
  from_user  uuid not null,
  to_user    uuid not null,
  game_id    text not null references public.gaming_games (id),
  status     text not null default 'pending',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  constraint gaming_invitations_status_valid check (status in ('pending', 'accepted', 'declined', 'expired'))
);

-- Anti-collusion substrate: ordered pair -> how often they have been matched.
create table if not exists public.gaming_head_to_head (
  user_a          uuid not null,
  user_b          uuid not null,
  match_count     integer not null default 0,
  last_matched_at timestamptz not null default now(),
  primary key (user_a, user_b),
  constraint gaming_head_to_head_ordered check (user_a < user_b)
);

create index if not exists gaming_matches_open_idx
  on public.gaming_matches (game_id, status, created_at);
create index if not exists gaming_match_players_match_idx
  on public.gaming_match_players (match_id);
create index if not exists gaming_match_moves_match_idx
  on public.gaming_match_moves (match_id, seq);
create index if not exists gaming_invitations_to_user_idx
  on public.gaming_invitations (to_user, status);

-- ---------------------------------------------------------------------------
-- 2. RLS: enable everywhere; revoke client writes (the Supabase grant trap).
-- ---------------------------------------------------------------------------

alter table public.gaming_games          enable row level security;
alter table public.gaming_profiles       enable row level security;
alter table public.gaming_matches        enable row level security;
alter table public.gaming_match_secrets  enable row level security;
alter table public.gaming_match_players  enable row level security;
alter table public.gaming_match_moves    enable row level security;
alter table public.gaming_match_signal   enable row level security;
alter table public.gaming_invitations    enable row level security;
alter table public.gaming_head_to_head   enable row level security;

revoke insert, update, delete on public.gaming_games          from anon, authenticated, public;
revoke insert, update, delete on public.gaming_profiles       from anon, authenticated, public;
revoke insert, update, delete on public.gaming_matches        from anon, authenticated, public;
revoke insert, update, delete on public.gaming_match_secrets  from anon, authenticated, public;
revoke insert, update, delete on public.gaming_match_players  from anon, authenticated, public;
revoke insert, update, delete on public.gaming_match_signal   from anon, authenticated, public;
revoke insert, update, delete on public.gaming_invitations    from anon, authenticated, public;
revoke insert, update, delete on public.gaming_head_to_head   from anon, authenticated, public;

-- The move log is append-only for EVERYONE incl. service_role — only the SECDEF
-- apply_gaming_move owner inserts; the block trigger rejects UPDATE/DELETE.
revoke insert, update, delete on public.gaming_match_moves from anon, authenticated, public, service_role;

-- The secret seed is never written by anyone but the SECDEF owner functions.
revoke insert, update, delete on public.gaming_match_secrets from service_role;

-- Explicit client SELECT grants (RLS then filters WHICH rows). Real Supabase
-- grants these by default; we grant explicitly so the read policies also work on
-- a vanilla Postgres (CI / PGlite). ONLY these two tables are client-readable:
--   * gaming_games   — public read-only catalog
--   * gaming_match_signal — participant-scoped Realtime nudge (auth.uid() policy)
-- Every other table has NO client SELECT grant -> default-deny for clients.
grant select on public.gaming_games to anon, authenticated;
grant select on public.gaming_match_signal to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Trigger functions (all pinned search_path; revoked from client roles)
-- ---------------------------------------------------------------------------

create or replace function public.gaming_set_updated_at()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  new.updated_at := now();
  return new;
end $$;
revoke all on function public.gaming_set_updated_at() from public, anon, authenticated;

-- Transition enforcement — mirrors LEGAL_MATCH_TRANSITIONS EXACTLY. Keep in lockstep.
-- SECURITY INVOKER (least privilege): it only inspects NEW/OLD.status, reads no
-- tables, and the SECDEF writers already own the rows being updated.
create or replace function public.enforce_gaming_match_transition()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.status = old.status then
    return new; -- idempotent no-op (mirrors isLegalMatchTransition: from === to)
  end if;
  -- `* -> abandoned` = the 'abandoned' arm repeated in every non-terminal row.
  if (old.status = 'lobby'       and new.status in ('matchmaking', 'abandoned'))
     or (old.status = 'matchmaking' and new.status in ('in_progress', 'abandoned'))
     or (old.status = 'in_progress' and new.status in ('completed', 'abandoned')) then
    return new;
  end if;
  raise exception 'illegal gaming_match transition: % -> %', old.status, new.status
    using errcode = 'check_violation';
end $$;
revoke all on function public.enforce_gaming_match_transition() from public, anon, authenticated;

-- Completion guard — status may reach 'completed' ONLY via apply_gaming_move
-- (which sets the txn-local marker). The gaming analogue of "free-mark-paid".
create or replace function public.guard_gaming_match_completed()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if lower(coalesce(new.status, '')) = 'completed'
     and (tg_op = 'INSERT' or lower(coalesce(old.status, '')) <> 'completed') then
    if coalesce(current_setting('gaming.settling_match', true), 'off') <> 'on' then
      raise exception 'gaming_matches.status=completed only via apply_gaming_move()'
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.guard_gaming_match_completed() from public, anon, authenticated;

-- Append-only enforcement for the move log.
create or replace function public.block_gaming_move_mutation()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception 'gaming_match_moves is append-only (% rejected)', tg_op
    using errcode = 'check_violation';
end $$;
revoke all on function public.block_gaming_move_mutation() from public, anon, authenticated;

drop trigger if exists gaming_profiles_set_updated_at on public.gaming_profiles;
create trigger gaming_profiles_set_updated_at
  before update on public.gaming_profiles
  for each row execute function public.gaming_set_updated_at();

drop trigger if exists gaming_matches_enforce_transition on public.gaming_matches;
create trigger gaming_matches_enforce_transition
  before update on public.gaming_matches
  for each row execute function public.enforce_gaming_match_transition();

drop trigger if exists gaming_matches_guard_completed on public.gaming_matches;
create trigger gaming_matches_guard_completed
  before insert or update on public.gaming_matches
  for each row execute function public.guard_gaming_match_completed();

drop trigger if exists gaming_match_moves_append_only on public.gaming_match_moves;
create trigger gaming_match_moves_append_only
  before update or delete on public.gaming_match_moves
  for each row execute function public.block_gaming_move_mutation();

-- ---------------------------------------------------------------------------
-- 4. RLS helper + the only client-facing SELECT policies
-- ---------------------------------------------------------------------------

-- SECDEF participant check for the CALLER only (derives the user from auth.uid(),
-- never a parameter — so a signed-in user cannot probe other users' memberships).
-- enable-not-force tables let this bypass RLS internally -> no policy recursion.
create or replace function public.gaming_is_my_match(p_match_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.gaming_match_players
     where match_id = p_match_id and user_id = auth.uid()
  )
$$;
revoke all on function public.gaming_is_my_match(uuid) from public, anon;
grant execute on function public.gaming_is_my_match(uuid) to authenticated, service_role;

-- Catalog is public read-only.
drop policy if exists gaming_games_public_read on public.gaming_games;
create policy gaming_games_public_read on public.gaming_games
  for select to anon, authenticated using (true);

-- Participants may read their match's Realtime signal (auth.uid()-derived).
drop policy if exists gaming_match_signal_participant_read on public.gaming_match_signal;
create policy gaming_match_signal_participant_read on public.gaming_match_signal
  for select to authenticated
  using (public.gaming_is_my_match(match_id));

-- All other tables: NO client SELECT policy (default deny). Clients read via the
-- apps/account routes (service-role + session-redaction) or the public-columns
-- leaderboard RPC. service_role bypasses RLS for the server reads.

-- ---------------------------------------------------------------------------
-- 5. Helper: ensure a profile row exists (SECDEF owner; called by writers).
-- ---------------------------------------------------------------------------

create or replace function public.ensure_gaming_profile(p_user uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.gaming_profiles (user_id, handle)
  values (p_user, 'player_' || substr(md5(p_user::text), 1, 12))
  on conflict (user_id) do nothing;
end $$;
revoke all on function public.ensure_gaming_profile(uuid) from public, anon, authenticated;
grant execute on function public.ensure_gaming_profile(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 6. Writer RPCs — SERVICE-ROLE ONLY (clients cannot call them). Actor is
--    server-resolved + re-validated; never a client-trusted id for authz.
-- ---------------------------------------------------------------------------

create or replace function public.create_gaming_match(
  p_game_id text,
  p_created_by uuid,
  p_commitment text,
  p_server_seed text,
  p_uses_randomness boolean,
  p_client_seed text
) returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_id uuid := gen_random_uuid();
begin
  perform public.ensure_gaming_profile(p_created_by);
  insert into public.gaming_matches (id, game_id, status, created_by, fairness_commitment)
    values (v_id, p_game_id, 'lobby', p_created_by, p_commitment);
  if p_server_seed is not null then
    insert into public.gaming_match_secrets (match_id, server_seed) values (v_id, p_server_seed);
  end if;
  insert into public.gaming_match_players (match_id, user_id, seat, client_seed)
    values (v_id, p_created_by, 0, p_client_seed);
  insert into public.gaming_match_signal (match_id, seq, status) values (v_id, 0, 'lobby');
  return v_id;
end $$;
revoke all on function public.create_gaming_match(text, uuid, text, text, boolean, text)
  from public, anon, authenticated;
grant execute on function public.create_gaming_match(text, uuid, text, text, boolean, text)
  to service_role;

create or replace function public.join_gaming_match(
  p_match_id uuid,
  p_user_id uuid,
  p_client_seed text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_status text;
  v_count int;
  v_seat smallint;
begin
  select status into v_status from public.gaming_matches where id = p_match_id for update;
  if v_status is null then
    return jsonb_build_object('joined', false, 'full', false);
  end if;
  if v_status not in ('lobby', 'matchmaking') then
    return jsonb_build_object('joined', false, 'full', true);
  end if;
  if exists (select 1 from public.gaming_match_players where match_id = p_match_id and user_id = p_user_id) then
    return jsonb_build_object('joined', false, 'full', false);
  end if;
  select count(*) into v_count from public.gaming_match_players where match_id = p_match_id;
  if v_count >= 2 then
    return jsonb_build_object('joined', false, 'full', true);
  end if;
  v_seat := v_count; -- 0 already taken by creator -> joiner is seat 1
  perform public.ensure_gaming_profile(p_user_id);
  insert into public.gaming_match_players (match_id, user_id, seat, client_seed)
    values (p_match_id, p_user_id, v_seat, p_client_seed);
  if v_count + 1 = 2 then
    update public.gaming_matches set status = 'matchmaking', updated_at = now() where id = p_match_id;
    update public.gaming_match_signal set status = 'matchmaking', updated_at = now() where match_id = p_match_id;
    return jsonb_build_object('joined', true, 'seat', v_seat, 'full', true);
  end if;
  return jsonb_build_object('joined', true, 'seat', v_seat, 'full', false);
end $$;
revoke all on function public.join_gaming_match(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.join_gaming_match(uuid, uuid, text) to service_role;

create or replace function public.start_gaming_match(
  p_match_id uuid,
  p_state jsonb,
  p_draw_seed text
) returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.gaming_matches
    set status = 'in_progress', state = p_state, draw_seed = p_draw_seed,
        current_seq = 0, started_at = now(), updated_at = now()
  where id = p_match_id and status = 'matchmaking';
  if not found then
    return false;
  end if;
  update public.gaming_match_signal set seq = 0, status = 'in_progress', updated_at = now()
    where match_id = p_match_id;
  return true;
end $$;
revoke all on function public.start_gaming_match(uuid, jsonb, text) from public, anon, authenticated;
grant execute on function public.start_gaming_match(uuid, jsonb, text) to service_role;

create or replace function public.apply_gaming_move(
  p_match_id uuid,
  p_expected_seq bigint,
  p_seat int,
  p_actor uuid,
  p_move jsonb,
  p_new_state jsonb,
  p_state_hash text,
  p_new_status text,
  p_winner_user_id uuid,
  p_rating0 integer,    -- server-computed Elo for seat 0 (terminal moves only)
  p_rating1 integer,    -- server-computed Elo for seat 1 (terminal moves only)
  p_result0 numeric     -- seat-0-relative result: 1 win, 0 loss, 0.5 tie
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_affected integer := 0;
  v_new_seq bigint;
  v_seat0 uuid;
  v_seat1 uuid;
begin
  -- actor MUST be the seated player in the claimed seat (defense in depth; the
  -- client can never reach this RPC, but we re-validate anyway).
  if not exists (
    select 1 from public.gaming_match_players
     where match_id = p_match_id and user_id = p_actor and seat = p_seat
  ) then
    raise exception 'apply_gaming_move: actor is not the seated player' using errcode = '42501';
  end if;

  -- optimistic mutex: only the move matching the CURRENT seq commits (one move/turn).
  update public.gaming_matches
    set current_seq = p_expected_seq + 1, state = p_new_state, updated_at = now()
  where id = p_match_id and status = 'in_progress' and current_seq = p_expected_seq;
  get diagnostics v_affected = row_count;
  if v_affected = 0 then
    return jsonb_build_object('applied', false, 'reason', 'stale_or_conflict');
  end if;
  v_new_seq := p_expected_seq + 1;

  insert into public.gaming_match_moves (match_id, seq, user_id, seat, move, state_hash)
    values (p_match_id, p_expected_seq, p_actor, p_seat, p_move, p_state_hash);

  if p_new_status = 'completed' then
    -- ONE transaction: complete the match AND record ratings/stats atomically, so
    -- a crash can never strand a completed match with unrecorded stats. Only this
    -- path may complete a match (txn-local marker -> completion guard passes); the
    -- rating_recorded=false guard makes it idempotent.
    perform set_config('gaming.settling_match', 'on', true);
    update public.gaming_matches
      set status = 'completed', winner_user_id = p_winner_user_id, completed_at = now(),
          rating_recorded = true,
          fairness_revealed_seed = (select server_seed from public.gaming_match_secrets where match_id = p_match_id)
    where id = p_match_id and rating_recorded = false;
    get diagnostics v_affected = row_count;
    if v_affected > 0 then
      select user_id into v_seat0 from public.gaming_match_players where match_id = p_match_id and seat = 0;
      select user_id into v_seat1 from public.gaming_match_players where match_id = p_match_id and seat = 1;
      if p_rating0 is not null then update public.gaming_profiles set rating = p_rating0 where user_id = v_seat0; end if;
      if p_rating1 is not null then update public.gaming_profiles set rating = p_rating1 where user_id = v_seat1; end if;
      if p_result0 = 1 then
        update public.gaming_profiles set wins = wins + 1 where user_id = v_seat0;
        update public.gaming_profiles set losses = losses + 1 where user_id = v_seat1;
      elsif p_result0 = 0 then
        update public.gaming_profiles set losses = losses + 1 where user_id = v_seat0;
        update public.gaming_profiles set wins = wins + 1 where user_id = v_seat1;
      elsif p_result0 = 0.5 then
        update public.gaming_profiles set ties = ties + 1 where user_id = v_seat0;
        update public.gaming_profiles set ties = ties + 1 where user_id = v_seat1;
      end if;
      -- anti-collusion head-to-head (ordered pair)
      if v_seat0 is not null and v_seat1 is not null then
        insert into public.gaming_head_to_head (user_a, user_b, match_count, last_matched_at)
        values (least(v_seat0, v_seat1), greatest(v_seat0, v_seat1), 1, now())
        on conflict (user_a, user_b)
          do update set match_count = public.gaming_head_to_head.match_count + 1, last_matched_at = now();
      end if;
    end if;
    perform set_config('gaming.settling_match', 'off', true);
  end if;

  update public.gaming_match_signal
    set seq = v_new_seq,
        status = (select status from public.gaming_matches where id = p_match_id),
        updated_at = now()
  where match_id = p_match_id;

  return jsonb_build_object('applied', true, 'new_seq', v_new_seq);
end $$;
revoke all on function public.apply_gaming_move(uuid, bigint, int, uuid, jsonb, jsonb, text, text, uuid, integer, integer, numeric)
  from public, anon, authenticated;
grant execute on function public.apply_gaming_move(uuid, bigint, int, uuid, jsonb, jsonb, text, text, uuid, integer, integer, numeric)
  to service_role;

create or replace function public.abandon_gaming_match(
  p_match_id uuid,
  p_actor uuid
) returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not exists (
    select 1 from public.gaming_match_players where match_id = p_match_id and user_id = p_actor
  ) then
    raise exception 'abandon_gaming_match: actor is not a participant' using errcode = '42501';
  end if;
  update public.gaming_matches set status = 'abandoned', updated_at = now()
    where id = p_match_id and status in ('lobby', 'matchmaking', 'in_progress');
  if not found then
    return false;
  end if;
  update public.gaming_profiles set abandoned = abandoned + 1 where user_id = p_actor;
  update public.gaming_match_signal set status = 'abandoned', updated_at = now() where match_id = p_match_id;
  return true;
end $$;
revoke all on function public.abandon_gaming_match(uuid, uuid) from public, anon, authenticated;
grant execute on function public.abandon_gaming_match(uuid, uuid) to service_role;

create or replace function public.set_gaming_handle(p_user uuid, p_handle text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.ensure_gaming_profile(p_user);
  update public.gaming_profiles set handle = lower(p_handle) where user_id = p_user;
  return true;
end $$;
revoke all on function public.set_gaming_handle(uuid, text) from public, anon, authenticated;
grant execute on function public.set_gaming_handle(uuid, text) to service_role;

create or replace function public.resolve_gaming_handle(p_handle text)
returns uuid language sql stable security definer set search_path = public, pg_temp as $$
  select user_id from public.gaming_profiles where handle = lower(p_handle)
$$;
revoke all on function public.resolve_gaming_handle(text) from public, anon, authenticated;
grant execute on function public.resolve_gaming_handle(text) to service_role;

create or replace function public.create_gaming_invitation(
  p_match_id uuid,
  p_from_user uuid,
  p_to_user uuid,
  p_game_id text
) returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.gaming_invitations (match_id, from_user, to_user, game_id)
    values (p_match_id, p_from_user, p_to_user, p_game_id);
  return true;
end $$;
revoke all on function public.create_gaming_invitation(uuid, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.create_gaming_invitation(uuid, uuid, uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- 7. Server read RPCs — SERVICE-ROLE ONLY (called by apps/account routes).
-- ---------------------------------------------------------------------------

create or replace function public.get_gaming_match_full(p_match_id uuid)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'id', m.id,
    'game_id', m.game_id,
    'status', m.status,
    'created_by', m.created_by,
    'winner_user_id', m.winner_user_id,
    'current_seq', m.current_seq,
    'state', m.state,
    'fairness_commitment', m.fairness_commitment,
    'fairness_revealed_seed', m.fairness_revealed_seed,
    'fairness_server_seed', s.server_seed,
    'players', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user_id', p.user_id, 'seat', p.seat, 'client_seed', p.client_seed,
        'rating', coalesce(pr.rating, 1200), 'handle', coalesce(pr.handle, 'player')
      ) order by p.seat)
      from public.gaming_match_players p
      left join public.gaming_profiles pr on pr.user_id = p.user_id
      where p.match_id = m.id
    ), '[]'::jsonb)
  )
  from public.gaming_matches m
  left join public.gaming_match_secrets s on s.match_id = m.id
  where m.id = p_match_id
$$;
revoke all on function public.get_gaming_match_full(uuid) from public, anon, authenticated;
grant execute on function public.get_gaming_match_full(uuid) to service_role;

create or replace function public.list_open_gaming_matches(
  p_game_id text,
  p_exclude_user uuid,
  p_limit integer
) returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(row order by row->>'created_at'), '[]'::jsonb) from (
    select jsonb_build_object(
      'id', m.id, 'game_id', m.game_id, 'created_by', m.created_by,
      'status', m.status, 'created_at', m.created_at
    ) as row, m.created_at
    from public.gaming_matches m
    where m.game_id = p_game_id
      and m.status = 'lobby'
      and m.created_by <> p_exclude_user
      and (select count(*) from public.gaming_match_players p where p.match_id = m.id) = 1
      -- anti-collusion: skip creators this viewer has faced too often in-window.
      and coalesce((
        select hh.match_count from public.gaming_head_to_head hh
        where hh.user_a = least(m.created_by, p_exclude_user)
          and hh.user_b = greatest(m.created_by, p_exclude_user)
      ), 0) < 5
    order by m.created_at asc
    limit least(coalesce(p_limit, 20), 50)
  ) t
$$;
revoke all on function public.list_open_gaming_matches(text, uuid, integer) from public, anon, authenticated;
grant execute on function public.list_open_gaming_matches(text, uuid, integer) to service_role;

create or replace function public.get_my_gaming_invitations(p_user uuid)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', i.id, 'match_id', i.match_id, 'game_id', i.game_id,
    'from_handle', coalesce(pr.handle, 'player'), 'created_at', i.created_at
  )), '[]'::jsonb)
  from public.gaming_invitations i
  left join public.gaming_profiles pr on pr.user_id = i.from_user
  where i.to_user = p_user and i.status = 'pending' and i.expires_at > now()
$$;
revoke all on function public.get_my_gaming_invitations(uuid) from public, anon, authenticated;
grant execute on function public.get_my_gaming_invitations(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 8. Public read RPC — leaderboard (PUBLIC COLUMNS ONLY; no actor; no IDOR).
-- ---------------------------------------------------------------------------

create or replace function public.get_gaming_leaderboard(p_limit integer)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(row), '[]'::jsonb) from (
    select jsonb_build_object(
      'handle', handle, 'rating', rating, 'wins', wins, 'losses', losses, 'ties', ties
    ) as row
    from public.gaming_profiles
    order by rating desc, wins desc
    limit least(coalesce(p_limit, 25), 100)
  ) t
$$;
revoke all on function public.get_gaming_leaderboard(integer) from public;
grant execute on function public.get_gaming_leaderboard(integer) to anon, authenticated, service_role;

-- Public fairness verifier substrate: ANYONE may read a COMPLETED match's
-- commitment + revealed seed to confirm the deal was fair. Reveals nothing before
-- completion and never exposes the secret seed table or any private state.
create or replace function public.get_gaming_match_fairness(p_match_id uuid)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select case
    when status = 'completed' then jsonb_build_object(
      'status', status, 'game_id', game_id,
      'commitment', fairness_commitment, 'revealed_seed', fairness_revealed_seed)
    else jsonb_build_object('status', status, 'game_id', game_id)
  end
  from public.gaming_matches where id = p_match_id
$$;
revoke all on function public.get_gaming_match_fairness(uuid) from public;
grant execute on function public.get_gaming_match_fairness(uuid) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 9. Seed the catalog mirror (idempotent).
-- ---------------------------------------------------------------------------

insert into public.gaming_games (id, skill_weight, uses_randomness, rules_doc_path) values
  ('onyx-lines', 1.00, false, 'docs/gaming/onyx-lines-rules.md'),
  ('onyx-cards', 0.92, true,  'docs/gaming/onyx-cards-rules.md')
on conflict (id) do update
  set skill_weight = excluded.skill_weight,
      uses_randomness = excluded.uses_randomness,
      rules_doc_path = excluded.rules_doc_path;
