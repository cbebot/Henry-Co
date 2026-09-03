# V3-88 — Global/Mobile: Mobile Store Submission

**Pass ID:** V3-88  ·  **Phase:** I (Platform/API + Global/Mobile + Observability + Closure)  ·  **Pillar:** P12 (Foundation & Trust)
**Dependencies:** V3-87 (mobile super-app parity wave 1), V3-23 (native-app payment compliance)  ·  **Effort:** XL  ·  **Parallel-safe:** N
**Owner gate:** none (L9 owner action: developer accounts under the legal entity)  ·  **Risk class:** Compliance

---

## Role
You are the V3 Mobile Submission engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass takes the wave-1 super-app from internal-track build to **App Store + Google Play public submission**: production-correct app config, complete localized store metadata, accurate privacy disclosures, the submission CI pipeline, reviewer test materials, and the owner-gated go-live. The line it must not cross: it ships **no new product feature** — it packages, discloses, and submits what V3-87 built and V3-23 made compliant, and it **cannot ship a store build that lies** (privacy manifest, data-collection disclosure, IAP/payment policy, and brand identity must all be exactly true). Store release is **owner-approved**, twice: once to submit, once to release after review.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/88-mobile-store-submission` |
| Deploy | EAS Build + EAS Submit → App Store Connect + Google Play |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

The build pipeline is partly scaffolded and the app config carries known submission blockers that this pass must close:

- **`apps/super-app/eas.json`** has `build.preview` / `build.staging` / `build.production` profiles (channels + `EXPO_PUBLIC_*` env per profile) but **`submit.production` is an empty object `{}`** — no App Store Connect / Google Play submit config exists yet. That is the central gap.
- **`apps/super-app/app.json`** carries submission blockers that must be corrected before any store build: `"name": "Henry & Co."` (**stale brand — must be the Henry Onyx user-facing brand**, sourced/aligned to `company.ts`; V3-87 begins this fix, V3-88 must verify it landed for the production build), staging bundle identifiers (`com.henryco.superapp.staging` for both iOS `bundleIdentifier` and Android `package`) and a hardcoded `staging.henrycogroup.com` deep-link host in `ios.associatedDomains` + `android.intentFilters` (production must use the production host via env/`@henryco/config`), `extra.eas.projectId: "replace-with-staging-eas-project-id"` (**placeholder — must be the real production EAS project id**), and `expo-notifications` already in `plugins`.
- **V3-87** delivers the wave-1 parity surfaces (notifications, messages, bookings, orders, wallet, auth/reauth, assist, maps) on the ratified Expo stack, with OneSignal push, Mapbox, Sentry, and Cloudinary wired via `EXPO_PUBLIC_*` env, and an internal-track build that has soaked 14 days.
- **V3-23** makes native-app payments store-policy-compliant (Apple Pay/web routing for digital vs physical goods) — its outcome dictates the IAP metadata + the reviewer payment-flow notes here.

**The gap this pass closes:** there is no submit pipeline, no store metadata, no privacy disclosure, no reviewer materials, and the production app config is still staging-branded. This pass produces a submittable, honest, owner-approved store release on both platforms.

## Mandatory scope

### S1 — Production app config corrected (pre-submission blockers)
- Verify/finish the **brand fix**: `app.json` `name` is the Henry Onyx user-facing brand (no `Henry & Co.`), consistent with `company.ts`.
- Set **production bundle identifiers** (distinct from the `.staging` ids) for iOS `bundleIdentifier` + Android `package`, and the production **deep-link host** in `associatedDomains`/`intentFilters` resolved from the production domain (via env/`@henryco/config`, not a hardcoded literal).
- Set the **real production `extra.eas.projectId`** (no placeholder).
- iOS `buildNumber` / Android `versionCode` bumped; `version` is the release version.

### S2 — App Store Connect metadata
- App icon (1024×1024), screenshots per required device size, app name + subtitle + description + keywords (localized per the D10-committed markets, via `@henryco/i18n` source copy), promotional text, support URL (`@henryco/config` `henryWebRoot('/support')` — not a literal), marketing URL, privacy-policy URL (`henryWebRoot('/privacy')`), and **in-app-purchase metadata** if and only if V3-23 ships IAP (digital goods). Age rating questionnaire answered truthfully (note: if gaming V3-65/66 ever ships, the rating + per-region content rules change — out of scope here, flagged).

### S3 — Google Play metadata
- Adaptive icon, feature graphic, screenshots, short + full description (localized per committed markets), category, contact details, privacy-policy URL, and the **Data safety** form filled accurately to match the actual data the app collects (Supabase auth, Sentry diagnostics, OneSignal push token, Cloudinary uploads, Mapbox location when tracking). Content rating questionnaire answered truthfully.

### S4 — Privacy disclosures (must be exactly true)
- **iOS privacy manifest** (`PrivacyInfo.xcprivacy`) + App Store "App Privacy" data-collection disclosure accurately reflecting every SDK that collects data (Sentry, OneSignal, Mapbox, Cloudinary, Supabase). Required-reason API declarations present.
- Google Play **Data safety** section consistent with the iOS disclosure (same truth, two forms).
- The privacy-policy + support URLs resolve through `@henryco/config` helpers; the legal entity referenced in store listings + policy is **"Henry Onyx Limited"** from `company.ts`.

### S5 — Reviewer materials
- A **reviewer test account** (non-production-data, RLS-scoped) that exercises auth, a booking, an order, the assist, and the payment/wallet flow.
- A **demo video** of the core flows.
- **Reviewer notes** explaining the KYC posture and the payment flow precisely — especially the V3-23 digital-vs-physical-goods routing (why some payments use Apple Pay/IAP and others route to web), so the review does not reject on a payment-policy misunderstanding.

### S6 — Submission CI (EAS Build + EAS Submit)
- Fill `eas.json` `submit.production` for both platforms.
- EAS Build production profile produces signed iOS + Android artifacts; EAS Submit auto-submits to **TestFlight + Play internal track** first, then promotes on owner approval.
- Secrets are EAS-managed, never committed: App Store Connect API key (`ASC_API_KEY_ID`, `ASC_ISSUER_ID`, `ASC_PRIVATE_KEY`) and Google Play service account (`GPLAY_SERVICE_ACCOUNT_JSON`), plus `EXPO_TOKEN` for CI. **L9 owner action:** the Apple Developer + Google Play developer accounts are registered under **Henry Onyx Limited** (the legal entity) — verify before submission.

### S7 — Pre-submission checklist (gate)
- All required env vars present in **production** scope (not just staging).
- OneSignal push tested on real store-channel builds; Mapbox tokens are production-tier; Sentry receives events from store builds; Cloudinary loads on production config.
- Privacy manifests (iOS 17+ data-collection disclosure) accurate and consistent with the Play Data-safety form.
- The production deep-link host verifies (universal links open the app, not Safari/Chrome).

### S8 — Telemetry
Three pure, exhaustively-mapped events appended to the `henry.<domain>.<noun>.<verb>` taxonomy in `@henryco/observability`:
- `henry.mobile.app.submitted` — submission sent to a store.
- `henry.mobile.app.approved` — store review approved.
- `henry.mobile.app.released` — public release went live.

## Out of scope
- Web app (already deployed via Vercel).
- Wave-2 mobile features — future mobile passes.
- The native payment **implementation** — **V3-23** (this pass only discloses + describes it for review).
- Building any wave-1 feature — **V3-87** (this pass packages it).
- Gaming-arena store posture / per-region gaming content rules — gated (D2), flagged not handled.

## Dependencies
- **Requires:** V3-87 (the wave-1 app to submit) + V3-23 (native-payment compliance — dictates IAP metadata + reviewer payment notes).
- **Owner gate:** none as a decision; but **L9 owner action** (developer accounts under Henry Onyx Limited) must be complete, and the owner approves submission + release.
- **Blocks:** nothing downstream in V3 directly; the released apps are re-checked in V3-94 (closure integration test) + V3-95 (launch readiness).

## Inheritance
- The V3-87 wave-1 build + `apps/super-app` `app.json` / `eas.json` configs.
- `@henryco/config` (`company.ts` for brand + legal entity, `henryWebRoot()`/`henryDomain()` for store/policy URLs), `@henryco/i18n` (localized store copy source), `@henryco/observability` (submission telemetry).
- V3-23 native-payment compliance posture (the reviewer payment-flow narrative).

## Implementation requirements
### Files
- `apps/super-app/app.json` (S1 — production config), `apps/super-app/eas.json` (S6 — `submit.production`), `apps/super-app/PrivacyInfo.xcprivacy` + the Play Data-safety mapping doc (S4).
- `apps/super-app/store/` — metadata + screenshots + reviewer notes + demo-video link, with localized copy sourced from `@henryco/i18n`.
- `@henryco/observability` telemetry additions (S8).
- `docs/v3/mobile-store-submission.md` — the submission runbook + the privacy-disclosure truth table + the L9 account checklist.
### Trust / safety / compliance
- **Privacy disclosures must be exactly true** — iOS App Privacy + Play Data safety match the actual SDK data collection; a false disclosure is a hard fail, not a polish item.
- Submission secrets are EAS-managed/CI-scoped, never committed: `ASC_API_KEY_ID`/`ASC_ISSUER_ID`/`ASC_PRIVATE_KEY`, `GPLAY_SERVICE_ACCOUNT_JSON`, `EXPO_TOKEN`. The store build carries the **anon** Supabase key + RLS only — no service-role key (re-verified from V3-87).
- L9: developer accounts under **Henry Onyx Limited**; store listings + privacy policy name the same legal entity (matches the CAC/Paystack-compliance entity).
- Per-region content compliance per store policy; gaming markets flagged (D2) if V3-65/66 ever ships.
### Mobile + desktop parity
- N/A — this is mobile store submission. (Parity itself is V3-87.)
### i18n
- Store listings (name, description, keywords, what's-new) localized per the **D10-committed markets**, sourced from `@henryco/i18n` so store copy and in-app copy share one truth. No hardcoded store strings; the per-market commitment from V3-84/D10 bounds which locales are submitted.
### Brand & design system
- The store name + icon + listings present the **Henry Onyx** brand (no `Henry & Co.`), legal entity **"Henry Onyx Limited"**, all URLs via `@henryco/config` helpers (no literal `henrycogroup.com`). App icon/splash align to the brand system; the corrected `app.json` `name` is verified in the production build.

## Validation gates
1. **EAS Build** succeeds for iOS + Android on the production profile (signed artifacts).
2. **EAS Submit** delivers to TestFlight + Play internal track; the pipeline is reproducible from CI.
3. **Pre-submission checklist (S7)** complete: production env vars present; push/Mapbox/Sentry/Cloudinary verified on store-channel builds; privacy manifests accurate + consistent across both stores; production deep-link host verified.
4. **Privacy-disclosure truth check**: the iOS App Privacy + Play Data-safety entries match the actual SDK data collection (documented in the truth table).
5. **Reviewer test account** functional end-to-end (auth → booking → order → assist → payment/wallet).
6. **Brand + entity audit**: no `Henry & Co.` in app name/listings/config; legal entity is "Henry Onyx Limited"; no hardcoded domains.
7. Standard CI green for any repo changes (`Lint, typecheck, test, build`).

## Deployment gate
- **L9** complete (developer accounts under Henry Onyx Limited).
- All S7 checklist items green; privacy disclosures verified true.
- **Owner approves submission**; after store review passes, **owner approves the public release**. Branch `v3/88-mobile-store-submission` off `origin/main` → PR → squash-merge (no force-push) for the repo config/metadata changes.

## Final report contract
`.codex-temp/v3-88-mobile-store-submission/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification [store review status] · telemetry baseline · deferred items · pass-closure assertion) + the privacy-disclosure truth table + the submission runbook + the L9 account checklist.

## Self-verification
- [ ] `app.json` production-correct: Henry Onyx brand (no `Henry & Co.`), production bundle ids, production deep-link host via env, real EAS project id, version/build bumped.
- [ ] App Store Connect + Google Play metadata complete + localized per D10-committed markets (copy sourced from `@henryco/i18n`).
- [ ] iOS privacy manifest + App Privacy + Play Data-safety all accurate and consistent (truth table documented).
- [ ] Reviewer test account + demo video + reviewer notes (incl. V3-23 payment-flow narrative) prepared.
- [ ] `eas.json` `submit.production` filled; EAS Build + Submit pipeline reproducible from CI; submission secrets EAS-managed, never committed.
- [ ] L9 verified: developer accounts under Henry Onyx Limited; listings name the same legal entity; no service-role key in the store build.
- [ ] Three `henry.mobile.app.{submitted,approved,released}` telemetry events, exhaustively mapped.
- [ ] Owner approved submission + release; both stores approved.
- [ ] Report written. Hand-off: V3-94 (closure integration re-checks the released apps), V3-95 (launch readiness).
