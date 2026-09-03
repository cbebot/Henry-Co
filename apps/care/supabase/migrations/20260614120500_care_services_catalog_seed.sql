-- V3-49 — Care: services catalog seed (11 verticals + curated services).
-- WHY: populate the generalised catalog with real, multi-vertical content so the
--      services directory, vertical landings, detail surfaces, and search index
--      render real data on day one. The bookable cleaning services carry the
--      live booking-package slug (source_table='care_service_packages') so the
--      detail-page CTA /book?service=<slug> resolves to the right package when
--      V3-51 wires preselection; the expansion verticals (laundry, repairs,
--      errands, moving, event/business support, provider-assisted) introduce the
--      new lines. Money is BIGINT minor units (kobo) = naira × 100.
-- IDEMPOTENT: yes — on conflict (slug) do nothing on both tables; safe to re-run
--             and never clobbers a later staff edit.

-- ---------------------------------------------------------------------------
-- 11 verticals (canonical-locale names; localized at render via Pattern B).
-- ---------------------------------------------------------------------------
insert into public.service_verticals (slug, name, summary, icon, division, display_order, status)
values
  ('garment-care',      'Garment Care',        'Dry cleaning, pressing, stain treatment, and delicate handling.',           'Shirt',           'care',  10, 'active'),
  ('laundry',           'Laundry & Wash',      'Wash, dry, fold, and press for everyday and bulk loads.',                   'WashingMachine',  'care',  20, 'active'),
  ('home-cleaning',     'Home Cleaning',       'One-time, recurring, and routine residential cleaning.',                    'Home',            'care',  30, 'active'),
  ('office-cleaning',   'Office Cleaning',     'Professional commercial cleaning for offices and workspaces.',              'Building2',       'care',  40, 'active'),
  ('deep-cleaning',     'Deep Cleaning',       'High-intensity resets for kitchens, bathrooms, and turnovers.',             'Sparkles',        'care',  50, 'active'),
  ('repairs',           'Repairs & Fixes',     'Handyman work, fittings, and minor home and office repairs.',               'Wrench',          'care',  60, 'active'),
  ('errands',           'Errands & Tasks',     'Pickups, drop-offs, queueing, and the personal tasks you hand off.',        'ListChecks',      'care',  70, 'active'),
  ('moving',            'Moving & Relocation', 'Packing, loading, and relocation support for a calm moving day.',           'Truck',           'care',  80, 'active'),
  ('event-support',     'Event Support',       'Set-up, staffing, and a thorough reset for your events.',                   'PartyPopper',     'care',  90, 'active'),
  ('business-support',  'Business Support',    'Standing operational care and concierge support for businesses.',           'Briefcase',       'care', 100, 'active'),
  ('provider-assisted', 'Provider-Assisted',   'Specialist services delivered by verified providers.',                      'BadgeCheck',      'care', 110, 'active')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Curated services. The VALUES carry vertical_slug; the join resolves vertical_id.
-- base_price_minor is kobo (naira × 100); NULL where the price is on request.
-- ---------------------------------------------------------------------------
insert into public.catalog_services (
  vertical_id, slug, name, summary, description,
  pricing_model, base_price_minor, currency, duration_minutes, provider_supplied,
  source_table, source_id, status
)
select
  v.id, s.slug, s.name, s.summary, s.description,
  s.pricing_model, s.base_price_minor, 'NGN', s.duration_minutes, s.provider_supplied,
  s.source_table, null::uuid, 'active'
from (
  values
    -- garment care
    ('garment-care', 'dry-cleaning-essentials', 'Dry Cleaning Essentials', 'Professional dry cleaning for suits, dresses, and everyday formalwear.', 'Garments are sorted, treated, dry cleaned, finished, and returned ready to wear — with delicate fabrics handled by hand.', '{"kind":"from"}'::jsonb, 300000::bigint, 90::int, false, null::text),
    ('garment-care', 'pressing-and-finishing', 'Pressing & Finishing', 'Crisp pressing and finishing for shirts, trousers, and formalwear.', 'A fast turnaround for pieces that just need to look sharp — pressed, finished, and packed.', '{"kind":"from"}'::jsonb, 120000::bigint, 45::int, false, null::text),
    ('garment-care', 'stain-and-delicate-care', 'Stain & Delicate Care', 'Specialist stain treatment and careful handling for delicate fabrics.', 'Targeted stain treatment and low-risk handling for silk, wool, and embellished garments that deserve extra care.', '{"kind":"from"}'::jsonb, 350000::bigint, 120::int, false, null::text),
    -- laundry
    ('laundry', 'wash-dry-fold', 'Wash, Dry & Fold', 'Everyday laundry washed, dried, neatly folded, and returned.', 'Drop your everyday load and get it back clean, dried, and folded — the routine task, handled.', '{"kind":"from"}'::jsonb, 500000::bigint, 1440::int, false, null::text),
    ('laundry', 'bulk-laundry-service', 'Bulk Laundry Service', 'High-volume laundry for households, hostels, and small businesses.', 'A higher-capacity wash plan for the loads that are too large for a single run, with consistent turnaround.', '{"kind":"from"}'::jsonb, 1200000::bigint, 1440::int, false, null::text),
    ('laundry', 'ironing-service', 'Ironing Service', 'Pressed and ready-to-wear ironing for full loads.', 'Send a full load of clean clothes and receive them pressed, folded, and ready to wear.', '{"kind":"from"}'::jsonb, 400000::bigint, 720::int, false, null::text),
    -- home cleaning (bookable — slugs match the live booking packages)
    ('home-cleaning', 'signature-home-refresh', 'Signature Home Refresh', 'A one-time residential reset for bedrooms, bathrooms, and living areas.', 'Surfaces, kitchen touchpoints, bathrooms, and presentation-focused finishing in a single thorough visit.', '{"kind":"flat"}'::jsonb, 2600000::bigint, 210::int, false, 'care_service_packages'),
    ('home-cleaning', 'weekly-home-ritual', 'Weekly Home Ritual', 'A recurring weekly plan that keeps your home consistently cared for.', 'Lighter, regular resets designed to hold a consistent standard week after week.', '{"kind":"flat"}'::jsonb, 2200000::bigint, 180::int, false, 'care_service_packages'),
    -- office cleaning (bookable)
    ('office-cleaning', 'office-starter', 'Office Starter', 'Maintenance cleaning for compact teams, suites, and tidy floors.', 'A right-sized plan for small offices that keeps workspaces, reception, and shared areas presentable.', '{"kind":"flat"}'::jsonb, 4200000::bigint, 240::int, false, 'care_service_packages'),
    ('office-cleaning', 'office-growth', 'Office Growth', 'Recurring medium-office cleaning with reception and shared-area depth.', 'Adds reception, shared workspace, restroom, and common-area depth for growing teams.', '{"kind":"flat"}'::jsonb, 6500000::bigint, 300::int, false, 'care_service_packages'),
    ('office-cleaning', 'after-hours-command', 'After-hours Command', 'A quiet-window workspace reset for teams that need zero disruption.', 'Cleaning scheduled in the night window so your team never loses a working minute.', '{"kind":"flat"}'::jsonb, 7200000::bigint, 330::int, false, 'care_service_packages'),
    -- deep cleaning
    ('deep-cleaning', 'deep-reset', 'Deep Reset', 'A high-intensity deep clean for kitchens, bathrooms, and neglected detail.', 'A heavy, detail-line clean for kitchens, bathrooms, and the build-up that routine cleaning leaves behind.', '{"kind":"flat"}'::jsonb, 4200000::bigint, 320::int, false, 'care_service_packages'),
    ('deep-cleaning', 'move-in-move-out-clean', 'Move-in / Move-out Clean', 'A full turnover clean prepared for vacant properties and handovers.', 'A complete reset for empty properties — built for move transitions, handovers, and turnover quality.', '{"kind":"from"}'::jsonb, 5000000::bigint, 360::int, false, null::text),
    -- repairs (provider-supplied)
    ('repairs', 'home-repairs-handyman', 'Home Repairs & Handyman', 'Fittings, fixes, and minor home repairs handled by a verified pro.', 'The small jobs that pile up — fittings, mounts, and minor repairs — handled in one visit by a verified provider.', '{"kind":"from"}'::jsonb, 800000::bigint, 120::int, true, null::text),
    ('repairs', 'appliance-fitting', 'Appliance Fitting', 'Safe installation and fitting for home and office appliances.', 'Correct, safe installation and fitting for the appliances that need a steady, qualified hand.', '{"kind":"from"}'::jsonb, 1000000::bigint, 120::int, true, null::text),
    -- errands
    ('errands', 'personal-errands', 'Personal Errands', 'Pickups, drop-offs, queueing, and the tasks you would rather hand off.', 'A flexible block of time to run the errands and tasks that take up your day.', '{"kind":"from"}'::jsonb, 600000::bigint, 120::int, false, null::text),
    ('errands', 'pickup-and-dropoff', 'Pickup & Drop-off', 'Reliable courier pickups and drop-offs across the service area.', 'A dependable pickup-and-drop-off run for documents, parcels, and the things that need to move.', '{"kind":"from"}'::jsonb, 450000::bigint, 90::int, false, null::text),
    -- moving
    ('moving', 'home-move-support', 'Home Move Support', 'Packing, loading, and relocation support for a calm moving day.', 'A coordinated team for packing, loading, and the moving-day work, delivered by a verified provider.', '{"kind":"from"}'::jsonb, 4500000::bigint, 480::int, true, null::text),
    ('moving', 'packing-service', 'Packing Service', 'Careful, labelled packing so nothing arrives broken or lost.', 'Methodical, labelled packing of your home or office so the move stays organised and nothing is lost.', '{"kind":"from"}'::jsonb, 1800000::bigint, 240::int, false, null::text),
    -- event support
    ('event-support', 'event-setup-and-cleanup', 'Event Setup & Cleanup', 'Set-up before and a thorough reset after your event.', 'Arrive to a prepared space and leave the clean-up to us — set-up before and a full reset after.', '{"kind":"from"}'::jsonb, 3500000::bigint, 360::int, false, null::text),
    ('event-support', 'event-staffing', 'Event Staffing', 'Verified support staff for the run of your event.', 'Vetted support staff scheduled for the run of your event and scoped to what the day needs.', '{"kind":"quote"}'::jsonb, null::bigint, null::int, true, null::text),
    -- business support
    ('business-support', 'recurring-facility-care', 'Recurring Facility Care', 'A standing operational care plan for offices and facilities.', 'A standing plan that keeps offices and facilities consistently maintained on a schedule you set.', '{"kind":"from"}'::jsonb, 8000000::bigint, 480::int, false, null::text),
    ('business-support', 'business-concierge', 'Business Concierge', 'An ongoing support partner for the errands your business runs on.', 'A recurring concierge for the operational errands and tasks that keep a business moving.', '{"kind":"from"}'::jsonb, 6000000::bigint, null::int, false, null::text),
    -- provider-assisted
    ('provider-assisted', 'specialist-deep-clean', 'Specialist Deep Clean', 'Specialist-grade deep cleaning delivered by a verified provider.', 'A specialist-grade deep clean for demanding spaces, delivered by a verified provider.', '{"kind":"from"}'::jsonb, 5000000::bigint, 360::int, true, null::text),
    ('provider-assisted', 'verified-specialist-service', 'Verified Specialist Service', 'Bespoke specialist work scoped and quoted by a verified provider.', 'Bespoke specialist work scoped to your request and quoted by a verified provider before any commitment.', '{"kind":"quote"}'::jsonb, null::bigint, null::int, true, null::text)
) as s(vertical_slug, slug, name, summary, description, pricing_model, base_price_minor, duration_minutes, provider_supplied, source_table)
join public.service_verticals v on v.slug = s.vertical_slug
on conflict (slug) do nothing;

-- end of migration --
