-- V3-18 — Payment documents: persisted, ledger-tied receipts & invoices.
--
-- The customer/legal face of a money event. Every receipt references its
-- payment_intent AND the posted double-entry journal entry that confirmed the
-- payment (V3-17), and its total RECONCILES to that entry by construction — a
-- receipt can only exist for a balanced money event the ledger already recorded.
-- Documents issue from "Henry Onyx Limited" (the legal entity is sourced in code
-- from @henryco/config, never stamped into a row here).
--
-- Amounts are kobo BIGINT (NGN minor units) — never float, never ×100. Mirrors the
-- ledger base currency; FX is display-only.
--
-- COMMITTED-NOT-APPLIED. Lands at FL2 with/just after the payment + ledger
-- migrations, owner-driven. Apply order at FL2:
--   20260529120000_payment_intents.sql
--   20260605123000_payments_private_isolation.sql
--   20260607120000_double_entry_ledger.sql
--   20260607130000_v3_18_payment_documents.sql            (THIS — depends on all above)
-- Do NOT apply to prod here. Proven on a fresh Postgres 17 in CI
-- (payments-grant-invariant job → payment_documents_invariants.sql).

-- payments_private already exists after the isolation/ledger migrations; create
-- idempotently so this migration is also self-standing on a fresh DB.
create schema if not exists payments_private;
revoke all on schema payments_private from public;
revoke usage on schema payments_private from anon, authenticated;
grant usage on schema payments_private to service_role;

-- ============ DOCUMENT NUMBER COUNTERS (per-kind, per-year sequence) ============
-- Backs the stable, unique HO- numbering. Written ONLY via the SECURITY DEFINER
-- allocator below (deny-all to the request roles).
create table if not exists public.document_number_counters (
  scope      text primary key,                 -- e.g. 'RCT:2026', 'INV:2026'
  value      bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- ============ customer_invoices ============
create table if not exists public.customer_invoices (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  invoice_no         text not null unique,                       -- HO-INV-2026-000123
  division           text not null,
  source_kind        text not null,                              -- 'order_capture','subscription',...
  source_ref         text not null,                              -- intent/order id
  payment_intent_id  uuid references public.payment_intents(id) on delete set null,
  posting_id         uuid references public.journal_entries(id) on delete set null,
  status             text not null default 'issued',
  subtotal_minor     bigint not null,
  tax_minor          bigint not null default 0,
  discount_minor     bigint not null default 0,
  total_minor        bigint not null,
  currency           text not null,
  line_items         jsonb not null default '[]'::jsonb,
  storage_path       text,
  issued_at          timestamptz not null default timezone('utc', now()),
  paid_at            timestamptz,
  created_at         timestamptz not null default timezone('utc', now())
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'customer_invoices_source_unique') then
    alter table public.customer_invoices add constraint customer_invoices_source_unique unique (source_kind, source_ref); -- idempotent generation
  end if;
  if not exists (select 1 from pg_constraint where conname = 'customer_invoices_status_valid') then
    alter table public.customer_invoices add constraint customer_invoices_status_valid
      check (status in ('issued','paid','void'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'customer_invoices_amounts_nonneg') then
    alter table public.customer_invoices add constraint customer_invoices_amounts_nonneg
      check (subtotal_minor >= 0 and tax_minor >= 0 and discount_minor >= 0 and total_minor >= 0);
  end if;
  -- Presentation reconciles to the total BY CONSTRUCTION: subtotal + tax − discount = total.
  if not exists (select 1 from pg_constraint where conname = 'customer_invoices_total_reconciles') then
    alter table public.customer_invoices add constraint customer_invoices_total_reconciles
      check (total_minor = subtotal_minor + tax_minor - discount_minor);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'customer_invoices_currency_base') then
    alter table public.customer_invoices add constraint customer_invoices_currency_base check (currency = 'NGN');
  end if;
end $$;
create index if not exists customer_invoices_user_id_idx on public.customer_invoices (user_id);
create index if not exists customer_invoices_intent_idx on public.customer_invoices (payment_intent_id);

-- ============ customer_receipts ============
-- A receipt is proof of a CONFIRMED payment, so its tie to the ledger is mandatory:
-- posting_id (NOT NULL, unique) is the journal entry that recorded the money, and
-- payment_intent_id (NOT NULL) is the intent it settled.
create table if not exists public.customer_receipts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  receipt_no         text not null unique,                       -- HO-RCT-2026-000123
  invoice_id         uuid references public.customer_invoices(id) on delete set null,
  division           text not null,
  payment_method     text not null,
  payment_reference  text,                                       -- gateway transaction ref (processor UNNAMED)
  payment_intent_id  uuid not null references public.payment_intents(id) on delete restrict,
  posting_id         uuid not null references public.journal_entries(id) on delete restrict,
  subtotal_minor     bigint not null,
  fees_minor         bigint not null default 0,
  tax_minor          bigint not null default 0,
  total_minor        bigint not null,
  currency           text not null,
  line_items         jsonb not null default '[]'::jsonb,
  storage_path       text,
  paid_at            timestamptz not null,
  created_at         timestamptz not null default timezone('utc', now())
);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'customer_receipts_posting_unique') then
    alter table public.customer_receipts add constraint customer_receipts_posting_unique unique (posting_id); -- one receipt per confirmed posting
  end if;
  if not exists (select 1 from pg_constraint where conname = 'customer_receipts_amounts_nonneg') then
    alter table public.customer_receipts add constraint customer_receipts_amounts_nonneg
      check (subtotal_minor >= 0 and fees_minor >= 0 and tax_minor >= 0 and total_minor > 0);
  end if;
  -- Presentation reconciles to the total BY CONSTRUCTION: subtotal + fees + tax = total.
  if not exists (select 1 from pg_constraint where conname = 'customer_receipts_total_reconciles') then
    alter table public.customer_receipts add constraint customer_receipts_total_reconciles
      check (total_minor = subtotal_minor + fees_minor + tax_minor);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'customer_receipts_currency_base') then
    alter table public.customer_receipts add constraint customer_receipts_currency_base check (currency = 'NGN');
  end if;
end $$;
create index if not exists customer_receipts_user_id_idx on public.customer_receipts (user_id);
create index if not exists customer_receipts_intent_idx on public.customer_receipts (payment_intent_id);

-- ============ A: NUMBER ALLOCATOR (atomic, per-kind, per-year) ============
create or replace function payments_private.allocate_document_number(p_kind text, p_year int)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_value bigint;
  v_scope text := upper(p_kind) || ':' || p_year::text;
begin
  -- Atomic increment: the ON CONFLICT DO UPDATE ... RETURNING runs as one row op.
  insert into public.document_number_counters (scope, value) values (v_scope, 1)
    on conflict (scope) do update set value = public.document_number_counters.value + 1, updated_at = now()
    returning value into v_value;
  return 'HO-' || upper(p_kind) || '-' || p_year::text || '-' || lpad(v_value::text, 6, '0');
end $$;
revoke all on function payments_private.allocate_document_number(text, int) from public, anon, authenticated;
grant execute on function payments_private.allocate_document_number(text, int) to service_role;

-- ============ B: RECORD RECEIPT (guarded, idempotent, ledger-reconciled) ============
-- The ONLY sanctioned writer for customer_receipts. Idempotent on posting_id (a
-- replayed generation no-ops with the existing receipt). REJECTS a receipt whose
-- total does not reconcile to the posted ledger entry's debit total — a receipt can
-- never claim an amount the ledger did not record.
create or replace function payments_private.record_customer_receipt(
  p_user_id uuid,
  p_division text,
  p_payment_intent_id uuid,
  p_posting_id uuid,
  p_payment_method text,
  p_payment_reference text,
  p_subtotal_minor bigint,
  p_fees_minor bigint,
  p_tax_minor bigint,
  p_total_minor bigint,
  p_currency text,
  p_line_items jsonb,
  p_paid_at timestamptz,
  p_storage_path text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_existing_id uuid;
  v_existing_no text;
  v_ledger_debit bigint;
  v_year int := extract(year from coalesce(p_paid_at, now()))::int;
  v_no text;
  v_id uuid;
begin
  if upper(coalesce(p_currency, '')) <> 'NGN' then
    raise exception 'record_customer_receipt: currency must be NGN, got %', p_currency using errcode = 'check_violation';
  end if;

  -- Idempotent: one receipt per confirmed posting.
  select id, receipt_no into v_existing_id, v_existing_no
    from public.customer_receipts where posting_id = p_posting_id;
  if v_existing_id is not null then
    return jsonb_build_object('created', false, 'reason', 'duplicate', 'id', v_existing_id, 'receipt_no', v_existing_no);
  end if;

  -- Money-truth tie: the posting MUST be the CHARGE-SETTLEMENT entry for THIS intent
  -- (source='payment_intent', source_event_id=intent) — never a REFUND entry
  -- (source='payment_intent_refund', whose debit total ALSO equals the gross, so a
  -- bare sum-check would mint a "receipt" for money that LEFT the platform) and never
  -- another payment's posting. This binds posting → intent → charge, so a receipt can
  -- only evidence money the ledger recorded as RECEIVED for this exact payment.
  if not exists (
    select 1 from public.journal_entries
     where id = p_posting_id
       and source = 'payment_intent'
       and source_event_id = p_payment_intent_id::text
  ) then
    raise exception 'record_customer_receipt: posting % is not the charge settlement for intent % (refund or foreign posting)',
      p_posting_id, p_payment_intent_id using errcode = 'check_violation';
  end if;
  -- Reconcile: the receipt total MUST equal the posted entry's debit total (the gross).
  select coalesce(sum(debit_minor), 0) into v_ledger_debit
    from public.journal_lines where entry_id = p_posting_id;
  if v_ledger_debit <> p_total_minor then
    raise exception 'record_customer_receipt: total % does not reconcile to ledger posting debit % (posting %)',
      p_total_minor, v_ledger_debit, p_posting_id using errcode = 'check_violation';
  end if;

  v_no := payments_private.allocate_document_number('RCT', v_year);
  insert into public.customer_receipts (
    user_id, receipt_no, division, payment_method, payment_reference,
    payment_intent_id, posting_id, subtotal_minor, fees_minor, tax_minor,
    total_minor, currency, line_items, storage_path, paid_at
  ) values (
    p_user_id, v_no, p_division, p_payment_method, p_payment_reference,
    p_payment_intent_id, p_posting_id, p_subtotal_minor, coalesce(p_fees_minor, 0), coalesce(p_tax_minor, 0),
    p_total_minor, 'NGN', coalesce(p_line_items, '[]'::jsonb), p_storage_path, coalesce(p_paid_at, now())
  )
  on conflict (posting_id) do nothing
  returning id into v_id;

  if v_id is null then
    -- Lost a concurrent race; return the winner (the allocated number is a harmless gap).
    select id, receipt_no into v_id, v_no from public.customer_receipts where posting_id = p_posting_id;
    return jsonb_build_object('created', false, 'reason', 'duplicate', 'id', v_id, 'receipt_no', v_no);
  end if;

  return jsonb_build_object('created', true, 'id', v_id, 'receipt_no', v_no);
end $$;
revoke all on function payments_private.record_customer_receipt(uuid, text, uuid, uuid, text, text, bigint, bigint, bigint, bigint, text, jsonb, timestamptz, text) from public, anon, authenticated;
grant execute on function payments_private.record_customer_receipt(uuid, text, uuid, uuid, text, text, bigint, bigint, bigint, bigint, text, jsonb, timestamptz, text) to service_role;

-- ============ C: RECORD INVOICE (guarded, idempotent) ============
-- The ONLY sanctioned writer for customer_invoices. Idempotent on (source_kind,
-- source_ref). An invoice can be issued before settlement, so it has no mandatory
-- ledger tie (posting_id is set when paid). The total-reconciles CHECK on the table
-- guarantees subtotal + tax − discount = total.
create or replace function payments_private.record_customer_invoice(
  p_user_id uuid,
  p_division text,
  p_source_kind text,
  p_source_ref text,
  p_payment_intent_id uuid,
  p_status text,
  p_subtotal_minor bigint,
  p_tax_minor bigint,
  p_discount_minor bigint,
  p_total_minor bigint,
  p_currency text,
  p_line_items jsonb,
  p_storage_path text,
  p_issued_at timestamptz
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_existing_id uuid;
  v_existing_no text;
  v_year int := extract(year from coalesce(p_issued_at, now()))::int;
  v_no text;
  v_id uuid;
begin
  if upper(coalesce(p_currency, '')) <> 'NGN' then
    raise exception 'record_customer_invoice: currency must be NGN, got %', p_currency using errcode = 'check_violation';
  end if;

  select id, invoice_no into v_existing_id, v_existing_no
    from public.customer_invoices where source_kind = p_source_kind and source_ref = p_source_ref;
  if v_existing_id is not null then
    return jsonb_build_object('created', false, 'reason', 'duplicate', 'id', v_existing_id, 'invoice_no', v_existing_no);
  end if;

  v_no := payments_private.allocate_document_number('INV', v_year);
  insert into public.customer_invoices (
    user_id, invoice_no, division, source_kind, source_ref, payment_intent_id, status,
    subtotal_minor, tax_minor, discount_minor, total_minor, currency, line_items, storage_path, issued_at
  ) values (
    p_user_id, v_no, p_division, p_source_kind, p_source_ref, p_payment_intent_id, coalesce(p_status, 'issued'),
    p_subtotal_minor, coalesce(p_tax_minor, 0), coalesce(p_discount_minor, 0), p_total_minor, 'NGN',
    coalesce(p_line_items, '[]'::jsonb), p_storage_path, coalesce(p_issued_at, timezone('utc', now()))
  )
  on conflict (source_kind, source_ref) do nothing
  returning id into v_id;

  if v_id is null then
    select id, invoice_no into v_id, v_no from public.customer_invoices
      where source_kind = p_source_kind and source_ref = p_source_ref;
    return jsonb_build_object('created', false, 'reason', 'duplicate', 'id', v_id, 'invoice_no', v_no);
  end if;

  return jsonb_build_object('created', true, 'id', v_id, 'invoice_no', v_no);
end $$;
revoke all on function payments_private.record_customer_invoice(uuid, text, text, text, uuid, text, bigint, bigint, bigint, bigint, text, jsonb, text, timestamptz) from public, anon, authenticated;
grant execute on function payments_private.record_customer_invoice(uuid, text, text, text, uuid, text, bigint, bigint, bigint, bigint, text, jsonb, text, timestamptz) to service_role;

-- ============ RLS — owner reads own; finance staff read all; NO client write ============
alter table public.customer_invoices enable row level security;
alter table public.customer_receipts enable row level security;
alter table public.document_number_counters enable row level security;

drop policy if exists customer_invoices_select_own on public.customer_invoices;
create policy customer_invoices_select_own on public.customer_invoices
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists customer_invoices_select_finance on public.customer_invoices;
create policy customer_invoices_select_finance on public.customer_invoices
  for select to authenticated using (public.is_platform_staff());

drop policy if exists customer_receipts_select_own on public.customer_receipts;
create policy customer_receipts_select_own on public.customer_receipts
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists customer_receipts_select_finance on public.customer_receipts;
create policy customer_receipts_select_finance on public.customer_receipts
  for select to authenticated using (public.is_platform_staff());

-- document_number_counters: RLS enabled with NO policy → deny-all to authenticated;
-- written only by the SECURITY DEFINER allocator (runs as owner, RLS-exempt).

-- Defense in depth (mirrors the V3-17 ledger): strip Supabase's default blanket
-- table-level DML grants so writes flow ONLY through the SECURITY DEFINER record
-- RPCs (which insert as the table owner, unaffected by these grants). A receipt or
-- invoice is a legal artifact — no role may INSERT one directly. SELECT stays intact
-- (RLS gates anon/authenticated to owner/finance; service_role reads for V3-22).
revoke insert, update, delete, truncate on public.customer_invoices        from anon, authenticated, service_role;
revoke insert, update, delete, truncate on public.customer_receipts        from anon, authenticated, service_role;
revoke insert, update, delete, truncate, select on public.document_number_counters from anon, authenticated, service_role;
