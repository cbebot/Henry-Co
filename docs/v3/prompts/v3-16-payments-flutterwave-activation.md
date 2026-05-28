# V3-16 — Payments: Flutterwave Activation

**Pass ID:** V3-16 | **Phase:** C | **Pillar:** P2
**Deps:** V3-13 | **Effort:** L | **Parallel:** YES (with V3-14, V3-15) | **Owner gate:** D1 | **Risk:** Money

## Role
V3 Payments engineer (Flutterwave). Execute, then stop.

## Project
Standard.

## Audit summary
Flutterwave not integrated. Secondary Naira-native provider per D1; strong on multi-rail African payments + mobile money + multi-currency.

## Mandatory scope

1. **Install Flutterwave Node SDK** (`flutterwave-node-v3`).

2. **Implement `FlutterwaveAdapter`** in `packages/payment-router/src/providers/flutterwave-adapter.ts`:
   - `initiatePayment` → Flutterwave Standard checkout OR direct charge API.
   - `finalizePayment` → verify-transaction.
   - `refundPayment` → refunds endpoint.
   - `verifyWebhook` → `verif-hash` header check against `FLW_SECRET_HASH`.
   - `getBalance` → balances endpoint.
   - Methods: card, bank, mobile_money (M-Pesa, MTN, Vodafone), barter, USSD, account.

3. **Webhook handler** at `apps/account/app/api/payments/webhooks/flutterwave/route.ts` — verif-hash + idempotent.

4. **Multi-currency support** — Flutterwave handles NGN + USD + GBP + EUR + GHS + KES + UGX + ZAR + XAF + XOF natively. Router consults capability matrix.

5. **Env vars:** `FLW_SECRET_KEY`, `FLW_PUBLIC_KEY`, `FLW_SECRET_HASH`.

6. **Telemetry** — `henry.payment.flutterwave.*`.

7. **Domain masking** — checkout redirect via `pay.henrycogroup.com/<token>`.

## Out of scope
- Stripe (V3-14), Paystack (V3-15). Subscriptions, refunds, tax, payouts separate.

## Dependencies
V3-13. Blocks V3-19, V3-69.

## Inheritance
Standard.

## Trust / safety / compliance
- L4 + L14 verified.
- Webhook verif-hash mandatory.
- ANTI-CLONE Principles 1, 6, 9, 12.

## Mobile + desktop parity
Web: Flutterwave inline. Expo: V3-23.

## i18n
Flutterwave hosted-checkout localization + @henryco/i18n.

## Validation gates
1. Standard CI.
2. **Flutterwave test-mode e2e** — card + bank + mobile-money.
3. **Refund test-mode**.
4. **Webhook verif-hash rejection test**.
5. **Multi-currency smoke** — NGN + KES + USD all clear.

## Deployment gate
- Test-mode 48h.
- Live-mode monitored ramp.

## Final report contract
Standard.

## Self-verification
- [ ] FlutterwaveAdapter shipped.
- [ ] Webhook verif-hash + idempotent.
- [ ] Card + bank + mobile-money in test-mode.
- [ ] Multi-currency e2e (3+ currencies).
- [ ] L4 + L14 verified.
- [ ] Live ramp monitored.
- [ ] Report written.
