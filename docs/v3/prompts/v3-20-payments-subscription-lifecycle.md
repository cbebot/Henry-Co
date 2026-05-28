# V3-20 — Payments: Subscription Lifecycle

**Pass ID:** V3-20 | **Phase:** C | **Pillar:** P2
**Deps:** V3-13, V3-17 | **Effort:** L | **Parallel:** YES | **Owner gate:** D9 partial | **Risk:** Money

## Role
V3 Subscriptions engineer. Execute, then stop.

## Project
Standard.

## Audit summary
Per PRODUCT-GAP-LEDGER: `customer_subscriptions` exists but 0 rows. V3 vision P2: "Subscription lifecycle." V3-08 truthful-empty-state addresses the 0-row issue UX-wise; this pass makes subscriptions real for any premium tier.

## Mandatory scope

1. **`subscriptions` schema** (canonical; supersedes earlier `customer_subscriptions` per shared-ledger pattern):
   ```sql
   CREATE TABLE subscriptions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users NOT NULL,
     plan_id TEXT NOT NULL,
     status TEXT NOT NULL CHECK (status IN ('trial','active','past_due','grace','canceled','expired')),
     trial_ends_at TIMESTAMPTZ,
     current_period_start TIMESTAMPTZ NOT NULL,
     current_period_end TIMESTAMPTZ NOT NULL,
     canceled_at TIMESTAMPTZ,
     paused_until TIMESTAMPTZ,
     provider_subscription_id TEXT,
     provider TEXT NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   ```

2. **`subscription_plans` catalog** (owner-curated):
   - HenryCo Premium (monthly + yearly)
   - Per-division tiered plans (Marketplace seller premium, Studio agency, etc.)
   - Per D9 monetization rates.

3. **State machine**:
   - `trial → active` (on first charge)
   - `active → past_due → grace → canceled` (on payment failure → dunning)
   - `active → canceled` (user-initiated; access continues until current_period_end)
   - `canceled → expired` (automatic at period_end)

4. **Dunning workflow** (V3-43 workflow engine handler):
   - Day 1 past_due: retry charge.
   - Day 3: retry + email reminder.
   - Day 7: retry + grace period started.
   - Day 14: cancel access.

5. **Provider integration**:
   - Stripe Billing (subscriptions native).
   - Paystack Plans (subscriptions native).
   - Flutterwave Recurring (subscriptions native).
   - Each provider's webhooks map to subscription state changes.

6. **User self-service** at `apps/account/app/(account)/subscription/`:
   - View current plan.
   - Pause/resume.
   - Cancel (with confirmation + reason).
   - Change plan.
   - Update payment method.

7. **Telemetry** — `henry.subscription.trial_started`, `henry.subscription.activated`, `henry.subscription.payment_failed`, `henry.subscription.canceled`, `henry.subscription.expired`, `henry.subscription.plan_changed`.

## Out of scope
- Premium feature gating logic per plan (per-feature in respective pillar passes).
- Tax computation on subscription (V3-21).
- Finance dashboard subscriber metrics (V3-22).

## Dependencies
V3-13, V3-17 + provider activations. Blocks V3-22.

## Inheritance
Router; ledger; workflow engine; @henryco/branded-documents for renewal invoices.

## Trust / safety / compliance
- L18 cancellation policy published.
- Auto-cancellation only after grace period.
- Sensitive-action guard on plan change (V3-02).
- ANTI-CLONE Principle 12.

## Mobile + desktop parity
Self-service UI responsive.

## i18n
Subscription state + plan copy via @henryco/i18n.

## Validation gates
1. Standard CI.
2. **Lifecycle e2e** — trial → active → past_due → grace → canceled (test-mode per provider).
3. **Dunning workflow** — payment failure triggers retry sequence.
4. **Self-service** — pause + resume + cancel + change plan all work.

## Deployment gate
- 14-day soak with internal-team subscriber.

## Final report contract
Standard.

## Self-verification
- [ ] Schema + plans catalog.
- [ ] State machine implemented.
- [ ] Dunning workflow live.
- [ ] All 3 providers integrated.
- [ ] Self-service UI shipped.
- [ ] 6 new telemetry events.
- [ ] Report written.
