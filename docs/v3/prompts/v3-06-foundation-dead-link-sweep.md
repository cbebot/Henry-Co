# V3-06 — Foundation Lock: Dead-Link Sweep

> **STATUS: SHIPPED — PR #165.** This pass is merged and certified on `main`. This document is the elevated canonical spec and closure record. The `## Mandatory scope` sections describe scanners, fixes, and the CI gate that LANDED. Re-running the scanner is the way to surface any residual DEAD/LEGACY link a re-audit finds; do **not** rebuild the scanners from zero.

**Pass ID:** V3-06  ·  **Phase:** B (Foundation Lock)  ·  **Pillar:** P12 (Global)
**Dependencies:** V3-05  ·  **Effort:** M  ·  **Parallel-safe:** Y (with other Wave-2 passes)
**Owner gate:** none  ·  **Risk class:** —

---

## Role
You are the V3 Foundation engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass enforces "no dead links": every `href`, `<Link>`, `redirect()`, and `router.push()` in shipped code resolves to a real route on a real app on a real deploy — cross-division links especially, anchor links, and buttons that look navigable but lead nowhere. The line you must not cross: you fix or *delete* broken paths and add a CI gate; you do **not** redesign navigation IA or audit whether a card "opens the exact next step" (that is V3-11), and every cross-division URL you touch must route through the `@henryco/config` helpers — never a hardcoded domain.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/06-dead-link-sweep` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
The owner anti-pattern is "no dead links." The Phase-A baseline (`docs/v3/AUDIT-BASELINE.md` §3.6) noted the inventory was not yet exhaustively scanned, with known legacy issues around the Fabric Care booking link (`/care?booking=`) and many paths closed by the V3 PASS 21 + 22 division rebuilds. The codebase already exposes typed URL builders in `@henryco/config` — `henryDomain(division, path)`, `henryWebRoot(path)`, `henrySubdomain(host, path)` (in `packages/config/domain.ts`), plus `getAccountUrl()` / `getHubUrl()` / `getDivisionUrl()` from `company.ts`. The gap this pass closed: there was no machine catalog of every link, no resolution of those links against each app's real route table, and no CI gate preventing a newly-introduced dead link from shipping. V3-05 had to close first so the live walk extracts `href`s from stable, real first-paint HTML rather than from theater-copy placeholders.

## Mandatory scope

### S1 — Static catalog of every navigable target (SHIPPED)
A scanner walks `apps/` and `packages/` (excluding `node_modules`, `dist`, `.next`, and `packages/search-ui` per the owner reservation) for `href=`, `<Link href=`, `redirect(`, `router.push(`, and notification `action_url:` fields. It extracts every URL pattern, resolves dynamic segments (route params, template strings) to a normalized pattern, and emits a machine catalog: `{ source: 'file:line', pattern: '/route/[param]', static: true|false }`.

### S2 — Route table per app (SHIPPED)
For each of the 10 web apps, the scanner walks `apps/<app>/app/**/page.tsx` (and route groups) to produce the full route table, including linked-to API routes. One JSON table per app under `scripts/v3/route-tables/<app>.json`, regenerable from the file tree.

### S3 — Resolve every target against the route tables (SHIPPED)
Each catalogued pattern is mapped to its target app (by subdomain, by `henryDomain()` division, or by relative path within the current app) and looked up in that app's route table, then classified:
- **OK** — resolves to a real route.
- **DEAD** — no matching route in any app.
- **LEGACY** — matches an old pattern that was renamed (e.g. `/care?booking=` → `/care/bookings/<id>`).
- **DYNAMIC-MAYBE** — pattern has dynamic params; needs a runtime (live-walk) check.

Categorized results land in `scripts/v3/dead-link-report.md`.

### S4 — Fix every DEAD (SHIPPED)
For each DEAD link: either correct the path or remove the link **and** the orphan UI that promised the missing destination. Replacements use the typed builders (`henryDomain()` / `henryWebRoot()` / `getAccountUrl()` etc.) — never string-concatenated or hardcoded `henrycogroup.com` URLs.

### S5 — Fix every LEGACY (SHIPPED)
For each LEGACY link: update to the current pattern. Links historically embedded in `customer_notifications` payloads defer to the V3-03 notification-link backfill (`scripts/v3/notification-link-backfill.mjs`) rather than being rewritten in place here.

### S6 — Live-walk verification (SHIPPED)
After the static fixes, a live walk crawls the top ~30 routes per canonical domain (homepage + main flows + auth surfaces), extracts every `href` from the rendered HTML, issues an HTTP HEAD to each, and catalogs any 404/5xx to `scripts/v3/live-walk-report.tsv`. The walk is rate-limited so it does not trip our own rate limits, respects `robots.txt` for any external link (internal links exempt), and resolves every domain through `@henryco/config` — no literal domain in the runner.

### S7 — Cross-division link audit (SHIPPED)
The highest-leverage links for user trust are verified specifically end-to-end on live: account → division dashboards, hub home → division homes, marketplace nav → other divisions, and email footers → support/privacy/terms. Each must return 200 OK on the live walk.

### S8 — Anchor-link audit (SHIPPED)
For every `<a href="#anchor">` and `Link href="/path#anchor"`, the scanner verifies the target page actually renders an element with that `id`. Anchors orphaned by redesigns are fixed or removed.

### S9 — Button-disguised-as-link audit (SHIPPED)
Buttons that look navigable but have no `onClick`/`href` are either wired to a real action, removed, or restyled so they no longer read as links. This is the link-resolution slice only; the deeper "does this card open the exact next step?" judgement is V3-11.

### S10 — CI gate (SHIPPED)
The static scan runs on every PR via `.github/workflows/dead-link.yml` and fails CI if a new DEAD or LEGACY link is introduced. This is the durable guard that keeps the foundation clean after the one-time sweep.

## Out of scope
- "Does this card/button/summary open the exact next step?" judgement — **V3-11** (one-job-per-card).
- Empty-state CTA design and dashboard truth — **V3-08** (empty-dashboard-truth).
- Hardcoded user-facing text + the `henrycogroup.com` literal sweep — **V3-07** and **V3-07c**.
- Universal-link / deep-link round-trip correctness — **V3-04** (deep-links); this pass consumes its typed builders.

## Dependencies
- **Deps:** V3-05 (kill-loading-theater) — must close first so the live walk reads stable real HTML.
- **Blocks:** V3-11 (one-job-per-card) builds on this clean link baseline; V3-94 (closure integration test) re-runs this walk as a regression.

## Inheritance
- `@henryco/config` typed URL builders — `henryDomain` / `henryWebRoot` / `henrySubdomain` (`packages/config/domain.ts`) + `getAccountUrl` / `getHubUrl` / `getDivisionUrl` (`company.ts`). Used for every fix and every domain reference in the runners.
- V3-04 deep-link builders for any auth-round-trip / share links touched.
- `scripts/v3/notification-link-backfill.mjs` (V3-03) — owns notification-embedded LEGACY links.
- Existing per-app route trees under `apps/<app>/app/`.

## Implementation requirements

### Files
- `scripts/v3/dead-link-scan.mjs` (the S1 static catalog scanner).
- `scripts/v3/live-walk.mjs` (the S6 live crawler).
- `scripts/v3/route-tables/<app>.json` (10 regenerable route tables).
- `scripts/v3/dead-link-report.md` + `scripts/v3/live-walk-report.tsv` (outputs).
- `.github/workflows/dead-link.yml` (the PR CI gate).
- Per-app fixes for every DEAD + LEGACY link.
- **No migrations. No RLS changes. No env changes.**

### Trust / safety / compliance
- The live walk respects `robots.txt` for external links; internal links exempt.
- Rate-limit the walk to avoid self-inflicted rate limiting during CI.
- ANTI-CLONE: the route-table catalog is an internal artifact — it is not published.
- Payment routes (`apps/account/.../wallet`, payment-surface flows) are link-verified but never behaviourally modified by this pass.

### Mobile + desktop parity
- Mobile-specific universal links are verified per V3-04. Web mobile + desktop nav links walked. Expo super-app deep links validated by V3-04/V3-87; this pass covers web hrefs.

### i18n
- No new user-facing strings are expected. If a removed dead-link leaves an orphan CTA whose surrounding copy must change, the replacement copy routes through `@henryco/i18n` under the owning surface namespace (`surface:<area>`) — never hardcoded.

### Brand & design system
- Any visible link label that changes uses an `@henryco/i18n` label and resolves brand strings from `@henryco/config` (Henry Onyx; division = "Henry Onyx <Division>"). Restyled buttons (S9) use locked design-system tokens (`--site-*` / `--accent`), light + dark, CLS ≈ 0.

## Validation gates
1. **CI** — typecheck + lint + test + build green; the new `dead-link.yml` job passing.
2. **Static scan** — `node scripts/v3/dead-link-scan.mjs` returns ZERO DEAD and ZERO LEGACY in non-deferred code paths.
3. **Live walk** — `node scripts/v3/live-walk.mjs` across the top ~30 routes per domain returns zero 404/5xx on internal hrefs; cross-division links (S7) all 200.
4. **CI gate proof** — a deliberate dead link in a throwaway branch fails `dead-link.yml` (then reverted).
5. **No-domain-literal check** — the scanners and any fixed link reference domains only via `@henryco/config`; `grep` for `henrycogroup.com` literals in touched files returns nothing new (the bulk literal sweep is V3-07c).

## Deployment gate
- All gates green; the live-walk report reviewed; the CI gate active and proven. Behaviour-affecting-on-navigation pass → a short live soak watching for new 404s in observability before declaring closed.

## Final report contract
`.codex-temp/v3-06-dead-link-sweep/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion), plus the dead-link report and the live-walk report.

## Self-verification
- [ ] S1 static scanner produces a machine catalog of every navigable target.
- [ ] S2 route table generated for all 10 apps.
- [ ] S3 every target classified OK / DEAD / LEGACY / DYNAMIC-MAYBE.
- [ ] S4 every DEAD link fixed or removed (with its orphan UI).
- [ ] S5 every LEGACY link updated; notification-embedded ones deferred to V3-03 backfill.
- [ ] S6 live walk crawls all 10 production domains, zero internal 404/5xx.
- [ ] S7 cross-division links specifically verified 200 on live.
- [ ] S8 anchor links verified against real `id`s.
- [ ] S9 button-disguised-as-link instances resolved.
- [ ] S10 `dead-link.yml` CI gate active and proven to fail on a new dead link.
- [ ] Domains via `@henryco/config` only; brand via `@henryco/config`; any changed copy via `@henryco/i18n`.
- [ ] Report written. Hand-off named: V3-11 (one-job-per-card).
