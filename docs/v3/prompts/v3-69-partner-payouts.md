# V3-69 — Partner Payouts

**Pass ID:** V3-69 | **Phase:** H | **Pillar:** P8, P2
**Deps:** V3-67, V3-14, V3-15, V3-16 | **Effort:** XL | **Parallel:** NO | **Owner gate:** D9 | **Risk:** Money, Compliance

## Role
V3 Payouts engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P8 + P2: "Payouts engine + tax forms + per-country rails."

## Mandatory scope

1. **`payouts` schema**:
   ```sql
   CREATE TABLE payouts (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     partner_id UUID REFERENCES partners NOT NULL,
     amount_minor BIGINT NOT NULL,
     currency TEXT NOT NULL,
     destination_type TEXT NOT NULL CHECK (destination_type IN ('wallet','bank_transfer','mobile_money')),
     destination_details JSONB NOT NULL, -- encrypted at rest
     scheduled_at TIMESTAMPTZ NOT NULL,
     status TEXT NOT NULL DEFAULT 'pending',
     provider_payout_id TEXT,
     provider TEXT NOT NULL,
     tax_withheld_minor BIGINT NOT NULL DEFAULT 0,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   ```

2. **Payout schedules**:
   - Weekly default; partner can request bi-weekly or monthly.
   - Hold period (3-7 days) for chargeback risk.

3. **Payout providers per country**:
   - Nigeria: Paystack Payout, Flutterwave Payout, direct bank transfer.
   - International: Stripe Connect (when L1 international entity exists).

4. **Tax withholding**:
   - Per partner-type + per-country rules.
   - Auto-generate W-9 / NDPR-compliant tax statement annually.
   - Branded document via @henryco/branded-documents.

5. **Partner payout dashboard**:
   - Schedule + upcoming + history.
   - Bank-account management.
   - Tax statements download.

6. **Sensitive-action guard** (V3-02) on bank-account change + payout-method change.

7. **Telemetry** — `henry.payout.scheduled`, `henry.payout.processed`, `henry.payout.failed`, `henry.payout.tax_statement.generated`.

## Out of scope
- Manual one-off payouts (require admin).
- Cross-currency conversion (uses provider's FX).

## Dependencies
V3-67 + V3-14/15/16. Blocks V3-71, V3-74.

## Inheritance
@henryco/payment-router; ledger; @henryco/branded-documents.

## Trust / safety / compliance
- L2 + L12 + L15 verified.
- Bank-account details encrypted at rest.
- Sensitive-action guard.
- ANTI-CLONE Principles 6, 12.

## Mobile + desktop parity
Partner dashboard responsive.

## i18n
Per partner locale.

## Validation gates
1. Standard CI.
2. **Payout end-to-end** test-mode per provider.
3. **Tax withholding** correctness.
4. **Tax statement** generated.
5. **Bank-account change** sensitive-action-guarded.

## Deployment gate
- 30-day soak with small partner cohort.

## Final report contract
Standard.

## Self-verification
- [ ] Schema + RLS + encryption.
- [ ] Per-country providers.
- [ ] Tax withholding + statements.
- [ ] Partner dashboard.
- [ ] Sensitive-action gates.
- [ ] 4 new telemetry events.
- [ ] Report written.
