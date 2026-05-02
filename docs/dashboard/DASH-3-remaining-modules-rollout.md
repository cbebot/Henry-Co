# DASH-3 — Remaining Modules Rollout (Forged Prompt)

```
TOOL: Claude Code (Opus 4.7)
EFFORT: xhigh
PROJECT: HenryCo Ecosystem · henrycogroup.com · V2 active
PASS: V2-DASH-03 — Remaining 8 active + 2 hidden future modules
EXPECTED DURATION: Multi-day. Modules MAY ship as parallel sub-PRs (one
                   per module) provided each independently passes V1–V13.

═══════════════════════════════════════════════════════
ROLE
═══════════════════════════════════════════════════════

Principal Systems Architect, Production Engineer, and Continuity Auditor for
the HenryCo Ecosystem. Opus 4.7. Self-verify against V1–V13 per module.

═══════════════════════════════════════════════════════
CONTEXT — read in this order BEFORE writing code
═══════════════════════════════════════════════════════

1. docs/dashboard/DASHBOARD-AUDIT-REPORT.md (full)
2. docs/dashboard/DASHBOARD-REBUILD-PROMPT-V2-FINAL.md (master)
3. docs/dashboard/DASH-1-shell-foundations-skeleton.md
4. docs/dashboard/DASH-2-module-registry-reference-modules.md
5. .codex-temp/v2-dash-02/report.md (the contract validated by 2 modules)
6. apps/account/lib/{jobs,learn,logistics,property,studio}-module.ts
   (per-division aggregators — base for those module ports)
7. apps/account/lib/care-sync.ts (different mirror-sync pattern — base
   for the care module port)
8. apps/care/app/(staff)/layout.tsx (the silent-retire redirect — audit
   §A.17-1; DASH-3 deletes this path because the new shell handles
   staff routing in-place via getRoleGate)
9. apps/property/components/property/PropertyImageGallery.tsx (audit
   §B.property-7 — raw <img>, layout shift)
10. apps/jobs/app/admin/page.tsx (audit §B.jobs-1 — verify retired-layout
    routing; if retired, replace with in-shell admin)
11. apps/staff/lib/intelligence-data.ts (cross-staff aggregation — feeds
    several module home widgets when viewer is staff)
12. .codex-temp/v2-cart-01/report.md (cart-saved-items consumption)
13. .codex-temp/v2-docs-01/report.md (branded-documents consumption)
14. .codex-temp/v2-not-02-a/report.md (notifications-ui consumption)
15. .codex-temp/v2-composer-01/report.md (chat-composer consumption)
16. .codex-temp/v2-addr-01/report.md (address-selector consumption)

═══════════════════════════════════════════════════════
TRUTH HIERARCHY
═══════════════════════════════════════════════════════

CODE / DEPLOYMENT / LIVE truth — see master §3. Cite file:line. No
"should work."

═══════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════

Port 8 active modules + register 2 hidden future modules. Each module is
a packages/dashboard-modules-<slug>/ workspace with the 8-export manifest
contract validated in DASH-2.

ACTIVE MODULES (each with full home widgets, palette entries, role gates,
notification categories, empty states):

────────────────────────────────────────
MODULE: care   (packages/dashboard-modules-care)
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

Empty state: "Premium fabric care, scheduled" kicker; "Pricing starts at
₦…" headline; single primary action — typographic minimalism.

Audit-debt fixes that ship in DASH-3 (NOT deferred):
  - Cloth picker long-scroll → TypeaheadGrid (audit §B.care-7).
  - Decorative admin tiles at apps/care/app/admin/page.tsx → real wired
    actions (when viewer is staff with care permissions; otherwise the
    admin path is hidden by getRoleGate).
  - apps/care/app/(staff)/layout.tsx redirect to staffhq → DELETED. The
    shell's care module handles staff role via getRoleGate; the staff-
    side care content migrates from apps/staff/(workspace)/care/page.tsx
    into the module's staff-role widgets.
  - apps/care/app/app/(staff)/{manager,owner}/page.tsx artefact files
    → DELETED.

V2 primitives consumed:
  - chat-composer for the post-booking conversation (V2-COMPOSER-01,
    audit §B.care-10).
  - address-selector for the booking pickup address (V2-ADDR-01;
    BookPickupForm replaces inline saved-address loop with
    <AddressSelector audience="care_pickup">).
  - notifications-ui category styling for care.* events (V2-NOT-02-A).

────────────────────────────────────────
MODULE: property  (packages/dashboard-modules-property)
────────────────────────────────────────
Audit anchor: §B.property.

Home widgets:
  - SavedPropertiesCard (count + last 3 thumbnails)
  - InquiriesOpenCard
  - ViewingsScheduledCard
  - SubmissionStatusCard (only if owner-submitter; getRoleGate honors)

Command palette entries:
  - "Search properties" → /modules/property/search
  - "Submit a listing" → /modules/property/submit
  - "View saved" → /modules/property/saved
  - "Manage my listings" (lister role) → /modules/property/listings
  - "Schedule a viewing" → /modules/property/viewings/new
  - "Download property one-pager" → branded-documents per listing

Notification categories: property.inquiry, property.viewing, property.listing,
                        property.submission, property.moderation

Empty state: "Curated premium homes" kicker; lifecycle-aware headline.

Audit-debt fixes (NOT deferred):
  - Every raw <img> in apps/property → DivisionImage. Specifically
    apps/property/components/property/PropertyImageGallery.tsx (2 raw
    <img>) and apps/property/components/property/ui.tsx (audit §B.property-7).
    Verify by grep: 0 hits remain.
  - Layout shift from un-dimensioned images → resolved by DivisionImage
    requiring width/height.
  - Primary actions → ActionButton with full state machine.
  - Shared-account login URL usage at apps/property/lib/property/links.ts
    → verify post-fix state per audit §B.property-12.

V2 primitives consumed:
  - branded-documents for property listing one-pager (V2-DOCS-01).
  - notifications-ui for property.* category styling.

────────────────────────────────────────
MODULE: studio  (packages/dashboard-modules-studio)
────────────────────────────────────────
Audit anchor: §B.studio.

Home widgets:
  - ActiveProjectsCard (client role; milestone progress)
  - ProposalsAwaitingCard
  - InvoicesUnpaidCard            (branded-documents download CTA)
  - DeliverablesAvailableCard

Command palette entries:
  - "Request a project" → /modules/studio/request
  - "View my projects" → /modules/studio/projects
  - "View invoices" → /modules/studio/invoices
  - "Open active project" (top by activity)

Notification categories: studio.project, studio.proposal, studio.payment,
                        studio.delivery, studio.revision

Empty state: "Premium delivery starts here" kicker.

Audit-debt fixes (NOT deferred):
  - Long unpremium request selector dropdown at apps/studio/(public)/pick
    or /request → TypeaheadGrid with brand-tier visual treatment (audit
    §B.studio-7, §B.studio-12).

V2 primitives:
  - chat-composer for support thread (V2-COMPOSER-01).
  - branded-documents for invoices (V2-DOCS-01).

────────────────────────────────────────
MODULE: jobs    (packages/dashboard-modules-jobs)
────────────────────────────────────────
Audit anchor: §B.jobs.

Home widgets:
  - ApplicationsInFlightCard       (candidate role)
  - SavedJobsCard
  - InterviewsScheduledCard
  - JobAlertsCard
  - PostedJobsCard                 (employer role)
  - RecruiterPipelineCard          (recruiter role)

Each widget is gated by viewer.role; the rail lists modules per role.

Command palette entries:
  - "Search jobs" → /modules/jobs/search
  - "View applications" → /modules/jobs/applications
  - "Post a job" (employer) → /modules/jobs/post
  - "Open candidate pipeline" (recruiter) → /modules/jobs/pipeline

Notification categories: jobs.application, jobs.interview, jobs.alert,
                        jobs.posting, jobs.candidate

Empty state: "Roles that match your trust profile" kicker.

Audit-debt fixes:
  - Verify apps/jobs/app/admin/page.tsx routes to retired layout (audit
    §B.jobs-1). If yes, the admin module entry routes to a new in-shell
    admin surface served by the module via getRoleGate.

V2 primitives:
  - chat-composer for hiring conversation (V2-COMPOSER-01).
  - branded-documents for jobs application package (V2-DOCS-01 — template
    exists; route handler lands in V2-DOCS-02 per V2-DOCS-01 §10
    hand-off; DASH-3 wires the slot but the actual download may say
    "coming in V2-DOCS-02" until then; classify as PARTIAL with reason).

────────────────────────────────────────
MODULE: learn   (packages/dashboard-modules-learn)
────────────────────────────────────────
Audit anchor: §B.learn.

Home widgets:
  - EnrolledCoursesCard (progress bars)
  - CertificatesCard               (branded-documents download CTA —
                                    V2-DOCS-01 already wired in
                                    apps/learn; module surfaces it)
  - PathsContinueCard
  - PaymentsCard

Command palette entries:
  - "Browse courses" → /modules/learn/courses
  - "Resume last course"
  - "View certificates" → /modules/learn/certificates
  - "Verify a certificate" → /modules/learn/certifications/verify
  - "Download certificate" → branded-documents (already wired)

Notification categories: learn.course, learn.assignment, learn.certificate,
                        learn.payment, learn.unlock

Empty state: "Pick a path. Earn a credential employers verify." kicker.

V2 primitives: branded-documents (V2-DOCS-01).

────────────────────────────────────────
MODULE: logistics  (packages/dashboard-modules-logistics)
────────────────────────────────────────
Audit anchor: §B.logistics.

Home widgets:
  - ActiveShipmentsCard
  - QuoteShortcut (single-input "Where to?")
  - RecentTrackingCard

Command palette entries:
  - "Get a quote" → /modules/logistics/quote
  - "Book a shipment" → /modules/logistics/book
  - "Track a shipment" → /modules/logistics/track

Notification categories: logistics.shipment, logistics.delivery,
                        logistics.quote

Empty state: "Same-day, same-city" kicker; "First quote in under 60s"
headline.

V2 primitives:
  - address-selector for the quote/book flows (V2-ADDR-01 — already
    reading from user_addresses; module wraps the existing pages in the
    shell route and adds <AddressSelector> to the picker per V2-ADDR-01
    hand-off).

────────────────────────────────────────
MODULE: wallet  (cross-cutting customer; packages/dashboard-modules-wallet)
────────────────────────────────────────
Audit anchor: §B.account-8.

Home widgets:
  - BalanceCard (with quick add-money)
  - PendingFundingCard
  - RecentTransactionsCard         (branded-documents — transaction
                                    history download CTA)
  - PayoutMethodsCard

Command palette entries: "Add money", "Withdraw", "View transactions",
                        "Download statement"

Notification categories: wallet.funding, wallet.withdrawal, wallet.transaction

V2 primitives: branded-documents (V2-DOCS-01 — transaction history is
              one of the 11 surfaces shipped).

────────────────────────────────────────
MODULE: support  (cross-cutting; packages/dashboard-modules-support)
────────────────────────────────────────
Audit anchor: §B.account-10.

Home widgets:
  - OpenThreadsCard
  - UnreadRepliesCard
  - SuggestedHelpCard (top help articles by lifecycle stage)

Command palette entries: "New support request", "View threads",
                        "Browse help", "Download thread export"

Notification categories: support.thread, support.reply

V2 primitives:
  - chat-composer for reply form (V2-COMPOSER-01 — already integrated).
  - branded-documents for thread export (V2-DOCS-01).

────────────────────────────────────────
MODULE: notifications  (the inbox; packages/dashboard-modules-notifications)
────────────────────────────────────────
Audit anchor: §A.8, §B.account-6.

Owns the full inbox lifecycle (read/unread/archive/delete/restore/purge).
Surfaces in the ContextDrawer (DASH-6 wires the drawer; DASH-3 ships the
module manifest + inbox content components).

Command palette entries:
  - "Mark all read"
  - "Open recently deleted"
  - "Quiet hours"

Notification categories: meta — surfaces all categories.

V2 primitives consumed:
  - notifications-ui (V2-NOT-02-A) — bell + popover + toast viewport +
    swipe gestures + severity styling. The module promotes
    @henryco/notifications-ui from account-only (audit §A.3-1) to
    shell-wide. Customer + staff audiences both rendered through the
    same primitives.

────────────────────────────────────────
MODULE: settings  (cross-cutting; packages/dashboard-modules-settings)
────────────────────────────────────────
Audit anchor: §B.account.

Owns profile, preferences, notifications, addresses, security, privacy.

Command palette entries: "Change password", "Manage addresses",
                        "Privacy controls", "Notification preferences",
                        "Quiet hours timezone"

V2 primitives consumed:
  - address-selector (V2-ADDR-01) for /modules/settings/addresses
    (replaces apps/account/(account)/{addresses,settings/addresses}/page).

────────────────────────────────────────
HIDDEN FUTURE MODULES
────────────────────────────────────────
MODULE: building  (packages/dashboard-modules-building) — getRoleGate
                  returns "hidden". Empty home widget set. When the
                  division ships an app, flip the gate.
MODULE: hotel    (packages/dashboard-modules-hotel)    — same.

Audit anchor: §A.0.2 (packages/config/company.ts:117-161). Both registered
in COMPANY.divisions with full nav config but no apps/. The shell
extensibility test in DASH-3 is to flip the gate via
@henryco/intelligence feature flag in a preview deploy and confirm the
rail shows the new module with empty-state widgets only.

────────────────────────────────────────
HOUSEKEEPING DELETIONS (DASH-3 ships these)
────────────────────────────────────────
1. apps/care/app/(staff)/* → DELETED. Shell's care module handles staff
   role; static redirects to staffhq are removed.
2. apps/care/app/app/(staff)/{manager,owner}/page.tsx → DELETED (the
   double /app/app/ artefact, audit §A.17-1 + §B.care-12).
3. apps/apps/hub/ orphan directory → DELETED (audit §A.2-1).
4. Repo-root app/lib/workspace/data.ts orphan → DELETED (audit §B.hub-12;
   canonical at apps/hub/app/lib/workspace/data.ts).
5. apps/hub/app/workspace/[[...slug]]/page.tsx redirect-loop stub →
   REPLACED with a hard 308 redirect to account.henrycogroup.com/?role=staff
   for ≥30 days, then DELETED in DASH-7. Do not delete in DASH-3 — keep
   the redirect for staff-user comms continuity.

DOC CORRECTIONS (DASH-3 ships these):
1. docs/HENRYCO_ROLE_WORKFLOW_MATRIX.md line 108 → updated to reflect
   that apps/care/app/admin/page.tsx DOES gate via requireRoles
   (audit §A.17-2).

═══════════════════════════════════════════════════════
GATE STRUCTURE (parallel-able)
═══════════════════════════════════════════════════════

Each ACTIVE module ships as its own PR off DASH-2. Sub-PRs may run in
parallel. The phase as a whole is complete only when ALL 8 active
modules merge and all housekeeping deletions land.

G0 — Recon at .codex-temp/v2-dash-03/recon.md (cross-module, single).
G1..G8 — One gate per active module:
   G1: care
   G2: property
   G3: studio
   G4: jobs
   G5: learn
   G6: logistics
   G7: wallet
   G8: support
   G9: notifications
   G10: settings
   (10 modules total; gate per module includes V1–V13 PASS for that
   module's surfaces.)
G11 — building + hotel registered hidden. Extensibility flag-flip test.
G12 — Housekeeping deletions + doc corrections.
G13 — Phase report at .codex-temp/v2-dash-03/report.md aggregating per-
      module sub-reports.

═══════════════════════════════════════════════════════
ANTI-PATTERNS — applied to DASH-3
═══════════════════════════════════════════════════════

ALL of master §4.1 + §4.2 apply (the full 21). DASH-3 is the broadest
phase; reviewers re-state every audit-cited anti-pattern in each module's
sub-pass report. Specifically:

  #1 Long-scroll picker — TypeaheadGrid in care + studio.
  #2 Raw <img> — DivisionImage in property + remaining apps where audit
     finds them. Re-grep apps/* for raw <img> in JSX after DASH-3 closes;
     0 hits expected.
  #3 Buttons without states — ActionButton everywhere.
  #4 Decorative tiles — Care admin tiles wired or dropped.
  #5 Workspace redirect-loop — apps/hub/app/workspace stub stays as a
     308-only stub (DASH-3 doesn't delete it; DASH-7 does after
     stability).
  #6 Hardcoded division row — every module via registry.
  #7 Reimplemented role helpers — getRoleGate via packages/auth.
  #8 Direct Brevo/Resend — verify in module sub-pass report.
  #9 Per-widget Realtime — DASH-6 owns; DASH-3 module widgets call
     useNotificationSignal / useTaskSignal hooks shipped in DASH-1.
  #10 Treating staff as later — module getRoleGate honors staff
      audience-by-division.
  #11 Migrating state-changing endpoints — UI rebuild only.
  #12 V3 features — no new divisions, AI agents, marketplace expansion.
  #13–#21 — childish-dashboard suite. Every module's empty state,
            metrics, copy, mobile pattern audited.

═══════════════════════════════════════════════════════
VERIFICATION REQUIREMENT — DASH-3 gate
═══════════════════════════════════════════════════════

V1 build/typecheck/lint  — PASS required per module sub-PR.
V2 auth-continuity        — PASS required.
V3 RLS verification        — PASS required: cross-tenant probe on every
                           new module's read path.
V4 Realtime smoke           — PARTIAL — DASH-6 wires fan-out; DASH-3
                           verifies module hooks subscribe correctly.
V5 Mobile parity           — PASS required at all 6 breakpoints per
                           module home.
V6 Lighthouse + CWV         — PASS required per module home.
V7 WCAG AA                  — PASS required per module home.
V8 Sender identity          — PASS required.
V9 CTA reality              — PASS required — every CTA traced per
                           module. Audit's "Care admin decorative tiles"
                           and "Marketplace mobile workspace nav" gaps
                           explicitly closed in the module's CTA trace.
V10 Empty / loading / error / success — PASS required per module.
V11 No console errors       — PASS required.
V12 No 4xx/5xx              — PASS required.
V13 Role × division coverage — PASS required: every persona in audit
                           §D.2 walks every module they have access to.

A module that PARTIALs on V13 (because seed data is missing for some
role) defers seeding to the seed-script extension owned by the module
sub-PR — not a phase-level blocker.

═══════════════════════════════════════════════════════
OUTPUT FORMAT — per-module sub-pass + phase rollup
═══════════════════════════════════════════════════════

Persist:
  .codex-temp/v2-dash-03/recon.md
  .codex-temp/v2-dash-03/<module-slug>/cta-trace.md   (per module)
  .codex-temp/v2-dash-03/<module-slug>/report.md      (per module)
  .codex-temp/v2-dash-03/report.md                    (phase rollup —
                                                       references the
                                                       10 module reports
                                                       + housekeeping)

Each module's PR title:
  feat(dashboard): DASH-3 <slug> module port + audit-debt fixes

Phase classification: DASH-3-COMPLETE | DASH-3-PARTIAL | DASH-3-BLOCKED.

═══════════════════════════════════════════════════════
V2 SCOPE BOUNDARY
═══════════════════════════════════════════════════════

NOT permitted in DASH-3:
  - Smart Home signal-feed UI (DASH-4).
  - Cmd+K palette UI (DASH-5; manifest entries shipped here).
  - Realtime fan-out UI (DASH-6).
  - Mobile bottom action bar (DASH-7).
  - Owner Track B (DASH-8).
  - Deletion of apps/hub/app/workspace/* (DASH-7 after stability).
  - Owner-side migration from apps/hub/app/owner (Track B / DASH-8).
  - apps/staff (kept until DASH-8 if applicable; staff role widgets in
    each module are sufficient).

═══════════════════════════════════════════════════════
PERSISTED-REPORT REQUIREMENT
═══════════════════════════════════════════════════════

See OUTPUT FORMAT.

═══════════════════════════════════════════════════════
END OF DASH-3 FORGED PROMPT
═══════════════════════════════════════════════════════
```

---

## Authoring notes

- **Why parallel sub-PRs.** Each module port touches isolated package paths and a couple of `apps/*` integration points. Forcing them sequential adds two weeks of calendar with no review-quality benefit.
- **Why the housekeeping deletions are deferred for the workspace stub.** The `apps/hub/app/workspace/[[...slug]]` redirect-loop must be replaced with a clean 308 to the new shell — but deleted in DASH-7 only, after the new shell has been in production long enough to verify staff users are landing correctly. Premature deletion strands users.
- **Why care + property + studio + marketplace cluster the audit-debt fixes.** Audit §0.2 + §B*-7 rolled all four into the same UX-debt class — long-scroll selectors, raw `<img>`, missing button states, unpremium dropdowns. The shell primitives (TypeaheadGrid, DivisionImage, ActionButton) ship in DASH-1; DASH-3 is where they're applied. If DASH-3 PARTIALs on a primitive migration, the phase blocks until it's resolved — these are structural fixes, not deferable polish.
