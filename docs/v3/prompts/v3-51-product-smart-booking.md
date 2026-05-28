# V3-51 — Product: Smart Booking

**Pass ID:** V3-51 | **Phase:** G | **Pillar:** P1
**Deps:** V3-49, V3-50 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Booking engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision: "Smart booking: slot picker + provider matching + recurring bookings." Existing Care booking is single-service; extend to service catalog (V3-49) + providers (V3-50).

## Mandatory scope

1. **`bookings` schema** unified:
   ```sql
   CREATE TABLE bookings (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users NOT NULL,
     provider_id UUID REFERENCES partners,
     service_id UUID REFERENCES services NOT NULL,
     scheduled_at TIMESTAMPTZ NOT NULL,
     duration_minutes INT NOT NULL,
     location JSONB,
     status TEXT NOT NULL DEFAULT 'pending',
     recurring_pattern TEXT, -- daily/weekly/monthly/null
     cancellation_policy TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   ```

2. **Slot picker**: shows provider availability windows; respects timezone; book in 15-min increments.

3. **Provider matching**:
   - Filter by service, location, time, language, price.
   - Rank by quality score + proximity + responsiveness.

4. **Recurring bookings**: daily/weekly/monthly with end-date or count.

5. **Cancellation policy**: per service (24h notice required, etc.); refund computed per policy + V3-19.

6. **Calendar integration** (export ics).

7. **Telemetry** — `henry.booking.slot_searched`, `henry.booking.created`, `henry.booking.cancelled`, `henry.booking.completed`, `henry.booking.recurring_setup`.

## Out of scope
- Provider-side calendar (V3-72 service-provider CRM).
- Bulk B2B booking (V3-74 logistics business dashboard).

## Dependencies
V3-49, V3-50.

## Inheritance
Existing Care booking; @henryco/address-selector; @henryco/payment-router.

## Trust / safety / compliance
- Sensitive-action guard on bookings with deposit.
- ANTI-CLONE Principle 1 (matching server-side).

## Mobile + desktop parity
Slot picker mobile-optimized.

## i18n
Per locale.

## Validation gates
1. Standard CI.
2. **Slot picker** smoke.
3. **Provider matching** correctness.
4. **Recurring** setup + cancellation.
5. **Calendar export**.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Unified bookings schema.
- [ ] Slot picker + matching.
- [ ] Recurring.
- [ ] Cancellation policy.
- [ ] Calendar export.
- [ ] 5 new telemetry events.
- [ ] Report written.
