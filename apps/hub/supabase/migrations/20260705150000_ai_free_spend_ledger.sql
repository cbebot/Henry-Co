-- =============================================================================
-- FREE-AI SPEND LEDGER — the daily cost cap for the Economic Guardrail
-- =============================================================================
-- The free AI is a customer-acquisition cost that must never exceed what the AI earns. The
-- gateway engine (@henryco/ai-gateway free-budget.ts) decides allow/conserve/exhausted from
-- today's spend vs a budget the owner sets no higher than AI earnings. This is the durable
-- counter behind it: one row per day holding the accumulated PROVIDER cost (the real loss) of
-- free turns, read before a turn and incremented after.
--
-- Written and read ONLY by the account server on the service role, through the two RPCs below.
-- RLS is default-deny; no client touches it.
-- =============================================================================

create table if not exists public.ai_free_spend_ledger (
  window_day  date primary key default current_date,
  spent_kobo  bigint not null default 0,
  updated_at  timestamptz not null default now()
);

alter table public.ai_free_spend_ledger enable row level security;
-- No policy by design: default-deny. Only the service role (bypasses RLS) uses the RPCs below.

-- Today's accumulated free-AI spend in kobo (0 when there is no row for today yet).
create or replace function public.ai_free_spend_today()
returns bigint
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce((select spent_kobo from public.ai_free_spend_ledger where window_day = current_date), 0)
$$;

revoke all on function public.ai_free_spend_today() from public;
grant execute on function public.ai_free_spend_today() to service_role;

-- Add a turn's estimated provider cost to today's total and return the new total. Atomic upsert.
create or replace function public.ai_free_spend_add(p_add_kobo bigint)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_total bigint;
begin
  insert into public.ai_free_spend_ledger (window_day, spent_kobo)
    values (current_date, greatest(0, coalesce(p_add_kobo, 0)))
  on conflict (window_day) do update set
    spent_kobo = public.ai_free_spend_ledger.spent_kobo + greatest(0, coalesce(p_add_kobo, 0)),
    updated_at = now()
  returning spent_kobo into v_total;
  return v_total;
end
$$;

revoke all on function public.ai_free_spend_add(bigint) from public;
grant execute on function public.ai_free_spend_add(bigint) to service_role;
