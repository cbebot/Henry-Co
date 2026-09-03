/**
 * V3-OWNER-CONTROL-01 — the status vocabularies, declared once.
 *
 * WHY THIS FILE EXISTS. Round 1 of this pass fixed a queue that read a column
 * (`price_kobo`) which does not exist: PostgREST answered 42703, the fail-soft
 * wrapper caught it, and the queue rendered "unavailable" forever. Round 2 found
 * the same defect one layer up and strictly worse — the queue read status
 * VALUES that nothing writes (`pending`, `flagged` on listings). A wrong column
 * name at least raises an error somebody can see. A wrong status value returns
 * zero rows and renders "No listings are waiting for review", which is a console
 * that lies quietly. `flagged` appeared nowhere in this repository except the
 * three lines of this pass that invented it.
 *
 * So the vocabularies live here, once, each carrying the citation that proves it
 * is real. Two consumers read them — `queues.ts` decides which rows to SHOW and
 * `registry.ts` decides which transitions to ACCEPT — and when those two drift
 * the console offers a button the server refuses, or lists a row no button can
 * act on. `__tests__/owner-control-statuses.test.ts` asserts they agree.
 *
 * THE RULE FOR EDITING THIS FILE: a value belongs in a PENDING set only if some
 * code path in this repository writes it. Not if a TypeScript union permits it,
 * not if an email template renders a label for it — if you cannot cite the
 * writer, it is decoration, and decoration in a filter is an empty queue.
 */

/**
 * Seller applications — `marketplace_vendor_applications.status`.
 *
 * Written: `draft` (default, and `apps/marketplace/app/api/seller-applications/route.ts:236`),
 * `submitted` (same file, `mode === "submit"`), `under_review` (preserved across
 * draft saves at :235), and `approved` / `changes_requested` / `rejected` by the
 * marketplace admin decision at `apps/marketplace/app/api/marketplace/route.ts:1914`.
 *
 * `under_review` was MISSING from this pass's original filter. Marketplace's own
 * canonical pending set has always been these three
 * (`apps/marketplace/lib/marketplace/automation.ts:200`,
 * `apps/marketplace/lib/marketplace/data.ts:1384`), so an application parked in
 * manual review was invisible to the owner — the precise class of gap that
 * caused this pass to be commissioned.
 *
 * `draft` is excluded deliberately: a draft has not been submitted, and
 * approving one would open a store its owner never asked for.
 */
export const SELLER_APPLICATION_PENDING = ["submitted", "under_review", "changes_requested"] as const;

/**
 * Live vendors — `marketplace_vendors.status`.
 *
 * Written: `approved` on approval (`apps/marketplace/app/api/marketplace/route.ts:1940`
 * and this pass's `seller-decision-write.ts`), `suspended` by the guarded
 * `owner_set_vendor_active` RPC. `pending` is the column default and no code
 * writes it.
 *
 * This is a LIFECYCLE set, not a pending-work set — these are the stores the
 * owner may suspend or reinstate, not a backlog awaiting a verdict.
 */
export const VENDOR_LIFECYCLE = ["approved", "suspended"] as const;

/**
 * Listings — `marketplace_products.approval_status`.
 *
 * Declared `draft | submitted | under_review | approved | changes_requested |
 * rejected` (`apps/marketplace/lib/marketplace/types.ts:19-25`). Written:
 * `draft` / `submitted` / `under_review` at
 * `apps/marketplace/app/api/marketplace/route.ts:1800-1805`, and the three
 * verdicts at :2024.
 *
 * `under_review` is the status a listing receives when
 * `assessment.requiresManualReview || moderationHold` — i.e. risk score ≥ 35,
 * quality < 68, or a strict-moderation seller
 * (`apps/marketplace/lib/marketplace/governance.ts:331`). It is therefore the
 * single most important value in this set: the listings an owner most needs to
 * see are exactly the ones the original `["pending", "flagged"]` filter dropped.
 *
 * Matches marketplace's own moderation console
 * (`apps/marketplace/app/moderation/page.tsx:55`) and
 * `apps/marketplace/lib/marketplace/data.ts:1387`.
 */
export const PRODUCT_REVIEW_PENDING = ["submitted", "under_review", "changes_requested"] as const;

/**
 * Identity checks — `customer_verification_submissions.status`.
 *
 * Written: `pending` on submission and `approved` / `rejected` on review
 * (`apps/account/lib/verification.ts:137` and :192). `in_review` is never
 * written by anything and has been dropped.
 */
export const KYC_PENDING = ["pending"] as const;

/**
 * Teaching applications — `learn_teacher_applications.status`.
 *
 * Written: `submitted` (column default, migration
 * `20260403120000_learn_teacher_applications.sql:19`) and `approved` /
 * `rejected` / `changes_requested` by the Learn review workflow
 * (`apps/learn/lib/learn/workflows.ts:1373`). `pending` and `in_review` were
 * carried in the original filter and are written by nothing — `pending` is a
 * value of the neighbouring `payout_model` column, which is how it got in.
 */
export const TEACHER_APPLICATION_PENDING = ["submitted", "changes_requested"] as const;

/**
 * Moderation reports — `platform_moderation_queue.status`.
 *
 * `pending` is the column default; `actioned` / `dismissed` are written by this
 * pass's `moderation-resolve-write.ts`, which is the table's first writer in the
 * repository's history.
 *
 * `open`, `in_review` and `escalated` are retained DELIBERATELY, and they are
 * the one exception to this file's own rule. Rows here do not originate in
 * application code — the table is populated out of band — so unlike the sets
 * above there is no writer to cite for any value, including `pending`. Reading a
 * wider set costs nothing (a status the table never holds simply matches no
 * rows) while reading a narrower one would strand reports the owner can see
 * nowhere else. Erring wide is right here and wrong everywhere above, because
 * here breadth cannot mask an empty queue — there is no narrower truth to miss.
 */
export const MODERATION_PENDING = ["pending", "open", "in_review", "escalated"] as const;

/**
 * Unresolved buyer–seller disputes — `marketplace_disputes.status`.
 *
 * Declared `open | investigating | resolved | rejected`
 * (`apps/marketplace/lib/marketplace/types.ts:73`). Written: `open` on creation
 * (`apps/marketplace/app/api/marketplace/route.ts:1603` and :2241) and any of
 * the four by the staff `dispute_update` handler at :2323, whose form offers
 * `investigating` (`apps/marketplace/components/marketplace/staff-resource-page.tsx:420`)
 * and `resolved`.
 *
 * This pass's first draft counted `["open", "in_progress", "pending"]` — one
 * real value and two invented ones — so every dispute a staffer had moved to
 * `investigating` was missing from the owner's count. Marketplace itself tests
 * exactly this pair in six independent places (route.ts:232, :829, :1709,
 * :2164, :2568, trust.ts:337), which is as close to a canonical definition as
 * this table has.
 *
 * The console does not ACT on disputes — resolution moves money and stays in
 * the guarded marketplace path — so this set exists purely to count honestly.
 * Undercounting here is the worse failure: it tells the owner there is nothing
 * to chase.
 */
export const DISPUTE_OPEN = ["open", "investigating"] as const;
