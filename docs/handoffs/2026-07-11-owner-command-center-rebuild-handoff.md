# HANDOFF — Owner Command Center Rebuild + Remaining Program

**For:** Claude Fable 5, fresh session · **From:** the session of 2026-07-10/11
**Repo:** Henry Onyx monorepo (pnpm + Next.js). **You are picking up a live, real company.**
**Read this whole file first, then read the two memory files it points to, then begin.**

---

## 0. THE MISSION (what the owner asked for, in his words)

> "Restructure and redesign the owner dashboard to the most standard version… the desktop
> version of the AI has a Jarvis-like preview like a real studio. Make this magical… make
> the dashboard smart and intelligent… rebuild/restructure/redesign the navigation loader…
> retire some nonsense deep links and create deep links for some static infos that require a
> deeper look including those AI messages… it should Playwright[-verify], I will log in the
> owner account, it must verify it works in the best standard… it would go to all pages one
> after the other, one by one it will get them all done and make sure the experience it is
> witnessing is the highest owner-commander dashboard that governs the ENTIRE ecosystem, not
> only care or marketplace. A lot of pages are going to be rebuilt in that pass because so
> many pages have raw Supabase table queries that are hard to read, like it was roughly
> built. Also the cross-division design unification we talked about. Everything."

**Translation into the mandate:**
1. **Rebuild the owner command center (`apps/hub` owner surfaces) from scratch** to the highest
   standard — the command center that governs the WHOLE ecosystem (all 7 divisions + account +
   staff), not a care/marketplace-centric view.
2. **Both light AND dark**, correct by construction (both themes verified on every surface).
3. **Playwright-verify page by page** — the owner will log in the owner account; you drive
   Playwright through EVERY owner page one by one and confirm each is best-standard.
4. **Rebuild the roughly-built pages** — many owner pages hold raw, hard-to-read Supabase table
   queries inline; extract them into clean data layers and rebuild the surface.
5. **Deep-link hygiene** — retire nonsense/dead deep links; ADD real deep links for static info
   that deserves a deeper view (including the AI "messages"/signals/insights surfaces).
6. **The desktop founder AI = a Jarvis-like studio**, not a corner chat FAB.
7. **Cross-division design unification** slices C, D, E (B already shipped).
8. Do NOT lose any of the older program work (see the ledger in §7).

**Standard to hold:** the owner wants "the highest owner-commander dashboard ever." Treat this
as a flagship build. Study first, adversarially verify, both-theme every surface, gate before
done. This is a real Nigerian multi-division company scaling globally — get it RIGHT.

---

## 1. HOW TO WORK IN THIS REPO (non-negotiable)

- **CLAUDE.md is law.** Company voice = calm authority (no hype/urgency/exclamations except
  functional "Copied!"). Brand is **"Henry Onyx"** (never "Henry & Co."); code name "HenryCo"
  stays in identifiers only.
- **Never hardcode user-facing strings.** All copy goes through the typed copy modules
  (`packages/i18n/src/*-copy.ts`, EN source + per-locale overrides) or `translateSurfaceLabel`.
- **Gates before claiming done:** lint + typecheck the touched apps, `pnpm i18n:check:strict`,
  `pnpm tone:check`, and **verify visual changes in BOTH themes**.
- **Money invariants are absolute.** Status is provider-confirmed truth; money moves only
  through existing guarded RPCs. Email hooks are AFTER-commit, best-effort try/catch, gated on
  `email_transactional !== false`.
- **`packages/search-ui` is owner-reserved** — the owner authorized editing it in the past; do
  not touch it otherwise.
- **Adversarial verification is the house style.** After building a feature, run a review
  (parallel agents, or a Workflow when the owner opts into "ultracode"): hunt bugs, verify the
  claim, refute your own hypotheses. Every founder PR this session passed a hostile review and
  it caught real holes each time (F2 caught 5, F3 caught the "landed-write-marked-failed" bug,
  F5 caught the column-revoke no-op — see §8).
- **Study the merge base; build in an origin/main worktree.** `main` is checked out in another
  worktree (`HenryCo-fix-redirect`), so you CANNOT `git checkout main` here — branch off
  `origin/main` instead (`git checkout -b <branch> origin/main`).
- **Windows/pnpm gotchas:** `build:all` needs `--workspace-concurrency=1`. Bash heredocs eat
  backticks/`$()` and regex backslashes — write regex-bearing or backtick-bearing code via the
  Write/Edit tools, NEVER via `node -e` in bash (this bit us repeatedly this session).
- **Memory:** read `~/.claude/projects/C--Users-HP-VICTUS-HenryCo/memory/MEMORY.md` (the index)
  and especially **`project_henryco_founder_command_center_01.md`** (the founder program) and
  **`project_henryco_redesign_program_01.md`** (the redesign + master ledger). Update memory as
  you go.

---

## 2. CURRENT STATE — what is DONE and LIVE (do NOT redo)

**Founder Intelligence program (the owner's "personal brainer" / Jarvis):**
- **F1 truth pass** (#467, merged) — removed the fake "owner AI" branding; the surface stopped
  claiming AI it did not have. "AI & Helper Layer" → "Signals & Insights"; health-score →
  "Stability index" with the heuristic disclosed; dead tiles deleted; v3-launch route linked.
- **F2 real assistant** (#468, merged) — `hub.founder.assist` surface in `@henryco/ai-gateway`
  (FREE, deep tier, rate-capped). Owner-only executive assistant grounded EVERY turn in a
  live COMPANY facts pack (`apps/hub/lib/founder-intelligence/company-facts.ts` — owner-data +
  the double-entry ledger snapshot). Route `apps/hub/app/api/owner/intelligence/chat/route.ts`
  (requireOwner BEFORE any model work). Deny-RLS tables `founder_intelligence_*`. The doctrine
  is the owner's brief: study the facts, lead with unasked problems, structured briefings, one
  recommendation + counter, ruthless prioritization, honest about gaps.
- **F2b morning brief** (#469, merged) — `apps/hub/lib/owner-reporting.ts` gained `kind="daily"`;
  the existing 07:05-UTC cron sends a daily brief; when the flag is live the founder brain
  composes a "This morning, in brief" narrative on top (`morning-brief-narrative.ts`).
- **F3 governed write-action rail** (#470, merged) — the AI PROPOSES from a closed catalog; the
  server re-authorizes, shows server-fetched true state, the owner CONFIRMS, execution runs
  through the EXISTING guarded path. `apps/hub/lib/founder-intelligence/{action-catalog.ts,
  action-governance.ts,propose.ts}` + confirm route `.../actions/confirm/route.ts` + migration
  `founder_action_proposals`. Governance test gate (7/7): `.strict()` schemas, NO money-amount
  param, moneyAdjacent⇒reauth, founder-only. First tranche: `owner.brand.settings.update` +
  `owner.staff.status.toggle`, each via an EXTRACTED shared write core
  (`apps/hub/lib/{company-settings-write.ts,staff-status-write.ts}`).
- **F3-ui confirmation card** (#471, merged) — the shared `IntelligenceLauncher` renders the
  proposed action as a TWO-STEP reveal (chip → Review → Confirm; no auto-open). Both themes by
  construction (all `--hc-il-*` seam tokens).

**Trust / phone (the recurring "number to Google" issue):**
- Hub footer RSC-serialization leak fixed (#473, merged).
- **Care landing leak fixed (#475, OPEN)** — `apps/care/app/(public)/page.tsx` printed
  `support_phone` as text in the "Talk to the desk" row; now email-only. **The company number
  now renders as text on ZERO public surfaces.** Studio/logistics contact use masked
  `getSupportWhatsAppHref`; property JSON-LD uses per-listing agent phones (legit); marketplace
  is a vendor's own auth-gated number. **Google still needs a re-crawl / Search Console
  re-index of care+hub URLs to drop the cached copy.**

**Redesign / infra:**
- **Nav loader → dashboard skeleton (#474, merged)** — `apps/hub/app/components/OwnerDashboardSkeleton.tsx`
  replaced the full-screen splash with an in-place shell skeleton (studio standard, both themes,
  `--acct-*` tokens). This is the loader the owner asked for — DONE.
- **Token consolidation slice B (#466, merged)** — `packages/ui/src/theme/account-tokens.css`
  is THE canonical `--acct-*` source (account+hub+cms import it). Slices C/D/E remain (§6).
- **Division public-theme factory (#465, merged)** — `createDivisionPublicThemeStyle`.

**Security (applied to prod THIS session — see §5):**
- **HUB-1/2/3 hardening APPLIED + VERIFIED on prod** `rzkbgwuznmdxnnhmjazy`. `is_owner()` is now
  SECURITY DEFINER (recursion broken); `owner_profiles.role/is_active` and
  `hq_internal_comm_thread_members.role` are service-role write-only (self-escalation closed).
  PR **#472 (OPEN)** carries the migration file + the HUB-4 code fix (email-fallback honored
  only when `email_confirmed_at` — 4 gates). MERGE #472 so repo↔prod stay consistent.

**Owner account:** the single owner (`introvert7519@gmail.com`, user_id
`f43081fe-7543-4b02-85d8-9cbfd8048b92`) is now `verification_status='verified'`, `is_verified=true`
— fully verified, no KYC gates.

**OPEN PRs to merge:** #472 (F5 security), #475 (care phone). Nothing else pending.

---

## 3. THE FOUNDER-DASHBOARD STUDY (read before rebuilding — it is the map)

A 7-agent study (workflow `wx2lwmi30`, output archived) mapped the entire owner command center.
**Verdict: it is OVERWHELMINGLY REAL, not fake** — 38 owner pages + ~30 API/cron routes, a single
service-role aggregation layer (`apps/hub/lib/owner-data.ts`, 27+ live tables + auth admin), a
real double-entry ledger console (`apps/hub/lib/finance-ledger.ts`), a real owner inbox
(HMAC-verified Cloudflare Email Worker → `received_emails`, SES reply), real staff/brand/pages
CRUD, HQ team chat, reporting crons. **Do NOT delete this wholesale.** The rebuild is a
RESTRUCTURE + re-skin + data-layer cleanup + smart-layer, preserving the real capability.

**KEEP-LIST (real, load-bearing — preserve or re-home, never break):** owner inbox
(`/owner/inbox`), the requireOwner gate chain, the finance ledger console (`/owner/finance*`),
HQ team chat (`/owner/messaging/team`), the `owner-data.ts` aggregation layer, staff/workforce
CRUD, brand/site/pages CRUD (feeds the LIVE public hub), the audit log surface
(`/owner/settings/audit`), the V3-launch dashboard, owner telemetry tiles, the intelligence
conversations console, owner reporting crons, the search-index worker cron, the owner shell
infrastructure (realtime bridge, notifications, Cmd+K palette).

**What is ROUGH / needs rebuild (the owner's "raw Supabase queries, roughly built"):** the study
found the pages are real but several read raw rows inline and read as "just roughly built."
Every owner page's data wiring is catalogued in the study output. When you rebuild a page:
extract its query into a typed data-layer function, render with the aware/smart layer, both
themes, and Playwright-verify.

**Data GAPS to wire (so no number is ever missing — this is the "smart & intelligent" part):**
studio/jobs/property/logistics revenue are NOT in the owner rollup (show ₦0 as if measured — fix
or honestly label); no signups time-series; refund amounts not aggregated;
`getDashboardSummary` owner branch is a stub returning zeros
(`packages/data/src/dashboard-summary.ts`); `journal_lines` are not division-tagged (join via
`journal_entries.source_event_id → payment_intents.division`).

---

## 4. THE REBUILD PLAN (owner command center — do it in this order)

**Phase A — Study & spec (do NOT skip).** Read the study output + every owner route under
`apps/hub/app/owner/(command)/`. Produce a spec at `docs/superpowers/specs/` listing, per page:
current data wiring, keep vs rebuild, the deep-links to retire, the deep-links to ADD, and the
both-theme plan. Brainstorm the information architecture of a true ecosystem command center
(money · pressure · decisions · each division · the founder AI) — the owner opens it to run the
WHOLE company.

**Phase B — The Jarvis desktop AI.** Today the founder assistant (F2/F3) is a corner FAB
(`IntelligenceLauncher`). On DESKTOP, build it as a persistent **command surface** — a right-rail
or ⌘K-summoned studio panel with: a live "briefing" pane (the assistant's read of the company
NOW, greeting the owner with state, not an empty box), streaming responses, the F3 proposed-action
cards inline, and quick-jump into any console surface. Keep the FAB for mobile. Reuse the F2/F3
rail (endpoint `/api/owner/intelligence/chat`, the envelope, the confirmation card) — this is a
new DESKTOP shell around the existing brain, not a new brain. Flag-dark until
`NEXT_PUBLIC_FOUNDER_INTELLIGENCE_LIVE=1`.

**Phase C — Restructure + rebuild pages.** Page by page: extract raw queries into data layers,
rebuild the surface to the standard, wire the data gaps (§3), both themes. Retire dead deep
links; add deep links for static infos that deserve a detail view (division drill-downs, signal
evidence, the AI "messages"/signals/insights, audit entries, etc.).

**Phase D — Playwright verification (the owner will log in).** With the owner logged in, drive
Playwright through EVERY owner page one by one. For each: confirm it loads, renders correctly in
BOTH themes, every button does something real, every deep link resolves, no raw/broken data. Fix
what you find. The Playwright MCP is chromium-only; that's fine for verification. This is the
owner's explicit acceptance test — "the highest owner-commander dashboard ever."

**Phase E — Land the cross-division unification (§6) as part of the re-skin.**

**Phase F — ECOSYSTEM-WIDE STAFF-WRITE INVENTORY + OWNER ACTION WIRING (owner directive, explicit).**
> "Add all the division works that require any staff write and wire them for the owner so he can
> always go there and perform all actions himself if he chose to. It needs a deep study of the
> entire ecosystem if not yet done."

The owner wants **total operational control from the command center**: every action any staff
member can take in ANY division, he can perform himself — under the F3 governance (propose →
server re-authorize → owner confirm → execute through the EXISTING guarded path → audit).

- **Do the deep study FIRST.** The F3 design study (`wf_12dbc61a-be1`, summarized in the founder
  memory) already inventoried ~23 OWNER-relevant write ops, but that is NOT the full set. Run a
  fresh, exhaustive ecosystem sweep — every division (care, marketplace, studio, jobs, learn,
  property, logistics) + account + the staff console + hub — and catalogue EVERY staff/operator
  write action: its exact guarded execution path (route/server-action/RPC, file:line), its authz
  gate, the params (which come from a RECORD vs the caller), whether it moves money, its
  reversibility, and where a confirmation card reads the TRUE server-side state. Money paths must
  route through the SAME guarded RPC a human uses — the AI/owner never re-implements a write.
- **Then wire them into the F3 catalog** (`apps/hub/lib/founder-intelligence/action-catalog.ts` +
  the pure `action-governance.ts`), tranche by tranche. Cross-app writes (their code lives in
  other apps) need the F3b execution-binding contract — either a founder-service-auth HTTP call to
  the division's existing guarded route, or an extracted shared server fn. Each new entry keeps
  the governance invariants (strict schema, founder-only, moneyAdjacent⇒reauth, true-state
  reader, drift keys, audit) — the governance test gate enforces them.
- **Surface it in the command center** so the owner can browse "everything I can do across the
  ecosystem" and act — this is a core part of the "governs the ENTIRE ecosystem" mandate, and the
  action cards should have real deep links to the records they touch.
- Keep the permanently-human-only exclusions honest (newsletter blast, irreversible cash refunds,
  wallet withdrawal until a guarded path exists) — wire everything that CAN be guarded; label the
  rest.

Ship in reviewable PRs (one phase or a coherent slice per PR), each adversarially reviewed,
each gated, each both-theme verified. Flag-dark anything not ready.

---

## 5. ENV VARS + MIGRATIONS (status — mostly DONE this session)

**Migrations APPLIED to prod `rzkbgwuznmdxnnhmjazy` this session (verified):**
`20260710140000` (founder_intelligence tables + gate), `20260710160000` (founder_action_proposals),
`20260710180000` + a follow-up column-grant correction (HUB-1 is_owner SECDEF, HUB-2 owner_profiles
role/is_active service-role-only, HUB-3 hq_ic role service-role-only). **Nothing else to apply**
unless you add new migrations.

**Env vars to activate the founder AI (owner sets these on the hub deployment):**
```
ANTHROPIC_API_KEY = <key>                    # the ONLY AI provider secret (read by @henryco/config getAiProviderConfig)
NEXT_PUBLIC_FOUNDER_INTELLIGENCE_LIVE = 1    # mounts the assistant + opens its chat route
FOUNDER_ACTIONS_LIVE = 1                     # enables the F3 propose→confirm action rail
FOUNDER_ACTIONS_TRANCHE = 1                  # optional (default 1)
# optional model pins (defaults exist): AI_MODEL_FAST / AI_MODEL_STANDARD / AI_MODEL_DEEP
```
**Money-rail flags (owner said saved; interlocked — set only when the card rail is ready):**
`STUDIO_CARD_CHECKOUT=1` + `STUDIO_BANK_TRANSFER_RETIRED=1`; `CARE_CARD_CHECKOUT=1`
(+`PAYMENTS_DATABASE_URL`) then `CARE_BANK_TRANSFER_RETIRED=1`.

**⚠️ SES EMAIL — LAUNCH BLOCKER (owner action, AWS-side):** Amazon SES is in **Sandbox** mode in
region **US-EAST-1**, so it can only send to VERIFIED identities — `founder@henryonyx.com` works
(domain verified) but iCloud/Gmail/real customer addresses are rejected ("identities failed the
check"). **Fix: AWS Console → SES → Account dashboard → "Request production access."** No code
change; the SES-only rail is correctly built. Until this is granted, the ecosystem cannot email
real customers.

---

## 6. CROSS-DIVISION DESIGN UNIFICATION (slices C/D/E — the owner said never to forget)

Full spec: `docs/superpowers/specs/2026-07-10-redesign-final-token-consolidation.md`.
Slice B (canonical `--acct-*`) shipped (#466). Remaining:
- **Slice C — `--site-*` handoff.** Retire `--site-accent` from the blocking script (it can flash
  the wrong division accent before hydration); rewrite `PublicBrandTokens` surfaces onto
  `--home-*`; deprecate `public-tokens.ts` + the legacy `public-header.tsx`.
- **Slice D — theme keying.** Standardize on light-first `:root` + `.dark` re-dark
  (property/learn/logistics currently invert with `.light`).
- **Slice E — studio editorial language as the shared layer.** Extract studio's Register-L
  editorial primitives into the shared layer.
- **Slice B2 (found during B):** dashboard-shell has ~90 NO-FALLBACK `var(--acct-*)` reads
  consumed by 8 apps; care/jobs/logistics/staff/studio never define those tokens, so those spots
  render off the unset value. Either load `account-tokens.css` ecosystem-wide (a VISUAL change in
  5 apps — verify both themes) or give the dashboard-shell reads explicit fallbacks.

---

## 7. MASTER REMAINING LEDGER (everything still open — don't lose these)

**Founder program (after the dashboard rebuild):**
- **F3b** — cross-app action bindings, EXPANDED to the full ecosystem staff-write set (Phase F,
  §4): a deep study of every division + account + staff console for ALL staff-write actions, then
  wire each into the F3 catalog so the owner can perform any action himself. Their writes live in
  OTHER apps' routes → needs a founder-service-auth HTTP binding contract (or extracted shared
  server fns). This is now a HEADLINE deliverable, not a footnote — the owner wants total
  operational control from the command center.
- **F3c** — the first GUARDED-MONEY action: `care.payment.record` via the SEC-HARDEN-05
  `care_record_manual_payment` RPC (reachable from hub, guarded, balanced double-entry). Wire the
  `requiresReauth` step-up (the confirm route currently fails requiresReauth closed until this).
- **F4** — data completeness (the §3 gaps: studio/logistics revenue, signups series, the stubbed
  owner summary, division-tagged ledger).
- **F6** — social pipeline (draft/schedule/post TikTok/Facebook/X/Instagram/LinkedIn/Pinterest).
  Mirror the newsletter approval engine (`@henryco/newsletter`). NEEDS owner platform API
  keys/OAuth apps — ships flag-dark. Permanently human-only until guarded: newsletter send,
  `account.payment.refund`, dispute refund, wallet withdrawal (no write path exists).

**Other standing fronts (from the redesign ledger):**
- Auth surfaces rebuild premium from scratch (login/signup/forgot/reset/choose/verified/reauth).
- Studio brief pages chrome/navigation (users stranded — owner directive 2026-07-08).
- Hub homepage own header ~77px → 64 budget (rides the hub redesign).
- Email slices: account template text-alternatives; hand-rolled→`renderHenryCoEmail` migrations
  (marketplace/jobs/learn/property).
- ig/yo/ha/hi human translations backlog (never machine-translate these — EN fallback by omission).
- iOS Safari bug on hub about/privacy/contact (error boundary on real iPhone; leads in memory).

---

## 8. KEY LESSONS FROM THIS PROGRAM (so you don't relearn them the hard way)

- **Column-privilege revoke is a NO-OP under a table-level grant.** `revoke update(col)` does
  nothing if the role has table UPDATE (it covers all columns). Revoke the TABLE grant, then
  re-grant the safe columns. (Caught only by verifying on prod — always verify DDL landed.)
- **Verify subagent/reader claims on disk before acting.** Two readers contradicted on whether the
  care card rail existed; disk settled it. Never rebuild a live money rail on a reader's word.
- **Live-curl/probe beats assuming cache.** The phone "still showing" was a REAL remaining emitter
  (care landing), not just Google cache. Hunt the real source.
- **The adversarial review earns its cost every time.** It caught 5 real F2 holes, the F3
  landed-write-marked-failed ledger bug, the F5 no-op. Run it on every substantive PR.
- **RSC serializes props even when unrendered.** A `phone` field on a footer object leaks to the
  HTML/Google even if no component prints it. Keep secrets/PII OUT of serialized props entirely.
- **Bash eats special chars.** Write regex/backtick/`$()`-bearing code via Write/Edit tools.
- **`main` is in another worktree** — branch off `origin/main`, don't `git checkout main` here.

---

## 9. START HERE (your first moves)

1. Read `MEMORY.md`, then `project_henryco_founder_command_center_01.md` and
   `project_henryco_redesign_program_01.md`.
2. Merge/confirm #472 and #475 are landed (or land them).
3. Branch off `origin/main`. Read every owner route under `apps/hub/app/owner/(command)/` and the
   study's page catalogue.
4. Write the Phase-A spec (§4). Then build Phase B (Jarvis desktop) → C (rebuild) → D (Playwright
   with the owner logged in) → E (unification), in reviewable, adversarially-reviewed,
   both-theme-verified, gated PRs.
5. Keep memory updated. Hold the highest standard — this is the flagship the owner is judging the
   whole company by.

**Make it magical. Make it the best version ever. The owner is watching this one.**
