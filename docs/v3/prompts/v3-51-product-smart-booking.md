# V3-51 — Product Expansion: Smart Booking

**Pass ID:** V3-51  ·  **Phase:** G (Product Expansion)  ·  **Pillar:** P1 (Product Expansion)
**Dependencies:** V3-49 (services catalog), V3-50 (verified provider model)  ·  **Effort:** L  ·  **Parallel-safe:** Y (with other Phase G passes once V3-49 + V3-50 have merged)
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 Booking engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass turns the single-vertical Care pickup form into a **smart, provider-aware booking engine**: a timezone-correct slot picker bound to provider availability, server-side provider matching, recurring schedules, per-service cancellation policy with policy-computed refunds, and calendar export — all writing to one unified `bookings` row that the V3-49 catalog and the V3-50 provider model feed. The line it must not cross: **provider matching and ranking are server-only** (ANTI-CLONE Principle 1 — never expose the matching weights to the client), this pass **does not** change payment behaviour (it consumes `@henryco/payment-router` and the cancellation-refund path from V3-19, never reimplements money), and it **does not** build the provider-side calendar management UI (V3-72) or B2B bulk booking (V3-74). It must extend the live Care booking path on top of the generalised tables — never fork a parallel booking schema beside `care_bookings`.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/51-product-smart-booking` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

Booking already exists, single-vertical. `apps/care/app/(public)/book/page.tsx` + `book/actions.ts` write a real `care_bookings` row today (`tracking_code`, `user_id`, `customer_name`, `phone`, `service_type`, `item_summary`, `pickup_address`, `pickup_date`, `pickup_slot`, `special_instructions`, `status`, `payment_status`) via `getCareBookingCatalog()` / `getCareSettings()`, with quote math in `apps/care/lib/care-catalog.ts` (`calculateCleaningQuote`) and the payment request raised through `apps/care/lib/payments/verification.ts` (`ensureBookingPaymentRequest`). Recurring booking is already modelled: `care_recurring_schedules` (cadence, `day_of_week`, `time_of_day`, `service_payload`, `next_run_at`, `last_run_at`, `paused_until`, `status`) is swept by `apps/care/lib/automation/recurring-auto-book.ts` (the `/api/cron/care-automation` handler) which idempotently creates a `care_bookings` row from the stored payload. V3-49 added `catalog_services` (`provider_supplied`, `pricing_model`, `base_price_minor` BIGINT, `duration_minutes`); V3-50 added `provider_profiles` (`quality_score numeric(5,2)`, `service_areas`, `capabilities`, `trust_tier`) and `provider_availability` (`weekday`, `start_minute`, `end_minute`, `timezone`). The gaps this pass closes: (1) booking is Care-laundry-shaped and cannot target an arbitrary `catalog_services` row across verticals; (2) there is no slot picker reading `provider_availability` — pickup is a free-text slot string; (3) there is no provider matching/ranking; (4) `care_recurring_schedules` is Care-only and not generalised to provider-supplied services; (5) cancellation policy is not modelled per service and refunds are not policy-computed. This pass introduces a unified `bookings` table that the existing `care_bookings` path maps into, reads provider availability for the slot picker, matches/ranks providers server-side, generalises recurring schedules, and computes cancellation refunds through the V3-19 path.

## Mandatory scope

### S1 — Unified `bookings` schema (generalise, never fork)

Migration `apps/care/supabase/migrations/<ts>_smart_booking.sql` (Care owns the cross-vertical services platform). Introduce one canonical booking row that the existing `care_bookings` path resolves into via a source-ref bridge — the live Care `/book` flow keeps working unchanged.

```sql
create table if not exists public.bookings (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  service_id         uuid not null references public.catalog_services(id) on delete restrict, -- V3-49
  provider_id        uuid references public.provider_profiles(id) on delete set null,         -- V3-50; null for self-fulfilled Care services
  scheduled_start    timestamptz not null,                 -- timezone-correct, stored UTC
  duration_minutes   integer not null check (duration_minutes > 0),
  timezone           text not null default 'Africa/Lagos', -- IANA tz the slot was chosen in
  location           jsonb not null default '{}'::jsonb,   -- address ref via @henryco/address-selector, never a hardcoded string
  status             text not null default 'pending'
                     check (status in ('pending','confirmed','in_progress','completed','cancelled','no_show')),
  recurring_id       uuid references public.booking_schedules(id) on delete set null, -- set if spawned by a schedule
  cancellation_policy_id uuid references public.service_cancellation_policies(id),
  amount_minor       bigint check (amount_minor is null or amount_minor >= 0), -- integer minor units, never float
  currency           text not null default 'NGN',
  payment_request_id uuid,                                  -- FK-by-convention into the payment-router request
  source_table       text,                                  -- 'care_bookings' for bridged legacy rows
  source_id          uuid,
  created_at         timestamptz not null default timezone('utc', now()),
  updated_at         timestamptz not null default timezone('utc', now())
);
create unique index if not exists bookings_source_idx
  on public.bookings(source_table, source_id) where source_id is not null;
create index if not exists bookings_user_idx on public.bookings(user_id, scheduled_start desc);
create index if not exists bookings_provider_slot_idx
  on public.bookings(provider_id, scheduled_start) where provider_id is not null;

-- Generalised recurring schedule (supersedes the Care-only care_recurring_schedules shape).
create table if not exists public.booking_schedules (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  service_id      uuid not null references public.catalog_services(id) on delete restrict,
  provider_id     uuid references public.provider_profiles(id) on delete set null,
  cadence         text not null check (cadence in ('daily','weekly','biweekly','monthly')),
  weekday         smallint check (weekday between 0 and 6),
  time_of_day     time,
  timezone        text not null default 'Africa/Lagos',
  ends_at         timestamptz,            -- null = open-ended
  occurrence_cap  integer check (occurrence_cap is null or occurrence_cap > 0),
  occurrences_run integer not null default 0,
  service_payload jsonb not null default '{}'::jsonb,
  status          text not null default 'active' check (status in ('active','paused','ended')),
  paused_until    timestamptz,
  next_run_at     timestamptz,
  last_run_at     timestamptz,
  created_at      timestamptz not null default timezone('utc', now()),
  updated_at      timestamptz not null default timezone('utc', now())
);
create index if not exists booking_schedules_next_run_idx
  on public.booking_schedules(next_run_at) where status = 'active';

-- Per-service cancellation policy (referenced by bookings.cancellation_policy_id).
create table if not exists public.service_cancellation_policies (
  id                 uuid primary key default gen_random_uuid(),
  service_id         uuid not null references public.catalog_services(id) on delete cascade,
  free_cancel_minutes integer not null default 1440,  -- free if cancelled ≥ this many minutes before start (24h default)
  late_fee_bps       integer not null default 0 check (late_fee_bps between 0 and 10000), -- basis points of amount kept on late cancel
  no_show_fee_bps    integer not null default 10000 check (no_show_fee_bps between 0 and 10000),
  created_at         timestamptz not null default timezone('utc', now()),
  updated_at         timestamptz not null default timezone('utc', now())
);
```

RLS: a user reads/writes **only their own** `bookings` + `booking_schedules` (`user_id = auth.uid()`); a provider reads bookings where `provider_id` belongs to their `provider_profiles.id` (read-only here — provider write is V3-72); staff read all via `public.is_platform_staff()`; `service_cancellation_policies` is world-readable for active services, staff-write. `touch_updated_at()` trigger on all three. Money is BIGINT minor units everywhere; `late_fee_bps`/`no_show_fee_bps` are basis points, never floats. Backfill: bridge existing `care_bookings` into `bookings` with `source_table='care_bookings'`, `source_id=<care_booking.id>`, idempotent on `(source_table, source_id)`; the `recurring-auto-book` cron migrates to write a `bookings` row (keeping the `care_bookings` insert during the soak window so nothing regresses).

### S2 — Slot picker (timezone-correct, availability-bound)

Server route + client component that, for a given `service_id` (and optional `provider_id`), computes bookable slots from `provider_availability` (V3-50) minus existing `bookings` for that provider, in **15-minute increments**, rendered in the **user's resolved timezone** (not the server's). Self-fulfilled Care services (`provider_supplied = false`) fall back to the existing Care settings windows (`getCareSettings()`), so the Care `/book` path keeps its current slot behaviour. The slot list is computed **server-side** (`apps/care/lib/booking/slots.ts`, `import "server-only"`); the client receives only renderable slot objects (`{ startIso, label, available }`), never the availability math. Double-booking is prevented by a server-side check at write time (a partial unique guard on `(provider_id, scheduled_start)` for `status in ('pending','confirmed','in_progress')`), not by client trust.

### S3 — Provider matching + ranking (server-only)

`apps/care/lib/booking/match-providers.ts` (`import "server-only"`) filters candidate providers by: service capability (`provider_profiles.capabilities` contains the service slug), `service_areas` covering the booking location, availability at the requested window, language, and price band. It then **ranks** by `quality_score` (V3-50, banded — never the raw inputs) + proximity + responsiveness (`response_sla_hours` mirror). The **ranking weights are proprietary** (ANTI-CLONE Principle 1) — never serialised to any client response; the client receives an ordered list of provider cards (banded tier badge + display fields only). A per-IP rate limit (reuse `@henryco/search-core/rate-limit.ts`) guards the match endpoint so the provider graph can't be enumerated.

### S4 — Recurring bookings

A user creates a `booking_schedules` row (`daily/weekly/biweekly/monthly`) with an end date **or** occurrence cap. The generalised `recurring-auto-book` sweep (extend `apps/care/lib/automation/recurring-auto-book.ts`) finds active schedules whose `next_run_at` lands within 24h, idempotently spawns a `bookings` row (`recurring_id` set), advances `next_run_at`/`occurrences_run`, and respects `paused_until`, `ends_at`, and `occurrence_cap`. The existing Care `care_recurring_schedules` rows migrate into `booking_schedules` in S1's backfill; no behaviour regresses for current recurring Care customers.

### S5 — Cancellation policy + policy-computed refund

A cancel action reads the booking's `service_cancellation_policies` row and computes the kept/refunded split deterministically: free before `free_cancel_minutes`; `late_fee_bps` of `amount_minor` kept on late cancel; `no_show_fee_bps` on no-show. The **refund itself is executed through the V3-19 refund path** (`@henryco/payment-router` + the V3-19 reconciliation engine) — this pass computes the *amounts* and hands them to the refund flow; it never moves money directly and never marks a refund complete optimistically (status = provider-confirmed money-truth). The cancel action requires `requireSensitiveAction` (V3-02) and is audited.

### S6 — Calendar export (ICS)

A signed, per-booking ICS export endpoint (`apps/care/app/(public)/book/[bookingId]/calendar/route.ts`) returning a valid `text/calendar` VEVENT (`DTSTART`/`DTEND` from `scheduled_start` + `duration_minutes` in the booking's timezone, `SUMMARY` from localized service name, `LOCATION` from the address). Access is RLS-scoped to the booking owner via a signed token — no unauthenticated booking-data leak. No third-party calendar OAuth in this pass (deferred).

### S7 — Telemetry

Five new events, added to the `HenryEventName` union in `packages/observability/src/events.ts` (an unmapped event is a compile error) and emitted server-side:

```
henry.booking.slot.searched      (slot picker queried availability)
henry.booking.created            (a bookings row written)
henry.booking.cancelled          (cancel action ran; carries policy-band, no money detail)
henry.booking.completed          (booking marked completed — triggers V3-50 quality recompute hook)
henry.booking.recurring.setup    (a booking_schedules row created)
```

No PII in payloads — service slug, provider band, division, status only. `henry.booking.completed` fires the V3-50 `computeProviderQualityScore` recompute hook (the hook V3-50 reserved).

## Out of scope

- Provider-side calendar management + availability editing UI — **V3-72** (this pass only *reads* `provider_availability`).
- Bulk / B2B booking — **V3-74**.
- The KYC-gated provider onboarding that fills the provider profile — **V3-67**.
- The provider model, quality score, and availability schema — **V3-50** (this pass consumes them).
- The services catalog + per-service pricing — **V3-49** (this pass targets `catalog_services`).
- Payment capture, refund execution, reconciliation — **V3-13/V3-15** (capture) and **V3-19** (refund); this pass computes amounts and hands them off.
- Third-party calendar OAuth (Google/Apple two-way sync) — later pass; this pass ships read-only ICS export.

## Dependencies

- **Requires:** V3-49 (`catalog_services`, `provider_supplied`, pricing), V3-50 (`provider_profiles.quality_score`, `provider_availability`, `service_areas`, `capabilities`).
- **Blocks:** V3-72 (provider CRM extends the bookings calendar), V3-79 (platform Booking API exposes this engine), V3-63 (local discovery deep-links into the slot picker).

## Inheritance

- Care booking path — `apps/care/app/(public)/book/`, `apps/care/lib/care-catalog.ts` (`calculateCleaningQuote`), `apps/care/lib/payments/verification.ts` (`ensureBookingPaymentRequest`), `apps/care/lib/automation/recurring-auto-book.ts` (the cron sweep this generalises).
- V3-49 `catalog_services` + `@henryco/pricing` (`pricing_model` evaluation, minor-unit money — never parse pricing JSONB by hand).
- V3-50 `provider_profiles` / `provider_availability` / banded `quality_score`.
- `@henryco/payment-router` (V3-13) + Paystack live (V3-15) for capture; the V3-19 refund/reconciliation path for cancellation refunds.
- `@henryco/address-selector` for the booking location.
- `@henryco/search-core/rate-limit.ts` (provider-match rate limit).
- `requireSensitiveAction` / `fetchWithSensitiveAction` (V3-02) on cancel + deposit-bearing bookings.
- `@henryco/i18n`, `@henryco/observability` (telemetry taxonomy + audit log), `@henryco/config`, `CarePublicShell` + `CARE_ACCENT`.

## Implementation requirements

### Files

The `bookings` + `booking_schedules` + `service_cancellation_policies` migration with backfill (S1); `apps/care/lib/booking/slots.ts` (S2, server-only); `apps/care/lib/booking/match-providers.ts` (S3, server-only); the slot-picker client component under `apps/care/components/care/` + the upgraded `apps/care/app/(public)/book/page.tsx`/`actions.ts`; the generalised `recurring-auto-book.ts` + `booking_schedules` setup surface (S4); the cancel action + policy refund computation under `apps/care/lib/booking/cancel.ts` (S5); the ICS route (S6); the five events in `packages/observability/src/events.ts` (S7); `docs/v3/smart-booking-architecture.md` (the booking/slot/match map V3-72/79 read).

### Trust / safety / compliance

ANTI-CLONE Principle 1 — provider matching/ranking weights are server-only, never serialised to a client. Double-booking prevented server-side (partial unique guard + write-time check), never by client trust. Deposit-bearing bookings and the cancel action require `requireSensitiveAction` (V3-02) and are audited via `@henryco/observability/audit-log`. Refund amounts are policy-computed but executed only through the V3-19 path — no optimistic refund, no direct money movement; status is provider-confirmed money-truth. Provider-match endpoint is per-IP rate-limited (ANTI-CLONE Principle 10 — no graph enumeration). ICS export is signed + RLS-scoped to the booking owner. Money is BIGINT minor units; fees in basis points; idempotency keys on every billed/mutating call.

### Mobile + desktop parity

The slot picker is mobile-first: large touch targets (per `docs/v3/mobile-touch-target-violations.md`), thumb-reachable date/time selection, safe-area aware (V3-09), no horizontal scroll on a phone. The Expo super-app consumes the same `bookings` rows through the shared data layer — no app-specific booking fork; the native booking surface reuses the same slot/match server endpoints. Recurring setup and cancel are equally reachable on web mobile and native.

### i18n

All copy through `@henryco/i18n`. New typed-copy namespace **`surface:booking`** for slot-picker labels (date/time, "available"/"unavailable"), provider-card labels, recurring cadence labels (daily/weekly/biweekly/monthly), cancellation-policy copy ("free until 24h before", late-fee / no-show messaging), status copy (pending/confirmed/in progress/completed/cancelled/no-show), and errors. Service + provider display names render through `resolveLocalizedDynamicField` (Pattern B, 12 locales). Zero hardcoded user-facing strings; the hardcoded-text CI gate stays green.

### Brand & design system

Division label is **"Henry Onyx Fabric Care"**, platform brand **"Henry Onyx"** — both read from `@henryco/config` (`getDivisionConfig('care').name`, `COMPANY.group.name`), never hardcoded; "Henry & Co." must not appear. Fraunces display + locked `--site-*`/`--accent` tokens (Care accent from `care-theme.ts`); light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed. Every cross-surface URL resolves through `@henryco/config` helpers (`henryDomain`, `henryWebRoot`) — no `henrycogroup.com` literal anywhere in the diff.

## Validation gates

1. Standard CI: typecheck, lint, test, build (the only required branch-protection context: `Lint, typecheck, test, build`).
2. **Migration + backfill** applies cleanly against a branch DB; existing `care_bookings` rows bridge into `bookings`; the live Care `/book` path is unbroken (regression smoke); the `recurring-auto-book` cron still produces a booking and now also writes a `bookings` row.
3. **Slot picker** unit suite (~8 cases): availability minus existing bookings, 15-min increments, timezone correctness (a slot chosen in `Africa/Lagos` stores the correct UTC), self-fulfilled fallback to Care windows.
4. **Provider matching** correctness (~6 cases): capability + service-area + availability filter; ranking order by banded quality + proximity + responsiveness; assert the ranking weights appear in **no** client response payload.
5. **Recurring** setup + sweep: a `booking_schedules` row spawns a `bookings` row idempotently; `occurrence_cap`/`ends_at`/`paused_until` honored.
6. **Cancellation policy** computes the correct kept/refunded split for early / late / no-show; the refund is handed to the V3-19 path (mocked) and never marked complete optimistically.
7. **Calendar export** returns a valid VEVENT (validate against an ICS parser); access is owner-scoped (a non-owner token is rejected).
8. **RLS verified**: user reads only own bookings/schedules; provider reads only their assigned bookings; double-booking blocked server-side; staff read all.
9. **i18n + brand gates green**; `surface:booking` namespace registered; no hardcoded user-facing string; no `henrycogroup.com` literal.
10. **UI real-browser**: slot picker + recurring + cancel render in light + dark, mobile + desktop, CLS ≈ 0, contrast clean.

## Deployment gate

All gates green; the only required check (`Lint, typecheck, test, build`) passing; branch `v3/51-product-smart-booking` off `origin/main` → PR → squash-merge (no force-push, no branch-protection bypass). Owner reviews `docs/v3/smart-booking-architecture.md`. **14-day soak** on the live booking surfaces (slot picker + recurring + cancel) confirming zero Care booking regression, correct timezone slotting, clean refund hand-off, and clean telemetry before V3-72 (provider CRM) and V3-79 (Booking API) build on it.

## Final report contract

`.codex-temp/v3-51-product-smart-booking/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion) + the booking/slot/match architecture map and the matching-weight-secrecy assertion.

## Self-verification

- [ ] Unified `bookings` + `booking_schedules` + `service_cancellation_policies` migration; targets `catalog_services` (V3-49) + `provider_profiles` (V3-50); money BIGINT minor units; RLS + `touch_updated_at`; existing `care_bookings` bridged; live `/book` unbroken.
- [ ] Slot picker is server-computed, availability-bound, 15-min increments, timezone-correct; self-fulfilled Care fallback intact; double-booking blocked server-side.
- [ ] Provider matching + ranking are server-only; weights never client-exposed; match endpoint rate-limited.
- [ ] Recurring schedules spawn bookings idempotently via the generalised cron; cap/end/pause honored; Care recurring migrated with no regression.
- [ ] Cancellation policy computes the kept/refunded split; refund executed only through the V3-19 path; cancel gated by `requireSensitiveAction` + audited; no optimistic refund.
- [ ] Signed, owner-scoped ICS export returns a valid VEVENT.
- [ ] Five `henry.booking.*` events in the `HenryEventName` union, emitted server-side; `completed` fires the V3-50 quality recompute hook.
- [ ] `surface:booking` i18n namespace; brand from `@henryco/config` ("Henry Onyx Fabric Care" / "Henry Onyx"); no "Henry & Co."; no hardcoded domain.
- [ ] Report written. Hand-off: V3-72 (provider CRM), V3-79 (Booking API).
