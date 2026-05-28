# Public Pages — Interaction & Earning Doctrine

**Status:** Inherited inheritance. Read by every pass that touches a public-facing surface (Phase G product expansion, V3-96 showcase, V3-61 newsletter, V3-62 deals, V3-63 local discovery, V3-57/58 seller/business pillars, V3-87 mobile parity, and every future public-pages rebuild).
**Compiled:** 2026-05-27
**Author voice:** Strategic Architect (Opus 4.7) at owner request; owner addendum preserved verbatim as Part I.
**Not negotiable:** Part I (owner principles). Part II–VII expand, never override.

---

## What this document is

A doctrine, not a checklist. It governs how every public-facing button, form, hero, card, modal, banner, and recovery flow on HenryCo behaves — so that the same five rules ship in marketplace, care, jobs, learn, logistics, studio, property, hub, and the showcase. It also governs how those interactions **earn** for the company. Interaction craft and revenue mechanics are the same problem here: every moment of delight is a moment a user chose to stay, and every moment they stay is a moment we can be useful in exchange for value.

If two passes implement the same idea two different ways, this document wins.

---

## What this document is **not**

- Not a design system. The tokens live in Pass 19 (`docs/design-tokens.md` + `@henryco/tokens`). This document tells you *how to use them in motion and intent*.
- Not a copy guide. Voice + tone live in the brand pack. This document tells you *when copy mutates and what state it expresses*.
- Not a growth-hack playbook. We do not manipulate. We make value visible and let users say yes.

---

# Part I — Owner Addendum (verbatim)

When the public pages rebuild happens (Phase G or a dedicated showcase pass), action buttons must follow these principles:

1. **NEVER a full page refresh on action.** That's 2010s web. Mutations happen in-place with optimistic UI.

2. **Loading state is structural, not theatrical.** Use Pass 19 tokens + V3-05 StructuredSkeleton. No generic spinner centered on a button. The button itself communicates state via three modes:
   - **Default:** clear affordance, accent token.
   - **Pressed:** 98% scale, 120ms, immediate feedback.
   - **In-flight:** inline state (subtle indicator + label change to active verb, e.g. "Save" → "Saving").
   Button width MUST NOT shift between states.

3. **Success and failure are both first-class.** Success collapses to confirmation state for 1.5s (checkmark + accent), then returns to default. Failure shows inline error with retry affordance — never a toast for a button action the user just took.

4. **Destructive actions get a two-step confirmation but never a full modal interruption.** Inline confirmation pattern: first click reveals "Confirm?" inline, second click executes, 3-second window to cancel.

5. **Conversion-critical buttons (checkout, sign up, upgrade) get the strongest motion language** — subtle inner glow on hover, confident scale-down on press, satisfying success state. These are the moments revenue is made.

6. **Revenue mechanics baked in:**
   - Track every CTA interaction as a telemetry event.
   - Funnel analytics: time-to-first-click on hero CTA, scroll depth before conversion, abandoned-action recovery.
   - Different button copy variants A/B testable per locale.
   - Soft engagement prompts (newsletter, save for later) surface AFTER a primary action succeeds, never before.

7. **Accessibility non-negotiables:**
   - Focus visible (Pass 19 border-focus).
   - 44×44 mobile hit target.
   - `aria-busy` during in-flight state.
   - Reduced-motion respected (skip the scale + glow, keep the inline label change).

8. **NEVER navigate away from a form unless the user explicitly asks.** If a form submission goes to a confirmation page, that page lives at a different route and the back button returns to the form WITH draft intact (V3-01 pattern).

---

# Part II — Extended Doctrine (Strategic Architect)

The eight rules above are the floor, not the ceiling. Below are the next eight rules — they exist because a button is only a button; the *system the button lives in* is what earns trust and revenue.

## 9 — Restraint is the loudest signal

Premium isn't decibels. It's the absence of noise around the single thing that matters. On any public surface there is exactly one **primary action** above the fold. Everything else is supporting cast: secondary affordances, tertiary information, ambient navigation. If the page has two primaries, it has zero — the user picks neither and leaves.

**How to apply:** at design review for every page, identify the primary action verbally in one sentence ("on this page the user is here to book a verified plumber") and audit that every other element either supports that verb or moves out of the hero. Owner's prior guidance applies: capability evidence above the fold, not headline size (`feedback_no_giant_hero_text.md`).

## 10 — Latency is a design problem, not an engineering one

Every interaction has a perception budget. Under 100ms the action feels instant; under 300ms it feels responsive; under 1000ms it feels slow but acceptable with structural feedback; past 1000ms it requires explanation. Engineering can shrink real latency. Design must shrink *perceived* latency.

**How to apply:**
- Optimistic UI on every mutation that can be reconciled (save, like, favorite, follow, add-to-cart). Roll back on error; explain inline.
- Structural skeletons (V3-05 `StructuredSkeleton`) on every read that exceeds the 100ms budget — not "Loading…", not theater copy.
- For anything past 1000ms, the button enters a third state with a real progress signal (`aria-busy=true`, label changes to active verb, subtle inner animation tied to actual progress when measurable).
- For anything past 3000ms, the operation must be backgroundable — the user can keep using the page and we notify on completion via the V3-03 notification message-states system.

## 11 — Trust reveals, not trust dumps

A page that opens with twelve testimonials, four logos, three certifications, and a Trustpilot widget is a page that does not trust its own product. Surface proof *progressively* — at the moment a user is about to take the next risky step.

The escalation ladder:
1. **Browse:** show outcome evidence (real customer photo, real result, real number). No badges, no logos.
2. **Consider:** show capability evidence inline next to the relevant feature (a single short quote from a real verified buyer, with name + city + verified-purchase mark per V3-50 verified-provider model).
3. **Commit:** show the safety net inline near the commit button (money-back terms, dispute window, who handles support, response-time SLO).
4. **Pay:** show the trust marks ONLY here — payment provider logos, encryption mark, the HenryCo guarantee. Earlier they were noise; here they earn their pixels.

This sequence respects the user. It also lets us A/B test each rung in isolation (V3-91 framework) without confounding variables.

## 12 — Kindness is a system, not a tone

Kindness is engineered. It looks like:
- **No dark patterns.** No fake urgency. No fake scarcity. No pre-checked subscriptions. No grayed-out "no thanks". No second-modal-after-the-first.
- **Recoverable mistakes.** Every destructive action is undoable for at least 5 seconds via inline toast with "Undo" — the V3-03 notification system supports this.
- **Honest pricing.** Total price visible before checkout. Fees broken out. Currency shown in the user's currency (we already have multi-currency foundation — use it). Conversion-time FX shown next to converted prices when applicable.
- **Honest empty states.** When a list is empty, say so. Don't render shimmer for ten skeleton rows of nothing. V3-08 (empty dashboard truth) is the canonical pattern; public pages inherit it.
- **Honest progress.** Don't fake percentage bars. If you don't know the percentage, don't draw one.
- **Translatable everything.** Every CTA, every state, every error, in all twelve locales (i18n Wave 3 architecture). No English fallback shown to a non-English user mid-flow.

The cumulative effect: users feel safe. Safe users come back. Returning users convert at multiples of new-visitor rates. Kindness compounds.

## 13 — Micro-commitments before macro-commitments

Asking a stranger to pay $200 in the first 30 seconds is rude and unprofitable. Ask for $0 first, then $0 with an email, then $5, then $200. Each step is consensual, reversible, and delivers value before the next ask.

The HenryCo public ladder, in order:
1. **Browse value** (no ask): a real listing, a real provider, a real shipment quote. The page must be useful to a logged-out user with no email entered.
2. **Save or compare** (cookie-only ask): "Save for later" or "Add to compare" stores in a server-backed anonymous session. No account needed yet. This is the cheapest commitment we can get and it dramatically improves return rate.
3. **Lightweight identification** (email or phone): unlock saved items across devices; subscribe to relevant updates. Frame as value to the user ("we'll let you know if the price drops"), not value to us.
4. **Account** (full sign-up): only when the user is about to do something that needs identity — booking, paying, listing, applying. Never ask earlier "to continue browsing".
5. **Verified account** (KYC, V3-24): only when the user is about to receive money, list a regulated service, or unlock partner tools.
6. **Subscription / premium** (V3-20): only after the user has experienced what premium unlocks, organically. Never as a paywall on first visit.

Skipping rungs to chase short-term conversion costs us long-term LTV. Hold the ladder.

## 14 — Earning is consensual, mutual, and visible

Every revenue moment on a public page should pass three tests:
1. **The user knows what they're paying for** (no hidden fees, no surprise charges).
2. **The user gets something they value at or above the price** (and we can name what that is in one sentence).
3. **HenryCo can defend the take rate in public** (we'd be comfortable if it appeared in a screenshot on Twitter).

If any test fails, the revenue moment is misdesigned. Redesign before shipping.

The corollary: when the value is mutual and visible, *we don't have to hide pricing or pressure users*. Pricing visible up front converts better in our category (premium services, verified providers, considered purchases) than pricing-on-application. Show the number. Show the value. Let the user decide.

## 15 — Joy is conversion

The 1.5-second success state in Principle 3 isn't just polite — it is a conversion mechanism. A user who *feels* the transaction land returns at higher rates and recommends at higher rates. We invest in micro-joy because micro-joy is high-LTV behavior.

What micro-joy looks like, concretely:
- A confident check, scale-in on the icon, accent token glow, gentle haptic on mobile (single 10ms tap, never long).
- Success copy that names the outcome and the next sensible action ("Booked with Adaeze for Saturday 10am — we'll text reminders the day before").
- No celebration animation longer than 600ms total. Confetti is a tell of insecurity.
- Optional: a single warm hand-off question ("anything else you need before Saturday?") that opens the V3-59 Concierge surface — a path to deeper engagement, not a sales pitch.

## 16 — Recovery is a profit center

Most operators see abandonment as loss. It is loss only if we do nothing. With consent, abandonment is the highest-intent retargeting signal we have.

Recovery is a system, not a tactic:
- **In-session recovery (under 30s):** if the user starts an action and pauses, the page surfaces a single soft helper after 20–30s of idle — never a popup, always inline. Example: half-filled signup → small inline "stuck on something? we're here" with a single optional link to help, plus auto-save of what's typed so far.
- **In-session recovery (page exit):** intent-to-leave (mouse to address bar, mobile blur) triggers *no* modal. Instead the saved draft persists on the device and on the server (where consented). Coming back, the user finds the form where they left it. This is the V3-01 pattern applied to anonymous sessions.
- **Cross-session recovery (consented):** if a user has shared email or phone and abandoned a high-intent flow (checkout, booking, listing creation), a single recovery message goes out at the right time in the user's timezone with a one-click resume link to the exact place they left. No second message unless they re-engage.
- **Never weaponize abandonment.** No countdown clocks fabricated for the email. No "you might lose your spot" if the spot is not actually rivalrous. No discounting that trains users to abandon for a discount. Recovery is an apology for any friction *we* caused.

# Part III — The Earning Map

Below is where the company earns, division by division, with the *interaction signature* each surface must support. Authors of any pass should consult the relevant row before designing the page.

| Division | Primary earning surface | Interaction signature on public page | Pass |
|---|---|---|---|
| **Marketplace** | Take rate on completed transactions; promoted listing slots; deals engine sponsorship | Browse → quick-view → save → checkout, with promoted card visually distinct + clearly labeled "Promoted" (Principle 14: visible) | V3-52, V3-62 |
| **Care** | Booking take rate; verified-provider tier subscription; concierge premium | Browse providers → see verified tier → book with money-back terms inline → optional concierge handoff | V3-49, V3-50, V3-59 |
| **Jobs** | Employer post fees; interview room premium; employer hiring suite | Browse jobs → save → apply with one resume on file → employer-side premium unlocks live behind their own login | V3-54, V3-70 |
| **Learn** | Course revenue share; seller academy paid tracks; learn-to-earn employer tools | Free preview → full lesson behind a fair price → cert sharable in V3-50 verified profile | V3-56, V3-58 |
| **Logistics** | Per-shipment take rate; logistics business dashboard subscription; logistics API metering | Quote on landing in <2s → book with carrier transparency → API tier shown on logistics public page | V3-64, V3-74, V3-78 |
| **Studio** | Project take rate; studio motion/video premium tier; studio enterprise suite | Browse creator → view real portfolio → request quote → premium creator tier surfaces native motion/video tools | V3-55, V3-73 |
| **Property** | Listing fees; property rules-engine subscription for managers | Browse property → save → contact owner with verified buyer mark; property-manager pricing on a separate public page | V3-53 |
| **Hub** | Cross-sell entry into every division; concierge upgrade; newsletter sponsorship | The hub is the lobby — every CTA is a *handoff* to the correct division, never a dead end | V3-59, V3-61 |
| **Platform (APIs)** | Metered API revenue per partner | The developer-facing public page is a microsite (V3-83) — interaction is "see real example → claim a key → see your usage" | V3-76 to V3-83 |
| **Payments router** | Platform fee on every transaction (transparent line item) | Never a public page; it earns on every other page. But the *receipt* page (V3-18) is public-shareable and that page must look as crafted as the marketplace home | V3-13 to V3-22 |
| **AI Intelligence** | Per-call usage billing (V3-27); premium-tier capabilities | The public AI surface (V3-28) is a real demo, not a marketing video. Run a real prompt; see a real response; understand the meter | V3-28 |
| **KYC / verified provider** | Verification fees; verified-provider tier badge (revenue + retention multiplier) | The verified badge is a moment of pride for the provider and a moment of trust for the buyer; both sides must understand what it means | V3-24, V3-50 |
| **Partner / Enterprise** | Onboarding fee + per-month subscription; bulk invoicing for teams | Public partner landing must show real partner outcomes, not stock-photo executives | V3-67 to V3-75 |

**Reading this map:** when a pass authors a new public page, find the division row. The interaction signature column is the contract. Deviations require a written rationale in the pass PR description.

---

# Part IV — Engine Briefs

The interaction patterns below are reusable engines. Each engine has a clear input, behavior, and earning hypothesis. They should be implemented in `@henryco/interactions` (a package created in the first public-pages rebuild pass) and consumed by every division.

## Engine 1 — The CTA Engine

**Purpose:** every primary action button on a public page renders via one component with one behavior contract.

**Behavior:**
- Three states (default, pressed, in-flight), with width-locking per Principle 2.
- Optimistic by default per Principle 10.
- Success state per Principle 3.
- Failure inline per Principle 3.
- Telemetry hook (`cta_clicked`, `cta_succeeded`, `cta_failed`) fired with `{cta_id, surface_id, locale, currency, ab_variant, latency_ms}` per Principle 6.
- Honors `prefers-reduced-motion`.
- Honors locale (label provided by `@henryco/i18n`).
- Honors currency (price interpolation, if any, provided by multi-currency foundation).

**Earning hypothesis:** consistent CTA quality across 9 divisions = compounding A/B learning. A 2% lift learned on Care, propagated automatically.

## Engine 2 — The Micro-Commitment Engine

**Purpose:** the ladder in Principle 13, encoded.

**Behavior:**
- Tracks the user's commitment state (anonymous → cookie → identified → account → verified → subscribed) on a server-backed anonymous session that survives device/browser changes (per V3-01).
- Exposes a hook (`useCommitmentTier()`) that surfaces *appropriate* asks only. A page never asks for a rung the user has already cleared; never asks for a rung two above the user's current.
- Records every offer and every accept/decline. Declines have cooldowns (no second ask for the same rung in the same session, no third ask for the same rung in a week).

**Earning hypothesis:** by asking the right rung at the right moment, we raise the conversion ratio at every step without raising the ask. Total revenue per visitor goes up; user trust does not go down.

## Engine 3 — The Trust Reveal Engine

**Purpose:** the staircase in Principle 11, encoded.

**Behavior:**
- A page declares its trust budget: `<TrustStair stages={["browse","consider","commit","pay"]}/>`.
- Each child trust component (`<Outcome/>`, `<Quote/>`, `<SafetyNet/>`, `<PaymentTrust/>`) renders only at its stage, with the stage determined by user position in the flow (scroll depth + interaction history + section visibility).
- Trust components pull from verified V3-50 records — never from marketing-managed JSON. Real customers, real outcomes, with consented use.

**Earning hypothesis:** trust shown at the right moment converts higher than trust dumped on the hero. Plus: pulling from verified records means trust is *true*, defending against future regulatory or reputational risk.

## Engine 4 — The Abandonment Recovery Engine

**Purpose:** Principle 16, encoded.

**Behavior:**
- Detects pause (no input for 20s on a multi-step flow).
- Detects exit (page unload).
- Saves draft to local storage immediately, then to server within 200ms if identified.
- Triggers cross-session recovery message ONLY if the user has explicitly consented to recovery contact for this flow type AND the abandonment is on a high-intent surface (checkout, listing creation, application). Frequency cap: one recovery per flow per 7 days.
- Resume link drops the user at the exact field where they left, with the exact draft intact.

**Earning hypothesis:** documented 5–15% absolute lift in completion on long-form flows when recovery is consensual and well-timed. In our case (marketplace checkout, care booking, property listing, job application), that's material revenue.

## Engine 5 — The Joy Engine

**Purpose:** Principle 15, encoded.

**Behavior:**
- Standard success surface for every primary action.
- Variants per division (Care: warm hand-off; Marketplace: order summary + tracker pre-link; Jobs: application receipt + next-step ETA; Learn: streak update; Logistics: shipment number + ETA card).
- Each variant ends with a *single* optional next action — never a list of upsells.
- Records `joy_state_seen` and any onward click for telemetry.

**Earning hypothesis:** a measurable lift in 7-day return rate after a "joyful" first transaction vs a flat success. We are buying retention with milliseconds of craft.

## Engine 6 — The Earn-With-Us Engine

**Purpose:** every public page has a "the other side of this" pathway — buyer pages quietly surface seller invitations, browser pages quietly surface provider invitations, learner pages quietly surface teacher invitations. This builds supply for our marketplaces without harassing demand.

**Behavior:**
- A small, persistent, non-disruptive surface at the *end* of relevant pages: "Are you a [provider role]? Start earning on HenryCo." with a single line of proof (e.g. "Verified providers earned an average of ₦X last month" — real, server-computed, not hard-coded).
- Click leads to a provider onboarding microsite, not a generic "sign up" page.
- Never shown to a user already enrolled as that role.

**Earning hypothesis:** demand-side users are our cheapest supply-side acquisition channel. They already trust the platform. A modest, honest invitation at the right moment captures meaningful supply growth.

## Engine 7 — The Newsletter Earn Engine

**Purpose:** the V3-61 newsletter has two revenue lines — sponsorship and conversion — that depend on the public page only capturing high-intent subscribers.

**Behavior:**
- Newsletter capture surfaces only AFTER a primary action succeeds (Principle 6) OR when the user has scrolled past 70% of a content page (article, course preview, locality page).
- The ask names the value clearly ("Weekly: the new verified providers in your city, the deals that survived our editorial filter, and one short read worth your time"). Not "subscribe to updates".
- Single-click subscribe for identified users; one-field for anonymous.
- Frequency cap: not asked twice in the same session, not asked more than weekly cross-session.

**Earning hypothesis:** smaller, higher-intent list = higher open rate = higher sponsor CPM and higher conversion on internal cross-promotion. Quality over quantity.

## Engine 8 — The Pricing Reveal Engine

**Purpose:** show price honestly, render currency correctly, never ambush at checkout.

**Behavior:**
- Price always rendered in the user's currency (multi-currency foundation).
- For converted prices, the source price + FX rate + timestamp visible on hover/tap.
- Platform fee broken out as a line item on checkout. Naming: "HenryCo platform fee — supports verification, dispute resolution, and 24/7 support." (a line on the marketing page explains what it funds; the same line appears on the checkout in tooltip form.)
- Discounts honest: shown vs. previous *verified* price (per V3-50 record), not vs. a fictional MSRP.
- Subscription pricing always shows both billing cadences (monthly + annual) with the annual savings expressed in the user's currency, not in % alone.

**Earning hypothesis:** honesty converts. In our category, hidden fees discovered at checkout are a top-three reason for abandonment globally. Eliminating the surprise eliminates the abandon.

## Engine 9 — The Concierge Handoff Engine

**Purpose:** V3-59 Concierge is both a kindness feature (help a confused user) and a revenue feature (premium concierge tier for hand-held service). The public-page handoff must respect both.

**Behavior:**
- Concierge entry point appears: (a) when a user has lingered on a decision page over 45s without action, (b) when a user has bounced between two listings 3+ times, (c) on any post-success surface as the single optional next action (Joy Engine).
- The entry is always opt-in, never modal, framed in service language ("want a hand picking? talk to a HenryCo specialist — free for the first message").
- The free path delivers real value (a human or AI-assisted recommendation). The premium upsell only appears if the user explicitly asks for "more help" beyond the first interaction.

**Earning hypothesis:** concierge premium tier is high-margin and high-NPS when entered consensually. Forcing it on a confused user is the wrong path; offering it at the moment of demonstrated value is the right one.

## Engine 10 — The Local Boost Engine

**Purpose:** V3-63 local discovery introduces a paid-boost product for providers / sellers to be locally prominent. The interaction must be transparent to buyers (Principle 14) and effective for sellers.

**Behavior:**
- Boosted listings labeled "Promoted by [seller name]" in a clear, low-drama label — not "Sponsored" buried in 9px gray.
- Buyers can mute boosted results from their preferences (kindness; we trust the user to make this choice and the market clears regardless).
- Sellers see a real-time projected impressions / clicks based on their bid and locale, before they pay.
- Outcome reporting transparent: sellers see what they got for what they spent.

**Earning hypothesis:** seller LTV climbs when boost is fair, transparent, and reportable. Trust earns repeat boost spend at rates well above predatory marketplaces.

---

# Part V — The Kindness Doctrine (don't scare the user)

A consolidated list of things we do not do, with their pleasant alternatives. Any reviewer can cite this list to block a PR.

| We do not | We do instead |
|---|---|
| Pop a modal on first visit asking for an email | Earn the email after a value moment (Principle 6) |
| Block content with a "subscribe to read" wall | Free preview, fair price for full content (Principle 13) |
| Pre-check the "subscribe to marketing" box | Default unchecked, with one-sentence honest reason to opt in |
| Use red color for non-error states | Reserve red for true errors and destructive actions only |
| Use fake countdown timers ("offer ends in 04:32") | Real time-bounded offers shown with real expiry; absence of timer otherwise |
| Use "you might miss out" copy | "Here's what this is" copy |
| Hide unsubscribe in the footer of an email | One-click unsubscribe at the top, no hoops |
| Charge for cancellation | Cancellation is free and immediate; we earn re-subscription, not retention through friction |
| Show a price in USD to a Nigerian user | Show in NGN with USD as a hover hint if requested |
| Use grey "no thanks" buttons next to colored "yes" buttons | Equal weight for yes and no; the user's choice is not our copywriting |
| Bury fees | Itemize, name, justify (Engine 8) |
| Auto-renew without 7-day warning email | 7-day warning standard, with one-click cancel inline |
| Add a second modal after the first is dismissed | Once is enough |
| Use "you're so close to done!" copy when the user is not close | Honest progress (Principle 12) |
| Disable the back button | The back button is sacred; the V3-01 draft pattern preserves state |
| Strip user agency in "guided" flows | Every step has a visible exit and a visible save |
| Trick the user into the more expensive plan | The cheaper plan is equally prominent; the value difference is what we sell |
| Use gamification mechanics that exploit (streak-loss anxiety, etc.) | Streaks are celebratory only; losing a streak doesn't cost the user anything material |

This list grows. Anytime a pattern is identified that scares users without earning trust, add it here.

---

# Part VI — Telemetry that funds decisions

Without measurement, this document is opinion. With measurement, it is policy.

The minimum telemetry set for every public page:

| Event | Properties | Purpose |
|---|---|---|
| `page_viewed` | `surface_id`, `locale`, `currency`, `commitment_tier`, `referrer_class`, `device_class` | Baseline cohort segmentation |
| `cta_seen` | `cta_id`, `surface_id`, `ab_variant`, `scroll_depth_at_view` | Did the user even see it? |
| `cta_clicked` | `cta_id`, `surface_id`, `ab_variant`, `time_since_page_view_ms` | First conversion event |
| `cta_succeeded` | `cta_id`, `surface_id`, `latency_ms` | Did it actually complete? |
| `cta_failed` | `cta_id`, `surface_id`, `error_class`, `retried` | Where we lose people |
| `commitment_rung_offered` | `from_tier`, `to_tier`, `surface_id`, `trigger` | Audit the ladder (Engine 2) |
| `commitment_rung_accepted` | `from_tier`, `to_tier`, `surface_id` | Conversion at each step |
| `joy_state_seen` | `cta_id`, `surface_id`, `variant` | Engine 5 instrumentation |
| `recovery_triggered` | `flow_id`, `trigger` (idle/exit), `consented` | Engine 4 instrumentation |
| `recovery_resumed` | `flow_id`, `time_to_resume_s` | Recovery LTV proof |
| `pricing_revealed` | `surface_id`, `currency`, `converted_from` | Currency UX audit |
| `trust_stage_entered` | `surface_id`, `stage`, `via` | Engine 3 instrumentation |

All events flow into the V3-90 data lake. All A/B experiments declare which of these events they care about in the experiment registry (V3-91). No event is added to the production schema without appearing in this table or a documented extension.

The funnel boards that read from this set:
- **Time-to-first-click on hero CTA** (per locale, per device) — the canonical "is this page working" health metric.
- **Scroll depth before conversion** — where the page's argument completes.
- **Abandoned-action recovery rate** — Engine 4's revenue contribution, audited weekly.
- **Commitment ladder funnel** — visible per locale; deviations flag a locale-specific UX issue.
- **Joy → return rate** — Engine 5's hypothesis under test.
- **Currency reveal → checkout completion** — Engine 8 honesty payoff.

---

# Part VII — Cross-pass application checklist

When any pass authors a public-facing page, the prompt's "Acceptance criteria" section MUST include:

- [ ] **Part I, 1–8:** every action button uses the CTA Engine and passes the eight owner principles verbatim.
- [ ] **Principle 9:** the page has one primary action above the fold; secondary affordances do not visually compete.
- [ ] **Principle 10:** every interaction lands within its perception budget; structural skeletons replace any theater copy; backgroundable past 3s.
- [ ] **Principle 11:** trust elements arranged via the Trust Reveal Engine; no trust dump on hero.
- [ ] **Principle 12:** the Kindness Doctrine checklist (Part V) is reviewed and the page commits zero of the listed anti-patterns.
- [ ] **Principle 13:** the page asks for the correct commitment rung for the user's current tier; uses the Micro-Commitment Engine.
- [ ] **Principle 14:** every revenue moment passes the three-test consensual / mutual / defensible check.
- [ ] **Principle 15:** success states use the Joy Engine variant appropriate for the division.
- [ ] **Principle 16:** any high-intent flow integrates the Abandonment Recovery Engine with consented cross-session messaging.
- [ ] **Earning Map (Part III):** the relevant division row is referenced; deviations are documented.
- [ ] **Telemetry (Part VI):** all listed events fire with the listed properties; new events added to the schema if introduced.
- [ ] **i18n:** every string flows through `@henryco/i18n`; tested in at least three locales including one RTL or non-Latin script if applicable.
- [ ] **Multi-currency:** every price renders in user currency with honest conversion.
- [ ] **Accessibility:** focus visible, 44×44 hit targets on mobile, `aria-busy` on in-flight, reduced-motion honored.
- [ ] **Anti-clone (`ANTI-CLONE.md`):** any scored/ranked element computed server-side; any public endpoint rate-limited; no proprietary formula in the bundle.

The pass closes only if every item is checked and the diff demonstrates each.

---

# Part VIII — Owner-only notes (rationale + tradeoffs)

A short section to explain the choices that may seem strict.

**Why one primary action above the fold?** Because two primaries is zero primaries, and zero primaries is a bounce. Every site we admire — Linear, Stripe, Apple — does this. Every site that's harder to use — typical bank dashboards — doesn't.

**Why no modal on first visit?** Because the user has not yet experienced value, so they cannot consent to an exchange. Asking before delivering is begging. We are not beggars.

**Why visible platform fee?** Because we believe HenryCo's fee is fair, and we are happy to show what it buys (verification, dispute resolution, 24/7 support). Hiding it implies we'd be embarrassed to see it. We're not.

**Why no fake urgency?** Because trust compounds and tricks decay. The first time a user catches us inventing a timer, every other claim we make becomes suspect. We cannot afford a single counterexample.

**Why the Earn-With-Us Engine at the *end* of buyer pages?** Because buyers who become sellers / providers are our best supply growth and our cheapest acquisition. We surface the invitation when the buyer is already in flow state with us — not as a banner that distracts from the buyer's task.

**Why micro-joy?** Because a user who *felt* their first transaction returns. A user who shrugged through it doesn't. The 600ms of joy is a retention investment, not a vanity flourish.

**Why one document covering interaction and earning?** Because separating them is the original sin. Sites that treat "growth" and "design" as separate teams build the worst dark patterns. Sites that treat them as the same craft build Stripe, Linear, Notion. HenryCo is in the second camp.

---

# Self-verification

- [x] Part I (owner addendum) preserved verbatim, numbered 1–8.
- [x] Part II extends with 8 more principles (9–16), each with rationale + how-to-apply.
- [x] Earning Map covers all 13 revenue surfaces across all divisions, with corresponding pass IDs from PASS-REGISTER.
- [x] Engine Briefs (10) describe reusable interaction systems with behavior + earning hypothesis.
- [x] Kindness Doctrine table lists anti-patterns + pleasant alternatives, growable.
- [x] Telemetry set listed with every event + properties, feeding V3-90 + V3-91.
- [x] Cross-pass application checklist actionable line by line; pass closes only on all checks.
- [x] Tradeoffs section makes the strict choices defensible to anyone who asks.
- [x] No huge-hero-text recommendations (respects `feedback_no_giant_hero_text.md`).
- [x] All interaction craft tied to specific HenryCo revenue mechanics; nothing decorative.
- [x] Honest about what we do not do; honest about what we earn from and why it's fair.

---

**End of doctrine.** Any future doc that contradicts this either updates this file in the same PR with rationale, or it does not ship.
