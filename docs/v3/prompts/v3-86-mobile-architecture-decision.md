# V3-86 — Mobile: Architecture Decision (Expo vs Flutter)

**Pass ID:** V3-86 | **Phase:** I | **Pillar:** P12
**Deps:** V3-12 | **Effort:** M | **Parallel:** NO | **Owner gate:** D8 | **Risk:** —

## Role
V3 Mobile Architect. This pass is a decision pass — produce a decision doc + a spike branch, then stop.

## Project
Standard.

## Audit summary
super-app + company-hub Expo skeletons exist per AUDIT-BASELINE.md §2.19. V3 vision P12: "Mobile app architecture spike (Flutter or RN foundation)."

D8 recommendation: Continue Expo. This pass tests + ratifies that recommendation OR documents a Flutter migration plan.

## Mandatory scope

1. **Spike branch** `v3/86-mobile-spike`:
   - Stand up a small Flutter app (3 screens: home, list, detail) using Supabase Flutter SDK.
   - Compare developer experience, build time, bundle size, runtime perf, library availability vs current Expo super-app.

2. **Decision document** at `docs/v3/mobile-architecture-decision.md`:
   - Side-by-side comparison.
   - Owner recommendation (continue Expo per D8 baseline OR migrate to Flutter).
   - Cost analysis (migration cost vs continue cost over 12 months).
   - Risk analysis.

3. **Architecture summary** for chosen stack — extend `docs/architecture-summary.md`.

4. **Telemetry** — n/a (decision pass; no production code).

## Integration keys (per INTEGRATION-KEYS.md)

For spike: `NEXT_PUBLIC_SUPABASE_URL`, anon key, `EXPO_TOKEN` (or Flutter equivalent for CI). No new envs.

## Out of scope
- Building full mobile parity (V3-87).
- Submitting to stores (V3-88).

## Dependencies
V3-12.

## Inheritance
Existing Expo super-app + company-hub.

## Trust / safety / compliance
- ANTI-CLONE Principle 10 (mobile is part of the moat).

## Mobile + desktop parity
N/A; spike only.

## i18n
N/A.

## Validation gates
1. **Spike runs** and demonstrates Supabase + Mapbox + Sentry + auth.
2. **Decision doc** complete + owner-reviewed.
3. **D8 ratified** or pivoted.

## Deployment gate
- Owner signs decision.

## Final report contract
Standard.

## Self-verification
- [ ] Spike branch with 3 screens.
- [ ] Decision doc with comparison + cost.
- [ ] D8 ratified.
- [ ] Architecture summary updated.
- [ ] Report written. Hand-off: V3-87 (parity build on chosen stack).
