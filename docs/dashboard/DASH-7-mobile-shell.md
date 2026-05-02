# DASH-7 — Mobile Shell (Forged Prompt)

```
TOOL: Claude Code (Opus 4.7)
EFFORT: xhigh
PROJECT: HenryCo Ecosystem · henrycogroup.com · V2 active
PASS: V2-DASH-07 — Mobile shell (bottom action bar, drawers, sheets,
                  parity)
EXPECTED DURATION: Medium. Sequential after DASH-3, DASH-4, DASH-5,
                   DASH-6. This is the formal mobile-parity gate.

═══════════════════════════════════════════════════════
ROLE
═══════════════════════════════════════════════════════

Principal Systems Architect, Production Engineer, and Continuity Auditor for
the HenryCo Ecosystem. Opus 4.7. Self-verify against V1–V13.

═══════════════════════════════════════════════════════
CONTEXT — read in this order BEFORE writing code
═══════════════════════════════════════════════════════

1. docs/dashboard/DASHBOARD-AUDIT-REPORT.md (§B.account-7, §B.care-7,
   §B.marketplace-7, §B.property-7, §B.studio-7, §B.hub-7,
   §B.company-hub-7, §C.10 #9 — every per-app mobile concern)
2. docs/dashboard/DASHBOARD-REBUILD-PROMPT-V2-FINAL.md (master)
3. docs/dashboard/DASH-1..DASH-6 forged prompts
4. .codex-temp/v2-dash-01..06/report.md (each phase's V5 mobile-parity
   results — DASH-7 verifies the aggregate)
5. apps/account/components/layout/MobileNav.tsx (existing mobile nav —
   migrates into shell BottomActionBar)
6. apps/company-hub/src/components/DivisionDetailModal.tsx (audit
   §B.company-hub-7 — modal overflow / disappearing close — same UX
   pattern that informs the shell's BottomSheet primitive)

═══════════════════════════════════════════════════════
TRUTH HIERARCHY
═══════════════════════════════════════════════════════

CODE / DEPLOYMENT / LIVE truth — see master §3.

═══════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════

Mobile is canonical. The shell is mobile-first. DASH-7 verifies the
aggregate parity claim and lands the few remaining mobile-only
surfaces.

Deliverables:

1. BottomActionBar (4 anchors)
   - Home (Smart Home — DASH-4 surface)
   - Modules (rail, presented as a drawer on mobile)
   - Inbox (ContextDrawer notifications inbox — DASH-6)
   - More (settings, theme, sign-out, help, status)
   - Active anchor visually elevated; tap targets ≥ 44 px.
   - Renders only at < 768 px; hidden on tablet/desktop where the rail
     + drawer suffice.
   - Component: <BottomActionBar> in @henryco/dashboard-shell, replaces
     apps/account/components/layout/MobileNav.tsx.

2. Drawer + BottomSheet primitives (audit §C.10 #9; anti-pattern #21)
   - <Drawer> for left/right edge slide-ins (modules rail on mobile,
     ContextDrawer on mobile).
   - <BottomSheet> for selectors, command palette mobile, modal forms.
   - Both ship in @henryco/dashboard-shell from DASH-1; DASH-7 verifies
     every per-module modal/sheet has migrated to these primitives.
   - Sticky-close button on EVERY modal/sheet, in thumb zone (top-right
     of sheet body, but still reachable thumb on common iOS/Android
     viewports).
   - overscroll-y-contain on every sheet body so swipe doesn't scroll
     the page underneath.

3. Long-scroll selector audit + migration
   - Audit §B.care-7 cloth picker, §B.studio-7 request selector — DASH-3
     migrated these to TypeaheadGrid. DASH-7 verifies no long-scroll
     <select> or scrolling list >5 entries remains in any module's
     mobile path. Grep apps/* for native <select> with > 6 options;
     migrate any survivors to TypeaheadGrid in this phase.

4. Modal mobile overflow fix (audit §B.hub-7, §B.company-hub-7)
   - The <Panel> primitive ships with overscroll-y-contain + max-height
     + sticky internal close on mobile. DASH-7 ports the audit-flagged
     surfaces (apps/hub/owner/divisions/[slug] for Track B reference;
     apps/company-hub/src/components/DivisionDetailModal — but that's a
     mobile app concern, separately tracked in V2-MOBILE-01 if needed).
     For Track A web shell: confirm every module's home + detail
     surfaces use Panel with the mobile guards.

5. Mobile parity at all 6 breakpoints (320, 375, 390, 430, 768, 1024)
   - Visual regression run for every shell page across every module.
   - Lighthouse mobile run on a representative subset (Smart Home,
     marketplace home, care home, settings, support, inbox).
   - Touch-target audit: every clickable element ≥ 44×44 px tap area.

6. Deep-linkable URLs for super-app (audit §B.super-app-12)
   - Every shell route stable + deep-linkable so apps/super-app
     linking.ts can open via expo deep-link.
   - Verified by inspecting the linking config in
     apps/super-app/src/core/linking.ts and confirming each module
     deep-link target resolves.

═══════════════════════════════════════════════════════
GATE STRUCTURE
═══════════════════════════════════════════════════════

G0 — Recon at .codex-temp/v2-dash-07/recon.md. Audit collected from
     each prior phase's V5 results.
G1 — BottomActionBar landed.
G2 — Drawer + BottomSheet primitive migrations verified (grep apps/*
     for raw <dialog> or non-primitive modal patterns; 0 hits).
G3 — Long-scroll selector audit + migration. 0 native <select> with
     >6 options on mobile paths.
G4 — Modal mobile overflow fix verified (sticky-close, overscroll-y-
     contain) on every flagged surface.
G5 — Visual regression suite at 320, 375, 390, 430, 768, 1024 across
     every module home + 1 detail per module.
G6 — Lighthouse mobile run on representative subset.
G7 — Touch-target audit (axe-core has-large-touch-targets check or
     manual measure).
G8 — Super-app deep-link verification.
G9 — V1–V13 verification with V5 / V6 / V7 as headline gates.
G10 — Persisted report at .codex-temp/v2-dash-07/report.md.

═══════════════════════════════════════════════════════
ANTI-PATTERNS — applied to DASH-7
═══════════════════════════════════════════════════════

From master §4.1:
  #1 Long-scroll picker — TypeaheadGrid everywhere on mobile.

From master §4.2:
  #21 Mobile = different layout — the ENTIRE point of DASH-7. Verify
      no shell surface relies on CSS-media-query-only responsiveness;
      every module must use BottomSheet / Drawer / BottomActionBar
      primitives where mobile differs from desktop.
  #19 Role-agnostic UI — staff vs customer mobile views differ in
      density (still both mobile-first).
  #15 No blue primary on mobile bar — HenryCo accents.
  #18 Metrics still need comparison/trend on mobile MetricCard.

DO NOT:
- Force apps/super-app or apps/company-hub mobile apps into the web
  shell — they remain separate Expo apps. DASH-7 only verifies they
  can deep-link into the new web shell.
- Migrate apps/care/(public)/book or other public flows whose mobile
  parity is owned by the public app (audit §B.care-7 fixes the
  customer authenticated picker via the care MODULE — that ships in
  DASH-3, DASH-7 just verifies parity).
- Add new modules in DASH-7.
- Touch Track B / DASH-8.

═══════════════════════════════════════════════════════
VERIFICATION REQUIREMENT — DASH-7 gate
═══════════════════════════════════════════════════════

V1 build/typecheck/lint  — PASS required.
V2 auth-continuity        — PASS required.
V3 RLS verification        — N/A — no new data paths.
V4 Realtime smoke           — PASS required — DASH-6 already wired;
                           DASH-7 confirms realtime works on mobile
                           (touch focus + visualViewport interaction
                           with toast viewport).
V5 Mobile parity           — PASS REQUIRED — this is THE mobile-parity
                           gate. Visual regression at 320/375/390/430/
                           768/1024 across every module home + 1 detail
                           per module. Zero CLS > 0.1. Zero clipped CTAs.
                           Zero unreachable thumb-zone actions.
V6 Lighthouse + CWV         — PASS required on mobile profile (3G
                           throttle): Perf ≥ 90, A11y ≥ 95, BP ≥ 95,
                           SEO ≥ 95; LCP < 2.5 s, CLS < 0.1, INP < 200 ms.
V7 WCAG AA                  — PASS required on every primitive on
                           mobile. Touch-target audit included.
V8 Sender identity          — N/A.
V9 CTA reality              — PASS required: every BottomActionBar
                           anchor traced; every drawer/sheet open/close
                           handler traced; every back button traced.
V10 Empty / loading / error / success — PASS required on mobile
                           variants of every state primitive.
V11 No console errors       — PASS required on mobile devtools simulation.
V12 No 4xx/5xx              — PASS required.
V13 Role × division coverage — PASS required across all personas on
                           mobile.

═══════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════

Persist at .codex-temp/v2-dash-07/report.md:
  Files modified
  Mobile parity matrix (every module × 6 breakpoints with PASS/FAIL)
  Lighthouse mobile-profile results
  Touch-target audit results
  What was done
  How to verify
  Uncertainties
  Anti-pattern audit
  Verification gate (V1–V13)
  Super-app deep-link parity
  Classification: DASH-7-COMPLETE | DASH-7-PARTIAL | DASH-7-BLOCKED
  Hand-off

PR title: feat(dashboard): DASH-7 mobile shell + parity gate.

═══════════════════════════════════════════════════════
V2 SCOPE BOUNDARY
═══════════════════════════════════════════════════════

NOT permitted in DASH-7:
  - apps/super-app, apps/company-hub UI changes (separate mobile apps).
  - Owner Track B (DASH-8).
  - New divisions / modules.
  - New realtime channels.
  - State-changing API migration.

═══════════════════════════════════════════════════════
PERSISTED-REPORT REQUIREMENT
═══════════════════════════════════════════════════════

  .codex-temp/v2-dash-07/recon.md
  .codex-temp/v2-dash-07/parity-matrix.md
  .codex-temp/v2-dash-07/lighthouse-mobile.md
  .codex-temp/v2-dash-07/touch-targets.md
  .codex-temp/v2-dash-07/report.md         (final)

═══════════════════════════════════════════════════════
END OF DASH-7 FORGED PROMPT
═══════════════════════════════════════════════════════
```

---

## Authoring notes

- **Why DASH-7 is the formal parity gate, not earlier.** Verifying parity before content lands means re-verifying after every module merges. DASH-7 is the single, expensive, comprehensive parity gate after every module is in place.
- **Why super-app is in scope but apps/super-app isn't.** Mobile parity for the web shell must support deep-linking from the Expo app's `linking.ts`. The Expo app's UI is a separate concern.
- **Why the mobile bottom action bar has exactly 4 anchors.** Linear / Things / Notion converged on 4–5 because of thumb reach + cognitive load. 4 is calmer and more premium.
