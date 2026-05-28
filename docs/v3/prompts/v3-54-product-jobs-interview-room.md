# V3-54 — Product: Jobs Interview Room

**Pass ID:** V3-54 | **Phase:** G | **Pillar:** P1
**Deps:** V3-12 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Interview Room engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 backlog: named-but-not-built. @henryco/rooms package exists per AUDIT-BASELINE.md §2 (rooms — provider-selector, realtime, server, components, hooks).

## Mandatory scope

1. **Interview room schema**:
   ```sql
   CREATE TABLE interview_rooms (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     application_id UUID NOT NULL,
     scheduled_at TIMESTAMPTZ NOT NULL,
     duration_minutes INT NOT NULL DEFAULT 30,
     room_token TEXT UNIQUE,
     recording_consent BOOLEAN DEFAULT NULL,
     status TEXT NOT NULL DEFAULT 'scheduled',
     completed_at TIMESTAMPTZ,
     recorder_started_by UUID
   );
   ```

2. **@henryco/rooms** integration: provider-agnostic (Daily.co, Twilio Rooms, Whereby) via provider-selector.

3. **Room features**: video + audio + screen share + chat (uses chat-composer).

4. **Recruiter notes** during interview, persisted per `application_id`.

5. **Recording**: opt-in by both parties; stored encrypted.

6. **Reschedule + cancel** flows.

7. **Candidate-employer chat** outside interview surfaces.

8. **Telemetry** — `henry.interview.scheduled`, `henry.interview.started`, `henry.interview.completed`, `henry.interview.recorded`, `henry.interview.no_show`.

## Out of scope
- Advanced ATS features (V3-70 employer hiring suite).
- Auto-scheduling AI (V3-32 brief assist could extend).

## Dependencies
V3-12.

## Inheritance
@henryco/rooms; @henryco/chat-composer.

## Trust / safety / compliance
- Recording requires explicit consent from both parties.
- Recordings retained per privacy policy.
- ANTI-CLONE Principle 12.

## Mobile + desktop parity
Mobile native room via Expo (or web fallback).

## i18n
Per locale.

## Validation gates
1. Standard CI.
2. **Room creation + join** smoke.
3. **Recording consent flow**.
4. **Reschedule + cancel**.

## Deployment gate
- 14-day soak with internal-team interview.

## Final report contract
Standard.

## Self-verification
- [ ] Schema + rooms integration.
- [ ] Recording with consent.
- [ ] Recruiter notes.
- [ ] Reschedule/cancel.
- [ ] 5 new telemetry events.
- [ ] Report written.
