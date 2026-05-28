# V3-21 — Payments: Tax Engine

**Pass ID:** V3-21 | **Phase:** C | **Pillar:** P2, P7
**Deps:** V3-13, V3-17 | **Effort:** XL | **Parallel:** YES | **Owner gate:** D5 | **Risk:** Money, Compliance

## Role
V3 Tax engineer. Execute, then stop.

## Project
Standard.

## Audit summary
No tax computation engine today. Owner decision D5 recommends roll-our-own thin engine for Nigeria-primary V3 (NGN VAT flat 7.5%), with vendor integration later.

## Mandatory scope

1. **`tax_rates` catalog**:
   ```sql
   CREATE TABLE tax_rates (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     country TEXT NOT NULL,
     region TEXT, -- state/province; NULL for country-wide
     product_category TEXT NOT NULL DEFAULT 'standard', -- standard / digital / services / food / etc.
     rate_percent NUMERIC(5,4) NOT NULL,
     effective_from DATE NOT NULL,
     effective_to DATE,
     authority_name TEXT NOT NULL,
     authority_ref TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   ```

2. **Seed Nigeria VAT**:
   - Standard rate 7.5%, effective from VAT Act amendment date.
   - Exempt categories per FIRS guidance.

3. **`compute_tax` function**:
   - Input: amount, currency, country, region, product_category, buyer_type (consumer/business).
   - Output: { tax_amount, tax_rate_applied, tax_breakdown }.
   - Considers exemptions, B2B vs B2C rules.
   - Returns zero for non-tax-jurisdictions.

4. **Integration with payment_intents**:
   - Each intent stores `subtotal_minor`, `tax_minor`, `total_minor`.
   - Tax line shown in receipts (V3-18).

5. **Tax-included vs tax-excluded display rules**:
   - Per-country config: Nigeria typically tax-included display; UK/EU typically tax-included; US typically tax-excluded.
   - Customer sees tax line at checkout regardless.

6. **Per-country override**:
   - If owner future-commits to additional markets (D10), config-only changes seed tax_rates for that market.

7. **Vendor integration adapter** (future-ready):
   - `TaxEngineAdapter` interface for plugging in Avalara/TaxJar later.
   - For now, internal compute is the only implementation.

8. **Telemetry** — `henry.tax.computed`, `henry.tax.exempt_applied`, `henry.tax.rate_missing`.

## Out of scope
- Per-state US sales tax (only if D10 commits to US).
- Vendor integration (placeholder adapter only).
- Tax filing automation (manual remit per L2).

## Dependencies
V3-13, V3-17. Blocks V3-22, V3-84 (global localization extends to per-market tax).

## Inheritance
@henryco/pricing for amount-handling primitives.

## Trust / safety / compliance
- L2 — Nigeria VAT registration verified.
- Authority refs stored for audit trail.
- ANTI-CLONE Principle 12.

## Mobile + desktop parity
Server-side compute; client renders the result.

## i18n
Tax labels per locale ("VAT" / "TVA" / "IVA" / etc.).

## Validation gates
1. Standard CI.
2. **Nigeria VAT smoke** — 100 sample products + services compute correctly.
3. **Exempt category test** — food/medical/etc. zero VAT.
4. **B2B rule** — reverse-charge or zero where applicable.
5. **Receipt rendering** — tax line shows correct amount + rate.

## Deployment gate
- Accountant review of tax-rate seed data.
- 30-day soak; reconcile against accountant's expected VAT remittance.

## Final report contract
Standard.

## Self-verification
- [ ] Schema + seed data.
- [ ] compute_tax function tested.
- [ ] Integration with payment_intents.
- [ ] Receipt + invoice display tax line.
- [ ] Vendor adapter interface ready.
- [ ] 3 new telemetry events.
- [ ] Accountant verified.
- [ ] Report written.
