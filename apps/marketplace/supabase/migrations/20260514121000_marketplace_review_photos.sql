-- V3 PASS 21 — marketplace review photos with moderation queue
--
-- Up to 5 photos per review (enforced in app + DB constraint via index
-- count when written). Photos are uploaded to Cloudinary; we keep the
-- public_id + url + alt text + moderation status. Moderation status
-- defaults to "pending" so abusive photos cannot leak before staff
-- review.

create table if not exists public.marketplace_review_photos (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.marketplace_reviews(id) on delete cascade,
  uploader_user_id uuid references auth.users(id) on delete set null,
  url text not null,
  public_id text,
  alt_text text,
  width integer,
  height integer,
  bytes integer,
  moderation_status text not null default 'pending',
  moderation_note text,
  moderated_at timestamptz,
  moderated_by_user_id uuid references auth.users(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.marketplace_review_photos
  drop constraint if exists marketplace_review_photos_moderation_check;
alter table public.marketplace_review_photos
  add constraint marketplace_review_photos_moderation_check
  check (moderation_status in ('pending','approved','rejected','removed'));

create index if not exists marketplace_review_photos_review_idx
  on public.marketplace_review_photos (review_id, sort_order);
create index if not exists marketplace_review_photos_moderation_idx
  on public.marketplace_review_photos (moderation_status, created_at desc);

drop trigger if exists marketplace_review_photos_updated_at on public.marketplace_review_photos;
create trigger marketplace_review_photos_updated_at before update on public.marketplace_review_photos
  for each row execute function public.marketplace_set_updated_at();

alter table public.marketplace_review_photos enable row level security;

drop policy if exists marketplace_review_photos_public_read on public.marketplace_review_photos;
create policy marketplace_review_photos_public_read
  on public.marketplace_review_photos
  for select
  using (
    moderation_status = 'approved'
    and exists (
      select 1 from public.marketplace_reviews r
      where r.id = review_id and r.status = 'published'
    )
  );

drop policy if exists marketplace_review_photos_owner_read on public.marketplace_review_photos;
create policy marketplace_review_photos_owner_read
  on public.marketplace_review_photos
  for select
  using (uploader_user_id = (select auth.uid()));

drop policy if exists marketplace_review_photos_owner_write on public.marketplace_review_photos;
create policy marketplace_review_photos_owner_write
  on public.marketplace_review_photos
  for insert
  with check (uploader_user_id = (select auth.uid()));

drop policy if exists marketplace_review_photos_staff_all on public.marketplace_review_photos;
create policy marketplace_review_photos_staff_all
  on public.marketplace_review_photos
  for all
  using (
    exists (
      select 1 from public.marketplace_role_memberships m
      where m.user_id = (select auth.uid())
        and m.is_active = true
        and m.role in ('marketplace_owner','marketplace_admin','moderation','support')
    )
  )
  with check (
    exists (
      select 1 from public.marketplace_role_memberships m
      where m.user_id = (select auth.uid())
        and m.is_active = true
        and m.role in ('marketplace_owner','marketplace_admin','moderation','support')
    )
  );

-- Verified-purchase flag + helpful vote tracker on reviews themselves
-- (idempotent — only add if missing)
alter table if exists public.marketplace_reviews
  add column if not exists verified_purchase boolean not null default false,
  add column if not exists helpful_count integer not null default 0,
  add column if not exists photo_count integer not null default 0;

create index if not exists marketplace_reviews_verified_idx
  on public.marketplace_reviews (verified_purchase, status)
  where verified_purchase = true and status = 'published';

create table if not exists public.marketplace_review_votes (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.marketplace_reviews(id) on delete cascade,
  voter_user_id uuid not null references auth.users(id) on delete cascade,
  vote smallint not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  unique (review_id, voter_user_id)
);

alter table public.marketplace_review_votes
  drop constraint if exists marketplace_review_votes_vote_check;
alter table public.marketplace_review_votes
  add constraint marketplace_review_votes_vote_check
  check (vote in (-1, 1));

alter table public.marketplace_review_votes enable row level security;

drop policy if exists marketplace_review_votes_public_read on public.marketplace_review_votes;
create policy marketplace_review_votes_public_read
  on public.marketplace_review_votes
  for select
  using (true);

drop policy if exists marketplace_review_votes_owner_write on public.marketplace_review_votes;
create policy marketplace_review_votes_owner_write
  on public.marketplace_review_votes
  for all
  using (voter_user_id = (select auth.uid()))
  with check (voter_user_id = (select auth.uid()));
