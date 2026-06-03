# V3-85 — Global/Mobile: Per-Market Payment Routing

**Pass ID:** V3-85  ·  **Phase:** I (Platform/API + Global/Mobile + Observability + Closure)  ·  **Pillar:** P12 (Foundation & Trust), P2 (Wallet, Payments, Financial Spine)
**Dependencies:** V3-13 (payment provider router — SHIPPED, PR #169), V3-84 (localization maturity)  ·  **Effort:** M  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** Money

---

## Role
You are the V3 Market-Payment-Routing engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass extends the shipped `@henryco/payment-router` from a single per-country preference order into a **per-market routing layer with an honest, user-overridable provider-availability matrix** — so a buyer in any committed market sees the payment *methods* actually available to them, in the right default order, and can choose their preferred one. The line it must not cross: it changes only **routing inputs and the method-choice UX** — it never weakens the money-correctness triad (idempotent create, legal status transitions, webhook dedup), never charges live money itself, and **never leaks a provider identity into any client-visible response** (Principle 9 — the client sees method *types*, "Card" / "Bank transfer" / "Mobile money", never "Stripe"/"Paystack"/"Flutterwave").

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/85-global-per-market-payment-routing` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

V3-13 shipped `@henryco/payment-router` (PR #169, squash `0a8e5944`) and its router is real and on `main`:

- **`packages/payment-router/src/routing/country-defaults.ts`** maps ISO-3166 country → an ordered `PaymentProviderKey[]` preference (e.g. `NG → [paystack, flutterwave]`). That order **is** the failover order.
- **`packages/payment-router/src/routing/capability-matrix.ts`** maps each provider → the `PaymentMethod[]` it supports (`card | bank_transfer | ussd | mobile_money | apple_pay | google_pay`).
- **`router.ts`** computes `candidates = country-defaults[country] ∩ {p : method ∈ capability-matrix[p]} ∩ registered`, walks them in failover order, and returns a **Principle-9** `InitiatePaymentResult.clientAction` = `{ type: "redirect"; url } | { type: "sdk"; token } | { type: "none" }` that carries **no provider identity**. `providerReference` and the selected provider are server-side only (the `onProviderSucceeded` hook + the `payment_attempts` table).
- The rail is **dormant in production** (no provider secret → A5 manual fallback everywhere). **V3-15** (Paystack, PR #170) is the one live adapter against the contract.
- **V3-84** matures `@henryco/config` into per-country `MarketProfile`s with an `isMarketLocalized` readiness gate.

**The gap this pass closes:** `country-defaults` is a flat preference list with no notion of *which providers are actually live in which market*, no *user override*, and no *user-facing method picker* at checkout. Buyers cannot choose "bank transfer" vs "card", and the default order is not yet expressed as a maintainable per-market availability matrix. This pass adds (1) a declarative per-market provider-availability matrix, (2) a checkout method picker that shows only available *method types* and lets the user choose + persist a preference, and (3) the telemetry for routed-vs-overridden decisions — all without touching the money-correctness core or breaking Principle 9.

## Mandatory scope

### S1 — Per-market provider-availability matrix
New module `packages/payment-router/src/routing/market-availability.ts`. It expresses, per ISO-3166 country, **which providers are live in that market** and **in what default order** — distinct from `country-defaults` (static preference) because availability changes as activation passes (V3-14/15/16) go live per market and as the owner's D1 answer rolls out.

```typescript
// packages/payment-router/src/routing/market-availability.ts
import type { ISO3166Alpha2, PaymentProviderKey, PaymentMethod } from "../types";

export type MarketProviderEntry = {
  provider: PaymentProviderKey;
  /** Live in this market right now? Gates on registered adapter + per-market activation. */
  live: boolean;
  /** Default preference rank within the market (lower = preferred). */
  rank: number;
  /** Methods this provider serves IN THIS MARKET (⊆ capability-matrix[provider]). */
  methods: PaymentMethod[];
};

/** ISO 3166 country → ordered live-provider entries. */
export const MARKET_AVAILABILITY: Record<ISO3166Alpha2, MarketProviderEntry[]>;

/** Live providers for a market, in default rank order, intersected with registered adapters. */
export function liveProvidersForMarket(
  country: ISO3166Alpha2,
  registered: ReadonlySet<PaymentProviderKey>,
): MarketProviderEntry[];

/** Distinct, available METHOD TYPES for a market (the only thing the client ever sees). */
export function availableMethodsForMarket(
  country: ISO3166Alpha2,
  registered: ReadonlySet<PaymentProviderKey>,
): PaymentMethod[];
```

Seed (Nigeria-first, per D1 recommendation; non-committed markets carry entries with `live: false` so the matrix documents intent without shipping a dead route):
- `NG`: Paystack (rank 0, `card`, `bank_transfer`, `ussd`), Flutterwave (rank 1, `card`, `bank_transfer`, `mobile_money`), Stripe (rank 2, `card`, `apple_pay`, `google_pay`).
- `KE`: Flutterwave (rank 0, `mobile_money`, `card`), Paystack (rank 1), Stripe (rank 2).
- `GH`: Flutterwave (rank 0, `mobile_money`, `card`), Paystack (rank 1).
- `GB` / `FR` / `DE`: Stripe (rank 0, `card`, `apple_pay`, `google_pay`).
- `US`: Stripe (rank 0, `card`, `apple_pay`, `google_pay`).

Whether an entry is *honoured* at runtime is the intersection of `live === true` AND the provider being in the `registered` set — so a market with only `live: false` entries falls through to the A5 manual fallback exactly as today. The matrix never overrides the money-correctness core; it only feeds `router.ts` a market-aware, ordered candidate list.

### S2 — Router consumes the matrix
Extend `router.ts` so `selectProvider`/`route` derive their candidate order from `liveProvidersForMarket(country, registered)` when a market entry exists, falling back to the existing `country-defaults` order when it does not. The intersection with `capability-matrix` and the `registered` set is preserved exactly; the failover walk (retryable → next, fatal → stop) is unchanged. Add an optional `preferredMethod?: PaymentMethod` to the route input: when present, candidates are re-ordered to prefer providers that serve that method **first**, without removing the others (so a method-preference never produces an empty candidate set / dead end).

### S3 — User override at checkout (method picker)
- New API route `apps/account/app/api/payments/methods/route.ts` (server-side, session-gated): given the buyer's resolved market (`MarketProfile` from V3-84) and the `registered` provider set, returns `availableMethodsForMarket(...)` as **method-type labels only** (no provider identity). Response shape: `{ methods: Array<{ method: PaymentMethod; labelKey: string }> }`.
- New `@henryco/payment-surface` primitive `payment-method-picker.tsx`: renders the available method types as selectable options using `surface:payments` copy keys ("Card", "Bank transfer", "USSD", "Mobile money", "Apple Pay", "Google Pay"). Selecting one sets `preferredMethod` on the subsequent `POST /api/payments/intents` call (S2). Design-token-only; behaviour-locked relative to the existing manual proof path (the picker is additive — the manual bank-transfer/proof path remains a method option, never removed).
- **Persist the preference per user.** Add `preferred_payment_method` (TEXT, nullable, CHECK over the seven `PaymentMethod` values) to the existing user-preferences surface (the V3-34 personalization preference store; if V3-34 has not landed, persist on the `profiles`/`user_settings` table the account app already owns). RLS: a user reads/writes only their own preference. The stored preference pre-selects the picker next checkout; it is a hint, never a hard constraint — if the preferred method is unavailable in the current market, the picker falls back to the market default and tells the user (i18n string), never silently.

### S4 — Honest capability display (method types, not provider identities)
The picker and any "How you'll pay" summary show **method TYPES** with honest copy ("Pay with card", "Pay by bank transfer", "Pay with mobile money") and never expose which provider clears the charge (Principle 9 — anti-clone). The `clientAction` returned by the router stays provider-agnostic. A grep-enforced test asserts no provider key string (`stripe`/`paystack`/`flutterwave`) appears in any client-reachable response body or i18n copy key.

### S5 — Telemetry
Two pure, exhaustively-mapped events appended to the `henry.payment.*` taxonomy in `@henryco/observability` (the `Record<PaymentEventName, …>` keyed on `Extract<HenryEventName, "henry.payment.${string}">` — adding one without mapping it is a compile error):
- `henry.payment.market.routed` — emitted when the router selects a candidate ordering from `MARKET_AVAILABILITY` (carries country + selected method type + whether a market entry existed; **never** the provider identity in any client-visible field — provider goes only to the server-side audit payload).
- `henry.payment.override.applied` — emitted when a user's `preferredMethod` re-orders the candidates.

## Out of scope
- Provider SDK activations — Stripe (V3-14), Paystack (V3-15, shipped), Flutterwave (V3-16). This pass routes among whatever adapters are registered; it activates none.
- Tax computation/display — V3-21 (rate) + V3-84 (display behaviour).
- Currency rounding, address/phone/holiday market maturity — **V3-84** (this pass consumes its `MarketProfile`/`isMarketLocalized`).
- Ledger double-entry (V3-17), refunds/reconciliation (V3-19), subscription dunning (V3-20), finance dashboard + finance-RLS narrowing (V3-22).
- Native-app payment compliance (V3-23) — the picker is reused on mobile in V3-87, but App/Play-store digital-goods policy routing is V3-23's call.

## Dependencies
- **Requires:** V3-13 (`@henryco/payment-router` contract + `country-defaults` + `capability-matrix` + Principle-9 `clientAction`), V3-84 (`MarketProfile` + `isMarketLocalized` to resolve the buyer's market).
- **Owner gate:** none (D1 — provider activation per market — gates the *activation* passes V3-14/15/16, not this routing layer; this pass routes among registered adapters and is safe to build before all providers are live).
- **Blocks:** nothing hard; the method picker is reused by V3-87 (mobile wave 1) and refined by V3-23 (native compliance). It feeds V3-22's finance dashboard the per-market routing telemetry.

## Inheritance
- `@henryco/payment-router` — `country-defaults.ts`, `capability-matrix.ts`, `router.ts`, `types.ts` (`PaymentMethod`, `PaymentProviderKey`, `ISO3166Alpha2`), the Principle-9 `clientAction`, the `payment_attempts` audit table.
- `@henryco/payment-surface` — manual-payment primitives extended with the method picker (behaviour-locked; additive).
- `@henryco/config` `MarketProfile` / `resolveMarketProfile` (V3-84) — resolves the buyer's market.
- `@henryco/observability/audit-log` + telemetry taxonomy — provider identity goes only to the server-side audit payload.
- V3-02 sensitive-action guard (`requireSensitiveAction` server / `fetchWithSensitiveAction` client) on the intent-creating route.

## Implementation requirements
### Files
- `packages/payment-router/src/routing/market-availability.ts` (S1) + `router.ts` extension (S2) + `__tests__/market-routing.test.ts`.
- `apps/account/app/api/payments/methods/route.ts` (S3) + the `POST /api/payments/intents` `preferredMethod` wiring.
- `packages/payment-surface/src/payment-method-picker.tsx` (S3) + barrel export.
- The `preferred_payment_method` migration `apps/account/supabase/migrations/<ts>_preferred_payment_method.sql` (S3) — committed; applied as a deliberate owner step.
- `@henryco/observability` telemetry additions (S5).
- `docs/v3/per-market-payment-routing.md` — the availability matrix + the Principle-9 assertion.

### Trust / safety / compliance
- **Principle 9 is load-bearing:** no provider identity in any client response, client error, or i18n copy key — grep-enforced (S4). The selected provider key lives only in `payment_attempts` + the server-side audit payload.
- Money invariants from V3-13 are untouched: BIGINT minor units, A1 `UNIQUE(user_id, idempotency_key)` idempotent create, A2 legal transitions, A3 webhook dedup. This pass adds **routing inputs and a UX picker** — zero changes to charge correctness.
- `preferred_payment_method` RLS: user reads/writes own row only. The method-list route is session-gated; provider secrets stay env-only at the adapter seam.

### Mobile + desktop parity
The method-list route + `payment-method-picker` are reused verbatim by the Expo super-app in V3-87 (the picker is presentational; the route is provider-agnostic). Wallet methods (`apple_pay`/`google_pay`) surface in the matrix but their *native* wiring + App/Play-store digital-goods policy routing is V3-23. Keep `market-availability.ts` free of Node-only imports so the matrix is client-reachable on mobile.

### i18n
Method-type labels, the "preferred method unavailable in this market — using the regional default" notice, and the status/error copy all flow through `@henryco/i18n` namespace **`surface:payments`** — typed Pattern A keys in en-US, Pattern B runtime DeepL for the other 11 locales. ZERO hardcoded method labels or provider names.

### Brand & design system
The method picker is design-token-only (Fraunces + locked `--site-*`/`--accent`), light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed. Any callback/redirect URL in `clientAction` resolves through `@henryco/config` helpers (`getAccountUrl()`), never a literal domain. The receipt legal entity stays **"Henry Onyx Limited"** from `company.ts`. Behaviour-locked: this pass adds a picker, it does not change how a charge clears.

## Validation gates
1. Standard CI: typecheck, lint, test, build (required context `Lint, typecheck, test, build`).
2. **Market-routing suite** (≈30+ specs): `liveProvidersForMarket` order per market; intersection with `capability-matrix` + `registered`; a market with only `live:false` entries falls to A5 manual fallback; `preferredMethod` re-orders without emptying candidates; no candidate set ever becomes a dead end.
3. **Override smoke**: select a method → it persists → pre-selects next checkout → unavailable-in-market preference falls back to default with the i18n notice.
4. **Principle-9 leak test** (grep-enforced): no `stripe`/`paystack`/`flutterwave` string in any client-reachable response body or copy key; the method list returns method types only.
5. **RLS verification**: a user reads/writes only their own `preferred_payment_method`.
6. **i18n strict gate** green: no new hardcoded user-facing strings; new keys exist in en-US Pattern A.
7. **Real-browser** method picker: light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed.

## Deployment gate
All gates green; the only required check (`Lint, typecheck, test, build`) passing; branch `v3/85-global-per-market-payment-routing` off `origin/main` → PR → squash-merge (no force-push). The `preferred_payment_method` migration applied as a deliberate owner step. Because this pass touches the money path's *routing inputs*, a **14-day soak** runs against the live Paystack adapter (V3-15) before the picker is enabled for general traffic — confirming routed-vs-override telemetry is clean and zero provider identity leaked.

## Final report contract
`.codex-temp/v3-85-global-per-market-payment-routing/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion) + the per-market availability matrix + the Principle-9 leak-test evidence.

## Self-verification
- [ ] `MARKET_AVAILABILITY` matrix + `liveProvidersForMarket`/`availableMethodsForMarket`; non-committed markets carry `live:false` entries (intent without a dead route).
- [ ] `router.ts` consumes the matrix in failover order; `country-defaults` fallback preserved; `preferredMethod` re-orders without ever emptying candidates.
- [ ] Method-list route returns method TYPES only; `payment-method-picker` primitive shipped; manual proof path preserved as an option.
- [ ] `preferred_payment_method` persisted per user with own-row RLS; unavailable preference falls back to market default with an i18n notice.
- [ ] Principle-9 leak test green: zero provider identity in any client-visible field or copy key.
- [ ] Money-correctness core untouched (A1/A2/A3, BIGINT minor units) — verified by V3-13 suite still green.
- [ ] Two `henry.payment.market.routed` / `henry.payment.override.applied` events, exhaustively mapped; provider identity only in server-side audit.
- [ ] ZERO hardcoded provider names, method labels, or domains.
- [ ] Report written. Hand-off: V3-87 (mobile reuses the picker), V3-23 (native digital-goods policy routing).
