# V3-38 — Personalization: Local Availability Awareness

**Pass ID:** V3-38 | **Phase:** E | **Pillar:** P3, P1
**Deps:** V3-34 | **Effort:** M | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Local-Availability engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision: "Local availability awareness; geo-aware service catalog; provider availability." Today: user_addresses canonical (V2-ADDR-01) gives user location; no service-availability awareness.

## Mandatory scope

1. **Service availability resolver**:
   - Input: user location (from primary address or IP if no address).
   - Output: which services are deliverable in this area.
   - Per-provider service-area config (V3-50 verified-provider model extends this).

2. **`service_availability_cache` table** (optional perf cache):
   - country + region + service → availability boolean + provider count.

3. **UI surfaces**:
   - "Available in your area" badge on service cards.
   - "Not available here" graceful state.
   - "Find similar services available here" fallback CTA.

4. **Marketplace + property + logistics** apply same pattern:
   - Marketplace shows ship-to-your-area filter.
   - Property shows neighborhood-aware results.
   - Logistics shows pickup-availability for user's area.

5. **Telemetry** — `henry.availability.resolved`, `henry.availability.unavailable_shown`.

## Out of scope
- Geocoding service (use Google Places from V2-ADDR-01).
- Provider matching (V3-51 smart booking).

## Dependencies
V3-34.

## Inheritance
@henryco/address-selector; user_addresses canonical.

## Trust / safety / compliance
- No reveal of provider home addresses.
- ANTI-CLONE Principle 1 (availability resolver server-side).

## Mobile + desktop parity
Same.

## i18n
Per locale.

## Validation gates
1. Standard CI.
2. **Availability resolution** — user in Lagos sees Lagos-deliverable services.
3. **Graceful unavailable** — clear copy + fallback CTA.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Resolver server-side.
- [ ] Cache table (optional).
- [ ] UI badges + fallback states.
- [ ] Applied to 4 domains.
- [ ] 2 new telemetry events.
- [ ] Report written.
