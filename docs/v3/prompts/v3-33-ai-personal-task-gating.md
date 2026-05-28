# V3-33 — AI: Personal-Task Gating

**Pass ID:** V3-33 | **Phase:** D | **Pillar:** P4, P7
**Deps:** V3-26, V3-27 | **Effort:** M | **Parallel:** NO | **Owner gate:** none | **Risk:** Identity

## Role
V3 AI-Gating engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P4: "Unauthenticated users get zero personal-task usage. Hard cap: when wallet hits zero, the API is not called."

This pass enforces the gates server-side at the router level. Cannot be bypassed by any client.

## Mandatory scope

1. **Router middleware** in `@henryco/ai-router/src/router.ts`:
   - Before any call:
     - Determine `task_class`.
     - Lookup `ai_task_pricing.billing_mode`.
     - If `metered_user`: require authenticated session AND wallet balance ≥ min_charge.
     - If `metered_business`: require business account context AND business-wallet balance.
     - If `free_company`: still require authenticated session (no anonymous usage).
   - Reject with explicit error code if any gate fails.

2. **Error codes**:
   - `auth_required` — unauth user attempted call
   - `wallet_zero_blocked` — auth user with zero balance
   - `business_account_required` — needs business context
   - `task_not_classified` — task class missing from pricing catalog (fail-closed)

3. **Audit log every blocked call**:
   - Per ANTI-CLONE Principle 12 + V3-26 audit pattern.
   - Helps spot abuse attempts.

4. **Public-surface AI gating**:
   - Public pages (e.g., marketplace product detail without login) MAY surface a "Sign in to use HenryCo Intelligence" CTA but cannot invoke any AI call.

5. **Telemetry** — `henry.ai.gating.unauth_blocked`, `henry.ai.gating.wallet_zero_blocked`, `henry.ai.gating.task_not_classified`.

## Out of scope
- Pricing config (V3-27).
- Specific task-class implementations (V3-29..V3-32).

## Dependencies
V3-26, V3-27.

## Inheritance
@henryco/ai-router; @henryco/auth; V3-17 wallet ledger.

## Trust / safety / compliance
- ANTI-CLONE Principles 1, 12.
- Fail-closed for unclassified tasks.
- Audit log on every block.

## Mobile + desktop parity
Server-side gates apply equally.

## i18n
Error message copy via @henryco/i18n.

## Validation gates
1. Standard CI.
2. **Unauth block test** — call AI endpoint without auth → 401 with auth_required.
3. **Wallet-zero block test**.
4. **Unclassified task block** — invent fake task class → fail-closed.
5. **Audit log verification** — every block logged.

## Deployment gate
- 48h soak; check audit log for unexpected blocks.

## Final report contract
Standard.

## Self-verification
- [ ] Router middleware enforces all gates.
- [ ] 4 explicit error codes.
- [ ] Audit log on every block.
- [ ] Public-surface gating verified.
- [ ] 3 new telemetry events.
- [ ] Report written. Phase D complete.
