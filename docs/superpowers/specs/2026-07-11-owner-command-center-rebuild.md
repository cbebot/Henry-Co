# Owner Command Center — Rebuild Spec (Phase A)

**Date:** 2026-07-11 · **Program:** Founder Command Center (owner directive 2026-07-10)
**Predecessors:** `2026-07-10-founder-command-center-program.md` (F1–F3 shipped, F4–F6 open),
`2026-07-10-redesign-final-token-consolidation.md` (slices C/D/E open), handoff
`docs/handoffs/2026-07-11-owner-command-center-rebuild-handoff.md`.
**Evidence:** 7-agent study `wf_7fdede48-efd` (2026-07-10) + 7-agent delta study
`wf_5e73bf10-955` (2026-07-11, on main `f8feb51e`, adversarially verified).

## 0. Mandate

Rebuild the owner command center (`apps/hub` owner surfaces) to the highest standard —
the console that governs the ENTIRE ecosystem (7 divisions + account + staff). Both themes
correct by construction. Playwright-verified page by page with the owner logged in. Raw
data layers extracted and rebuilt. Deep-link hygiene (retire nonsense, add detail views).
The desktop founder AI becomes a persistent command surface, not a corner FAB.
Cross-division unification slices C/D/E ride the re-skin. Nothing on the keep-list breaks.

## 1. Verdict on the current state (what the rebuild actually is)

The command center is REAL: 38 `(command)` pages + login/no-access, zero orphan routes,
zero dead buttons, zero inline Supabase queries in pages — every page reads
`apps/hub/lib/*`. The owner's "raw Supabase tables, roughly built" impression traces to
FIVE precise defects, all verified:

1. **Raw-row rendering.** Lib functions return untyped `JsonRecord`s that pages
   `String()`-cast: `settings/security` prints bare `user_id` UUIDs and `"true"/"false"`
   (page.tsx:29-31) despite an identity map existing; `messaging/queues` dumps ~200 merged
   queue rows incl. raw recipient PII with no pagination/empty state; `settings/audit`
   prints raw ISO timestamps and machine action strings.
2. **Sampled truth presented as measured.** `getOwnerBaseDataset` caps every table read
   (80–240 rows, owner-data.ts:392-437); ALL headline metrics — "Recognized revenue",
   open support, pending invoices — are computed over newest-N samples and silently
   under-count. Revenue ignores the double-entry ledger (naira floats over legacy tables;
   jobs/studio/property/logistics always ₦0-as-if-measured).
3. **Two accounting systems on one surface.** `/owner/finance` renders the ledger-true
   console (kobo BIGINT) above legacy naira-float lanes from owner-data.ts.
4. **Missing drill-downs.** 26 catalogued surfaces show summarized/static info with no
   detail view (signals without evidence, audit rows without payload, AI conversations
   without transcripts, counters without row lists).
5. **Single-theme shell.** `.owner-command-root` (globals.css:386-411) unconditionally
   pins the entire `--acct-*` palette to hardcoded dark hexes + `color-scheme: dark`.
   Canonical light has NEVER rendered on owner surfaces; the theme toggle only flips
   Tailwind `dark:` utilities. "Both themes" means building light for the first time AND
   reconciling the pin's slate-navy dark (#06080d) with canonical warm dark (#0B0F14).

**The reference patterns already exist in-repo** — the rebuild ports everything to them:
- Data: `finance-ledger.ts` (kobo integers, `unstable_cache` 60s never caching failures,
  7s timeout, typed `{ok:false,reason}` degraded sentinel, per-KPI SQL traces).
- Surfaces: `/owner/inbox` + `[id]` (own repository lib, real empty states, sandboxed
  rendering), `/owner/v3-launch/dashboard` (honest "not wired yet" roster),
  `FinanceLedgerConsole` (trace drawers, shortId, format-at-render),
  `/owner/operations/analytics`, `/owner/staff/tree`.

**KEEP-LIST (never break; re-skin only):** owner inbox end-to-end, requireOwner gate
chain (BOTH same-named variants: page-gate `lib/owner-auth.ts` + API-gate
`app/lib/owner-auth.ts` — deliberately distinct), finance ledger console +
reconcile-trace, HQ team chat (10 internal-comms routes), staff/workforce CRUD,
brand/site/pages/people CRUD (`/api/owner/people` + `company_people` included), audit
surface, v3-launch dashboard, telemetry tiles, intelligence conversations console,
reporting crons, search-index cron + `/api/search`, `/api/owner/upload`,
`/api/profile/update`, owner shell infra (realtime bridge, notifications, palette),
newsletter APIs, `/workspace` redirect (two live hostnames rewrite into it).

## 2. Information architecture (the ecosystem command center)

The 9-section skeleton is sound; the rebuild rationalizes within it. The owner opens
`/owner` to answer three questions in one screen: **how is the company right now, what
needs me today, what should I do about it.**

```
/owner                      COMMAND HOME (rebuilt)
├─ briefing                 "This morning, in brief" — founder-AI narrative when live,
│                            deterministic digest otherwise (owner-reporting daily engine)
├─ money strip              LEDGER-TRUE: revenue today/7d, wallet liability, recon Δ,
│                            pending money movement (funding/withdrawals/payouts)
├─ decisions queue          everything awaiting the owner, with live counts + deep links
├─ pressure                 ranked signals (real engine, kept) → evidence views
├─ division rail            7 divisions + account: honest tiles (measured vs not-wired
│                            labeled), volume + revenue + pressure → division rooms
└─ audit tail + telemetry   kept tiles, traces registered

/owner/divisions            division map → [slug] rooms (enriched, honest metrics)
/owner/finance              ledger console (KEEP) + ONE truth; revenue/invoices/expenses
│                            rebuilt on the ledger; NEW detail views (accounts, intents,
│                            transactions, wallet requests, invoices, refunds)
/owner/operations           queues/alerts/analytics; approvals → LIVE decision queue
/owner/inbox                KEEP
/owner/messaging            queues rebuilt (grouped, paginated, PII-conscious, detail
│                            views + row actions); team chat KEEP
/owner/staff                KEEP CRUD; roster page paginated; member page enriched
/owner/brand                KEEP CRUD; add live-preview links to edited surfaces
/owner/ai                   Intelligence: signals & insights (real engine) + founder AI
│                            console + conversations (+ [id] transcripts)
/owner/settings             security page humanized; audit + [entry] detail; comms
/owner/v3-launch/dashboard  KEEP (honest v1 pattern)
```

Signal consolidation: `buildOwnerSignals` output renders on 5+ surfaces today, clickable
on two, dead-end on the rest. After rebuild: ONE alert center (`/owner/operations/alerts`)
+ signal evidence views; other surfaces show scoped slices that LINK (never re-render the
full list unlinked).

## 3. Data layer plan (Phase C backbone)

New domain modules under `apps/hub/lib/owner-command/`, each on the finance-ledger
pattern (typed result, kobo ints, cache 60s + timeout, degraded sentinel, trace
registration). `owner-data.ts` stays during migration; surfaces move fn-by-fn.

**Core primitives (build once):**
- `exactCount()` — PostgREST `head:true` exact counts (pattern: division-stats.ts). Every
  metric COUNT becomes exact; row samples remain only for lists, labeled as recent.
- `koboSum()` server-side aggregates where possible; JS float math retired.
- Typed rows at the lib boundary — no `JsonRecord` reaches a page.
- `humanizeAuditAction()` — machine strings → readable labels (keep raw in detail view).
- Reuse `owner-identity.ts` maps everywhere a user_id renders.

**Gap wiring (F4, folded in):**
- Division-tagged ledger revenue: `journal_entries.source_event_id →
  payment_intents.division` join — ONE revenue truth for division rollups.
- Studio revenue: sum `studio_payments` (verified statuses). Logistics: shipments/quotes
  volume + any settled money. Jobs/property: HONEST "not yet measured" labels (v3-launch
  roster pattern) — never ₦0-as-measured.
- Signups time-series: `customer_profiles.created_at` weekly counts (8 weeks).
- Refund amounts: `payment_refunds` (+ `marketplace_refunds`) get their first dashboard
  reader (finance detail).
- `getDashboardSummary` owner branch stub: superseded by these modules (port later or
  retire the TODO).

**Perf debts folded in:** stop rebuilding the 27-table dataset per navigation
(unstable_cache the domain modules); kill the double workforce build in
`getOwnerOverviewData`; kill `getAuditHistoryPageData`'s full-dataset fetch for one
identity map; kill `getWorkforceMemberById`'s whole-dataset scan;
`owner-intelligence.ts` unbounded message reads get limits.

## 4. Deep-link hygiene (verified verdicts)

**RETIRE (confirmed nonsense):**
- Division room self-links (first "next step" of every `getDivisionExternalActions` list
  links back to the page you are on — 7 divisions).
- `automation-failures` signal → `/owner/ai/signals` (circular dead-end; retarget to the
  automation run detail view, below).
- `staff/users/[id]` "Open shared account app" → owner's own account home (contextless).
- `/owner/ai/signals` page as a dead-end duplicate (renders link-bearing signals with
  hrefs dropped) — becomes a scoped view of the alert center.
- Nav duplicate "Operations > Division Ranking" (same target as Divisions > Performance).

**KEEP (claims refuted by verification — do NOT delete):**
- `whatsapp-coverage` signal → `/owner/messaging` (skipped rows DO render there;
  retarget to queues is an optimization, not a fix).
- Approval-center links (all 8 resolve; the page's problem is being a static directory —
  rebuild it into a live decision queue, keep the links).
- `/owner/divisions/hub` "latent 404" (unreachable by construction; code comment only).

**FIX (inconsistencies):** signals rendered without their hrefs on operations, divisions,
division rooms, finance; division-room staff cards not linked to member pages;
performance ranking rows not linked to rooms; AI scorecards not linked.

**ADD (detail views — the owner's "deeper look" mandate; priority order):**
1. `/owner/ai/conversations/[id]` — full AI transcript + escalated-thread link (the lib
   already fetches full content and throws it away). Explicitly owner-requested.
2. `/owner/signals/[id]` — evidence view: the rows that fired the rule, threshold,
   per-row links onward (threads, bookings, payout requests).
3. `/owner/settings/audit/[source]/[id]` — full payload, resolved actor, entity link.
4. `/owner/messaging/queues/[id]` — provider response, attempts, template, linked
   notification; `/owner/messaging/automation/[runId]` — run summary JSON + errors.
5. `/owner/finance/invoices/[id]`, `/owner/finance/intents/[id]` (DR/CR breakdown +
   provider refs), `/owner/finance/accounts/[code]` (paged journal lines),
   `/owner/finance/wallet/{funding,withdrawals}/[id]` (proof artifact + decision).
6. `/owner/divisions/[slug]/health` — stability-index decomposition + per-metric rows.
7. Counter → filtered-list links (`/owner/messaging/queues?status=failed` etc.); a
   cross-division support-thread list (`/owner/operations/support` — none exists today).
8. Telemetry drill-downs (`/owner/operations/observability` event browser) + shareable
   `/owner/trace/[traceId]` for metric provenance; brand editors get live-preview links.

Items 1–5 ship with their page rebuilds; 6–8 may trail.

## 5. Theme plan (both themes by construction)

1. **Unpin.** Delete the `.owner-command-root` hardcoded palette; owner surfaces read
   canonical `account-tokens.css` light + `.dark`. Decide the owner-dark hue ON canon
   (warm #0B0F14) — the Executive-HQ slate-navy retires unless the owner objects.
   Skeleton (`OwnerDashboardSkeleton`) changes in the same commit (duplicate class).
2. **Bug fixes riding the unpin:** undefined `--acct-amber` → `--acct-orange` (4 tiles);
   `MetricCard` `${color}15` invalid-CSS chip → `color-mix` (skeleton already does this);
   `.acct-button-primary` white-on-gold → ink-on-gold (`--hc-ink-on-accent`; house AA
   rule); `--owner-accent` gets light/dark split via `--hc-accent-on-light/dark`;
   `divisionColor()` hex map → canonical `--acct-div-*`; `var(--market-noir)` foreign
   token (6 spots) → `--hc-ink-on-accent`; `color-scheme` becomes theme-conditional;
   focus-ring `var(--accent)` fallback fixed; dark-only one-offs in
   InternalTeamCommsClient/inbox get light variants; email iframe stays white by
   decision (email fidelity) with a neutral frame.
3. **Gate:** every page walked in BOTH themes (Phase D protocol) before any slice merges.

## 6. Phase B — the founder desktop command surface

Product name in copy: **Founder Intelligence** / "Command surface" (calm authority; no
"Jarvis" branding — that word is the capability bar, not the label).

**Reuse verbatim (zero brain changes):** chat + confirm routes, propose/catalog/
governance, company-facts, persist, ai-gateway pipeline; `@henryco/chat-thread`
`<ChatThread>` (designed for embedding, `fillViewport` off); F3 card semantics +
endpoint-derivation convention (`/chat` → `/actions/confirm`).

**Extract first (seam refactor):** `useIntelligenceChat({endpoint, division})` hook +
`<IntelligenceExtras>` (action chip→card→outcome + nav chips) out of
`IntelligenceLauncher` — FAB and desktop share ONE state machine or they drift. The
`--hc-il-*` seam-token CSS factors into a shared stylesheet (two mounts must not
duplicate global styles).

**New — `FounderCommandSurface` (hub-local):**
- Desktop ≥xl: right dock panel, collapsible, state persisted (localStorage), summoned
  by ⌘J + palette entry; mobile/tablet keep the FAB (breakpoint-gated so exactly one
  mounts — double-mount = two divergent histories).
- **Briefing pane** (top): the assistant greets with state, not an empty box — server
  component rendering the deterministic daily-brief composition (owner-reporting `daily`
  engine) + narrative when flag live; quick-jump chips into consoles.
- Chat below (buffered turns; typing indicator covers the 12s gateway ceiling — real
  token streaming is a future gateway project, NOT this shell).
- F3 action cards inline; distinguish 429 (rate-capped) from 502 (gateway dark) in
  error states.
- **New read endpoint** `GET /api/owner/intelligence/conversations` (+`?id=` messages) —
  requireOwner-gated service-role read of `founder_intelligence_*` (deny-RLS stands).
  Powers desktop conversation restore/list AND the `/owner/ai/conversations/[id]`
  transcript view (deep-link item 1). Optional sibling: pending-proposals list.
- Flag-dark under `NEXT_PUBLIC_FOUNDER_INTELLIGENCE_LIVE` exactly like the FAB.

## 7. Page dispositions (delta-study verdicts, adversarially confirmed)

| Page | Disposition |
|---|---|
| `/owner` | REBUILD (command home, §2) — confirmed-rough truth layer |
| `/owner/ai` | REBUILD → intelligence home (real engine + founder console when live) |
| `/owner/ai/insights` | MERGE into intelligence home (canned runbooks retire when F2 live; empty-state fix) |
| `/owner/ai/signals` | RETIRE as dead-end; scoped alert-center view |
| `/owner/ai/conversations` | KEEP + add `[id]` transcript |
| `/owner/divisions{,/[slug],/performance}` | RE-SKIN + honest metrics + links + `[slug]/health` |
| `/owner/finance` | KEEP console; consolidate to one truth; wallet lanes → detail views |
| `/owner/finance/revenue` | REBUILD on ledger (division-tagged join, trend) |
| `/owner/finance/expenses` | REBUILD (real line items; withdrawals ≠ expenses) |
| `/owner/finance/invoices` | RE-SKIN + `[id]` + empty state |
| `/owner/inbox{,/[id]}` | KEEP (reference quality) |
| `/owner/messaging` | RE-SKIN (automation panel humanized + run detail) |
| `/owner/messaging/alerts` | RE-SKIN (classified failure reasons, empty/success state) |
| `/owner/messaging/queues` | REBUILD (grouped, paginated, PII-conscious, `[id]`) |
| `/owner/messaging/team` | KEEP (chat); primitives adoption only |
| `/owner/operations{,/queues,/alerts}` | RE-SKIN + queue drill-downs + ONE alert center |
| `/owner/operations/analytics` | KEEP (best analytics surface) |
| `/owner/operations/approvals` | REBUILD static directory → live decision queue (counts from data layer; keep verified links) |
| `/owner/settings` | RE-SKIN |
| `/owner/settings/audit` | RE-SKIN + `[source]/[id]` + humanized actions |
| `/owner/settings/security` | REBUILD (identity-resolved, linked to member pages) |
| `/owner/settings/comms` | KEEP (policy prose; localize) |
| `/owner/staff` | RE-SKIN (paginate roster; directory does the list job) |
| `/owner/staff/{directory,tree,invite}` | KEEP |
| `/owner/staff/roles` | RE-SKIN (audit half gets identity enrichment) |
| `/owner/staff/users/[id]` | RE-SKIN (kill JSON.stringify audit scan + double fetch) |
| `/owner/brand/*` | KEEP CRUD; type the form contracts; live-preview links |
| `/owner/v3-launch/dashboard` | KEEP (honest-v1 pattern; register a rail module) |

**Shell fixes riding along:** palette commands source broken in hub (no
`/api/dashboard/commands` route — per-module `getCommandPaletteEntries` never served) —
add the route; registry drift ("AI insights" title, no inbox/v3-launch modules) — align
registry with F1 naming + add modules so ⌘1..9 reaches the inbox; breadcrumb
finance-children bug (`owner-navigation.ts:258-260`); i18n: ~14 hardcoded-EN pages get
copy-module wiring as they are rebuilt.

## 8. Build order (reviewable PRs, each gated + both-theme verified)

1. **OCC-0 (this PR):** spec.
2. **OCC-1 — Theme foundation:** unpin + token bug batch (§5). Playwright both-theme
   sweep of all 38 pages = the acceptance gate. No layout changes.
3. **OCC-2 — Founder desktop surface (Phase B, flag-dark):** seam extraction + dock +
   briefing pane + conversations read endpoint + `[id]` transcript page.
4. **OCC-3 — Data layer + command home:** `owner-command/` modules + `/owner` rebuild +
   finance revenue/expenses rebuild (ledger truth) + division honest metrics.
5. **OCC-4 — Deep links & detail views:** retire list + add list items 2–5 + link fixes.
6. **OCC-5 — Page rebuilds:** messaging queues, settings/security, approvals decision
   queue, audit detail, remaining re-skins + i18n wiring + shell fixes (§7 tail).
7. **OCC-6 — Phase D:** full Playwright owner walk (both themes, every button, every
   deep link) — fix-forward findings.
8. **Phase E** (slices C/D/E + B2) and **Phase F** (staff-write inventory → F3 catalog
   tranches) proceed as their own PRs per the standing specs.

## 9. Verification protocol (Phase D)

With the owner's session: drive Playwright through every owner route (38 + login +
no-access + new detail views). Per page: loads without error; BOTH themes AA-correct;
every button performs its action; every deep link resolves to a real destination;
no raw IDs/ISO dumps/`true`-`false` strings; empty states honest; money figures match
the ledger console. Findings fixed in place; the walk repeats until clean.

## 10. Standing constraints

CLAUDE.md is law (voice, i18n, typography, `packages/search-ui` untouchable). Money
invariants absolute — the rebuild READS money; every write stays on existing guarded
paths (F3 governance for owner actions). requireOwner on every surface and API route,
both gate variants preserved. Flag-dark anything not activation-ready. Keep-list is
non-negotiable; deletions require the delta-study evidence trail.
