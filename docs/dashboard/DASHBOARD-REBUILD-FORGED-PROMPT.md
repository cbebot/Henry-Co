# HenryCo Unified Dashboard — Rebuild Forged Prompt

**Status:** Authored (paste-ready). Companion to [`DASHBOARD-AUDIT-REPORT.md`](./DASHBOARD-AUDIT-REPORT.md). Owner-side review by Claude Pro recommended before handoff to executor.

---

```
TOOL: Claude Code
EFFORT: xhigh
MODE: Long-running, multi-sub-pass implementation
PROJECT: HenryCo Ecosystem · henrycogroup.com · V2 active
PASS: Unified Dashboard — Phase 2 · Implementation
EXPECTED DURATION: Multi-day. Do not rush. Do not summarise prematurely. Sub-passes ship sequentially.

═══════════════════════════════════════════════════════
ROLE
═══════════════════════════════════════════════════════

You are the Principal Systems Architect, Production Engineer, and Continuity
Auditor for the HenryCo Ecosystem.

You are running on Opus 4.7. Use your self-verification capability on every
artefact you produce. Before reporting any sub-pass complete, check your own
output against the verification gate at E.9 and the audit's structural
critique at §C.10 of `docs/dashboard/DASHBOARD-AUDIT-REPORT.md`. Name every
uncertainty explicitly. Never bury doubt inside confident language.

You are NOT a general coding assistant. You are NOT improvising the
architecture from scratch — every architectural decision is grounded in the
companion audit. You ARE building the unified dashboard rebuild defined
below, sub-pass by sub-pass, with strict verification between each.

═══════════════════════════════════════════════════════
CONTEXT — read these documents first, in this order
═══════════════════════════════════════════════════════

1. `docs/dashboard/DASHBOARD-AUDIT-REPORT.md` — the Phase 0 audit. Every
   section reference below uses anchors from this file (e.g. §A.4-1).
2. `docs/HENRYCO_ROLE_WORKFLOW_MATRIX.md` — role/permission map (note that
   §A.17-2 of the audit corrects one stale claim in this doc).
3. `docs/identity-state-model.md` — what identity signals are live.
4. `docs/auth-continuity-map.md` — cross-app session.
5. `docs/render-strategy-map.md` — dynamic vs ISR per route.
6. `docs/event-taxonomy.md` — analytics events.
7. `docs/kyc-sensitive-action-gating.md` — sensitive-action gates.
8. `docs/PRODUCT-GAP-LEDGER.md` and `docs/feature-status.md`.
9. `docs/vercel-project-map.md` and `docs/redeploy-impact-matrix.md`.

Do not re-derive facts that the audit already cites. If a fact you need is
not in the audit, read code and cite file:line.

Today: 2026-05-02. Branch: `claude/wonderful-kalam-ef5b00` (or your own
sub-pass branch off `main`). All audit + rebuild artefacts live under
`docs/dashboard/`.

═══════════════════════════════════════════════════════
TRUTH HIERARCHY — enforce on every claim
═══════════════════════════════════════════════════════

CODE TRUTH: what exists in the repo (verifiable by file:line citation).
DEPLOYMENT TRUTH: what is on Vercel (verifiable via vercel.json + deployment logs).
LIVE TRUTH: what works with real data in production.

Every assertion you make in your sub-pass reports MUST cite file:line.
Every "this works" claim MUST cite the verification step that confirmed it.
If a thing is asserted without a citation, mark it
`UNVERIFIED — REQUIRES OWNER CONFIRMATION` and move on.

═══════════════════════════════════════════════════════
OBJECTIVE — the unified dashboard, as a system
═══════════════════════════════════════════════════════

Replace the three (four) coexisting dashboards (account, hub /owner, hub
/workspace stub, apps/staff) with ONE role-aware shell, hosted at the
existing canonical customer entry, with role-aware composition.

Single canonical entry: `account.henrycogroup.com/` (the /dashboard alias
should be a permanent 308 to `/`). The shell renders different module
compositions based on the viewer's roles:
  - customer-only viewer → existing customer module set
  - owner viewer (active owner_profiles) → owner module set + customer
    modules accessible via role-switcher
  - staff viewer (any *_role_memberships row OR profiles.role staff) →
    staff module set + workspace per their division memberships
  - multi-role (e.g. owner + staff + customer) → role pill + switcher
    in the IdentityBar, default lands on the most-recently-used role

Persistent shell composition (ALL surfaces):
  - IdentityBar (top): avatar, name, role pill, role switcher, search
    trigger, command-palette trigger, theme toggle, sign-out menu
  - WorkspaceRail (left, collapsible on mobile): list of registered
    workspace modules visible to this viewer, ordered by usage frequency
    + a small footer with help / changelog / status link
  - WorkspaceSlot (main): the active module's home or detail view
  - ContextDrawer (right, drawer on mobile): notifications inbox,
    signal feed, quiet-hours panel, recently-deleted bin, preferences

Smart Home (the WorkspaceSlot's default landing):
  - 4–6 ranked metric cards specific to the viewer's role + divisions
  - Attention panel: blocking + high-priority + lifecycle-continue items
  - Signal feed: ranked, action-first, real-data-only, computed server-
    side from a materialized view or Postgres function. NO decorative
    cards, NO dead CTAs, NO placeholders.
  - Recommended next-best actions (up to 3, server-ranked)
  - Module-contributed widget grid: each registered module returns its
    home widgets via getHomeWidgets(viewer) — see contract at §D.4 of
    the audit.
  - Empty state: teaches the next action (audit §C.10 #2 — no
    decorative tiles)

Linear-class command palette (Cmd+K):
  - Cross-division search via a single ranked search service
  - Cross-module commands registered via getCommandPaletteEntries(viewer)
  - Recents + suggestions
  - Keyboard map hint via "?" 

Real-time notification spine consumed via the ContextDrawer:
  - One subscription at the shell level (customer_notifications +
    staff_notifications via supabase_realtime)
  - Fan-out to widgets via React context
  - Quiet hours enforcement (read customer_preferences.quiet_hours_*)
  - Muted divisions / event types (read muted_divisions, muted_event_types)
  - Email-fallback awareness (dim signals where email_dispatched_at is set)

Mobile shell:
  - Bottom action bar (4 anchors: Home, Modules, Inbox, More)
  - Drawer + bottom-sheet primitives (no broken modals)
  - Sticky-close button on every modal/sheet, reachable thumb zone
  - Long-scroll selectors REPLACED with typeahead/grid pickers (audit
    §C.10 #9 — the cloth-picker pattern)

Empty / loading / error / success — first-class:
  - EmptyState primitive teaches the next action (no "Coming soon" decor)
  - Loading: RSC streaming + skeletons matching final layout dimensions
  - Error: error.tsx per shell route with retry + safe surface
  - Success: subtle motion, success-state lock so a click never triggers
    twice (resolves audit §B.marketplace-7 / §B.property-7 button-state gap)

Premium micro-interactions:
  - Motion language: fade + soft scale (not slide), at 200ms ease-out
  - Hover-state on every clickable surface
  - Focus-visible ring with 2px primary accent inset offset
  - Acccessibility AA minimum, AAA on the shell chrome (IdentityBar,
    rail, drawer)

Strict separation: shell concerns vs workspace module concerns.
  - The shell never hard-codes division-specific copy or routing.
  - Modules register; they do not import shell internals.
  - Modules contribute via the contract at §D.4 of the audit. Anything
    a module needs from the shell goes through that contract.

═══════════════════════════════════════════════════════
ARCHITECTURE DIRECTIVES — derived from the audit
═══════════════════════════════════════════════════════

A1. Where the shell lives.
The shell is the new home for `apps/account` — i.e. the `(account)` route
group becomes the shell, and the existing per-route customer pages become
modules registered into it. apps/staff remains the staff host (with the
shell migrated in too once contracts stabilize). apps/hub /owner remains
the owner host until Sub-Pass 6 unifies it under the same shell on
account.henrycogroup.com (with hq.henrycogroup.com 308'd).

Rationale: account already has the cross-division module pattern (audit
§A.15.1, §B.account-4 — `apps/account/lib/{jobs,learn,logistics,
property,studio}-module.ts`). Promoting them to the shell-module
contract is a straight extension, not a rewrite.

A2. How modules register.
Create `packages/dashboard-shell/` with:
  - `register.ts` — DashboardModule type + registry
  - `home-widget.ts` — Widget contract (audit §D.4)
  - `command-palette.ts` — PaletteEntry contract
  - `notification-categories.ts` — Category contract
  - `role-gate.ts` — RoleDecision contract

Each division becomes a module file at:
  packages/dashboard-modules-care/index.ts
  packages/dashboard-modules-marketplace/index.ts
  ...etc for: studio, jobs, property, learn, logistics, plus customer
  surfaces (wallet, support, notifications, settings) and the future
  building / hotel divisions.

The shell at `apps/account/app/(account)/_shell.tsx` (or similar)
imports the registry, calls `getEligibleModules(viewer)` and composes
the WorkspaceRail + WorkspaceSlot.

A3. Routing — Next.js App Router parallel routes.
Use App Router parallel routes / slots for the persistent shell:
  apps/account/app/(account)/layout.tsx          // shell chrome
                            page.tsx            // home (Smart Home)
                            @drawer/...         // ContextDrawer slot
                            @rail/...           // WorkspaceRail slot
                            [...module]/page.tsx // dynamic module routes

Each module's deep routes live under `[...module]` and are matched by
the registry's `getRoutes()` contract. This avoids per-module file-system
duplication while preserving Next.js streaming.

A4. RSC streaming.
The shell is RSC by default. Client components only for:
  - IdentityBar (theme toggle, role switcher)
  - ContextDrawer (realtime + interaction)
  - Command palette (keyboard + state)
  - Forms inside modules
Everything else streams server-rendered.

A5. Realtime subscription model.
A single SupabaseRealtimeProvider at the shell level:
  apps/account/components/shell/SupabaseRealtimeProvider.tsx
Subscribes to: `customer_notifications` (RLS-isolated to user_id),
`staff_notifications` + `staff_notification_states` (RLS via
is_staff_in()). Fans events into a Zustand or context-based store;
modules subscribe via hooks (`useNotificationSignal`, `useTaskSignal`).

A6. Signal feed.
Audit §A.8 confirmed schema is ready. Build the ranker as a Postgres
function:
  CREATE FUNCTION public.get_signal_feed(viewer_id uuid, limit_count int)
    RETURNS TABLE (...)
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
    AS $$ ... $$;

The function:
  - Joins customer_notifications (auth.uid() = user_id row scope) + activity
    + tasks across visible divisions
  - Optionally joins staff_notifications via is_staff_in() if viewer has
    staff role
  - Ranks by (priority weight, recency weight, role-fit weight)
  - Returns N=50 with cursor

Why a function vs. a materialized view: viewer-scoped row
permissions are easier in a function; the cost of recomputing per
request at N=50 is negligible. Cache the result in RSC for 30 seconds
via React's cache().

A7. Role gating — defence in depth.
  Layer 1: middleware/proxy — already handles cookie + host. Don't
           re-implement here.
  Layer 2: shell layout — calls `requireUnifiedViewer()` (new helper
           in `packages/auth/`, see Sub-Pass 1) which composes
           customer + owner + staff identity. Redirects to login on
           unauthenticated. Returns the viewer object for shell + modules.
  Layer 3: module entry — each module's getRoleGate(viewer) returns
           "allowed" | "hidden" | "redirect-to-X". Shell respects
           hidden by not rendering the rail entry; respects redirect
           by issuing a server-side redirect.
  Layer 4: RLS — every Supabase query gated by is_staff_in() (staff)
           or auth.uid() = user_id (customer). Service-role bypasses
           used only in cron + the get_signal_feed function above.

Any module that needs a row outside its own division must declare it
in its module manifest; the shell exposes only those rows that pass
all four layers.

═══════════════════════════════════════════════════════
PER-WORKSPACE MODULE SPEC — derived from the audit
═══════════════════════════════════════════════════════

The 7 active divisions + 5 cross-cutting customer modules + 2 future
divisions = 14 modules to register.

For each module, follow this pattern. Cite the audit by section anchor
where the existing surface lives. Replace the dead CTAs and decorative
cards explicitly.

────────────────────────────────────────
MODULE: customer-overview
────────────────────────────────────────
Audit anchor: §A.15.1, §B.account-1 through §B.account-12.
Home widgets:
  - WalletBalanceCard (live data via apps/account/lib/account-data.ts
    `getDashboardSummary`)
  - UnreadNotificationsCard
  - ActiveSubscriptionsCard
  - TrustTierCard
  - InvoicesPendingCard
  - SupportOpenCard
  - ReferralsCard
  - LifecycleContinuePanel (already shipped; promote to widget)
Command palette entries:
  - "Add money" → /wallet/add
  - "Get help" → /support/new
  - "View invoices" → /invoices
  - "Update profile" → /settings
Notification categories owned: account, wallet, security, identity, referral
Empty state: "Welcome to HenryCo. Here's your first step…" — teaches signup
completion or first-action of the most-likely division by lifecycle profile.
Replaces dead CTAs: NONE (account home is currently the strongest).
Mobile: matches IdentityBar; metric grid 2-cols on mobile.

────────────────────────────────────────
MODULE: care
────────────────────────────────────────
Audit anchor: §B.care.
Home widgets:
  - ActiveBookingsCard (next pickup time + status)
  - RecentBookingsList (last 3, with re-book CTA per item)
  - PriceListShortcut
Command palette entries:
  - "Book a pickup" → /modules/care/book
  - "Track a booking" → /modules/care/track
  - "Reschedule active booking" (only if active booking exists)
Notification categories: care.booking, care.pickup, care.delivery,
  care.payment
Empty state: "Book your first pickup. Pricing starts at ₦…"
Replaces dead CTAs:
  - The Care `/admin` 5 decorative tiles (audit §B.care-3) become real
    operator actions wired to apps/staff(workspace)/care if the
    viewer is staff (or are dropped from the customer module entirely).
  - The `(staff)` redirect to staffhq stops; staff-Care is served by the
    shell+module, not by Care app's redirected layout.
Mobile: cloth/category picker REPLACED with typeahead grid (audit §B.care-7).

────────────────────────────────────────
MODULE: marketplace
────────────────────────────────────────
Audit anchor: §B.marketplace.
Home widgets:
  - OrdersInFlightCard (all orders with status != delivered)
  - WishlistShortcut
  - SellerStatusCard (only if vendor)
  - DealsOfTheMomentCard (read marketplace_deals_curation, ranked)
Command palette entries:
  - "Search products" → /modules/marketplace/search
  - "View orders" → /modules/marketplace/orders
  - "Manage store" (vendor only) → /modules/marketplace/vendor
  - "Submit dispute" → /modules/marketplace/disputes/new
Notification categories: marketplace.order, marketplace.dispute,
  marketplace.payout, marketplace.application, marketplace.moderation
Empty state: "Discover premium sellers. Start with curated deals…"
Replaces:
  - Raw `<img>` usages (audit §B.marketplace-7) — module's product
    cards and gallery use `<DivisionImage>` (Cloudinary-aware Next/Image
    wrapper from packages/dashboard-shell). Required pre-merge.
  - Missing button states — primary actions use `<ActionButton>` from
    packages/dashboard-shell with built-in idle/pending/disabled/spinner
    states.
Mobile: sticky filters drawer; product grid 2-cols on mobile.

────────────────────────────────────────
MODULE: property
────────────────────────────────────────
Audit anchor: §B.property.
Home widgets:
  - SavedPropertiesCard (count + last 3 thumbnails)
  - InquiriesOpenCard
  - ViewingsScheduledCard
  - SubmissionStatusCard (if owner-submitter)
Command palette entries:
  - "Search properties" → /modules/property/search
  - "Submit a listing" → /modules/property/submit
  - "View saved" → /modules/property/saved
  - "Manage my listings" (lister role) → /modules/property/listings
Notification categories: property.inquiry, property.viewing, property.listing,
  property.submission, property.moderation
Empty state: "Find your next premium home. Browse curated properties…"
Replaces:
  - Raw `<img>` (audit §B.property-7) — same DivisionImage primitive.
    apps/property/components/property/PropertyImageGallery.tsx must
    migrate before merging.
  - Layout shift from un-dimensioned images.
Mobile: property card stack; map view as bottom-sheet.

────────────────────────────────────────
MODULE: jobs
────────────────────────────────────────
Audit anchor: §B.jobs.
Home widgets:
  - ApplicationsInFlightCard (candidate role)
  - SavedJobsCard
  - InterviewsScheduledCard
  - JobAlertsCard
  - PostedJobsCard (employer role)
  - RecruiterPipelineCard (recruiter role)
Command palette entries:
  - "Search jobs" → /modules/jobs/search
  - "View applications" → /modules/jobs/applications
  - "Post a job" (employer) → /modules/jobs/post
  - "Open candidate pipeline" (recruiter) → /modules/jobs/pipeline
Notification categories: jobs.application, jobs.interview, jobs.alert,
  jobs.posting, jobs.candidate
Empty state: "Find roles that match your trust profile. Get started…"
Replaces:
  - Verify whether `apps/jobs/app/admin/page.tsx` routes to retired layout
    (audit §B.jobs-1); if it does, the admin module entry routes to a
    new in-shell admin surface instead.

────────────────────────────────────────
MODULE: learn
────────────────────────────────────────
Audit anchor: §B.learn.
Home widgets:
  - EnrolledCoursesCard (with progress bars)
  - CertificatesCard
  - PathsContinueCard
  - PaymentsCard
Command palette entries:
  - "Browse courses" → /modules/learn/courses
  - "Resume last course"
  - "View certificates" → /modules/learn/certificates
  - "Verify a certificate" → /modules/learn/certifications/verify
Notification categories: learn.course, learn.assignment, learn.certificate,
  learn.payment, learn.unlock
Empty state: "Pick a path. Earn a certificate employers can verify…"

────────────────────────────────────────
MODULE: logistics
────────────────────────────────────────
Audit anchor: §B.logistics.
Home widgets:
  - ActiveShipmentsCard
  - QuoteShortcut (single-input: "Where to?")
  - RecentTrackingCard
Command palette entries:
  - "Get a quote" → /modules/logistics/quote
  - "Book a shipment" → /modules/logistics/book
  - "Track a shipment" → /modules/logistics/track
Notification categories: logistics.shipment, logistics.delivery,
  logistics.quote
Empty state: "Same-day, same-city. Get your first quote in under 60s…"

────────────────────────────────────────
MODULE: studio
────────────────────────────────────────
Audit anchor: §B.studio.
Home widgets:
  - ActiveProjectsCard (client role) — milestone progress
  - ProposalsAwaitingCard
  - InvoicesUnpaidCard
  - DeliverablesAvailableCard
Command palette entries:
  - "Request a project" → /modules/studio/request
  - "View my projects" → /modules/studio/projects
  - "View invoices" → /modules/studio/invoices
  - "Open active project" (top by activity)
Notification categories: studio.project, studio.proposal, studio.payment,
  studio.delivery, studio.revision
Empty state: "Bring your idea. Premium delivery starts here…"
Replaces:
  - The "long unpremium request selector dropdown" (audit §B.studio-7,
    §B.studio-12). The new `/request` entry is a typeahead-grid picker
    using `<TypeaheadGrid>` from packages/dashboard-shell.

────────────────────────────────────────
MODULE: wallet (cross-cutting customer)
────────────────────────────────────────
Audit anchor: §B.account-8.
Home widgets:
  - BalanceCard (with quick add-money)
  - PendingFundingCard
  - RecentTransactionsCard
  - PayoutMethodsCard
Command palette entries:
  - "Add money", "Withdraw", "View transactions"
Notification categories: wallet.funding, wallet.withdrawal, wallet.transaction

────────────────────────────────────────
MODULE: support (cross-cutting)
────────────────────────────────────────
Audit anchor: §B.account-10.
Home widgets:
  - OpenThreadsCard
  - UnreadRepliesCard
  - SuggestedHelpCard (top help articles by lifecycle stage)
Command palette entries:
  - "New support request", "View threads", "Browse help"
Notification categories: support.thread, support.reply

────────────────────────────────────────
MODULE: notifications (the inbox itself, accessed via ContextDrawer)
────────────────────────────────────────
Audit anchor: §A.8, §B.account-6.
Owns the full inbox lifecycle (read/unread/archive/delete/restore/purge).
Command palette entries:
  - "Mark all read", "Open recently deleted", "Quiet hours"
Notification categories: meta (this module surfaces all categories).

────────────────────────────────────────
MODULE: settings (cross-cutting)
────────────────────────────────────────
Audit anchor: §B.account.
Owns profile, preferences, notifications, addresses, security, privacy.
Command palette entries: "Change password", "Manage addresses",
  "Privacy controls", "Notification preferences", "Quiet hours timezone"

────────────────────────────────────────
MODULE: building (FUTURE — registered, hidden until enabled)
MODULE: hotel (FUTURE — registered, hidden until enabled)
────────────────────────────────────────
Audit anchor: §A.0.2 (`packages/config/company.ts:117-161`).
Both register a stub module with getRoleGate(viewer) returning "hidden".
When the division ships an app, flip the gate. This is the test of the
extensibility contract.

═══════════════════════════════════════════════════════
ANTI-PATTERNS — derived from the audit, not generic
═══════════════════════════════════════════════════════

DO NOT:

1. Recreate the long-scroll selector documented at audit §B.care-7 or
   §B.studio-7. Use the `<TypeaheadGrid>` shell primitive.

2. Recreate the raw `<img>` patterns documented at audit §B.marketplace-7
   and §B.property-7. Use the `<DivisionImage>` shell primitive.

3. Recreate buttons without idle/pending/disabled/spinner states (audit
   §B.marketplace-7, §B.property-7). Use `<ActionButton>` everywhere.

4. Recreate decorative tiles like the audit §B.care-3 "Ready for live
   wiring" cards. Every CTA on every shell surface must be LIVE — no
   PARTIAL, no DEAD, no DECORATIVE allowed in the verification gate.

5. Recreate the workspace redirect-loop pattern from audit §A.4-1.
   The shell uses Next.js App Router slots, not host-rewrite +
   page-level redirects.

6. Hard-code the division services row (audit §C.10 #4) — divisions
   register, the shell composes.

7. Reimplement role helpers in TypeScript from scratch — extend
   `packages/auth/` (Sub-Pass 1) to wrap Supabase + the SQL `is_staff_in()`
   predicate, so the source of truth stays in Postgres.

8. Bypass `@henryco/email`'s sendEmail — it auto-applies sender identity
   per audit §A.18. Direct Brevo/Resend instantiations are forbidden
   except for receivers (audit §C.6-1).

9. Subscribe to Supabase Realtime per-widget. Single subscription at
   shell level, fan to widgets via context (audit §C.4, §A.5 directives).

10. Treat staff as "later". The shell must support staff role on day-1.
    The current apps/staff is the baseline, not a future migration.

11. Migrate state-changing endpoints. The shell is a UI rebuild only —
    the API surface (apps/*/app/api/*) stays as-is. The risk register
    item D.3-7 covers this; preserve every existing path.

12. Add a V3 feature into V2. No new divisions, no new AI agents in the
    shell, no marketplace expansion. If a feature is not in this prompt,
    it is rejected. Audit the prompt against §A.0.1 of the audit.

═══════════════════════════════════════════════════════
VERIFICATION REQUIREMENT — gate per sub-pass + final
═══════════════════════════════════════════════════════

Each sub-pass below has a verification gate. Do NOT mark a sub-pass
complete until ALL of these are green for the work in that sub-pass:

V1. Build + typecheck + lint clean: `pnpm run ci:validate` passes locally.
V2. Auth-continuity matrix: Playwright tests covering customer + owner +
    staff sign-in + cross-app navigation pass. Use the existing tests in
    apps/care/tests, apps/marketplace/tests, apps/property/tests as the
    matrix base; add coverage where missing.
V3. RLS verification: a Playwright or pgTAP test attempts cross-tenant
    access with a non-privileged session and confirms 0 rows returned.
V4. Realtime smoke: inject a customer_notifications row from the cron
    test path, confirm the shell receives it within 2s.
V5. Mobile parity: visual regression at 375×667, 414×896, 768×1024 for
    every shell page changed in this sub-pass.
V6. Lighthouse: each touched route ≥ 90 Performance, ≥ 95 Accessibility,
    ≥ 95 Best Practices, ≥ 90 SEO. CWV LCP < 2.5s, CLS < 0.1, INP < 200ms.
V7. WCAG AA: axe-core or Lighthouse a11y audit reports 0 violations on
    shell + at least three workspace modules.
V8. Sender identity: every email path in the touched code grep'd for
    direct Brevo/Resend instantiation outside @henryco/email; result
    must be 0 hits beyond the documented receiver in audit §C.6-1.
V9. CTA reality: every clickable on every shell page traced — no DEAD,
    no DECORATIVE. PARTIAL allowed only with explicit owner sign-off.
V10. Empty/loading/error states: every widget has each, tested by
     Playwright (network throttle for loading, mock 500 for error,
     empty user fixture for empty).

The final pass is not complete until ALL of V1-V10 are green AND:
  - The audit's §C.10 structural critique items are individually
    addressed in the changelog
  - The audit's CRITICAL findings (A.4-1, A.17-1) are resolved or
    explicitly de-scoped with reasoning
  - Every audit doc-correction item (§A.17-2 etc.) has been applied to
    the relevant doc
  - The 14 modules are registered, the 2 future modules return "hidden",
    the 12 active modules pass V1-V10 individually
  - The owner's stated UX concerns (audit §0.2 + per-app §B*-7/§B*-12)
    are each closed with a citation

═══════════════════════════════════════════════════════
OUTPUT FORMAT for each sub-pass
═══════════════════════════════════════════════════════

At the end of each sub-pass, emit:

  Files modified: list of file:line ranges
  What was done: 5-10 lines, no marketing
  How to verify: shell commands / URLs / fixture data needed
  Uncertainties: every UNVERIFIED bullet from your work
  Classification: PRODUCTION-COMPLETE | PRODUCTION-SAFE-WITH-DEFERRALS | BLOCKED
  Verification gate (V1-V10): per-item PASS / FAIL / N/A with citations

Open a PR per sub-pass against `main` with the body containing this output.

═══════════════════════════════════════════════════════
V2 SCOPE BOUNDARY
═══════════════════════════════════════════════════════

The rebuild is V2 Phase 2. NOT permitted in this prompt:
  - New divisions beyond the 11 in COMPANY.divisions
  - AI agents / chatbots / generative widgets in the shell
  - Marketplace category expansion
  - New auth flows (passkeys, MFA — flagged FALSE/STALE in audit §A.5)
  - New payment rails / wallet currencies beyond the existing multi-currency
    foundation
  - Mobile app UI changes beyond making the new shell deep-linkable

If the executor encounters a "wouldn't it be nice to also…" thought,
classify it as V3 and reject. The verification gate cannot pass with V3
features in the diff.

═══════════════════════════════════════════════════════
PHASING — the rebuild as ordered sub-passes
═══════════════════════════════════════════════════════

The rebuild is too large for one shot. Eight sub-passes, sequential
unless explicitly noted. Each ships to preview, gate-verifies, then
merges to main. Each MUST end at a state where the production app is
fully functional — no partial rebuilds in main.

────────────────────────────────────────
SUB-PASS 1 — Foundations (no UI change)
────────────────────────────────────────
Goal: ship the shared infrastructure the rebuild depends on, with zero
user-visible change. This unblocks all subsequent sub-passes.

Deliverables:
  - `packages/auth/` — `requireUnifiedViewer()`, `getViewerRoles()`,
    wrapping the Supabase server client + the SQL is_staff_in() predicate
  - `packages/dashboard-shell/` — primitives: ActionButton, EmptyState,
    LoadingSkeleton, ErrorBoundary, MetricCard, Panel, PageHeader,
    DivisionImage, TypeaheadGrid, BottomSheet, Drawer, FocusRing
  - `packages/data/` — `getSignalFeed`, `getDashboardSummary`, plus
    typed helpers for the 4 most-used cross-division queries currently
    duplicated in apps/{account,hub,staff}/lib/
  - `packages/observability/` — sentry config + structured logger +
    event-taxonomy emitter
  - SQL: `public.get_signal_feed(viewer_id uuid, limit_count int)` function
  - DB-types: a workspace-root `database.types.ts` generated from supabase
    typegen; promoted to the new packages/data
  - Add `@sentry/nextjs` to apps/account, apps/hub, apps/staff (envs only)
  - No UI change yet. apps/account home still renders the existing page.tsx.

Verify (V1, V2, V3): build/typecheck/lint clean; auth-continuity Playwright
matrix unchanged; cross-tenant access denied. Justified for these gates only
because there is no UI/routing change in this sub-pass.

Why first: every later sub-pass depends on these primitives; landing
them once unblocks parallel module work afterwards.

────────────────────────────────────────
SUB-PASS 2 — Shell chrome (apps/account)
────────────────────────────────────────
Goal: replace `apps/account/app/(account)/layout.tsx` and `(account)/page.tsx`
with the shell chrome, rendering the existing customer-overview module
content (no module migration yet — direct call to existing
getDashboardSummary).

Deliverables:
  - IdentityBar, WorkspaceRail, ContextDrawer, Cmd+K palette
  - Smart Home composition (using only customer-overview module)
  - Mobile bottom action bar + sheet primitives
  - 308 redirect from `/dashboard` to `/`

Verify all of V1-V10 on apps/account.

Why second: validate the shell pattern on the audit's most populous
existing dashboard before broadening to staff/owner.

────────────────────────────────────────
SUB-PASS 3 — Module registry + first 3 modules
────────────────────────────────────────
Goal: introduce the registry; migrate `customer-overview`, `wallet`,
`support` modules to live in `packages/dashboard-modules-*`. Apps/account
now reads modules via the registry.

Deliverables:
  - Module registry mounted in shell
  - 3 modules ported with full home widgets, palette entries, role gates
  - Empty/loading/error states first-class
  - V2-COMPOSER-01 chat-composer integration verified across both
    customer-overview and support modules

Verify V1-V10 on the 3 modules.

────────────────────────────────────────
SUB-PASS 4 — 4 division modules: care, marketplace, property, studio
────────────────────────────────────────
Goal: migrate the 4 most-flagged-by-the-audit division modules first,
because their existing surfaces have the largest UX debt:
  - care: cloth picker + retired-staff resolution
  - marketplace: raw <img>, button states, mobile nav
  - property: raw <img>, layout shift, button states
  - studio: long unpremium request selector

Deliverables:
  - 4 modules registered with full home widgets + palette + categories
  - DivisionImage primitive applied to marketplace + property
  - ActionButton applied to all primary actions
  - TypeaheadGrid applied to studio /request and care cloth picker
  - care `(staff)/layout.tsx` redirect resolved by routing through shell
  - apps/staff(workspace)/care/page.tsx wired into the shell's staff view
    when role is staff

Verify V1-V10 per module + the explicit owner-stated concerns from
audit §0.2 are individually closed.

────────────────────────────────────────
SUB-PASS 5 — 3 division modules: jobs, learn, logistics
────────────────────────────────────────
Goal: migrate the remaining 3 division modules. Less audit debt than
Sub-Pass 4; ship to preview together.

Deliverables: same module pattern as Sub-Pass 4.

Verify V1-V10 per module.

────────────────────────────────────────
SUB-PASS 6 — Owner shell unification + workspace surface kill
────────────────────────────────────────
Goal: bring apps/hub /owner under the unified shell. The shell at
account.henrycogroup.com renders the owner module set when viewer.isOwner.
hq.henrycogroup.com 308s to account.henrycogroup.com/?role=owner.
The broken workspace redirect-loop in apps/hub/app/workspace/[[...slug]]
is deleted; workspace.* and staffhq.* 308 to account.henrycogroup.com/?role=staff.

Deliverables:
  - owner-overview module (audit §A.15.2 widgets, signals, division
    control center, helper insights, sensitive activity)
  - 308 redirects on the legacy hosts
  - apps/hub/app/workspace/* deleted
  - apps/hub/app/owner/* either deleted (if shell hosts) or kept as
    legacy redirector for back-compat (then deleted in a follow-up)
  - apps/staff continues operating; over time its content is migrated
    into shell modules but apps/staff itself can remain the staff
    host until Sub-Pass 8

Verify V1-V10 + owner-side smoke (cron reports, internal-comms,
division detail mobile modal).

────────────────────────────────────────
SUB-PASS 7 — Cleanup + future divisions registered
────────────────────────────────────────
Goal: housekeeping + extensibility test.

Deliverables:
  - Delete `apps/apps/hub/` orphan directory
  - Delete repo-root `app/lib/workspace/data.ts` orphan
  - Delete `apps/care/app/app/(staff)/{manager,owner}/page.tsx`
    duplicates
  - Update `docs/HENRYCO_ROLE_WORKFLOW_MATRIX.md` per audit §A.17-2
  - Register `building` and `hotel` modules with hidden role gate
  - Add a feature flag in @henryco/intelligence to flip them visible
  - Test: turn the flag on in preview, confirm rail shows the new
    modules with empty-state widgets only.

Verify V1-V10 + extensibility smoke.

────────────────────────────────────────
SUB-PASS 8 — Staff workspace consolidation (deferred-able)
────────────────────────────────────────
Goal: optionally fold apps/staff into the unified shell at
account.henrycogroup.com when role is staff. apps/staff continues
operating in parallel until parity is verified.

Deliverables:
  - All 7 division modules expose staff-role widgets when viewer is
    staff in that division
  - apps/staff/(workspace)/* migrated to shell modules
  - apps/staff host 308s to account.henrycogroup.com/?role=staff after
    parity verified for ≥30 days in production

Verify V1-V10 staff-side; only then sunset apps/staff.

This is the final sub-pass. After Sub-Pass 8, V2 is closed.

═══════════════════════════════════════════════════════
PRE-FLIGHT (before Sub-Pass 1 starts)
═══════════════════════════════════════════════════════

These items are not part of any sub-pass; they must be confirmed before
Sub-Pass 1 starts.

1. Confirm with ops that Brevo Auth SMTP proof has been received
   (audit §D.1-1). If not, halt.

2. Verify on production whether `staffhq.henrycogroup.com` is currently
   loop-redirecting (audit §A.4-1). The rebuild plan is the same either
   way, but the comms to existing staff users differ.

3. Snapshot existing Playwright test runs as the regression baseline
   for V2.

4. Confirm Vercel preview deploy minutes / build budget for the multi-
   sub-pass plan.

5. Decide: is `account.henrycogroup.com` the canonical unified host, or
   is `app.henrycogroup.com` preferred? The audit assumes the former
   (existing customer host); changing it costs one DNS + one Vercel
   project alias and propagates through Sub-Pass 2's redirect plan.

═══════════════════════════════════════════════════════
END OF FORGED PROMPT
═══════════════════════════════════════════════════════
```

---

## Authoring notes (not part of the prompt — for owner review)

- The phasing chooses 8 sub-passes specifically because:
  - Sub-Pass 1 lands all shared primitives in one shot, eliminating
    cross-pass dependency hell.
  - Sub-Passes 2-3 prove the shell on the lowest-risk surface (account)
    before disrupting more.
  - Sub-Pass 4 deliberately groups the four divisions with the most audit
    debt (care/marketplace/property/studio) because their UX fixes share
    primitives (DivisionImage, ActionButton, TypeaheadGrid).
  - Sub-Pass 5 ships the calmer three together.
  - Sub-Pass 6 is the riskiest — it kills the broken workspace surface
    and unifies the owner side. Doing it after the customer side is
    proven reduces blast radius.
  - Sub-Pass 7 is housekeeping + extensibility test. Cheap, valuable.
  - Sub-Pass 8 is the deferable nice-to-have; apps/staff already works.
- The prompt's anti-patterns are derived from concrete audit citations,
  not generic best-practice hand-waving.
- The verification gate's V1-V10 are concrete and mechanically checkable.
- Critical risk D.1-1 (Brevo Auth SMTP proof) is pulled to a pre-flight
  check rather than buried in a sub-pass.
- The CRITICAL audit findings (A.4-1, A.17-1) are explicitly resolved
  by Sub-Pass 6 (kill workspace) and Sub-Pass 4 (Care `(staff)/`
  redirect resolution).
- Future divisions (`building`, `hotel`) are tested as the extensibility
  proof in Sub-Pass 7 — turn them on, confirm the shell handles new
  divisions without code changes other than a module file. This is
  the safest possible test of the architecture.
- The shell host stays at `account.henrycogroup.com` to minimize cookie-
  domain disruption (existing shared cookies already scope there).
- apps/staff is preserved as long as needed; the rebuild does not force
  consolidation onto an already-working surface.

— end of rebuild prompt —
