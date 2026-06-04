# Henry Onyx Command Center — Architecture

**Track:** V3-COMMAND (Owner Command Center + Staff Workspace)
**This document satisfies:** V3-COMMAND-01 (audit + architecture blueprint)
**Built against this blueprint:** V3-COMMAND-02 (staged foundation, mock-first)
**Brand:** Henry Onyx · **Legal:** Henry Onyx Limited · **Code identifiers:** `HenryCo` / `@henryco/*` (unchanged)
**Status:** Staged foundation. ZERO live data, ZERO cross-division wiring. Same de-risked, mock-first discipline as the payment router (V3-13): prove the architecture before wiring anything real.

> The Command Center is the **owner's brain over the whole company** — one dense, action-oriented operations console where every division reports what needs attention *up* through a single typed contract, and the owner (and scoped staff) act on it. This pass STAGES the new home; live extraction is V3-COMMAND-03, gated on the finance spine (V3-22) and the real domain.

---

## 1. What this is (and is not)

It **is** three things:

1. A **three-surface architecture** that formalizes a split the monorepo already gestures at — Owner Command Center, Staff Workspace, and the existing Customer surfaces.
2. A **publish-to-command contract**: one shared, typed, framework-agnostic package (`@henryco/command-contract`) that defines the single shape — the `AttentionItem` — every division uses to report attention-items up, plus the pure logic that validates, gates, scopes, and aggregates them. It mirrors `@henryco/payment-router`: raw-TypeScript source, a legal-transition state machine, an in-memory store that proves the flow, and a `node:test` suite that is the gate.
3. Two **staged surfaces** (`apps/command`, `apps/work`) that consume the contract against a **mock attention feed** to prove the shape end-to-end, on separate Vercel free-domain subdomains.

It is **not** (in this pass): a live data pipeline, a move of the real owner/staff surfaces, a new auth system, or a finance/ledger source of truth. The real `apps/hub/app/owner/(command)` and `apps/staff` surfaces are **left running untouched**. No production traffic touches anything built here.

---

## 2. The seam we build on (audit findings)

The codebase already encodes a **three-track identity model** (`apps/hub/app/owner/(command)/layout.tsx`):

| Track | Predicate / eligibility | Surface today | Audience |
|---|---|---|---|
| **A** | `getEligibleModules(viewer)` | `apps/account` | Customer / personal account |
| **B** | `getEligibleOwnerModules(viewer)` | `apps/hub/app/owner/(command)` | Owner (super_admin) |
| **C** | `getEligibleStaffModules(viewer)` | `apps/staff` (`(track-c)` + `(workspace)`) | Cross-division & per-division operators |

**Existing owner surface** (`apps/hub/app/owner/(command)`) is already a registry-driven workspace — sidebar from `getOwnerRailEntries`, Cmd+K palette, realtime bridge, notifications, AI FAB — themed on `--acct-*` / `--owner-accent`. Its overview (`page.tsx`) is a **hand-rolled, hub-private** attention board: `getOwnerOverviewData()` (`apps/hub/lib/owner-data.ts`) already synthesizes:

- `OwnerSignal = { id, title, body, severity: critical|warning|info|good, division, href, source, createdAt }`
- `DivisionSnapshot = { healthScore, supportOpen, workOpen, alertCount, staffingCount, onboardingPending, signals[] }`

This is exactly the de-facto "publish-to-command" shape — but it lives **inside `apps/hub`**, computed by one app reaching into every division's tables. The Command Center's job is to **invert that**: each division *publishes* `AttentionItem`s up through a shared contract, instead of one app pulling from all of them.

**Existing staff surface** (`apps/staff`) has two route groups: `(track-c)` (the registry-driven generic module shell — `modules/[slug]`, `_internal/viewer.ts`, role-switcher, bulk-actions, exports) and `(workspace)` (concrete per-function pages: `care`, `finance`, `jobs`, `kyc`, `learn`, `logistics`, `marketplace`, `operations`, `property`, `studio`, `support`, `workforce`, `search`, `settings`). Staff act on the *operational* slice; a subset *escalates* to the owner.

**Role/permission predicate model** (`@henryco/auth`, `apps/hub/lib/owner-auth.ts`, SQL `is_staff_in()` / `is_platform_staff()` / `is_owner()`):

- `DashboardRole = "customer" | "staff" | "division_operator" | "super_admin"` (owner routes through `super_admin` today).
- `AccessSnapshot = { hasOwnerAccess, hasStaffAccess, staffDivisionCount, ownerRole, profileRole }`.
- `UnifiedViewer = { user, access, role, kind: "customer" | "staff" | "owner" }`.
- `StaffDivision` = the 12 the SQL `is_staff_in()` recognizes: `marketplace, studio, property, learn, logistics, jobs, care, hub, staff, account, security, system`.
- Preference cookie `hc_dash_pref` (`customer|staff|owner`), scoped to the base domain so it crosses subdomains.

The staged surfaces **mirror these predicate NAMES** in a mock module — without importing any server-only code — so the access boundary is provable on staging with mocked sessions.

---

## 3. The three-surface architecture

```
                         ┌──────────────────────────────────────────┐
                         │  @henryco/command-contract  (node-only)   │
   each division ───────▶│  AttentionItem · state machine · access   │◀─────── one shape, UP
   publishes UP          │  gating · division scoping · aggregation  │
                         │  · InMemoryAttentionStore · mock feed     │
                         └───────────────┬───────────────┬──────────┘
                                         │               │
                       ┌─────────────────▼──┐         ┌──▼──────────────────┐
                       │  Owner Command      │         │  Staff Workspace     │
   command.<domain> ──▶│  Center (apps/cmd)  │         │  (apps/work)         │◀── work.<domain>
                       │  FULL firehose,     │         │  staff/both items,   │
                       │  owner-gated        │         │  scoped to divisions │
                       └─────────────────────┘         └──────────────────────┘

   Customer surfaces (apps/account, division public apps) — unchanged, out of scope.
```

- **Owner Command Center** (`apps/command`, `command.<domain>`): the firehose. Owner sees **every** attention-item across all divisions and surfaces, sorted by priority, grouped by division, with money-at-stake totals. Gated on `hasOwnerAccess`.
- **Staff Workspace** (`apps/work`, `work.<domain>`): the operational queue. A staff member sees `staff`/`both` items **scoped to the divisions they belong to** (`is_staff_in`). They can acknowledge, work, resolve, or **escalate** an item up to the owner. Gated on `hasStaffAccess`.
- **Customer surfaces**: existing `apps/account` + division public apps. Untouched. A customer-kind viewer is **denied** both new surfaces.

Domains are **never hardcoded**. The eventual real hosts resolve from `henrySubdomain("command")` / `henrySubdomain("work")` over `COMPANY.group.baseDomain` (env `NEXT_PUBLIC_BASE_DOMAIN`) — so the `henryonyx.com` flip later is one env change, zero code. On staging, each app deploys to its default Vercel free domain (`*.vercel.app`).

---

## 4. The publish-to-command contract

The single shape every division reports up. Generalizes `OwnerSignal` + the per-division taxonomy below, and carries exactly the fields the pass requires: **source division, type, priority, action-needed, deep-link-to-act, status**.

```ts
type AttentionItem = {
  id: AttentionItemId;          // branded string
  division: Division;           // source division (the 10 + 'system')
  type: AttentionType;          // the cross-division taxonomy (§5)
  priority: AttentionPriority;  // 'critical' | 'high' | 'medium' | 'low'
  surface: AttentionSurface;    // 'owner' | 'staff' | 'both' — who must act
  status: AttentionStatus;      // lifecycle (§4.1)
  title: string;                // one-line headline
  summary: string;              // the why, in a sentence
  actionLabel: string;          // the verb the operator performs ("Review payout", "Approve listing")
  deepLink: string;             // route the operator acts through
  createdAt: string;            // ISO-8601, supplied by the publisher (pure core never reads the clock)
  staffScope?: StaffDivision[]; // which staff divisions may see/act (default: [division])
  amountMinor?: number | null;  // money context, minor units (for money items)
  currency?: string | null;     // ISO-4217
  entityRef?: string | null;    // source row id (provenance)
  source?: string | null;       // table/lib provenance string
};
```

### 4.1 Lifecycle state machine

Same SQL-mirror discipline as `payment-router`: one `LEGAL_TRANSITIONS` table is the source of truth; same-state writes are idempotent no-ops; terminal states have no exits. (The mirroring SQL trigger lands in V3-COMMAND-03 when the table is real.)

```
open         → acknowledged | in_progress | escalated | dismissed
acknowledged → in_progress | escalated | resolved | dismissed
in_progress  → acknowledged | escalated | resolved
escalated    → in_progress | resolved | dismissed     (escalated = bumped to owner)
resolved     → ∅   (terminal)
dismissed    → ∅   (terminal)
```

`escalated` is the honest intermediate between *staff can't/shouldn't decide this* and *the owner has it*: a staff member escalates, the item surfaces to the owner, and the owner resolves or dismisses. `resolved` always means "acted and closed"; `dismissed` means "no action needed / false signal".

### 4.2 Publishing

```ts
interface AttentionSink { publish(item: AttentionItem): void; list(): readonly AttentionItem[]; }
class InMemoryAttentionStore implements AttentionSink { … }   // proves the flow with zero live data

publishAttentionItem(sink, input): Result<AttentionItem, ValidationError>
```

`publishAttentionItem` validates the input (known division/type/priority/surface, non-empty title/actionLabel/deepLink, valid money pair) and returns the `Result<T,E>` discriminated union — failures are never coerced into success. The `InMemoryAttentionStore` is the staging sink; in V3-COMMAND-03 the same interface is implemented by a Supabase-backed store (one `command_attention_items` table + RLS), no surface change.

### 4.3 Reading (per-surface, scoped)

```ts
visibleItems(viewer, items): AttentionItem[]   // owner ⇒ all; staff ⇒ staff/both ∩ their divisions; customer ⇒ []
prioritySort(items)                            // critical>high>medium>low, then createdAt desc
groupByDivision(items) · countByPriority(items) · moneyAtStake(items)
summarizeForOwner(items): OwnerCommandSummary  // per-division snapshot the firehose renders
```

---

## 5. The cross-division attention taxonomy

One closed `AttentionType` union, derived from the live `learn` audit and generalized across divisions. Every division's owner-attention reduces to these:

| Type | Means | Typical surface |
|---|---|---|
| `seller-application` | New seller/instructor/partner wants in; approving shapes money (revenue share) | both |
| `kyc-review` | Identity/credential/document verification gating access | both |
| `high-value-listing` | A listing/quote/proposal above a value threshold needs owner eyes before it goes live | owner |
| `flagged-transaction` | A transaction tripped a fraud/risk signal | both |
| `pending-payout` | Money owed out (seller/instructor/driver settlement) awaiting approval | both |
| `pending-payment` | Inbound money awaiting manual confirmation/reconciliation | staff |
| `refund-request` | A refund/claim requested, money-truth pending | both |
| `dispute` | A two-party dispute (buyer/seller, client/operator) | both |
| `moderation-item` | Reported/queued content awaiting approve/hide | staff |
| `booking-exception` | A booking/delivery/assignment failed, is late, or needs reschedule/reassign | staff |
| `support-escalation` | A support thread escalated past first-line | staff |
| `publish-review` | Catalog/content publish the owner should be aware of | both |
| `config-risk` | A configuration/awareness risk (e.g. owner alerts silently dropping) | owner |

---

## 6. Division → owner-attention map (all 10)

The 10 registry divisions (`packages/config/company.ts`): `hub, care, building, hotel, marketplace, property, logistics, studio, jobs, learn`. `learn` is **code-verified** (full audit). The rest are mapped from their app/route reality, the staff `(workspace)` surface, and `owner-data.ts`; items not yet backed by a concrete code path are marked **(projected)** and will be confirmed at live-wiring time.

- **learn** *(verified)* — instructor applications (`seller-application` + `kyc-review` of credential files), manual `pending-payment` confirmation, instructor `pending-payout` (read-only today — a real gap), course-review `moderation-item` (reviews stranded in `pending` — a real gap), overdue-assignment `booking-exception`, learn `support-escalation`, course `publish-review`, owner-alert-routing `config-risk`. *Sources: `apps/learn/lib/learn/workflows.ts`, `instructor-payouts.ts`, `data.ts`, `learn_teacher_applications`/`learn_payments`/`learn_instructor_payouts`/`learn_reviews`.*
- **marketplace** — `high-value-listing` (review before publish), `flagged-transaction` (risk signal), `pending-payout` (seller settlement), `seller-application` (+`kyc-review`), `dispute` (buyer↔seller), `moderation-item` (reported listing), `refund-request`. *Staff surface: `apps/staff/app/(workspace)/marketplace`.*
- **studio** — `publish/proposal-signature` pending, `high-value-listing` (proposal above threshold → owner), `pending-payment` (payment-plan milestone), `dispute`/`support-escalation` (client). *Sources: `studio_proposal_signatures`, `studio_payment_plans`, `studio_resource_allocations`.*
- **jobs** — employer `kyc-review`/`seller-application` (verification), `moderation-item` (flagged posting), `pending-payment` (featured post), `dispute` (candidate/employer). *Staff surface: `(workspace)/jobs`.*
- **care** — damage/loss `refund-request`/`dispute` (`care_claims`), `booking-exception` (failed pickup/delivery, missing POD — `care_pod_records`), `pending-payment`, `high-value-listing` (large recurring contract → owner, projected). *Sources: `care_claims`, `care_pod_records`, `care_recurring_schedules`.*
- **logistics** — `booking-exception` (failed/delayed delivery), driver `seller-application`+`kyc-review` (onboarding), `pending-payment` (COD reconciliation, projected), parcel `refund-request`/`dispute` (lost/damaged claim), `support-escalation`.
- **property** — `high-value-listing` (managed-property submission review), `moderation-item` (submitted listing), `seller-application` (landlord/agent onboarding), lease/contract `dispute` (projected). *Staff surface: `(workspace)/property`.*
- **building** *(projected — thin code today)* — `high-value-listing` (quote above threshold → owner approval), milestone `publish-review` (sign-off), contract-signature `pending`. *Lives under property/construction; confirm at wiring time.*
- **hotel** *(projected — `packages/rooms`)* — `booking-exception` (overbooking/availability), guest `support-escalation`, `refund-request`. *Lives under property/rooms.*
- **hub** *(company/system)* — cross-division owner alerts, staff invite/role `seller-application` (approval), brand/CMS `publish-review`, finance reconciliation `pending-payout`/`flagged-transaction`, audit-log anomaly `config-risk`. *Sources: `apps/hub/app/owner/(command)/*`, `owner-data.ts`. The hub is also the **`system`** lane for items not owned by a product division.*

This map drives the mock feed: `mockAttentionFeed()` emits items across all 10 divisions covering every `AttentionType`, `AttentionPriority`, and `AttentionSurface`, so the staged surfaces exercise the whole contract.

---

## 7. Access boundaries (mocked for staging, mirroring the real predicates)

A node-only `access` module mirrors the real predicate **names** without importing server code:

```ts
type MockViewer = {
  kind: 'owner' | 'staff' | 'customer';
  hasOwnerAccess: boolean;      // ⇔ is_owner() / super_admin
  hasStaffAccess: boolean;      // ⇔ is_platform_staff() / is_staff_in(any)
  staffDivisions: StaffDivision[]; // ⇔ the set of is_staff_in(division)=true
};

canViewCommandCenter(v) = v.hasOwnerAccess;     // gates apps/command
canViewStaffWorkspace(v) = v.hasStaffAccess;    // gates apps/work
visibleItems(v, items):
  owner    → all items (the firehose)
  staff    → items where surface ∈ {staff, both} AND (staffScope ∩ v.staffDivisions ≠ ∅)
  customer → []   (denied both surfaces)
```

Each staged app boots a **mock session** (selectable in staging via a session switcher) so the boundary is provable: an owner session sees everything; a staff session sees only its divisions' operational items; a customer session is bounced to a "no access" state. At live-wiring (V3-COMMAND-03) the `MockViewer` is replaced by the real `UnifiedViewer` from `@henryco/auth/server` and the predicate functions by the SQL ones — the gating *call sites* and the visible-items logic do not change.

---

## 8. Package & app layout (this pass)

```
packages/command-contract/            @henryco/command-contract — node-only, raw TS source, node:test gate
  src/types.ts            Result<T,E>, branded AttentionItemId, Division/AttentionType/Priority/
                          Surface/Status unions, validators, StaffDivision re-export.
  src/state-machine.ts    LEGAL_TRANSITIONS + isLegalTransition + assertTransition (SQL-mirror discipline).
  src/errors.ts           ValidationError, IllegalAttentionTransitionError.
  src/access.ts           MockViewer + canViewCommandCenter/canViewStaffWorkspace/visibleItems.
  src/aggregate.ts        prioritySort, groupByDivision, countByPriority, moneyAtStake, summarizeForOwner.
  src/publish.ts          AttentionSink, InMemoryAttentionStore, publishAttentionItem.
  src/mock/feed.ts        mockAttentionFeed() — deterministic cross-division feed (10 divisions, every type).
  src/index.ts            runtime-safe barrel.
  src/__tests__/*.test.ts node:test + node:assert/strict.

packages/command-surface/             @henryco/command-surface — React UI primitives shared by both apps
  AttentionCard · PriorityBadge · DivisionBadge · SurfaceShell · MetricStat · AttentionFeed · SessionSwitcher

apps/command/   Owner Command Center  (deploys to command-*.vercel.app; real host = henrySubdomain('command'))
apps/work/      Staff Workspace       (deploys to work-*.vercel.app;    real host = henrySubdomain('work'))
```

Both apps are deliberately **lean**: no Supabase, no Sentry, no server auth — only `@henryco/command-contract`, `@henryco/command-surface`, `@henryco/config`, and the locked design tokens (`packages/ui` token import chain + Fraunces). Because they hold no secrets and read no live data, they deploy clean on Vercel free domains with no env (sidestepping the preview-env gap that affects the live apps).

Design: the **locked Henry Onyx family** (`--acct-*` ops tokens, Fraunces display, copper/gold accent) but a **dense, action-oriented operations console** — not a marketing page. Information density first: tight rows, priority colour-coding, division accents, money-at-stake totals, keyboard-forward.

---

## 9. Dormancy & safety

Same posture as the payment rail: **nothing here is reachable from production**. The staged apps are separate Vercel projects on free domains; no existing app links to them; no live table is read or written; the contract's only sink is in-memory. The mock feed and session switcher are guarded behind a staging seam (a `COMMAND_STAGE` env, defaulting to mock) so that when V3-COMMAND-03 wires live data, the mock path is a single flag away from off. No code identifiers change (`@henryco/*` stays).

---

## 10. What V3-COMMAND-02 proves vs. what V3-COMMAND-03 wires live

**Proven here (mock-first):** the three-surface split; the `AttentionItem` contract + state machine; publish→store→read flow end-to-end via `InMemoryAttentionStore`; the cross-division taxonomy exercised by `mockAttentionFeed()`; owner/staff/customer access-gating + staff division-scoping (mocked sessions); the dense ops-console design on the locked tokens; two deployable surfaces on Vercel free domains.

**Deferred to V3-COMMAND-03 (live wiring — gated):**
- Replace `InMemoryAttentionStore` with a Supabase-backed `command_attention_items` table + RLS, and add the SQL trigger mirroring `LEGAL_TRANSITIONS`.
- Each division publishes real `AttentionItem`s at the points the audit identified (e.g. `learn` on `submitTeacherApplication`, marketplace on flagged transactions) — replacing the `apps/hub` pull model.
- Replace `MockViewer` with the real `UnifiedViewer`/SQL predicates; flip the staged apps onto `henrySubdomain('command'|'work')` real hosts.
- **Gated on:** the finance spine (V3-22) for the money-at-stake totals to be authoritative, and the real `henryonyx.com` subdomains.

---

## 11. Verification (this pass)

- `@henryco/command-contract` `node:test` suite green (state machine, validation, access gating, scoping, aggregation, publish flow, mock-feed coverage).
- `typecheck` / `lint` / `build` green for both new apps (they enter the `apps/*` CI gate; the contract package is typechecked transitively + has its own test step).
- Mock attention-items flow through the contract into both surfaces; access-gating demonstrated with mocked owner/staff/customer sessions.
- Both staged surfaces load on their Vercel free-domain subdomains (screenshots in the pass report).
