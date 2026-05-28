# V3-04 — Foundation: Deep Links

**Pass ID:** V3-04
**Phase:** B (FOUNDATION LOCK)
**Pillar:** P3 (Personalisation), P12 (Global)
**Dependencies:** V3-02 (auth reliability)
**Effort:** M (1–2 weeks)
**Parallel-safe:** YES (with other Wave 3 passes)
**Owner gate:** None
**Risk class:** None

---

## Role

You are the V3 Foundation engineer for HenryCo. You execute exactly this one pass, then stop and report.

This pass closes the **deep links** sub-bar of FOUNDATION LOCK. Every notification, email, SMS, and share link must open the exact workflow step — not a generic landing. Auth-gated deep links must survive the auth round-trip. Mobile deep links must open the mobile app via universal/app links.

---

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/04-deep-links` |
| Deploy | Vercel + Expo |
| OS context | Windows + bash; pnpm 9.15.5; Node 24.x |

---

## Audit summary (lifted from AUDIT-BASELINE.md §3.4)

> ### 3.4 Deep links
> - **Solid:** per-PRODUCT-GAP-LEDGER, subscriptions + invoices + care bookings now deep-link into dedicated detail routes
> - **Partial:** legacy `/care?booking=` links replaced repo-side but 400+ historic notifications still reference old format
> - **Gap:** universal links / app links on Expo super-app + company-hub
> - **Gap:** auth-gated deep link round-trip preservation (does `/account/orders/123` survive a sign-in detour and land back at `/orders/123`?)
> - **Gap:** SMS/share deep links inventory

---

## Mandatory scope

### S1 — Auth round-trip preservation

When an unauthenticated user clicks a deep link to an auth-gated route:
- The auth flow captures the target URL in the `return` query param.
- After sign-in (or sign-up), the user lands at the target URL — NOT the role default.
- This builds on V3-01's `/auth/reauth?return=` mechanism but generalizes for first-sign-in too.

Implementation:
- New middleware helper `@henryco/auth/server/deep-link-middleware.ts` — on 401 from a protected route, redirect to `/auth/choose?return=<encoded-target>` (account app is SSO root).
- The auth chooser + sign-in routes read `return` and append to all OAuth callback URLs.
- After sign-in, the callback respects `return` if it's a same-origin URL on a HenryCo domain; otherwise falls back to role default.
- Open-redirect defense: reject any `return` URL that's not within `*.henrycogroup.com`.

### S2 — Universal links (iOS) + App links (Android) for Expo apps

Configure `apps/super-app/app.json` and `apps/company-hub/app.json` with:
- `associatedDomains: ["applinks:henrycogroup.com", "applinks:account.henrycogroup.com", ...]`
- Each division domain that the app should intercept.

Web side:
- `apps/<app>/public/.well-known/apple-app-site-association` (no extension; JSON content) — declares which paths the iOS app handles.
- `apps/<app>/public/.well-known/assetlinks.json` (JSON) — Android equivalent.

Both files are served with `Content-Type: application/json` from each subdomain.

Expo router:
- Configure `expo-router` to handle incoming universal links per the manifests.
- Map web paths to mobile screens:
  - `/care/bookings/<id>` → `module/care-booking/<id>`
  - `/marketplace/orders/<id>` → `module/marketplace-order/<id>`
  - `/jobs/applications/<id>` → `module/job-application/<id>`
  - etc.

If the user opens a deep link with the app NOT installed:
- iOS: Safari opens the web URL (which gracefully serves the page or prompts to install).
- Android: same.

If the user opens with app installed but not signed in:
- Mobile auth flow runs; preserves the deep link target through the round-trip per Expo platform layer.

### S3 — Notification + email + SMS deep-link inventory

Catalog every deep link sent from HenryCo:
- Customer notifications (table `customer_notifications.action_url`)
- Staff notifications (`staff_notifications.action_url`)
- Resend email templates in `@henryco/email`
- SMS templates (if any; verify in Twilio or similar; Phase A audit didn't confirm SMS provider)

For each entry: validate the URL points to a real route on a real app. Update entries pointing to legacy URLs or 404s.

Document the inventory at `docs/v3/deep-link-inventory.md`. This is a one-time catalog; future deep links use a typed builder.

### S4 — Typed deep-link builder

New module `@henryco/seo/deeplinks` (extends existing SEO package since it already centralizes URL building):
- `buildCareBookingLink({ bookingId })` → `https://care.henrycogroup.com/bookings/<id>`
- `buildMarketplaceOrderLink({ orderId })` → ...
- `buildJobsApplicationLink({ applicationId })` → ...
- One builder per deep-link target type.
- Every builder produces canonical absolute URLs (with the correct subdomain).
- Every builder also produces a mobile-app-link variant where applicable.

Wire all notification publishers (`@henryco/notifications`) + email templates to use these builders instead of string-concatenated URLs.

### S5 — Share link surface

Every shareable surface (a property listing, a marketplace product, a jobs role, a learn course) has a "Share" button that:
- Uses the Web Share API on supported browsers.
- Falls back to a copy-link UI on unsupported.
- The shared URL includes `?ref=share&from=<sharer-user-id-hashed>` for attribution.
- Hashed sharer ID is non-reversible (HMAC of user-id with a server-known salt).

Share-link arrival behavior:
- The receiving user sees the shared item with a subtle attribution badge ("Shared by another HenryCo user").
- Attribution credits the sharer in `user_referrals` (existing referral-fraud-hardening schema).

### S6 — Email deep-link integrity

Every transactional email's CTA button:
- Points to an absolute URL on the correct division subdomain.
- Includes UTM params for analytics (`utm_source=henryco_email`, `utm_campaign=<purpose>`).
- Survives email-client URL rewriting (some clients rewrite URLs through trackers — verify Resend's tracking doesn't break the link).

### S7 — 404 detection + repair on deep link arrival

When a user lands on a 404 from a deep link (notification, email, share):
- Log the event with the source (notification ID, email purpose, share token).
- Owner-workspace tile shows "Top 10 dead deep links this week" with source attribution.
- If a 404 comes from a notification URL pattern, run automated rewrite suggestion against the deep-link inventory.

### S8 — Telemetry

Events:
- `henry.deeplink.arrived` (source, target, outcome)
- `henry.deeplink.returned_after_auth` (the round-trip success path)
- `henry.deeplink.404` (with source attribution)
- `henry.share.clicked`
- `henry.share.attributed_install` (when a share leads to a sign-up)

---

## Out of scope

- New share-incentive program (V3-69 partner economy may add this).
- Cross-domain SSO mechanism changes (preserve existing).
- Mobile app store smart banners (V3-88).
- Branch.io or similar deep-link SaaS — use native iOS/Android mechanisms only.

---

## Dependencies

- V3-02 (auth reliability) — auth round-trip relies on session primitives.
- V3-01 (session persistence) — indirectly via V3-02.

Blocks:
- V3-11 (one-job-per-card) — the audit there enforces that every card links to a real deep-link.
- V3-87 (mobile parity) — universal links foundation is here.

---

## Inheritance

- `@henryco/seo` — extend with deep-link builders.
- `@henryco/auth` — extend with deep-link middleware.
- `@henryco/notifications` — wire builders.
- `@henryco/email` — wire builders.
- Existing `customer_notifications.action_url` — backfill via V3-03 script.

---

## Implementation requirements

### Files

- `packages/seo/src/deeplinks/` (new directory) — one builder per target type
- `packages/auth/server/deep-link-middleware.ts` (new)
- `packages/ui/src/share/ShareButton.tsx` (new — Web Share API wrapper)
- `apps/<app>/public/.well-known/apple-app-site-association` (10 web apps)
- `apps/<app>/public/.well-known/assetlinks.json` (10 web apps)
- `apps/super-app/app.json` — add `associatedDomains`
- `apps/company-hub/app.json` — add `associatedDomains`
- `apps/super-app/src/routes/(deep-links)/...` — route handlers per S2
- `apps/company-hub/src/routes/(deep-links)/...` — same
- `apps/hub/app/owner/(command)/dashboard/deep-link-health-tile.tsx` — new tile per S7
- `docs/v3/deep-link-inventory.md` — full catalog

### Per-app wiring

Every notification publisher + email template — replace string-concat URLs with builder calls. Grep `href="https://` and `action_url:` to find sites.

### Migration

None. The 404-attribution log uses the existing observability event sink.

If owner approves PRODUCT-GAP-LEDGER 2026-04-09 legacy /care?booking= rewrite (per V3-03 S4), that backfill is in V3-03; this pass just enforces typed builders going forward.

---

## Trust / safety / compliance

- Open-redirect defense on `return=` param is mandatory.
- Share link tokens are HMAC-signed; tampered tokens 404 (with telemetry).
- Universal links require HTTPS — already true.
- App Site Association files served without auth — they're public per Apple/Google spec.
- ANTI-CLONE: deep-link URLs preserve information without exposing internal IDs (use opaque tokens for sensitive references like KYC docs).

## Mobile + desktop parity

- Web: full deep-link middleware + builder usage.
- Expo: handles universal/app links per S2.
- Email + SMS deep links are device-agnostic (the URL itself routes to web or app via universal link).

## i18n

- Share button label + share modal copy via `@henryco/i18n` namespace `surface:share`.

---

## Validation gates

1. Standard CI gates.
2. AASA + assetlinks.json served correctly:
   - `curl -i https://account.henrycogroup.com/.well-known/apple-app-site-association`
   - Verify Content-Type, no redirects, valid JSON.
3. Universal link smoke on iOS device: send yourself an email with a deep link; verify it opens the app (or web fallback).
4. App link smoke on Android.
5. Auth round-trip smoke: open unauth, click protected deep link, sign in, confirm landing on target.
6. Deep-link inventory review: every entry validated against live routes.

## Deployment gate

- All gates pass.
- AASA/assetlinks JSON verified on each domain post-deploy.
- 72-hour soak (longer because mobile cache for app site association files takes time to refresh).

## Final report contract

`.codex-temp/v3-04-deep-links/report.md` with the standard 9 sections + the full deep-link inventory + per-mobile-OS smoke evidence.

---

## Self-verification

- [ ] Typed deep-link builders cover every notification + email URL.
- [ ] Auth round-trip preserved across sign-in, sign-up, and OAuth.
- [ ] Universal links + app links configured for both Expo apps + 10 web apps.
- [ ] Share button wired with attribution.
- [ ] 404 telemetry surfaces dead links in owner workspace.
- [ ] Inventory document complete + reviewed.
- [ ] Report written. Hand-off named: V3-11 (one-job-per-card).
