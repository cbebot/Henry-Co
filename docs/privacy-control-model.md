# HenryCo Privacy Control Model

**Classification:** Internal — Privacy Architecture Reference  
**Scope:** Consent categories, storage, enforcement, user-facing surfaces

---

## Overview

HenryCo uses a five-category consent model stored client-side (localStorage + cross-domain cookie). Opt-out is the default for all optional categories. No optional tracking activates until the user explicitly enables it.

This document describes what each consent category governs, where state is stored, how it is enforced, and where users can review it.

---

## Consent Categories

| Category | Default | What it governs |
|---|---|---|
| `essential` | Always `true` (non-configurable) | Session continuity, sign-in, security-critical flows, checkout state |
| `preferences` | `false` | Optional interface choices (theme, locale, layout hints) persisted cross-session |
| `personalizedExperience` | `false` | Non-essential recommendations, contextual hints based on past behaviour |
| `analytics` | `false` | Optional measurement runtimes (e.g. FingerprintJS Pro device fingerprinting) |
| `marketing` | `false` | Optional remarketing and push-notification runtimes (e.g. OneSignal web push) |

Essential is hardcoded `true` and cannot be toggled off. No user-facing control should attempt to expose it as optional.

---

## State Storage

Consent state is persisted at two levels simultaneously so it survives across:
- Same-site navigations (localStorage)
- Cross-subdomain navigations (shared-domain cookie)

**Key constants** (`packages/ui/src/public/consent-state.ts`):

| Constant | Value |
|---|---|
| `HENRYCO_CONSENT_STORAGE_KEY` | `"henryco-ecosystem-consent"` |
| `HENRYCO_CONSENT_COOKIE_KEY` | `"henryco_ecosystem_consent"` |
| Cookie max-age | 1 year (`max-age=31536000`) |
| Cookie scope | Shared domain via `getSharedCookieDomain()` |
| SameSite | `lax` |

A legacy key (`henryco-care-cookie-consent` / `henryco_care_cookie_consent`) is automatically migrated and cleared on first read.

---

## Enforcement Points

### Client-side SDKs (enforced)

The `ThirdPartyRuntimeProviders` component (`packages/ui/src/public-shell/third-party-runtime-providers.tsx`) is mounted in every app layout. It reads consent state reactively and gates:

| Runtime | Consent required | What happens without it |
|---|---|---|
| FingerprintJS Pro | `analytics = true` | SDK never initialises; `FpjsProvider` not mounted |
| OneSignal web push | `marketing = true` | SDK scripts never loaded |

State is re-evaluated on `henryco:consent-updated` custom event and `storage` events (cross-tab sync).

### Server-side activity writes (consent-exempt by design)

Route handlers in all division apps write `customer_activity` rows for internal funnel analytics and audit purposes. These writes:
- Do not require client-side consent
- Are internal operational records, not marketing tracking
- Pass all properties through `sanitizeAnalyticsProperties()` which strips PII before persistence
- Are governed by the data retention schedule (1-year retention for `customer_activity`)

See [consent-and-tracking-boundaries.md](./consent-and-tracking-boundaries.md) for the distinction between server writes and client-side SDKs.

---

## First-Visit Discovery

A `ConsentNotice` component (`packages/ui/src/public-shell/consent-notice.tsx`) is mounted in the hub and account app layouts. It:
- Appears only when `readStoredHenryCoConsent()` returns `null` (consent never set)
- Does not block navigation or usage
- States that essential storage is active and optional tracking is disabled by default
- Provides a link to full privacy settings
- "Got it" saves essential-only consent state (so it never reappears)

All other apps (care, jobs, learn, marketplace, logistics, property, studio) rely on the same safe default (analytics=false, marketing=false) without a visible first-visit notice. They should add `<ConsentNotice preferencesHref="…" />` to their layouts when an appropriate cross-app preferences destination is determined.

---

## User-Facing Privacy Controls

| Surface | Location | What it controls |
|---|---|---|
| Hub preferences page | `/preferences` | All 5 consent toggles + locale + theme |
| Account privacy controls | `/settings#privacy-controls` | All 5 consent toggles + manual data export/delete |

Both surfaces call `persistHenryCoConsent()` which writes localStorage and cookie simultaneously and dispatches `henryco:consent-updated` so `ThirdPartyRuntimeProviders` re-evaluates consent state immediately without a page reload.

---

## Cross-App Consent Consistency

Because consent is stored in a shared-domain cookie in addition to localStorage, a user who sets preferences on hub.henrycogroup.com will have their choice respected on account.henrycogroup.com, marketplace.henrycogroup.com, etc. without needing to repeat the choice on each app.

This requires that all apps share the same registered domain (e.g. `henrycogroup.com`) and that `getSharedCookieDomain()` resolves correctly in each environment.

---

## Related Documents

- [consent-and-tracking-boundaries.md](./consent-and-tracking-boundaries.md) — when server writes are consent-exempt
- [data-retention-and-delete-readiness.md](./data-retention-and-delete-readiness.md) — how long data is kept
- [internal-data-access-governance.md](./internal-data-access-governance.md) — staff/admin access patterns
- [storage-retention-and-cleanup.md](./storage-retention-and-cleanup.md) — cleanup procedures
