-- WS-4 — The Onyx Line for Marketplace: contact-safe buyer<->seller messaging.
--
-- Net-new, dark behind MARKETPLACE_MESSAGING_ENABLED. Committed-NOT-applied.
-- Money untouched (no payment/payout/invoice/ledger/wallet/vat/escrow surface).
--
-- Three tables anchor an on-platform thread to a listing or an order:
--   * marketplace_conversations         — one thread per (buyer, vendor, anchor)
--   * marketplace_conversation_messages — screened bodies (block before persist)
--   * marketplace_conversation_participants — mutable read-state only
--
-- SECURITY POSTURE (deliberate):
--   * SELECT-only client policies. There is NO authenticated INSERT policy on
--     any of these tables — every write happens via the service-role key
--     (createAdminSupabase) which bypasses RLS. Clients can never inject rows.
--   * Message read access is keyed on the IMMUTABLE conversation row
--     (buyer_user_id / vendor_id), NEVER on the participants table. participants
--     is mutable read-state; keying message reads on it would let a tampered
--     participant row grant read access. Keep this invariant.
--   * The seller never sees buyer contact PII through these tables — fulfilment
--     PII stays on the order; the thread carries display identity only.
--
-- House style mirrors marketplace_refunds.sql / marketplace_init.sql:
--   gen_random_uuid(), timezone('utc', now()), create ... if not exists,
--   drop/add-constraint idempotent pairs, marketplace_set_updated_at() triggers,
--   inline enable row level security. No force RLS. No grant/revoke.

-- ---------------------------------------------------------------------------
-- 1. marketplace_conversations — one thread per (buyer, vendor, anchor)
-- ---------------------------------------------------------------------------

create table if not exists public.marketplace_conversations (
  id uuid primary key default gen_random_uuid(),
  conversation_no text not null unique,
  anchor_type text not null,
  anchor_id uuid not null,
  buyer_user_id uuid references auth.users(id) on delete set null,
  vendor_id uuid not null references public.marketplace_vendors(id) on delete cascade,
  subject text,
  status text not null default 'open',
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.marketplace_conversations
  drop constraint if exists marketplace_conversations_anchor_type_check;
alter table public.marketplace_conversations
  add constraint marketplace_conversations_anchor_type_check
  check (anchor_type in ('listing','order'));

alter table public.marketplace_conversations
  drop constraint if exists marketplace_conversations_status_check;
alter table public.marketplace_conversations
  add constraint marketplace_conversations_status_check
  check (status in ('open','closed','archived'));

create unique index if not exists marketplace_conversations_dedupe_idx
  on public.marketplace_conversations (buyer_user_id, vendor_id, anchor_type, anchor_id);
create index if not exists marketplace_conversations_buyer_idx
  on public.marketplace_conversations (buyer_user_id, last_message_at desc);
create index if not exists marketplace_conversations_vendor_idx
  on public.marketplace_conversations (vendor_id, last_message_at desc);

drop trigger if exists marketplace_conversations_updated_at on public.marketplace_conversations;
create trigger marketplace_conversations_updated_at before update on public.marketplace_conversations
  for each row execute function public.marketplace_set_updated_at();

alter table public.marketplace_conversations enable row level security;

drop policy if exists marketplace_conversations_buyer_read on public.marketplace_conversations;
create policy marketplace_conversations_buyer_read
  on public.marketplace_conversations
  for select
  using (buyer_user_id = (select auth.uid()));

drop policy if exists marketplace_conversations_vendor_read on public.marketplace_conversations;
create policy marketplace_conversations_vendor_read
  on public.marketplace_conversations
  for select
  using (
    vendor_id in (
      select m.scope_id from public.marketplace_role_memberships m
      where m.user_id = (select auth.uid())
        and m.role = 'vendor'
        and m.is_active = true
        and m.scope_type = 'vendor'
    )
  );

drop policy if exists marketplace_conversations_staff_read on public.marketplace_conversations;
create policy marketplace_conversations_staff_read
  on public.marketplace_conversations
  for select
  using (
    exists (
      select 1 from public.marketplace_role_memberships m
      where m.user_id = (select auth.uid())
        and m.is_active = true
        and m.role in ('marketplace_owner','marketplace_admin','moderation','support')
    )
  );

-- ---------------------------------------------------------------------------
-- 2. marketplace_conversation_messages — screened bodies (block before persist)
-- ---------------------------------------------------------------------------

create table if not exists public.marketplace_conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.marketplace_conversations(id) on delete cascade,
  sender_kind text not null,
  sender_user_id uuid references auth.users(id) on delete set null,
  body text not null,
  message_type text not null default 'text',
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.marketplace_conversation_messages
  drop constraint if exists marketplace_conversation_messages_sender_kind_check;
alter table public.marketplace_conversation_messages
  add constraint marketplace_conversation_messages_sender_kind_check
  check (sender_kind in ('buyer','vendor','system'));

create index if not exists marketplace_conversation_messages_conversation_idx
  on public.marketplace_conversation_messages (conversation_id, created_at);

alter table public.marketplace_conversation_messages enable row level security;

-- Message read access is keyed on the immutable conversation row, never on the
-- mutable participants table (a tampered participant row must not grant reads).
drop policy if exists marketplace_conversation_messages_buyer_read on public.marketplace_conversation_messages;
create policy marketplace_conversation_messages_buyer_read
  on public.marketplace_conversation_messages
  for select
  using (
    exists (
      select 1 from public.marketplace_conversations c
      where c.id = conversation_id
        and c.buyer_user_id = (select auth.uid())
    )
  );

drop policy if exists marketplace_conversation_messages_vendor_read on public.marketplace_conversation_messages;
create policy marketplace_conversation_messages_vendor_read
  on public.marketplace_conversation_messages
  for select
  using (
    exists (
      select 1 from public.marketplace_conversations c
      where c.id = conversation_id
        and c.vendor_id in (
          select m.scope_id from public.marketplace_role_memberships m
          where m.user_id = (select auth.uid())
            and m.role = 'vendor'
            and m.is_active = true
            and m.scope_type = 'vendor'
        )
    )
  );

drop policy if exists marketplace_conversation_messages_staff_read on public.marketplace_conversation_messages;
create policy marketplace_conversation_messages_staff_read
  on public.marketplace_conversation_messages
  for select
  using (
    exists (
      select 1 from public.marketplace_role_memberships m
      where m.user_id = (select auth.uid())
        and m.is_active = true
        and m.role in ('marketplace_owner','marketplace_admin','moderation','support')
    )
  );

-- ---------------------------------------------------------------------------
-- 3. marketplace_conversation_participants — mutable read-state only
-- ---------------------------------------------------------------------------

create table if not exists public.marketplace_conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.marketplace_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  party_kind text not null,
  vendor_id uuid references public.marketplace_vendors(id) on delete set null,
  last_read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.marketplace_conversation_participants
  drop constraint if exists marketplace_conversation_participants_party_kind_check;
alter table public.marketplace_conversation_participants
  add constraint marketplace_conversation_participants_party_kind_check
  check (party_kind in ('buyer','vendor'));

create unique index if not exists marketplace_conversation_participants_unique_idx
  on public.marketplace_conversation_participants (conversation_id, user_id);
create index if not exists marketplace_conversation_participants_user_idx
  on public.marketplace_conversation_participants (user_id);

drop trigger if exists marketplace_conversation_participants_updated_at on public.marketplace_conversation_participants;
create trigger marketplace_conversation_participants_updated_at before update on public.marketplace_conversation_participants
  for each row execute function public.marketplace_set_updated_at();

alter table public.marketplace_conversation_participants enable row level security;

drop policy if exists marketplace_conversation_participants_self_read on public.marketplace_conversation_participants;
create policy marketplace_conversation_participants_self_read
  on public.marketplace_conversation_participants
  for select
  using (user_id = (select auth.uid()));

drop policy if exists marketplace_conversation_participants_vendor_read on public.marketplace_conversation_participants;
create policy marketplace_conversation_participants_vendor_read
  on public.marketplace_conversation_participants
  for select
  using (
    vendor_id in (
      select m.scope_id from public.marketplace_role_memberships m
      where m.user_id = (select auth.uid())
        and m.role = 'vendor'
        and m.is_active = true
        and m.scope_type = 'vendor'
    )
  );

-- Self read-state update only. Bounded by user_id on both USING (which rows are
-- visible to update) and WITH CHECK (what the updated row may become) so a user
-- can never re-key a participant row onto another user.
drop policy if exists marketplace_conversation_participants_self_update on public.marketplace_conversation_participants;
create policy marketplace_conversation_participants_self_update
  on public.marketplace_conversation_participants
  for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Pin the immutable columns on update. The self_update policy bounds only
-- user_id, so without this a participant could re-key their OWN row's
-- conversation_id / party_kind / vendor_id (silently joining another thread or
-- claiming a vendor read-scope). Force the structural columns back to their
-- prior values so only last_read_at / updated_at can ever change.
create or replace function public.marketplace_conversation_participants_pin()
  returns trigger language plpgsql as $$
  begin
    new.conversation_id := old.conversation_id;
    new.user_id := old.user_id;
    new.party_kind := old.party_kind;
    new.vendor_id := old.vendor_id;
    return new;
  end;
  $$;

drop trigger if exists marketplace_conversation_participants_pin on public.marketplace_conversation_participants;
create trigger marketplace_conversation_participants_pin
  before update on public.marketplace_conversation_participants
  for each row execute function public.marketplace_conversation_participants_pin();

-- ---------------------------------------------------------------------------
-- 4. Realtime — register the thread messages table on the publication.
--    Idempotent: create the publication if missing, add a table only when it
--    is not already a member, and only when the table itself exists. Realtime
--    re-applies the table's SELECT policy, so the stream is participant-scoped
--    automatically. Mirrors studio_realtime_publication.sql.
--
--    Only the messages table goes on the wire: the thread engine subscribes to
--    marketplace_conversation_messages. The conversations row carries
--    buyer_user_id and is NOT needed for live thread updates in v1, so it is
--    deliberately kept off the publication.
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end$$;

do $$
declare
  v_table text;
  v_tables text[] := array[
    'marketplace_conversation_messages'
  ];
begin
  foreach v_table in array v_tables loop
    if exists (select 1 from pg_tables where schemaname = 'public' and tablename = v_table) then
      if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = v_table
      ) then
        execute format('alter publication supabase_realtime add table public.%I', v_table);
      end if;
    end if;
  end loop;
end$$;

-- end of migration --
