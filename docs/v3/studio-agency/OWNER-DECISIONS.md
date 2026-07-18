# Owner Decisions — What Only You Can Ratify (Defaults Included)

**Pass:** V3-STUDIO-AGENCY-DESIGN-01 · **Status: RATIFIED 2026-07-18 — defaults + confirmations.** The owner ratified SA-D1–SA-D5 on the recommended ✦ defaults, with the two SA-D1 sub-confirmations recorded below. The original framing of each decision is preserved beneath the record.

## Ratification record — 2026-07-18

- **SA-D1 — ratified on the default classification**, with both sub-confirmations explicit:
  - **Templated-notifications carve-out: YES.** Templated stage notifications (`build_started`, `preview_ready`, `site_live` — fixed copy, tone-gated) go out **without a tap**; they are the purchased service's own progress reporting. Only AI-authored free text waits for a human.
  - **Class-B delegation pre-approved at ~5 jobs/week.** Once volume exceeds roughly 5 jobs/week, `client_review`-stage approvals (proposal send, AI-drafted replies) delegate to `studio_owner`/`sales_consultation` via `requireStudioRoles`. The owner keeps **deploy, money (budget increase, cancel/refund), and social** permanently.
- **SA-D2 — ratified on the default** (Mode A fixed-price; envelope 20% of package price, floor ₦10,000 / ceiling ₦100,000; all figures seed values in the governed `studio-build-rate-card-v1` rule book).
- **SA-D3 — ratified on the default** (Executor E1 — GitHub Actions in a dedicated repo; Track 1 bundle renderer; deploy staff-manual in SA-2, orchestrator-automated post-approval from SA-3).
- **SA-D4 — ratified on the default** (draft-and-approve social, permanently; no scheduled auto-publish).
- **SA-D5 — ratified on the default** (template packages keep instant auto-send; agency-build briefs hold in `in_review` for a one-tap release with an AI-prepared review card) — **unblocks SA-1**.

---

## SA-D1 — The approval boundary (blocks SA-2)

Who taps Class B approvals ([SAFETY-MODEL §2](./SAFETY-MODEL.md#2-the-action-classification)), and is the boundary right?

- **✦ Default:** the classification as written — reversible work autonomous; deploy/client-sends/spend/publishing one-tap; deploy, budget-increase, cancel, and social additionally password-reauthed. Owner taps everything at first; delegation to named Studio staff (via `requireStudioRoles`) for non-reauth taps is a later switch you flip per role, not a code change.
- **Variant to consider:** delegate `client_review`-stage approvals (proposal send, AI-drafted replies) to `studio_owner`/`sales_consultation` roles from day one, keeping only deploy/money/social to yourself. Recommended once volume exceeds ~5 jobs/week.
- **One deliberate carve-out to confirm explicitly:** your brief lists "client-facing sends" as consequential. The design narrows that to **AI-authored free text** — *templated* stage notifications (`build_started`, `preview_ready`, `site_live`; fixed copy, tone-gated) go out **without a tap**, because they are the purchased service's own progress reporting. If you want every client-touching message tapped, say so — the state machine supports it at the cost of you tapping ~5 notifications per job.
- **Not offered:** any auto-execute tier. The design has no safe place for it yet, and the brief's own principle ("escalate high-level decisions") is only meaningful if the escalation list is immutable from the model's side.

## SA-D2 — Per-job budget & pricing (blocks SA-2)

- **✦ Default:** **Mode A fixed-price** for all packages (price certainty is the product); envelope = **20% of package price**, floor ₦10,000, ceiling ₦100,000 per job (all live-tunable in the `studio-build-rate-card-v1` rule book, audited via `pricing_override_events` — you adjust economics without a deploy). **Mode B metered** enabled only for post-delivery add-on work, quoted-before-run from the client wallet. Refund policy: full before `building`, full minus a stated review fee after `client_review`, no refund after `live` (warranty fixes instead — a warranty fix is a new internal-flagged job on the company's envelope, warranty window **14 days**). Revision rounds: **2** per template package, **3** per agency package (extra rounds = Mode-B add-on). Client-review silence: reminders for **7 days**, then **escalate to you** — never auto-advance. Operator internal spend: **₦5,000/day** ceiling (the shipped free-budget default's order of magnitude), separate from client-job envelopes.
- **The numbers are yours** — the design fixes the *mechanisms* (envelope, caps, quote-before-run, refund-through-existing-rails); every figure above is a seed value in a governed rule book, not code.

## SA-D3 — Sandbox & deploy automation level (blocks SA-2)

- **✦ Default:** Executor **E1** (GitHub Actions in a dedicated repo — proven isolation + environment-approval machinery already in your estate, no new vendor); **Track 1** bundle-renderer (`apps/studio-sites`) as the only artifact kind for packages; deploy step **staff-manual in SA-2**, orchestrator-automated (post one-tap approval) from SA-3. Track 2 full codegen + programmatic Vercel provisioning waits for SA-2b with its own security review.
- **Variant:** jump straight to a managed sandbox vendor (E2) if you want faster spawn times and are happy adding a vendor + secret surface now. The contracts are identical; only the spawn adapter changes.

## SA-D4 — Social policy (blocks SA-5)

- **✦ Default:** **draft-and-approve, permanently** — the operator drafts launch/showcase posts; publishing is always your tap + password, exactly like the shipped `owner.social.post`. This is your existing model; the agency simply feeds it better drafts.
- **Not recommended:** scheduled auto-publish, even allow-listed. Platform ToS, brand voice, and irreversibility all point the same way; revisit only with volume evidence and a per-platform ToS review.

## SA-D5 — The brief review gate (blocks SA-1)

Today every brief auto-prices and auto-sends a proposal with no human look.

- **✦ Default:** keep instant auto-send for **template packages** (the funnel's speed is a feature); hold **agency-build** briefs in `in_review` for a one-tap release with an AI-prepared review card. Best of both: no friction where speed sells, judgment where money and scope are real.
- **Variants:** review-everything (safest, slowest — recommended only if pricing-heuristic misses start costing you) or keep auto-send-everything (fastest — but then the first human look at an agency job happens *after* the client has a price, which is where scope disputes are born).

---

**Ratified 2026-07-18** — D1–D5 on the ✦ defaults, with the two SA-D1 sub-confirmations recorded above. SA-1 (brief refactor) is unblocked immediately; SA-2 is unblocked on D1–D3; SA-5's social posture is settled by D4.
