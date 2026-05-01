-- V2-NOT-01-A: Foundation extensions for the cross-division notification signal system.
--
-- Reality on disk before this migration:
--   * public.customer_notifications already exists in production with: id, user_id, title,
--     body, created_at, is_read, read_at, archived_at, deleted_at, division, category,
--     priority, reference_type, reference_id, action_url, detail_payload, metadata.
--     RLS is established. Lifecycle, signal, recent, mark-all-read, batch endpoints
--     and a NotificationSignalProvider/NotificationBell already operate against it.
--   * public.customer_preferences already covers in-app prefs: in_app_toast_enabled,
--     notification_sound_enabled, notification_vibration_enabled, high_priority_only,
--     quiet_hours_enabled, quiet_hours_start, quiet_hours_end, plus per-division
--     booleans (notification_jobs/learn/property/logistics/referrals) and channel
--     toggles (whatsapp_enabled, sms_enabled).
--   * public.notification_delivery_log already records cross-division email/sms/push
--     delivery attempts with RLS for own-row reads + service-role writes.
--
-- This migration adds the small set of fields the notification publisher shim
-- (packages/notifications) and the eventual email-fallback worker (NOT-01-C) need:
--
--   customer_preferences:
--     - email_fallback_enabled (default true)
--     - email_fallback_delay_hours (default 24, constrained to 1/4/12/24/48)
--     - quiet_hours_timezone (IANA, nullable -> use system default)
--     - muted_event_types text[]   (forward-looking canonical mute list)
--     - muted_divisions text[]     (forward-looking canonical mute list; coexists with
--                                   the legacy per-division booleans, see usage notes)
--
--   customer_notifications:
--     - actor_user_id  (who triggered, nullable for system events)
--     - email_dispatched_at (set when email fallback fires)
--     - email_provider ('resend'|'brevo'|null)
--     - publisher (which subsystem inserted; 'system' | service identifier)
--     - request_id (for correlation with API/dispatcher logs)
--
-- All ALTERs are idempotent (`add column if not exists`).
-- No data migration needed. Existing rows take the column defaults.

set check_function_bodies = off;

------------------------------------------------------------------------
-- customer_preferences additions
------------------------------------------------------------------------

alter table public.customer_preferences
  add column if not exists email_fallback_enabled boolean not null default true,
  add column if not exists email_fallback_delay_hours integer not null default 24,
  add column if not exists quiet_hours_timezone text,
  add column if not exists muted_event_types text[] not null default '{}'::text[],
  add column if not exists muted_divisions text[] not null default '{}'::text[];

-- Constrain email_fallback_delay_hours to the supported choices.
-- Drop-and-recreate the constraint so re-runs land idempotently even after value churn.
alter table public.customer_preferences
  drop constraint if exists customer_preferences_email_fallback_delay_choices;

alter table public.customer_preferences
  add constraint customer_preferences_email_fallback_delay_choices
  check (email_fallback_delay_hours in (1, 4, 12, 24, 48));

-- IANA timezone validation: keep simple and permissive (length + character set),
-- since Postgres has no built-in IANA validator. The publisher layer rejects
-- bad values before they reach the column; this is a belt-and-braces guard.
alter table public.customer_preferences
  drop constraint if exists customer_preferences_quiet_hours_timezone_shape;

alter table public.customer_preferences
  add constraint customer_preferences_quiet_hours_timezone_shape
  check (
    quiet_hours_timezone is null
    or (
      length(quiet_hours_timezone) between 1 and 64
      and quiet_hours_timezone ~ '^[A-Za-z0-9_+\-/]+$'
    )
  );

------------------------------------------------------------------------
-- customer_notifications additions
------------------------------------------------------------------------

alter table public.customer_notifications
  add column if not exists actor_user_id uuid references auth.users(id) on delete set null,
  add column if not exists email_dispatched_at timestamptz,
  add column if not exists email_provider text,
  add column if not exists publisher text,
  add column if not exists request_id text;

alter table public.customer_notifications
  drop constraint if exists customer_notifications_email_provider_known;

alter table public.customer_notifications
  add constraint customer_notifications_email_provider_known
  check (email_provider is null or email_provider in ('resend', 'brevo'));

------------------------------------------------------------------------
-- Indexes for the email-fallback worker scan (NOT-01-C consumes these).
-- Predicate index: only rows that are candidates for fallback are tracked.
------------------------------------------------------------------------

create index if not exists customer_notifications_email_fallback_candidate_idx
  on public.customer_notifications(created_at, user_id)
  where email_dispatched_at is null
    and is_read = false
    and archived_at is null
    and deleted_at is null;

create index if not exists customer_notifications_actor_user_idx
  on public.customer_notifications(actor_user_id)
  where actor_user_id is not null;

------------------------------------------------------------------------
-- notification_delivery_log: tighten audit shape for the publisher shim.
-- The existing table records the channel-specific delivery attempts;
-- the shim writes a row per publish (success or failure) for cross-correlation.
------------------------------------------------------------------------

alter table public.notification_delivery_log
  add column if not exists publisher text,
  add column if not exists actor_user_id uuid references auth.users(id) on delete set null,
  add column if not exists request_id text;

create index if not exists notification_delivery_log_request_idx
  on public.notification_delivery_log(request_id)
  where request_id is not null;

------------------------------------------------------------------------
-- Documentation comments — a future operator reading the live schema sees the intent.
------------------------------------------------------------------------

comment on column public.customer_preferences.email_fallback_enabled
  is 'When true, unread + unarchived in-app notifications older than email_fallback_delay_hours trigger an email via the per-division sender.';
comment on column public.customer_preferences.email_fallback_delay_hours
  is 'Hours after creation before an unread notification triggers email fallback. Constrained to 1/4/12/24/48.';
comment on column public.customer_preferences.quiet_hours_timezone
  is 'IANA timezone for quiet_hours_start/end interpretation. NULL falls back to the system default at evaluation time.';
comment on column public.customer_preferences.muted_event_types
  is 'Forward-looking canonical mute list per event_type. Items in this list still INSERT to inbox but suppress toast/sound/vibration.';
comment on column public.customer_preferences.muted_divisions
  is 'Forward-looking canonical mute list per division. Coexists with legacy per-division boolean columns (notification_jobs, notification_learn, ...). The publisher reads BOTH; either source can mute.';

comment on column public.customer_notifications.actor_user_id
  is 'Who triggered the event that produced this notification. Nullable for system-driven events.';
comment on column public.customer_notifications.email_dispatched_at
  is 'Set by the email-fallback worker (NOT-01-C) when it sends the fallback email. Null until then.';
comment on column public.customer_notifications.email_provider
  is 'Which provider sent the fallback email (resend | brevo). Null until fallback fires.';
comment on column public.customer_notifications.publisher
  is 'Identifier of the subsystem that inserted this row (e.g. ''shim:packages/notifications'' or ''dispatcher:apps/care/lib/notifications.ts'').';
comment on column public.customer_notifications.request_id
  is 'Correlates with API request logs / dispatcher trace IDs for incident replay.';
