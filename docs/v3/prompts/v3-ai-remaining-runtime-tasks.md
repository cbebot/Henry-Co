# V3 AI — remaining runtime-gated tasks (delegation prompt)

**Engine:** Claude Opus 4.8, ultracode, max effort. **Why this is a separate session:** every
task here needs something a code-only session lacks — the apps *running*, the real payment
provider in a staging environment, or live DB access to apply + test migrations. Do NOT do any
of this blind. Run, test, and verify each before claiming done.

These four were deliberately left for a runtime-capable session by the prior AI build (which
shipped the gateway, the shared rail, the company-wide draft assists, and the cross-division
trust review — all flag-dark and merged to `main`). Read the templates named in each task;
they are proven and you mirror them.

## Absolute constraints (every task)
- **Money is sacred.** Kobo are integer BIGINT, never float/×100. Post only through the EXISTING
  ledger + `payments_private` RPCs; never reinvent money infra; new guarded RPCs are
  service-role-only (`revoke all from public, anon, authenticated` + `grant execute to
  service_role`; verify with `has_function_privilege`). New tables RLS default-deny, actor from
  `auth.uid()`. **Status is provider-confirmed truth, never optimistic.**
- **Provider/model opacity:** all model calls go through `@henryco/ai-gateway/server`; the
  provider name + real model id never reach a client bundle, a log, or a receipt. `node
  scripts/v3/ai-opacity-scan.mjs` must stay green (add your app to its roots if you touch a new
  app with provider risk — there should be none, since you use the gateway).
- **Flag-dark.** Nothing user-visible turns on without a flag. Reuse `isAiSurfaceEnabled(
  process.env.<FLAG>, process.env)` from `@henryco/ai-gateway` (the master `ai_gateway` switch
  OR the per-surface flag).
- **Both themes, i18n, tone.** Verify every visual change in light AND dark; all user-facing
  strings via `@henryco/i18n` (`translateSurfaceLabel` + the generic surface-copy keys — do not
  hardcode); calm-authority voice. Gates: `pnpm i18n:check:strict`, `pnpm tone:check`.
- **Definition of done = evidence:** `pnpm run typecheck:all`, `lint:all`, `test:workspace`,
  `i18n:check:strict`, `tone:check`, the opacity scan, AND — because these are runtime tasks —
  the app actually run + the flow exercised in staging (one real card payment where money moves).
- **Brand is Henry Onyx.** No "Henry & Co." in any surface.

---

## Task 1 — Persisted, buyer-visible "Henry Onyx Verified" badges (jobs / learn / property)

Today the cross-division verify is advisory (runs on the create-form draft, no entity, no badge).
Make it durable + buyer-visible, mirroring marketplace EXACTLY.

**Template to copy:** `apps/marketplace/supabase/migrations/20260627130000_v3_ai_verify_01_listing_verifications.sql`
+ `apps/marketplace/lib/ai/verify-listing-action.ts` (the persistence call + the IDOR ownership
guard) + the proof harness `.codex-temp/v3-ai-01/proof/prove-verify.mjs`.

Per division (jobs postings, learn courses, property listings):
1. **Migration:** `<entity>_verifications` append-only audit table (RLS deny, select-own, no
   client write) + a `henry_onyx_verified boolean default false` (+ `_at`) column on the entity
   table (NOT a recomputed field) + a `record_<entity>_verification(...)` SECURITY DEFINER writer
   (service-role-only) that records the audit row and sets/clears the badge — **with the IDOR
   ownership guard inside the function** (the actor must own the entity; assert it, raise
   otherwise). This is the unbypassable guard; the marketplace one is the exact shape.
2. **Move/extend the verify mount to the entity's EDIT page** (where a saved id + ownership
   exist), passing the entity id; keep an app-layer ownership check before charging.
3. **Buyer-visible:** surface the `henry_onyx_verified` flag on the public listing/posting/course
   (it's a public trust signal — fine to expose; it is NOT PII).
4. **Prove on a throwaway PGlite DB** (mirror prove-verify.mjs): grant lockdown, badge
   award/revoke, RLS deny + cross-user isolation, AND the IDOR-blocked case (non-owner refused,
   victim badge unchanged, no spoofed audit row). Then APPLY + verify on the live DB.

## Task 2 — Studio refactor: migrate the 3 inline Anthropic calls onto the gateway (V3-12 / #12)

`apps/studio` makes three direct `new Anthropic(...)` calls (grep `@anthropic-ai/sdk` in
`apps/studio`): `lib/studio/brief-copilot-action.ts` (staff brief copilot — has a 6-layer
anti-abuse + a graceful heuristic fallback), `lib/portal/refine-draft-action.ts` (client message
polish — **leaks `modelUsed` to the client today; fixing it closes that opacity hole**), and
`lib/studio/brief-chat-action.ts` (brief coach). Add `@henryco/ai-gateway` + `@henryco/payments-db`
to studio; route each call through `runAiTask` (surfaces `studio.brief.staff` = FREE, and the
client-end `studio.brief.client` = METERED — both already registered). **Preserve the existing
heuristic fallback** (map gateway errors to the current "kept as-is" UX) and the anti-abuse.
RUN studio and confirm the copilot still works before/after. Keep the client-end metered path
flag-gated until studio wallets are confirmed.

## Task 3 — Retire bank transfer in studio + care (wire the live card rail first)

studio + care render the shared `@henryco/payment-surface` `PaymentSurface`, which today is
bank-transfer-with-proof and has **no `cardCta` wired**. So "remove bank transfer" = (a) wire the
live card rail (the same `@henryco/payment-router` + provider the marketplace/account checkout
uses — Flutterwave live) into studio + care by passing `cardCta`, (b) then drop the proof path.
**This moves real money** — do it with the app running and verify one real card payment settles +
the double-entry ledger balances in staging before removing proof. jobs/property/logistics pay
pages are STUBS (no payment) — nothing to remove there. Marketplace is already done (its own
checkout component).

## Task 4 — Workspace consolidation into dashboard modules

Per the recommendation in `docs/v3/payments/CHECKOUT-CONSOLIDATION-MAP.md` and the decision note:
collapse the *internal management* surfaces (studio's 6 overlapping payment pages, per-division
payment/order history, the seller/vendor/instructor workspaces) into ONE division dashboard built
on `@henryco/dashboard-shell` + the dashboard-modules packages — one canonical route per concern.
**Keep standalone** the focused transactional pages a customer is deep-linked to (`pay/[id]`,
checkout, the public submit/book forms), all on the shared `PaymentSurface`. Do it division by
division, each flag-gated where it touches a live page, each verified by running the app + both
themes. This is large — stage it; the branch stays shippable between stages.

---

**Sequence:** Task 1 (safe, additive, highest user value) → Task 2 (studio, contained) → Task 3
(live money, most care) → Task 4 (largest). Commit + push + open a PR per task; report evidence.
Nothing shallow; leave nothing unclean.
