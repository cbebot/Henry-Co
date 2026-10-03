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
| Apply → upload identity + payout documents → wait for a human to approve the store | Apply → the store opens immediately, on probation. Identity is asked for at the first payout, not before the first listing — for every store opened after the gate, whoever opened it. |
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
- `marketplace_seller_revocations` — a person's withdrawal of a seller's approval, and its lifting.

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

**Decided twice.** The guard validates the row BEFORE the write; the AFTER trigger decides again on
the row as it was actually written, and refuses anything no engine verdict, staff decision or
catalogue rule covers. A trigger that sorts after the guard (one a future migration adds) can
therefore not rewrite a row between "checked" and "stored". Request roles also lose the TRIGGER and
TRUNCATE privileges on the guarded tables.

**A listing's id never changes.** Take-downs and standing verdicts are keyed on it.

**A person's decision binds the engine.** An open reports or risk take-down, one a person upheld,
and a person's own rejection or request for changes all stand against the listing until a person
approves it. They are matched on the listing id and on store + handle, so deleting the row and
creating it again under the same handle does not shed them; a listing under such a hold keeps its
handle while it stands. A person approving a listing lifts that listing's own holds; a DELETED
listing's hold that was bound to the same handle is released from the handle but kept, so approving
a harmless listing under that handle does not clear the evidence. Listing the same item again under
any handle is held too: the pictures a held listing showed — when the hold was placed, at every
later decision by a person, and every picture deleted, moved or replaced on it since — are kept with
the hold (bytes and perceptual hash), so removing them, deleting the listing or re-saving the picture
does not shed it. A picture the listing was itself approved with, or one that is also on another
live listing of the store (a size chart, a logo), is not counted. The matches are found first and
only they are looked for in the live catalogue (a store with 3,000 live listings and 400 held ones:
under 200 ms). Only a genuine staff decision counts as a decision — a bare status write records
nothing.

**A person's "no" to an account binds the engine too.** A person rejecting, or sending back, an
application of the account — "Revoke approval" included, and whatever the application said before —
is recorded in its own table by a trigger on the decision itself: the seller's re-submission
rewrites the application row and must not undo it. Decisions made before the gate existed are
recorded once, when the table is first created, failing closed: every account whose latest decided
application is not approved now — a rejection, a request for changes, or one the seller has since
re-submitted (a row alone cannot tell that from a re-submission after an approval). While it stands,
the account's listings go to a person (`risk_hold_active`) — a publish verdict minted before it is
not usable after it — and the gate opens no store for it; a person's approval of an application of
the same account lifts it. A store that is not active cannot publish at all (`seller_not_active`). Listings already live stay live, as they always did: a person decides about
them. Approvals open (or re-open) the store first and mark the application approved only once that
landed, so a refused store step changes nothing.

**Stores.** A store's owner never changes and its type never changes by UPDATE: the legacy approval
writes the store with an upsert on its handle, and an application naming another store's handle
would otherwise hand that store — its catalogue and its balance — to the applicant. An owner is set
only when a store is created; the one change allowed is the owner's account being deleted, which
leaves the store with no owner (and no payouts). Both approval paths refuse such a handle up front —
in any letter case — and grant no seller role unless the store write landed. An applicant who
already owns a store keeps that one store: the approval re-opens it as it is (its ratings, counters,
description and badges stay) and never opens a second one. With instant publish on, the handle a
seller types is normalised before it is screened, saved and opened. A listing never moves to another
store, and a seller's listing is never taken into the company's store. The company's exemptions
(catalogue publishing, probation, payout identity) need a company store with **no** owner; a store
of company type that names an owner is that owner's store, and keeps its owner (deleting that
account is refused rather than turning it into the company's store). An applicant who already owns
any store — of whatever type — keeps that one store.

**Pictures.** The media and variant guards lock the listing row while they read it, so a picture or
a variant cannot slip onto a listing whose publish is still in flight in another transaction. A
picture is never moved off a live listing, and a live listing is never left without a picture (the
last-picture check takes the row FOR UPDATE, so two deletes of the last two pictures queue instead
of passing each other).

**References.** Deleting a category, brand or store that a live listing uses would clear the
reference on the listing — a content change with no decision behind it. It is refused, and the
refusal names the cause (`live_listing_reference`): take the listing out of the catalogue or move it
first.

**The screened store profile.** Instant onboarding opens the store from the application row only if
the row still hashes to what was screened. Each field (handle, name, story) is digested on its own,
so text cannot slide from one field into the next without changing the hash.

**Variants.** `marketplace_product_variants` is in front of buyers (options, price, SKU) and no rule
screens it. Until the engine does, the position is default-deny: the engine never publishes a
listing that carries variant rows (the RPC answers `hold`, the guard refuses the engine verdict —
a person can still approve it), and a variant's content cannot be added or changed while its
listing is live. Stock, status and ordering stay free. No seller route writes variants today, so
this binds direct writes and future routes.

### 3.4 Probation **(assumption)**

Applies to every store opened after the gate is installed — by the gate or by a person. Adversarial
round 2 showed why "a person approved it" cannot exempt a store: the review queue never showed the
identity documents, and any string passed as one. A database trigger on the store row enrols it,
whichever path created it. Stores that existed before the gate are untouched. Ends when identity is verified **and** 3 orders are
delivered **and** 14 days have passed.

An application a person has already rejected, or sent back for changes, is never opened by the
gate: submitting it again returns it to a person. The same holds for an account whose approval a
person withdrew. An account that already owns a store is answered as such first: its new application
is closed as approved only when that store is open and its approval stands.

| Cap | Value |
|---|---|
| live listings | 10 |
| new listings per 24 h | 5 |
| price per listing | ₦500,000 |
| high-risk categories | held for review |
| phones, laptops, consoles and fine jewellery from ₦50,000, whatever category they are filed under | held for review |
| a picture another store had first, or one that could not be fingerprinted | held for review |

The values live in one SQL function; TS reads them from the state RPC, and the seller's panel
shows the same numbers the database enforces. The existing plan allowance (G12 — three listings on
the launch plan) still applies on top; it is commercial, not a trust rule.

### 3.5 Identity at the payout gate **(assumption)**

`payoutEligibility` and the trigger on `marketplace_payout_requests` enforce the same rule, and it
**fails closed**: a payout needs an owner whose identity is verified.

- "Verified" requires a staff-reviewed identity document as well as the profile flag — that flag
  alone is writable by its own user on production;
- the exceptions are the company's own store (company type, no owner), and a store that existed
  **before** the gate was installed: the migration records each of those once, as a waiver bound to
  the owner it had then. The waiver stops applying if the store's owner is not that account, and
  nothing can add one. A store whose owner's account was deleted has no owner, so it has no payouts;
- an open request cannot be re-pointed at another store, and a status is read as a person reads it
  ("Requested", " requested" and "requested" are the same request; only plainly closed statuses —
  rejected, frozen, cancelled and the like — are not checked);
- a staff-applied V3-40 hold on the owner's account pauses any store's payout (TS wall, flag ON).

The gate only refuses. No money RPC, and nothing in `payments_private`, is read or written.

### 3.6 Reversible take-down **(assumption)**

The sweep runs from the existing hourly automation cron, flag ON only. Triggers, all
deterministic evidence:

1. **policy** — the content ruleset moved and a listing the *engine* approved now breaks an
   unambiguous rule. A listing a *person* approved is never taken down by the sweep: it is sent
   back to a person (the original approver survives any number of clean re-scans);
2. **reports** — three independent buyers within 14 days. Other sellers, anonymous reports and
   accounts that were less than a week old when they reported do not count, so neither a
   competitor nor a handful of new accounts can pull a listing — not even by waiting a week. The age
   is the account's own (auth), not a profile date its owner can edit; if the reporters cannot be
   checked, nothing is taken down on that pass;
3. **risk** — a staff-applied V3-40 hold/freeze on the listing (mirrored, never created).

A take-down moves the listing to `under_review`, records why, notifies the seller, and blocks
checkout of the item. A `policy` take-down lifts itself when the seller's fix passes the gate. The
others need a staff or owner decision, and are not repeated on evidence a person already judged.
Nothing is ever deleted, no seller is suspended and no payout is frozen by the system.

### 3.7 Optional AI signal (flag-dark)

Gateway surface `marketplace.listing.screen`: platform-invoked, `billable: false`, run with
`noBillingPort`. Spend is reserved before the call against the unified internal ledger under the
key `marketplace_trust`. One store can trigger at most 12 screens in 24 hours, counted on the
verdict ledger before anything is reserved, so no seller can spend the day's budget for everyone.
If that primitive is absent (V3-43 not applied), the budget is spent, the provider is not
configured or fails, or the reply does not parse, the step is skipped and the deterministic verdict
stands. The screen reads every field the deterministic rules read. Only a closed vocabulary crosses back; no provider or model name
leaves the server. Unlike its three platform-invoked neighbours, this surface has a registered
prompt builder — without one a surface can never reach the provider.

### 3.8 Image matching — what it does and does not catch

Two fingerprints per first-party picture: SHA-256 of the bytes, and a perceptual hash (each of 64
neighbouring pairs on a 9×8 grid is brighter-left, brighter-right or flat; mirror-invariant). Before
the grid is read, the picture is put in log tone and the smooth light of the backdrop — side light,
a lamp, a spot, vignetting — is fitted on the frame's edge and removed; each grid cell is the exact
mean of its block. Tuned for precision, because a match holds an honest seller's listing:

- a picture is hashed only when it carries enough information: at least 20 structured cells, and at
  least 10 of them new compared with the cell above (repeating rows — stripes, gradients, a plain
  product outline — do not count);
- measured on about 6,000 different pictures in three independently drawn sets (side-lit product
  shots, backdrops, white scenes, fabric, labels, textures, crops of real photographs): **0 false
  matches** apart from flyers made from one template; adversarial round 3's 500-picture set went
  from 303 false matches to 0;
- catches every byte-identical re-upload, and most re-encoded (JPEG, WebP), resized, stretched,
  mirrored, blurred, brighter or darker copies of pictures that have a perceptual hash;
- most single-product photos on a plain or lit backdrop get **no** perceptual hash — only the byte
  hash — because nothing in them can tell two such pictures apart at this size; re-saved copies of
  those are not matched;
- it does not catch a crop, a rotation, an added border or frame, an upside-down copy, an overlay, a
  redrawn picture, or a brightness or contrast change that clips large areas. A duplicate picture is
  one signal among several, never the only line of defence.

Consequence by store: on probation a match **holds**; an established store gets a signal only
(usually a shared manufacturer photo). Attaching another store's uploaded object directly — which
the upload flow cannot produce — holds for everyone. A picture that could not be fingerprinted at
all holds a probation store's listing.

An edit may keep, unchecked, only the pictures the listing's **standing verdict** covers. Anything
else on the row — for example something a draft save attached while the listing was not live — is
judged as newly posted; and with the flag on a draft can only carry first-party uploads in the
first place. The storage origin and the optional delivery base in front of it
(`MEDIA_PUBLIC_BASE_URL`) both count as first-party.

### 3.9 Content rules — what they catch and what they do not

**Two tiers.** A listing is **refused** only when it carries a way to reach or pay the seller
outside the platform written in a plain, standard form; anything the rules have to *reconstruct*
from a disguise is **held** for a person (a hold costs a person a look; refusing an honest seller is
the expensive error). The tier is enforced in one place (`packages/trust/contact.ts`, the literal-
evidence clamp; `listing-v2.ts`, `paymentCoordinate`) and pinned by tests: a reconstruction is never
refused.

Refused (`contact_details`, `off_platform_payment`):
- an 11-digit Nigerian mobile (070x, 080x, 081x, 090x, 091x; with or without 234 / +234 / 00234),
  in one block or up to four groups with one consistent separator (space, dash or dot) — digits from
  other scripts and full-width or keycap digits count as digits, invisible characters are removed;
- an email `name@domain.tld` (and `name at domain.tld` when the name is handle-like or the text says
  it is an address);
- a link: messaging, social, shortener or checkout hosts with a path, any link with or without its
  scheme on a known top-level domain, and a bare domain written as one (any case for camelCase,
  hyphenated, numbered or `www` names and for the common top-level domains);
- an app handle: "<app>: handle", "<app> @handle", "<app> handle", "handle on <app>", an "@handle"
  that can only be a handle, a Discord tag;
- a ten-digit account number written as one, named as the place to pay (a bank or wallet right
  before or after it, an account word, "send / transfer / pay … to / into"), and USSD transfer
  codes carrying one — never a number behind a product label.

Held (`contact_suspected`, `scam_language`): look-alike letters, spelled, Pidgin or "oh" digits,
"double"/"triple", one digit per word, odd or mixed separators, a number in pieces joined across
anything within 60 characters or placed by words ("starts… ends…"), a number cut across fields, a
mobile inside a longer labelled code, cue-word numbers, a dropped leading zero, foreign numbers, a
lone ten-digit block; emails without a domain or with a bracketed or spelled "at"/"dot"; links on
unknown or look-alike top-level domains, spelled or spaced dots, platform domains, "link in bio",
QR steering; handles after arrows, quotes, brackets or pipes, weak labels and plain words named on an
app; account numbers in loose groups or halves beside a bank, wallet, account or money word; and
the steering phrases ("message me on WhatsApp", "pay me directly", "drop your number"). The phrase
rules are narrowed so ordinary product sentences ("put your phone on the pad", "heat transfer only",
"pay directly at checkout", "part number 90915-10003", "Christmas tree 150 180 210 cm", "double
₦45,000", "blue dial", price ranges) do not fire at all. Labels (part, serial, IMEI, barcode, UPC-A,
ISBN…) are read before cue words, and only real mobile prefixes count, so clock times, dimensions,
watch references and product codes are not read as phone numbers. The listing's URL handle (decoded)
and the store's handle are screened like any other text.

Text beyond a sane size is refused before any rule runs (`listing_too_long`: a title or name over
300 characters, a description or store story over 20,000, any other field over 1,000). Every
pattern is bounded and the detectors are linear: a 100,000-character field is screened in under
200 ms. Corpora hold the rules in place in both directions (`publish-gate/__tests__/corpus.ts`):
the ordinary listing lines of four adversarial rounds must publish (a short, justified list may be
held but never refused), their evasions must not publish, in every field, and the plain forms above
must be refused everywhere while their disguised forms are held.

Known limits, by design of a deterministic floor: a number spelled only in Yoruba, Igbo or Hausa
words, a number written backwards or with an arithmetic hint, one digit at a time with a word between
every digit, a number grouped exactly like a barcode ("0 80312 34567 8"), a number whose middle reads
as a date, an ordinary number placed between the pieces ("08031234 and size 42 and 567"), a lowercase
name before a capitalised everyday top-level domain ("adeshop.Shop", the shape of a missing space),
a two-letter or ordinary-word name before "at gmail", steering in ordinary words ("order through my
page", "message me on Line"), and anything inside a picture. Those are what the optional AI screen and
the report-based take-down are for.

## 4. Flag OFF is the current behaviour

Each wired path is an early branch behind `isInstantPublishEnabled()`; the legacy code below it
runs unchanged. A structural test pins every one of those branches. The edits that are **not**
behind the flag are deliberate and inert:

- three legacy handlers now check the result of a write the database may refuse (payout request,
  payout decision, product decision) so a refused write is no longer followed by "approved" side
  effects — a no-op unless the database refuses;
- the action form shows a server-provided outcome message when one is sent (only the gate sends one);
- the seller-application wizard reads the server's answer before showing its usual confirmation
  (the answer carries nothing new with the flag off);
- the cart page and the finance page show a notice for an `?error=` code only the gate redirects
  with; the vendor payouts page has a fallback sentence for the same codes;
- the hub gains an owner page (Operations → Marketplace trust), its navigation entry and its
  command-palette entry. The page says the ledger is not available until the migration is applied;
- both seller-approval paths (marketplace console and hub): an applicant who already owns a store
  has that store re-opened as it is — the legacy upsert reset its ratings and counters, and could
  open a second store — a handle that matches another store in any letter case is refused with a
  notice (which now also shows on the console's seller-application pages), an application with no
  account behind it is not approved, and the store is opened before the application is marked
  approved (a refused store step leaves everything as it was).

With the migration applied and the flag OFF, the guard is satisfied by today's flows: sellers only
ever write `draft`/`submitted`/`under_review`, and the human approval paths already stamp
`reviewed_by`/`reviewed_at`. What the database itself now refuses, whichever way the flag points:
a change to a live listing's content without a decision behind it, a change of a listing's id or
store, the rename of a listing a person has to decide, a change to the variants of a live listing,
removing the last picture of a live listing, deleting a category, brand or store a live listing uses,
a change of a store's owner or type (other than the owner's account being deleted), and a payout for
any store opened after the gate whose owner's identity is not verified. That last one is deliberate and applies with the flag off too: no path that opens a
store ever reviewed identity documents, so the payout is where identity is checked. Stores that
existed before the gate keep the payout path they had.

## 5. Rollout

`ACTIVATION.md` next to this file: preflight, apply, verify, fingerprint backfill, flag, pending
backfill. Rollback is the flag alone.

## 6. Deferred to V3-MKT-TRUST-02

Reporting UX, appeals, the moderation-queue UX, public policy pages and seller scorecards.
