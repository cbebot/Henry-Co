-- INCIDENT-NOTIFICATIONS-CATEGORY follow-on (2026-06-06): reconcile the
-- customer_notifications PRIORITY check constraint with the code's vocabulary.
--
-- Discovered while verifying the category-constraint fix
-- (20260606120500_customer_notifications_category_constraint_reconcile.sql):
-- once category violations stopped, inserts began failing on
-- customer_notifications_priority_check instead. Same drift class, second column.
--
-- The `priority` column is, by the code's design, effectively a SEVERITY column:
--   * the publisher shim writes priority = severity (packages/notifications
--     publish.ts: `priority: validation.severity`), severity in
--     {info, success, warning, urgent, security} (types.ts SEVERITIES);
--   * get_signal_feed ranks by these severity weights
--     (20260507..._get_signal_feed.sql);
--   * notifications-ui normalizeSeverity() reads severity values and coerces
--     legacy priority values ('high'/'critical' -> urgent, 'low' -> info).
-- The CHECK constraint, however, still only allowed the legacy priority
-- vocabulary {low, normal, high, urgent}, so every shim publish whose severity
-- was not literally 'urgent' (i.e. the vast majority: info/success/warning/
-- security) was rejected once the category check passed.
--
-- FIX: widen to EXACTLY the union the code writes + existing rows hold — the 4
-- legacy priority values (existing rows + care sync-refresh UPDATE writes
-- 'high'/'normal') UNION the 5 registered severity values. No wildcard.
-- Forward-safe + idempotent; pre-flight confirmed 0 existing rows fall outside
-- the set. Touches ONLY customer_notifications_priority_check — no other DDL.

set check_function_bodies = off;

alter table public.customer_notifications
  drop constraint if exists customer_notifications_priority_check;

alter table public.customer_notifications
  add constraint customer_notifications_priority_check
  check (priority = any (array[
    -- Legacy priority vocabulary (existing rows + care sync-refresh UPDATE paths).
    'low','normal','high','urgent',
    -- Registered severity vocabulary — packages/notifications types.ts SEVERITIES
    -- (the publisher shim writes priority = severity; get_signal_feed ranks on these).
    'info','success','warning','security'
  ]::text[]));

comment on constraint customer_notifications_priority_check on public.customer_notifications is
  'Allowed priority vocabulary = 4 legacy priority values (existing rows + care '
  'sync UPDATE) UNION the 5 registered severity values from packages/notifications '
  'SEVERITIES (the shim writes priority = severity). Keep in lock-step with SEVERITIES. '
  'Reconciled 2026-06-06 after the category-check drift incident unmasked this.';
