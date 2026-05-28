# V3-18 — Payments: Receipts + Invoices

**Pass ID:** V3-18 | **Phase:** C | **Pillar:** P2
**Deps:** V3-17 | **Effort:** M | **Parallel:** YES | **Owner gate:** none | **Risk:** Money

## Role
V3 Payments engineer (receipts + invoices). Execute, then stop.

## Project
Standard.

## Audit summary
`@henryco/branded-documents` ships invoice, receipt, transaction-history templates. Live endpoints in account at `/api/documents/[type]/[id]`. PRODUCT-GAP-LEDGER 2026-04-09 noted "receipt file publishing is still division-dependent" — divisions don't consistently publish receipts. This pass unifies receipt + invoice generation via the payment-router so every paid payment_intent produces a receipt automatically.

## Mandatory scope

1. **Automatic invoice generation** on `payment_intent.status = succeeded`:
   - Workflow handler `auto-generate-invoice` (via V3-43 workflow engine if shipped; standalone otherwise).
   - Reads payment_intent + buyer profile + seller/division.
   - Generates invoice PDF via `@henryco/branded-documents/invoice`.
   - Stores in Supabase Storage at `invoices/<year>/<month>/<intent-id>.pdf`.
   - Emails to buyer via @henryco/email with signed-URL.
   - Persists in `customer_invoices` table.

2. **Automatic receipt generation** on full payment:
   - Same flow but `receipt` template.
   - Receipt embeds payment_intent_id + provider transaction reference.

3. **Watermark per ANTI-CLONE Principle 5**:
   - Visible: low-opacity `${user_id}.${timestamp}` background.
   - Invisible: PDF metadata with HMAC-signed identity tag.
   - Track each export in `branded_document_exports` (existing).

4. **Branded per division**:
   - Care invoices use care@; Marketplace uses marketplace@; etc.
   - Logo + accent color + footer from `@henryco/config` per division.

5. **Multi-currency support**:
   - Invoice shows amount + currency in formatted local style.
   - Tax line (per V3-21 once shipped; placeholder "Tax computed at checkout" until then).

6. **Retrieval**:
   - `/api/documents/invoice/[intentId]/route.ts` — signed-URL via short-lived JWT (5 min).
   - User can only retrieve their own invoices.

7. **Telemetry** — `henry.invoice.generated`, `henry.invoice.delivered`, `henry.invoice.downloaded`.

## Out of scope
- Receipts for manual-proof flow (preserved existing).
- Refund credit notes (V3-19).
- Subscription invoices (V3-20 — extend pattern).
- B2B statements (V3-74).

## Dependencies
V3-17. Blocks V3-22, V3-75.

## Inheritance
`@henryco/branded-documents`, `@henryco/email`, Supabase Storage.

## Trust / safety / compliance
- L18 refund/dispute policy referenced on receipt.
- Watermark active.
- Signed-URL retrieval (5 min TTL).
- ANTI-CLONE Principle 5 + 12.

## Mobile + desktop parity
PDFs are device-agnostic. Email delivery + signed-URL same.

## i18n
Invoice content localized per buyer locale via @henryco/i18n.

## Validation gates
1. Standard CI.
2. **Generation e2e** — synthetic payment → invoice generated + emailed within 30s.
3. **Retrieval test** — signed-URL works for owner; fails for non-owner.
4. **Watermark check** — visible + invisible per Principle 5.
5. **Branded variants** — per-division invoice templates render correctly.

## Deployment gate
- 48h soak.

## Final report contract
Standard.

## Self-verification
- [ ] Auto-generation workflow live.
- [ ] All 8 divisions branded variants tested.
- [ ] Watermarking enforced.
- [ ] Signed-URL retrieval.
- [ ] 3 new telemetry events.
- [ ] Report written.
