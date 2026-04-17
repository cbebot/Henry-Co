alter table if exists public.customer_wallets
  add column if not exists display_currency text,
  add column if not exists settlement_currency text,
  add column if not exists base_currency text,
  add column if not exists exchange_rate_source text,
  add column if not exists exchange_rate_timestamp timestamptz;

alter table if exists public.customer_wallet_transactions
  add column if not exists pricing_currency text,
  add column if not exists display_currency text,
  add column if not exists settlement_currency text,
  add column if not exists base_currency text,
  add column if not exists exchange_rate_source text,
  add column if not exists exchange_rate_timestamp timestamptz;

alter table if exists public.customer_wallet_funding_requests
  add column if not exists pricing_currency text,
  add column if not exists display_currency text,
  add column if not exists settlement_currency text,
  add column if not exists base_currency text,
  add column if not exists exchange_rate_source text,
  add column if not exists exchange_rate_timestamp timestamptz;

alter table if exists public.customer_invoices
  add column if not exists pricing_currency text,
  add column if not exists display_currency text,
  add column if not exists settlement_currency text,
  add column if not exists base_currency text,
  add column if not exists exchange_rate_source text,
  add column if not exists exchange_rate_timestamp timestamptz;

alter table if exists public.customer_subscriptions
  add column if not exists pricing_currency text,
  add column if not exists display_currency text,
  add column if not exists settlement_currency text,
  add column if not exists base_currency text,
  add column if not exists exchange_rate_source text,
  add column if not exists exchange_rate_timestamp timestamptz;

alter table if exists public.customer_payout_methods
  add column if not exists settlement_currency text,
  add column if not exists base_currency text;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'customer_wallets'
  ) then
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'customer_wallets'
        and column_name = 'currency'
    ) then
      execute $sql$
        update public.customer_wallets
        set
          display_currency = coalesce(nullif(display_currency, ''), nullif(currency, ''), 'NGN'),
          settlement_currency = coalesce(nullif(settlement_currency, ''), nullif(currency, ''), 'NGN'),
          base_currency = coalesce(nullif(base_currency, ''), 'NGN')
      $sql$;
    else
      execute $sql$
        update public.customer_wallets
        set
          display_currency = coalesce(nullif(display_currency, ''), 'NGN'),
          settlement_currency = coalesce(nullif(settlement_currency, ''), 'NGN'),
          base_currency = coalesce(nullif(base_currency, ''), 'NGN')
      $sql$;
    end if;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'customer_wallet_transactions'
  ) then
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'customer_wallet_transactions'
        and column_name = 'currency'
    ) then
      execute $sql$
        update public.customer_wallet_transactions
        set
          pricing_currency = coalesce(nullif(pricing_currency, ''), nullif(currency, ''), 'NGN'),
          display_currency = coalesce(nullif(display_currency, ''), nullif(currency, ''), 'NGN'),
          settlement_currency = coalesce(nullif(settlement_currency, ''), 'NGN'),
          base_currency = coalesce(nullif(base_currency, ''), 'NGN')
      $sql$;
    else
      execute $sql$
        update public.customer_wallet_transactions
        set
          pricing_currency = coalesce(nullif(pricing_currency, ''), 'NGN'),
          display_currency = coalesce(nullif(display_currency, ''), 'NGN'),
          settlement_currency = coalesce(nullif(settlement_currency, ''), 'NGN'),
          base_currency = coalesce(nullif(base_currency, ''), 'NGN')
      $sql$;
    end if;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'customer_wallet_funding_requests'
  ) then
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'customer_wallet_funding_requests'
        and column_name = 'currency'
    ) then
      execute $sql$
        update public.customer_wallet_funding_requests
        set
          pricing_currency = coalesce(nullif(pricing_currency, ''), nullif(currency, ''), 'NGN'),
          display_currency = coalesce(nullif(display_currency, ''), nullif(currency, ''), 'NGN'),
          settlement_currency = coalesce(nullif(settlement_currency, ''), nullif(currency, ''), 'NGN'),
          base_currency = coalesce(nullif(base_currency, ''), 'NGN')
      $sql$;
    else
      execute $sql$
        update public.customer_wallet_funding_requests
        set
          pricing_currency = coalesce(nullif(pricing_currency, ''), 'NGN'),
          display_currency = coalesce(nullif(display_currency, ''), 'NGN'),
          settlement_currency = coalesce(nullif(settlement_currency, ''), 'NGN'),
          base_currency = coalesce(nullif(base_currency, ''), 'NGN')
      $sql$;
    end if;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'customer_invoices'
  ) then
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'customer_invoices'
        and column_name = 'currency'
    ) then
      execute $sql$
        update public.customer_invoices
        set
          pricing_currency = coalesce(nullif(pricing_currency, ''), nullif(currency, ''), 'NGN'),
          display_currency = coalesce(nullif(display_currency, ''), nullif(currency, ''), 'NGN'),
          settlement_currency = coalesce(nullif(settlement_currency, ''), 'NGN'),
          base_currency = coalesce(nullif(base_currency, ''), 'NGN')
      $sql$;
    else
      execute $sql$
        update public.customer_invoices
        set
          pricing_currency = coalesce(nullif(pricing_currency, ''), 'NGN'),
          display_currency = coalesce(nullif(display_currency, ''), 'NGN'),
          settlement_currency = coalesce(nullif(settlement_currency, ''), 'NGN'),
          base_currency = coalesce(nullif(base_currency, ''), 'NGN')
      $sql$;
    end if;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'customer_subscriptions'
  ) then
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'customer_subscriptions'
        and column_name = 'currency'
    ) then
      execute $sql$
        update public.customer_subscriptions
        set
          pricing_currency = coalesce(nullif(pricing_currency, ''), nullif(currency, ''), 'NGN'),
          display_currency = coalesce(nullif(display_currency, ''), nullif(currency, ''), 'NGN'),
          settlement_currency = coalesce(nullif(settlement_currency, ''), 'NGN'),
          base_currency = coalesce(nullif(base_currency, ''), 'NGN')
      $sql$;
    else
      execute $sql$
        update public.customer_subscriptions
        set
          pricing_currency = coalesce(nullif(pricing_currency, ''), 'NGN'),
          display_currency = coalesce(nullif(display_currency, ''), 'NGN'),
          settlement_currency = coalesce(nullif(settlement_currency, ''), 'NGN'),
          base_currency = coalesce(nullif(base_currency, ''), 'NGN')
      $sql$;
    end if;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'customer_payout_methods'
  ) then
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'customer_payout_methods'
        and column_name = 'currency'
    ) then
      execute $sql$
        update public.customer_payout_methods
        set
          settlement_currency = coalesce(nullif(settlement_currency, ''), nullif(currency, ''), 'NGN'),
          base_currency = coalesce(nullif(base_currency, ''), 'NGN')
      $sql$;
    else
      execute $sql$
        update public.customer_payout_methods
        set
          settlement_currency = coalesce(nullif(settlement_currency, ''), 'NGN'),
          base_currency = coalesce(nullif(base_currency, ''), 'NGN')
      $sql$;
    end if;
  end if;
end $$;
