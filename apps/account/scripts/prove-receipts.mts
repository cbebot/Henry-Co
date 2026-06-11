/**
 * V3-18 proof — generate a receipt/invoice for a SUCCEEDED payment on synthetic
 * (test) data and assert every money + legal + brand invariant, then render real
 * PDFs in ≥2 locales. Lives under apps/account so the @henryco/* workspace packages
 * resolve. Run from the worktree root:
 *
 *   npx tsx apps/account/scripts/prove-receipts.mts
 *
 * Proves on test data (no DB, no prod):
 *   1. Issuer = "Henry Onyx Limited", RC 9594234, registered office omitted while
 *      [OWNER-TO-CONFIRM] (never a placeholder), division label "Henry Onyx <Div>".
 *   2. The receipt references the real payment_intent + posted ledger entry.
 *   3. The VAT line is present iff the PricingBreakdown carries it (no hardcoded rate).
 *   4. total === intent.amount_minor === ledger debit; subtotal + fees + tax = total.
 *   5. A total that does not reconcile to the ledger debit is REJECTED.
 *   6. No processor is named anywhere; no retired "Henry & Co." / hardcoded address.
 *   7. PDFs render in en + fr + ig and are valid (%PDF…).
 *   8. V3-19: the credit note (HO-CRN-) ties to the refund row + the posted refund-
 *      settlement entry, its VAT line is the POSTED reversal, mismatches are
 *      REJECTED, and it renders in ≥2 locales with the same brand/no-processor
 *      guarantees — referencing the original receipt.
 */

import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Test-env polyfill: @react-pdf/font loads fonts via fetch(file://…). This Node
// build's undici fetch doesn't implement the file: scheme (Next's server runtime
// does), so bridge file: reads through fs for the proof harness only.
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;
  if (url?.startsWith("file:")) {
    return new Response(readFileSync(fileURLToPath(url)));
  }
  return realFetch(input, init);
}) as typeof fetch;

import { ReceiptDocument, InvoiceDocument, CreditNoteDocument } from "@henryco/branded-documents";
import { buildDocumentIssuer, TAX } from "@henryco/config";
import { getPaymentDocumentCopy } from "@henryco/i18n";
import { applyOutputVat, type PricingBreakdown } from "@henryco/pricing";
// apps/account is CommonJS, so this .ts module loads via CJS default interop under tsx.
import paymentDocuments from "../lib/payment-documents.ts";
const {
  buildReceiptProps,
  buildInvoiceProps,
  buildCreditNoteProps,
  generateReceiptPdf,
  generateCreditNotePdf,
  splitDocumentMoney,
  renderPaymentDocumentBuffer,
  PaymentDocumentError,
} = paymentDocuments as typeof import("../lib/payment-documents.ts");

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", ".codex-temp", "v3-18-receipts");
mkdirSync(OUT, { recursive: true });

let failures = 0;
function check(label: string, cond: boolean, detail = "") {
  if (cond) {
    console.log(`  ✓ ${label}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

const FORBIDDEN = ["Henry & Co", "Henry Holdings", "Plot 14B", "Paystack", "Flutterwave", "Stripe"];
function assertNoForbidden(label: string, haystack: string) {
  for (const term of FORBIDDEN) {
    check(`${label}: no "${term}"`, !haystack.toLowerCase().includes(term.toLowerCase()));
  }
}

// ── Synthetic confirmed payment (mirrors a succeeded payment_intent + its posting) ──
const INTENT_ID = "aaaaaaaa-0000-0000-0000-000000000001";
const LEDGER_ENTRY_ID = "bbbbbbbb-1111-1111-1111-111111111111";

// Breakdown A: carries VAT (₦465.12 goods + ₦34.88 VAT = ₦500.00 gross).
const breakdownWithVat: PricingBreakdown = {
  currency: "NGN",
  lines: [
    { code: "items_subtotal", label: "Items subtotal", amount: { currency: "NGN", amount: 46512 } },
    { code: "tax", label: "VAT", amount: { currency: "NGN", amount: 3488 }, meta: { rate: 0.075 } },
  ],
  totals: {
    customerTotal: { currency: "NGN", amount: 50000 },
    vendorGross: { currency: "NGN", amount: 46512 },
    platformNet: { currency: "NGN", amount: 0 },
    vendorNet: { currency: "NGN", amount: 46512 },
  },
  meta: { division: "marketplace", ruleBookKey: "proof", ruleVersion: "2026-06-07", computedAt: "2026-06-07T00:00:00.000Z" },
};

// Breakdown B: NO VAT line (₦300.00 gross).
const breakdownNoVat: PricingBreakdown = {
  currency: "NGN",
  lines: [{ code: "items_subtotal", label: "Items subtotal", amount: { currency: "NGN", amount: 30000 } }],
  totals: {
    customerTotal: { currency: "NGN", amount: 30000 },
    vendorGross: { currency: "NGN", amount: 30000 },
    platformNet: { currency: "NGN", amount: 0 },
    vendorNet: { currency: "NGN", amount: 30000 },
  },
  meta: { division: "logistics", ruleBookKey: "proof", ruleVersion: "2026-06-07", computedAt: "2026-06-07T00:00:00.000Z" },
};

const buyer = { name: "Ada Obi", email: "ada@example.com", address: ["12 Riverside Court", "Yaba, Lagos"] };

console.log("\n[1] Issuer is sourced from config (Henry Onyx Limited + RC 9594234 + registered office + TIN)");
{
  const issuer = buildDocumentIssuer("marketplace");
  const address = issuer.addressLines.join(" | ");
  check("issuer.name === 'Henry Onyx Limited'", issuer.name === "Henry Onyx Limited", issuer.name);
  check("issuer.rcNumber === '9594234'", issuer.rcNumber === "9594234", String(issuer.rcNumber));
  check("issuer.vatNumber (TIN) === '2621481857689'", issuer.vatNumber === "2621481857689", String(issuer.vatNumber));
  check("issuer.divisionLabel === 'Henry Onyx Marketplace'", issuer.divisionLabel === "Henry Onyx Marketplace", issuer.divisionLabel ?? "");
  check("registered office present (street)", address.includes("001 Airport Road"), address);
  check("registered office present (locality)", address.includes("Emene, Enugu State"), address);
  check("registered office present (country)", issuer.addressLines.includes("Nigeria"), address);
  check("no [OWNER-TO-CONFIRM] leak in address", !address.includes("OWNER-TO-CONFIRM"), address);
  check("contactEmail is the config billing inbox", issuer.contactEmail === "billing@henryonyx.com", issuer.contactEmail);
}

console.log("\n[2] Receipt ties to the real payment_intent + posted ledger entry; VAT from breakdown");
{
  const props = buildReceiptProps({
    payment: {
      intentId: INTENT_ID, amountMinor: 50000, currency: "NGN",
      ledgerEntryId: LEDGER_ENTRY_ID, ledgerDebitMinor: 50000,
      division: "marketplace", paymentMethod: "card", paymentReference: "TXNREF_A",
      paidAt: "2026-06-07T10:30:00.000Z", receiptNo: "HO-RCT-2026-000001",
    },
    breakdown: breakdownWithVat, buyer, locale: "en",
  });
  check("receipt references payment_intent", props.receipt.paymentIntentId === INTENT_ID);
  check("receipt references ledger entry", props.receipt.ledgerEntryId === LEDGER_ENTRY_ID);
  check("total === amount_minor === ledger debit (50000)", props.receipt.totalKobo === 50000);
  check("VAT present (taxKobo 3488)", props.receipt.taxKobo === 3488, String(props.receipt.taxKobo));
  check("subtotal + fees + tax === total", props.receipt.subtotalKobo + (props.receipt.feesKobo ?? 0) + props.receipt.taxKobo === props.receipt.totalKobo);
  assertNoForbidden("receipt props", JSON.stringify(props));
}

console.log("\n[3] No VAT in the breakdown → no VAT (taxKobo 0)");
{
  const split = splitDocumentMoney(30000, breakdownNoVat);
  check("split.taxMinor === 0", split.taxMinor === 0, String(split.taxMinor));
  check("split.subtotalMinor === 30000", split.subtotalMinor === 30000, String(split.subtotalMinor));
}

console.log("\n[4] A total that does not reconcile to the ledger debit is REJECTED");
{
  let threw = false;
  try {
    buildReceiptProps({
      payment: {
        intentId: INTENT_ID, amountMinor: 50000, currency: "NGN",
        ledgerEntryId: LEDGER_ENTRY_ID, ledgerDebitMinor: 49999, // ← mismatch
        division: "marketplace", paymentMethod: "card", paymentReference: "TXNREF_A",
        paidAt: "2026-06-07T10:30:00.000Z", receiptNo: "HO-RCT-2026-000001",
      },
      breakdown: breakdownWithVat, buyer, locale: "en",
    });
  } catch (e) {
    threw = e instanceof PaymentDocumentError && e.reason === "ledger_mismatch";
  }
  check("ledger mismatch throws PaymentDocumentError(ledger_mismatch)", threw);
}

console.log("\n[5] Static labels localize across locales (money stays raw)");
{
  const en = getPaymentDocumentCopy("en");
  const fr = getPaymentDocumentCopy("fr");
  const ig = getPaymentDocumentCopy("ig");
  check("en receiptType 'Receipt'", en.receiptType === "Receipt");
  check("fr receiptType 'Reçu' (differs)", fr.receiptType === "Reçu" && fr.receiptType !== en.receiptType);
  check("ig receiptType localized (differs)", ig.receiptType !== en.receiptType, ig.receiptType);
  check("fr VAT label 'TVA'", fr.vat === "TVA");
}

console.log("\n[6] PDFs render in en + fr + ig (valid %PDF)");
async function renderReceipt(locale: "en" | "fr" | "ig", file: string) {
  const props = buildReceiptProps({
    payment: {
      intentId: INTENT_ID, amountMinor: 50000, currency: "NGN",
      ledgerEntryId: LEDGER_ENTRY_ID, ledgerDebitMinor: 50000,
      division: "marketplace", paymentMethod: "card", paymentReference: "TXNREF_A",
      paidAt: "2026-06-07T10:30:00.000Z", receiptNo: "HO-RCT-2026-000001",
    },
    breakdown: breakdownWithVat, buyer, locale,
  });
  const buffer = await renderPaymentDocumentBuffer(ReceiptDocument(props));
  const head = buffer.subarray(0, 5).toString("latin1");
  check(`receipt-${locale}.pdf is a valid PDF (%PDF)`, head === "%PDF-", head);
  check(`receipt-${locale}.pdf is non-trivial (> 3KB)`, buffer.length > 3000, `${buffer.length} bytes`);
  assertNoForbidden(`receipt-${locale}.pdf bytes`, buffer.toString("latin1"));
  writeFileSync(join(OUT, file), buffer);
  console.log(`    → wrote ${file} (${buffer.length} bytes)`);
}

await renderReceipt("en", "receipt-en.pdf");
await renderReceipt("fr", "receipt-fr.pdf");
await renderReceipt("ig", "receipt-ig.pdf");

console.log("\n[7] generateReceiptPdf end-to-end (emits telemetry, returns buffer)");
{
  const { buffer, props } = await generateReceiptPdf({
    payment: {
      intentId: INTENT_ID, amountMinor: 30000, currency: "NGN",
      ledgerEntryId: LEDGER_ENTRY_ID, ledgerDebitMinor: 30000,
      division: "logistics", paymentMethod: "bank", paymentReference: "TXNREF_B",
      paidAt: "2026-06-07T11:00:00.000Z", receiptNo: "HO-RCT-2026-000002",
    },
    breakdown: breakdownNoVat, buyer, locale: "en", actorId: "proof",
  });
  check("no-VAT receipt total 30000", props.receipt.totalKobo === 30000);
  check("no-VAT receipt taxKobo 0", props.receipt.taxKobo === 0);
  check("no-VAT receipt renders", buffer.subarray(0, 5).toString("latin1") === "%PDF-");
  writeFileSync(join(OUT, "receipt-no-vat-en.pdf"), buffer);
  console.log(`    → wrote receipt-no-vat-en.pdf (${buffer.length} bytes)`);
}

console.log("\n[8] Invoice renders with the fixed issuer (no literals)");
{
  const props = buildInvoiceProps({
    invoice: {
      id: INTENT_ID, invoiceNo: "HO-INV-2026-000001", description: "", division: "studio",
      status: "paid", issuedAt: "2026-06-07T09:00:00.000Z", paidAt: "2026-06-07T10:30:00.000Z",
      paymentMethod: "card", paymentReference: "TXNREF_A",
      subtotalKobo: 46512, taxKobo: 3488, discountKobo: null, totalKobo: 50000, currency: "NGN",
      lineItems: [{ id: "l1", title: "Studio sprint", amountKobo: 46512 }],
      paymentIntentId: INTENT_ID, ledgerEntryId: LEDGER_ENTRY_ID,
    },
    buyer, locale: "en",
  });
  check("invoice issuer === 'Henry Onyx Limited'", props.issuer.name === "Henry Onyx Limited");
  check("invoice issuer RC 9594234", props.issuer.rcNumber === "9594234");
  const buffer = await renderPaymentDocumentBuffer(InvoiceDocument(props));
  check("invoice-en.pdf valid", buffer.subarray(0, 5).toString("latin1") === "%PDF-");
  assertNoForbidden("invoice-en.pdf bytes", buffer.toString("latin1"));
  writeFileSync(join(OUT, "invoice-en.pdf"), buffer);
  console.log(`    → wrote invoice-en.pdf (${buffer.length} bytes)`);
}

console.log("\n[9] V3-VAT-01: pricing applyOutputVat (config-driven) → receipt renders the VAT, total = gross");
{
  // A platform service priced ex-VAT; output VAT is computed by pricing from the config
  // rate (TAX.vat), NOT hand-written. The receipt then renders whatever the breakdown
  // carries — closing the loop pricing → breakdown.tax → receipt.
  const base: PricingBreakdown = {
    currency: "NGN",
    lines: [{ code: "service_fee", label: "Listing service", amount: { currency: "NGN", amount: 40000 } }],
    totals: {
      customerTotal: { currency: "NGN", amount: 40000 },
      vendorGross: { currency: "NGN", amount: 0 },
      platformNet: { currency: "NGN", amount: 40000 },
      vendorNet: { currency: "NGN", amount: 0 },
    },
    meta: { division: "property", ruleBookKey: "proof", ruleVersion: "2026-06-07", computedAt: "2026-06-07T00:00:00.000Z" },
  };
  const withVat = applyOutputVat(base, { treatment: "standard" }, TAX.vat);
  const gross = withVat.totals.customerTotal.amount; // 40000 + 7.5% = 43000
  const taxLine = withVat.lines.find((l) => l.code === "tax");
  check("applyOutputVat used the CONFIG rate (0.075)", taxLine?.meta?.rate === TAX.vat.standardRate, String(taxLine?.meta?.rate));
  check("applyOutputVat stamped the CONFIG version", taxLine?.meta?.version === TAX.vat.rateVersion, String(taxLine?.meta?.version));
  check("output VAT = 7.5% of 40000 = 3000", taxLine?.amount.amount === 3000, String(taxLine?.amount.amount));
  check("gross = base + VAT = 43000", gross === 43000, String(gross));

  // The receipt total IS the ledger debit total (= gross). The V3-VAT-01 settlement
  // SPLITS the debit (cash_net + processor_fees + fee_vat_recoverable) but the debit
  // TOTAL stays the gross — so the receipt tie still holds with a fee absorbed.
  const props = buildReceiptProps({
    payment: {
      intentId: INTENT_ID, amountMinor: gross, currency: "NGN",
      ledgerEntryId: LEDGER_ENTRY_ID, ledgerDebitMinor: gross,
      division: "property", paymentMethod: "card", paymentReference: "TXNREF_VAT",
      paidAt: "2026-06-07T12:00:00.000Z", receiptNo: "HO-RCT-2026-000009",
    },
    breakdown: withVat, buyer, locale: "en",
  });
  check("receipt VAT renders the config-computed output VAT (3000)", props.receipt.taxKobo === 3000, String(props.receipt.taxKobo));
  check("receipt total = gross (43000)", props.receipt.totalKobo === 43000, String(props.receipt.totalKobo));
  check("subtotal + fees + tax === total (reconciles)", props.receipt.subtotalKobo + (props.receipt.feesKobo ?? 0) + props.receipt.taxKobo === props.receipt.totalKobo);
}

// ── V3-19: credit note (the legal face of a provider-confirmed refund) ──
const REFUND_ID = "cccccccc-2222-2222-2222-222222222222";
const REFUND_LEDGER_ENTRY_ID = "dddddddd-3333-3333-3333-333333333333";

// A 40% partial refund of the [9] sale: 17200 of 43000, with the POSTED
// proportional VAT reversal round(3000·17200/43000) = 1200.
const confirmedRefund = {
  refundId: REFUND_ID,
  intentId: INTENT_ID,
  amountMinor: 17200,
  currency: "NGN",
  ledgerEntryId: REFUND_LEDGER_ENTRY_ID,
  ledgerDebitMinor: 17200,
  vatReversedMinor: 1200,
  receiptNo: "HO-RCT-2026-000009",
  division: "property" as string | null,
  paymentMethod: "card",
  paymentReference: "TXNREF_VAT",
  refundedAt: "2026-06-11T09:00:00.000Z",
  creditNoteNo: "HO-CRN-2026-000001",
};

console.log("\n[10] V3-19: credit note ties to the refund + posted reversal; mismatches REJECTED");
{
  const props = buildCreditNoteProps({ refund: confirmedRefund, buyer, locale: "en" });
  check("credit note references the refund row", props.creditNote.refundId === REFUND_ID);
  check("credit note references the refund-settlement entry", props.creditNote.ledgerEntryId === REFUND_LEDGER_ENTRY_ID);
  check("credit note references the ORIGINAL receipt", props.creditNote.receiptNo === "HO-RCT-2026-000009");
  check("total === refund amount === posting debit (17200)", props.creditNote.totalKobo === 17200);
  check("VAT line === the POSTED reversal (1200)", props.creditNote.taxKobo === 1200, String(props.creditNote.taxKobo));
  check("subtotal + tax === total (reconciles)", props.creditNote.subtotalKobo + props.creditNote.taxKobo === props.creditNote.totalKobo);
  check("issuer === 'Henry Onyx Limited'", props.issuer.name === "Henry Onyx Limited");
  assertNoForbidden("credit-note props", JSON.stringify(props));

  let threwLedger = false;
  try {
    buildCreditNoteProps({ refund: { ...confirmedRefund, ledgerDebitMinor: 17199 }, buyer, locale: "en" });
  } catch (e) {
    threwLedger = e instanceof PaymentDocumentError && e.reason === "ledger_mismatch";
  }
  check("posting-debit mismatch throws PaymentDocumentError(ledger_mismatch)", threwLedger);

  let threwVat = false;
  try {
    buildCreditNoteProps({ refund: { ...confirmedRefund, vatReversedMinor: 17201 }, buyer, locale: "en" });
  } catch (e) {
    threwVat = e instanceof PaymentDocumentError && e.reason === "invalid_amount";
  }
  check("VAT beyond the refund amount throws PaymentDocumentError(invalid_amount)", threwVat);
}

console.log("\n[11] V3-19: credit-note PDFs render in en + fr (≥2 locales), brand-clean");
async function renderCreditNote(locale: "en" | "fr", file: string) {
  const props = buildCreditNoteProps({ refund: confirmedRefund, buyer, locale });
  const buffer = await renderPaymentDocumentBuffer(CreditNoteDocument(props));
  const head = buffer.subarray(0, 5).toString("latin1");
  check(`credit-note-${locale}.pdf is a valid PDF (%PDF)`, head === "%PDF-", head);
  check(`credit-note-${locale}.pdf is non-trivial (> 3KB)`, buffer.length > 3000, `${buffer.length} bytes`);
  assertNoForbidden(`credit-note-${locale}.pdf bytes`, buffer.toString("latin1"));
  writeFileSync(join(OUT, file), buffer);
  console.log(`    → wrote ${file} (${buffer.length} bytes)`);
}
await renderCreditNote("en", "credit-note-en.pdf");
await renderCreditNote("fr", "credit-note-fr.pdf");
{
  const en = getPaymentDocumentCopy("en");
  const fr = getPaymentDocumentCopy("fr");
  check("en creditNoteType 'Credit note'", en.creditNoteType === "Credit note");
  check("fr creditNoteType 'Avoir' (differs)", fr.creditNoteType === "Avoir" && fr.creditNoteType !== en.creditNoteType);
}

console.log("\n[12] V3-19: generateCreditNotePdf end-to-end (emits telemetry, returns buffer)");
{
  const { buffer, props } = await generateCreditNotePdf({
    refund: confirmedRefund, buyer, locale: "en", actorId: "proof",
  });
  check("credit note renders end-to-end", buffer.subarray(0, 5).toString("latin1") === "%PDF-");
  check("credit note number HO-CRN-2026-000001", props.creditNote.creditNoteNo === "HO-CRN-2026-000001");
  writeFileSync(join(OUT, "credit-note-e2e-en.pdf"), buffer);
  console.log(`    → wrote credit-note-e2e-en.pdf (${buffer.length} bytes)`);
}

console.log(`\n${failures === 0 ? "✅ ALL PROOFS PASSED" : `❌ ${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
