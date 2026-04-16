# HenryCo Internal Data Access Governance

**Classification:** Internal — Engineering Reference  
**Scope:** Staff and owner access to personal data, role definitions, audit trail coverage, least-privilege principles

---

## Overview

HenryCo's internal data access model separates platform owner/admin access from division staff access, with all privilege grants enforced at the database layer via Supabase RLS. Staff cannot access personal data beyond their division and role assignment. Navigation and sensitive actions are audit-logged.

---

## Role Hierarchy

### Owner-level roles (platform-wide)

| Role | Scope | What it can access |
|---|---|---|
| `owner` | Platform-wide | All tables subject to RLS `workspace_is_owner_operator()` |
| `admin` | Platform-wide | Same as owner via RLS function |

Owner and admin roles are stored in `owner_profiles.role` and evaluated by the RLS function `workspace_is_owner_operator()`.

### Staff roles (division-scoped)

Staff roles are stored in `workspace_staff_memberships.profile_role` and `workspace_division_memberships.role`. They are division-scoped unless `scope_type = 'platform'`.

| Role | Scope | Typical access |
|---|---|---|
| `staff` | Single division | Day-to-day queue operations |
| `senior_staff` | Single division | Broader queue + escalation access |
| `manager` | Single division | Leads workflows and people |
| `operations_lead` | Cross-queue | Recovery and SLA operations |
| `support` | Single division | Customer-facing case handling |
| `recruiter` | Jobs division | Hiring and candidate pipelines |
| `finance_lead` | Platform-wide | Payment verification, payout approvals |
| `owner_delegate` | Platform-wide | Delegated ownership authority |

---

## RLS Enforcement

### Key RLS functions

```sql
-- Returns current actor's effective role
workspace_current_actor_role()
  → owner_profiles.role  (if owner record exists)
  → profiles.role        (fallback)
  → 'staff'              (default)

-- Returns true for owner/admin actors
workspace_is_owner_operator()
  → TRUE if owner_profiles.role IN ('owner', 'admin')
  → TRUE if profiles.role = 'owner'
```

These functions are called inside `USING` clauses on RLS policies throughout hub's Supabase instance. Staff who are not `owner_operator` are restricted to rows matching their own `user_id` or their division's scope.

### Personal data visibility by role

| Data category | Staff (non-owner) | Owner / Admin |
|---|---|---|
| `profiles` (full name, phone) | Own record only (via account app) | All records via service-role operations |
| `customer_activity` | Not directly accessible | Via service-role query |
| `customer_notifications` | Not directly accessible | Via service-role query |
| `support_threads`, `support_messages` | Support staff see assigned threads only | All threads |
| `audit_logs` | Not accessible (platform-only) | SELECT via service-role |
| `staff_audit_logs` | Own entries only (actor_id = auth.uid()) | All entries |
| `jobs_applications` | Recruiter/manager for their division | All |
| `marketplace_orders` | Operations/finance for their queue | All |
| `care_bookings` | Care staff for their queue | All |

No staff role has unmediated SELECT access to all rows across personal data tables. Cross-table personal data access requires the service role key, which is never exposed to client bundles and is limited to server-side API routes.

---

## Audit Trail Coverage

### `staff_audit_logs`

All structural staff management actions (create, update, role changes, deactivation) are written to `staff_audit_logs` via `writeStaffAudit()` in `apps/hub/lib/owner-actions.ts`.

| Column | Purpose |
|---|---|
| `actor_id` | auth.uid() of the staff member taking the action |
| `actor_role` | Role at time of action |
| `action` | e.g. `staff.update`, `membership.create`, `role.change` |
| `entity` | Always `"staff"` for workforce actions |
| `entity_id` | ID of the affected resource |
| `meta` | jsonb — additional context (role before/after, fields changed) |
| `created_at` | Timestamp |

RLS on this table: staff can read/insert their own entries (`actor_id = auth.uid()`); owners/admins can read all entries.

Retention: 90 days (same as `audit_logs`).

### `staff_navigation_audit`

Page navigation within the owner workspace is logged to `staff_navigation_audit`. No RLS policies exist on this table — it is locked to service-role and Postgres-role reads only. Not user-visible. Fields: `user_id`, `session_fingerprint`, `path`, `division`, `referrer`, `user_agent`, `metadata`.

This table records what staff accessed, not what data they viewed. It is an access-time audit, not a data-view audit.

### `audit_logs` (platform-level)

Platform-generated events (user actions, API calls, moderation decisions) are written to `audit_logs`. Staff cannot SELECT from `audit_logs` via RLS. Owner/admin access is via service-role only. Retention: 90 days.

---

## Least-Privilege Principles

1. **Division scoping:** Staff are assigned to a `primary_division` and their data access is bounded by that division's scope unless explicitly granted `platform`-scoped access via `workspace_division_memberships.scope_type`.

2. **Service role boundary:** The Supabase service role key is only used in server-side route handlers. It is blocked from client bundles by the CI guardrail script (`scripts/ci/repo-guardrails.mjs`) which rejects `NEXT_PUBLIC_*SECRET*` patterns.

3. **Permission grants at row level:** `workspace_division_memberships.permission_overrides` (jsonb) allows per-staff permission narrowing or expansion within a division. The catalog of available permissions is defined in `apps/hub/lib/owner-workforce-catalog.ts`.

4. **No direct database credentials:** Staff access data through the hub app's server-side actions, which use the service role key. Staff never hold database credentials or Supabase service tokens.

5. **No PII in client bundles:** `sanitizeAnalyticsProperties()` strips 23+ PII field categories before any `customer_activity` insert. Analytics metadata written to the database is reviewed to avoid retaining raw personal data.

---

## Staff-Facing Data Access Surfaces

### Hub owner workspace (`/owner/*`)

| Surface | Path | Data accessed |
|---|---|---|
| Workforce center | `/owner/staff/` | `workspace_staff_memberships`, `workspace_division_memberships` |
| Staff directory | `/owner/staff/directory/` | Staff profiles (no customer PII) |
| Audit log viewer | `/owner/settings/audit/` | `staff_audit_logs` (own entries or all if owner) |
| Role management | `/owner/staff/roles/` | Role catalog + audit history |

None of these surfaces expose customer PII directly. Support thread access (customer messages) is limited to the support case management surfaces, which are scoped to the assigned case.

---

## What Staff Cannot Do Without Owner Approval

- Elevate their own role (requires owner action in `/owner/staff/roles/`)
- Access financial records outside their queue (requires `finance_lead` or `finance.approve` permission)
- Read audit logs for other staff members (RLS blocks this; owner-only)
- Delete or anonymize user data (deletion must follow the staff manual procedure in `docs/data-retention-and-delete-readiness.md`, executed with service-role credentials, documented in a compliance log)
- Export personal data in bulk (service-role export query must be authorized by owner)

---

## Honest Limitations

| Limitation | Severity | Note |
|---|---|---|
| `staff_navigation_audit` is not user-visible | Low | By design — internal access log only |
| No automated alert on privilege escalation | Medium | Owner must review audit logs manually |
| No time-boxed staff access grants | Medium | Access remains until actively revoked |
| No cross-division data query log | Medium | Queries from service-role routes are not individually attributed in `audit_logs` |

---

## Related Documents

- [privacy-control-model.md](./privacy-control-model.md) — consent categories and user-facing controls
- [consent-and-tracking-boundaries.md](./consent-and-tracking-boundaries.md) — what is and isn't consent-gated
- [data-retention-and-delete-readiness.md](./data-retention-and-delete-readiness.md) — how long data is kept and deletion procedures
- [DATA-GOVERNANCE-AUDIT-REPORT.md](./DATA-GOVERNANCE-AUDIT-REPORT.md) — migration discipline and environment separation
