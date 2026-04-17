# HenryCo Consent and Tracking Boundaries

**Classification:** Internal — Engineering Reference  
**Scope:** Where consent applies, where it does not, and why

---

## The Core Distinction

HenryCo has two fundamentally different kinds of data writes that are often confused:

| Kind | Example | Consent required? | Why |
|---|---|---|---|
| **Client-side third-party SDKs** | FingerprintJS Pro, OneSignal | **Yes** | These initialise browser runtimes that can fingerprint the device, set third-party cookies, or send data off-platform. They must be gated by consent. |
| **Server-side internal activity writes** | `customer_activity` inserts in route handlers | **No** | These are internal operational records, equivalent to server access logs + funnel analytics. They do not involve third-party processors and do not require end-user consent under the same framework. |

Conflating the two leads to either over-restricting legitimate internal analytics or under-restricting third-party tracking. HenryCo's architecture keeps these separate by design.

---

## Client-Side SDK Boundary (Consent-Gated)

### What is gated

| Runtime | Consent category | File |
|---|---|---|
| FingerprintJS Pro (`@fingerprintjs/fingerprintjs-pro-react`) | `analytics` | `packages/ui/src/public-shell/third-party-runtime-providers.tsx` |
| OneSignal web push SDK | `marketing` | `packages/ui/src/public-shell/third-party-runtime-providers.tsx` |

### How gating works

`ThirdPartyRuntimeProviders` reads `readStoredHenryCoConsent()` on mount and on `henryco:consent-updated` / `storage` events. If `consentAllowsAnalytics(consent)` is false, `FpjsProvider` is never mounted. If `consentAllowsMarketing(consent)` is false, the OneSignal `<Script>` elements are never rendered.

Default state is `analytics: false, marketing: false` — both SDKs are disabled until the user explicitly opts in.

### What is NOT currently gated (and why)

| Service | Reason not gated | Classification |
|---|---|---|
| Brevo transactional email | Server-side, only sent in response to explicit user action (signup, booking confirmation, etc.) | Essential — not consent-optional |
| Supabase auth sessions | Browser cookie set by Supabase Auth as part of sign-in flow | Essential |
| Stripe.js | Loaded only when user initiates payment, required for PCI scope | Essential |
| Next.js internal telemetry | Disabled at build time via `NEXT_TELEMETRY_DISABLED=1` | N/A |

---

## Server-Side Activity Writes (Consent-Exempt)

### What these are

Route handlers in all division apps (account, marketplace, jobs, care, learn, logistics, property, studio) write rows to `customer_activity` when users take meaningful actions (applications, bookings, orders, verification submissions, etc.).

These rows are HenryCo's internal funnel analytics and operational audit trail. They are:
- Stored only in HenryCo's own Supabase database
- Not shared with advertising networks or data brokers
- Not used for cross-site tracking
- Subject to the 1-year retention schedule

### PII protection at write time

All `customer_activity` metadata is passed through `sanitizeAnalyticsProperties()` before insert. This function strips 23+ field categories matching sensitive patterns:

```
email, phone, message, body, note, token, secret, password, otp, pin,
address, document, file, attachment, proof, public_id, url,
bank_name, account_name, account_number, payout_reference,
reviewer_note, ip, user_agent, location
```

Stripped field keys are recorded in `analytics.redactions[]` for audit purposes. The event still writes but personal data fields are omitted.

### Why no consent check at write time

Server-side funnel analytics for a platform's own products fall under the "legitimate interests" or "necessary for the service" bases in most privacy frameworks — the same basis that covers server access logs. These writes:
- Track user interactions with HenryCo's own platform
- Are necessary for fraud detection, trust scoring, and product improvement
- Do not fire third-party pixels or trackers
- Are not used for advertising retargeting

If HenryCo's legal/compliance position changes (e.g. operating under a stricter national regulation), add a `HENRY_ANALYTICS_REQUIRE_CONSENT` feature flag that can gate `buildCanonicalActivityMetadata` writes without a code rewrite.

---

## Analytics Event Emission (`packages/intelligence`)

`trackEvent(sink, event)` in `packages/intelligence/src/index.ts` validates the event envelope against `henryEventEnvelopeSchema` and calls `sink.emit()`. In `apps/account/lib/intelligence-rollout.ts`, the sink is `noopSink` — the emit call does nothing. The actual persistence happens via the `customer_activity` insert below it.

This means no HenryCo analytics events currently leave the platform. No third-party analytics service (Mixpanel, Amplitude, Segment, etc.) is wired to any `AnalyticsSink`. If one is wired in future, the consent check (`consentAllowsAnalytics(consent)`) **must** guard the `trackEvent` call at the call site before the sink fires.

---

## Consent Event Bus

Consent changes propagate synchronously via:

1. `localStorage.setItem(HENRYCO_CONSENT_STORAGE_KEY, ...)` — same-tab, same-origin
2. `document.cookie = HENRYCO_CONSENT_COOKIE_KEY=...` — cross-origin on shared domain
3. `window.dispatchEvent(new CustomEvent(HENRYCO_CONSENT_UPDATED_EVENT, ...))` — same-tab reactive

Cross-tab sync happens when `storage` events fire on `HENRYCO_CONSENT_STORAGE_KEY` changes. `ThirdPartyRuntimeProviders` listens to both the custom event and `storage` events and re-evaluates consent immediately.

---

## Environment Variable Boundary

Client-safe variables (`NEXT_PUBLIC_*`) exposed to the browser are limited to:
- Supabase URL and anon key (not secret — anon key is RLS-gated)
- OneSignal app ID and Safari web ID
- FingerprintJS Pro API key and region
- Mapbox public token, Stripe publishable key, Typesense search-only key, Sentry DSN

Server secrets (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `BREVO_API_KEY`, `TWILIO_AUTH_TOKEN`, etc.) are never exposed to client bundles. The guardrail script (`scripts/ci/repo-guardrails.mjs`) blocks `NEXT_PUBLIC_*SECRET*` patterns in CI.

---

## Related Documents

- [privacy-control-model.md](./privacy-control-model.md) — consent categories and user-facing controls
- [data-retention-and-delete-readiness.md](./data-retention-and-delete-readiness.md) — how long data is kept
- [internal-data-access-governance.md](./internal-data-access-governance.md) — staff access patterns
- [vercel-third-party-services.md](./vercel-third-party-services.md) — all third-party integrations
