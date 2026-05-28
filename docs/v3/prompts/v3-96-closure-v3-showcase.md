# V3-96 — Closure: V3 Showcase Final Pass

**Pass ID:** V3-96 | **Phase:** I | **Pillar:** P12
**Deps:** V3-95 (and transitively V3-01 through V3-94, all closed) | **Effort:** L (2–4 weeks) | **Parallel:** NO (sequential close of V3 — nothing follows it) | **Owner gate:** Final V3 sign-off — `docs/v3/V3-CLOSURE-CERTIFICATE.md` | **Risk class:** Reputation, Brand

---

## Role

You are the V3 Closure engineer for HenryCo. You execute exactly this one pass, then stop and report. You do not start V4.

This is the capstone. Ninety-five prior passes closed the boring essentials, built the money + identity spine, wired the AI layer, shipped personalization + workflow + product expansion, built the partner + enterprise suites, opened the public API, shipped the mobile apps, and locked observability. V3-94 walked the platform in test. V3-95 signed the readiness pack. **V3-96 is what every user, partner, investor, and competitor sees first.** If V3-96 lands well, the prior 95 passes become visible work. If V3-96 lands badly, they remain invisible.

The owner has framed this clearly: the showcase is the cross-division proof surface — a single experience that demonstrates the whole ecosystem working as one, with the 8 owner principles and the 8 extended principles of the public-pages doctrine made tangible in every interaction. It is not a marketing site. It is the platform on its best day, on a real phone, in a real currency, in a real locale, with real verified providers, real prices, real receipts, and real joy.

Read this prompt like a final exam. If any line cannot be defended in production, the pass has not closed.

---

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/96-showcase` |
| Deploy | Vercel (10 web projects) + EAS (mobile, V3-87/88 builds) |
| Backend | Supabase (single project, multi-app) |
| OS context | Windows + bash; pnpm 9.15.5; Node 24.x |
| Domains touched | `henrycogroup.com/v3/*`, `henrycogroup.com/press/v3`, `henrycogroup.com/announcing-v3`, `apps/hub/app/owner/(command)/v3-launch/*` |

Create the working branch from `main` after confirming no parallel-session work conflicts (per `project_henryco_parallel_sessions.md`). Re-check state before destructive ops.

---

## Audit summary

V3 introduced 95 passes across 12 pillars. Every pass shipped a single capability and a closure report. **No pass before this one has demonstrated the whole stack working together to a person.** That is V3-96's only job.

The doctrine that governs this pass is `docs/v3/public-pages-interaction-principles.md` — read it before reading further. Its 16 principles, 10 Engine Briefs, Earning Map, Kindness Doctrine table, and telemetry contract are the *only* allowed implementations on every showcase surface. If anything in this prompt appears to contradict the doctrine, the doctrine wins and this prompt is updated in the same PR.

The owner's prior guidance compounds here:
- **Polish is trust, not decoration.** Broken states are blockers, not nice-to-haves.
- **Capability evidence above the fold, not headline size** (`feedback_no_giant_hero_text.md`). No huge-hero shouting.
- **Honest about what we earn from and why it's fair.** The Earning Map is rendered on a public page, not hidden.
- **Premium = restraint.** One primary action above the fold per surface. Two primaries is zero primaries.

---

## Inherited doctrine (verbatim, non-negotiable)

V3-96 inherits `docs/v3/public-pages-interaction-principles.md` word for word:

- **Part I (Owner Addendum)** — Principles 1–8 govern every action button on every showcase surface. Three-state buttons, width-locked, optimistic by default, success collapses to confirmation, destructive actions get inline two-step confirm, conversion-critical buttons get the strongest motion language, never navigate away from a form unless the user asks.
- **Part II (Extended)** — Principles 9–16: restraint as signal, latency as design, trust reveals not trust dumps, kindness as system, micro-commitments before macro-commitments, consensual + mutual + visible earning, joy as conversion, recovery as profit centre.
- **Part III (Earning Map)** — every revenue surface on the showcase has a row in the Earning Map; the row is the contract.
- **Part IV (Engine Briefs)** — Engines 1–10 (CTA Engine, Micro-Commitment Engine, Trust Reveal Engine, Abandonment Recovery Engine, Joy Engine, Earn-With-Us Engine, Newsletter Earn Engine, Pricing Reveal Engine, Concierge Handoff Engine, Local Boost Engine) live in `@henryco/interactions` and are consumed by every showcase route.
- **Part V (Kindness Doctrine)** — the anti-pattern table is enforceable. Any reviewer can block this pass for any anti-pattern in the left column.
- **Part VI (Telemetry)** — every event in the table fires with the listed properties; events flow to the V3-90 data lake.
- **Part VII (Cross-pass application checklist)** — every line is acceptance criteria for this pass; signed line by line in the final report.

If `@henryco/interactions` does not yet exist with Engines 1–10, that is a defensive completeness gap (S4) and V3-96 cannot close until it is created — either as part of an earlier public-pages rebuild pass or as a precursor sub-deliverable inside V3-96 itself. The owner decides; the gap is documented in the defect ledger.

---

## Mandatory scope

### S1 — The Cross-Division Journey (the centrepiece)

A single connected experience that a real visitor takes from cold landing to delighted return. The journey *is* the showcase. It must be a working flow that an investor can repeat on a phone in five minutes, in production, in their own currency, in their own locale, with real verified providers and real receipts.

**The journey, exactly:**

1. **Cold landing** at `henrycogroup.com/` — a visitor arrives with no account, no cookies, no signal. Above the fold: one primary action (Principle 9), capability evidence (real verified-provider photo + real outcome number, both pulled from V3-50 records with consent), no headline-size shouting. Trust reveal stage 1: outcome evidence only.

2. **Browse Care** — visitor explores verified providers. V3-50 tier badges visible. Quality scores live. Real reviews from V3-50 records. Marketplace ranking (V3-52) respects diversity guard (no single seller dominates the surface). Compact / comfortable / spacious density toggle persists to anonymous session.

3. **Save anonymously** — visitor saves one provider via the Micro-Commitment Engine (Principle 13, rung 2). Save persists to a server-backed anonymous session that survives device/browser changes (V3-01 anonymous-session pattern extended for logged-out users). The Joy Engine (Engine 5) emits a 600 ms confirmation — confident check, scale-in icon, accent-token glow, no celebration animation, no second modal.

4. **Identify lightweight** — visitor enters an email for "we'll let you know if this provider's calendar opens up." This is rung 3 of the ladder. The Newsletter Earn Engine (Engine 7) names the value to the user, not value to us. Single field. Frequency-capped.

5. **Browse Marketplace and Property** — visitor crosses divisions. Marketplace ranking (V3-52) re-ranks for the now-identified visitor using cross-division signals (V3-36 cross-division recommendations). Property listings (V3-53 rules engine) all show valid, inspected, governance-passed entries — no held or rejected listings leak. Local availability (V3-38) shows what's near the visitor.

6. **Book a Care provider** — visitor picks a slot (V3-51 smart booking), selects services from the expanded catalog (V3-49), sees the price in **their currency** (NGN / USD / GHS / KES rendered per V3-21 tax + V3-84 localization + V3-85 per-market routing). The Pricing Reveal Engine (Engine 8) breaks out the platform fee with the honest tooltip: "HenryCo platform fee — supports verification, dispute resolution, and 24/7 support." Trust reveal stage 2: capability evidence inline (a single short quote from a real verified buyer, name + city + verified-purchase mark).

7. **Pay** — visitor pays via the payments router (V3-13). The router selects per-market provider (V3-85) without leaking the provider name in headers or body (ANTI-CLONE Principle 9). The provider is one of Stripe / Paystack / Flutterwave (V3-14 / V3-15 / V3-16), wired live in at least one market. The ledger entry (V3-17) is double-entry, immutable. The receipt PDF (V3-18) is watermarked (V3-18 + ANTI-CLONE Principle 5). The invoice email lands (V3-61 transactional path). Trust reveal stage 3: safety net inline (money-back terms, dispute window, response-time SLO). Stage 4 (pay): trust marks rendered ONLY here — payment provider logos, encryption mark, the HenryCo guarantee.

8. **Joy state** — booking succeeds with the Care variant of the Joy Engine (Engine 5): warm hand-off, success copy that names outcome and next sensible action ("Booked with Adaeze for Saturday 10am — we'll text reminders the day before"), gentle haptic on mobile (single 10 ms tap, never long), single optional next action.

9. **Opt into Concierge** — the single optional next action opens the V3-59 Concierge surface, which is V3-28 HenryCo Intelligence Chat with the concierge preset. Provider name (Anthropic / OpenAI / Claude / GPT) never appears in UI, loading state, error, or telemetry (V3-26 + V3-28 brand lock). Cost-per-message preview visible *before* send (V3-27 metered billing). Free first message (concierge entry); metered only if the visitor explicitly asks for "more help" beyond the first interaction (Engine 9 contract).

10. **Return next session** — visitor closes the browser. Next day, on the same device, the visitor lands on a *different* page (e.g. `henrycogroup.com/marketplace`) and finds:
    - Their saved provider surfaced first on the personalized home (V3-34).
    - Their booking visible on the account dashboard with the smart-next-action prompt (V3-39): "Booking with Adaeze on Saturday — anything to prepare?"
    - The draft of any unfinished form preserved intact (V3-01 + V3-37 abandonment recovery + V3-45 reminders, none of which weaponize the abandonment).
    - A cross-division suggestion (V3-36), quiet, end-of-page: "you booked Care; here are caregiver jobs locally if you're hiring."

11. **Upgrade to premium tier** — visitor decides to upgrade their subscription (V3-20). Proration math shown honestly. Both billing cadences (monthly + annual) shown with the annual savings expressed in the user's currency, not in % alone (Engine 8). Confirmation names what they unlocked. No upsell second modal.

12. **Earn-With-Us pathway** — the Earn-With-Us Engine (Engine 6) surfaces at the *end* of relevant pages: "Are you a verified caregiver? Verified providers earned an average of ₦X last month on HenryCo." The number is server-computed, real, not hard-coded. Click leads to provider onboarding microsite (V3-67), not a generic signup. Never shown to a user already enrolled as that role.

13. **Concierge follow-up across sessions** — V3-48 follow-up campaigns send a single consensual recovery message at the right time in the user's timezone *only if* the visitor consented and abandoned a high-intent flow. The link drops the user at the exact field where they left.

14. **Audit trail** — every step above emits the telemetry from Part VI of the doctrine + the V3-96 events listed in S6. Every event lands in V3-90 within 1 minute. Every event is visible on the live ops dashboard (S5).

The journey must run end-to-end on:
- iOS (V3-87 super-app + V3-88 store-released build),
- Android (V3-87 super-app + V3-88 store-released build),
- Web desktop (Next.js apps),
- Web mobile (responsive of the same Next.js apps),
- across at least **3 locales** including one non-Latin script if `@henryco/i18n` Wave 3 shipped a non-Latin locale,
- across at least **3 currencies** (NGN + USD + one of GHS / KES),
- with at least **2 payment providers** live (Paystack + one of Stripe / Flutterwave).

If any step requires "you'd see this if X passed" or a workaround for an unfinished pass, V3-96 cannot close. The defect ledger in S4 catches this.

### S2 — The Showcase Microsite

The microsite at `henrycogroup.com/v3/` lets a visitor:

**S2.1 — Read the V3 story** (one page, 8-second comprehension target):
- The 12 pillars and what each ships, each row with one screenshot from production (not mockups). 
- Every claim has a footnote referencing the pass ID and closure report — the honesty audit (validation gate 7) enforces this.
- Capability evidence above the fold per the doctrine: no giant text, no headline shouting.
- Reading time displayed honestly; if it's longer than 3 minutes, that's a sign the page is doing too much.

**S2.2 — "Try the journey" CTA** (the live sandbox):
- One-click button seeds a sandbox account with a real fixture dataset (per V3-01 fixture pattern from `project_henryco_v3_01_e2e_fixture_user.md`, tagged for metric isolation).
- Walks the visitor through S1 steps 1–11 with sandbox payment (real router, sandbox provider mode) but every other system live.
- Sandbox journey emits `v3_96_sandbox` tag on all telemetry so it never pollutes real production metrics.
- At the end, visitor can convert sandbox account into a real account if they want, with all saved state preserved.

**S2.3 — The Earning Map page** at `henrycogroup.com/v3/how-we-earn`:
- Renders Part III of the doctrine as a user-readable surface, division by division.
- Names every revenue mechanism in HenryCo (take rates, subscription tiers, verified-provider tier subscription, sponsored deals, API metering, partner onboarding fees, gaming arena stakes-margin **only if** D2 cleared and V3-66 shipped, AI usage billing margin).
- For each row: what the user gets in exchange, why HenryCo would be comfortable seeing the rate in a screenshot on Twitter (Principle 14 test).
- Linked from the showcase site footer and from the platform-fee tooltip in every checkout.

**S2.4 — Press kit** at `henrycogroup.com/press/v3`:
- Brand assets per ANTI-CLONE Principle 7 + L10 (trademark-protected wordmark, monogram, "HenryCo Intelligence" mark).
- Real product screenshots (no mockups). Each watermarked per ANTI-CLONE Principle 5 (visible + invisible metadata identifying download source + timestamp).
- Owner-voiced founder bio. Boilerplate. Stable contact.
- Counsel-reviewed before publish (L10).

**S2.5 — Capability inventory** at `henrycogroup.com/v3/what-shipped`:
- Per-division: a tight list of what V3 delivered.
- Each item has a "see it live" link to the relevant page.
- A note for anything explicitly deferred (e.g., Gaming Arena V3-65/66 if D2 deferred).
- No vapourware. No "coming soon" without the V3-60 quarterly-themes framing.

**S2.6 — Doctrine surface (optional, owner-decided)** at `henrycogroup.com/v3/principles`:
- A public-facing rendering of Parts I + II of the public-pages doctrine, in owner voice, as the rules HenryCo builds by.
- If owner declines, the doctrine remains internal-only; this surface is not built.

### S3 — The Announcement

Multi-channel. Every channel inherits every doctrine principle.

**S3.1 — Founder post** at `henrycogroup.com/announcing-v3`:
- Owner-voiced (not Claude-voiced). The owner writes the prose; this pass produces the publishing surface.
- One-paragraph overview, key capabilities (linked to S2.5), screenshots + recordings of premium flows (real, watermarked), customer FAQ, single owner quote.
- Shareable URL with attribution tracking (V3-04 share-link inventory).

**S3.2 — Email** via V3-61 newsletter engine:
- Segmented by division of last activity (anonymous users excluded — they opted out by being anonymous; respect that).
- Per-locale, per-currency.
- Honest opt-out at the top, not buried in the footer (Kindness Doctrine).
- One CTA: "see what's new in your division" linking to a deep-link target (V3-04).
- Single send; no follow-up unless the user opens.

**S3.3 — Push** via V3-87 super-app + OneSignal:
- Only to users who have consented to product-update notifications (V3-93 consent ledger checked).
- Single push, single CTA, no follow-up unless clicked.
- Localized per user; currency-aware in body if a price appears.

**S3.4 — In-app "What's new" surface**:
- First-login banner on every division app, dismissible inline (Principle 4: two-step confirm — no full-modal interruption).
- The banner names what changed *in that division specifically*, not the V3 overall pitch.
- One CTA per division. Maximum.

**S3.5 — Press outreach**:
- Out of code scope. Owner-managed.
- The press kit at S2.4 is what reporters get when they ask. Outreach itself is not this pass.

**S3.6 — Social**:
- Out of code scope. Owner-managed.
- Visual assets ready in the press kit.

### S4 — Defensive Completeness Gates

V3-96 cannot close if any of the following critical-path passes is open or has unaddressed regressions. The gates are enforced by a script that reads `.codex-temp/v3-*/report.md` + `docs/v3/V3-LAUNCH-READINESS.md` + the closure-status lines in each pass file, and produces `docs/v3/V3-96-DEFECTS.md`.

**Phase B (Foundation Lock)** — all of V3-01 through V3-12, with V3-12 owner sign-off (D11) on file.

**Phase C (Money & Identity Spine)**:
- V3-13 (provider router) closed.
- V3-17 (ledger hardening) closed; daily-balance reconciliation green for last 30 days.
- At least one of V3-14 / V3-15 / V3-16 live in production (D1 owner decision applied).
- V3-18 (receipts + invoices) closed; watermarking verified.
- V3-19 (refunds + reconciliation) closed.
- V3-22 (finance dashboard) closed; owner has consumed it.
- V3-24 (KYC) closed for at least one market (D6).
- V3-25 (content moderation) closed.

**Phase D (AI Intelligence)**:
- V3-26, V3-27, V3-28, V3-33 all closed.
- Brand-lock + provider-mask verified (validation gate 6).
- Wallet-gating verified (unauth blocked, wallet-zero blocked).

**Phase E (Personalization & Predictive)**:
- V3-34 (personalized home), V3-36 (cross-division recs), V3-37 (abandoned-task recovery), V3-39 (smart next action) all closed — the showcase journey uses every one.

**Phase F (Workflow & Automation)**:
- V3-43 (workflow engine foundation) closed; cron migrations applied.
- V3-45 (auto-remind) closed — recovery messaging in S1 step 13 uses this.
- V3-46 (owner reports) closed — owner gets the D1 / D7 / D30 launch reports automatically.

**Phase G (Product Expansion)**:
- V3-49 (services catalog), V3-50 (verified provider), V3-51 (smart booking), V3-52 (marketplace ranking), V3-53 (property rules), V3-59 (concierge), V3-61 (newsletter engine), V3-63 (local discovery) all closed.
- V3-54 (interview room), V3-55 (studio motion), V3-56 (learn-to-earn), V3-57 (business profiles), V3-58 (seller academy), V3-62 (deals engine), V3-64 (logistics maturity) closed if their division is in the showcase capability inventory (S2.5).
- V3-65 + V3-66 (gaming): if D2 deferred, the showcase MUST NOT reference gaming. If shipped, the showcase MUST include a gaming sub-journey or surface.

**Phase H (Partner & Enterprise)**:
- V3-67 (partner onboarding) closed — Earn-With-Us Engine (S1 step 12) routes here.
- V3-69 (partner payouts) closed — first partner has received a real payout.
- The vertical suites V3-70 through V3-75 closed for the divisions surfaced in S2.5.

**Phase I (Platform / Global / Mobile / Observability)**:
- V3-76 (public API foundation) closed — gateway holds.
- V3-83 (developer docs) live at `developers.henrycogroup.com` if any of V3-77/78/79/80 shipped; otherwise marked deferred.
- V3-84 (localization maturity) closed for D10 markets.
- V3-85 (per-market payment routing) closed.
- V3-87 (mobile parity wave 1) closed; V3-88 (store submission) approved on both stores.
- V3-89 (traces + SLOs) closed.
- V3-90 (data lake) closed — the live ops dashboard reads from it.
- V3-91 (A/B framework) closed — first three experiments running.
- V3-92 (backup + DR) closed — restore drill < 30 days old.
- V3-93 (privacy + data rights) closed — DSAR + deletion verified.
- V3-94 (integration test) green.
- V3-95 (launch readiness) signed.

**Doctrine package**:
- `@henryco/interactions` exists with Engines 1–10 implemented and consumed across at least 3 divisions. If absent, V3-96 produces the package as a precursor sub-deliverable, owner-approved.

If any gate fails, the defect ledger names the failing pass + which step of the journey it breaks + a hand-off to a V3-NN-FOLLOWUP. V3-96 cannot self-certify completion with a non-empty critical-path ledger.

### S5 — The Live Ops Dashboard

Owner-only surface at `apps/hub/app/owner/(command)/v3-launch/dashboard/`. RLS-gated. PII-redacted per V3-93.

Reads from: V3-89 traces, V3-90 data lake, V3-91 experiment registry, V3-22 finance dashboard, V3-50 verified-provider telemetry, V3-67 partner onboarding telemetry, V3-93 privacy events, V3-26 AI guardrail events.

**Panels:**

1. **Showcase health** — uptime per surface, hero-CTA time-to-first-click per locale (Principle 10 perception budget), scroll-depth-before-conversion per page (Engine evaluation).

2. **Journey funnel** — S1 steps 1–11 with conversion ratio at each rung. Per locale, per currency, per device class. The funnel that proves the journey itself is working.

3. **Money** — revenue per minute, per provider, per currency, with consolidated USD on the owner view. Currency-locale-respecting display.

4. **Joy** — Engine 5 instrumentation: `joy_state_seen` count, return rate by cohort (joyful first transaction vs flat), day-2 recall.

5. **Recovery** — Engine 4 instrumentation: abandonments triggered (by surface), recoveries resumed, time-to-resume distribution.

6. **Trust** — Engine 3 instrumentation: `trust_stage_entered` events; conversion delta per stage (browse → consider → commit → pay).

7. **Pricing honesty** — Engine 8 instrumentation: currency-revealed-to-checkout-completion ratio per locale. The honesty payoff is measurable.

8. **Concierge** — Engine 9 instrumentation: hand-off opens, free-message replies, premium-tier upgrades.

9. **Earn-With-Us** — Engine 6 instrumentation: invitations shown to buyers, click-through to V3-67 partner onboarding microsite, completed onboardings.

10. **Anti-clone watchdog** — rate-limit hits, bot challenges issued (ANTI-CLONE Principle 4), provider-name-leak scans returning ZERO (Principle 9), audit-log anomaly alerts (Principle 12).

11. **A/B holdouts** — V3-91 exposure counts + conversion deltas for the first three running experiments (V3-52 ranking variant, V3-35 deals copy, V3-48 campaign step).

12. **SLO health** — V3-89 SLO breach indicator per critical journey: signup, booking, payment, AI call, partner payout.

13. **Privacy + safety** — V3-93 DSAR + deletion request volume; V3-25 moderation throughput; V3-40 risk-tier enforcement holds + freezes.

The dashboard is real product, not a mockup. The owner watches it during the launch window. Owner reports (V3-46) auto-deliver D1 / D7 / D30 snapshots.

### S6 — Telemetry contract

Every interaction in S1, S2, S3 emits the relevant event from Part VI of the doctrine with the exact properties listed. No new event types unless added to the doctrine table in the same PR.

**V3-96 introduces these closure-specific events** (added to the doctrine in the same PR + to `packages/observability/src/events.ts`):

- `henry.v3.showcase.viewed` — `{ surface_id, locale, currency, commitment_tier, referrer_class, device_class }`
- `henry.v3.journey.started` — `{ entry_surface, sandbox: boolean }`
- `henry.v3.journey.step_completed` — `{ step_index (1–13), time_ms, locale, currency }`
- `henry.v3.journey.completed` — `{ total_time_ms, locale, currency, sandbox: boolean }`
- `henry.v3.journey.abandoned` — `{ step_index, time_on_step_ms, reason_class }` (recovery candidate)
- `henry.v3.announcement.delivered` — `{ channel (email/push/in_app/blog), segment, locale }`
- `henry.v3.announcement.engaged` — `{ channel, time_from_send_s, locale }`
- `henry.v3.launch_window.metric_breach` — `{ metric_name, observed, threshold, action_taken }` (paging signal)
- `henry.v3.closure_certificate.signed` — fires once, when the owner signs S9.

All events PII-redacted at ingest per V3-90 default. All events queryable in the live ops dashboard (S5).

### S7 — Localization + currency lock

The showcase ships in all 12 locales managed by `@henryco/i18n`. Every string flows through `translateSurfaceLabel` / typed copy (per `project_henryco_i18n_architecture.md`, Pattern A + Pattern B). **No English fallback shown to a non-English visitor mid-flow** (Principle 12).

Currency rendering uses the multi-currency foundation (per `project_henryco_currency.md`). Every price in the journey renders in the user's currency. Conversion-time FX shown next to converted prices when applicable (Engine 8). Validation against NGN, USD, GHS, KES at minimum; whichever currencies V3-84 + V3-85 closed go live too.

If V3-84 shipped an RTL or non-Latin locale, the showcase verifies that locale specifically (mirror layout, font availability, line-height correctness).

### S8 — Accessibility and motion

- Focus visible on every interactive element (Principle 7).
- 44×44 mobile hit targets verified across every journey step.
- `aria-busy` honored during in-flight states.
- `prefers-reduced-motion` strips Joy Engine scale + glow, keeps inline label change (Principle 2 + 15).
- Keyboard-only run of the entire journey passes (a11y soak).
- Screen-reader announces success, failure, and trust stages distinctly via ARIA live regions.
- Color contrast meets WCAG AA (existing `@henryco/tokens` already on AA; verify on every showcase route).
- No flashing > 3 Hz; no auto-playing audio.

### S9 — The V3 Closure Certificate

Final artifact: `docs/v3/V3-CLOSURE-CERTIFICATE.md`, owner-signed.

Contents:

- Every V3-NN pass (V3-01 through V3-95) with its closure date and report link.
- Every owner decision (D1–D16) with its resolution date and resolution.
- Every legal item (L1–L18) with status (closed / deferred / N/A).
- Every integration key in INTEGRATION-KEYS.md with its rotation date.
- Acceptance against the cross-pass checklist in Part VII of the public-pages doctrine, line by line, with diff evidence.
- A short owner statement: what V3 became, what V4 will be.
- Owner signature line with date.

The certificate is the canonical reference for "what V3 is" forever after. V4 (whatever shape it takes) inherits from this document.

---

## Out of scope

- Post-launch iteration. Anything "we should also fix" goes into `V3-NN-FOLLOWUP`, not this pass.
- New product surfaces beyond the showcase site itself (S2 surfaces are showcase-specific).
- V4 planning (separate artifact, not this pass).
- Marketing campaign management (V3-61 newsletter handles delivery; campaign authoring is owner-managed).
- Press relations (press kit ships; outreach is owner-managed).
- Continued improvement of any pillar (each pillar's continued work is its own V3-NN-FOLLOWUP).

---

## Dependencies

- V3-95 owner sign-off on the launch-readiness pack.
- Every critical-path pass listed in S4 closed, with the defect ledger empty or owner-accepted.
- `@henryco/interactions` (Engines 1–10) available — see Inheritance.

---

## Inheritance

- `@henryco/interactions` — Engines 1–10 from the public-pages doctrine. Consumed by every showcase route.
- `@henryco/email` — announcement email and transactional receipts (V3-18, V3-61).
- `@henryco/newsletter` — campaign send, segmentation, opt-out (V3-61).
- `@henryco/seo` — microsite SEO, sitemap, robots.txt.
- `@henryco/i18n` — 12-locale coverage (Pattern A + Pattern B).
- `@henryco/intelligence-chat` — concierge surface (V3-28).
- `@henryco/payment-router` — checkout in the journey (V3-13).
- `@henryco/observability` — traces, events, audit log (V3-10, V3-89, V3-90).
- `@henryco/dashboard-shell` — the owner live ops dashboard.
- `@henryco/branded-documents` — receipts + invoices + press kit watermarked exports.
- `@henryco/auth` — session primitives, deep-link round-trip, anonymous-session pattern (V3-01, V3-02, V3-04).
- `@henryco/lifecycle` — "continue where you left off" panel (V3-01, V3-37).
- `@henryco/pricing` — currency + tax rendering (V3-21, V3-84, V3-85).
- `@henryco/data-lake` (V3-90) — event sink for the live ops dashboard.
- `@henryco/ab` (V3-91) — A/B exposure panel on the dashboard.
- The doctrine `docs/v3/public-pages-interaction-principles.md` — inherited verbatim.

---

## Integration keys (per INTEGRATION-KEYS.md)

Consumed: Cloudinary (assets), Resend + Brevo (email), OneSignal (push), Vercel (deployment), Supabase (data + RLS), Sentry (errors + perf), Stripe + Paystack + Flutterwave (one or more live + all sandbox), Smile Identity + Onfido (KYC where market-applicable per D6), Mapbox (V3-87 mobile + V3-63 local discovery maps), GrowthBook (V3-91 A/B).

**ZERO hardcoded** keys, per existing CI gate (V3-07 lessons + Phase B foundation).

---

## Trust / safety / compliance

- **ANTI-CLONE** — Principles 1, 2, 3, 4, 5, 6, 7, 10, 11, 12 verified live on every showcase route. The anti-clone watchdog panel (S5.10) makes this measurable.
- **Truthful capability claims** — every line on the V3 story page (S2.1) and the capability inventory (S2.5) has a footnote referencing the pass ID and report file. The honesty audit (validation gate 7) enforces this.
- **Real customer quotes/outcomes** in S1 trust reveal require recorded consent (V3-50 verified record + consent flag). No invented testimonials. No stock-photo executives.
- **Press kit assets** watermarked per ANTI-CLONE Principle 5; counsel-reviewed for trademark + IP per L10.
- **Live ops dashboard** PII-redacted per V3-93 default; RLS-gated to owner role.
- **HenryCo Intelligence trademark** per Principle 7 + L10; provider name (Anthropic/OpenAI/Claude/GPT) never appears in UI, error states, telemetry properties, or response payloads (validation gate 6).
- **Brand voice consistency** — ANTI-CLONE Principle 11. The showcase is the canonical demonstration of cross-division consistency.

---

## Mobile + desktop parity

- The cross-division journey (S1) works end-to-end on iOS (V3-88 store build) + Android (V3-88 store build) + web desktop + web mobile.
- The live ops dashboard (S5) is desktop-only (admin); the showcase + announcement surfaces are responsive across breakpoints (V3-09 mobile consistency primitives).
- Deep-link round-trip (V3-04) verified for share links from the announcement → mobile app installs → resume in the app where the link pointed.

---

## i18n

- Every string in 12 locales (`@henryco/i18n` Wave 1 + 2 + 3).
- Every price in user currency with FX hover (Engine 8).
- Every date in user locale (V3-84 holiday calendars + format rules).
- No English fallback in a non-English session.
- Verified in at least 3 locales (default: en-US, fr, ig); add one non-Latin if Wave 3 shipped it.

---

## Validation gates

1. **Standard CI** — lint, typecheck, build (`pnpm ci:validate` from root), i18n check, a11y, PNH-04 security headers.

2. **Doctrine compliance audit** — every line in Part VII of `docs/v3/public-pages-interaction-principles.md` checked with diff evidence. Any unchecked item blocks the gate. The audit appears verbatim in the final report.

3. **Cross-division journey e2e** — Playwright run of S1 steps 1–13 on a preview deploy, in 3 locales × 3 currencies × 2 payment providers (sandbox), on iOS Simulator + Android Emulator + Chromium desktop + Chromium mobile. Zero step failures. Time-to-first-meaningful-paint within V3-89 budget on every step.

4. **Live ops dashboard rendering** — every panel in S5 (1–13) fetches real data on a 24-hour soak before launch. No placeholders. No mocks. Each panel screenshot pasted in the final report.

5. **Defensive completeness scan** — automated script reads pass closure reports and produces `docs/v3/V3-96-DEFECTS.md`. ZERO red entries on critical path (S4). Owner-accepted entries permitted but documented.

6. **Brand-lock grep** — `grep -ri "Claude\|GPT\|Anthropic\|OpenAI\|gpt-\|claude-" apps/ packages/` returns ZERO hits in user-facing copy, error states, telemetry property values, response payloads, or showcase surfaces. Test fixtures and internal config exempt.

7. **Honesty audit** — every claim on the V3 story page (S2.1) and capability inventory (S2.5) has a footnote referencing the pass ID + report file that proves it. Reviewer checks every footnote resolves to a closed pass.

8. **Anti-pattern audit (Kindness Doctrine)** — reviewer manually scans every showcase route against Part V table. ZERO instances of the left column on any showcase surface. Specifically scanned for: pre-checked subscribe boxes, fake countdown timers, grey "no thanks" buttons, hidden fees, modal-on-first-visit, USD prices to non-USD users, "you might miss out" copy, full-page interrupt on destructive action, English-fallback in non-English sessions.

9. **Telemetry audit** — every event from Part VI + S6 fires; properties match the schema; events land in V3-90 within 1 minute; live ops dashboard panels surface them. Trace any event missing from the audit; close the gap before merge.

10. **Press kit accessibility audit** — every press asset downloadable from `henrycogroup.com/press/v3`; every brand mark trademark-marked; boilerplate accurate; counsel-review approval on file (L10).

11. **Performance** — showcase routes meet V3-89 performance budget. Hero CTA time-to-first-click under 100 ms perceived (Principle 10). LCP < 2.5s on 4G; CLS < 0.1; INP < 200 ms.

12. **A11y soak** — keyboard-only run of the journey passes; screen-reader (NVDA / VoiceOver / TalkBack) announces every state transition; reduced-motion respected; color-contrast WCAG AA on every showcase route.

13. **7-day soak on preview deploy** — owner walks the journey daily on a phone and reports verbatim findings. Every reported issue either fixed before launch or moved to V3-NN-FOLLOWUP with owner approval.

14. **Earning Map verification** — every row in Part III of the doctrine is rendered on `henrycogroup.com/v3/how-we-earn`, and every revenue surface in the showcase points to its row. Diversions documented.

---

## Deployment gate

- All validation gates passing with evidence pasted in the final report.
- Owner walks the journey on a phone in 3 locales and signs off in writing.
- V3-95 launch readiness pack is current; no rotated keys missing; no backup older than 7 days; no incident runbook missing.
- Press kit reviewed by counsel for trademark + IP marks (L10) — approval on file.
- `docs/v3/V3-96-DEFECTS.md` is empty or every item is owner-accepted.
- Owner sets the launch date and triggers the launch ceremony.

**Launch ceremony** (owner-led, V3-96 engineer supports):
1. Owner publishes the announcement post (S3.1).
2. Owner triggers email + push send via V3-61 + V3-87 OneSignal.
3. In-app "What's new" banner flag flipped via V3-91 GrowthBook (`v3_launch.enabled = true`) — instant rollout, no staggered ramp.
4. Owner watches the live ops dashboard for the first 4 hours.
5. The V3-96 engineer monitors the anti-clone watchdog + the SLO panel; pages owner on any breach.
6. After 24 hours, V3-46 owner reports send the D1 launch snapshot automatically.

---

## Final report contract

`.codex-temp/v3-96-showcase/report.md` plus:

1. The signed `docs/v3/V3-CLOSURE-CERTIFICATE.md`.
2. The defect ledger `docs/v3/V3-96-DEFECTS.md` (ideally empty; if not, lists what's deferred to V3-NN-FOLLOWUP with owner sign-off).
3. Day-1, Day-7, Day-30 launch metrics reports:
   - `docs/v3/V3-96-LAUNCH-METRICS-D1.md`
   - `docs/v3/V3-96-LAUNCH-METRICS-D7.md`
   - `docs/v3/V3-96-LAUNCH-METRICS-D30.md`
   Auto-generated by V3-46 owner-reports workflow; engineer adds qualitative commentary.
4. Owner-voice retrospective at `docs/v3/V3-96-RETRO.md` (owner writes; engineer captures): what worked, what didn't, what V4 inherits.
5. Engineer report sections (standard 9):
   - Executive summary (one paragraph).
   - Files changed (grouped by package + app + route).
   - Migration / RLS / env (likely none beyond minor microsite content tables).
   - Validation gate evidence (paste every gate 1–14 with evidence).
   - Smoke verification evidence (the 7-day soak findings).
   - Live verification evidence (launch window observations + dashboard screenshots).
   - Telemetry baseline (D1 event counts for the 9 new V3-96 events).
   - Deferred items (link to V3-NN-FOLLOWUP work, if any).
   - Pass closure assertion: **"V3 is closed. V3-CLOSURE-CERTIFICATE on file. Hand-off: V4 planning."**

---

## What "magnificent" looks like

If V3-96 lands well, a visitor will:

1. **Arrive on a phone**, with no prior context, anywhere in the world where HenryCo operates.

2. **Understand within 8 seconds** what HenryCo is — not from headline shouting, but from capability evidence above the fold: a real verified provider's face, a real outcome number, a real city name. Restraint is the loudest signal.

3. **Do one meaningful thing** — browse a real verified provider, save it, see a real price in their own currency — **without ever creating an account**. The micro-commitment ladder respects them.

4. **Feel that nothing manipulated them** — no fake countdowns, no fake scarcity, no second modal after the first, no pre-checked subscribe boxes, no hidden fees, no English copy in their non-English session, no grey "no thanks" next to a coloured "yes", no countdown for an offer that does not actually expire.

5. **Come back the next day** on the same device or a different device, after closing the browser, and find: their saved provider on home, their draft form intact, a smart next-action prompt that respects what they already did, a cross-division suggestion that is helpful and quiet. The platform remembers them.

6. **Pay for something later** and see the platform fee broken out and named ("supports verification, dispute resolution, 24/7 support"), the price in their currency, the conversion math if applicable, and **feel the joy state** when it lands — 600 ms of confident craft, not 6 seconds of confetti.

7. **Receive the recovery message** if they abandon a high-intent flow, at the right time in their timezone, with a single link that drops them at the exact field where they left. No second message unless they re-engage. No "you might lose your spot" pressure. The recovery is an apology for any friction we caused.

8. **Discover the Earning Map page** by clicking a footer link and **read every way HenryCo earns money in plain language**, with what they get in exchange, and **agree that the take rate is fair**. The honesty compounds trust.

9. **Tell someone else about HenryCo** — not because they were prompted to, but because the experience was premium, considered, and humane.

If that bar is met, V3 closes. If any part of that paragraph requires an asterisk or a "well, in a future pass…", V3-96 has not closed.

---

## Anti-patterns this pass must avoid

- Do not ship a marketing-site clone. The showcase is a working platform demonstration.
- Do not invent quotes or stock-photo testimonials. Every quote on the trust-reveal stages is from a real verified user (V3-50) with recorded consent.
- Do not over-promise capabilities. Every claim is footnoted to a closed pass.
- Do not paywall the V3 story or the Earning Map. The honesty *is* the marketing.
- Do not gate the "try the journey" sandbox behind a sign-up. The doctrine's micro-commitment ladder permits browsing without identification.
- Do not name a single AI provider in any user-facing surface. Brand lock is absolute.
- Do not add post-launch upsell modals to the joy states. Engine 9 hand-off is opt-in; never push.
- Do not skip locales. Twelve means twelve.
- Do not skip currencies. Multi-currency is foundational.
- Do not push a launch with a non-empty critical-path defect ledger. The launch waits for the fix; the fix does not wait for the launch.
- Do not reference gaming if D2 deferred V3-65/66. Truthful capability claims.
- Do not log session tokens or refresh tokens — ever (V3-01 anti-pattern).
- Do not break PNH-04 security headers, RLS, or ANTI-CLONE principles for the sake of "launch polish."

---

## Self-verification (the executor signs this off in the report)

**Scope:**
- [ ] S1 — cross-division journey works end-to-end in production: 3 locales × 3 currencies × 2 providers × iOS + Android + web.
- [ ] S2 — showcase microsite live at `henrycogroup.com/v3/`, with V3 story (S2.1), try-the-journey (S2.2), Earning Map page (S2.3), press kit (S2.4), capability inventory (S2.5), and optional doctrine surface (S2.6) per owner decision.
- [ ] S3 — announcement delivered across all 4 in-scope channels (founder post, email, push, in-app banner); press + social handed off to owner.
- [ ] S4 — defensive completeness gates verified; `docs/v3/V3-96-DEFECTS.md` empty or owner-accepted.
- [ ] S5 — live ops dashboard rendering real data on every of 13 panels; PII-redacted; owner can watch the launch window from it.
- [ ] S6 — every doctrine event from Part VI + 9 V3-96 events firing; properties match the schema; events in V3-90 within 1 minute.
- [ ] S7 — 12 locales verified; no English fallback in non-English session; pricing in user currency with FX hover; one non-Latin locale verified if Wave 3 shipped one.
- [ ] S8 — accessibility verified (keyboard run + screen reader + reduced motion + WCAG AA color contrast).
- [ ] S9 — `docs/v3/V3-CLOSURE-CERTIFICATE.md` signed by owner.

**Doctrine compliance:**
- [ ] Part I (owner Principles 1–8) verified on every action button on every showcase surface.
- [ ] Part II (Principles 9–16) verified on every showcase route.
- [ ] Part III (Earning Map) rendered on `/v3/how-we-earn` with every row visible; every revenue surface in the showcase points to its row.
- [ ] Part IV (Engines 1–10) in `@henryco/interactions` and consumed by every showcase route.
- [ ] Part V (Kindness Doctrine) anti-pattern audit clean — ZERO instances of the left column on any showcase surface.
- [ ] Part VI (Telemetry) every listed event firing with listed properties.
- [ ] Part VII (Cross-pass checklist) signed line by line in the final report.

**Anti-clone:**
- [ ] Principles 1, 2, 3, 4, 5, 6, 7, 10, 11, 12 verified live on showcase routes.
- [ ] Brand-lock grep clean (no provider names in user-facing copy, error states, telemetry, or response payloads).
- [ ] Press kit watermarked + counsel-reviewed.
- [ ] Anti-clone watchdog panel (S5.10) green on launch day.

**Launch ceremony:**
- [ ] Owner walked the journey on a phone in 3 locales and signed.
- [ ] V3-95 launch readiness pack current.
- [ ] Press kit counsel-reviewed.
- [ ] Launch ceremony executed; D1 + D7 + D30 metrics reports delivered.

**Closure:**
- [ ] V3 is closed.
- [ ] `docs/v3/V3-CLOSURE-CERTIFICATE.md` signed and on file.
- [ ] Defect ledger empty or accepted.
- [ ] Retrospective written.
- [ ] Hand-off: V4 planning (separate pass; not started here).

---

**End of V3-96. End of V3.**
