# V3-85 — Global: Per-Market Payment Routing

**Pass ID:** V3-85 | **Phase:** I | **Pillar:** P12, P2
**Deps:** V3-13, V3-84 | **Effort:** M | **Parallel:** YES | **Owner gate:** none | **Risk:** Money

## Role
V3 Market-Payment-Routing engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3-13 router has per-country defaults. This pass extends with per-market overrides + user choice.

## Mandatory scope

1. **Per-market default provider matrix** (table-driven):
   - Nigeria: Paystack primary, Flutterwave secondary, Stripe last.
   - Kenya: Flutterwave (mobile-money native), Paystack, Stripe.
   - Ghana: Flutterwave + MTN Mobile Money.
   - UK / EU: Stripe + SEPA.
   - US: Stripe.

2. **User override at checkout**:
   - Show available methods per market.
   - User selects preferred.
   - Preference saved per user (V3-34 personalisation).

3. **Capability matrix display**:
   - "Pay with Card (Stripe)" vs "Pay with Bank Transfer (Paystack)" — clear and honest (still without exposing provider identity in user-visible response per V3-13, but method TYPE is shown).

4. **Telemetry** — `henry.payment.market_routed`, `henry.payment.user_override.applied`.

## Integration keys (per INTEGRATION-KEYS.md)

Consumed: Stripe + Paystack + Flutterwave keys (already listed). No new envs.

ZERO hardcoded provider names in user-facing response per ANTI-CLONE Principle 9 — only METHOD types ("Card", "Bank Transfer", "Mobile Money").

## Out of scope
- Provider activations (V3-14/15/16).
- Tax (V3-21).

## Dependencies
V3-13, V3-84.

## Inheritance
V3-13 router; V3-84 country bundles.

## Trust / safety / compliance
- ANTI-CLONE Principle 9.

## Mobile + desktop parity
Same.

## i18n
Method labels per locale.

## Validation gates
1. Standard CI.
2. **Per-market routing** smoke per market.
3. **User override**.
4. **No provider name leaks**.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Per-market matrix.
- [ ] User override.
- [ ] Capability display (method types only).
- [ ] 2 new telemetry events.
- [ ] No provider name leaks.
- [ ] Report written.
