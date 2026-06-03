# V3-04 — Foundation Lock: Deep Links

> **STATUS: SHIPPED — PR #166.** Merged and certified on `main` within the Phase B Foundation Lock (CERTIFIED at V3-12, PR #168). The typed deep-link builders, the auth round-trip preservation, the universal/app-link manifests, the share surface, and the dead-link telemetry are live. This document is the elevated canonical spec and closure record. Anything still open is named under **Deferred / residual**.

**Pass ID:** V3-04  ·  **Phase:** B (Foundation Lock)  ·  **Pillar:** P3 (Personalization), P12 (Global)
**Dependencies:** V3-02 (indirectly V3-01)  ·  **Effort:** M  ·  **Parallel-safe:** Y (Wave 3)
**Owner gate:** none  ·  **Risk class:** —

---

## Role
You are the V3 Foundation engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass closes the **deep links** sub-bar of Foundation Lock: every notification, email, SMS, and share link opens the *exact* workflow step — never a generic landing — and every auth-gated deep link survives the auth round-trip and lands the user back at the target. Mobile deep links open the Expo super-app via universal/app links. The line you must not cross: no third-party deep-link SaaS (native iOS/Android mechanisms only), no cross-domain SSO change, and an open-redirect on the `return=` param is a hard failure.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/04-deep-links` |
| Deploy | Vercel + Expo |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

Branch off `origin/main` after confirming V3-02 has merged (parallel-session check first).

## Audit summary
Subscriptions, invoices, and care bookings already deep-link into dedicated detail routes. Three gaps remain: (1) auth-gated deep links lose their target across a sign-in detour — `/account/orders/123` does not provably land back at `/orders/123` after the round-trip; (2) the Expo super-app + company-hub have no universal-link (iOS) / app-link (Android) configuration; (3) there is no canonical inventory of notification / email / SMS / share deep links, and URLs are string-concatenated at call sites rather than built from a typed helper. A prior audit also found 400+ historic notifications pointing at the legacy `/care?booking=` format — the one-time remediation is owned by V3-03 S4; this pass enforces typed builders going forward. This pass generalizes V3-01/V3-02's `return=` round-trip for first sign-in, adds the universal/app-link manifests, ships a typed deep-link builder in `@henryco/seo`, wires every publisher and email template to it, and surfaces dead deep links in the owner workspace. It is the foundation V3-11 (one-job-per-card) and V3-87 (mobile parity) build on.

## Mandatory scope

### S1 — Auth round-trip preservation
`packages/auth/src/server/deep-link-middleware.ts`: on a 401 from a protected route, redirect to the account chooser with the encoded target as `return` (URL built via `getAccountUrl()` — account is the SSO root). The chooser and sign-in routes read `return` and append it to every OAuth callback URL. After sign-in / sign-up / OAuth, the callback honors `return` only if it resolves to a same-origin URL within the Henry Onyx base domain (validated against `@henryco/config` `henryWebRoot()` / `henrySubdomain()`); otherwise it falls back to the role default. Open-redirect defense: reject any `return` not under the resolved base domain — never trust the literal host.

### S2 — Universal links (iOS) + app links (Android)
Configure `apps/super-app/app.json` and `apps/company-hub/app.json` with `associatedDomains` covering the base domain + each division subdomain the app should intercept (host strings resolved from the config domain map at build time, not hand-typed across files). Serve `apps/<app>/public/.well-known/apple-app-site-association` (no extension, JSON body, `Content-Type: application/json`) and `apps/<app>/public/.well-known/assetlinks.json` from each subdomain. Configure `expo-router` to handle incoming universal links, mapping web paths to mobile screens: `/care/bookings/<id>` → `module/care-booking/<id>`; `/marketplace/orders/<id>` → `module/marketplace-order/<id>`; `/jobs/applications/<id>` → `module/job-application/<id>`; one mapping per deep-link target type. App-not-installed → the OS opens the web URL (which serves the page or prompts install). App-installed-not-signed-in → the mobile auth flow preserves the target through its round-trip.

### S3 — Notification + email + SMS deep-link inventory
Catalog every deep link Henry Onyx emits: `customer_notifications.action_url`, `staff_notifications.action_url`, every Resend template in `@henryco/email`, and any SMS template (confirm the provider — Phase A did not). Validate each URL against a real route on a real app; update any pointing at legacy or 404 paths. Record the catalog at `docs/v3/deep-link-inventory.md` (one-time; future links use the typed builder).

### S4 — Typed deep-link builder
New module under `packages/seo/src/deeplinks/` (the SEO package already centralizes URL construction): `buildCareBookingLink({ bookingId })`, `buildMarketplaceOrderLink({ orderId })`, `buildJobsApplicationLink({ applicationId })`, and one builder per target type. Every builder produces a canonical absolute URL on the correct subdomain **via the `@henryco/config` domain helpers** (`henryDomain(division, path)`) — zero literal `henrycogroup.com` — plus the mobile-app-link variant where applicable. Wire all notification publishers (`@henryco/notifications`) and email templates (`@henryco/email`) to call these builders instead of string-concatenated URLs (grep `href="https://` and `action_url:` to find every site).

### S5 — Share surface
`packages/ui/src/share/ShareButton.tsx`: Web Share API where supported, copy-link fallback otherwise. The shared URL appends `?ref=share&from=<hashed-sharer-id>` where the sharer id is a non-reversible HMAC (server-known salt). On arrival, the receiving user sees the item with a subtle attribution badge (label via i18n, never a hardcoded name), and the sharer is credited in the existing `user_referrals` schema. Tampered share tokens 404 with telemetry.

### S6 — Email deep-link integrity
Every transactional email CTA points to an absolute URL on the correct division subdomain (built via S4), carries UTM params (`utm_source=henryco_email`, `utm_campaign=<purpose>`), and survives email-client URL rewriting (verify Resend tracking does not break the link).

### S7 — 404 detection + repair on deep-link arrival
On a 404 from a deep link, log the source (notification id, email purpose, share token). Owner-workspace tile shows "Top 10 dead deep links this week" with source attribution. A 404 from a notification URL pattern triggers an automated rewrite-suggestion against the inventory.

### S8 — Telemetry
Emit via `@henryco/observability`: `henry.deeplink.arrived` (source, target, outcome), `henry.deeplink.returned_after_auth`, `henry.deeplink.404` (source attribution), `henry.share.clicked`, `henry.share.attributed_install`.

## Out of scope
- New share-incentive program — V3-69.
- Cross-domain SSO mechanism change (preserve existing).
- App-store smart banners — V3-88.
- Branch.io or any deep-link SaaS — native mechanisms only.
- The one-time legacy `/care?booking=` notification rewrite — V3-03 S4.

## Dependencies
Depends on: **V3-02** (auth round-trip relies on the session + sensitive-action primitives), **V3-01** (indirectly, via V3-02). Blocks: **V3-11** (one-job-per-card enforces every card links to a real deep link), **V3-87** (mobile parity builds on the universal-link foundation).

## Inheritance
`@henryco/seo` (extend with deep-link builders) · `@henryco/auth` (extend with deep-link middleware) · `@henryco/notifications` + `@henryco/email` (wire builders) · `@henryco/config` domain helpers (`henryDomain` / `henryWebRoot` / `henrySubdomain` / `getAccountUrl`) for every URL · `@henryco/ui` for the share button · `user_referrals` (existing referral-fraud schema) · V3-03's backfill for historic `action_url` cleanup.

## Implementation requirements

### Files
`packages/seo/src/deeplinks/` (one builder per target type) · `packages/auth/src/server/deep-link-middleware.ts` · `packages/ui/src/share/ShareButton.tsx` · `apps/<app>/public/.well-known/apple-app-site-association` + `assetlinks.json` (10 web apps) · `apps/super-app/app.json` + `apps/company-hub/app.json` (`associatedDomains`) · `apps/super-app/src/routes/(deep-links)/…` + `apps/company-hub/src/routes/(deep-links)/…` (S2 handlers) · `apps/hub/app/owner/(command)/dashboard/deep-link-health-tile.tsx` · `docs/v3/deep-link-inventory.md`. Per-app: replace every string-concat URL in notification publishers + email templates with builder calls.

### Trust / safety / compliance
Open-redirect defense on `return=` is mandatory and tested. Share tokens are HMAC-signed; tampered tokens 404 with telemetry. Universal links require HTTPS (already true). App-site-association files are served without auth (public per Apple/Google spec). Sensitive references (KYC docs, etc.) use opaque tokens in deep links — never raw internal IDs.

### Mobile + desktop parity
Web: full middleware + builder usage. Expo: handles universal/app links per S2. Email + SMS links are device-agnostic — the URL itself routes to web or app via the universal-link manifest.

### i18n
Share button label + share-modal copy + the arrival attribution badge flow through `@henryco/i18n` under `surface:share`. Populate en-US; runtime DeepL fills the other 11 locales. No hardcoded user-facing text.

### Brand & design system
Any user-facing brand string ("Henry Onyx") + division labels in the share badge / owner tile come from `@henryco/config` — never hardcoded; legal contexts use "Henry Onyx Limited". The share button + owner tile use locked tokens (`--site-*` / `--accent`, Fraunces for display), light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed. Every URL via the `@henryco/config` domain helpers + the S4 builders — zero literal `henrycogroup.com`.

## Validation gates
1. Standard CI: `pnpm lint` / `pnpm typecheck` / tests / `pnpm ci:validate` build / `pnpm i18n:check` / `pnpm a11y` / security-headers gate. 2. AASA + `assetlinks.json` served correctly per subdomain — `curl -i` the `.well-known/apple-app-site-association` on each division host (host resolved via the config domain map) and verify `Content-Type: application/json`, no redirect, valid JSON. 3. Universal-link smoke on a physical iOS device: email yourself a deep link → it opens the app (or web fallback). 4. App-link smoke on Android. 5. Auth round-trip smoke: open unauth, click a protected deep link, sign in, confirm landing on the exact target (not the role default). 6. Inventory review: every entry validated against a live route. 7. Real-browser light + dark + mobile + desktop on the share button + owner tile.

## Deployment gate
All gates green; AASA / `assetlinks.json` verified on each domain post-deploy; squash-merge to `main`; 72-hour soak (longer because mobile caches the app-site-association files and they take time to refresh) with no dead-link spike.

## Final report contract
`.codex-temp/v3-04-deep-links/report.md` with the standard 9 sections — exec summary · files changed · migration/RLS/env (none — the 404-attribution log uses the existing observability event sink; confirm) · validation evidence · smoke · live verification (72-h soak) · telemetry baseline (5 events) · deferred items · pass-closure assertion — plus the full deep-link inventory and per-mobile-OS smoke evidence.

## Deferred / residual (post-ship, this pass is merged)
- SMS-channel deep links once the SMS provider is confirmed (Phase A left it open).
- App-store smart banners → V3-88; share-incentive program → V3-69.

## Self-verification
- [ ] S1 auth round-trip preserved across sign-in, sign-up, and OAuth; open-redirect rejected for any non-base-domain `return`.
- [ ] S2 universal links + app links configured for both Expo apps + all 10 web apps; AASA/assetlinks served with correct content-type.
- [ ] S3 inventory complete at `docs/v3/deep-link-inventory.md`; every entry validated against a live route.
- [ ] S4 typed builders cover every notification + email URL; all built via `@henryco/config` domain helpers — zero literal domains.
- [ ] S5 share button wired with HMAC attribution; tampered tokens 404 with telemetry.
- [ ] S6 every transactional email CTA is absolute, UTM-tagged, and survives client URL rewriting.
- [ ] S7 404 telemetry surfaces the top dead links in the owner workspace with source attribution.
- [ ] S8 the 5 telemetry events emit.
- [ ] All new strings under `surface:share`; brand sourced from `@henryco/config`.
- [ ] Report written; hand-off named: V3-11 (one-job-per-card).
