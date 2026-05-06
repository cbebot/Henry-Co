# V5-CLEAR — Pre-Dashboard Clean Sweep (Hardened Forged Prompt)

**Status:** Hardened by orchestrator (Claude Opus 4.7 1M-context session, 2026-05-06). Replaces the paste-ready draft. Closes 18 gaps surfaced in plan-mode recon. Six owner-blocking G0 gates folded inside the prompt.

**Sits between:** completed V2 passes (PNH, NOT, COMPOSER, ADDR, CART, DOCS, AUTH-RT, SEO, A11Y, DASH-PROMPT-HARDEN, SEARCH, HERO, COPY, EMAIL-BRAND) and the dashboard rebuild execution (DASH-1..9). Fires before DASH-1.

---

```
TOOL: Claude Code (Opus 4.7)
EFFORT: xhigh
PROJECT: HenryCo Ecosystem · henrycogroup.com · V2 closure
PASS: V5-CLEAR — Pre-dashboard clean sweep
EXPECTED DURATION: Multi-day. Sequential phases. Do NOT start phase 2
                   until phase 1 ends. Do NOT start phase 3 until
                   phase 2 ends.

═══════════════════════════════════════════════════════
ROLE
═══════════════════════════════════════════════════════

Senior release engineer plus principal frontend reliability engineer
for the HenryCo Ecosystem. Opus 4.7. Self-verify every artefact you
produce. Truth hierarchy enforced. No "should-work" claims. Name
every uncertainty explicitly.

═══════════════════════════════════════════════════════
G0 — OWNER-BLOCKING DECISIONS (clear before Phase 1 begins)
═══════════════════════════════════════════════════════

These six items must be answered by the owner BEFORE Phase 1 begins.
Persist the answers at .codex-temp/v5-clear/g0-decisions.md.

1. Five canonical domains for P1.3 smoke list.
   Recommended: account.henrycogroup.com, hq.henrycogroup.com,
   marketplace.henrycogroup.com, care.henrycogroup.com,
   property.henrycogroup.com. Plus henrycogroup.com (root) as the
   sixth smoke target. Owner accepts or expands to include
   jobs / learn / logistics / studio.

2. Test email mailbox(es) for P1.3 brand-strap verification.
   One real email per division (account, care, marketplace,
   property, jobs, learn, logistics, studio = 8 divisions). Owner
   provides the destination inbox(es). One owner-controlled
   address is acceptable; division-specific aliases preferred.

3. Text color hex values for Phase 3.
   Owner-provided starting points:
     primary text on dark   = #F5F1E8  (warm off-white)
     secondary text on dark = #C9C2B6  (warm gray, warm undertone)
     tertiary text on dark  = #8A857C  (cooler gray)
     accent text (gold)     = existing gold value (emphasis only)
     primary text on light  = existing #18181B (zinc-950)
     secondary text on light = warm gray TBD (owner confirms)
   Owner accepts or tunes after visual review at G0.

4. Bug A disposition — marketplace checkout payment surface.
   Recon (this prompt, P2.0) confirms the surface is FUNCTIONAL with
   wallet + bank-transfer-proof + COD; NO external PSP integration
   by design. Owner picks:
     (a) keep current manual flow + polish deferred-state copy
         [recommended — V5-CLEAR scope]
     (b) integrate Paystack / Flutterwave / Stripe in V5-CLEAR
         [scope expansion — V3 deferral if not picked]
     (c) other.

5. Bug C disposition — Studio /request specific concern.
   Recon confirms the redesigned three-path landing already shipped
   in commit 33e7f44 (three calm paths: copilot / custom / templates).
   Owner clarifies which sub-aspect of /request feels worthless.
   Default assumption: copilot UX inside the redesigned landing.

6. DASH-1 pre-flight 5-item answers (V5-CLEAR final report fills
   these as DELIVERABLES, not pending bullets):
   (a) Brevo Auth SMTP proof received by ops? Yes / No / unknown.
   (b) staffhq.henrycogroup.com redirect-loop status verified live —
       what is the current response chain (curl -I transcript)?
   (c) Vercel preview build budget confirmed for ~16 deploys
       (DASH-1..9 + reserves)?
   (d) Track A canonical host locked at account.henrycogroup.com?
   (e) Track C canonical surface URL — staff.henrycogroup.com
       (recommended, fresh subdomain) or staffhq.henrycogroup.com
       (existing subdomain, fix loop in place)?

═══════════════════════════════════════════════════════
CONTEXT — read in this order BEFORE writing code
═══════════════════════════════════════════════════════

1. .codex-temp/v5-clear/g0-decisions.md (owner answers — required)
2. .codex-temp/v5-clear/preflight-dirty-tree-inventory.md (orchestrator
   head-start: 30 M-files demixed by pass anchor)
3. .codex-temp/v5-clear/preflight-stash-audit.md (orchestrator head-
   start: 16-stash disposition recommendations)
4. .codex-temp/v5-clear/preflight-branch-audit.md (orchestrator head-
   start: branch graveyard policy + V5-related decisions)
5. docs/dashboard/DASH-1-shell-foundations-skeleton.md (DASH-1 pre-
   flight 5 items live in §"CONTEXT — read in this order BEFORE
   writing code"; V5-CLEAR's final report ANSWERS these)
6. docs/dashboard/DASHBOARD-REBUILD-PROMPT-V2-FINAL.md (master §3
   V1-V13 gate definitions + §4 anti-patterns + §7 pre-flight + §8
   persistence)
7. .codex-temp/v2-email-brand-01/report.md (V2-EMAIL-BRAND-01 brand
   strap consumers — the 30 M-file demix is mostly this pass)
8. .codex-temp/v2-copy-01/report.md (V2-COPY-01 voice scope)
9. .codex-temp/v2-hero-01/report.md (V2-HERO-01 — Studio /pay/
   [paymentId] surface owner)

═══════════════════════════════════════════════════════
TRUTH HIERARCHY — enforce on every claim
═══════════════════════════════════════════════════════

CODE TRUTH: what exists in the repo (cite file:line).
DEPLOYMENT TRUTH: what is on Vercel (cite vercel.json + deploy logs).
LIVE TRUTH: what works with real data on production.

Every assertion in your sub-pass reports MUST cite file:line.
Every "this works" claim MUST cite the verification step that
confirmed it. If a thing is asserted without a citation, mark it
`UNVERIFIED — REQUIRES OWNER CONFIRMATION`.

No "should work."

═══════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════

Three phases in strict order:
  Phase 1 — merge and deploy every uncommitted/unpushed item;
            verify production cleanly.
  Phase 2 — repair seven owner-flagged visible bugs.
  Phase 3 — ship the warm text-tone token pass.

Do NOT start Phase 2 until Phase 1 reports P1-COMPLETE or P1-PARTIAL
with named-and-justified deferrals. Do NOT start Phase 3 until Phase 2
reports P2-COMPLETE or P2-PARTIAL likewise.

══════════════════════════════════════════════════════════════════════
PHASE 1 — MERGE AND DEPLOY EVERYTHING UNCOMMITTED OR UNPUSHED
══════════════════════════════════════════════════════════════════════

P1.0 RECON
  Fetch all remotes:           git fetch --all --prune
  Status:                       git status --short --untracked-files=normal
  Stash list:                   git stash list
  Local branches:               git branch
  Remote branches:              git branch -r
  Branch ahead/behind main:     git rev-list --left-right --count main...HEAD
  Diff size on dirty tree:      git diff --stat HEAD

  Read the orchestrator head-start artefacts at:
    - .codex-temp/v5-clear/preflight-dirty-tree-inventory.md
    - .codex-temp/v5-clear/preflight-stash-audit.md
    - .codex-temp/v5-clear/preflight-branch-audit.md

  Confirm or correct the orchestrator's demix. If the demix is wrong,
  update the inventory file and proceed with the corrected attribution.

  Build the unified inventory at .codex-temp/v5-clear/p1-inventory.md
  with columns:
    branch | commits-ahead-of-main | committed | pushed | PR | merged
    | last-deploy | next-action

P1.1 DETERMINE MERGE ORDER
  Order by safety. Merge conflicts resolved with main winning on
  shared infrastructure, branch winning on its specific feature
  surface.

  Recommended order (verify each is actually unmerged in P1.0):
    1. fix/platform-health-sweep (current branch, 9 commits ahead +
       30 M-files in working tree). The 30 M-files are mostly
       V2-EMAIL-BRAND-01 + V2-COPY-01 + STUDIO-MSG-01 recovery —
       see preflight-dirty-tree-inventory.md.
    2. feat/v5-2-visible-repair if unmerged — overlap-check against
       V5-CLEAR Phase 2 before merging; deduplicate by repointing
       Phase 2 work into the existing branch if helpful, OR mark
       feat/v5-2-visible-repair as superseded by V5-CLEAR and abandon.
    3. fix/v5-3-and-p0-closure if unmerged — closure-track work.
       Likely contains v5-3 deep-sweep prep that the owner has
       flagged for after dashboards. Decide preserve vs absorb.
    4. Any other branch with commits ahead of main per P1.0 inventory.

P1.2 PER-BRANCH SEQUENTIAL EXECUTION
  For each branch in P1.1 order:
    a. Stash uncommitted scratch from other contexts (do NOT mix
       branches' work). Use named stashes:
       git stash push -m "v5-clear: parking <reason>"
    b. Demix the working tree per the inventory. Group commits by
       pass anchor. ONE ANCHOR PER COMMIT.
       Recommended commit messages for the current dirty tree
       (per preflight-dirty-tree-inventory.md):
         "feat(email): V2-EMAIL-BRAND-01 follow-up — layout strap
            wordmark + division template imports"
         "feat(copy): V2-COPY-01 follow-up — public-shell + studio
            messaging voice"
         "fix(studio): STUDIO-MSG-01 portal seed + dashboard polish"
         "feat(notifications): V2-NOT-02-A NotificationBell + feed
            empty-state polish"
         "feat(auth): V2-AUTH-RT-01 follow-up — choose page + Care
            staff access copy"
         "fix(security): handle_new_customer search-path migration"
       Adjust per the actual inventory; use conventional-commits.
    c. Push the branch:           git push -u origin <branch>
    d. Open PR. Title:
       "<conventional-prefix>(<scope>): <subject>"
       Body: paste the per-PR section of the V5-CLEAR Phase 1
       inventory + the V1-V13 subset that applies + cite the
       relevant .codex-temp report.
    e. Wait for CI green. Investigate failures. Do NOT --no-verify.
    f. Squash-merge to main.
    g. Capture merge SHA.
    h. Verify Vercel production deploy completes (check deployment
       URL via Vercel dashboard or `vercel ls`). Capture deploy ID.
    i. Smoke the affected surfaces:
       curl -sIL https://<domain>/<route> | grep -E "^HTTP|^location:"
       Confirm 200 (or expected 308/3xx) on changed routes.

P1.3 POST-MERGE LIVE VERIFICATION

  Five canonical domains (or six per G0.1) — confirm 200 on root:
    curl -sIL https://account.henrycogroup.com/ | head -1
    curl -sIL https://hq.henrycogroup.com/ | head -1
    curl -sIL https://marketplace.henrycogroup.com/ | head -1
    curl -sIL https://care.henrycogroup.com/ | head -1
    curl -sIL https://property.henrycogroup.com/ | head -1
    curl -sIL https://henrycogroup.com/ | head -1

  V2-PNH security headers preserved on each:
    curl -sI https://<domain>/ | grep -Ei "strict-transport|content-security|x-frame|x-content|referrer|permissions"
    Expected: HSTS, CSP, X-Frame-Options, X-Content-Type-Options,
    Referrer-Policy, Permissions-Policy all present. NO regression
    from V2-PNH-01..04 baselines.

  Send one real email per division to the G0.2 mailbox. Verify the
  V2-EMAIL-BRAND-01 brand strap renders (HENRY & CO. wordmark, Source
  Serif 4 + Inter font stack, division accent). Screenshot or
  document the result. Persist at
  .codex-temp/v5-clear/p1-email-strap-proof.md.

  Walk three V2-COPY-01 voice surfaces and confirm the new copy is
  live, not the old placeholder:
    1. apps/account/components/notifications/NotificationsFeedEmptyState.tsx
       (account context — new copy: "All caught up" / "Activity surfaces")
    2. packages/ui/src/public-shell/error-fallback.tsx (every public app)
    3. apps/studio/components/messaging/empty-state.tsx (Studio portal —
       new copy: "Opening note" / "all live here")
  Persist at .codex-temp/v5-clear/p1-voice-walkthrough.md.

P1.4 PHASE 1 CLASSIFICATION
  P1-COMPLETE — every branch merged + verified, all 6 domains 200,
                brand strap + voice live across walked surfaces, V2-
                PNH security headers preserved.
  P1-PARTIAL — named branches blocked with explicit reasons.
  P1-BLOCKED — structural blocker (e.g. CI infrastructure down,
               Vercel rate-limit, broken main).

  Persist at .codex-temp/v5-clear/phase-1.md with the inventory
  table, per-PR merge SHA + deploy ID, V1-V13 verification subset,
  anti-pattern audit subset, classification with rationale.

══════════════════════════════════════════════════════════════════════
PHASE 2 — VISIBLE BUG REPAIR
══════════════════════════════════════════════════════════════════════

Do NOT start until Phase 1 classified P1-COMPLETE or P1-PARTIAL.

P2.0 RECON FOR EACH BUG
  Reproduce on production. Document file:line, current behaviour,
  expected behaviour, root cause hypothesis. Persist per-bug recon
  at .codex-temp/v5-clear/p2-bug-<x>-recon.md.

  Note: Bugs A, B, C, D have orchestrator-pre-reconned ground truth
  in this prompt. Confirm against current production state and
  proceed.

P2.1 BUG A — Marketplace checkout has no payment page
  URL: marketplace.henrycogroup.com/checkout
  Recon (orchestrator pre-reconned): apps/marketplace/app/(public)/checkout/page.tsx
         surface is FUNCTIONAL with three payment methods per commit
         b9741e8 (2026-05-05):
           - wallet_balance (HenryCo wallet debit)
           - bank_transfer (manual proof upload to /api/marketplace
             via uploadMarketplacePaymentProof)
           - cod (cash on delivery, rider settlement)
         Order status conditional on method:
           wallet → "paid_held"
           bank/COD → "awaiting_payment" / "placed"
         NO external PSP integration (Stripe/Paystack/Flutterwave)
         by design. Manual flow is internal-facing — payment team
         verifies (per checkout-experience.tsx comment).

  G0.4 disposition — execute per owner answer:
    Default (a) [recommended]: keep current manual flow. Polish the
                 deferred-state copy so the user knows what comes
                 next. Suggested copy in HenryCo voice (V2-COPY-01):

                   "Your order is placed. Settle by:
                    · Wallet — already debited.
                    · Bank transfer — upload proof on the receipt.
                    · Cash on delivery — pay rider on arrival.
                    Track at marketplace.henrycogroup.com/account/orders."

                 Tune for actual app flow. The existing copy is
                 silent / minimal; replace with the explicit guide.

    Path (b): integrate Paystack / Flutterwave / Stripe — SCOPE
              EXPANSION; classify as V3 if owner picks (b).

    Path (c): owner-defined.

  Self-verify: every checkout-experience CTA is LIVE; all three
  payment paths render their respective receipt surfaces; no
  console errors on the path; copy reads in HenryCo voice.

P2.2 BUG B — Studio /pay/[paymentId] slow load
  URL: studio.henrycogroup.com/pay/<paymentId>
  Recon (orchestrator pre-reconned):
    apps/studio/app/pay/[paymentId]/page.tsx:74-83 — SEQUENTIAL awaits:
      const viewer = await getStudioViewer();
      const workspace = await getPaymentWorkspace({...});
    workspace consumes viewer.id, so a naive Promise.all won't work
    without refactoring. Two parallelization paths:

  Fix steps:
    1. Refactor inside getPaymentWorkspace to parallelize its
       internal fetches (bank-details + project + payment fetches
       in Promise.all). This yields the largest speedup if the
       sequential awaits are inside this function.
    2. Add route segment cache:
       export const revalidate = 30;  // seconds
       (use a tighter window if the payment status changes more often)
    3. Dynamic imports for non-critical components below the fold:
       const StudioPaymentGuide = dynamic(
         () => import('./StudioPaymentGuide'),
         { ssr: true, loading: () => <Skeleton/> }
       );
    4. Image priority on hero — N/A (no hero image; HenryCoHeroCard
       at lines 136-187 is text-only).

  Self-verify: Lighthouse on a representative paymentId reports LCP
  < 2.5s, INP < 200ms, no CLS regression. curl Server-Timing header
  shows the parallel fetch landed. Persist Lighthouse run at
  .codex-temp/v5-clear/p2-bug-b-lighthouse.md.

P2.3 BUG C — Studio /request page worthless
  URL: studio.henrycogroup.com/request
  Recon (orchestrator pre-reconned):
    apps/studio/app/request/page.tsx — already redesigned in commit
    33e7f44 with three calm paths (copilot/custom/templates).
    Mobile-first, max-w-[88rem], path resolution server-side.

  G0.5 disposition — execute per owner answer:
    Default: target is the copilot UX inside the redesigned landing.
             Polish:
               · Faster perceived response on copilot first-token
                 (< 800ms target)
               · Calmer step labels (already partially done in 33e7f44
                 follow-ups; check current state)
               · Mobile typography scale at 375 / 390 / 430
               · Empty-state when copilot fails (no fallback to
                 marketing copy)
    If owner names a different sub-aspect, address that.

  Owner direction note: the /pay/[paymentId] route is the single
  canonical payment surface for studio. /request stays as the
  request-creation entry. There is NO consolidation step IN
  V5-CLEAR — both surfaces live.

  Self-verify: copilot first-token < 800ms on a clean session;
  three paths render correctly on mobile (375/390/430); no
  console errors; HenryCo voice on every label.

P2.4 BUG D — Action button missing spinner microinteractions
  Surfaces: "Go to payment", "Submit payment proof", any other
            primary action lacking idle/pending/disabled/spinner/
            success-lock pattern.
  Recon (orchestrator pre-reconned):
    Canonical primitive: PublicButton at
    packages/ui/src/public/public-button.tsx:1-90.
      idle / pending / disabled / spinner — PRESENT
      success-lock — MISSING
  Fix:
    1. Add success-lock state to PublicButton.
       New props:
         success?: boolean (controlled)
         successDuration?: number (defaults 1200ms before clearing
         externally — controlled component pattern)
       Visual: subtle accent flash + lock icon swap; pointer-
       events disabled during success-lock window so a click cannot
       trigger a second submit.
    2. Audit primary-action button consumers in the surfaces listed
       above (and any other one-shot commit button surfaced during
       recon). Wire `success` prop where the button represents a
       one-shot commit (payment submit, proof upload, plan select).
    3. Microinteraction tokens: 200ms ease-out fade+soft-scale on
       click. Reuse the existing PublicMotionTokens.routeFadeMs
       motion language at packages/ui/src/public-shell/public-tokens.ts:123-133.

  Lifecycle: V5-CLEAR adds success-lock to PublicButton as the
  production primitive. When DASH-1 ships @henryco/dashboard-shell's
  ActionButton, that becomes canonical; PublicButton's success-lock
  may be deprecated alongside the shell-primitives migration
  (DASH-2 onward). Until then, PublicButton is the live primitive.

  Self-verify: representative payment submit + proof upload buttons
  exhibit the full state cycle on a test transaction; click-twice
  is prevented during the success-lock window; motion tokens applied.

P2.5 BUG E — Marketplace following page shows no data
  URL: marketplace.henrycogroup.com/account/following
  Recon target list:
    - Schema: search apps/marketplace/supabase/migrations/ for
      "follow", "follower", "subscription" tables.
    - Page wiring: apps/marketplace/app/account/following/page.tsx
      — is the data layer wired to the schema? Does it import
      from apps/marketplace/lib/marketplace/data.ts or similar?
    - Empty state: distinguishable from broken state? Premium copy?

  Decision tree:
    If schema exists + query broken → fix the query.
    If schema exists + query correct + no data → ship a premium
      empty state in HenryCo voice teaching what following means
      + clear path to follow a store / account / vendor.
    If schema does not exist → V3 feature work; ship a graceful
      deferred state with clear next-step copy.

  Audit other account-style pages for the same "claims user-scoped
  data but renders empty without explanation" pattern. Common
  offenders to check (confirm paths via Glob in recon):
    - apps/marketplace/app/account/saved/page.tsx (saved items)
    - apps/marketplace/app/account/recently-viewed/page.tsx
    - apps/marketplace/app/account/orders/page.tsx (order history)
    - apps/marketplace/app/account/messages/page.tsx
    - apps/account/app/dashboard/saved-items/page.tsx
  Per-page disposition documented in
  .codex-temp/v5-clear/p2-account-empty-states-audit.md.

  Self-verify: the fixed page renders correctly when the user has
  followers AND when they have none; both states are premium and
  distinguishable; no broken-state false positive.

P2.6 BUG F — Jobs candidate workspace looks cheap and templated
  URL: jobs.henrycogroup.com/candidate/
  Owner direction: do NOT rebuild from scratch in V5-CLEAR (full
  rebuild is V3 jobs work). Apply premium polish so the page is
  not embarrassing while shipping.
  Polish targets:
    - Replace cheap card patterns with the closest existing Panel-
      class composition (use packages/ui/src/public-shell/* + the
      V2-COPY-01 voice patterns until DASH-1's @henryco/dashboard-
      shell.Panel lands).
    - Replace default tailwind spacing with HenryCo spacing scale
      (use the tokens in packages/ui/src/public-shell/public-tokens.ts).
    - Replace cheap copy with HenryCo voice (V2-COPY-01 patterns).
    - Add the motion language (200ms ease-out fade+soft-scale via
      PublicMotionTokens).
    - Replace any emoji-as-icon with the icon set used elsewhere.
    - Replace any `bg-blue-*` primary with HenryCo black/gold/cream.

  The goal is acceptable interim until V3 jobs rebuild ships.

  Self-verify: the candidate workspace renders without obvious
  template signatures; all CTAs are LIVE; no console errors; no
  cheap copy ("Welcome!", "Awesome!", "Yay!", emoji-as-icon).

P2.7 BUG G — Scrolling lag on mid-range Android
  Surfaces: jobs, learn, property, some studio pages.
  Recon:
    Identify what is causing the scroll jank. Common causes:
      · overflow-scroll on too-deep tree (forces relayout per
        scroll frame)
      · scroll listeners triggering layout thrash
      · large background images blocking paint
      · framer-motion animations tied to scroll without transform-
        only optimization
      · fixed-position elements causing repaints
    Use Chrome DevTools Performance panel on a mid-range Android
    via remote debugging OR BrowserStack equivalent. Pixel 5 /
    Galaxy A52 are reasonable proxies.

  Fix:
    Common interventions:
      · passive scroll listeners (addEventListener with
        {passive: true})
      · will-change hints on scrolling containers (use sparingly —
        too many breaks GPU compositing)
      · transform-only animations (translateY, scale) instead of
        top / height / width changes
      · content-visibility: auto on long off-screen lists
      · reduce fixed-position elements; consider sticky alternatives
      · lazy-load below-fold images via next/image with priority
        only on hero
    Verify the fix on the same device/emulator; capture FPS pre/post.

  Self-verify: scroll FPS ≥ 55 on the affected surfaces after fix
  on a mid-range Android profile; no new layout thrash entries.
  Persist FPS readings at .codex-temp/v5-clear/p2-bug-g-fps.md.

P2.8 PHASE 2 CLASSIFICATION
  P2-COMPLETE — every bug fixed and verified live OR named PARTIAL.
  P2-PARTIAL — bugs that defer to V3, each with explicit reason
                and owner sign-off (e.g. Bug A path (b) → V3,
                Bug F full rebuild → V3 jobs).
  P2-BLOCKED — structural blocker (e.g. external PSP credentials
                missing for Bug A path (b) if chosen).

  Persist at .codex-temp/v5-clear/phase-2.md.

══════════════════════════════════════════════════════════════════════
PHASE 3 — TEXT TONE TOKEN PASS
══════════════════════════════════════════════════════════════════════

Do NOT start until Phase 2 classified.

P3.0 RECON CURRENT TEXT COLOR TOKENS
  Canonical location (orchestrator-pre-reconned):
    packages/ui/src/public-shell/public-tokens.ts:16-46

  Current values (paraphrased; confirm in recon via Read):
    Surface.text:         var(--site-text, rgba(255,255,255,0.96))
    Surface.textSoft:     var(--site-text-soft, rgba(255,255,255,0.70))
    Surface.textMuted:    var(--site-text-muted, rgba(255,255,255,0.52))
    Typography.heading:   text-zinc-950 / dark:text-white
    Typography.body:      text-zinc-700 / dark:text-white/75
    Typography.caption:   text-zinc-500 / dark:text-white/55

  Map every text-color consumer surface across the platform:
    grep -rE "site-text|dark:text-white" apps/ packages/

  Persist at .codex-temp/v5-clear/p3-token-recon.md.

P3.1 NEW TOKEN VALUES (G0.3 — owner-confirmed at G0)
  Recommended (ship these unless owner tunes at G0):
    Primary text on dark    = #F5F1E8  (warm off-white)
    Secondary text on dark  = #C9C2B6  (warm gray, warm undertone)
    Tertiary text on dark   = #8A857C  (cooler gray)
    Accent text (gold)      = existing gold value (emphasis only,
                              not body)
    Primary text on light   = existing #18181B (zinc-950)
    Secondary text on light = warm gray TBD (owner confirms)

  These values are starting points. Tune for actual visual feel
  against existing surfaces. Document any tuning at G0.3 and
  persist to .codex-temp/v5-clear/p3-token-tuning.md.

P3.2 APPLY TOKENS
  Update the canonical token file:
    packages/ui/src/public-shell/public-tokens.ts:16-46
  Update the typography token chain at the same file.
  Update the consumer tailwind classes if needed (search for
  dark:text-white pattern; replace with the new token reference
  OR ensure the token reference is read where dark:text-white
  was used).

  Do NOT touch packages/dashboard-shell tokens (DASH-1 ships those;
  V5-CLEAR's text-color decision will inform DASH-1's primitives).

  Ensure WCAG AA contrast on every background the tokens are used
  against. Use a contrast checker (axe-core, Stark, or WebAIM CLI)
  on representative surface combinations.

P3.3 VERIFY ACROSS SURFACES
  Walk five canonical pages with the new tokens applied:
    1. account.henrycogroup.com/ (consumer dashboard home)
    2. hq.henrycogroup.com/ (owner shell home)
    3. marketplace.henrycogroup.com/ (marketplace home)
    4. care.henrycogroup.com/ (care home)
    5. property.henrycogroup.com/ (property home)
  Confirm: text reads warmer + not jarring; contrast remains
  accessible; no visual regression on dark surfaces.

  axe-core run on each:
    npx @axe-core/cli https://account.henrycogroup.com/
    (etc.)
  Persist results at .codex-temp/v5-clear/p3-axe-results.md.

P3.4 PHASE 3 CLASSIFICATION
  P3-COMPLETE — tokens shipped at canonical location, 5-page
                walkthrough confirms warmer feel, axe-core 0
                contrast violations on the touched surfaces.
  P3-PARTIAL — tokens shipped on a subset of surfaces; named
                surfaces still on old tokens with explicit reason.
  P3-BLOCKED — token change introduces unfixable contrast
                regression on a critical surface.

  Persist at .codex-temp/v5-clear/phase-3.md.

══════════════════════════════════════════════════════════════════════
ANTI-PATTERNS — across all three phases
══════════════════════════════════════════════════════════════════════

NEGATIVE (do NOT):
  · Redesign anything beyond the named bugs.
  · Add new features.
  · Skip live verification.
  · Regress V2-PNH-* security headers.
  · Regress V2-COPY-01 voice (any new copy is in HenryCo voice).
  · Regress V2-EMAIL-BRAND-01 brand strap.
  · Say "should work."
  · Weaken auth or RLS.
  · Commit credentials.
  · Skip persisted reports.
  · --no-verify on commits.
  · Mix multiple pass anchors in a single commit.
  · Touch DASH-1 foundations or any DASH-* prompt during V5-CLEAR.
  · Apply Phase 3 tokens to packages/dashboard-shell (DASH-1 owns).
  · Delete branches via `git branch -D` without owner sign-off.

POSITIVE (DO):
  · Every PR references its persisted .codex-temp report.
  · Every state-change in working tree is justified by a pass
    anchor (one anchor per commit).
  · Every claim cites file:line.
  · Every "verified" claim cites the verification step that
    confirmed it.
  · Every UNVERIFIED bullet is named and surfaced in the report.
  · Phase classification is one of the named tiers; no "mostly
    complete" or other ad-hoc tiers.

══════════════════════════════════════════════════════════════════════
VERIFICATION REQUIREMENT — V1-V13 gates per phase
══════════════════════════════════════════════════════════════════════

Per master §3 (DASHBOARD-REBUILD-PROMPT-V2-FINAL.md):

V1 build/typecheck/lint   — PASS REQUIRED at end of each phase.
V2 auth-continuity         — PASS REQUIRED at end of P1; spot-check
                             at P2/P3.
V3 RLS verification         — PASS REQUIRED at end of P1 (security
                             migration); N/A on P2/P3 visual fixes.
V4 Realtime smoke           — N/A (V5-CLEAR doesn't touch realtime).
V5 Mobile parity            — PARTIAL on P2 (per-bug surfaces);
                             PASS REQUIRED on P3 (token surfaces).
V6 Lighthouse + CWV         — PASS REQUIRED on Bug B fix; PASS on
                             P3 5-page walkthrough.
V7 WCAG AA                   — PASS REQUIRED on P3 axe-core run.
V8 Sender identity           — PASS REQUIRED at end of P1 (email
                             dispatch grep against V2-EMAIL-BRAND-01
                             receivers).
V9 CTA reality               — PASS on Bug A polish; PASS on Bug F
                             jobs candidate workspace.
V10 Empty/loading/error/success — PASS on Bug E account-style pages
                             audit.
V11 No console errors        — PASS REQUIRED at end of each phase
                             on the touched surfaces.
V12 No 4xx/5xx               — PASS REQUIRED at end of P1 (5-domain
                             smoke); PASS on P2 fix surfaces.
V13 Role × division coverage — PARTIAL on P2 (per-bug surfaces);
                             PASS on P3 5-page walkthrough.

══════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
══════════════════════════════════════════════════════════════════════

Per phase:
  Files modified — file:line ranges
  PRs opened — title / merge SHA / production deploy ID
  Recon findings — table per phase (P1: branch inventory, P2: per-
                   bug recon, P3: token consumer map)
  Verification evidence — per V1-V13 applicable subset, with
                          citations
  Self-verification check — name every UNVERIFIED bullet
  Anti-pattern audit — PASS / FAIL / N/A per item
  Classification — P1/P2/P3-COMPLETE | -PARTIAL | -BLOCKED

Final report at .codex-temp/v5-clear/report.md combines:
  · Combined inventory across phases
  · Combined PR list with merge SHAs and deploy IDs
  · DASH-1 PRE-FLIGHT 5-ITEM ANSWERS (deliverables, not pending):
    (a) Brevo Auth SMTP proof status
    (b) staffhq.henrycogroup.com redirect-loop verification (curl
        transcript)
    (c) Vercel preview build budget confirmation
    (d) Track A canonical host confirmation (account.henrycogroup.com)
    (e) Track C canonical surface URL decision
        (staff.henrycogroup.com or staffhq.henrycogroup.com)
  · Hand-off — DASH-1 starting branch + posture

PR title convention:
  feat(<scope>): V5-CLEAR <phase> — <subject>
  fix(<scope>): V5-CLEAR <phase> — <subject>
  chore(<scope>): V5-CLEAR <phase> — <subject>

PR body: paste the per-phase report section + cite the persisted
report file path.

══════════════════════════════════════════════════════════════════════
V2 SCOPE BOUNDARY
══════════════════════════════════════════════════════════════════════

NOT permitted in V5-CLEAR:
  · DASH-1 foundations work (DASH-1 owns).
  · @henryco/dashboard-shell primitives (DASH-1 owns).
  · packages/auth refactor (DASH-1 owns).
  · packages/data refactor (DASH-1 owns).
  · packages/observability scaffold (DASH-1 owns).
  · public.get_signal_feed SQL function (DASH-1 owns).
  · @sentry/nextjs wiring (DASH-1 owns).
  · Track B owner dashboard (DASH-8).
  · Track C staff dashboard (DASH-9 — pending owner review).
  · New divisions / AI agents / V3 features.
  · PSP integration for marketplace UNLESS owner picks G0.4 path
    (b) explicitly (in which case classified P2-PARTIAL with
    explicit V3 follow-up).

══════════════════════════════════════════════════════════════════════
PERSISTED-REPORT REQUIREMENT
══════════════════════════════════════════════════════════════════════

  .codex-temp/v5-clear/g0-decisions.md                    (G0)
  .codex-temp/v5-clear/preflight-dirty-tree-inventory.md  (orchestrator
                                                            head-start)
  .codex-temp/v5-clear/preflight-stash-audit.md           (head-start)
  .codex-temp/v5-clear/preflight-branch-audit.md          (head-start)
  .codex-temp/v5-clear/p1-inventory.md                    (P1.0)
  .codex-temp/v5-clear/p1-email-strap-proof.md            (P1.3)
  .codex-temp/v5-clear/p1-voice-walkthrough.md            (P1.3)
  .codex-temp/v5-clear/phase-1.md                         (P1.4)
  .codex-temp/v5-clear/p2-bug-a-recon.md                  (P2.0/A)
  .codex-temp/v5-clear/p2-bug-b-recon.md                  (P2.0/B)
  .codex-temp/v5-clear/p2-bug-b-lighthouse.md             (P2.2)
  .codex-temp/v5-clear/p2-bug-c-recon.md                  (P2.0/C)
  .codex-temp/v5-clear/p2-bug-d-recon.md                  (P2.0/D)
  .codex-temp/v5-clear/p2-bug-e-recon.md                  (P2.0/E)
  .codex-temp/v5-clear/p2-bug-f-recon.md                  (P2.0/F)
  .codex-temp/v5-clear/p2-bug-g-recon.md                  (P2.0/G)
  .codex-temp/v5-clear/p2-bug-g-fps.md                    (P2.7)
  .codex-temp/v5-clear/p2-account-empty-states-audit.md   (P2.5)
  .codex-temp/v5-clear/phase-2.md                         (P2.8)
  .codex-temp/v5-clear/p3-token-recon.md                  (P3.0)
  .codex-temp/v5-clear/p3-token-tuning.md                 (P3.1)
  .codex-temp/v5-clear/p3-axe-results.md                  (P3.3)
  .codex-temp/v5-clear/phase-3.md                         (P3.4)
  .codex-temp/v5-clear/report.md                          (final)

══════════════════════════════════════════════════════════════════════
END OF V5-CLEAR FORGED PROMPT
══════════════════════════════════════════════════════════════════════
```

---

## Authoring notes (not part of the prompt — for owner review)

- **Why six G0 owner-blocking gates.** The V5-CLEAR prompt has six decisions only the owner can make: the canonical-domain smoke list, division test mailboxes, text color hex values, marketplace checkout disposition, Studio /request specific concern, and the DASH-1 pre-flight 5-item answers. Folding them as G0 gates inside the prompt (rather than blocking before the prompt fires) lets V5-CLEAR start its recon work before the owner has fully decided, while pinning the decisions before any code gates open.

- **Why the orchestrator pre-reconned Bugs A through D.** These four had the most uncertainty (provider integration state, perf bottleneck source, redesign current state, missing button state). Pre-reconning them in the orchestrator session gives Claude Code accurate ground truth and prevents wasted recon cycles.

- **Why the 30 M-files inventory is a head-start artefact.** The dirty tree is a coherent V2 consolidation, not orphan scratch. Pre-demixing it lets Claude Code's P1.2 commit-by-pass-anchor demixing succeed in the first try rather than playing detective on each file.

- **Why DASH-1 pre-flight 5 items are FINAL REPORT deliverables, not pending bullets.** The V5-CLEAR pasted draft mentioned them as pending; the orchestrator promotes them to deliverables. V5-CLEAR has the operational visibility (Vercel access, Brevo ops contact, staffhq curl, DNS) to ANSWER these during its execution. Folding them into V5-CLEAR's contract means DASH-1 fires the moment V5-CLEAR-COMPLETE classifies — no separate handoff round.

- **Why Bug A Path (a) is recommended over Path (b).** Manual flow with payment-team verification is the current design. Adding PSP integration is V3 scope (new payment rail) and would expand V5-CLEAR's blast radius significantly. Polishing the deferred-state copy in HenryCo voice gives users immediate clarity without changing the settlement model. PSP integration can ship as its own V3 pass when the owner is ready.

- **Why PublicButton's success-lock lands now even though DASH-1 ships ActionButton.** PublicButton is the live production primitive; DASH-1's ActionButton lands later. Adding success-lock to PublicButton gives Phase 2 surfaces (payment submit, proof upload) the click-twice-prevention they need NOW. When DASH-1's ActionButton lands and migrates consumers, PublicButton's success-lock can be deprecated without a regression window.

- **Why Phase 3 doesn't consolidate motion tokens.** V5-CLEAR Phase 3 scope is text color only. Motion tokens are distributed across packages (notifications-ui, chat-composer, public-shell) and consolidating them would expand Phase 3 into its own pass. The hardened prompt explicitly scope-guards motion to read-only.

— end of V5-CLEAR forged prompt and authoring notes —
