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

import { ReceiptDocument, InvoiceDocument } from "@henryco/branded-documents";
import { buildDocumentIssuer } from "@henryco/config";
import { getPaymentDocumentCopy } from "@henryco/i18n";
import type { PricingBreakdown } from "@henryco/pricing";
// apps/account is CommonJS, so this .ts module loads via CJS default interop under tsx.
import paymentDocuments from "../lib/payment-documents.ts";
const {
  buildReceiptProps,
  buildInvoiceProps,
  generateReceiptPdf,
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

console.log(`\n${failures === 0 ? "✅ ALL PROOFS PASSED" : `❌ ${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
