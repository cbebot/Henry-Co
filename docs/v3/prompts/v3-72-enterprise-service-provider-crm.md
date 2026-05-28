# V3-72 — Enterprise: Service-Provider CRM

**Pass ID:** V3-72 | **Phase:** H | **Pillar:** P8
**Deps:** V3-50, V3-57 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Provider CRM engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P8: "Service-provider CRM — customer notes, recurring bookings, performance, payout reconciliation."

## Mandatory scope

1. **Customer notes per provider**:
   - Private notes about customer preferences, history.
   - Shareable across provider team.

2. **Recurring booking management**:
   - View all recurring customers.
   - Pause/resume series.
   - Bulk-message recurring customers.

3. **Performance dashboard**: extends V3-68 partner perf.

4. **Payout reconciliation**: matches V3-69 payouts to specific completed bookings.

5. **Telemetry** — `henry.provider_crm.note_added`, `henry.provider_crm.recurring.paused`, `henry.provider_crm.bulk_message.sent`.

## Out of scope
- Booking flow (V3-51).
- Partner onboarding (V3-67).

## Dependencies
V3-50, V3-57.

## Inheritance
V3-51 bookings; V3-68 performance; V3-69 payouts.

## Trust / safety / compliance
- Customer-notes are personal data; respect V3-93 data rights.

## Mobile + desktop parity
Mobile-friendly for on-the-go providers.

## i18n
Per locale.

## Validation gates
1. Standard CI.
2. **Notes CRUD**.
3. **Recurring management** smoke.
4. **Reconciliation accuracy**.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Customer notes.
- [ ] Recurring management.
- [ ] Performance dashboard.
- [ ] Reconciliation.
- [ ] 3 new telemetry events.
- [ ] Report written.
