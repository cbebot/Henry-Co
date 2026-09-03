# V3-96 — Closure: V3 Showcase Final Pass

**Pass ID:** V3-96  ·  **Phase:** I (Platform/API + Global/Mobile + Observability + Closure)  ·  **Pillar:** P12 (Foundation & Trust)
**Dependencies:** V3-95 (and transitively V3-01 → V3-94, all closed)  ·  **Effort:** M  ·  **Parallel-safe:** N (sequential close of V3 — nothing follows it)
**Owner gate:** Final V3 sign-off — `docs/v3/V3-CLOSURE-CERTIFICATE.md` must be owner-signed (no pre-start D-id in the register; this is the closure sign-off, not a blocking decision)  ·  **Risk class:** Reputation / Brand

---

## Role

You are the V3 Closure engineer for Henry Onyx. You execute exactly this one pass, then stop and report. You do not start V4.

This is the capstone. Ninety-five prior passes closed the boring essentials, built the money + identity spine, wired the governed AI layer, shipped personalization + workflow + product expansion, built the partner + enterprise suites, opened the public API, shipped the mobile apps, and locked observability. V3-94 walked the platform in test; V3-95 signed the readiness pack. **V3-96 is what every user, partner, investor, and competitor sees first.** If V3-96 lands well, the prior 95 passes become visible work; if it lands badly, they stay invisible.

The line you must not cross: this is not a marketing site. It is the platform on its best day — on a real phone, in a real currency, in a real locale, with real verified providers, real prices, real receipts, real joy. Read this prompt like a final exam: if any line cannot be defended in production, the pass has not closed.

## Project

| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/96-showcase` |
| Deploy | Vercel (10 web projects) + EAS (mobile, V3-87/88 builds) |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

Branch from `origin/main` after confirming no parallel-session work conflicts (per `project_henryco_parallel_sessions.md`). Re-check working-tree state before any destructive git op.

## Audit summary

V3 introduced 95 passes across 12 pillars. Each shipped a single capability and a closure report under `.codex-temp/v3-*/report.md`. **No pass before this one has demonstrated the whole stack working together to a person.** That is V3-96's only job.

What exists today that this pass composes (verified against the codebase):
- **Brand truth is single-sourced.** `packages/config/company.ts` is the canonical brand authority; `packages/config/domain.ts` exposes `henryDomain(division, path?)`, `henryWebRoot(path?)`, `henryDomainHost()`, and `company.ts` exposes `getHubUrl()` / `getAccountUrl()`. The showcase reads every brand string and every URL from `@henryco/config` — never hardcoded. Brand is **Henry Onyx** (user-facing) / **Henry Onyx Limited** (legal); the AI surface is **Henry Onyx Intelligence**.
- **Observability is wired.** `@henryco/observability` ships `src/events.ts` (typed event union, format `henry.<domain>.<entity>.<verb>`), `src/audit-log.ts`, `src/persist-event.ts`, `src/redaction.ts`, Sentry inits, and `/api/health`. The data sink (V3-90) and A/B registry (V3-91) feed the live ops dashboard.
- **Payments are real.** `@henryco/payment-surface` (UI primitives) + the shipped `@henryco/payment-router` (V3-13, mock-only/test-gated) + Paystack live (V3-15, hosted-redirect, webhook-reconciled). Ledger truth is double-entry (V3-17); receipts/invoices are branded PDFs (V3-18) on the **Henry Onyx Limited** legal entity.
- **AI surface exists.** `@henryco/intelligence` powers the governed chat surface (V3-28) and concierge preset (V3-59). Provider name is masked at every layer (V3-26 brand lock).
- **Owner command surface exists** at `apps/hub/app/owner/(command)/` (already hosts `layout.tsx`, `login`, `no-access`). The live ops dashboard mounts here under `v3-launch/`.

**Two gaps this pass must reconcile, not hand-wave:**
1. **`@henryco/interactions` does NOT exist yet** in `packages/`. The public-pages doctrine (`docs/v3/public-pages-interaction-principles.md`, which is present in the repo) defines Engines 1–10 that every showcase route consumes. Either an earlier public-pages rebuild pass creates the package, or V3-96 creates it as an owner-approved precursor sub-deliverable. This is the first entry in the S4 defect ledger until satisfied.
2. The doctrine is the governing law of this pass. Its 16 principles, 10 Engine Briefs, Earning Map, Kindness Doctrine table, and telemetry contract are the **only** allowed implementations on every showcase surface. If anything in this prompt contradicts the doctrine, the doctrine wins and this prompt is corrected in the same PR.

The owner's compounding guidance: **polish is trust, not decoration** (broken states are blockers); **capability evidence above the fold, not headline size** (`feedback_no_giant_hero_text.md`); **honest about what we earn and why it's fair** (the Earning Map is public, not hidden); **premium = restraint** (one primary action above the fold per surface; two primaries is zero primaries).

## Inherited doctrine (verbatim, non-negotiable)

V3-96 inherits `docs/v3/public-pages-interaction-principles.md` word for word:

- **Part I (Owner Addendum), Principles 1–8** — govern every action button on every showcase surface: three-state buttons, width-locked, optimistic by default, success collapses to confirmation, destructive actions get inline two-step confirm, conversion-critical buttons get the strongest motion language, never navigate away from a form unless the user asks.
- **Part II (Extended), Principles 9–16** — restraint as signal, latency as design, trust reveals not trust dumps, kindness as system, micro-commitments before macro-commitments, consensual + mutual + visible earning, joy as conversion, recovery as profit centre.
- **Part III (Earning Map)** — every revenue surface on the showcase has a row; the row is the contract.
- **Part IV (Engine Briefs)** — Engines 1–10 (CTA, Micro-Commitment, Trust Reveal, Abandonment Recovery, Joy, Earn-With-Us, Newsletter Earn, Pricing Reveal, Concierge Handoff, Local Boost) live in `@henryco/interactions` and are consumed by every showcase route.
- **Part V (Kindness Doctrine)** — the anti-pattern table is enforceable; any reviewer can block this pass for any anti-pattern in the left column.
- **Part VI (Telemetry)** — every event fires with the listed properties; events flow to the V3-90 data sink.
- **Part VII (Cross-pass application checklist)** — every line is acceptance criteria; signed line by line in the final report.

## Inherited craft layer (verbatim, non-negotiable) — the cinematic standard

V3-96 ALSO inherits `docs/rebuild-prompts/LAUNCH-SHOWCASE-CRAFT-STANDARD.md` word for word. The
interaction doctrine above governs *behaviour* (what every button/flow does); this craft layer
governs *cinematography* (how the surface feels). It is the difference between a correct
showcase and a world-class one. Read it in full; it is the bar.

The showcase deploys **four cinematic instruments**, each with a where-appropriate AND a
where-never rule. Restraint is the governing law (premium = restraint; one primary action per
surface): a page may feature ONE scrubbed hero moment, clips only where motion adds meaning,
grain as an almost-subliminal finish, glass only where something floats. If every section
shouts, nothing is heard — and the Kindness Doctrine reviewer can block the pass for noise.

1. **Scroll-driven build** — the page assembles as the visitor scrolls (hairlines draw, type
   settles, evidence counts up). Native `animation-timeline: view()`/`scroll()` first, one
   shared `IntersectionObserver` fallback; meaning-staggered (headline → proof → action);
   transform/opacity only. **Never** gate content legibility on scroll position, never hijack
   scroll velocity, never trap the user. Above-the-fold capability evidence (the doctrine's
   no-giant-hero rule) resolves on load, not on scroll.
2. **Cinematic clips** — muted, looping, `playsinline` motion with a real `poster` (poster
   paints for LCP, never the stream), AA scrim over any foreground text, lazy-mounted +
   `pause()` off-screen. **Never** autoplay sound, never block LCP, never put localizable text
   inside the frame; `prefers-reduced-motion` shows the poster still.
3. **Film grain** — a 3–6% noise overlay (SVG `feTurbulence` or tiled PNG, `pointer-events:
   none`, blend `overlay`/`soft-light`), one layer per surface, theme-aware. **Never** over
   reading prose (`.hc-prose`) or dense body text; it must never lower text contrast in either
   theme (READING-01/02 holds).
4. **Glass cards** — `backdrop-filter` frosted surfaces with a token translucent fill + hairline
   + a `@supports not (backdrop-filter:…)` opaque fallback, AA+ text. **Only** over rich
   backgrounds (hero/media overlays, sticky CTAs over a clip); **never** the default card, never
   stacked, never under long-form reading.

Binding constraints (all four): **both themes** via design tokens (zero hardcoded color);
`prefers-reduced-motion` honored by every motion; AA contrast over clips/glass; compositor-only
animation (transform/opacity); per-surface budgets LCP < 2.5s / CLS < 0.1 / INP < 200ms; full
degradation (no-JS readable, old browsers get opaque fallbacks). Brand = **Henry Onyx**; voice
stays calm authority — the craft carries the awe, the words stay calm. The anti-shallow-work
charter in the standard applies: take the whole prompt in, finish every page to the last focus
ring and locale, leave nothing unclean, verify before claiming done.

## Mandatory scope

### S1 — The Cross-Division Journey (the centrepiece)

A single connected experience a real visitor takes from cold landing to delighted return. The journey *is* the showcase — a working flow an investor can repeat on a phone in five minutes, in production, in their own currency and locale, with real verified providers and real receipts.

**The journey, exactly:**

1. **Cold landing** at `henryWebRoot('/')` — visitor arrives with no account, no cookies, no signal. Above the fold: one primary action (Principle 9), capability evidence (a real verified-provider photo + a real outcome number, both pulled from V3-50 records with recorded consent), no headline-size shouting. Trust reveal stage 1: outcome evidence only.
2. **Browse Fabric Care** — visitor explores verified providers. V3-50 tier badges visible, quality scores live, real reviews from V3-50 records. Marketplace ranking (V3-52) respects the diversity guard (no single seller dominates). Compact / comfortable / spacious density toggle persists to the anonymous session.
3. **Save anonymously** — visitor saves one provider via the Micro-Commitment Engine (Principle 13, rung 2). Save persists to a server-backed anonymous session that survives device/browser changes (the V3-01 anonymous-session pattern extended for logged-out users). The Joy Engine (Engine 5) emits a 600 ms confirmation: confident check, scale-in icon, accent-token glow — no celebration animation, no second modal.
4. **Identify lightweight** — visitor enters an email for "we'll let you know if this provider's calendar opens up." Rung 3 of the ladder. The Newsletter Earn Engine (Engine 7) names the value to the user, not to us. Single field, frequency-capped.
5. **Browse Marketplace and Property** — visitor crosses divisions. Ranking (V3-52) re-ranks for the now-identified visitor using cross-division signals (V3-36). Property listings (V3-53 rules engine) show only valid, inspected, governance-passed entries — no held or rejected listings leak. Local availability (V3-38) shows what's near the visitor.
6. **Book a Fabric Care provider** — visitor picks a slot (V3-51 smart booking), selects services from the expanded catalog (V3-49), and sees the price in **their currency** (NGN / USD / GHS / KES, rendered per V3-21 tax + V3-84 localization + V3-85 per-market routing via `@henryco/pricing`). The Pricing Reveal Engine (Engine 8) breaks out the platform fee with an honest tooltip whose copy reads from `@henryco/i18n` and names the **Henry Onyx** platform fee ("supports verification, dispute resolution, and 24/7 support"). Trust reveal stage 2: capability evidence inline (one short quote from a real verified buyer — name + city + verified-purchase mark).
7. **Pay** — visitor pays via the payments router (V3-13). The router selects the per-market provider (V3-85) without leaking the provider name in headers or body (ANTI-CLONE Principle 9). The live provider is Paystack (V3-15) plus one of Stripe / Flutterwave (V3-14 / V3-16) in at least one other market. The ledger entry (V3-17) is double-entry and immutable; amounts are integer minor units (BIGINT kobo/cents); the call carries an idempotency key; the webhook is HMAC-verified and reconciled; status is provider-confirmed money-truth, never optimistic. The receipt PDF (V3-18) carries the **Henry Onyx Limited** legal entity and is watermarked. The invoice email lands (V3-61 transactional path). Trust reveal stage 3: safety net inline (money-back terms, dispute window, response-time SLO). Stage 4 (pay): trust marks rendered ONLY here — payment-provider logos, encryption mark, the Henry Onyx guarantee.
8. **Joy state** — booking succeeds with the Fabric Care variant of the Joy Engine (Engine 5): warm hand-off, success copy that names outcome and next sensible action ("Booked with Adaeze for Saturday 10am — we'll text reminders the day before"), a single 10 ms haptic on mobile (never long), one optional next action.
9. **Opt into Concierge** — the single optional next action opens the V3-59 Concierge surface, which is the V3-28 **Henry Onyx Intelligence** chat with the concierge preset (`@henryco/intelligence`). The AI provider (Anthropic / OpenAI / Claude / GPT) never appears in UI, loading state, error, or telemetry (V3-26 + V3-28 brand lock). Cost-per-message preview visible *before* send (V3-27 metered billing). Free first message; metered only if the visitor explicitly asks for "more help" beyond the first interaction (Engine 9 contract).
10. **Return next session** — visitor closes the browser. Next day, on the same device, they land on a *different* page (e.g. `henryDomain('marketplace')`) and find: their saved provider surfaced first on the personalized home (V3-34); their booking on the account dashboard with the smart-next-action prompt (V3-39, "Booking with Adaeze on Saturday — anything to prepare?"); any unfinished form draft preserved intact (V3-01 + V3-37 + V3-45, none of which weaponize the abandonment); a quiet end-of-page cross-division suggestion (V3-36, "you booked Fabric Care; here are caregiver jobs locally if you're hiring").
11. **Upgrade to premium tier** — visitor upgrades their subscription (V3-20). Proration math shown honestly. Both cadences (monthly + annual) shown with the annual saving expressed in the user's currency, not in % alone (Engine 8). Confirmation names what they unlocked. No upsell second modal.
12. **Earn-With-Us pathway** — the Earn-With-Us Engine (Engine 6) surfaces at the *end* of relevant pages: "Are you a verified caregiver? Verified providers earned an average of ₦X last month on Henry Onyx." The number is server-computed, real, never hard-coded. Click leads to provider onboarding (V3-67), not a generic signup. Never shown to a user already enrolled in that role.
13. **Concierge follow-up across sessions** — V3-48 follow-up campaigns send a single consensual recovery message at the right time in the user's timezone, *only if* the visitor consented and abandoned a high-intent flow. The link drops them at the exact field where they left.
14. **Audit trail** — every step emits the telemetry from Part VI of the doctrine + the V3-96 events in S6. Every event lands in the V3-90 sink within 1 minute and is visible on the live ops dashboard (S5).

The journey must run end-to-end on: iOS (V3-87 super-app + V3-88 store build), Android (V3-87 + V3-88), web desktop (Next.js), and web mobile (responsive of the same apps); across at least **3 locales** (including one non-Latin script if `@henryco/i18n` Wave 3 shipped one); across at least **3 currencies** (NGN + USD + one of GHS / KES); with at least **2 payment providers live** (Paystack + one of Stripe / Flutterwave). If any step requires "you'd see this if X passed" or a workaround for an unfinished pass, V3-96 cannot close — the S4 defect ledger catches it.

### S2 — The Showcase Microsite

Hosted on the hub at `henryWebRoot('/v3/*')`. Every URL in this section is constructed via `henryWebRoot()` — no literal domain anywhere.

**S2.1 — Read the V3 story** (`henryWebRoot('/v3')`, one page, 8-second comprehension target): the 12 pillars and what each ships, each row with one production screenshot (no mockups). Every claim carries a footnote referencing the pass ID and its closure report — enforced by the honesty audit (validation gate 7). Capability evidence above the fold per the doctrine; no giant text. Reading time shown honestly; longer than 3 minutes means the page is doing too much.

**S2.2 — "Try the journey" CTA** (`henryWebRoot('/v3/try')`, the live sandbox): one click seeds a sandbox account with a real fixture dataset (per the V3-01 fixture pattern, `project_henryco_v3_01_e2e_fixture_user.md`, tagged for metric isolation). Walks the visitor through S1 steps 1–11 with sandbox payment (real router, sandbox provider mode) and every other system live. All sandbox telemetry carries the `v3_96_sandbox` tag so it never pollutes production metrics. At the end, the visitor can convert the sandbox account into a real account with all saved state preserved. **The sandbox is never gated behind a sign-up** (the doctrine's micro-commitment ladder permits browsing without identification).

**S2.3 — The Earning Map** (`henryWebRoot('/v3/how-we-earn')`): renders Part III of the doctrine as a user-readable surface, division by division. Names every revenue mechanism in Henry Onyx (take rates, subscription tiers, verified-provider tier subscription, sponsored deals, API metering, partner onboarding fees, AI usage-billing margin, and gaming arena stakes-margin **only if** D2 cleared and V3-66 shipped). For each row: what the user gets in exchange, and why Henry Onyx would be comfortable seeing the rate in a screenshot on social (Principle 14 test). Linked from the showcase footer and from the platform-fee tooltip in every checkout.

**S2.4 — Press kit** (`henryWebRoot('/press/v3')`): brand assets per ANTI-CLONE Principle 7 + L10 — trademark-marked Henry Onyx wordmark, monogram, and the "Henry Onyx Intelligence" mark, all rendered from `@henryco/brand` / `@henryco/branded-documents`. Real product screenshots, each watermarked per ANTI-CLONE Principle 5 (visible mark + invisible metadata identifying download source + timestamp). Owner-voiced founder bio, accurate boilerplate (legal entity = **Henry Onyx Limited**), stable contact. Counsel-reviewed before publish (L10).

**S2.5 — Capability inventory** (`henryWebRoot('/v3/what-shipped')`): per-division, a tight list of what V3 delivered, each item with a "see it live" deep link (V3-04). Anything explicitly deferred (e.g. Gaming Arena V3-65/66 if D2 deferred) is noted with the V3-60 quarterly-themes framing. No vapourware; no "coming soon" without that framing.

**S2.6 — Doctrine surface (optional, owner-decided)** (`henryWebRoot('/v3/principles')`): a public rendering of Parts I + II of the doctrine, in owner voice, as the rules Henry Onyx builds by. If the owner declines, the doctrine stays internal-only and this surface is not built.

### S3 — The Announcement

Multi-channel; every channel inherits every doctrine principle. Every user-facing string flows through `@henryco/i18n`; every URL through `henryWebRoot()` / `henryDomain()`.

**S3.1 — Founder post** (`henryWebRoot('/announcing-v3')`): owner-voiced (the owner writes the prose; this pass produces the publishing surface). One-paragraph overview, key capabilities linked to S2.5, real watermarked screenshots + recordings of premium flows, customer FAQ, single owner quote. Shareable URL with attribution tracking (V3-04 share-link inventory).

**S3.2 — Email** via the V3-61 newsletter engine (`@henryco/newsletter` + `@henryco/email`): segmented by division of last activity (anonymous users excluded — they opted out by staying anonymous; respect that). Per-locale, per-currency. Honest opt-out at the top, not buried in the footer (Kindness Doctrine). One CTA — "see what's new in your division" — to a V3-04 deep-link target. Single send; no follow-up unless the user opens.

**S3.3 — Push** via the V3-87 super-app + OneSignal: only to users who consented to product-update notifications (V3-93 consent ledger checked). Single push, single CTA, no follow-up unless clicked. Localized per user; currency-aware in the body if a price appears.

**S3.4 — In-app "What's new"**: first-login banner on every division app, dismissible inline (Principle 4 — two-step confirm, no full-modal interruption). The banner names what changed *in that division specifically*, not the V3 overall pitch. One CTA per division, maximum. Gated behind the V3-91 flag `v3_launch.enabled`.

**S3.5 — Press outreach** and **S3.6 — Social**: out of code scope, owner-managed. The press kit (S2.4) is what reporters get; visual assets ship there. Outreach itself is not this pass.

### S4 — Defensive Completeness Gates

V3-96 cannot close if any critical-path pass is open or carries unaddressed regressions. A script reads `.codex-temp/v3-*/report.md` + `docs/v3/V3-LAUNCH-READINESS.md` + the closure-status lines in each pass file and produces `docs/v3/V3-96-DEFECTS.md`.

- **Phase B (Foundation Lock)** — V3-01 → V3-12, with V3-12 owner sign-off (D11) on file. *(All confirmed SHIPPED per the pass register; the script verifies, it does not assume.)*
- **Phase C (Money & Identity Spine)** — V3-13 (router) closed; V3-17 (ledger) closed with daily-balance reconciliation green for the last 30 days; at least one of V3-14/15/16 live in production (D1 applied); V3-18 (receipts/invoices) closed with watermarking verified; V3-19 (refunds) closed; V3-22 (finance dashboard) closed and owner-consumed; V3-24 (KYC) closed for at least one market (D6); V3-25 (moderation) closed.
- **Phase D (AI)** — V3-26, V3-27, V3-28, V3-33 closed; brand-lock + provider-mask verified (validation gate 6); wallet-gating verified (unauth blocked, wallet-zero blocked).
- **Phase E (Personalization)** — V3-34, V3-36, V3-37, V3-39 closed — the journey uses every one.
- **Phase F (Workflow)** — V3-43 closed (cron migrations applied); V3-45 closed (S1 step 13 recovery uses it); V3-46 closed (owner gets D1/D7/D30 reports automatically).
- **Phase G (Product Expansion)** — V3-49, V3-50, V3-51, V3-52, V3-53, V3-59, V3-61, V3-63 closed. V3-54/55/56/57/58/62/64 closed if their division is in the S2.5 inventory. V3-65 + V3-66 (gaming): if D2 deferred, the showcase MUST NOT reference gaming; if shipped, it MUST include a gaming sub-journey.
- **Phase H (Partner & Enterprise)** — V3-67 closed (Earn-With-Us routes here); V3-69 closed (first partner has received a real payout); vertical suites V3-70 → V3-75 closed for the divisions surfaced in S2.5.
- **Phase I (Platform/Global/Mobile/Observability)** — V3-76 closed (gateway holds); V3-83 live at `henryDomainHost`-resolved `developers.*` if any of V3-77/78/79/80 shipped, else marked deferred; V3-84 closed for D10 markets; V3-85 closed; V3-87 closed and V3-88 approved on both stores; V3-89 closed; V3-90 closed (the dashboard reads from it); V3-91 closed (first three experiments running); V3-92 closed (restore drill < 30 days old); V3-93 closed (DSAR + deletion verified); V3-94 green; V3-95 signed.
- **Doctrine package** — `@henryco/interactions` exists with Engines 1–10 implemented and consumed across at least 3 divisions. If absent, V3-96 produces it as an owner-approved precursor sub-deliverable (see Audit summary gap 1).

If any gate fails, the ledger names the failing pass + which journey step it breaks + a hand-off to a `V3-NN-FOLLOWUP`. V3-96 cannot self-certify with a non-empty critical-path ledger.

### S5 — The Live Ops Dashboard

Owner-only surface at `apps/hub/app/owner/(command)/v3-launch/dashboard/`. RLS-gated to the owner role; PII-redacted per V3-93 + `@henryco/observability/redaction`. Built on `@henryco/dashboard-shell`. Reads from V3-89 traces, the V3-90 sink, the V3-91 experiment registry, the V3-22 finance dashboard, V3-50 verified-provider telemetry, V3-67 partner telemetry, V3-93 privacy events, and V3-26 AI-guardrail events.

**Panels:**
1. **Showcase health** — uptime per surface; hero-CTA time-to-first-click per locale (Principle 10 perception budget); scroll-depth-before-conversion per page.
2. **Journey funnel** — S1 steps 1–11 with conversion ratio at each rung, per locale / currency / device class.
3. **Money** — revenue per minute, per provider, per currency, with consolidated USD on the owner view; currency-locale-respecting display.
4. **Joy** — Engine 5 instrumentation: `joy_state_seen` count, return rate by cohort (joyful vs flat first transaction), day-2 recall.
5. **Recovery** — Engine 4 instrumentation: abandonments by surface, recoveries resumed, time-to-resume distribution.
6. **Trust** — Engine 3 instrumentation: `trust_stage_entered` events; conversion delta per stage (browse → consider → commit → pay).
7. **Pricing honesty** — Engine 8 instrumentation: currency-revealed-to-checkout-completion ratio per locale.
8. **Concierge** — Engine 9 instrumentation: hand-off opens, free-message replies, premium-tier upgrades.
9. **Earn-With-Us** — Engine 6 instrumentation: invitations shown, click-through to V3-67, completed onboardings.
10. **Anti-clone watchdog** — rate-limit hits, bot challenges issued (ANTI-CLONE Principle 4), provider-name-leak scans returning ZERO (Principle 9), audit-log anomaly alerts (Principle 12).
11. **A/B holdouts** — V3-91 exposure counts + conversion deltas for the first three experiments (V3-52 ranking, V3-35 deals copy, V3-48 campaign step).
12. **SLO health** — V3-89 SLO breach indicator per critical journey: signup, booking, payment, AI call, partner payout.
13. **Privacy + safety** — V3-93 DSAR + deletion volume; V3-25 moderation throughput; V3-40 risk-tier enforcement holds + freezes.

Real product, not a mockup. The owner watches it through the launch window; V3-46 owner reports auto-deliver D1/D7/D30 snapshots.

### S6 — Telemetry contract

Every interaction in S1, S2, S3 emits the relevant Part VI doctrine event with the exact listed properties. No new event types unless added to the doctrine table in the same PR.

V3-96 adds these closure-specific events to the typed union in `packages/observability/src/events.ts` (format `henry.<domain>.<entity>.<verb>`, consistent with the existing file) and to the doctrine telemetry table in the same PR:

- `henry.v3.showcase.viewed` — `{ surface_id, locale, currency, commitment_tier, referrer_class, device_class }`
- `henry.v3.journey.started` — `{ entry_surface, sandbox: boolean }`
- `henry.v3.journey.step_completed` — `{ step_index (1–13), time_ms, locale, currency }`
- `henry.v3.journey.completed` — `{ total_time_ms, locale, currency, sandbox: boolean }`
- `henry.v3.journey.abandoned` — `{ step_index, time_on_step_ms, reason_class }` (recovery candidate)
- `henry.v3.announcement.delivered` — `{ channel (email/push/in_app/blog), segment, locale }`
- `henry.v3.announcement.engaged` — `{ channel, time_from_send_s, locale }`
- `henry.v3.launch_window.metric_breach` — `{ metric_name, observed, threshold, action_taken }` (paging signal)
- `henry.v3.closure_certificate.signed` — fires once, when the owner signs S9.

All events PII-redacted at ingest via `@henryco/observability/redaction` (V3-90 default). All queryable in the live ops dashboard (S5).

### S7 — Localization + currency lock

The showcase ships in all 12 locales managed by `@henryco/i18n`. Every string flows through typed copy (Pattern A) or `translateSurfaceLabel` (Pattern B) per `project_henryco_i18n_architecture.md`. **No English fallback shown to a non-English visitor mid-flow** (Principle 12). Concrete namespaces introduced: `surface:v3-showcase`, `surface:v3-earning-map`, `surface:v3-announcement` — labels, status, and errors all translated.

Currency rendering uses the multi-currency foundation via `@henryco/pricing` (per `project_henryco_currency.md`). Every price in the journey renders in the user's currency; conversion-time FX shown next to converted prices when applicable (Engine 8). Validated against NGN, USD, GHS, KES at minimum; whichever currencies V3-84 + V3-85 closed go live too. If V3-84 shipped an RTL or non-Latin locale, the showcase verifies it specifically (mirrored layout, font availability, line-height correctness).

### S8 — Accessibility and motion

- Focus visible on every interactive element (Principle 7); `aria-busy` honored during in-flight states.
- 44×44 mobile hit targets verified across every journey step.
- `prefers-reduced-motion` strips the Joy Engine scale + glow, keeps the inline label change (Principles 2 + 15).
- Keyboard-only run of the entire journey passes (a11y soak); screen reader announces success, failure, and trust stages distinctly via ARIA live regions.
- Color contrast meets WCAG AA on every showcase route (`@henryco/tokens` already on AA — verify, don't assume). No flashing > 3 Hz; no auto-playing audio.

### S9 — The V3 Closure Certificate

Final artifact: `docs/v3/V3-CLOSURE-CERTIFICATE.md`, owner-signed. Contents: every V3-NN pass (V3-01 → V3-95) with closure date and report link; every owner decision (D1–D17) with resolution date and resolution; every legal item (L1–L18) with status (closed / deferred / N/A); every integration key in `INTEGRATION-KEYS.md` with rotation date; acceptance against Part VII of the doctrine line by line with diff evidence; a short owner statement (what V3 became, what V4 will be); owner signature line + date. This certificate is the canonical "what V3 is" reference forever after; V4 inherits from it.

## Out of scope

- Post-launch iteration — anything "we should also fix" goes to a `V3-NN-FOLLOWUP`, not this pass.
- New product surfaces beyond the showcase site itself (S2 surfaces are showcase-specific).
- V4 planning (separate artifact).
- Marketing-campaign authoring (V3-61 handles delivery; authoring is owner-managed).
- Press relations and social (press kit ships; outreach is owner-managed — S3.5 / S3.6).
- Continued improvement of any pillar (each pillar's continued work is its own `V3-NN-FOLLOWUP`).

## Dependencies

- **Upstream:** V3-95 owner sign-off on the launch-readiness pack; every critical-path pass in S4 closed with the defect ledger empty or owner-accepted; `@henryco/interactions` (Engines 1–10) available.
- **Downstream blocks:** nothing in V3 — this is the terminal pass. It hands off only to V4 planning (not started here).

## Inheritance

- `@henryco/interactions` — Engines 1–10 from the doctrine; consumed by every showcase route. (Create as a precursor sub-deliverable if still absent — see Audit summary.)
- `@henryco/config` — brand truth (`company.ts`) + domain helpers (`domain.ts`: `henryDomain`, `henryWebRoot`, `henryDomainHost`, `getHubUrl`, `getAccountUrl`). No hardcoded brand or domain anywhere.
- `@henryco/email` + `@henryco/newsletter` — announcement email, transactional receipts, segmentation, opt-out (V3-18, V3-61).
- `@henryco/seo` — microsite SEO, sitemap, robots.
- `@henryco/i18n` — 12-locale coverage (Pattern A + Pattern B); namespaces in S7.
- `@henryco/intelligence` — the Henry Onyx Intelligence concierge surface (V3-28/59).
- `@henryco/payment-router` + `@henryco/payment-surface` — checkout in the journey (V3-13); behavior-locked, money invariants absolute.
- `@henryco/pricing` — currency + tax rendering (V3-21, V3-84, V3-85).
- `@henryco/observability` — `events.ts`, `audit-log.ts`, `persist-event.ts`, `redaction.ts`, Sentry, `/api/health` (V3-10, V3-89, V3-90); the V3-91 experiment registry feeds the dashboard.
- `@henryco/dashboard-shell` + `dashboard-modules-owner` — the owner live ops dashboard.
- `@henryco/branded-documents` + `@henryco/brand` — receipts, invoices, watermarked press-kit exports, the trademark-marked Henry Onyx wordmark/monogram.
- `@henryco/auth` + `@henryco/lifecycle` — session primitives, deep-link round-trip, anonymous-session pattern, "continue where you left off" (V3-01, V3-02, V3-04, V3-37).
- The doctrine `docs/v3/public-pages-interaction-principles.md` — inherited verbatim.

## Implementation requirements

### Files

- `packages/interactions/**` — Engines 1–10 (only if not already created by an earlier public-pages pass; owner-approved precursor).
- `apps/hub/app/v3/**` — story (S2.1), try-the-journey (S2.2), how-we-earn (S2.3), what-shipped (S2.5), optional principles (S2.6).
- `apps/hub/app/press/v3/**` — press kit (S2.4).
- `apps/hub/app/announcing-v3/**` — founder post (S3.1).
- `apps/hub/app/owner/(command)/v3-launch/dashboard/**` — live ops dashboard (S5).
- `packages/observability/src/events.ts` — append the 9 V3-96 closure events to the typed union (S6).
- `docs/v3/public-pages-interaction-principles.md` — append the 9 events to the Part VI telemetry table (same PR).
- `docs/v3/V3-96-DEFECTS.md` — generated defect ledger (S4).
- `docs/v3/V3-CLOSURE-CERTIFICATE.md` — owner-signed certificate (S9).
- i18n: new keys under `surface:v3-showcase`, `surface:v3-earning-map`, `surface:v3-announcement` across all 12 locale files.

### Trust / safety / compliance

- **ANTI-CLONE** Principles 1–7, 10, 11, 12 verified live on every showcase route; the watchdog panel (S5.10) makes this measurable.
- **Truthful claims** — every line on S2.1 and S2.5 footnoted to a closed pass + report file (honesty audit, gate 7).
- **Real quotes/outcomes** in S1 trust reveals require recorded consent (V3-50 verified record + consent flag). No invented testimonials, no stock-photo executives.
- **Press-kit assets** watermarked per ANTI-CLONE Principle 5; counsel-reviewed for trademark + IP (L10).
- **Live ops dashboard** PII-redacted (V3-93 default); RLS-gated to owner role.
- **Money invariants** (S1 step 7) absolute: integer minor units, idempotency keys, HMAC-verified + reconciled webhooks, double-entry ledger, provider-confirmed status. The payment surface is behavior-locked — this pass renders it, never changes its behavior. Receipt/invoice legal entity = **Henry Onyx Limited** (must match the CAC entity for Paystack compliance).
- **Henry Onyx Intelligence** trademark per Principle 7 + L10; the AI provider name (Anthropic/OpenAI/Claude/GPT) never appears in UI, error states, telemetry property values, or response payloads (gate 6).
- **Sensitive-action guard** (V3-02 `requireSensitiveAction` server / `fetchWithSensitiveAction` client) on the sandbox-to-real account conversion and any destructive showcase route; audit-log via `@henryco/observability/audit-log`.

### Mobile + desktop parity

- The cross-division journey (S1) works end-to-end on iOS (V3-88 store build) + Android (V3-88) + web desktop + web mobile, using the V3-09 mobile-consistency primitives.
- The live ops dashboard (S5) is desktop-only (admin). The showcase + announcement surfaces are responsive across breakpoints.
- Deep-link round-trip (V3-04) verified: share link from the announcement → mobile app install → resume in the app at the link target.

### i18n

Namespaces `surface:v3-showcase`, `surface:v3-earning-map`, `surface:v3-announcement`. Every label, status, and error translated across all 12 locales (Pattern A typed copy / Pattern B `translateSurfaceLabel`). No English fallback in a non-English session (Principle 12). Verified in at least 3 locales (default en-US, fr, ig); add one non-Latin if Wave 3 shipped it.

### Brand & design system

- Brand strings sourced from `@henryco/config` (`company.ts`) — **Henry Onyx** user-facing, **Henry Onyx Limited** on legal/receipt/invoice/press-boilerplate surfaces, **Henry Onyx Intelligence** for the AI surface. Never hardcode the brand; never write "Henry & Co." (retired) except when explicitly describing the historical rename.
- Every URL via `henryWebRoot()` / `henryDomain()` / `henryDomainHost()` / `getHubUrl()` / `getAccountUrl()` — zero hardcoded domains.
- Display typeface Fraunces (self-hosted, subset, preloaded, serif→serif fallback) on public/editorial surfaces; system-sans body. Tokens only — `--site-*` / `--accent` per division from `company.ts`; the home recipe uses `--home-*`. Shared chrome = `PublicSiteShell` + `PublicSiteFooter` from `@henryco/ui`. No ad-hoc hex, no invented token systems.
- Light + dark, mobile + desktop, CLS ≈ 0, contrast not regressed (`pnpm a11y:contrast`).

## Validation gates

1. **Standard CI** — `pnpm ci:validate` from root (lint, typecheck, build), i18n strict-gate (no hardcoded user-facing strings), a11y, PNH-04 security headers.
2. **Doctrine compliance audit** — every line in Part VII of `docs/v3/public-pages-interaction-principles.md` checked with diff evidence; any unchecked item blocks; the audit appears verbatim in the final report.
3. **Cross-division journey e2e** — Playwright run of S1 steps 1–13 on a preview deploy, in 3 locales × 3 currencies × 2 sandbox payment providers, on iOS Simulator + Android Emulator + Chromium desktop + Chromium mobile. Zero step failures; time-to-first-meaningful-paint within the V3-89 budget on every step.
4. **Live ops dashboard rendering** — every S5 panel (1–13) fetches real data over a 24-hour soak before launch; no placeholders, no mocks; each panel screenshot pasted in the final report.
5. **Defensive completeness scan** — the S4 script reads pass closure reports and produces `docs/v3/V3-96-DEFECTS.md`; ZERO red entries on the critical path; owner-accepted entries permitted but documented.
6. **Brand-lock grep** — `grep -ri "Claude\|GPT\|Anthropic\|OpenAI\|gpt-\|claude-" apps/ packages/` returns ZERO hits in user-facing copy, error states, telemetry property values, response payloads, or showcase surfaces (test fixtures + internal config exempt). Plus `grep -ri "Henry & Co\|Henry Holdings\|Henry Technologies\|HenryCo Group" apps/ packages/` returns ZERO hits in user-facing copy (the showcase says **Henry Onyx**).
7. **Honesty audit** — every claim on S2.1 + S2.5 has a footnote resolving to a closed pass + report file; reviewer checks every footnote resolves.
8. **Anti-pattern audit (Kindness Doctrine)** — reviewer manually scans every showcase route against the Part V table; ZERO instances of the left column. Specifically scanned for: pre-checked subscribe boxes, fake countdowns, grey "no thanks" buttons, hidden fees, modal-on-first-visit, USD prices to non-USD users, "you might miss out" copy, full-page interrupt on destructive action, English fallback in non-English sessions.
9. **Telemetry audit** — every Part VI + S6 event fires; properties match the schema; events land in the V3-90 sink within 1 minute; dashboard panels surface them. Trace any missing event and close the gap before merge.
10. **Press-kit audit** — every asset downloadable from `henryWebRoot('/press/v3')`; every brand mark trademark-marked; boilerplate accurate (Henry Onyx Limited); counsel-review approval on file (L10).
11. **Performance** — showcase routes meet the V3-89 budget; hero-CTA time-to-first-click under 100 ms perceived (Principle 10); LCP < 2.5 s on 4G; CLS < 0.1; INP < 200 ms.
12. **A11y soak** — keyboard-only journey passes; screen reader (NVDA / VoiceOver / TalkBack) announces every state transition; reduced-motion respected; WCAG AA contrast on every route.
13. **7-day soak on preview deploy** — owner walks the journey daily on a phone and reports verbatim findings; every issue fixed before launch or moved to `V3-NN-FOLLOWUP` with owner approval.
14. **Earning Map verification** — every Part III row rendered on `henryWebRoot('/v3/how-we-earn')`; every revenue surface in the showcase points to its row; diversions documented.

## Deployment gate

- All validation gates passing with evidence pasted in the final report.
- Owner walks the journey on a phone in 3 locales and signs off in writing.
- V3-95 launch-readiness pack current; no rotated keys missing; no backup older than 7 days; no incident runbook missing.
- Press kit counsel-reviewed for trademark + IP (L10) — approval on file.
- `docs/v3/V3-96-DEFECTS.md` empty or every item owner-accepted.
- Owner sets the launch date and triggers the launch ceremony.

**Launch ceremony** (owner-led; V3-96 engineer supports):
1. Owner publishes the announcement post (S3.1).
2. Owner triggers email + push send via V3-61 + V3-87 OneSignal.
3. In-app "What's new" flag flipped via V3-91 (`v3_launch.enabled = true`) — instant rollout, no staggered ramp.
4. Owner watches the live ops dashboard for the first 4 hours.
5. The V3-96 engineer monitors the anti-clone watchdog + the SLO panel; pages the owner on any breach.
6. After 24 hours, V3-46 owner reports send the D1 launch snapshot automatically.

## Final report contract

`.codex-temp/v3-96-showcase/report.md` with the standard 9 sections (exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline · deferred items · pass-closure assertion), plus:

1. The signed `docs/v3/V3-CLOSURE-CERTIFICATE.md`.
2. The defect ledger `docs/v3/V3-96-DEFECTS.md` (ideally empty; otherwise lists what's deferred to `V3-NN-FOLLOWUP` with owner sign-off).
3. Launch metrics reports — `docs/v3/V3-96-LAUNCH-METRICS-D1.md`, `-D7.md`, `-D30.md` (auto-generated by the V3-46 owner-reports workflow; engineer adds qualitative commentary).
4. Owner-voice retrospective `docs/v3/V3-96-RETRO.md` (owner writes; engineer captures): what worked, what didn't, what V4 inherits.
5. The standard 9 engineer sections — Migration/RLS/env is likely minor (microsite content tables + the 9 appended events); Validation evidence pastes every gate 1–14; the pass-closure assertion reads: **"V3 is closed. V3-CLOSURE-CERTIFICATE on file. Hand-off: V4 planning."**

## What "magnificent" looks like

If V3-96 lands well, a visitor will: **arrive on a phone** with no prior context, anywhere Henry Onyx operates; **understand within 8 seconds** what Henry Onyx is — from capability evidence above the fold (a real verified provider's face, a real outcome number, a real city), not headline shouting; **do one meaningful thing** — browse a real verified provider, save it, see a real price in their own currency — **without creating an account**; **feel that nothing manipulated them** (no fake countdowns, no fake scarcity, no second modal, no pre-checked boxes, no hidden fees, no English copy in their non-English session, no grey "no thanks" next to a coloured "yes"); **come back the next day** on the same or a different device and find their saved provider on home, their draft form intact, a respectful smart-next-action, and a quiet cross-division suggestion; **pay for something later** and see the platform fee broken out and named, the price in their currency, the FX math if applicable, and **feel the 600 ms joy state**, not 6 seconds of confetti; **receive the recovery message** if they abandon a high-intent flow — right time, right timezone, single link to the exact field, no pressure, no second message unless they re-engage; **discover the Earning Map** from a footer link and read every way Henry Onyx earns in plain language, with what they get in exchange, and **agree the take rate is fair**; and **tell someone else** — unprompted — because the experience was premium, considered, and humane. If any part of that requires an asterisk or a "well, in a future pass…", V3-96 has not closed.

## Self-verification

**Scope:**
- [ ] S1 — cross-division journey works end-to-end in production: 3 locales × 3 currencies × 2 providers × iOS + Android + web.
- [ ] S2 — microsite live on `henryWebRoot('/v3/*')` with story, try-the-journey, Earning Map, press kit, capability inventory, and (per owner decision) the optional principles surface.
- [ ] S3 — announcement delivered across the 4 in-scope channels (founder post, email, push, in-app banner); press + social handed to owner.
- [ ] S4 — defensive completeness gates verified; `docs/v3/V3-96-DEFECTS.md` empty or owner-accepted; `@henryco/interactions` present with Engines 1–10.
- [ ] S5 — live ops dashboard rendering real data on every of 13 panels; PII-redacted; owner can watch the launch window.
- [ ] S6 — every doctrine event + the 9 V3-96 events firing with schema-matching properties; in the V3-90 sink within 1 minute.
- [ ] S7 — 12 locales verified; no English fallback in a non-English session; pricing in user currency with FX hover; one non-Latin locale verified if Wave 3 shipped one.
- [ ] S8 — accessibility verified (keyboard run + screen reader + reduced motion + WCAG AA contrast).
- [ ] S9 — `docs/v3/V3-CLOSURE-CERTIFICATE.md` signed by the owner.

**Doctrine compliance:**
- [ ] Part I (Principles 1–8) verified on every action button on every showcase surface.
- [ ] Part II (Principles 9–16) verified on every showcase route.
- [ ] Part III (Earning Map) rendered on `/v3/how-we-earn`; every revenue surface points to its row.
- [ ] Part IV (Engines 1–10) in `@henryco/interactions` and consumed by every showcase route.
- [ ] Part V (Kindness Doctrine) anti-pattern audit clean — ZERO left-column instances.
- [ ] Part VI (Telemetry) every listed event firing with listed properties.
- [ ] Part VII (Cross-pass checklist) signed line by line in the final report.

**Brand & anti-clone:**
- [ ] Brand sourced from `@henryco/config`; user-facing copy says **Henry Onyx** / **Henry Onyx Limited** / **Henry Onyx Intelligence**; zero "Henry & Co." (or other retired names) in user-facing copy.
- [ ] Zero hardcoded domains — every URL via `henryWebRoot()` / `henryDomain()` / `getHubUrl()` / `getAccountUrl()`.
- [ ] Brand-lock grep clean (no AI-provider names in user-facing copy, error states, telemetry, or payloads).
- [ ] ANTI-CLONE Principles 1, 2, 3, 4, 5, 6, 7, 10, 11, 12 verified live; watchdog panel (S5.10) green on launch day.
- [ ] Press kit watermarked + counsel-reviewed (L10).

**Launch ceremony & closure:**
- [ ] Owner walked the journey on a phone in 3 locales and signed.
- [ ] V3-95 launch-readiness pack current; press kit counsel-reviewed.
- [ ] Launch ceremony executed; D1 + D7 + D30 metrics reports delivered.
- [ ] V3 is closed; `docs/v3/V3-CLOSURE-CERTIFICATE.md` signed and on file; defect ledger empty or accepted; retrospective written.
- [ ] Hand-off: V4 planning (separate pass; not started here).

---

**End of V3-96. End of V3.**
