# Staff HQ — Platform Architecture

**Status:** Pre-build audit & design (no implementation yet)
**Date:** 2026-04-05
**Branch:** `release/mvp-stabilization`

---

## 1. Current state (audit findings)

### 1.1 Monorepo layout

| Layer | Items |
|-------|-------|
| **Apps (10)** | hub, account, care, jobs, learn, logistics, marketplace, property, studio, super-app |
| **Packages (4)** | `@henryco/config`, `@henryco/ui`, `@henryco/i18n`, `@henryco/brand` |
| **Orchestration** | pnpm workspaces; no Turborepo pipeline (`turbo.json` absent) |

### 1.2 Staff surfaces today

| App | Live staff surfaces | Retired (`StaffSurfaceRetired`) |
|-----|---------------------|---------------------------------|
| **hub** | `/owner/*` — full command center (finance, operations, workforce, comms, AI, brand, settings) | `/workspace/*` |
| **studio** | `/sales/*`, `/pm/*`, `/delivery/*`, `/finance/*`, `/support/*` (role-gated) | `/owner` |
| **learn** | `/admin` (academy_owner, academy_admin), `/analytics` (finance, internal_manager) | `/owner/*` |
| **marketplace** | `/admin`, `/admin/[resource]` (role-gated) | `/owner/*`, `/operations/*`, `/moderation/*` |
| **property** | `/admin` (property_admin) | `/operations`, `/moderation`, `/owner` |
| **care** | `/admin` (no server auth — **gap**) | `/(staff)/*` — all of `/staff`, `/owner`, `/manager` |
| **jobs** | `/employer/*`, `/candidate/*` (role-gated) | `/admin` → recruiter (retired), `/recruiter/*`, `/moderation`, `/owner` |
| **logistics** | None live | Catch-all renders `StaffSurfaceRetired` |

**Key insight:** Staff surfaces are scattered across 7 apps, each with its own auth module, role types, and navigation. Many are retired placeholders. There is no unified staff experience.

### 1.3 Role models (fragmented)

Each division app defines its own role type — none shared centrally:

| App | Role type | Roles |
|-----|-----------|-------|
| **care** | `AppRole` | `customer`, `owner`, `manager`, `rider`, `support`, `staff` |
| **hub (owner)** | `owner_profiles.role` | `owner`, `admin` |
| **hub (workspace)** | `PlatformRoleFamily` | `system_admin`, `division_manager`, `operations_staff`, etc. |
| **jobs** | `JobsRole` | `candidate`, `employer`, `recruiter`, `admin`, `owner`, `moderator` |
| **studio** | `StudioRole` | `client`, `studio_owner`, `sales_consultation`, `project_manager`, `developer_designer`, `client_success`, `finance` |
| **learn** | `LearnRole` / `LearnStaffRole` | `learner`, `teacher`, `academy_owner`, `academy_admin`, `support`, `finance`, etc. |
| **marketplace** | `MarketplaceRole` | `buyer`, `vendor`, `marketplace_owner`, `marketplace_admin`, `moderation`, `support`, `finance`, `operations` |
| **property** | `PropertyRole` | `visitor`, `property_admin`, `moderation`, `support`, etc. |
| **account** | `AccountUser` | `isOwner`, `ownerRole` flags |

### 1.4 Auth architecture

- **Identity:** Supabase Auth everywhere, shared cookie domain (`.henrycogroup.com`).
- **No middleware.ts** — auth runs in `proxy.ts` (session refresh) and server components (`require*Roles`, `require*User`).
- **Login redirects:** Care has `homeForRole()`; hub sends to `/owner/login`; division apps redirect to account with `next` param.
- **No single RBAC package** — each app reimplements role checks.

### 1.5 Database schema (staff-relevant)

**Tables with DDL in this repo:**

| Category | Tables |
|----------|--------|
| **Staff identity** | `workspace_staff_memberships`, `workspace_division_memberships` |
| **Workspace ops** | `workspace_tasks`, `workspace_queue_items`, `workspace_notifications`, `workspace_operational_events`, `workspace_internal_notes`, `workspace_preferences`, `workspace_helper_signals`, `workspace_module_registry` |
| **Internal comms** | `hq_internal_comm_threads`, `hq_internal_comm_messages`, `hq_internal_comm_thread_members`, `hq_internal_comm_attachments`, `hq_internal_comm_presence` |
| **Audit** | `staff_navigation_audit`, `marketplace_audit_logs` |
| **Division memberships** | `marketplace_role_memberships`, `studio_role_memberships` (+ learn, property equivalents) |

**Tables referenced in code but no `CREATE TABLE` in repo:**
`staff_audit_logs`, `audit_logs`, `logistics_role_memberships`, `support_threads`, `support_messages`, `customer_profiles`, `owner_profiles`, `care_bookings` (full DDL)

### 1.6 Public workflow → internal staff routing

| Public workflow | App | Internal record | Staff alert/queue |
|----------------|-----|-----------------|-------------------|
| Booking | care | `care_bookings`, `care_order_items` | `sendAdminNotificationEmail` + `notifyStaffRoles` |
| Contact / support | care | `care_security_logs`, support thread | Admin email + `notifyStaffRoles` |
| Payment proof | care | `care_payment_requests` update | `notifyStaffRoles` (support/owner on mismatch) |
| Review | care | `care_reviews` (`is_approved: false`) | Admin email + `notifyStaffRoles` |
| Checkout | marketplace | `marketplace_orders`, events | Buyer notifications; risk → `marketplace_moderation_cases` |
| Vendor application | marketplace | `marketplace_vendor_applications` | Owner alert email |
| Support thread | marketplace | `marketplace_support_threads` | Owner alert email |
| Dispute | marketplace | `marketplace_disputes` | `marketplace_moderation_cases` queue |
| Job application | jobs | `customer_activity`, notifications | Employer in-app + email; internal team notify if `job.internal` |
| Job post | jobs | Job metadata | `pending_review` status |
| Enrollment | learn | `learn_enrollments`, `learn_payments` | `awaiting_payment` → finance confirm |
| Teacher application | learn | `learn_teacher_applications` | `sendOwnerAlert` |
| Learner support | learn | `support_threads` | `sendOwnerAlert` |
| Property inquiry | property | Inquiry record, activity | `sendPropertyEvent` → operator inbox |
| Listing submission | property | Listing, application, docs | `new_lead_alert` for moderation |
| Studio brief | studio | `studio_lead_*`, `studio_brief_*`, `studio_proposal_*` | `sendInquiryNotifications`, `sendProposalNotifications` |
| Logistics booking | logistics | `logistics_shipments`, `logistics_addresses`, `logistics_events` | **GAP**: customer email only, no explicit ops alert |
| Wallet funding | account | `customer_wallet_funding_requests` | Finance verification implied |
| Withdrawal | account | `customer_wallet_withdrawal_requests` | `pending_review` status |
| Mobile contact | super-app | `contact_submissions` | **GAP**: no staff notification |

---

## 2. Architecture decision: single Staff HQ

### 2.1 Domain strategy

**Phase 1 — single master platform:**
```
staffhq.henrycogroup.com
```

**Internal routing via path-based workspaces:**
```
/support          → cross-division support desk
/operations       → operational overview + queue management
/care             → care division operations
/studio           → studio division operations
/marketplace      → marketplace division operations
/jobs             → jobs division operations
/learn            → learn/academy operations
/logistics        → logistics dispatch + operations
/finance          → treasury, payouts, invoices, approvals
/workforce        → HR, staff admin, directory, scheduling
/settings         → platform configuration
```

**Phase 2 — optional breakout subdomains (only if justified):**
```
supporthq.henrycogroup.com    → if support team exceeds 20+ agents and needs independent deploy
logisticshq.henrycogroup.com  → if dispatch needs real-time maps/tracking isolation
carehq.henrycogroup.com       → if care ops needs independent scaling/deploy cycle
```

**Breakout criteria (all must apply):**
1. Team autonomy — dedicated team owns the subdomain
2. Deploy independence — needs its own release cycle
3. Security boundary — data isolation requirements
4. Scale isolation — distinct infra/performance needs

### 2.2 Relationship to existing surfaces

```
┌─────────────────────────────────────────────────────────┐
│                    OWNER HQ (hub)                        │
│              hq.henrycogroup.com/owner                   │
│                                                          │
│  Executive dashboard, company settings, brand,           │
│  AI, final approvals, strategic oversight                │
│                                                          │
│  ┌────────────────────────────────────────┐              │
│  │  Can assign work to ──────────────────►│──┐           │
│  │  Receives escalations from ◄───────────│──┤           │
│  │  Views aggregate metrics from ◄────────│──┤           │
│  └────────────────────────────────────────┘  │           │
└──────────────────────────────────────────────┼───────────┘
                                               │
┌──────────────────────────────────────────────▼───────────┐
│                    STAFF HQ (new)                         │
│              staffhq.henrycogroup.com                     │
│                                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ Support  │ │   Care   │ │  Studio  │ │Logistics │    │
│  │ Desk     │ │   Ops    │ │   Ops    │ │ Dispatch │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │Marketplace│ │  Jobs    │ │  Learn   │ │ Finance  │    │
│  │   Ops    │ │   Ops    │ │   Ops    │ │ Treasury │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│  ┌──────────┐ ┌──────────┐                               │
│  │Workforce │ │ Property │                               │
│  │  / HR    │ │   Ops    │                               │
│  └──────────┘ └──────────┘                               │
└──────────────────────────────────────────────────────────┘
                       ▲
                       │ Records flow in from
                       │
┌──────────────────────┴───────────────────────────────────┐
│              PUBLIC HENRYCO WEBSITES                       │
│  care / marketplace / jobs / learn / studio /             │
│  property / logistics / account / super-app               │
└──────────────────────────────────────────────────────────┘
```

### 2.3 What stays in hub vs moves to Staff HQ

| Surface | Location | Rationale |
|---------|----------|-----------|
| Executive dashboard | **hub** `/owner` | Strategic, not operational |
| Company settings / brand | **hub** `/owner` | Owner-only |
| AI assistant | **hub** `/owner/ai` | Owner tool |
| Internal comms (broadcast) | **hub** `/owner/comms` | Owner-to-company |
| Division operations | **Staff HQ** `/care`, `/studio`, etc. | Staff-operated |
| Support desk | **Staff HQ** `/support` | Cross-division |
| Finance / treasury | **Staff HQ** `/finance` | Operational finance |
| Workforce / HR | **Staff HQ** `/workforce` | Staff admin |
| Queue management | **Staff HQ** `/operations` | Cross-division ops |

---

## 3. Unified role model

### 3.1 Canonical role taxonomy

Replace per-app role definitions with a single shared model in `@henryco/config` or a new `@henryco/auth` package:

```
PlatformRole (hierarchy)
├── owner              → full platform access, all divisions
├── admin              → platform admin, all divisions (delegated by owner)
├── division_manager   → manages one or more divisions
├── operations_staff   → operational access within assigned divisions
├── support_agent      → support desk access, cross-division
├── finance_officer    → finance workspace access
├── moderator          → moderation queues, assigned divisions
├── specialist         → division-specific role (e.g. rider, PM, sales)
└── viewer             → read-only staff access
```

### 3.2 Division assignment

```
workspace_staff_memberships
├── profile_id          → FK to profiles
├── platform_role       → PlatformRole (primary)
├── employment_status   → active, suspended, terminated
├── primary_division    → default workspace on login
└── metadata            → jsonb (specializations, certifications)

workspace_division_memberships
├── staff_membership_id → FK to workspace_staff_memberships
├── division            → care, studio, marketplace, jobs, learn, logistics, property
├── division_role       → division-specific specialization
├── permission_overrides → jsonb (optional fine-grained overrides)
└── is_primary          → boolean
```

### 3.3 Permission model

```
Permissions = PlatformRole defaults + division membership + optional overrides

Examples:
  owner           → *.* (everything)
  admin           → *.* except owner-only settings
  division_manager(care) → care.*, workforce.read, finance.division_read
  support_agent   → support.*, {assigned_divisions}.tickets.read
  specialist(rider) → care.deliveries.*, care.tracking.*
```

---

## 4. Shared internal shell

### 4.1 Components needed (new `@henryco/ui` exports or new `@henryco/staff-shell` package)

| Component | Purpose |
|-----------|---------|
| `StaffShellLayout` | Master layout — sidebar + header + content + command bar |
| `StaffSidebar` | Role-aware sidebar with division sections |
| `StaffCommandBar` | `cmdk`-style command palette (search, navigate, assign, quick actions) |
| `StaffNotificationCenter` | Real-time notifications bell + panel |
| `StaffBreadcrumb` | Context-aware breadcrumb (division → section → entity) |
| `StaffQueueWidget` | Active queue count + SLA indicators |
| `StaffSearchBar` | Cross-division entity search |
| `StaffUserMenu` | Role display, division switcher, logout |

### 4.2 Sidebar structure (role-filtered)

```
STAFF HQ
├── 📋 Dashboard              → role-specific landing
├── 📨 Inbox                   → unified task inbox
├── 🔍 Search                  → cross-division search
│
├── WORKSPACES
│   ├── Support                → tickets, threads, SLA
│   ├── Care                   → bookings, reviews, riders
│   ├── Studio                 → leads, projects, milestones
│   ├── Marketplace            → orders, vendors, disputes, moderation
│   ├── Jobs                   → postings, applications, employers
│   ├── Learn                  → enrollments, teachers, certificates
│   ├── Logistics              → shipments, dispatch, tracking
│   └── Property               → listings, inquiries, viewings
│
├── OPERATIONS
│   ├── Finance                → invoices, payouts, wallet ops
│   ├── Workforce              → staff directory, scheduling
│   └── Queue Management       → cross-division queue overview
│
├── ADMIN
│   ├── Audit Log              → platform-wide activity log
│   ├── Settings               → staff platform config
│   └── Roles & Permissions    → RBAC management
```

Sidebar items are filtered by `PlatformRole` + `division_memberships`. A support agent sees only Support + their assigned division workspaces.

### 4.3 Login redirect logic

```
POST /auth/callback
  1. Validate Supabase session
  2. Load workspace_staff_memberships
  3. If no staff membership → redirect to public account
  4. If single division + single role → redirect to that workspace
  5. If multi-role or multi-division → redirect to /dashboard (unified inbox)
  6. If owner/admin → show full sidebar, land on /dashboard
```

---

## 5. Data handoff: public → staff

### 5.1 Event-driven architecture

Every public action that requires staff attention should:

1. **Create the operational record** (already happens for most workflows)
2. **Emit a workspace event** → `workspace_operational_events` table
3. **Create/update a queue item** → `workspace_queue_items` table
4. **Notify relevant staff** → `workspace_notifications` (in-app + optional email/push)

### 5.2 Queue item schema

```sql
workspace_queue_items
├── id                    uuid PRIMARY KEY
├── division              text NOT NULL (care, studio, marketplace, ...)
├── category              text NOT NULL (booking, order, ticket, application, ...)
├── source_table          text NOT NULL (care_bookings, marketplace_orders, ...)
├── source_id             uuid NOT NULL
├── priority              text DEFAULT 'normal' (critical, high, normal, low)
├── status                text DEFAULT 'open' (open, assigned, in_progress, resolved, escalated)
├── assigned_to           uuid REFERENCES workspace_staff_memberships
├── sla_deadline          timestamptz
├── escalation_level      int DEFAULT 0
├── metadata              jsonb
├── created_at            timestamptz DEFAULT now()
├── updated_at            timestamptz DEFAULT now()
```

### 5.3 Workflow-to-queue mapping

| Public event | Division | Queue category | Auto-assign rule |
|-------------|----------|---------------|------------------|
| New care booking | care | `booking` | Round-robin care ops staff |
| Care payment mismatch | care | `payment_review` | Finance officer |
| New care review | care | `review_moderation` | Care moderator |
| Marketplace order | marketplace | `order` | Vendor (primary), ops (escalation) |
| Marketplace dispute | marketplace | `dispute` | Moderation team |
| Vendor application | marketplace | `vendor_review` | Marketplace admin |
| Job posted (pending) | jobs | `job_moderation` | Jobs moderator |
| Job application (internal) | jobs | `internal_hiring` | HR / hiring manager |
| Learn enrollment (awaiting_payment) | learn | `enrollment_payment` | Finance officer |
| Teacher application | learn | `teacher_review` | Learn admin |
| Learner support request | learn | `support_ticket` | Support agent |
| Studio brief submitted | studio | `lead` | Sales team |
| Studio payment proof | studio | `payment_verification` | Finance officer |
| Property inquiry | property | `inquiry` | Property agent |
| Property listing submission | property | `listing_moderation` | Property admin |
| Logistics booking | logistics | `shipment` | Dispatch team |
| Wallet funding request | account | `funding_review` | Finance officer |
| Wallet withdrawal | account | `withdrawal_review` | Finance officer |
| Contact form (super-app) | support | `contact` | Support agent |

---

## 6. Owner ↔ Staff relationship

### 6.1 Owner can:

| Action | Target | Mechanism |
|--------|--------|-----------|
| **Assign tasks** | Any staff member | Create `workspace_tasks` with `assigned_staff_membership_id` |
| **Reassign queue items** | Any queue item | Update `workspace_queue_items.assigned_to` |
| **Approve** | Payouts, vendor KYC, listings, teacher apps | Approval actions write to source table + audit log |
| **Escalate** | Any item to higher priority | Update priority + `escalation_level` |
| **View all** | Every workspace, every division | Full sidebar, no filtering |
| **Configure** | Roles, permissions, SLA rules, division settings | Admin panels in hub `/owner` |

### 6.2 Staff can:

| Action | Scope | Mechanism |
|--------|-------|-----------|
| **Work queue items** | Assigned division(s) only | Claim, process, resolve queue items |
| **Escalate to owner** | Any item they can see | Set `status = 'escalated'`, increment `escalation_level` |
| **Escalate to manager** | Items in their division | Route to `division_manager` |
| **Request approval** | Items requiring owner sign-off | Create approval request in `workspace_tasks` |
| **Add internal notes** | Items they work on | `workspace_internal_notes` linked to source |
| **View history** | Items in their scope | Audit trail via `workspace_operational_events` |

### 6.3 Escalation chain

```
Specialist → Division Manager → Admin → Owner
    ↓              ↓               ↓        ↓
  works         reviews        approves   final call
```

### 6.4 Visibility rules

| Viewer | Sees |
|--------|------|
| Owner | Everything across all divisions |
| Admin | Everything across all divisions (minus owner-only settings) |
| Division Manager | All items in their managed division(s) + cross-division escalations to them |
| Operations Staff | Items in their assigned division(s) matching their role |
| Support Agent | Support tickets across assigned divisions |
| Finance Officer | Financial items across all divisions |
| Specialist | Items matching their specialization in assigned division(s) |

---

## 7. Dashboard taxonomy

### 7.1 Dashboard types

| Dashboard | Role(s) | Key widgets |
|-----------|---------|-------------|
| **Executive** | owner, admin | KPIs across all divisions, revenue, active projects, staff utilization, SLA compliance |
| **Division Manager** | division_manager | Division KPIs, team workload, queue depth, SLA, escalations |
| **Support Desk** | support_agent | Open tickets, SLA countdown, assigned items, CSAT |
| **Operations** | operations_staff | Queue overview, assignment board, throughput metrics |
| **Finance** | finance_officer | Pending payouts, funding requests, withdrawals, revenue by division |
| **Workforce** | admin, division_manager | Staff directory, shift coverage, onboarding pipeline |
| **Division-specific** | per-division staff | Domain-relevant metrics (e.g. Care: bookings today, active riders; Studio: active projects, pipeline value) |

### 7.2 Unified inbox (all staff)

Every staff member lands on a unified inbox showing:
- Queue items assigned to them (sorted by SLA urgency)
- Tasks assigned by owner/manager
- Notifications requiring action
- Recent escalations in their scope

---

## 8. Technical implementation plan

### 8.1 Phase 0 — prerequisites (before any UI)

1. **Create `@henryco/auth` package** — unified `PlatformRole`, `Permission`, role checking utilities
2. **Consolidate role types** — replace per-app role unions with canonical taxonomy
3. **Add missing DDL** — `staff_audit_logs`, `audit_logs`, `logistics_role_memberships` (tables referenced in code but not in migrations)
4. **Fill RLS gaps** — `workspace_*` tables have RLS enabled but no policies; `care /admin` has no server auth
5. **Create queue item infrastructure** — `workspace_queue_items` population from existing public workflows

### 8.2 Phase 1 — Staff HQ app scaffold

1. **Create `apps/staff`** — new Next.js app, port 3020
2. **Shared staff shell** — `StaffShellLayout`, sidebar, command bar, notifications
3. **Auth flow** — staff login, role-based redirect, division-aware session
4. **Unified inbox** — `/dashboard` with queue items, tasks, notifications
5. **Support workspace** — `/support` as first workspace (cross-division, most universal)

### 8.3 Phase 2 — division workspaces

1. **Migrate live staff surfaces** from division apps into Staff HQ:
   - Studio `/sales`, `/pm`, `/delivery`, `/finance`, `/support` → Staff HQ `/studio/*`
   - Learn `/admin`, `/analytics` → Staff HQ `/learn/*`
   - Marketplace `/admin` → Staff HQ `/marketplace/*`
   - Property `/admin` → Staff HQ `/property/*`
2. **Build missing workspaces:**
   - Care operations (bookings, riders, scheduling)
   - Logistics dispatch (shipments, tracking, assignment)
   - Jobs moderation (posting review, employer verification)
3. **Remove `StaffSurfaceRetired` usages** — replace with redirects to Staff HQ

### 8.4 Phase 3 — operational depth

1. **SLA engine** — deadline calculation, auto-escalation, breach alerts
2. **Assignment automation** — round-robin, skill-based, load-balanced
3. **Analytics dashboards** — per-role, per-division, executive
4. **Internal comms integration** — link existing `hq_internal_comm_*` into Staff HQ
5. **Audit trail UI** — searchable, filterable activity log

### 8.5 Phase 4 — optional subdomain breakout

Evaluate breakout criteria. If met:
1. Extract workspace into standalone app
2. Configure subdomain routing
3. Maintain shared auth (cookie domain already supports this)
4. Keep Staff HQ as the master hub linking to breakout domains

---

## 9. Gaps and risks

| Gap | Severity | Mitigation |
|-----|----------|------------|
| Care `/admin` has no server-side auth check | **Critical** | Add `requireCareRoles` before any Staff HQ migration |
| Multiple tables referenced in code lack DDL in repo | **High** | Audit live Supabase schema; backfill migration files |
| No unified RBAC package | **High** | Phase 0 prerequisite — create `@henryco/auth` |
| `workspace_*` tables have RLS enabled but no policies | **High** | Write policies before any staff-facing reads |
| Logistics has no staff notification on new bookings | **Medium** | Add `notifyStaffRoles` to logistics booking flow |
| Super-app contact form has no staff notification | **Medium** | Add queue item creation or email alert |
| No command palette exists anywhere | **Medium** | Build as part of shared staff shell |
| Notifications are account-local, not shared | **Medium** | Extend to cross-app or build staff-specific notification system |
| No `turbo.json` — adding an 11th app increases CI time | **Low** | Consider adding Turborepo for caching |

---

## 10. Decision log

| Decision | Chosen | Rejected | Rationale |
|----------|--------|----------|-----------|
| Domain strategy | Single `staffhq.henrycogroup.com` first | Per-division subdomains from day one | Avoids auth complexity; can break out later if justified |
| App structure | New `apps/staff` | Extend hub | Hub is already large (owner command center); staff is a different product with different users |
| Role model | Single canonical taxonomy in shared package | Keep per-app role definitions | Current fragmentation makes cross-division features impossible |
| Shell approach | Shared staff shell components in `@henryco/ui` | Per-workspace custom shells | Consistency, faster development, unified UX |
| Queue system | DB-backed queue items table | External message queue (Redis, RabbitMQ) | Supabase realtime sufficient for MVP; simpler ops |
| Login flow | Staff-specific login → role-aware redirect | Reuse account login | Staff needs different UX; account login is customer-focused |
