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

**4. Verify.** Run file 3. Every row must say `PASS`. The second result lists who can approve a
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

**The dev demo seed** (`apps/marketplace/scripts/seed-marketplace.mjs`) inserts demo vendor
listings as already approved; against a database with this migration those rows are refused. The
production catalogue bootstrap is unaffected (company inventory is allowed).

**A hand approval needs a staff account.** Approving a listing from the hub or the marketplace
console is refused unless the acting account holds a marketplace staff role. Step 4 lists who does.

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
  resized or mirrored copies, not crops or overlays. Details and measurements: design doc §3.8.
- The report-based take-down needs V3-25's tables. Its public reporting screens, appeals and the
  moderation queue's own interface are V3-MKT-TRUST-02.
- The optional AI screen is not deduplicated: re-publishing the same listing calls it again. The
  daily budget bounds the cost.
