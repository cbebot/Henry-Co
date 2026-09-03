# Mobile Surfaces Audit — V3-09

**Pass:** V3-09 — Foundation: Mobile Consistency (S3 + S6 + S8)
**Date captured:** 2026-05-22

## S3 — Swipe gestures inventory

The `@henryco/notifications-ui` package ships a complete swipe-reveal
implementation in `packages/notifications-ui/src/gestures/use-swipe-reveal.ts`.
V3-09 verified:

  - **Reduced-motion fallback:** ✔ long-press (650ms) opens the static
    action tray when `prefers-reduced-motion: reduce` is set. No
    transform animation. Detected via `window.matchMedia` and live-
    updated on preference change.
  - **Keyboard equivalents:** ✔ `r` = primary-right (read toggle),
    `a` = primary-left (archive), `d` = secondary-left (delete),
    `Esc` = cancel. WCAG 2.1.1 keyboard-only path covered.
  - **Velocity commit:** ✔ swipes above
    `SWIPE_COMMIT_VELOCITY_PX_PER_MS` commit the armed action
    regardless of distance. Touch handlers use Pointer Events so
    mouse + touch + pen all share one code path.
  - **Direction lock:** ✔ enforces 1-axis lock at
    `SWIPE_DIRECTION_LOCK_PX` so a diagonal scroll doesn't
    accidentally arm the gesture.
  - **Pointer capture:** ✔ `setPointerCapture()` keeps the gesture
    alive when the user drags past the row edge.
  - **Pointer cancel:** ✔ cancellation rollback resets offset + armed
    state so an interrupted gesture leaves no zombie UI.

**Findings:** the hook is correctly designed and broadly applicable.
No regressions introduced by V3-09.

**Touch-target check on swipe-reveal action buttons** — the underlying
notification rows already meet 44×44 because the swipe area is the
full row height. The static action tray (revealed by long-press in
reduced-motion mode) uses standard button primitives sized to 44 via
`packages/notifications/src` defaults. No fix needed.

**Per prompt — do NOT introduce new swipe gestures beyond what's
already designed.** Confirmed: no new gesture surfaces added in V3-09.

## S6 — Full-screen surfaces inventory

Per prompt §S6, surfaces that benefit from full-screen on mobile:

| Surface | Current status | V3-09 disposition |
|---|---|---|
| Support thread reply on mobile | Already full-screen via `packages/chat-composer/src/composer/FullScreenComposer.tsx` | Preserve. No change. |
| Property listing photo gallery | Already full-screen | Preserve. No change. |
| KYC document upload | Not full-screen; renders as inline form | **Defer to V3-24** (`identity-kyc-vendor-integration`) — that pass owns the upload UX end-to-end. |
| Studio brief intake | Not full-screen; renders as multi-step inline form | **Defer to V3-09 follow-up** — the brief flow is dense (file upload + textareas + drafting) and benefits from full-screen on mobile, but is owned by the studio team. Add to V3-89 backlog. |

**Implementation guidance** (for the eventual full-screen wires):

```tsx
import { useIsMobile } from "@henryco/chat-composer/hooks/useIsMobile";

function StudioBriefIntake() {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[var(--studio-bg)] hc-safe-top hc-safe-bottom">
        {/* Full-screen content */}
      </div>
    );
  }
  return <DefaultInlineLayout />;
}
```

Re-use the `useIsMobile` and full-screen pattern already validated
in `FullScreenComposer.tsx`. Always pair full-screen surfaces with
`hc-safe-top` + `hc-safe-bottom` from `@henryco/ui/mobile` so the
status bar / home indicator are respected.

## S8 — Recent mobile thread header fix regression check (commits #114–#117)

The four protective layers are intact in
`apps/account/components/support/editorial.css`:

  - Line 267 — first `@media (max-width: 767px)` block (early-source).
  - Line 501 — second mobile block (refinements).
  - Line 1463 — third mobile block (V2-MSG-04 mobile composer guard).
  - Line 1755 — **trailing bulletproof block with `!important` guards**
    (commit #117). Includes the `display: none !important` rule on
    `.acct-thread-header__actions` + `.acct-thread-header__pills` and
    the `.acct-thread-header` tight-padding override that the
    cascade-order fix depends on.

File is 1948 lines. WhatsApp-style thin app bar guards survive.
**No regression.**

## Out of scope (defer)

  - KYC upload full-screen wire — V3-24.
  - Studio brief full-screen wire — V3-89 backlog.
  - Manual device smoke (iPhone 15 + Pixel 8) — V3-89 / pre-launch.
