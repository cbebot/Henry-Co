# Task 3 — Card rail for studio + care (flag-dark) — grounded build plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline). Money task —
> the main session builds this by hand; this plan preserves the grounded architecture exactly.

**Goal:** studio + care offer the company's real card checkout beside (never replacing) bank
transfer, flag-dark, settled only by provider-confirmed truth. Owner then runs ONE live card
test; after ledger reconciliation, bank-transfer retirement is a separate owner-gated pass.

**The proven architecture (verified from marketplace, 2026-07-04):**
1. **Start** (`lib/checkout/card-rail.ts` precedent): flag + `isPaymentsDbConfigured` gate →
   durable domain record FIRST → `payment_intents` insert (user_id, amount_minor kobo, division,
   `idempotency_key = randomUUID()` anchor, metadata `{return_to, <domain id>}`) →
   `createPaymentRouter().route({method:'card'...})` → persist `provider_reference` +
   `payment_attempts` row → return opaque `clientAction` (hosted redirect). Provider NEVER named
   client-side. POST-only route (no GET charge starts).
2. **Settlement**: the FROZEN account webhook settles the INTENT (cash→clearing). The division
   reconciles ON THE BUYER'S RETURN via `reconcileDivisionSale` + a `DivisionSaleReconcilePort`
   implementation (see `apps/marketplace/lib/checkout/sale-reconcile-port.ts`): claim the pending
   domain record (pending → settling → verified), allocate revenue through the division-sale RPC
   (`callPaymentRpc`), mint the receipt, mark the domain record paid. NO webhook changes. NO
   client-side status writes.
3. **Surface**: `/pay` page passes `cardCta` into `buildPaymentSurfaceContext` when the flag is
   on (marketplace `pay/[orderNo]/page.tsx` precedent); bank-transfer guide/proof unchanged in
   both modes.

## Studio specifics (grounded)
- Domain record = existing `studio_payments` row (id, project_id, label, `amount integer`,
  currency NGN, status 'requested', method 'bank_transfer') — it exists BEFORE any charge, so
  the never-strand principle holds with NO schema change. The intent's metadata carries
  `{studio_payment_id, return_to}`; the return page finds intents by user + division 'studio' +
  metadata match (few rows; no index needed v1).
- ⚠ VERIFY AT EXECUTION: `studio_payments.amount` units (integer — major naira vs kobo). Read
  how `pay/[paymentId]` + `getPaymentWorkspace` display it (portal used formatKobo; workflows
  set amount = proposal.depositAmount from `estimateStudioPricing` — trace `depositAmount`
  units) and convert to `amount_minor` kobo EXACTLY once.
- Marking paid: reuse the existing studio payment update path (find how proof verification sets
  status 'paid' today — `upsertStudioRecord('studio_payment_upsert', ...)` in workflows/store)
  so notifications/logs stay consistent. Status vocabulary from the table's actual usage.
- Access: the card-start route enforces the SAME access as viewing `pay/[paymentId]`
  (accessKey semantics from `getPaymentWorkspace`) — never more permissive.
- Flags: `STUDIO_CARD_CHECKOUT === "1"` + payments DB configured (`@henryco/payments-db`
  `isPaymentsDbConfigured` — studio already depends on the package for AI billing).
- Files: `apps/studio/lib/studio/card-rail.ts` (start), `apps/studio/lib/studio/card-reconcile-port.ts`
  (port impl), `apps/studio/app/api/studio/pay/card/route.ts` (POST guard),
  `apps/studio/app/pay/[paymentId]/page.tsx` (cardCta + on-load reconcile), pure helpers +
  tsx tests for amount conversion, flag gates, metadata mapping.

## Care specifics
- Same pattern behind `CARE_CARD_CHECKOUT === "1"`. Domain record: whatever
  `apps/care/app/(public)/pay/[trackingCode]/page.tsx` loads today (verify at execution: the
  care payment/booking row + its verified path). Reuse studio's helpers where sharable
  (module-local; no new packages).

## Revenue allocation caution
The marketplace port allocates via marketplace's division-sale RPC with its PricingBreakdown.
At execution, check that RPC's generality for a studio deposit (division 'studio', a simple
one-line breakdown from the payment amount). If the RPC is marketplace-shaped, DO NOT bend it —
mark the studio payment paid + intent settled (money already in clearing via the webhook) and
leave revenue allocation to the existing studio finance flow, documenting the gap in the PR.

## Gates
studio + care typecheck/lint/build; account untouched (webhook frozen — zero diff); root tone +
i18n:strict; tsx tests for every pure helper; PR body carries the owner's staging test script
(flip flag → open pay page → card CTA → hosted checkout → return → verify studio_payments paid +
intent succeeded + ledger DR=CR growth by the charge).
