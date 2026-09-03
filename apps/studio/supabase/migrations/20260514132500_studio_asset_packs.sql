-- V3 PASS 21 — Studio: asset pack generation + brand guideline export.
--
-- WHY:
--   V3 PASS 21 distinctive surface #6 (asset pack generation) needs a
--   ledger of generated zips:
--     * who triggered the generation,
--     * which Cloudinary archive_url backs the download (signed),
--     * which studio_project_files made it into the pack (jsonb array),
--     * a 7-day expiry window for the signed URL,
--     * audit_log linkage,
--     * brand guidelines flag (true when the pack includes a generated
--       StudioBrandGuidelinesDocument PDF).
--
-- TABLES:
--   public.studio_asset_packs (id, project_id fk, name, status,
--   files jsonb, archive_url, archive_public_id, brand_guidelines_url,
--   expires_at, generated_by_user_id, generated_at, audit_log_id,
--   download_count, last_downloaded_at, created_at, updated_at).
--
-- RLS:
--   - Service role: full access.
--   - Client: SELECT packs for own projects + UPDATE download_count
--     (best-effort metric).
--   - Studio staff: full access via public.is_staff_in('studio').
--
-- DOWN: drop policies + drop table.

-- ─────────────────────────────────────────────────────────────────────
-- Extend studio_project_files: cloudinary_public_id so the asset-pack
-- generator can build a Cloudinary archive URL.
-- ─────────────────────────────────────────────────────────────────────
alter table public.studio_project_files
  add column if not exists cloudinary_public_id text;

create index if not exists studio_project_files_cloudinary_idx
  on public.studio_project_files (cloudinary_public_id)
  where cloudinary_public_id is not null;

create table if not exists public.studio_asset_packs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  name text not null default 'Project asset pack',
  status text not null default 'pending' check (status in ('pending', 'generating', 'ready', 'failed', 'expired')),
  files jsonb not null default '[]'::jsonb,
  archive_url text,
  archive_public_id text,
  brand_guidelines_url text,
  brand_guidelines_public_id text,
  expires_at timestamptz,
  generated_by_user_id uuid references auth.users(id) on delete set null,
  generated_at timestamptz,
  audit_log_id uuid,
  download_count integer not null default 0,
  last_downloaded_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists studio_asset_packs_project_idx
  on public.studio_asset_packs (project_id, generated_at desc);

create index if not exists studio_asset_packs_status_idx
  on public.studio_asset_packs (status, expires_at)
  where status in ('ready', 'generating');

create index if not exists studio_asset_packs_expires_idx
  on public.studio_asset_packs (expires_at)
  where expires_at is not null and status = 'ready';

drop trigger if exists studio_asset_packs_updated_at on public.studio_asset_packs;
create trigger studio_asset_packs_updated_at before update on public.studio_asset_packs
for each row execute function public.studio_set_updated_at();

alter table public.studio_asset_packs enable row level security;

drop policy if exists "studio asset packs: service role" on public.studio_asset_packs;
create policy "studio asset packs: service role"
  on public.studio_asset_packs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "studio asset packs: client read" on public.studio_asset_packs;
create policy "studio asset packs: client read"
  on public.studio_asset_packs
  for select
  using (
    exists (
      select 1
      from public.studio_projects sp
      where sp.id = studio_asset_packs.project_id
        and sp.client_user_id = auth.uid()
    )
  );

drop policy if exists "studio asset packs: staff" on public.studio_asset_packs;
create policy "studio asset packs: staff"
  on public.studio_asset_packs
  for all
  using (public.is_staff_in('studio'))
  with check (public.is_staff_in('studio'));

comment on table public.studio_asset_packs is
  'V3 PASS 21 — generated branded asset pack ledger. status: pending → '
  'generating → ready | failed | expired. archive_url + archive_public_id '
  'point to a Cloudinary archive (zip) generated via the Cloudinary admin '
  'API. expires_at is set 7 days after generated_at so signed URLs auto-rotate. '
  'brand_guidelines_url backs the standalone StudioBrandGuidelinesDocument PDF '
  'shipped alongside (or inside) the zip. download_count is best-effort.';

-- end of migration --
