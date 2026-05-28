# V3-36 — Personalization: Cross-Division Recommendations

**Pass ID:** V3-36 | **Phase:** E | **Pillar:** P3
**Deps:** V3-34, V3-26 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Recommendations engineer. Execute, then stop.

## Project
Standard.

## Audit summary
Existing `nextAccountSteps` is deterministic. V3 vision: "Recommended services, jobs, courses, properties" cross-division with reason codes.

## Mandatory scope

1. **Recommendation engine** in `@henryco/intelligence/recommendations`:
   - Per-user candidate generation (deterministic + V3-26 AI hybrid).
   - Reason-code attribution per recommendation.
   - Confidence score.

2. **Per-domain recommenders**:
   - Services (Care): based on past bookings + location + budget.
   - Jobs: based on profile + skills + saved jobs.
   - Courses (Learn): based on completed courses + employer signals.
   - Properties: based on saved items + neighborhood + budget.
   - Marketplace: based on V3-52 ranking + cross-division signals.

3. **Cross-pollination**:
   - "You booked Care → here's a Job for caregivers."
   - "You completed Learn course → these employer roles match."
   - Logged as cross-division signals.

4. **Recommendation surface**:
   - `apps/account/app/(account)/recommendations/page.tsx` — dedicated full view.
   - Module on home (V3-34).
   - Per-division mini-recs in division mini-dashboards.

5. **Telemetry** — `henry.recommendation.generated`, `henry.recommendation.clicked`, `henry.recommendation.dismissed`.

## Out of scope
- Predictive job-match scoring at depth (V3-41).
- A/B testing recommendations (V3-91).

## Dependencies
V3-34, V3-26.

## Inheritance
@henryco/intelligence; @henryco/data aggregator.

## Trust / safety / compliance
- Recommendation formula server-only (ANTI-CLONE Principle 1).
- Reason codes explainable.

## Mobile + desktop parity
Same surface.

## i18n
Per locale.

## Validation gates
1. Standard CI.
2. **Per-domain smoke** — generates valid recommendations.
3. **Reason codes** present.
4. **Cross-pollination smoke** — care booking → relevant job rec.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Engine + per-domain recommenders.
- [ ] Reason codes.
- [ ] Cross-pollination wired.
- [ ] Surface + home module.
- [ ] 3 new telemetry events.
- [ ] Report written.
