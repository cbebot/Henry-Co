# V3 Recommended Roadmap

**Pass:** V5-5 V3 Discovery Framework
**Compiled:** 2026-05-03
**Author:** Claude · Opus 4.7 (1M context) · xhigh
**Audience:** owner, before V3 prompts are forged
**Status:** RECOMMENDATION — every item below is subject to owner override

This document is Claude's recommended V3 sequence informed by:
- The state-of-platform inventory (`V3-DISCOVERY-INVENTORY.md`)
- The V2 capability inventory (what shipped vs what's half-done)
- The V3 backlog from V2 (`V3-BACKLOG-FROM-V2.md`)
- The owner's stated north star: premium ecosystem, dominate market, build moats, dashboard rebuild as V6

The roadmap recommends 3 parallel tracks. The owner picks the V3 feature track(s) from a 6-candidate menu.

---

## North star (re-stated for alignment)

The owner has consistently framed HenryCo as:

1. A premium multi-division ecosystem (not a thin marketplace, not a thin SaaS)
2. A real company with real capability surfaces (Studio, Care, Marketplace, Property, Jobs, Learn, Logistics — each a real business)
3. Built to dominate its primary market (Nigeria first; geographic ambition is owner-decided)
4. With unique moats (cross-division identity, single-account everything, branded documents, premium UI primitives)
5. Where the dashboard rebuild (DASH-1 → DASH-8) is a separate V6 track that runs after V3 features land

V3 must respect all five.

---

## V3 in three parallel tracks

### Track T1 · V5-3 + V5-4 P0 closure PR (week 1)

**Goal:** Land all uncommitted V5 polish so production matches the working tree, then sign the V2 closure certificate.

**Scope:** V3 backlog §B1–B12 in a single PR titled `fix/v5-3-deep-sweep-and-hero-pivot`:

- WhatsApp webhook HMAC verification ×3 (B1) — owner provisions `WHATSAPP_APP_SECRET` in Vercel before merge
- Jobs `/api/hiring/messages` IDOR + role check + rate limit (B3)
- Care `/api/care/contact` rate limit (B4)
- Studio templates rebuild — 14 templates + `/pick` browser + `/pick/[slug]` detail + `/teams` leadership + home featured strip (B5)
- Studio scope-step rebuild — real tech-stack picker with priced deltas (B6)
- Property `/search` server-side pagination + above-the-fold image priority (B7)
- Marketplace `/search` reveal-in-batches + above-the-fold priority (B8)
- `git rm --cached apps/marketplace/.env.marketplace.pulled` + already-set gitignore pattern (B9)
- Hub OneSignal SDK worker untracked file review (B10)
- V5-4 P0 hero typography re-cap across 6 division globals.css + hub HubHomeClient + marketplace inline KPI strip (B11)
- `packages/brand` add `react`/`@types/react` devDep to fix hub typecheck (B12)

**Effort:** 1 week (the work is already done; this is commit + PR + CI + deploy + smoke).

**Risk:** Low. All changes typechecked except B12 which is a 5-line `package.json` fix.

**Dependency:** Owner provisioning `WHATSAPP_APP_SECRET` for care/property/studio Vercel envs (Production + Preview). Without it, webhook receivers fail closed — correct security but silent operationally.

**Exit:** V2 closure certificate signature line filled in. V5-4 audit re-runs and returns CERTIFIED.

---

### Track T2 · Live verification infra provisioning (weeks 1–2)

**Goal:** Stand up the rails that V5-3 and V5-4 both deferred. Without these, no future closure audit can certify "live verified."

**Scope:** V3 backlog §A1–A8:

- A1: Playwright + screenshot baseline runner against Vercel previews (1–2 days)
- A2: Lighthouse CI on Vercel previews; baseline top 30 routes mobile + desktop (1 day)
- A3: Wire `scripts/a11y/audit.mjs` to a real route walker (the script exists; needs a runner — half a day)
- A4: Mozilla Observatory snapshot on 5 canonical domains (manual; 1 hour)
- A5: RLS coverage report — every user-scoped table verified RLS-on with the right policy (Supabase admin + pg_dump — 1 day)
- A6: Cross-tenant search probe with two test accounts (half day)
- A7: Email-emitting flow walk per division (sandbox sender credentials — 1 day per division × 8)
- A8: Notification flow matrix end-to-end with timing (test users + queue runner — 2 days)

**Effort:** 2 weeks for A1–A6 (the hard ones); A7+A8 ride alongside T3 features.

**Risk:** Low-medium. Standard CI work. Mozilla Observatory + RLS can be done by hand in week 1 if the runner work lags.

**Dependency:** None (infra is independent of features).

**Exit:** Every V3 feature PR auto-runs Playwright + Lighthouse + axe on its preview deploy. Future closure audits get evidence "for free."

---

### Track T3 · Owner-authorized V3 feature track (weeks 2–8+)

**Goal:** Build whichever V3 features the owner authorizes from the 6-candidate menu below.

**Effort:** ~7 weeks for one feature track at full depth; parallel tracks are possible if the owner authorizes more than one.

The 6 candidates are listed in priority order based on what V2 left half-done — this ordering is Claude's recommendation, not a constraint:

#### T3.A — Marketplace discovery + ranking at scale (RECOMMENDED #1)

**Why first:** V5-2 hand-off §1 already specified the architecture in 5 sub-PRs (PR-A through PR-E). The owner explicitly raised this concern: *"when the marketplace and property website grows wide are those long big cards still needed or recreated? When thousands of goods are there it will not be easy for users to find their choice easily. The system should know or guess what user might need intelligently — not randomly shuffle like a fool. The higher the trust the luckier to show users."* That is V3 thesis-aligned.

**Sub-PRs (V5-2 hand-off):**
- V3-MARKET-A — Compact card variant + density toggle + responsive grid
- V3-MARKET-B — Merit-weighted shuffle + diversity guard + cold-start logic (server-side, no UI change)
- V3-MARKET-C — Personalisation re-rank (anonymous + signed-in)
- V3-MARKET-D — Editorial overlays + curation UI in staff
- V3-MARKET-E — Discovery telemetry + staff-facing dashboards

**Effort:** 5 weeks (one PR per week). Stages are independently reversible.

**Risk:** Medium. Re-ranking can break vendor trust if low-trust sellers surface inadvertently — diversity guard + trust gate is the safety mechanism.

**Dependency:** T2 (Lighthouse CI to baseline performance before vs after).

**Owner moat:** Discovery quality is the marketplace moat once catalog grows past 100 items.

#### T3.B — Notification + search closure (RECOMMENDED #2)

**Why second:** V2-NOT-02-A and V2-SEARCH-01 both shipped foundations that are wired to ~2 of 8 division shells. V5-3 §s2-primitive-audit names this gap. Closing it is a "finish what V2 started" pass — modest effort, large user-visible payoff.

**Scope:**
- E1: Wire `notifications-ui` bell to hub owner workspace + 6 division shells
- H1: Mount `<PaletteHost />` in care, jobs, learn, logistics, marketplace, property, studio shells
- H2: Verify search-index outbox cron timing under realistic load
- H3: Run `scripts/search-backfill.mjs --apply` against production (after Typesense env provisioning)
- E3: Cross-app notification timing measurement
- E4: Audience-model edge cases (V2-NOT-02-A §1.2 decision C revisit)

**Effort:** 2 weeks.

**Risk:** Low. Pure rollout work — no new schema, no new public surface.

**Dependency:** Owner provisions Typesense env vars (`TYPESENSE_HOST`, `TYPESENSE_ADMIN_API_KEY`, `TYPESENSE_SEARCH_API_KEY`) before search backfill ships.

**Owner moat:** Cross-division search + cross-division notification is a single-ecosystem moat that competitors can't replicate without rebuilding.

#### T3.C — Property rules engine + jobs interview room (RECOMMENDED #3)

**Why third:** Both are named-but-not-built features in `docs/PRODUCT-GAP-LEDGER.md`. They are the two largest remaining holes in division capability claims.

**Scope:**
- Property rules engine — listing-validity rules, inspection eligibility (per `docs/property-inspection-eligibility-rules.md`), governance flag automation
- Jobs interview room — scheduled video room, recruiter notes, candidate-employer chat (V2-COMPOSER-01 already provides the composer)

**Effort:** 4 weeks (2 weeks each, can parallelize).

**Risk:** Medium. Both touch real customer-facing flows and need a11y + perf certification.

**Dependency:** T2 (live verification infra) recommended before merge.

**Owner moat:** Closes the gap between marketing claim and product reality. Without these, the jobs and property division pages overpromise.

#### T3.D — International expansion (CANDIDATE — owner-decided)

**Why deferrable:** i18n strings are present (V2 carry-forward, 7 locales) but dynamic content + payment + auth localization is not. Going international requires owner ambition decision (geographic moat vs depth moat).

**Scope:**
- M2: hreflang real implementation
- Localized payment (Stripe + Paystack + Naira-specific gateways)
- Localized auth flows (SMS OTP for non-email markets, region-specific KYC providers)
- Currency rendering canonicalization (V2 multi-currency foundation already shipped)

**Effort:** 6 weeks.

**Risk:** High. Each market has its own payment + identity + tax + content laws.

**Dependency:** Owner explicitly authorizes geographic expansion.

**Owner moat:** Time-to-market in adjacent African markets if the owner wants to move first.

#### T3.E — Mobile super-app ramp (CANDIDATE — owner-decided)

**Why deferrable:** `apps/super-app` and `apps/company-hub` both exist as Expo skeletons (3,145 + 3,735 LOC). Production submission has not happened. Mobile-first markets are a moat opportunity if the owner moves there before competitors.

**Scope:**
- Map customer dashboard parity (orders, bookings, applications, support, notifications, addresses)
- Map owner dashboard parity (notifications, internal comms, KPIs)
- Submit to Apple App Store + Google Play Store
- Push notification provider (OneSignal worker exists in `apps/hub/public/OneSignalSDKWorker.js` — V3 backlog B10 — wire into mobile)

**Effort:** 8 weeks (mobile builds, store submissions, OS-level review take wall-clock time).

**Risk:** Medium. App store review is the wild card.

**Dependency:** Owner authorizes mobile push.

**Owner moat:** Mobile-first onboarding for markets where mobile usage > desktop.

#### T3.F — AI / intelligence layer (CANDIDATE — owner authorization required)

**Why deferrable:** DASH-PROMPT-HARDEN-01 explicitly excluded "AI agents in V2 shell." Whether AI ships in V3 is owner-decided, not Claude-decided.

**Possible scope (if owner authorizes):**
- Smart cross-division recommendations ("you booked Care; here's a Jobs role for caregivers")
- Conversational support bot routing into the existing chat-composer surfaces
- Studio brief intake assistant (helps non-technical users articulate scope)
- Smart marketplace search (semantic + typo-tolerant + intent-aware)
- Trust signal AI (auto-flag suspicious listings/reviews/messages)

**Effort:** 6+ weeks depending on which surfaces ship.

**Risk:** High. Requires explicit governance, abuse model, and "decline gracefully" UX. Premium-ecosystem framing means AI must be substantive — not a chat widget bolted on.

**Dependency:** Owner explicit authorization. Vendor decision (Anthropic / OpenAI / open-source). Cost model.

**Owner moat:** First-mover in AI-aware ecosystem if positioned as quality-not-volume.

---

## Sequencing summary

| Week | T1 closure | T2 infra | T3 features |
|---|---|---|---|
| 1 | Land V5-3+P0 PR | Playwright + Lighthouse runners | — |
| 2 | V2 closure cert signed | A4 + A5 + A6 (manual) | T3.A start (PR-A density variant) |
| 3 | — | A3 axe wired | T3.A PR-B merit shuffle |
| 4 | — | A7+A8 alongside T3 | T3.A PR-C personalisation |
| 5 | — | — | T3.A PR-D editorial + T3.B start |
| 6 | — | — | T3.A PR-E telemetry + T3.B continued |
| 7 | — | — | T3.B closure |
| 8+ | — | — | T3.C property rules + jobs interview (depending on owner) |

This assumes the owner picks T3.A and T3.B as the V3 feature spine. If the owner adds T3.C or one of the candidate tracks, the timeline extends ~4–8 weeks per added track.

V6 (dashboard rebuild via DASH-1 → DASH-8) starts after V3 closes — owner explicitly framed this in V2-DASH-PROMPT-HARDEN-01.

---

## Decisions the owner must make before V3 forging

These are the gating questions. The V3 prompt-fusion turn (next Claude Pro turn) cannot author final V3 prompts until these are answered.

### D1 · Dashboard rebuild placement

The DASH-1 through DASH-8 prompts are forged and ready. Where does it run?

- **Option A:** V2.5 — independent track that runs in parallel with V3 (requires more shell rewrite coordination but ships earlier)
- **Option B:** V3 — sequenced into V3 features (slows V3 features but keeps shell consistent)
- **Option C (recommended):** V6 — runs after V3 closes (clean separation; aligns with owner's prior framing)

### D2 · V3 feature track(s)

Which of the 6 candidates is V3? Pick 1–3:

- [ ] T3.A — Marketplace discovery + ranking at scale (5 weeks; recommended #1)
- [ ] T3.B — Notification + search closure (2 weeks; recommended #2)
- [ ] T3.C — Property rules engine + jobs interview room (4 weeks; recommended #3)
- [ ] T3.D — International expansion (6 weeks; owner ambition decision)
- [ ] T3.E — Mobile super-app ramp (8 weeks; owner authorization)
- [ ] T3.F — AI / intelligence layer (6+ weeks; owner explicit authorization)

### D3 · Live verification infra timing

- **Option A:** V3 prerequisite — block V3 features until T2 ships (2-week delay; future audits "free")
- **Option B (recommended):** V3 in-scope — T2 runs alongside T3 in parallel (no delay; T3 PRs in weeks 1–2 are not yet auto-tested)

### D4 · Staff app deploy lag (V3 backlog C1)

- **Option A (recommended):** Diagnose + fix the Vercel webhook before V3 begins
- **Option B:** Accept as known V3 entry condition; document staff app as "V2-baseline" until V3 cleanup

### D5 · Branch hygiene

V2 closure certificate §C8 enumerates 17 merged feature branches eligible for cleanup. **Owner authorize bulk delete?** (Yes / No / Partial — list which to keep)

### D6 · Operational owner gates (must answer before V5-3+P0 PR can merge)

- **WhatsApp HMAC env (`WHATSAPP_APP_SECRET`)** — provision in Vercel for care/property/studio (Production + Preview)? **Yes / No**
- **V2-ADDR-01 legacy backfill migration** — authorize apply with `OWNER_OK` token? **Yes / Defer**
- **`apps/marketplace/.env.marketplace.pulled`** — authorize `git rm --cached`? **Yes / No** (token already expired so risk is procedural only)

### D7 · Trust-as-product surfaces

- Transparency reports (annual: how many KYC submissions, dispute rate, etc.) — **V3 / V4 / never**
- Public security posture page (`/security` or `/.well-known/security.txt`) — **V3 / V4 / never**
- Bug bounty program — **V3 / V4 / never**

### D8 · Per-division abuse models

V5-3 uncovered division-specific abuse surfaces (jobs IDOR, care contact spam, WhatsApp injection). The T1 closure PR fixes the urgent ones. Should V3 include a deeper per-division abuse modeling pass?

- **Option A:** Roll into T1 closure — single PR
- **Option B (recommended):** Separate V3 hardening pass after T3 features ship — scoped to "what new abuse surfaces did we just create?"

### D9 · Production state mismatches (from `docs/PRODUCT-GAP-LEDGER.md`)

The 2026-04-09 product-gap ledger flags several stale public surfaces ("Loading marketplace", "Preparing the public Care experience" first-render copy). V5-2 + V5-3 likely fixed many; verification needs T2 infra. **Re-audit as part of T1 closure or defer to T3.B closure?**

---

## Risks Claude is tracking

1. **Staff app deploy lag (C1)** — if not fixed before V3, the staff workspace will diverge further from the rest of the platform every week. Recommend fixing in week 1 (independent of T1).

2. **Typesense env not provisioned** — search degrades to empty results today. T3.B can't ship until this is fixed. Owner action needed.

3. **Google Places env not provisioned** — address autocomplete falls back to `[unverified]` results today. T3.A and T3.C both touch addresses; recommend provisioning before they start.

4. **Branch sprawl** — 166 branches is high for a project with 22 PRs. Cleanup before V3 reduces noise for the next set of PRs.

5. **Owner availability** — V3 has many gating decisions (D1–D9). If the owner is intermittently available, recommend batching the answers into a single sync rather than blocking each track on a question.

6. **No live test infra** — every V2 closure audit hit this wall. T2 is the structural fix. Without it, V3 closure will hit the same wall 8 weeks from now.

---

## What V3 will not do (for clarity)

- V3 will not author the dashboard rebuild — that is V6 (DASH-1 through DASH-8 already prompted)
- V3 will not change the role model fundamentally (5 role types stay; refinements may add badge counts to chooser etc.)
- V3 will not migrate off Supabase or Vercel
- V3 will not introduce a runtime feature flag service unless owner authorizes (V3 backlog Q4 is an audit, not an introduction)
- V3 will not build AI agents unless owner authorizes T3.F
- V3 will not introduce new languages/locales unless owner authorizes T3.D

---

## Self-verification

- [x] 3-track structure (T1 closure, T2 infra, T3 features) named with rationale per track
- [x] 6 V3 candidate features enumerated in priority order with effort + risk + dependency + owner-moat per
- [x] V6 (dashboard rebuild) explicitly preserved as post-V3 series, per owner prior framing
- [x] AI flagged as owner-authorization-required, per DASH-PROMPT-HARDEN-01
- [x] 9 owner decisions enumerated (D1–D9) with options + recommendations
- [x] 6 risks tracked
- [x] Out-of-scope clarified
- [x] No V3 prompts authored
- [x] No assumptions about owner ambition without flagging them as decisions
