# DASH-8 — Owner Dashboard (Track B, Forged Prompt)

```
TOOL: Claude Code (Opus 4.7)
EFFORT: xhigh
PROJECT: HenryCo Ecosystem · henrycogroup.com · V2 active
PASS: V2-DASH-08 — Owner dashboard (separate canonical surface)
EXPECTED DURATION: Long. Track B may begin after DASH-1 merges and
                   foundations stabilize, but MUST NOT enter production
                   until DASH-7 has been live for ≥ 14 days (master §2).
                   This is the riskiest single phase — owner-facing,
                   admin actions, finance, audit log.

═══════════════════════════════════════════════════════
ROLE
═══════════════════════════════════════════════════════

Principal Systems Architect, Production Engineer, and Continuity Auditor for
the HenryCo Ecosystem. Opus 4.7. Self-verify against V1–V13.

═══════════════════════════════════════════════════════
CONTEXT — read in this order BEFORE writing code
═══════════════════════════════════════════════════════

1. docs/dashboard/DASHBOARD-AUDIT-REPORT.md (§A.15.2 owner surface,
   §B.hub, §A.4-1 workspace redirect-loop, §C.10 — owner is a
   different product)
2. docs/dashboard/DASHBOARD-REBUILD-PROMPT-V2-FINAL.md (master §2 Track
   B, §4 anti-patterns including #19 role-agnostic UI explicitly
   forbidden)
3. docs/dashboard/DASH-1 (Track B reuses every foundation primitive —
   packages/auth, packages/dashboard-shell, packages/data, packages/
   observability, public.get_signal_feed)
4. apps/hub/lib/owner-data.ts:getOwnerOverviewData (the existing
   canonical owner data layer; Track B refactors into packages/data
   helpers parallel to consumer's getDashboardSummary)
5. apps/hub/app/owner/(command)/page.tsx (existing owner home —
   audit §A.15.2 lists every section + widget; Track B reproduces
   density-first)
6. apps/hub/components/owner/InternalTeamCommsClient.tsx (1223-line
   client — V2-COMPOSER-02 deferred; Track B leaves this surface
   unchanged unless V2-COMPOSER-02 has shipped)
7. apps/hub/proxy.ts + apps/hub/vercel.json (host rewrites for
   hq.henrycogroup.com, staffhq.henrycogroup.com, workspace.henrycogroup.com)
8. apps/hub/app/workspace/[[...slug]]/page.tsx (audit §A.4-1 — the
   suspected redirect-loop stub. Track B replaces this with a permanent
   308 to account.henrycogroup.com/?role=staff and DELETES the stub
   only after staff redirect verified stable for ≥30 days)
9. .codex-temp/v2-docs-01/report.md (V2-DOCS-01 — owner needs Power:
   bulk operations + exports via DOCS-01 across finance, audit,
   division performance)

═══════════════════════════════════════════════════════
TRUTH HIERARCHY
═══════════════════════════════════════════════════════

CODE / DEPLOYMENT / LIVE truth — see master §3.

═══════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════

Build the owner dashboard as a SEPARATE PRODUCT, on a separate
canonical surface, with a different shape than the consumer dashboard.

Canonical surface: hq.henrycogroup.com/owner (the existing host;
keeping it preserves owner cookies + bookmarks).

Reference standard: Linear, Stripe, Vercel, Plaid admin. Specifically:

  Density:  information-dense, table-first, keyboard-driven
  Trust:    every action audit-logged, every metric reconcilable
  Speed:    sub-200ms perceived response on every interaction
  Power:    bulk operations, advanced filters, exports via DOCS-01

What this means in practice:

1. Density (NOT clarity)
   - 12+ tile metric grid, not 4–6.
   - Tables-first for: divisions, staff, audit, finance, support
     queues, signal feed.
   - Keyboard shortcuts pervasive — every navigable surface has a
     hotkey, listed in the cheat sheet (DASH-5 "?" pattern; Track B
     ships its OWN cheat sheet because owner shortcuts differ).
   - Information-density is the design goal, not whitespace.

2. Trust (audit log + reconcilable metrics)
   - Every owner action that mutates state writes an audit_log row
     via @henryco/observability's structured logger + Postgres audit_log
     insert.
   - Every metric on the owner home has a "trace" link that opens a
     drawer showing the underlying SQL filter + result set + timestamp.
   - Sensitive activity panel (audit §A.15.2) ships as table-first,
     filterable, exportable.

3. Speed
   - Every interactive surface targets INP < 200 ms.
   - Server cache is more aggressive (60 s vs consumer's 30 s).
   - Optimistic UI on bulk operations with per-row reconciliation
     after server confirms.

4. Power
   - Bulk operations: select multiple rows, apply action (approve,
     decline, escalate, refund, suspend) — with confirmation modal
     citing the count + sample.
   - Advanced filters: date range, division, status, role, amount
     range, free-text search across the active table.
   - Exports: every owner table can export via DOCS-01 — branded PDF
     for snapshots, CSV for raw data analysis. The export action
     captures the active filter state in the document header so the
     owner knows what view they downloaded.

5. Owner-specific modules / surfaces (port from existing apps/hub
   /owner)
   - Executive situation room (briefing + comms-health 4-tile +
     next-best actions)
   - Division control center (cross-division metric + alert grid)
   - Helper recommendations panel
   - Sensitive activity panel (audit log)
   - Executive digest panel
   - Urgent signals panel
   - Owner finance center (revenue, invoices, expenses)
   - Owner staff center (directory, invite, roles, tree, users/[id])
   - Owner brand center (pages, settings, subdomains)
   - Owner messaging center (alerts, queues, team)
   - Owner operations center (alerts, analytics, approvals, queues)
   - Owner AI insights / signals (gated by feature flag, current
     content stays as in apps/hub/owner)
   - Owner settings (audit, comms, security)
   - Each is a Track B module in packages/dashboard-modules-owner-*
     (separate package family from Track A modules — rejecting
     anti-pattern #19 directly).

6. Workspace surface kill (the §A.4-1 critical fix)
   - apps/hub/app/workspace/[[...slug]]/page.tsx → permanent 308 to
     account.henrycogroup.com/?role=staff. Active staff users land in
     the consumer Track A shell with role=staff applied.
   - workspace.henrycogroup.com → 308 to staffhq.henrycogroup.com →
     308 to account.henrycogroup.com/?role=staff. The old hub workspace
     stub is DELETED 30 days after the redirect lands and is verified
     to route correctly.
   - apps/hub/app/owner/* → the canonical owner shell remains here in
     Track B. apps/hub/app/owner is NOT consumed by the Track A shell.

7. Consumer + owner stay separate
   - Track A's IdentityBar role-switcher (DASH-1) lets a viewer with
     both roles hop between hosts. The role-switcher consumes
     packages/auth's resolveUserDashboard (V2-AUTH-RT-01) — same
     resolver. From Track A, switching to "Owner" sets hc_dash_pref
     and redirects to hq.henrycogroup.com/owner. From Track B,
     switching to "Customer" redirects to account.henrycogroup.com/.
   - Two products, one identity, one cookie domain.

═══════════════════════════════════════════════════════
GATE STRUCTURE
═══════════════════════════════════════════════════════

G0 — Recon at .codex-temp/v2-dash-08/recon.md. Confirm DASH-7 has been
     in production ≥ 14 days. Confirm Track B's risk register is signed
     off by the owner.
G1 — Track B foundation reuse: confirm packages/auth, packages/dashboard-
     shell, packages/data, packages/observability, public.get_signal_feed
     are in production from DASH-1.
G2 — Track B shell skeleton on apps/hub/app/owner/: density-first chrome
     (different IdentityBar layout, owner-specific WorkspaceRail with
     12+ entries, ContextDrawer same primitive but loaded differently).
G3 — owner-overview module port (executive situation room + 6+ metric
     cards + signals + division control center + helper recommendations
     + sensitive activity).
G4 — Track B module ports — finance, staff, brand, messaging,
     operations, AI insights, settings.
G5 — Bulk operations primitive — <BulkActionBar> in @henryco/dashboard-
     shell (lands as a Track-B-driven addition; consumer shell can use
     it later when needed).
G6 — Advanced filters primitive — <AdvancedFilterBar>.
G7 — Export primitive — <BulkExportButton> wrapping DOCS-01 helpers.
G8 — Audit log + reconcilable metrics — every metric card has a trace
     link, every action writes audit_log.
G9 — Workspace surface kill — apps/hub/app/workspace/[[...slug]] becomes
     permanent 308 to account.henrycogroup.com/?role=staff. apps/hub/
     proxy.ts + vercel.json updated.
G10 — Track A IdentityBar role-switcher integration verified end-to-end
      (consumer hops to owner hops to consumer; cookie + session
      preserved).
G11 — V1–V13 verification on Track B with the owner-specific gate
      additions below.
G12 — 30-day soak in production. After 30 days of clean operation,
      apps/hub/app/workspace/[[...slug]] is DELETED in a follow-up
      cleanup PR. apps/hub/app/owner/* stays — that's the canonical
      Track B home.
G13 — Persisted report at .codex-temp/v2-dash-08/report.md.

═══════════════════════════════════════════════════════
ANTI-PATTERNS — applied to DASH-8
═══════════════════════════════════════════════════════

ALL of master §4.1 + §4.2 apply. The most important for Track B:

  #19 Role-agnostic UI — owner gets density. Consumer shell IS NOT
      reused for owner. Consumer modules in packages/dashboard-modules-
      account / -marketplace / etc. are NOT mounted in Track B.
      Different packages (packages/dashboard-modules-owner-*) for owner.
      Verify by inspecting Track B's WorkspaceRail composition: it
      reads from getEligibleOwnerModules(viewer), not getEligibleModules.

  #5 Workspace redirect-loop — the existing audit §A.4-1 critical fix
     lands here. apps/hub/app/workspace/* becomes a clean 308 to
     account.henrycogroup.com/?role=staff. No more loops.

  #15 Blue primary — HenryCo black/gold/cream. Owner accents skew
      darker / more conservative than consumer.

  #18 Bare metrics — owner metrics ALWAYS have comparison + trend +
      reconcile-link. No "$1,234" alone.

  #20 Copy not in HenryCo voice — owner copy is even more terse and
      operator-focused than consumer. NO "Welcome back!" — replace
      with "12 unread signals · 3 require attention".

  #21 Mobile = different layout — owner is desktop-first but mobile-
      capable. Owner mobile uses BottomSheet for tables (full-height
      sheet with horizontally-scrollable table — table-first remains
      the design goal even on mobile).

DO NOT:
- Mount Track A consumer modules into Track B.
- Migrate apps/hub/components/owner/InternalTeamCommsClient.tsx unless
  V2-COMPOSER-02 has shipped (master §9). Leave it as-is.
- Migrate the owner's email cron schedules (`/api/cron/owner-reports`,
  `/api/cron/owner-reporting/{weekly,monthly}` — kept unchanged).
- Open hq.henrycogroup.com to non-owner / non-staff users. Track B
  enforces requireOwner() (or equivalent) at the layout layer.
- Build AI agents in Track B (V3).
- Add new divisions or apps in Track B.

═══════════════════════════════════════════════════════
VERIFICATION REQUIREMENT — DASH-8 gate
═══════════════════════════════════════════════════════

V1 build/typecheck/lint  — PASS required.
V2 auth-continuity        — PASS REQUIRED — Track B is the riskiest
                           cross-subdomain hop. Customer + staff +
                           owner roles must hop between Track A
                           (account.henrycogroup.com) and Track B
                           (hq.henrycogroup.com) without re-auth.
                           Verify shared cookie domain still applies.
V3 RLS verification        — PASS REQUIRED — Track B uses service-role
                           in apps/hub/lib/owner-data.ts (audit
                           §B.hub-4). Verify EVERY new owner
                           aggregation route either (a) uses
                           service-role with explicit allowlist on
                           cross-tenant aggregate or (b) uses authed
                           client. No new RLS gaps.
V4 Realtime smoke           — PASS required: owner ContextDrawer
                           receives staff_notifications when owner has
                           staff access too.
V5 Mobile parity           — PASS required at all 6 breakpoints (320
                           through 1024). Owner mobile is desktop-
                           first but must not break.
V6 Lighthouse + CWV         — PASS required. Owner's INP target is
                           STRICTER: < 200 ms on every owner action
                           (the speed criterion).
V7 WCAG AA                  — PASS required. Owner shell chrome targets
                           AAA on focus rings and color contrast.
V8 Sender identity          — PASS required: owner reports cron
                           pathway uses @henryco/email purpose='generic'
                           or owner-specific purpose. Verify in V2-
                           PNH-03B audit context (audit §A.18).
V9 CTA reality              — PASS required: every owner CTA traced
                           with file:line + destination. Owner
                           dashboard CTA density is highest in the
                           system; this is a careful trace.
V10 Empty / loading / error / success — PASS required. Bulk
                           operations get explicit success-state lock
                           PER ROW.
V11 No console errors       — PASS required.
V12 No 4xx/5xx              — PASS required across the role × division
                           matrix walkthrough.
V13 Role × division coverage — PASS required: owner-only persona +
                           owner+staff persona + owner+staff+customer
                           persona (the worst-case ambiguous from
                           V2-AUTH-RT-01) all walked.

Track B-specific additions to the gate:

V14 Bulk-action audit       — PASS required: every bulk action writes
                           audit_log entries equal to row count (one
                           per affected row, with bulk_correlation_id
                           grouping them). Probe by running a 5-row
                           bulk approve and counting audit rows.
V15 Reconcile trace         — PASS required: every metric card has a
                           trace link that surfaces the underlying SQL
                           filter + result set + timestamp.
V16 308 redirect verified   — PASS required: hitting /workspace/ on
                           hq.henrycogroup.com returns 308 to
                           account.henrycogroup.com/?role=staff. Same
                           for staffhq.henrycogroup.com. Same for
                           workspace.henrycogroup.com.
V17 Cross-track session     — PASS required: hop between Track A and
                           Track B with the role-switcher and verify
                           cookie + session preserved end-to-end.

═══════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════

Persist at .codex-temp/v2-dash-08/report.md:
  Files modified
  Owner module ports (packages/dashboard-modules-owner-*)
  Workspace surface kill confirmation (308 active, stub still in place
                                       for 30-day soak)
  What was done
  How to verify
  Uncertainties
  Anti-pattern audit
  Verification gate (V1–V17)
  Bulk-action audit probe results
  Reconcile trace coverage
  Cross-track session probe
  Classification: DASH-8-COMPLETE | DASH-8-PARTIAL | DASH-8-BLOCKED
  Hand-off — when to delete apps/hub/app/workspace/[[...slug]] (after
            ≥30-day clean operation)

PR title: feat(dashboard): DASH-8 owner dashboard Track B.

═══════════════════════════════════════════════════════
V2 SCOPE BOUNDARY
═══════════════════════════════════════════════════════

NOT permitted in DASH-8:
  - Mounting consumer Track A modules into Track B.
  - V2-COMPOSER-02 (separate pass).
  - New divisions.
  - AI agents (V3).
  - Marketplace category expansion.
  - New auth flows.
  - Deletion of apps/hub/app/workspace/[[...slug]] within DASH-8 — the
    deletion is in a 30-day-later cleanup PR.

═══════════════════════════════════════════════════════
PERSISTED-REPORT REQUIREMENT
═══════════════════════════════════════════════════════

  .codex-temp/v2-dash-08/recon.md
  .codex-temp/v2-dash-08/cta-trace.md
  .codex-temp/v2-dash-08/bulk-action-probe.md
  .codex-temp/v2-dash-08/reconcile-trace.md
  .codex-temp/v2-dash-08/cross-track-session.md
  .codex-temp/v2-dash-08/308-verification.md
  .codex-temp/v2-dash-08/report.md         (final)

═══════════════════════════════════════════════════════
END OF DASH-8 FORGED PROMPT
═══════════════════════════════════════════════════════
```

---

## Authoring notes

- **Why Track B is its own track and last.** Owner is a different product. Reference standards (Linear, Stripe, Vercel, Plaid) are density-first, table-first, keyboard-driven, sub-200ms. Mixing Track A's clarity-first composition into Track B drags ergonomics down. Building it after Track A is in production preserves the consumer experience while owner is iterated.
- **Why Track B reuses every foundation primitive.** packages/auth, packages/dashboard-shell, packages/data, packages/observability, public.get_signal_feed are all consumer + owner usable. Reusing them keeps maintenance cost flat. Different shape, same primitives.
- **Why packages/dashboard-modules-owner-* is a separate package family.** Mixing owner widgets into the consumer module packages would force getEligibleModules to encode role-aware behavior at the package level, which violates anti-pattern #19. Two package families, two role gates, two getEligibleModules functions, one shared primitive set.
- **Why the workspace stub stays for 30 days.** Audit §A.4-1 marks this as the CRITICAL find. Deleting before the 308 has been verified live for staff users risks stranding them. The 30-day soak is conservative; faster is acceptable only if monitoring shows zero impressions on the stub.
