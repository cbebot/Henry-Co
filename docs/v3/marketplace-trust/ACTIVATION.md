# V3-MKT-TRUST-01 — activation

Nothing in this pass is live until two things happen, in this order: the migration is applied, and
`MARKETPLACE_INSTANT_PUBLISH=1` is set on the marketplace app. Until both are true, sellers see
exactly what they see today.

The three SQL files below are also in your Downloads folder under the same names.

| Downloads file | What it is |
|---|---|
| `V3-MKT-TRUST-01-1-DAY-OF-preflight-READ-ONLY.sql` | checks production has everything the gate assumes — changes nothing |
| `V3-MKT-TRUST-01-2-APPLY-instant-publish-gate.sql` | the migration |
| `V3-MKT-TRUST-01-3-AFTER-APPLY-verify-READ-ONLY.sql` | proves the gate is installed and locked — changes nothing |

## The order

**0. Merge and deploy** the marketplace and hub apps with the flag unset. The new code is inert
with the flag off, with or without the migration.

**1. Preflight.** Run file 1 in the Supabase SQL editor. Every row that starts with `REQUIRED`
must say `present`. If one says `MISSING`, stop. Rows that start with `optional` may say `absent`;
each says what stays switched off (see "Optional dependencies").

**2. Apply.** Run file 2 in the SQL editor, once, as a whole. It is idempotent: running it twice
is safe. It needs no other pending migration.

**3. Reload the API schema.** Run `notify pgrst, 'reload schema';` and wait ten seconds. Until the
API has reloaded, the app cannot see the new functions and will quietly keep using the old review
path — safe, but not what you want to test.

**4. Verify.** Run file 3. Every row must say `PASS` (it also checks that every existing store is
either recorded as pre-gate or on the new-store register). The second result lists who can approve a
listing by hand from now on — **confirm your own account is in it**. If it is not, give the
account the `marketplace_owner` role (Staff → Roles) before going further.

**5. Smoke test with the flag still off.** In the existing moderation console, approve one pending
listing. It should go live exactly as before. This proves the guard accepts your staff approvals
on production before any seller-facing behaviour changes.

**6. Record the existing pictures.** From `apps/marketplace`:

```
pnpm gate:backfill -- --actor <your user id> --only fingerprints            # dry run: prints counts
pnpm gate:backfill -- --actor <your user id> --only fingerprints --apply
```

This must happen **before** the flag is switched on. "Who had this picture first" is decided by
registration order, so the catalogue you already have needs to be on record before anyone can
upload a copy of it. The first line it prints says whether the perceptual image hash is available
in that environment; if it says it is not, only byte-identical copies will be recognised.

**7. Switch it on.** Set `MARKETPLACE_INSTANT_PUBLISH=1` on the marketplace Vercel project and
redeploy.

**8. Re-run the listings that are waiting.**

```
pnpm gate:backfill -- --actor <your user id> --only pending                 # dry run: what would happen
pnpm gate:backfill -- --actor <your user id> --only pending --apply
```

Clean listings go live. Listings the gate holds stay in the queue with their reasons. Listings the
gate would refuse are left exactly as they are, for a person. Nothing is deleted or rejected by
the script.

## Rolling back

Unset `MARKETPLACE_INSTANT_PUBLISH` and redeploy. Sellers are back on the review queue.

What stays, deliberately:

- the database guard. It is satisfied by the old flows and costs them nothing; it is what makes
  "no listing is live without a recorded decision" true whichever way the flag points;
- stores that were opened instantly. They remain open, remain on probation, and still need a
  verified identity before a payout — the database enforces that with the flag off too.

## Environment

| Variable | Where | Effect |
|---|---|---|
| `MARKETPLACE_INSTANT_PUBLISH` | marketplace | `1` switches the whole pass on. Anything else is off. Server-only; read per request. |
| `MARKETPLACE_INSTANT_PUBLISH_AI` | marketplace | `1` adds the optional AI screen. Also needs the AI gateway switch and V3-43 applied. |
| `MARKETPLACE_TRUST_AI_DAILY_BUDGET_KOBO` | marketplace | daily ceiling for that screen. Default 100,000 (₦1,000). |
| `MARKETPLACE_KNOWN_BAD_IMAGE_HASHES` | marketplace | optional comma-separated list of banned image hashes (sha256). |
| `MEDIA_PUBLIC_BASE_URL` | marketplace | already supported: if pictures are served through a delivery base in front of storage, the gate treats that base as first-party too. |
| `CRON_SECRET` | marketplace | already set; the hourly automation cron now also runs the take-down sweep when the flag is on. |

## Optional dependencies

None of these is needed to switch instant publish on. Each one, when present, adds a capability.

| If this is applied | You also get |
|---|---|
| V3-25 moderation tables (`moderation_reports`) | a listing three independent buyers report is taken down for review |
| V3-40 risk tables + `predictive_shadow` flag | a staff risk hold on an account holds its new listings and pauses its payouts; a staff hold on a listing takes it down |
| V3-43 workflow rail (`internal_ai_spend_add`) | the optional AI screen can run (it reserves its budget there first) |

## Things that behave differently once the migration is applied

**Editing a live listing by hand in SQL.** The guard refuses a change to a live listing's content
that has no decision behind it — including one typed into the SQL editor. To change a live listing
by hand (for example the manual free-delivery override), take it out of the catalogue, change it,
and approve it again as yourself:

```sql
begin;
update public.marketplace_products set approval_status = 'under_review' where slug = '<slug>';
update public.marketplace_products
   set filter_data = filter_data || '{"free_delivery": true}'::jsonb
 where slug = '<slug>';
update public.marketplace_products
   set approval_status = 'approved', reviewed_by = '<your user id>', reviewed_at = now()
 where slug = '<slug>';
commit;
```

Stock, rating, review count, the featured flag and the paid "Henry Onyx Verified" badge are not
content and can be changed freely.

**Variants of a live listing.** A variant's options, price and SKU cannot be added or changed
while its listing is live, and the gate never publishes a listing that carries variants by itself
— a person approves it. To change variants by hand, use the same three steps as above (take it out
of the catalogue, change, approve). Stock and status of a variant can be changed freely.

**Deleting a category, a brand or a store that a live listing points at.** Those deletes clear the
reference on the listing, which is a content change with no decision behind it, so the database
refuses the delete, and its message says so (`live_listing_reference`). Take the listings out of
the catalogue first (or move them), then delete.

**A listing's id and store cannot be changed.**

**Every store opened from now on needs a verified identity before its first payout** — whether the
gate opened it or a person approved it, and with the flag off too. Nobody reviews identity
documents when a store opens (the review queue does not show them), so the payout is where identity
is checked. Stores that already exist when you apply the migration keep the payout path they have:
the migration records each of them once, against its current owner. The seller verifies identity
from their account (Verification); staff review it as they do today.

**A store's owner and type are fixed.** An owner is set only when a store is created. Deleting the
owner's account leaves the store with no owner — and then no payouts. An application that names the
handle of another store, in any letter case, is refused when you approve it, with a notice saying
so. The company's own store (company type, no owner) is never handed to an account; a store of
company type that names an owner is treated as that owner's store (probation, identity at payout).

**Approving an application from an account that already has a store** re-opens that store as it is:
its ratings, counters, description and badges stay, and no second store is opened. (Before the
migration's code, the approval rewrote the store and reset those numbers.) This applies with the
flag off too.

**A "no" to a seller is recorded.** Rejecting, or sending back, any application of an account —
"Revoke approval" included — is recorded by the database. At apply it also records, failing closed,
every account whose latest decided application is not approved (turned down, sent back, or
re-submitted since a decision — the preflight counts them; approving the pending ones first avoids
it). With the flag on, such an account's listings come to you for review instead of publishing, and
the gate opens no store for it, until you approve an application of that account again. Listings already live stay live — take them out of
the catalogue if you need to. These decisions are recorded only when the deciding account holds a
marketplace staff role (step 4 lists who does) — the hub owner included.

**A listing a person rejected stays a person's decision.** With the flag on, a seller pressing
Publish again on a listing you rejected (or sent back for changes) is held for you, not published.
The same goes for a listing taken down on buyer reports: its pictures are kept with the hold, so the
same item listed again — under another handle, with the same picture or a re-saved copy of it — is
held for you too. Such a listing keeps its handle until you decide.

**The dev demo seed** (`apps/marketplace/scripts/seed-marketplace.mjs`) inserts demo vendor
listings as already approved; against a database with this migration those rows are refused. The
production catalogue bootstrap is unaffected (company inventory is allowed).

**A hand approval needs a staff account.** Approving a listing from the hub or the marketplace
console is refused unless the acting account holds a marketplace staff role. Step 4 lists who does.
(The approval also carries the time it was made; if an account on that list is still refused, the
application server's clock is more than a few minutes away from the database's.)

**A live listing always keeps at least one picture.** Removing the last picture of a live listing
by hand is refused; take the listing out of the catalogue first.

**The plan allowance still applies.** A store on the launch plan can hold three listings. That is
the existing commercial limit; the new-store limits sit on top of it.

## Row for the cross-program activation runbook

The runbook (`docs/v3/ACTIVATION-RUNBOOK-2026-09-24.md`, PRs #538/#539) is not on `main` yet. When
it lands, append:

| # | File | Class | Depends on | Notes |
|---|---|---|---|---|
| 81 | `apps/marketplace/supabase/migrations/20261002120000_v3_mkt_trust_01_instant_publish.sql` | NPC, idempotent, no inner BEGIN/COMMIT | `20260501020000_marketplace_seller_tiers.sql` (on prod), `sec_harden_02` membership lockdown (on prod) | Run preflight first. After it: `notify pgrst, 'reload schema'`, then the verify file. Apply **before** setting `MARKETPLACE_INSTANT_PUBLISH`; run the fingerprint backfill between the two. Independent of #80. |

## Known limits

- Image matching is tuned to avoid false matches; it recognises identical files and most re-encoded,
  resized or mirrored copies of pictures detailed enough to hash, not crops or overlays. Most plain
  single-product photos are matched only when the file is identical. Details: design doc §3.8.
- The perceptual hash changed during this pass. Run the fingerprint backfill (step 6) with this build;
  any perceptual entries in `MARKETPLACE_KNOWN_BAD_IMAGE_HASHES` must be computed with it too (SHA-256
  entries are unaffected).
- The report-based take-down needs V3-25's tables. Its public reporting screens, appeals and the
  moderation queue's own interface are V3-MKT-TRUST-02.
- The optional AI screen is not deduplicated: re-publishing the same listing calls it again. One
  store can trigger at most 12 screens a day, and the daily budget bounds the total.
- The content rules are a deterministic floor. A listing is refused only for a concrete datum (a
  number, email, link, app handle or account number); a phrase alone is held for you. They do not
  read a number spelled only in Yoruba, Igbo or Hausa words, a number written backwards, or anything
  inside a picture. Details: design doc §3.9.
