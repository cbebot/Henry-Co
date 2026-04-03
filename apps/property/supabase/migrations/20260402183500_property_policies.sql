create or replace function public.is_property_staff()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('owner', 'manager', 'staff', 'support')
  );
$$;

alter table public.property_role_memberships enable row level security;
alter table public.property_agents enable row level security;
alter table public.property_listings enable row level security;
alter table public.property_listing_media enable row level security;
alter table public.property_amenities enable row level security;
alter table public.property_inquiries enable row level security;
alter table public.property_viewing_requests enable row level security;
alter table public.property_listing_applications enable row level security;
alter table public.property_managed_records enable row level security;
alter table public.property_featured_campaigns enable row level security;
alter table public.property_notifications enable row level security;
alter table public.property_settings enable row level security;
alter table public.property_saved_listings enable row level security;

drop policy if exists "public can read property agents" on public.property_agents;
create policy "public can read property agents"
on public.property_agents
for select
using (true);

drop policy if exists "public can read approved listings" on public.property_listings;
create policy "public can read approved listings"
on public.property_listings
for select
using (status = 'approved' and visibility = 'public');

drop policy if exists "staff can manage listings" on public.property_listings;
create policy "staff can manage listings"
on public.property_listings
for all
using (public.is_property_staff())
with check (public.is_property_staff());

drop policy if exists "owners can read own listings" on public.property_listings;
create policy "owners can read own listings"
on public.property_listings
for select
using (auth.uid() = owner_user_id);

drop policy if exists "owners can update own listings" on public.property_listings;
create policy "owners can update own listings"
on public.property_listings
for update
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

drop policy if exists "public can read campaigns" on public.property_featured_campaigns;
create policy "public can read campaigns"
on public.property_featured_campaigns
for select
using (true);

drop policy if exists "staff can manage campaigns" on public.property_featured_campaigns;
create policy "staff can manage campaigns"
on public.property_featured_campaigns
for all
using (public.is_property_staff())
with check (public.is_property_staff());

drop policy if exists "users can read own inquiries" on public.property_inquiries;
create policy "users can read own inquiries"
on public.property_inquiries
for select
using (auth.uid() = user_id or public.is_property_staff());

drop policy if exists "users can insert own inquiries" on public.property_inquiries;
create policy "users can insert own inquiries"
on public.property_inquiries
for insert
with check (auth.uid() = user_id or user_id is null);

drop policy if exists "staff can manage inquiries" on public.property_inquiries;
create policy "staff can manage inquiries"
on public.property_inquiries
for update
using (public.is_property_staff())
with check (public.is_property_staff());

drop policy if exists "users can read own viewings" on public.property_viewing_requests;
create policy "users can read own viewings"
on public.property_viewing_requests
for select
using (auth.uid() = user_id or public.is_property_staff());

drop policy if exists "users can insert own viewings" on public.property_viewing_requests;
create policy "users can insert own viewings"
on public.property_viewing_requests
for insert
with check (auth.uid() = user_id or user_id is null);

drop policy if exists "staff can manage viewings" on public.property_viewing_requests;
create policy "staff can manage viewings"
on public.property_viewing_requests
for update
using (public.is_property_staff())
with check (public.is_property_staff());

drop policy if exists "owners can read own applications" on public.property_listing_applications;
create policy "owners can read own applications"
on public.property_listing_applications
for select
using (auth.uid() = user_id or public.is_property_staff());

drop policy if exists "owners can insert own applications" on public.property_listing_applications;
create policy "owners can insert own applications"
on public.property_listing_applications
for insert
with check (auth.uid() = user_id or user_id is null);

drop policy if exists "staff can manage applications" on public.property_listing_applications;
create policy "staff can manage applications"
on public.property_listing_applications
for update
using (public.is_property_staff())
with check (public.is_property_staff());

drop policy if exists "staff can manage role memberships" on public.property_role_memberships;
create policy "staff can manage role memberships"
on public.property_role_memberships
for all
using (public.is_property_staff())
with check (public.is_property_staff());

drop policy if exists "users can read own saved listings" on public.property_saved_listings;
create policy "users can read own saved listings"
on public.property_saved_listings
for select
using (auth.uid() = user_id or public.is_property_staff());

drop policy if exists "users can manage own saved listings" on public.property_saved_listings;
create policy "users can manage own saved listings"
on public.property_saved_listings
for all
using (auth.uid() = user_id or public.is_property_staff())
with check (auth.uid() = user_id or public.is_property_staff());

drop policy if exists "staff can manage media" on public.property_listing_media;
create policy "staff can manage media"
on public.property_listing_media
for all
using (public.is_property_staff())
with check (public.is_property_staff());

drop policy if exists "public can read media" on public.property_listing_media;
create policy "public can read media"
on public.property_listing_media
for select
using (true);

drop policy if exists "staff can manage amenities" on public.property_amenities;
create policy "staff can manage amenities"
on public.property_amenities
for all
using (public.is_property_staff())
with check (public.is_property_staff());

drop policy if exists "public can read amenities" on public.property_amenities;
create policy "public can read amenities"
on public.property_amenities
for select
using (true);

drop policy if exists "staff can manage managed records" on public.property_managed_records;
create policy "staff can manage managed records"
on public.property_managed_records
for all
using (public.is_property_staff())
with check (public.is_property_staff());

drop policy if exists "staff can read notifications" on public.property_notifications;
create policy "staff can read notifications"
on public.property_notifications
for select
using (public.is_property_staff());

drop policy if exists "staff can insert notifications" on public.property_notifications;
create policy "staff can insert notifications"
on public.property_notifications
for insert
with check (public.is_property_staff());

drop policy if exists "staff can manage settings" on public.property_settings;
create policy "staff can manage settings"
on public.property_settings
for all
using (public.is_property_staff())
with check (public.is_property_staff());
