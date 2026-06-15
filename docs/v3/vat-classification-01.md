# V3-VAT-CLASSIFICATION-01 — per-supply VAT classification + NRS e-invoicing

**Status:** built, gates green, committed on `v3/vat-classification-01` (off `origin/main` #295).
**Posture:** ADDITIVE / DORMANT. No live collection or payout flow is touched; the new
engine has no live caller. It is the **W4 prerequisite** (owner/accountant-confirmed VAT
treatment) for the separately-gated, co-piloted marketplace go-live — it does NOT activate
the live rail.

Owner-confirmed regime (2026-06-15): **principal / merchant-of-record, own FIRS TIN**;
**7.5% VAT-inclusive**, carved out of the **full transaction value**; **per-item treatment,
never a single global treatment** (one statutory rate, many treatments).

## What this builds (on top of the live V3-VAT-01 foundation)

V3-VAT-01 (`origin/main` #257) already provides the ONE statutory rate (`@henryco/config`
`TAX.vat`), the inclusive split (`splitVatInclusive`), the ledger output-VAT posting
(`post_sale_revenue`, applied to prod), the net-VAT reconciliation RPC
(`vat_reconciliation`), and the V3-18 structured receipt/invoice with a config-sourced
issuer (Henry Onyx Limited, RC 9594234, TIN 2621481857689). This pass adds the layer above:

1. **Classification source of truth** — `@henryco/config/tax.ts`
   - `VatTreatment = standard | zero_rated | exempt | out_of_scope`; `VatClassification`
     (`treatment` + `reviewStatus` + `signOff` + audit `note`).
   - `TAX_CLASSIFICATION` per-division map (override keys are the EXISTING taxonomy fields).
   - `resolveVatClassification({division, categoryKey?, itemTreatment?, isSeededTestItem?})`
     — precedence **item → seeded-test(→exempt) → category → division**.

2. **Inclusive VAT math** — `@henryco/pricing/vat.ts`
   - `carveInclusiveVat` (vat = total − round(total/(1+rate)); non-standard → 0).
   - `applyInclusiveVat` / `applyInclusiveVatByLine` — append an informational `tax` line,
     **customerTotal UNCHANGED**, idempotent, pure.
   - `buildSaleVatRecognition` (single-treatment) / `buildSaleVatRecognitionByLine` (mixed
     cart) — kobo-exact figures for `post_sale_revenue`; `gross === revenue + outputVat`.
   - `out_of_scope` added to `VatTreatment`.

3. **NRS e-invoice** — receipt/invoice render the structured triad (issuer legal name +
   **VAT No. (TIN)**, VAT-exclusive base, **VAT (7.5%)** with the rate data-driven, total);
   non-standard supplies render a classification note. `splitDocumentMoney` handles BOTH the
   inclusive (base = total − tax) and legacy add-on-top (base = total − fees − tax) regimes.
   5 new copy keys + the `vatId` → "VAT No. (TIN)" relabel across **all 12 locales**.

4. **Monthly net-VAT report** — read-only owner finance panel: Output VAT − Input/fee VAT =
   Net VAT payable, per month, kobo→naira. Zero writes; reuses the already-fetched ledger
   rows; honest "not connected" when `PAYMENTS_DATABASE_URL` is absent.

5. **Per-item flag** — optional `taxTreatment` on marketplace `SeedProduct` + Learn course
   blueprints (TYPE/data only, no persisted column, no bootstrap bump). **No blanket-exempt**:
   the current seeded catalog (the owner's test goods) resolves EXEMPT via the
   `isSeededTestItem` marker path, so future real inventory still rates correctly.

## Owner-confirmed classification (the locked spec + the 3 answers)

| Division | Treatment | Notes |
|---|---|---|
| Marketplace | standard | food/pharma/baby → exempt; books → zero-rated (category overrides, pre-registered) |
| Studio · Jobs · Care | standard | |
| Logistics (courier) | **standard** | NOT transport-exempt (Q3 confirmed) |
| Learn | **standard, PENDING review** | switchable per course (Q1) |
| Property — rent | exempt | residential lease |
| Property — sale / land | out_of_scope | outside VAT |
| Property — fees | standard | service / management / commission |
| Property — commercial / short-let | **standard, PENDING review** | switchable (Q2) |

Pending positions carry `reviewStatus: pending_review` + `signOff: assumed_pending_accountant`
and are switchable **by editing the map only** — no code change, no deploy.

## Guardrails for the live-wiring pass (from the adversarial money review)

The engine is dormant; these MUST be honored when the gated division-sale reconcile wires it:

1. **Mixed carts:** feed the ledger via `buildSaleVatRecognitionByLine` (NOT
   `buildSaleVatRecognition` on the whole gross) so the ledger VAT === the receipt's per-line
   VAT. A test asserts the equality and demonstrates the over-statement trap.
2. **Kobo at the boundary:** division breakdowns are NAIRA; carve the ledger VAT from the
   **kobo** gross. Never feed a naira figure into a `*_minor`/`*_kobo` param (the V3-21 ~100×
   trap). `splitDocumentMoney` trusts its caller's units — pass a kobo breakdown whose
   `customerTotal` reconciles to the ledger gross.
3. **Exempt note:** an exempt supply emits no `tax` line, so thread the resolved `treatment`
   into `buildReceiptProps`/`buildInvoiceProps` (the `taxTreatment` hint) so the document still
   prints the classification note.
4. **Inclusive receipt framing (presentation):** consider a localized "Prices include VAT"
   annotation, since inclusive line items sum to the gross while the labelled subtotal is the
   ex-VAT base (reconciles, but worth making explicit for the accountant).

## Gate evidence

- Unit tests: config 42/42, pricing 29/29, account 62/62 — **133 green**.
- Typecheck (`tsc --noEmit`): account, marketplace, hub, learn — **0 errors**.
- Lint: account, marketplace, hub, learn — **0 errors** (only pre-existing warnings).
- Adversarial money review (5 lenses: kobo · isolation · invariants · classification ·
  NRS+report): **no CRITICAL/HIGH**; frozen flows verified untouched; customerTotal preserved;
  reconciliation invariants proven.
