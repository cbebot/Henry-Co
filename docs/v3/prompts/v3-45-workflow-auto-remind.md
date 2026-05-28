# V3-45 — Workflow: Auto-Remind Users

**Pass ID:** V3-45 | **Phase:** F | **Pillar:** P5
**Deps:** V3-43, V3-37 | **Effort:** M | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Auto-Remind engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision: "Auto-remind users (incomplete actions, expiring sessions, abandoned tasks)." Builds on V3-37 detection.

## Mandatory scope

1. **Reminder workflows** for: incomplete KYC, abandoned cart, abandoned booking, expiring saved items, pending verification, unread important notifications, upcoming subscription renewal, upcoming service appointment.

2. **Channels**: in-app, email, push (mobile when V3-88), SMS (only for high-priority + opted-in).

3. **Cadence configuration** per reminder type (e.g., abandoned cart: 1h, 24h, 7d).

4. **Quiet hours** respected (no SMS/push between 10pm–7am user-locale).

5. **Opt-out**: per-channel + per-type granularity.

6. **Telemetry** — `henry.reminder.sent`, `henry.reminder.acted_upon`, `henry.reminder.opted_out`.

## Out of scope
- Marketing campaigns (V3-48).
- Newsletter (V3-61).

## Dependencies
V3-43, V3-37.

## Inheritance
@henryco/notifications + @henryco/email; @henryco/workflow.

## Trust / safety / compliance
- Opt-out honored.
- Quiet hours.

## Mobile + desktop parity
All channels.

## i18n
Per locale.

## Validation gates
1. Standard CI.
2. **Reminder e2e** per workflow type.
3. **Opt-out test**.
4. **Quiet-hours test**.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] 8+ reminder workflows.
- [ ] Multi-channel.
- [ ] Cadence config.
- [ ] Quiet hours + opt-out.
- [ ] 3 new telemetry events.
- [ ] Report written.
