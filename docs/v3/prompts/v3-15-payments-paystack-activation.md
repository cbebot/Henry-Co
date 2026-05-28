# V3-15 — Payments: Paystack Activation

**Pass ID:** V3-15 | **Phase:** C | **Pillar:** P2
**Deps:** V3-13 | **Effort:** L | **Parallel:** YES (with V3-14, V3-16) | **Owner gate:** D1 | **Risk:** Money

## Role
V3 Payments engineer (Paystack). Execute, then stop.

## Project
Standard project block (see V3-14).

## Audit summary
Paystack not integrated. Primary Naira-native provider per D1 recommendation. Supports cards, bank transfers, USSD, mobile money (some markets), QR.

## Mandatory scope

1. **Install Paystack Node SDK** (`@paystack/inline-js` for client; server uses HTTPS calls).

2. **Implement `PaystackAdapter`** in `packages/payment-router/src/providers/paystack-adapter.ts`:
   - `initiatePayment` → Paystack `transaction/initialize`; returns authorization_url for hosted checkout OR access_code for inline.
   - `finalizePayment` → Paystack `transaction/verify` with reference.
   - `refundPayment` → Paystack `refund/create`.
   - `verifyWebhook` → HMAC-SHA512 of body with `PAYSTACK_SECRET_KEY` per Paystack docs.
   - `getBalance` → Paystack balance endpoint.
   - Methods supported: card, bank, USSD, mobile_money (per-country).

3. **Webhook handler** at `apps/account/app/api/payments/webhooks/paystack/route.ts`:
   - HMAC verification (Paystack-Signature header).
   - Idempotent processing.
   - Updates `payment_intents.status` per event type (`charge.success`, `charge.failed`, `refund.processed`).

4. **USSD payment UI** — Paystack-specific surface for "Pay via USSD" with country-specific USSD codes (Nigeria: bank-issued *XXX# codes).

5. **Env vars:**
   - `PAYSTACK_SECRET_KEY` (server)
   - `PAYSTACK_PUBLIC_KEY` (public)

6. **Telemetry** — `henry.payment.paystack.*` event family.

7. **Domain masking** — checkout redirect goes through `pay.henrycogroup.com/<token>` proxy.

## Out of scope
- Stripe (V3-14), Flutterwave (V3-16). Subscriptions, refund flow, tax, payouts handled separately.

## Dependencies
V3-13 (router). Blocks: V3-19, V3-69 (Paystack payouts).

## Inheritance
Router; payment_intents schema; observability.

## Trust / safety / compliance
- L4 Paystack merchant approval signed.
- DPA per L14.
- Webhook HMAC mandatory; fail-closed.
- ANTI-CLONE Principles 1, 6, 9, 12.

## Mobile + desktop parity
Web: full Paystack inline. Expo: deferred to V3-23.

## i18n
Paystack hosted-checkout supports en + locale-specific labels; for inline UI, HenryCo controls copy via @henryco/i18n.

## Validation gates
1. Standard CI.
2. **Paystack test-mode e2e** — card + bank + USSD.
3. **Refund test-mode e2e**.
4. **Webhook HMAC rejection test**.
5. **USSD surface smoke** — UI displays country-correct USSD code.

## Deployment gate
- Test-mode 48h soak.
- Live-mode monitored ramp.

## Final report contract
Standard report.

## Self-verification
- [ ] PaystackAdapter shipped.
- [ ] Webhook HMAC-verified + idempotent.
- [ ] Card + bank + USSD all working in test-mode.
- [ ] L4 + L14 verified.
- [ ] Live ramp monitored.
- [ ] Report written.
