# DASH-9 — Staff Dashboard (Track C, Forged Prompt)

**Status:** Authored, awaiting owner review. Adds a third canonical product to the rebuild pack alongside Track A (consumer at `account.henrycogroup.com`) and Track B (owner at `hq.henrycogroup.com/owner`). The V2-FINAL master orchestration's original design folded staff into Track A as a role-aware composition; the V2 closure handover promotes staff to its own track because `apps/staff` is V1 scaffolding to be replaced (not patched) and the operator workflow shape is closer to Track B's density-first treatment than to Track A's clarity-first one.

```
TOOL: Claude Code (Opus 4.7)
EFFORT: xhigh
PROJECT: HenryCo Ecosystem · henrycogroup.com · V2 active
PASS: V2-DASH-09 — Staff dashboard (Track C, separate canonical surface)
EXPECTED DURATION: Long. Track C may begin scaffolding after DASH-1 merges
                   and foundations stabilize, but MUST NOT enter production
                   until DASH-7 has been live ≥ 14 days (parallel risk
                   profile to Track B / DASH-8). This phase replaces a V1
                   scaffolding app entirely; double-check before deletion.

═══════════════════════════════════════════════════════
ROLE
═══════════════════════════════════════════════════════

Principal Systems Architect, Production Engineer, and Continuity Auditor
for the HenryCo Ecosystem. Opus 4.7. Self-verify against V1–V13 + V18–V20
(Track-C-specific gate additions). Name every uncertainty explicitly.

═══════════════════════════════════════════════════════
CANONICAL SURFACE — owner decision required at G0
═══════════════════════════════════════════════════════

Track C ships at one of two URLs. The decision is OWNER-BLOCKING and
must be recorded in .codex-temp/v2-dash-09/canonical-surface.md before
G1. Whichever option is chosen, the OTHER staff-bearing URLs all 308 to
the canonical Track C URL.

OPTION A (recommended): staff.henrycogroup.com
  - Fresh subdomain. Clean break from staffhq's redirect-loop history
    (audit §A.4-1).
  - Cookie domain remains .henrycogroup.com (cross-track session
    preserved via the shared parent).
  - Requires DNS + Vercel project alias add.
  - Comms to existing staff users: "We've moved your operator surface
    to staff.henrycogroup.com — your session continues."

OPTION B: staffhq.henrycogroup.com
  - Existing subdomain (currently in redirect-loop per audit §A.4-1 —
    fixed by this phase).
  - Reuses existing DNS.
  - Comms to existing staff users: "Your bookmarks are restored."
  - Requires the redirect-loop to be cleared by Track C's deploy
    flipping the destination.

═══════════════════════════════════════════════════════
CONTEXT — read in this order BEFORE writing code
═══════════════════════════════════════════════════════

1. docs/dashboard/DASHBOARD-AUDIT-REPORT.md (§A.4-1 redirect-loop CRITICAL,
   §A.16 staff workspace baseline, §A.17 care staff routing,
   §B.staff per-app observations, §C.10 — staff is its own product
   surface, §D.2 5 staff personas)
2. docs/dashboard/DASHBOARD-REBUILD-PROMPT-V2-FINAL.md (master §2 Track
   B reasoning carries to Track C with division-scoping; §4 anti-
   patterns including #19 role-agnostic UI explicitly forbidden)
3. docs/dashboard/DASH-1-shell-foundations-skeleton.md (Track C reuses
   every foundation primitive)
4. docs/dashboard/DASH-8-owner-dashboard-track-b.md (structural twin —
   density-first separate-product treatment; Track C diverges only on
   division-scoping, sub-roles, queue-first composition, and module set)
5. apps/staff/lib/intelligence-data.ts:getStaffIntelligenceSnapshot
   (existing canonical staff data layer; Track C refactors into
   packages/data helpers parallel to consumer + owner paths)
6. apps/staff/app/(workspace)/* (existing staff surfaces — Track C
   replaces these entirely; apps/staff host is killed in G14)
7. apps/care/app/(staff)/*, apps/marketplace/app/(staff)/*,
   apps/property/app/(staff)/*, apps/studio/app/(staff)/*,
   apps/jobs/app/(staff)/*, apps/learn/app/(staff)/*,
   apps/logistics/app/(staff)/* — every division has staff-side
   surfaces today; Track C subsumes them via per-route inventory at G0
8. apps/hub/supabase/migrations/20260502120000_staff_notifications_audience.sql
   (the public.is_staff_in() predicate function — Track C role-gates
   every module via this; G2 ships is_staff_in_any() companion)
9. .codex-temp/v2-dash-01/report.md (DASH-1 outputs — REQUIRED;
   Track C cannot start without DASH-1 merged)
10. .codex-temp/v2-dash-08/report.md (DASH-8 outputs if shipped — Track
    C reuses BulkActionBar, AdvancedFilterBar, BulkExportButton primitives
    if DASH-8 has shipped them; otherwise Track C ships them as
    Track-C-driven additions and DASH-8 consumes later)
11. apps/hub/app/workspace/[[...slug]]/page.tsx (audit §A.4-1 — the
    redirect-loop stub. DASH-9 absorbs DASH-8's V16 responsibility:
    this stub now 308s to the Track C canonical URL, not to
    account.henrycogroup.com/?role=staff)

═══════════════════════════════════════════════════════
TRUTH HIERARCHY
═══════════════════════════════════════════════════════

CODE TRUTH: what exists in the repo (cite file:line).
DEPLOYMENT TRUTH: what is on Vercel (cite vercel.json + deployment logs).
LIVE TRUTH: what works with real data on production.

Every assertion cites file:line. Every "this works" claim cites the
verification step that confirmed it. No "should work."

═══════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════

Build the staff dashboard as a SEPARATE PRODUCT at the chosen canonical
surface, with a different shape than both consumer and owner dashboards.

Reference standard: a hybrid of Linear (operator dashboards), Stripe
Radar (moderation queues), Intercom Helpdesk (support triage), and
Jira service-desk (assignment + SLA). Specifically:

  Density:  queue-first, table-first, keyboard-driven (between consumer
            calm and owner saturation)
  Trust:    every staff state-change writes audit_log; every SLA timer
            visible on every queue card; sensitive actions require
            reason capture
  Speed:    sub-200 ms perceived response on every queue interaction
            (operators do volume work)
  Power:    bulk operations on queues, advanced filters, exports via
            DOCS-01, division-scoped role gates
  Scope:    division-scoped via is_staff_in() — a Care operator does
            NOT see Marketplace queues; a Marketplace moderator does
            NOT see Property listings
  Ambiguity: a multi-division staff member (e.g. operator in Care +
             moderator in Marketplace) sees BOTH division surfaces in
             the WorkspaceRail; cross-division aggregation tiles in
             staff-overview reflect ONLY their accessible divisions

What this means in practice:

1. DENSITY (NOT clarity, NOT saturation)
   - Queue cards tighter than consumer modules but looser than owner
     finance tables. Each queue card shows: subject, requester, SLA
     timer, division accent, status, last-action, quick-action stack.
   - 8–12 metric tiles in staff-overview (between consumer's 4–6 and
     owner's 12+).
   - Tables-first for ALL queues (support, moderation, dispute,
     application, listing-review, project-coordination, etc.).
   - Keyboard shortcuts pervasive — every queue card has a hotkey
     stack (j/k navigate, x assign, e escalate, c close, d defer,
     etc.) listed in the cheat sheet ("?" pattern; Track C ships its
     OWN cheat sheet because operator shortcuts differ from owner).

2. TRUST (audit log + SLA visibility + reason capture)
   - Every state-changing staff action writes audit_log via
     @henryco/observability's structured logger + Postgres audit_log
     insert. The audit_log row records actor_id, action_type,
     target_type, target_id, before_state, after_state, division,
     correlation_id (for bulk), reason (when prompted).
   - Every queue card shows its SLA timer (target_response_at,
     target_resolution_at) with color-coded urgency.
   - Sensitive actions (refund, suspend, ban, reverse-payout,
     release-payment) require a confirm-modal with reason capture.
     The reason persists on the audit_log row.

3. SPEED
   - Every queue interactive surface targets INP < 200 ms.
   - Server cache aggressive: 60 s for queue lists; 0 s for individual
     case fetches (staff need fresh state on each open).
   - Optimistic UI on queue actions with per-row reconciliation after
     server confirms.

4. POWER
   - Bulk operations: select multiple queue rows, apply action
     (assign, escalate, close, defer, batch-reply, bulk-approve,
     bulk-decline). Confirmation modal cites count + sample.
   - Advanced filters: division, status, assignee, SLA bucket, date
     range, free-text search across the active queue.
   - Exports: every staff queue can export via DOCS-01 — branded PDF
     for snapshot reports, CSV for analysis. Active filter state
     captured in the document header so the operator knows what view
     they downloaded.

5. TRACK C MODULES (port from existing apps/staff +
   apps/*/app/(staff)/* and the audit's staff-side observations)

   Each module is in packages/dashboard-modules-staff-* (separate
   package family from Track A modules and Track B owner-* modules —
   rejecting anti-pattern #19 directly).

   Cross-division:
   - staff-overview (operator briefing — accessible-divisions tiles;
     SLA-warning aggregate; assigned-to-me queue; escalations-pending;
     quick-action stack)
   - staff-support (cross-division support queue with division filter;
     assigns to division specialists)
   - staff-moderation (cross-division content moderation, ToS
     enforcement, user reports, evidence capture)
   - staff-finance-operator (LIMITED finance surface: payout review,
     refund authorization, vendor invoice approval — distinct from
     Track B owner finance which is unrestricted)
   - staff-settings (staff-specific preferences, notification routing
     by division, on-call hours, escalation chain, hotkey overrides)

   Division-scoped (each gated by is_staff_in(division)):
   - staff-care (Care operator queue — bookings, pickups, deliveries,
     payments-pending)
   - staff-marketplace (orders, dispute, vendor-application, payout
     reconciliation, moderation queues)
   - staff-property (listings moderation, viewing coordination,
     submissions queue, inquiries triage)
   - staff-studio (project coordination, milestone tracking, proposal
     review, deliverable approval)
   - staff-jobs (candidate vetting, posting moderation, interview
     coordination)
   - staff-learn (course moderation, certification verification,
     payment dispute)
   - staff-logistics (dispatch, driver coordination, quote review)

6. APPS/STAFF KILL (V1 scaffolding deletion)
   - apps/staff/app/(workspace)/* → permanent 308 to <Track C URL>/
     <corresponding module>. Active staff users land in the Track C
     shell with their division memberships pre-loaded.
   - apps/staff/app/(workspace)/care/page.tsx → 308 to
     <Track C URL>/modules/staff-care
   - apps/staff/app/(workspace)/marketplace/page.tsx → 308 to
     <Track C URL>/modules/staff-marketplace
   - apps/staff/app/(workspace)/<division>/page.tsx → 308 to
     <Track C URL>/modules/staff-<division>
   - Every workspace route gets a permanent 308 to its Track C module
     home. apps/staff stub stays for the 30-day soak. apps/staff is
     DELETED in a follow-up cleanup PR after 30 days of clean operation.

7. APPS/*/APP/(STAFF)/* DOMAIN-SPECIFIC STAFF SURFACES
   These are absorbed by Track C modules. The (staff) route group in
   each division app gets one of three fates per route:
     (a) REDIRECT — 308 to its Track C module equivalent (default)
     (b) DEEP-LINK — continues serving as a deep-linked surface
         under the Track C shell when the domain owns the workflow
     (c) DELETE — duplicate or dead route, removed at G15 cleanup

   DASH-9 G0 recon enumerates each (staff) route and decides per-
   route. The default is (a) redirect. The result is persisted at
   .codex-temp/v2-dash-09/staff-route-inventory.md.

   Audit §C.10 specifically calls out
   apps/care/app/app/(staff)/{manager,owner}/page.tsx duplicates;
   these are deleted in DASH-9 G15.

8. WORKSPACE SURFACE KILL (Track C absorbs DASH-8's V16 responsibility)
   - apps/hub/app/workspace/[[...slug]]/page.tsx → 308 to <Track C
     canonical URL>/ (staff land in staff-overview by default)
   - workspace.henrycogroup.com → 308 to <Track C URL>
   - staffhq.henrycogroup.com — Option A: 308 to staff.henrycogroup.com.
     Option B: staffhq IS the canonical, fix the redirect-loop in
     place by deploying Track C to it.
   - apps/hub/proxy.ts + apps/hub/vercel.json updated to reflect.
   - Note to DASH-8 prompt: Track C now owns this responsibility.
     If DASH-8 has not yet shipped, its V16 gate becomes N/A. If
     DASH-8 has shipped with the workspace stub already 308'd to
     account.henrycogroup.com/?role=staff, DASH-9 flips the
     destination to <Track C URL>.

9. CROSS-TRACK SESSION
   - Track A IdentityBar role-switcher (DASH-1) lets a viewer with
     A+B+C roles hop between hosts. The role-switcher consumes
     packages/auth's resolveUserDashboard — same resolver as login.
     From Track A, switching to "Staff" sets hc_dash_pref and
     redirects to <Track C URL>. From Track C, switching to
     "Customer" or "Owner" redirects to account.henrycogroup.com or
     hq.henrycogroup.com/owner.
   - Three products, one identity, one cookie domain (.henrycogroup.com).
   - The role-switcher in Track C's IdentityBar adds a third option
     when the viewer also has owner role (showing "Customer / Owner
     / Staff" rather than the binary chooser).

10. DIVISION-SCOPED ROLE GATING (defence in depth)
    - Layer 1: middleware/proxy — host + cookie. Standard.
    - Layer 2: Track C shell layout — calls requireUnifiedViewer +
      requireStaffViewer (new helper, lands in DASH-9 G2).
      requireStaffViewer redirects to login + role=staff if no staff
      role at all. Returns viewer with staffMemberships array.
    - Layer 3: each Track C module's getRoleGate(viewer) checks
      is_staff_in(divisionSlug) for division-bound modules; cross-
      division modules check is_staff_in_any() (new SQL predicate,
      lands in DASH-9 G2).
    - Layer 4: RLS — every Supabase query gated by is_staff_in() for
      the relevant division. Service-role bypasses are ONLY in SQL
      functions that aggregate cross-division (e.g. a future
      get_staff_overview_aggregate function); each is RLS-reviewed.

═══════════════════════════════════════════════════════
GATE STRUCTURE
═══════════════════════════════════════════════════════

G0 — Recon at .codex-temp/v2-dash-09/recon.md. Confirm DASH-1 merged
     + DASH-7 in production ≥ 14 days. Confirm canonical surface
     decision recorded at .codex-temp/v2-dash-09/canonical-surface.md.
     Enumerate every apps/*/app/(staff)/* route + apps/staff/app/
     (workspace)/* route into .codex-temp/v2-dash-09/staff-route-
     inventory.md with per-route fate (REDIRECT / DEEP-LINK / DELETE).
G1 — Track C foundation reuse confirmed: packages/auth, packages/
     dashboard-shell, packages/data, packages/observability,
     public.get_signal_feed all green from DASH-1.
G2 — packages/auth extension: requireStaffViewer, getStaffMemberships,
     hasStaffAccessIn(divisionSlug). SQL companion: public.is_staff_in_any()
     predicate function. Migration filename:
     apps/hub/supabase/migrations/<NEXT_TS>_is_staff_in_any.sql.
G3 — Track C shell skeleton at the chosen canonical surface app —
     density-first chrome (different IdentityBar layout from Track A
     and B; queue-first WorkspaceRail with division grouping; sticky
     filter strip; ContextDrawer same primitive but loaded with
     staff-notifications + assigned-to-me + SLA-warning fan-out).
G4 — staff-overview module port (cross-division operator briefing —
     accessible-divisions tiles; assigned-to-me queue; escalations
     pending; SLA-warning aggregate; quick-actions). Reuses
     get_signal_feed for the activity stream, joined with staff_
     notifications via is_staff_in().
G5 — Track C division module ports — staff-care, staff-marketplace,
     staff-property, staff-studio, staff-jobs, staff-learn,
     staff-logistics. Each gated by is_staff_in(division). Each
     queue surface ships with at least one bulk operation, advanced
     filters, and DOCS-01 export.
G6 — Track C cross-division module ports — staff-support, staff-
     moderation, staff-finance-operator, staff-settings.
G7 — Bulk operations + advanced filters + bulk export primitives:
     consumed from @henryco/dashboard-shell if DASH-8 already shipped
     them; otherwise added in DASH-9 (and DASH-8 consumes them later
     when it merges). Specifically: <BulkActionBar>, <AdvancedFilterBar>,
     <BulkExportButton>.
G8 — Audit log + SLA visibility: every state-change writes audit_log;
     every queue card shows SLA timer; sensitive actions require
     reason capture. Probe by running representative actions in each
     module and counting audit_log rows — persisted at
     .codex-temp/v2-dash-09/audit-log-probe.md.
G9 — apps/staff kill: 308 redirects from every apps/staff/(workspace)
     route to corresponding Track C module home. apps/staff stub
     stays for the 30-day soak.
G10 — Workspace surface kill (Track C now owns this): apps/hub/app/
      workspace/[[...slug]] → 308 to <Track C canonical>. workspace.*
      → 308 to <Track C canonical>. staffhq.* per Option A or B.
      Persisted at .codex-temp/v2-dash-09/308-verification.md with
      curl -I transcripts.
G11 — Track A IdentityBar role-switcher integration verified: A↔C
      cross-track session preserved end-to-end. Cookie + session
      probe persisted.
G12 — Track B (DASH-8) role-switcher integration verified (if Track
      B has shipped): B↔C and A↔B↔C cross-track session preserved.
      If DASH-8 has not shipped, this gate is N/A and DASH-8's
      Track-C-aware role-switcher addition is documented as a
      DASH-8 follow-up.
G13 — V1–V13 verification + V18–V20 (Track-C-specific) verification.
G14 — 30-day soak in production. After 30 days clean operation,
      apps/staff is DELETED in a follow-up cleanup PR. Workspace
      stub at apps/hub/app/workspace/[[...slug]] is also DELETED.
G15 — Final cleanup: apps/care/app/app/(staff)/{manager,owner}/page.tsx
      duplicates deleted (audit §C.10). Per-division (staff) routes
      that opted for "REDIRECT" path now deleted (the 308 was the
      bridge; once 30-day soak passes, the bridge is removed and
      the division apps no longer reference the dead routes).
G16 — Persisted report at .codex-temp/v2-dash-09/report.md.

═══════════════════════════════════════════════════════
ANTI-PATTERNS — applied to DASH-9
═══════════════════════════════════════════════════════

ALL master §4.1 + §4.2 apply. Most important for Track C:

  #19 Role-agnostic UI — staff gets density between consumer-clarity
      and owner-saturation. Track A consumer modules and Track B
      owner modules are NOT mounted in Track C. Different packages
      (packages/dashboard-modules-staff-*) for staff. Verify by
      inspecting Track C's WorkspaceRail composition: it reads from
      getEligibleStaffModules(viewer), NOT getEligibleModules or
      getEligibleOwnerModules.

  #5 Workspace redirect-loop — DASH-9 G9, G10, G15 close the audit
     §A.4-1 critical fix. apps/hub/app/workspace/* + apps/staff/* +
     apps/*/app/(staff)/* all become clean 308s to Track C
     equivalents. No more loops.

  #15 Blue primary — HenryCo black/gold/cream. Staff accents skew
      operational (urgency-aware: red for SLA-breach, amber for
      SLA-warning, green for healthy, neutral for done).

  #18 Bare metrics — staff metrics ALWAYS have SLA context + queue
      depth + comparison. No "12 unread" alone — always
      "12 unread · 3 SLA-breach · ↑ 2 from yesterday".

  #20 Copy not in HenryCo voice — staff copy is OPERATIONAL and
      scratchpad-terse: "Care: 4 pickups awaiting dispatch · 2
      SLA-warning". NO "Welcome, Operator!". NO "Great job!". NO
      celebration cartoons on queue clear.

  #21 Mobile = different layout — staff is desktop-first AND mobile-
      capable (operators are often on the move). Mobile uses
      BottomSheet for queue rows (full-height sheet with action
      stack, swipe-to-assign right edge, swipe-to-escalate left edge).

DO NOT:
- Mount Track A consumer modules into Track C.
- Mount Track B owner modules into Track C (no full finance, no brand
  center, no settings.audit, no AI insights).
- Re-implement is_staff_in() in TypeScript. Source of truth = Postgres.
- Build new auth flows (no MFA, no passkey enrolment in DASH-9).
- Build AI agents (V3).
- Add new divisions or apps in DASH-9.
- Migrate state-changing endpoints (UI rebuild only — existing
  apps/*/app/api/* paths preserved).
- Delete apps/staff inside DASH-9 — that's the 30-day-later cleanup PR.
- Delete apps/hub/app/workspace/[[...slug]] inside DASH-9 — same.
- Open Track C to non-staff users. requireStaffViewer redirects to
  Track A login if viewer lacks any staff_membership.

═══════════════════════════════════════════════════════
VERIFICATION REQUIREMENT — DASH-9 gate
═══════════════════════════════════════════════════════

Per master §3 plus Track-C-specific additions:

V1 build/typecheck/lint   — PASS required.
V2 auth-continuity         — PASS REQUIRED. Track C is the second-
                            riskiest cross-subdomain hop (after Track
                            B). Customer + staff + owner roles must
                            hop between Track A, B, C without re-auth.
                            Verify shared cookie domain still applies.
V3 RLS verification         — PASS REQUIRED. Every new SQL function
                            ships with SECURITY DEFINER + SET
                            search_path = public + REVOKE ALL FROM
                            PUBLIC + GRANT EXECUTE TO authenticated,
                            service_role. is_staff_in() gates every
                            division-bound table read.
V4 Realtime smoke           — PASS required. Track C ContextDrawer
                            receives staff_notifications scoped to
                            the viewer's staffMemberships within 2 s.
V5 Mobile parity            — PASS required at all 6 breakpoints.
                            Operators on the move are a primary persona.
V6 Lighthouse + CWV         — PASS required. Track C INP target is
                            < 200 ms on every queue interaction.
V7 WCAG AA                  — PASS required. Track C shell chrome
                            targets AAA on focus rings (operators
                            use keyboard pervasively).
V8 Sender identity          — PASS required.
V9 CTA reality              — PASS required. Every Track C CTA traced
                            with file:line + destination. Queue-card
                            actions are dense; this is a careful trace.
V10 Empty / loading / error / success — PASS required. Bulk
                            operations get explicit success-state
                            lock PER ROW. Empty-queue state teaches
                            the next queue to triage (no "All caught
                            up!" cartoons).
V11 No console errors       — PASS required.
V12 No 4xx/5xx              — PASS required across the staff-persona
                            matrix (5 staff variants per audit §D.2,
                            confirmed in G0 recon).
V13 Role × division coverage — PASS required: 5 staff variants
                            (operator, manager, dispatcher, moderator,
                            finance-operator — confirm exact list at
                            G0) plus the multi-role hop personas
                            (staff+customer, staff+owner, staff+
                            owner+customer).

Track C-specific additions:

V18 Division-scoped queue isolation — PASS required. A Care-only
                            operator sees ONLY Care queues; cross-
                            division aggregation tiles in staff-
                            overview reflect ONLY their accessible
                            divisions. Probe by seeding a single-
                            division staff user and verifying NO
                            cross-division queue rows appear.
                            Persisted at .codex-temp/v2-dash-09/
                            division-isolation-probe.md.

V19 Audit log on every state-changing action — PASS required. Every
                            state-change in Track C (assign, escalate,
                            close, defer, refund, suspend, ban,
                            reverse-payout, release-payment, bulk-*)
                            writes an audit_log row. Probe by running
                            each action and counting audit_log rows
                            with a correlation_id grouping for bulk.
                            Persisted at .codex-temp/v2-dash-09/
                            audit-log-probe.md.

V20 Cross-track session preservation — PASS required. Hop A → C → B
                            → C → A and verify cookie + session
                            preserved end-to-end. Probe by Playwright
                            script with all three roles in the same
                            viewer. Persisted at .codex-temp/v2-dash-
                            09/cross-track-session.md.

═══════════════════════════════════════════════════════
OUTPUT FORMAT — sub-pass report
═══════════════════════════════════════════════════════

Persist at .codex-temp/v2-dash-09/report.md before merging:

  Files modified: list with file:line ranges
  Track C module ports: packages/dashboard-modules-staff-* enumerated
  Apps/staff kill: 308 redirects active per route, stub still in place
                   for 30-day soak
  Workspace surface kill: Track C destinations confirmed
  What was done: 5–10 lines, no marketing
  How to verify: shell commands / preview URLs / fixture seed steps
  Uncertainties: every UNVERIFIED bullet
  Anti-pattern audit: master §4.1 + §4.2 with PASS/FAIL/N/A
  Verification gate (V1–V13 + V18–V20): per-item PASS / FAIL / N/A
                   with citations
  Division-isolation probe results
  Audit-log probe results
  Cross-track session probe results
  308 verification: curl -I transcripts for every redirected URL
  Classification: DASH-9-COMPLETE | DASH-9-PARTIAL | DASH-9-BLOCKED
  Hand-off — when to delete apps/staff (after ≥30-day clean operation)
            and apps/hub/app/workspace/[[...slug]] (same window)

PR title: feat(dashboard): DASH-9 staff dashboard Track C.
PR body: paste the report.

═══════════════════════════════════════════════════════
V2 SCOPE BOUNDARY
═══════════════════════════════════════════════════════

NOT permitted in DASH-9:
  - Mounting consumer Track A or owner Track B modules into Track C.
  - V2-COMPOSER-02 (separate pass — InternalTeamCommsClient lives in
    Track B; if it landed there, Track C consumes via
    @henryco/chat-composer).
  - New divisions beyond the 11 in COMPANY.divisions.
  - AI agents (V3).
  - Marketplace category expansion.
  - New auth flows.
  - Deletion of apps/staff inside DASH-9 — 30-day-later cleanup PR.
  - Deletion of apps/hub/app/workspace/[[...slug]] inside DASH-9 —
    same window.
  - New payment rails / wallet currencies.

If a "wouldn't it be nice…" thought arises, classify as a later DASH
or V3 and reject. The verification gate cannot pass with out-of-scope
work in the diff.

═══════════════════════════════════════════════════════
PERSISTED-REPORT REQUIREMENT
═══════════════════════════════════════════════════════

  .codex-temp/v2-dash-09/recon.md
  .codex-temp/v2-dash-09/canonical-surface.md         (gate G0)
  .codex-temp/v2-dash-09/staff-route-inventory.md     (gate G0)
  .codex-temp/v2-dash-09/cta-trace.md
  .codex-temp/v2-dash-09/division-isolation-probe.md  (gate V18)
  .codex-temp/v2-dash-09/audit-log-probe.md           (gate V19)
  .codex-temp/v2-dash-09/cross-track-session.md       (gate V20)
  .codex-temp/v2-dash-09/308-verification.md          (gate G10)
  .codex-temp/v2-dash-09/report.md                    (final)

Do not skip persistence. The next phase (V5-3 deep sweep, V5-4 closure
audit) reads these files for V2 closure.

═══════════════════════════════════════════════════════
END OF DASH-9 FORGED PROMPT
═══════════════════════════════════════════════════════
```

---

## Authoring notes (not part of the prompt — for owner review)

- **Why Track C is its own track, not folded into Track A.** The V2-FINAL master orchestration (§2) originally folded staff into Track A as a role-aware composition. The V2 closure handover promotes staff to a third canonical product because (a) `apps/staff` is V1 scaffolding to be **replaced**, not **patched**; (b) operator workflows are density-first and queue-first, structurally closer to Track B's treatment than to Track A's clarity-first composition; (c) the audit's §C.10 observation that staff is "its own product surface" reads more naturally as a separate track than as a role-aware view; (d) division-scoping via `is_staff_in()` is materially different from consumer composition rules and warrants its own role-gate layer. Three canonical products, one identity, one cookie domain.

- **Why DASH-9 absorbs the workspace surface kill (DASH-8's V16 responsibility).** DASH-8's V16 originally targeted `apps/hub/app/workspace/[[...slug]]` → 308 to `account.henrycogroup.com/?role=staff`. With Track C as its own canonical surface, the destination flips to `<Track C URL>`. DASH-9 owns the kill because Track C is the destination. DASH-8's prompt should be revised to drop V16 (or mark it deferred-to-DASH-9). That revision is a separate forging session that requires owner sign-off; this prompt accommodates either DASH-8 ordering.

- **Why the canonical surface is owner-blocking at G0.** The URL choice (`staff.` vs `staffhq.`) propagates through every 308, every Vercel project alias, every staff communication, every cookie boundary. Choosing wrong costs a re-do. Owner decides at G0; the rest of the phase depends on the answer.

- **Why the staff-route inventory is a persisted report on its own.** Every division app has a `(staff)` route group today; each has its own routing posture and its own owner-of-workflow. Without explicit per-route fate (REDIRECT / DEEP-LINK / DELETE), the kill is incomplete and a stranded route can break a 308 chain. The inventory persists separately so V5-3 deep sweep can verify completeness.

- **Why audit-log is V19 and division-isolation is V18.** Track C's trust profile depends on every state-change being reconstructable (V19) and every staff member seeing only their accessible divisions (V18). DASH-8's V14 already enforces audit-log on bulk actions; V19 broadens to ALL state changes (single + bulk) on Track C. V18 is the live probe that audit §A.7 layer 4 RLS gating is intact under adversarial multi-tenant access patterns.

- **Why cross-track session is V20 and not folded into V2.** V2 covers auth-continuity in general. V20 is specifically the A↔B↔C three-way hop with the role-switcher — the worst case from V2-AUTH-RT-01's owner+staff+customer ambiguity test. Worth its own probe because the third hop introduces the most session edge cases.

- **Why Track C's mobile is desktop-first AND mobile-capable.** Operators dispatch from desktops at base + handle escalations from phones in the field. Mobile is not "the laptop scaled down" but a different layout (BottomSheet queue rows, swipe-actions, sticky-close). Mobile parity is V5 PASS-required, not PARTIAL.

— end of DASH-9 forged prompt and authoring notes —
