# V3-23 — Money & Identity Spine: Native App Payment Compliance

**Pass ID:** V3-23  ·  **Phase:** C (Money & Identity Spine)  ·  **Pillar:** P2 (Payments), P12 (Foundation/Platform)
**Dependencies:** V3-13 (provider router, shipped), V3-14 (Stripe activation), V3-15 (Paystack activation, shipped)  ·  **Effort:** M  ·  **Parallel-safe:** Y
**Owner gate:** D8 (mobile stack: Expo vs Flutter — partial)  ·  **Risk class:** Money

---

## Role
You are the V3 native-app payments engineer for Henry Onyx. You execute exactly this one pass, then stop and report. You make the Expo super-app (and company-hub app) take money in a way that survives App Store and Play Store review: digital goods route through the platform's in-app-purchase rail, physical goods and services route to an external hosted checkout, and wallet top-ups route externally as money transfer. You wire the real `PaymentsAdapter` behind the existing `DeferredPaymentsAdapter` placeholder. **You do not invent a new money path** — every charge still terminates in the shipped `@henryco/payment-router` truth and the double-entry ledger. The line you must not cross: no charge confirms in the app UI before the provider (or Apple/Google) confirms it server-side, and no PAN, receipt, or wallet balance is ever trusted from the device.

**Owner gate:** This pass is partially gated on **D8** (mobile stack continuation). Read the current answer in `docs/v3/DECISIONS-REQUIRED.md` before starting — D8's recommended answer is **Option A (continue Expo)**, which is the substrate this pass assumes. Confirm the recorded answer; do not re-litigate the stack choice. If D8 still reads `_____`, stop and report blocked.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/23-payments-native-app-compliance` |
| Deploy | Vercel (web) · EAS (Expo native) |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
The Expo super-app is real and shipped as a skeleton at `apps/super-app/` (Expo Router, `src/platform/` layered architecture). Payments today are an unwired placeholder:

- `apps/super-app/src/platform/contracts/payments.ts` defines the entire money surface as one interface: `PaymentsAdapter.startCheckout(quote: PaymentQuote): Promise<PaymentResult>`, where `PaymentQuote = { amountMinor: number; currency: string; label: string }` (already integer minor units — the money invariant holds) and `PaymentResult` is `{ ok: true; reference; mock } | { ok: false; error }`.
- `apps/super-app/src/platform/adapters/payments.deferred.ts` (`DeferredPaymentsAdapter`) returns `{ ok: false, error: "Payments adapter not implemented…" }`. `apps/super-app/src/platform/adapters/mock/payments.mock.ts` (`MockPaymentsAdapter`) returns instant mock success for local/dev.
- `apps/super-app/src/platform/bundle.ts` selects the adapter: local → `MockPaymentsAdapter`; staging with `flags.payments` → `DeferredPaymentsAdapter`; otherwise mock. `apps/super-app/src/platform/featureFlags.ts` reads `EXPO_PUBLIC_FEATURE_PAYMENTS` and `EXPO_PUBLIC_FEATURE_PAYMENTS_DEMO`, with `paymentsDemoUi` hiding the Account-tab sandbox checkout button when payments are deferred.
- `apps/super-app/src/features/account/AccountScreen.tsx` is the current host that calls into the deferred adapter.

On the server side, V3-13 shipped the vendor-agnostic `@henryco/payment-router` (mock-only/test-gated, PR #169) and V3-15 shipped Paystack live (hosted-redirect, webhook-reconciled, PR #170). V3-14 (Stripe + Apple/Google Pay + Connect) is the dependency that brings the Apple/Google Pay rails. The wallet, ledger (V3-17), and receipt/invoice surfaces (`@henryco/payment-surface`) are the truth this app must reflect — never duplicate.

**The gap:** the native apps have a typed-but-empty payment seam and no store-compliance logic. Apple and Google reject apps that sell **digital goods** (Henry Onyx Intelligence credit, premium digital entitlements) through an external processor — those must use StoreKit / Play Billing and pay the platform commission. They equally reject apps that try to route **physical goods, real-world services, or money transfer** through StoreKit. This pass classifies every Henry Onyx charge into the correct rail, implements both rails behind the existing interface, and adds the server-side compliance gate so a forged client cannot smuggle a digital-goods purchase through the cheaper external rail.

## Mandatory scope

### S1 — Payment category classifier (shared, server-authoritative)
Add `apps/super-app/src/domain/payments/category.ts` exporting a pure classifier plus a matching server module.

```ts
export type PaymentCategory =
  | "digital_goods"   // intangible in-app entitlements consumed in the app → StoreKit / Play Billing
  | "physical_goods"  // marketplace items shipped to the user → external checkout allowed
  | "service"         // real-world service bookings (care, logistics, studio, property) → external allowed
  | "money_transfer"; // wallet top-up, payouts → external; NOT a store-billable purchase

export type ChargeIntent = {
  sku: string;               // stable product key, e.g. "intelligence.credit.500"
  division: string;          // care | marketplace | studio | jobs | learn | logistics | property | account
  amountMinor: number;       // integer minor units (kobo/cents)
  currency: string;          // ISO 4217
  category: PaymentCategory; // server-asserted; client value is advisory only
};

export function classifyCharge(sku: string, division: string): PaymentCategory;
```

The classifier is the single source of truth for rail selection. Henry Onyx Intelligence credit (`intelligence.credit.*`) and any digital entitlement = `digital_goods`. Marketplace physical orders = `physical_goods`. Care/logistics/studio/property/jobs/learn service bookings = `service`. Wallet top-up and payout = `money_transfer`. **The client classification is never trusted** — the server re-derives `category` from `sku`+`division` (S5) and rejects a mismatch.

### S2 — Apple/Google in-app-purchase rail (digital goods only)
Implement `apps/super-app/src/platform/adapters/payments.iap.ts` (`IapPaymentsAdapter implements PaymentsAdapter`).

- Use **`react-native-iap`** or **RevenueCat** (decide in the report; RevenueCat reduces receipt-verification surface but adds a dependency — recommend RevenueCat for the cross-store receipt-validation abstraction). Pin the choice and document it.
- IAP product IDs map 1:1 to digital-goods SKUs (`intelligence.credit.500` → store product `henryco.intelligence.credit.500`). Maintain the map in `apps/super-app/src/domain/payments/iap-products.ts`.
- Flow: `startCheckout(quote)` for a `digital_goods` SKU → present native StoreKit/Play sheet → on purchase, obtain the signed receipt/transaction → POST it to the server verification endpoint (S5) → on server `verified`, finish/acknowledge the transaction locally → return `{ ok: true, reference }` where `reference` is the **server**-issued ledger reference, not the store transaction id.
- Never credit the entitlement on the device. The server credits Henry Onyx Intelligence wallet/credit after verifying the receipt.

### S3 — External hosted-checkout rail (physical / service / money_transfer)
Implement `apps/super-app/src/platform/adapters/payments.external.ts` (`ExternalCheckoutAdapter implements PaymentsAdapter`).

- `startCheckout(quote)` for a non-digital SKU → call the server to create a checkout session via `@henryco/payment-router` (Paystack live today; Stripe via V3-14) with an **idempotency key** → receive the hosted-checkout URL → open it with **`expo-web-browser`** (`WebBrowser.openAuthSessionAsync`) so the system browser owns card entry.
- On return, the deep link re-enters the app via the V3-04 universal-links setup (`payment/return?ref=…`). The app then **polls the server** for the authoritative status (`pending | succeeded | failed`) — it never reads success from the redirect URL. Return `{ ok: true, reference }` only after the server reports `succeeded` (provider-confirmed money-truth, reconciled by the V3-15 webhook).
- Wallet top-up (`money_transfer`) uses this same rail and is explicitly classified so it is never routed to StoreKit (Apple permits money-transfer outside IAP).

### S4 — Adapter selection + offline-safe state
- Update `apps/super-app/src/platform/bundle.ts` so `payments` resolves to a **composite** adapter that routes per-charge: it inspects the charge category and delegates to `IapPaymentsAdapter` (digital) or `ExternalCheckoutAdapter` (physical/service/money_transfer). `MockPaymentsAdapter` stays the local/dev default; `DeferredPaymentsAdapter` is removed from the staging path once this lands (keep the class for a clean rollback).
- Extend `featureFlags.ts`: split `payments` into `paymentsExternal` and `paymentsIap` so each rail can ship independently behind `EXPO_PUBLIC_FEATURE_PAYMENTS_EXTERNAL` / `EXPO_PUBLIC_FEATURE_PAYMENTS_IAP`. Both default `false` until store accounts and provider keys are live.
- Use **`expo-secure-store`** for sensitive cached state only: last-used external payment-method **token** (never PAN, never CVV) and a cached wallet-balance snapshot **for display only**, stamped with a `verifiedAt`. Every money action re-verifies balance server-side before charging — the cached value is decorative and is discarded if older than a short TTL.

### S5 — Server-side compliance gate + receipt verification
Add the server endpoints under `apps/account/app/api/payments/native/` (the account app already owns wallet + payment routes):

- `POST /api/payments/native/intent` — body `{ sku, division, amountMinor, currency, platform }`. The server re-runs `classifyCharge(sku, division)` (S1 server twin) and **rejects** if the client-asserted category disagrees, or if a `digital_goods` charge arrives with `platform: "ios" | "android"` and no intent to use IAP. Returns the rail decision + (for external) a payment-router session with an idempotency key.
- `POST /api/payments/native/iap/verify` — body `{ platform, productId, receipt | transactionToken }`. Verifies against Apple's App Store Server API (`verifyReceipt` is deprecated — use the **App Store Server API / `JWSTransaction`** path) or Google Play Developer API (`purchases.products.get`). On `verified`, idempotently credits the entitlement through the ledger and returns the ledger reference. Reuses the V3-17 double-entry write; never a bespoke balance mutation.
- Every native payment route is guarded by `requireSensitiveAction` (V3-02) and writes `writeAuditLog(...)` from `@henryco/observability/audit-log`. The platform is asserted from a verified header `X-HenryCo-Platform: ios | android | web`, cross-checked against the authenticated session's device claim — a forged header alone cannot downgrade a digital-goods charge to the external rail.

### S6 — Telemetry
Emit via `emitEvent(...)` from `@henryco/observability`, naming `henry.<domain>.<noun>.<verb>`:
- `henry.payment.iap.initiated`
- `henry.payment.iap.verified`
- `henry.payment.iap.rejected` (receipt invalid / category mismatch)
- `henry.payment.external.opened`
- `henry.payment.external.returned`
- `henry.payment.external.reconciled` (server-confirmed succeeded)
- `henry.payment.category.mismatch` (compliance-gate rejection — a forged client tried the wrong rail)

Each carries `{ sku, division, category, platform, amountMinor, currency, outcome }`, PII-redacted per `@henryco/observability/redaction`.

## Out of scope
- Non-payment mobile UI/parity (V3-87 super-app parity wave 1).
- Store submission, signing, OneSignal mobile push wiring (V3-88).
- Stripe SDK activation + Apple/Google Pay merchant setup itself (V3-14) — this pass consumes those rails; it does not stand them up.
- Refunds/disputes flow (V3-19) — native app surfaces refund status read-only via the existing payment-surface, no new behavior here.
- Tax computation (V3-21).

## Dependencies
**Blocks on:** V3-13 (router, shipped), V3-14 (Stripe + Apple/Google Pay), V3-15 (Paystack, shipped), V3-04 (universal links — the deep-link return path). **Owner gate D8** (Expo continuation).
**This pass blocks:** V3-88 (store submission cannot proceed until payment compliance passes review). It also de-risks V3-87 parity by locking the money seam first.

## Inheritance
- `@henryco/payment-router` (V3-13) — every external charge terminates here; never bypass it.
- `@henryco/payment-surface` — receipt/proof/processing primitives; native app reflects, never re-styles payment behavior.
- V3-17 ledger — the only place entitlements/balances mutate; IAP verification writes here.
- V3-02 `requireSensitiveAction` / `fetchWithSensitiveAction`; `@henryco/observability` `emitEvent` + `writeAuditLog`.
- `apps/super-app/src/platform/{contracts,adapters,bundle,featureFlags}.ts` — the existing seam this pass fills.
- `@henryco/config` for any URL (deep-link host via `henryDomain()` / `henryWebRoot()`), and `@henryco/i18n` for all copy.

## Implementation requirements

### Files
- New: `apps/super-app/src/domain/payments/{category.ts,iap-products.ts}`
- New: `apps/super-app/src/platform/adapters/payments.iap.ts`, `payments.external.ts`, `payments.composite.ts`
- Changed: `apps/super-app/src/platform/{bundle.ts,featureFlags.ts}`, `apps/super-app/src/features/account/AccountScreen.tsx` (consume composite adapter), `apps/super-app/src/platform/contracts/payments.ts` (extend `PaymentQuote` with `sku`/`division`/`category` without breaking the existing shape)
- New server: `apps/account/app/api/payments/native/intent/route.ts`, `apps/account/app/api/payments/native/iap/verify/route.ts`
- New server lib: `apps/account/lib/payments/classify-charge.ts` (server twin of S1), `apps/account/lib/payments/store-receipts.ts` (Apple/Google verification)
- Migration: `supabase/migrations/<ts>_v3_23_native_iap_receipts.sql` — `iap_receipts` table (`id`, `user_id`, `platform`, `product_id`, `store_transaction_id` UNIQUE, `ledger_reference`, `verified_at`, `created_at`) with RLS.

### Trust / safety / compliance
- **Money invariants absolute:** integer minor units only; idempotency key on every external session + every IAP credit (`store_transaction_id` UNIQUE enforces IAP idempotency at the DB); status is provider/store-confirmed, never optimistic UX; double-entry ledger truth via V3-17.
- **Store policy:** digital goods → IAP only on iOS/Android; physical/service/money-transfer → external only. The S5 server gate is the enforcement point; the client cannot override it.
- **RLS on `iap_receipts`:** owner-only read of own rows; all writes service-role from the verification route. No client write path.
- **Secrets:** Apple App Store Server API key, Google service-account JSON, and provider keys live in server env only; never bundled into the Expo binary. The app holds only public/publishable identifiers.
- `requireSensitiveAction` + `writeAuditLog` on both native payment routes. Receipt/invoice legal entity remains **"Henry Onyx Limited"** (sourced from `@henryco/config`), matching the CAC entity for provider compliance.

### Mobile + desktop parity
This pass IS the native-app payment compliance layer — mobile is the point. The web account app already has its payment surface; this pass adds the **server** endpoints it shares (`/api/payments/native/*`) and the Expo client rails. No new web UI. Web checkout behavior is unchanged.

### i18n
All native-app payment copy flows through `@henryco/i18n`, namespace **`surface:payments`** (rail-selection notices, "opening secure checkout", return states, IAP errors). IAP **product** titles/descriptions are additionally authored in App Store Connect / Play Console per store-submission locale (a store-side artifact, listed in the report, not a hardcoded string in the binary). No hardcoded user-facing strings; no hardcoded domains (deep-link host via `@henryco/config`).

### Brand & design system
Any user-facing string says **Henry Onyx** (division labels "Henry Onyx <Division>"), sourced from `@henryco/config` (`COMPANY` / division names). Receipts/legal entity = **Henry Onyx Limited**. The native app uses the super-app design system (`apps/super-app/src/design-system/`) — payment screens use existing tokens, light + dark, no ad-hoc hex. Store product names in copy use the Henry Onyx brand.

## Validation gates
1. **CI:** `pnpm -F super-app typecheck && lint && test`; `pnpm -F @henryco/account-app typecheck && lint && build`; root workspace build green.
2. **Classifier unit tests** (~12): every SKU pattern → correct category; account-app server twin agrees with the Expo classifier (shared fixture).
3. **IAP e2e (~6):** Apple **StoreKit sandbox** + Google **internal test track** — purchase digital-goods SKU → server verifies signed receipt → ledger credited exactly once → replay of same `store_transaction_id` is a no-op (idempotency proven).
4. **External checkout e2e (~6):** physical + service + wallet-top-up SKU → `expo-web-browser` opens hosted checkout → deep-link return → app polls server → success only after webhook reconciliation (V3-15) marks `succeeded`.
5. **Compliance-gate tests (~8):** forged `X-HenryCo-Platform` header, client category lie (digital-goods asserted as service), and digital-goods-on-iOS-without-IAP all rejected with `henry.payment.category.mismatch` emitted and audit row written.
6. **RLS verification:** non-owner cannot read another user's `iap_receipts`; client has no write path.
7. **Telemetry assertion:** all 7 events fire with the documented payload shape on their respective paths; PII redacted.

## Deployment gate
- All validation gates green; D8 confirmed `Option A` in `DECISIONS-REQUIRED.md`.
- V3-14 (Stripe + Apple/Google Pay) merged so the IAP and external rails have live providers, or both rails shipped behind `EXPO_PUBLIC_FEATURE_PAYMENTS_*` flags `false` with a documented enable runbook.
- **TestFlight + Google internal track** ramp with real sandbox transactions logged.
- **Owner approval required** before any store submission (which is V3-88's gate, not this pass's — but this pass must hand V3-88 a compliance-clean seam).
- Money-risk soak: 7-day sandbox soak with zero double-credits and zero category-mismatch escapes in telemetry before flags flip on for real traffic.

## Final report contract
`.codex-temp/v3-23-payments-native-app-compliance/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion). Explicitly record: the IAP library choice (react-native-iap vs RevenueCat) and why; the Apple App Store Server API + Google Play Developer API credential setup; the `EXPO_PUBLIC_FEATURE_PAYMENTS_*` flag state at merge; and the store-side localized product-name artifacts handed to V3-88.

## Self-verification
- [ ] S1 classifier + server twin agree; client category is advisory only and server-asserted on every charge.
- [ ] S2 IAP rail credits entitlements only after server receipt verification; device never credits locally.
- [ ] S3 external rail opens hosted checkout via `expo-web-browser`, returns via V3-04 deep link, and confirms only on server-reconciled `succeeded`.
- [ ] S4 composite adapter routes per-category; `DeferredPaymentsAdapter` removed from staging path (kept for rollback); secure-store holds tokens + display-only balance, never PAN.
- [ ] S5 compliance gate + receipt verification reject forged platform headers and category lies; `iap_receipts` idempotent via UNIQUE `store_transaction_id`.
- [ ] S6 all 7 `henry.payment.*` telemetry events emit with redacted payloads.
- [ ] Money invariants hold: integer minor units, idempotency on every billed call, provider/store-confirmed status, V3-17 ledger truth.
- [ ] `requireSensitiveAction` + `writeAuditLog` on both native payment routes; RLS verified on `iap_receipts`.
- [ ] All copy via `@henryco/i18n` (`surface:payments`); brand "Henry Onyx" / legal "Henry Onyx Limited" via `@henryco/config`; zero hardcoded domains/strings.
- [ ] D8 confirmed in `DECISIONS-REQUIRED.md`; report written with the 9 standard sections.
