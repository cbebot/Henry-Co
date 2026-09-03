# HenryCo — Public Pages Pass Report

**Date:** 2026-05-23 (session)
**Author:** Owner-led conductor session (Opus 4.7 max sub-agents)
**Scope:** Every change shipped today that touches a **public-facing surface** — the marketing/division pages, the shared top chrome, the mobile drawer, the navigation set. **Does NOT include** the customer dashboard (`apps/account/`) work — that lives in the ACCOUNT-PREMIUM-01 docs at `docs/v3/account-design-language.md`, `docs/v3/account-inner-page-audit-2026-05-23.md`, `docs/v3/account-inner-page-rebuild-spec.md`, `docs/v3/account-premium-session-2-completion.md`.

> **Companion docs (per PR, all on main except #154):**
> - `docs/v3/public-chrome-drawer-audit-2026-05-23.md` — the FIX-CHROME-01 root-cause audit
> - `docs/v3/public-nav-intelligence-2026-05-23.md` — the per-division URL-set audit + matrix
> - `docs/v3/public-drawer-quality-rca-2026-05-23.md` — the FIX-CHROME-02 RCA + premium profile design (lives in PR #154 DRAFT)
> - `docs/v3/mobile-sticky-nav-policy.md` — the broader sticky-nav policy doc (pre-existing reference)

---

## TL;DR

Four PRs landed today against public-facing surfaces, producing a single coherent improvement arc: from a critical sticky-positioning bug that broke the mobile drawer's panel, through a consolidation onto a single canonical drawer primitive, through a per-division intelligent nav URL pass, into a premium profile-section redesign that closed a regression where the drawer's nav links wouldn't navigate.

| PR | Pass | State | Branch | Summary |
|---|---|---|---|---|
| **#138** | DESIGN-01 | Merged earlier in cycle | `feat/design-01-marketplace-drawer` | Marketplace workspace profile drawer rebuilt on the new `BottomSheet` primitive — the reference pattern for every subsequent drawer. |
| **#149** | FIX-CHROME-01 | Merged at `c838f394` | `fix/public-chrome-drawer-sticky` | Sticky-break root-cause fix: migrated public top-chrome drawers off the legacy inline-collapsible-with-`body.overflow=hidden` pattern to the canonical `BottomSheet`. |
| **#151** | FIX-CHROME-01 Session 2 | Merged at `dfa6b9a4` | `feat/public-nav-intelligence` | Per-division intelligent URL set for all 8 customer divisions. Audit-grounded URL choices replacing dead/duplicate/marketing-only nav entries. |
| **#154** | FIX-CHROME-02 | **DRAFT** | `fix/public-drawer-quality` | Drawer nav-click race-condition fix + premium `<DrawerAccountSection>` + cross-division polish. Awaiting owner iPhone verify. |

---

## PR #138 — DESIGN-01: Marketplace workspace profile drawer

**Goal:** owner directive — "magnificent" rebuild of the marketplace mobile profile drawer (the drawer accessed from the workspace nav pill on `marketplace.henrycogroup.com` while signed in).

**Outcome:**
- New shared primitive `BottomSheet` in `@henryco/ui/mobile/bottom-sheet.tsx`. Composes V3-09's `useAndroidBackClose` + `useFocusTrap` + `useReducedMotion` + `safeAreaInsetClass({ bottom })` from the mobile primitives layer.
- iOS-Safari-safe body scroll lock via `position: fixed; top: -<scrollY>px` + `window.scrollTo(0, scrollY)` on close.
- Spring-eased open/close (CSS `cubic-bezier(0.32, 0.72, 0, 1)`), swipe-down dismiss with velocity + distance thresholds, Esc-key dismiss, backdrop tap, Android hardware back, focus trap.
- `data-state="open" | "closing"` exposed for downstream styling.
- Consumed by `apps/marketplace/components/marketplace/workspace-mobile-nav.tsx` which became the **canonical reference pattern** every subsequent drawer was diff'd against.

**Why this matters:** without a canonical primitive, every division had its own drawer pattern. The follow-up passes #149/#154 ride on this foundation.

---

## PR #149 — FIX-CHROME-01: Sticky-break drawer regression

**The bug (owner-screenshot evidence):** on `property.henrycogroup.com` and the other shared-chrome divisions, the user scrolled mid-page, tapped the mobile menu icon, page dimmed (backdrop visible), but the drawer panel was NOT in the viewport and the page didn't scroll up to reveal it.

**Root cause (verified):** the inline mobile-drawer pattern in `packages/ui/src/public-shell/public-header.tsx` and `apps/marketplace/components/marketplace/public-header-client.tsx` set `document.body.style.overflow = "hidden"` to lock scroll while the drawer was open. That breaks `position: sticky` on every descendant — the body is no longer the scrolling container, so the sticky header reverts to its document-flow position. When the user opened the drawer mid-scroll, the header (and the drawer nested inside it) rendered far above the visible viewport. Only the `fixed inset-0 z-40` backdrop remained visible.

**Fix:** migrated both inline implementations to the canonical `BottomSheet` primitive (from DESIGN-01). BottomSheet handles scroll-lock correctly via `html.overflow=hidden` + `body.position=fixed; top=-scrollY` + `window.scrollTo(0, scrollY)` restore on close. Plus inherits Esc, Android hardware-back, swipe-down dismiss, focus trap, iOS-Safari-safe behavior.

**Surgical scope:**
- `packages/ui/src/public-shell/public-header.tsx` (shared chrome consumed by care, jobs, learn, logistics, property, studio, hub non-home)
- `apps/marketplace/components/marketplace/public-header-client.tsx` (marketplace surface from the screenshot)
- All drawer content preserved verbatim (search forms, nav links, sign-in/sign-up, account chips, MobileSignOutRow, `translateSurfaceLabel` calls)

**Out of scope (unchanged):** `apps/marketplace/components/marketplace/workspace-mobile-nav.tsx` (already canonical from DESIGN-01), `apps/hub/HubHomeClient.tsx` chrome (no mobile drawer — horizontal chips), `apps/account/` (separate scope), staff/super-app/company-hub (internal/Expo).

**Gates at merge:** `pnpm typecheck:all` 12/12 clean · `pnpm i18n:check:strict` green · self-audit grep confirms no remaining inline `body.overflow=hidden` paired with sticky chrome.

**Audit doc:** `docs/v3/public-chrome-drawer-audit-2026-05-23.md`

---

## PR #151 — FIX-CHROME-01 Session 2: Intelligent per-division nav URLs

**Goal:** owner directive — "they should intelligently think of the best URLs to add to the navigations that the users needs the most, they should do a well grounded work."

**Approach:** for each of 8 customer divisions, the agent audited what URLs are surfaced in public chrome today vs. what users actually reach for, cross-referenced with each division's actual routes (`apps/<division>/app/**`) + customer-side mirror (`apps/account/(account)/<division>`), and proposed + shipped the canonical nav set.

**Per-division outcomes:**

| Division | Added | Removed | Rationale |
|---|---|---|---|
| **care** | — | "Home" | Logo handles home; 7-item nav ordered to top intents (Services / Pricing / Book / Track / Reviews / About / Contact). |
| **marketplace** | "Track" | "Home" | "Track" was the #1 post-purchase intent with a real route at `apps/marketplace/app/(public)/track/page.tsx` that was previously unsurfaced. |
| **property** | "FAQ" | "Home" | FAQ is a real route, was unsurfaced. "Areas" investigated then rejected because `/area` has no index `page.tsx` — would 404. |
| **logistics** | — | "Quote" + "Book" (demoted to CTAs) | Both were duplicating themselves in the primary nav. Wired `primaryCta` + `secondaryCta` slots into `LogisticsShell.tsx` so the demoted entries render as buttons. Kept "Coverage" as nav. |
| **studio** | — | "Workspace" + "Contact" | "Workspace" already lives in the account chip + mobile-sheet slot; "Contact" already an aux CTA. 7-item engagement-funnel nav remains. |
| **jobs** | — | "Careers" | Collided with "Find jobs". "Categories" investigated then rejected for the same 404 reason as property's Areas. |
| **learn** | — | "How it works" → renamed to "Academy" | Matches the `/academy` route slug; brand-surface alignment. |
| **hub** | "Directory" + "Search" | "Home" + "Privacy" + "Terms" | Legal lives in the footer; "Directory" is `/#directory` anchor; "Search" was hidden below the `xl` breakpoint. |

**Anti-patterns honored (hard stops from the brief):**
- No "Coming soon" entries.
- No CTAs pointing nowhere — every URL spot-checked against a real route file (47-URL spot-check passed).
- No hardcoded `<division>.henrycogroup.com` literals — all references through `henryDomain()` / `henryDomainHost()` from `@henryco/config`.
- Preserved every `translateSurfaceLabel(locale, …)` wrapper; new `publicHeader.account` key added cleanly to all 12 locales (en/fr/de/es/pt/it/ar/zh/hi/yo/ig/ha).

**Files touched:**
- `packages/config/company.ts` — `publicNav` arrays for care, marketplace, property, logistics, studio, jobs, learn, hub
- `packages/ui/src/public-shell/navigation/site-nav.studio.ts` — local override updated to 7-item engagement funnel
- `packages/ui/src/public-shell/navigation/site-nav.hub.ts` — `hubInnerNav` rebuilt (Directory / About / Contact / Search)
- `packages/ui/src/public-shell/navigation/site-nav.logistics.ts` — added `defaultCtas` (Book primary, Quote secondary)
- `apps/logistics/components/layout/LogisticsShell.tsx` — wired `primaryCta` + `secondaryCta` props through `t()`

**Gates at merge:** `pnpm typecheck:all` 12/12 clean · `pnpm i18n:check:strict` green (post-rebase baseline refresh) · 47-URL spot-check all resolve to real route files.

**Audit doc:** `docs/v3/public-nav-intelligence-2026-05-23.md` — full per-division section with division × user-intent matrix, justification per URL, visual-verify checklist.

---

## PR #154 — FIX-CHROME-02 (DRAFT)

**The owner-flagged regression (from the property.henrycogroup.com 11:46 AM screenshot):** the new BottomSheet-based public drawer opened correctly, but tapping any nav link (Home / Search / Managed / Trust / Submit) did NOT navigate. The "Henry" profile chip with up-arrow also needed to surface premium account quick-actions.

**Root cause (verified):** closing the BottomSheet synchronously inside the Link's `onClick` raced with `useAndroidBackClose`'s cleanup. Next.js App Router pushes route state asynchronously via `useTransition` — by the time the cleanup commit ran, its history sentinel was still on top of the history stack, so `history.back()` fired and cancelled the in-flight navigation. Every drawer-tap appeared dead.

**Fix shape (three commits on `fix/public-drawer-quality`):**

1. **`a8efbd09`** — defer `setOpen(false)` via `requestAnimationFrame` so Next.js pushes route state first; the sentinel is no longer top-of-history by the time cleanup runs, so `history.back()` is correctly skipped. Plus `min-h-[48px]` tap targets across all drawer links and `aria-current="page"` restored.

2. **`fd2e6533`** — new `<DrawerAccountSection>` component in `@henryco/ui/public` replacing the chip-with-nested-dropdown pattern that was awkward inside a BottomSheet. Two new slots on `PublicHeader`: `renderMobileSheetProfile` (client, with dismiss callback) and `mobileDrawerProfile` (server, element variant). Adds `publicHeader.account` localised key to all 12 locales.

3. **`001007c7`** — wires `DrawerAccountSection` into care, hub (non-home), jobs, learn, logistics, property, studio site-headers. Per-division accent dot, grouped menu, ≥48px tap targets, MENU/ACCOUNT kicker eyebrows.

**Gates:** `pnpm typecheck:all` 12/12 clean · `pnpm i18n:check:strict` green · lint 0 errors.

**Status:** DRAFT — awaiting owner visual-verify on iPhone Safari across all 8 public-chrome domains + reduced-motion + landscape before merge. The fix is architecturally sound + the gates are green; the gate is owner UX preference, not code correctness.

**RCA doc:** `docs/v3/public-drawer-quality-rca-2026-05-23.md` (in the PR branch — will land on main when PR #154 merges)

---

## Anti-patterns observed (public-chrome scope)

1. **`document.body.style.overflow = "hidden"` breaks `position: sticky`** on any descendant. If you need to lock scroll, use the `BottomSheet` primitive's pattern (`html.overflow=hidden` + `body.position=fixed; top=-scrollY` + scroll restore).
2. **Inline mobile drawers inside `position: sticky` headers** — bad architectural pattern; the scroll-lock fights the sticky positioning. Use a portal-mounted `BottomSheet`.
3. **Synchronously closing a BottomSheet in a `<Link>` onClick** races with App Router's async route push. Defer the close via `requestAnimationFrame` (or `setTimeout(0)`).
4. **Hardcoded `<division>.henrycogroup.com` literals** in nav components — always route through `henryDomain()` / `henryDomainHost()` from `@henryco/config` so preview / staging environments resolve correctly.
5. **"Coming soon" / dead-link nav entries** — every URL on the public nav must resolve to a real route on the day it ships. Verify with a grep against `apps/<division>/app/**/page.tsx`.
6. **Lint rule `@next/next/no-html-link-for-pages`** does not know about `global-error.tsx`'s special context where Next's `<Link>` cannot work. Use a `<button>` + `window.location.assign("/")` at that boundary. (Bit us on `apps/hub/app/global-error.tsx` and `apps/account/app/global-error.tsx`.)
7. **Chip-with-nested-dropdown inside a BottomSheet** — feels awkward because nesting two collapse mechanisms confuses the user's tap intent. Replace with an in-place expansion / dedicated section.

---

## Verification checklist for the team

Once PR #154 lands and the Vercel migration to HenryCo Studio completes, smoke-test on a real iPhone Safari:

- **Per division** — visit each public chrome (`care.henrycogroup.com`, `jobs.henrycogroup.com`, `learn.henrycogroup.com`, `logistics.henrycogroup.com`, `marketplace.henrycogroup.com`, `property.henrycogroup.com`, `studio.henrycogroup.com`, `henrycogroup.com`), open the mobile drawer:
  - ✓ Drawer slides up from bottom (not drops down from header)
  - ✓ Page does NOT scroll up when the drawer opens
  - ✓ Backdrop dim visible
  - ✓ Header pill / chrome remains visible at the top
  - ✓ Every nav link inside navigates correctly on tap (no dead clicks)
  - ✓ Profile chip expands cleanly to show account quick-actions (PR #154 once merged)
  - ✓ Swipe-down dismisses
  - ✓ Esc key dismisses (desktop)
  - ✓ Tap targets ≥48px feel responsive
- **Reduced motion** — toggle iOS Settings → Accessibility → Motion → Reduce Motion on; reopen drawer; verify it appears instantly without spring animation but still works.
- **Landscape** — rotate device; drawer should remain anchored to viewport bottom + content scrollable.
- **Nav URLs** — verify the new intelligent nav set per division (Track on marketplace, FAQ on property, Academy on learn, etc.) — every URL clicks through to a real page.

---

## Open follow-ups (public-pages scope)

1. **Merge PR #154** after iPhone visual verify. Once merged, the public drawer is fully canonical across every division.
2. **Verify the Vercel migration** — the new HenryCo Studio Vercel team (`team_0PUdVTapDfmw8tpwht4TvRUG`) is built + serving; cross-confirm each public domain returns HTTP 200 once DNS is cut over.
3. **Audit `apps/hub/HubHomeClient.tsx`** for the horizontal-chip chrome variant — not in this pass's scope, but if a future Wave wants drawer consistency on the hub home too, this is the file to migrate.

---

**Public-pages pass closed cleanly. Three docs on main (`public-chrome-drawer-audit`, `public-nav-intelligence`, this report) + one in DRAFT PR #154 (`public-drawer-quality-rca`). Owner pickup point: visual-verify PR #154 on real iPhone.**
