# V3-48 — Automation & Workflow: Follow-Up Campaigns

**Pass ID:** V3-48  ·  **Phase:** F (Automation & Workflow)  ·  **Pillar:** P5 (Automation), P3 (Notifications/Engagement)
**Dependencies:** V3-43 (workflow engine foundation), V3-35 (deals & campaigns personalization)  ·  **Effort:** M  ·  **Parallel-safe:** Y
**Owner gate:** none (operationally informed by D7 sender-identity)  ·  **Risk class:** —

---

## Role
You are the V3 campaign engineer for Henry Onyx. You execute exactly this one pass, then stop and report. You build the targeted follow-up engine: after a meaningful customer event — a purchase, a booking, a completed service, a finished course — a multi-step campaign runs over time across email, in-app, and push, asking for a review, requesting feedback, offering the relevant next step. The line you must not cross: these are **lifecycle/marketing** sends, not transactional ones — every campaign is opt-out-honoring, on the marketing email rail (never the auth/transactional rail), suppression-aware, and quiet-hours-respecting. This is **not** the newsletter (V3-61) and **not** incomplete-action reminders (V3-45); it is the post-event nurture sequence keyed to a specific completed action.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/48-workflow-follow-up-campaigns` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
The substrate for keyed, governed, multi-channel sends already exists; what is missing is the campaign sequencer that orchestrates them after a completed event.

- **Email rails:** `@henryco/email` ships `sendTransactionalEmail(...)`, an `EmailPurpose` type (`auth | support | newsletter | care | studio | marketplace | jobs | learn | property | logistics | security | generic`), `resolveSenderIdentity(purpose)`, and **rail separation** — auth/transactional on Resend, `newsletter`/bulk on Brevo (auth and marketing must never share a sending rail). Recipient-locale resolution (`recipient-locale.ts`) and localized layouts (`localize-layout.ts`) are in place.
- **In-app + push:** `@henryco/notifications` ships `publishNotification(PublishInput)` (with `eventType`, `severity`, `deepLink`, `actionLabel`, dedupe via `relatedId`/`relatedType`), a cross-division event registry (`event-types.ts`), `customer_preferences`-aware muting (`muted_divisions` / `muted_event_types`), and rate-limiting.
- **Suppression / opt-out:** `@henryco/newsletter` ships `evaluateSuppression(...)` (honors `unsubscribed` status, suppression entries, support/trust state), segmentation, subscriber, topics, and suppression modules — the exact governance a marketing campaign must obey.
- **Lifecycle signals:** `@henryco/lifecycle` (rules/drafts/selectors) and the engagement-sweep cron (`apps/account/app/api/cron/engagement-sweep/route.ts`) already **emit lifecycle events** (cart-abandoned, KYC-incomplete) with the explicit note "NO email worker is wired here … a future marketing-automation pass consumes them." **This pass is that consumer.**
- **Workflow engine (V3-43, dependency):** unifies cron + outbox + retry + idempotency; campaign steps schedule on it. **V3-35 (dependency)** brings the campaign-authoring + signal-driven targeting this pass triggers against.

**The gap:** completed customer events produce no structured nurture. A first purchase gets no thank-you/review ask; a finished course gets no certificate-plus-next-step; a completed service gets no feedback request. This pass adds a declarative campaign definition, an event-keyed sequencer that runs steps with delays on the V3-43 engine, channel routing through the existing email/notifications rails, full suppression/opt-out/quiet-hours governance, and per-step funnel telemetry.

## Mandatory scope

### S1 — Campaign definitions (declarative, four launch campaigns)
Add `@henryco/workflow/campaigns` (`packages/workflow/src/campaigns/`) with a declarative campaign type and four shipped definitions:

```ts
export type CampaignTrigger =
  | { event: "order.completed"; division: "marketplace" }
  | { event: "booking.completed"; division: "care" | "logistics" | "property" | "studio" }
  | { event: "service.completed"; division: "care" | "studio" | "logistics" }
  | { event: "course.completed"; division: "learn" };

export type CampaignChannel = "email" | "in_app" | "push";

export type CampaignStep = {
  key: string;                  // stable, e.g. "post_purchase.review_request"
  delay: string;               // ISO-8601 duration from the prior step, e.g. "PT1H", "P2D"
  channels: CampaignChannel[];  // fan-out per step
  copyKey: string;             // @henryco/i18n key; NO inline copy
  variant?: string;            // A/B arm id (S3)
  goal: "review" | "feedback" | "cross_sell" | "next_course" | "rebook";
};

export type CampaignDefinition = {
  id: string;                   // "post_purchase" | "post_booking" | "post_service" | "post_course"
  trigger: CampaignTrigger;
  campaignClass: "lifecycle";   // marketing-class for suppression — NEVER "transactional"
  steps: CampaignStep[];        // ordered; delays are cumulative-from-prior
};
```

Shipped definitions:
- **`post_purchase`** (marketplace `order.completed`): thank-you (in-app, immediate) → review request (email + push, +1d) → relevant cross-sell (email, +5d).
- **`post_booking`** (care/logistics/property/studio `booking.completed`): appointment confirmation recap (in-app) → post-service feedback request (email + push, after the service window).
- **`post_service`** (`service.completed`): NPS-style feedback request (email + in-app, +2h) → follow-on service suggestion (email, +7d).
- **`post_course`** (learn `course.completed`): certificate availability (email + in-app, immediate) → next-course suggestion (email, +3d) → jobs-board pipeline nudge (in-app, +7d — hands off to **V3-56**, does not duplicate it).

### S2 — Event-keyed sequencer (on the V3-43 engine, idempotent)
Implement the sequencer that subscribes to the completion events (from the division dispatchers and the engagement-sweep emission path) and schedules each campaign's steps on the **V3-43 engine** with the declared delays.

- A `campaign_enrollments` row is created on trigger (`user_id`, `campaign_id`, `triggered_by_event_id`, `enrolled_at`, `state`). **One enrollment per (user, campaign, source-entity)** — a UNIQUE constraint prevents double-enrolling the same purchase/booking/course. This is the idempotency anchor.
- Each scheduled step checks governance (S4) at send time, not enroll time, so an opt-out between steps halts the rest of the sequence.
- A `campaign_step_sends` row records each attempted send (`enrollment_id`, `step_key`, `channel`, `state: queued|sent|skipped|failed`, `skip_reason`). Steps dedupe per (enrollment, step_key, channel) so an engine retry never double-sends.

### S3 — A/B-test readiness (deterministic until V3-91)
Each step may carry `variant` arms. Until the experimentation framework (V3-91) lands, arm assignment is **deterministic** (stable hash of `user_id + campaign_id + step_key` into the arm set) so results are reproducible and analyzable, with a clean seam to swap in V3-91's flag-driven assignment later. Record the assigned arm on `campaign_step_sends` so the funnel telemetry (S5) is arm-attributable from day one.

### S4 — Channel routing + governance (opt-out, suppression, quiet hours, rail separation)
Route each step's channels through the existing primitives, with governance enforced **before every send**:

- **Email** → `sendTransactionalEmail(...)` with `purpose` mapped to the division (`care`/`marketplace`/`learn`/…) so `resolveSenderIdentity` and recipient-locale apply — but **`campaignClass: "lifecycle"`** means it must pass `evaluateSuppression(...)` from `@henryco/newsletter` first (unsubscribed, suppression entries, support/trust state all halt the send). Marketing campaigns ride the **marketing rail** (Brevo bulk per `EmailPurpose` separation), never the auth/transactional rail. Honor **D7** sender-identity (read the recorded answer in `DECISIONS-REQUIRED.md`; recommended Option C = per-division transactional + unified marketing — apply it to sender selection).
- **In-app** → `publishNotification(...)` with the right `eventType`, respecting `customer_preferences` muting and rate-limiting already built into the publisher.
- **Push** → the same notification path's push delivery, gated on the user's push opt-in.
- **Quiet hours:** no push/in-app outside the user's quiet-hours window (resolved from preferences/timezone); deferred to the next allowed slot via the engine, not dropped.
- A per-campaign-type **opt-out** ("stop these follow-ups") writes a suppression entry scoped to that campaign class and division; the sequencer honors it on the next step.

### S5 — Per-step funnel telemetry
Emit via `emitEvent(...)` from `@henryco/observability`, naming `henry.<domain>.<noun>.<verb>`:
- `henry.campaign.step.sent`
- `henry.campaign.step.opened`
- `henry.campaign.step.clicked`
- `henry.campaign.step.skipped` (governance halt — carries `skip_reason`: `suppressed` | `unsubscribed` | `muted` | `quiet_hours`)
- `henry.campaign.conversion` (the step `goal` was met — review left / feedback submitted / cross-sell purchased / next course enrolled)

Payloads carry `{ campaign_id, step_key, channel, variant, division, goal? }`, PII-redacted per `@henryco/observability/redaction`. Open/click attribution uses the existing email pixel/link-tracking and the in-app deep-link click path — no new tracking infrastructure.

## Out of scope
- The general newsletter (campaign authoring, broad segmentation, GDPR unsubscribe center) — **V3-61** (this pass reuses `@henryco/newsletter` suppression/segmentation primitives but does not build the newsletter product).
- Incomplete-action reminders (abandoned cart, expiring session, half-filled form) — **V3-45** (`workflow-auto-remind`); those are *incomplete*-action triggers, this pass is *completed*-action triggers. Keep the two engines distinct.
- The experimentation framework itself — **V3-91** (this pass is deterministic-arm until then).
- The jobs-board completion→hiring pipeline mechanics — **V3-56** (the `post_course` final step nudges into it, does not build it).
- New email/notification transport infrastructure — reuse `@henryco/email` + `@henryco/notifications` as-is.

## Dependencies
**Blocks on:** V3-43 (steps schedule on its engine; do not build a standalone cron), V3-35 (campaign-authoring + signal-driven targeting this pass triggers against). Operationally informed by **D7** (sender identity).
**This pass blocks:** nothing hard. Feeds the conversion funnel that V3-62 (deals engine) and V3-61 (newsletter) can later reference.

## Inheritance
- `@henryco/workflow` (V3-43) — engine, delayed scheduling, retry, idempotency, observability hooks.
- `@henryco/email` — `sendTransactionalEmail`, `EmailPurpose`, `resolveSenderIdentity`, recipient-locale, localized layouts, rail separation.
- `@henryco/notifications` — `publishNotification`, `customer_preferences` muting, rate-limiting, event registry.
- `@henryco/newsletter` — `evaluateSuppression`, suppression entries, segmentation, subscriber state.
- `@henryco/lifecycle` + the engagement-sweep emission path — the completion-event source this pass consumes.
- `@henryco/observability` — `emitEvent`, `writeAuditLog`, `redaction`.
- `@henryco/config` (brand, division names, URLs) + `@henryco/i18n` (all copy).

## Implementation requirements

### Files
- New package: `packages/workflow/src/campaigns/{index.ts,definitions.ts,sequencer.ts,governance.ts,variants.ts}` + `__tests__`.
- New worker route: `apps/account/app/api/workflow/campaigns/route.ts` (engine step-runner, `CRON_SECRET`-guarded — mirrors the existing `apps/account/app/api/cron/*` shape).
- New trigger subscriber: hook into the division completion-event emission (extend the engagement-sweep / dispatcher path) to enroll on `order.completed` / `booking.completed` / `service.completed` / `course.completed`.
- New i18n copy: campaign step copy keys under the `surface:campaigns` namespace, all 12 locales (Pattern A en-US source-of-truth; Pattern B DeepL fills the rest per the V3-07b posture).
- Migrations: `supabase/migrations/<ts>_v3_48_follow_up_campaigns.sql` — `campaign_enrollments` (UNIQUE on user+campaign+source-entity), `campaign_step_sends` (dedupe per enrollment+step+channel), `campaign_opt_outs`, with RLS.
- V3-43 engine registration: register the campaign step-runner job.

### Trust / safety / compliance
- **Lifecycle/marketing class, never transactional.** Every send passes `evaluateSuppression` and rides the marketing rail. A campaign send must never go out on the auth/security rail.
- **Opt-out is sacred:** a per-campaign-type opt-out halts the sequence on the next step; unsubscribed/suppressed users are skipped with `henry.campaign.step.skipped` + `skip_reason`, never silently retried.
- **Quiet hours respected** for push/in-app; deferred, not dropped.
- **GDPR / transactional-vs-marketing separation** preserved end-to-end (this is the whole point of the rail split). Consent ledger (V3-93) is the future system of record; until then, suppression entries + opt-outs are the truth.
- **Idempotency:** UNIQUE enrollment per source-entity; per-step-channel send dedupe; engine retries never double-send.
- **RLS:** `campaign_enrollments` / `campaign_step_sends` / `campaign_opt_outs` owner-only read of own rows; service-role writes from the worker route.
- **Audit:** `writeAuditLog` on opt-out writes and on any manual campaign enrollment/cancel.

### Mobile + desktop parity
All three channels (email, in-app, push) reach both web and the Expo super-app. In-app notifications render in the account web inbox and the super-app notifications surface via the shared `@henryco/notifications` consumer; push reaches the native app via the existing push path; email is client-agnostic. Email templates are mobile-responsive via `@henryco/email` layouts. Deep links in steps resolve through `@henryco/config` so they open the correct surface on web and native (V3-04 universal links).

### i18n
All campaign copy flows through `@henryco/i18n`, namespace **`surface:campaigns`** — every step subject, body, in-app title/body, push text, CTA label, and the opt-out copy. No inline strings in definitions (only `copyKey`). 12 locales; recipient-locale resolution selects the language per recipient. Pattern A en-US is the typed source; Pattern B DeepL fills the rest. The opt-out / "manage follow-ups" link text is translated.

### Brand & design system
Every user-facing string says **Henry Onyx**; division labels are "Henry Onyx <Division>" sourced from `@henryco/config` (`COMPANY` / division names) — never hardcoded, never "Henry & Co.". Email templates use the `@henryco/email` branded layout (per-division accent from `company.ts`, Fraunces display where the layout uses it), light + dark where the channel supports it. Sender identity (`team@` vs `news@` per D7) and legal footer entity = **Henry Onyx Limited** via `@henryco/config`. Zero hardcoded domains — every link via `henryDomain()` / `henryWebRoot()` / `getAccountUrl()`.

## Validation gates
1. **CI:** `pnpm -F @henryco/workflow typecheck && test`; `pnpm -F @henryco/account-app typecheck && lint && build`; `pnpm -F @henryco/email typecheck && test`; `pnpm -F @henryco/newsletter typecheck && test`; root build green. i18n strict-gate scan passes (no hardcoded campaign strings).
2. **Four campaign e2e (~12):** each of `post_purchase` / `post_booking` / `post_service` / `post_course` triggers on its event, enrolls once, runs its steps with the declared delays, and fires the right channels.
3. **Idempotency tests:** duplicate completion event → single enrollment (UNIQUE proven); engine step retry → single send per channel (dedupe proven).
4. **Opt-out + suppression test:** opt-out between steps halts the rest of the sequence; unsubscribed/suppressed recipient is skipped with `henry.campaign.step.skipped` + correct `skip_reason`; campaign send never appears on the auth/transactional rail.
5. **Quiet-hours test:** push/in-app scheduled inside quiet hours is deferred to the next allowed slot, not dropped.
6. **Per-step funnel telemetry:** `sent` / `opened` / `clicked` / `skipped` / `conversion` all emit with arm-attributable, PII-redacted payloads; deterministic A/B arm assignment is stable across runs.
7. **RLS verification:** non-owner cannot read another user's enrollments/sends/opt-outs.

## Deployment gate
- All validation gates green; D7 sender-identity answer confirmed in `DECISIONS-REQUIRED.md`.
- Ship behind a per-campaign enable flag; enable one campaign at a time, lowest-volume first.
- **30-day observation cycle** for full post-event → conversion funnel maturity: confirm conversion attribution is sound, opt-out/suppression escape rate is zero (no marketing send to a suppressed/unsubscribed user), and the marketing rail is never crossed by a campaign send. Owner reviews the first cohort's funnel before all four campaigns are enabled.

## Final report contract
`.codex-temp/v3-48-workflow-follow-up-campaigns/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion). Record the four shipped campaign definitions (steps + delays + channels + goals), the D7 sender-identity application, the deterministic A/B arm scheme (and the V3-91 swap seam), and the 30-day funnel/opt-out-escape observations.

## Self-verification
- [ ] S1 four declarative campaigns (`post_purchase` / `post_booking` / `post_service` / `post_course`), `campaignClass: "lifecycle"`, copy by key only.
- [ ] S2 sequencer runs on the V3-43 engine; UNIQUE enrollment per source-entity; per-step-channel send dedupe; governance checked at send time.
- [ ] S3 deterministic A/B arm assignment, arm recorded for attribution, clean V3-91 swap seam.
- [ ] S4 email on the marketing rail through `evaluateSuppression`; in-app/push respect muting + rate-limit + quiet hours; per-campaign opt-out halts the sequence.
- [ ] S5 all 5 `henry.campaign.*` telemetry events emit, arm-attributable, PII-redacted.
- [ ] Opt-out/suppression escape rate proven zero; campaign sends never cross the auth/transactional rail.
- [ ] RLS verified on the three new tables; `CRON_SECRET` on the worker route; audit on opt-out/manual actions.
- [ ] All copy via `@henryco/i18n` (`surface:campaigns`, 12 locales); brand "Henry Onyx" / legal "Henry Onyx Limited" via `@henryco/config`; zero hardcoded domains/strings; branded responsive email layout, light + dark.
- [ ] 30-day funnel cycle observed; D7 confirmed; report written with the 9 standard sections.
