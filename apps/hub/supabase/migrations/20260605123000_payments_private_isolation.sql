-- V3-15-S3: payments_private schema isolation (defense BY CONSTRUCTION).
--
-- Moves the money writers + the BEFORE-UPDATE trigger functions OUT of the
-- PostgREST-exposed `public` schema into a NON-exposed `payments_private` schema.
-- Because PostgREST only serves its configured (exposed) schemas, these functions
-- become unreachable via /rest/v1/rpc/ for EVERY role by construction — no longer
-- relying on remembering to revoke the Supabase default-privilege grants on each
-- new function (the FIX-01 trap). The account routes call them via a pooled
-- direct-Postgres connection (service_role/postgres), never via supabase-js.
--
-- Depends on 20260529120000_payment_intents.sql (tables + the public functions).
-- Apply ORDER matters: recreate in payments_private → re-point triggers → drop public.

create schema if not exists payments_private;
revoke all on schema payments_private from public;
revoke usage on schema payments_private from anon, authenticated;
grant usage on schema payments_private to service_role;

-- ============ trigger functions → payments_private ============
create or replace function payments_private.payments_set_updated_at()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  new.updated_at = now();
  return new;
end $$;
revoke all on function payments_private.payments_set_updated_at() from public, anon, authenticated;

create or replace function payments_private.enforce_payment_intent_transition()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.status = old.status then
    return new;
  end if;
  if (old.status = 'pending' and new.status in ('processing','cancelled'))
     or (old.status = 'processing' and new.status in ('succeeded','failed'))
     or (old.status = 'succeeded' and new.status = 'refund_processing')
     or (old.status = 'refund_processing' and new.status in ('refunded','succeeded')) then
    return new;
  end if;
  raise exception 'illegal payment_intent transition: % -> %', old.status, new.status
    using errcode = 'check_violation';
end $$;
revoke all on function payments_private.enforce_payment_intent_transition() from public, anon, authenticated;

-- re-point the BEFORE-UPDATE triggers to the relocated functions BEFORE dropping the public copies
drop trigger if exists payment_intents_set_updated_at on public.payment_intents;
create trigger payment_intents_set_updated_at
  before update on public.payment_intents
  for each row execute function payments_private.payments_set_updated_at();

drop trigger if exists payment_intents_enforce_transition on public.payment_intents;
create trigger payment_intents_enforce_transition
  before update on public.payment_intents
  for each row execute function payments_private.enforce_payment_intent_transition();

drop function if exists public.payments_set_updated_at();
drop function if exists public.enforce_payment_intent_transition();

-- ============ Q1 guarded synchronous advance → payments_private ============
create or replace function payments_private.advance_payment_intent(p_intent_id uuid, p_from text, p_to text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_affected integer := 0;
begin
  if not (
       (p_from = 'pending'           and p_to = 'processing')
    or (p_from = 'succeeded'         and p_to = 'refund_processing')
    or (p_from = 'refund_processing' and p_to = 'succeeded')
  ) then
    raise exception 'advance_payment_intent: non-whitelisted edge % -> %', p_from, p_to
      using errcode = 'check_violation';
  end if;
  update public.payment_intents
     set status = p_to
   where id = p_intent_id and status = p_from;
  get diagnostics v_affected = row_count;
  return jsonb_build_object('advanced', v_affected > 0);
end $$;
revoke all on function payments_private.advance_payment_intent(uuid, text, text) from public, anon, authenticated;
grant execute on function payments_private.advance_payment_intent(uuid, text, text) to service_role;

-- ============ A3 webhook apply RPC → payments_private ============
create or replace function payments_private.apply_payment_webhook(p_provider text, p_provider_event_id text, p_intent_id uuid, p_new_status text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_affected integer := 0;
begin
  insert into public.processed_webhooks (provider, provider_event_id, intent_id)
  values (p_provider, p_provider_event_id, p_intent_id)
  on conflict (provider, provider_event_id) do nothing;
  get diagnostics v_affected = row_count;
  if v_affected = 0 then
    return jsonb_build_object('applied', false, 'reason', 'duplicate');
  end if;
  update public.payment_intents set status = p_new_status where id = p_intent_id;
  return jsonb_build_object('applied', true);
end $$;
revoke all on function payments_private.apply_payment_webhook(text, text, uuid, text) from public, anon, authenticated;
grant execute on function payments_private.apply_payment_webhook(text, text, uuid, text) to service_role;

-- drop the now-relocated public RPCs (the routes switch to the direct-pg path in the same change)
drop function if exists public.advance_payment_intent(uuid, text, text);
drop function if exists public.apply_payment_webhook(text, text, uuid, text);
