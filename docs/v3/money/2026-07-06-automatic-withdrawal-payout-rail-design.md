# Automatic withdrawal (payout) rail — design (V3-MONEY-PAYOUT)

**Status:** DESIGN, for owner approval. Money-critical. Owner ask: make wallet withdrawal
**automatic** (a request pays out to the user's bank via Flutterwave Transfers), not a manual
"submit request a human settles". Every stage is additive + flag-gated + independently shippable;
NGN-only first (wallets are NGN-only, per the multi-currency ledger design).

**Owner framing (binding):** the withdrawal should be a real live payout, executed automatically,
using Flutterwave (which supports Transfers). Money invariants are absolute; **status is
provider-confirmed truth** — a payout is "paid" only when the transfer webhook confirms it, never
on the API's optimistic response.

---

## 1. The principle — the in-rail, in reverse

Money leaves the platform exactly as it arrived, mirrored:

| Payment IN (built) | Payout OUT (this design) |
|---|---|
| `payment_intents` (pending → succeeded) | `wallet_withdrawals` as the payout intent (requested → processing → paid/failed) |
| provider **charge** (hosted page) | provider **transfer** (Flutterwave Transfers API) |
| `apply_payment_webhook` (charge.completed = truth) | `apply_transfer_webhook` (transfer.completed/failed = truth) |
| `post_charge_settlement`: DR cash / CR clearing | `post_withdrawal_settlement`: DR wallet-liability / CR cash |
| idempotent on `(provider, provider_event_id)` | idempotent on `(provider, transfer_ref)` |

The wallet stays a **projection of the ledger** (the existing invariant): a withdrawal reduces
`customer_wallet_liability` (what we owe the user) and reduces `cash_settlement` (money that left).
`DR customer_wallet_liability / CR cash_settlement` — the exact reverse of a top-up allocation.

## 2. What exists today (grounded)

- **UI + request flow:** `apps/account/app/(account)/wallet/withdrawals/page.tsx`,
  `app/api/wallet/withdrawal/request/route.ts` (+ `/pin`, `/payout-methods`). A withdrawal is
  submitted and — today — settled OUT OF BAND (manual). This is the "submit withdraw" the owner
  wants automated.
- **Table:** `20260406140000_wallet_withdrawals.sql` — a withdrawals table already exists.
- **Ledger + wallet projection:** the double-entry ledger (`post_ledger_entry`,
  `credit_wallet_topup`, `wallet_ledger_reconciliation`) — a withdrawal debit RPC is the missing
  mirror of `credit_wallet_topup`.
- **Provider adapter:** `packages/payment-router/src/providers/flutterwave-provider.ts` does
  `initiate` / `finalize` / `refund` / `getBalance` / `verifyWebhook` for CHARGES. It has **no
  transfer method**, and `verifyWebhook` treats `transfer.*` events as informational (ack, no
  effect) — the exact seam to build on.
- **KYC + PIN:** withdrawal PIN + KYC infra exist (`kyc_verification_infra`), the authz gate to
  reuse (never weaken).

## 3. The money model (the invariant this rail must protect)

A withdrawal must NEVER pay out more than the user's available balance, and must NEVER pay out
twice for one request. The safe construction:

1. **Reserve (atomic hold) at request time.** Before any provider call, atomically move the
   amount from available balance to a pending hold (a single-winner UPDATE with a balance check),
   so a concurrent request or a double-submit cannot double-spend. No ledger post yet — the money
   has not left.
2. **Transfer.** Call Flutterwave Transfers with an idempotency reference = the withdrawal id, to
   the user's resolved bank account. A provider/network failure here leaves the hold in place;
   the request is retry-safe.
3. **Confirm (webhook = truth).** On `transfer.completed`, post the ledger entry
   `DR customer_wallet_liability / CR cash_settlement` in the SAME txn as marking the withdrawal
   `paid`, idempotent on the transfer ref — so a redelivered webhook posts once. The hold becomes
   the real debit; the wallet projection reconciles to the ledger by construction.
4. **Release on failure.** On `transfer.failed`, restore the held amount to available balance and
   mark the withdrawal `failed` (no ledger post — no money left). The user can retry.

Never trust the transfer API's synchronous response as "paid" — only the webhook. (Same discipline
as the charge rail: the API can say "queued" and later fail.)

## 4. Stages (each additive, flag-gated, independently shippable)

**W0 — this design.**

**W1 — Flutterwave Transfers in the adapter (pure, fixture-tested).** Add `transfer()` (create a
transfer: amount, currency, resolved bank account, narration, idempotency ref) and
`handleTransferWebhook()` (verify signature, classify completed/failed, re-verify by ref against
the Transfers verify endpoint — the authoritative confirm, mirroring `readVerifiedCharge`). Add a
`resolveBankAccount()` (Flutterwave account-resolve) so the user's account name is confirmed
before payout. Provider-generic types in `payment-router` (Paystack has Transfers too, so the
capability is provider-neutral). Recorded-fixture tests; NO live call in CI.

**W2 — the payout ledger RPCs (money spine).** In `payments_private` (SECURITY DEFINER,
service-role-only, same GRANT lockdown): `reserve_withdrawal` (atomic single-winner hold with a
balance-sufficiency check), `post_withdrawal_settlement` (DR wallet-liability / CR cash, idempotent
on the transfer ref, hard-capped at the reserved amount), `release_withdrawal` (restore the hold).
PGlite/SQL invariant proofs: a withdrawal reduces the wallet + posts the balanced reverse entry;
`wallet_ledger_reconciliation` stays reconciled; a replayed webhook posts once; a hold can never
drive the balance negative; a release restores exactly.

**W3 — wire the request → auto-payout (behind `WALLET_AUTO_PAYOUT`).** The withdrawal request
route: verify PIN + KYC + limits → `reserve_withdrawal` → `transfer()` → return "processing". The
transfer webhook route → `apply_transfer_webhook` → post + finalize (or release). Flag OFF = the
current manual flow is untouched.

**W4 — retire the manual "submit".** With the auto rail proven, the request IS the payout; the
manual settle step is removed. Copy updated to "on its way" instead of "submitted for review".

**W5 — live test (owner).** Owner enables the flag + does ONE small real payout to their own bank;
we watch it go requested → processing → (webhook) paid, ledger balanced, wallet reconciled. Only
then is auto-payout live.

## 5. Guardrails (non-negotiable)

- **No double-payout:** idempotency ref = withdrawal id on the transfer; webhook post idempotent on
  the transfer ref; the reserve is a single-winner atomic move.
- **No overdraw:** the reserve checks available balance atomically; the settle is hard-capped at the
  reserved amount; the wallet can never go negative.
- **Provider-confirmed truth:** only `transfer.completed` (re-verified) marks paid; the API's
  optimistic response never does.
- **Authz:** the existing withdrawal PIN + KYC gate stays; add per-day count + amount velocity
  limits and a max-single-payout, all server-side.
- **Fraud/abuse:** resolve the bank account (name match) before payout; hold new/changed payout
  methods for a cool-down; log every state change to the audit trail.
- **Failure is safe:** any provider/network error before confirmation leaves the hold; a
  `transfer.failed` releases it; nothing partial is ever posted.

## 6. NGN-only first / multi-currency

Wallets are NGN-only (per the in-currency ledger design), so payouts are NGN-only. The ledger RPCs
are written currency-tagged (consistent with V3-MONEY-MC), but only NGN payouts run until wallets
go multi-currency — a later, separate pass.

## 7. Open questions for the owner (before W1)

1. **Is Flutterwave Transfers enabled** on the live account (Transfers can require activation +
   sufficient float in the settlement balance)? W5 needs it live.
2. The **transfer webhook secret / hash** — same `verif-hash` as charges, or a separate secret?
3. **Limits:** max single payout, daily count/amount cap, and the KYC tier required to withdraw?
4. Confirm **NGN-only first** (assumed).
