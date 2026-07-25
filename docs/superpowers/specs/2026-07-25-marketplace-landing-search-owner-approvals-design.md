# Marketplace landing + search standardization, owner approval actions — design

Date: 2026-07-25 · Owner brief: (1) "Browse — Find your shelf" must come before the
selected listings on the marketplace landing page; (2) remove/relocate irrelevant
copy so the landing is a perfect start; (3) standardize /search; (4) the owner
approval surface shows marketplace seller applications with no approve/reject
actions — fix; (5) Playwright-verify; single PR.

Owner pre-authorized implementation ("fix them and then open pr for me to merge"),
so the interactive design-approval gates are collapsed into this written spec.

## 1. Landing page — `apps/marketplace/app/(public)/page.tsx`

Current arc: Hero → trust manifesto (sunken, display-size) → Featured products
(with a second proof rail duplicating the hero's) → Browse categories → Collections
→ Stores → Invitation.

New arc (shopping-first, one breath per section, trust kept but not interrupting):

1. **Hero** — unchanged role (promise + At-a-glance proof rail + CTAs).
2. **Browse — "Find your shelf."** — moved up to the first content section.
   Fallback: when no category is flagged featured, fall back to all categories
   (mirrors the existing `discoveryProducts` fallback pattern) so the section
   never silently vanishes. Adds a ghost CTA to /search.
3. **Featured — "Worth a closer look."** — the product grid. The in-section
   `PublicProofRail` is deleted: it repeats the hero's numbers two breaths later
   (the "irrelevant writing" pattern — self-referential proof instead of product).
4. **Curated collections** — unchanged.
5. **Stores — "Sellers you can read."** — unchanged.
6. **Trust — "Trust, visible before you pay."** — the manifesto moves here,
   compressed (headline size, tight rhythm, keeps the sunken tone + 3 editorial
   rows) and gains a "How trust works" ghost CTA → /trust, which is the
   "somewhere else" where the deep trust prose already lives.
7. **Invitation** — unchanged.

## 2. /search — `app/(public)/search/page.tsx` + `components/marketplace/search-experience.tsx`

- Header: replace legacy `PageIntro` (market-kicker chrome) with the locked
  public-design opener (Eyebrow → DisplayHeading with one accent-italic phrase →
  one Lede), inside the `home-shell` measure like every home section.
- Container: `max-w-[1480px]` → `home-shell-wide` (80rem), the system's wide band.
- Localization: the page is a server component — run every surface label through
  `translateSurfaceLabel` (Pattern B) and pass a `labels` prop into the client
  `SearchExperience`, which currently hardcodes ~30 English strings. No string
  changes inside client state logic; mechanics (fetch, suggest, sort, sparse-grid
  guard, paging) untouched.
- Copy cuts (the standardization ask): delete "Premium filtering" badge; delete
  the "Search reacts quickly, filters stay visible…" meta-paragraph; "N refined
  results" → "N results"; empty-state second sentence becomes buyer guidance
  ("Ease one filter or widen the keyword.") instead of brand self-description.

## 3. Owner approve/reject for seller applications

Decision logic stays in exactly one place: `POST /api/marketplace`
(`admin_vendor_application_decision`), which already authorizes
`marketplace_owner`. The gap is UI-only.

- **Extract** the pending-application card queue that PR #531 built into
  `apps/marketplace/app/admin/page.tsx` into a shared server component
  `components/marketplace/vendor-application-queue.tsx` (props: applications,
  returnTo). Reused by:
  - `/admin` index (no behavior change),
  - `StaffResourcePage` seller-applications branch, widened from
    `root === "/admin"` to `/admin` OR `/owner` — this creates the missing
    actionable `/owner/seller-applications` surface.
- **Marketplace owner nav** (`lib/marketplace/navigation.ts`): add
  "Seller applications" to the `/owner` rail; owner overview page gets a direct
  "Review seller applications" CTA (the count card currently dead-ends).
- **Hub approval center** (`apps/hub`): the "Vendor applications pending review"
  queue item currently routes to the hub division info page (no actions). Point
  it at the actionable marketplace surface (`…/admin/seller-applications`, same
  target the Review-surfaces panel already uses) and teach the queue-item link to
  open external hrefs in a new tab (helper `isOwnerDivisionExternalHref` is
  already imported there).

## Found during verification: invalid grid CSS across the marketplace app

The Playwright walk caught the /search filter rail rendering full-width above
the results at desktop. Root cause: 27 `grid-cols-[a,b]` arbitrary values
(Tailwind v3-era comma syntax) across 18 marketplace files compile under
Tailwind v4 to `grid-template-columns: a,b` — invalid CSS that browsers
silently discard, so every one of those layouts stacked to a single column
(search rail, cart drawer, checkout summary, store/brand/track/trust pages,
and the staff WorkspaceShell sidebar). Fixed mechanically comma → underscore
(`grid-cols-[280px_1fr]`), which restores the two-column layouts the classes
always declared. Bracket values containing parentheses (e.g.
`repeat(2,minmax(0,1fr))`) carry valid CSS commas and were left untouched.

## Error handling / testing

No schema, API, or auth changes anywhere — pure presentation + routing. Gates:
per-app typecheck + lint + `next build` for marketplace and hub, i18n strict
check (refresh dated baseline only if the scanner flags the moved lines), then
Playwright against local dev: landing section order, /search render + filters,
and the owner/admin approval surfaces (auth-gated: verified to the extent local
auth allows, otherwise redirect behavior + build-time render).
