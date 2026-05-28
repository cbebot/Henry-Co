# V3-75 — Enterprise: Bulk Invoicing + Team Roles + Company Admin

**Pass ID:** V3-75 | **Phase:** H | **Pillar:** P8, P2
**Deps:** V3-18, V3-57 | **Effort:** L | **Parallel:** NO | **Owner gate:** none | **Risk:** Money, Compliance

## Role
V3 Bulk Invoicing engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 vision P8: "Bulk invoicing + team roles + company admin accounts."

## Mandatory scope

1. **Bulk invoicing**:
   - Generate batch invoices for businesses (monthly billing, recurring services).
   - Per-business invoice schedule.
   - Email delivery + payment-link with deadline.

2. **Team roles at depth** (extends V3-57):
   - Per-user permission matrix (read/write/admin per business resource).
   - Audit log per role-change.

3. **Company admin account**:
   - Single owner per business + multiple admins.
   - Admin can manage team + payment methods + contracts.

4. **Permission gates**: sensitive actions require admin role + sensitive-action guard from V3-02.

5. **Telemetry** — `henry.business.bulk_invoice.generated`, `henry.business.team_role_changed`, `henry.business.admin_added`.

## Out of scope
- Business-account API (V3-80).
- Standalone consumer invoices (V3-18).

## Dependencies
V3-18, V3-57. Blocks V3-80.

## Inheritance
V3-57 businesses + business_members; V3-18 invoice generation.

## Trust / safety / compliance
- Sensitive-action guard.
- Audit log on role changes.
- ANTI-CLONE Principles 6, 12.

## Mobile + desktop parity
Admin desktop-primary.

## i18n
Per locale.

## Validation gates
1. Standard CI.
2. **Bulk invoice e2e** smoke.
3. **Role-change** properly audited.
4. **Sensitive-action gates** enforce.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Bulk invoice workflow.
- [ ] Team roles matrix.
- [ ] Admin role.
- [ ] Permission gates.
- [ ] 3 new telemetry events.
- [ ] Report written.
