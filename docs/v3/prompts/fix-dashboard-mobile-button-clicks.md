# FIX-MOBILE-CLICKS — Foundation UX: Dashboard mobile button clickability

> **STATUS: SHIPPED — PR #143.** The root-cause fix (`touch-action: manipulation` on the shared `.hc-modal-body` sheet body + the `.hc-bottom-action-bar` tap targets) landed on `main`. V3-CHROME-FIX-01 (PR #186) later hardened the sibling history-sentinel race on the public chromes via `suppressSentinelPop`. This file is the elevated canonical record of that fix plus a small residual-hardening scope; treat the "Mandatory scope" below as the verification/extension contract, not unbuilt work.

**Pass ID:** FIX-MOBILE-CLICKS  ·  **Phase:** B (Foundation Lock — regression follow-up to V3-09)  ·  **Pillar:** P12 (Global UX)
**Dependencies:** V3-09 (mobile consistency, merged) · V3-CHROME-FIX-01 #186 (mobile-nav navigation race, merged)  ·  **Effort:** S  ·  **Parallel-safe:** Y
**Owner gate:** none (visual + tap-test sign-off on a real device before merge)  ·  **Risk class:** —

---

## Role
You are the V3 Foundation-UX regression engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass makes every button and link inside every dashboard mobile sheet/drawer register the first tap on real mobile devices — Settings and Help inside the `BottomActionBar` "More" sheet are the named regression, but the fix is the single class-level root cause, never per-button workarounds. The line you must not cross: no magic z-index bumps, no inline `style` tap hacks, no per-element `pointer-events: auto` overrides — one semantic CSS fix that holds across every sheet consumer.

Owner directive, verbatim (the bar):
> "The dashboard settings button and help button are not responding to clicks on mobile devices. please fix that too. make sure all buttons are clicking. do it with your max effort not just shallow work as we keep lamenting on. don't hardcode anything"

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/fix-mobile-clicks` (per pass) |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
The dashboard mobile shell lives in `@henryco/dashboard-shell`. The "More" tab of `packages/dashboard-shell/src/shell/bottom-action-bar.tsx` opens `packages/dashboard-shell/src/components/bottom-sheet.tsx`, and renders Settings + Help as `MoreLink` items (Next.js `<Link>` with an inline `onClick` that closes the sheet after navigation starts). That `BottomSheet` imports `emitModalBackdropTap` + `useAndroidBackClose` from `@henryco/ui/mobile`; its sheet body carries `className="hc-modal-body"` and `onClick={(e) => e.stopPropagation()}` (line 160), with two `position: fixed`, `pointerEvents: "none"` focus sentinels (lines 147–153, 257–263).

V3-09 wired `useAndroidBackClose` and the backdrop telemetry tap into this sheet. After it shipped, the named regression appeared: on iOS Safari the first tap on Settings/Help was swallowed and navigation never started. The trace (recorded in `docs/v3/dashboard-mobile-click-audit.md`) found the root cause: the sheet body's default `touch-action: auto` keeps double-tap-zoom enabled, which gates the synthetic `click` behind a ~300 ms detection window; when iOS address-bar-collapse scroll deltas interleave that window, the `click` is suppressed and the Next.js `<Link>` `router.push` never fires. The gap this pass closes: the missing `touch-action: manipulation` on the shared sheet-body class — one rule that cascades through every descendant tap target via the hit-test model.

This is distinct from the sibling bug V3-CHROME-FIX-01 (#186) fixed on the *public* chromes: there the `useAndroidBackClose` history sentinel raced `router.push` (history.back vs push), suppressed via `suppressSentinelPop`. Both are mobile-tap regressions; keep them mentally separate — this pass is the dashboard-shell `touch-action` fix.

## Mandatory scope

### S1 — Trace the event chain (investigation, code-level evidence)
Walk the chain from a user tap on the Settings `MoreLink` to either successful navigation to `/settings` or the swallowed-click failure, in both `packages/dashboard-shell/src/shell/bottom-action-bar.tsx` and `packages/dashboard-shell/src/components/bottom-sheet.tsx`:
- `<Link onClick={onPick}>` → `onPick()` runs → React onClick completes → Next.js Link internal handler calls `router.push` → `history.pushState` → `BottomSheet` re-renders `open=false` → effect cleanup runs.
- Whether the sheet body's `e.stopPropagation()` (line 160) interferes with the Link's own onClick or Next's internal click handler under React 19 event delegation.
- Whether `useAndroidBackClose` cleanup (history-sentinel pop on close) races the navigation `pushState`.
- The CSS `pointer-events` / `touch-action` chain on the link and the `.hc-modal-body` body.
Use `git log -p -- packages/dashboard-shell/src/components/bottom-sheet.tsx` to see exactly what V3-09 changed. Record the trace verbatim in the audit doc; do not assert a cause you cannot show in code.

### S2 — Comprehensive sheet/drawer tap-target audit
Beyond Settings + Help, sweep every `<button>` / `<a>` / `<Link>` rendered inside any sheet or drawer consumer:
- `packages/dashboard-shell/src/shell/bottom-action-bar.tsx` (owner + staff bottom nav, the "More" sheet).
- The `BottomSheet` consumers across the shell and the public chromes that migrated to it (`@henryco/ui` `PublicHeader` drawers — `c838f394`, `1f0b17d7`).
- The owner workspace mobile chrome and staff HQ mobile chrome.
- The command-palette host (uses the shell `BottomSheet`).
Output `docs/v3/dashboard-mobile-click-audit.md`: per-surface table of surface · trigger pattern · suspected risk · code-reference evidence · fix.

### S3 — Root-cause fix (ONE class-level change)
Apply `touch-action: manipulation` to the shared `.hc-modal-body` class (the sheet body) and to the `.hc-bottom-action-bar a, .hc-bottom-action-bar button` tap targets, in the dashboard-shell global stylesheet that defines those classes — NOT inline. `manipulation` keeps panning + pinch-zoom alive and only suppresses the double-tap-zoom delay; because `touch-action` cascades through descendants via the hit-test model, this single rule fixes every link/button inside every `BottomSheet` and `Drawer` consumer at once. Do NOT remove the body's `e.stopPropagation()` unless the trace proves it swallows nested clicks (it does not — verify and record). Do NOT touch z-index or the focus sentinels' `pointer-events: none`.

### S4 — Confirm the sibling history-sentinel race is not also present here
Verify the dashboard-shell `BottomSheet` does not exhibit the V3-CHROME-FIX-01 history race (push vs back). If `useAndroidBackClose` cleanup pops a sentinel after `router.push`, confirm the `MoreLink` close path (`setOpenSheet(null)` on next tick) does not interleave with it. If it does, defer the close with `queueMicrotask` so `pushState` settles first — record the decision; otherwise state explicitly that the race does not occur in this consumer.

## Out of scope
- Public-chrome mobile-nav navigation race → V3-CHROME-FIX-01 (#186, shipped) owns it; do not duplicate `suppressSentinelPop` here.
- `apps/account/**` customer dashboard interaction redesign → not this pass.
- `packages/search-ui/**` → owner-reserved, never touch.
- New mobile gestures / safe-area work → V3-09 owns it.

## Dependencies
Depends on V3-09 (the sheet the regression lives in) and is informed by V3-CHROME-FIX-01. Blocks nothing downstream; it is a foundation-stability follow-up that keeps every dashboard tap target reliable before later phases add more sheet surfaces.

## Inheritance
Builds on `@henryco/dashboard-shell` (`BottomSheet`, `BottomActionBar`, the `.hc-modal-body` / `.hc-bottom-action-bar` design-token classes), `@henryco/ui/mobile` (`useAndroidBackClose`, `emitModalBackdropTap`), and the V3-09 telemetry surface contract.

## Implementation requirements
### Files
- `packages/dashboard-shell/src/components/bottom-sheet.tsx` (verify; no behavioural edit expected).
- `packages/dashboard-shell/src/shell/bottom-action-bar.tsx` (verify the `MoreLink` close path).
- The dashboard-shell global stylesheet defining `.hc-modal-body` + `.hc-bottom-action-bar` (the `touch-action: manipulation` rule lands here).
- `docs/v3/dashboard-mobile-click-audit.md` (new — the trace + per-surface table).

### Trust / safety / compliance
None — this is a presentation-layer interaction fix. No auth, RLS, money, or identity surface is touched. Do not alter any payment surface.

### Mobile + desktop parity
This pass is mobile-first by definition. Confirm the rule is inert on desktop (no pointer regression) and that touch panning + pinch-zoom still work on the sheet body. Web mobile is the target; Expo super-app uses its own native sheet — N/A there.

### i18n
No new user-facing strings. If any string is added (e.g. an aria-label), it routes through `@henryco/i18n` in the existing dashboard-shell namespace (`surface:shell`) or is exempted in `exempt.json` with a reason; `pnpm i18n:check:strict` must stay green.

### Brand & design system
No brand strings rendered. Tokens only — `touch-action: manipulation` is a behaviour utility, not a colour/type token, applied to the existing design-system classes; no ad-hoc hex, no new token system. Any URL referenced in docs uses `henryDomain()` / `henryWebRoot()` from `@henryco/config`; never the literal base domain.

## Validation gates
1. `pnpm -F @henryco/dashboard-shell typecheck` + `pnpm -F @henryco/hub typecheck` + `pnpm -F @henryco/staff typecheck` PASS.
2. `pnpm lint` PASS for the touched packages.
3. `pnpm i18n:check:strict` PASS — no new GAPs.
4. Real-device smoke (iPhone Safari + Android Chrome): Settings + Help in the "More" sheet navigate on first tap; every audited sheet/drawer tap target navigates on first tap; pinch-zoom + panning unaffected. Record the procedure in the PR body for owner re-test.
5. Desktop regression: pointer clicks unaffected; CLS ≈ 0 (no layout shift introduced).

## Deployment gate
All gates green; owner tap-tests Settings + Help on a real device and signs off; squash-merge to `main`; Vercel autodeploys. No auto-merge before the device sign-off.

## Final report contract
`.codex-temp/fix-mobile-clicks/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env [N/A] · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion).

## Self-verification
- [ ] S1: event chain traced with code-level evidence in `docs/v3/dashboard-mobile-click-audit.md`.
- [ ] S2: every sheet/drawer tap-target surface enumerated with evidence + fix in the audit table.
- [ ] S3: ONE class-level `touch-action: manipulation` rule on `.hc-modal-body` + `.hc-bottom-action-bar` tap targets — no per-button workaround, no inline hack, no z-index bump.
- [ ] S4: history-sentinel race confirmed absent (or deferred-close documented) for this consumer.
- [ ] Settings + Help navigate on first tap on iOS Safari + Android Chrome; panning + pinch-zoom intact.
- [ ] Typecheck + lint + `i18n:check:strict` all PASS; CLS ≈ 0; no brand/domain hardcoding.
- [ ] PR opened with audit, before/after evidence, and the real-device smoke procedure for owner sign-off.
