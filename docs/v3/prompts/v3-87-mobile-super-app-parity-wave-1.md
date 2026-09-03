# V3-87 — Global/Mobile: Mobile Super-App Parity, Wave 1

**Pass ID:** V3-87  ·  **Phase:** I (Platform/API + Global/Mobile + Observability + Closure)  ·  **Pillar:** P12 (Foundation & Trust)
**Dependencies:** V3-86 (mobile architecture decision), V3-03 (notification/message states), V3-04 (deep links)  ·  **Effort:** XL  ·  **Parallel-safe:** N
**Owner gate:** none  ·  **Risk class:** —

---

## Role
You are the V3 Mobile Parity engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass takes the Expo super-app from skeleton to **wave-1 parity** with the web account experience on the eight flows that carry the most user value — notifications, messages, bookings, orders, wallet, auth/reauth, account-check assist, and maps — each wired through the existing platform-contracts/adapters layer and the shared `@henryco/*` packages, never through a parallel mobile reimplementation. The line it must not cross: it ships through the **contracts/adapters abstraction** (no Supabase/Expo call leaks into a screen), keeps every server-only operation server-only (no service-role key in the client bundle), and treats the payment surface as **deep-link-to-web** for digital-goods compliance (native IAP/wallet wiring is V3-23, store submission is V3-88). **Confirm V3-86 ratified the stack (Expo) before starting; build on whatever D8 settled.**

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/87-mobile-super-app-parity-wave-1` |
| Deploy | EAS (mobile builds) · Vercel (web it deep-links to) |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

The super-app is a real, well-architected skeleton — this pass fills it in, it does not start it:

- **`apps/super-app`** ships Expo Router tabs `app/(tabs)/` = `index`, `account`, `services`, `directory` (no notifications/messages/bookings/orders/wallet routes yet — that is exactly the wave-1 gap), `app/module/[slug].tsx`, `app/legal/*`.
- The **platform layer** is the asset to build on: `src/platform/contracts/` defines `auth.ts`, `database.ts`, `notifications.ts`, `payments.ts` (`PaymentsAdapter.startCheckout(quote): Promise<PaymentResult>` — feature-flagged, mock when disabled), `media.ts`, `analytics.ts`, `monitoring.ts`; adapters under `src/platform/adapters/` implement them (`supabase/auth.supabase.ts`, `supabase/database.supabase.ts`, `expo/notifications.expo.ts`, `sentry.monitoring.ts`, `cloudinary.media.ts`, `payments.deferred.ts` + a full `mock/*` set). Env-selected configs live in `src/platform/config/{local,staging,production}.config.ts`; providers compose via `src/providers/{AppProviders,PlatformProvider}.tsx`.
- **`apps/super-app/eas.json`** has `preview`/`staging`/`production` build profiles (`EXPO_PUBLIC_HENRYCO_ENV` set per profile) but `submit.production` is empty (V3-88's gap).
- Web shared packages this pass consumes on mobile: `@henryco/messaging-thread` (support + business message UI), `@henryco/chat-composer`, `@henryco/intelligence` (account-check assist — V3-31), `@henryco/notifications` + `@henryco/notifications-ui`, `@henryco/config` (domain/URL helpers), `@henryco/i18n`, `@henryco/payment-router` (the provider-agnostic intent route from V3-13/V3-85).
- **V3-03** lands the real notification/message delivery-state machine (`is_read`/`read_at`, sent/delivered/seen) the mobile notifications + messages tabs render. **V3-04** lands universal-links/deep-link auth round-trip so a notification tap lands on the exact screen with the session preserved.

**The gap this pass closes:** the skeleton has no notifications/messages/bookings/orders/wallet surfaces and no push, maps, or reauth flow wired. This pass builds those eight flows on the existing contracts so a mobile user can do the most common things without dropping to the web.

## Mandatory scope

Wave-1 flows, in user-value order. Each is built as an Expo Router screen consuming a platform contract + a shared `@henryco/*` package — never a hand-rolled Supabase call in a screen.

### S1 — Notifications (realtime + push)
- New tab/screen `app/(tabs)/notifications.tsx` rendering the V3-03 delivery-state machine (`sent`/`delivered`/`seen`, `is_read`/`read_at`) via `@henryco/notifications-ui` against `@henryco/notifications`.
- Push via **OneSignal** through the `notifications` contract (`EXPO_PUBLIC_ONESIGNAL_APP_ID`); a push tap deep-links (V3-04) to the exact target screen with the session preserved. Mark-as-read writes flow through the same state machine as web (no mobile-only read state).

### S2 — Messages (support + business threads)
- New screen `app/(tabs)/messages.tsx` (or `app/messages/[threadId].tsx`) rendering `@henryco/messaging-thread` + `@henryco/chat-composer` on Expo. Support threads and business messages use the identical shared thread component the web uses — same read/delivery semantics (V3-03), same RLS-scoped reads via the `database` contract.

### S3 — Bookings (view / book / cancel)
- `app/bookings/*` screens: list, detail, book, cancel. Reads go through the `database` contract; writes go through the V3-51 booking API when it exists, else the shared `@henryco/data` layer with the same RLS the web obeys. Cancellation honours the per-service cancellation policy.

### S4 — Orders (view / track)
- `app/orders/*`: marketplace + logistics order list + detail + live tracking. Tracking renders on a map (S8). Reads through the `database`/shared-API layer; no client-bundled secrets.

### S5 — Wallet (balance / transactions / top-up)
- `app/wallet/*`: balance + transaction history (read-only, RLS-scoped). **Top-up deep-links to the web checkout** (`@henryco/config` `getAccountUrl()` → the V3-85 method picker on web) rather than charging in-app — digital-goods/native-payment compliance is deliberately deferred to V3-23. The `payments.deferred.ts` adapter stays the registered payments adapter until V3-23 activates a native one; wallet balance display is read-only money truth, never an optimistic local figure.

### S6 — Auth + reauth
- Sign-in + the **sensitive-action reauth modal** mirroring V3-02 semantics on mobile: a sensitive action (wallet top-up entry, identity, destructive) requires a fresh reauth. Use the `auth` contract (`supabase/auth.supabase.ts`); biometric reauth (FaceID/Fingerprint) where the device supports it, with a password/OTP fallback. Logout clears the mobile session completely (token + secure store), mirroring `logoutEverywhere` web semantics.

### S7 — Account-check assist (V3-31)
- A mobile chat surface using `@henryco/intelligence` for the **account-check assist** (V3-31): a FREE, RLS-respecting helper that answers "what's in my account" questions and never reveals secrets or another user's data. Provider identity is never named in UI (it is "Henry Onyx Intelligence" only). Unauthenticated users get zero personal-task usage (the router gate from V3-33 applies identically on mobile).

### S8 — Maps everywhere relevant
- **Mapbox** (`EXPO_PUBLIC_MAPBOX_TOKEN`) via the `media`/maps integration for provider location and delivery tracking (S4). Token from env only.

## Out of scope
- Store submission, metadata, EAS submit config, privacy manifests — **V3-88**.
- **Native** in-app payments / IAP / wallet charging — **V3-23** (wave 1 deep-links to web checkout).
- Wave-2+ flows (full division parity, studio project suite mobile, etc.) — future mobile waves.
- Gaming-arena mobile — gated (D2), separate pass.
- The architecture decision itself — **V3-86** (this pass assumes the ratified stack).

## Dependencies
- **Requires:** V3-86 (ratified stack), V3-03 (notification/message delivery-state machine + `is_read`/`read_at`), V3-04 (universal links + deep-link auth round-trip).
- **Owner gate:** none.
- **Blocks:** V3-88 (store submission builds on the wave-1 app + its parity surfaces); informs V3-23 (native payments replace the S5 deep-link).

## Inheritance
- `apps/super-app` platform layer — `src/platform/contracts/*` + `src/platform/adapters/*` + `src/platform/config/*` + `src/providers/*`. Every flow goes through a contract.
- `@henryco/messaging-thread`, `@henryco/chat-composer`, `@henryco/notifications`, `@henryco/notifications-ui`, `@henryco/intelligence`, `@henryco/data`, `@henryco/config`, `@henryco/i18n`, `@henryco/payment-router`.
- V3-02 sensitive-action semantics (reauth) + `logoutEverywhere` (logout completeness) ported to mobile.
- V3-13/V3-85 provider-agnostic intent route (deep-linked to from S5).

## Implementation requirements
### Files
- New Expo Router screens: `app/(tabs)/notifications.tsx`, `app/(tabs)/messages.tsx` (+ `app/messages/[threadId].tsx`), `app/bookings/*`, `app/orders/*`, `app/wallet/*`, the auth/reauth screens + reauth modal, the assist screen.
- Adapter wiring where a contract needs a real implementation for wave 1 (e.g. OneSignal push in `expo/notifications.expo.ts`, Mapbox maps).
- **Fix `app.json`**: replace the stale `"name": "Henry & Co."` with the Henry Onyx brand sourced/aligned to `company.ts`, and route the deep-link host through env (no hardcoded `staging.henrycogroup.com` literal — derive from `@henryco/config`/`EXPO_PUBLIC_*`). Leave the EAS project-id + store-submission config to V3-88.
- `apps/super-app/docs/wave-1-parity.md` — the per-flow contract/adapter map.
### Trust / safety / compliance
- **No service-role key client-bundled.** Server-only operations stay server-only; the mobile client uses anon key + RLS only (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
- Biometric reauth (FaceID/Fingerprint) for sensitive actions where available, with a non-biometric fallback. Wallet balance is read-only RLS-scoped money truth.
- The assist (S7) respects RLS, never reveals secrets, never names the AI provider, and is gated to authenticated users (V3-33). All eight flows audit sensitive mutations via the shared audit log where the contract reaches a mutating server route.
- No hardcoded keys, URLs, division names, or sender identities — everything via `EXPO_PUBLIC_*` env or `@henryco/config` helpers (grep-enforced).
### Mobile + desktop parity
- **This pass IS the parity.** The bar is behavioural equivalence with web on the eight flows: same read/delivery state, same RLS, same money truth, same logout completeness, same i18n. Where web has a behaviour (e.g. mark-as-read state machine), mobile uses the same shared logic, not a re-implementation.
### i18n
- All copy flows through `@henryco/i18n` (12 locales; Pattern A typed keys + Pattern B runtime DeepL). Reuse the existing namespaces the shared components already key into (`surface:notifications`, `surface:messages`, `surface:payments`, `surface:account`); no mobile-only hardcoded strings. RTL (`ar`) respected.
### Brand & design system
- Brand strings resolve through `@henryco/config` (`company.ts` — "Henry Onyx" user-facing); the `app.json` name is corrected to the Henry Onyx brand. Any URL the app deep-links to resolves through `@henryco/config` helpers (`getAccountUrl()` / `henryDomain()`), never a literal domain. Mobile screens follow the super-app design system (its `src/design-system/`), light + dark, with the locked accent tokens per division.

## Validation gates
1. CI: `pnpm --filter super-app test` (+ company-hub if touched), type-check, lint — `Lint, typecheck, test, build` green.
2. **Device smoke** on a real iOS device + a real Android device — 8 flow-level checks (S1–S8): notification push received + tap deep-links to the exact screen with session preserved; message thread sends + shows delivery state; booking book/cancel; order track on map; wallet balance + top-up deep-link to web; sign-in + biometric reauth; assist answers an account question without leaking; map renders with the env token.
3. **OneSignal push** received on a registered device; **Mapbox** renders with the env token; **Sentry** receives an event from the build; **Cloudinary** image loads.
4. **No-secrets grep**: no service-role key, no hardcoded URL/key/division identifier in the client bundle.
5. **RLS parity**: a mobile read returns exactly what the web read returns for the same user; cross-user reads are denied.
6. **i18n strict gate** green; RTL spot-check on `ar`.

## Deployment gate
All gates green; branch `v3/87-mobile-super-app-parity-wave-1` off `origin/main` → PR → squash-merge (no force-push). A **TestFlight + Google Play internal-track** build is produced (EAS preview/staging profile) and runs a **14-day soak with internal-team users** before V3-88 submits to the public stores. No live native payment ships (wallet top-up deep-links to web).

## Final report contract
`.codex-temp/v3-87-mobile-super-app-parity-wave-1/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion) + the per-flow contract/adapter map + the device-smoke evidence (iOS + Android).

## Self-verification
- [ ] V3-86 stack confirmed; all eight flows built on the platform contracts/adapters (no Supabase/Expo call leaked into a screen).
- [ ] Notifications (realtime + OneSignal push, V3-03 state machine, V3-04 deep-link); messages (`@henryco/messaging-thread`); bookings; orders + map; wallet (read-only + deep-link top-up).
- [ ] Auth + V3-02 reauth modal (biometric + fallback); logout clears session fully.
- [ ] Account-check assist (V3-31) RLS-respecting, secret-safe, provider-name-free, auth-gated (V3-33).
- [ ] Mapbox + OneSignal + Sentry + Cloudinary all wired via `EXPO_PUBLIC_*` env; no client-bundled service-role key.
- [ ] `app.json` brand corrected to Henry Onyx; deep-link host de-hardcoded via env/`@henryco/config`.
- [ ] ZERO hardcoded keys/URLs/division identifiers (grep-enforced); RLS parity with web verified.
- [ ] i18n via `@henryco/i18n` (no mobile-only strings); RTL respected.
- [ ] iOS + Android device smoke verified; internal-team 14-day soak (TestFlight + Play internal track).
- [ ] Report written. Hand-off: V3-88 (store submission), V3-23 (native payments replace the wallet deep-link).
