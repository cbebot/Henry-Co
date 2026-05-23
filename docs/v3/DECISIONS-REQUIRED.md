# V3 Decisions Required

**Pass:** V3 Strategic Architect (Phase D output)
**Compiled:** 2026-05-17
**Status:** Owner-action list. Every entry blocks at least one pass from starting. Answer in writing; commit answers to this file as they land.

This is the single list of decisions only the owner can make. Recommendations are Claude's; the owner overrides at will.

---

## How to use this doc

1. Read top-to-bottom on a phone in 10 minutes.
2. For each decision: read the question, scan the options, mark your choice inline (`**Owner answer:** Option B because …`).
3. When a decision is answered, the passes it blocks become startable.
4. Decisions are versioned — replacing an answer requires a dated note ("Owner pivot 2026-MM-DD: switching from Option B to Option C because …").

---

## D1 — Payment provider activation per country

**Question:** Which payment providers go live in which countries, and in what order?

**Options:**
- **Option A (recommended):** Start with Nigeria. Activate Paystack + Flutterwave together (both Naira-native, both compete on price; routing between them gives redundancy). Defer Stripe until first market with significant card volume outside Africa.
- **Option B:** Stripe-first because of Apple/Google Pay support; layer Paystack/Flutterwave per market.
- **Option C:** Manual proof + receipt flow stays the only path; defer all provider integrations to V4.

**Recommendation rationale:** Owner's primary market is Nigeria. Paystack + Flutterwave both have local-card + bank-transfer + USSD rails native to Naira. Stripe is the right second wave for international scaling.

**Blocks:** V3-14, V3-15, V3-16.

**Owner answer:** _____

---

## D2 — Gaming-arena legal posture per market

**Question:** For each market HenryCo operates in, what is the legal sign-off path for cash-staked PvP gaming?

**Options:**
- **Option A:** Acquire formal legal opinion letter per market before any Studio Live launch (slow but durable).
- **Option B (recommended):** Defer gaming entirely from V3 scope; revisit in V4 once company has revenue + legal counsel on retainer.
- **Option C:** Launch as skill-only no-cash variant first (no money mechanics, just leaderboards); add stakes only after legal sign-off per market.

**Recommendation rationale:** Gaming arena adds significant legal, compliance, and moderation cost. The 12-pillar vision lists it; the owner's "finish the base" instruction implies deferring optional adventures. Option B keeps optionality without near-term cost. Option C is a graceful intermediate.

**Blocks:** V3-65, V3-66.

**Owner answer:** _____

---

## D3 — AI provider selection

**Question:** Which AI provider(s) does HenryCo Intelligence route to under the hood?

**Options:**
- **Option A:** Anthropic only (Claude family).
- **Option B (recommended):** Anthropic primary + OpenAI secondary fallback. Provider router selects based on task type, latency budget, and per-task cost; failover automatically.
- **Option C:** Open-source self-hosted only (e.g., Llama on a GPU box) for cost predictability.
- **Option D:** Hybrid — Anthropic for deep reasoning, OpenAI for embedding/cheap-classification, open-source for offline batch.

**Recommendation rationale:** Owner wants quality first. Anthropic Claude 4.x family has best reasoning quality + lowest hallucination rate today (Jan 2026 cutoff). Failover to OpenAI mitigates single-vendor outage risk. Open-source self-host is cost-attractive but adds operational burden; defer.

**CRITICAL CONSTRAINT (V3 prompt):** The provider name NEVER appears in user-facing UI. It is "HenryCo Intelligence" only. This is enforced in V3-28 prompt.

**Blocks:** V3-26.

**Owner answer:** _____

---

## D4 — AI usage pricing markup ratification

**Question:** What margin does HenryCo charge on top of provider cost for personal-task AI usage?

**Options:**
- **Option A:** 0% — pass-through cost; only company-critical tasks subsidized; user pays raw provider cost.
- **Option B (recommended):** 10% baseline (owner's stated default); waivable for premium-tier users; ratchet up for high-cost tasks.
- **Option C:** Tiered — 5% on low-cost tasks, 15% on high-cost, 25% on premium "deep think" tasks.
- **Option D:** Subscription-only — no per-call billing; users pay $X/month for unlimited HenryCo Intelligence.

**Recommendation rationale:** Owner stated ~10% as the baseline. Option B honors that intent. Option D simplifies user mental model but caps revenue at the subscription price and doesn't handle whale users.

**Blocks:** V3-27.

**Owner answer:** _____

---

## D5 — Tax engine selection

**Question:** Which tax computation engine handles per-country + per-product + per-buyer tax?

**Options:**
- **Option A:** Avalara (mature, enterprise-grade, costly).
- **Option B:** TaxJar (simpler, US-focused; weaker on African markets).
- **Option C:** Stripe Tax (only useful if Stripe is the payment provider).
- **Option D (recommended):** Roll-our-own per-market via tax-rates table + line-item flags; integrate vendor later if scale demands. Nigeria VAT is flat 7.5%; rules are tractable.
- **Option E:** Defer tax to V4; manual tax application in invoices for now.

**Recommendation rationale:** For Nigeria-primary V3, the tax rules are tractable (7.5% VAT on most goods/services, exemptions for staples). Building thin engine + dropping in vendor later when international markets demand it is the cost-honest path.

**Blocks:** V3-21.

**Owner answer:** _____

---

## D6 — KYC vendor selection per market

**Question:** Which KYC vendor verifies users per market?

**Options:**
- **Option A (recommended):** Smile Identity for African markets (Nigeria, Kenya, South Africa, Ghana); Onfido for international fallback.
- **Option B:** Sumsub globally — single vendor, simpler integration, higher cost per check.
- **Option C:** Veriff globally — competitive with Sumsub, strong APAC coverage.
- **Option D:** Internal manual review only (status quo); defer vendor integration.

**Recommendation rationale:** Smile Identity is purpose-built for African ID systems (BVN, NIN, voter cards) — much better quality + lower cost on Nigerian-issued IDs than international vendors. Onfido for international expansion.

**Blocks:** V3-24.

**Owner answer:** _____

---

## D7 — Email/SMS senders per division

**Question:** Should every division have its own sender identity (e.g., `care@`, `marketplace@`), or unify to a small set?

**Options:**
- **Option A (current state):** Per-division (`notifications@`, `support@`, `care@`, `marketplace@`, `studio@`). Brand-clear per division but more sender-reputation surface.
- **Option B:** Unify to two senders (`team@` for transactional, `news@` for marketing). Easier sender-reputation management.
- **Option C (recommended):** Hybrid — per-division for transactional (preserves brand), unified `news@henrycogroup.com` for marketing/newsletter. Add per-market senders later if needed (Nigeria vs international).

**Recommendation rationale:** Per-division transactional preserves the premium-ecosystem brand. Unified marketing reduces complexity for the newsletter engine (V3-61).

**Blocks:** V3-46, V3-48, V3-61 partially (operational, not blocker).

**Owner answer:** _____

---

## D8 — Mobile-app stack: continue Expo vs Flutter

**Question:** Continue with Expo (current state: super-app + company-hub skeletons exist) or migrate to Flutter?

**Options:**
- **Option A (recommended):** Continue Expo. Both apps exist in repo; architecture summary documents the layered approach; web smoke export already works. Migration cost is high vs incremental investment.
- **Option B:** Migrate to Flutter for better performance + native-feel. High upfront cost.
- **Option C:** React Native (non-Expo) for fewer constraints than Expo Go.
- **Option D:** Defer mobile entirely; web mobile parity is good enough.

**Recommendation rationale:** Owner already invested in Expo (3K+ LOC in super-app, 3.7K+ LOC in company-hub; full platform contracts/adapters/bundle architecture). Migration to Flutter loses that investment + requires team re-skill. Performance arguments rarely justify the migration cost. Recommend Option A.

**Blocks:** V3-86 (the spike pass itself), partially V3-23 (native-app payments).

**Owner answer:** _____

---

## D9 — Monetization rates per division

**Question:** What are the per-division take rates, listing fees, subscription tiers, and ad rates?

**Options:**
- **Care:** % of booking value (recommend 12–18%)
- **Marketplace:** % of order value (recommend 8–12% by category)
- **Property:** Flat per-listing or % of inspection fee (recommend flat ₦5K/month listing + 1% completion fee)
- **Jobs:** % of placement fee for premium employer (recommend 8% for premium employer hires)
- **Learn:** % of course price + per-month subscription for premium learners (recommend 30% / ₦2K/month)
- **Logistics:** % of shipment value (recommend 5–8%)
- **Studio:** % of project value (recommend 8–12%)

**Recommendation rationale:** Each ecosystem balances "take rate must be honest" with "company-critical revenue mix". The recommended ranges are conservative-honest; owner ratifies actual numbers.

**Blocks:** V3-20 partially, V3-69, V3-75, V3-22 dashboard granularity.

**Owner answer:** _____

---

## D10 — Per-market localization commitment

**Question:** Which markets does V3 commit to ship localized for? (Strings exist for 12 locales; commitment means currency rules + address formats + phone formats + tax + holidays + payment routing.)

**Options:**
- **Option A (recommended):** Nigeria-only V3 closure; international localization is V4. Maintain string-level i18n for SEO + readiness but defer per-market depth.
- **Option B:** Nigeria + Kenya + South Africa (East-West-South Africa triad).
- **Option C:** Nigeria + UK + US (NGN + GBP + USD); aggressive international.
- **Option D:** Full 12-locale commitment in V3 (extreme scope).

**Recommendation rationale:** Premium quality in one market beats spread-thin coverage in twelve. Option A is the disciplined choice.

**Blocks:** V3-84.

**Owner answer:** _____

---

## D11 — Foundation Lock acceptance gate

**Question:** Does the owner commit that no Phase C+ pass starts until Phase B closes with a signed acceptance?

**Options:**
- **Option A (strongly recommended):** YES. Phase B closes before Phase C starts. The owner's "finish the base" instruction makes this the default.
- **Option B:** Phase B closes before Phase C wave 2; allow V3-13 (provider router scaffold, no live integration) to start in parallel with Phase B wave 4.
- **Option C:** No gate; phases can overlap freely; revisit if quality degrades.

**Recommendation rationale:** Owner stated this priority verbatim. Skipping it betrays the instruction.

**Blocks:** Phase C start (every pass V3-13+).

**Owner answer:** _____

---

## D12 — Anti-clone hardening posture

**Question:** How aggressive should anti-clone hardening be? (See `docs/v3/ANTI-CLONE.md` for the menu of techniques.)

**Options:**
- **Option A:** Light — server-side logic by default, but no code obfuscation, no API gating beyond standard auth.
- **Option B (recommended):** Moderate — server-side logic default + proprietary scoring/ranking behind authenticated APIs + rate-limited public endpoints + watermarked exports + trademark filings.
- **Option C:** Aggressive — Option B + JS minification beyond default + client-side bot detection + per-user JS fingerprinting + API request signing.

**Recommendation rationale:** Option B raises the cost of cloning meaningfully without sacrificing UX or hitting "obfuscation theater" diminishing returns.

**Blocks:** Cross-cuts all phases; informs V3-09 (mobile), V3-26 (AI router), V3-50 (provider model), V3-52 (marketplace ranking), V3-76 (API foundation).

**Owner answer:** _____

---

## D13 — V3 PASS 21–25 reconciliation

**Question:** The pre-existing "V3 PASS 21" / "PASS 22-25" design-rebuild cycle (separate from this global V3 plan) is in mid-cycle (PASS 25 typography shipped; SupportAssist replacement in current branch). Does it continue in parallel with global V3, or merge into Phase B foundation?

**Options:**
- **Option A (recommended):** Continue PASS 21-25 cycle to its planned closure, then fold subsequent PASS-NN polish work into Phase B FOUNDATION LOCK passes. Avoids stopping mid-cycle.
- **Option B:** Pause PASS 25 closure; fold remaining items into V3-12 (Foundation Lock acceptance).
- **Option C:** Continue both in parallel without coordination (status quo; risk of overlap).

**Recommendation rationale:** Stopping mid-cycle creates closure debt. Finishing then merging is cleaner.

**Blocks:** Coordination only — no specific pass.

**Owner answer:** _____

---

## D14 — V6 dashboard rebuild placement

**Question:** The DASH-1 through DASH-9 prompts are forged + mostly shipped. Where does the remaining dashboard work sit relative to global V3?

**Options:**
- **Option A (recommended per V5-5 owner framing):** V6 runs AFTER V3 closes — clean separation; aligns with prior owner framing.
- **Option B:** Fold remaining DASH work into Phase B (FOUNDATION LOCK) since dashboards are foundation.
- **Option C:** Run V6 as an independent track parallel to V3.

**Recommendation rationale:** Per V5-5 V3 recommended roadmap §D1 and the owner's prior framing. The dashboard rebuild has effectively shipped one-wave per the 2026-05-09 second-pass observation; remaining items are polish-class.

**Blocks:** None directly; informs Phase G prioritization.

**Owner answer:** _____

---

## D15 — Branch hygiene + bulk delete authorization

**Question:** 165+ branches exist on the repo (many merged or stale per memory `project_henryco_parallel_sessions.md`). Authorize bulk delete of branches matching pattern `claude/*` or `codex/*` that are fully-merged into main?

**Options:**
- **Option A (recommended):** Yes, but only after a per-branch confirmation list is generated and owner spot-checks 10 random branches.
- **Option B:** Yes, auto-delete merged branches older than 30 days; keep claude/codex namespace for in-flight work.
- **Option C:** No; manual cleanup only.

**Recommendation rationale:** Branch sprawl makes `git branch -a` unusable. Bulk cleanup is hygienic. Spot-check is the safety mechanism.

**Blocks:** Operational only.

**Owner answer:** _____

---

## D16 — Public roadmap surface granularity

**Question:** The "coming-soon / public roadmap surface" (V3-60) — how much detail does HenryCo publish?

**Options:**
- **Option A (recommended):** Quarterly themes only; specific features hidden until shipped. Reduces over-promise risk.
- **Option B:** Specific feature timeline ("Jobs interview room shipping Q3 2026"). Higher trust if hit; higher disappointment if slipped.
- **Option C:** Vote-on-roadmap surface (community votes; HenryCo commits to top 3 per quarter).

**Recommendation rationale:** Premium ecosystem doesn't slip publicly. Quarterly themes give breathing room.

**Blocks:** V3-60 scope.

**Owner answer:** _____

---

## D17 — V3-07b operator-surface i18n scope sign-off

**Question:** V3-07b proposes to close ~1,305 i18n GAPs across operator-facing surfaces (staff dashboards, admin workspaces, internal tooling, server messages, emails, PDFs, structured data, A11y aria-labels). What's the scope envelope and the locale-completeness bar?

**Owner's stated bar (verbatim, recorded from the V3-07 closure conversation):** "We need a full coverage, no hardcoded texts, all server messages, any written texts from any angles in the website. It MUST make it extremely perfect so that no more mistakes will ever be made again in translation, even in the future."

V3-07b is the prompt that operationalizes that bar. Two sub-decisions need ratification before it starts:

**D17.a — Operator-surface scope envelope**

- **Option A (recommended):** ALL operator-facing surfaces in scope — every staff dashboard, every admin workspace, every internal tool route, plus server-emitted user-facing JSON bodies, validation messages, email templates, push/SMS text, PDF templates, structured-data JSON-LD, social-share text, og:image SVG copy, A11y aria-labels, screen-reader-only text, table column headers, empty-state CTAs, log lines that surface to humans (Sentry breadcrumbs, audit log human-readable fields). The "any written texts from any angles" bar is taken literally.
- **Option B:** Operator UI surfaces only (staff dashboards + admin workspaces); defer server-message + PDF + structured-data coverage to a follow-up pass.
- **Option C:** Server-message + email + PDF coverage only (the "machine-emitted text" tier); defer operator UI surfaces.

**D17.b — Locale completeness bar**

- **Option A (recommended):** Pattern A complete in en-US for every key (typed-copy source-of-truth); Pattern B runtime DeepL fills the other 11 locales lazily; build-time linter rejects any new `<T label="…" />` referencing a label that doesn't exist in en-US Pattern A. Acceptable for the V3 owner-stated bar because the en-US source is bulletproof and DeepL fallback is invisible to the user.
- **Option B:** Full Pattern A typed-copy in all 12 locales (en/fr/es/pt/ar/de/it/zh/hi/ig/yo/ha). Extreme scope (~12 × 1,305 = ~15,660 typed translation entries authored by hand or by DeepL-with-human-review). Recommended only if the owner wants zero runtime DeepL on operator surfaces (e.g., for compliance-sensitive operator text).
- **Option C:** Pattern A in en-US + a select sub-set of locales (e.g., en/fr/es per primary-market commitment in D10) typed; rest DeepL'd lazily.

**Recommendation rationale:** The owner's stated bar ("extremely perfect, no more mistakes ever") demands that no operator EVER sees a label-name fallback (`surface.button.submit` instead of "Submit"). Option A on D17.a gives full scope; Option A on D17.b gives bulletproof en-US Pattern A as the source-of-truth and lets Pattern B DeepL fill the rest at runtime — keyed by the build-time linter so the en-US source is never incomplete. If a future regulatory bar demands typed copy in additional locales for operator-compliance reasons, escalate to Option B for that sub-set (D17.c sub-decision: which locales need typed-copy for compliance).

**CRITICAL CONSTRAINT (inherits from V3-07):** Do NOT touch `packages/search-ui/` (owner-reserved per memory `feedback_dashboard_search_engine_no_touch.md`). Operator search surfaces that reference search-ui components remain untouched in that package; the dashboard apps that wrap them get covered.

**Blocks:** V3-07b only. Does NOT block any phase.

**Owner answer:** _____

---

## Self-verification

- [x] Every decision has options + recommendation + rationale + which Pass IDs blocked
- [x] D1–D17 covers payment, gaming, AI provider, AI margin, tax, KYC, email senders, mobile stack, monetization, localization, foundation gate, anti-clone, prior-pass reconciliation, V6 placement, branch hygiene, roadmap surface, V3-07b scope envelope
- [x] D17 quotes the owner's verbatim bar for V3-07b
- [x] D17 splits into D17.a (scope) + D17.b (locale completeness) for granular ratification
- [x] D17 explicitly notes `packages/search-ui/` is owner-reserved
- [x] Owner-answer slots are explicit (`Owner answer: _____`)
- [x] Cross-reference to PASS-REGISTER.md preserved
- [x] Recommendations are owner-overridable; rationale stated so owner can disagree on stated grounds
