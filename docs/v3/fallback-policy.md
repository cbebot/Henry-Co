# V3-10 — Fallback policy (S5 + A5)

External-service dependencies and what every consumer must do when the
service is unavailable. One row per service. Owner bar: "no major flows
without logs, states, and fallback handling" — this document is the
fallback-handling reference.

A consumer is **compliant** when:

1. The fallback returns a degraded result (empty list, cached value, or
   a calm "service unavailable" UI state) without crashing the page.
2. The fallback emits a typed event (`henry.*.degraded.*`) so degraded
   conditions are observable on the owner dashboard.
3. For mutating routes, the response body includes `degraded: ['<key>']`
   so the client surfaces the partial state (S4 contract).

Untriaged consumers must be added to the inventory before they merge.

---

## Read-side fallbacks

| Service | Where used | Fallback when unavailable | Degraded event |
|---|---|---|---|
| **Typesense** | `apps/*/app/api/search` (CrossDivisionSearchExperience, account search, marketplace search) | Direct Supabase query for the same collection, capped at 20 rows. If both fail, render empty results with `state.error.unavailable` copy. | `henry.search.typesense_fallback` |
| **Google Places** | `@henryco/address-selector` autocomplete; `apps/account/app/api/addresses/*` | Accept user-typed text; persist with `verified: false` flag; show muted "couldn't verify address — we'll confirm later" hint. | `henry.address.places_fallback` |
| **Cloudinary (image fetch)** | `apps/*/lib/cloudinary.ts` consumers (avatar, product images, document thumbnails) | Render the `AvatarFallback` (initials) for users; for product images render the brand-tinted placeholder card from `@henryco/ui/public-shell`. Never broken-image icons. | `henry.media.cloudinary_fallback` |
| **Supabase Storage** | Document downloads (`apps/account/app/api/documents/file/[id]/route.ts`), KYC artefact retrieval, brand assets | Render placeholder asset with `Retrying…` state; surface `state.error.network` after 2 retries with 250/500ms backoff. | `henry.media.storage_fallback` |
| **Supabase Realtime** | `@henryco/dashboard-shell/shell/supabase-realtime-provider` consumers (notifications drawer, live booking state, marketplace orders) | UI shows `reconnecting` badge with last-known state preserved (no flush). After 30s of disconnection, fall back to manual refresh button. | `henry.realtime.reconnecting` |
| **DeepL (runtime translate)** | `packages/i18n/src/translate-runtime.ts` → `translateText`, `translateTextMany` | Return source-locale string verbatim; persist nothing to cache. The string surfaces in EN (or whichever source locale) until DeepL recovers. | `henry.i18n.deepl_fallback` |
| **Sentry** | `@henryco/observability/sentry` callers | Silent no-op (DSN absent → Sentry init reports a warning at startup, then every emit is a noop). Logger continues emitting structured logs to stdout. | (no event — Sentry is the observability sink itself; logger-stream is the fallback) |

## Write-side / side-effect fallbacks (S4 contract)

For mutating routes, the **primary action** still commits — only the side
effect degrades. The response includes the `degraded` array (or the
existing per-route equivalent, e.g. `side_effect_failures`).

| Service | Where used | Primary action / side effect | Degraded marker on response |
|---|---|---|---|
| **Resend / Brevo (email)** | `@henryco/email` consumers (signup welcome, password reset, payment receipt, KYC outcome) | Primary: DB write. Side effect: transactional email. | `degraded: ['email_send_failed']` |
| **OneSignal / Twilio / Termii (SMS, push)** | Notification dispatch in `apps/*/app/api/notifications/*`, OTP delivery | Primary: notification row insert. Side effect: external dispatch. UI shows `pending` delivery state. | `degraded: ['notification_publish_failed']` |
| **Cloudinary (upload)** | `apps/account/app/api/verify/route.ts`, document upload routes | Primary: DB row with `pending_upload` status. Side effect: actual upload. | `degraded: ['upload_failed']` — client retries from the document detail view. |
| **Search index (Typesense outbox)** | Vendor onboarding, listing publish, profile updates | Primary: DB write to canonical row. Side effect: enqueue to Typesense outbox. | `degraded: ['search_index_outbox']` — outbox worker eventually catches up. |
| **Webhook deliver** | Outbound webhook routes (Stripe events, partner integration) | Primary: row written + status `pending_deliver`. Side effect: HTTP POST to webhook URL. | `degraded: ['webhook_deliver_failed']` — replay job retries with exponential backoff. |
| **Future payment provider calls (V3-13/14/15/16)** | TBD payment routes | Primary: order row created with `payment: pending`. Side effect: provider charge call. | `degraded: ['payment_provider_unavailable']` — UI shows retry CTA. |
| **Future AI provider calls (V3-26)** | AI assist routes | Primary: request row queued. Side effect: provider call. If provider fails, fall back to deterministic rule-based response. | `degraded: ['ai_provider_unavailable']`. |

---

## Reference implementations

The pattern source-of-truth is the intelligence-rollout adopter in
`apps/account/app/api/support/create/route.ts`. It demonstrates:

- Primary action (thread + message rows) commits unconditionally.
- Side effects (care bridge, activity row, notification publish,
  intelligence event) each wrap in try/catch and push to
  `sideEffectFailures: string[]`.
- Response body: `{ success, thread_id, side_effects_ok, side_effect_failures }`.
- HTTP status: 200 on full success, 207 (Multi-Status) when partial.

V3-10 ships this pattern as the reference. Follow-up passes extend it to:

- All payment-touching routes (deferred to V3-13 wave).
- All KYC submission routes (deferred to V3-17 + V3-21).
- All notification-publishing routes (deferred to V3-43 workflow engine).
- All webhook-receiving routes (deferred to V3-43).

Until the follow-up passes land, ad-hoc adopters can copy the pattern
directly from `apps/account/app/api/support/create/route.ts`.

---

## Observability contract

Every fallback emits a typed event. The owner dashboard's V3-10 observability
tile (S9 + A10) aggregates these to surface:

- "Degraded side effects (last 24h)" — grouped by event name (`henry.*.*.failed`).
- "External-service health" — count of `*_fallback` events per service.

The data source is the `henry_events` table (V3-01 slice 5b), NOT the Sentry
stats API (A10 — Sentry's stats tier is paid-only).
