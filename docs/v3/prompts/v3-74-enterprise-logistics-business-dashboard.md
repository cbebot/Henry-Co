# V3-74 — Enterprise: Logistics Business Dashboard

**Pass ID:** V3-74 | **Phase:** H | **Pillar:** P8
**Deps:** V3-57, V3-64 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Logistics Business engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 PASS 21 shipped logistics backend + rider/dispatcher workspaces. This pass adds business-shipper (B2B) dashboard.

## Mandatory scope

1. **B2B shipper dashboard** at `logistics.henrycogroup.com/business/`:
   - All shipments (across multiple users in the business).
   - Bulk shipment upload (CSV).
   - Pickup scheduling.
   - SLA + claims tracking.

2. **Contract management**:
   - Per-business contract with negotiated rates.
   - Invoice generation per contract terms (e.g., monthly bill vs per-shipment).

3. **B2B statement** (existing @henryco/branded-documents/logistics-b2b-statement extended).

4. **Reconciliation**: shipper sees payments + outstanding balance.

5. **Team roles** per V3-57.

6. **Telemetry** — `henry.logistics_business.bulk_upload`, `henry.logistics_business.contract_signed`, `henry.logistics_business.statement_generated`.

## Out of scope
- Logistics API (V3-78).
- Rider/dispatcher workspaces (existing).

## Dependencies
V3-57, V3-64.

## Inheritance
Existing logistics; @henryco/branded-documents (logistics-b2b-statement).

## Trust / safety / compliance
- Per-business RLS.
- Contract acceptance audited.

## Mobile + desktop parity
Desktop-primary.

## i18n
Per business locale.

## Validation gates
1. Standard CI.
2. **B2B dashboard renders**.
3. **Bulk upload smoke**.
4. **Contract + invoice generation**.
5. **Statement renders correctly**.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] B2B dashboard.
- [ ] Contract mgmt.
- [ ] Statement.
- [ ] Reconciliation.
- [ ] Team roles.
- [ ] 3 new telemetry events.
- [ ] Report written.
