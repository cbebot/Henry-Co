# V3-91 — Observability: A/B Testing Framework

**Pass ID:** V3-91 | **Phase:** I | **Pillar:** P12
**Deps:** V3-90 | **Effort:** M | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 A/B Testing engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P12: "A/B testing framework." Adopt one of GrowthBook / LaunchDarkly / Vercel Edge Config.

## Mandatory scope

1. **GrowthBook (recommended)** — open-source, self-host option keeps cost predictable + data on our infra.

2. **Feature flag + experiment lifecycle**:
   - Create experiment with hypothesis + KPI.
   - Define variants + traffic split.
   - Assign users (sticky by user-id or session-id).
   - Track exposure + conversion via V3-90 data lake.
   - Analyze results (statistical significance).
   - Roll out winner OR kill experiment.

3. **Integration with existing patterns**:
   - Coexists with `@henryco/intelligence/parseHenryFeatureFlags` (env-var flags for simple toggles).
   - GrowthBook is the place for A/B-tested flags.

4. **First experiments** (test runs):
   - V3-52 marketplace ranking variant.
   - V3-35 deals copy variant.
   - V3-48 campaign A/B.

5. **Telemetry** — `henry.experiment.assigned`, `henry.experiment.exposure`, `henry.experiment.conversion`.

## Integration keys (per INTEGRATION-KEYS.md)

Consumed (NEW env vars, added to INTEGRATION-KEYS.md):
- `GROWTHBOOK_API_HOST`
- `GROWTHBOOK_CLIENT_KEY` (client-side)
- `GROWTHBOOK_SECRET_API_KEY` (server-side mgmt)

ZERO hardcoded flag names / experiment IDs.

## Out of scope
- Statistical analysis tooling beyond GrowthBook UI.
- Multi-armed bandit (future).

## Dependencies
V3-90.

## Inheritance
@henryco/intelligence flags (existing simple-flag pattern preserved).

## Trust / safety / compliance
- Experiment exposure logged for audit.
- User consent for experimentation (per L17 cookie + tracker consent).

## Mobile + desktop parity
GrowthBook SDK on Expo + web.

## i18n
N/A.

## Validation gates
1. Standard CI.
2. **Experiment lifecycle e2e**.
3. **Sticky assignment** verified.
4. **Conversion tracking** via V3-90 data lake.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] GrowthBook integrated.
- [ ] Experiment lifecycle tooling.
- [ ] 3 first experiments running.
- [ ] 3 new telemetry events.
- [ ] Report written.
