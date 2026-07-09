# Money-email coverage matrix

**Standing rule (owner, 2026-07-09):** every customer-facing money transition
sends the customer an email. This matrix is the canonical record — verified by
a 5-reader forensic audit tracing each transition to its dispatch site. **Any
PR that adds or changes a money transition updates this file in the same PR.**

Email hooks follow one discipline everywhere: they run **after** the money
commit (guarded RPC / CAS), best-effort (`try/catch` — an email failure never
surfaces into the money path), gated on `email_transactional !== false`, and
localized via the recipient's stored language.

## Verified coverage (transition → dispatch site)

| Transition | Trigger commits at | Email |
|---|---|---|
| **Wallet deposit credited** | `apps/account/lib/wallet-topup-port.ts` reconciler (after `credit_wallet_topup` RPC) | `walletFundedEmail` ✅ (EMAIL-TPL-02 — was silent: the template existed but nothing ever fired `wallet.funded`) |
| **Wallet withdrawal requested** | `apps/account/app/api/wallet/withdrawal/request/route.ts` (both insert paths) | `withdrawalRequestedEmail` ✅ (EMAIL-TPL-01) |
| **Refund processed (any division's card rail)** | `apps/account/app/api/payments/webhooks/[provider]/route.ts` after `apply_refund_webhook` applies | `refundProcessedEmail` ✅ (EMAIL-TPL-02 — was silent) |
| Marketplace order placed | `apps/marketplace/app/api/marketplace/route.ts:1039` | `order_placed` ✅ |
| Marketplace bank-transfer pending | `route.ts:1063` | `payment_reminder` ✅ |
| Marketplace payment verified | `route.ts:2114` | `payment_verified` ✅ |
| Marketplace dispute opened/updated/resolved | `route.ts:2285/2391` | `dispute_*` ✅ |
| Marketplace payout requested/approved/rejected | `route.ts:2502/2895` | `payout_*` ✅ (vendor) |
| Care payment request created | `apps/care/lib/payments/verification.ts:404` | `payment_request` ✅ |
| Care receipt submitted | `verification.ts:654` | `payment_receipt_received` ✅ |
| Care payment approved | `verification.ts:889` (after `care_record_manual_payment` RPC) | `payment_received` ✅ |
| Care proof rejected / needs revision | `verification.ts:1023` | `payment_proof_update` ✅ |
| Care payment reminders (1/3/7d) | `care-automation.ts:550` cron, deduped | `payment_reminder` ✅ |
| Studio deposit paid | `apps/studio/lib/studio/workflows.ts:742` | `deposit_received` + `project_started` ✅ |
| **Studio milestone/balance paid** | `workflows.ts` non-deposit paid branch | `payment_received` ✅ (EMAIL-TPL-02 — was silent) |
| **Studio card-rail settle** | `card-rail.ts` after CAS to `paid` | `payment_received` ✅ (EMAIL-TPL-02 — was silent) |
| Learn enrollment confirmed | `apps/learn/lib/learn/workflows.ts:445` | `enrollment_confirmed` ✅ |
| Learn payment confirmed | `workflows.ts:1562` + sponsored path `:456` | `payment_confirmed` ✅ |
| Learn certificate issued | `workflows.ts:634` | `certificate_earned` ✅ |
| Logistics booking + invoice opened | `notify-customer.ts` (branded as of EMAIL-TPL-01) | `booking_created` / `quote_created` ✅ |

## Ready-but-unwired templates (the trigger does not exist yet)

These are NOT gaps — the state machine they announce is not built. Wiring them
now would email customers about transitions that never happen. When the flow
lands, the email is one function call.

| Template | Waits for |
|---|---|
| `withdrawalPaidEmail` (account) | The automatic payout rail (W3, `2026-07-06-automatic-withdrawal-payout-rail-design.md`) — settlement is manual finance review today, no status-flip site exists. |
| `payment_instructions` (marketplace) | A pay-later bank flow. Today proof is collected AT checkout, and buyers already receive `order_placed` + `payment_reminder`; an "instructions ready" email would tell someone who already paid to go pay. |
| `refund_approved` / `refund_rejected` (marketplace) | A standalone refund state machine. Refund decisions ride dispute resolution today, and `dispute_resolved` DOES email the customer. |
| `subscriptionChangeEmail` (account) | A subscription charge/renewal path — none exists in code today. |
| `paymentConfirmationEmail` (account, generic) | Superseded per-division: every live division sends its own specific payment email (see table above). |

## Explicit non-emails (deliberate)

- **Studio wallet checkout debit** (`processing` state): the client is emailed
  at the *paid* transition (finance confirm / card settle), not at charge time
  — one payment, one receipt.
- **Logistics delivery POD**: operational tracking event, visible on the
  tracking page; no money moves.
- **Property `/pay`**: route stub returns `notFound()` — no live payment data
  model. When the rent-payment model lands, its confirm transition MUST add an
  email and a row here.
- **Logistics payment verification**: no verify path exists in logistics code
  (invoices ride the account rail). If one is added, it MUST email and be
  recorded here.
