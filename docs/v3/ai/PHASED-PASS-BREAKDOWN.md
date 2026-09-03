# Phased Pass Breakdown — Henry Onyx Intelligence

**Pass:** V3-AI-ENGINE-DESIGN-01 · Design only. Build sequencing for the governed AI engine, on the real money spine (`origin/main @ 67c2a67b`).

> Maps the architecture onto buildable passes against the Phase D register (`docs/v3/PASS-REGISTER.md:129`, V3-26 → V3-33). **Risk M = money-touching.** Gates note the owner decision or external event that must clear first.

Legend — **Risk:** M (money) · N (net-new, non-money) · **Size:** S/M/L/XL · **Gate:** what must be true to start.

---

## Dependency spine

```
   D4 (margin) ──┐
   D3 (answered) ┤
   ledger applied┼──► PASS 1  (gateway + metering + margin + wallet/ledger billing + draft-a-listing)
   (FL2)         │        │
                 │        ├──► PASS 2  (more surfaces + Intelligence chat + personal-task gating + studio refactor)
                 │        ├──► PASS 3  (governance UI + usage & margin analytics)
                 └────────┴──► (the metered path rides the FL2 ledger apply; non-money pieces can land earlier)
```

V3-27 (billing) depends on **V3-26 + V3-17** per the register (`PASS-REGISTER.md:136`). V3-17 (the double-entry ledger) is **built and committed** on main; it applies to prod at **FL2** (the Paystack go-live gate). So the **metered billing path lands with the ledger apply**; the **non-money gateway** (adapter, metering, margin math, model-routing config, FREE surfaces, the studio refactor) can build and run before then.

---

## PASS 1 — Governed gateway + metered wallet/ledger billing + draft-a-listing {#pass-1}

**Pass id (proposed):** V3-AI-ENGINE-01 · maps to **V3-26 + V3-27 + (slice of) V3-30** · **Risk: M** · **Size: XL** · **Gate: D4 ratified; ledger applied (rides FL2). D3 already answered.**

The minimal end-to-end slice that proves the whole engine: one real metered surface, billed correctly, through the full gateway, posting to the real ledger.

### Scope

1. **`@henryco/ai-gateway` package** (new, pure-TS; `.` barrel + server-only `./server`; mirrors `@henryco/payment-router`).
   - `AiProviderAdapter` seam + **Anthropic adapter** with **company-governed `modelTier → Claude model` routing config** (D3); harvest the three studio integrations' hardening (timeout race, billing-error backoff, graceful no-key fallback — `apps/studio/lib/studio/brief-copilot-action.ts:440,646`).
   - `runAiTask()` orchestrator: resolve surface → estimate (provable upper bound) → reserve → dispatch → meter → price → settle → record/emit.
   - Surface registry with `marketplace.listing.draft` (METERED).
   - **Provider + model opacity** enforced: provider/source and real model name redacted from every client path and log.
2. **Margin engine** = additive extension of `@henryco/pricing`: `computeAiUsageBreakdown()`, line codes `ai_compute`/`ai_margin`, `division:"ai"`; **VAT via the existing `applyOutputVat` + `TAX.vat`** (emit the `tax` line — do not add a `vat` code); `minChargeableKobo` floor. Pure; TDD'd under `tsx --test`.
3. **Provider-secret config seam** in `@henryco/config` (server-only `getAiProviderConfig()/isConfigured`, mirroring `integrations.ts` shape but **not** `NEXT_PUBLIC`). Centralizes `ANTHROPIC_API_KEY` (today read ad-hoc in studio) and the company model-routing config.
4. **Money migration** (committed; applies with the ledger at FL2):
   - **`ai_usage_events`** table (BIGINT kobo: usage, cost/margin/vat/total_kobo, surface, rule_version, status) — the immutable per-call record (avoids `pricing_quotes.total`'s int4 ceiling, `shared_pricing_governance.sql:34`).
   - **`customer_wallet_ai_holds`** table (kobo; idempotency-keyed; expiry-aware available-balance).
   - **`payments_private.reserve_wallet_for_ai_usage()`** + **`payments_private.post_ai_usage_charge()`** — atomic, `SECURITY DEFINER`, `search_path` pinned, `revoke … from public, anon, authenticated` + `grant execute … to service_role`; the settle RPC debits the wallet **and** posts the balanced ledger entry via `post_ledger_entry` (`DR customer_wallet_liability / CR platform_revenue / CR vat_output_payable`).
   - New chart rows: `ai_provider_cost` (expense) + `provider_payable` (liability) for COGS recognition.
   - Seed the default AI rate book in `pricing_rule_books` (`division='ai'`, 10% margin per D4, VAT `standard`).
5. **Assist surface:** Register-L "Draft with Henry Onyx Intelligence" panel on marketplace `/vendor/products/new` + `/vendor/products/[id]` (mounts in the local `WorkspaceShell` children; fills the form, never writes the DB). Pre-flight price + redacted receipt. i18n Pattern A; calm-authority voice (`pnpm tone:check`).
6. **CI invariants:** "AI money-RPC grant invariant" (assert `EXECUTE=false` for `public`/`anon`/`authenticated` on both RPCs — mirrors the payments invariant); balanced-breakdown + estimate-≥-actual unit tests; "no provider id / real model name in any client bundle" check; ledger reconciliation green (`wallet_ledger_reconciliation`, `ledger_reconciliation`, `vat_reconciliation`).

### Deps
The real ledger + wallet + VAT engine + `@henryco/pricing`/`config`/`observability`; the marketplace vendor flow. The metered path needs the ledger **applied** (FL2).

### Out of scope (deferred)
Other surfaces; the Intelligence chat surface; governance UI; a secondary provider; the studio refactor (Pass 2).

### Done when
A vendor with wallet balance drafts a listing; the call is metered, priced (cost + 10% + VAT), and atomically debited **with a balanced ledger entry posted**; a wallet-zero vendor is refused **before** any provider call; the receipt names no provider and no model; `ai_usage_events` + `henry.ai.usage.metered` are recorded; CI invariants + ledger reconciliation green; the money-change protocol (balanced, idempotent, guarded) passes.

---

## PASS 2 — Surface expansion + chat surface + gating + studio refactor

**Maps to V3-28, V3-29, V3-30, V3-31, V3-32, V3-33** · **Risk: M** (metered) / N (free) · **Size: L** · **Gate: Pass 1 shipped.**

- **V3-33 personal-task gating** (early): unauth users blocked at the gateway; auth-and-wallet check on every metered call; audit every call. (Pass 1 enforces it for one surface; V3-33 generalizes + tests it as a guarantee.)
- **V3-28 Intelligence chat surface** — governed chat UI labeled "Henry Onyx Intelligence"; declines competing-brand / anti-company prompts; per-context preset. Register-L.
- **Assist surfaces (each a registry entry + thin client):**
  - **V3-29 support-message assist** — **FREE** (company-critical), rate-limited; inline in chat-composer.
  - **V3-31 account-check assist** — **FREE**; respects RLS; never reveals secrets.
  - **V3-30 business-message assist** — **METERED**; business-suite messaging.
  - **V3-32 studio** — domain lookup **FREE**; **client-end** briefs **METERED**. Split surfaces: `studio.brief.staff` (FREE/internal) vs `studio.brief.client` (METERED).
- **Studio refactor onto the gateway** — migrate **all three** inline Anthropic call sites (`brief-copilot-action.ts:791`, `refine-draft-action.ts:105`, `brief-chat-action.ts:126`) onto `@henryco/ai-gateway`, retiring the inline `new Anthropic(...)`. Only the client-end brief becomes billable; the staff copilot stays internal/FREE. This makes provider/model opacity + metering uniform.
- **(Optional) secondary provider** — if the company chooses cross-vendor resilience, register a second adapter via the seam (config only; no surface change).

---

## PASS 3 — Governance UI + usage & margin analytics

**Risk: N** (no new money path; reads + governed writes) · **Size: L** · **Gate: Pass 2 shipped + real usage data.**

- **Governance console (Register-D, owner/staff):** set margin % and FREE/METERED per surface, edit the rate card, **and set the company model-routing config** (which Claude model each tier/surface uses); every change writes `pricing_override_events` + `audit-log`. This is where D4→C (per-surface/tiered margins) is operated without code.
- **User usage dashboard (Register-L):** the user's own spend, per surface, with receipts — transparency, never showing cost/margin/provider/model.
- **Owner analytics (Register-D):** cost vs margin vs VAT by surface/period from `ai_usage_events`; provider-cost trend; cap-hit and refusal rates; VAT remittance from `vat_output_payable` + `vat_reconciliation`.

---

## Summary table

| Pass | Maps to | Risk | Size | Gate | Ships |
|---|---|---|---|---|---|
| **1** | V3-26, V3-27, slice V3-30 | **M** | XL | D4 ratified; ledger applied (FL2) | Gateway, metering, margin engine, guarded wallet+ledger RPCs, marketplace draft-a-listing |
| **2** | V3-28/29/30/31/32/33 | M / N | L | Pass 1 | More surfaces, chat surface, personal-task gating, studio refactor (3 sites), optional secondary provider |
| **3** | (new: governance/analytics) | N | L | Pass 2 + data | Governance UI (margins + model routing), usage + margin + VAT analytics |

---

## Money-change protocol (applies to Pass 1)

Any pass marked **M** follows the existing money discipline before merge:
1. Migration written, **committed**, applied via the byte-faithful linked-DB protocol with the ledger at FL2; recorded in `schema_migrations`.
2. Guarded-RPC grant invariant green in CI (`EXECUTE=false` for `public`/`anon`/`authenticated`; functions in `payments_private`, not PostgREST-exposed).
3. Idempotency proven (replayed `source_event_id` ⇒ no double-charge, no double-post) and atomicity proven (forced mid-RPC failure ⇒ full rollback; the ledger's deferred balance trigger is the backstop).
4. Ledger reconciliation Δ = 0: `ledger_reconciliation()` balanced; `wallet_ledger_reconciliation()` (wallet == `customer_wallet_liability`) holds for every AI debit; per billed call `ai_usage_events.total_kobo == customer_wallet_transactions.amount_kobo` and the journal entry balances. (The FL2 zero-reconciliation discipline, `docs/v3/prompts/v3-15-payments-paystack-activation.md`.)
5. Flag-dark launch + monitored ramp; runaway-cost caps active from the first call; provider + model opacity verified (no provider/model string in any client payload or log).

---

## Acceptance criteria (Definition of Done)

**Pass 1 ships only when ALL hold:**
- [ ] A vendor with balance drafts a listing; metered, priced **per tier** (cost + company % + VAT), debited with a **balanced ledger entry** posted; `ledger_reconciliation` Δ0 and `wallet_ledger_reconciliation` holds.
- [ ] A wallet-zero vendor is refused **before** any provider call.
- [ ] Receipt names **no provider/source and no real model**; CI bundle-scan green.
- [ ] Replayed call ⇒ no double-charge, no double-post (idempotency proof); forced mid-RPC failure ⇒ full rollback (atomicity proof).
- [ ] "AI money-RPC grant invariant" green (`EXECUTE=false` for public/anon/authenticated; functions in `payments_private`).
- [ ] Rate card seeded (`pricing_rule_books`, `division='ai'`) with the ratified D4 numbers; VAT-at-launch decision applied.
- [ ] `pnpm tone:check` + `pnpm i18n:check:strict` + touched-app lint/typecheck green; both themes verified.

(Pass 2/3: each new surface honors the same gateway contract; governance edits write `pricing_override_events` + `audit-log`; analytics reconcile to `ai_usage_events`.)

## Rollout & runbook

- **Flag-dark launch.** Ship behind the AI kill-switch flag (off); enable for internal accounts first.
- **Monitored ramp.** Watch `henry.ai.usage.metered`/`blocked`, provider error rate, reconciliation Δ, and cost-vs-rate-card drift; ramp by cohort.
- **Kill switch.** Flipping the flag halts all dispatch instantly; in-flight holds expire and release — no stranded funds.
- **Rollback.** No ledger edits, ever — a bad charge is corrected by a **reversing entry** + wallet credit (`ai_usage_events.status='refunded'`). A reconciliation Δ > 0 halts the ramp (the FL2 discipline).
- **Provider incident.** Billing/quota errors trigger backoff + temporary model disable; surfaces degrade gracefully (refuse/queue), never charge, never 500.

Full test matrix + failure modes: [ENGINEERING-REFERENCE.md §5–§7](./ENGINEERING-REFERENCE.md#5-failure-mode--edge-case-matrix).
