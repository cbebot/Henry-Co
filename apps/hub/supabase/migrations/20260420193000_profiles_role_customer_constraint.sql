-- Production auth repair:
-- The live auth profile mirror inserts role = 'customer' for every new auth
-- user. Production rejects that value because profiles_role_check only allows
-- the existing staff-role set. This migration preserves the current
-- allow-list exactly as defined on public.profiles and appends customer.

do $$
declare
  current_constraint_def text;
  allowed_roles text[];
  quoted_allowed_roles text;
begin
  select pg_get_constraintdef(con.oid, true)
    into current_constraint_def
  from pg_constraint con
  join pg_class rel
    on rel.oid = con.conrelid
  join pg_namespace nsp
    on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'profiles'
    and con.conname = 'profiles_role_check';

  if current_constraint_def is null then
    raise exception 'profiles_role_check was not found on public.profiles';
  end if;

  if current_constraint_def ~* '\mcustomer\M' then
    return;
  end if;

  select array_agg(distinct role order by role)
    into allowed_roles
  from (
    select lower(trim(match[1])) as role
    from regexp_matches(current_constraint_def, '''([^'']+)''', 'g') as match

    union all

    select 'customer'
  ) as merged_roles;

  if allowed_roles is null or array_length(allowed_roles, 1) is null then
    raise exception 'Could not derive an allow-list for public.profiles.role';
  end if;

  select string_agg(quote_literal(role), ', ' order by role)
    into quoted_allowed_roles
  from unnest(allowed_roles) as role;

  execute 'alter table public.profiles drop constraint if exists profiles_role_check';

  execute format(
    'alter table public.profiles add constraint profiles_role_check check (role = any (array[%s]::text[]))',
    quoted_allowed_roles
  );
end
$$;
