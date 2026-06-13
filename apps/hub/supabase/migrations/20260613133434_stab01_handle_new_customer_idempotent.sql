-- STAB-01 — make public.handle_new_customer idempotent (DB-side backstop).
--
-- The trigger fires AFTER INSERT ON auth.users with five bare INSERTs. If
-- auth.users is ever re-touched for an existing user, the first keyed insert
-- (customer_profiles PK) raised duplicate_key and aborted — the prod log flood
-- that (under the reprovisioned 60-connection ceiling) helped tip the pool into
-- FATAL 53300. The app-side race is already closed by the STAB-01 app fix
-- (PR #280, upsert-ignore in account-profile.ts); this is the permanent DB-side
-- backstop so the flood can't return even if app code regresses.
--
-- customer_profiles / customer_wallets / customer_preferences have natural unique
-- keys → ON CONFLICT DO NOTHING. customer_notifications / customer_activity have
-- no natural unique key → guarded with NOT EXISTS on the account-created marker so
-- a re-fire can't duplicate the welcome row (preserving "exactly one per user").
--
-- Rehearsed on the shadow (idempotent: re-fire → no error, no duplicate;
-- negative control confirmed the old bare-insert function floods). Applied to
-- prod (rzkbgwuznmdxnnhmjazy) as migration 20260613133434.

create or replace function public.handle_new_customer()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.customer_profiles (id, email, full_name)
    values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
    on conflict (id) do nothing;

  insert into public.customer_wallets (user_id)
    values (new.id)
    on conflict (user_id) do nothing;

  insert into public.customer_preferences (user_id)
    values (new.id)
    on conflict (user_id) do nothing;

  insert into public.customer_notifications (user_id, title, body, category, action_url)
  select new.id,
         'Your HenryCo account is ready',
         'The account is set up. Explore the services and manage everything from one dashboard.',
         'account',
         '/'
  where not exists (
    select 1 from public.customer_activity
    where user_id = new.id and activity_type = 'account_created'
  );

  insert into public.customer_activity (user_id, division, activity_type, title, description)
  select new.id, 'account', 'account_created', 'Account created',
         'The unified HenryCo account has been set up.'
  where not exists (
    select 1 from public.customer_activity
    where user_id = new.id and activity_type = 'account_created'
  );

  return new;
end;
$function$;
