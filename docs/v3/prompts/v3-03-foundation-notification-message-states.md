# V3-03 — Foundation Lock: Notification & Message States

> **STATUS: SHIPPED — PR #131.** Merged and certified on `main` within the Phase B Foundation Lock (CERTIFIED at V3-12, PR #168). The message-level read-state columns, the sent/delivered/seen delivery-state machine, the redelivery cron, and the unified notification bell are live. This document is the elevated canonical spec and closure record. Anything still open is named under **Deferred / residual**.

**Pass ID:** V3-03  ·  **Phase:** B (Foundation Lock)  ·  **Pillar:** P3 (Personalization), P12 (Global)
**Dependencies:** —  ·  **Effort:** L  ·  **Parallel-safe:** Y (with V3-01, V3-05, V3-07, V3-09, V3-10)
**Owner gate:** none  ·  **Risk class:** —

---

## Role
You are the V3 Foundation engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass closes the **notification & message states** sub-bar of Foundation Lock. The owner's most-cited gap: support-thread and support-message unread state is *fake* — only `customer_notifications` / `staff_notifications` carry `is_read`/`read_at`; the shared `support_threads` / `support_messages` tables do not. This pass makes message-level read state real, adds a `sent → delivered → seen → failed` delivery-state machine, retries transient in-app delivery, and unifies the notification badge across every shell. The line you must not cross: no new notification taxonomy, no authoring tool, no mobile push (those are later passes), and RLS must make it impossible to mark another user's message as read.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/03-notification-message-states` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

Branch off `origin/main` after a parallel-session check.

## Audit summary
The customer + staff notification audience model is solid, with Supabase Realtime publication on the notification tables. The critical gap: `support_threads` and `support_messages` carry no `is_read`/`read_at`, so message-level unread state is fabricated in the UI — only notification-level unread persistence is real. Three further gaps: no delivery-state machine (sent/delivered/seen) exists in the WhatsApp-ledger sense; in-app (Realtime) delivery has no retry on transient failure (only email has the fallback cron); and the notification bell is wired inconsistently — six division shells still lack it. A separate audit finding recorded 409 `customer_notifications` rows pointing at legacy `/care?booking=%` URLs. This pass adds real per-message read state + denormalized thread unread counts (trigger-maintained), the delivery-state machine across messages and both notification tables, a Realtime-redelivery cron, the unified bell, read-receipt UI in `@henryco/messaging-thread`, and the owner-gated legacy-link backfill script. The notification-health tile it ships is consumed by V3-08 (empty-dashboard truth).

## Mandatory scope

### S1 — Message-level read state on `support_messages` + `support_threads`
Add to `support_messages`: `is_read BOOLEAN NOT NULL DEFAULT FALSE`, `read_at TIMESTAMPTZ`, `read_by UUID` (which staff member marked read). Add to `support_threads`: `last_read_message_id UUID`, `last_staff_read_message_id UUID`, `unread_count_customer INTEGER NOT NULL DEFAULT 0`, `unread_count_staff INTEGER NOT NULL DEFAULT 0` (denormalized caches, trigger-maintained). RLS: a customer may update `is_read`/`read_at` only on their own thread's messages; staff may update only on threads they access via `is_staff_in()`. Backfill: set `is_read = true` for a user's own outbound messages, `is_read = false` for inbound, capped to the last 30 days per thread to avoid badge spam.

### S2 — Delivery-state machine
Add `delivery_state TEXT NOT NULL DEFAULT 'sent' CHECK (delivery_state IN ('sent','delivered','seen','failed'))` to `support_messages`, `customer_notifications`, and `staff_notifications`. Transitions: insert → `sent`; Realtime push acknowledged (publisher writes back via `notification_delivery_log`) → `delivered`; recipient reads (`is_read = true`) → `seen` + `read_at`; permanent failure (e.g. Resend hard bounce on email fallback) → `failed`. UI: a subtle delivery pip in the messaging thread (single tick = sent, double = delivered, double-blue = seen).

### S3 — In-app redelivery on transient failure
New cron `apps/account/app/api/cron/notification-redelivery/route.ts` on Vercel schedule `*/5 * * * *` (declared in `apps/account/vercel.json`), `CRON_SECRET`-gated fail-closed. It finds notifications still `sent` with `created_at > now() - 1 hour`, re-publishes via the Realtime channel, falls back to email after 1 hour if the user has email-fallback enabled, and marks `failed` after 24 hours. Email retry stays in the existing email-fallback cron.

### S4 — Legacy `/care?booking=` notification backfill (owner-gated apply)
Implements the rewrite path for the 409 legacy notifications. Script `scripts/v3/notification-link-backfill.mjs`: read-only by default; finds `customer_notifications.action_url` matching legacy patterns (`/care?booking=%` and any siblings discovered during the run); rewrites to the current route format using the typed deep-link builders (`/care/bookings/<bookingId>` via the `@henryco/seo` builder, never string concat); dry-run prints count + samples; apply mode is gated by `OWNER_OK=true` + `--apply` and runs UPDATEs in batches of 100 with progress logging; idempotent and safe to re-run. The "rewrite vs accept" decision is owner-owned — V3-04 carries the forward-going enforcement; this script is the one-time remediation.

### S5 — Unified notification bell
Wire `@henryco/notifications-ui` `<NotificationBell />` into the six division shells still missing it (per the backlog E1 inventory: the gaps among care, jobs, learn, logistics, marketplace, property, studio shells + the hub owner workspace). The badge count = unread `customer_notifications` for customers, unread `staff_notifications` for staff; it updates live over the existing Realtime subscription and respects category mutes from `notification_signal_preferences`.

### S6 — Read-receipt UI in `@henryco/messaging-thread`
Render the delivery pip per outbound message; mark inbound messages read when scrolled into view (IntersectionObserver) and advance `last_read_message_id`; render a "New" divider above the first unread message; scroll-to-first-unread on thread open.

### S7 — Telemetry
Emit via `@henryco/observability`: `henry.notification.delivered`, `henry.notification.read`, `henry.notification.failed`, `henry.message.delivered`, `henry.message.read`, `henry.message.failed`. Ship an owner-workspace "Notification health" tile: daily delivery success rate, average sent-to-read time, failure breakdown.

## Out of scope
- Notification authoring tool — V3-46 / V3-48.
- Mobile push — V3-87 / V3-88.
- Delivery-preference UI redesign + new categories (existing preserved).

## Dependencies
Depends on: Phase A audit. Blocks: **V3-08** (consumes the notification-health tile), **V3-37** (abandoned-task recovery uses delivery state for retry), **V3-45** (auto-remind uses delivery state), **V3-87** (mobile read-receipt UI mirrors web).

## Inheritance
`@henryco/notifications`, `@henryco/notifications-ui`, `@henryco/messaging-thread` (extend) · the `support_threads` / `support_messages` / `customer_notifications` / `staff_notifications` tables (extend with columns + triggers) · the existing notification Realtime publication (extend to publish `delivery_state`) · `notification_delivery_log` (extend) · the email-fallback cron · `@henryco/seo` deep-link builders for S4 rewrites · `@henryco/config` domain helpers for any URL.

## Implementation requirements

### Files
Migration `apps/hub/supabase/migrations/<ts>_support_message_read_state.sql` (columns + indexes + unread-count trigger + RLS). Backfill `scripts/v3/notification-link-backfill.mjs`. `packages/notifications/src/` (publisher sets `delivery_state='sent'`, writes `notification_delivery_log` on Realtime ack). `packages/notifications-ui/src/` (live-unread bell + mute logic). `packages/messaging-thread/src/` (pip, IntersectionObserver read-marking, "New" divider). Cron `apps/account/app/api/cron/notification-redelivery/route.ts` + `apps/account/vercel.json` entry. Per-app: `<NotificationBell />` in the six missing shells. Owner tile `apps/hub/app/owner/(command)/dashboard/notification-health-tile.tsx`.

### Migration (the load-bearing shape)
```sql
ALTER TABLE support_messages
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS read_by UUID,
  ADD COLUMN IF NOT EXISTS delivery_state TEXT NOT NULL DEFAULT 'sent'
    CHECK (delivery_state IN ('sent','delivered','seen','failed'));

CREATE INDEX IF NOT EXISTS idx_support_messages_thread_unread
  ON support_messages(thread_id) WHERE is_read = FALSE;

ALTER TABLE support_threads
  ADD COLUMN IF NOT EXISTS last_read_message_id UUID,
  ADD COLUMN IF NOT EXISTS last_staff_read_message_id UUID,
  ADD COLUMN IF NOT EXISTS unread_count_customer INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unread_count_staff INTEGER NOT NULL DEFAULT 0;

ALTER TABLE customer_notifications
  ADD COLUMN IF NOT EXISTS delivery_state TEXT NOT NULL DEFAULT 'sent'
    CHECK (delivery_state IN ('sent','delivered','seen','failed'));
ALTER TABLE staff_notifications
  ADD COLUMN IF NOT EXISTS delivery_state TEXT NOT NULL DEFAULT 'sent'
    CHECK (delivery_state IN ('sent','delivered','seen','failed'));

-- Trigger maintains support_threads.unread_count_* on message insert/read-flip
CREATE OR REPLACE FUNCTION update_thread_unread_counts()
RETURNS TRIGGER AS $$ BEGIN
  -- recompute unread_count_customer / unread_count_staff for NEW.thread_id
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_support_messages_unread_count
  AFTER INSERT OR UPDATE OF is_read ON support_messages
  FOR EACH ROW EXECUTE FUNCTION update_thread_unread_counts();

-- RLS: customer updates is_read on own thread's messages; staff via is_staff_in()
```

### Trust / safety / compliance
`read_at` is personal data under NDPR/GDPR — respect the existing 30-day customer-notification purge. RLS strictly enforced: a user cannot mark another user's message read (test with customer/staff/owner contexts). Delivery-state changes audit-logged via `@henryco/observability/audit-log`. The backfill script is internally rate-limited and never reachable from a public endpoint.

### Mobile + desktop parity
Web: full S1–S7. The `@henryco/messaging-thread` read-receipt interface is built so it compiles for the Expo super-app chat surfaces (native wiring deferred to V3-87, but the package contract works on Expo).

### i18n
New strings (pip tooltips, "New" divider, badge labels) flow through `@henryco/i18n` under `surface:notification-message`. Populate en-US; runtime DeepL fills the other 11 locales. No hardcoded user-facing text.

### Brand & design system
Any user-facing brand string ("Henry Onyx") and division labels in tiles/bell come from `@henryco/config` — never hardcoded. The bell, pip, and health tile use locked tokens (`--site-*` / `--accent`, Fraunces for any display type), light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed. All URLs via `@henryco/config` domain helpers and the `@henryco/seo` builders — zero literal domains.

## Validation gates
1. `pnpm lint` / `pnpm typecheck` / tests / `pnpm ci:validate` build / `pnpm i18n:check` / `pnpm a11y` / security-headers gate — all green. 2. RLS: every new policy tested under customer, staff, and owner contexts. 3. Migration runs idempotently on a staging clone. 4. Backfill dry-run output reviewed by the owner before any apply. 5. Smoke: send a support message → recipient's pip walks sent → delivered → seen as they read; bell badge updates live on new message; muting a category drops it from the count; the cron redelivers a stuck `sent` push within 5 minutes. 6. Real-browser light + dark + mobile + desktop on the bell + thread.

## Deployment gate
All gates green; backfill apply-mode runs only after explicit owner approval; squash-merge to `main`; 48-hour soak after the migration with no delivery-failure spike.

## Final report contract
`.codex-temp/v3-03-notification-message-states/report.md` with the standard 9 sections — exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification (48-h soak) · telemetry baseline (6 events) · deferred items · pass-closure assertion — plus the delivery-state-machine diagram and the backfill summary.

## Deferred / residual (post-ship, this pass is merged)
- Mobile push delivery + native read receipts → V3-87 / V3-88.
- Operator-surface i18n completeness on notification copy → V3-07b.

## Self-verification
- [ ] S1 migration live: `support_messages` carries real `is_read`/`read_at`/`read_by`; thread unread counts trigger-maintained; backfill capped to 30 days.
- [ ] S2 delivery-state machine on messages + both notification tables; UI pip renders sent/delivered/seen.
- [ ] S3 redelivery cron live, `CRON_SECRET`-gated, redelivers within 5 minutes and fails over to email after 1 hour.
- [ ] S4 legacy `/care?booking=` notifications backfilled via typed builders (or owner-deferred); script idempotent + dry-run-first.
- [ ] S5 bell wired in all six missing shells + hub owner; respects category mutes; updates live.
- [ ] S6 read-receipt UI in `@henryco/messaging-thread` (pip, IntersectionObserver, "New" divider, scroll-to-first-unread).
- [ ] S7 the 6 telemetry events emit; notification-health tile renders.
- [ ] RLS proven: no user can mark another user's message read.
- [ ] All new strings under `surface:notification-message`; brand + domains sourced from `@henryco/config`.
- [ ] Report written; hand-off named: V3-08 (empty-dashboard truth) consumes the health tile.
