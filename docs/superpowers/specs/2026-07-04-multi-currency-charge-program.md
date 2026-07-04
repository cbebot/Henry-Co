# Multi-currency charge program (V3-MONEY-MC)

**Status:** Committed program spec — owner directive 2026-07-04 ("it should not be only
naira — charge the user in the currency they set, or their locality currency").
**Owner gate:** each currency goes live only after a real settle test in that currency,
the same recipe that proved the card rail.

## 1. What already exists (the "locality foundations")

The platform is closer to multi-currency than any surface shows. Verified in-repo:

| Layer | Foundation | State |
|---|---|---|
| Country → currency | `packages/config/countries.ts` (`SUPPORTED_COUNTRIES`: 20+ countries with currency, symbol, locale, honest availability) | Live |
| Currency truth model | `@henryco/pricing` `currency-model.ts` — `CurrencyLayerSnapshot` separates display / pricing / settlement / ledger / wallet currencies; `resolveDisplayCurrencyForCountry`; per-division `SettlementAvailabilityStatus`; `describeSettlementTruth`; `assertNoAmbiguousCurrency` | Live, all divisions `ngn_only` |
| FX rates | `@henryco/pricing` `exchange-rate.ts` — Open Exchange Rates, 30-minute cache, stale-but-served fallback; env `OPENRATE_APP_ID` | Live (display-grade) |
| Charge router | `@henryco/payment-router` — already ISO-4217-generic: `normalizeCurrency`, per-currency `minorUnitExponent` via `@henryco/i18n/currency`; providers take `{amountMinor, currency, country}` | Live, callers pass `"NGN"` |
| DB | `20260419120000_multi_currency_schema_foundation.sql` — `currency_snapshot` JSONB on marketplace orders, wallet funding/withdrawal/transactions, pricing quotes, logistics bookings | Committed (verify applied) |
| Division seams | `studioChargeMinor` / `careChargeMinor` / marketplace equivalent — ONE tested major→minor conversion per rail, currency-aware signature, non-NGN returns `null` today (fails closed) | Live |

The gap is one deliberate last mile: **resolution** (which currency is this payer's?)
and **charging** (send that currency to the provider instead of NGN).

## 2. Invariants (absolute)

1. **The ledger keeps ONE accounting base (NGN).** Every non-NGN money row carries a
   `currency_snapshot` with the charge currency, the rate, its source and timestamp.
   Double-entry balance is asserted in the base currency, exactly as today.
2. **Status is provider-confirmed truth.** A charge settles in the currency and amount
   the provider confirms — reconcile compares against the intent's own
   `currency + amount_minor`, never a re-converted figure.
3. **Rates convert prices before the charge starts; they never touch settlement.**
   The identity-rate fallback is legal for display only. If a live rate is missing at
   charge time, the charge does not start in that currency (offer NGN instead).
4. **No surface may show an exact price in a currency it cannot charge** without the
   `isApproximateDisplay` label — the pricing module already enforces the shape.
5. **A currency is "live" per division only after a real settle test**, then its entry
   in `DIVISION_SETTLEMENT_STATUS` flips. The flag is the interlock:
   `CHARGE_CURRENCIES` (comma-separated allowlist, default `NGN`).

## 3. Resolution — whose currency?

One server-only function in `@henryco/pricing`, used by every division:

```
resolvePayerCurrency({ userPreference, countryCode, division })
  → { currency, source: 'user' | 'locality' | 'default', chargeable: boolean }
```

Priority: the user's explicit region/currency preference (account settings) → the
locality currency from `resolveDisplayCurrencyForCountry(countryCode)` → NGN.
`chargeable` is true only when the currency is in `CHARGE_CURRENCIES` AND the division's
settlement status permits it; when false, surfaces display the local currency as
approximate and charge NGN — which is exactly today's behaviour, made honest.

## 4. Delivery stages

- **M0 — Resolution + display honesty (no money change).** Ship
  `resolvePayerCurrency`; every checkout surface shows the payer's currency (exact when
  chargeable, labelled-approximate otherwise) through the existing snapshot model.
  Verify the foundation migration is applied on prod; apply if not.
- **M1 — Charge in the payer's currency.** Extend the per-rail seams to
  `chargeMinor(amountMajor, pricingCurrency, payerCurrency, rateSnapshot)`: convert the
  NGN price server-side at charge start, apply per-currency bounds, create the intent in
  the payer's currency, store the full `currency_snapshot` in intent metadata. The
  provider hosted page then charges USD/GHS/KES/… natively. Reconcile stays byte-for-byte:
  exact `currency + amount_minor` match on the intent itself.
- **M2 — Ledger + VAT posting.** Guarded RPCs accept the charge snapshot and post
  base-currency entries derived from it (rate frozen at charge time); VAT computed on the
  base amount. Balance invariant unchanged.
- **M3 — Wallet.** Wallets remain NGN this stage (the `walletCurrency` seam already
  names this); non-NGN payers see their balance with the approximate label.
  Multi-currency wallets are a separate future program.
- **M4 — AI metering.** The rate card gains a currency column resolved at reserve time
  through the same snapshot; settle logic unchanged.

## 5. Rollout order

`NGN` (live today) → `USD` → `GHS` → `KES` → `ZAR` → `GBP`/`EUR` — one currency at a
time through `CHARGE_CURRENCIES`, each behind the owner's live settle test, provider
support confirmed per currency before its flag flips. Studio first (signed-in, lowest
blast radius), then marketplace, care, learn.
