# V3 Master Plan

**Pass:** V3 Strategic Architect (Phase D output)
**Compiled:** 2026-05-17
**Status:** The owner's single reference for V3 execution order. Cite this when sequencing any V3 work.

This is the execution roadmap. Reads top-to-bottom. Every recommendation is owner-overridable.

---

## One-paragraph summary

V3 is the 12-pillar build that turns HenryCo from a multi-division V2 baseline into a premium ecosystem at scale. It runs as **9 phases (A–I)** containing **96 passes total**. Phase A is this audit pass. Phase B is the FOUNDATION LOCK — 12 passes that close every "boring essential" the owner named, and which gate every later phase. Phases C–F are the strategic core (money + identity + AI + personalization + automation). Phases G–I are the product expansion, partner/enterprise build, and platform/closure work. The critical path is ~27 sequential passes; realistic wall-clock is 9–18 months depending on owner availability + legal sign-offs + parallelization.

---

## Execution principles (lifted from owner instruction + memory)

1. **Finish the base before chasing brilliance.** Phase B closes before Phase C starts. No exceptions.
2. **Every page does one clear job.** Per-pass prompts include the "does this card open the exact next step?" question as an explicit gate.
3. **Build with proof, not hope.** Every pass ends with live-walk evidence, not assertion.
4. **Polish is trust, not decoration.** Acceptance gates count broken states as blockers, not nice-to-haves.
5. **Premium ecosystem, not thin marketplace.** Every pass is owner-quality, never "shipped and forgotten".
6. **Parallel sessions are real.** Owner runs multiple Claude/Codex sessions on this tree. Branches and stashes appear mid-pass. Re-check state before destructive ops (memory `project_henryco_parallel_sessions.md`).
7. **One-thing-well + stop, over bulk batches.** Per-pass scope is finite; passes hand off to siblings cleanly. (memory `feedback_clean_works_over_bulk.md`)

---

## Phase-by-phase execution order

### Phase A — Audit (this pass)

**Goal:** Ground-truth baseline for V3 forging.
**Output:** `docs/v3/AUDIT-BASELINE.md`, `docs/v3/PASS-REGISTER.md`, `docs/v3/MASTER-PLAN.md`, `docs/v3/DECISIONS-REQUIRED.md`, `docs/v3/DEPENDENCIES.md`, `docs/v3/LEGAL-AND-BUSINESS.md`, `docs/v3/ANTI-CLONE.md`, `docs/v3/OWNER-BRIEF.md`, `docs/v3/audit/foundation-base-lock.md`, `docs/v3/audit/pillar-gap-map.md`, plus per-pass prompts under `docs/v3/prompts/`.
**Exit:** Owner reads `OWNER-BRIEF.md` and chooses which Phase B passes to start first.

### Phase B — FOUNDATION LOCK (V3-01 through V3-12)

**Goal:** Make the base feel solid. No fake loading. No dead links. No empty dashboards. No hardcoded text. Sessions persist. Auth is reliable. Notifications are real. Deep links work. Every card has one job. Mobile feels native.

**Duration:** 4–6 weeks (most passes parallelizable; D11 acceptance gate adds 1 week).

**Wave structure:**
- **Wave B.1 (week 1):** V3-01 (session), V3-03 (notification states), V3-05 (loading theater), V3-07 (hardcoded text), V3-09 (mobile), V3-10 (logs) — parallel
- **Wave B.2 (week 2–3):** V3-02 (auth), V3-06 (dead links), V3-08 (empty dashboards) — depend on wave 1
- **Wave B.3 (week 3–4):** V3-04 (deep links), V3-11 (one-job-per-card) — depend on wave 2
- **Wave B.4 (week 4–6):** V3-12 (acceptance test + owner sign-off)

**Exit gate (D11):** Owner signs off that the foundation is locked. Until this gate clears, Phase C does not start.

### Phase C — MONEY & IDENTITY SPINE (V3-13 through V3-25)

**Goal:** Real payment processing across Stripe + Paystack + Flutterwave. Hardened ledger. KYC vendor integration. Cross-division content moderation.

**Duration:** 10–14 weeks (passes parallelizable per-provider; legal/vendor decisions extend wall-clock).

**Wave structure:**
- **Wave C.1:** V3-13 (provider router) alone — sequential start
- **Wave C.2 (parallel):** V3-14 (Stripe), V3-15 (Paystack), V3-16 (Flutterwave), V3-17 (ledger), V3-21 (tax), V3-24 (KYC), V3-25 (moderation)
- **Wave C.3 (parallel):** V3-18 (receipts), V3-20 (subscriptions), V3-22 (finance dashboard), V3-23 (native-app compliance)
- **Wave C.4:** V3-19 (refunds + reconciliation) — depends on all providers + ledger

**Owner gates:** D1 (provider activation), D5 (tax engine), D6 (KYC vendor), D9 (monetization rates partial).

**Exit:** Real payments flowing on at least one provider in at least one country, with full reconciliation + refund + dispute capability. Receipts/invoices PDF-delivered. KYC vendor integrated.

### Phase D — AI INTELLIGENCE LAYER (V3-26 through V3-33)

**Goal:** Governed AI surface across HenryCo with usage billing tied to wallet. "HenryCo Intelligence" never names the underlying provider.

**Duration:** 8–12 weeks. V3-27 (usage billing) is the cornerstone and gates every personal-task surface.

**Wave structure:**
- **Wave D.1:** V3-26 (provider router) alone
- **Wave D.2:** V3-27 (usage billing) + V3-33 (personal-task gating) parallel
- **Wave D.3:** V3-28 (HenryCo Intelligence chat surface) after billing exists
- **Wave D.4 (parallel):** V3-29 (support assist), V3-30 (business message assist), V3-31 (account check), V3-32 (studio domain + brief)

**Owner gates:** D3 (provider selection), D4 (margin ratification).

**Exit:** Authenticated user with positive wallet can use HenryCo Intelligence for personal tasks; cost is metered against wallet; company-critical tasks are free; provider name never appears in UI; per-task usage dashboard live.

### Phase E — PERSONALIZATION & PREDICTIVE (V3-34 through V3-42)

**Goal:** Per-user personalization across home, deals, recommendations, recovery, next-action. Predictive intelligence beyond rules-based.

**Duration:** 10–14 weeks. V3-34 (personalized home) is the foundation.

**Wave structure:**
- **Wave E.1:** V3-34 alone
- **Wave E.2 (parallel):** V3-35, V3-36, V3-37, V3-38, V3-39 — personalization fan-out
- **Wave E.3 (parallel):** V3-40 (fraud + risk), V3-41 (quality + workload) — predictive
- **Wave E.4:** V3-42 (predictive dashboards) — depends on predictions

**Exit:** Per-user home layout persistent; cross-division recommendations live; abandoned-task recovery campaigns running; fraud risk computed daily for accounts, listings, transactions; staff dashboards show trend + anomaly + recommendation per role.

### Phase F — AUTOMATION & WORKFLOW (V3-43 through V3-48)

**Goal:** Generalize scattered cron handlers + triage + reminders into a coherent workflow engine. Owner reports auto-generated.

**Duration:** 6–8 weeks.

**Wave structure:**
- **Wave F.1:** V3-43 (workflow engine foundation) alone
- **Wave F.2 (parallel):** V3-44 through V3-48 — fan-out

**Exit:** Single workflow engine in use; auto-assign + escalate live across support/dispute/KYC queues; owner reports delivered weekly + monthly + quarterly; neglected-queue detection paging staff; follow-up campaigns A/B-testing.

### Phase G — PRODUCT EXPANSION (V3-49 through V3-66)

**Goal:** Ship the actual new product surfaces named in the V3 vision. Care broadens to a Services platform. Marketplace ranks at scale. Property rules engine + Jobs interview room land. Studio motion/video added. Business profiles + seller academy. Concierge assistant. Gaming arena (gated on legal).

**Duration:** 24–32 weeks. The longest phase. Most passes are owner-quality customer-facing; cannot be rushed.

**Wave structure (highly parallel):**
- **Wave G.1:** V3-49 → V3-50 → V3-51 chain (services foundation)
- **Wave G.2 (parallel):** V3-52, V3-53, V3-54, V3-55, V3-56, V3-57, V3-60, V3-61 — all parallel-safe after Foundation Lock
- **Wave G.3:** V3-58, V3-59, V3-62, V3-63, V3-64 — depend on G.2
- **Wave G.4 (gated):** V3-65, V3-66 — sequential and gated on D2

**Owner gates:** D2 (gaming legal sign-off).

**Exit:** Care is a real services platform; marketplace discovery + ranking deployed; property rules engine governing listings; jobs interview room running with at least 50 completed interviews; studio motion/video pipeline shipping; business profiles + seller academy in use; concierge assistant guiding first-time users.

### Phase H — PARTNER & ENTERPRISE (V3-67 through V3-75)

**Goal:** Business-side suites. Partner onboarding + payouts. Enterprise tools per division.

**Duration:** 14–20 weeks.

**Wave structure:**
- **Wave H.1:** V3-67 → V3-68 → V3-69 chain (partner core)
- **Wave H.2 (parallel after H.1):** V3-70 through V3-75 — fan-out

**Exit:** Partners onboard with KYC + service area + contract; performance scored; payouts flowing on schedule with tax-compliant statements; enterprise suites in use across employer hiring, seller business, service-provider CRM, studio project suite, logistics business dashboard; bulk invoicing + team roles + company admin accounts live.

### Phase I — PLATFORM/API + GLOBAL/MOBILE + OBSERVABILITY + CLOSURE (V3-76 through V3-96)

**Goal:** Public API. Mobile apps shipped. Observability depth. Closure pass.

**Duration:** 20–28 weeks.

**Wave structure:**
- **Wave I.1:** V3-76 (API foundation) alone
- **Wave I.2 (parallel):** V3-77, V3-78, V3-79, V3-80, V3-81, V3-82 — API surfaces
- **Wave I.3:** V3-83 (developer docs)
- **Wave I.4 (parallel with API work):** V3-84 (global localization), V3-85 (per-market payment routing)
- **Wave I.5 (sequential, owner-decided):** V3-86 (mobile stack decision) → V3-87 (parity) → V3-88 (store submission)
- **Wave I.6 (parallel):** V3-89, V3-90, V3-91, V3-92, V3-93 — observability + compliance
- **Wave I.7 (sequential close):** V3-94 (integration test) → V3-95 (launch readiness) → V3-96 (showcase)

**Owner gates:** D8 (mobile stack), D10 (per-market localization commitment).

**Exit:** Public API documented and used by at least one partner; mobile apps shipped to App Store + Play Store; observability depth in place; V3 launch announced.

---

## Recommended first phase to execute

**Start Phase B (FOUNDATION LOCK) immediately.** Owner-decision gates are minimal (D11 is the exit gate, not entry). Most passes are parallelizable in the first wave. Closing Phase B unblocks every later phase.

**Within Phase B**, recommend executing in this order if owner can only fund one wave at a time:
1. **Wave B.1 first** — V3-01 (session), V3-03 (notification/message states), V3-05 (loading theater), V3-09 (mobile) — these are most user-visible and lowest-risk
2. **Wave B.2 second** — V3-02 (auth), V3-06 (dead links), V3-08 (empty dashboards)
3. **Wave B.3 third** — V3-04 (deep links), V3-11 (one-job-per-card)
4. **Wave B.4 close** — V3-12 (acceptance test)

If owner wants to start a Phase C pass in parallel with Phase B for time pressure: **V3-13 (provider router scaffold)** is the lowest-risk Phase C entry since it's a vendor-agnostic interface decision, not a live integration. But still recommend completing Phase B before Phase C wave 2 (the actual provider integrations).

---

## "Do not start phase X until phase X-1 closes" gates

| Phase | Gate | Why |
|---|---|---|
| Phase C | Phase B closes (D11 owner sign-off) | Money + Identity work on a soft base produces fragile high-stakes systems |
| Phase D | Phase C provider router (V3-13) closes | AI usage billing needs the payment ledger primitives |
| Phase E | Phase D usage billing (V3-27) closes | Personalization-with-AI needs the metered call path |
| Phase F | Phase D and Phase E foundations land | Workflow engine assumes personalization signals + AI surfaces |
| Phase G | Phase B + most of Phase C close | New product surfaces need real payments + identity to be honest |
| Phase H | Phase G partner-adjacent passes (V3-50) close | Business suites assume verified-provider model exists |
| Phase I | All prior phases produce content for API + closure | Public API exposes only what's solid; closure verifies the whole |

---

## Estimated rough timeline

(Assumes ~3 active passes in flight at any time, one owner sync per week for decisions, normal seasonality)

| Phase | Wall-clock (lo) | Wall-clock (hi) |
|---|---|---|
| A | — (this pass) | 1 week |
| B | 4 weeks | 6 weeks |
| C | 10 weeks | 14 weeks |
| D | 8 weeks | 12 weeks |
| E | 10 weeks | 14 weeks |
| F | 6 weeks | 8 weeks |
| G | 24 weeks | 32 weeks |
| H | 14 weeks | 20 weeks |
| I | 20 weeks | 28 weeks |
| **Total (sequential)** | **~96 weeks (~22 months)** | **~134 weeks (~31 months)** |
| **Total (with parallelization)** | **~40 weeks (~9 months)** | **~78 weeks (~18 months)** |

The wide range reflects owner-availability + legal-sign-off + parallelism choices. Recommended commit: 12 months of focused execution with a clear stop-and-stabilize at end of Phase F (month 6) and end of Phase G (month 10).

---

## Success bar per phase

- **Phase A:** This audit + complete prompt set on disk; owner reads OWNER-BRIEF in 5 minutes and starts Phase B.
- **Phase B:** Owner can browse every public + auth surface, open every notification, click every card, and never hit a fake state, dead link, hardcoded mismatch, or empty dashboard. Mobile feels native.
- **Phase C:** Real money moves with full reconciliation. KYC verifies real users via vendor. No identity surface ships without a real auth+vendor+ledger trail.
- **Phase D:** Every Intelligence call is metered, governed, and never names the provider. Wallet-zero blocks. Unauth blocks. Owner sees the margin in the finance dashboard.
- **Phase E:** Per-user surfaces are observably different from each other; fraud scoring catches at least one real fraud event in shadow-mode before going live.
- **Phase F:** Owner stops manually triaging support; queue health alerts paging instead of owner-noticing.
- **Phase G:** Care offers ≥ 5 broader services; Property rules engine governs 100% of new listings; Jobs interview room used in at least 50 hires; gaming gated until D2.
- **Phase H:** First external partner onboards end-to-end through self-service with payout in the wallet.
- **Phase I:** External developer integrates against the API in < 1 week from docs; mobile apps live in stores; observability surfaces three real production issues before users notice.

---

## Self-verification

- [x] All 9 phases described with goal + duration + wave structure + exit
- [x] Phase B "finish the base" placement preserved
- [x] Phase-to-phase gates enumerated
- [x] Critical path referenced (PASS-REGISTER provides detail)
- [x] Recommended first phase named (Phase B) with sub-order
- [x] Timeline ranges honest about parallelization + decision delays
- [x] Success bar named per phase
- [x] Execution principles lifted from owner instruction + memory
