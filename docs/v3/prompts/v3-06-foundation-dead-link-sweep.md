# V3-06 — Foundation: Dead-Link Sweep

**Pass ID:** V3-06
**Phase:** B (FOUNDATION LOCK)
**Pillar:** P12 (Global)
**Dependencies:** V3-05 (kill loading theater)
**Effort:** M (1–2 weeks)
**Parallel-safe:** YES (with other Wave 2 passes)
**Owner gate:** None
**Risk class:** None

---

## Role

You are the V3 Foundation engineer for HenryCo. You execute exactly this one pass, then stop and report.

This pass enforces "no dead links" — every `href=` in every shipped page resolves to a real route on a real app on a real deploy. Cross-division links specifically. Anchor links to non-existent sections. Buttons that pretend to do things but lead nowhere.

---

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/06-dead-link-sweep` |
| Deploy | Vercel (10 web projects) |
| OS context | Windows + bash; pnpm 9.15.5; Node 24.x |

---

## Audit summary (lifted from AUDIT-BASELINE.md §3.6)

> ### 3.6 Dead links
> - **Inventory:** not yet exhaustively scanned
> - **Known:** PRODUCT-GAP-LEDGER named legacy care booking link issues; PASS 21 + 22 closed many

Owner anti-pattern: "no dead links".

---

## Mandatory scope

### S1 — Static catalog of every `href`

Build a script `scripts/v3/dead-link-scan.mjs`:
- Recursively scan `apps/` and `packages/` for `href=`, `<Link href=`, `redirect(`, `router.push(`, `action_url:` etc.
- Extract every URL pattern.
- Resolve dynamic segments (route variables, template strings) to URL patterns.
- Output `scripts/v3/dead-link-catalog.json` with `{ source: 'file:line', pattern: '/route/[param]', static: true|false }`.

### S2 — Route table per app

For each of the 10 web apps:
- Walk `apps/<app>/app/**/page.tsx` and produce the full route table.
- Include API routes if they're linked-to.

Output `scripts/v3/route-tables/<app>.json`.

### S3 — Resolve every href against route tables

For each href pattern in the catalog:
- Determine target app (by subdomain or relative path).
- Look up in the target app's route table.
- Classify:
  - **OK** — resolves to a real route.
  - **DEAD** — no matching route in any app.
  - **LEGACY** — matches an old pattern that was renamed (e.g., `/care?booking=` → `/care/bookings/<id>`).
  - **DYNAMIC-MAYBE** — pattern has dynamic params; needs runtime check.

Output `scripts/v3/dead-link-report.md` with categorized results.

### S4 — Fix every DEAD

For every link classified DEAD:
- Either fix the link (correct the path) or remove the link (and any orphan UI that suggested the missing destination).
- Cross-reference V3-04 (deep links) for typed builders — use them now instead of string-concat URLs.

### S5 — Fix every LEGACY

For every link classified LEGACY:
- Update to the current pattern.
- For any link that's been historically embedded in customer_notifications, defer to V3-03 S4 backfill (already addressed there).

### S6 — Live walk verification

After static fixes, run a live walk:
- For each canonical domain, crawl the top 30 routes (homepage + main flows + auth surfaces).
- For each page, extract every `href`.
- HTTP HEAD each href.
- Catalog any 404 or 5xx.

Use `scripts/v3/live-walk.mjs`:
- Iterates the route table.
- For each route, fetches HTML and extracts hrefs.
- HEAD-checks each href.
- Outputs `scripts/v3/live-walk-report.tsv`.

If V3-BACKLOG A1 (Playwright runner) is shipped before this pass, integrate that runner.

### S7 — Cross-division link audit

Specifically verify cross-division links (account → care, hub → marketplace, etc.) since these are highest-leverage for user trust:

- Account dashboard links to division dashboards.
- Hub home links to division homes.
- Marketplace nav links to other divisions.
- Email footers link to support + privacy + terms.

For each cross-division link, the live walk must return 200 OK.

### S8 — Anchor-link audit

Some pages link to `#section` anchors that no longer exist after redesigns. Detect:
- For every `<a href="#anchor">` or `Link href="/path#anchor"`, verify the target page actually has `<section id="anchor">` or `id="anchor"`.

### S9 — Button-disguised-as-link audit

Some buttons LOOK like they should navigate but don't. Find buttons with no `onClick` or no `href` but with link-style appearance. Either:
- Wire them to a real action.
- Remove them.
- Style them so they don't look like links.

This audit specifically respects the owner's "every card / button / summary module should open the exact next step" question (handled fully in V3-11).

### S10 — CI gate

Add `scripts/v3/dead-link-scan.mjs` as a CI step:
- Runs on every PR.
- Fails CI if any new DEAD or LEGACY links are introduced.

---

## Out of scope

- Per-card "does this open the exact next step?" audit (V3-11).
- Empty-state CTA design (V3-08).
- Hardcoded text cleanup (V3-07).

---

## Dependencies

- V3-05 (kill loading theater) — must close first so the live walk gets stable HTML.

Blocks:
- V3-11 (one-job-per-card) — builds on this clean baseline.
- V3-94 (V3 integration test) — re-runs this walk.

---

## Inheritance

- `@henryco/seo` deep-link builders from V3-04 — use during fixes.
- Existing route tables in each app.

---

## Implementation requirements

### Files

- `scripts/v3/dead-link-scan.mjs` (new)
- `scripts/v3/live-walk.mjs` (new)
- `scripts/v3/route-tables/<app>.json` (new — 10 files; can be regenerated)
- `scripts/v3/dead-link-report.md` (new — output)
- `scripts/v3/live-walk-report.tsv` (new — output)
- Per-app fixes for every DEAD + LEGACY link

### CI integration

`.github/workflows/dead-link.yml` (new):
- Triggers on PR.
- Runs `dead-link-scan.mjs`.
- Fails on new DEAD/LEGACY.

---

## Trust / safety / compliance

- The walk respects robots.txt for any external links — internal links are exempt.
- Rate-limit the live walk to avoid hitting our own rate limits during CI.
- ANTI-CLONE: the route table catalog is internal-only — don't publish it.

## Mobile + desktop parity

- Mobile-specific links (universal links) verified per V3-04.

## i18n

- No new strings expected.

---

## Validation gates

1. Standard CI.
2. **Dead-link scan returns ZERO DEAD/LEGACY** in non-deferred code paths.
3. **Live walk** of top 30 routes per app returns zero 404/5xx on internal hrefs.
4. CI gate active on PRs.

## Deployment gate

- All gates pass.
- Live walk report reviewed.
- 24-hour soak.

## Final report contract

`.codex-temp/v3-06-dead-link-sweep/report.md` with the standard 9 sections + the dead-link report + live-walk report.

---

## Self-verification

- [ ] Static scan script produces machine-readable catalog.
- [ ] Live walk script crawls 10 production domains.
- [ ] Every DEAD link fixed or removed.
- [ ] Every LEGACY link updated.
- [ ] CI gate active.
- [ ] Cross-division links specifically verified.
- [ ] Report written. Hand-off named: V3-11 (one-job-per-card).
