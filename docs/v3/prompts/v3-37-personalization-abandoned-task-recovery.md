# V3-37 — Personalization: Abandoned-Task Recovery

**Pass ID:** V3-37 | **Phase:** E | **Pillar:** P3, P5
**Deps:** V3-34 | **Effort:** M | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Recovery engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V2-CART-01 handled cart abandonment. V3 vision extends to: incomplete bookings, half-filled forms, paused KYC, abandoned proposals.

## Mandatory scope

1. **`abandoned_tasks` schema**:
   ```sql
   CREATE TABLE abandoned_tasks (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users NOT NULL,
     task_type TEXT NOT NULL,
     task_ref TEXT NOT NULL,
     state JSONB NOT NULL,
     last_progress_at TIMESTAMPTZ NOT NULL,
     reminder_count INT NOT NULL DEFAULT 0,
     status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','recovered','expired')),
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   ```

2. **Detectors**:
   - Form abandonment (V3-01 draft preservation already tracks).
   - Booking abandonment (cart pattern extended to bookings).
   - KYC partial (kyc_submissions in 'in_progress' for > 24h).
   - Proposal abandonment (studio proposals viewed but not signed).

3. **Recovery campaigns** (via V3-43 workflow + V3-48 follow-up):
   - Day 1: in-app reminder.
   - Day 3: email reminder with deep-link to continue.
   - Day 7: final reminder + bonus offer where applicable.
   - Day 14: mark expired.

4. **Recovery surface** at `apps/account/app/(account)/continue/page.tsx`:
   - Lists all pending tasks.
   - One-click "continue".

5. **Telemetry** — `henry.task.abandoned`, `henry.task.recovery_sent`, `henry.task.recovered`, `henry.task.expired`.

## Out of scope
- Multi-step funnel optimization (V3-90 data lake).
- Specific recovery copy authoring (V3-48 campaigns).

## Dependencies
V3-34. Blocks V3-45 (auto-remind), V3-48 (follow-up campaigns).

## Inheritance
@henryco/cart-saved-items (existing pattern); @henryco/lifecycle; V3-43 workflow engine.

## Trust / safety / compliance
- Opt-out respected.
- ANTI-CLONE Principle 12.

## Mobile + desktop parity
Continue surface responsive.

## i18n
Per locale.

## Validation gates
1. Standard CI.
2. **Detection smoke** for each task type.
3. **Reminder cadence** working.
4. **Continue flow** restores state.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Schema + detectors.
- [ ] Recovery campaigns.
- [ ] Continue surface.
- [ ] 4 new telemetry events.
- [ ] Report written.
