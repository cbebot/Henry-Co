# V3-14 — Payments: Stripe Activation

**Pass ID:** V3-14 | **Phase:** C | **Pillar:** P2
**Deps:** V3-13 (payment provider router)
**Effort:** L | **Parallel:** YES (with V3-15, V3-16) | **Owner gate:** D1 | **Risk:** Money

## Role
V3 Payments engineer. Execute this one pass, then stop.

## Project
- Repo: `github.com/cbebot/Henry-Co` | Branch: `v3/14-payments-stripe-activation`
- Backend: Supabase | Deploy: Vercel | OS: Windows + bash + pnpm 9.15.5 + Node 24.x

## Audit summary (lift)
Per AUDIT-BASELINE.md §1.4 + §2.14: Stripe SDK not present. Manual proof-upload flow is the only working payment path. V3-13 shipped the router + adapter interface; this pass plugs Stripe in.

## Mandatory scope

1. **Install `stripe` Node SDK** in `packages/payment-router/`. Pin version. No client-side `@stripe/stripe-js` until Sub-PR D below.

2. **Implement `StripeAdapter`** in `packages/payment-router/src/providers/stripe-adapter.ts` per the `PaymentProviderAdapter` contract from V3-13:
   - `initiatePayment` → creates Stripe PaymentIntent with idempotency key; returns hosted-checkout URL or PaymentElement client secret.
   - `finalizePayment` → confirms via Stripe API.
   - `refundPayment` → creates refund.
   - `verifyWebhook` → uses Stripe-signed webhook secret via SDK helper.
   - `getBalance` → returns Stripe account balance for finance dashboard reconciliation.

3. **Webhook handler** at `apps/account/app/api/payments/webhooks/stripe/route.ts`:
   - Verifies signature via `stripe.webhooks.constructEvent`.
   - Idempotent processing (uses `stripe_event_id` as dedup key on `webhook_events` table).
   - Updates `payment_intents.status` per event type (`payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`).

4. **Apple Pay + Google Pay** via Stripe PaymentElement on web. Domain verification file at `apps/account/public/.well-known/apple-developer-merchantid-domain-association` per Apple's domain registration.

5. **Stripe Connect for future payouts** — set up Connect account framework but NO live payouts in this pass (V3-69 handles payouts).

6. **Env vars:**
   - `STRIPE_SECRET_KEY` (server)
   - `STRIPE_WEBHOOK_SECRET` (server)
   - `STRIPE_PUBLISHABLE_KEY` (public)
   - Per-country secret-key support (multi-account if multiple legal entities).

7. **Telemetry** — `henry.payment.stripe.*` event family (initiated, succeeded, failed, refunded, webhook).

8. **Domain masking** — ANTI-CLONE Principle 9: client never sees "stripe" in response; URL redirect goes through `pay.henrycogroup.com/<token>` proxy.

## Out of scope
- Paystack (V3-15), Flutterwave (V3-16).
- Subscription lifecycle (V3-20).
- Refund flow integration (V3-19).
- Tax computation (V3-21).
- Stripe Connect payouts (V3-69).

## Dependencies
V3-13 (router). Blocks: V3-19, V3-69 (Stripe payouts dependency).

## Inheritance
Router from V3-13; payment_intents schema from V3-13; `@henryco/observability/audit-log`.

## Trust / safety / compliance
- L4 (Stripe merchant approval) signed.
- Stripe DPA signed (L14).
- PCI DSS responsibility — using Stripe PaymentElement keeps HenryCo in SAQ-A scope (no card data ever touches our servers).
- Webhook signature verification mandatory; fail-closed.
- ANTI-CLONE Principles 1, 6, 9, 12.

## Mobile + desktop parity
Web: full Stripe Elements. Expo: deferred to V3-23 (super-app payments + App Store policy compliance).

## i18n
Stripe Elements supports locale prop; pass user's locale.

## Validation gates
1. Standard CI.
2. **Stripe test-mode e2e**: create intent → pay via test card → webhook fires → status flips paid.
3. **Refund test-mode e2e**.
4. **Webhook signature rejection test** — send unsigned webhook; verify 401.
5. **Idempotency test** — same idempotency key returns same intent.
6. **Domain verification** — `curl https://account.henrycogroup.com/.well-known/apple-developer-merchantid-domain-association` returns valid file.

## Deployment gate
- Test-mode soak 48h with synthetic payments.
- Owner approves switch to live-mode.
- Live-mode monitored ramp.

## Final report contract
`.codex-temp/v3-14-payments-stripe-activation/report.md` with the 9 standard sections + Stripe test-mode evidence + Apple Pay domain verification + Connect setup status.

## Self-verification
- [ ] StripeAdapter implements full interface.
- [ ] Webhook handler signed + idempotent.
- [ ] Apple Pay + Google Pay live on web.
- [ ] Connect framework ready (no payouts yet).
- [ ] Domain masking enforced.
- [ ] L4 + L14 verified.
- [ ] Test-mode e2e passing.
- [ ] Live-mode ramp monitored.
- [ ] Report written.
