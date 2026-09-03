# V3-20 — Money & Identity Spine: Subscription Lifecycle

**Pass ID:** V3-20  ·  **Phase:** C (Money & Identity Spine)  ·  **Pillar:** P2 (Payments & Money)
**Dependencies:** V3-13 (provider router), V3-17 (ledger hardening)  ·  **Effort:** L  ·  **Parallel-safe:** Y
**Owner gate:** D9 (monetization rates per division — partial)  ·  **Risk class:** Money

---

## Role
You are the V3 subscriptions engineer for Henry Onyx. You execute exactly this one pass, then stop and report. You build the full recurring-billing state machine — trial → active → past_due → grace → canceled → expired — on top of the **already-live `customer_subscriptions` table** and the **already-shipped account subscriptions surface**, wire it to the `@henryco/payment-router` and each activated provider's native subscription rails, and add dunning + self-service. The line you must not cross: money status is provider-confirmed truth, never optimistic UX — a subscription is `active` only when the provider has confirmed a successful charge, and access is never extended or revoked except by a confirmed lifecycle event recorded in the V3-17 ledger.

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/20-payments-subscription-lifecycle` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
Subscriptions are **already partially real**, not greenfield:

- **Table `public.customer_subscriptions` exists** with RLS policies `Users can view own subscriptions` and `Service role full access to customer_subscriptions` (see `apps/hub/supabase/migrations/20260514140000_auth_rls_initplan_wrap.sql`). Live columns consumed by the UI today: `id`, `user_id`, `status`, `billing_cycle` (`monthly`/`yearly`/`annual`), `amount_kobo` (BIGINT minor units), `currency`, `current_period_end`, `plan_name`, `division`, `plan_id`.
- **The account surface exists** at `apps/account/app/(account)/subscriptions/page.tsx` plus the detail route `apps/account/app/(account)/subscriptions/[subscriptionId]/`. It reads via `getSubscriptions(user.id)` from `apps/account/lib/account-data.ts`, renders with `HeroCard`/`TimelineCard`/`EmptyStateCard` from `@henryco/dashboard-shell/surfaces`, and localizes through `getAccountCopy(locale).subscriptions` (Pattern A typed copy with `statusLabels` and `cycleLabels`). The UI already understands the states `active`, `paused`, `cancelled`, `expired`, `past_due`.
- **The owner finance surface exists** at `apps/hub/app/owner/(command)/finance/` and will consume subscription MRR/churn in V3-22 — do not build finance views here.
- **Money primitives exist:** `@henryco/payment-router` (V3-13, mock-only/test-gated), `@henryco/payment-surface`, `@henryco/pricing` (`currency-model.ts`), and the double-entry ledger from V3-17. Wallet money already flows in integer kobo via `customer_wallet_funding_requests` / `customer_wallet_withdrawal_requests`.

**The gap this pass closes:** there is no lifecycle *engine*. Today a row's `status` is set ad hoc; there is no trial→active→grace→canceled state machine, no dunning, no provider-subscription binding, no proration, no pause/resume, and no plan catalog. This pass makes recurring billing a real, ledger-backed, provider-reconciled system. It **reconciles with** the existing table and surface — it does not replace them. The earlier draft of this prompt proposed a fresh `subscriptions` table; that is rejected — extend `customer_subscriptions` in place to avoid a forked source of truth.

## Mandatory scope

### S1 — Extend `customer_subscriptions` to a full lifecycle table
Add the columns the engine needs without breaking the live surface. New migration `apps/hub/supabase/migrations/<ts>_subscription_lifecycle.sql`:

```sql
alter table public.customer_subscriptions
  add column if not exists trial_ends_at        timestamptz,
  add column if not exists current_period_start timestamptz,
  add column if not exists grace_ends_at        timestamptz,
  add column if not exists canceled_at          timestamptz,
  add column if not exists cancel_reason        text,
  add column if not exists paused_until         timestamptz,
  add column if not exists provider             text,        -- 'paystack' | 'flutterwave' | 'stripe'
  add column if not exists provider_subscription_id text,
  add column if not exists dunning_attempt      smallint not null default 0,
  add column if not exists updated_at           timestamptz not null default timezone('utc', now());

-- Canonical status set the engine enforces (UI already renders these).
alter table public.customer_subscriptions
  drop constraint if exists customer_subscriptions_status_check;
alter table public.customer_subscriptions
  add  constraint customer_subscriptions_status_check
  check (status in ('trial','active','past_due','grace','canceled','expired','paused'));

create unique index if not exists customer_subscriptions_provider_sub_uq
  on public.customer_subscriptions (provider, provider_subscription_id)
  where provider_subscription_id is not null;
```

RLS is already correct (owner-row select + service-role full access). Do **not** loosen it. All state transitions run server-side under the service role inside the lifecycle service — never from the client.

### S2 — `subscription_plans` catalog (owner-curated, config-seeded)
New table + seed migration. Plans are the only place plan economics live; per-division rates come from **D9** (confirm the recorded answer in `docs/v3/DECISIONS-REQUIRED.md` — do not re-litigate).

```sql
create table if not exists public.subscription_plans (
  id            text primary key,            -- e.g. 'premium_monthly', 'mkt_seller_pro_yearly'
  division      text not null,               -- 'hub' | 'marketplace' | 'studio' | ...
  display_key   text not null,               -- i18n copy key, NOT a literal label
  amount_minor  bigint not null,             -- integer minor units
  currency      text not null default 'NGN',
  billing_cycle text not null check (billing_cycle in ('monthly','yearly')),
  trial_days    smallint not null default 0,
  provider_plan_ids jsonb not null default '{}'::jsonb,  -- { paystack:'PLN_x', flutterwave:'...', stripe:'price_...' }
  is_active     boolean not null default true,
  created_at    timestamptz not null default timezone('utc', now())
);
alter table public.subscription_plans enable row level security;
create policy "subscription_plans readable" on public.subscription_plans
  for select using (is_active = true);
-- writes: service role only (no client policy).
```

Seed at minimum: Henry Onyx Premium monthly + yearly (hub), and one per-division tiered plan per the D9 ranges (Marketplace seller premium, Studio agency). `display_key` resolves through `@henryco/i18n` — never store a user-facing string in the DB.

### S3 — Lifecycle state machine (`@henryco/payment-router` consumer, server-only)
New module `apps/account/lib/subscriptions/lifecycle.ts` (server) + a shared transition table. Legal transitions, each idempotent and each writing a ledger entry via V3-17:

- `trial → active` on first confirmed charge.
- `trial → expired` if trial ends with no payment method / no charge.
- `active → past_due` on a confirmed failed renewal charge.
- `past_due → grace` when dunning starts the grace window (`grace_ends_at` set).
- `grace → active` on a successful retry.
- `grace → canceled` at grace expiry with no successful charge (access revoked at `current_period_end` or `grace_ends_at`, whichever the plan defines).
- `active → canceled` user-initiated (access continues until `current_period_end`).
- `active → paused` / `paused → active` user-initiated (S6).
- `canceled → expired` automatically at period end.

Every transition: (1) is keyed by an idempotency key so a replayed webhook never double-applies; (2) records the money effect in the V3-17 ledger (charge, proration credit/debit, refund) as double-entry; (3) emits the matching telemetry event (S7); (4) writes `@henryco/observability/audit-log` on the route that triggered it.

### S4 — Provider binding + webhook → state mapping
Each activated provider's native subscription rail maps to the state machine. Implement the mapping for whichever providers D1 activated (Paystack live today per V3-15; Stripe/Flutterwave behind their activation passes):

- **Paystack Plans/Subscriptions** — `subscription.create`, `charge.success`, `invoice.payment_failed`, `subscription.disable` events.
- **Stripe Billing** — `customer.subscription.*`, `invoice.payment_succeeded`, `invoice.payment_failed` (V3-14).
- **Flutterwave Recurring** — recurring `charge.completed` / failure events (V3-16).

Webhooks land on the existing signed/idempotent webhook path (extend `apps/account/app/api/webhooks/account/route.ts` or add `apps/account/app/api/webhooks/subscriptions/route.ts`). **HMAC verification + reconciliation is mandatory** — never trust an unverified webhook to move money or change access. Persist `provider`, `provider_subscription_id`. Reconcile against the provider's authoritative status on every event (provider is money-truth).

### S5 — Dunning workflow (V3-43 handler, idempotent)
A scheduled handler that walks `past_due`/`grace` rows. Pure, deterministic, idempotent per `(subscription_id, dunning_attempt)`:

- Day 1 past_due: retry charge via router.
- Day 3: retry + email reminder (`@henryco/email`, translated template).
- Day 7: retry + open grace window (`status = grace`, `grace_ends_at = now + 7d`).
- Day 14 (grace expiry): cancel access (`status = canceled`).

Respect quiet hours and opt-out (inherit V3-45 conventions when present; until then, do not send between 21:00–08:00 local). Each reminder send increments `dunning_attempt` and emits telemetry. Until V3-43's engine lands, host this as a guarded cron route under `apps/account/app/api/cron/subscription-dunning/route.ts` with the same idempotency contract, and leave a TODO pointer to fold into V3-43.

### S6 — User self-service surface
**Elevate the existing** `apps/account/app/(account)/subscriptions/` surface (do not rebuild). On the detail route `[subscriptionId]/page.tsx`, add actions backed by server routes under `apps/account/app/api/subscriptions/[subscriptionId]/`:

- **View** current plan, next renewal, amount, status (already present — keep).
- **Pause / resume** (`paused_until`), reflected in the live `paused` chip the UI already renders.
- **Cancel** with confirmation + reason (`cancel_reason`), access-until-period-end messaging.
- **Change plan** (proration computed server-side via `@henryco/pricing`; the ledger records the proration delta).
- **Update payment method** (re-uses `customer_payment_methods` + the router; never store PAN).

Plan change, cancel, and payment-method update are **sensitive actions** — guard each route with `requireSensitiveAction` (server) and call from the client with `fetchWithSensitiveAction` (V3-02 / V3-02b).

### S7 — Telemetry
Emit, namespaced `henry.<domain>.<noun>.<verb>`:
`henry.subscription.trial.started`, `henry.subscription.subscription.activated`, `henry.subscription.charge.failed`, `henry.subscription.dunning.attempted`, `henry.subscription.grace.entered`, `henry.subscription.subscription.canceled`, `henry.subscription.subscription.expired`, `henry.subscription.plan.changed`, `henry.subscription.subscription.paused`, `henry.subscription.subscription.resumed`.

## Out of scope
- Per-plan **feature gating** logic (each consuming pillar pass owns "what premium unlocks").
- **Tax** on the subscription amount — V3-21 computes it; this pass passes `subtotal_minor` to the tax engine and stores the returned `tax_minor`/`total_minor` once V3-21 lands.
- **Finance dashboard** subscriber metrics (MRR/churn/LTV) — V3-22 reads from here.
- **Receipt/invoice PDF** rendering of renewals — V3-18 owns the template; this pass triggers it.
- **Payout** of any kind — V3-69.

## Dependencies
Requires V3-13 (`@henryco/payment-router`) and V3-17 (double-entry ledger) merged; consumes whichever providers D1 activated (V3-15 Paystack is live). **Blocks V3-22** (finance dashboard reads MRR/churn from `customer_subscriptions`) and feeds V3-21 (tax on recurring amounts).

## Inheritance
`@henryco/payment-router` (provider abstraction + idempotency), V3-17 ledger (double-entry truth), `@henryco/pricing` (`currency-model.ts` for proration math in integer minor units), `@henryco/branded-documents` (renewal invoice template, V3-18), `@henryco/email` (dunning + lifecycle emails), `@henryco/dashboard-shell/surfaces` (existing subscription UI primitives), `@henryco/observability/audit-log`, the V3-02 sensitive-action guard, and the live `customer_subscriptions` table + `getSubscriptions()` data accessor.

## Implementation requirements

### Files
- `apps/hub/supabase/migrations/<ts>_subscription_lifecycle.sql` — S1 + S2.
- `apps/account/lib/subscriptions/lifecycle.ts` — S3 state machine (server-only).
- `apps/account/lib/subscriptions/plans.ts` — plan catalog accessor (server).
- `apps/account/app/api/webhooks/subscriptions/route.ts` — S4 signed/idempotent webhook.
- `apps/account/app/api/cron/subscription-dunning/route.ts` — S5 dunning (guarded cron; fold into V3-43 later).
- `apps/account/app/api/subscriptions/[subscriptionId]/{cancel,pause,resume,change-plan,payment-method}/route.ts` — S6 actions, each `requireSensitiveAction`-guarded.
- `apps/account/app/(account)/subscriptions/[subscriptionId]/page.tsx` — extend with self-service actions.
- `apps/account/lib/account-data.ts` — extend `getSubscriptions` / add `getSubscription(id)` to expose the new columns.

### Trust / safety / compliance
- All transitions server-side under service role; RLS unchanged (owner-row select only).
- **Idempotency key on every billed/mutating call** and every webhook application; double-applied events are no-ops.
- **HMAC verification + reconciliation** on every provider webhook; provider status is money-truth.
- **Double-entry ledger** (V3-17) records every charge, proration, and refund; no money effect exists outside the ledger.
- `requireSensitiveAction` on cancel / change-plan / payment-method routes.
- `@henryco/observability/audit-log` on every mutating route.
- Published **cancellation policy** (access-until-period-end) surfaced in the cancel confirmation copy; auto-cancellation only after the grace window.
- Never persist PAN or full card data; tokens only.

### Mobile + desktop parity
The account self-service surface is responsive web (mobile + desktop). The Expo super-app consumes subscription **status display** through its existing data layer; **purchasing/upgrading a subscription inside the native app is governed by V3-23** (App Store / Play Store digital-goods rules) — do not add an in-app purchase path here; this pass exposes lifecycle state and web-based management only.

### i18n
All plan names, status labels, cycle labels, dunning email copy, and confirmation/error strings flow through `@henryco/i18n`. Extend the existing typed copy `getAccountCopy(locale).subscriptions` (Pattern A) — namespace `surface:subscriptions` — adding keys for the new actions (`pause`, `resume`, `cancelReason`, `changePlan`, `prorationNote`) and dunning email templates. Plan `display_key` resolves to copy, never a DB literal. 12 locales; no hardcoded user-facing strings.

### Brand & design system
Plan names and all customer-facing copy read the brand from `@henryco/config` (`COMPANY` → "Henry Onyx", division labels "Henry Onyx <Division>"); the legal entity on renewal invoices/receipts is **"Henry Onyx Limited"** (V3-18 template). Never hardcode the brand or a domain — links via `getAccountUrl()` / `henryWebRoot()`. UI uses the locked design-system tokens (`--site-*`/`--accent`, Fraunces where editorial), light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed.

## Validation gates
1. **Standard CI** — `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` all green; i18n hardcoded-string scanner green.
2. **Lifecycle e2e** (~12 cases) — drive trial → active → past_due → grace → canceled → expired in provider **test mode**; assert each transition is idempotent under a replayed webhook and writes exactly one ledger pair.
3. **Dunning** — a simulated failed renewal triggers the day-1/3/7/14 sequence; `dunning_attempt` increments; no duplicate emails on re-run.
4. **Self-service** — pause + resume + cancel (with reason) + change plan (proration ledgered) + update payment method all succeed and each requires the sensitive-action step.
5. **RLS verification** — a user cannot read or mutate another user's subscription; service-role-only writes confirmed.
6. **Ledger reconciliation** — sum of subscription ledger entries equals provider-confirmed charges for the soak cohort.
7. **UI** — real-browser check of the subscriptions surface, light + dark, mobile + desktop, CLS ≈ 0, `pnpm a11y:contrast` not regressed.

## Deployment gate
All gates green; V3-13 + V3-17 merged; D9 rate answer confirmed in `DECISIONS-REQUIRED.md`. Ship behind a flag; **14-day soak with an internal-team subscriber** on the live Paystack rail before general enablement, with daily ledger reconciliation and zero money-truth discrepancies.

## Final report contract
`.codex-temp/v3-20-payments-subscription-lifecycle/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion.

## Self-verification
- [ ] S1 migration extends `customer_subscriptions` in place (no forked table); status CHECK updated; provider-sub unique index added; RLS unchanged.
- [ ] S2 `subscription_plans` seeded from D9 rates with i18n `display_key` (zero DB-stored user-facing strings).
- [ ] S3 state machine implements every legal transition; each is idempotent and writes a V3-17 double-entry ledger pair.
- [ ] S4 provider binding + signed/idempotent/HMAC-verified webhooks reconcile to provider money-truth.
- [ ] S5 dunning sequence (day 1/3/7/14) is idempotent per `(subscription_id, dunning_attempt)` and respects quiet hours.
- [ ] S6 self-service (pause/resume/cancel/change-plan/payment-method) extends the existing surface; sensitive-action guard on cancel/change-plan/payment-method.
- [ ] S7 all lifecycle telemetry events emit under `henry.subscription.*`.
- [ ] No hardcoded domains/strings; brand via `@henryco/config`; receipts legal entity = "Henry Onyx Limited".
- [ ] Report written with all 9 sections.
