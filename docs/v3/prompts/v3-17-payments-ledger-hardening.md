# V3-17 — Money & Identity Spine: Payments Ledger Hardening

**Pass ID:** V3-17  ·  **Phase:** C (Money & Identity Spine)  ·  **Pillar:** P2 (Payments & Wallet), P9 (Data & Governance)
**Dependencies:** V3-13 (payment-provider-router)  ·  **Effort:** L  ·  **Parallel-safe:** N
**Owner gate:** none  ·  **Risk class:** Money

---

## Role
You are the V3 ledger engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass turns the platform's money store from a single-entry wallet log into a verifiable double-entry ledger: every value movement records balanced debit/credit entries, the entries are immutable once written, a daily reconciliation proves the books balance per currency, and a daily snapshot makes balances cheap to read. You introduce no new payment provider behavior and no user-facing surface — you build the truth layer that the refund engine (V3-19), receipts/invoices (V3-18), subscriptions (V3-20), tax (V3-21), the finance dashboard (V3-22), and AI usage billing (V3-27) all stand on. The line you must not cross: the ledger is the system of record for money truth — it is append-only, currency-exact in integer minor units, and never reports an optimistic balance the provider has not confirmed.

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/17-payments-ledger-hardening` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
The wallet today is **single-entry**. The live money tables (defined in `apps/hub/supabase/migrations/`) are: `customer_wallet_transactions` (the per-user ledger of `amount_kobo BIGINT`, `currency`, `direction`, `status`, plus the multi-currency context columns `settlement_currency`/`display_currency`/`exchange_rate`/`is_approximate_display` from `20260419120000_multi_currency_schema_foundation.sql`), `customer_wallet_funding_requests`, `customer_wallet_withdrawal_requests`, `customer_payout_methods`, plus the division order/quote tables `marketplace_orders` and `pricing_quotes` that also carry currency snapshots. Money invariants already in place: amounts are integer minor units (kobo/cents `BIGINT`), `payment_reference` carries a `UNIQUE` constraint (idempotency anchor), and `is_staff_in(division, role)` (from `20260502120000_staff_notifications_audience.sql`) is the RLS predicate for staff access. V3-13 shipped `@henryco/payment-router` (mock-only/test-gated, PR #169) and V3-15 wired Paystack live (hosted-redirect, webhook-reconciled, PR #170). What is missing: there is no counterparty accounting. When a user wallet is debited, nothing records the corresponding credit to escrow, platform revenue, fee, or tax-payable. There is no way to prove "sum of all debits = sum of all credits per currency" at any instant, no immutability guarantee on recorded money rows, and no end-of-day balance snapshot. This pass closes that gap: a `ledger_entries` table with enforced double-entry + immutability, a `record_ledger_entry()` `SECURITY DEFINER` writer, a reconciliation script that proves the books balance, and a `daily_balance_snapshots` table feeding the finance dashboard.

## Mandatory scope

### S1 — Double-entry `ledger_entries` table
Create the ledger in a new hub migration `apps/hub/supabase/migrations/<ts>_v3_17_ledger_entries.sql`. Every value movement writes **two or more** entries that net to zero per currency.

```sql
create table if not exists public.ledger_entries (
  id              uuid primary key default gen_random_uuid(),
  -- Correlates entries that belong to one balanced posting. All entries
  -- sharing a posting_id must sum to zero per currency.
  posting_id      uuid not null,
  -- Source money event. References the wallet tx that triggered the posting
  -- (nullable for system postings like opening balances).
  wallet_tx_id    uuid references public.customer_wallet_transactions(id),
  source_kind     text not null check (source_kind in (
                    'wallet_funding','wallet_withdrawal','order_capture',
                    'refund','payout','ai_usage','fee','tax','adjustment','opening_balance')),
  source_ref      text,                       -- provider ref / intent id / business key
  account_type    text not null check (account_type in (
                    'user_wallet','escrow_pool','platform_revenue',
                    'platform_fee','tax_payable','refund_pending','provider_clearing')),
  account_id      text not null,              -- user_id for user_wallet; 'global'/division for pools
  direction       text not null check (direction in ('debit','credit')),
  amount_minor    bigint not null check (amount_minor > 0),
  currency        text not null,              -- settlement currency, ISO 4217
  created_at      timestamptz not null default timezone('utc', now()),
  recorded_by     text not null default 'system'
);

-- One posting may touch the same (account_type, account_id, direction) once.
create unique index if not exists ledger_entries_idem
  on public.ledger_entries (posting_id, account_type, account_id, direction);

create index if not exists ledger_entries_account
  on public.ledger_entries (account_type, account_id, currency, created_at);
create index if not exists ledger_entries_wallet_tx
  on public.ledger_entries (wallet_tx_id);
```

Acceptance: a posting that does not balance per currency is rejected by `record_ledger_entry()` (S3). Re-posting the same `posting_id` is a no-op via the unique index.

### S2 — Immutability enforcement
The ledger is append-only. Block `UPDATE` and `DELETE` at the database, not the app.

```sql
create or replace function public.ledger_entries_guard()
returns trigger language plpgsql as $$
begin
  raise exception 'ledger_entries is append-only (% blocked)', tg_op
    using errcode = '0A000';
end;
$$;

create trigger ledger_entries_no_update
  before update or delete on public.ledger_entries
  for each row execute function public.ledger_entries_guard();
```

Corrections are made by posting a reversing entry (`source_kind = 'adjustment'`), never by mutation. Acceptance: `update public.ledger_entries set amount_minor = 1 where ...` and `delete from public.ledger_entries ...` both raise.

### S3 — `record_ledger_entry()` posting function (`SECURITY DEFINER`)
The only writer. Takes a full posting (an array of legs) and inserts atomically after verifying it balances.

```sql
create or replace function public.record_ledger_entry(
  p_posting_id uuid,
  p_source_kind text,
  p_source_ref text,
  p_wallet_tx_id uuid,
  p_legs jsonb            -- [{account_type,account_id,direction,amount_minor,currency}, ...]
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_currency text;
  v_net bigint;
begin
  -- Per-currency balance check: debits must equal credits.
  for v_currency in select distinct (leg->>'currency') from jsonb_array_elements(p_legs) leg loop
    select coalesce(sum(case when leg->>'direction' = 'debit'  then (leg->>'amount_minor')::bigint else 0 end), 0)
         - coalesce(sum(case when leg->>'direction' = 'credit' then (leg->>'amount_minor')::bigint else 0 end), 0)
      into v_net
      from jsonb_array_elements(p_legs) leg
      where leg->>'currency' = v_currency;
    if v_net <> 0 then
      raise exception 'unbalanced posting % for currency % (net=%)', p_posting_id, v_currency, v_net
        using errcode = '23514';
    end if;
  end loop;

  insert into public.ledger_entries
    (posting_id, wallet_tx_id, source_kind, source_ref, account_type, account_id, direction, amount_minor, currency)
  select p_posting_id, p_wallet_tx_id, p_source_kind, p_source_ref,
         leg->>'account_type', leg->>'account_id', leg->>'direction',
         (leg->>'amount_minor')::bigint, leg->>'currency'
  from jsonb_array_elements(p_legs) leg
  on conflict (posting_id, account_type, account_id, direction) do nothing;  -- idempotent
end;
$$;

revoke all on function public.record_ledger_entry(uuid, text, text, uuid, jsonb) from public;
grant execute on function public.record_ledger_entry(uuid, text, text, uuid, jsonb) to service_role;
```

Wire `record_ledger_entry()` into the money paths that exist today (wallet funding verification, withdrawal, order capture) so each emits a balanced posting alongside the existing `customer_wallet_transactions` write. The wiring is additive — it does not change the existing wallet write. Provide a typed `@henryco/payment-router` helper `postLedger(posting)` that calls the RPC; entries are emitted from the router so provider integrations (V3-14/15/16) and the refund engine (V3-19) reuse one path.

### S4 — RLS
```sql
alter table public.ledger_entries enable row level security;

-- Users read only their own user_wallet entries.
create policy ledger_entries_owner_read on public.ledger_entries
  for select to authenticated
  using (account_type = 'user_wallet' and account_id = auth.uid()::text);

-- Finance staff read everything.
create policy ledger_entries_finance_read on public.ledger_entries
  for select to authenticated
  using (public.is_staff_in('finance', null));

-- No INSERT/UPDATE/DELETE policy → only record_ledger_entry() (SECURITY DEFINER) writes.
```
No direct write policy exists; the immutability trigger (S2) is the second line of defense. Owner access flows through finance-staff membership.

### S5 — Reconciliation script + scheduled run
Create `scripts/v3/ledger-reconcile.mjs`. It runs daily and proves three equations, reading via the service-role client:
1. **System balance:** for each `currency`, `sum(debits) − sum(credits) = 0` across all `ledger_entries`.
2. **Wallet truth:** for each user, `sum(ledger user_wallet credits) − sum(debits)` per currency equals the user's `customer_wallet_transactions` net per currency.
3. **Escrow truth:** `escrow_pool` net per currency equals the aggregate provider-held balance reported by `router.getBalance(provider)` (Paystack live via V3-15; mock providers return their test balance).
Any discrepancy → structured owner alert through `@henryco/observability` audit-log + the owner-alert channel, with the offending `currency`, equation, and delta in minor units. Schedule via the V3-43 workflow engine once it ships; until then register a standalone Vercel cron (`apps/account` or `apps/hub`) at 02:00 Africa/Lagos. Emit a single `henry.ledger.reconciliation.passed` or `henry.ledger.reconciliation.discrepancy` event per run.

### S6 — Daily balance snapshot
Create `daily_balance_snapshots` and populate it at the end of each reconciliation run.

```sql
create table if not exists public.daily_balance_snapshots (
  id            uuid primary key default gen_random_uuid(),
  snapshot_date date not null,
  account_type  text not null,
  account_id    text not null,
  currency      text not null,
  balance_minor bigint not null,     -- signed: credits positive for asset accounts
  created_at    timestamptz not null default timezone('utc', now()),
  unique (snapshot_date, account_type, account_id, currency)
);
alter table public.daily_balance_snapshots enable row level security;
create policy dbs_finance_read on public.daily_balance_snapshots
  for select to authenticated using (public.is_staff_in('finance', null));
```
This is the read-optimized source the finance dashboard (V3-22) renders from, so it never aggregates the full ledger on the request path. Re-running for the same date is idempotent via the unique constraint.

### S7 — Telemetry
Emit, via `@henryco/observability`: `henry.ledger.entry.recorded` (per posting, with `source_kind` + currency), `henry.ledger.reconciliation.passed`, `henry.ledger.reconciliation.discrepancy`, `henry.ledger.snapshot.written`. Audit-log every reconciliation discrepancy as a sensitive event.

## Out of scope
- Provider SDK integrations and capture/charge behavior — V3-14 (Stripe), V3-15 (Paystack, shipped), V3-16 (Flutterwave).
- Refund posting logic and dispute reconciliation — V3-19 (this pass only provides `record_ledger_entry()` for it to call).
- Receipt/invoice document generation — V3-18.
- Subscription proration postings — V3-20.
- Tax computation and `tax_payable` derivation rules — V3-21 (this pass reserves the `tax_payable` account type only).
- Finance dashboard UI — V3-22 (consumes `daily_balance_snapshots`).
- AI usage debits — V3-27 (calls `record_ledger_entry()` with `source_kind = 'ai_usage'`).

## Dependencies
Depends on V3-13 (`@henryco/payment-router`, for the `postLedger` helper and `getBalance` adapter calls). **Blocks** V3-18, V3-19, V3-20, V3-21, V3-22, and V3-27 — every downstream money pass posts through `record_ledger_entry()` and/or reads `daily_balance_snapshots`.

## Inheritance
Builds on: existing `customer_wallet_transactions` / `customer_wallet_funding_requests` / `customer_wallet_withdrawal_requests` schema and the multi-currency context columns; `is_staff_in(division, role)` RLS predicate; `@henryco/payment-router` (V3-13) and its `getBalance` adapter; `@henryco/observability` audit-log and telemetry. Reuses the integer-minor-unit (`amount_kobo BIGINT`) and `UNIQUE`-reference idempotency conventions already in the money schema.

## Implementation requirements

### Files
- `apps/hub/supabase/migrations/<ts>_v3_17_ledger_entries.sql` — `ledger_entries` + immutability trigger + `record_ledger_entry()` + RLS (S1–S4).
- `apps/hub/supabase/migrations/<ts>_v3_17_balance_snapshots.sql` — `daily_balance_snapshots` + RLS (S6).
- `packages/payment-router/src/ledger.ts` — typed `postLedger(posting: LedgerPosting)` + `LedgerPosting`/`LedgerLeg` interfaces; wired into router capture/funding/withdrawal paths.
- `scripts/v3/ledger-reconcile.mjs` — reconciliation + snapshot writer (S5–S6).
- Cron registration (`apps/hub/vercel.json` or workflow-engine handler) for the 02:00 Africa/Lagos run.
- `packages/payment-router/src/__tests__/ledger.test.ts` — posting/balance/idempotency unit tests.

### Trust / safety / compliance
- Money truth: integer minor units only; per-currency balance enforced inside `record_ledger_entry()`; idempotent via `posting_id` unique index. No optimistic crediting — postings are recorded only against provider-confirmed money events.
- Append-only: DB-level immutability trigger (S2); no app code path can `UPDATE`/`DELETE` a ledger row; corrections are reversing postings.
- `record_ledger_entry()` is `SECURITY DEFINER` with `search_path = public`, executable only by `service_role`. No client ever writes the ledger.
- Audit-log every reconciliation discrepancy; owner alert on any non-zero delta.
- Document the money-handling model (provider-escrow vs direct-hold) in the report — this is the L3 decision the AML scope (L15) inherits.

### Mobile + desktop parity
N/A — this pass is server- and database-only and renders no surface. User wallet balances already shown in `@henryco/dashboard-modules-wallet` are unaffected; the ledger is an additive truth layer behind them.

### i18n
N/A for the ledger itself (no user-facing strings). The single user-facing touchpoint is the owner-alert message on a reconciliation discrepancy; route any operator-facing alert copy through `@henryco/i18n` namespace `surface:payments` rather than hardcoding it.

### Brand & design system
No rendered surface in this pass. The reserved `tax_payable`/`platform_revenue` accounting taxonomy and any operator alert text must name the legal entity **"Henry Onyx Limited"** sourced from `@henryco/config` (`COMPANY.group.legalName`), never a hardcoded string and never the retired "Henry & Co.".

## Validation gates
1. **Standard CI** green: `pnpm -w typecheck`, `pnpm -w lint`, `pnpm -w test`, `pnpm -w build`.
2. **Balance test** (≈6 cases): synthetic postings — funding, capture, fee split, multi-currency — each verified to net zero; an intentionally unbalanced posting is rejected with errcode `23514`.
3. **Immutability test** (2 cases): `UPDATE` and `DELETE` on `ledger_entries` both raise.
4. **Idempotency test**: re-calling `record_ledger_entry()` with the same `posting_id` inserts nothing the second time.
5. **RLS verification**: a user reads only their own `user_wallet` entries; a non-finance user reads zero `escrow_pool`/`platform_revenue` rows; a `finance`-staff user reads all. Verify against live RLS, not mocks.
6. **Reconciliation dry-run**: seed a known book, run `ledger-reconcile.mjs`, assert all three equations pass and a snapshot row exists per account_type/currency; then inject a 1-kobo discrepancy and assert the discrepancy event + owner alert fire.

## Deployment gate
- All validation gates green; migrations applied to the Supabase project and `pnpm supabase migration list` clean.
- Reconciliation cron live and observed to run once successfully against production data.
- **30-day soak** before declaring closure: ledger correctness surfaces edge cases only over real money flow across funding, capture, and (once V3-19 lands) refund cycles. Daily reconciliation must pass 30 consecutive runs with zero unexplained discrepancy.

## Final report contract
`.codex-temp/v3-17-payments-ledger-hardening/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline (the 4 `henry.ledger.*` events) · deferred items · pass-closure assertion. Include the documented money-handling model (L3) and the AML scope note (L15) it implies.

## Self-verification
- [ ] `ledger_entries` applied with double-entry idempotency index, RLS (owner-read + finance-read), and the append-only `UPDATE`/`DELETE` trigger (S1, S2, S4).
- [ ] `record_ledger_entry()` rejects unbalanced postings per currency, is idempotent on `posting_id`, is `SECURITY DEFINER`, and is grantable only to `service_role` (S3).
- [ ] `@henryco/payment-router` `postLedger()` wired into funding/withdrawal/capture paths additively, leaving existing `customer_wallet_transactions` writes intact (S3).
- [ ] `daily_balance_snapshots` applied with finance-read RLS and idempotent per (date, account, currency) (S6).
- [ ] `ledger-reconcile.mjs` proves all three balance equations, writes snapshots, and alerts the owner on discrepancy; scheduled at 02:00 Africa/Lagos (S5).
- [ ] All 4 `henry.ledger.*` telemetry events emit; reconciliation discrepancies are audit-logged (S7).
- [ ] No hardcoded brand string; legal entity references resolve to "Henry Onyx Limited" via `@henryco/config`.
- [ ] 30-day reconciliation soak clean; report written with L3/L15 documented.
