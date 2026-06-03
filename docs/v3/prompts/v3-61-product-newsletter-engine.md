# V3-61 — Product Expansion: Newsletter Engine

**Pass ID:** V3-61  ·  **Phase:** G (Product Expansion)  ·  **Pillar:** P1 (Service Ecosystem), P5 (Automation & Workflow)
**Dependencies:** V3-48 (follow-up campaigns)  ·  **Effort:** M  ·  **Parallel-safe:** Y
**Owner gate:** D7 (email/SMS senders per division — operational, not a hard start-blocker)  ·  **Risk class:** Compliance (consent/CAN-SPAM/GDPR/NDPR)

---

## Role

You are the V3 Newsletter engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass turns the already-shipped `@henryco/newsletter` data + governance layer into a **complete owner-operated campaign engine**: rich-text authoring, audience segmentation, double opt-in + per-category unsubscribe, scheduled batch sending through the existing Brevo rail, and per-campaign analytics. The line it must not cross: it never touches **transactional** email (per-division senders, lifecycle journeys) and it never sends a single message to a suppressed or non-consented address — suppression and consent are the unbypassable guard, not a UI nicety.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/61-product-newsletter-engine` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

The newsletter platform is **already substantially built** — this pass completes and operationalizes it, it does not start it. `packages/newsletter/src/` ships the full domain: `types.ts` (subscriber / suppression / segment / `NewsletterCampaign` with a 10-state status machine `draft→in_review→changes_requested→approved→scheduled→sending→sent|paused|cancelled|archived`, `NewsletterCampaignSendRecord`, `NewsletterBrandVoiceRule`), `segmentation.ts` (`resolveSegment` / `estimateSegmentSize` over AND-of-criteria: divisions, topics, countries, locales, lifecycle, trust, role-hint, engagement-recency, plus exclude-dormant/support-sensitive/trust-hold/dispute-active), `suppression.ts` (`evaluateSuppression`), `subscriber.ts`, `topics.ts`, `voice.ts` (brand-voice guard), `draft.ts` (AI assist), `brevo.ts` (send rail), `sanity.ts`. The canonical tables are declared in `index.ts`: `email_subscribers`, `email_subscriber_topics`, `email_suppression_list`, `email_audience_segments`, `email_campaigns`, `email_campaign_sends`, `email_editorial_events`, `email_brand_voice_rules`, `email_draft_assists`. Fourteen `henry.newsletter.*` telemetry names already exist in `NEWSLETTER_EVENT_NAMES`. There is a staff workspace (`apps/staff/app/(workspace)/operations/newsletter/` with `page.tsx`, `new/`, `[id]/`, `NewsletterDraftEditor.tsx`) and public surfaces (`apps/hub/app/(site)/newsletter/`, `apps/hub/app/api/newsletter/{subscribe,unsubscribe,preferences}`).

The **gap this pass closes**: (1) the campaign tables / migration are not all applied and the **send-batch executor + analytics-ingest webhook** are not wired; (2) authoring exists as a draft editor but lacks per-segment binding, test-send, and schedule-to-`sending` transition with idempotent batch dispatch; (3) double opt-in confirmation round-trip and one-click + per-category unsubscribe are partially stubbed; (4) two stale brand strings must be corrected (`packages/newsletter/src/segmentation.ts` `DEFAULT_SEGMENTS` "Henry & Co. Digest"; `packages/config/brand-emails.ts` header comment "Henry & Co. customer"). The marketing sender is `editorial@henrycogroup.com` (`BRAND_EMAILS.newsletter = at("editorial")`), resolved via `@henryco/config` — **not** a hardcoded `news@`; reconcile against D7 before assuming any literal.

## Mandatory scope

### S1 — Apply + complete the campaign schema

Migration `apps/hub/supabase/migrations/20260603120000_newsletter_campaign_engine.sql`, committed and applied as a deliberate step (the data layer is the source of truth — schema must mirror `packages/newsletter/src/types.ts` exactly). Ensure all nine tables from `index.ts` exist with:
- `email_campaigns` — `status` CHECK over the 10 `NEWSLETTER_CAMPAIGN_STATUSES`; `campaign_class` CHECK over the 5 `NEWSLETTER_CAMPAIGN_CLASSES`; `content JSONB` (mirrors `NewsletterCampaignContent`); `segment_id` FK; `scheduled_for timestamptz`; `author_id`, `approved_by`, `voice_guard_score`, `voice_guard_warnings text[]`.
- `email_campaign_sends` — `status` CHECK over the 12 `NEWSLETTER_SEND_STATUSES`; `provider_message_id`; **`UNIQUE(campaign_id, subscriber_id)`** so a campaign can never double-deliver to the same subscriber (idempotent batch dispatch anchor).
- `email_subscribers` — `status` CHECK over the 5 statuses; `consent_given_at`, `confirmed_at` (double opt-in proof), `unsubscribed_at`, `hard_bounce_count`, `soft_bounce_count`.
- `email_suppression_list` — `reason` CHECK over the 12 `NEWSLETTER_SUPPRESSION_REASONS`, `scope` CHECK over the 5 `NEWSLETTER_SUPPRESSION_SCOPES`, `expires_at`.
- A `BEFORE UPDATE` trigger `enforce_campaign_status_transition()` whose clauses mirror the legal status flow — DB-level defence so a campaign cannot jump `draft→sent`.
- RLS: a subscriber reads only their own subscriber + topic rows (keyed on `auth.uid()` via `user_id`, or unauthenticated rows readable only by a signed token, never broadly); only editorial staff (`public.is_platform_staff()` interim predicate) read/write campaigns, segments, sends, suppression, voice rules; service-role for the batch executor.

### S2 — Campaign authoring (owner/staff)

Extend `apps/staff/app/(workspace)/operations/newsletter/`:
- Rich-text composer producing the typed `NewsletterCampaignContent.bodyBlocks` (`paragraph|heading|callout|cta|divider`) — **structured blocks, never raw HTML paste** (sanitized server-side via `sanity.ts`).
- Segment binding: pick an `email_audience_segments` row; show live `estimateSegmentSize(criteria, candidates)` count before any send.
- Brand-voice guard on save: run `voice.ts` against `email_brand_voice_rules`; `severity:"block"` rules forbid `approved` transition and fire `henry.newsletter.voice.guard_triggered`.
- Test-send to an explicit staff address (writes an `email_editorial_events` row `kind:"test_sent"`, never touches `email_campaign_sends`).
- Schedule: `approved → scheduled` with `scheduled_for`; `henry.newsletter.campaign.scheduled`.

### S3 — Segmentation surface

Surface the existing `resolveSegment` engine in the staff workspace: a segment builder that composes `NewsletterSegmentCriteria` (AND across criterion groups; OR within a multi-value criterion, matching the package semantics) — by division engagement, topic, country, locale, lifecycle stage, trust state, role hint, engagement-recency, plus the four exclude-flags. Persist to `email_audience_segments`; recompute `estimated_size` + `last_resolved_at` on demand. **Do not reimplement matching** — call `resolveSegment` / `estimateSegmentSize` from `@henryco/newsletter`.

### S4 — Batch send executor

New cron-driven, idempotent executor (no app source duplicates the package logic):
- `apps/hub/app/api/cron/newsletter-dispatch/route.ts` — picks `scheduled` campaigns whose `scheduled_for <= now()`, transitions to `sending` (`henry.newsletter.campaign.send_started`), resolves the bound segment via `resolveSegment`, then for each matched candidate **re-checks `evaluateSuppression` at send time** (suppression state can change after scheduling) and inserts an `email_campaign_sends` row — relying on `UNIQUE(campaign_id, subscriber_id)` to make re-runs idempotent. Skipped recipients record the precise skip status (`skipped_suppressed|skipped_preference|skipped_trust_hold|skipped_support_sensitive`) and fire `henry.newsletter.campaign.recipient_suppressed`. On completion → `sent` + `henry.newsletter.campaign.send_completed`.
- Sends go through `brevo.ts` from the **unified marketing sender** resolved via `@henryco/config` (`BRAND_EMAILS.newsletter`, currently `editorial@`); never a per-division transactional sender; never a literal address.
- Batch chunked with a per-run cap; failures mark the send `failed` with `error_code` and leave the campaign resumable (re-run skips already-sent rows by the unique constraint).

### S5 — Consent, double opt-in, unsubscribe

- Double opt-in: `POST /api/newsletter/subscribe` creates a `pending_confirmation` subscriber, sends a confirmation email; the tokened confirm link sets `confirmed_at` + `status:"active"` and fires `henry.newsletter.subscriber.created`. No campaign ever sends to a `pending_confirmation` subscriber (enforced in S4 candidate resolution).
- One-click unsubscribe: every campaign email carries an RFC 8058 `List-Unsubscribe` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click` header and a tokened footer link → `POST /api/newsletter/unsubscribe` flips `status:"unsubscribed"` + writes an `email_suppression_list` row `reason:"unsubscribed", scope:"all"` and fires `henry.newsletter.subscriber.unsubscribed`.
- Per-category granularity: `/api/newsletter/preferences` toggles individual `email_subscriber_topics` opt-outs without unsubscribing wholesale.

### S6 — Per-campaign analytics

- Analytics ingest webhook `apps/hub/app/api/webhooks/brevo/route.ts` — HMAC-verified, idempotent (dedup on provider event id), updates the matching `email_campaign_sends` row (`opened_at|clicked_at|bounced_at|complained_at`) and increments subscriber bounce counters; repeated hard bounces / a spam complaint auto-write a suppression row (`hard_bounce`/`spam_complaint`).
- Per-campaign report in the staff workspace: sent / delivered / open / click / unsubscribe / bounce / complaint, computed from `email_campaign_sends`. Conversion is out of scope here (V3-90 event lake); render the rate columns the send-record statuses support.

### S7 — Brand-string correction

Replace the two stale strings: `packages/newsletter/src/segmentation.ts` `DEFAULT_SEGMENTS[0].description` "the Henry & Co. Digest" → the brand sourced from `@henryco/config` `COMPANY.group.name` ("Henry Onyx"); `packages/config/brand-emails.ts` header comment "Henry & Co. customer" → "Henry Onyx customer". No code-identifier, table-name, or env-prefix change.

## Out of scope

- **Transactional email** (per-division senders, receipts, lifecycle journeys) — preserved untouched.
- **Follow-up / drip campaigns** (V3-48) — this pass consumes V3-48's primitives, it does not rebuild them.
- **A/B testing** (V3-91 experiment framework) and **conversion attribution** (V3-90 event lake).
- **AI draft generation depth** — `draft.ts` exists; metered AI authoring assist is V3-30's surface, not this pass.
- **SMS/push campaigns** — email only here.

## Dependencies

- **Requires:** V3-48 (follow-up campaign primitives), the shipped `@henryco/newsletter` package, `@henryco/email` send rail.
- **Soft-gated on D7** (sender-identity decision — operational; default to `BRAND_EMAILS.newsletter` until D7 lands).
- **Blocks:** nothing downstream hard-depends on the marketing engine; V3-96 (showcase) references it.

## Inheritance

- `@henryco/newsletter` — all domain logic (`resolveSegment`, `estimateSegmentSize`, `evaluateSuppression`, `voice.ts`, `draft.ts`, `brevo.ts`, the 9 table constants, the 14 `henry.newsletter.*` events). **Do not duplicate this logic in app code.**
- `@henryco/email` — send transport.
- `@henryco/config` — `BRAND_EMAILS`, `COMPANY.group.name`, `henryWebRoot()` for confirm/unsubscribe link roots.
- `@henryco/observability/audit-log` — every editorial mutation + every suppression write audited.

## Implementation requirements

### Files

The S1 migration; the S2 authoring + S3 segmentation surfaces under `apps/staff/app/(workspace)/operations/newsletter/`; the S4 dispatch cron + S6 Brevo webhook under `apps/hub/app/api/`; the S5 subscribe/unsubscribe/preferences route completions under `apps/hub/app/api/newsletter/`; the S7 two-string correction. No new package — extend `@henryco/newsletter` only if a pure helper is genuinely missing.

### Trust / safety / compliance

Consent is provable (double opt-in `confirmed_at`). Suppression is re-checked **at send time**, not just at schedule time. One-click unsubscribe is RFC 8058 compliant and honored within the same batch. Every campaign carries physical-sender identity + unsubscribe per CAN-SPAM; GDPR + NDPR lawful-basis = consent; the Brevo webhook is HMAC-verified and idempotent. No bypass path can deliver to a suppressed, non-consented, trust-hold, or dispute-active address — the executor's per-recipient `evaluateSuppression` is the unbypassable gate.

### Mobile + desktop parity

Authoring + segmentation are **desktop-primary** operator surfaces (staff workspace) — acceptable per the operator-surface convention; they must remain usable (no horizontal scroll, legible) on tablet. The subscriber-facing confirm/unsubscribe/preferences pages are public surfaces and must be mobile-first, light + dark, CLS ≈ 0.

### i18n

All operator + subscriber copy through `@henryco/i18n`, namespace **`surface:newsletter`** — campaign-status labels, segment-criterion labels, send-status columns, confirm/unsubscribe/preference page copy, and every error/empty state are typed keys; runtime DeepL (Pattern B) covers the other 11 locales. Subscriber emails render in the subscriber's stored `locale`. Never a hardcoded string.

### Brand & design system

Brand strings (sender display name, email footer, page chrome) read from `@henryco/config` (`COMPANY.group.name` = "Henry Onyx"; legal footer = "Henry Onyx Limited"); the sender address from `BRAND_EMAILS.newsletter`; every link root via `henryWebRoot()` — zero hardcoded `henrycogroup.com`. Subscriber-facing pages use Fraunces + locked `--site-*`/`--accent` tokens, light + dark, mobile + desktop. Email templates use the inline-styled branded shell from `@henryco/email`.

## Validation gates

1. Standard CI: typecheck, lint, test, build (the only required branch-protection context: `Lint, typecheck, test, build`).
2. **Segmentation suite** (`pnpm --filter @henryco/newsletter test`, ≈30+ specs): `resolveSegment` AND/OR semantics, every exclude-flag, suppression-at-resolve, `estimateSegmentSize` parity with `resolveSegment.matchedCount`.
3. **Send-batch idempotency**: a re-run of `newsletter-dispatch` over the same `scheduled` campaign inserts zero duplicate `email_campaign_sends` rows (the `UNIQUE(campaign_id, subscriber_id)` proof).
4. **Suppression-at-send**: a subscriber suppressed *after* scheduling but *before* dispatch is recorded `skipped_suppressed` and receives no email.
5. **Double opt-in**: a `pending_confirmation` subscriber receives no campaign; confirming sets `confirmed_at` + `active`.
6. **One-click unsubscribe** e2e: header + footer link both flip status and write a suppression row.
7. **Brevo webhook** idempotency: a replayed event id mutates the send row exactly once.
8. **RLS**: subscriber reads only own rows; only editorial staff read campaigns/sends.
9. **Brand grep**: zero "Henry & Co." in `packages/newsletter/` and `packages/config/brand-emails.ts`; zero literal `henrycogroup.com` in new app code.

## Deployment gate

All gates green; the only required check (`Lint, typecheck, test, build`) passing; branch `v3/61-product-newsletter-engine` off `origin/main` → PR → squash-merge (no force-push). Owner reviews the authoring surface + the sender decision (D7). The S1 migration is applied as the deliberate activation step. **14-day soak** on live campaign sends with bounce/complaint rate monitored (sender reputation), starting with a small internal-opt-in segment before any broad send.

## Final report contract

`.codex-temp/v3-61-product-newsletter-engine/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion).

## Self-verification

- [ ] S1 migration applied; all 9 tables match `packages/newsletter/src/types.ts`; `UNIQUE(campaign_id, subscriber_id)` + status-transition trigger live; RLS verified.
- [ ] S2 authoring produces typed `bodyBlocks`, binds a segment, shows live size, runs the voice guard, supports test-send + schedule.
- [ ] S3 segmentation surface composes `NewsletterSegmentCriteria` and calls `resolveSegment` / `estimateSegmentSize` — no duplicated matching logic.
- [ ] S4 dispatch cron is idempotent, re-checks suppression at send time, uses the unified marketing sender, never duplicates a send.
- [ ] S5 double opt-in + RFC 8058 one-click unsubscribe + per-category preferences all functional.
- [ ] S6 Brevo webhook HMAC-verified + idempotent; per-campaign analytics render from `email_campaign_sends`.
- [ ] S7 both stale "Henry & Co." strings replaced via `@henryco/config`; zero code-identifier churn.
- [ ] All copy through `surface:newsletter`; zero hardcoded strings/domains; brand reads from `@henryco/config`.
- [ ] Telemetry: the existing 14 `henry.newsletter.*` events fire at their correct lifecycle points (no new event names invented unless a genuine gap).
- [ ] Report written. Hand-off: D7 sender ratification; V3-90 conversion attribution; V3-91 A/B.
