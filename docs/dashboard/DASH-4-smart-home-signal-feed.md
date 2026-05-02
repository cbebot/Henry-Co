# DASH-4 — Smart Home Signal Feed (Forged Prompt)

```
TOOL: Claude Code (Opus 4.7)
EFFORT: xhigh
PROJECT: HenryCo Ecosystem · henrycogroup.com · V2 active
PASS: V2-DASH-04 — Smart Home signal feed (live, ranked, real-data-only)
EXPECTED DURATION: Medium. May run in parallel with DASH-5 + DASH-6 after
                   DASH-3 completes (master §2 parallelism rules).

═══════════════════════════════════════════════════════
ROLE
═══════════════════════════════════════════════════════

Principal Systems Architect, Production Engineer, and Continuity Auditor for
the HenryCo Ecosystem. Opus 4.7. Self-verify against V1–V13.

═══════════════════════════════════════════════════════
CONTEXT — read in this order BEFORE writing code
═══════════════════════════════════════════════════════

1. docs/dashboard/DASHBOARD-AUDIT-REPORT.md (§A.6, §A.8, §C.4 — signal
   spine status; §C.10 — structural critique)
2. docs/dashboard/DASHBOARD-REBUILD-PROMPT-V2-FINAL.md (master)
3. docs/dashboard/DASH-1..DASH-3 forged prompts
4. .codex-temp/v2-dash-01/report.md (the get_signal_feed SQL function
   shipped in DASH-1; DASH-4 builds the surface that consumes it)
5. .codex-temp/v2-dash-02/report.md
6. .codex-temp/v2-dash-03/report.md (every module's manifest contributes
   home widgets via getHomeWidgets(viewer); DASH-4 composes them)
7. apps/account/lib/account-data.ts:getDashboardSummary (existing
   summary; DASH-4 may consolidate its computation into
   packages/data:getSignalFeed and getDashboardSummary)
8. apps/hub/lib/owner-data.ts:getOwnerOverviewData (cross-reference for
   Track B; DASH-4 stays Track A only — owner Smart Home is DASH-8)

═══════════════════════════════════════════════════════
TRUTH HIERARCHY
═══════════════════════════════════════════════════════

CODE / DEPLOYMENT / LIVE truth — see master §3.

═══════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════

Build the Smart Home — the WorkspaceSlot's default landing — as the
ranked, action-first, real-data-only home for the consumer + staff
shell at account.henrycogroup.com/.

Composition (server-rendered RSC; client only for interactive widgets):

1. PageHeader
   - Replaces "Welcome to your dashboard" patronizing copy
     (anti-pattern #17). Content-first lead: "3 unread signals · last
     activity 2 days ago" — values from getSignalFeed.

2. Ranked metric cards (4–6 cards, role + division aware)
   - Pulled from each module's getHomeWidgets(viewer) where Widget.size
     ∈ {"sm", "md"} and Widget.weight is the top-bucket cluster.
   - Each MetricCard has a comparison or trend prop populated from real
     data (anti-pattern #18). No bare numbers.

3. Attention panel
   - Blocking + high-priority + lifecycle-continue items.
   - Driven by getSignalFeed where signal.priority IN ('blocking',
     'high'). Server-ranked.
   - LifecycleContinuePanel from @henryco/lifecycle promoted as the
     "continue where you left off" surface inside this panel.

4. Signal feed
   - Server-rendered, paginated cursor (N=50 per page).
   - Reads packages/data:getSignalFeed which calls public.get_signal_feed
     (Postgres function shipped in DASH-1).
   - Cached 30 s in RSC via React's cache().
   - Each signal renders as <SignalCard> from @henryco/dashboard-shell.
   - NO decorative cards. NO dead CTAs. NO placeholders. Real-data-only.
     If a viewer has nothing in the feed, the EmptyState teaches the
     next-best lifecycle action.
   - Email-fallback awareness: signals where customer_notifications.
     email_dispatched_at IS NOT NULL render dimmer (audit §A.8).

5. Recommended next-best actions (up to 3)
   - Server-ranked from a server-side recommender. For DASH-4 this is
     a deterministic ranker reading lifecycle stage + recent activity.
     Future: gated by flags.intelligence_recommendations
     (@henryco/intelligence).

6. Module-contributed widget grid
   - Each registered module's getHomeWidgets(viewer) returns Widget[].
   - Shell heuristic places widgets by Widget.size + Widget.weight.
   - Modules render their widgets as RSC; the shell composes the layout.
   - This is the §D.4 contract — divisions register, shell composes.

7. Empty state
   - When getSignalFeed returns 0 signals AND no module home widget has
     content: typographic-minimalism EmptyState teaching the next-best
     onboarding action keyed to lifecycle (audit §C.10 #2 — no
     decorative tiles, no cartoons, no "Coming soon" decor).

The Smart Home is the only piece of UI that knows about the cross-
module ranking. Modules cannot rank against each other; the shell does.

═══════════════════════════════════════════════════════
GATE STRUCTURE
═══════════════════════════════════════════════════════

G0 — Recon at .codex-temp/v2-dash-04/recon.md.
G1 — packages/data:getSignalFeed wrapper finalized (DASH-1 shipped the
     SQL function; DASH-4 ships the typed wrapper + 30 s React cache()).
G2 — Smart Home composition lands at apps/account/app/(account)/page.tsx,
     replacing the existing customer-overview content (which DASH-2
     already pulled into the registry as the customer-overview module).
G3 — Ranked metric cards from getHomeWidgets cross-module.
G4 — Attention panel + LifecycleContinuePanel.
G5 — Signal feed pagination + cache + email-fallback dimming.
G6 — Next-best actions (server-deterministic ranker).
G7 — Module widget grid composition heuristic.
G8 — Empty state typographic-minimalism (anti-pattern #16).
G9 — V1–V13 verification.
G10 — Live-data probe: insert real customer_notifications + activity
     rows for a seeded user; confirm Smart Home renders with realistic
     ranking; confirm 30 s cache invalidates correctly.
G11 — Persisted report at .codex-temp/v2-dash-04/report.md.

═══════════════════════════════════════════════════════
ANTI-PATTERNS — applied to DASH-4
═══════════════════════════════════════════════════════

From master §4.1:
  #4 Decorative tiles — Smart Home has ZERO. Every signal is real data.
     If empty, EmptyState. No "you might also be interested in".
  #6 Hardcoded division row — composition from getEligibleModules.

From master §4.2:
  #13–#21 all apply, especially:
  #16 No cartoons — empty states typographic.
  #17 No patronizing copy — content-first lead.
  #18 No bare metrics — comparison|trend on every MetricCard.
  #19 Role-agnostic UI — Smart Home composition differs for customer
      vs staff (different module weight tables); but stays Track A
      consumer experience. Owner is Track B / DASH-8.

DO NOT:
- Build the Cmd+K palette UI (DASH-5).
- Build the realtime fan-out for the inbox (DASH-6 — but Smart Home's
  signal feed CAN refresh on realtime invalidation; the realtime
  subscription set up in DASH-1 publishes invalidation tokens that
  the Smart Home's React cache() honors via revalidateTag/revalidatePath).
- Migrate the existing /api/signal endpoint contracts in apps/account.

═══════════════════════════════════════════════════════
VERIFICATION REQUIREMENT — DASH-4 gate
═══════════════════════════════════════════════════════

V1 build/typecheck/lint  — PASS required.
V2 auth-continuity        — PASS required.
V3 RLS verification        — PASS required: get_signal_feed cross-tenant
                           probe (DASH-1 already verified the function;
                           DASH-4 verifies the SURFACE doesn't leak
                           rows from other tenants when the wrapper is
                           consumed).
V4 Realtime smoke           — PARTIAL — Smart Home reads getSignalFeed;
                           DASH-6 wires the realtime invalidation. DASH-4
                           verifies the cache() invalidation hook is in
                           place but does not require live realtime
                           refresh in this phase's gate.
V5 Mobile parity           — PASS required at all 6 breakpoints. Smart
                           Home is the most-viewed surface; mobile
                           parity is a hard gate.
V6 Lighthouse + CWV         — PASS required: Perf ≥ 90 (despite the
                           rich composition — RSC streaming + 30 s
                           cache make this achievable), A11y ≥ 95,
                           BP ≥ 95, SEO ≥ 95; LCP < 2.5 s, CLS < 0.1,
                           INP < 200 ms.
V7 WCAG AA                  — PASS required.
V8 Sender identity          — N/A — DASH-4 doesn't emit email.
V9 CTA reality              — PASS required — every Smart Home CTA
                           traced. The Attention panel + Signal feed
                           items are the highest-density CTA surface
                           in the shell; the trace must verify each
                           signal.href resolves to a real route.
V10 Empty / loading / error / success — PASS required. Tested with:
     empty fixture user, network throttle, mock getSignalFeed 500,
     happy-path real user.
V11 No console errors       — PASS required.
V12 No 4xx/5xx              — PASS required.
V13 Role × division coverage — PASS required across all 8 personas
                           (audit §D.2). The Smart Home is the test
                           surface that proves the shell composes
                           correctly for every role.

═══════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════

Persist at .codex-temp/v2-dash-04/report.md:
  Files modified
  What was done
  How to verify
  Uncertainties
  Anti-pattern audit
  Verification gate (V1–V13)
  Smart Home CTA trace (every signal href, every metric card link,
                       every action chip with file:line + destination
                       cite)
  Live-data probe results (G10)
  Classification: DASH-4-COMPLETE | DASH-4-PARTIAL | DASH-4-BLOCKED
  Hand-off

PR title: feat(dashboard): DASH-4 Smart Home signal feed.

═══════════════════════════════════════════════════════
V2 SCOPE BOUNDARY
═══════════════════════════════════════════════════════

NOT permitted in DASH-4:
  - Cmd+K palette UI (DASH-5).
  - Realtime fan-out UI (DASH-6).
  - Mobile bottom action bar (DASH-7).
  - Owner Track B (DASH-8).
  - New Postgres functions beyond what DASH-1 shipped (DASH-4 reads
    them; doesn't author).
  - AI / generative recommenders (V3).
  - New divisions.

═══════════════════════════════════════════════════════
PERSISTED-REPORT REQUIREMENT
═══════════════════════════════════════════════════════

  .codex-temp/v2-dash-04/recon.md
  .codex-temp/v2-dash-04/cta-trace.md
  .codex-temp/v2-dash-04/live-probe.md       (G10)
  .codex-temp/v2-dash-04/report.md           (final)

═══════════════════════════════════════════════════════
END OF DASH-4 FORGED PROMPT
═══════════════════════════════════════════════════════
```

---

## Authoring notes

- **Why DASH-4 is dedicated rather than absorbed into DASH-1 or DASH-3.** The audit (§A.8 + §C.4) describes the signal infrastructure as ready but the *ranker* as missing. Building the ranker + the Smart Home composition is its own concern with its own verification surface (live-data probe in G10). Bundling it into a shell-skeleton phase weakens the verification gate.
- **Why server-deterministic recommender, not @henryco/intelligence yet.** `flags.intelligence_recommendations` exists but the recommender is V3 territory. DASH-4 ships a deterministic stage + activity ranker that's testable; the flag gates richer logic when it lands.
- **Why 30 s React cache().** The signal feed reads 8+ tables × 7 divisions × user-scoping. Per-request recompute is fine for read latency at low concurrency; 30 s caching shaves 90% of repeat-load cost without losing freshness for typical sessions. Realtime invalidation tokens (DASH-6) cut the cache when actually new data lands.
