# V3 Integration Keys & Active Env Vars — Single Source of Truth

**Pass:** V3 Strategic Architect (cross-cutting reference)
**Compiled:** 2026-05-17
**Status:** Authoritative. Every V3 prompt MUST consult this file before introducing a new env var or hardcoding a service identifier. If a service belongs on this list and isn't here, add it before writing code.

This file enumerates every external integration HenryCo uses across V3, the env vars that gate it, the active/functional keys, where each integration adds real value (i.e. used smartly, not sprinkled for show), and which Pass IDs touch it.

---

## North-star rules

1. **No hardcoded keys, tokens, URLs, secrets, or service identifiers anywhere in code.** Ever. Use env vars exclusively. The `.env` file is the source of truth.
2. **No placeholder strings.** No `"YOUR_KEY_HERE"`, no `"TODO_REPLACE"`, no `"sk_test_xxx"` left in committed code.
3. **No silent fallbacks for missing keys.** If a key is required for a flow, the flow must fail-closed with a structured error + observability event, NOT silently degrade unless the degradation is explicitly designed.
4. **No keys in client bundles.** Every server-only key is consumed only on the server. Verify with `grep` on the built bundle.
5. **Every integration is used because it adds real value, not because it's available.** Each entry below names the value-add. If a pass introduces an integration that doesn't match a value-add here, the pass author justifies it in the report and updates this file.
6. **One source of truth per concern.** If two services overlap (e.g., maps), one is chosen and one is removed.
7. **Active keys are owner-managed.** This file lists env var names ONLY. Actual key values live in Vercel project settings (production), `.env.local` (dev), and the owner's password manager (master). Never commit keys.

---

## Canonical env var inventory

The table below lists every active integration HenryCo uses in V3, the env var name(s), where the key is consumed (server / client / both), and which V3 passes depend on it.

### Identity, Auth, Data

| Integration | Env var(s) | Side | Used in | Value-add |
|---|---|---|---|---|
| Supabase (Auth, DB, Realtime, Storage) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | both / server | every pass | Identity + DB + Realtime + Storage; single backend |
| `SUPABASE_JWT_SECRET` | server | V3-01, V3-02 | Cookie signing for `hc_session_state` (V3-01), `hc_last_reauth` + `hc_oauth_error` + `hc_oauth_link_intent` (V3-02) |

### Auth feature gates

Boolean env vars that gate optional auth flows. Default OFF — flipped to `1` (or `true`) only after owner UX sign-off on a preview deploy. Not service integrations; documented here so they live alongside the other auth env vars they share a secret with.

| Flag | Default | Used in | Behavior when ON | Owner gate before flipping |
|---|---|---|---|---|
| `HENRYCO_AUTH_OAUTH_LINK_INTENT` | OFF | V3-02 (A1) | OAuth callback diverts newly-attached identities through `/auth/link-account` (signed `hc_oauth_link_intent` cookie, 10-min TTL). When OFF the auto-link diversion is silently skipped and the user lands as if first-time signed-in. | Flip to `1` only after owner reviews the link-account UX on a preview deploy. Leave OFF in production until reviewed. |

### Payment Providers

| Integration | Env var(s) | Side | Used in | Value-add |
|---|---|---|---|---|
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | server / client | V3-14, V3-19, V3-20, V3-23, V3-69 | Card payments, Apple Pay, Google Pay, Connect for payouts |
| Paystack | `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | server / client | V3-15, V3-19, V3-20, V3-69 | Nigeria-native cards, bank, USSD, transfers, payouts |
| Flutterwave | `FLW_SECRET_KEY`, `NEXT_PUBLIC_FLW_PUBLIC_KEY`, `FLW_SECRET_HASH` | server / client | V3-16, V3-19, V3-20, V3-69 | Multi-rail Africa, mobile money, multi-currency, payouts |

#### Mock payment rail (V3-13)

The provider router (`@henryco/payment-router`) ships in V3-13 proven against an in-package MockProvider only — no live provider until V3-14 (Stripe) / V3-15 (Paystack) / V3-16 (Flutterwave). These flags gate the dormant rail. **All three are dev/test only — never set in production.** Note the value convention: `createPaymentRouter()` activates on `MOCK_PAYMENT=1` *exactly* (not `true`, unlike the sibling `MOCK_AI` / `MOCK_KYC` / `MOCK_SMS` toggles); any other value leaves zero providers registered, so every route fails closed to the A5 manual-fallback path rather than silently mocking.

| Flag | Values | Used in | Behavior |
|---|---|---|---|
| `MOCK_PAYMENT` | `1` = on; unset / anything else = off | V3-13 | `=1` registers MockProvider under every real provider key, so country∩capability routing behaves exactly as in production while the mock executes charges. Off ⇒ no providers registered ⇒ all routes resolve to A5 manual-fallback (HTTP 422). |
| `MOCK_PAYMENT_FAILURE` | `retryable` \| `fatal` | V3-13 | Forces MockProvider charge failure: `retryable` lets the router fail over to the next provider; `fatal` stops immediately (no failover). Drives the failover specs. |
| `MOCK_PAYMENT_WEBHOOK_SECRET` | HMAC secret string | V3-13 | Secret the mock webhook route (`POST /api/payments/webhooks/mock`) verifies the `x-signature` HMAC against. Absent ⇒ the route fail-closes with HTTP 503. |

### AI Providers

| Integration | Env var(s) | Side | Used in | Value-add |
|---|---|---|---|---|
| Anthropic | `ANTHROPIC_API_KEY` | server | V3-26, V3-27, V3-28..V3-32, V3-36, V3-40, V3-41 | Primary AI provider for HenryCo Intelligence (per D3) |
| OpenAI | `OPENAI_API_KEY` | server | V3-26 fallback + cheap-classification | Secondary AI provider; cheap classification tasks |

### Communications (Email, Push, SMS)

| Integration | Env var(s) | Side | Used in | Value-add |
|---|---|---|---|---|
| Resend (primary email) | `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET` | server | every pass touching email | Transactional + auth email primary |
| Brevo (auth SMTP fallback) | `BREVO_API_KEY`, `BREVO_SMTP_USER`, `BREVO_SMTP_PASS` | server | V3-02, V3-46, V3-48, V3-61 | Auth email fallback when Resend hits rate limits |
| Cloudflare Email Routing (INBOUND) | `INBOUND_EMAIL_WEBHOOK_SECRET` (hub) · Worker: `INBOUND_WEBHOOK_URL`, `MAX_RAW_BYTES` + secret `INBOUND_EMAIL_WEBHOOK_SECRET` | server | V3-OWNER-INBOX-01 | RECEIVING company email → owner inbox (catch-all → Worker → `/api/inbound/email`). Inbound-only; independent of Resend/Brevo SENDING. |
| OneSignal (web + mobile push) | `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`, `NEXT_PUBLIC_ONESIGNAL_APP_ID` | both | V3-03, V3-45, V3-88 | Push notifications on web + mobile |
| Twilio (SMS) | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | server | V3-45, V3-48 (high-priority opt-in only) | SMS reminders + 2FA where SMS preferred |
| Termii (SMS African markets) | `TERMII_API_KEY`, `TERMII_FROM` | server | V3-45 (Nigeria-primary SMS) | Better African SMS deliverability than Twilio for NG; cost-efficient |
| WhatsApp Business / Meta | `WHATSAPP_APP_SECRET`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN` | server | V3-44 (auto-assign on whatsapp inbound), care/property/studio existing | Conversational support via WhatsApp |

### Maps, Geo, Address

| Integration | Env var(s) | Side | Used in | Value-add |
|---|---|---|---|---|
| **Mapbox** | `NEXT_PUBLIC_MAPBOX_TOKEN`, `MAPBOX_SERVER_TOKEN` (separate scope for server geocoding) | both | V3-38, V3-51, V3-63, V3-64, V3-87 | Interactive maps (geo-search, provider locations, rider routing, property neighborhoods, logistics live tracking, super-app map views) |
| Google Places | `GOOGLE_PLACES_API_KEY`, `NEXT_PUBLIC_GOOGLE_PLACES_KEY` (scoped to autocomplete only) | both | V2-ADDR-01 (existing), V3-04, V3-38 | Address autocomplete + KYC address validation. Pairs with Mapbox (Places for autocomplete, Mapbox for map rendering). |

### Search, Discovery

| Integration | Env var(s) | Side | Used in | Value-add |
|---|---|---|---|---|
| Typesense | `TYPESENSE_HOST`, `TYPESENSE_ADMIN_API_KEY`, `NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY` | both | V3-49, V3-50, V3-52, V3-63 + existing V2-SEARCH-01 | Fast typo-tolerant cross-division search |

### Storage, Media

| Integration | Env var(s) | Side | Used in | Value-add |
|---|---|---|---|---|
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | both | every pass touching images/video | Image + video CDN + on-the-fly transforms; primary asset store |

### KYC, Trust

| Integration | Env var(s) | Side | Used in | Value-add |
|---|---|---|---|---|
| Smile Identity | `SMILE_PARTNER_ID`, `SMILE_API_KEY`, `SMILE_CALLBACK_URL` | server | V3-24 (African markets primary per D6) | African ID verification (BVN, NIN, voter cards, passport, driver's license, biometric) |
| Onfido | `ONFIDO_API_TOKEN`, `ONFIDO_WEBHOOK_TOKEN` | server | V3-24 (international fallback) | International document + facial verification |

### Observability

| Integration | Env var(s) | Side | Used in | Value-add |
|---|---|---|---|---|
| Sentry | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` (CI source-map upload) | both / server | V3-10, V3-89 + every app | Error tracking, performance traces, alerting |
| Vercel Analytics + Speed Insights | (zero-config; on by default) | client | every app | Web vitals + analytics; included with Vercel |

### Domain + DNS

| Integration | Env var(s) | Side | Used in | Value-add |
|---|---|---|---|---|
| Cloudflare (DNS + WAF) | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID` | server | V3-89 (DNS + rate limit at edge) | DNS + WAF + edge rate limiting + bot detection |
| Namecheap / GoDaddy (domain lookup) | `NAMECHEAP_API_KEY`, `NAMECHEAP_USERNAME` OR `GODADDY_KEY`, `GODADDY_SECRET` | server | V3-32 (Studio domain assist) | WHOIS lookup + domain availability + pricing for studio domain assist |

### Background Jobs, Workflow

| Integration | Env var(s) | Side | Used in | Value-add |
|---|---|---|---|---|
| Upstash Redis (rate limit + cache) | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | server | V3-13, V3-26, V3-76, every rate-limited route | Edge rate limiting + ephemeral cache |
| Cron secret | `CRON_SECRET` | server | every cron route | Cron auth (fail-closed without it) |

### Mobile

| Integration | Env var(s) | Side | Used in | Value-add |
|---|---|---|---|---|
| Expo (EAS) | `EXPO_TOKEN` (CI builds) | CI | V3-86, V3-87, V3-88 | Mobile build + dist |
| Apple App Store Connect | `ASC_API_KEY_ID`, `ASC_ISSUER_ID`, `ASC_PRIVATE_KEY` (CI submission) | CI | V3-88 | iOS submission automation |
| Google Play Developer | `GPLAY_SERVICE_ACCOUNT_JSON` (CI submission) | CI | V3-88 | Android submission automation |

### Tax, Compliance

| Integration | Env var(s) | Side | Used in | Value-add |
|---|---|---|---|---|
| (Internal tax engine — no vendor for V3 per D5) | (none) | server | V3-21 | NGN VAT computed internally |
| Future tax vendor (Avalara / TaxJar — V4 only) | TBD | server | (V4) | Per-state US sales tax + per-country VAT/GST automation |

### A/B Testing + Feature Flags

| Integration | Env var(s) | Side | Used in | Value-add |
|---|---|---|---|---|
| GrowthBook (self-host OR cloud) | `GROWTHBOOK_API_HOST`, `GROWTHBOOK_CLIENT_KEY`, `GROWTHBOOK_SECRET_API_KEY` | both | V3-91 + every A/B-tested pass | Feature flags + A/B experiments + targeting rules |

### Translation

| Integration | Env var(s) | Side | Used in | Value-add |
|---|---|---|---|---|
| DeepL (Pattern B runtime translation) | `DEEPL_API_KEY`, `DEEPL_API_HOST` (free vs pro endpoint) | server | every i18n surface, especially V3-07, V3-84 | Runtime translation for 12 locales when typed Pattern A copy not present |

### Calendar, Communication Sync (future, V4)

| Integration | Env var(s) | Side | Used in | Value-add |
|---|---|---|---|---|
| Google Calendar (future) | TBD | server | (V4) | 2-way sync for bookings |

### Domain Email Sender Identities

| Sender | Use | Configured in |
|---|---|---|
| `notifications@henrycogroup.com` | Transactional cross-division | Resend + L11 DNS |
| `support@henrycogroup.com` | Support replies | Resend + L11 |
| `care@henrycogroup.com` | Care division transactional | Resend + L11 |
| `marketplace@henrycogroup.com` | Marketplace transactional | Resend + L11 |
| `studio@henrycogroup.com` | Studio transactional | Resend + L11 |
| `jobs@henrycogroup.com` | Jobs transactional | Resend + L11 |
| `learn@henrycogroup.com` | Learn transactional | Resend + L11 |
| `logistics@henrycogroup.com` | Logistics transactional | Resend + L11 |
| `property@henrycogroup.com` | Property transactional | Resend + L11 |
| `news@henrycogroup.com` | Newsletter / marketing (per D7) | Resend + L11 |
| `noreply@henrycogroup.com` | System auto-reply | Resend + L11 |

---

## Where each integration adds value (the "smart use" map)

This section makes the value-add explicit so passes don't sprinkle integrations for show. Every integration is used only where it earns its place.

### Mapbox — used where maps + geo matter

- **V3-38 (local availability):** show "available in your area" radius + provider service-area on a map.
- **V3-51 (smart booking):** provider location pinned + customer location pinned + distance shown.
- **V3-63 (local discovery):** city landing page hero map with featured providers; "near you" search with map-cluster.
- **V3-64 (logistics network maturity):** live rider position + delivery ETA + route line on a map.
- **V3-87 (mobile super-app):** native map view via Mapbox Maps SDK for React Native.
- **Property listings (existing app, extended in V3-53):** neighborhood map + listing pin.

NOT used where a map adds no value (e.g., generic dashboard tiles, marketing pages).

### Anthropic + OpenAI — used per task class

- **V3-29 (support assist):** Anthropic — long-form reasoning preserves user intent.
- **V3-30 (business message assist):** Anthropic — brand-voice-aware drafting.
- **V3-31 (account check):** Anthropic — careful refusal + factual grounding.
- **V3-32 (studio brief + domain assist):** Anthropic for brief; deterministic registry API for domain lookup.
- **V3-36 (cross-division recommendations):** OpenAI 4o-mini for cheap classification + Anthropic for explainable reason codes.
- **V3-40 (fraud + risk):** training-data labelling + edge-case classification — OpenAI for cheap path, Anthropic for hard cases.
- **V3-25 (content moderation):** OpenAI moderation-tuned models for cheap pre-screen + Anthropic for harder cases.

NEVER used for: pure deterministic logic (use rules), pricing computation (server-side formula only), final ranking decisions (rule-based first, AI for explainability only).

### Cloudinary — used everywhere images + video live

- All product images, listing photos, KYC scans (encrypted), profile avatars, branded-document previews, studio motion delivery, marketplace seller storefronts.
- On-the-fly transforms eliminate the need to ship multiple resolutions.

### Smile Identity + Onfido — only at L3+ verification gates

- Smile Identity for African markets (Nigeria, Kenya, South Africa, Ghana) — BVN, NIN, voter card, passport, driver's license + biometric.
- Onfido for international fallback.
- NOT used for email-only L1 verification (Supabase Auth handles that).

### Typesense — used everywhere search latency matters

- Cross-division search palette (existing).
- Marketplace product search (V3-52).
- Service catalog search (V3-49).
- Provider directory search (V3-50).
- City landing trending search (V3-63).
- Internal staff search for moderation queue (V3-25).

NOT used for: simple paginated list views (use direct DB query); admin lookups (use direct DB).

### Sentry — server + client error tracking + traces

- Every app `Sentry.init` (V3-10 enforces).
- Traces for slow routes (V3-89).
- Performance budget alerts (V3-89).
- Release health per Vercel deploy.

### OneSignal + Twilio + Termii — chosen per channel + per market

- OneSignal: web + mobile push (V3-88 wires mobile fully).
- Twilio: international SMS.
- Termii: Nigeria SMS (cheaper + better deliverability).
- WhatsApp: high-priority + opted-in conversational notifications.

### GrowthBook — used only when A/B-tested

- V3-91 brings it online.
- Used in: V3-52 (marketplace ranking variants), V3-35 (deals copy), V3-48 (campaign A/B).
- NOT used for: trivial feature flags that don't need analytics (use `@henryco/intelligence` parseHenryFeatureFlags).

### DeepL — runtime Pattern B translation

- Already wired for surface labels.
- Used when typed Pattern A copy not yet present in a locale.
- NOT used for translating: legal documents (always counsel-reviewed), brand voice copy (always human-reviewed).

---

## Anti-patterns this file enforces

Every V3 prompt and every PR must reject:

- Hardcoded URL like `'https://api.stripe.com/v1'` — use the SDK, which reads from env.
- Hardcoded API key like `'sk_live_xxx'` — use `process.env.STRIPE_SECRET_KEY`.
- Hardcoded sender like `'support@henrycogroup.com'` — use a helper like `henrySender('support')` that resolves from config + env.
- Hardcoded domain like `'henrycogroup.com'` — use `henryDomain(division)` per V3-07.
- Hardcoded map tile URL — use Mapbox SDK with token from env.
- Hardcoded Supabase URL in client code — use the `@henryco/auth/client` helpers that read public env vars.
- Hardcoded division names — use the `henryDivisionSchema` enum from `@henryco/intelligence`.
- Decorative integrations (added because available, not because needed) — every integration earns its place per the value-add map above.

---

## How prompts cite this file

Every V3 prompt's "Integration changes" section must:

1. List the integrations this pass touches.
2. Confirm each integration's env vars are inventoried here.
3. If introducing a new integration: add it to this file in the same PR.
4. Confirm no hardcoded keys / URLs / sender identities in the diff.
5. Verify with a grep against the diff: `grep -E '(api[_-]?key|secret|token|password)[ ]*[=:][ ]*["'"'"']` matches zero new hardcoded values.

---

## Vercel env scoping (per `project_henryco_vercel_preview_env_gap.md`)

Memory notes that Supabase env was scoped production-only in some Vercel projects, causing marketplace/logistics/account preview 500s. **Lesson:** every required env var must be set for production AND preview (and ideally development).

Verify per app per pass:
- Production scope: every required var present.
- Preview scope: every required var present (use sandbox/test keys where appropriate).
- Development scope: every required var present (local dev should not hit production providers).

---

## Per-environment defaults

| Scope | Stripe | Paystack | Flutterwave | AI provider | KYC | SMS |
|---|---|---|---|---|---|---|
| Production | Stripe LIVE | Paystack LIVE | Flutterwave LIVE | Real provider | Real vendor | Real provider |
| Preview | Stripe TEST | Paystack TEST | Flutterwave TEST | Mock or low-cost real | Sandbox | Mock or low-cost |
| Development | Mock-only | Mock-only | Mock-only | `MOCK_AI=true` | Sandbox | Mock |

Mock-mode env vars: `MOCK_AI=true`, `MOCK_PAYMENT=1` (payment uses `1`, not `true` — see the V3-13 mock payment rail note above), `MOCK_KYC=true`, `MOCK_SMS=true`. Each adapter respects its mock toggle.

---

## Owner action: keys to provision / verify before V3 work starts

Per `LEGAL-AND-BUSINESS.md` + `DECISIONS-REQUIRED.md`:

- [ ] Stripe merchant account → keys in Vercel env (per L4)
- [ ] Paystack merchant account → keys in Vercel env (per L4)
- [ ] Flutterwave merchant account → keys in Vercel env (per L4)
- [ ] Smile Identity contract → keys in Vercel env (per L5)
- [ ] Onfido contract → keys in Vercel env (per L5)
- [ ] Anthropic commercial agreement → key in Vercel env (per L13 + L14)
- [ ] OpenAI commercial agreement → key in Vercel env (per L13 + L14)
- [ ] Mapbox account → public + server tokens in Vercel env
- [ ] Google Places API key → already partially wired; verify provisioning (V2-ADDR-01 carry-forward)
- [ ] Typesense host → keys in Vercel env (V2-SEARCH-01 carry-forward; currently NOT provisioned per AUDIT-BASELINE.md)
- [ ] OneSignal app → keys in Vercel env (already wired SW)
- [ ] Twilio + Termii accounts → keys in Vercel env
- [ ] WhatsApp Business app → `WHATSAPP_APP_SECRET` provisioned across care + property + studio (V3-BACKLOG B2 carry-forward)
- [ ] Sentry projects per app → DSN in Vercel env
- [ ] Cloudflare → tokens in Vercel env
- [ ] Upstash Redis → REST creds in Vercel env
- [ ] Cloudinary → already wired; verify keys current
- [ ] DeepL → already wired
- [ ] GrowthBook → keys when V3-91 ships
- [ ] CRON_SECRET → already used; verify rotation policy

Each key has a rotation interval (90-365 days depending on sensitivity). Track in owner password manager.

---

## Self-verification

- [x] Every integration HenryCo uses in V3 enumerated.
- [x] Per integration: env var names + side + passes + value-add.
- [x] North-star rules stated (no hardcoding, fail-closed, etc.).
- [x] Per-environment defaults documented.
- [x] Owner action checklist for key provisioning.
- [x] Anti-patterns enumerated.
- [x] Memory `project_henryco_vercel_preview_env_gap.md` lesson captured.
- [x] Cross-references to LEGAL-AND-BUSINESS + DECISIONS-REQUIRED preserved.
