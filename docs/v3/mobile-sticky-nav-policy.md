# Mobile Sticky-Nav Policy — V3-09

**Pass:** V3-09 — Foundation: Mobile Consistency (S4)
**Date captured:** 2026-05-22

## Two-mode model

Every web-app mobile shell standardises on ONE of:

  - **Sticky** — nav stays visible during scroll. Best for short-form
    pages where the nav IS the chrome (account, hub, support).
  - **Auto-hide** — nav hides on scroll-down, reappears on scroll-up.
    Best for reading + feed surfaces (marketplace, learn, property).

The platform now ships `useScrollDirection(threshold)` in
`@henryco/ui/mobile` to drive the auto-hide mode in a reduced-motion-
aware way. Apps that choose `Sticky` need no JS; CSS `position: sticky`
on the header is enough.

## Per-app decisions

| App | Decision | Rationale |
|---|---|---|
| `account` | Sticky | Workspace shell, density-first; user expects nav anchored. |
| `hub` | Sticky | Owner dashboard surfaces; nav is the workspace chrome. |
| `staff` | Sticky | Staff workspace; same rationale as hub. |
| `care` | Sticky | Mixed dashboard + public surfaces; nav is anchored. |
| `marketplace` | Auto-hide on product feed; Sticky on checkout | Reading the catalog rewards full-viewport; checkout rewards anchored progress. |
| `learn` | Auto-hide on lesson reader; Sticky on dashboard | Long-form reading. |
| `property` | Auto-hide on listing detail; Sticky on dashboard | Photography + spec reading. |
| `logistics` | Sticky | Operational; user needs nav reachable. |
| `jobs` | Sticky | Form-heavy flows; anchored is calmer. |
| `studio` | Sticky | Brief-driven, anchored progress chrome. |

## Implementation guidance

  - **Sticky pattern** — apply `sticky top-0 z-30` to the nav root.
    The existing `IdentityBar` and per-app `site-header` files already
    do this; no change required. iOS Safari's auto-hiding URL bar
    interacts gracefully with `sticky` (no fight, no overlap).

  - **Auto-hide pattern** — wire the existing `useScrollDirection`
    hook:

    ```tsx
    import { useScrollDirection } from "@henryco/ui/mobile";

    function Nav() {
      const direction = useScrollDirection(24);
      return (
        <nav
          className="sticky top-0 z-30 transition-transform duration-200"
          style={{
            transform: direction === "down" ? "translateY(-100%)" : "none",
          }}
        >
          ...
        </nav>
      );
    }
    ```

    The hook returns `"idle"` when reduced-motion is preferred and
    scrolling is downward, so users with motion-sensitivity never
    see the nav dismiss.

  - **Backdrop blur** — apply `backdrop-blur-md` + a translucent
    background when the nav sits over imagery (marketplace product
    page, property hero). Skip when the nav sits over a solid surface
    — blur with nothing behind it is a perf cost for no payoff.

## Out of scope

  - Implementing the auto-hide wiring in marketplace / learn /
    property — captured here as policy; per-app PRs follow.
  - Public-shell auth pages — those are short-form by definition.
  - Per-route exceptions (e.g. a wizard step that hides nav entirely)
    — handled in the page module, not the shell.
