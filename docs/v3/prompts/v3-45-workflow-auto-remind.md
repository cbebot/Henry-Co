# V3-45 — Automation & Workflow: Auto-Remind Users

**Pass ID:** V3-45  ·  **Phase:** F (Automation & Workflow)  ·  **Pillar:** P5 (Automation & Workflow Engine)
**Dependencies:** V3-43 (workflow engine), V3-37 (abandoned-task recovery detection)  ·  **Effort:** M  ·  **Parallel-safe:** Y (with V3-44/46/48)
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 Auto-Remind engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass registers **reminder handlers** on the V3-43 workflow engine that nudge users toward incomplete, expiring, or abandoned actions — across in-app, email, push, and (high-priority + opted-in only) SMS — with per-type cadence, quiet-hours respect, and per-channel + per-type opt-out. It consumes V3-37's abandoned-task detection signals as triggers. The line it must not cross: reminders are **transactional, consent-gated nudges, never marketing** — quiet hours and opt-out are absolute, SMS is reserved for high-priority opted-in cases, and a user who opted out of a type or channel must never receive it. Broad marketing belongs to V3-48 campaigns / V3-61 newsletter.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/45-workflow-auto-remind` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

The consent + delivery plumbing already exists and is the foundation this pass stands on. `public.customer_preferences` carries the real opt-out + quiet-hours fields: `quiet_hours_enabled`, `quiet_hours_start`, `quiet_hours_end`, `quiet_hours_timezone` (IANA, nullable → system default), `high_priority_only`, `sms_enabled`, `whatsapp_enabled`, `muted_event_types text[]`, `muted_divisions text[]`, plus `email_fallback_enabled` / `email_fallback_delay_hours`. `public.customer_notifications` is the in-app channel (with `priority`, `category`, `action_url`, `email_dispatched_at`, `email_provider`), and `public.notification_delivery_log` records cross-division email/SMS/push attempts with own-row-read RLS. `@henryco/email` exposes `sendTransactionalEmail` (Brevo/Resend providers, locale-aware via `recipient-locale`). The detection signals come from V3-37: incomplete bookings, half-filled forms, paused KYC, abandoned proposals — plus the existing `engagement-sweep` cron already emits `cart_abandoned` / `kyc_incomplete_after_signup` engagement events. What is missing: **nothing actually reminds the user**. The events are produced and dropped (the engagement-sweep route literally notes "a future marketing-automation pass consumes them"). The gap this pass closes: a durable, consent-aware reminder engine that turns those detection signals into scheduled, cadence-controlled, quiet-hours-respecting, opt-out-honoured multi-channel reminders on the V3-43 rail.

## Mandatory scope

### S1 — `reminder_schedules` + `reminder_dispatches` schema

Migration `apps/hub/supabase/migrations/<ts>_auto_remind.sql`:

```sql
create table public.reminder_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_type text not null,        -- see S2 catalog
  reference_type text,                -- e.g. 'booking','kyc_submission','cart','proposal'
  reference_id text,
  step_index smallint not null default 0,   -- cadence position
  next_fire_at timestamptz not null,
  status text not null default 'active'
    check (status in ('active','completed','cancelled','exhausted')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, reminder_type, reference_type, reference_id)  -- one live schedule per actionable item
);

create table public.reminder_dispatches (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.reminder_schedules(id) on delete cascade,
  channel text not null check (channel in ('in_app','email','push','sms')),
  step_index smallint not null,
  dispatched_at timestamptz not null default timezone('utc', now()),
  suppressed_reason text,             -- 'quiet_hours' | 'opted_out' | 'channel_disabled' | null
  delivery_log_id uuid                -- joins notification_delivery_log when a real send happened
);
```

RLS: a user reads their own `reminder_schedules` / `reminder_dispatches`; service-role/engine writes; staff read via `is_platform_staff()`. Cascade-delete on user removal (NDPR/GDPR).

### S2 — Reminder catalog + cadence config

A typed catalog (runtime-safe, `packages/workflow/src/reminders/catalog.ts`) covering at minimum these **eight** types, each with a default channel set, priority, and cadence:

| `reminder_type` | trigger | default cadence | channels |
|---|---|---|---|
| `kyc_incomplete` | paused/started KYC (V3-37 + engagement-sweep) | 24h, 72h, 7d | in_app, email |
| `cart_abandoned` | items idle > 3d | 1h, 24h, 7d | in_app, email, push |
| `booking_abandoned` | incomplete booking | 1h, 24h | in_app, email, push |
| `saved_item_expiring` | saved item nearing expiry | 48h-before, 6h-before | in_app, email |
| `verification_pending` | submitted, awaiting action | 24h, 72h | in_app, email |
| `important_notification_unread` | high-priority unread > 48h | 48h | in_app, push |
| `subscription_renewal` | renewal upcoming | 7d-before, 1d-before | in_app, email |
| `appointment_upcoming` | service appointment upcoming | 24h-before, 2h-before | in_app, push, sms* |

`sms*` = SMS only when the type is high-priority **and** `customer_preferences.sms_enabled = true`. Cadence is data, not code branches — adding a step is a config change.

### S3 — Consent + quiet-hours gate (the hard rule, centralised)

`packages/workflow/src/reminders/gate.ts` — one pure function every dispatch passes through:

```typescript
export function evaluateReminderGate(input: {
  channel: ReminderChannel;
  reminderType: ReminderType;
  prefs: CustomerPreferencesSnapshot;  // quiet_hours_*, muted_event_types, muted_divisions, sms_enabled, high_priority_only
  now: Date;                            // evaluated against quiet_hours_timezone (IANA) → user-local
}): { allow: true } | { allow: false; reason: "quiet_hours" | "opted_out" | "channel_disabled" };
```

Rules: a `reminder_type` in `muted_event_types` (or its division in `muted_divisions`) → `opted_out`. `sms`/`push` inside the user-local quiet-hours window (`quiet_hours_start`–`quiet_hours_end` resolved against `quiet_hours_timezone`, default 10pm–7am) → `quiet_hours` (in-app + email may still queue, but a push/SMS is suppressed and the reminder rescheduled to the window edge). SMS where `sms_enabled = false` → `channel_disabled`. Under `high_priority_only`, only high-priority types dispatch. Every suppression is recorded in `reminder_dispatches.suppressed_reason` — observable, never silent.

### S4 — Workflow handlers (registered on V3-43)

- An event/cron-triggered `"reminder.schedule"` handler creates/updates a `reminder_schedules` row when a V3-37 detection signal or engagement event fires (idempotent via the unique constraint).
- A periodic `"reminder.dispatch_sweep"` handler (enqueued by the V3-43 cron) claims due schedules (`next_fire_at <= now()`), runs each channel through `evaluateReminderGate`, dispatches the allowed channels, records `reminder_dispatches`, advances `step_index` / `next_fire_at`, and marks `exhausted` after the last cadence step. When the underlying action completes (booking finished, KYC submitted), the schedule is cancelled — never remind for a done thing.

### S5 — Channel adapters

Route each channel through the existing infrastructure — no new senders: **in-app** → insert `customer_notifications`; **email** → `sendTransactionalEmail` (`@henryco/email`, locale-aware), logged in `notification_delivery_log`; **push** → the existing OneSignal/web-push path (mobile push lands fully with V3-88); **SMS** → the existing SMS provider behind the `sms_enabled` + high-priority gate. Every real send writes a `notification_delivery_log` row and links it via `reminder_dispatches.delivery_log_id`.

### S6 — Telemetry

Add to the `HenryEventName` union in `packages/observability/src/events.ts` (compile-enforced) + `docs/event-taxonomy.md`:

```
henry.reminder.sent     henry.reminder.acted_upon     henry.reminder.opted_out
```

`acted_upon` fires when the user completes the reminded action within the schedule window (join on `reference_type`/`reference_id`) — the conversion signal. Payloads carry `reminder_type`, `channel`, `step_index`; no message body, redacted.

## Out of scope

- Detection of abandoned tasks (V3-37 — this pass consumes its signals, does not re-detect).
- Marketing follow-up campaigns (V3-48); newsletter (V3-61).
- The workflow engine (V3-43 — this pass only registers handlers).
- New notification-preference UI — this pass reuses the existing `customer_preferences` surface (add a per-`reminder_type` toggle only if the existing surface lacks the granularity).

## Dependencies

- **Requires:** V3-43 (engine + cron + event bridge), V3-37 (abandoned-task detection signals).
- **Blocks:** —. Feeds V3-48 (campaigns may suppress when a reminder schedule for the same item is active, to avoid double-contact).

## Inheritance

- `customer_preferences` (quiet-hours + opt-out fields), `customer_notifications`, `notification_delivery_log` — the consent + delivery spine.
- `@henryco/email` — `sendTransactionalEmail`, `recipient-locale`; `@henryco/notifications` — the publisher shim; the existing push + SMS paths.
- `@henryco/workflow` (V3-43) — engine, handler registry, `buildWorkflowAuditInput`.
- `@henryco/i18n` — localised reminder copy.

## Implementation requirements

### Files

The migration (S1); `packages/workflow/src/reminders/{catalog,gate}.ts` + the registered handlers (S2–S5); channel adapters wiring the existing senders; the `events.ts` union additions + taxonomy doc (S6); a per-`reminder_type` preference toggle only if the existing preferences surface needs it.

### Trust / safety / compliance

`evaluateReminderGate` is the single chokepoint — no dispatch path bypasses it. Opt-out and quiet-hours are absolute and audited via `suppressed_reason`. SMS requires explicit `sms_enabled` + high priority — never default-on. `reminder_schedules` cascade-delete on user removal (data-rights compliance). The dispatch sweep is idempotent (one live schedule per item; `step_index` guards double-send within a step). No reminder is sent for a completed/cancelled action.

### Mobile + desktop parity

All four channels target both web and the Expo super-app: in-app renders in the web notification bell and the mobile notification surface; email is device-agnostic; push targets web-push now and native push when V3-88 lands; SMS is device-agnostic. Quiet-hours is resolved in the user's IANA timezone so a mobile user travelling is reminded correctly.

### i18n

Every reminder title/body routes through `@henryco/i18n`, namespace **`surface:reminders`**, resolved in the recipient's locale (`recipient-locale`) across 12 locales — Pattern A typed keys for the eight types, Pattern B runtime DeepL fallback for the long tail. Zero hardcoded user-facing strings; `reminder_type` keys are internal (`exempt.json`).

### Brand & design system

Reminder emails use the `@henryco/email` branded layout (Henry Onyx sender identity from `@henryco/config`, never hardcoded). Every CTA URL (`action_url`) resolves through `@henryco/config` helpers (`getAccountUrl()`, division helpers) — zero hardcoded domains. In-app reminders render in the existing notification-bell chrome with design-system tokens, light + dark, CLS ≈ 0.

## Validation gates

1. Standard CI: typecheck, lint, test, build (`Lint, typecheck, test, build`).
2. **Gate suite** (`pnpm --filter @henryco/workflow test`): `evaluateReminderGate` — quiet-hours across timezones (incl. DST-edge + cross-midnight windows), `muted_event_types` / `muted_divisions` opt-out, `sms_enabled` false, `high_priority_only`, and that in-app/email survive quiet hours while push/SMS are suppressed-and-rescheduled.
3. **Reminder e2e** per type — a synthetic detection signal creates a schedule; the sweep advances cadence and dispatches the right channels; completing the action cancels the schedule.
4. **Opt-out test** — a user opted out of a type/channel receives nothing on that type/channel; `suppressed_reason='opted_out'` recorded.
5. **Quiet-hours test** — a push/SMS scheduled inside quiet hours is suppressed and rescheduled to the window edge.
6. **RLS** — a user reads only their own schedules/dispatches; staff read via `is_platform_staff()`.

## Deployment gate

All gates green; required check passing; branch `v3/45-workflow-auto-remind` off `origin/main` → PR → squash-merge (no force-push). Because reminders touch live users, run a **14-day soak** confirming zero quiet-hours violations, zero opted-out sends, and a healthy `acted_upon` rate before treating the rail as authoritative.

## Final report contract

`.codex-temp/v3-45-workflow-auto-remind/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion).

## Self-verification

- [ ] `reminder_schedules` / `reminder_dispatches` applied; user-own RLS + cascade-delete on user removal.
- [ ] Catalog covers ≥ 8 reminder types with data-driven cadence.
- [ ] `evaluateReminderGate` is the single consent chokepoint; quiet-hours resolved in user IANA timezone; every suppression recorded.
- [ ] Schedule + dispatch-sweep handlers registered on the V3-43 engine; schedule cancelled when the action completes.
- [ ] All four channels routed through existing senders; every real send logged in `notification_delivery_log`.
- [ ] Three `henry.reminder.{sent,acted_upon,opted_out}` events added to the typed union + taxonomy doc.
- [ ] Report written.
