-- V3-KYC-VAULT-01 — vendor-neutral secure KYC data vault.
--
-- COMMITTED, NOT APPLIED (owner-gated). Additive + dormant: it adds the
-- envelope-encrypted artifact store + crypto-shred machinery + owner/self-only
-- RLS + grant-locked SECURITY DEFINER RPCs + retention-policy registration. It
-- has NO live caller (the @henryco/kyc vault is dormant until a master key +
-- KYC_VAULT_* env are configured) and touches NO money/frozen flow.
--
-- Design (see packages/kyc + docs/v3 report):
--   * DATA MINIMIZATION: the default verification VERDICT lives on the existing
--     customer_verification_submissions / customer_profiles (V3-24 S6-aligned
--     columns added idempotently below) — NOT raw BVN/NIN. This table only ever
--     holds ENVELOPE-ENCRYPTED artifacts when an image genuinely must be kept.
--   * ENVELOPE ENCRYPTION: storage holds AES-256-GCM ciphertext only; this table
--     holds the per-record data key WRAPPED by a master key held OUTSIDE the DB
--     (env or AWS KMS). A DB-only breach yields ciphertext + a wrapped key = inert.
--   * CRYPTO-SHRED: destroying the DB copy of wrapped_data_key makes the artifact
--     unrecoverable from the LIVE store immediately. NOTE: a DB backup taken BEFORE
--     the shred still contains that record's wrapped key; because the WRAPPING
--     (master) key is unchanged, that backup stays decryptable until it ages out
--     per backup-retention — true under BOTH the env and the (shared-CMK) KMS
--     provider as built. Immediate backup-irreversibility requires rotating/destroying
--     the wrapping key itself (env: rotate KYC_VAULT_MASTER_KEY; KMS: ScheduleKeyDeletion
--     of the CMK / per-record CMKs). An irreversibility trigger blocks un-shred.
--   * RLS owner/self-only + default-deny; crypto material never owner-readable.

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1) Encrypted-artifact vault table
-- ---------------------------------------------------------------------------
create table if not exists public.kyc_vault_artifacts (
  id text primary key,                                   -- supplied by the vault (kycart_<uuid>)
  user_id uuid not null references auth.users(id) on delete cascade,
  submission_id uuid,                                    -- soft link to the verdict row (FK added below if target exists)
  media_ref text not null,                               -- media://private/kyc-vault/... (ciphertext pointer)
  wrapped_data_key bytea,                                -- envelope-wrapped DEK; NULL == crypto-shredded
  key_provider text not null,                            -- 'env' | 'aws-kms'
  key_version text not null,
  content_iv bytea not null,                             -- AES-256-GCM nonce of the CONTENT
  content_auth_tag bytea not null,                       -- AES-256-GCM tag of the CONTENT
  content_type text not null,
  document_type text not null,
  byte_size integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  retention_hold_until timestamptz,                      -- legal/operational hold
  legal_hold_reason text,                                -- active legal hold (non-empty == held)
  crypto_shredded_at timestamptz,                        -- set when the DEK is destroyed
  shred_reason text
);

-- Soft FK to the existing verdict table when it is present.
do $$
begin
  if to_regclass('public.customer_verification_submissions') is not null
     and not exists (
       select 1 from pg_constraint where conname = 'kyc_vault_artifacts_submission_fk'
     ) then
    alter table public.kyc_vault_artifacts
      add constraint kyc_vault_artifacts_submission_fk
      foreign key (submission_id)
      references public.customer_verification_submissions(id) on delete set null;
  end if;
end;
$$;

create index if not exists kyc_vault_artifacts_user_idx
  on public.kyc_vault_artifacts(user_id);
create index if not exists kyc_vault_artifacts_shreddable_idx
  on public.kyc_vault_artifacts(created_at)
  where crypto_shredded_at is null;

-- ---------------------------------------------------------------------------
-- 2) Irreversibility guard: once shredded, the wrapped key can never return.
-- ---------------------------------------------------------------------------
create or replace function public.kyc_vault_guard_shred()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.crypto_shredded_at is not null then
    -- A shredded record is immutable except for hold/audit metadata.
    if new.wrapped_data_key is not null then
      raise exception 'kyc_vault: cannot restore a crypto-shredded data key (record %)', old.id;
    end if;
    new.wrapped_data_key := null;
    new.crypto_shredded_at := old.crypto_shredded_at;
  end if;
  return new;
end;
$$;

drop trigger if exists kyc_vault_guard_shred on public.kyc_vault_artifacts;
create trigger kyc_vault_guard_shred
before update on public.kyc_vault_artifacts
for each row execute function public.kyc_vault_guard_shred();

-- ---------------------------------------------------------------------------
-- 3) RLS: default-deny. No anon/authenticated table access at all; crypto
--    material is never reachable. Owners read their own SAFE metadata via the
--    SECURITY DEFINER kyc_vault_my_artifacts() function. service_role (admin
--    path) bypasses RLS and operates through the grant-locked RPCs below.
-- ---------------------------------------------------------------------------
alter table public.kyc_vault_artifacts enable row level security;
alter table public.kyc_vault_artifacts force row level security;

revoke all on public.kyc_vault_artifacts from anon, authenticated;

-- No SELECT/INSERT/UPDATE/DELETE policies for anon/authenticated ⇒ default-deny.
-- (service_role bypasses RLS; the RPCs are the only write path.)

-- ---------------------------------------------------------------------------
-- 4) Owner self-read of SAFE metadata only (never the crypto material).
-- ---------------------------------------------------------------------------
create or replace function public.kyc_vault_my_artifacts()
returns table (
  id text,
  submission_id uuid,
  content_type text,
  document_type text,
  byte_size integer,
  created_at timestamptz,
  retention_hold_until timestamptz,
  legal_hold_reason text,
  crypto_shredded_at timestamptz
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select a.id, a.submission_id, a.content_type, a.document_type, a.byte_size,
         a.created_at, a.retention_hold_until, a.legal_hold_reason, a.crypto_shredded_at
  from public.kyc_vault_artifacts a
  where a.user_id = auth.uid();
$$;

revoke all on function public.kyc_vault_my_artifacts() from public, anon;
grant execute on function public.kyc_vault_my_artifacts() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5) Grant-locked service-role RPCs (the @henryco/kyc repo adapter calls these).
--    bytea crosses the wire as base64 text — lossless, PostgREST-safe.
-- ---------------------------------------------------------------------------
create or replace function public.kyc_vault_store_artifact(
  p_id text,
  p_user_id uuid,
  p_submission_id uuid,
  p_media_ref text,
  p_wrapped_data_key text,
  p_key_provider text,
  p_key_version text,
  p_content_iv text,
  p_content_auth_tag text,
  p_content_type text,
  p_document_type text,
  p_byte_size integer,
  p_created_at timestamptz
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.kyc_vault_artifacts (
    id, user_id, submission_id, media_ref, wrapped_data_key, key_provider,
    key_version, content_iv, content_auth_tag, content_type, document_type,
    byte_size, created_at
  ) values (
    p_id, p_user_id, p_submission_id, p_media_ref,
    case when p_wrapped_data_key is null then null else decode(p_wrapped_data_key, 'base64') end,
    p_key_provider, p_key_version,
    decode(p_content_iv, 'base64'), decode(p_content_auth_tag, 'base64'),
    p_content_type, p_document_type, p_byte_size,
    coalesce(p_created_at, timezone('utc', now()))
  );
  return p_id;
end;
$$;

create or replace function public.kyc_vault_row_json(a public.kyc_vault_artifacts)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', a.id,
    'user_id', a.user_id,
    'submission_id', a.submission_id,
    'media_ref', a.media_ref,
    'wrapped_data_key', case when a.wrapped_data_key is null then null else encode(a.wrapped_data_key, 'base64') end,
    'key_provider', a.key_provider,
    'key_version', a.key_version,
    'content_iv', encode(a.content_iv, 'base64'),
    'content_auth_tag', encode(a.content_auth_tag, 'base64'),
    'content_type', a.content_type,
    'document_type', a.document_type,
    'byte_size', a.byte_size,
    'created_at', a.created_at,
    'retention_hold_until', a.retention_hold_until,
    'legal_hold_reason', a.legal_hold_reason,
    'crypto_shredded_at', a.crypto_shredded_at
  );
$$;

create or replace function public.kyc_vault_get_artifact(p_id text)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select public.kyc_vault_row_json(a) from public.kyc_vault_artifacts a where a.id = p_id;
$$;

create or replace function public.kyc_vault_list_user_artifacts(p_user_id uuid)
returns setof jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select public.kyc_vault_row_json(a) from public.kyc_vault_artifacts a where a.user_id = p_user_id;
$$;

-- Scheduled-scan candidate list. Returns a LIGHT projection ONLY — never the
-- wrapped data key / iv / tag (the scan does not need crypto material). Pushes a
-- conservative pre-filter into SQL (not held; created before now) so an app-layer
-- policy bug cannot even select held/future rows; the precise window + AML floor
-- are still enforced in TS. Batched via LIMIT to bound memory per run.
create or replace function public.kyc_vault_list_shreddable(p_now timestamptz, p_limit integer default 1000)
returns table (
  id text,
  user_id uuid,
  created_at timestamptz,
  retention_hold_until timestamptz,
  legal_hold_reason text,
  crypto_shredded_at timestamptz
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select a.id, a.user_id, a.created_at, a.retention_hold_until, a.legal_hold_reason, a.crypto_shredded_at
  from public.kyc_vault_artifacts a
  where a.crypto_shredded_at is null
    and a.legal_hold_reason is null
    and (a.retention_hold_until is null or a.retention_hold_until <= coalesce(p_now, timezone('utc', now())))
    and a.created_at <= coalesce(p_now, timezone('utc', now()))
  order by a.created_at asc
  limit greatest(1, coalesce(p_limit, 1000));
$$;

create or replace function public.kyc_vault_crypto_shred(
  p_id text,
  p_shredded_at timestamptz,
  p_reason text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_found boolean;
begin
  update public.kyc_vault_artifacts
     set wrapped_data_key = null,                      -- destroy the key (irreversible)
         crypto_shredded_at = coalesce(p_shredded_at, timezone('utc', now())),
         shred_reason = p_reason
   where id = p_id
     and crypto_shredded_at is null
  returning true into v_found;
  return coalesce(v_found, false);
end;
$$;

-- Lock execution to the service-role admin path ONLY.
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'kyc_vault_store_artifact(text,uuid,uuid,text,text,text,text,text,text,text,text,integer,timestamptz)',
    'kyc_vault_get_artifact(text)',
    'kyc_vault_list_user_artifacts(uuid)',
    'kyc_vault_list_shreddable(timestamptz,integer)',
    'kyc_vault_crypto_shred(text,timestamptz,text)'
  ]
  loop
    execute format('revoke all on function public.%s from public, anon, authenticated', fn);
    execute format('grant execute on function public.%s to service_role', fn);
  end loop;
  -- The row-composing helper emits crypto material; deny it to everyone but the
  -- definer-owned reader RPCs (defense-in-depth — it needs a table row to call).
  revoke all on function public.kyc_vault_row_json(public.kyc_vault_artifacts) from public, anon, authenticated;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6) Data-minimization verdict columns (V3-24 S6-aligned; idempotent — V3-24's
--    own migration re-declares these as no-ops). The verdict, NOT raw PII, is
--    what we persist. vendor_result_json MUST be written already-redacted by
--    @henryco/observability/redaction (the vault enforces this in code).
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.customer_verification_submissions') is not null then
    alter table public.customer_verification_submissions
      add column if not exists vendor text,
      add column if not exists vendor_session_id text,
      add column if not exists vendor_decision text,
      add column if not exists vendor_result_json jsonb,        -- PII-REDACTED only
      add column if not exists achieved_level text not null default 'L0',
      add column if not exists idempotency_key text;
    create unique index if not exists customer_verification_submissions_idempotency_key_idx
      on public.customer_verification_submissions(idempotency_key)
      where idempotency_key is not null;
  end if;
  if to_regclass('public.customer_profiles') is not null then
    alter table public.customer_profiles
      add column if not exists verification_level text not null default 'L0';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7) Retention policy + storage-surface registration (governance foundation).
--    ⚠️ The retention PERIOD + AML floor are CONFIGURABLE and REQUIRE LEGAL /
--    COMPLIANCE SIGN-OFF (env KYC_VAULT_RETENTION_DAYS / KYC_VAULT_AML_FLOOR_DAYS).
--    The crypto-shred engine NO-OPS until the period is configured.
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.data_retention_policies') is not null
     and to_regclass('public.data_governance_domains') is not null
     and exists (select 1 from public.data_governance_domains where domain_key = 'identity_account') then
    insert into public.data_retention_policies (
      domain_key, table_name, data_classification, retention_rule, retention_action,
      soft_delete_required, archive_required, legal_hold_supported, destructive_prune_allowed,
      backup_requirement, restore_source, owner_team, notes
    ) values (
      'identity_account', 'kyc_vault_artifacts',
      'IDENTITY PII / KYC ARTIFACT (ENVELOPE-ENCRYPTED)',
      'Crypto-shred (destroy the per-record data key) past the CONFIGURED retention window; honor NDPR on-request erasure above the AML floor.',
      'Crypto-shred: destroy the DB copy of wrapped_data_key (renders the LIVE artifact permanently unrecoverable) then remove the storage blob. Backups taken before the shred remain decryptable (under both providers) until they age out per backup-retention, since the wrapping key is unchanged; immediate backup-irreversibility requires rotating/destroying the wrapping key (env: rotate master key; KMS: ScheduleKeyDeletion of the CMK).',
      false, false, true, true,
      'Provider database backup for wrapped-key metadata; private storage export for ciphertext bytes. NEITHER is usable without the external master key.',
      'Supabase DB backup (metadata) + storage export (ciphertext); recovery requires the master key (env/KMS) which is NOT in the DB.',
      'Trust / Platform',
      'CONFIGURABLE + LEGAL SIGN-OFF REQUIRED: retention period (KYC_VAULT_RETENTION_DAYS) + AML floor (KYC_VAULT_AML_FLOOR_DAYS). Engine no-ops until the period is set. destructive_prune_allowed=true is intentional and unique to this purpose-built vault.'
    )
    on conflict (schema_name, table_name) do update set
      data_classification = excluded.data_classification,
      retention_rule = excluded.retention_rule,
      retention_action = excluded.retention_action,
      legal_hold_supported = excluded.legal_hold_supported,
      destructive_prune_allowed = excluded.destructive_prune_allowed,
      notes = excluded.notes,
      updated_at = timezone('utc', now());
  end if;

  if to_regclass('public.data_storage_surfaces') is not null
     and to_regclass('public.data_governance_domains') is not null
     and exists (select 1 from public.data_governance_domains where domain_key = 'identity_account') then
    insert into public.data_storage_surfaces (
      surface_key, domain_key, storage_system, bucket_or_provider, modeled_table, path_column,
      data_classification, retention_rule, backup_truth, restore_source, owner_team, notes
    ) values (
      'kyc-vault', 'identity_account', 'Supabase Storage', 'kyc-vault',
      'kyc_vault_artifacts', 'media_ref',
      'IDENTITY PII / KYC ARTIFACT (ENVELOPE-ENCRYPTED CIPHERTEXT)',
      'Crypto-shred past the configured window; ciphertext-only at rest.',
      'Object bytes are AES-256-GCM ciphertext; the wrapped data key is in the DB and the master key is external — a storage breach leaks nothing usable.',
      'Storage export yields ciphertext only; recovery requires the external master key.',
      'Trust / Platform',
      'Private bucket (public:false). Bytes are opaque ciphertext; resolveMediaUrl refuses private refs structurally.'
    )
    on conflict (surface_key) do update set
      data_classification = excluded.data_classification,
      retention_rule = excluded.retention_rule,
      backup_truth = excluded.backup_truth,
      notes = excluded.notes,
      updated_at = timezone('utc', now());
  end if;
end;
$$;

commit;
