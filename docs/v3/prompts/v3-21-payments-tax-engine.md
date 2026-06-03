# V3-21 — Money & Identity Spine: Tax Engine

**Pass ID:** V3-21  ·  **Phase:** C (Money & Identity Spine)  ·  **Pillar:** P2 (Payments & Money), P7 (Trust & Safety)
**Dependencies:** V3-13 (provider router), V3-17 (ledger hardening)  ·  **Effort:** XL  ·  **Parallel-safe:** Y
**Owner gate:** D5 (tax engine selection)  ·  **Risk class:** Money, Compliance

---

## Role
You are the V3 tax engineer for Henry Onyx. You execute exactly this one pass, then stop and report. You build the company's first tax-computation engine: a per-country / per-product-category / per-buyer-type `compute_tax` function, a versioned `tax_rates` catalog seeded with Nigeria VAT, integer-minor-unit subtotal/tax/total persistence on every payment, correct tax-included vs tax-excluded display, and a vendor-adapter seam for a future Avalara/TaxJar drop-in. The line you must not cross: tax is **money**, computed and stored in integer minor units with a stored authority reference for audit — never a floating-point estimate, never a hardcoded rate in application code, and never absent from a receipt.

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/21-payments-tax-engine` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
There is **no tax-computation engine today**. Amounts move in integer minor units (kobo) through wallet and payment flows (`amount_kobo` on `customer_wallet_funding_requests`, `customer_invoices`, etc.), and `@henryco/pricing` (`packages/pricing/src/currency-model.ts`, `exchange-rate.ts`, `currency-sanity.ts`) owns the amount-handling primitives — but nothing computes or stores a tax line. Receipts and invoices (V3-18) render an amount with no tax breakdown. The payment-intent record that V3-13 introduces carries a total with no `subtotal`/`tax` split.

**Owner decision D5** (read the recorded answer in `docs/v3/DECISIONS-REQUIRED.md` — confirm, do not re-litigate) recommends **rolling our own thin engine** for Nigeria-primary V3 (NGN VAT flat 7.5%) with a vendor-integration seam for later international scale, over Avalara/TaxJar/Stripe Tax up front. This pass operationalizes that decision.

**The gap this pass closes:** a single, authoritative, auditable tax computation that every billed surface calls, that stores its result in the ledger and on the receipt, and that swaps to a vendor without touching callers.

## Mandatory scope

### S1 — `tax_rates` catalog (versioned, authority-referenced)
New migration `apps/hub/supabase/migrations/<ts>_tax_engine.sql`:

```sql
create table if not exists public.tax_rates (
  id               uuid primary key default gen_random_uuid(),
  country          text not null,                    -- ISO-3166 alpha-2, e.g. 'NG'
  region           text,                             -- state/province; NULL = country-wide
  product_category text not null default 'standard', -- standard | digital | services | food | medical | exempt | ...
  buyer_type       text not null default 'any',      -- any | consumer | business
  rate_basis_points integer not null,                -- integer basis points (750 = 7.5%); NO floats
  inclusive_default boolean not null default true,    -- jurisdiction's default display convention
  effective_from   date not null,
  effective_to     date,                             -- NULL = open
  authority_name   text not null,                    -- e.g. 'Federal Inland Revenue Service (FIRS)'
  authority_ref    text,                             -- statute/circular reference
  created_at       timestamptz not null default timezone('utc', now())
);
create index if not exists tax_rates_lookup
  on public.tax_rates (country, product_category, buyer_type, effective_from desc);
alter table public.tax_rates enable row level security;
create policy "tax_rates readable" on public.tax_rates for select using (true);
-- writes: service role only (seed via migration; no client write policy).
```

Rates are **integer basis points**, never NUMERIC percentages in application math — all tax arithmetic is integer-minor-unit. A rate is never deleted; supersede by setting `effective_to` and inserting a new row (full audit history).

### S2 — Seed Nigeria VAT
Seed in the same migration:
- Standard rate `750` bp (7.5%), `country='NG'`, `effective_from` = the VAT (Amendment) Act effective date, `authority_name='Federal Inland Revenue Service (FIRS)'`, `authority_ref` = the statute citation, `inclusive_default=true`.
- Zero-rated / exempt categories per FIRS guidance (basic food, medical, educational materials, etc.) as `rate_basis_points=0` rows with `product_category` set accordingly.

### S3 — `compute_tax` (single authoritative function, server-only)
New module `packages/pricing/src/tax/compute-tax.ts` exported from `@henryco/pricing`. Pure, deterministic, integer-only:

```ts
export interface TaxInput {
  subtotalMinor: number;       // integer minor units (kobo/cents)
  currency: string;            // ISO-4217
  country: string;             // ISO-3166 alpha-2
  region?: string | null;
  productCategory: string;     // matches tax_rates.product_category
  buyerType: 'consumer' | 'business';
  asOf?: string;               // ISO date; defaults to today (rate versioning)
}
export interface TaxResult {
  taxMinor: number;            // integer minor units
  totalMinor: number;          // subtotalMinor + taxMinor (exclusive) — see S5
  rateBasisPoints: number;     // rate actually applied
  rateId: string;              // tax_rates.id used (audit)
  authorityName: string;
  authorityRef: string | null;
  exemptApplied: boolean;
  inclusive: boolean;          // display convention resolved (S5)
  breakdown: TaxLine[];        // one line per applicable rate (future multi-rate)
}
```

Rules: resolve the effective rate by `(country, product_category, buyer_type, asOf)` with deterministic precedence (region beats country-wide; specific category beats `standard`; specific `buyer_type` beats `any`). Apply **B2B handling** (zero-rate / reverse-charge where the jurisdiction requires it). Return **zero with `exemptApplied=true`** for exempt categories and **zero with `rateId` empty + `henry.tax.rate.missing` emitted** for non-tax jurisdictions (never throw on a missing rate — degrade to zero and report). All arithmetic uses `@henryco/pricing` integer-minor helpers; banker's-rounding rule documented and tested.

### S4 — Integration with the payment record
Every billed flow calls `compute_tax` before settlement and persists the split. Extend the payment-intent / charge record (V3-13's schema; coordinate the column names with it) to store `subtotal_minor`, `tax_minor`, `total_minor`, `tax_rate_id`, `tax_authority_ref`. The V3-17 ledger records tax to a dedicated **`tax_payable`** account (liability), separate from revenue, so V3-22's "tax owed" tile and the accountant's remittance reconcile exactly. Subscriptions (V3-20) pass their `subtotal_minor` through `compute_tax` and store the returned split.

### S5 — Tax-included vs tax-excluded display
Per-country display convention driven by `tax_rates.inclusive_default` (overridable by per-market config when D10 commits markets):
- Nigeria / UK / EU → **tax-included** display by default.
- US → **tax-excluded** display.

Regardless of convention, **the customer always sees an explicit tax line at checkout and on the receipt** (amount + rate + label). `TaxResult.inclusive` drives whether `totalMinor` equals `subtotalMinor` (price already includes tax — back out the tax for the line) or `subtotalMinor + taxMinor`. Document and test both paths.

### S6 — Per-market extensibility (config-only)
Additional markets (gated on **D10**) require **only** new `tax_rates` rows + a per-market `inclusive_default`/config entry — **zero application-code change**. Demonstrate this with a non-Nigeria sample seed in the test fixture (not shipped to prod) that computes correctly without touching `compute_tax`.

### S7 — Vendor-adapter seam (future-ready, not active)
Define `packages/pricing/src/tax/adapter.ts`:

```ts
export interface TaxEngineAdapter {
  compute(input: TaxInput): Promise<TaxResult>;
}
export class InternalTaxAdapter implements TaxEngineAdapter { /* wraps compute_tax */ }
```

`InternalTaxAdapter` is the only implementation wired. A future Avalara/TaxJar adapter drops in behind the same interface without changing a single caller. Do **not** build the vendor adapter now — the seam only.

### S8 — Telemetry
Emit: `henry.tax.computation.completed`, `henry.tax.exemption.applied`, `henry.tax.rate.missing`. Each carries `country`, `product_category`, `buyer_type`, `rate_basis_points`, `rate_id` (no PII, no raw amounts beyond the minor-unit total class needed for ops).

## Out of scope
- **Per-state US sales tax** depth (only if D10 commits the US market).
- **The active vendor adapter** (Avalara/TaxJar) — seam only (S7).
- **Tax-filing / remittance automation** — manual remit per the finance process; V3-22 surfaces "tax owed" for the accountant.
- **Receipt/invoice PDF layout** — V3-18 owns the template; this pass supplies the tax line data it renders.
- **Multi-currency FX of the tax line** — `@henryco/pricing` exchange-rate handling is inherited, not extended here.

## Dependencies
Requires V3-13 (payment record schema to attach the split to) and V3-17 (ledger `tax_payable` account). **Blocks V3-22** (finance dashboard "tax owed" tile) and **V3-84** (global localization extends per-market tax). Feeds V3-18 (receipt tax line) and V3-20 (tax on subscription renewals).

## Inheritance
`@henryco/pricing` (integer-minor-unit primitives — `currency-model.ts`, `currency-sanity.ts`, `exchange-rate.ts`), the V3-17 double-entry ledger (`tax_payable` liability account), the V3-13 payment record, and `@henryco/observability` for telemetry + audit.

## Implementation requirements

### Files
- `apps/hub/supabase/migrations/<ts>_tax_engine.sql` — S1 + S2 (+ ledger `tax_payable` account if V3-17 didn't already define it).
- `packages/pricing/src/tax/compute-tax.ts` — S3 engine.
- `packages/pricing/src/tax/adapter.ts` — S7 seam + `InternalTaxAdapter`.
- `packages/pricing/src/tax/index.ts` + `packages/pricing/src/index.ts` — exports.
- `packages/pricing/src/tax/__tests__/compute-tax.test.ts` — S3/S5 test suite.
- Integration touch-points in the V3-13 charge path and V3-20 subscription path to persist the split (coordinate column names with those passes).

### Trust / safety / compliance
- **Nigeria VAT registration (L2)** verified; `authority_name` + `authority_ref` stored on every rate for the audit trail.
- Tax is computed and stored in **integer minor units** — no float in money math anywhere in the path.
- Rates are **versioned, never mutated** — supersede via `effective_to` + new row.
- `compute_tax` is **server-only**; the client renders the returned `TaxResult`, never recomputes.
- Tax posts to a **separate `tax_payable` ledger account** so remittance reconciles independently of revenue.
- `@henryco/observability/audit-log` on any route that seeds/edits `tax_rates`.

### Mobile + desktop parity
Computation is server-side; both web (mobile + desktop) and the Expo super-app render the returned tax line identically through their respective receipt/checkout surfaces. No client-side tax math on any platform.

### i18n
The tax **label** is localized through `@henryco/i18n` — namespace `surface:payments` (keys `tax.vat`, `tax.gst`, `tax.salesTax`, `tax.label`) so the line reads "VAT" / "TVA" / "IVA" / "GST" per locale. Status and error copy (`tax.rateMissing`, `tax.exempt`) are translated. 12 locales; zero hardcoded user-facing strings. The basis-point rate is formatted per locale via `@henryco/pricing`/`@henryco/i18n` number formatting.

### Brand & design system
Any tax line rendered on a receipt/invoice inherits the V3-18 branded template whose legal entity is **"Henry Onyx Limited"** (CAC-registered — required for Paystack/VAT compliance), read from `@henryco/config`; brand "Henry Onyx" never hardcoded. No domains hardcoded. Where the tax line appears in UI, it uses the locked design-system tokens, light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed.

## Validation gates
1. **Standard CI** — `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` green; i18n hardcoded-string scanner green.
2. **Nigeria VAT smoke** — 100 sample products + services (standard category) compute exactly 7.5% in integer minor units; rounding rule asserted at the kobo.
3. **Exempt category** — food / medical / educational samples return `taxMinor=0`, `exemptApplied=true`.
4. **B2B rule** — business-buyer inputs apply the configured reverse-charge / zero-rate where required.
5. **Inclusive vs exclusive** — both display paths produce the correct `totalMinor` and a visible tax line.
6. **Rate-missing degradation** — an unknown jurisdiction returns zero + emits `henry.tax.rate.missing` (no throw).
7. **Receipt rendering** — the V3-18 receipt shows the correct tax amount + rate + localized label.
8. **Config-only market add** — the fixture's non-NG seed computes without code change (proves S6).
9. **Ledger** — tax posts to `tax_payable`; sum equals computed tax for the soak cohort.

## Deployment gate
All gates green; D5 answer confirmed in `DECISIONS-REQUIRED.md`; V3-13 + V3-17 merged. **Accountant review of the tax-rate seed data** before merge. **30-day soak**, reconciling the `tax_payable` ledger total against the accountant's expected VAT remittance with zero discrepancy before general enablement.

## Final report contract
`.codex-temp/v3-21-payments-tax-engine/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion.

## Self-verification
- [ ] S1 `tax_rates` catalog uses integer basis points, is versioned (no mutation), and stores authority refs.
- [ ] S2 Nigeria VAT (750 bp) + exempt categories seeded with FIRS authority references.
- [ ] S3 `compute_tax` is pure, integer-only, deterministic precedence, B2B-aware, degrades to zero on missing rate.
- [ ] S4 every billed flow persists `subtotal_minor`/`tax_minor`/`total_minor`/`tax_rate_id`; tax posts to `tax_payable` ledger.
- [ ] S5 inclusive vs exclusive display correct on both paths; explicit tax line always shown.
- [ ] S6 a new market is a config/seed-only change (proven by fixture).
- [ ] S7 `TaxEngineAdapter` seam exists with `InternalTaxAdapter` only.
- [ ] S8 three `henry.tax.*` telemetry events emit with no PII.
- [ ] Tax label localized via `@henryco/i18n` (`surface:payments`); no hardcoded strings/domains; receipt legal entity = "Henry Onyx Limited".
- [ ] Accountant verified the seed; report written with all 9 sections.
