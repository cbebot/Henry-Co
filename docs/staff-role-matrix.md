# Staff Role Matrix

This document describes the application-layer role model currently enforced by `apps/staff`.

## Platform Families

| Family | Core permissions | Operational intent |
| --- | --- | --- |
| `division_manager` | `workspace.view`, `approvals.view`, `reports.view`, `division.write`, `division.approve`, `settings.view` | Division heads and senior leads who own throughput and approval posture. |
| `operations_staff` | `workspace.view`, `tasks.view`, `queues.view`, `division.read`, `settings.view` | Queue movers, dispatchers, coordinators, and service operators. |
| `support_staff` | `workspace.view`, `inbox.view`, `queues.view`, `division.read`, `settings.view` | Support and customer-ops staff working live support and escalation flow. |
| `finance_staff` | `workspace.view`, `approvals.view`, `reports.view`, `division.read`, `division.finance`, `settings.view` | Finance reviewers for payouts, invoice pressure, and payment recovery. |
| `moderation_staff` | `workspace.view`, `approvals.view`, `division.read`, `division.moderate`, `settings.view` | Trust, moderation, and compliance review roles. |
| `content_staff` | `workspace.view`, `division.read`, `division.write`, `settings.view` | Content, catalog, course, and asset operators. |
| `analyst` | `workspace.view`, `reports.view`, `archive.view`, `division.read` | Read-heavy operators and finance/compliance analysts. |
| `coordinator` | `workspace.view`, `tasks.view`, `queues.view`, `division.read`, `settings.view` | Cross-functional coordinators and workflow owners. |
| `specialist` | `workspace.view`, `tasks.view`, `queues.view`, `division.read` | Contributors with a narrower execution lane. |
| `supervisor` | `workspace.view`, `approvals.view`, `reports.view`, `division.read`, `division.approve`, `settings.view` | Managers reviewing quality and exceptions. |
| `executive_viewer` | `workspace.view`, `approvals.view`, `reports.view`, `staff.directory.view`, `division.read`, `settings.view` | Senior command and owner-adjacent viewers. |
| `system_admin` | all workspace permissions including `workspace.manage`, `staff.directory.view`, `division.finance`, `division.moderate` | Highest-seniority internal operators and platform administrators. |

## Division Role Catalog

| Division | Live roles in code | Family resolution |
| --- | --- | --- |
| Care | `care_manager`, `care_support`, `care_rider`, `service_staff`, `care_finance`, `care_ops` | management, support, rider/service ops, finance |
| Marketplace | `marketplace_admin`, `marketplace_support`, `marketplace_moderator`, `marketplace_ops`, `marketplace_finance`, `seller_success`, `catalog_manager`, `campaign_manager` | management, support, moderation, ops, finance, content |
| Studio | `sales_consultant`, `project_manager`, `developer`, `designer`, `client_success`, `studio_finance`, `delivery_coordinator` | commercial, delivery, creative production, support, finance |
| Jobs | `recruiter`, `employer_success`, `jobs_support`, `jobs_moderator`, `internal_recruitment_coordinator`, `talent_success` | recruiter ops, support, moderation |
| Property | `listings_manager`, `viewing_coordinator`, `property_support`, `property_moderator`, `managed_property_ops`, `agent_relationship_manager` | listing ops, support, moderation |
| Learn | `academy_admin`, `instructor`, `content_manager`, `learner_support`, `certification_manager`, `academy_ops` | administration, content, support, certification/moderation |
| Logistics | `dispatcher`, `driver`, `logistics_support`, `fleet_ops`, `logistics_finance`, `shipment_coordinator` | dispatch, fleet ops, support, finance |

## Access Resolution Rules

1. Explicit membership rows are preferred and already consumed for `marketplace`, `studio`, `property`, `learn`, and `logistics`.
2. Legacy profile fallback is still allowed for `care`, using shared profile roles when no explicit membership rows exist.
3. Activity-scoped visibility is only used to reinforce divisions already backed by explicit or fallback access; it does not create fantasy access by itself.
4. `jobs` still lacks a dedicated explicit membership table in the current repo truth, so Jobs visibility is still coming from fallback/activity signals and must be formalized in the Supabase pass.
5. Route access is server-enforced in `apps/staff/lib/staff-auth.ts` and `apps/staff/lib/roles.ts`; UI visibility is only a second layer.

## Current Role-to-Workspace Mapping

| Workspace route | Intended operators | Gate |
| --- | --- | --- |
| `/` | anyone with staff access | `requireStaff()` |
| `/support` | support, coordinators, managers, owner-visible command staff | `requireStaff()` plus support desk division filtering |
| `/care`, `/marketplace`, `/studio`, `/jobs`, `/learn`, `/property`, `/logistics` | division-scoped operators | explicit/fallback/activity division access |
| `/operations` | command and cross-division operators | `requireStaff()` |
| `/finance` | finance-capable staff and higher | `division.finance` |
| `/workforce` | supervisors, executive viewers, system admins | `staff.directory.view` |
| `/settings` | system-sensitive operators | `settings.view` |

## Known Weak Areas

- Care still depends on fallback role derivation unless a dedicated care membership source is added.
- Jobs lacks explicit membership storage.
- Logistics route truthfully exposes the platform gap: staff can work shared support and tracking, but a dedicated dispatch backoffice does not exist yet.
- Internal notes, escalation ledgers, and unified cross-division action audit sinks still need the Supabase pass.
