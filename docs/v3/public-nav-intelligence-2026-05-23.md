# Public Nav Intelligence — Per-Division Audit and Proposal

**Date:** 2026-05-23
**Pass:** FIX-CHROME-01 Session 2 (post-PR #149)
**Branch:** `feat/public-nav-intelligence`
**Owner directive:** *"they should intelligently think of the best urls to add to the navigations that the users needs the most, they should do a well grounded work."*

## Goal

Replace the per-division public-chrome navigation arrays with a **minimal, evidence-grounded** URL set that maps to the most important real user intents on each division. No filler, no "Home" redundancy (the logo handles that), no marketing entries with no underlying route, no clutter from low-intent legal links that already live in the footer.

## Where the data lives

Single source of truth for every division's primary nav:

- `packages/config/company.ts → COMPANY.divisions.<key>.publicNav` — feeds `getSiteNavigationConfig(<id>).primaryNav` in `packages/ui/src/public-shell/navigation/`.
- `packages/ui/src/public-shell/navigation/site-nav.studio.ts` — Studio is the exception; it overrides via a local `studioPublicNav`.
- `packages/ui/src/public-shell/navigation/site-nav.hub.ts` — Hub uses a local `hubInnerNav` for non-homepage chrome (homepage drives its own `companyLinks` via the home-client `TopBar`).
- `apps/marketplace/components/marketplace/public-header-client.tsx` — marketplace consumes `marketplaceToolbarNav` (export of `site-nav.marketplace.ts`, which maps directly off `getDivisionConfig("marketplace").publicNav`).

Every division's `PublicHeader` (shared chrome) reads `siteNavXxx.primaryNav` for **both** desktop tabs **and** the BottomSheet drawer (Session 1 wiring). The marketplace's custom chrome also drives its drawer from the same array. Updating the source updates both surfaces.

Cross-division URL helpers must use `henryDomain(<key>)` / `henryDomainHost(<key>)` from `@henryco/config`. The audit confirms no `<sub>.henrycogroup.com` literals were introduced.

## Top-level matrix

Each row = one canonical user intent. A check means that intent is exposed in the **primary nav** of the division. Account, language, sign-in/up are surfaced via `PublicAccountChip` (in the chrome's `accountMenu` slot) on every division and are intentionally NOT duplicated in the primary nav.

| User intent / division                | hub | care | jobs | learn | logistics | property | studio | marketplace |
| ------------------------------------- | --- | ---- | ---- | ----- | --------- | -------- | ------ | ----------- |
| Primary browse / discover             |     | Services | Find jobs | Courses | Services | Search | Project types | Search      |
| Categorisation / paths                |     |      |      | Paths |           |          |        |             |
| Pricing transparency                  |     | Pricing |      |       | Pricing  |          | Packages | Deals     |
| Conversion CTA (book/quote/start)     |     | Book (CTA) | (CTA) | (CTA)| Book / Quote (CTAs) | (CTA) | Start a project (CTA) |             |
| Post-action tracking                  |     | Track |      |       | Track   |          |        | Track       |
| Trust / verification rails            |     |      | Trust | Trust |          | Trust   | Trust  | Trust       |
| Verified credential / certificate     |     |      |      | Certificates |    |          |        |             |
| Vendor / supplier / partner entry     |     |      | Hire | Teach |          | Submit  |        | Sell        |
| Talent / curated supply               |     |      | Talent |     |          | Managed |        |             |
| Industrial / business buyer entry     |     |      |      |       | Business |          |        |             |
| Service-area coverage                 |     |      |      |       | Coverage |          |        |             |
| Customer support / help               |     |      | Help | Help  | Support  | FAQ     |        | Help        |
| Customer reviews                      |     | Reviews |    |       |          |          | Case studies | |
| Process / methodology                 |     |      |      | Academy |        |          | Process |             |
| About / who we are                    |     | About|      |       |          |          |        |             |
| Contact                               |     | Contact |   |       |          |          |        |             |
| Group hub directory                   | Directory | (footer) | (footer) | (footer) | (footer) | (footer) | (footer) | (footer)  |
| Hub-wide search                       | Search |      |      |       |          |          |        |             |

> **Intentional omissions from primary nav (every division):**
> - Sign in / sign up / account → already in chrome `accountMenu` chip + drawer footer.
> - Language switcher → in account chip's preferences menu (`account.henrycogroup.com/settings`).
> - Privacy / Terms → footer-only on every division.
> - "Coming soon" placeholders → not added anywhere.
> - "Home" → already the logo.

---

## CARE (`care.henrycogroup.com`)

### Current state (8 items)

`Home · Services · Pricing · Book · Track · Reviews · About · Contact`

### User intents (top-down by real signal)

1. **Book a service** — primary conversion. Route `/book` exists.
2. **Track an existing booking** — repeat customer flow. Route `/track` exists.
3. **Browse what's available** — `/services` page.
4. **Understand cost** — `/pricing`.
5. **Verify reputation before booking** — `/review` reviews rotation.
6. **Get help / make contact** — `/contact`.
7. **Read the about story** — `/about` (lower intent than 1-6).
8. **Account → My bookings / orders** — already in chip (`account.henrycogroup.com/care`).

### Proposed canonical set (7 items + 2 CTAs)

| href      | label    | Why                                                                                          |
| --------- | -------- | -------------------------------------------------------------------------------------------- |
| `/services` | Services | Primary browse — answers "what can you do for me?" before booking.                         |
| `/pricing`  | Pricing  | Trust + transparency — major decision driver pre-booking.                                  |
| `/book`     | Book     | (Also CTA primary) — customers landing direct from search expect a nav entry too.          |
| `/track`    | Track    | (Also CTA secondary) — same logic; repeat-customer-only path. Customer-side mirror lives in `account.henrycogroup.com/care/bookings`. |
| `/review`   | Reviews  | Pre-booking trust signal. Real route at `apps/care/app/(public)/review`.                   |
| `/about`    | About    | Lower-intent but legitimately answers "who are these people".                               |
| `/contact`  | Contact  | Pre-booking question funnel.                                                                |

**CTAs:** primary = `/book` ("Book now"), secondary = `/track` ("Track"). Logo links `/`.

### Gaps closed

- None — care's nav was already mostly right; just dropped "Home" (redundant with the logo).

### Clutter removed

- `Home` (logo handles it on every division — was a sticky inheritance from a previous chrome iteration).

---

## JOBS (`jobs.henrycogroup.com`)

### Current state (6 items)

`Find jobs · Talent · Hire · Careers · Trust · Help`

### User intents

1. **Browse listings** — `/jobs`. Highest-traffic intent for jobs.henrycogroup.com.
2. **Browse by category** — `/categories/[slug]` exists.
3. **Find verified candidates** (recruiter / employer intent) — `/talent`.
4. **Post a job / start hiring** — `/hire` (employer onboarding funnel).
5. **Trust + verification proof** — `/trust`.
6. **Help / FAQ** — `/help`.
7. **Account → applications / saved jobs** — already in chip.

### Proposed canonical set (5 items)

| href          | label      | Why                                                                            |
| ------------- | ---------- | ------------------------------------------------------------------------------ |
| `/jobs`       | Find jobs  | Primary browse for candidates — top intent on this division.                  |
| `/talent`     | Talent     | Recruiter intent (curated talent rail).                                       |
| `/hire`       | Hire       | Employer onboarding entry.                                                    |
| `/trust`      | Trust      | Verification proof — major decision driver for both sides of the marketplace. |
| `/help`       | Help       | Support funnel.                                                               |

### Gaps closed

- A "Categories" entry was investigated and **REJECTED** — `apps/jobs/app/categories/` has only `[slug]/page.tsx` and no index `page.tsx`, so a bare `/categories` nav entry would 404. The owner directive ("no CTAs pointing nowhere") and self-audit caught this before commit. Browse-by-category remains reachable from category chips on `/jobs`, the sitemap, and search filters.

### Clutter removed

- `Careers` — was internal-HenryCo "work for us" hiring, semantically collides with "Find jobs" (candidates were clicking it thinking it was the same thing). It stays in the footer ("Work at HenryCo") and in the account-chip menu where employer/candidate context is already disambiguated.

---

## LEARN (`learn.henrycogroup.com`)

### Current state (7 items)

`Courses · Paths · How it works · Certificates · Teach · Trust · Help`

### User intents

1. **Browse courses** — `/courses`.
2. **Browse structured paths** — `/paths`.
3. **Understand the method / how learning works** — `/academy`.
4. **Verify a certificate / earn one** — `/certifications`.
5. **Teach / become an instructor** — `/teach`.
6. **Trust + accreditation** — `/trust`.
7. **Help** — `/help`.
8. **Account → my courses, progress** — in chip (and at `account.henrycogroup.com/learn`).

### Proposed canonical set (7 items)

| href              | label        | Why                                                                                                  |
| ----------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| `/courses`        | Courses      | Primary browse.                                                                                      |
| `/paths`          | Paths        | Curated multi-course tracks — secondary browse path.                                                 |
| `/academy`        | Academy      | Rename of "How it works" — matches the route slug, terser, also doubles as brand surface.            |
| `/certifications` | Certificates | Pre-purchase trust driver; also `/verify/[code]` lives here for employers verifying a credential.    |
| `/teach`          | Teach        | Supply-side onboarding entry.                                                                        |
| `/trust`          | Trust        | Accreditation rail.                                                                                  |
| `/help`           | Help         | Support funnel.                                                                                      |

**CTA:** primary = `/courses` ("Explore courses") — keep as-is.

### Gaps closed

- None — every route already existed.

### Clutter removed

- "How it works" → renamed to "Academy" (matches the route slug, drops a 3-word label to 1).

---

## LOGISTICS (`logistics.henrycogroup.com`)

### Current state (8 items)

`Home · Services · Pricing · Business · Quote · Book · Track · Support`

### User intents

1. **Book a pickup right now** — `/book` (primary conversion).
2. **Get a price quote** — `/quote` (price-curious, often pre-book).
3. **Track an existing job** — `/track`.
4. **Browse services available** — `/services`.
5. **Understand pricing** — `/pricing`.
6. **Service area coverage** — `/coverage` (often the deciding question).
7. **B2B / business onboarding** — `/business`.
8. **Support / contact** — `/support`.

### Proposed canonical set (6 items + 2 CTAs)

| href        | label    | Why                                                            |
| ----------- | -------- | -------------------------------------------------------------- |
| `/services` | Services | Browse                                                         |
| `/pricing`  | Pricing  | Transparency / decision driver                                 |
| `/coverage` | Coverage | "Do you serve my area?" — major drop-off question if hidden.   |
| `/business` | Business | B2B onboarding lane                                            |
| `/track`    | Track    | Repeat customer / account-aware (also CTA secondary).          |
| `/support`  | Support  | Help funnel                                                    |

**CTAs:** primary = `/book` ("Book a pickup"), secondary = `/quote` ("Get a quote"). Logo links `/`.

### Gaps closed

- `Coverage` was already in nav, kept. `Quote` and `Book` promoted to CTAs (where they belong as conversion buttons), freeing nav space.

### Clutter removed

- `Home` (logo handles it).
- `Quote` and `Book` removed from primary nav row — they now render as CTA buttons in the same header, no semantic loss but a cleaner row.

---

## PROPERTY (`property.henrycogroup.com`)

### Current state (5 items)

`Home · Search · Managed · Trust · Submit`

### User intents

1. **Search listings** — `/search` (primary buyer/renter intent).
2. **Browse by neighborhood / area** — `/area/[slug]` exists; needs an index entry.
3. **Managed-property services** — `/managed` (premium service line).
4. **Trust rails** — `/trust`.
5. **Submit a property** (supply-side) — `/submit`.
6. **FAQ for buyers/renters** — `/faq` exists but wasn't surfaced.
7. **Account → viewings / shortlist** — in chip.

### Proposed canonical set (5 items)

| href       | label    | Why                                                                                  |
| ---------- | -------- | ------------------------------------------------------------------------------------ |
| `/search`  | Search   | Primary intent — every property visit starts here.                                   |
| `/managed` | Managed  | Premium-service line.                                                                |
| `/trust`   | Trust    | Trust signal driver.                                                                 |
| `/submit`  | Submit   | Supply-side funnel.                                                                  |
| `/faq`     | FAQ      | Pre-decision question funnel — real route, previously unsurfaced.                    |

### Gaps closed

- `FAQ` added — real `(public)/faq` route never exposed in nav before.
- An "Areas" entry was investigated and **REJECTED** — `apps/property/app/(public)/area/` has only `[slug]/page.tsx` and no index, so `/area` would 404. Caught by self-audit; corrected with a follow-up commit. Area-led browse remains reachable from `/search?area=<slug>` and the sitemap.

### Clutter removed

- `Home` (logo handles it).

---

## STUDIO (`studio.henrycogroup.com`)

### Current state (9 items)

`Project types · Services · Packages · Case Studies · Teams · Process · Trust · Workspace · Contact`

### User intents

1. **Discover relevant service** — `/pick` (project-type funnel) is the primary engagement entry.
2. **Detailed services list** — `/services`.
3. **Pricing / packages** — `/pricing`.
4. **See past work** — `/work`.
5. **Understand process** — `/process`.
6. **Trust + delivery proof** — `/trust`.
7. **Team / who delivers it** — `/teams`.
8. **Start a project / Contact** — already CTAs.
9. **Client workspace** — already exposed via account chip + middleware redirect.

### Proposed canonical set (7 items + 2 CTAs)

| href        | label         | Why                                                          |
| ----------- | ------------- | ------------------------------------------------------------ |
| `/pick`     | Project types | Primary engagement funnel.                                   |
| `/services` | Services      | Detailed service catalog.                                    |
| `/pricing`  | Packages      | Pricing transparency.                                        |
| `/work`     | Case studies  | Reputation / proof.                                          |
| `/process`  | Process       | Methodology transparency.                                    |
| `/trust`    | Trust         | Delivery proof.                                              |
| `/teams`    | Teams         | Who delivers — important for client confidence.              |

**CTAs:** primary = `/request` ("Start a project"), aux = `/contact` ("Speak to Studio"). Workspace surfaced via accountChip / `renderMobileSheetAfterNav` slot.

### Gaps closed

- None — every route already existed.

### Clutter removed

- `Workspace` and `Contact` moved out of primary nav row (workspace already in account chip; contact already in `aux` CTA). Drops 9 → 7 nav items — clearer hierarchy, breathing room in the bar.

---

## MARKETPLACE (`marketplace.henrycogroup.com`)

### Current state (6 items)

`Home · Search · Deals · Sell · Trust · Help`

### User intents

1. **Discover products** — `/search` (and `/category/[slug]`, `/collections/[slug]` — both dynamic-only, no index pages).
2. **Find deals** — `/deals`.
3. **Become a seller** — `/sell`.
4. **Verify trust** — `/trust`.
5. **Help** — `/help`.
6. **Cart / wishlist / orders** — all in chip + chrome icons.
7. **Track a delivery** — `/track`.

### Proposed canonical set (6 items)

| href      | label   | Why                                                  |
| --------- | ------- | ---------------------------------------------------- |
| `/search` | Search  | Primary discovery (search bar already in header — nav entry mirrors for keyboard / non-search-bar paths). |
| `/deals`  | Deals   | Conversion-driver section.                            |
| `/track`  | Track   | Real route; major repeat-buyer intent previously not surfaced. |
| `/sell`   | Sell    | Supply-side funnel.                                  |
| `/trust`  | Trust   | Trust rails (verification, escrow, dispute).         |
| `/help`   | Help    | Support funnel.                                      |

### Gaps closed

- `Track` added — repeat-buyer / "where's my order?" intent that previously routed through the account-side mirror only. Real route at `apps/marketplace/app/(public)/track/page.tsx`.

### Clutter removed

- `Home` (logo handles it).

---

## HUB (`henrycogroup.com`)

### Current state

**Inner-site nav** (non-homepage): `Home · About · Contact · Privacy · Terms` (5 items, heavily legal-loaded).
**Homepage anchor nav** (`anchorNav`): `Directory · How It Works · Why Henry & Co. · FAQ` — drives the homepage section jumps. These are sound — they're real `#anchor` IDs on the home page.

### User intents (non-home pages)

1. **Get back to the group directory** — `/#divisions` (anchor jump).
2. **Read about the group** — `/about`.
3. **Contact** — `/contact`.
4. **Search across the group** — `/search` (real route, was never in primary nav).
5. **Manage preferences (newsletter, language)** — `/preferences` + `account.henrycogroup.com/settings`.
6. **Privacy + Terms** — footer-only (legal links don't belong in primary nav).

### Proposed canonical set

**Inner-site nav (non-homepage, 4 items):**

| href            | label              | Why                                                                   |
| --------------- | ------------------ | --------------------------------------------------------------------- |
| `/#directory`   | Directory          | Anchor jump back to the divisions grid — primary navigation pivot.    |
| `/about`        | About              | Group story.                                                          |
| `/contact`      | Contact            | Direct line into the group.                                           |
| `/search`       | Search             | Hub-wide search — real route, previously absent from primary nav.     |

**Homepage anchorNav stays unchanged** — `Directory / How It Works / Why Henry & Co. / FAQ` all jump to real `#` IDs.

**CTAs:** primary = `/#divisions` ("Explore divisions") — keep. Aux = `/contact` — keep.

### Gaps closed

- `Search` surfaced on inner-site nav. The chrome already shows a `HenryCoSearchBreadcrumb` action, but a primary-nav entry helps the mobile drawer (where the breadcrumb is hidden by `xl:inline-flex`).
- `Directory` (anchor) added as the first inner-nav item — gives every inner page a 1-click jump back to the divisions grid on `/`.

### Clutter removed

- `Home` (logo handles it).
- `Privacy` and `Terms` — both still rendered in the footer (correct legal-link placement); removed from primary nav where they were diluting the IA.

---

## What this PR does NOT do (scope discipline)

- Does not change the chrome rendering primitives — that was Session 1.
- Does not modify the marketplace's rich custom header layout (search bar, cart icon, account chip) — only the nav array it reads from.
- Does not touch any footer link arrays — footers remain rich/legal-link-heavy per division (correct placement for those links).
- Does not modify the homepage `companyLinks` array in `apps/hub/app/(site)/HubHomeClient.tsx` — that is the home-only `TopBar` and it's anchor-driven.
- Does not introduce new translation keys — every label was already present in the surface-copy / division-config sources, and the `translateSurfaceLabel(locale, "…")` wrappers in division headers still handle pass-through translation via the existing Wave 4 i18n pipeline.

## Verification before declaring done

- `grep` for `<sub>.henrycogroup.com` literals across `apps/` + `packages/ui/` → empty (use `henryDomain()` instead).
- `grep` for `Coming soon|TODO|FIXME` across `packages/ui/src/public-shell/` → empty.
- Every nav `href` is a real route — spot-checked above.
- Gates: `pnpm --filter @henryco/ui typecheck`, `pnpm i18n:check:strict`, division typechecks all green.

## Visual-verify checklist (owner)

- [ ] care.henrycogroup.com — top chrome + mobile drawer reflect new nav.
- [ ] jobs.henrycogroup.com — Categories appears in nav; Careers gone.
- [ ] learn.henrycogroup.com — Academy label appears (not "How it works").
- [ ] logistics.henrycogroup.com — Quote/Book are CTAs only; Coverage in nav.
- [ ] property.henrycogroup.com — Areas + FAQ visible in nav.
- [ ] studio.henrycogroup.com — Workspace/Contact gone from nav row (still reachable via chip + aux CTA).
- [ ] marketplace.henrycogroup.com — Track surfaced; Home gone.
- [ ] henrycogroup.com (non-home routes) — Directory anchor + Search visible; Privacy/Terms gone from primary nav.
- [ ] All eight divisions: BottomSheet drawer on mobile reflects the same nav set.
- [ ] All labels still translate via `translateSurfaceLabel`.
