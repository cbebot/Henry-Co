alter table public.marketplace_role_memberships enable row level security;
alter table public.marketplace_settings enable row level security;
alter table public.marketplace_categories enable row level security;
alter table public.marketplace_brands enable row level security;
alter table public.marketplace_vendors enable row level security;
alter table public.marketplace_vendor_applications enable row level security;
alter table public.marketplace_products enable row level security;
alter table public.marketplace_product_media enable row level security;
alter table public.marketplace_product_variants enable row level security;
alter table public.marketplace_collections enable row level security;
alter table public.marketplace_collection_items enable row level security;
alter table public.marketplace_campaigns enable row level security;
alter table public.marketplace_carts enable row level security;
alter table public.marketplace_cart_items enable row level security;
alter table public.marketplace_orders enable row level security;
alter table public.marketplace_order_groups enable row level security;
alter table public.marketplace_order_items enable row level security;
alter table public.marketplace_payment_records enable row level security;
alter table public.marketplace_shipments enable row level security;
alter table public.marketplace_discount_codes enable row level security;
alter table public.marketplace_addresses enable row level security;
alter table public.marketplace_wishlists enable row level security;
alter table public.marketplace_vendor_follows enable row level security;
alter table public.marketplace_recently_viewed enable row level security;
alter table public.marketplace_user_notifications enable row level security;
alter table public.marketplace_behavior_events enable row level security;
alter table public.marketplace_reviews enable row level security;
alter table public.marketplace_reports enable row level security;
alter table public.marketplace_returns enable row level security;
alter table public.marketplace_disputes enable row level security;
alter table public.marketplace_moderation_cases enable row level security;
alter table public.marketplace_payout_requests enable row level security;
alter table public.marketplace_notification_queue enable row level security;
alter table public.marketplace_audit_logs enable row level security;
alter table public.marketplace_support_threads enable row level security;
alter table public.marketplace_support_messages enable row level security;

drop policy if exists marketplace_public_categories on public.marketplace_categories;
create policy marketplace_public_categories on public.marketplace_categories
for select using (true);

drop policy if exists marketplace_public_brands on public.marketplace_brands;
create policy marketplace_public_brands on public.marketplace_brands
for select using (true);

drop policy if exists marketplace_public_vendors on public.marketplace_vendors;
create policy marketplace_public_vendors on public.marketplace_vendors
for select using (status = 'approved');

drop policy if exists marketplace_public_products on public.marketplace_products;
create policy marketplace_public_products on public.marketplace_products
for select using (approval_status = 'approved');

drop policy if exists marketplace_public_product_media on public.marketplace_product_media;
create policy marketplace_public_product_media on public.marketplace_product_media
for select using (true);

drop policy if exists marketplace_public_product_variants on public.marketplace_product_variants;
create policy marketplace_public_product_variants on public.marketplace_product_variants
for select using (true);

drop policy if exists marketplace_public_collections on public.marketplace_collections;
create policy marketplace_public_collections on public.marketplace_collections
for select using (true);

drop policy if exists marketplace_public_collection_items on public.marketplace_collection_items;
create policy marketplace_public_collection_items on public.marketplace_collection_items
for select using (true);

drop policy if exists marketplace_public_campaigns on public.marketplace_campaigns;
create policy marketplace_public_campaigns on public.marketplace_campaigns
for select using (status = 'active');

drop policy if exists marketplace_public_reviews on public.marketplace_reviews;
create policy marketplace_public_reviews on public.marketplace_reviews
for select using (status = 'published');

drop policy if exists marketplace_member_roles on public.marketplace_role_memberships;
create policy marketplace_member_roles on public.marketplace_role_memberships
for select using (auth.uid() = user_id);

drop policy if exists marketplace_member_carts on public.marketplace_carts;
create policy marketplace_member_carts on public.marketplace_carts
for select using (auth.uid() = user_id);

drop policy if exists marketplace_member_cart_items on public.marketplace_cart_items;
create policy marketplace_member_cart_items on public.marketplace_cart_items
for select using (
  exists (
    select 1
    from public.marketplace_carts carts
    where carts.id = marketplace_cart_items.cart_id
      and carts.user_id = auth.uid()
  )
);

drop policy if exists marketplace_member_orders on public.marketplace_orders;
create policy marketplace_member_orders on public.marketplace_orders
for select using (auth.uid() = user_id);

drop policy if exists marketplace_member_order_groups on public.marketplace_order_groups;
create policy marketplace_member_order_groups on public.marketplace_order_groups
for select using (
  exists (
    select 1
    from public.marketplace_orders orders
    where orders.id = marketplace_order_groups.order_id
      and orders.user_id = auth.uid()
  )
);

drop policy if exists marketplace_member_order_items on public.marketplace_order_items;
create policy marketplace_member_order_items on public.marketplace_order_items
for select using (
  exists (
    select 1
    from public.marketplace_orders orders
    where orders.id = marketplace_order_items.order_id
      and orders.user_id = auth.uid()
  )
);

drop policy if exists marketplace_member_shipments on public.marketplace_shipments;
create policy marketplace_member_shipments on public.marketplace_shipments
for select using (
  exists (
    select 1
    from public.marketplace_order_groups groups
    join public.marketplace_orders orders on orders.id = groups.order_id
    where groups.id = marketplace_shipments.order_group_id
      and orders.user_id = auth.uid()
  )
);

drop policy if exists marketplace_member_payments on public.marketplace_payment_records;
create policy marketplace_member_payments on public.marketplace_payment_records
for select using (
  exists (
    select 1
    from public.marketplace_orders orders
    where orders.id = marketplace_payment_records.order_id
      and orders.user_id = auth.uid()
  )
);

drop policy if exists marketplace_member_addresses on public.marketplace_addresses;
create policy marketplace_member_addresses on public.marketplace_addresses
for select using (auth.uid() = user_id);

drop policy if exists marketplace_member_wishlists on public.marketplace_wishlists;
create policy marketplace_member_wishlists on public.marketplace_wishlists
for select using (auth.uid() = user_id);

drop policy if exists marketplace_member_follows on public.marketplace_vendor_follows;
create policy marketplace_member_follows on public.marketplace_vendor_follows
for select using (auth.uid() = user_id);

drop policy if exists marketplace_member_recent on public.marketplace_recently_viewed;
create policy marketplace_member_recent on public.marketplace_recently_viewed
for select using (auth.uid() = user_id);

drop policy if exists marketplace_member_notifications on public.marketplace_user_notifications;
create policy marketplace_member_notifications on public.marketplace_user_notifications
for select using (auth.uid() = user_id);

drop policy if exists marketplace_member_vendor_applications on public.marketplace_vendor_applications;
create policy marketplace_member_vendor_applications on public.marketplace_vendor_applications
for select using (auth.uid() = user_id);

drop policy if exists marketplace_member_disputes on public.marketplace_disputes;
create policy marketplace_member_disputes on public.marketplace_disputes
for select using (auth.uid() = opened_by_user_id);

drop policy if exists marketplace_member_support_threads on public.marketplace_support_threads;
create policy marketplace_member_support_threads on public.marketplace_support_threads
for select using (auth.uid() = user_id);

drop policy if exists marketplace_member_support_messages on public.marketplace_support_messages;
create policy marketplace_member_support_messages on public.marketplace_support_messages
for select using (
  exists (
    select 1
    from public.marketplace_support_threads threads
    where threads.id = marketplace_support_messages.thread_id
      and threads.user_id = auth.uid()
  )
);
