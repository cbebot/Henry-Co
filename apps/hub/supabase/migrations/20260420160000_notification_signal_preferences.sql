alter table public.customer_preferences
  add column if not exists in_app_toast_enabled boolean not null default true,
  add column if not exists notification_sound_enabled boolean not null default false,
  add column if not exists notification_vibration_enabled boolean not null default false,
  add column if not exists high_priority_only boolean not null default false,
  add column if not exists quiet_hours_enabled boolean not null default false,
  add column if not exists quiet_hours_start time without time zone not null default '22:00:00'::time,
  add column if not exists quiet_hours_end time without time zone not null default '07:00:00'::time;
