# HenryCo Unified Dashboard — Rebuild Master Orchestration (V2-FINAL)

**Status:** Hardened. Replaces `DASHBOARD-REBUILD-FORGED-PROMPT.md` as the source of truth for the rebuild executor(s).
**Author:** Pass V2-DASH-PROMPT-HARDEN-01 — Claude Code · Opus 4.7 · xhigh.
**Date:** 2026-05-02.
**Reads alongside:** [`DASHBOARD-AUDIT-REPORT.md`](./DASHBOARD-AUDIT-REPORT.md). Section anchors throughout (`§A.4-1`, `§B.account-7`, `§C.10`, `§D.4`) refer to that audit.

This document is **orchestration** — phasing rationale, gates, parallelism, rollback. It does **not** by itself drive execution. Each phase ships with its own forged prompt (file paths in §6 below), and each phase prompt cites this document for the shared anti-patterns + verification gate.

---

## 1. Why this exists (and why the prior prompt was insufficient)

The previous `DASHBOARD-REBUILD-FORGED-PROMPT.md` is a single 850-line monolith that bundles 8 sub-passes, 14 module specs, and verification rules into one paste-ready brief. It is well-grounded in the audit, but as an executor input it has five hardening gaps:

1. **Scope discipline** — 8 sub-passes are described in paragraph form, not as 8 standalone forged prompts. An executor running Sub-Pass 4 has no full prompt to hand to a fresh session — just bullets.
2. **V2 primitive integration** — the prompt was authored before V2-CART-01, V2-DOCS-01, V2-AUTH-RT-01 landed. It doesn't require consumption of `@henryco/cart-saved-items`, `@henryco/branded-documents`, or `apps/account/lib/post-auth-routing.ts`. It mentions `@henryco/notifications-ui` and `@henryco/chat-composer` only obliquely.
3. **Verification rigor** — the V1–V10 gate misses three first-class checks (no console errors, no 4xx/5xx in network, every role/division combination renders) and uses a too-narrow mobile breakpoint set.
4. **Childish-dashboard failure modes** — the anti-pattern list is technical (raw `<img>`, button states, long-scroll selectors) but never names the visual+copy failures that the owner explicitly called out as "childish": emoji-as-icon, blue primary, friendly cartoons, "Welcome to your dashboard!" copy, metrics-without-context, role-agnostic UI, mobile-as-desktop-scaled-down.
5. **Owner-as-separate-product** — the prior Sub-Pass 6 puts the owner module set inside the customer shell at `account.henrycogroup.com`. This is wrong. The owner dashboard is a **fundamentally different product** (density, trust, speed, power) and must ship as Track B against a separate canonical surface (default `hq.henrycogroup.com/owner`).

The hardened set below addresses all five gaps.

---

## 2. Phasing decision + rationale

The rebuild ships in **two tracks**.

### Track A — Consumer + Staff dashboard (account.henrycogroup.com)

Seven phases, sequential unless explicitly noted. Each ships to preview, gate-verifies, then merges to `main`. **Each phase MUST end at a state where production is fully functional** — no partial rebuilds in main.

| Phase | Name | Forged prompt |
|------|------|---------------|
| **DASH-1** | Foundations + Shell skeleton | [`DASH-1-shell-foundations-skeleton.md`](./DASH-1-shell-foundations-skeleton.md) |
| **DASH-2** | Module registry + 2 reference modules (customer-overview, marketplace) | [`DASH-2-module-registry-reference-modules.md`](./DASH-2-module-registry-reference-modules.md) |
| **DASH-3** | Remaining 8 modules (care, property, studio, jobs, learn, logistics, wallet, support, notifications, settings + 2 hidden future) | [`DASH-3-remaining-modules-rollout.md`](./DASH-3-remaining-modules-rollout.md) |
| **DASH-4** | Smart Home signal feed (live, ranked, real-data-only) | [`DASH-4-smart-home-signal-feed.md`](./DASH-4-smart-home-signal-feed.md) |
| **DASH-5** | Command palette (Cmd+K) cross-division entries | [`DASH-5-command-palette.md`](./DASH-5-command-palette.md) |
| **DASH-6** | Realtime notification spine wired to ContextDrawer | [`DASH-6-realtime-notification-spine.md`](./DASH-6-realtime-notification-spine.md) |
| **DASH-7** | Mobile shell (bottom action bar, drawers, sheets, parity) | [`DASH-7-mobile-shell.md`](./DASH-7-mobile-shell.md) |

### Track B — Owner dashboard (separate product)

| Phase | Name | Forged prompt |
|------|------|---------------|
| **DASH-8** | Owner dashboard (Track B, separate canonical surface) | [`DASH-8-owner-dashboard-track-b.md`](./DASH-8-owner-dashboard-track-b.md) |

### Why this phasing

- **Foundations (DASH-1) first.** Every later phase depends on `@henryco/auth`, `@henryco/dashboard-shell` primitives, `@henryco/data` cross-division helpers, the SQL `get_signal_feed` function, and `@sentry/nextjs` observability. Landing them once unblocks everything. The shell skeleton ships in the same phase because the foundations are not validated until the IdentityBar/Rail/Slot/Drawer chrome wires them up against the existing customer-overview content.
- **Reference modules (DASH-2) before bulk rollout.** Validating the module-registry contract on two modules (`customer-overview`, `marketplace`) before porting eight more catches contract bugs once instead of ten times. `marketplace` is chosen as the second reference because the audit (§B.marketplace-7) flagged the most concrete UX debt there — raw `<img>`s, missing button states, mobile workspace nav — and proving the shell can fix those cements the primitives.
- **Bulk rollout (DASH-3) before cross-cutting concerns.** The remaining 8 active modules (care, property, studio, jobs, learn, logistics, wallet, support, notifications, settings) plus 2 hidden future (`building`, `hotel`) must all be registered before the Smart Home signal feed (DASH-4), command palette (DASH-5), and realtime spine (DASH-6) can rank and route across them.
- **Smart Home / palette / realtime (DASH-4..6) as dedicated phases.** The prior prompt buried these inside Sub-Pass 1 + 2. They are first-class shell concerns that deserve dedicated forged prompts so the verification gate against each is unambiguous.
- **Mobile shell (DASH-7) after content.** Mobile parity requires every module's content to exist; verifying parity before content lands means re-verifying after every module merges. DASH-7 is the formal mobile-parity gate, after which mobile is canonical for every module.
- **Owner Track B (DASH-8) last and separate.** The consumer shell must be in production and stable before the owner dashboard's different product shape (density, table-first, keyboard-driven, sub-200ms) is built. Mixing them risks dragging owner ergonomics down to consumer's.

### Parallelism — what may run together

- **DASH-1 must run first, alone.** No other phase can start until DASH-1's foundations are merged.
- **DASH-2 must run alone.** It validates the module-registry contract.
- **DASH-3 may parallelize internally.** Each of the 8 remaining modules can ship as its own PR off DASH-2, provided each PR independently passes the verification gate. The phase as a whole is complete only when all 8 are merged.
- **DASH-4, DASH-5, DASH-6 may run in parallel** after DASH-3 completes. They touch independent shell surfaces (Smart Home composition vs Cmd+K palette vs realtime context). Conflicts only arise in `packages/dashboard-shell/`.
- **DASH-7 must run after DASH-3, DASH-4, DASH-5, DASH-6** — mobile parity verifies all of them.
- **DASH-8 (Track B) may begin after DASH-1 merges** since it consumes the same foundations, but it MUST NOT merge to production until DASH-7 is in production for ≥14 days. Track B's risk profile is owner-facing (admin actions, finance, audit) and its merge cadence is more conservative.

### Rollback strategy

- **Per-phase preview gate.** Each phase deploys to Vercel preview and must pass V1–V13 (see §3) before merging.
- **Per-PR feature-flag.** Each phase's shell switch ships behind `flags.dashboard_v2_<phase>` (read via `@henryco/intelligence`). Default off in production until smoke-tested. Owner can flip the flag instantly without redeploy if a regression surfaces.
- **Rollback procedure.** If a phase ships to production and breaks: (a) flip the flag off — shell falls back to the prior phase's UI; (b) revert the merge commit on `main` if the bug is in code that ran regardless of the flag; (c) hot-fix only after the flag is verified off in production.
- **Database migrations are forward-only.** New tables/columns/functions added in DASH-1 (e.g. `get_signal_feed`) and DASH-3 (per-module reads) stay in place even on rollback. The shell falls back to ignoring them.
- **No phase deletes a production-serving page until the new shell route is verified at parity.** Old `apps/hub/app/workspace/*` and `apps/care/app/(staff)/*` are deleted only in DASH-3 (after the new shell handles those routes) and must keep `308` redirects for ≥30 days after deletion.

---

## 3. Verification gate (V1–V13) — applied to every phase

Each phase prompt names the **subset** of gates that apply to its surface and must explicitly state PASS / FAIL / N/A per gate in its sub-pass report.

| # | Gate | What it checks |
|---|------|---------------|
| **V1** | Build + typecheck + lint clean | `pnpm run ci:validate` (or `pnpm -r typecheck && pnpm -r lint && pnpm -r build`) passes locally and on Vercel preview. Zero new warnings. |
| **V2** | Auth-continuity matrix | Playwright matrix (apps/care/tests, apps/marketplace/tests, apps/property/tests + new shell-level tests) covers customer + owner + staff sign-in + cross-app navigation. **All three personas must hop between subdomains without re-authenticating.** Cookie writes verified via shared `.henrycogroup.com` domain. |
| **V3** | RLS verification | Playwright or pgTAP test creates two non-privileged users in different tenants, attempts each cross-tenant SELECT/UPDATE/DELETE on every shell-readable table, confirms 0 rows returned and 0 mutations applied. The test must run against a real Postgres instance (preview branch), not a mock. |
| **V4** | Realtime smoke | Inject a test row into `customer_notifications` (RLS-isolated to test user) AND `staff_notifications` (RLS-isolated via `is_staff_in()`), confirm shell receives both within 2 s. Disconnect WiFi, reconnect, confirm subscription re-establishes within 5 s. |
| **V5** | Mobile parity | Visual regression at **320, 375, 390, 430, 768, 1024 px** for every shell page changed in this phase. 320 catches narrow-Android edge; 390/430 catch iPhone Pro/Pro Max; 768 catches iPad; 1024 catches desktop boundary. No layout shift > 0.1 CLS. No clipped CTAs. No unreachable thumb-zone actions. |
| **V6** | Lighthouse + Core Web Vitals | Each touched route ≥ **90 Performance**, ≥ **95 Accessibility**, ≥ **95 Best Practices**, ≥ **95 SEO**. Core Web Vitals: **LCP < 2.5 s**, **CLS < 0.1**, **INP < 200 ms**. Run on Vercel preview, not localhost. |
| **V7** | WCAG AA | `axe-core` (or Lighthouse a11y) reports **0 violations** on shell chrome (IdentityBar, WorkspaceRail, ContextDrawer, command palette, mobile bottom bar) **and ≥ 3 workspace modules**. Shell chrome targets WCAG AAA on focus rings and color contrast. |
| **V8** | Sender identity | `grep -r "new Brevo\|new Resend" apps/` outside the documented receiver in `apps/care/lib/resend-server.ts` returns **0 hits**. Every email-emitting code path on touched code routes through `@henryco/email`'s `sendEmail`. Verify by code review of the touched diff. |
| **V9** | CTA reality | **Every clickable** on every shell page touched in this phase is classified **LIVE** with an explicit verification trace: file:line of the `href` or `onClick`, the destination route or handler, and the destination's existence (file:line). **No DEAD, no DECORATIVE.** PARTIAL is allowed only with explicit owner sign-off recorded in the sub-pass report. |
| **V10** | Empty / loading / error / success | Every widget has each of the four states, tested by Playwright: empty (fixture user with no data), loading (network throttle to "Slow 3G"), error (mock 500 from the data source), success (subtle motion + state lock so a click never triggers twice — closes audit §B.marketplace-7 / §B.property-7 button-state gap). |
| **V11** | No console errors | Open DevTools Console on every rendered page in a happy-path walkthrough across all role × division permutations seeded in §D.2. **0 errors, 0 unhandled promise rejections**, no React hydration warnings. |
| **V12** | No 4xx / 5xx in network | Open DevTools Network on the same walkthrough. **0 4xx / 5xx responses** on the happy path. (Expected 404s for intentional missing-resource flows must be allowlisted explicitly in the report.) |
| **V13** | Role × division coverage | The seeded matrix in audit §D.2 (customer-only / customer-active / customer-problem / owner / 5 staff variants) is **fully exercised** in tests for the surfaces this phase touches. Every variant produces a renderable page with no thrown errors and no missing-data surface. |

A phase is **complete** only when every applicable gate is **PASS**. `N/A` is allowed for surfaces a phase doesn't touch (e.g. DASH-1 doesn't change UI so V11/V12 may be N/A on the still-empty modules), but must be explicitly named and justified.

---

## 4. Anti-patterns — applied to every phase

The shell rebuild **forbids** every pattern in this section. Each phase prompt re-states the subset relevant to its surface; this list is the canonical source.

### 4.1 Audit-derived (cite §section in repo)

1. **Long-scroll picker** (audit §B.care-7, §B.studio-7). Use `<TypeaheadGrid>` from `@henryco/dashboard-shell`.
2. **Raw `<img>`** (audit §B.marketplace-7, §B.property-7). Use `<DivisionImage>` (Cloudinary-aware Next/Image wrapper) from `@henryco/dashboard-shell`.
3. **Buttons without idle / pending / disabled / spinner / success-lock states** (audit §B.marketplace-7, §B.property-7). Use `<ActionButton>` from `@henryco/dashboard-shell`. Success-lock prevents double-submit (closes the click-twice bug class).
4. **Decorative tiles** (audit §B.care-3 — "Ready for live wiring"). Every CTA on every shell surface MUST be **LIVE**. Verification gate V9 enforces this — no DECORATIVE survives merge.
5. **Workspace redirect-loop pattern** (audit §A.4-1). The shell uses Next.js App Router parallel routes (`@drawer`, `@rail`), not host-rewrite + page-level redirects.
6. **Hard-coded division services row** (audit §C.10 #4). Divisions register via `getEligibleModules(viewer)`; the shell composes. The 4-division row in `apps/account/(account)/page.tsx` is replaced by registered modules.
7. **Reimplemented role helpers in TypeScript** (audit §A.7, §C.1-1). Extend `packages/auth/` (lands DASH-1) to wrap Supabase + the SQL `is_staff_in()` predicate. **The source of truth stays in Postgres.** No TypeScript role-membership re-derivation in client code.
8. **Direct Brevo / Resend instantiation** (audit §A.18, §C.6). Always go through `@henryco/email`'s `sendEmail`. Only documented exception: `apps/care/lib/resend-server.ts` (a Resend webhook receiver, not a sender — audit §C.6-1).
9. **Per-widget Supabase Realtime subscription** (audit §C.4, §A.5). One subscription at the shell level via `SupabaseRealtimeProvider`; widgets fan out via React context.
10. **Treating staff as "later"** (audit §B.staff-1). The shell supports staff role on day-1. `apps/staff` is the proven baseline (audit §A.16); the shell's staff role consumes its existing primitives.
11. **Migrating state-changing endpoints** (audit §D.3-7). The shell is a **UI rebuild only**. Every existing API path under `apps/*/app/api/*` stays as-is. New shell routes call existing endpoints.
12. **V3 features in V2 scope.** No new divisions beyond the 11 in `COMPANY.divisions` (`packages/config/company.ts:117-161`). No AI agents in the shell. No marketplace category expansion. No new auth flows (passkeys, MFA — flagged FALSE/STALE in audit §A.5). No new payment rails. **If a feature is not in this prompt or its phase prompt, it is rejected.**

### 4.2 Childish-dashboard failure modes (the owner's "unwanted")

The owner has stated the existing owner dashboard is "childish." The rebuild explicitly forbids the visual+copy patterns that produce that perception.

13. **Emoji-as-icon.** No `📦`, `💸`, `🚚`, `⭐` in any shell or module surface. Use the icon set defined in `@henryco/notifications-ui` (`src/icons.tsx` — V2-NOT-02-A) and extended in `@henryco/dashboard-shell`. Reference: existing offenders include the patterns suggested by Tailwind/shadcn defaults; reviewer must grep `apps/*/components/` for emoji literals in JSX and reject.
14. **Default Tailwind / shadcn cards with no design opinion.** The shell ships a `<Panel>` primitive with HenryCo geometry (border, shadow, internal padding scale). Plain `bg-white rounded-lg shadow` is rejected.
15. **Primary color = blue.** Primary is HenryCo black/gold/cream per `packages/config/company.ts:20-100` (division accents) and `@henryco/brand`. Tailwind default `bg-blue-500` / `text-blue-600` is rejected on shell chrome and module home widgets.
16. **Friendly cartoon empty-state illustrations.** Empty states use **typographic minimalism** — kicker + headline + single action — not stock illustrations. The `<EmptyState>` primitive in `@henryco/dashboard-shell` enforces this shape.
17. **"Welcome to your dashboard!" patronizing copy.** Replaced by content-first lead — "3 unread signals · last booking 2 days ago" — that respects the user's time. **Final copy is V2-COPY-01 scope** (deferred); use placeholder copy with `// TODO V2-COPY-01: review` comments where uncertain.
18. **Metrics without context.** A bare "$1,234" is rejected. Every metric ships with comparison or trend (e.g. "$1,234 · +12% vs last month" or "$1,234 · 3 pending"). The `<MetricCard>` primitive requires a `comparison` or `trend` prop.
19. **Role-agnostic UI.** The same layout served to consumer and owner is wrong. **Consumer gets clarity** (4–6 metric cards, large tap targets, calm typography). **Owner gets density** (12+ tiles, table-first, keyboard-driven, sub-200ms). The consumer shell (Track A) and owner shell (Track B) are different products built on shared primitives; they are NOT the same shell with role-aware modules.
20. **Copy not in HenryCo voice.** No "Awesome!", "Oops!", "Got it!", "Yay!". HenryCo voice is calm, declarative, premium (cite the existing `apps/account/lib/account-localization.ts` patterns). Final copy passes V2-COPY-01; until then, placeholder copy with explicit comment.
21. **Mobile = desktop scaled down.** Mobile is a **different layout** with bottom action bar (4 anchors: Home, Modules, Inbox, More), drawers + bottom-sheet primitives, sticky-close in thumb zone, typeahead/grid pickers (not native long-scroll `<select>`). The `<BottomSheet>` and `<Drawer>` primitives from `@henryco/dashboard-shell` are mandatory on mobile; CSS-media-query-only responsiveness is rejected.

---

## 5. V2 primitive consumption matrix — REQUIRED, not optional

Every phase that touches a surface in the second column MUST consume the corresponding package or module. Reimplementation is rejected at review.

| Surface in shell | Required primitive | Source | Audit trace |
|---|---|---|---|
| Bell + popover + toast viewport (ContextDrawer) | `@henryco/notifications-ui` (severity-style, icons, motion, swipe gestures, deep-link, types, tokens) | `packages/notifications-ui/` (V2-NOT-02-A) | §A.3-1 (audit calls out account-only adoption — shell broadens) |
| Any messaging surface (support reply, hiring conversation, internal team comms, project updates) | `@henryco/chat-composer` | `packages/chat-composer/` (V2-COMPOSER-01) | §A.3 (5 surfaces already integrated; shell modules pick up the same package) |
| Any address-bearing surface (settings/addresses, checkout, booking, logistics quote, care booking) | `@henryco/address-selector` (`<AddressSelector>` + `<AddressForm>`) | `packages/address-selector/` (V2-ADDR-01) | §B.account-12, §A.3 (cross-division canonical address) |
| Any cart-bearing widget (cart drawer, save-for-later, checkout, recently-viewed) | `@henryco/cart-saved-items` (`SaveForLaterButton`, `SavedBadge`, `SavedItemCard`) | `packages/cart-saved-items/` (V2-CART-01) | new — V2-CART-01 hand-off (§10) requires shell consumption in DASH-3 |
| Any download CTA (invoice PDF, receipt, certificate, transaction history, support thread export, KYC summary) | `@henryco/branded-documents` + the `DownloadDocumentButton` pattern in `apps/account/components/branded-documents/` | `packages/branded-documents/` (V2-DOCS-01) | new — V2-DOCS-01 hand-off (§10) lists pattern: copy `apps/account/lib/branded-documents.ts` (~25 lines) into the consuming app |
| Login redirect + role-switcher in IdentityBar | `apps/account/lib/post-auth-routing.ts` (`resolveUserDashboard`, `decideDashboardResolution`, `loadDashboardOptions`, `DASHBOARD_PREFERENCE_COOKIE`) | V2-AUTH-RT-01 | new — the IdentityBar role-switcher MUST consume the same resolver as login. Diverging the role logic recreates the fragmentation that V2-AUTH-RT-01 eliminated. |
| Lifecycle continue panel (any surface that lands a user back into in-flight work) | `@henryco/lifecycle` (`collectAndPersistLifecycleSnapshot`) | `packages/lifecycle/` | §B.account-2 (already shipped; shell promotes to widget) |
| Cross-division product/category/store search in command palette | TBD — consolidate `apps/{account,hub,staff}/lib/search.ts` into `packages/search/` (or extend `@henryco/intelligence`) in DASH-5 | DASH-5 deliverable | §C.5-1 (gap — fragmented today) |
| Email send | `@henryco/email`'s `sendEmail` (purpose-aware sender resolution) | `packages/email/` | §A.18, §C.6 |
| Realtime subscription | `SupabaseRealtimeProvider` at shell root, fan-out via React context | shell-level (DASH-1 deliverable) | §A.5, §C.4 |
| Auth check | `requireUnifiedViewer` / `getViewerRoles` from `packages/auth/` | DASH-1 deliverable, wraps Supabase + SQL `is_staff_in()` | §A.7, §C.1-1 |
| Observability | `@sentry/nextjs` + structured logger from `packages/observability/` | DASH-1 deliverable | §C.8-1 |

Additional primitive landings that DASH-1 ships (consumed by every later phase):
- `<MetricCard>`, `<Panel>`, `<PageHeader>`, `<EmptyState>`, `<LoadingSkeleton>`, `<ErrorBoundary>`, `<ActionButton>`, `<DivisionImage>`, `<TypeaheadGrid>`, `<BottomSheet>`, `<Drawer>`, `<FocusRing>`, `<SignalCard>`, `<QuickLink>`, `<Chip>`, `<Badge>`, `<Section>` — all in `packages/dashboard-shell/`.

---

## 6. Index of phase prompts produced

| Phase | File | Lines | Status |
|------|------|-------|--------|
| DASH-1 | [`DASH-1-shell-foundations-skeleton.md`](./DASH-1-shell-foundations-skeleton.md) | ~ | Authored |
| DASH-2 | [`DASH-2-module-registry-reference-modules.md`](./DASH-2-module-registry-reference-modules.md) | ~ | Authored |
| DASH-3 | [`DASH-3-remaining-modules-rollout.md`](./DASH-3-remaining-modules-rollout.md) | ~ | Authored |
| DASH-4 | [`DASH-4-smart-home-signal-feed.md`](./DASH-4-smart-home-signal-feed.md) | ~ | Authored |
| DASH-5 | [`DASH-5-command-palette.md`](./DASH-5-command-palette.md) | ~ | Authored |
| DASH-6 | [`DASH-6-realtime-notification-spine.md`](./DASH-6-realtime-notification-spine.md) | ~ | Authored |
| DASH-7 | [`DASH-7-mobile-shell.md`](./DASH-7-mobile-shell.md) | ~ | Authored |
| DASH-8 | [`DASH-8-owner-dashboard-track-b.md`](./DASH-8-owner-dashboard-track-b.md) | ~ | Authored |

---

## 7. Pre-flight — must clear before DASH-1 starts

Three operational items that are not part of any phase, and one re-confirmation, all must clear before the executor begins DASH-1.

1. **Brevo Auth SMTP proof received by ops** (audit §D.1-1). The `edf363f V2-PNH-04` commit is on main, but the SMTP proof is an ops/Brevo confirmation, not a code artefact. Without it, the rebuild risks repeating the production-signup outage that motivated V2-PNH-03B. **Halt DASH-1 if not received.**
2. **Live verification of `staffhq.henrycogroup.com` redirect-loop** (audit §A.4-1). The rebuild plan is the same either way, but the comms to existing staff users differ. Verify on production via `curl -I` or browser with cookies cleared.
3. **Vercel preview build budget** confirmed for the multi-phase plan (each phase is a preview deploy + a merge deploy; ~16 deploys total).
4. **Re-confirm canonical host.** Default is `account.henrycogroup.com` for Track A and `hq.henrycogroup.com` for Track B. If the owner prefers `app.henrycogroup.com` for Track A, this is a one-line DNS + Vercel project alias change before DASH-1 starts. **Decide before DASH-1.** All phase prompts assume `account.henrycogroup.com` as Track A canonical.

---

## 8. Persisted reporting

Every phase MUST persist its sub-pass report at `.codex-temp/v2-dash-<n>-<name>/report.md` before merging. The report follows the standard project structure: H0 recon, SHAs, files modified, anti-pattern audit, self-verification (V1–V13 PASS/FAIL/N/A per gate), final classification, hand-off.

Phase classifications use the standard ladder:
- `DASH-<N>-COMPLETE` — every applicable V1–V13 gate is PASS.
- `DASH-<N>-PARTIAL` — named items deferred, each with explicit reason and owner sign-off.
- `DASH-<N>-BLOCKED` — a precondition or a gate that cannot pass without intervention.

---

## 9. Deferred items

The following items are explicitly **out of scope** for the dashboard rebuild and tracked as their own future passes:

- **V2-COPY-01** — final HenryCo voice copy pass across the shell + modules. Until V2-COPY-01 ships, every shell phase ships with placeholder copy commented `// TODO V2-COPY-01`.
- **V2-COMPOSER-02** — migrate `apps/hub/components/owner/InternalTeamCommsClient.tsx` (1223-line component) to `@henryco/chat-composer`. Track B (DASH-8) consumes the result; if V2-COMPOSER-02 hasn't shipped, DASH-8 leaves InternalTeamCommsClient unchanged.
- **V2-NOT-02-B / -C** — staff bell rollout in remaining apps + per-division publisher integrations (audit §A.8 hand-off). The shell reads the staff_notifications schema either way.
- **V2-CART-02** — wire `<AddressSelector>` directly into `BookPickupForm` and marketplace `account-addresses-client` (V2-ADDR-01 hand-off). Independent of shell rebuild.
- **V2-DOCS-02** — wire branded-documents to care booking, property listing, jobs application download surfaces (V2-DOCS-01 hand-off §10). DASH-3 ensures the modules have a `<DownloadDocumentButton>` slot; the actual route handlers can land in V2-DOCS-02 if not earlier.
- **Apex CSP tightening** (audit §C.7-2) — Hub CSP `'unsafe-inline'` + `'unsafe-eval'` relaxation for Three.js + framer-motion. Track separately.

---

## 10. Hand-off

The owner runs **DASH-1 first** ([`DASH-1-shell-foundations-skeleton.md`](./DASH-1-shell-foundations-skeleton.md)). After DASH-1 merges and the V1–V13 gate is green on production, DASH-2 begins. Track B (DASH-8) may begin after DASH-1 merges but must not enter production until DASH-7 has been in production for ≥ 14 days.

**Pre-flight items in §7 are blocking.** The executor MUST confirm them before invoking DASH-1.

— end of master orchestration —
