# Marketplace Profile Drawer — Design Spec (DESIGN-01)

**Pass:** DESIGN-01 — Polish / Design uplift
**Pillar:** P12 (Global UX)
**Component:** `apps/marketplace/components/marketplace/workspace-mobile-nav.tsx`
**Primitive (new):** `@henryco/ui/mobile` `BottomSheet`
**Owner directive (verbatim):**
> "Also the marketplace profile nav drawer is not nice. Make it magnificent. Scrolling nice, when am at the bottom of the page and open it, how it should open etc. Make it nice built from scratch and design it with your max Claude design properly where appropriate."

The bar: every interaction with this drawer feels considered. Not a config panel — a curated surface that respects scroll, breath, focus, and brand.

---

## 1. Interaction model

### Trigger
- Location: inside the existing `market-panel` card at the top of every mobile workspace shell route.
- Tap target: `min-h-[44px]` (WCAG 2.5.5 Level AAA). 16px gap from card edges.
- Idle: `bg-[var(--market-paper-white)] text-[#0b1018]`, Menu icon + "Open workspace menu".
- Press: scale-down `active:scale-[0.98]` (78ms) with no color invert — the affordance is the spring, not a flash.
- A11y: `aria-haspopup="dialog"`, `aria-controls="market-profile-drawer"`, `aria-expanded={open}`. Persistent focus ring on `focus-visible` using `var(--market-brass)`.

### Open sequence (≤280ms)
1. **T+0ms** — User taps trigger.
2. **T+0ms** — Telemetry: `henry.marketplace.profile_drawer.opened` emitted.
3. **T+0ms** — Body scroll lock: `position: fixed`, `top: -<scrollY>px`, `width: 100%`, `overflow: hidden` saved against `<body>`. Original `scrollY` cached on a ref for the close path.
4. **T+0ms** — Backdrop mounts at opacity `0`, drawer mounts translated `100%` below the viewport bottom.
5. **T+8ms** (rAF tick) — Backdrop animates `opacity 0 → 1` over 220ms with `cubic-bezier(0.32, 0.72, 0, 1)` (Material spring-y emphasized standard).
6. **T+8ms** — Drawer animates `transform: translateY(100%) → translateY(0)` over 280ms with the same easing. (Equivalent to a critically-damped spring mass=1 stiffness=380 damping=30.)
7. **T+40ms** — Initial focus jumps to the close (X) button via `useFocusTrap`'s `initialFocus` ref. The X button is the safest first focus stop — it never causes accidental navigation when the user has muscle-memory pressed Enter.
8. **T+80ms** — Active group auto-expands (the group containing the current route). The expand happens after the drawer settles so the eye lands on a stable surface first.

### Close sequence (≤220ms)
Triggers (any of):
- Tap close (X) button → `via: 'tap_close'`
- Tap backdrop → `via: 'tap_backdrop'`
- Press Esc → `via: 'escape_key'`
- Android hardware back → `via: 'android_back'` (handled by `useAndroidBackClose`)
- Swipe handle/header down > threshold → `via: 'swipe_down'`
- Tap any nav link → `via: 'navigation'` (the route change handles the rest)

Sequence:
1. **T+0ms** — Drawer animates `translateY(0) → translateY(100%)` over 220ms.
2. **T+0ms** — Backdrop fades `1 → 0` over 200ms (slightly faster so the page reveals before the drawer leaves the viewport — feels lighter).
3. **T+220ms** — Component unmounts (driven by an `isExiting` state flag).
4. **T+220ms** — Body scroll restored: `position`, `top`, `width`, `overflow` reset; `window.scrollTo(0, cachedScrollY)` runs in the same tick so the user lands at the exact pixel they left.
5. **T+220ms** — Focus returns to the trigger button (via `useFocusTrap`'s `restoreFocus`).
6. **T+220ms** — Telemetry: `henry.marketplace.profile_drawer.closed` emitted with `via` payload.

### Body scroll lock — the "open at bottom of page" fix
Reproduction without lock: page scrolled to bottom (e.g. y=4200), tap trigger → drawer mounts but iOS Safari "pulls" the page up by the drawer's height, the user loses their scroll position, and on close the page is left at y=0.

Fix (the pattern in this spec):
```ts
// open
const scrollY = window.scrollY;
document.body.style.position = "fixed";
document.body.style.top = `-${scrollY}px`;
document.body.style.left = "0";
document.body.style.right = "0";
document.body.style.overflow = "hidden";
// close
const top = document.body.style.top;
document.body.style.position = "";
document.body.style.top = "";
document.body.style.left = "";
document.body.style.right = "";
document.body.style.overflow = "";
window.scrollTo(0, parseInt(top || "0") * -1);
```

This is the standardized iOS-Safari-compatible technique. It works on Chrome / Firefox / Safari without UA-sniffing.

### Drawer scroll (independent)
- The body of the drawer (the part beneath the header) is a scroll container with `overflow-y: auto` + `overscroll-behavior: contain` so flick-scrolling inside the drawer cannot leak into the page beneath.
- Touch-action: `pan-y` on the scroll region so vertical pans scroll, horizontal pans pass through to anything below (currently nothing — but cheap to be safe).
- `-webkit-overflow-scrolling: touch` is set on iOS for momentum.

### Swipe gesture
- The handle area (top 56px including the pill grabber + header) is the gesture surface.
- On `touchstart` we cache `startY`. On `touchmove` we compute `delta = touch.clientY - startY`. If `delta > 0` (down only) we translate the drawer `translateY(<delta>px)` and fade the backdrop opacity from 1 → `1 - delta/200` (linear damping).
- On `touchend`:
  - If `delta > 80px` OR `velocity > 0.6 px/ms` → close (spring is replaced by the close-animation transform).
  - Else → spring back to `translateY(0)` with the same cubic-bezier (180ms).
- If `prefers-reduced-motion: reduce` → swipe is disabled. Users close via the X button, Esc, or backdrop tap.
- We do NOT use a third-party gesture library. The math is 20 lines of vanilla touch handlers.

### Reduced motion
- All transitions become `transition-duration: 0ms`.
- No swipe gesture (the handle is still visible as visual affordance but pointer events on it are no-ops on touchmove).
- Backdrop still appears (instantly), focus trap still works, scroll-lock still works. Only the animation is suppressed.

---

## 2. Visual

### Layout
- Mobile only: `lg:hidden` on the outer wrapper (desktop renders the sidebar in `shell.tsx`, untouched).
- Drawer surface: `max-height: 92dvh` (dynamic viewport height — handles iOS URL bar collapsing gracefully). `min-height: 320px` to prevent embarrassing thumbnails.
- Width: `100%` up to `max-w-[640px]` centered; on a phone this is full-width, on a small tablet portrait this caps to 640px and leaves equal margins.
- Position: `fixed; inset-x-0; bottom-0`. Rounded top: `rounded-t-[1.8rem]` (29px) — matches the marketplace card vocabulary (the cards use `1.6rem`–`2.1rem`).
- Z-index: `50` (above sticky nav, below toast surface which lives at `60`).

### Handle (grabber)
- Pill: `width: 40px; height: 4px; border-radius: 9999px`.
- Color: `rgba(246, 240, 222, 0.22)` (low-opacity paper-white). Subtle; doesn't compete with the title.
- Position: `8px` from drawer top, horizontally centered.
- Tap target buffer: the surrounding 56px header region is the gesture handle (not just the pill — fingers are bigger than 4px).

### Header
- Padding: `px-5 pt-5 pb-4`.
- Two-row stack:
  1. Eyebrow + close icon (44×44 button on the right, X icon).
  2. Title (`text-base font-semibold tracking-tight` — NOT giant; preserves editorial proportion).
- Eyebrow: `text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--market-brass)]` — "Workspace menu" or similar.
- Title: clamped to 2 lines via `line-clamp-2`.
- Description (if present, optional): one row beneath the title, `text-[13px] leading-6 text-[var(--market-muted)]`, also `line-clamp-2`.
- Border-bottom: `1px solid var(--market-line)`.

### Backdrop
- Color: `rgba(2, 4, 10, 0.62)` — slightly more transparent than the existing 0.78 (lets the page texture through). Closer to a Stripe Dashboard / Linear feel.
- Blur: `backdrop-blur-md` (12px) — pleasant depth.
- Tinted with the marketplace dark ink, NOT a naive black overlay.

### Drawer surface
- Background: `rgba(8, 12, 20, 0.96)` with `backdrop-filter: blur(20px)` — a glass-ish dark surface that picks up the page color underneath without becoming opaque.
- Border-top: `1px solid rgba(196, 171, 130, 0.18)` (brass at low alpha — references the brand without screaming).
- Shadow: `0 -16px 48px -16px rgba(2, 4, 10, 0.72)` — a lifted shadow above the rounded-top edge, suggests the drawer is hovering above the page.
- Inner ring: an `inset 0 1px 0 rgba(255,255,255,0.04)` highlight along the top edge gives a satisfying glass-edge feel.

### Group section
- Each group is a `<section>` separated by `border-b border-[var(--market-line)]` (last child loses the border).
- Group header: a button row with the small-caps label on the left, ChevronDown that rotates 180deg when expanded.
- Active group (the one containing the current route) auto-expands on open.
- Animation: `max-height` transitions from `0` to a measured intrinsic size over 220ms `ease-out`; opacity from `0` to `1`. Reduced motion makes it instant.

### Item row
- `min-height: 48px` (touch target).
- Padding: `px-3.5 py-3`.
- Layout: label on the left, ChevronRight 14×14 on the right at opacity 0.7.
- Active state:
  - Background: `linear-gradient(135deg, rgba(246,240,222,0.14), rgba(117,209,255,0.10))` (the existing marketplace active-tint, preserved).
  - Text: `var(--market-paper-white)`.
  - Subtle inset ring: `inset 0 0 0 1px rgba(196, 171, 130, 0.18)` — a brass hairline around active items so they're recognizable without being heavy.
- Inactive: `text-[var(--market-muted)]`. Tap state shifts text to paper-white + adds a `rgba(255,255,255,0.04)` background. No hover state on touch — only `:focus-visible` and `:active`.

### Bottom safe-area
- `pb-safe-bottom` (the `hc-safe-bottom` utility) is applied to the SCROLL container, not the drawer surface — so the safe-area padding never gets covered by the drawer's own background (which is rounded only at the top).
- Adds `env(safe-area-inset-bottom, 0px)` to the drawer's interior, preventing the home indicator from sitting on the last group separator.

### Footer (optional)
- If a future iteration wants to pin a "Sign out" or "Account settings" CTA at the bottom, this is the slot. For now, no footer — keeps the drawer focused on navigation.

### Theming
- All colors via marketplace tokens: `--market-paper-white`, `--market-muted`, `--market-line`, `--market-brass`. No hex literals except where they were already in the file (e.g. backdrop `#0b0f17` focus-ring offset which is the page background).
- THEME-01 may extend the token namespace mid-DESIGN-01 work. If THEME-01 lands first, we re-grep + token-swap in a single commit. If we land first, THEME-01 absorbs the drawer tokens into its semantic layer.

---

## 3. Accessibility

### ARIA
- Drawer container: `role="dialog"` + `aria-modal="true"`.
- `aria-labelledby` points to the title element (`id="market-profile-drawer-title"`).
- `aria-describedby` points to the description element if present (`id="market-profile-drawer-desc"`).
- Trigger: `aria-haspopup="dialog"`, `aria-controls="market-profile-drawer"`, `aria-expanded={open}`.
- Handle: `role="separator"` with `aria-orientation="horizontal"` — purely decorative for a screen reader. Not focusable (`tabIndex={-1}`).

### Keyboard
- Focus trap: `useFocusTrap` cycles Tab/Shift+Tab inside the drawer.
- Initial focus: close (X) button (safest stop — Enter doesn't navigate accidentally).
- Esc: closes (via the focus-trap's `onEscape` callback).
- Arrow keys: NOT used for navigation — items are links, Tab is the right key.
- Restore focus: trigger button on close (handled by `useFocusTrap`).

### Screen reader
- Drawer announces as "Workspace navigation, dialog" on open (via the labelledby title).
- Group headers are buttons (`aria-expanded` reflects state).
- Active item: `aria-current="page"` (already in the current implementation, preserved).
- Close button: `aria-label="Close workspace menu"`.

### Reduced motion
- `prefers-reduced-motion: reduce` → transition durations become 0ms via `useReducedMotion` returning true. Swipe gestures disabled (the touchmove handler is a no-op when reduced motion is active).

### Color contrast
- All text vs background combinations passed via the marketplace token system: paper-white on `rgba(8, 12, 20, 0.96)` exceeds 14:1; muted (`rgba(224, 216, 204, 0.74)`) on the same background exceeds 7.5:1. Both clear WCAG AAA for body text.
- Focus ring: `var(--market-brass)` (#c8a36a) on dark surface — `3.2:1` contrast against the drawer background (passes WCAG 2.4.7 non-text focus indicator).

---

## 4. Primitive (`BottomSheet`) API

New file: `packages/ui/src/mobile/bottom-sheet.tsx`. Exported via `@henryco/ui/mobile`.

```tsx
export type BottomSheetProps = {
  /** Controls visibility. */
  open: boolean;
  /** Invoked when the sheet wants to close. */
  onClose: (reason: BottomSheetCloseReason) => void;
  /** Sheet content. */
  children: React.ReactNode;
  /** Title element id — wired to aria-labelledby on the surface. */
  labelledBy?: string;
  /** Optional description id — wired to aria-describedby. */
  describedBy?: string;
  /** Optional plain-text aria-label (when no visible title exists). */
  ariaLabel?: string;
  /** Surface id (used by triggers' aria-controls). */
  id?: string;
  /** Surface label used for telemetry events (backdrop_tap, android_back). */
  surface?: string;
  /** Swipe-to-dismiss. Default true on mobile, off when reduced motion. */
  enableSwipeDismiss?: boolean;
  /** Body scroll lock with iOS-Safari scroll restoration. Default true. */
  lockBodyScroll?: boolean;
  /** Show the pill handle. Default true. */
  showHandle?: boolean;
  /** Max height. Default '92dvh'. */
  maxHeight?: string;
  /** Custom class on the surface. */
  className?: string;
  /** Ref to focus first when opened. Defaults to the close button. */
  initialFocusRef?: React.RefObject<HTMLElement>;
  /** Ref the trigger lives on — focus is restored here on close. */
  triggerRef?: React.RefObject<HTMLElement>;
};

export type BottomSheetCloseReason =
  | "tap_close"
  | "tap_backdrop"
  | "escape_key"
  | "android_back"
  | "swipe_down"
  | "programmatic";
```

Behavior baked into the primitive:
- Mounts a portal at `document.body` so the drawer escapes any `transform`/`overflow:hidden` ancestor.
- Body scroll lock via `position: fixed; top: -scrollY`. Restores `scrollY` on close.
- Backdrop with the visual described above; tap = `onClose("tap_backdrop")` + `emitModalBackdropTap(surface)`.
- Spring-eased translate-up + opacity-up open animation.
- Focus trap via `useFocusTrap` (a11y package).
- Escape + Android back close via `useAndroidBackClose`.
- Swipe-to-dismiss (touch handlers — disabled when reduced motion or `enableSwipeDismiss === false`).
- Reduced-motion gating (instant transitions, no swipe).
- `data-state="open" | "closing"` exposed on the surface for downstream styling hooks.
- Returns `null` when not open AND not exiting (no DOM cost when closed).

This is a backward-compatible addition because the file is new. No existing callers of `@henryco/ui/mobile` break.

---

## 5. Telemetry

Registered in `packages/observability/src/events.ts`:
- `henry.marketplace.profile_drawer.opened` — classification: `user_action`, outcome: `started`. Payload: `{ surface, trigger_position }`.
- `henry.marketplace.profile_drawer.closed` — classification: `user_action`, outcome: `completed`. Payload: `{ via: BottomSheetCloseReason | 'navigation' }`.
- `henry.marketplace.profile_drawer.item_selected` — classification: `user_action`, outcome: `completed`. Payload: `{ group, label, href }`.

Emitted from `WorkspaceMobileNav`. Sentry breadcrumbs piggyback via `emitEvent`'s built-in path.

---

## 6. Anti-patterns (HARD stops)

- No third-party drawer library.
- No new top-level primitive other than `BottomSheet` (this one is needed — there is no existing equivalent).
- No `position: relative` on the body during lock (must be `fixed` to suppress iOS Safari bounce).
- No `setTimeout` for animation cleanup — drive everything via state + CSS transition end OR rAF.
- No giant hero text inside the drawer.
- No `transform: translateY(...) !important` shortcuts — the swipe handler computes its own transform via state, the rest is class-based.
- No mutating the user's scroll position outside of the lock/restore handshake.

---

## 7. Open questions (for owner review)

- Should the drawer surface a "Sign out" CTA at the bottom? Currently no — the trigger card sits inside the workspace shell which has its own account chip up top. Adding a footer here may be redundant.
- Should the drawer remember its expanded-group state across opens? Currently no — every open expands the active group only. (Persistence in a follow-up DESIGN-02 if the owner wants it.)
- Should we add a search box inside the drawer? With 10 items max, probably no. With 20+ items in a future expansion, yes.

Resolution recommended: keep this spec scoped to the current set and let DESIGN-02 explore footer + search.

---

## 8. Implementation notes (post-rebuild — updated Phase 6)

(Populated after rebuild completes — see commit history and `.codex-temp/design-marketplace-profile-drawer/report.md`.)
