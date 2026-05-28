# V3-09 — Foundation: Mobile Consistency

**Pass ID:** V3-09
**Phase:** B (FOUNDATION LOCK)
**Pillar:** P12 (Global, Mobile)
**Dependencies:** Phase A audit
**Effort:** M (1–2 weeks)
**Parallel-safe:** YES
**Owner gate:** None
**Risk class:** None

---

## Role

You are the V3 Foundation engineer for HenryCo. You execute exactly this one pass, then stop and report.

This pass closes the **mobile consistency** sub-bar of FOUNDATION LOCK. Web mobile must feel native: safe-area insets, viewport keyboard avoidance, swipe gestures, sticky nav, modal escape, full-screen surfaces. Web mobile is the focus; Expo super-app + company-hub parity work is V3-87.

---

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/09-mobile-consistency` |
| Deploy | Vercel (10 web projects) |
| OS context | Windows + bash; pnpm 9.15.5; Node 24.x |

---

## Audit summary (lifted from AUDIT-BASELINE.md §3.10)

> ### 3.10 Mobile consistency
> - **Solid:** chat-composer mobile full-screen mode
> - **Solid:** `fix(account/support): rebuild mobile thread header as WhatsApp-style thin app bar` (recent commits #114, #115, #116, #117) — mobile messaging hardened
> - **Partial:** safe-area insets + viewport keyboard-avoidance verified on support surfaces; unverified on other workflows
> - **Gap:** Expo super-app + company-hub parity with web mobile is a Phase H concern, not foundation-lock

Owner: "consistent mobile behavior".

---

## Mandatory scope

### S1 — Safe-area inset audit

Every public + auth page tested on:
- iPhone 15 Pro (Safari, Chrome iOS)
- Pixel 8 (Chrome Android, Samsung Browser)
- Notched + non-notched viewports
- Landscape + portrait

Verify:
- `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`, `env(safe-area-inset-left/right)` applied to all sticky elements.
- Status bar doesn't overlap content.
- Bottom navigation (where applicable) respects the home indicator area.
- iOS Safari "address bar collapse" behavior doesn't break layout.

### S2 — Keyboard avoidance

Every form on every public + auth surface:
- When the soft keyboard appears, the focused input scrolls into view.
- Sticky bottom action buttons either rise above the keyboard OR collapse out of the way.
- Modal sheets resize gracefully.

Implementation:
- New helper `@henryco/ui/mobile/use-keyboard-avoidance.ts` — wraps `visualViewport` API.
- Wire into chat-composer (already done), support thread, marketplace checkout, KYC form, profile edit, address form.

### S3 — Swipe gestures inventory

The notifications-ui (V2-NOT-02-A) already has swipe gestures (archive, mark-read). Audit:
- Is swipe wired consistently across all notification surfaces?
- Are swipe targets the right size (44px minimum)?
- Does swipe respect reduced-motion preference?

Wire any missing surfaces. Don't introduce new swipe gestures beyond what's already designed.

### S4 — Sticky navigation behavior

Every app's nav:
- Stays visible during scroll (sticky) OR collapses on scroll-down + reappears on scroll-up (auto-hide).
- Doesn't fight iOS Safari's auto-hiding URL bar.
- Backdrop blur where appropriate.

Audit each of the 10 web app shells. Standardize on one of two behaviors per division (sticky vs auto-hide).

### S5 — Modal escape

Every modal:
- Closes on backdrop tap.
- Closes on hardware back button (Android) via popstate listener.
- Focus traps appropriately (existing `@henryco/ui/a11y/useFocusTrap`).
- Returns scroll position on close.

Audit every `<Dialog>`, `<Modal>`, `<Sheet>` usage.

### S6 — Full-screen surfaces

Some surfaces benefit from full-screen on mobile (chat composer already does this). Inventory candidates:
- Support thread reply on mobile → already full-screen via chat-composer.
- KYC document upload → should be full-screen.
- Property listing photo gallery → already full-screen.
- Studio brief intake → consider full-screen on mobile.

Each transition into full-screen mode:
- Hides browser chrome where possible.
- Adds a clear "close" affordance.
- Preserves the underlying page state for return.

### S7 — Touch target sizes

Every interactive element ≥ 44px × 44px (Apple HIG) on mobile breakpoints. Audit:
- Buttons in nav.
- Card actions.
- Form controls (toggles, checkboxes).
- Close buttons in modals.

Visual padding can be the answer (button content is small but touch area is 44px).

### S8 — Mobile-specific bugs from recent fixes

Recent commits closed several mobile issues:
- `fix(account/support): bulletproof mobile thin-bar with last-in-source !important guard` (#117)
- `fix(account/support): rebuild mobile thread header as WhatsApp-style thin app bar` (#116)
- `fix(account, messaging-thread): kill white-edge hero tiles + dark CTA visibility + add positive green Live pill` (#115)
- `fix(account): kill white-card hero bug across dashboard + collapse mobile support thread header` (#114)

Verify these fixes hold on the latest deploy. Run regression tests.

### S9 — Performance on mobile

Verify mobile-specific perf:
- Initial JS bundle < 200KB gzipped per app (V3-89 enforces budgets; this pass just measures).
- LCP on mobile < 2.5s on 3G fast.
- CLS < 0.1.
- Images sized appropriately for mobile viewports (`next/image` sizes prop).

If any app exceeds budget, log in `docs/v3/mobile-perf-baseline.md` for V3-89 to address.

### S10 — Telemetry

Events:
- `henry.ui.mobile_keyboard.kept_visible` (form, success)
- `henry.ui.mobile_keyboard.obscured` (form — failure to keep visible)
- `henry.ui.modal_escape.backdrop_tap`
- `henry.ui.modal_escape.android_back`

---

## Out of scope

- Expo super-app + company-hub parity (V3-87).
- New mobile UI primitives beyond what's needed (V3 PASS 25 typography preserved).
- Push notification UX (V3-88).
- App store optimization (V3-88).

---

## Dependencies

- Phase A audit complete.

Blocks:
- V3-11 (one-job-per-card) — mobile cards tested.
- V3-87 (mobile super-app parity) — contracts here inform Expo parity.

---

## Inheritance

- `@henryco/ui/a11y` — `useReducedMotion`, `useFocusTrap`, `SkipLink`.
- `@henryco/ui/loading` — existing skeletons.
- Existing chat-composer mobile full-screen pattern.
- Recent commits' mobile thread header fix — preserve.

---

## Implementation requirements

### Files

- `packages/ui/src/mobile/use-keyboard-avoidance.ts` (new)
- `packages/ui/src/mobile/safe-area.ts` (helpers, if not present)
- Per-app fixes for safe-area + sticky nav + swipe + modal escape audit findings
- `docs/v3/mobile-perf-baseline.md` (new — perf snapshot per app)

### No migrations.

### Telemetry events wired in `@henryco/observability`.

---

## Trust / safety / compliance

- Modal escape via hardware back button never accidentally exits sensitive flows (KYC, payment) without confirmation.
- Touch targets meet WCAG AAA where feasible (PNH-04 baseline).
- ANTI-CLONE: mobile UX is a brand defense in itself — premium feel is hard to copy.

## Mobile + desktop parity

- This pass IS the mobile pass. Desktop unaffected unless mobile fix introduces a regression.

## i18n

- New strings (if any) via `@henryco/i18n`.

---

## Validation gates

1. Standard CI.
2. **Manual smoke** on iPhone + Android device for each named flow.
3. Mobile performance baseline captured.
4. A11y gate: touch targets verified by axe.

## Deployment gate

- All gates pass.
- Owner sees the before/after on a physical phone.
- 48-hour soak.

## Final report contract

`.codex-temp/v3-09-mobile-consistency/report.md` with the standard 9 sections + mobile perf baseline + device-specific smoke evidence (screenshots).

---

## Self-verification

- [ ] Safe-area insets applied platform-wide.
- [ ] Keyboard-avoidance wired on key forms.
- [ ] Swipe gestures consistent.
- [ ] Sticky nav standardized.
- [ ] Modal escape verified.
- [ ] Full-screen surfaces inventoried + wired.
- [ ] Touch targets ≥ 44px.
- [ ] Mobile perf baseline captured.
- [ ] 4 new telemetry events emitting.
- [ ] Report written.
