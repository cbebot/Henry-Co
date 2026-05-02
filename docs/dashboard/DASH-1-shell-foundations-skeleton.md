# DASH-1 — Foundations + Shell Skeleton (Forged Prompt)

```
TOOL: Claude Code (Opus 4.7)
EFFORT: xhigh
PROJECT: HenryCo Ecosystem · henrycogroup.com · V2 active
PASS: V2-DASH-01 — Foundations + Shell Skeleton (account chrome)
EXPECTED DURATION: Multi-day. Sequential gates. Do NOT skip foundations to start UI early.

═══════════════════════════════════════════════════════
ROLE
═══════════════════════════════════════════════════════

Principal Systems Architect, Production Engineer, and Continuity Auditor for
the HenryCo Ecosystem.

You are running on Opus 4.7. Self-verify every artefact you produce. Before
reporting any sub-gate complete, check your output against the verification
gates V1–V13 in the master orchestration doc and the structural critique at
§C.10 of the audit. Name every uncertainty explicitly.

You are NOT improvising. Every architectural decision is grounded in
DASHBOARD-AUDIT-REPORT.md and DASHBOARD-REBUILD-PROMPT-V2-FINAL.md.

═══════════════════════════════════════════════════════
CONTEXT — read in this order BEFORE writing code
═══════════════════════════════════════════════════════

1. docs/dashboard/DASHBOARD-AUDIT-REPORT.md (FULL READ — every section
   anchor in this prompt comes from there)
2. docs/dashboard/DASHBOARD-REBUILD-PROMPT-V2-FINAL.md (the master — V1–V13
   gate definitions, anti-patterns 1–21, V2 primitive consumption matrix,
   pre-flight requirements)
3. docs/HENRYCO_ROLE_WORKFLOW_MATRIX.md (note: audit §A.17-2 corrects one
   stale claim — Care /admin DOES gate via requireRoles)
4. docs/identity-state-model.md
5. docs/auth-continuity-map.md
6. docs/render-strategy-map.md
7. docs/event-taxonomy.md
8. apps/hub/supabase/migrations/20260502120000_staff_notifications_audience.sql
   (the public.is_staff_in() predicate function — DASH-1 wraps this)
9. .codex-temp/v2-not-02-a/report.md (V2-NOT-02-A landed primitives)
10. .codex-temp/v2-auth-rt-01/report.md (post-auth-routing.ts contract —
    DASH-1's IdentityBar role-switcher MUST consume the SAME resolver)

Pre-flight checks (master §7) — confirm BEFORE writing code:
- Brevo Auth SMTP proof received by ops
- staffhq.henrycogroup.com redirect-loop status verified live
- Vercel preview build budget confirmed
- Canonical host decision (default account.henrycogroup.com Track A)

═══════════════════════════════════════════════════════
TRUTH HIERARCHY — enforce on every claim
═══════════════════════════════════════════════════════

CODE TRUTH: what exists in the repo (cite file:line).
DEPLOYMENT TRUTH: what is on Vercel (cite vercel.json + deployment logs).
LIVE TRUTH: what works with real data on production.

Every assertion in your sub-pass report MUST cite file:line.
Every "this works" claim MUST cite the verification step that confirmed it.
If a thing is asserted without a citation, mark it
`UNVERIFIED — REQUIRES OWNER CONFIRMATION`.

No "should work."

═══════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════

Land the shared infrastructure every later DASH phase depends on, and the
shell chrome that wires it up — in one phase, in this order:

  Step A — Foundation packages (no UI change)
  Step B — Database function + typegen
  Step C — Observability (Sentry + structured logger)
  Step D — Shell skeleton on apps/account (IdentityBar, WorkspaceRail,
           WorkspaceSlot, ContextDrawer; modules empty; renders existing
           customer-overview content directly until DASH-2)
  Step E — Verification gate

Step A delivers four new packages:

1) packages/auth/
   - requireUnifiedViewer(): unified customer + owner + staff identity,
     wraps the Supabase server client + the SQL is_staff_in() predicate.
   - getViewerRoles(viewer): returns {hasOwnerAccess, hasStaffAccess,
     staffDivisions, staffMemberships}. Source of truth = Postgres.
   - Re-exports the shape used by apps/account/lib/post-auth-routing.ts
     (DashboardRole, DashboardOption, DashboardResolution,
     AccessSnapshot, DASHBOARD_PREFERENCE_COOKIE, decideDashboardResolution,
     loadDashboardOptions, resolveUserDashboard).
   - Eliminates A.3-2 / C.1-1 audit findings.

2) packages/dashboard-shell/
   - register.ts          — DashboardModule type + registry
   - home-widget.ts       — Widget contract (audit §D.4)
   - command-palette.ts   — PaletteEntry contract (DASH-5 consumes)
   - notification-categories.ts — Category contract (DASH-6 consumes)
   - role-gate.ts         — RoleDecision contract
   - components/          — primitives:
       MetricCard         (REQUIRES comparison|trend prop — anti-pattern #18)
       Panel              (HenryCo geometry; rejects default tailwind shadow)
       PageHeader
       EmptyState         (kicker + headline + single action; no cartoons)
       LoadingSkeleton    (matches final layout dimensions)
       ErrorBoundary      (retry primitive)
       ActionButton       (idle | pending | disabled | spinner | success-lock)
       DivisionImage      (Cloudinary-aware Next/Image wrapper)
       TypeaheadGrid      (replaces long-scroll pickers — anti-pattern #1)
       BottomSheet, Drawer, FocusRing
       SignalCard, QuickLink, Chip, Badge, Section
   - tokens/              — motion (200ms ease-out fade+soft-scale; NO slide),
                           color (HenryCo black/gold/cream — NO blue primary),
                           type, spacing, focus-visible ring (2px primary
                           accent inset offset)
   - shell/               — IdentityBar, WorkspaceRail, WorkspaceSlot,
                           ContextDrawer, SupabaseRealtimeProvider
                           (subscription set up in this phase, DASH-6 wires
                           the fan-out)

3) packages/data/
   - getSignalFeed(viewer, opts) — calls the SQL function from Step B.
   - getDashboardSummary(viewer) — replaces and consolidates
     apps/account/lib/account-data.ts:getDashboardSummary +
     apps/hub/lib/owner-data.ts:getOwnerOverviewData +
     apps/staff/lib/intelligence-data.ts:getStaffIntelligenceSnapshot
     (audit C.10 #3 — duplication).
   - getCrossDivisionActivity(viewer)
   - getSupportSummary(viewer)
   - All wrap the authed Supabase server client; service-role bypasses
     are ONLY in cron + the get_signal_feed function (audit A.7 layer 4).
   - Workspace-root database.types.ts generated via `pnpm dlx supabase gen
     types typescript`. Promote into packages/data; consumers import the
     typed handle.

4) packages/observability/
   - @sentry/nextjs config (Sentry.init wrapper for app/server/edge).
   - Structured logger with redaction of PII, scoped child loggers per
     domain (logger.child({module: 'shell'})).
   - Event-taxonomy emitter — implements the event names in
     docs/event-taxonomy.md.

Step B — SQL:
  CREATE FUNCTION public.get_signal_feed(viewer_id uuid, limit_count int)
    RETURNS TABLE (...)
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
    AS $$ ... $$;
  REVOKE ALL FROM PUBLIC;
  GRANT EXECUTE TO authenticated, service_role;

  Function joins customer_notifications (auth.uid() = user_id row scope) +
  customer_activity_log + tasks across visible divisions; optionally joins
  staff_notifications via is_staff_in() if viewer has staff role. Ranks by
  (priority weight, recency weight, role-fit weight). Returns N=50 with
  cursor.

  Migration filename: apps/hub/supabase/migrations/<NEXT_TS>_get_signal_feed.sql.

Step C — Observability wiring:
  Add @sentry/nextjs to apps/account, apps/hub, apps/staff (env vars only;
  do NOT instrument every API route in this phase — wire base Sentry init
  + capture unhandled errors). Add packages/observability dep in those
  three apps.

Step D — Shell skeleton on apps/account:
  - apps/account/app/(account)/layout.tsx → renders shell chrome
    (IdentityBar + WorkspaceRail + WorkspaceSlot + ContextDrawer +
    SupabaseRealtimeProvider).
  - apps/account/app/(account)/page.tsx → renders the EXISTING
    customer-overview content (kept as-is, dropped into WorkspaceSlot).
    Module registry not yet introduced — DASH-2.
  - apps/account/app/(account)/@drawer/default.tsx → empty stub for the
    parallel route slot; DASH-6 fills it.
  - apps/account/app/(account)/@rail/default.tsx → renders an empty
    WorkspaceRail; DASH-2 populates entries.
  - 308 redirect: /dashboard → / (per audit A.4 + master).

  IdentityBar wires:
    - Avatar + name + role pill (consumes resolveUserDashboard /
      loadDashboardOptions from packages/auth — same source as
      V2-AUTH-RT-01 login chooser)
    - Role switcher (sets hc_dash_pref cookie via shared
      packages/auth helper that mirrors the chooser's POST handler)
    - Search trigger (UI only in DASH-1 — DASH-5 wires Cmd+K)
    - Theme toggle
    - Sign-out menu (calls the existing /api/auth/logout endpoint)

  ContextDrawer in DASH-1: empty drawer slot with "Notifications coming
  online…" placeholder. DASH-6 populates.

Step E — Verification (V1, V2, V3, V6, V7, V11, V12 are mandatory in
DASH-1; V4/V5/V9/V10/V13 N/A justified because no UI module changes —
existing customer-overview is dropped in unchanged):
  See VERIFICATION REQUIREMENT below.

═══════════════════════════════════════════════════════
GATE STRUCTURE
═══════════════════════════════════════════════════════

G0 — Recon
  Read the audit, master orchestration, V2 pass reports listed in CONTEXT.
  Confirm pre-flight items. Open recon.md in
  .codex-temp/v2-dash-01/recon.md.

G1 — Foundation packages: packages/auth, packages/dashboard-shell,
     packages/data, packages/observability scaffolded with package.json,
     tsconfig.json, src/index.ts. Empty modules typecheck.
G2 — packages/auth contracts written + types match V2-AUTH-RT-01 contract
     (no divergence from apps/account/lib/post-auth-routing.ts).
G3 — packages/dashboard-shell primitives shipped. Each primitive compiles
     standalone and renders in a Storybook-like sandbox at
     apps/account/app/_dev/shell-primitives/page.tsx (dev-only).
G4 — packages/data helpers shipped. getDashboardSummary parity-checked
     against the existing apps/account/lib/account-data.ts implementation
     using a fixture comparison test.
G5 — packages/observability shipped. Sentry init + structured logger.
G6 — SQL get_signal_feed migration committed and applied to a Supabase
     branch. RLS verified by code review; live RLS probe in G10.
G7 — apps/account shell skeleton renders with the existing
     customer-overview content. /dashboard 308 redirect in place.
G8 — IdentityBar role-switcher consumes packages/auth (same resolver as
     V2-AUTH-RT-01 login chooser). Verified by tracing the contract.
G9 — Verification gate (V1, V2, V3, V6, V7, V11, V12).
G10 — Live RLS probe via Supabase Management API (or pgTAP) against the
     get_signal_feed function with two test users in different tenants.
G11 — Persisted report at .codex-temp/v2-dash-01/report.md.
G12 — PR opened against main with the gate output.

═══════════════════════════════════════════════════════
ANTI-PATTERNS — applied to DASH-1
═══════════════════════════════════════════════════════

Master §4 enumerates 21 anti-patterns. The subset relevant to DASH-1:

From master §4.1 (audit-derived):
  #5 Workspace redirect-loop pattern (use App Router parallel routes).
  #7 Reimplemented role helpers in TypeScript (packages/auth wraps
     Supabase + SQL is_staff_in() — source of truth stays in Postgres).
  #9 Per-widget Supabase Realtime (single subscription at shell level).
  #11 Migrating state-changing endpoints (UI rebuild only; API paths
      under apps/*/app/api/* untouched).

From master §4.2 (childish-dashboard):
  #13 Emoji-as-icon — use @henryco/notifications-ui icon set, extended
      in @henryco/dashboard-shell.
  #14 Default Tailwind/shadcn cards — every Panel uses HenryCo geometry.
  #15 Primary = blue — use HenryCo black/gold/cream.
  #18 Metrics without context — MetricCard requires comparison|trend.
  #20 Copy not in HenryCo voice — placeholder copy with TODO V2-COPY-01.
  #21 Mobile = desktop scaled down — primitives ship mobile-first.

DO NOT:
- Reimplement the address selector, chat composer, notifications-ui
  bell, or branded-documents primitives. DASH-1 only ships the SHELL
  primitives (MetricCard, Panel, EmptyState, etc.). The V2 packages
  remain consumed in their domain modules.
- Refactor or rename any apps/*/lib/* files outside what packages/auth +
  packages/data consolidate.
- Migrate notification UI from apps/account in this phase. DASH-6 does it.
- Touch apps/hub /owner or apps/staff in DASH-1 except to add @sentry/nextjs.

═══════════════════════════════════════════════════════
VERIFICATION REQUIREMENT — DASH-1 gate
═══════════════════════════════════════════════════════

Per master §3, the V1–V13 gate definitions are canonical. DASH-1 PASS/FAIL/N/A:

V1 build/typecheck/lint  — PASS required: pnpm -r typecheck && pnpm -r lint
                           && pnpm -r build all clean. Zero new warnings.
V2 auth-continuity        — PASS required: existing Playwright matrix in
                           apps/{care,marketplace,property}/tests passes
                           unchanged. Plus a new shell-level test confirms
                           IdentityBar reads the same access snapshot as
                           the login chooser.
V3 RLS verification        — PASS required: pgTAP or Playwright probe
                           against get_signal_feed with 2 cross-tenant
                           users; 0 cross-pollination.
V4 Realtime smoke           — N/A — DASH-6 wires the fan-out.
V5 Mobile parity           — PARTIAL — verify shell chrome renders at all
                           6 breakpoints (320/375/390/430/768/1024); the
                           customer-overview content inside is unchanged
                           and out of scope for DASH-1's parity gate.
V6 Lighthouse + CWV         — PASS required on / (account home with
                           skeleton wrapped around existing content):
                           Perf ≥ 90, A11y ≥ 95, BP ≥ 95, SEO ≥ 95;
                           LCP < 2.5 s, CLS < 0.1, INP < 200 ms.
V7 WCAG AA                  — PASS required: axe-core 0 violations on
                           shell chrome (IdentityBar, WorkspaceRail,
                           ContextDrawer empty stub).
V8 Sender identity          — PASS required: grep across the diff for raw
                           Brevo/Resend instantiation; 0 hits beyond the
                           documented receiver in apps/care/lib/resend-
                           server.ts (audit §C.6-1).
V9 CTA reality              — N/A — DASH-1 introduces no new CTAs; the
                           IdentityBar's role-switcher and sign-out are
                           verified live in the auth-continuity matrix.
V10 Empty/loading/error     — PARTIAL — primitive states tested in the
                           dev sandbox at /_dev/shell-primitives;
                           customer-overview retains its existing
                           empty/loading/error patterns until DASH-2.
V11 No console errors       — PASS required: 0 errors across the role ×
                           division matrix walkthrough (master §3 V11).
V12 No 4xx/5xx              — PASS required.
V13 Role × division coverage — PASS required across all 8 personas in
                           audit §D.2 (customer-only / customer-active /
                           customer-problem / owner / 5 staff variants).

A PARTIAL on V5/V10 is acceptable in DASH-1 because no UI module changes;
the customer-overview content carries forward. Document each PARTIAL with
the explicit reason in the sub-pass report.

═══════════════════════════════════════════════════════
OUTPUT FORMAT — sub-pass report
═══════════════════════════════════════════════════════

Persist at .codex-temp/v2-dash-01/report.md before merging:

  Files modified: list with file:line ranges
  Packages added: 4 new (packages/auth, packages/dashboard-shell,
                  packages/data, packages/observability)
  SQL migrations: filename, lines added
  What was done: 5–10 lines, no marketing
  How to verify: shell commands / preview URLs / fixture seed steps
  Uncertainties: every UNVERIFIED bullet from your work
  Anti-pattern audit: master §4.1 + §4.2 entries with PASS/FAIL/N/A
  Verification gate (V1–V13): per-item PASS / FAIL / N/A with citations
  Classification: DASH-1-COMPLETE | DASH-1-PARTIAL | DASH-1-BLOCKED
  Hand-off: DASH-2 starts on which branch, depends on what

PR title: feat(dashboard): DASH-1 foundations + shell skeleton (account chrome)
PR body: paste the report.

═══════════════════════════════════════════════════════
V2 SCOPE BOUNDARY
═══════════════════════════════════════════════════════

NOT permitted in DASH-1:
  - New divisions beyond the 11 in COMPANY.divisions
  - AI agents / chatbots / generative widgets in the shell
  - Marketplace category expansion
  - New auth flows (passkeys, MFA — flagged FALSE/STALE in audit §A.5)
  - New payment rails / wallet currencies
  - Mobile app UI changes beyond making the new shell deep-linkable
  - Module registry (DASH-2 ships this)
  - Module ports (DASH-2/DASH-3 ship these)
  - Smart Home signal feed UI (DASH-4)
  - Cmd+K palette UI (DASH-5)
  - Realtime fan-out (DASH-6)
  - Owner dashboard (Track B / DASH-8)

If a "wouldn't it be nice…" thought arises, classify as a later DASH or
V3 and reject. The verification gate cannot pass with out-of-scope work
in the diff.

═══════════════════════════════════════════════════════
PERSISTED-REPORT REQUIREMENT
═══════════════════════════════════════════════════════

  .codex-temp/v2-dash-01/recon.md         (gate G0)
  .codex-temp/v2-dash-01/rls-probe.md     (gate G10)
  .codex-temp/v2-dash-01/report.md        (gate G11 — final)

Do not skip persistence. The next phase (DASH-2) reads these files.

═══════════════════════════════════════════════════════
END OF DASH-1 FORGED PROMPT
═══════════════════════════════════════════════════════
```

---

## Authoring notes (not part of the prompt — for owner review)

- **Why foundations + shell skeleton in one phase rather than two.** The prior prompt's Sub-Pass 1 (foundations) + Sub-Pass 2 (shell chrome) are conceptually one delivery: the foundations are not validated until the chrome consumes them, and the chrome cannot exist without the primitives. Keeping them in the same phase shrinks the time the foundations exist as untested code.
- **Why packages/auth ships the post-auth-routing types.** The IdentityBar's role-switcher is the same decision as login. Diverging the role logic recreates the fragmentation V2-AUTH-RT-01 fixed. Master §5 enforces this.
- **Why customer-overview is left unchanged in DASH-1.** Validating shell chrome on a known-good content surface separates "is the shell broken" from "is the module broken." DASH-2 ports customer-overview into the registry.
- **Why @sentry/nextjs lands here, not later.** The next 7 phases will surface bugs. Without observability they're invisible. Landing Sentry now makes every later phase's bugs traceable.
