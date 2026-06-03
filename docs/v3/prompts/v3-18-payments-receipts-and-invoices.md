# V3-18 — Money & Identity Spine: Payments Receipts and Invoices

**Pass ID:** V3-18  ·  **Phase:** C (Money & Identity Spine)  ·  **Pillar:** P2 (Payments & Wallet)
**Dependencies:** V3-17 (payments-ledger-hardening)  ·  **Effort:** M  ·  **Parallel-safe:** Y
**Owner gate:** none  ·  **Risk class:** Money

---

## Role
You are the V3 payments-documents engineer for Henry Onyx. You execute exactly this one pass, then stop and report. This pass makes every confirmed payment produce a branded, legally-correct receipt and invoice automatically — generated from the ledger truth, stored durably, delivered by email, and retrievable behind short-lived signed access. Today receipt publishing is division-dependent and the live document route stamps the **retired** "Henry & Co." brand and a hardcoded address into every PDF. You fix the legal identity at source, unify generation through the payment-router, and give receipts a real table instead of synthesising them from invoices. The line you must not cross: receipt and invoice amounts are read from the ledger/wallet truth (V3-17), never recomputed optimistically, and the issuer legal entity must be **"Henry Onyx Limited"** sourced from `@henryco/config` to satisfy Paystack/CAC compliance.

## Project
| Field | Value |
|---|---|
| Repo | `github.com/cbebot/Henry-Co` |
| Default branch | `main` |
| Working branch | `v3/18-payments-receipts-and-invoices` |
| Deploy | Vercel |
| Backend | Supabase (project ref `rzkbgwuznmdxnnhmjazy`) |
| Package manager | pnpm 9.15.5 · Node 24.x |
| OS context | Windows + bash |

## Audit summary
`@henryco/branded-documents` already ships the document engine: `InvoiceDocument` (`InvoiceProps` with `issuer { name, addressLines, rcNumber, vatNumber, contactEmail, contactPhone }`, `InvoiceLineItem`), `ReceiptDocument` (`ReceiptProps`, `ReceiptLineItem`), `TransactionHistoryDocument`, `renderDocumentToStream`/`renderDocumentToBuffer`, `buildDocumentFilename`, `attachmentDispositionHeader`, and `buildVerificationQr`. The live retrieval route is `apps/account/app/api/documents/[type]/[id]/route.ts`, gated by `requireAccountUser()`, supporting `invoice`/`receipt`/`kyc-summary`/`transaction-history`/`wallet-statement`/`support-thread`. **Three real gaps:** (1) the route hardcodes `"Henry & Co. invoice"`, `issuer.name = \`Henry & Co. — ${division}\``, and a literal `["Plot 14B, Admiralty Way", "Lekki Phase 1, Lagos"]` address with `rcNumber: null` — this is the retired brand and is non-compliant for a Paystack-settling entity; (2) receipts are *synthesised from a paid invoice* (`receiptNo: \`R-${invoice_no}\``) rather than stored — the code itself flags "Future work can split this onto a dedicated receipts table"; (3) generation is pull-only — nothing auto-generates a document when a payment confirms, so per the PRODUCT-GAP-LEDGER (2026-04-09) "receipt file publishing is still division-dependent." `branded_document_exports` already tracks each export. V3-IDENTITY-01 (#188) unified the brand: `COMPANY.group.legalName = "Henry Onyx Limited"`, `COMPANY.group.name = "Henry Onyx"`, each division `name = "Henry Onyx <Division>"`, with `BRAND_EMAILS` and the `henryDomain()`/`henryWebRoot()` helpers in `@henryco/config`. This pass auto-generates receipt+invoice on payment confirmation, persists both, brands them per division from config, and fixes the issuer identity at source.

## Mandatory scope

### S1 — Persisted document tables
Create `apps/hub/supabase/migrations/<ts>_v3_18_payment_documents.sql`.

```sql
create table if not exists public.customer_invoices (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  invoice_no       text not null unique,            -- HO-INV-2026-000123
  division         text not null,
  source_kind      text not null,                   -- 'order_capture','subscription', ...
  source_ref       text not null,                   -- intent/order/posting id
  status           text not null default 'issued' check (status in ('issued','paid','void')),
  subtotal_minor   bigint not null,
  tax_minor        bigint not null default 0,
  discount_minor   bigint not null default 0,
  total_minor      bigint not null,
  currency         text not null,
  line_items       jsonb not null default '[]'::jsonb,
  storage_path     text,                            -- invoices/<yyyy>/<mm>/<invoice_no>.pdf
  issued_at        timestamptz not null default timezone('utc', now()),
  paid_at          timestamptz,
  created_at       timestamptz not null default timezone('utc', now()),
  unique (source_kind, source_ref)                  -- idempotent generation
);

create table if not exists public.customer_receipts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  receipt_no       text not null unique,            -- HO-RCT-2026-000123
  invoice_id       uuid references public.customer_invoices(id),
  division         text not null,
  payment_method   text not null,
  payment_reference text,                           -- provider transaction ref
  posting_id       uuid,                            -- ledger posting that confirmed payment
  subtotal_minor   bigint not null,
  fees_minor       bigint not null default 0,
  tax_minor        bigint not null default 0,
  total_minor      bigint not null,
  currency         text not null,
  line_items       jsonb not null default '[]'::jsonb,
  storage_path     text,                            -- receipts/<yyyy>/<mm>/<receipt_no>.pdf
  paid_at          timestamptz not null,
  created_at       timestamptz not null default timezone('utc', now()),
  unique (posting_id)                               -- one receipt per confirmed posting
);
```
RLS: owner reads own (`user_id = auth.uid()`); finance staff read all (`is_staff_in('finance', null)`); no client write — only the generation handler (service-role) writes. Document numbers are sequential per year via a `bigint` sequence formatted with the `HO-` prefix (Henry Onyx), generated in the handler.

### S2 — Auto-generation on confirmed payment
Generate the receipt (and the invoice, if not already issued) when a payment confirms — i.e. on the ledger posting of `source_kind in ('order_capture','subscription')` recorded by V3-17, or on the Paystack webhook reconciliation (V3-15). Implement handler `auto-generate-payment-documents` (V3-43 workflow engine once shipped; standalone webhook-triggered handler in `apps/account/app/api/payments/documents/route.ts` until then):
1. Read the confirming posting + buyer profile + division + currency from ledger truth (never recompute totals from the cart).
2. Build `InvoiceProps`/`ReceiptProps` with the issuer/customer/line-items (S3).
3. `renderDocumentToBuffer(...)` → upload to Supabase Storage at `invoices/<yyyy>/<mm>/<invoice_no>.pdf` / `receipts/<yyyy>/<mm>/<receipt_no>.pdf` (private bucket).
4. Insert the `customer_invoices`/`customer_receipts` row with `storage_path`.
5. Email the buyer via `@henryco/email` with a short-lived signed link (S5), copy from `@henryco/i18n`.
6. Record the export in `branded_document_exports`.
Generation is idempotent: the `unique (posting_id)` / `unique (source_kind, source_ref)` constraints mean a replayed webhook regenerates nothing.

### S3 — Issuer identity fixed at source (brand + legal)
Replace the hardcoded `"Henry & Co. — <division>"` issuer and literal address in `apps/account/app/api/documents/[type]/[id]/route.ts` (and in the new generation handler) with a single config-sourced builder. Add `buildIssuer(division)` (in `@henryco/config` or `apps/account/lib/branded-documents.ts`) returning:
- `name`: `"Henry Onyx Limited"` for the legal issuer line (`COMPANY.group.legalName`), with the trading label `COMPANY.divisions[division].name` ("Henry Onyx <Division>") shown as the division header.
- `addressLines`, `rcNumber` (CAC RC number), `vatNumber`, `contactEmail` (`BRAND_EMAILS.billing` or per-division), `contactPhone` — all from `@henryco/config`, **zero hardcoded literals**.
The default invoice description `"Henry & Co. invoice"` is replaced with an `@henryco/i18n` key. Acceptance: `grep -rn "Henry & Co" apps/account/app/api/documents` returns nothing; the rendered PDF issuer reads "Henry Onyx Limited" with a real RC number.

### S4 — Watermark and integrity
Per the anti-clone integrity requirement, every generated PDF carries: a visible low-opacity watermark `${user_id}·${issued_at}` and an invisible integrity tag — HMAC-signed identity (`user_id + document_no + secret`) embedded in PDF metadata via the branded-documents render path. Use `buildVerificationQr` to embed a QR that resolves through `henryWebRoot('/verify/<doc-no>')` (no hardcoded domain). Each materialised export is tracked in `branded_document_exports`.

### S5 — Retrieval behind short-lived signed access
Extend `apps/account/app/api/documents/[type]/[id]/route.ts`: for `invoice`/`receipt`, read from the persisted tables (not synthesised), enforce ownership (`user_id = auth.uid()` or finance staff), and return a Supabase Storage signed URL with **5-minute TTL** (or stream the buffer for inline view). A non-owner request returns 403/404. Downloads emit `henry.invoice.downloaded` / a receipt equivalent.

### S6 — Per-division branding + multi-currency
Logo, accent token, and footer come from `COMPANY.divisions[division]` (`accent`/`accentStrong`/`accentText`/`dark`) in `@henryco/config`. Amount + currency render in formatted local style (reuse `formatKobo`/`formatMoney` from `@henryco/branded-documents` + `@henryco/payment-surface/format`), honoring `currency`/`settlement_currency`. The tax line shows the computed tax once V3-21 ships; until then render a config-driven placeholder string via `@henryco/i18n` (e.g. key `payments.tax.computedAtCheckout`), never hardcoded.

### S7 — Telemetry
Emit via `@henryco/observability`: `henry.invoice.generated`, `henry.invoice.delivered`, `henry.invoice.downloaded`, `henry.receipt.generated`, `henry.receipt.delivered`. Audit-log document generation as a money-adjacent event.

## Out of scope
- Tax computation — V3-21 (this pass renders the placeholder/computed line, does not compute tax).
- Refund credit notes — V3-19 (reuses this document engine for credit-note rendering).
- Subscription-cycle invoices — V3-20 (extends the auto-generation pattern, `source_kind = 'subscription'`).
- B2B statements / bulk invoicing — V3-74 / V3-75.
- The ledger postings themselves — V3-17 (this pass reads ledger truth, does not post).
- Provider capture/webhook plumbing — V3-15 (Paystack, shipped) / V3-14 / V3-16.

## Dependencies
Depends on V3-17 (reads confirmed-payment postings and currency truth from the ledger). **Blocks** V3-22 (finance dashboard surfaces document links), V3-75 (bulk invoicing extends the schema), and is reused by V3-19 (credit notes) and V3-20 (subscription invoices).

## Inheritance
Builds on: `@henryco/branded-documents` (`InvoiceDocument`/`ReceiptDocument`/`InvoiceProps`/`ReceiptProps`/`renderDocumentToBuffer`/`buildDocumentFilename`/`buildVerificationQr`), `@henryco/email`, `@henryco/config` (`COMPANY`, `BRAND_EMAILS`, `henryWebRoot`, division accents), Supabase Storage, the existing `branded_document_exports` table, `requireAccountUser()` auth, and the V3-17 ledger truth.

## Implementation requirements

### Files
- `apps/hub/supabase/migrations/<ts>_v3_18_payment_documents.sql` — `customer_invoices` + `customer_receipts` + sequences + RLS (S1).
- `apps/account/app/api/payments/documents/route.ts` — auto-generation handler (S2), until workflow-engine handler exists.
- `apps/account/app/api/documents/[type]/[id]/route.ts` — read from persisted tables + 5-min signed URL + issuer fix (S3, S5).
- `apps/account/lib/branded-documents.ts` (or `@henryco/config`) — `buildIssuer(division)` config-sourced builder (S3).
- i18n keys under `@henryco/i18n` namespace `surface:payments` for invoice/receipt copy, email subject/body, and the tax placeholder.

### Trust / safety / compliance
- Issuer legal entity = **"Henry Onyx Limited"** with a real CAC RC number, sourced from `@henryco/config` — required for Paystack settlement compliance. Zero hardcoded brand/address strings.
- Totals read from ledger/wallet truth (V3-17), never recomputed from client state.
- Idempotent generation via `unique (posting_id)` / `unique (source_kind, source_ref)`; replayed webhooks regenerate nothing.
- Retrieval: ownership-enforced, 5-minute signed-URL TTL, private storage bucket. Watermark + HMAC integrity tag on every PDF.
- Reference the published refund/dispute policy (L18) on the receipt footer via `@henryco/i18n` + `henryWebRoot('/refunds')`.

### Mobile + desktop parity
PDFs are device-agnostic; email delivery and signed-URL retrieval are identical on web mobile and the Expo super-app. The account "Documents" surface that lists invoices/receipts must respect safe-area insets and render the download action as the single primary next step on mobile.

### i18n
Namespace `surface:payments` (`@henryco/i18n`). Invoice/receipt body labels, status strings, email subject + body, the tax placeholder, and error messages are translated per buyer locale across all 12 locales. No hardcoded user-facing string. PDF static labels that are legitimately non-translatable (e.g. `HO-INV-` prefix) go in `exempt.json`.

### Brand & design system
Henry Onyx brand via `@henryco/config`: issuer "Henry Onyx Limited", division header "Henry Onyx <Division>", per-division accent tokens for the document header/footer, `BRAND_EMAILS` for sender + contact. Fraunces is not used inside PDFs (the branded-documents engine has its own embedded font set in `packages/branded-documents/src/fonts`); match that engine's tokens (`packages/branded-documents/src/tokens.ts`), not ad-hoc hex. The verification QR resolves through `henryWebRoot()` — zero hardcoded domains.

## Validation gates
1. **Standard CI** green: `pnpm -w typecheck`, `pnpm -w lint`, `pnpm -w test`, `pnpm -w build`.
2. **Generation e2e**: a synthetic confirmed payment auto-generates invoice + receipt, persists both rows with `storage_path`, and emails the buyer within 30s; a replayed webhook generates nothing new (idempotency).
3. **Retrieval test**: signed URL works for the owner and a finance-staff user; returns 403/404 for a non-owner; URL expires after 5 minutes.
4. **Brand/compliance assertion**: `grep -rn "Henry & Co\|Henry Holdings\|Plot 14B" apps/account apps/hub` returns nothing in document code; rendered issuer reads "Henry Onyx Limited" + RC number; division header reads "Henry Onyx <Division>".
5. **Watermark + integrity check**: visible watermark present; PDF metadata HMAC verifies; QR resolves through `henryWebRoot()`.
6. **Branded variants**: invoice + receipt render correctly for all 9 division accents (care/building/hotel/marketplace/property/logistics/studio/jobs/learn) + hub.
7. **i18n gate**: the hardcoded-text scanner passes; document copy resolves from `surface:payments` in a non-English locale.

## Deployment gate
- All gates green; migration applied; storage buckets + RLS verified private.
- **48h soak**: monitor that every confirmed payment in production yields exactly one invoice + one receipt, email delivery succeeds, and no duplicate documents appear under webhook replay.

## Final report contract
`.codex-temp/v3-18-payments-receipts-and-invoices/report.md` with the standard 9 sections: exec summary · files changed · migration/RLS/env · validation evidence · smoke · live verification · telemetry baseline (the 5 `henry.invoice.*`/`henry.receipt.*` events) · deferred items · pass-closure assertion. Explicitly record the brand/legal-entity correction at source.

## Self-verification
- [ ] `customer_invoices` + `customer_receipts` applied with owner-read + finance-read RLS, idempotency constraints, and `HO-` sequential numbering (S1).
- [ ] Auto-generation handler creates + persists + emails invoice and receipt on confirmed payment, idempotent under webhook replay (S2).
- [ ] Issuer identity fixed at source: "Henry Onyx Limited" + RC number + per-division "Henry Onyx <Division>" header, all from `@henryco/config`; no "Henry & Co." / hardcoded address remains (S3).
- [ ] Watermark + HMAC integrity tag + `henryWebRoot()`-resolved verification QR on every PDF; exports tracked in `branded_document_exports` (S4).
- [ ] Retrieval reads persisted tables, enforces ownership, returns a 5-minute signed URL; non-owner blocked (S5).
- [ ] Per-division accent branding + multi-currency formatting + i18n tax placeholder (S6).
- [ ] All 5 telemetry events emit; document copy + email fully translated via `surface:payments`; hardcoded-text gate green (S7, i18n).
- [ ] 48h soak clean; report written with the brand/legal correction recorded.
