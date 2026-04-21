-- Production auth repair:
-- The auth.users customer mirror trigger function uses unqualified table names
-- without a fixed search_path. Under the real Supabase Auth execution context,
-- that causes signup to fail with `relation "customer_profiles" does not exist`.
-- Pin the function to the public schema and fully qualify the downstream writes.

create or replace function public.handle_new_customer()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $function$
begin
  insert into public.customer_profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));

  insert into public.customer_wallets (user_id)
  values (new.id);

  insert into public.customer_preferences (user_id)
  values (new.id);

  insert into public.customer_notifications (user_id, title, body, category, action_url)
  values (
    new.id,
    'Welcome to HenryCo',
    'Your account is ready. Explore our services and manage everything from your dashboard.',
    'account',
    '/'
  );

  insert into public.customer_activity (user_id, division, activity_type, title, description)
  values (
    new.id,
    'account',
    'account_created',
    'Account Created',
    'Welcome to HenryCo! Your unified account has been set up.'
  );

  return new;
end;
$function$;
