# V3-19 — Payments: Refunds & Reconciliation

**Pass ID:** V3-19 | **Phase:** C | **Pillar:** P2
**Deps:** V3-14, V3-15, V3-16, V3-17 | **Effort:** L | **Parallel:** NO | **Owner gate:** none | **Risk:** Money

## Role
V3 Refunds engineer. Execute, then stop.

## Project
Standard.

## Audit summary
Refund flow not yet provider-agnostic. PRODUCT-GAP-LEDGER: refund policy not consistently published. V3 vision P2 specifies "Refunds, receipts, branded invoices" + "Webhook verification + reconciliation".

## Mandatory scope

1. **Refund initiation API** at `apps/account/app/api/payments/refunds/route.ts`:
   - User-initiated: refund window per policy (default 14 days, configurable per division).
   - Staff-initiated: any payment_intent, with reason + audit log.
   - Calls `router.refundPayment(intent_id, amount_minor, reason)`.
   - Creates `refund_requests` row.

2. **`refund_requests` schema**:
   ```sql
   CREATE TABLE refund_requests (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     payment_intent_id UUID REFERENCES payment_intents NOT NULL,
     amount_minor BIGINT NOT NULL,
     reason TEXT,
     status TEXT NOT NULL DEFAULT 'pending'
       CHECK (status IN ('pending','approved','processing','succeeded','failed','rejected')),
     requested_by UUID REFERENCES auth.users,
     reviewed_by UUID,
     provider_refund_id TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   ```

3. **Approval workflow** (uses V3-43 workflow engine):
   - Auto-approve: refunds within policy window + threshold (e.g., < $50 USD or local equivalent).
   - Staff-review: refunds outside policy or above threshold.
   - Staff sees refund queue in staff workspace.

4. **Reconciliation engine** (extends V3-17 ledger reconcile):
   - For each refund: ledger entries created (debit platform_revenue + escrow_pool, credit user_wallet or original payment method).
   - Daily reconciliation matches provider-reported refunds with internal refund_requests.
   - Discrepancy → owner alert.

5. **Dispute tracking**:
   - When a payment provider reports a chargeback (`charge.dispute.created` on Stripe / equivalent on Paystack + Flutterwave), automatically create dispute row.
   - Notify trust-staff.
   - Track dispute outcome.
   - Dispute response surface for staff to upload evidence (calls provider API).

6. **Telemetry** — `henry.refund.requested`, `henry.refund.approved`, `henry.refund.processed`, `henry.refund.failed`, `henry.dispute.created`, `henry.dispute.responded`.

## Out of scope
- Refund policy authoring UI (L18 handles published policy).
- Subscription proration on cancel (V3-20).
- Tax refund computation (V3-21).

## Dependencies
V3-14, V3-15, V3-16 (providers), V3-17 (ledger). Blocks V3-22 (finance dashboard).

## Inheritance
Router; payment_intents; ledger_entries; workflow engine.

## Trust / safety / compliance
- L18 refund/dispute policy published.
- ANTI-CLONE Principle 12 — every refund + dispute audited.
- Sensitive-action guard from V3-02 on staff refund approval.

## Mobile + desktop parity
Refund UI responsive; user requests refund from order detail surface.

## i18n
Refund reason templates + status copy via @henryco/i18n.

## Validation gates
1. Standard CI.
2. **End-to-end refund per provider** — test-mode for Stripe + Paystack + Flutterwave.
3. **Auto-approve threshold** — refund under threshold auto-approves.
4. **Reconciliation pass** — synthetic refund + verify ledger balance.
5. **Dispute test** — Stripe test dispute → row created + staff notified.

## Deployment gate
- 7-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Refund initiation API + schema.
- [ ] Auto-approve + staff-review paths.
- [ ] Reconciliation engine.
- [ ] Dispute tracking with all 3 providers.
- [ ] 6 new telemetry events.
- [ ] L18 policy linked.
- [ ] Report written.
