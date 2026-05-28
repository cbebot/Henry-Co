# V3-39 — Personalization: Smart Next Action

**Pass ID:** V3-39 | **Phase:** E | **Pillar:** P3, P5
**Deps:** V3-34 | **Effort:** M | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Next-Action engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision: "Smart-next-action surfacing; per-page next-step prompt." Existing `nextAccountSteps` is deterministic per-user; this pass extends to per-page contextual next-action.

## Mandatory scope

1. **Next-action resolver**:
   - Input: user context + current page + recent activity.
   - Output: one or two suggested next actions with reason + deep-link.

2. **Per-page integration**:
   - Account home: "Verify your identity to unlock wallet" (if KYC pending).
   - Marketplace listing: "Save for later" / "Compare with similar".
   - Care service page: "Book a Care provider near you".
   - Jobs detail: "Apply now" or "Save for later if undecided".
   - Studio brief: "Get a quote in 24h".

3. **Cross-division stitch**:
   - "Booked Care → here's a caregiver Job" (links to V3-36 recommendations).
   - "Completed Learn course → see employer roles".

4. **Subtle UI placement**:
   - Bottom-right floating chip ("Continue: <action>") on relevant pages.
   - Respects reduced-motion + opt-out.

5. **Telemetry** — `henry.next_action.surfaced`, `henry.next_action.clicked`, `henry.next_action.dismissed`.

## Out of scope
- The 30+ per-page actions catalog (extend organically).
- A/B test framework (V3-91).

## Dependencies
V3-34.

## Inheritance
@henryco/intelligence (existing nextAccountSteps); V3-34 personalization context.

## Trust / safety / compliance
- Resolver server-side (ANTI-CLONE Principle 1).
- Never surfaces sensitive next-actions inappropriately.

## Mobile + desktop parity
Floating chip responsive.

## i18n
Per locale.

## Validation gates
1. Standard CI.
2. **Per-page smoke** — 10 representative pages each get a relevant next-action.
3. **Cross-division stitch** — care → job stitch tested.
4. **Opt-out honored**.

## Deployment gate
- 14-day soak; monitor click-through rate.

## Final report contract
Standard.

## Self-verification
- [ ] Resolver server-side.
- [ ] Per-page integrations (10+).
- [ ] Cross-division stitch.
- [ ] Floating chip UI.
- [ ] 3 new telemetry events.
- [ ] Report written.
