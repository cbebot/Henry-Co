# V3-87 — Mobile Super-App Parity Wave 1

**Pass ID:** V3-87 | **Phase:** I | **Pillar:** P12
**Deps:** V3-86, V3-03, V3-04 | **Effort:** XL | **Parallel:** NO | **Owner gate:** none | **Risk:** —

## Role
V3 Mobile Parity engineer. Execute, then stop.

## Project
Standard.

## Audit summary
super-app + company-hub Expo apps have skeleton; this pass brings web-mobile parity to the most-used flows.

## Mandatory scope

Wave-1 features (in order of user value):

1. **Notifications**: Realtime + push (uses OneSignal mobile SDK per INTEGRATION-KEYS).
2. **Messages**: support thread + business message in shared package (@henryco/messaging-thread on Expo).
3. **Bookings**: view + book + cancel (uses V3-51 booking API or direct DB via shared @henryco/data layer).
4. **Orders**: view + track (marketplace + logistics via shared APIs).
5. **Wallet**: balance + transactions + top-up (deep-link to web checkout per V3-23).
6. **Auth**: sign-in + reauth modal per V3-02.
7. **Account check assist** (V3-31) — mobile chat surface using @henryco/intelligence-chat.
8. **Maps everywhere relevant**: provider location, delivery tracking — Mapbox SDK for React Native (or Flutter equivalent per V3-86).

## Integration keys (per INTEGRATION-KEYS.md)

Consumed:
- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` — auth + data.
- `EXPO_PUBLIC_HENRYCO_ENV` — env selector (local/staging/production).
- `EXPO_PUBLIC_LIVE_SERVICES_APPROVED` — gate for live providers (per existing arch).
- `EXPO_PUBLIC_MAPBOX_TOKEN` — maps.
- `EXPO_PUBLIC_ONESIGNAL_APP_ID` — push.
- `EXPO_PUBLIC_SENTRY_DSN` — error tracking.
- `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` — images.

Server-only operations remain server-only (no client-bundled service-role keys).

NO hardcoded URLs / division names / sender identities; everything via env or @henryco/config helpers.

## Out of scope
- Store submission (V3-88).
- Full feature parity (this is wave 1; future waves extend).
- Gaming arena mobile (gated separately).

## Dependencies
V3-86, V3-03, V3-04. Blocks V3-88.

## Inheritance
super-app + company-hub existing architecture; web shared packages.

## Trust / safety / compliance
- Biometric auth on iOS (FaceID) + Android (Fingerprint) for sensitive actions where available.
- IAP receipt verification for digital goods.

## Mobile + desktop parity
This pass IS the parity.

## i18n
12 locales via @henryco/i18n.

## Validation gates
1. CI: `pnpm super-app:test`, `pnpm company-hub:test`, type-check.
2. **Smoke** on iOS device + Android device:
   - 8 flow-level smoke checks per the wave-1 features above.
3. **Mapbox** renders maps with token from env.
4. **OneSignal push** received on registered device.
5. **No hardcoded keys / division identifiers** (grep enforced).

## Deployment gate
- TestFlight + Google internal track build.
- 14-day soak with internal-team users.

## Final report contract
Standard.

## Self-verification
- [ ] 8 wave-1 features shipped.
- [ ] Mapbox + OneSignal + Sentry + Cloudinary all wired via env.
- [ ] ZERO hardcoded keys / URLs.
- [ ] iOS + Android smoke verified.
- [ ] Internal-team 14-day soak.
- [ ] Report written.
