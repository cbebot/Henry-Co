# V3-73 — Enterprise: Studio Project Suite

**Pass ID:** V3-73 | **Phase:** H | **Pillar:** P8
**Deps:** V3-57 | **Effort:** L | **Parallel:** YES | **Owner gate:** none | **Risk:** —

## Role
V3 Studio Project Suite engineer. Execute, then stop.

## Project
Standard.

## Audit summary
V3 PASS 21 shipped studio backend (proposals/milestones/asset-packs/kanban/gantt). This pass extends to a full client-facing project portal + revisions tracking at depth.

## Mandatory scope

1. **Client portal** at `studio.henrycogroup.com/projects/<id>`:
   - Project overview + timeline (gantt).
   - Files + asset packs.
   - Approvals workflow.
   - Communication thread.

2. **Studio operator workspace** extends existing kanban + gantt.

3. **Revisions tracking**:
   - Per-deliverable revision history.
   - Approval signature per revision (HMAC-signed snapshot).
   - Round-trip clearer (X revisions used / Y remaining per package).

4. **Asset access control**:
   - Watermarked previews per ANTI-CLONE Principle 5.
   - Final files unlock on payment.

5. **Telemetry** — `henry.studio_project.client_viewed`, `henry.studio_project.revision_requested`, `henry.studio_project.deliverable_approved`.

## Out of scope
- Brief intake (existing studio).
- Pricing engine (existing @henryco/pricing).

## Dependencies
V3-57.

## Inheritance
Studio backend (existing); @henryco/branded-documents.

## Trust / safety / compliance
- Client-portal RLS.
- Approval audit.

## Mobile + desktop parity
Client portal responsive.

## i18n
Per locale.

## Validation gates
1. Standard CI.
2. **Client portal renders project state**.
3. **Revision tracking + approval**.
4. **Watermark + unlock** correct.

## Deployment gate
- 14-day soak.

## Final report contract
Standard.

## Self-verification
- [ ] Client portal.
- [ ] Operator workspace.
- [ ] Revision tracking.
- [ ] Asset access control.
- [ ] 3 new telemetry events.
- [ ] Report written.
