# V3-03 — Foundation: Notification & Message States

**Pass ID:** V3-03
**Phase:** B (FOUNDATION LOCK)
**Pillar:** P3 (Personalisation), P12 (Global)
**Dependencies:** Phase A audit
**Effort:** L (2–4 weeks)
**Parallel-safe:** YES (with V3-01, V3-05, V3-07, V3-09, V3-10)
**Owner gate:** None
**Risk class:** None

---

## Role

You are the V3 Foundation engineer for HenryCo. You execute exactly this one pass, then stop and report.

This pass closes the **notification & message states** sub-bar of FOUNDATION LOCK. The owner's most-cited gap (per PRODUCT-GAP-LEDGER) is that support thread + support message unread state is fake — only notifications carry `is_read`/`read_at`. This pass makes message-level state real, adds a delivery-state machine, and unifies the notification badge-count behavior across surfaces.

---

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/03-notification-message-states` |
| Deploy | Vercel (10 web projects) |
| Backend | Supabase |
| OS context | Windows + bash; pnpm 9.15.5; Node 24.x |

---

## Audit summary (lifted from AUDIT-BASELINE.md §3.3 + §2.2 + PRODUCT-GAP-LEDGER)

> ### 3.3 Notifications & message states
> - **Solid:** customer + staff notification audience model
> - **Solid:** Realtime via Supabase publication on notification tables
> - **CRITICAL GAP (PRODUCT-GAP-LEDGER):** `support_threads` + `support_messages` have NO `is_read`/`read_at` — message-level unread state is fake; only thread-level is real
> - **CRITICAL GAP (PRODUCT-GAP-LEDGER 2026-04-09):** 409 customer_notifications referenced legacy `/care?booking=%` URLs at time of audit
> - **Gap:** delivery state machine (sent/delivered/seen) per WhatsApp-style ledger not modeled
> - **Gap:** notification retry on transient failure verified for email, not modeled for in-app delivery

From PRODUCT-GAP-LEDGER §"Confirmed Functionality Gaps":

> Support thread and support message unread state is still not real. The shared tables `support_threads` and `support_messages` do not carry `is_read` or `read_at`. Notifications do carry `is_read` and `read_at`, so only notification unread persistence is real today.

---

## Mandatory scope (what is in)

### S1 — Message-level read state on `support_messages`

Add columns:
- `is_read BOOLEAN NOT NULL DEFAULT FALSE`
- `read_at TIMESTAMPTZ`
- `read_by UUID` — for staff messages, which staff member marked read

Add columns to `support_threads`:
- `last_read_message_id UUID REFERENCES support_messages(id)` — pointer to latest read message per the thread owner
- `last_staff_read_message_id UUID` — pointer for staff-side
- `unread_count_customer INTEGER` — denormalized cache, maintained by trigger
- `unread_count_staff INTEGER` — denormalized cache, maintained by trigger

Migration: `apps/hub/supabase/migrations/2026XXXXNNNNN_support_message_read_state.sql`. RLS policies:
- Customer can update `is_read`/`read_at` on their own thread's messages only.
- Staff can update on threads they have access to per `is_staff_in()`.
- Triggers maintain `support_threads.unread_count_*` on insert/update of `support_messages`.

Backfill: existing `support_messages` set `is_read=true` for messages sent by the user themselves (their own outbound is "read"); set `is_read=false` for inbound messages — but cap the "unread" at the last 30 days per thread to avoid badge spam.

### S2 — Delivery state machine

New column `delivery_state` on `support_messages` (NULL if not applicable):
- `'sent'` — server has accepted the message
- `'delivered'` — the recipient's notification was delivered (in-app realtime OR email-fallback successful)
- `'seen'` — recipient has read the message (`is_read = true`)
- `'failed'` — delivery failed permanently

Same column added to `customer_notifications` and `staff_notifications`.

Triggers/code:
- On insert, `delivery_state = 'sent'`.
- On Realtime push, `delivery_state = 'delivered'` (the publisher writes back via the notification-delivery-log table).
- On read, `delivery_state = 'seen'` + `read_at` set.
- On email-fallback delivery failure (Resend hard bounce), `delivery_state = 'failed'`.

UI: subtle delivery state pip in messaging-thread (single tick = sent, double tick = delivered, double-tick-blue = seen) — WhatsApp-style.

### S3 — Notification retry on transient failure

Existing email-fallback cron handles email delivery retry. Extend to in-app:

- If a Supabase Realtime push fails for a connected client (rare, but happens), the notification-delivery-log table records the failure.
- A new cron `apps/account/app/api/cron/notification-redelivery/route.ts` runs every 5 minutes:
  - Finds notifications where `delivery_state = 'sent'` and `created_at > now() - 1 hour`.
  - Re-publishes via Realtime channel.
  - After 1 hour with no delivery, falls back to email if user has email-fallback preference enabled.
  - After 24 hours, marks as `'failed'`.

### S4 — Legacy /care?booking= notification backfill

Per PRODUCT-GAP-LEDGER 2026-04-09: 409 customer_notifications referenced `/care?booking=%` URLs at audit. Owner decision required: rewrite or accept.

This pass implements the rewrite path:
- Migration script `scripts/v3/notification-link-backfill.mjs` — finds notifications matching legacy patterns, rewrites to current route format (`/care/bookings/<bookingId>`).
- Dry-run mode (default) outputs count + sample.
- Apply mode requires `OWNER_OK=true` env var + `--apply` flag.
- Idempotent — safe to re-run.

### S5 — Notification badge unified

The notification bell in every shell (currently inconsistent per V3-BACKLOG E1) renders:
- Count = sum of unread `customer_notifications` for customer; unread `staff_notifications` for staff role.
- Updates live via existing Realtime subscription.
- Badge respects category mute preferences from `notification_signal_preferences`.

Wire `@henryco/notifications-ui` bell into the 6 division shells still missing it (per V3-BACKLOG E1):
- hub owner workspace
- care, jobs, learn, logistics, marketplace, property, studio shells (the wired ones from V2 + the gaps from E1)

### S6 — Message-thread read receipts UI

In `@henryco/messaging-thread` (existing extracted package):
- Show delivery state pip per outbound message.
- Mark inbound message as `read` when scrolled into view (IntersectionObserver).
- Auto-update `last_read_message_id` on the thread.
- Unread divider rendered above the first unread message ("New" line).
- Scroll-to-first-unread on thread open.

### S7 — Telemetry

Add events:
- `henry.notification.delivered`
- `henry.notification.read`
- `henry.notification.failed`
- `henry.message.delivered`
- `henry.message.read`
- `henry.message.failed`

Owner-workspace tile: "Notification health" — daily delivery success rate, average sent-to-read time, failure breakdown.

---

## Out of scope

- Notification authoring tool (V3-46 owner reports + V3-48 campaigns).
- Push notifications to mobile (V3-87 + V3-88).
- Per-user delivery preference UI redesign (existing `notification-preferences` UI preserved).
- New notification categories (existing taxonomy preserved).

---

## Dependencies

- Phase A audit complete.

Blocks:
- V3-08 (empty dashboard truth) — the notification health tile is a dashboard module.
- V3-37 (abandoned-task recovery) — relies on delivery state for retry decisions.
- V3-45 (auto-remind) — relies on delivery state for retry.
- V3-87 (mobile parity) — mobile read-receipt UI mirrors web.

---

## Inheritance

- `@henryco/notifications`, `@henryco/notifications-ui` — extend.
- `@henryco/messaging-thread` — extend.
- `customer_notifications`, `staff_notifications`, `support_threads`, `support_messages` — extend with new columns + triggers.
- Supabase Realtime publication (`20260501130000_notification_realtime_publication.sql`) — extend to publish `delivery_state` changes.
- `notification_delivery_log` (existing) — extend tracking.
- Email-fallback cron — extend with new redelivery cron.

---

## Implementation requirements

### Migration

`apps/hub/supabase/migrations/2026XXXXNNNNN_message_read_state.sql`:

```sql
-- support_messages read state
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

-- customer_notifications + staff_notifications delivery_state
ALTER TABLE customer_notifications
  ADD COLUMN IF NOT EXISTS delivery_state TEXT NOT NULL DEFAULT 'sent'
    CHECK (delivery_state IN ('sent','delivered','seen','failed'));

ALTER TABLE staff_notifications
  ADD COLUMN IF NOT EXISTS delivery_state TEXT NOT NULL DEFAULT 'sent'
    CHECK (delivery_state IN ('sent','delivered','seen','failed'));

-- Triggers for unread_count denormalization (idempotent)
CREATE OR REPLACE FUNCTION update_thread_unread_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Logic to update support_threads.unread_count_customer and unread_count_staff
  -- based on insert/update of support_messages
  -- (Full implementation in the migration file)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_support_messages_unread_count
  AFTER INSERT OR UPDATE OF is_read ON support_messages
  FOR EACH ROW EXECUTE FUNCTION update_thread_unread_counts();

-- RLS policies for update permissions on is_read
-- (Customer can update their own thread's message read state;
--  staff can update on threads they have access to per is_staff_in())
```

### Backfill script

`scripts/v3/notification-link-backfill.mjs`:
- Connects to Supabase (read-only by default).
- Finds `customer_notifications` matching legacy URL patterns (`/care?booking=%`, others discovered during audit).
- Generates rewrite mapping (legacy → current).
- Dry-run reports count + samples.
- Apply mode (gated by `OWNER_OK=true --apply`) executes UPDATE in batches of 100 with progress logging.
- Idempotent.

### Package changes

`packages/notifications/src/`:
- Extend publisher to set `delivery_state = 'sent'`.
- Extend `publishCustomerNotification` to write to `notification_delivery_log` on successful Realtime push.

`packages/notifications-ui/src/`:
- Bell badge subscribes to live unread count.
- Mute-category logic applied.

`packages/messaging-thread/src/`:
- Add delivery pip component.
- Add IntersectionObserver for scroll-into-view read-marking.
- Add "New" divider above first unread message.

### New cron

`apps/account/app/api/cron/notification-redelivery/route.ts`:
- Vercel cron `*/5 * * * *` (every 5 min) in `apps/account/vercel.json`.
- Requires `CRON_SECRET` per existing convention (fail-closed).
- Logic per S3.

### Per-app wiring

The 6 division shells missing notifications-ui bell (per V3-BACKLOG E1):
- Wire `<NotificationBell />` into each division's shell header.
- Verify Realtime subscription mounts.

### Owner-workspace tile

`apps/hub/app/owner/(command)/dashboard/notification-health-tile.tsx`:
- Shows delivery success rate (last 24h), average sent-to-read time, failure count.

---

## Trust / safety / compliance

- `read_at` is a personal data point per NDPR/GDPR; respect existing customer-notifications data-retention (30-day purge).
- RLS strictly enforced: a user cannot mark another user's message as read.
- Delivery state changes audit-logged at `@henryco/observability/audit-log` (already exists per DASH-9).
- ANTI-CLONE: Principle 4 — backfill script is rate-limited internally; cannot be triggered from public endpoints.

## Mobile + desktop parity

- Web: full S1–S7.
- Expo super-app: read-receipt UI mirrored in chat surfaces; deferred to V3-87 but design contract honored here so the package interface works on Expo.

## i18n

- New strings (delivery pip tooltips, "New" divider, badge count labels) go through `@henryco/i18n` namespace `surface:notification-message`.

---

## Validation gates

1. Lint/typecheck/tests/build/i18n/a11y/PNH-04 — standard.
2. RLS coverage: every new policy tested with three role contexts (customer, staff, owner).
3. Migration runs idempotently on a staging clone.
4. Backfill dry-run output reviewed by owner.
5. Smoke verification:
   - Send a support message; recipient sees delivery pip update sent → delivered → seen as they read.
   - Bell badge updates in real-time when new message arrives.
   - Mute a category; verify badge doesn't count muted notifications.
   - Cron redelivers a "failed" Realtime push within 5 minutes.

## Deployment gate

- All gates pass.
- Backfill apply-mode run only after owner explicit approval.
- 48-hour soak after migration.

## Final report contract

`.codex-temp/v3-03-notification-message-states/report.md` with the standard 9 sections + delivery-state machine state diagram + backfill summary.

---

## Self-verification

- [ ] Migration applied; all new columns + triggers + indexes live.
- [ ] `support_messages` carries real `is_read`/`read_at` everywhere.
- [ ] Delivery state machine implemented + UI pip rendering.
- [ ] Notification redelivery cron live + secret-gated.
- [ ] Legacy /care?booking= notifications backfilled OR owner-deferred.
- [ ] Bell wired in all 8 division shells + hub owner.
- [ ] 6 new observability events emitting.
- [ ] Owner-workspace notification-health tile rendering.
- [ ] Report written. Hand-off named: V3-08 (empty dashboard truth) consumes the new health tile.
