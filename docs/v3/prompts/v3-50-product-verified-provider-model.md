# V3-50 — Product: Verified Provider Model

**Pass ID:** V3-50 | **Phase:** G | **Pillar:** P1, P7, P8
**Deps:** V3-49, V3-24 | **Effort:** XL | **Parallel:** NO | **Owner gate:** none | **Risk:** Identity, Compliance

## Role
V3 Provider engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P1: "verified providers + smart booking." P8: "performance, contracts, payouts, service areas, quality scores."

## Mandatory scope

1. **Provider profile schema** extending `partners` from V3-67:
   - `provider_profile` table with: bio, photos, service areas, capabilities, certifications, languages, availability calendar.

2. **Verification tiers** (uses V3-24 KYC):
   - L1: email + phone verified.
   - L2: identity verified (NIN/BVN).
   - L3: documents + biometric verified.
   - L4: background-checked (if applicable + opted-in).

3. **Quality score**: derived from completed bookings + ratings + dispute rate + on-time rate.

4. **Public provider pages** at `services.henrycogroup.com/providers/<id>`:
   - Tier badge.
   - Quality score (truncated for ANTI-CLONE).
   - Reviews.
   - Available services.
   - Service areas.

5. **Provider workspace** at `apps/account/app/(account)/provider/`:
   - Bookings calendar.
   - Service offerings management.
   - Reviews + feedback.
   - Earnings (linked to V3-69).

6. **Telemetry** — `henry.provider.profile.viewed`, `henry.provider.verification.upgraded`, `henry.provider.quality_score.recomputed`.

## Out of scope
- Partner onboarding flow (V3-67).
- Partner payouts (V3-69).
- Specific verticals (each gets own pass).

## Dependencies
V3-49, V3-24. Blocks V3-51, V3-63, V3-67, V3-72.

## Inheritance
@henryco/trust scoring; partners schema.

## Trust / safety / compliance
- ANTI-CLONE Principles 1 (score formula server-only), 10 (provider graph = data moat), 12.
- Quality-score reasons explainable to provider.
- L8 insurance covers provider liability where applicable.

## Mobile + desktop parity
Provider workspace responsive.

## i18n
Per provider locale.

## Validation gates
1. Standard CI.
2. **Tier upgrade path** — KYC events advance tier.
3. **Quality score** — synthetic ratings produce expected score.
4. **Profile renders publicly**.

## Deployment gate
- 30-day soak with small partner cohort.

## Final report contract
Standard.

## Self-verification
- [ ] Profile schema.
- [ ] 4 verification tiers.
- [ ] Quality score formula.
- [ ] Public + private surfaces.
- [ ] 3 new telemetry events.
- [ ] Report written.
