# Founder Intelligence F3 — Governed Write Actions — Spec

**Date:** 2026-07-10 · **Verdict:** GO-WITH-CHANGES (7 blocking fixes, all folded in below)
**Study:** workflow `wf_12dbc61a-be1` (mapped every owner write-op + gate + reversibility;
designed the framework; adversarially audited the tranche).

## The spine (never compromised)

PROPOSE → VALIDATE + RE-AUTHORIZE → CONFIRMATION PAYLOAD (server true-state) → OWNER
CONFIRM → RE-AUTHORIZE AGAIN → EXECUTE via existing guarded path → AUDIT.

The AI only ever NAMES an action from the closed `FOUNDER_ACTION_CATALOG` and proposes
record-key params + bounded enums. It never fills an amount. It never executes. The
server decides what the owner sees (server-fetched true state) and what runs (existing
guarded route/RPC). The owner confirms twice; money actions add fresh identity re-auth.

## Two endpoints

- **Propose** — a post-processing step INSIDE the F2 chat route
  (`/api/owner/intelligence/chat`). On a `proposeAction`, the server: catalog-lookup
  (unknown → drop), tranche gate, `.strict()` zod param validation, founder-only
  `ownerPermission`, `trueStateReader` server read, then persists a proposal row and
  returns a `proposedAction` ConfirmationPayload. **Reads + one INSERT only** — moves
  no state, touches no money.
- **Confirm** — a new owner-initiated route `/api/owner/intelligence/actions/confirm`.
  requireOwner → load proposal → guards (ownerId==caller, pending, not expired) → **CAS
  claim** (pending→executing single-winner) → re-run ownerPermission → **drift re-read**
  (abort if a money field moved) → execute via `executionBinding` (existing guarded
  path, deterministic idempotency key = f(token)) → flip status=executed + execution_ref
  → audit.

## The 7 folded-in fixes (from the adversarial audit)

1. **Founder-only `ownerPermission`** for moderation/identity/suspension actions
   (kyc, product moderate, staff status) — hard `is_owner()`, NOT the inherited advisory
   `division.moderate` union. An AI is in the loop; the gate must be founder-only.
2. **`moneyAdjacent` + forced `requiresReauth`** on anything that moves or gates a ledger
   entry, independent of tranche. "Reversible" never substitutes for "no cash effect".
3. **Deterministic idempotency key = f(token)** into every underlying RPC, so a crash-
   retry can't double-execute even if F3's CAS state is ambiguous.
4. **Audit actor = the requireOwner SSR (user-scoped) client** so `actor_id` resolves to
   the founder, not `system`; the proposal forward-ledger status/ref write is a
   guaranteed compensating step, and `executing`-stuck rows surface as alerts.
5. **Conservative per-entry `driftKeys`**; on money paths ANY amount/remaining/status/
   recipient-count change aborts to a fresh card. No metadata leniency.
6. **`.strict()` param schemas + a CI test** asserting no money/state entry declares a
   free amount field the AI could fill.
7. **No auto-open card** (owner clicks to view) + **propose-flood cap/dedupe** by
   (key, record-key); proposal TTL (15 min, viewing) decoupled from the reauth window
   (5 min, enforced independently at confirm).

## First tranche (PR — SERVER RAIL): in-hub, reversible, non-money — the proving ground

Executes through paths REACHABLE from the hub today (its own routes/actions), so the
"existing guarded path" invariant is literal, not aspirational:

- `owner.brand.settings.update` — via extracted `applyCompanySettingsWrite` (ONE path shared with the human /api/owner/settings route)
- `owner.staff.status.toggle` — via extracted `applyStaffStatusToggle` (ONE path shared with the human toggle action)

Two shapes (content upsert-merge + a 2-value enum toggle with a real true-state read)
prove the whole rail. `owner.brand.page.upsert` / `owner.brand.division.upsert` join in
F3-next once their write cores are extracted the same way.

All reversible-via-resave or 2-value toggles, full before/after to the audit log, zero
money. This ships the ENTIRE governed rail (envelope, propose, confirm, catalog, proposal
ledger, drift, CAS, audit, all 7 fixes) proven on safe actions.

## IMMEDIATE NEXT — F3-ui (the confirmation card)

The server rail returns `proposedAction` (the ConfirmationPayload). The card that
renders it in the founder launcher — with an explicit Confirm button that POSTs the
token to `/api/owner/intelligence/actions/confirm` (audit fix #7: owner clicks to view,
no auto-open) — is the next slice. It touches the shared IntelligenceLauncher and needs
both-theme visual verification, so it ships separately from this security-critical server PR.

## Deferred to later tranches (documented, not forgotten)

- **F3b cross-app execution binding**: marketplace payout/verify/product/dispute, staff
  KYC, studio/learn status — their write lives in OTHER apps' routes; needs a
  founder-service-auth HTTP binding contract (or an extracted shared server fn).
- **F3c guarded money**: `care.payment.record` via the SEC-HARDEN-05 `care_record_manual_payment`
  RPC (reachable from hub, guarded, balanced double-entry) — the first money action,
  with requiresReauth + drift + deterministic idempotency.
- **Permanently human-only until a guarded path exists**: newsletter send (no 4-eyes),
  `account.payment.refund` (irreversible cash — admit only with reauth+drift once the
  framework is proven), dispute.refund_to_buyer + care.expense.create (caller-authored
  amounts, no true-state anchor), wallet withdrawal (no write path exists).

## Audit model

Reuse `add_audit_log_v2` via `writeAuditLog` (user-scoped client). Two rows:
`founder.action.proposed` (entityId=token) at propose; `founder.<key>` (correlationId=
token, oldValues=trueStateSnapshot, newValues=executionResult) at execute. The
`founder_action_proposals` row (status pending→executing→executed/conflict) is the
authoritative forward-ledger the owner console reads.
