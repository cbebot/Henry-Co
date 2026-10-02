# V3-MKT-TRUST-01 — Instant publish, policy gate, probation, payout identity

Status: design for the pass built on branch `worktree-v3-mkt-trust-01` (base `origin/main` b1efffe3).
Everything ships dark behind `MARKETPLACE_INSTANT_PUBLISH` (default OFF). The migration is
committed and held; production was not touched.

> **Reconstruction notice.** The pass brief reached the build session truncated: it began at the
> last sentence of item 6. Items 1–5 and most of 6 were not recoverable from disk. Sections marked
> **(assumption)** below reconstruct them from what survived (items 7–8, the ABSOLUTE block, the
> adversarial list, the VERIFY block and the final-line template). Each is a decision the owner
> can overturn without touching the others.

## 1. What changes for a seller

| Today (flag OFF, unchanged) | With the flag ON |
|---|---|
| Apply → upload identity + payout documents → wait for a human to approve the store | Apply → store opens immediately, on probation. Identity is asked for at the first payout, not before the first listing. |
| Submit a listing → human approval queue → live | Publish → the policy gate decides at write time: **publish** (live now), **hold** (a human looks, exceptions only) or **reject** (fix-it reasons, nothing saved). |
| Any edit of a live listing unpublishes it and re-queues it | An edit is re-evaluated at write time; a clean edit stays live. |
| A reported or risky live listing stays live until a human acts | Deterministic evidence can **auto-hide** a listing. That is the only automated enforcement, and it is reversible. |

## 2. Gate audit — 20 gates between signup and a public listing

Source: full audit in the pass report. "Human" = needs a staff/owner decision.

| # | Gate | Human | Disposition with the flag ON |
|---|---|---|---|
| G1 | account sign-in | no | keep |
| G2 | store identity fields on the application | no | keep |
| G3 | identity + payout documents required to apply | no | **moved to the payout gate** |
| G4 | seller agreement acceptance | no | keep |
| G5 | store-story contact/payment screening | no | keep (folded into the onboarding verdict) |
| G6 | application approval | **yes** | **removed** — store is provisioned by the gate |
| G7 | `vendor` role membership (created only by G6) | no | granted at onboarding |
| G8 | approved store row (created only by G6) | no | created at onboarding |
| G9 | explicit "submit" | no | keep — it becomes "Publish" |
| G10 | hard block on off-platform payment steering | no | keep — policy `reject` |
| G11 | listing limit by derived trust tier (TS) | no | **replaced** by probation caps for new sellers |
| G12 | listing cap by plan tier (DB trigger) | no | keep — a commercial allowance, now reported as a reason code instead of a 500 |
| G13 | quality score < 68 → manual review | routes to human | **removed** as a queue; essentials missing → `reject` with guidance |
| G14 | risk score ≥ 35 → manual review | routes to human | **removed** as a blanket threshold; individual signals decide |
| G15 | identity-unverified seller → every listing reviewed | routes to human | **removed** (identity lives at payout) |
| G16 | high-risk category needs a higher trust tier | routes to human | **replaced** by a probation rule (`hold`) |
| G17 | V3-25 moderation (dormant behind `MODERATION_ENFORCED`) | no | always part of the gate |
| G18 | product approval queue | **yes** | **removed** for `publish` verdicts; remains the exception queue for `hold` |
| G19 | re-review on every edit | **yes** | **removed** — edits are re-evaluated at write time |
| G20 | 60–120 s catalogue cache lag | no | fixed — the cache tag is busted on publish and hide |

Audited: 20. Removed or moved off the listing path: **G3, G6, G13, G14, G15, G18, G19** (7).
Replaced by a narrower automated rule: G11, G16. Kept: the rest.

## 3. Architecture

```
seller POST ──► route (flag check) ──► publish gate (TS)
                                         1. authorize: actor from the session, vendor from the membership
                                         2. deterministic floor  ── @henryco/moderation (ruleset "listing_v2")
                                                                 ── @henryco/trust contact detection
                                                                 ── marketplace governance (existing)
                                                                 ── probation caps, price, category
                                                                 ── image fingerprints (duplicates)
                                                                 ── V3-40 staff hold / freeze (read only)
                                         3. optional AI signal (flag-dark; can only turn publish → hold)
                                         4. record verdict ──► service-role RPC ──► verdict ledger
                                         5. write the row
                                                    │
                                   DB guard trigger ▼  (binds EVERY role, service_role included)
                       live transition or live content change ⇒ needs a matching, unconsumed,
                       unexpired `publish` verdict  — or a verified-staff decision — or company catalogue
```

### 3.1 No second engine

- Content policy is `@henryco/moderation` (V3-25). This pass adds an opt-in ruleset to it and an
  obfuscation-proof contact detector to `@henryco/trust`. Defaults are unchanged, so callers that
  do not opt in behave exactly as before.
- Seller economics and limits stay in `apps/marketplace/lib/marketplace/governance.ts`.
- Risk is V3-40. The gate **reads** a staff-applied hold/freeze; it never writes one. Auto-hides
  are surfaced to V3-40's staff queue as `flag` rows — the only action V3-40 permits a system actor.
- Human decisions stay on the existing paths: the marketplace admin decision and the hub owner
  action `owner.marketplace.product.review`. Restoring an auto-hidden listing is the existing
  "approve"; upholding it is the existing "reject". No new owner action system.

### 3.2 Verdicts

Outcome is one of `publish`, `hold`, `reject`. Every verdict carries stable reason codes.

| Class | Reason codes |
|---|---|
| reject (seller can fix, or prohibited) | `prohibited_goods`, `hate_speech`, `known_bad_image`, `contact_details`, `off_platform_payment`, `counterfeit_claim`, `incomplete_listing`, `price_invalid`, `image_not_first_party`, `plan_listing_limit`, `probation_listing_cap`, `probation_daily_cap`, `probation_price_cap`, `seller_not_active`, `listing_conflict` |
| hold (a human decides) | `scam_language`, `profanity`, `contact_suspected`, `duplicate_image_other_seller`, `high_risk_category_probation`, `risk_hold_active`, `enforcement_hold_active`, `ai_flagged_scam`, `ai_flagged_nsfw`, `ai_flagged_abuse`, `ai_flagged_other`, `gate_unavailable` |
| publish (recorded, not blocking) | `duplicate_image_same_seller`, `urgency_language`, `thin_listing` |

Composition rule: any reject-class code ⇒ `reject`; else any hold-class code ⇒ `hold`; else
`publish`. The AI step runs only when the deterministic outcome is `publish` and can only add
hold-class codes. It is structurally unable to turn a `reject` or `hold` into a `publish`.

### 3.3 DB layer (held migration)

New tables — RLS on, no policies, no grants to `anon`/`authenticated`; `service_role` may read,
and writes happen only inside `SECURITY DEFINER` functions that are executable by `service_role`
alone:

- `marketplace_listing_gate_verdicts` — append-only ledger (listing and seller verdicts).
- `marketplace_seller_probation` — one row per instantly-onboarded store.
- `marketplace_listing_enforcement` — reversible hides (`active` → `lifted` | `upheld`).
- `marketplace_image_fingerprints` — SHA-256 + perceptual hash per first-party image.

Guard on `marketplace_products` (BEFORE INSERT OR UPDATE, every role):

1. Row not `approved` after the write ⇒ allowed (nothing is live).
2. Already live and the content hash is unchanged ⇒ allowed (stock, rating, badge).
3. Otherwise the row is becoming live, or live content is changing. Allowed only if one holds:
   - **engine verdict** — an unconsumed, unexpired `publish` verdict for this slug, vendor and
     exact content hash (hash is computed in SQL, by the same function, on both sides);
   - **staff decision** — a status-only change by a trusted role where `reviewed_by` is an active
     marketplace staff member and `reviewed_at` is newly set (the existing human paths, unchanged);
   - **company catalogue** — company-owned inventory written by a trusted role (the catalogue seed).
4. Probation caps are re-checked at the moment of going live, under a per-vendor lock.

An AFTER trigger consumes the verdict (or records the staff / catalogue verdict), so **every live
listing has a recorded verdict**. A companion guard on `marketplace_product_media` only accepts
images covered by the listing's standing verdict while it is live.

The verdict RPC re-checks, in SQL: the actor is a member of the vendor (or staff), the slug is not
another vendor's, the store is active, no staff-only hide is open, and the probation caps. It can
tighten a TS verdict; it can never loosen one.

### 3.4 Probation **(assumption)**

Applies to stores opened by instant onboarding. Ends when identity is verified **and** 3 orders
are delivered **and** 14 days have passed.

| Cap | Value |
|---|---|
| live listings | 10 |
| new listings per 24 h | 5 |
| price per listing | ₦500,000 |
| high-risk categories | held for review |

The values live in one SQL function; TS reads them from the state RPC.

### 3.5 Identity at the payout gate **(assumption)**

`payoutEligibility` blocks a payout request, and a finance approve/release, unless the store
owner's identity is verified and no staff-applied risk hold is open. With the flag ON this applies
to every seller. A DB trigger on `marketplace_payout_requests` backs it for probation stores.
No money RPC, and nothing in `payments_private`, is touched: the gate only refuses.

### 3.6 Reversible auto-hide **(assumption)**

Triggers, all deterministic evidence:

1. a re-scan under a newer ruleset finds a reject-class violation;
2. three or more distinct reporters within 14 days;
3. a staff-applied V3-40 hold/freeze on the listing.

A hide moves the listing to `under_review`, records why, notifies the seller, and blocks checkout
of the item. Hides of kind `policy` lift themselves when the seller's fix passes the gate. All
others need a staff or owner decision. Nothing is ever deleted, no seller is suspended and no
payout is frozen by the system.

### 3.7 Optional AI signal (flag-dark)

Gateway surface `marketplace.listing.screen`: platform-invoked, `billable: false`, run with
`noBillingPort`. Spend is reserved before the call against the unified internal ledger under the
key `marketplace_trust`. If that primitive is absent (V3-43 not applied), or the budget is spent,
or the provider fails, the step is skipped and the deterministic verdict stands. Only a closed
vocabulary crosses back; no provider or model name leaves the server.

## 4. Flag OFF is the current behaviour

Each touched handler gains one early branch, `if (isInstantPublishEnabled()) return …`. The legacy
code below it is not edited. With the migration applied and the flag OFF, the guard is still
satisfied by today's flows: sellers only ever write `draft`/`submitted`/`under_review`, and the
human approval paths already set `reviewed_by`/`reviewed_at`.

## 5. Rollout

Day-of steps are in `ACTIVATION.md` next to this file: apply the migration, run the held backfill
(dry run first), set the flag, redeploy. Rollback is the flag alone.

## 6. Deferred to V3-MKT-TRUST-02

Reporting UX, appeals, the moderation-queue UX, public policy pages and seller scorecards.
