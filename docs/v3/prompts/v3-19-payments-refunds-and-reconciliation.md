# V3-19 — Money & Identity Spine: Payments Refunds and Reconciliation

**Pass ID:** V3-19  ·  **Phase:** C (Money & Identity Spine)  ·  **Pillar:** P2 (Payments & Wallet)
**Dependencies:** V3-14 (Stripe), V3-15 (Paystack — shipped), V3-16 (Flutterwave), V3-17 (ledger)  ·  **Effort:** L  ·  **Parallel-safe:** N
**Owner gate:** none  ·  **Risk class:** Money

---

## Role
You are the V3 refunds engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass builds the provider-agnostic refund lifecycle and the reconciliation engine that keeps internal money truth aligned with what payment providers actually did: a refund initiation API (user- and staff-driven), an approval workflow with policy-windowed auto-approval, ledger postings for every refund, a daily reconciliation that matches provider-reported refunds against internal records, and chargeback/dispute tracking with a staff evidence-response surface. The line you must not cross: a refund is only ever recorded as money-moved once the provider confirms it — refunds post balanced ledger entries (via V3-17), are gated by `requireSensitiveAction` on staff approval, and every refund and dispute is audit-logged. No optimistic refund crediting.

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/19-payments-refunds-and-reconciliation` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
The refund flow is **not yet provider-agnostic** and there is no reconciliation engine for refunds or disputes. The money substrate exists: `@henryco/payment-router` (V3-13, PR #169) is the vendor-agnostic interface; V3-15 wired **Paystack live** (hosted-redirect, webhook-reconciled, PR #170) — the live refund rail; V3-14 (Stripe) and V3-16 (Flutterwave) are queued, so this pass routes all three through the router with Paystack as the only currently-live provider and the others behind their capability flags. V3-17 supplies the double-entry ledger (`ledger_entries`, `record_ledger_entry()`, the `refund_pending`/`escrow_pool`/`platform_revenue`/`user_wallet` account types) and `daily_balance_snapshots`. The wallet substrate is `customer_wallet_transactions` (`amount_kobo BIGINT`, `currency`, `direction`, `status`) and `customer_wallet_funding_requests`. RLS staff predicate is `is_staff_in(division, role)` — `is_staff_in('finance', null)` / `is_staff_in('trust', null)` gate the queues. The sensitive-action guard `requireSensitiveAction` (server) / `fetchWithSensitiveAction` (client) from V3-02 gates destructive money actions. Per PRODUCT-GAP-LEDGER, refund policy is not consistently published (the L18 policy that this surface references). This pass closes the gap: a `refund_requests` table + initiation API + approval workflow + a reconciliation engine extending V3-17's daily run + dispute tracking with a staff response surface.

## Mandatory scope

### S1 — `refund_requests` schema
Create `apps/hub/supabase/migrations/<ts>_v3_19_refunds.sql`.

```sql
create table if not exists public.refund_requests (
  id                 uuid primary key default gen_random_uuid(),
  source_kind        text not null,                 -- 'order_capture','subscription','ai_usage', ...
  source_ref         text not null,                 -- intent/order id the refund is against
  wallet_tx_id       uuid references public.customer_wallet_transactions(id),
  provider           text not null,                 -- 'paystack' | 'stripe' | 'flutterwave' | 'wallet'
  amount_minor       bigint not null check (amount_minor > 0),
  currency           text not null,
  reason             text,
  status             text not null default 'pending'
                     check (status in ('pending','approved','processing','succeeded','failed','rejected')),
  destination        text not null default 'original'
                     check (destination in ('original','wallet')),  -- refund to source or wallet credit
  requested_by       uuid references auth.users(id),
  reviewed_by        uuid references auth.users(id),
  reviewed_at        timestamptz,
  provider_refund_id text,                           -- provider's refund reference (reconciliation key)
  posting_id         uuid,                           -- ledger posting that recorded the refund
  idempotency_key    text not null unique,           -- one refund attempt per (source_ref, amount, request)
  created_at         timestamptz not null default timezone('utc', now()),
  updated_at         timestamptz not null default timezone('utc', now())
);
```
RLS: requester reads own (`requested_by = auth.uid()`); finance staff read/manage all (`is_staff_in('finance', null)`); no direct client status mutation — transitions flow through the API + workflow handler (service-role). A partial unique index prevents a second succeeded refund exceeding the captured amount.

### S2 — Refund initiation API
`apps/account/app/api/payments/refunds/route.ts`:
- **User-initiated** (`POST`): refund window per policy (default 14 days, configurable per division via `@henryco/config`); validates the payment belongs to the caller; creates a `refund_requests` row with an `idempotency_key`.
- **Staff-initiated**: any payment, with mandatory `reason`, gated by `requireSensitiveAction` and audit-logged.
- Calls `router.refundPayment({ provider, sourceRef, amountMinor, currency, idempotencyKey, reason })` only after approval (S3). For the live Paystack rail this issues the provider refund; for not-yet-live providers it remains in `pending` behind the capability flag.
- Returns the request id + status; never exposes provider secrets.

### S3 — Approval workflow
Implement via the V3-43 workflow engine once shipped; standalone handler until then:
- **Auto-approve** when the request is within the policy window **and** under the per-division threshold (default `< 50 USD` equivalent, configurable). Auto-approved requests transition `pending → approved → processing` and call `router.refundPayment(...)`.
- **Staff-review** otherwise: refunds outside policy or above threshold land in a finance-staff queue surface (in the staff workspace), where approval requires `requireSensitiveAction` and is audit-logged. Approval triggers the same router call.
- The router call is idempotent on `idempotency_key`; a provider webhook (`refund.processed` / Paystack equivalent) flips `processing → succeeded` and records `provider_refund_id`.

### S4 — Ledger postings for refunds
On `succeeded`, post a balanced refund posting through V3-17's `record_ledger_entry()` (set `posting_id` on the refund row):
- `destination = 'original'`: debit `platform_revenue` + `escrow_pool`, credit `provider_clearing` (funds returning to the buyer's source).
- `destination = 'wallet'`: debit `platform_revenue` + `escrow_pool`, credit the buyer's `user_wallet` (and write the matching `customer_wallet_transactions` credit).
Every posting nets to zero per currency. Refunds never recompute the original total — they reference the captured posting.

### S5 — Reconciliation engine
Extend `scripts/v3/ledger-reconcile.mjs` (V3-17) with a refund pass that runs in the same daily 02:00 Africa/Lagos job:
1. For each provider, list provider-reported refunds for the window and match each against a `refund_requests` row by `provider_refund_id`.
2. Flag any provider refund with no internal record (or vice versa) as a discrepancy → owner alert via `@henryco/observability` audit-log + owner-alert channel, with provider, ref, and delta in minor units.
3. Assert refund ledger postings balance per currency (inherits S4).
Emit `henry.refund.reconciliation.passed` / `henry.refund.reconciliation.discrepancy` per run.

### S6 — Dispute / chargeback tracking + response surface
Create `payment_disputes` (`provider`, `provider_dispute_id` unique, `source_ref`, `amount_minor`, `currency`, `status`, `reason_code`, `due_by`, `evidence`, `outcome`, timestamps). On a provider chargeback webhook (`charge.dispute.created` on Stripe / Paystack + Flutterwave equivalents, routed through the router's normalized dispute event), automatically insert a dispute row and notify trust-staff (`is_staff_in('trust', null)`) via `@henryco/notifications-ui`. Build a staff **dispute response surface** (in the staff workspace) where trust-staff upload evidence and submit a response — the submit calls the provider's dispute-evidence API through the router and is gated by `requireSensitiveAction` + audit-logged. Track `outcome` (`won`/`lost`) when the provider resolves it.

### S7 — Telemetry
Emit via `@henryco/observability`: `henry.refund.requested`, `henry.refund.approved`, `henry.refund.processed`, `henry.refund.failed`, `henry.dispute.created`, `henry.dispute.responded`, plus the two reconciliation events from S5. Audit-log every refund approval and dispute response as sensitive money events.

## Out of scope
- Refund/dispute **policy authoring** UI — the published policy is L18; this surface references it via `henryWebRoot('/refunds')`.
- Subscription proration on cancel — V3-20.
- Tax-refund computation — V3-21 (refund tax handling defers to it; this pass refunds the captured total).
- Credit-note PDF rendering — reuses V3-18's document engine; this pass requests the credit note, does not build the renderer.
- Provider SDK wiring itself — V3-14 / V3-15 (shipped) / V3-16 (this pass consumes `router.refundPayment` + normalized dispute events).
- The base ledger + daily reconciliation harness — V3-17 (this pass extends it).

## Dependencies
Depends on V3-14, V3-15 (shipped), V3-16 (provider refund + dispute capability via the router) and V3-17 (ledger postings + reconciliation harness). **Blocks** V3-22 (finance dashboard reports refunds + disputes). This pass is **not parallel-safe** — it mutates the shared reconciliation job and the ledger account taxonomy and must land after the provider passes and the ledger are stable.

## Inheritance
Builds on: `@henryco/payment-router` (`refundPayment`, normalized dispute events, capability registry), V3-17 `record_ledger_entry()` + `daily_balance_snapshots` + `ledger-reconcile.mjs`, `customer_wallet_transactions`, `is_staff_in(division, role)` RLS predicate, `requireSensitiveAction`/`fetchWithSensitiveAction` (V3-02), `@henryco/observability` audit-log, `@henryco/notifications-ui`, and V3-18's document engine for credit notes.

## Implementation requirements

### Files
- `apps/hub/supabase/migrations/<ts>_v3_19_refunds.sql` — `refund_requests` + `payment_disputes` + RLS + idempotency indexes (S1, S6).
- `apps/account/app/api/payments/refunds/route.ts` — initiation API (S2).
- `apps/account/app/api/payments/refunds/[id]/route.ts` — status + cancel.
- Refund approval workflow handler (workflow-engine handler or standalone) (S3).
- Webhook handler extension for `refund.processed` + `charge.dispute.created` normalized events (S3, S6).
- `scripts/v3/ledger-reconcile.mjs` — refund reconciliation pass (S5).
- Staff refund queue + dispute response surface in the staff workspace app (S3, S6).
- `packages/payment-router/src/refunds.ts` (if not already present from V3-13) — `refundPayment` typing surfaced.

### Trust / safety / compliance
- Money truth: refunds post balanced ledger entries only on provider confirmation; integer minor units; idempotent via `idempotency_key` + `provider_refund_id`. A succeeded refund can never exceed the captured amount (DB constraint + check at approval).
- `requireSensitiveAction` on every staff refund approval and dispute-evidence submission; `fetchWithSensitiveAction` on the client side.
- Every refund and dispute audit-logged via `@henryco/observability/audit-log`.
- Reconciliation discrepancies alert the owner with provider + ref + delta.
- The L18 refund/dispute policy is referenced on the refund surface and receipt footer via `@henryco/i18n` + `henryWebRoot('/refunds')` — no hardcoded URL.

### Mobile + desktop parity
The user-facing refund request is initiated from the order/booking detail surface — responsive on web mobile (safe-area, single primary action) and the Expo super-app. The staff refund queue and dispute response surface are operator (staff workspace) surfaces, desktop-first but functional on tablet.

### i18n
Namespace `surface:payments` (`@henryco/i18n`). Refund reason templates, status copy (`pending`/`approved`/`processing`/`succeeded`/`failed`/`rejected`), dispute status, user-facing errors, and email/notification copy are translated across all 12 locales. No hardcoded user-facing string. Operator-surface staff strings route through `@henryco/i18n` per the V3-07b operator-surface convention.

### Brand & design system
Any user-facing refund surface uses Henry Onyx brand via `@henryco/config` and the locked design-system tokens (`--site-*`/`--accent`, per-division accent), Fraunces for editorial chrome, light + dark, CLS ≈ 0, contrast not regressed. Credit-note documents reuse V3-18's "Henry Onyx Limited" issuer. Zero hardcoded domains/strings.

## Validation gates
1. **Standard CI** green: `pnpm -w typecheck`, `pnpm -w lint`, `pnpm -w test`, `pnpm -w build`.
2. **End-to-end refund per provider** (test-mode): Paystack (live rail), Stripe, Flutterwave — request → approve → `router.refundPayment` → webhook → `succeeded` → balanced ledger posting.
3. **Auto-approve threshold**: a refund within window + under threshold auto-approves; one outside policy or over threshold lands in the staff queue and requires `requireSensitiveAction`.
4. **Reconciliation pass**: synthetic refund reconciles clean; an injected unmatched provider refund raises a discrepancy + owner alert.
5. **Idempotency**: replaying a refund webhook or re-posting the same `idempotency_key` records no duplicate refund and no duplicate ledger posting.
6. **Dispute test**: a provider test chargeback creates a `payment_disputes` row, notifies trust-staff, and the evidence-submit path calls the provider API behind `requireSensitiveAction`.
7. **RLS verification**: requester reads only own refunds; finance staff manage all; non-staff cannot transition status. Verified against live RLS.
8. **i18n gate**: hardcoded-text scanner passes; refund status copy resolves from `surface:payments` in a non-English locale.

## Deployment gate
- All gates green; migration applied; RLS verified.
- Refund reconciliation pass live inside the daily job and observed to run once clean against production data.
- **7-day soak**: monitor real refund + dispute flow — every refund reconciles, no duplicate refunds under webhook replay, no unexplained discrepancy across 7 consecutive reconciliation runs.

## Final report contract
`.codex-temp/v3-19-payments-refunds-and-reconciliation/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline (the 6 `henry.refund.*`/`henry.dispute.*` + 2 reconciliation events) · deferred items · pass-closure assertion. Record which providers are live (Paystack) vs flag-gated (Stripe/Flutterwave) at ship time.

## Self-verification
- [ ] `refund_requests` + `payment_disputes` applied with RLS, idempotency keys, and the over-refund guard (S1, S6).
- [ ] Refund initiation API supports user- and staff-initiated paths; staff path gated by `requireSensitiveAction` + audit-logged (S2).
- [ ] Auto-approve (in-window + under-threshold) and staff-review (out-of-policy/over-threshold) paths both work; approval calls `router.refundPayment` idempotently (S3).
- [ ] Refunds post balanced ledger entries via `record_ledger_entry()` only on provider confirmation; `posting_id` recorded (S4).
- [ ] Reconciliation pass matches provider-reported refunds to internal records and alerts the owner on any discrepancy (S5).
- [ ] Dispute tracking auto-creates rows from chargeback webhooks across all 3 providers, notifies trust-staff, and the evidence-response surface submits through the provider API behind `requireSensitiveAction` (S6).
- [ ] All 8 telemetry events emit; refund + dispute copy fully translated via `surface:payments`; hardcoded-text gate green (S7, i18n).
- [ ] No hardcoded domain/string; credit notes + policy links resolve via `@henryco/config`/`henryWebRoot`; 7-day soak clean; report written.
