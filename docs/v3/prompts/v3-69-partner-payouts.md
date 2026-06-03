# V3-69 — Partner & Enterprise: Partner Payouts

**Pass ID:** V3-69  ·  **Phase:** H (Partner & Enterprise)  ·  **Pillar:** P8 (Partner & Enterprise Ecosystem), P2 (Payments)
**Dependencies:** V3-67 (partner onboarding), V3-14 (Stripe), V3-15 (Paystack), V3-16 (Flutterwave)  ·  **Effort:** XL  ·  **Parallel-safe:** N
**Owner gate:** D9 (monetization rates per division)  ·  **Risk class:** Money / Compliance

---

## Role
You are the V3 Payouts engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This is the highest-stakes pass in Phase H: it moves real money OUT of the company to partners — scheduled payouts across per-country rails, with chargeback-hold periods, tax withholding, annual tax statements, and bank-account capture behind a re-auth wall. The line you must not cross: every payout amount is computed from the **double-entry ledger truth (V3-17)**, never from optimistic UI state; you never pay an amount that isn't releasable; you never bypass an idempotency key, a webhook reconciliation, or a sensitive-action guard. **Owner gate D9** sets the take rates that determine releasable balance — read its current answer before writing any rate-dependent surface.

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/69-partner-payouts` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Owner gate (read before starting)
This pass is gated on **D9 (monetization rates per division)** in `docs/v3/DECISIONS-REQUIRED.md`. D9 fixes the per-division take rates that define the partner's releasable balance (the amount you pay out). **Read the current answer in `docs/v3/DECISIONS-REQUIRED.md` before building any rate-dependent surface; confirm it, do not re-litigate it.** If D9 is still unanswered when you start, build the payout *engine, rails, scheduling, tax, and dashboards* against a config-sourced rate table (`@henryco/config` / a `division_take_rates` table) so the rate is a single substitutable value — and hold the live-money switch until the owner answer lands. Provider activation order (Nigeria-first, Paystack + Flutterwave) is governed by **D1** (recorded in DECISIONS-REQUIRED.md) and inherited from V3-14/15/16.

## Audit summary
The money spine this pass stands on is already shipped: the **`@henryco/payment-router`** (V3-13) provides vendor-agnostic routing; **Paystack live** (V3-15) is webhook-reconciled; the **double-entry ledger (V3-17)** is the balance source of truth. The account app already has the user-side money rails — `apps/account/app/(account)/wallet/withdrawals/page.tsx`, `apps/account/app/api/wallet/payout-methods/route.ts`, `apps/account/app/api/wallet/withdrawal/pin/route.ts` — and the marketplace vendor workspace already models a **balance state machine** (`apps/marketplace/app/vendor/payouts/page.tsx`: held / awaiting-auto-release / releasable / requested / approved / released). `@henryco/branded-documents` already exports `VendorPayoutStatementDocument` and `VendorTaxDocumentDocument` templates. The gap: there is no **partner-scoped, cross-division payout engine** — scheduled, per-country-routed, hold-period-aware, tax-withholding, statement-generating — keyed on the V3-67 `partners.id`. This pass builds exactly that, generalizing the marketplace vendor-payout model into the partner spine and reconciling every cent against the V3-17 ledger.

## Mandatory scope

### S1 — `payouts` schema + releasable-balance truth
Add `supabase/migrations/<ts>_v3_69_partner_payouts.sql`. Amounts are integer minor units (BIGINT kobo/cents) — never floats.

```sql
CREATE TABLE payouts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id          UUID NOT NULL REFERENCES partners (id),
  amount_minor        BIGINT NOT NULL CHECK (amount_minor > 0),
  currency            TEXT   NOT NULL,                       -- ISO 4217
  destination_type    TEXT   NOT NULL CHECK (destination_type IN ('wallet','bank_transfer','mobile_money')),
  destination_ref     UUID   NOT NULL REFERENCES partner_bank_accounts (id),
  scheduled_at        TIMESTAMPTZ NOT NULL,
  hold_until          TIMESTAMPTZ NOT NULL,                  -- chargeback-risk hold window
  status              TEXT   NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','held','processing','paid','failed','reversed')),
  provider            TEXT   NOT NULL,                       -- 'paystack' | 'flutterwave' | 'stripe'
  provider_payout_id  TEXT,
  idempotency_key     TEXT   NOT NULL UNIQUE,                -- one payout per (partner, period, key)
  tax_withheld_minor  BIGINT NOT NULL DEFAULT 0,
  ledger_entry_id     UUID,                                  -- the V3-17 debit this payout settles
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
```
The releasable amount is read from the **V3-17 ledger**, not recomputed locally. A payout is only schedulable against a positive releasable balance; the payout creation writes the matching ledger debit in the same transaction (double-entry: ledger debit ↔ payout row). Reuse the marketplace held/awaiting/releasable balance state as the model.

### S2 — Payout schedules + hold periods
- Weekly default; partner may request bi-weekly or monthly (stored on `partners.capabilities` or a `payout_schedules` row).
- Hold period (3–7 days, config-sourced by partner tier — higher trust = shorter hold) before `held → processing`. Tier comes from V3-68's performance model.
- Scheduling runs on the V3-43 workflow engine (outbox + retry + idempotency); no payout is ever issued twice for the same period+key.

### S3 — Per-country payout rails (via `@henryco/payment-router`)
Route through the shipped router, never a provider SDK directly:
- **Nigeria:** Paystack Transfer (V3-15) + Flutterwave Transfer (V3-16) + direct bank transfer; router picks per the capability registry + D1 ordering.
- **International:** Stripe Connect (V3-14) when an international entity exists; otherwise route returns "unsupported market" and the payout stays `pending`.
Each provider's payout webhook is HMAC-verified and reconciled into `status` + `provider_payout_id`; status is provider-confirmed money-truth, never optimistic.

### S4 — Tax withholding + annual statements
- Withholding per partner-type + per-country rule (Nigeria WHT; config-sourced rates, integrate the V3-21 tax engine when available, else a thin rate table). Withheld amount recorded in `tax_withheld_minor` and as a separate ledger entry — never netted silently.
- Auto-generate an annual tax statement (NDPR-compliant; W-9 / equivalent for international partners) via `@henryco/branded-documents` `VendorTaxDocumentDocument` (already exported). Legal entity on every statement = **"Henry Onyx Limited"** from `COMPANY.group.legalName`, matching the CAC entity for compliance.

### S5 — Partner payout dashboard + bank-account capture
Route: `apps/account/app/(account)/partner/payouts/page.tsx`:
- Schedule + upcoming payouts + history (status, amount, withheld, provider, settlement date).
- Bank-account / mobile-money management (`partner_bank_accounts` table, **encrypted at rest**).
- Payout-method change + bank-account change.
- Tax statement + payout statement downloads (`VendorPayoutStatementDocument`, `VendorTaxDocumentDocument`).

### S6 — Sensitive-action guard on money-mutating routes
Wrap bank-account add/change, payout-method change, and manual payout-schedule change with `requireSensitiveAction` (server, `@henryco/auth`) + `fetchWithSensitiveAction` (client). The guard enforces the `hc_last_reauth` ≤ 5-minute cookie, the Upstash rate limit, and the audit-log write (V3-02). No partner changes where money lands without a fresh re-auth.

### S7 — Telemetry
Emit via `@henryco/observability/events`:
`henry.payout.scheduled`, `henry.payout.processed`, `henry.payout.failed`, `henry.payout.reversed`, `henry.payout.tax_statement.generated`, `henry.partner.bank_account.changed`.

## Out of scope
- Manual one-off / discretionary payouts → admin-only, separate tooling (not this pass).
- Cross-currency conversion math → uses the provider's FX (do not build an FX engine; that is V3-21/V3-84 territory).
- The take-rate *definition* → owner decision D9 + V3-22 finance dashboard owns reporting; this pass *consumes* the rate.
- The ledger itself → **V3-17** (this pass writes entries into it, never redefines it).

## Dependencies
Blocked by **V3-67** (partners), **V3-14 / V3-15 / V3-16** (provider activations), and reads **V3-17** ledger truth + **V3-68** tier for hold periods. **Blocks V3-71** (seller business suite payout management) and **V3-74** (logistics B2B reconciliation). Owner gate **D9**.

## Inheritance
`@henryco/payment-router` (V3-13), `@henryco/payment-surface` (status/processing primitives — style-locked), the V3-17 ledger, `@henryco/branded-documents` (`VendorPayoutStatementDocument`, `VendorTaxDocumentDocument`), `@henryco/config` (`COMPANY.group.legalName`, `countries.ts`, take-rate table), `requireSensitiveAction` / `fetchWithSensitiveAction` from `@henryco/auth` (V3-02), `@henryco/observability` (events + audit-log), the V3-43 workflow engine, and the marketplace vendor-payout balance model as the reference.

## Implementation requirements
### Files
- `supabase/migrations/<ts>_v3_69_partner_payouts.sql` — `payouts` + `partner_bank_accounts` (encrypted) + `payout_schedules` + RLS.
- `apps/account/lib/payouts/engine.ts` — releasable-balance read (ledger) + schedule resolver + idempotent issue.
- `apps/account/app/api/partner/payouts/route.ts` + `apps/account/app/api/partner/bank-accounts/route.ts` (sensitive-action-guarded).
- `apps/account/app/(account)/partner/payouts/page.tsx` + dashboard components.
- Provider payout webhook reconcilers (extend the V3-15/16/14 webhook handlers, do not fork).
- Annual tax-statement generation job (workflow handler).

### Trust / safety / compliance
Money invariants are absolute: integer minor units, idempotency key on every payout, webhook HMAC verification + reconciliation, double-entry ledger truth, status = provider-confirmed. Bank-account / mobile-money details **encrypted at rest**; RLS confines a partner to their own payouts + accounts; staff access via admin client only. Sensitive-action guard on every money-mutating route. NDPR-compliant tax handling; data residency per market. ANTI-CLONE Principles 6 (server-side money logic) + 12 (audited acceptance/change trail). Trust gates L2 + L12 + L15 verified before live ramp.

### Mobile + desktop parity
Payout dashboard responsive; bank-account capture works on mobile behind the same re-auth wall. Expo super-app: payment-surface primitives + the same guarded API; no payout action is desktop-only.

### i18n
Namespace `surface:payouts` for schedule labels, status, hold-period copy, tax notices, statement affordances, and every error. All through `@henryco/i18n`. Currency rendered with locale-aware formatting; legal-entity and tax copy translated in context (entity string still sourced from config, never hardcoded).

### Brand & design system
User-facing brand = **Henry Onyx**; legal entity on payout + tax statements = **Henry Onyx Limited** via `COMPANY.group.legalName`. Payment-surface primitives are **style-locked** — never change payment behavior from this UI. Account tokens (`--site-*` / `--accent`); Fraunces only on editorial chrome. Zero hardcoded domains. Light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed.

## Validation gates
1. CI green: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
2. Payout end-to-end in **test mode** per provider (Paystack, Flutterwave, Stripe): schedule → held → processing → paid, reconciled from webhook.
3. Idempotency: replaying a payout creation with the same `idempotency_key` does not double-pay (≈4 cases).
4. Ledger reconciliation: payout amount + tax-withheld sum to the ledger debit; releasable balance never goes negative.
5. Tax-withholding correctness per partner-type/country; `VendorTaxDocumentDocument` generated with `legalName = "Henry Onyx Limited"`.
6. Bank-account change + payout-method change reject without a fresh `hc_last_reauth` (sensitive-action guard); audit-log written.
7. RLS: partner cannot read another partner's payouts/bank accounts; encryption-at-rest verified on `partner_bank_accounts`.
8. i18n strict gate passes; `surface:payouts` registered.
9. UI: light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed.

## Deployment gate
D9 confirmed (or rate sourced from a config table pending the answer, with the live-money switch held); D1 provider ordering confirmed; V3-14/15/16 + V3-17 + V3-67 merged and live; trust gates L2 + L12 + L15 verified; **30-day soak with a small partner cohort** in test/limited-live mode before general partner payouts open; reconciliation queries clean for the full soak.

## Final report contract
`.codex-temp/v3-69-partner-payouts/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion). Live verification must include a reconciliation-clean assertion against the V3-17 ledger.

## Self-verification
- [ ] `payouts` + `partner_bank_accounts` (encrypted) + schedules migration; RLS confines self vs staff (S1).
- [ ] Releasable balance read from the V3-17 ledger; payout writes the matching double-entry debit (S1).
- [ ] Schedules + tier-keyed hold periods on the V3-43 workflow engine; no double-issue (S2).
- [ ] Per-country rails route through `@henryco/payment-router`; webhooks HMAC-verified + reconciled (S3).
- [ ] Tax withholding recorded separately; annual statement = `VendorTaxDocumentDocument` with `COMPANY.group.legalName` (S4).
- [ ] Partner payout dashboard + encrypted bank-account capture + statement downloads (S5).
- [ ] `requireSensitiveAction` on every money-mutating route; audit-logged (S6).
- [ ] 6 telemetry events emitted as `henry.payout.*` / `henry.partner.bank_account.changed` (S7).
- [ ] D9 answer read + confirmed (or rate config-sourced with live switch held); zero hardcoded domains/strings; Henry Onyx brand throughout.
- [ ] Report written with ledger-reconciliation-clean assertion.
