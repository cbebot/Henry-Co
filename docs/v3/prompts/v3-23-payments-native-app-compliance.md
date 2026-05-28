# V3-23 — Payments: Native App Compliance

**Pass ID:** V3-23 | **Phase:** C | **Pillar:** P2, P12
**Deps:** V3-14 | **Effort:** M | **Parallel:** YES | **Owner gate:** D8 partial | **Risk:** Money

## Role
V3 Native-app Payments engineer. Execute, then stop.

## Project
Standard.

## Audit summary
super-app + company-hub Expo apps exist with `payments.deferred.ts` adapter. App Store + Play Store policy requires Apple Pay / Google Pay for digital goods; physical goods + services can use external payment.

## Mandatory scope

1. **Classify HenryCo payment categories**:
   - **Digital goods**: HenryCo Intelligence credit (subject to Apple's 30% commission unless out-of-app purchase).
   - **Physical goods + services**: marketplace items + service bookings (external payment allowed).
   - **Money transfer**: wallet top-up + payouts (not subject to store commission).

2. **Apple-compliant flow for digital goods**:
   - Use Apple In-App Purchase for HenryCo Intelligence credit purchase IF surfacing in-app.
   - Apple's API integrated via Expo's `expo-in-app-purchases` or RevenueCat.
   - Server-side receipt verification via Apple's verifyReceipt endpoint.

3. **External payment flow for physical/services**:
   - Open Stripe / Paystack / Flutterwave hosted checkout in WebBrowser session.
   - On return, deep-link back into the app per V3-04 universal-links setup.

4. **Wallet top-up flow**:
   - User taps "Add funds" → external WebBrowser checkout → return to app → wallet credited via webhook.
   - Not subject to store commission per "money transfer" rule.

5. **`expo-secure-store` for sensitive state**:
   - Wallet balance cached for offline display (re-verified on next online action).
   - Last-used payment method (token only, never PAN).

6. **Server-side compliance gate**:
   - For digital goods purchases, server checks platform header (`X-HenryCo-Platform: ios|android|web`).
   - On iOS: requires Apple receipt verification before crediting account.
   - On Android: requires Google Play Billing receipt.

7. **Telemetry** — `henry.mobile.payment.iap_initiated`, `henry.mobile.payment.iap_completed`, `henry.mobile.payment.external_browser_opened`, `henry.mobile.payment.deep_link_returned`.

## Out of scope
- Mobile UI design beyond payment flow (V3-87 parity).
- Store submission (V3-88).

## Dependencies
V3-14 (Stripe for external + IAP).

## Inheritance
Existing super-app + company-hub adapter pattern; @henryco/payment-router; ANTI-CLONE Principle 9 (network masking — external checkout via henryco-domain proxy).

## Trust / safety / compliance
- L9 — App Store + Play Store developer accounts active.
- L10 — trademark filings (for in-app branding).
- IAP receipt verification mandatory.
- Apple/Google policy compliance verified pre-submission.
- ANTI-CLONE Principles 6, 12.

## Mobile + desktop parity
This pass IS the mobile payment compliance.

## i18n
IAP product titles + descriptions localized per Apple/Google submission process.

## Validation gates
1. Standard CI for mobile apps.
2. **IAP e2e** in Apple sandbox + Google test track.
3. **External checkout e2e** — open browser → checkout → return.
4. **Wallet top-up smoke**.
5. **Server-side receipt verification** — Apple sandbox + Google test receipts.

## Deployment gate
- TestFlight + Google internal track ramp.
- Owner approves before store submission (V3-88).

## Final report contract
Standard.

## Self-verification
- [ ] Payment category classification implemented.
- [ ] IAP integrated for digital goods.
- [ ] External flow for physical/services.
- [ ] Wallet top-up via external.
- [ ] Server-side receipt verification.
- [ ] 4 new telemetry events.
- [ ] L9 + L10 verified.
- [ ] Report written.
