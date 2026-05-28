# V3-60 — Product: Coming-Soon / Public Roadmap Surface

**Pass ID:** V3-60 | **Phase:** G | **Pillar:** P1
**Deps:** V3-12 | **Effort:** S | **Parallel:** YES | **Owner gate:** D16 | **Risk:** —

## Role
V3 Roadmap engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision: "Coming-soon / public roadmap surface — transparent public roadmap; pre-launch signup; not a marketing promise wall." Per D16, recommend quarterly themes only.

## Mandatory scope

1. **`/roadmap` route** at `henrycogroup.com/roadmap`:
   - Lists quarterly themes (per D16 recommendation; specific feature timeline avoided).
   - Each theme: title, description, expected window, sign-up for updates.

2. **`roadmap_themes` schema** (admin-managed):
   - Title, description, quarter, status (in-progress / planned / shipped).

3. **Pre-launch interest signup**:
   - Per-theme "Notify me when ready" → adds to a list.
   - On theme launch, batch-notify.

4. **Telemetry** — `henry.roadmap.theme.viewed`, `henry.roadmap.signup.added`, `henry.roadmap.notify_sent`.

## Out of scope
- Vote-on-roadmap UI (D16 Option C only).
- Per-feature timeline (D16 Option B only).

## Dependencies
V3-12.

## Inheritance
Existing hub; @henryco/email; @henryco/newsletter.

## Trust / safety / compliance
- No over-promise (D16 quarterly only).
- Signup is GDPR-compliant.

## Mobile + desktop parity
Responsive.

## i18n
Per locale.

## Validation gates
1. Standard CI.
2. **Roadmap page renders**.
3. **Signup adds user**.
4. **Notification on theme launch**.

## Deployment gate
- Owner-reviewed first roadmap content.

## Final report contract
Standard.

## Self-verification
- [ ] Route live.
- [ ] Schema.
- [ ] Signup flow.
- [ ] Launch notification.
- [ ] 3 new telemetry events.
- [ ] Report written.
