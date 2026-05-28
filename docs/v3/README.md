# V3 Strategic Plan — Index

**Pass:** V3 Strategic Architect (consolidated output)
**Compiled:** 2026-05-17
**Author:** Claude · Opus 4.7 (1M context) · maximum effort
**Status:** Complete. Ready for execution.

This directory is the entire V3 plan for HenryCo. 96 passes mapped against the 12-pillar Vision (P1–P12) plus the owner's "finish the base before chasing brilliance" priority. Every pass is self-contained — copy the prompt into a fresh Claude window and the pass starts.

If you have 5 minutes, read `OWNER-BRIEF.md`.
If you have 30 minutes, also read `AUDIT-BASELINE.md`, `MASTER-PLAN.md`, and `DECISIONS-REQUIRED.md`.
If you're starting a pass, open `prompts/v3-NN-*.md` for that pass and execute.

---

## Read order

1. **`OWNER-BRIEF.md`** — 5-min phone read. What V3 is, top 5 decisions, recommended first phase.
2. **`AUDIT-BASELINE.md`** — Ground-truth state of HenryCo as of audit (2026-05-17). Builds on the V5-5 V3 discovery inventory.
3. **`PASS-REGISTER.md`** — All 96 passes enumerated. Look up any pass by ID here.
4. **`MASTER-PLAN.md`** — Execution roadmap per phase. Wave structure. Timeline.
5. **`DECISIONS-REQUIRED.md`** — 16 owner decisions; each blocks specific passes.
6. **`DEPENDENCIES.md`** — Directed graph: what blocks what; what unblocks when.
7. **`LEGAL-AND-BUSINESS.md`** — 18 non-code prerequisites (legal entities, KYC contracts, app store accounts, trademarks).
8. **`ANTI-CLONE.md`** — 12 defense-in-depth patterns that cross-cut every pass.
9. **`INTEGRATION-KEYS.md`** — Single source of truth for env vars + integrations. **Every pass cites this.** No hardcoded keys, anywhere.
10. **`prompts/v3-NN-*.md`** — One self-contained prompt per pass (96 files).
11. **`audit/`** — Deeper per-domain audits (foundation-base-lock + pillar-gap-map; deferred for follow-up session due to sub-agent rate-limit).

---

## What this plan delivers

- **96 V3 passes** across 9 phases (A-I).
- **One executable prompt per pass.** Each is self-contained — no conversation-history dependency.
- **A single source of truth for integration keys** (`INTEGRATION-KEYS.md`) so no pass hardcodes anything.
- **Foundation Lock first.** Phase B (12 passes) closes every "boring essential" the owner named before any new feature pillar starts.
- **Money + Identity + AI hardened next** (Phase C-D). Real payments, real KYC, governed AI, no provider name in UI.
- **Personalization + Automation + Product expansion** (Phase E-G). Personalized home, fraud prediction, workflow engine, services platform, marketplace ranking, jobs interview room, business profiles, gaming arena (gated).
- **Partner + Enterprise** (Phase H). Onboarding, payouts, business suites.
- **Platform + Mobile + Observability + Closure** (Phase I). Public API, store submissions, observability depth, integration test, launch readiness, showcase.

---

## The 12 pillars (V3 Vision)

| Pillar | Name | Focus |
|---|---|---|
| P1 | Product Expansion | Services platform, deals, business profiles, gaming (gated) |
| P2 | Wallet, Payments, Financial Spine | Stripe + Paystack + Flutterwave router, ledger, payouts |
| P3 | Personalization Engine | Per-user home, recommendations, recovery |
| P4 | HenryCo Intelligence Layer | Governed AI, usage billing, never-name-the-provider |
| P5 | Automation & Workflow | Engine, auto-assign, owner reports, campaigns |
| P6 | Predictive Intelligence | Fraud, quality, workload prediction |
| P7 | Trust, Safety, Compliance | KYC vendor, content moderation, abuse defense |
| P8 | Partner & Enterprise | Onboarding, payouts, business suites |
| P9 | Revenue & Monetization Integrity | Take rates, rewards, anti-abuse |
| P10 | Studio Live / Gaming Arena | Original games, PvP, stakes (gated on legal) |
| P11 | Platform & API | Public API, webhooks, developer docs |
| P12 | Global, Mobile, Observability, Closure | Multi-market, store submissions, traces, SLOs, launch |

---

## The 9 phases

| Phase | Name | Pass range | Wall-clock estimate |
|---|---|---|---|
| A | Audit | (this pass) | — |
| B | Foundation Lock | V3-01..V3-12 | 4–6 weeks |
| C | Money & Identity Spine | V3-13..V3-25 | 10–14 weeks |
| D | AI Intelligence Layer | V3-26..V3-33 | 8–12 weeks |
| E | Personalization & Predictive | V3-34..V3-42 | 10–14 weeks |
| F | Automation & Workflow | V3-43..V3-48 | 6–8 weeks |
| G | Product Expansion | V3-49..V3-66 | 24–32 weeks |
| H | Partner & Enterprise | V3-67..V3-75 | 14–20 weeks |
| I | Platform/API + Global/Mobile + Observability + Closure | V3-76..V3-96 | 20–28 weeks |

**Total: 96 passes. Wall-clock with parallelism: 9–18 months. Sequential: 22–31 months.**

---

## Naming convention

- `V3-NN-slug` (hyphenated) — the global V3 plan IDs. Used throughout this directory.
- `V3 PASS NN` (space-separated) — the pre-existing design-rebuild cycle (PASS 21–25; see `project_henryco_v3_pass21_rebuild_prompts.md`). NOT this plan.
- Sub-PR variants (where one pass has multiple PRs, e.g. V3-52 marketplace ranking has 5 sub-PRs) use `V3-NN.A` through `V3-NN.E`.

---

## How to execute a pass

1. Identify the pass ID (e.g., V3-01).
2. Open `prompts/v3-01-foundation-session-persistence.md`.
3. Copy the entire file contents into a fresh Claude window (or Codex / your team's tool).
4. The executor:
   - Reads the prompt.
   - Confirms prerequisites (Phase A, prior passes closed).
   - Confirms owner gates (DECISIONS-REQUIRED) answered.
   - Confirms integration keys (INTEGRATION-KEYS) available.
   - Builds code per Implementation Requirements.
   - Validates per Validation Gates.
   - Deploys per Deployment Gate.
   - Writes the final report.
5. When closed, mark the row in PASS-REGISTER + DEPENDENCIES as closed.

---

## Non-negotiables this plan preserves

- **No hardcoded keys, tokens, URLs, sender identities, or service names.** Use env vars. INTEGRATION-KEYS.md is the canonical inventory.
- **No fake loading states.** No "Preparing X" copy. PERF-01 + V3-05 enforce.
- **No dead links.** V3-06 enforces + CI gate.
- **No empty dashboards pretending to be active.** V3-08 enforces.
- **No hardcoded text.** Pattern A typed copy + Pattern B runtime DeepL. V3-07 closes remaining gaps.
- **No major flows without logs, states, fallback handling.** V3-10 enforces.
- **Every card opens the exact next step OR is honestly informational.** V3-11 audits.
- **Premium feels premium.** V3 PASS 25 typography + V3 PASS 21 editorial preserved through every later pass.
- **AI never names its provider in UI.** V3-26 + V3-28 enforce.
- **Money is honest.** V3-17 ledger + V3-21 tax + V3-22 finance dashboard preserve.
- **Foundation Lock closes before Phase C starts.** D11 + V3-12 enforce.
- **Polish is trust, not decoration.** Owner instruction; carried through every pass.

---

## What this plan does NOT do

- Does not propose passes V2 already shipped (verified against V3-DISCOVERY-INVENTORY).
- Does not introduce AI agents in customer-facing surfaces without owner explicit authorization (DASH-PROMPT-HARDEN-01 anti-pattern preserved).
- Does not introduce new locales (12 locales preserved; depth via V3-84).
- Does not migrate off Supabase or Vercel.
- Does not assume owner ambition in any market not committed via D10.
- Does not ship gaming arena (V3-65/66) without D2 + L7 legal sign-off per market.

---

## Cross-pass quality bar

Every V3 prompt MUST pass these non-negotiable checks:

- [ ] Lint, typecheck, tests, build all pass.
- [ ] `pnpm i18n:check` passes (no new hardcoded strings).
- [ ] PNH-04 security headers preserved.
- [ ] Sentry + structured logger emit on every mutating route (V3-10 baseline).
- [ ] Persisted report at `.codex-temp/v3-NN-<slug>/report.md`.
- [ ] Live walk evidence captured (curl + screenshots).
- [ ] No hardcoded keys / URLs / sender identities (grep enforced).
- [ ] Every integration in the pass cited in INTEGRATION-KEYS.md.
- [ ] Owner gate (if any) answered before merge.
- [ ] M / I / C-risk passes have additional review per ANTI-CLONE Principle 12.

---

## Recommended starting actions

1. **Owner reads OWNER-BRIEF.md** (5 min).
2. **Owner answers D1, D2, D3, D6, D11 inline** in DECISIONS-REQUIRED.md (10 min).
3. **Owner engages lawyer + accountant** on L4 (payment merchant onboarding), L5 (KYC vendor contract), L10 (trademark filings) — these have long lead times.
4. **Owner provisions remaining integration keys** per INTEGRATION-KEYS.md "Owner action" checklist.
5. **Spawn Wave B.1**: V3-01, V3-03, V3-05, V3-07, V3-09, V3-10 in parallel Claude sessions.
6. **Schedule a weekly 30-minute V3 sync** with yourself to review closures + answer the next decision batch.

---

## What's still TODO for V3 plan completeness

The deeper per-domain audits (`audit/foundation-base-lock.md` + `audit/pillar-gap-map.md`) were intended to ship as background sub-agent outputs but the sub-agents hit rate limits before producing their files. The audit content is captured at high altitude in `AUDIT-BASELINE.md §3 + §4`. A follow-up session can spawn these sub-agents fresh and produce the file-cited deep audits.

This is a documentation gap, not a planning gap. Every pass has the audit context it needs in its own prompt's "Audit summary" section.

---

## Author's note

This plan was written in a single autonomous session by Claude Opus 4.7 (1M context) on 2026-05-17 in response to the owner's request to "find and complete" the V3 plan started by an earlier session. It synthesizes:

- The V5-5 V3 discovery work (May 2026) — inventory + roadmap + backlog + fusion template.
- The post-V5-5 platform evolution — V3 PASS 21–25 design/dashboard rebuild, intelligence rollout, observability + payment-surface + auth packages, dashboard-modules registry, modular dashboard architecture.
- The owner's verbatim instruction: "Finish the base before chasing brilliance. Lock in the boring essentials first… polish is not cosmetic, it is trust… the job is not just to build features, it is to make the system feel inevitable."
- The 12-pillar V3 Vision per the owner's strategic architect prompt.
- The specific instruction to never hardcode keys and to wire active env-var integrations (Mapbox, Supabase, Stripe, Paystack, Flutterwave, Anthropic, Cloudinary, OneSignal, Sentry, etc.) where they add real value.

If a future session disagrees with anything here, the future session wins and updates this directory. The plan is a living artifact.

The owner can read OWNER-BRIEF.md on a phone in five minutes and know exactly what V3 is, how many passes it takes, what decisions are blocking, which phase to start first, and where every detailed prompt lives.

That's the plan. Ship it.
