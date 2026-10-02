# V3-MKT-TRUST-01 — Instant publish, policy gate, probation, payout identity

Status: built on branch `worktree-v3-mkt-trust-01` (base `origin/main` b1efffe3), draft PR #543.
Everything ships dark behind `MARKETPLACE_INSTANT_PUBLISH` (default OFF). The migration is
committed and held; production was not touched. Day-of steps: `ACTIVATION.md`.

> **Reconstruction notice.** The pass brief reached the build session truncated: it began at the
> last sentence of item 6. Items 1–5 and most of 6 were not recoverable from disk. Sections marked
> **(assumption)** below reconstruct them from what survived (items 7–8, the ABSOLUTE block, the
> adversarial list, the VERIFY block and the final-line template). Each is a decision the owner
> can overturn without touching the others.

## 1. What changes for a seller

| Today (flag OFF, unchanged) | With the flag ON |
|---|---|
| Apply → upload identity + payout documents → wait for a human to approve the store | Apply → the store opens immediately, on probation. Identity is asked for at the first payout, not before the first listing. |
| Submit a listing → human approval queue → live | Publish → the policy gate decides at write time: **publish** (live now), **hold** (a person looks — exceptions only) or **reject** (named reasons, nothing is written). |
| Any edit of a live listing unpublishes it and re-queues it | An edit is re-evaluated at write time; a clean edit stays live. A held or refused edit leaves the live version untouched unless the seller asks for it to be sent for review. |
| A reported or risky live listing stays live until a human acts | Deterministic evidence can take a listing down for review. That is the only automated enforcement, and it is reversible. |

## 2. Gate audit — 20 gates between signup and a public listing

"Human" = needs a staff/owner decision.

| # | Gate | Human | Disposition with the flag ON |
|---|---|---|---|
| G1 | account sign-in | no | keep |
| G2 | store identity fields on the application | no | keep |
| G3 | identity + payout documents required to apply | no | **moved to the payout gate** |
| G4 | seller agreement acceptance | no | keep |
| G5 | store-story contact/payment screening | no | keep (and the whole profile now runs the listing content rules) |
| G6 | application approval | **yes** | **removed** — the store is opened by the gate |
| G7 | `vendor` role membership (created only by G6) | no | granted at onboarding |
| G8 | approved store row (created only by G6) | no | created at onboarding |
| G9 | explicit "submit" | no | keep — it becomes "Publish" |
| G10 | hard block on off-platform payment steering | no | keep — policy `reject` |
| G11 | listing limit by derived trust tier (TS) | no | **replaced** by probation caps for new sellers |
| G12 | listing cap by plan tier (DB trigger) | no | keep — a commercial allowance, now reported as a reason code instead of a 500 |
| G13 | quality score < 68 → manual review | routes to human | **removed** as a queue; missing essentials → `reject` with guidance |
| G14 | risk score ≥ 35 → manual review | routes to human | **removed** as a blanket threshold; individual signals decide |
| G15 | identity-unverified seller → every listing reviewed | routes to human | **removed** (identity lives at payout) |
| G16 | high-risk category needs a higher trust tier | routes to human | **replaced** by a probation rule (`hold`) |
| G17 | V3-25 moderation (dormant behind `MODERATION_ENFORCED`) | no | always part of the gate |
| G18 | product approval queue | **yes** | **removed** for `publish` verdicts; remains the exception queue for `hold` |
| G19 | re-review on every edit | **yes** | **removed** — edits are re-evaluated at write time |
| G20 | 60–120 s catalogue cache lag | no | fixed — the cache tag is refreshed on publish, hide and staff decision |

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
- Risk is V3-40. The gate **reads** a staff-applied hold/freeze through V3-40's own predicate
  (`isSensitiveActionGated`); it never writes to V3-40. V3-40's rule — the system may only flag —
  is untouched: a take-down is the marketplace's own reversible measure, recorded in its own ledger.
- Human decisions stay on the existing paths: the marketplace admin decision and the hub owner
  action's writer (`applyProductReview`). Restoring a taken-down listing is the existing "approve";
  upholding it is the existing "reject". The owner page calls that same writer. No new action system.

### 3.2 Verdicts

Outcome is one of `publish`, `hold`, `reject`. Every verdict carries stable reason codes
(`publish-gate/reasons.ts`; the typed copy and the tests are checked against it).

| Class | Reason codes |
|---|---|
| reject (seller can fix, or prohibited) | `prohibited_goods`, `counterfeit_claim`, `hate_speech`, `known_bad_image`, `contact_details`, `off_platform_payment`, `incomplete_listing`, `price_invalid`, `image_not_first_party`, `plan_listing_limit`, `probation_listing_cap`, `probation_daily_cap`, `probation_price_cap`, `seller_not_active`, `listing_conflict` |
| hold (a person decides) | `restricted_item_review`, `profanity`, `contact_suspected`, `scam_language`, `duplicate_image_other_seller`, `high_risk_category_probation`, `risk_hold_active`, `enforcement_hold_active`, `ai_flagged_scam`, `ai_flagged_nsfw`, `ai_flagged_abuse`, `ai_flagged_other`, `gate_unavailable` |
| signal (recorded, never blocks) | `shared_image`, `duplicate_image_same_seller`, `urgency_language`, `pickup_address`, `thin_listing` |

Composition rule: any reject-class code ⇒ `reject`; else any hold-class code ⇒ `hold`; else
`publish`. The AI step runs only when the deterministic outcome is `publish` and can only add
hold-class codes. It is structurally unable to turn a `reject` or `hold` into a `publish`.

### 3.3 DB layer (held migration)

New tables — RLS on, no policies, no grants to `anon`/`authenticated`; `service_role` may read,
and writes happen only inside `SECURITY DEFINER` functions executable by `service_role` alone:

- `marketplace_listing_gate_verdicts` — append-only ledger (listing and seller verdicts).
- `marketplace_seller_probation` — one row per instantly-onboarded store.
- `marketplace_listing_enforcement` — reversible take-downs (`active` → `lifted` | `upheld`).
- `marketplace_image_fingerprints` — SHA-256 + a perceptual hash per first-party image.

Guard on `marketplace_products` (BEFORE INSERT OR UPDATE, every role):

1. Row not `approved` after the write ⇒ allowed (nothing is live).
2. Already live and the content hash is unchanged ⇒ allowed (stock, rating, badge).
3. Otherwise the row is becoming live, or live content is changing. Allowed only if one holds:
   - **engine verdict** — an unconsumed, unexpired `publish` verdict for this slug, vendor and
     exact content hash (the hash is computed in SQL, by the same function, on both sides);
   - **staff decision** — a status-only change by a trusted role where `reviewed_by` is marketplace
     staff and `reviewed_at` is newly set (the existing human paths, unchanged);
   - **company catalogue** — company-owned inventory written by a trusted role (the catalogue seed).
4. Probation caps are re-checked at the moment of going live, under a per-vendor lock.

An AFTER trigger consumes the verdict (or records the staff / catalogue verdict), so **every live
listing has a recorded verdict**. A companion guard on `marketplace_product_media` only accepts
images covered by the listing's standing verdict while it is live. The gallery is also part of the
content: the row carries a digest of its ordered image list inside the hashed `filter_data`, so an
image-only edit is a content change that needs — and consumes — a verdict of its own.

**Who is staff.** The guard uses the same rule the app does (`packages/config/membership-grant.ts`):
a row bound to a user grants only to that user; an unclaimed seed (no `user_id`) grants only to a
user whose email is verified and equal to the row's; an inactive row never grants. Staff rows are
commonly unclaimed seeds — recognising only bound rows would have refused the existing approval
path the day the migration was applied.

**Clocks.** Every comparison uses a true instant (`now()` / `clock_timestamp()`), never a UTC
wall-clock value: the staff branch compares a caller-supplied `reviewed_at` with the database
clock, and a wall-clock comparison is only right when the session TimeZone happens to be UTC. The
proofs run in `Pacific/Kiritimati` on purpose.

The verdict RPC re-checks, in SQL: the actor is a member of the vendor (or staff), the slug is not
another vendor's, the store is active, no staff-only take-down is open, and the probation caps. It
can tighten a TS verdict; it can never loosen one.

### 3.4 Probation **(assumption)**

Applies to stores opened by instant onboarding. Ends when identity is verified **and** 3 orders
are delivered **and** 14 days have passed.

| Cap | Value |
|---|---|
| live listings | 10 |
| new listings per 24 h | 5 |
| price per listing | ₦500,000 |
| high-risk categories | held for review |
| a picture another store had first | held for review |

The values live in one SQL function; TS reads them from the state RPC, and the seller's panel
shows the same numbers the database enforces. The existing plan allowance (G12 — three listings on
the launch plan) still applies on top; it is commercial, not a trust rule.

### 3.5 Identity at the payout gate **(assumption)**

`payoutEligibility` and the trigger on `marketplace_payout_requests` enforce the same rule:

- a store **opened by instant onboarding** cannot request, and finance cannot approve or release,
  a payout until its owner's identity is verified. "Verified" requires a staff-reviewed identity
  document as well as the profile flag — that flag alone is writable by its own user on production;
- a store **a person approved** the old way handed its documents over at application time and is
  not asked again;
- a staff-applied V3-40 hold on the owner's account pauses any store's payout (TS wall, flag ON).

The gate only refuses. No money RPC, and nothing in `payments_private`, is read or written.

### 3.6 Reversible take-down **(assumption)**

The sweep runs from the existing hourly automation cron, flag ON only. Triggers, all
deterministic evidence:

1. **policy** — the content ruleset moved and a listing the *engine* approved now breaks an
   unambiguous rule. A listing a *person* approved is never taken down by the sweep: it is sent
   back to a person (the original approver survives any number of clean re-scans);
2. **reports** — three independent buyers within 14 days. Other sellers and anonymous reports do
   not count, so a competitor cannot pull a rival's listing;
3. **risk** — a staff-applied V3-40 hold/freeze on the listing (mirrored, never created).

A take-down moves the listing to `under_review`, records why, notifies the seller, and blocks
checkout of the item. A `policy` take-down lifts itself when the seller's fix passes the gate. The
others need a staff or owner decision, and are not repeated on evidence a person already judged.
Nothing is ever deleted, no seller is suspended and no payout is frozen by the system.

### 3.7 Optional AI signal (flag-dark)

Gateway surface `marketplace.listing.screen`: platform-invoked, `billable: false`, run with
`noBillingPort`. Spend is reserved before the call against the unified internal ledger under the
key `marketplace_trust`. If that primitive is absent (V3-43 not applied), the budget is spent, the
provider is not configured or fails, or the reply does not parse, the step is skipped and the
deterministic verdict stands. Only a closed vocabulary crosses back; no provider or model name
leaves the server. Unlike its three platform-invoked neighbours, this surface has a registered
prompt builder — without one a surface can never reach the provider.

### 3.8 Image matching — what it does and does not catch

Two fingerprints per first-party picture: SHA-256 of the bytes, and a perceptual hash (each of 64
neighbouring pairs on a 9×8 grid is brighter-left, brighter-right or flat; mirror-invariant).
Tuned for precision, because a match holds an honest seller's listing:

- measured on 2,856 different-picture pairs (photo-like and object-on-white): **0 false matches**;
- catches every byte-identical re-upload, and about three quarters of re-encoded, resized or
  mirrored copies of pictures that have enough structure to hash;
- a picture with too little structure (a small object on a plain background) gets no perceptual
  hash — only the byte hash — because nothing in it can tell two such pictures apart;
- it does not catch a crop, a rotation, an overlay or a redrawn picture.

Consequence by store: on probation a match **holds**; an established store gets a signal only
(usually a shared manufacturer photo). Attaching another store's uploaded object directly — which
the upload flow cannot produce — holds for everyone.

## 4. Flag OFF is the current behaviour

Each wired path is an early branch behind `isInstantPublishEnabled()`; the legacy code below it
runs unchanged. A structural test pins every one of those branches. The edits that are **not**
behind the flag are deliberate and inert:

- three legacy handlers now check the result of a write the database may refuse (payout request,
  payout decision, product decision) so a refused write is no longer followed by "approved" side
  effects — a no-op unless the database refuses;
- the action form shows a server-provided outcome message when one is sent (only the gate sends one).

With the migration applied and the flag OFF, the guard is satisfied by today's flows: sellers only
ever write `draft`/`submitted`/`under_review`, and the human approval paths already stamp
`reviewed_by`/`reviewed_at`.

## 5. Rollout

`ACTIVATION.md` next to this file: preflight, apply, verify, fingerprint backfill, flag, pending
backfill. Rollback is the flag alone.

## 6. Deferred to V3-MKT-TRUST-02

Reporting UX, appeals, the moderation-queue UX, public policy pages and seller scorecards.
