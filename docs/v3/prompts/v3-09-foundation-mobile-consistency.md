# V3-09 — Foundation: Mobile Consistency

> **STATUS: SHIPPED — PR #135.** This pass is closed and certified inside Foundation Lock (V3-12, #168). The `@henryco/ui/mobile` primitives below are live: `safe-area.ts`, `use-keyboard-avoidance.ts`, `use-android-back-close.ts`, `use-scroll-direction.ts`, `bottom-sheet.tsx`. Treat this document as the elevated canonical spec and the standing regression contract — V3-94 re-runs the mobile smoke. Anything still open is named as residual hardening at the end, not as unbuilt scope.

**Pass ID:** V3-09  ·  **Phase:** B (Foundation Lock)  ·  **Pillar:** P12 (Global, Mobile)
**Dependencies:** —  ·  **Effort:** M  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** —

---

## Role

You are the V3 Foundation engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass makes web-mobile feel native across every public and authenticated flow: safe-area insets that never let content sit under a notch or home indicator, viewport-aware keyboard avoidance, consistent sticky/auto-hide nav, escapable modals, deliberate full-screen surfaces, and 44px touch targets. The line you must not cross: this is web-mobile only — the Expo super-app and company-hub native parity is V3-87, and you introduce no new visual design or typography (V3 PASS 25 is preserved). You do not weaken any sensitive-flow confirmation to win a gesture.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/09-mobile-consistency` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary

The mobile baseline before this pass was strong on messaging and thin elsewhere. The `@henryco/ui` chat-composer already shipped a mobile full-screen mode, and the account support thread was rebuilt as a WhatsApp-style thin app bar (#114–#117) with safe-area and keyboard-avoidance verified on that surface only. Everything else — auth flows, marketplace checkout, KYC intake, address/profile forms, property galleries, studio brief intake — was unverified for notch insets, soft-keyboard behaviour, hardware-back modal escape, and touch-target sizing. There was no shared keyboard-avoidance primitive, no shared safe-area helper, and no Android hardware-back close hook; each surface solved it ad hoc or not at all. This pass closes that gap by extracting the proven chat-composer patterns into `@henryco/ui/mobile/*` and wiring every named flow to them, then capturing a per-app mobile performance baseline for V3-89 to defend. The 10 web apps are `hub`, `care`, `building` (hub-hosted), `hotel` (hub-hosted), `marketplace`, `property`, `logistics`, `studio`, `jobs`, `learn`, plus the `account` and `staff` shells.

## Mandatory scope

### S1 — Safe-area inset primitive + platform-wide adoption
Ship `packages/ui/src/mobile/safe-area.ts` exporting CSS-var helpers and a `<SafeAreaPadding edges>` wrapper that resolve `env(safe-area-inset-top/right/bottom/left)` with a `max()` floor so non-notched viewports keep their design padding. Require `viewport-fit=cover` in each app's `viewport` export. Audit every public + auth page and every sticky/fixed element (top nav, bottom action bars, FABs, toasts) on notched + non-notched, portrait + landscape. Acceptance: status bar never overlaps content; bottom nav clears the home indicator; iOS Safari address-bar collapse does not reflow the layout into the unsafe zone.

### S2 — Keyboard avoidance primitive
Ship `packages/ui/src/mobile/use-keyboard-avoidance.ts` wrapping the `visualViewport` API: it reports keyboard height, scrolls the focused input into view, and exposes an offset so sticky bottom action buttons rise above the keyboard or collapse out of the way. Wire it into chat-composer (already done — preserve), support thread, marketplace checkout, KYC intake form, profile edit, and the address form. Acceptance: on focus, the active input is never obscured; the primary CTA is always reachable; modal sheets resize rather than clip.

### S3 — Swipe-gesture consistency
The notifications-ui already ships swipe-to-archive / swipe-to-mark-read. Audit it is wired consistently across every notification surface (bell dropdown, full notifications page, in-thread), that swipe targets are ≥44px, and that swipe is suppressed under `useReducedMotion()`. Wire any missing surface. Do not invent new swipe gestures beyond the existing designed set.

### S4 — Sticky / auto-hide navigation
Ship `packages/ui/src/mobile/use-scroll-direction.ts` and standardise each app shell on exactly one behaviour: pinned-sticky or auto-hide-on-scroll-down / reappear-on-scroll-up. Neither may fight iOS Safari's auto-hiding URL bar (test the bounce/rubber-band edges). Apply backdrop blur via the locked `--site-*` chrome tokens, never ad-hoc rgba. Record the chosen behaviour per division so V3-11 and V3-87 inherit it.

### S5 — Modal escape
Ship `packages/ui/src/mobile/use-android-back-close.ts`: a `popstate`-based hook that closes the topmost modal on the Android hardware back button. Every `<Dialog>` / `<Modal>` / `<Sheet>` / `<BottomSheet>` must: close on backdrop tap, close on hardware back, trap focus via the existing `@henryco/ui/a11y/useFocusTrap`, and restore scroll position on close. Critical guard: for KYC, payment, and other sensitive/destructive flows, hardware-back surfaces a discard-confirmation rather than silently abandoning the in-progress action.

### S6 — Deliberate full-screen surfaces + `<BottomSheet>`
Ship `packages/ui/src/mobile/bottom-sheet.tsx` (drag-to-dismiss, safe-area aware, focus-trapped). Inventory full-screen-on-mobile candidates and wire them: support reply (already full-screen via chat-composer — preserve), KYC document upload (make full-screen), property photo gallery (already full-screen — preserve), studio brief intake (evaluate full-screen). Each full-screen transition adds a clear close affordance and preserves the underlying page state for return.

### S7 — Touch-target sizing
Every interactive element ≥ 44×44px at mobile breakpoints (Apple HIG; PNH-04 baseline). Visual padding satisfies this — the rendered glyph can be small while the hit area is 44px. Audit nav buttons, card actions, form controls (toggles, checkboxes, radios), and modal close buttons. Verify with `axe`.

### S8 — Regression-lock the recent mobile fixes
The thin-app-bar and hero-tile fixes (#114–#117) are load-bearing and historically fragile. Add a smoke check that they hold on the latest deploy: thin mobile thread header renders, no white-edge hero tiles, dark CTA visibility intact, the positive green Live pill present.

### S9 — Mobile performance baseline
Capture, per app, into `docs/v3/mobile-perf-baseline.md`: first-load JS (gzipped), LCP on Fast-3G, CLS, and whether `next/image` `sizes` are mobile-correct. This pass measures only; budget enforcement is V3-89. Flag any app over ~200KB first-load JS for V3-89 to address.

### S10 — Telemetry
Emit via `@henryco/observability` `emitEvent({ name, classification, outcome, payload })`:
- `henry.ui.mobile-keyboard.shown` (outcome `success`, payload `{ surface, kept_visible }`)
- `henry.ui.mobile-keyboard.obscured` (outcome `failure`, payload `{ surface }`)
- `henry.ui.modal.escaped` (payload `{ method: 'backdrop' | 'android-back', surface }`)

## Out of scope
- Expo super-app + company-hub native parity → V3-87.
- New mobile UI primitives beyond what these flows need; V3 PASS 25 typography is preserved.
- Push-notification UX and app-store optimisation → V3-88.
- Performance-budget enforcement on PR → V3-89.

## Dependencies
None upstream. Blocks: V3-11 (one-job-per-card relies on the mobile card touch behaviour standardised here) and V3-87 (the `@henryco/ui/mobile` contracts here are the web-side reference the Expo parity wave mirrors).

## Inheritance
- `@henryco/ui/a11y` — `useReducedMotion`, `useFocusTrap`, `SkipLink`.
- `@henryco/ui` chat-composer mobile full-screen pattern — the proven source for S2/S6.
- The #114–#117 thin-app-bar fixes — preserve, do not regress.
- `@henryco/observability` `emitEvent` taxonomy.

## Implementation requirements

### Files
- `packages/ui/src/mobile/safe-area.ts` (new)
- `packages/ui/src/mobile/use-keyboard-avoidance.ts` (new)
- `packages/ui/src/mobile/use-scroll-direction.ts` (new)
- `packages/ui/src/mobile/use-android-back-close.ts` (new)
- `packages/ui/src/mobile/bottom-sheet.tsx` (new)
- `packages/ui/src/mobile/index.ts` (barrel)
- Per-app fixes for safe-area, sticky nav, swipe, modal escape, touch targets.
- `docs/v3/mobile-perf-baseline.md` (new — perf snapshot per app).
- No migrations.

### Trust / safety / compliance
Hardware-back never abandons KYC or payment progress without a discard-confirmation. Touch targets meet WCAG (PNH-04). No new client logging of session data. The mobile feel is itself a brand defence — premium tactility is hard to clone.

### Mobile + desktop parity
This pass IS the web-mobile pass. Desktop must be unaffected: each fix is gated to mobile breakpoints / coarse-pointer media queries. Regression-test desktop after each shared-component change.

### i18n
Any new copy (discard-confirmation, close affordance labels) flows through `@henryco/i18n`, namespace `surface:mobile`. No hardcoded strings.

### Brand & design system
Backdrop blur, chrome surfaces, and any new affordance use the locked `--site-*` / `--accent` tokens — no ad-hoc hex. Light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed (`pnpm a11y:contrast`). Brand strings resolve from `@henryco/config`; zero hardcoded domains.

## Validation gates
1. Standard CI: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
2. Manual device smoke on a physical iPhone (Safari + Chrome iOS) and Android (Chrome + Samsung Browser) for each named flow: auth, support thread, marketplace checkout, KYC intake, address/profile form.
3. `pnpm a11y` confirms touch targets ≥44px on the audited surfaces.
4. `pnpm a11y:contrast` not regressed; CLS ≈ 0 on mobile.
5. `docs/v3/mobile-perf-baseline.md` populated for all apps.
6. The three telemetry events observed emitting in a real session.

## Deployment gate
All gates green. Owner sees before/after on a physical phone. 48-hour soak on web-mobile traffic with no new mobile-layout regressions.

## Final report contract
`.codex-temp/v3-09-mobile-consistency/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion), plus the mobile-perf baseline table and device-specific smoke screenshots.

## Self-verification
- [ ] S1: `safe-area.ts` shipped; `viewport-fit=cover` set; insets verified on notched + non-notched, portrait + landscape.
- [ ] S2: `use-keyboard-avoidance.ts` shipped and wired into all six named forms.
- [ ] S3: swipe gestures consistent across notification surfaces and reduced-motion-aware.
- [ ] S4: each app shell standardised on one nav behaviour via `use-scroll-direction.ts`.
- [ ] S5: `use-android-back-close.ts` shipped; every modal closes on backdrop + hardware-back; sensitive flows confirm before discard.
- [ ] S6: `bottom-sheet.tsx` shipped; full-screen surfaces inventoried + wired with preserved return state.
- [ ] S7: all audited interactive elements ≥44×44px, axe-verified.
- [ ] S8: #114–#117 thin-bar / hero-tile fixes regression-checked on latest deploy.
- [ ] S9: `docs/v3/mobile-perf-baseline.md` captured per app.
- [ ] S10: the three `henry.ui.*` telemetry events emit in production.
- [ ] Brand/domain/i18n/token hard rules satisfied; desktop unaffected; report written.
