# V3-17 — Payments: Ledger Hardening

**Pass ID:** V3-17 | **Phase:** C | **Pillar:** P2, P9
**Deps:** V3-13 | **Effort:** L | **Parallel:** YES with provider integrations | **Owner gate:** none | **Risk:** Money

## Role
V3 Ledger engineer. Execute, then stop.

## Project
Standard.

## Audit summary
Per AUDIT-BASELINE.md §1.3: D8 backlog noted wallets/care RLS issues; PR #95 wrapped auth() in RLS policies. Wallets + wallet_transactions tables exist but ledger is single-entry today. V3 vision P2 specifies "Ledger hardening" with double-entry verification + reconciliation queries + immutable audit trail.

## Mandatory scope

1. **Double-entry verification**:
   - For every transaction in `wallet_transactions`, there must exist a corresponding ledger entry that balances (sum of debits = sum of credits across the system at any time).
   - Add `ledger_entries` table:
     ```sql
     CREATE TABLE ledger_entries (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       transaction_id UUID REFERENCES wallet_transactions NOT NULL,
       account_type TEXT NOT NULL CHECK (account_type IN ('user_wallet','escrow_pool','platform_revenue','platform_fee','tax_payable','refund_pending')),
       account_id TEXT NOT NULL,
       direction TEXT NOT NULL CHECK (direction IN ('debit','credit')),
       amount_minor BIGINT NOT NULL,
       currency TEXT NOT NULL,
       created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
       immutable_at TIMESTAMPTZ NOT NULL DEFAULT now() -- guard against UPDATE via trigger
     );
     ```
   - Immutability trigger: `UPDATE` on `ledger_entries` raises exception.

2. **Reconciliation queries**:
   - `scripts/v3/ledger-reconcile.mjs` runs daily via workflow engine (V3-43 once shipped; standalone cron before then).
   - Verifies sum-of-debits = sum-of-credits per currency.
   - Verifies user_wallet balances match wallet_transactions sum.
   - Verifies escrow_pool balance matches sum of provider balances (via `getBalance` adapter calls).
   - Discrepancy → owner alert.

3. **Daily balance snapshot**:
   - `daily_balance_snapshots` table: stores per-account-type per-currency balance at end-of-day.
   - Read-optimized for finance dashboard (V3-22).

4. **Idempotency on every ledger write**:
   - Each ledger entry has `transaction_id + direction + account_type` uniqueness constraint.
   - Re-processing the same transaction is a no-op.

5. **RLS**:
   - Users read their own ledger entries (account_type = 'user_wallet', account_id = their user_id).
   - Finance-staff reads all per `is_staff_in('finance')`.
   - Owner reads all.
   - No one writes directly; only `record_ledger_entry()` SECURITY DEFINER function from payment-router + workflow handlers.

6. **Telemetry** — `henry.ledger.entry.recorded`, `henry.ledger.reconciliation.passed`, `henry.ledger.reconciliation.discrepancy`.

## Out of scope
- Provider integrations (V3-14/15/16).
- Refund engine (V3-19).
- Subscription lifecycle (V3-20).
- Tax computation (V3-21).
- Finance dashboard UI (V3-22).

## Dependencies
V3-13. Blocks V3-18, V3-19, V3-20, V3-21, V3-22, V3-27 (AI billing).

## Inheritance
Existing wallets + wallet_transactions schema; observability audit-log.

## Trust / safety / compliance
- L3 — money-handling model decided + documented (provider-escrow vs direct hold).
- L15 — AML program scoped per L3 outcome.
- Immutability triggers on ledger_entries.
- ANTI-CLONE Principle 6 + 12.

## Mobile + desktop parity
Server-side only; no client surface.

## i18n
N/A (server-only).

## Validation gates
1. Standard CI.
2. **Reconciliation test** — synthetic transactions + verify balance equation.
3. **Immutability test** — `UPDATE ledger_entries SET amount_minor=...` raises exception.
4. **Idempotency test** — re-record same entry is no-op.

## Deployment gate
- Reconciliation cron live.
- 30-day soak before declaring closure (ledger correctness needs time to surface edge cases).

## Final report contract
Standard.

## Self-verification
- [ ] ledger_entries + daily_balance_snapshots applied with RLS + immutability.
- [ ] Reconciliation script + cron.
- [ ] Idempotency enforced.
- [ ] 3 new telemetry events.
- [ ] L3 + L15 verified.
- [ ] 30-day soak clean.
- [ ] Report written.
