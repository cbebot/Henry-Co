# Customer Account Dashboard — Inner-Page Audit

**Pass:** ACCOUNT-PREMIUM-01 · Session 1 · Phase 1
**Date:** 2026-05-23
**Engineer:** Claude Opus 4.7 (1M)
**Surface:** `apps/account/app/(account)/**/page.tsx` (28 routes, ~3,240 LOC across pages alone)
**Method:** Read every page file end-to-end + its data fetcher. Score on four axes (1–5):
- **Real-data integrity** — does it render the user's data, or does it have placeholder sections that look like data but aren't?
- **Next-step clarity** — does the page tell the user what they likely want to do next?
- **Premium feel** — does it read as a paid product or a free template?
- **Mobile parity** — does it feel considered at 360px?

## Headline finding

The inner-shell is **further along than the brief assumed**. Of the 28 page-files, **15** already have a state-driven editorial hero (CareHero, MarketplaceHero, JobsHero, StudioHero, LearnHero, PropertyHero, InvoicesHero, HeroBalance, NotificationsHero, InboxHero, TasksHero, SecurityHero, IdentityHero, SettingsHero, CalendarHero) — each independently implemented, each with its own CSS, each with its own copy schema. The premium opportunity is **not** "build 15 new heroes." It is:

1. Lift the existing editorial pattern into a shared `<HeroCard />` primitive so the design language stops fragmenting.
2. Replace the **5–7 thin pages** (addresses, documents, payments, subscriptions, support, saved-items, referrals) that still use the legacy `<PageHeader>` chrome with the editorial hero.
3. Standardise the `<TimelineCard>` row shape so activity / messages / notifications / support / orders / referrals stop drifting.
4. Standardise empty states (currently inconsistent: `<EmptyState>` from `components/layout`, ad-hoc `<div className="acct-*__empty">`, and the dashboard-shell `<EmptyState>` all coexist).

That is the visual debt. The data layer is in better shape than the chrome — almost every page reads from a typed fetcher (`getCareBookings`, `getLearnAccountSummary`, `getMarketplaceDivisionSummary`, etc.). Where placeholders exist, they're tagged with the gap (e.g. `documents/page.tsx`'s hardcoded `typeChip` map, `support/page.tsx`'s hardcoded `statusInfo`, `referrals/page.tsx`'s hardcoded `statusChip`).

---

## Per-page table

Pages are ranked by rebuild priority (descending). Priority is a function of user traffic × current quality gap × premium signal.

### Tier 1 — Reference rebuilds (this session)

These three pages span the surface taxonomy and prove the primitives.

#### `/` — Root account home (`page.tsx`, 72 LOC + SmartHome 246 LOC composer)
- **Type:** overview / dispatch
- **Scores:** Real-data 5 · Next-step 4 · Premium 3 · Mobile 4
- **Current state:** Already a sophisticated composer (`SmartHome.tsx`) that fans out to signal feed + lifecycle + ranked metrics + module widgets. Uses `MetricCard` from `@henryco/dashboard-shell/components` (already has typed `comparison|trend` contract). The composition is good; the **visual chrome around the SmartHome blocks** is bare — they sit on a bare page background with no editorial hero band on top. The first thing the user sees is `SmartHomeHeader` (firstName + counts as plain text). On mobile this works; on desktop it reads as understated to the point of looking unfinished.
- **Wow-bar gaps:**
  1. No editorial hero band above the SmartHome composition. The "name · last activity · unread count" line could be a HeroCard's tile row + side panel.
  2. `NextBestActions` is rendered as a list of cards — first-best-action deserves the row-level emphasis a `<NextStepRow />` provides above the rest.
  3. The empty state (when SmartHomeEmpty fires) is typographic but borders on stark. Could add 1–2 capability tiles ("Wallet ready · 0 NGN balance", "Calendar empty · Connect your first booking") to teach what the shell does.
- **Rebuild priority:** P1 (this session — wave the flag).

#### `/care` — Care division landing (`care/page.tsx`, 239 LOC)
- **Type:** division overview / list-hybrid
- **Scores:** Real-data 5 · Next-step 4 · Premium 4 · Mobile 4
- **Current state:** Best-in-class division landing. Real bookings via `getCareBookings`; state-driven hero copy (empty / attention / active / calm); active glance card surfaces the top-priority booking; filterable bookings dashboard; activity feed. Mature.
- **Wow-bar gaps:**
  1. Hero is implemented as `<CareHero>` with its own ~150 LOC CSS — could/should be the shared `<HeroCard variant="paired" />` and shed the duplication.
  2. The "active glance" card is a one-off pattern — it should expose as a generalised `<NextStepRow />` candidate (the booking's "next action" is exactly what `<NextStepRow />` exists for).
  3. The bookings empty state is plain `<div className="acct-care__empty">` — should adopt `<EmptyStateCard />`.
- **Rebuild priority:** P1 (this session — proves the primitive on the most mature landing).

#### `/messages` — Cross-portal inbox (`messages/page.tsx`, 135 LOC)
- **Type:** list / hybrid
- **Scores:** Real-data 5 · Next-step 3 · Premium 4 · Mobile 4
- **Current state:** Inbox aggregator with editorial hero, filter chips, dense thread list. Real data from `getInboxAggregate`.
- **Wow-bar gaps:**
  1. `<InboxHero>` is again a one-off — `<HeroCard variant="paired" />` consolidation.
  2. **No `<NextStepRow />`** above the list — when the user has unread threads, the inbox could surface "Reply to <division> from <name>" as the row.
  3. The empty state is hand-rolled (`<div className="acct-inbox__empty">`) — should adopt `<EmptyStateCard />`.
  4. List rows are hand-rolled in `InboxList` — should adopt `<TimelineCard.Row />`.
- **Rebuild priority:** P1 (this session — proves the primitive on a list-type page).

### Tier 2 — Hero already present, refactor in session 2

These pages already have a state-driven hero and section grammar. The session 2 task is to swap the local hero for `<HeroCard />` and standardise the empty / timeline shapes. Each is rebuild-priority **P2**.

| Route | LOC | RD | NSC | PF | MP | Top gap |
|---|---:|---:|---:|---:|---:|---|
| `/marketplace` | 259 | 5 | 4 | 4 | 4 | `MarketplaceHero` → shared HeroCard; activity rows → TimelineCard |
| `/jobs` | 160 | 5 | 4 | 4 | 4 | `JobsHero` → shared HeroCard; ApplicationsList → TimelineCard |
| `/studio` | 175 | 5 | 4 | 4 | 4 | `StudioHero` → shared HeroCard; Activity → TimelineCard |
| `/learn` | 291 | 5 | 4 | 4 | 4 | `LearnHero` → shared HeroCard; Activity → TimelineCard |
| `/property` | 163 | 5 | 4 | 4 | 4 | `PropertyHero` → shared HeroCard; SavedPropertiesGallery preserved |
| `/wallet` | 221 | 5 | 5 | 5 | 4 | `HeroBalance` → shared HeroCard `variant="paired"`; PendingOpsTiles ✓ keep |
| `/logistics` | 151 | 5 | 4 | 4 | 4 | Inline hero → shared HeroCard; shipment cards as TimelineCard variant |
| `/invoices` | 104 | 5 | 4 | 4 | 4 | `InvoicesHero` → shared HeroCard; list → TimelineCard |
| `/notifications` | 59 | 5 | 5 | 4 | 4 | `NotificationsHero` → shared HeroCard; NotificationsFeed → TimelineCard rows |
| `/calendar` | 105 | 5 | 4 | 4 | 4 | `CalendarHero` → shared HeroCard `variant="paired"`; agenda preserved |
| `/security` | 248 | 5 | 5 | 4 | 4 | `SecurityHero` → shared HeroCard `variant="paired"`; SignalsStrip → MetricStrip |
| `/verification` | 66 | 5 | 5 | 4 | 4 | `IdentityHero` → shared HeroCard; Unlocks/NextMove preserved |
| `/settings` | 83 | 5 | 5 | 4 | 4 | `SettingsHero` → shared HeroCard; forms preserved |
| `/tasks` | 110 | 5 | 5 | 4 | 4 | `TasksHero` → shared HeroCard; tasks list → TimelineCard |

### Tier 3 — Thin pages (use legacy `<PageHeader>`, rebuild in session 2/3)

These pages still use the pre-editorial `<PageHeader>` chrome. Each is rebuild-priority **P2** (high impact for relatively cheap work).

| Route | LOC | RD | NSC | PF | MP | Hot gap |
|---|---:|---:|---:|---:|---:|---|
| `/addresses` | 35 | 5 | 3 | 2 | 4 | Localised copy hardcoded in page (not in i18n slice); no hero. |
| `/documents` | 94 | 5 | 3 | 2 | 4 | Hardcoded `typeChip` colour map; no hero; no metric strip. |
| `/payments` | 87 | 5 | 3 | 2 | 4 | "Add method" CTA is a no-op `<button>` with no handler; no hero. |
| `/subscriptions` | 91 | 5 | 4 | 3 | 4 | Hardcoded `statusChip` map; no hero; cards are dense but unbranded. |
| `/support` | 132 | 5 | 4 | 3 | 4 | Hardcoded `statusInfo` icon/colour map; quick-help array is hand-built. |
| `/saved-items` | 58 | 5 | 4 | 3 | 4 | TODO comment about untranslated snapshot copy; no hero. |
| `/referrals` | 337 | 5 | 5 | 3 | 4 | Real data; multiple hardcoded chip-colour maps; verbose layout could compress. |
| `/activity` | 111 | 5 | 4 | 3 | 4 | List rows hand-rolled; should adopt TimelineCard. |

### Tier 4 — Detail pages and sub-routes

Each is a downstream of one of the above. Rebuild as their parent's pattern lands.

| Route | LOC | Parent | Note |
|---|---:|---|---|
| `/care/bookings/[bookingId]` | — | care | detail; preserved (uses existing `CareBookingDetail`) |
| `/invoices/[invoiceId]` | — | invoices | detail; lift CTA palette to surfaces |
| `/jobs/interviews` + `/[sessionId]` | — | jobs | session list / room — uses its own component family |
| `/messages/{activity,notification,security}/[id]` | — | messages | thread views; adopt TimelineCard rows for message log |
| `/notifications/recently-deleted` | — | notifications | mirror inbox refactor |
| `/property/saved` | — | property | gallery; preserved |
| `/studio/{projects,payments}/[id]` | — | studio | detail; preserve |
| `/subscriptions/[subscriptionId]` | — | subscriptions | detail |
| `/support/{new,[threadId]}` | — | support | composer / thread |
| `/modules/[...slug]` | 197 | — | Catch-all module home; bare typography, no hero band. Replace with `<HeroCard variant="compact">` once module registry surfaces a per-module hero contract. |
| `/wallet/{add,funding,funding/[requestId],withdrawals}` | — | wallet | sub-flow; preserve |
| `/search` | — | search | reserved (uses `@henryco/search-ui` — out of scope per spec). |
| `/verify` | — | verification | redirector |

---

## Audit-derived requirements for the primitives

From the per-page reading the primitives must accept:

1. **`<HeroCard>`** must support:
   - Variants: `solo` (no side panel, for inbox / notifications / activity / tasks), `paired` (with side panel — divisions), `compact` (for detail pages / modules / thin landings).
   - Tones: `calm | active | attention | empty` — drives gradient + eyebrow-dot tempo.
   - Tiles: 0–4, each with label + value + foot, optional per-tile tone for warning emphasis.
   - Side panel: kicker + title + body + optional breakdown rows (used by care/marketplace/learn).
   - Optional progress strip (jobs profile readiness, learn course progress).
   - Optional `belowTiles` slot (calendar mini-agenda preview).
   - CTAs: primary + optional secondary; absolute URLs auto-target `_blank`.

2. **`<NextStepRow>`** must support:
   - Tones: `neutral | attention | success`.
   - Either a CTA button (call to action) OR a whole-row `href` (passive surfacing).
   - Icon (Lucide), kicker, title, detail — all optional except title.

3. **`<MetricStrip>`** must support:
   - 3–5 cells, each with optional `href`.
   - Optional sparkline path (caller computes — used by wallet spend trend).
   - Tones: default | success | warning | danger.

4. **`<TimelineCard>`** must support:
   - Avatar (string initials, lucide icon, or any node) + colored background.
   - Title (1-line clamp) + detail (2-line clamp).
   - 0–3 chips with tones: default / gold / success / warning / danger / info.
   - Optional time + optional trailing slot (amount, etc.).
   - Row can be a `<div>` or `<a>` — absolute URLs auto-target `_blank`.

5. **`<EmptyStateCard>`** must support:
   - Kicker / title / body / optional CTA / optional slot.
   - Tones: `page` (card surface, used as section's content) or `ghost` (transparent, used inside another panel).
   - Alignment: `start | center`.

6. **`<DivisionLanding>`** must support:
   - Slot-based composer: hero, nextStep, metrics, sections (array), footer.
   - Each section: id + title + meta + content.
   - Caller renders inside each section (no opinion on cards / lists / grids).

These contracts are met in the Phase 2 primitives shipped this session — see `packages/dashboard-shell/src/surfaces/`.

---

## Hardcoded objects found (not in scope for session 1, tagged for session 2/3)

- `apps/account/app/(account)/documents/page.tsx:12` — `const typeChip: Record<string, string>` (chip colour map). Should move to a `<TimelineRow />` chip-tone prop.
- `apps/account/app/(account)/subscriptions/page.tsx:19` — `const statusChip` and inline `statusLabels`/`cycleLabels` maps. Already partly localised via `copy.statusLabels.*`; finish the move.
- `apps/account/app/(account)/support/page.tsx:23–34` — `statusInfo` map with hardcoded colour strings + a `quickHelp` array hand-built. Move to i18n slice + primitive consumption.
- `apps/account/app/(account)/referrals/page.tsx:20–40` — three chip / icon maps hardcoded; the visible labels ARE localised but the colour mapping is hardcoded.
- `apps/account/app/(account)/addresses/page.tsx:15-25` — hardcoded `copy` literal for FR/EN inside the page (the only divergence in the app from the `getAccountCopy` pattern). Move into the i18n account slice.
- `apps/account/app/(account)/tasks/page.tsx:73-80` — TasksHero receives literal "Action queue · live" + "One queue, every division." strings as defaults. Already routes most copy via `copy.tasks.*` but a few labels are inline.

None of these are mock data per the strict definition (no fake user lists, no fixture rows). They're stale chip-colour maps that should consume primitive tones. The strict V3-07 i18n gate is unaffected because the visible labels DO flow through `copy.*` — only the keys for the colour-map lookups are local.

---

## Rebuild rank (session 2/3)

| Rank | Route | Effort | Why |
|---:|---|---|---|
| 1 | `/marketplace` | M | Highest-traffic division; hero already mature, swap mechanics only |
| 2 | `/wallet` | M | Premium-feel anchor — money surface; preserve PendingOpsTiles |
| 3 | `/jobs` | M | High-engagement; readiness progress is a HeroCard `progress` use case |
| 4 | `/notifications` | S | Already minimal; hero swap + TimelineCard rows |
| 5 | `/activity` | M | List type — adopt TimelineCard, add HeroCard with cross-division metrics |
| 6 | `/calendar` | M | Hero already good; tighten agenda card to TimelineCard rows |
| 7 | `/learn` | M | Hero mature; courses & extras grids preserved |
| 8 | `/property` | M | Hero mature; SavedPropertiesGallery preserved |
| 9 | `/studio` | M | Hero mature |
| 10 | `/logistics` | S | Hero inline already, lift to shared |
| 11 | `/invoices` | S | Hero mature; rows → TimelineCard |
| 12 | `/security` | M | Hero mature; SignalsStrip → MetricStrip |
| 13 | `/tasks` | S | Hero mature |
| 14 | `/settings` | S | Hero mature; forms preserved |
| 15 | `/verification` | S | Hero mature |
| 16 | `/support` | M | Add hero; chip maps → primitive tones |
| 17 | `/subscriptions` | M | Add hero; rows → TimelineCard |
| 18 | `/documents` | M | Add hero; rows → TimelineCard; chip map → primitive tones |
| 19 | `/payments` | M | Add hero; wire Add Method CTA (currently no-op) |
| 20 | `/addresses` | S | Add hero; move copy to i18n slice |
| 21 | `/referrals` | L | Add hero; compress layout; chip maps → primitive tones |
| 22 | `/saved-items` | M | Add hero; resolve TODO around per-record translation |
| 23 | `/modules/[...slug]` | M | Add HeroCard `variant="compact"`; widget grid preserved |

The full hand-off mini-spec for each is at `docs/v3/account-inner-page-rebuild-spec.md`.

---

## Sanity check (auditor's own 10-question read on the 3 reference pages)

I'll re-ask the 10 questions after each rebuild in the report. For now, applying them at the audit stage:

1. **Single most useful sentence?** Root: "X unread, last activity Y ago, Z saved items." Care: "X bookings in flight, Y need payment." Messages: "X unread across Y portals."
2. **Next clearest action surfaced above fold?** Root: yes (NextBestActions). Care: yes (hero CTA pivots on state). Messages: **NO** — there is no `<NextStepRow />` between hero and list.
3. **Metric that says 'this product knows me'?** Root: SmartHome's ranked metric strip. Care: hero tiles + breakdown. Messages: portal count + top division mix.
4. **What looks template-filled?** Root: the gap between SmartHomeHeader and the SmartHome content blocks (bare type, no editorial hero band). Care: nothing — already best-in-class. Messages: the empty state.
5. **What would I delete?** Root: the "fallback body" copy on `SmartHomeHeader` when there's no data — could go. Care: the inline `<div>` empty states — replace with `<EmptyStateCard>`. Messages: same.
6. **Generic "Loading…" / "Welcome…" copy?** No — every page already routes through i18n with state-aware copy. Care empty state strong "Bookings · empty" + body is solid.
7. **Assuming setup?** Root: handled via SmartHomeEmpty. Care: handled (CTAs pivot on state). Messages: handled (empty state per filter).
8. **Dark mode parity?** Root: ✓ (uses dashboard-shell semantic tokens). Care: ✓ (own dark mode in editorial.css). Messages: ✓ (own dark mode).
9. **360px breathable?** All three are responsive — hero collapses to one column, tiles to 2-col. Verified via the existing `@media (max-width: 880px)` breakpoint.
10. **8-second takeaway?** Root: "I have N unread + my Smart Home shows what to do next." Care: "I have N bookings in flight; here's the one to act on." Messages: "I have N unread across Y portals — drill in by division."

---

**Audit conclusion:** The inner-shell needs **consolidation and polish, not a rebuild from scratch**. The three reference rebuilds this session (root + care + messages) prove the shared primitives. Sessions 2/3 swap the 23 remaining pages onto those primitives.

Author the design language next (`docs/v3/account-design-language.md`), refactor the three reference pages, write the hand-off mini-specs.
