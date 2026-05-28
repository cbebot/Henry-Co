# V3-27 — AI Usage Billing Engine

**Pass ID:** V3-27 | **Phase:** D | **Pillar:** P4, P2, P9
**Deps:** V3-26 (AI provider router), V3-17 (ledger) | **Effort:** XL | **Parallel:** NO | **Owner gate:** D4 | **Risk:** Money

## Role
V3 AI Billing engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P4: "Usage-billed: free for company-critical tasks; metered + auto-debited from user wallet for personal-task usage. Company margin layered on top of provider cost (~10% baseline). Hard cap: when wallet hits zero, the API is not called."

## Mandatory scope

1. **`ai_task_pricing` catalog**:
   ```sql
   CREATE TABLE ai_task_pricing (
     task_class TEXT PRIMARY KEY,
     billing_mode TEXT NOT NULL CHECK (billing_mode IN ('free_company','metered_user','metered_business')),
     margin_pct NUMERIC(5,4) NOT NULL DEFAULT 0.10,
     min_charge_usd_minor BIGINT NOT NULL DEFAULT 0,
     max_charge_usd_minor BIGINT,
     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   ```

2. **Pre-call estimation + wallet check**:
   - Before invoking V3-26 router: call `estimateCost` + compute charge = cost * (1 + margin).
   - If `billing_mode = 'metered_user'`: check user wallet balance >= max(estimate, min_charge).
   - If insufficient: return error with "wallet_zero_blocked" code + suggested top-up CTA.
   - If `billing_mode = 'free_company'`: skip wallet check.

3. **Post-call charge**:
   - After router returns: compute actual cost from tokens used.
   - Charge user wallet (creates ledger entry per V3-17 conventions).
   - Update `ai_calls.billed_to` + `ai_calls.cost_usd_minor`.

4. **Idempotency**:
   - Per-call `idempotency_key` ensures retries don't double-charge.

5. **User usage dashboard** at `apps/account/app/(account)/intelligence/usage/`:
   - Daily / monthly usage chart.
   - Remaining wallet balance.
   - Per-task breakdown.
   - "Top up wallet" CTA.

6. **Hard cap enforcement**:
   - Router middleware: blocks any metered call if wallet balance < min_charge.
   - Unauthenticated users blocked from ALL metered calls (V3-33 enforces this server-side).

7. **Free-tier classification** (default):
   - `support_message_assist` — free (helps user message support; company-critical).
   - `account_check_assist` — free (helps user understand own account; company-critical).
   - `studio_domain_lookup` — free (sales-aiding for paid Studio service).
   - All other task classes — metered by default; explicit free-listing required.

8. **Telemetry** — `henry.ai.billing.charge_succeeded`, `henry.ai.billing.wallet_zero_blocked`, `henry.ai.billing.refund_processed`, `henry.ai.billing.free_call`.

## Out of scope
- AI surfaces (V3-28..V3-32).
- Personal-task gating logic at router level (V3-33).

## Dependencies
V3-26, V3-17. Blocks V3-28, V3-33.

## Inheritance
@henryco/ai-router; @henryco/payment-router (for wallet ops); ledger; observability.

## Trust / safety / compliance
- D4 owner-ratified margin applied.
- Wallet auto-debit audited.
- Refund flow if call fails after charge.
- ANTI-CLONE Principle 12.

## Mobile + desktop parity
Wallet check + usage dashboard same on web + Expo.

## i18n
Usage labels + wallet messages via @henryco/i18n.

## Validation gates
1. Standard CI.
2. **Pre-call wallet check** test.
3. **Post-call charge accuracy** — actual cost matches charge minus margin.
4. **Idempotency** — retry doesn't double-charge.
5. **Wallet-zero block test**.
6. **Free-tier bypass test**.

## Deployment gate
- D4 ratified.
- 7-day soak with internal-team usage.

## Final report contract
Standard.

## Self-verification
- [ ] Pricing catalog seeded.
- [ ] Pre-call + post-call billing.
- [ ] Wallet-zero hard cap.
- [ ] Idempotency.
- [ ] Usage dashboard.
- [ ] 4 new telemetry events.
- [ ] D4 ratified.
- [ ] Report written.
