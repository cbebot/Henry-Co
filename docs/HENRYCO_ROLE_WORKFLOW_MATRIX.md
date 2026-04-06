# HenryCo — Role, Permission & Workflow Matrix

**Purpose:** Single reference for how identity, roles, and permissions work today and how they should map to future Staff HQ modules.  
**Last updated:** 2026-04-05

---

## 1. Identity layers (confirmed)

| Layer | Storage / mechanism | Consumers |
|-------|---------------------|-----------|
| **Supabase Auth** | `auth.users` | All Next apps via `@supabase/ssr` |
| **Customer profile** | `customer_profiles` | `apps/account` |
| **Owner profile** | `owner_profiles` | Hub `/owner/*`, account `isOwner` |
| **Generic profile** | `profiles` (+ `role` text) | Care, Jobs, Studio, Learn, Marketplace, Property, Logistics mappings |
| **Workspace staff** | `workspace_staff_memberships`, `workspace_division_memberships` | Hub workspace model + migration DDL |
| **Division memberships** | `*_role_memberships` tables per vertical | RLS + app auth |
| **Permission overrides** | `workspace_division_memberships.permission_overrides` (jsonb) | Hub workspace |

There is **no** single shared `@henryco/auth` package today — each app implements `require*Roles` / `viewerHasRole` locally.

---

## 2. Hub — Owner (executive)

| Check | Location | Rule |
|-------|----------|------|
| `requireOwner()` | `apps/hub/lib/owner-auth.ts`, `apps/hub/app/lib/owner-auth.ts` | `owner_profiles`: active, role ∈ `owner` \| `admin` |
| Nav | `apps/hub/lib/owner-navigation.ts` | Sections: Command, Operations, Finance, Workforce, Communications, Brand, Intelligence, System |

**Owner capabilities (nav-backed, UI maturity varies):** executive overview, divisions, operations center (approvals, queues, alerts), finance center, staff directory/invite/roles, messaging, brand/subdomains, AI helpers, settings/audit.

---

## 3. Hub — Workspace platform model (canonical for cross-division staff)

### 3.1 Platform role families

Defined in `apps/hub/app/lib/workspace/roles.ts` with `PERMISSIONS_BY_FAMILY`:

| Family | Typical use |
|--------|-------------|
| `division_manager` | Approve, write division scope |
| `operations_staff` | Execute ops, read division |
| `support_staff` | Tickets, read division |
| `finance_staff` | Approvals + finance permission |
| `moderation_staff` | Moderation permission |
| `content_staff` | Write content |
| `analyst` | Reports read |
| `coordinator` | Tasks + queues |
| `specialist` | Narrow execution |
| `supervisor` | Approve + reports |
| `executive_viewer` | Broad read + staff directory |
| `system_admin` | Full workspace manage |

### 3.2 Workspace permissions (strings)

From `apps/hub/app/lib/workspace/types.ts` — `WORKSPACE_PERMISSIONS`:

`workspace.view`, `workspace.manage`, `overview.view`, `tasks.view`, `inbox.view`, `approvals.view`, `queues.view`, `archive.view`, `reports.view`, `settings.view`, `staff.directory.view`, `division.read`, `division.write`, `division.approve`, `division.finance`, `division.moderate`.

### 3.3 Profile role → family mapping (hub fallback)

`SHARED_PROFILE_FAMILIES` in `roles.ts`:

| `profiles.role` (string) | Mapped families |
|--------------------------|-----------------|
| `owner` | `division_manager`, `executive_viewer`, `system_admin` |
| `manager` | `division_manager`, `supervisor` |
| `support` | `support_staff`, `coordinator` |
| `staff` | `operations_staff`, `specialist` |
| `rider` | `operations_staff`, `specialist` |
| `finance` | `finance_staff` |

### 3.4 Division catalog (hub)

`WORKSPACE_DIVISIONS`: `care`, `marketplace`, `studio`, `jobs`, `property`, `learn`, `logistics`.

`DIVISION_ROLE_CATALOG` lists **division-specific role slugs** per division (e.g. care: `care_manager`, `care_support`, `care_rider`, …; marketplace: `marketplace_admin`, `marketplace_support`, …). These are the **authoritative names** for a unified staff nav.

### 3.5 Default home divisions by profile role

`DEFAULT_HOME_DIVISIONS` in `roles.ts`:

| Profile | Default divisions |
|---------|-------------------|
| `owner` | all 7 |
| `manager` | all 7 |
| `support` | care, marketplace, jobs, property, learn |
| `staff` | care, property, learn |
| `rider` | care, logistics |

**Use for landing rules:** e.g. `support` → prioritize `/support` inbox + divisions above; `rider` → care + logistics dispatch.

---

## 4. Care — local RBAC (stricter path-level)

| File | Content |
|------|---------|
| `apps/care/lib/auth/roles.ts` | `AppRole`: customer, owner, manager, rider, support, staff |
| `apps/care/lib/auth/permissions.ts` | `Permission` union + `ROLE_PERMISSIONS` + `canAccessPath()` |
| `apps/care/lib/auth/server.ts` | `requireRoles`, staff login `buildStaffLoginUrl()` → `/workspace/access` |
| `apps/care/lib/auth/routes.ts` | Route constants |

`homeForRole()` lands: owner → `/owner`, manager → `/manager`, rider → `/rider`, support → `/support`, staff → `/staff`, customer → `/track`.

**Conflict:** Care staff trees are **retired** (`StaffSurfaceRetired` on `(staff)/layout.tsx`). Care `/admin` has **no** `requireRoles` on the page component.

---

## 5. Division apps — product roles (TypeScript unions)

Roles are **not** imported across apps; each file is source of truth for that vertical’s **product** surface.

| App | File | Role highlights |
|-----|------|-----------------|
| Jobs | `apps/jobs/lib/jobs/types.ts` | `JobsRole`: candidate, employer, recruiter, admin, owner, moderator + `internalProfile` mapping |
| Studio | `apps/studio/lib/studio/types.ts` | client, studio_owner, sales_consultation, project_manager, developer_designer, client_success, finance |
| Marketplace | `apps/marketplace/lib/marketplace/types.ts` | buyer, vendor, marketplace_owner, marketplace_admin, moderation, support, finance, operations, … |
| Learn | `apps/learn/lib/learn/types.ts` | learner, teacher, academy_owner, academy_admin, … |
| Property | `apps/property/lib/property/types.ts` | visitor … property_admin, moderation, support, … |

**Enforcement pattern:** `lib/<vertical>/auth.ts` → `get*Viewer`, `require*User`, `require*Roles`.

---

## 6. Enforcement surfaces (where checks run)

| Surface | Mechanism |
|---------|-----------|
| All Next apps | **No root `middleware.ts`** — use `proxy.ts` per app for cookies/CSP/host rewrites |
| Hub owner | Server components call `requireOwner()` |
| Hub workspace | `apps/hub/app/lib/workspace/auth.ts` (viewer + permissions) |
| Division admin | `requireMarketplaceRoles`, `requireLearnRoles`, `requirePropertyRoles`, `requireStudioRoles`, etc. |
| Care | `requireRoles` in server + path permissions |
| Jobs | `requireJobsRoles` / `requireJobsUser` |
| Account | `requireAccountUser` — not granular RBAC |

---

## 7. Overlaps and legacy traps

| Issue | Detail |
|-------|--------|
| **Dual staff models** | Hub `PlatformRoleFamily` + Care `Permission` matrix + vertical `*Role` unions |
| **workspace.* host** | Points to retired UI — DB may still be intended for real workspace |
| **profiles.role semantics** | Same column drives different mappings per app |
| **RLS** | Hub `workspace_*` tables: RLS enabled in migration; policies may be incomplete off-SQL |
| **Jobs /admin** | Routes to recruiter under retired layout |

---

## 8. Recommended role → workspace map (target state)

**Principle:** One **Staff HQ shell**; modules gated by hub-style **permissions** + division membership rows, with Care-style path checks only where needed for legacy routes during migration.

| Staff HQ module | Required permission / family | Division roles (examples) |
|-----------------|----------------------------|---------------------------|
| **/inbox** (unified) | `inbox.view` + any `division.read` | All active staff |
| **/support** | `support_staff` or `coordinator` | `marketplace_support`, `jobs_support`, `learner_support`, `care_support` |
| **/operations** | `queues.view` | `marketplace_ops`, `care_ops`, `academy_ops`, coordinators |
| **/care** | `division.read` on `care` | `care_manager`, `care_ops`, `care_support`, `care_rider` |
| **/marketplace** | `division.read` on `marketplace` | admin, ops, moderation, support, finance |
| **/studio** | `division.read` on `studio` | sales, PM, delivery, finance, client_success |
| **/jobs** | `division.read` on `jobs` | recruiter, moderator, employer_success |
| **/learn** | `division.read` on `learn` | academy_admin, instructor, certification_manager |
| **/property** | `division.read` on `property` | listings_manager, viewing_coordinator, moderator |
| **/logistics** | `division.read` on `logistics` | dispatcher, shipment_coordinator, fleet_ops |
| **/finance** | `approvals.view` + `division.finance` OR `finance_staff` | All `*_finance` division roles |
| **/workforce** | `staff.directory.view` or `system_admin` | HR / owner delegate |
| **/admin/system** | `workspace.manage` | `system_admin` only |

**Owner / executive:** Remains on `hq.*` → `/owner/*`; inherits `executive_viewer` + full division families per `roles.ts` mapping for `owner`.

---

## 9. Read vs action-heavy by role family

| Family | Read-heavy | Action-heavy |
|--------|------------|--------------|
| `analyst`, `executive_viewer` | Yes | Rare |
| `support_staff`, `coordinator` | Mixed | Tickets, reassignment |
| `operations_staff`, `specialist` | Low | Queues, status updates |
| `moderation_staff` | Mixed | Approve/reject, cases |
| `finance_staff` | Mixed | Approvals, payouts |
| `division_manager`, `supervisor` | Yes | Approve, escalate |
| `system_admin` | Yes | Config, access |

---

## 10. Files inspected

- `apps/hub/app/lib/workspace/types.ts`
- `apps/hub/app/lib/workspace/roles.ts`
- `apps/hub/lib/owner-navigation.ts`
- `apps/hub/lib/owner-auth.ts` (referenced)
- `apps/care/lib/auth/roles.ts`, `permissions.ts`, `server.ts`
- `apps/jobs/lib/jobs/types.ts` (pattern)
- `packages/ui/src/staff-surface-retired.tsx`
- `apps/hub/supabase/migrations/20260402235500_workspace_staff_platform.sql`
